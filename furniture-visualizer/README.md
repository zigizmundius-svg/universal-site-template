# Willbe Furniture Visualizer

Standalone Next.js app in this repository subdirectory.

## Setup
- Node.js 20+
- npm install
- npm run dev

## Vercel environment variables
- `BLOB_READ_WRITE_TOKEN` — created automatically when connecting a Vercel Blob store.
- `IDEALHOUSE_API_KEY` — server-side API key for Ideal House Furniture Try-On API.

The AI endpoint uses Ideal House asynchronous furniture try-on. Uploaded room photos are stored in a public Vercel Blob store so the provider can fetch them. The API key is never sent to the browser.

Demo catalog imagery is illustrative and must be replaced with approved product photos before public commercial use.
