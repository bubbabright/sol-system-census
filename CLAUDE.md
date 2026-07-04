# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Sol System Census — static, single-page React app cataloging 175+ named Solar System bodies (planets, moons, dwarf planets, asteroids, comets, interstellar objects, spacecraft) as a searchable/filterable tree grouped by gravitational binding. No backend, no build tooling beyond a manual Babel compile step.

## Canonical source

Everything at repo root is the deployable site. `archive/` holds superseded snapshots and non-deployable scaffold — kept for reference, not touched:
- `stale-root-copy/`, `duplicate-old/` — earlier snapshots from before the repo was flattened.
- `*.zip` — export/handoff bundles, not sources of truth.
- `handoff-artifacts/` — Claude Design handoff cruft that isn't part of the site (Figma Make's default `package.json`/`postcss.config.mjs`/`guidelines/` scaffold, a bundler preview stub, the handoff's agent-facing README).

## Editing workflow

Site ships pre-compiled JS — Babel is NOT loaded in the browser (`index.html` only pulls the React/ReactDOM UMD builds, then `data.js`, `portrait.js`, `app.js` directly).

1. Edit `app.jsx` and/or `portrait.jsx` (JSX source of truth).
2. Recompile to the `.js` files `index.html` actually loads:
   ```bash
   npx babel app.jsx -o app.js --presets=@babel/preset-react
   npx babel portrait.jsx -o portrait.js --presets=@babel/preset-react
   ```
   (one-time setup: `npm install --save-dev @babel/core @babel/cli @babel/preset-react`)
3. Alternatively, edit `app.js` / `portrait.js` directly — they're plain JS with `React.createElement` calls, no JSX.

**`app.js` is currently ahead of `app.jsx`** (a 2026-07-04 Claude Design handoff patched keyboard nav / prev-next buttons / localStorage state persistence straight into the compiled JS). If you edit `app.jsx` next, port those features across first or you'll silently regress them on recompile.

No test suite, no lint config, no bundler. "Running" the site is just opening `index.html` (or serving the directory statically) — data and components attach directly to `window` (`window.BODIES`, `window.App`).

## Architecture

Three globals loaded in sequence via `<script>` tags, no modules/imports:

- **`data.js`** — `window.BODIES`: flat array of body objects. Each has `id`, `name`, `type` (one of `star, planet, dwarf, moon, asteroid, comet, iso, probe`), `parent` (id of the body it's gravitationally bound to, or `null`/`"interstellar"`), `mass`, `diameter`, `orbit`, `discovered`, `tldr`, `color` (3-stop palette for the SVG fallback), `texture`, and optionally `img` (a Wikimedia Commons filename or full URL) and `rings`/`status`.
- **`portrait.js`** (source `portrait.jsx`) — `Portrait` component. Tries to load `body.img` from Wikimedia via `Special:FilePath` (permanent redirect, no hash-prefix lookup needed); on 404 falls back to a procedurally generated SVG keyed by a seeded PRNG (`hash(body.id)` → `rng()`), varying by `texture` (`rocky`, `gas`, `cloudy`, `earth`, `star`, `probe`, etc.) and `color`.
- **`app.js`** (source `app.jsx`) — everything else:
  - `buildTree(bodies)` turns the flat `BODIES` array into a `{ byId, roots }` structure via each body's `parent` pointer. Bodies with no resolvable parent become roots (the Sun; also a virtual `"interstellar"` bucket for escaped/passing objects like the Voyagers or ʻOumuamua).
  - `App` owns all UI state (search, `groupBy`: binding/type/flat, `sortBy`, `typeFilter` Set, `selectedId`, `expanded` Set of tree node ids) and derives the visible tree via `useMemo` chains: sort → filter (`visibleFilter`/`pruneTree`, keeps a node if it or any descendant passes) → render.
  - Three render modes off the same filtered/sorted data: `binding` (recursive `TreeBranch`/`BodyRow`, respects `expanded`), `type` (grouped by `TYPE_ORDER`), `none` (flat list).
  - `DetailPanel` shows the selected body: hero portrait, `ParentChain` (walks up `parent` links to root), stats, and a grid of direct satellites (bodies whose `parent === body.id`).
  - `TYPE_META` (label/glyph/color per type) and `TYPE_ORDER` are the single source of truth for type styling/ordering — update here when adding a new `type`.

## Deployment

Static Netlify site, no build command, publish directory `.`. See `README.md` for deploy options (drag-and-drop, git-connected, CLI) and `netlify.toml` for cache headers and the `/census` → `/index.html` redirect.
