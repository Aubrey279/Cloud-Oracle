# Cloud Oracle

A Vite + React website for uploading a sky photo and receiving a poetic cloud reading.

The UI is complete and deployable. The AI provider is intentionally isolated behind one API contract so you can connect Anthropic, OpenAI, Replicate, a Cloudflare Worker, or your own backend later.

## Local development

```bash
npm install
npm run dev
```

Then open the local URL printed by Vite.

In Vite development, the frontend returns a mock reading by default so the full upload and reveal flow works without a backend. If you set `VITE_ORACLE_API_URL`, the browser will call that endpoint instead.

In production, `/api/read-cloud` returns a mock reading unless you set `ORACLE_API_URL`.

## Build

```bash
npm run build
npm run preview
```

## API contract

The frontend calls:

```text
POST /api/read-cloud
```

Request body:

```json
{
  "imageBase64": "base64 image data without the data URL prefix",
  "imageMime": "image/jpeg",
  "systemPrompt": "prompt text"
}
```

The API should return either the reading object directly or:

```json
{
  "reading": {
    "formation_name": "The Listening Veil",
    "latin_name": "Altostratus oraculum",
    "rarity": "Uncommon",
    "shape_seen": "A long veil gathers itself into the outline of a half-open door.",
    "omen": "mysterious",
    "symbol_title": "The Threshold",
    "symbol_meaning": "Two or three sentences.",
    "fortune": "Three or four sentences.",
    "shadow_warning": "One or two sentences.",
    "ritual": "One or two sentences.",
    "cloud_type": "Altostratus",
    "sky_reading": "One poetic sentence."
  }
}
```

## Connect your own model

Set these server-side environment variables:

```bash
ORACLE_API_URL=https://your-api.example.com/read-cloud
ORACLE_API_KEY=your-secret-key
```

`api/read-cloud.js` will forward the request to that endpoint and normalize the response for the React app.

If you want the browser to call another public endpoint directly, set:

```bash
VITE_ORACLE_API_URL=https://your-public-api.example.com/read-cloud
```

For production, prefer the server-side route so model keys never ship to the browser.

## Deploy to Vercel

1. Push this folder to a Git repository.
2. Import the project in Vercel.
3. Add `ORACLE_API_URL` and `ORACLE_API_KEY` if you want live AI readings.
4. Deploy.

The included `vercel.json` uses Vite's `dist` output and keeps `/api/read-cloud` as the serverless function.
