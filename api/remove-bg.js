export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 🔑 LINE 11: Yahan apni Fal.ai API Key paste karein (ya Vercel FAL_KEY use karein)
  const FAL_KEY = process.env.FAL_KEY || "088c61d7-2f4c-4a57-8e15-61303f961b49:81d49e3f01b7618474d450485a1714d3";

  if (!FAL_KEY || FAL_KEY === "YAHA_API_KEY_PAST_KRE") {
    return res.status(500).send("API Key missing! Please add FAL_KEY in code or Vercel settings.");
  }

  try {
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);
    const base64Image = `data:image/png;base64,${buffer.toString("base64")}`;

    // Fal.ai Studio Quality Background Removal
    const response = await fetch("https://fal.run/fal-ai/bria/background/remove", {
      method: "POST",
      headers: {
        "Authorization": `Key ${FAL_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image_url: base64Image
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).send(`Fal API Error: ${errText}`);
    }

    const data = await response.json();
    if (!data.image || !data.image.url) {
      return res.status(500).send("AI model did not return image URL");
    }

    // Processed transparent image download
    const imageResponse = await fetch(data.image.url);
    const imageBuffer = await imageResponse.arrayBuffer();

    res.setHeader('Content-Type', 'image/png');
    return res.status(200).send(Buffer.from(imageBuffer));
  } catch (error) {
    return res.status(500).send(`Server Error: ${error.message}`);
  }
}
