import mongoose, { Schema } from 'mongoose';

const categorySchema = new Schema({
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  created: { type: Date, default: Date.now, index: true },
  subscriberCount: { type: Number, default: 0 },
  nsfw: { type: Boolean, default: false },
});

const Category = mongoose.model('Category', categorySchema);

export default Category;
