export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 🔑 LINE 11: Yahan apni Segmind API Key paste karein
  const SEGMIND_KEY = process.env.SEGMIND_KEY || "SG_9f71c515c0f20bcd";

  if (!SEGMIND_KEY || SEGMIND_KEY === "YAHA_API_KEY_PAST_KRE") {
    return res.status(500).send("Segmind API Key missing!");
  }

  try {
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);
    const base64Image = buffer.toString("base64");

    // Segmind High Quality Background Removal Call
    const response = await fetch("https://api.segmind.com/v1/bg-removal", {
      method: "POST",
      headers: {
        "x-api-key": SEGMIND_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image: base64Image,
        method: "fine"
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).send(`Segmind Error: ${errText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    res.setHeader('Content-Type', 'image/png');
    return res.status(200).send(Buffer.from(arrayBuffer));
  } catch (error) {
    return res.status(500).send(`Server Error: ${error.message}`);
  }
}
