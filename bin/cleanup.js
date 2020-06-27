import Category from '../models/category';
import Posts from '../models/post';
import Uploads from '../models/upload';
import { deleteFile } from '../controllers/uploads'

require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI, {
  keepAlive: true,
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .catch(console.error);

(async () => {
  const res = await Category.updateMany({ subscriberCount: { $lt: 0 } }, { subscriberCount: 0 })
    .catch(err => console.log(err));

  console.log(res);

  const sponsored = await Posts.updateMany({ sponsored: { $exists: false } }, { sponsored: false })
    .catch(err => console.log(err));

  console.log({ sponsored });

  // Delete uploads that aren't attached to a post and are older than 1 hour
  const uploads = await Uploads.find({ post: null, createdAt: { $lte: Date.now() - 3600000}})
    .catch(err => console.log(err));

  for (const up of uploads) {
    await Uploads.deleteOne({ _id: up._id });
    await deleteFile(up.path);
    if (up.thumbPath) await deleteFile(up.thumbPath);
  }

  process.exit();
})();
