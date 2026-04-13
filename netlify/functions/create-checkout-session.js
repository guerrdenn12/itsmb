const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY_WT || process.env.STRIPE_SECRET_KEY);

const PRICE_MAP = {
  setup_only:     { id: 'price_1TJOMuKnbiTjogJTGwSsrwHH', mode: 'payment' },
  setup_support:  { id: 'price_1TJON1KnbiTjogJTMNmPYBCB', mode: 'subscription' },
  managed_it:     { id: 'price_1TJON1KnbiTjogJTwV733aEN', mode: 'subscription' },
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' }, body: '' };
  }
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  try {
    const { plan } = JSON.parse(event.body || '{}');
    const price = PRICE_MAP[plan];
    if (!price) return { statusCode: 400, body: JSON.stringify({ error: `Unknown plan: ${plan}` }) };

    const origin = event.headers.origin || 'https://itforbusinesssmb.com';
    const session = await stripe.checkout.sessions.create({
      ui_mode: 'embedded_page',
      line_items: [{ price: price.id, quantity: 1 }],
      mode: price.mode,
      return_url: `${origin}/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ clientSecret: session.client_secret }),
    };
  } catch (err) {
    console.error('Stripe error:', err.message);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: err.message }),
    };
  }
};
