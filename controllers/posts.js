import { body, validationResult } from 'express-validator';
import Post from '../models/post';
import User from '../models/user';
import Category from '../models/category';

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
  let posts
  let search = {}
  let skip = req.query.page > 0 ? req.query.page * 15 : 0;

  if (typeof req.params.category !== 'undefined') {
    const name = req.params.category;
    let category = await Category.find({ name });
    search = category[0] != undefined ? { category: category[0]._id } : {};
  }

  if (typeof req.params.user !== 'undefined') {
    const username = req.params.user;
    const author = await User.findOne({ username });
    search = author != undefined ? { author: author._id } : {};
  }

  if (req.query.sort != 'comments') {
    const { sort = '-created' } = req.query;
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
            from: "users",
            localField: "author",
            foreignField: "_id",
            as: "author"
        }
      },
      {
        $unwind: '$author'
      },
      { $unset: "author.password" },
      {
        $lookup: {
            from: "categories",
            localField: "category",
            foreignField: "_id",
            as: "category"
        }
      },
      {
        $unwind: '$category'
      },
      {
        $addFields: { comments_count: {$size: { "$ifNull": [ "$comments", [] ] } }}
      },
      {
        $addFields: { id: '$_id' }
      },
      { $unset: "_id" },
      { $sort: { "comments_count": -1 } },
      { $skip: skip},
      { $limit: 15},
    ])
  }
  const count = await Post.countDocuments(search);
  const more = count > (skip * 2) && count > 15 ? true : false;
  res.json({ posts, more });
};

export const create = async (req, res, next) => {
  const { title, url, category, type, text, thumb } = req.body;
  const author = req.user.id;
  const post = await Post.create({
    title,
    url,
    author,
    category,
    type,
    text,
    thumb,
  });
  const newPost = await Post.findById(post.id).populate('category');
  await User.findOneAndUpdate({ _id: author }, { $inc: { karma: 5 } });
  await User.findOneAndUpdate({ _id: newPost.category.owner }, { $inc: { karma: 5 } });

  res.status(201).json(newPost);
};

export const validate = async (req, res, next) => {
  const validations = [
    body('title')
      .exists()
      .withMessage('is required')

      .isLength({ min: 1 })
      .withMessage('cannot be blank')

      .isLength({ max: 100 })
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

  res.json(post);
};

export const downvote = async (req, res) => {
  const post = await req.post.vote(req.user.id, -1);
  await User.findOneAndUpdate({ _id: post.author.id }, { $inc: { karma: -2 } });
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
};
