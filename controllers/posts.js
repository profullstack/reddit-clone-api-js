import { body, validationResult } from 'express-validator';
import Post from '../models/post';
import User from '../models/user';
import Category from '../models/category';

export const load = async (req, res, next, id) => {
  try {
    req.post = await Post.findById(id);
    if (!req.post) return res.status(404).json({ message: 'post not found' });
  } catch (err) {
    if (err.name === 'CastError') { return res.status(400).json({ message: 'invalid post id' }); }
    return next(err);
  }
  next();
};

export const show = async (req, res) => {
  const post = await Post.findByIdAndUpdate(
    req.post.id,
    { $inc: { views: 1 } },
    { new: true },
  );
  res.json(post);
};

export const list = async (req, res) => {
  const { sort = '-score' } = req.query;
  const posts = await Post.find()
    .populate('category')
    .sort(sort)
    .limit(100);
  res.json(posts);
};

export const listByCategory = async (req, res) => {
  const { sort = '-score' } = req.query;
  const name = req.params.category;
  const category = await Category.find({ name });
  const posts = await Post.find({ category })
    .sort(sort)
    .limit(100);
  res.json(posts);
};

export const listByUser = async (req, res) => {
  const { sort = '-score' } = req.query;
  const username = req.params.user;
  const author = await User.findOne({ username });
  const posts = await Post.find({ author: author.id })
    .sort(sort)
    .limit(100);
  res.json(posts);
};

export const create = async (req, res, next) => {
  const {
    title, url, category, type, text,
  } = req.body;
  const author = req.user.id;
  const post = await Post.create({
    title, url, author, category, type, text,
  });
  const newPost = await Post.findById(post.id)
    .populate('category');

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

  await Promise.all(validations.map(validation => {
    if (!('run' in validation)) return;
    return validation.run(req);
  }));

  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  res.status(422).json({ errors: errors.array({ onlyFirstError: true }) });
};

export const upvote = async (req, res) => {
  const post = await req.post.vote(req.user.id, 1);
  res.json(post);
};

export const downvote = async (req, res) => {
  const post = await req.post.vote(req.user.id, -1);
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
  listByCategory,
  listByUser,
  create,
  validate,
  upvote,
  downvote,
  unvote,
  destroy,
};
