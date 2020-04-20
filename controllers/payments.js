const stripe = require('stripe')(process.env.STRIPE_API_SECRET);
const Btcpay = require('btcpay');
const QRCode = require('qrcode');
import Invoice from '../models/invoice';
import Post from '../models/post';

const keypair = Btcpay.crypto.load_keypair(
  /* eslint-disable-next-line new-cap */
  new Buffer.from(process.env.BTCPAY_PRIVATE, 'hex'),
);
const client = new Btcpay.BTCPayClient(process.env.BTCPAY_URL, keypair, {
  merchant: process.env.BTCPAY_MERCHANT,
});

export const create = async (req, res) => {
  // TODO products object
  const { paymentMethod, postId } = req.body

  const amount = postId.length * 10;

  if (paymentMethod === 'CARD') {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100,
      currency: 'usd',
    })
      .catch(err => res.status(500).send(err))

    await Invoice.create({
      user: req.user.id,
      invoiceId: paymentIntent.id,
      date: Date.now(),
      amount,
      product: 's',
      status: 'new',
      postId,
      paymentMethod,
    })
      .catch(err => res.status(500).send(err));

    res.json({
      id: paymentIntent.id,
      client_secret: paymentIntent.client_secret,
    });
  }

  if (paymentMethod === 'BTC') {
    const invoice = await client.create_invoice({
      price: amount,
      currency: 'USD',
      notificationUrl: `${process.env.BTCPAY_NOTIFICATION}/api/1/payments`,
    });

    await Invoice.create({
      user: req.user.id,
      invoiceId: invoice.id,
      date: Date.now(),
      amount,
      product: 's',
      status: 'new',
      postId,
      paymentMethod,
    })
      .catch(err => res.status(500).send(err));

    const qr = await QRCode.toDataURL(invoice.paymentUrls.BIP21);
    res.json({
      qr,
      address: invoice.bitcoinAddress,
      amount: invoice.btcPrice,
      invoiceId: invoice.id,
    });
  }
};

export const status = async (req, res) => {
  const { invoiceId } = req.params;

  const status = await getStatus(invoiceId)
    .catch(err => res.status(500).send(err))

  res.json(status)
}

async function getStatus(invoiceId) {
  let status
  const inv = await Invoice.findOne({ invoiceId })
  // TODO more validation

  if (inv.paymentMethod === 'CARD') {
    const paymentIntent = await stripe.paymentIntents.retrieve(invoiceId);

    if (paymentIntent.amount === paymentIntent.amount_received) {
      status = 'complete'
    }
    else status = 'unpaid'
  }

  if (inv.paymentMethod === 'BTC') {
    const invoice = await client.get_invoice(invoiceId);

    if (invoice.status === 'confirmed' || invoice.status === 'complete') {
      status = complete
    }
    else status = invoice.status
  }

  if (status === 'complete') {
    await Post.updateMany({ _id: inv.postId }, { sponsored: true })
    inv.status = 'complete'
    await inv.save()
  }

  return { status }
}

export default { 
  create,
  status,
 }
