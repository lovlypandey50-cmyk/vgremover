const FormData = require('form-data');
const fetch = require('node-fetch');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const photoroomKey = process.env.PHOTOROOM_API_KEY;
    const bodyBuffer = Buffer.from(event.body, event.isBase64Encoded ? 'base64' : 'utf8');

    const response = await fetch('https://image-api.photoroom.com/v2/edit', {
      method: 'POST',
      headers: {
        'x-api-key': photoroomKey,
        'Content-Type': event.headers['content-type'] || 'multipart/form-data'
      },
      body: bodyBuffer
    });

    const arrayBuffer = await response.arrayBuffer();
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'image/png' },
      body: Buffer.from(arrayBuffer).toString('base64'),
      isBase64Encoded: true
    };
  } catch (error) {
    return { statusCode: 500, body: error.toString() };
  }
};
