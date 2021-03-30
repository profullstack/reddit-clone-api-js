import mongoose, { Schema } from 'mongoose';
import { deleteFile } from '../controllers/uploads';

const uploadSchema = new Schema({
  type: { type: String, required: true },
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  post: { type: Schema.Types.ObjectId, ref: 'Post', default: null },
  path: { type: String },
  thumbPath: { type: String },
},
{ timestamps: true });

const deleteRelatedFiles = async function del(next) {
  const uploads = await this.model.find(this.getQuery());
  for (const upload of uploads) {
    await deleteFile(upload.path);

    if (upload.thumbPath) {
      await deleteFile(upload.thumbPath);
    }
  }
  next();
};

uploadSchema.pre('deleteMany', deleteRelatedFiles);


const upload = mongoose.model('upload', uploadSchema);

export default upload;
