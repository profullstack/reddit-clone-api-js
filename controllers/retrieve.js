import fetch from 'node-fetch';
import cheerio from 'cheerio';

export const get = async (req, res) => {
  const url = decodeURIComponent(req.query.url);
  console.log('retrieve', url);
  const doc = await fetch(url)
    .then(doc => doc.text())
    .catch(console.error);

  const $ = cheerio.load(doc);
  const $thumb = $('meta[property="og:image"]') || $('meta[property="twitter:image"]');
  const title = $('title').first().text();
  const thumb = $thumb && $thumb.attr('content');

  res.json({
    title,
    doc,
    thumb,
  });
};

export default {
  get,
};
