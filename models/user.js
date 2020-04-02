import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new Schema(
  {
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    admin: Boolean,
    karma: { type: Number, default: 0, index: true },
    inbox: {
      type: [
        {
          comment: Schema.Types.ObjectId,
          read: Boolean,
        },
      ],
      select: false,
    },
    bitcoinAddress: {type: String},
    links: [
      {
        name: String,
        url: String
      }
    ],
    created: { type: Date },
    ip: { type: String },
  },
  { collation: { locale: 'en', strength: 1 } },
);

userSchema.set('toJSON', { getters: true });
userSchema.options.toJSON.transform = (doc, ret) => {
  const obj = { ...ret };
  delete obj._id;
  delete obj.__v;
  delete obj.password;
  delete obj.ip;

  return obj;
};

userSchema.pre('save', async function(next) {
  this.password = await bcrypt.hash(this.password, 10);
  if (!this.created) {
    this.created = Date.now();
  }
  next();
});

userSchema.methods.isValidPassword = async function(password) {
  const match = await bcrypt.compare(password, this.password);
  return match;
};

const User = mongoose.model('User', userSchema);

export default User;
