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
    return res.status(500).send("HF_TOKEN missing in Vercel Environment Variables!");
  }

  try {
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    const response = await fetch(
      "https://api-inference.huggingface.co/models/briaai/RMBG-1.4",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${HF_TOKEN.trim()}`,
          "Content-Type": "application/octet-stream",
          "x-wait-for-model": "true",
        },
        body: buffer,
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).send(`HuggingFace Error (${response.status}): ${errText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    res.setHeader('Content-Type', 'image/png');
    return res.status(200).send(Buffer.from(arrayBuffer));
  } catch (error) {
    return res.status(500).send(`Server Error: ${error.message}`);
  }
}
