// import { cache, getAsync, setAsync } from '../cache';
import search from '../search';
import Post from '../models/post';

async function getPosts(postIds) {
  const posts = [];

  for (const postId of postIds) {
    const post = await Post.findById(postId)
      .populate('-subscriptions')
      .populate('-author.subscriptions')
      .catch((err) => {
        return res.status(400).json(err);
      });

    post.author.subscriptions = [];
    posts.push(post);
  }

  console.log(posts.length, 'found');
  return posts;
}

export const posts = async (req, res) => {
  const { q } = req.query;
  const { body } = await search
    .search({
      index: 'posts',
      body: {
        from: 0,
        size: 100,
        query: {
          multi_match: {
            query: q,
            fields: ['title', 'text', 'url'],
          },
        },
      },
    })
    .catch((err) => {
      console.log(err);
      return res.json(err);
    });

  const postIds = body.hits.hits.map((post) => {
    return post._id;
  });

  console.log(postIds);
  const posts = await getPosts(postIds);

  res.json(posts);
};

export default {
  posts,
};
