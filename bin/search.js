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
  const posts = await Post.find({})
    .catch(console.error);

  return posts;
}

async function checkIndices() {
  const res = await search.indices.exists({index: 'posts'};
  
  if (res) {
      console.log('index already exists');
  } else {
      const res2 = await search.indices.create( {index: 'posts'};
      console.log(res2);
  }
}
(async () => {
  const posts = await getPosts()
    .catch(console.error);

  console.log(posts);

  await checkIndices();
  await search.indices.refresh({ index: 'posts' });
 
  posts.map(async post => {
    const { body } = await client.exists({
      index: 'posts',
      id: post._id,
    })

    if (body) {
      await client.update({
        index: 'posts',
        id: post._id,
        body: post,
      });
    } else {
      // add to elastic search
      await search.index({
        index: 'posts',
        id: post._id,
        body: post,
      });
    }
  });

  await search.indices.refresh({ index: 'posts' });
  process.exit(0);
})();
