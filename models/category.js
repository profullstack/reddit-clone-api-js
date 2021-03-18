import mongoose, { Schema } from 'mongoose';
import Post from './post';

const categorySchema = new Schema({
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  created: { type: Date, default: Date.now, index: true },
  subscriberCount: { type: Number, default: 0 },
  nsfw: { type: Boolean, default: false },
  image: { type: String, default: null },
});

const deleteCategoryPosts = async function del(next) {
  const id = this.getQuery()._id;
  await Post.deleteMany({ category: id });
  next();
};

categorySchema.pre('deleteOne', deleteCategoryPosts);

const Category = mongoose.model('Category', categorySchema);

export default Category;
