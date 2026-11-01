// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import netlify from "@netlify/vite-plugin-tanstack-start";

// Lovable's own build environment pins its Cloudflare output and ignores deploy-target
// env vars, so the Netlify wiring below is only added for genuine Netlify builds.
const isLovableBuild =
  process.env["LOVABLE_SANDBOX"] === "1" || !!process.env["DEV_SERVER__PROJECT_PATH"];
const isNetlifyBuild =
  !isLovableBuild &&
  (process.env["NETLIFY"] === "true" || process.env["LOVABLE_TARGET"] === "netlify");

// On Netlify the server build ships as a Netlify function instead of a Nitro bundle, so
// Nitro is switched off there. The key is left out entirely otherwise: this config file is
// type-checked with exactOptionalPropertyTypes, so an explicit `undefined` would not fit.
const netlifyBuildOptions = isNetlifyBuild
  ? { nitro: false as const, vite: { plugins: [netlify()] } }
  : {};

export default defineConfig({
  ...netlifyBuildOptions,
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
