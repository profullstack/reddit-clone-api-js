// import { cache, getAsync, setAsync } from '../cache';
import search from '../search';

export const posts = async (req, res) => {
  const { q } = req.query;
  const { body } = await search.search({
    index: 'posts',
    body: {
      query: {
        match: { title: q },
      },
    },
  })
  .catch(err => {
    return res.json(err);
  });

  console.log(body);
  res.json(body);
};

export default {
  posts,
};