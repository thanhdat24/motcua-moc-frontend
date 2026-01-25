// /api/sau.js

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { API_SAU } = process.env;

  if (!API_SAU) {
    return res.status(500).json({ error: "API_SAU not configured in env" });
  }

  const authHeader =
    req.headers.authorization || req.headers.Authorization || "";

  if (!authHeader) {
    return res.status(401).json({ error: "Missing Authorization header" });
  }

  try {
    const response = await fetch(API_SAU, {
      method: "GET",
      headers: {
        Authorization: authHeader,
      },
    });

    const rawText = await response.text();

    if (!response.ok) {
      return res.status(response.status).json({
        error: "Remote API_SAU returned error",
        status: response.status,
        body: rawText?.slice(0, 500) || null,
      });
    }

    let data;
    try {
      data = JSON.parse(rawText);
    } catch (e) {
      return res.status(500).json({
        error: "Remote API_SAU returned invalid JSON",
        message: e.message,
        bodySample: rawText?.slice(0, 500) || null,
      });
    }

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({
      error: "Internal error calling API_SAU",
      message: err.message,
    });
  }
}