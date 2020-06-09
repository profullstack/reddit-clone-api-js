import mongoose, { Schema } from 'mongoose';

const uploadSchema = new Schema({
  type: { type: String, required: true },
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  post: { type: Schema.Types.ObjectId, ref: 'Post', default: null },
  path: { type: String },
  thumbPath: { type: String },
},
{ timestamps: true });


const upload = mongoose.model('upload', uploadSchema);

export default upload;
