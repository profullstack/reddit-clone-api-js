import { Router } from 'express';
import { jwtAuth, postAuth, commentAuth } from './auth';
import users from './controllers/users';
import posts from './controllers/posts';
import comments from './controllers/comments';
import category from './controllers/category';
import retrieve from './controllers/retrieve';
import search from './controllers/search';
import rss from './controllers/rss';
import payments from './controllers/payments';

const wrap = fn => (...args) => fn(...args).catch(args[2]);

const router = Router();

router.post('/login', users.validate, users.login);
router.post('/register', users.validate, wrap(users.register));
router.param('post', posts.load);
router.get('/posts', posts.list);
router.get('/posts/rss', rss.list);
router.get('/posts/rss/:user', rss.listBySubscriptions);
router.get('/sitemap.xml', rss.sitemap);
router.get('/posts/:category', posts.list);
router.get('/posts/user/:userId', posts.listByUser)
router.get('/posts/:category/rss', rss.listByCategory);
router.get('/post/:post', posts.show);
router.post('/posts', jwtAuth, posts.validate, wrap(posts.create));
router.delete('/post/:post', jwtAuth, postAuth, posts.destroy);
router.get('/post/:post/upvote', jwtAuth, posts.upvote);
router.get('/post/:post/downvote', jwtAuth, posts.downvote);
router.get('/post/:post/unvote', jwtAuth, posts.unvote);
router.get('/post/:post/:commentId/upvote', jwtAuth, comments.upvote);
router.get('/post/:post/:commentId/downvote', jwtAuth, comments.downvote);
router.get('/user/:user/rss', rss.listByUser);
router.get('/user/:user', posts.list);
router.get('/users/:username', users.getByUsername);
router.post('/category', jwtAuth, category.validate, wrap(category.create));
router.get('/category', category.list);
router.get('/category/:categoryName', category.fetchCategory);
router.get('/retrieve', retrieve.get);
router.param('comment', comments.load);
router.post('/post/:post', jwtAuth, comments.validate, comments.create);
router.delete('/post/:post/:comment', jwtAuth, commentAuth, comments.destroy);
router.get('/inbox', jwtAuth, users.inbox);
router.delete('/inbox/:id', jwtAuth, users.deleteInbox);
router.get('/inbox/count', jwtAuth, users.inboxCount);
router.get('/leaderboard', users.getAll);
router.get('/me', jwtAuth, users.getMe);
router.post('/me/links', jwtAuth, wrap(users.updateLinks));
router.post('/me/bitcoinaddress', jwtAuth, wrap(users.updateBitcoinAddress));
// router.get('/me/links', jwtAuth, users.getLinks);
// router.get('/me/bitcoinaddress', jwtAuth, users.getBitcoinAddress);
router.get('/subscriptions', jwtAuth, posts.list);
router.post('/me/subscriptions/:id', jwtAuth, users.addSubscription);
router.delete('/me/subscriptions/:id', jwtAuth, users.removeSubscription);
router.post('/payments/create', jwtAuth, payments.create);
router.post('/payments', payments.status);
router.get('/payments/list', jwtAuth, payments.list)
router.get('/search/posts', search.posts);
router.use('*', (req, res) => res.status(404).json({ message: 'not found' }));
router.use((err, req, res, next) => res.status(500).json({ errors: err.message }));

export default router;
