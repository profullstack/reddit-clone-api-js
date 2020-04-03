import jwt from 'jsonwebtoken';
import passport from 'passport';

export const createAuthToken = user => {
  const subscriptions = user.subscriptions;
  delete user.inbox;
  delete user.subscriptions;
  return jwt.sign({ user }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};

export const localAuth = (req, res, next) => {
  return new Promise((resolve, reject) => {
    passport.authenticate('local', (err, user, info) => {
      if (err) {
        console.error(err);
        return next(err);
      }
      if (!user) return res.status(401).json(info);
      const token = this.createAuthToken(user);
      resolve({ token, user });
    })(req, res);
  });
};

export const jwtAuth = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user) => {
    if (err) return next(err);
    if (!user) return res.status(401).end();
    req.user = user;
    next();
  })(req, res);
};

export const postAuth = (req, res, next) => {
  if (req.post.author._id.equals(req.user.id) || req.user.admin) return next();
  res.status(401).end();
};

export const commentAuth = (req, res, next) => {
  if (
    req.comment.author._id.equals(req.user.id) ||
    req.post.author._id.equals(req.user.id) ||
    req.user.admin
  ) {
    return next();
  }
  res.status(401).end();
};
