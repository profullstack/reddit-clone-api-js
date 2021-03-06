import RSS from 'rss';
import { j2xParser as Parser } from 'fast-xml-parser';
import Post from '../models/post';
import Category from '../models/category';
import User from '../models/user';

const { SITE_NAME, SITE_URL, SITE_DOMAIN, SITE_DESCRIPTION } = process.env;


export const listByCategory = async (req, res) => {
  // const cutoff = Date.now() - 86400 * 14 * 1000;
  const { sort = '-created' } = req.query;
  const name = req.params.category;
  const category = await Category.find({ name });
  const posts = await Post.find({ category })
    .populate('author')
    .populate('category')
    .sort(sort)
    .limit(20);
  const feed = new RSS({
    title: `${SITE_DOMAIN}/a/${name} RSS feed`,
    description: `${SITE_DESCRIPTION} ${category.description || ''}`,
    feed_url: `${SITE_URL}/api/1/posts/${name}/rss?sort=${sort}`,
    site_url: `${SITE_URL}`,
    image_url: `${SITE_URL}/images/favicon-196x196.png`,
    copyright: `&copy; 2020 ${SITE_NAME}`,
    language: 'en',
    pubDate: new Date(),
    ttl: '60',
    custom_namespaces: {
      media: 'http://search.yahoo.com/mrss/',
    },
  });

  posts.map(item => {
    const { title, category, text, hashtags } = item;
    const categories = [category.name, ...hashtags];
    const author = item.author.username;
    const url = `${SITE_URL}/a/${category.name}/${item._id}`;
    const image_custom_element = {
      'media:content': [
        {
          _attr: {
            url: item.thumb,
            medium: 'image',
          },
        },
      ],
    };
    feed.item({
      title,
      url, // link to the item
      guid: item.id, // optional - defaults to url
      categories, // optional - array of item categories
      author, // optional - defaults to feed author property
      date: item.created, // any format that js Date can parse.
      description: text || '',
      custom_elements: [image_custom_element], // any format that js Date can parse.
    });
  });

  const xml = feed.xml({ indent: true });
  res.type('application/xml');
  res.send(xml);
};

export const listByHashtag = async (req, res) => {
  // const cutoff = Date.now() - 86400 * 14 * 1000;
  const { sort = '-created' } = req.query;
  const hashtag = req.params.hashtag;
  const posts = await Post.find({ hashtags: hashtag })
    .populate('author')
    .populate('category')
    .sort(sort)
    .limit(20);
  const feed = new RSS({
    title: `${SITE_DOMAIN}/tag/${hashtag} RSS feed`,
    description: `${SITE_DESCRIPTION}`,
    feed_url: `${SITE_URL}/api/1/posts/rss/tags/${hashtag}?sort=${sort}`,
    site_url: `${SITE_URL}`,
    image_url: `${SITE_URL}/images/favicon-196x196.png`,
    copyright: `&copy; 2020 ${SITE_NAME}`,
    language: 'en',
    pubDate: new Date(),
    ttl: '60',
    custom_namespaces: {
      media: 'http://search.yahoo.com/mrss/',
    },
  });

  posts.map(item => {
    const { title, category, text, hashtags } = item;
    const categories = [category.name, ...hashtags];
    const author = item.author.username;
    const url = `${SITE_URL}/a/${category.name}/${item._id}`;
    const image_custom_element = {
      'media:content': [
        {
          _attr: {
            url: item.thumb,
            medium: 'image',
          },
        },
      ],
    };
    feed.item({
      title,
      url, // link to the item
      guid: item.id, // optional - defaults to url
      categories, // optional - array of item categories
      author, // optional - defaults to feed author property
      date: item.created, // any format that js Date can parse.
      description: text || '',
      custom_elements: [image_custom_element], // any format that js Date can parse.
    });
  });

  const xml = feed.xml({ indent: true });
  res.type('application/xml');
  res.send(xml);
};

export const list = async (req, res) => {
  // const cutoff = Date.now() - 86400 * 14 * 1000;
  const { sort = '-created' } = req.query;
  let posts = await Post.find()
    .populate('author')
    .populate('category')
    .sort(sort)
    .limit(20);
  const feed = new RSS({
    title: `${SITE_DOMAIN} RSS feed`,
    description: SITE_DESCRIPTION,
    feed_url: `${SITE_URL}/api/1/posts/rss?sort=${sort}`,
    site_url: `${SITE_URL}`,
    image_url: `${SITE_URL}/images/favicon-196x196.png`,
    copyright: `&copy; 2020 ${SITE_DOMAIN}`,
    language: 'en',
    pubDate: new Date(),
    ttl: '60',
    custom_namespaces: {
      media: 'http://search.yahoo.com/mrss/',
    },
  });

  posts = posts.filter(post => post.category.nsfw !== true);

  posts.map(item => {
    const { title, category, hashtags } = item;
    const categories = [category.name, ...hashtags];
    const author = item.author && item.author.username;
    const url = `${SITE_URL}/a/${category.name}/${item._id}`;
    const image_custom_element = {
      'media:content': [
        {
          _attr: {
            url: item.thumb,
            medium: 'image',
          },
        },
      ],
    };
    feed.item({
      title,
      url, // link to the item
      guid: item.id, // optional - defaults to url
      categories, // optional - array of item categories
      author, // optional - defaults to feed author property
      date: item.created, // any format that js Date can parse.
      custom_elements: [image_custom_element], // any format that js Date can parse.
    });
  });

  const xml = feed.xml({ indent: true });
  res.type('application/xml');
  res.send(xml);
};

export const sitemap = async (req, res) => {
  const defaultOptions = {
    format: true,
    ignoreAttributes: false,
    attrNodeName: '@_',
    attributeNamePrefix: '@_',
    parseAttributeValue: true,
    doctype: '<?xml version="1.0" encoding="UTF-8"?>',
  };
  const parser = new Parser(defaultOptions);
  const { sort = '-created' } = req.query;
  let posts = await Post.find()
    .populate('author')
    .populate('category')
    .sort(sort);

  posts = posts.filter(post => post.category.nsfw !== true);

  const pages = [];
  const doc = {
    urlset: {},
  };

  posts.map(item => {
    const { title, category } = item;
    const url = `${SITE_URL}/a/${category.name}/${item._id}`;

    pages.push({
      loc: url,
      changefreq: 'weekly',
      priority: 0.5,
    });
  });

  doc.urlset['@_'] = {
    xmlns: 'http://www.sitemaps.org/schemas/sitemap/0.9',
  };
  doc.urlset.url = pages;

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
${parser.parse(doc)}
`;

  res.send(xml);
};

export const listByUser = async (req, res) => {
  // const cutoff = Date.now() - 86400 * 14 * 1000;
  const { sort = '-score' } = req.query;
  const username = req.params.user;
  const author = await User.findOne({ username });
  let posts = await Post.find({ author: author.id })
    .sort(sort)
    .limit(20);

  posts = posts.filter(post => post.category.nsfw !== true);

  const feed = new RSS({
    title: `${SITE_DOMAIN} RSS feed`,
    description: SITE_DESCRIPTION,
    feed_url: `${SITE_URL}/api/1/posts/${author.username}/rss?sort=${sort}`,
    site_url: `${SITE_URL}`,
    image_url: `${SITE_URL}/images/favicon-196x196.png`,
    copyright: `&copy; 2020 ${SITE_DOMAIN}`,
    language: 'en',
    pubDate: new Date(),
    ttl: '60',
    custom_namespaces: {
      media: 'http://search.yahoo.com/mrss/',
    },
  });

  posts.map(item => {
    const { title, category, hashtags } = item;
    const categories = [category.name, ...hashtags];
    const author = item.author.username;
    const url = `${SITE_URL}/a/${category.name}/${item._id}`;
    // console.log(item);

    const image_custom_element = {
      'media:content': [
        {
          _attr: {
            url: item.thumb,
            medium: 'image',
          },
        },
      ],
    };

    feed.item({
      title,
      url, // link to the item
      guid: item.id, // optional - defaults to url
      categories, // optional - array of item categories
      author, // optional - defaults to feed author property
      date: item.created,
      custom_elements: [image_custom_element], // any format that js Date can parse.
    });
  });

  const xml = feed.xml({ indent: true });
  res.type('application/xml');
  res.send(xml);
};

export const listBySubscriptions = async (req, res) => {
  const { sort = '-created' } = req.query;
  const user = await User.findOne({ _id: req.params.user }, { _id: false, subscriptions: true });
  console.log(user);
  const posts = await Post.find({ category: { $in: user.subscriptions } })
    .populate('author')
    .populate('category')
    .sort(sort)
    .limit(20);
  const feed = new RSS({
    title: `${SITE_DOMAIN} RSS feed`,
    description: SITE_DESCRIPTION,
    feed_url: `${SITE_URL}/api/1/posts/rss/${req.params.user}`,
    site_url: `${SITE_URL}`,
    image_url: `${SITE_URL}/images/favicon-196x196.png`,
    copyright: `&copy; 2020 ${SITE_DOMAIN}`,
    language: 'en',
    pubDate: new Date(),
    ttl: '60',
    custom_namespaces: {
      media: 'http://search.yahoo.com/mrss/',
    },
  });

  console.log(posts);

  posts.map(item => {
    const { title, category, text } = item;
    const categories = [category.name];
    const author = item.author.username;
    const url = `${SITE_URL}/a/${category.name}/${item._id}`;
    const image_custom_element = {
      'media:content': [
        {
          _attr: {
            url: item.thumb,
            medium: 'image',
          },
        },
      ],
    };
    feed.item({
      title,
      url, // link to the item
      guid: item.id, // optional - defaults to url
      categories, // optional - array of item categories
      author, // optional - defaults to feed author property
      date: item.created, // any format that js Date can parse.
      description: text || '',
      custom_elements: [image_custom_element], // any format that js Date can parse.
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
  sitemap,
  listBySubscriptions,
  listByHashtag,
};
