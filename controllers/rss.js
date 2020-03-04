import RSS from 'rss';
import Post from '../models/post';
import Category from '../models/category';
import User from '../models/user';

export const listByCategory = async (req, res) => {
  const { sort = '-created' } = req.query;
  const name = req.params.category;
  const category = await Category.find({ name });
  const posts = await Post.find({ category })
    .populate('author')
    .populate('category')
    .sort(sort)
    .limit(20);
  const feed = new RSS({
    title: `upvotocracy.com/a/${name} RSS feed`,
    description: `Zero moderation Reddit clone: ${category.description || ''}`,
    feed_url: `https://upvotocracy.com/api/1/posts/${name}/rss?sort=${sort}`,
    site_url: 'https://upvotocracy.com',
    image_url: 'https://upvotocracy.com/images/favicon-196x196.png',
    copyright: '&copy; 2020 upvotocracy.com',
    language: 'en',
    pubDate: new Date(),
    ttl: '60',
  });

  posts.map(item => {
    const { title, category, text } = item;
    const categories = [category.name];
    const author = item.author.username;
    const url = `https://upvotocracy.com/a/${category.name}/${item._id}`;

    feed.item({
      title,
      url, // link to the item
      guid: item.id, // optional - defaults to url
      categories, // optional - array of item categories
      author, // optional - defaults to feed author property
      date: item.created, // any format that js Date can parse.
      description: text || '',
    });
  });

  const xml = feed.xml({ indent: true });
  res.type('application/xml');
  res.send(xml);
};

export const list = async (req, res) => {
  const { sort = '-created' } = req.query;
  const posts = await Post.find()
    .populate('author')
    .populate('category')
    .sort(sort)
    .limit(20);
  const feed = new RSS({
    title: 'upvotocracy.com RSS feed',
    description: 'Zero moderation Reddit clone.',
    feed_url: `https://upvotocracy.com/api/1/posts/rss?sort=${sort}`,
    site_url: 'https://upvotocracy.com',
    image_url: 'https://upvotocracy.com/images/favicon-196x196.png',
    copyright: '&copy; 2020 upvotocracy.com',
    language: 'en',
    pubDate: new Date(),
    ttl: '60',
  });

  posts.map(item => {
    const { title, category } = item;
    const categories = [category.name];
    const author = item.author.username;
    const url = `https://upvotocracy.com/a/${category.name}/${item._id}`;

    feed.item({
      title,
      url, // link to the item
      guid: item.id, // optional - defaults to url
      categories, // optional - array of item categories
      author, // optional - defaults to feed author property
      date: item.created, // any format that js Date can parse.
    });
  });

  const xml = feed.xml({ indent: true });
  res.type('application/xml');
  res.send(xml);
};

export const listByUser = async (req, res) => {
  const { sort = '-score' } = req.query;
  const username = req.params.user;
  const author = await User.findOne({ username });
  const posts = await Post.find({ author: author.id })
    .sort(sort)
    .limit(20);

  const feed = new RSS({
    title: 'upvotocracy.com RSS feed',
    description: 'Zero moderation Reddit clone.',
    feed_url: `https://upvotocracy.com/api/1/posts/${author.username}/rss?sort=${sort}`,
    site_url: 'https://upvotocracy.com',
    image_url: 'https://upvotocracy.com/images/favicon-196x196.png',
    copyright: '&copy; 2020 upvotocracy.com',
    language: 'en',
    pubDate: new Date(),
    ttl: '60',
  });

  posts.map(item => {
    const { title, category } = item;
    const categories = [category.name];
    const author = item.author.username;
    const url = `https://upvotocracy.com/a/${category.name}/${item._id}`;

    feed.item({
      title,
      url, // link to the item
      guid: item.id, // optional - defaults to url
      categories, // optional - array of item categories
      author, // optional - defaults to feed author property
      date: item.created, // any format that js Date can parse.
    });
  });

  const xml = feed.xml({ indent: true });
  res.type('application/xml');
  res.send(xml);
};

export default {
  list,
  listByCategory,
  listByUser,
};
