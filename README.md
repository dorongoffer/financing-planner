# Financing Planner

Static, client-only estimate tool: mortgage needed to buy and rebuild a home, monthly payment, sources vs. uses, sensitivity and scenarios. Hebrew, RTL. See `docs/SPEC.md` and `CLAUDE.md`.

The site holds no private data. It opens with fake example figures; import your own JSON file (formats in `src/ui/fileFormat.ts`, example in `data/defaults.example.json`), and it is kept in this browser only. Export a file to back up or move to another browser. Real figures are never committed.

```
npm install
npm run dev     # local dev server
npm run build   # static site in dist/
```

Estimates only. Not financial or tax advice.
