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

let posts = [];
const all = [];
let added = 0;
let updated = 0;
const failed = {
  updates: 0,
  inserts: 0,
};

const queueNext = async () => {
  if (!posts.length) return;
  const post = posts.shift();
  const { body } = await search
    .exists({
      index: 'posts',
      id: post._id,
    })
    .catch(('no post', post._id));

  if (body) {
    console.log('update', post._id);
    updated += 1;
    await search
      .update({
        index: 'posts',
        id: post._id,
        body: { doc: post },
      })
      .catch(err => {
        failed.updates += 1;
        console.log(JSON.stringify(err), 'update failed', post._id, post);
      });
  } else {
    // add to elastic search
    added += 1;
    console.log('add', post._id);
    await search
      .index({
        index: 'posts',
        id: post._id,
        body: post,
      })
      .catch(err => {
        failed.inserts += 1;
        console.error(err);
      });
  }

  all.push(post);
  await queueNext();
};

(async () => {
  posts = await getPosts().catch(console.error);

  // console.log(posts);

  await checkIndices();
  await search.indices.refresh({ index: 'posts' });

  await Promise.all(Array.from({ length: 100 }, queueNext));

  console.log(all.length, 'posts found');
  console.log(updated, 'posts updated');
  console.log(added, 'posts added');
  console.log(failed.updates, 'failed updates');
  console.log(failed.inserts, 'failed inserts');

  await search.indices.refresh({ index: 'posts' });
  process.exit(0);
})();
