import { body, validationResult } from 'express-validator';
import Post from '../models/post';
import User from '../models/user';
import Category from '../models/category';
import { cache, getAsync, setAsync } from '../cache';
import search from '../search';
import getRandomNumber from '../utils/random';

export const load = async (req, res, next, id) => {
  try {
    req.post = await Post.findById(id);
    if (!req.post) return res.status(404).json({ message: 'post not found' });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'invalid post id' });
    }
    return next(err);
  }
  next();
};

export const show = async (req, res) => {
  const post = await Post.findByIdAndUpdate(req.post.id, { $inc: { views: 1 } }, { new: true });
  await User.findOneAndUpdate({ _id: post.author.id }, { $inc: { karma: 1 } });
  res.json(post);
};

export const list = async (req, res) => {
  let posts;
  const search = { sponsored: false };
  const skip = req.query.page > 0 ? req.query.page * 15 : 0;

  if (typeof req.user !== 'undefined') {
    const user = await User.findOne({ _id: req.user.id }, { _id: false, subscriptions: true });
    const subscriptions = user.subscriptions;
    search.category = { $in: subscriptions };
  } else {
    if (typeof req.params.category !== 'undefined') {
      const name = req.params.category;
      const category = await Category.find({ name });
      search.category = category[0] != undefined ? category[0]._id : null;
    }

    if (typeof req.params.user !== 'undefined') {
      const username = req.params.user;
      const author = await User.findOne({ username });
      search.author = author != undefined ? author._id : null;
    }
  }

  if (req.query.sort != 'comments') {
    const prefix = req.query.sort.slice(0, 1);
    const key = req.query.sort.slice(1);
    const sort = { [key]: parseInt(`${prefix}1`) };

    posts = await Post.find(search)
      .populate('category')
      .sort(sort)
      .skip(skip)
      .limit(15);
  } else {
    posts = await Post.aggregate([
      { $match: search },
      {
        $lookup: {
          from: 'users',
          localField: 'author',
          foreignField: '_id',
          as: 'author',
        },
      },
      {
        $unwind: '$author',
      },
      { $unset: 'author.password' },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'category',
        },
      },
      {
        $unwind: '$category',
      },
      {
        $addFields: { comments_count: { $size: { $ifNull: ['$comments', []] } } },
      },
      {
        $addFields: { id: '$_id' },
      },
      { $unset: '_id' },
      { $sort: { comments_count: -1 } },
      { $skip: skip },
      { $limit: 15 },
    ]);
  }

  search.sponsored = true;

  const sponsored = await Post.aggregate([
    { $match: search },
    { $sample: { size: 1 } },
    {
      $lookup: {
        from: 'users',
        localField: 'author',
        foreignField: '_id',
        as: 'author',
      },
    },
    {
      $unwind: '$author',
    },
    { $unset: 'author.password' },
    {
      $lookup: {
        from: 'categories',
        localField: 'category',
        foreignField: '_id',
        as: 'category',
      },
    },
    {
      $unwind: '$category',
    },
    {
      $addFields: { id: '$_id' },
    },
    { $unset: '_id' },
  ]);
  if (typeof sponsored[0] !== 'undefined') posts.splice(Math.random() * posts.length, 0, sponsored[0]);

  delete search.sponsored;
  const count = await Post.countDocuments(search);
  const more = !!(count > skip * 2 && count > 15);
  res.json({ posts, more });
};

export const listByUser = async (req, res) => {
  const { userId } = req.params;
  const posts = await Post.find({ author: userId });
  res.json(posts);
};

export const create = async (req, res, next) => {
  const {
    title, url, category, type, text, thumb,
  } = req.body;
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

  const author = req.user.id;
  console.log(ip, author, title);
  const post = await Post.create({
    title,
    url,
    author,
    category,
    type,
    text,
    thumb,
  }).catch(err => {
    console.error(err);
    res.status(422).json(err);
  });

  const newPost = await Post.findById(post.id)
    .populate('category')
    .catch(console.error);
  await User.findOneAndUpdate({ _id: author }, { $inc: { karma: 5 }, ip }).catch(console.error);
  await User.findOneAndUpdate({ _id: newPost.category.owner }, { $inc: { karma: 5 } }).catch(console.error);

  // add to elastic search
  await search.index({
    index: 'posts',
    id: newPost._id,
    body: newPost,
  });
  await search.indices.refresh({ index: 'posts' });

  res.status(201).json(newPost);
};

export const validate = async (req, res, next) => {
  const validations = [
    body('title')
      .exists()
      .withMessage('is required')

      .isLength({ min: 1 })
      .withMessage('cannot be blank')

      .isLength({ max: 200 })
      .withMessage('must be at most 100 characters long')

      .custom(value => value.trim() === value)
      .withMessage('cannot start or end with whitespace'),

    body('type')
      .exists()
      .withMessage('is required')

      .isIn(['link', 'text'])
      .withMessage('must be a link or text post'),

    body('category')
      .exists()
      .withMessage('is required')

      .isLength({ min: 1 })
      .withMessage('cannot be blank'),
  ];

  if (req.body.type === 'link') {
    validations.push(
      body('url')
        .exists()
        .withMessage('is required')

        .isURL()
        .withMessage('is invalid'),
    );
  } else {
    validations.push(
      body('text')
        .exists()
        .withMessage('is required')

        .isLength({ min: 4 })
        .withMessage('must be at least 4 characters long'),
    );
  }

  await Promise.all(
    validations.map(validation => {
      if (!('run' in validation)) return;
      return validation.run(req);
    }),
  );

  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  res.status(422).json({ errors: errors.array({ onlyFirstError: true }) });
};

export const upvote = async (req, res) => {
  const post = await req.post.vote(req.user.id, 1);
  await User.findOneAndUpdate({ _id: post.author.id }, { $inc: { karma: 1 } });
  await User.findOneAndUpdate({ _id: req.user.id }, { $inc: { karma: 1 } });

  res.json(post);
};

export const downvote = async (req, res) => {
  const post = await req.post.vote(req.user.id, -1);
  await User.findOneAndUpdate({ _id: post.author.id }, { $inc: { karma: -25 } });
  await User.findOneAndUpdate({ _id: req.user.id }, { $inc: { karma: 1 } });

  res.json(post);
};

export const unvote = async (req, res) => {
  const post = await req.post.vote(req.user.id, 0);
  res.json(post);
};

export const destroy = async (req, res) => {
  await req.post.remove();
  res.json({ message: 'success' });
};

export default {
  load,
  show,
  list,
  create,
  validate,
  upvote,
  downvote,
  unvote,
  destroy,
  listByUser,
};
