# Changelog

Format: Keep a Changelog. Semver.

## [0.3.0] - 2026-11-21

### Changed
- Renamed to Financing Planner; no house name or personal names remain in the repository.
- App is now a static, client-only site: no server, no API. Figures are imported from a JSON file, kept in browser storage and exported to a JSON file. Scenarios are stored in the browser.
- In-page forms and confirms replace `window.prompt`/`window.confirm`.
- Footer version comes from `package.json` at build time; build uses a relative base.

### Added
- Data bar: import (button or drag and drop), export, clear browser data; defaults and export file formats with validation and Hebrew errors.
- GitHub Pages workflow and `404.html` redirect.

### Removed
- Fastify server, deploy scripts, mock API, `src/shared/api.ts` and the related dependencies.

## [0.2.0] - 2026-11-20

### Added
- Calculation engine (`src/calc`): purchase tax, capital gains, sources, uses, annuity, sensitivity, presets, formatting, with tests.
- Hebrew RTL React UI: headline cards, uses-vs-sources chart, inputs panel, tornado, scenarios bar and compare panel.
- Fastify server: defaults, scenarios CRUD with atomic serialized writes and first-run preset seeding, static app with SPA fallback, security headers, loopback-only guard.
- LaunchAgent template, install/uninstall scripts and deploy README.
- Dev-only mock API (`VITE_MOCK_API=1`).

### Fixed
- `npm start` pointed at a wrong path; the compiled entry is `dist-server/server/index.js`.

## [0.1.0] - 2026-11-20

### Added
- Repository skeleton: types, API contract, tax bracket config, example defaults, privacy check, docs.
