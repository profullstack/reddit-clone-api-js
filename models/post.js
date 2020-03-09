import mongoose, { Schema } from 'mongoose';

const commentSchema = new Schema({
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  body: { type: String, required: true },
  created: { type: Date, default: Date.now },
});

commentSchema.set('toJSON', { getters: true });
commentSchema.options.toJSON.transform = (doc, ret) => {
  const obj = { ...ret };
  delete obj._id;
  return obj;
};

const postSchema = new Schema({
  title: { type: String, required: true },
  url: { type: String },
  thumb: { type: String },
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
  score: { type: Number, default: 0 },
  votes: [{ user: Schema.Types.ObjectId, vote: Number, _id: false }],
  comments: [commentSchema],
  created: { type: Date, default: Date.now },
  views: { type: Number, default: 0 },
  type: { type: String, default: 'link', required: true },
  text: { type: String },
  ranking: { type: Number, default: 1},
});

postSchema.set('toJSON', { getters: true, virtuals: true });
postSchema.options.toJSON.transform = (doc, ret) => {
  const obj = { ...ret };
  delete obj._id;
  delete obj.__v;
  return obj;
};

postSchema.virtual('upvotePercentage').get(function() {
  if (this.votes.length === 0) return 0;
  const upvotes = this.votes.filter(vote => vote.vote === 1);
  return Math.floor((upvotes.length / this.votes.length) * 100);
});

postSchema.virtual('commentCount').get(function() {
  return Number(this.comments.length);
});

postSchema.methods.vote = function(user, vote) {
  const existingVote = this.votes.find(item => item.user._id.equals(user));

  if (existingVote) {
    // reset score
    this.score -= existingVote.vote;
    if (vote === 0) {
      // remove vote
      this.votes.pull(existingVote);
    } else {
      // change vote
      this.score += vote;
      existingVote.vote = vote;
    }
  } else if (vote !== 0) {
    // new vote
    this.score += vote;
    this.votes.push({ user, vote });
  }

  return this.save();
};

postSchema.methods.addComment = async function(author, body) {
  const _id = new mongoose.Types.ObjectId();
  this.comments.push({ _id, author, body });
  const content = await this.save();
  return { content, _id };
};

postSchema.methods.removeComment = function(id) {
  const comment = this.comments.id(id);
  if (!comment) throw new Error('Comment not found');
  comment.remove();
  return this.save();
};

postSchema.pre(/^find/, function() {
  this.populate('author')
    .populate('comments.author')
    .populate('category');
});

postSchema.pre('save', function(next) {
  this.wasNew = this.isNew;
  next();
});

postSchema.post('save', function(doc, next) {
  if (this.wasNew) this.vote(this.author._id, 1);
  doc
    .populate('author')
    .populate('comments.author')
    .execPopulate()
    .then(() => next());
});

const Post = mongoose.model('Post', postSchema);

export default Post;
