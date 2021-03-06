import { body, validationResult } from 'express-validator/check';
import User from '../models/user';
import Post from '../models/post';

export const load = async (req, res, next, id) => {
  req.comment = await req.post.comments.id(id);
  if (!req.comment) return next(new Error('comment not found'));
  next();
};

export const create = async (req, res) => {
  const post = await req.post.addComment(req.user.id, req.body.comment);
  await req.post.voteComment(post._id, req.user.id, 1);
  await User.findOneAndUpdate({ _id: req.user.id }, { $inc: { karma: 5 } });
  const fullPost = await Post.findById(req.post.id).populate('author');
  await User.findOneAndUpdate({ _id: fullPost.author.id }, { $inc: { karma: 10 } });

  res.status(201).json(fullPost);

  const users = req.post.author._id == req.user.id ? [] : [req.post.author._id];

  for (let i = 0; i < req.post.comments.length; i += 1) {
    if (
      !users.includes(req.post.comments[i].author.id)
      && req.post.comments[i].author.id !== req.user.id
    ) {
      await users.push(req.post.comments[i].author.id);
    }
  }

  await User.updateMany({ _id: users }, { $push: { inbox: { comment: post._id, read: false } } });
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
  const comment = await req.post.voteComment(req.params.commentId, req.user.id, 1);
  res.json(comment);
};

export const downvote = async (req, res) => {
  const post = await req.post.voteComment(req.params.commentId, req.user.id, -1);
  res.json(post);
};

export default {
  load,
  create,
  destroy,
  validate,
  upvote,
  downvote,
};
