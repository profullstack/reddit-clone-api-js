import mongoose, { Schema } from 'mongoose';

const invoiceSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'user',
      required: true,
    },
    invoiceId: String,
    paymentMethod: String,
    date: Date,
    amount: Number,
    product: String,
    status: String,
    postId: [{
      type: Schema.Types.ObjectId,
      ref: 'Post',
    }],
  },
  {
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  });


const invoice = mongoose.model('invoice', invoiceSchema);

export default invoice;
