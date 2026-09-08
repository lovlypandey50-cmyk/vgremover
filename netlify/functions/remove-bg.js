exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const token = process.env.HF_TOKEN;
  if (!token) {
    return { statusCode: 500, body: "Server par HF_TOKEN missing hai!" };
  }

  try {
    const binaryData = Buffer.from(event.body, event.isBase64Encoded ? "base64" : "binary");

    const hfResponse = await fetch(
      "https://api-inference.huggingface.co/models/ZhengPeng7/BiRefNet",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: binaryData
      }
    );

    if (!hfResponse.ok) {
      const err = await hfResponse.text();
      return { statusCode: hfResponse.status, body: err };
    }

    const arrayBuffer = await hfResponse.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString("base64");

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "image/png"
      },
      body: base64Image,
      isBase64Encoded: true
    };
  } catch (error) {
    return { statusCode: 500, body: error.message };
  }
};

