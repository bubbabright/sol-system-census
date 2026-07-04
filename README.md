# Sol System Census

A static interactive catalog of every named body in the Solar System — planets, moons, dwarf planets, asteroids, comets, interstellar visitors, and spacecraft — grouped by gravitational binding.

## Deploy on Netlify

This site is fully static. No build step required.

**Option 1 — Drag and drop**
1. Zip this folder (or drag the folder itself) into the [Netlify dashboard](https://app.netlify.com/drop).
2. Done.

**Option 2 — Git connected**
1. Push this folder to a GitHub/GitLab/Bitbucket repo.
2. In Netlify: *Add new site → Import an existing project*, connect the repo.
3. Build command: *(leave blank)*
4. Publish directory: `.` (the repo root)
5. Deploy.

**Option 3 — Netlify CLI**
```bash
npm install -g netlify-cli
netlify deploy --dir . --prod
```

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Entry point |
| `app.js` | Compiled React UI (tree, filters, detail panel) |
| `portrait.js` | Compiled SVG portrait renderer + Wikimedia image loader with fallback |
| `app.jsx` / `portrait.jsx` | JSX source. Edit these and recompile (see below) if you want to change behaviour. |
| `data.js` | Catalog of all 175+ bodies |
| `styles.css` | All styling |
| `netlify.toml` | Cache headers + sensible defaults |

The older versioned files (`Sol System Census.html`, `Sol System Census v2.html`) are kept for reference and are deployed alongside `index.html` — feel free to delete them before deploying if you don't want them publicly accessible.

## Images

Body portraits load from Wikimedia Commons via `Special:FilePath` (a permanent redirect that doesn't require knowing file hash prefixes). If any image 404s, the renderer falls back to a procedurally-generated SVG portrait. No images are bundled with the site.

## Editing the JSX

`index.html` loads the pre-compiled `app.js` and `portrait.js` — Babel is no longer shipped to the browser. If you edit `app.jsx` or `portrait.jsx`, recompile with:

```bash
npx babel app.jsx -o app.js --presets=@babel/preset-react
npx babel portrait.jsx -o portrait.js --presets=@babel/preset-react
```

(Install once: `npm install --save-dev @babel/core @babel/cli @babel/preset-react`)

Or just edit `app.js` / `portrait.js` directly — they're readable JavaScript with `React.createElement` calls in place of JSX.
