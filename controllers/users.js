import { body, validationResult } from 'express-validator';
import { localAuth, createAuthToken } from '../auth';
import User from '../models/user';
import Post from '../models/post';

export const login = (req, res, next) => {
  localAuth(req, res, next);
};

export const getAll = async (req, res) => {
  const leaders = await User.find({ karma: { $gt: 100 } })
    .select('-inbox')
    .sort('-karma');

  res.json({ leaders });
};

export const register = async (req, res, next) => {
  const { username, password } = req.body;
  const user = await User.create({ username, password, karma: 100 });
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

export const getByUsername = async (req, res) => {
  const { username } = req.params;
  const user = await User.findOne({ username })
    .select('-inbox')
    .catch(console.error);

  res.send(user);
};

export const inbox = async (req, res) => {
  let comments = [];
  const user = await User.findOne({ _id: req.user.id }).select('inbox');

  for (let i = 0; i < user.inbox.length; i += 1) {
    const post = await Post.findOne(
      { 'comments._id': user.inbox[i].comment },
      { comments: { $elemMatch: { _id: user.inbox[i].comment } }, title: '' },
    );

    if (post != null) {
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
      await User.updateOne(
        { 'inbox.comment': user.inbox[i].comment },
        { $pull: { inbox: { comment: user.inbox[i].comment } } },
      );
    }
  }
  comments = comments.reverse();
  res.json(comments);
};

export const deleteInbox = async (req, res) => {
  await User.updateOne(
    { _id: req.user.id, 'inbox.comment': req.params.id },
    { $pull: { inbox: { comment: req.params.id } } },
  ).catch(() => res.status(500).send());
  res.status(200).send();
};

export const inboxCount = async (req, res) => {
  const user = await User.findOne({ _id: req.user.id }).select('inbox');
  const count = user.inbox.length;
  res.json({ count });
};

export const getMe = async (req, res) => {
  const user = await User.findOne({ _id: req.user.id }).catch(console.error);

  res.json(user);
};

export const updateBitcoinAddress = async (req, res) => {
  await User.findOneAndUpdate(
    { _id: req.user.id },
    { bitcoinAddress: req.body.bitcoinaddress },
    { upsert: true },
  ).catch(err => {
    console.log(err);
    res.status(500).send();
  });
  res.status(201).send();
};

export const getBitcoinAddress = async (req, res) => {
  const user = await User.findOne({ username: req.body.username });
  res.send(user.bitcoinAddress);
};

export const getLinks = async (req, res) => {
  const user = await User.findOne({ username: req.body.username });
  res.json(user.links);
};

export const updateLinks = async (req, res) => {
  await User.findOneAndUpdate(
    { _id: req.user.id },
    { links: req.body.socialLinks },
    { upsert: true },
  ).catch(err => {
    console.log(err);
    res.status(500).send();
  });
  res.status(201).send();
};

export const addSubscription = async (req, res) => {
  await User.findOneAndUpdate({_id: req.user.id}, {$push: {subscriptions: req.params.id}})
    .catch(err => res.status(500).send())
  res.status(201).send();
};

export const removeSubscription = async (req, res) => {
  await User.findOneAndUpdate({_id: req.user.id}, {$pull: {subscriptions: req.params.id}})
    .catch(err => res.status(500).send())
  res.status(200).send();
};

export default {
  login,
  register,
  validate,
  inbox,
  deleteInbox,
  inboxCount,
  getAll,
  getByUsername,
  getMe,
  getLinks,
  getBitcoinAddress,
  updateLinks,
  updateBitcoinAddress,
  addSubscription,
  removeSubscription,
};
