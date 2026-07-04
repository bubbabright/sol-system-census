# Ask the Professor — Worker (POC)

Cloudflare Worker backend for the "Ask the Professor" chat widget on Sol
System Census. Uses Workers AI (`env.AI`, Llama 3.1 8B instruct) — no
external API key needed.

## Scope of this POC (intentional cuts)

Unlike fuller reference chatbot implementations, this Worker skips:
- **Vectorize / RAG** — the catalog is small (184 bodies) and the site UI
  already tells us the single most relevant body deterministically
  (whatever's currently selected), so there's no need for embedding-based
  retrieval over the whole catalog.
- **KV session persistence** — no multi-turn memory across page loads.
- **SSE streaming** — plain JSON request/response, simplest to verify
  without a live deploy.

All three are reasonable follow-ups if this graduates past POC.

## Deploy (you'll need your own Cloudflare account)

Claude Code cannot authenticate a Cloudflare account or run `wrangler
deploy` — that requires your own credentials. From this directory:

```bash
npm install
npx wrangler login          # opens a browser OAuth flow
# — or, non-interactively: export CLOUDFLARE_API_TOKEN=...

npx wrangler deploy
```

`wrangler deploy` prints your live URL, something like:

```
https://sol-census-professor.YOUR-SUBDOMAIN.workers.dev
```

Then update the two placeholder occurrences of `YOUR-SUBDOMAIN` in
`../index.html`'s `<script>` tag (`src` and `data-base-url`) with that
real URL, so the static site's widget points at your deployed Worker.

## Local dev

```bash
npx wrangler dev
```

Note: Workers AI is not fully emulated locally — `wrangler dev` proxies
real Workers AI calls to Cloudflare's API, so you still need to be
authenticated even for "local" dev.

## Files

| File | Purpose |
| --- | --- |
| `src/index.js` | Worker entrypoint — `POST /api/ask` |
| `public/widget.js` | Embeddable chat widget, served statically via the `[assets]` binding at `/widget.js` |
| `wrangler.toml` | `name`, `[ai]` binding, `[assets]` binding |

## API

`POST /api/ask`

```json
{ "question": "How big is Jupiter?", "selectedBody": { "name": "Jupiter", "type": "planet", "tldr": "...", "mass": "...", "diameter": "...", "orbit": "...", "discovered": "..." } }
```

`selectedBody` is optional — omit or pass `null` for general Q&A not
scoped to a specific body.

Response: `{ "answer": "..." }` or `{ "error": "..." }` (4xx/5xx).

## Security note

CORS is wide open (`Access-Control-Allow-Origin: *`) for POC simplicity.
Lock this down to your real Netlify domain before this goes past POC.
