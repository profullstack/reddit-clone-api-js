import Posts from '../models/post';
import Users from '../models/user';
import Uploads from '../models/upload';
import { deleteFile } from '../controllers/uploads';

require('dotenv').config();
const mongoose = require('mongoose');

const username = process.argv[2];

const errorHandler = err => {
  console.error(err);
  console.log('aborting');
  process.exit();
};

(async () => {
  await mongoose.connect(process.env.MONGO_URI, {
    keepAlive: true,
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
    .catch(console.error);

  // Check if user exists
  const user = await Users.findOne({ username })
    .catch(err => errorHandler(err));

  if (user == null) {
    console.log('User not found in database');
    process.exit();
  } else console.log(`Removing user ${username}, their posts and uploads`);

  // Delete all comments
  const comments = await Posts.find({ 'comments.author': user._id }, {
    comments: 1, author: 0, _id: 0, category: 0,
  })
    .catch(err => errorHandler(err));

  const commentsToRemove = [];

  for (const post of comments) {
    for (const comment of post.comments) {
      if (comment.author.id == user._id) {
        commentsToRemove.push(comment._id);
      }
    }
  }

  const postsUpdated = await Posts.updateMany({}, { $pull: { comments: { _id: { $in: commentsToRemove } } } })
    .catch(err => errorHandler(err));

  console.log(`${commentsToRemove.length} comments deleted from ${postsUpdated.nModified} posts`);

  // Delete posts
  const posts = await Posts.deleteMany({ author: user._id })
    .catch(err => errorHandler(err));

  console.log(`deleted ${posts.deletedCount} posts`);

  // Delete uploads
  const uploads = await Uploads.find({ author: user._id })
    .catch(err => errorHandler(err));

  let uploadDelCount = 0;

  for (const up of uploads) {
    const deleted = await Uploads.deleteOne({ _id: up._id })
      .catch(err => errorHandler(err));

    if (deleted.deletedCount === 1) {
      await deleteFile(up.path);
      uploadDelCount += 1;

      if (up.thumbPath) {
        await deleteFile(up.thumbPath);
        uploadDelCount += 1;
      }
    }
  }

  console.log(`${uploadDelCount} uploads deleted`);

  // Delete user
  const userDeleted = await Users.deleteOne({ _id: user._id })
    .catch(err => errorHandler(err));

  console.log(userDeleted.deletedCount === 1 ? 'User deleted from DB' : 'Not deleted from DB');
  process.exit();
})();
