export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Yahan apna naya fine-grained token paste karein
  const HF_TOKEN = process.env.HF_TOKEN || "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";
  
  // Official Hugging Face inference router URL
  const MODEL_URL = "https://router.huggingface.co/hf-inference/models/briaai/RMBG-1.4";

  try {
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    const response = await fetch(MODEL_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${HF_TOKEN}`,
        "Content-Type": "application/octet-stream",
        "x-use-cache": "false"
      },
      body: buffer
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(response.status).send(err);
    }

    const arrayBuffer = await response.arrayBuffer();
    res.setHeader('Content-Type', 'image/png');
    return res.status(200).send(Buffer.from(arrayBuffer));
  } catch (error) {
    return res.status(500).send(`HF Connection Error: ${error.message}`);
  }
}
