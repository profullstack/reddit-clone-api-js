require('dotenv').config();
const mongoose = require('mongoose');
import Category from '../models/category';
import Posts from '../models/post';

mongoose.connect(process.env.MONGO_URI, {
  keepAlive: true,
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .catch(console.error);

(async () => {

  const res = await Category.updateMany({ subscriberCount: { $lt: 0 }}, { subscriberCount: 0 })
    .catch(err => console.log(err));

  console.log(res)

  const sponsored = await Posts.updateMany({ sponsored: { $exists: false } }, { sponsored: false })
    .catch(err => console.log(err));
  
  console.log({ sponsored })

  process.exit()
})();