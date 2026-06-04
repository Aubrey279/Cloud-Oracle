const MOCK_READING = {
  formation_name: "The Listening Veil",
  latin_name: "Altostratus oraculum",
  rarity: "Uncommon",
  shape_seen: "A long veil gathers itself into the outline of a half-open door.",
  omen: "mysterious",
  symbol_title: "The Threshold",
  symbol_meaning:
    "The threshold appears wherever an old room of the self has become too small. In many traditions, the doorway belongs to both worlds at once: departure and arrival, secrecy and permission.",
  fortune:
    "You are closer to an answer than your current restlessness admits. Something has been waiting for you to stop asking for certainty and start noticing repetition. The same small sign will return twice today; the second time, do not explain it away.",
  shadow_warning:
    "Mystery is useful only while it sharpens your attention. Do not let ambiguity become a velvet curtain for postponing the obvious.",
  ritual:
    "Stand at a doorway for ten quiet breaths before you cross it. On the final breath, name one thing you are ready to leave on the side behind you.",
  cloud_type: "Altostratus",
  sky_reading:
    "The sky looks as if it is keeping a secret without quite enjoying the burden."
};

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = await readJsonBody(request);
    validatePayload(body);

    const reading = await getReading(body);
    return response.status(200).json({ reading });
  } catch (error) {
    return response.status(error.statusCode || 500).json({
      error: error.message || "Cloud reading failed"
    });
  }
}

async function getReading(payload) {
  if (process.env.ORACLE_API_URL) {
    return callCustomOracle(payload);
  }

  return MOCK_READING;
}

async function callCustomOracle(payload) {
  const res = await fetch(process.env.ORACLE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(process.env.ORACLE_API_KEY
        ? { Authorization: `Bearer ${process.env.ORACLE_API_KEY}` }
        : {})
    },
    body: JSON.stringify(payload)
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const error = new Error(data?.error || `Upstream oracle failed with ${res.status}`);
    error.statusCode = 502;
    throw error;
  }

  return data?.reading || data;
}

function validatePayload(body) {
  if (!body?.imageBase64 || typeof body.imageBase64 !== "string") {
    const error = new Error("imageBase64 is required");
    error.statusCode = 400;
    throw error;
  }

  if (!body?.imageMime || !body.imageMime.startsWith("image/")) {
    const error = new Error("imageMime must be an image MIME type");
    error.statusCode = 400;
    throw error;
  }
}

async function readJsonBody(request) {
  if (request.body && typeof request.body === "object") {
    return request.body;
  }

  const chunks = [];

  for await (const chunk of request) {
    chunks.push(chunk);
  }

  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}
