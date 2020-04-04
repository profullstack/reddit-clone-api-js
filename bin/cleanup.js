require('dotenv').config();
const mongoose = require('mongoose');
import Category from '../models/category';

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
  process.exit()
})();