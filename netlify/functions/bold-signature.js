const crypto = require('crypto');

exports.handler = async function(event) {
  // Only allow POST
  if(event.httpMethod !== 'POST'){
    return { statusCode: 405, body: 'Method not allowed' };
  }

  try {
    const { orderId, amount, currency } = JSON.parse(event.body);

    if(!orderId || !amount || !currency){
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields' }) };
    }

    const secretKey = process.env.BOLD_SECRET_KEY;
    if(!secretKey){
      return { statusCode: 500, body: JSON.stringify({ error: 'Secret key not configured' }) };
    }

    // Bold integrity signature: SHA256(orderId + amount + currency + secretKey)
    const dataToHash = `${orderId}${amount}${currency}${secretKey}`;
    const signature = crypto.createHash('sha256').update(dataToHash).digest('hex');

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ signature, orderId })
    };

  } catch(err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
