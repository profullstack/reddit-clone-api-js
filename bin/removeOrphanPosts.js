import dotenv from 'dotenv';
import '../db';
import Post from '../models/post';

dotenv.config();

const main = async () => {
  const posts = await Post.aggregate([
    {
      $lookup: {
        from: 'users',
        localField: 'author',
        foreignField: '_id',
        as: 'users',
      },
    },
    { $match: { users: [] } },
    { $project: { _id: '$_id' } },
  ]);
  console.log(`deleting ${posts.length} posts in 5 seconds`);
  setTimeout(async () => {
    const deleted = await Post.deleteMany({
      _id: { $in: posts.map(({ _id }) => _id) },
    });
    console.log(`${deleted.n} posts deleted`);
    process.exit(0);
  }, 5000);
};
main();
