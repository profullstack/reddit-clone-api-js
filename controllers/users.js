import { body, validationResult } from 'express-validator';
import { localAuth, createAuthToken } from '../auth';
import User from '../models/user';
import Post from '../models/post';

export const login = (req, res, next) => {
  localAuth(req, res, next);
};

export const register = async (req, res, next) => {
  const { username, password } = req.body;
  const user = await User.create({ username, password });
  const token = createAuthToken(user.toJSON());
  res.status(201).json({ token });
};

export const validate = async (req, res, next) => {
  const validations = [
    body('username')
      .exists()
      .withMessage('is required')

      .isLength({ min: 1 })
      .withMessage('cannot be blank')

      .isLength({ max: 32 })
      .withMessage('must be at most 32 characters long')

      .custom(value => value.trim() === value)
      .withMessage('cannot start or end with whitespace')

      .matches(/^[a-zA-Z0-9_-]+$/)
      .withMessage('contains invalid characters'),

    body('password')
      .exists()
      .withMessage('is required')

      .isLength({ min: 1 })
      .withMessage('cannot be blank')

      .isLength({ min: 8 })
      .withMessage('must be at least 8 characters long')

      .isLength({ max: 72 })
      .withMessage('must be at most 72 characters long'),
  ];

  if (req.path === '/register') {
    validations.push(
      body('username').custom(async username => {
        const exists = await User.countDocuments({ username });
        if (exists) throw new Error('already exists');
      }),
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

export const inbox = async (req, res) => {
  let comments = [];
  const user = await User.findOne({ _id: req.user.id });

  for (let i = 0; i < user.inbox.length; i += 1) {
    const post = await Post.findOne({ 'comments._id': user.inbox[i].comment }, { comments: { $elemMatch: { _id: user.inbox[i].comment } }, title: '' });
    
    if (post != null) {
      console.log(post);
      const link = `/a/${post.category.name}/${post._id}#comment-id-${post.comments[0].id}`;
      const com = {
        id: post.comments[0]._id,
        link,
        title: post.title,
        postId: post._id,
        author: post.comments[0].author.username,
        body: post.comments[0].body,
        created: post.comments[0].created,
        category: post.category.name,
      };
      comments.push(com);
    } else {
      // delete from inbox if comment doesn't exist anymore
      await User.updateOne({ 'inbox.comment': user.inbox[i].comment }, { $pull: { inbox: { comment: user.inbox[i].comment } } });
    }
  }
  comments = comments.reverse();
  res.json(comments);
};

export const deleteInbox = async (req, res) => {
  await User.updateOne({ _id: req.user.id, 'inbox.comment': req.params.id }, { $pull: { inbox: { comment: req.params.id } } })
    .catch(() => res.status(500).send());
  res.status(200).send();
};

export const inboxCount = async (req, res) => {
  const user = await User.findOne({ _id: req.user.id });
  const count = user.inbox.length;
  res.json({ count });
};

export default {
  login,
  register,
  validate,
  inbox,
  deleteInbox,
  inboxCount,
};
