# Financing Planner (CLAUDE.md)

Static, client-only web app: how big a mortgage is needed to buy and rebuild a home, and what it costs per month. `docs/SPEC.md` is canonical for behaviour. `src/calc/types.ts` is canonical for the data model, `src/ui/fileFormat.ts` for the import/export file formats.

## Hard rules

- **No server, no private data on any server.** The site is generic and ships only the fake example figures. The owner's real figures enter by importing a JSON file, live in browser storage (`localStorage`, key `financing-planner:v1`), and leave by exporting a JSON file. No `fetch`, no API, no CDN, no web fonts, no analytics.
- **Real amounts never enter git.** The owner's import file lives outside the repo (or as `data/defaults.local.json`, gitignored). Tests and docs use `data/defaults.example.json` (fake) or public arithmetic. `npm run check:privacy` enforces this and is part of the gate. Never paste numbers from a real file into code, tests, comments, commit messages or chat.
- **Calculations are pure functions in `src/calc/`**, fully unit-tested. The UI never computes inline.
- **Hebrew, RTL, mobile-first.** All strings in `src/ui/i18n/he.ts`. Amounts formatted with thousands separators and ₪. No `window.prompt`/`confirm`: use in-page forms.
- Estimates only; keep the footer disclaimer.

## Layout

```
src/calc/        pure calculation engine + tests (types.ts, config/purchaseTax.ts)
src/ui/          React app (Vite): App.tsx, store.ts (localStorage), fileFormat.ts (import/export), i18n/he.ts
data/            defaults.example.json (committed, fake); defaults.local.json is gitignored
public/          favicon, 404.html (Pages redirect)
.github/         workflows/pages.yml: build and deploy dist to GitHub Pages on push to main
scripts/         check-no-real-numbers.sh
```

## Storage model

One key, `financing-planner:v1`: `{ defaults, scenarios, activeScenarioId, savedAt, usingExample }`. First run loads the bundled example and seeds three preset scenarios. Importing a defaults file replaces defaults and re-seeds presets (user scenarios kept); importing an export file replaces everything. All storage access is try/catch; the app must render with storage unavailable. Storage is per browser: the exported file is the backup and the way to move between browsers.

## Commands

```
npm install
npm run dev        # vite on 5174
npm run gate       # typecheck → test → build → check:privacy
npm run build      # static output in dist/, base './' so it works under any path
```

Hosting: any static host. `pages.yml` deploys `dist` to GitHub Pages once a remote exists.

Run the gate from the worktree you edited as one command: `cd <worktree> && npm run gate`.

## Conventions

Conventional Commits. Builders write `vNEXT` in `CHANGELOG.md`; the orchestrator assigns the version at merge. No tracker is configured for this repo; findings go in the conversation.
