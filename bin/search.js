import mongoose from 'mongoose';
import Post from '../models/post';
import search from '../search';

const log = require('debug');
const dotenv = require('dotenv');

dotenv.config();

const debug = log('express-starter:db');

console.log(process.env.MONGO_URI);
mongoose.connect(process.env.MONGO_URI, {
  keepAlive: true,
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: false,
  useUnifiedTopology: true,
  reconnectTries: Number.MAX_VALUE,
  reconnectInterval: 500,
});
mongoose.connection.on('connected', () => debug('successfully connected to db'));
mongoose.connection.on('error', console.error);

async function getPosts() {
  const posts = await Post.find({}).catch(console.error);

  return posts;
}

async function checkIndices() {
  const { body } = await search.indices.exists({ index: 'posts' });

  console.log(body);

  if (!body) {
    await search.indices.create({ index: 'posts' });
  }
}
(async () => {
  const posts = await getPosts().catch(console.error);

  console.log(posts);

  await checkIndices();
  await search.indices.refresh({ index: 'posts' });

  for (const post of posts) {
    const { body } = await search.exists({
      index: 'posts',
      id: post._id,
    });

    if (body) {
      console.log('update', post._id);
      await search.update({
        index: 'posts',
        id: post._id,
        body: post,
      });
    } else {
      // add to elastic search
      console.log('add', post._id);
      await search.index({
        index: 'posts',
        id: post._id,
        body: post,
      });
    }
  }

  console.log(posts.length, 'posts found');

  await search.indices.refresh({ index: 'posts' });
  process.exit(0);
})();
