import { describe, expect, it } from 'vitest';
import { compute } from './compute.js';
import { applyOverrides } from './presets.js';
import { sensitivity } from './sensitivity.js';
import { exampleDefaults, exampleInputs } from './testFixtures.js';
import { formatIls, formatPct } from './format.js';

describe('compute', () => {
  it('mortgage is the plug: uses minus enabled net sources', () => {
    const r = compute(exampleInputs());
    expect(r.mortgage).toBeCloseTo(Math.max(0, r.totalUses - r.totalNetSources), 6);
    expect(r.totalUses).toBeCloseTo(r.uses.reduce((s, u) => s + u.amount, 0), 6);
    expect(r.ltv).toBeCloseTo(r.mortgage / 5_000_000, 9);
  });

  it('disabled sources are excluded from the total', () => {
    const r = compute(exampleInputs());
    const off = r.sources.find((s) => s.id === 'sv3');
    expect(off?.enabled).toBe(false);
    const enabledNet = r.sources.filter((s) => s.enabled).reduce((a, s) => a + s.net, 0);
    expect(r.totalNetSources).toBeCloseTo(enabledNet, 6);
  });

  it('toggling a source off raises the mortgage by exactly its net', () => {
    const inputs = exampleInputs();
    const before = compute(inputs);
    const rsuNet = before.sources.find((s) => s.id === 'rsu')!.net;
    const after = compute(applyOverrides(inputs, { 'rsu.enabled': false }));
    // the example has a positive mortgage both before and after, so no clamping
    expect(before.mortgage).toBeGreaterThan(0);
    expect(after.mortgage - before.mortgage).toBeCloseTo(rsuNet, 6);
  });

  it('RSU line: gross = USD x rate, tax = gross x rate', () => {
    const l = compute(exampleInputs()).sources.find((s) => s.id === 'rsu')!;
    expect(l.gross).toBeCloseTo(200_000 * 3.5, 6);
    expect(l.tax).toBeCloseTo(200_000 * 3.5 * 0.35, 6);
  });

  it('contingency excludes temporary rent by default, includes it when asked', () => {
    const inputs = exampleInputs();
    const items = inputs.renovation.items;
    const construction = items.filter((i) => !i.isTemporaryRent).reduce((s, i) => s + i.mid, 0);
    const rent = items.filter((i) => i.isTemporaryRent).reduce((s, i) => s + i.mid, 0);
    const get = (i: typeof inputs) => compute(i).uses.find((u) => u.id === 'contingency')!.amount;
    expect(get(inputs)).toBeCloseTo(0.25 * construction, 6);
    const inc = applyOverrides(inputs, { 'renovation.contingencyIncludesRent': true });
    expect(get(inc)).toBeCloseTo(0.25 * (construction + rent), 6);
  });

  it('a renovation override replaces the level value', () => {
    const inputs = exampleInputs();
    const base = compute(inputs).renovationBase;
    const o = structuredClone(inputs);
    o.renovation.items[0]!.override = 1;
    expect(compute(o).renovationBase).toBeCloseTo(base - 550_000 + 1, 6);
  });

  it('additional tax mode raises uses by the risk amount', () => {
    const inputs = exampleInputs();
    const a = compute(inputs);
    const b = compute(applyOverrides(inputs, { 'purchase.taxMode': 'additional' }));
    expect(b.totalUses - a.totalUses).toBeCloseTo(a.purchaseTaxRisk, 6);
  });

  it('surplus appears when sources exceed uses', () => {
    const r = compute(applyOverrides(exampleInputs(), { 'purchase.price': 1_000_000 }));
    expect(r.mortgage).toBe(0);
    expect(r.surplus).toBeGreaterThan(0);
  });
});

describe('sensitivity', () => {
  it('has five rows sorted by swing and consistent with the base', () => {
    const inputs = exampleInputs();
    const base = compute(inputs).mortgage;
    const rows = sensitivity(inputs);
    expect(rows).toHaveLength(5);
    const swings = rows.map((r) => r.mortgageHigh - r.mortgageLow);
    expect([...swings].sort((a, b) => b - a)).toEqual(swings);
    for (const r of rows) {
      expect(r.deltaLow).toBeCloseTo(r.mortgageLow - base, 6);
      expect(r.deltaHigh).toBeCloseTo(r.mortgageHigh - base, 6);
      expect(r.mortgageLow).toBeLessThanOrEqual(r.mortgageHigh);
    }
  });
});

describe('applyOverrides', () => {
  it('does not mutate and applies presets', () => {
    const d = exampleDefaults();
    const snapshot = JSON.stringify(d.inputs);
    const out = applyOverrides(d.inputs, d.presets[0]!.overrides);
    expect(JSON.stringify(d.inputs)).toBe(snapshot);
    expect(out.sale.salePrice).toBe(5_900_000);
    expect(out.renovation.level).toBe('high');
  });
});

describe('format', () => {
  it('formats amounts and percentages', () => {
    expect(formatIls(1234567)).toContain('1,234,567');
    expect(formatIls(1234567)).toContain('₪');
    expect(formatPct(0.25)).toBe('25%');
    expect(formatPct(0.035)).toBe('3.5%');
  });
});
