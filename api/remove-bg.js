export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 🔑 LINE 11: Yahan apna Hugging Face Token (hf_...) paste karein
  const HF_TOKEN = process.env.HF_TOKEN || "YAHA_HF_TOKEN_PASTE_KRE";

  if (!HF_TOKEN || HF_TOKEN === "YAHA_HF_TOKEN_PASTE_KRE") {
    return res.status(500).send("Hugging Face Token missing!");
  }

  try {
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    // Free Hugging Face RMBG-1.4 Studio Quality Background Removal
    const response = await fetch(
      "https://api-inference.huggingface.co/models/briaai/RMBG-1.4",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${HF_TOKEN}`,
          "Content-Type": "application/octet-stream",
        },
        body: buffer,
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).send(`HuggingFace Error: ${errText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    res.setHeader('Content-Type', 'image/png');
    return res.status(200).send(Buffer.from(arrayBuffer));
  } catch (error) {
    return res.status(500).send(`Server Error: ${error.message}`);
  }
}
