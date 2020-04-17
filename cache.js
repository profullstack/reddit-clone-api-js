const redis = require('redis');
const { promisify } = require('util');

const cache = redis.createClient(process.env.REDIS_URL);

cache.on('connect', () => {
  console.log('connected to redis: ', process.env.REDIS_URL);
});

module.exports = {
  cache,
  ...cache,
  getAsync: promisify(cache.get).bind(cache),
  setAsync: promisify(cache.set).bind(cache),
  keysAsync: promisify(cache.keys).bind(cache),
};
