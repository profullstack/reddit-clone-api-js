import { body, validationResult } from 'express-validator/check';
import User from '../models/user';

export const load = async (req, res, next, id) => {
  req.comment = await req.post.comments.id(id);
  if (!req.comment) return next(new Error('comment not found'));
  next();
};

export const create = async (req, res) => {
  const post = await req.post.addComment(req.user.id, req.body.comment);
  res.status(201).json(post.content);

  const users = req.post.author._id === req.user.id ? [] : [req.post.author._id];

  req.post.comments.forEach(comment => {
    if (!users.includes(comment.author.id) && comment.author.id !== req.user.id) {
      console.log(comment.author.id, req.user.id);
      users.push(comment.author.id);
    }
  });

  User.updateMany({ _id: users }, { $push: { inbox: { comment: post._id, read: false } } }).exec();
};

export const destroy = async (req, res, next) => {
  try {
    const post = await req.post.removeComment(req.params.comment);
    res.json(post);
  } catch (err) {
    next(err);
  }
};

export const validate = async (req, res, next) => {
  const validations = [
    body('comment')
      .exists()
      .withMessage('is required')

      .isLength({ min: 1 })
      .withMessage('cannot be blank')

      .isLength({ max: 2000 })
      .withMessage('must be at most 2000 characters long'),
  ];

  await Promise.all(validations.map(validation => {
    if (!('run' in validation)) return;
    return validation.run(req);
  }));

  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  res.status(422).json({ errors: errors.array({ onlyFirstError: true }) });
};

export default {
  load,
  create,
  destroy,
  validate,
};
