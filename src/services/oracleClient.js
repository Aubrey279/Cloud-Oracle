const API_URL = import.meta.env.VITE_ORACLE_API_URL || "/api/read-cloud";

export async function readCloudImage({ imageBase64, imageMime, systemPrompt }) {
  if (import.meta.env.DEV && API_URL === "/api/read-cloud") {
    await wait(900);
    return MOCK_READING;
  }

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      imageBase64,
      imageMime,
      systemPrompt
    })
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || `Oracle API failed with ${response.status}`);
  }

  return normalizeReading(data?.reading || data);
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeReading(reading) {
  const required = [
    "formation_name",
    "latin_name",
    "rarity",
    "shape_seen",
    "omen",
    "symbol_title",
    "symbol_meaning",
    "fortune",
    "shadow_warning",
    "ritual",
    "cloud_type",
    "sky_reading"
  ];

  for (const key of required) {
    if (typeof reading?.[key] !== "string" || !reading[key].trim()) {
      throw new Error(`Oracle response is missing "${key}"`);
    }
  }

  return reading;
}

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
