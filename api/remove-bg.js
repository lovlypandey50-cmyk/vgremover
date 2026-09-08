import https from 'https';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const HF_TOKEN = process.env.HF_TOKEN;
  if (!HF_TOKEN) {
    return res.status(500).send("HF_TOKEN missing in Vercel settings");
  }

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const buffer = Buffer.concat(chunks);

  const options = {
    hostname: 'api-inference.huggingface.co',
    path: '/models/briaai/RMBG-1.4',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${HF_TOKEN}`,
      'Content-Type': 'application/octet-stream',
      'Content-Length': buffer.length,
    },
  };

  const hfReq = https.request(options, (hfRes) => {
    const responseChunks = [];

    hfRes.on('data', (d) => {
      responseChunks.push(d);
    });

    hfRes.on('end', () => {
      const responseBuffer = Buffer.concat(responseChunks);

      if (hfRes.statusCode !== 200) {
        return res.status(hfRes.statusCode).send(responseBuffer.toString());
      }

      res.setHeader('Content-Type', 'image/png');
      return res.status(200).send(responseBuffer);
    });
  });

  hfReq.on('error', (error) => {
    return res.status(500).send(`Network Error: ${error.message}`);
  });

  hfReq.write(buffer);
  hfReq.end();
}
