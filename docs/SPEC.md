# Financing Planner: Spec (sanitized)

_2026-11-20. This copy carries no real amounts; the owner's figures live only in an import file kept outside git (e.g. gitignored `data/defaults.local.json`) and in browser storage. `data/defaults.example.json` has fake numbers of the same shape._

## 1. What it is

A one-page tool that answers one question: **how big a mortgage do we need to buy and rebuild a home, and what does it cost per month?** It shows funding sources (sale of the current home, RSUs, study funds, savings, custom) against uses (purchase, taxes, fees, renovation, contingency, cash reserve). Every number is an editable estimate. The mortgage is the plug that closes the gap.

Users: two household members. UI in **Hebrew, RTL**, amounts in ₪ with thousands separators. No server and no external calls, no CDN fonts, no analytics.

## 2. Architecture

- Frontend: Vite + React + TypeScript. Charts in SVG or Recharts, bundled locally.
- Static, client-only site: no server, no API, no network calls after the page loads. Hostable on any static host (GitHub Pages workflow in `.github/workflows/pages.yml`); build uses a relative base so it works under any path.
- Data: the site ships only fake example figures. The owner's figures come in by importing a JSON file (defaults file: `inputs`, `presets`, optional `notes`), are kept in browser `localStorage` (one key, `financing-planner:v1`), and go out by exporting a JSON file (defaults + scenarios). The exported file is the backup. Formats in `src/ui/fileFormat.ts`.
- Scenarios live in the same browser storage; three preset scenarios are seeded from the defaults' presets.
- Calculations: pure functions in `src/calc/`, unit-tested. The UI never computes inline.

## 3. Inputs (types in `src/calc/types.ts`)

Every source has an on/off toggle and shows gross → tax → net. Users can add custom sources (name + net amount).

**Sale of current home:** sale price, remaining mortgage payoff, seller lawyer (% + VAT), realtor (toggle + %), original purchase price, CPI factor since purchase (editable, note to verify), purchase tax paid then (deductible, indexed by CPI), other deductible expenses, improvements, exemption ceiling (public 2026 value), capital-gains rate.

Capital gains tax (מס שבח):
```
sellerLawyer = salePrice × sellerLawyerPct × (1 + vat)
realtor      = realtorEnabled ? salePrice × realtorPct × (1 + vat) : 0
realGain     = salePrice − purchasePrice × cpi − (purchaseTaxPaid × cpi + otherDeductibles + improvements + sellerLawyer + realtor)
taxableShare = max(0, (salePrice − ceiling) / salePrice)
tax          = max(0, realGain) × taxableShare × rate
netFromSale  = salePrice − mortgagePayoff − sellerLawyer − realtor − tax
```

**RSUs:** value in USD, USD/ILS rate, effective tax rate (section 102 capital track). `net = valueUsd × rate × (1 − tax)`.

**Study funds:** one row each (holder, name, amount), tax 0, all on by default. Show the note from `notes.studyFunds` under the group.

**Other savings:** gross, taxable gain, tax rate, on/off. `net = gross − taxableGain × taxRate`. Some rows default to off (children's money).

**Uses:** purchase price, purchase tax (auto, §4), buyer lawyer (% + VAT), realtor %, misc flat amount.

**Renovation:** each item has low/mid/high; `level` picks the column; `override` replaces a cell. Contingency slider (default from data, range 0–50%) applies to construction items; temporary rent is excluded unless `contingencyIncludesRent`. Cash reserve is a separate use.

**Mortgage:** blended annual rate, term in years, LTV cap (fraction of purchase price). `mortgage = max(0, totalUses − totalNetSources)`; standard annuity monthly payment; a negative gap shows as a **surplus**.

## 4. Purchase tax (מס רכישה)

Mode toggle: **single home** (default) or **additional home** (what happens if the current home is not sold within the replacement window, 24 months for 2026 purchases). Brackets live in `src/calc/config/purchaseTax.ts` (public figures, verify the top single bracket and the additional brackets with the Tax Authority). Show the difference between the modes as a highlighted risk line: "אם המכירה תחמיץ את חלון הזמן: +X ₪".

## 5. Screens

Main view, top to bottom:
1. **Headline numbers:** mortgage needed, monthly payment, LTV (red when over the cap), surplus or shortfall.
2. **Uses vs. Sources:** two stacked bars side by side on the same scale. Uses: purchase, purchase tax, lawyer+misc, renovation, contingency, reserve. Sources: net from sale, RSUs, study funds, each savings row, custom sources, then the **mortgage segment** drawn distinctly (hatched or outlined) as the plug. Hover/tap a segment → gross, tax, net.
3. **Inputs panel:** collapsible groups (מכירה, RSU, חסכונות, קנייה, שיפוץ, משכנתא), live updates, no submit button.
4. **Sensitivity (tornado):** sale price ±100K, renovation low/high, USD/ILS ±0.15, RSU tax 30–40%, contingency 15–35%: how much each swings the mortgage, sorted by swing.

**Scenarios:** save, rename, duplicate, delete; stored in `data/scenarios.json`; three presets seeded from `defaults.presets` on first run (פסימי / ריאלי / אופטימי). **Compare view:** headline numbers for 2–3 scenarios side by side plus their mortgage bars.

**Footer:** version, and the disclaimer "הערכות בלבד. לא ייעוץ פיננסי או ייעוץ מס. יש לאמת מסים עם עו\"ד או רו\"ח ומימון עם יועץ משכנתאות."

## 6. Sanity values (public arithmetic, fine to pin in tests)

- Purchase tax on 7,000,000 as a single home: **273,886**. (Public bracket arithmetic. The original handover spec pinned the owner's actual price; it was replaced here so the real price stays out of git.)
- Mortgage payment: 1,000,000 at 5% over 25 years → **≈ 5,846** per month.
- Capital gains: tests use the example file's numbers plus hand-built cases (below ceiling → 0; negative real gain → 0).

## 7. Acceptance criteria

- [ ] Unit tests: `purchaseTax(7_000_000, 'single') === 273_886` (rounded), a value inside each bracket, and the additional-home mode.
- [ ] Unit tests for capital gains: below the ceiling (0), a normal case, negative real gain (0).
- [ ] Unit test for the annuity payment (1,000,000 / 5% / 25y ≈ 5,846).
- [ ] Every input change updates all outputs immediately; no submit button.
- [ ] Toggling a source off removes it from the sources bar and raises the mortgage by exactly its net.
- [ ] Scenarios survive a reload; export then import on another browser reproduces them.
- [ ] Works on a phone screen, RTL throughout.
- [ ] `npm run check:privacy` passes: no amount from the local defaults appears in tracked files.

## 8. Out of scope (later)

Cash-flow timeline (deposit, payments, construction stages vs. sale proceeds, bridge financing); mortgage track mix (prime / fixed / CPI-linked); live FX and stock price.
