import { capitalGains, netFromSale } from './capitalGains.js';
import { calcLabels as he } from './labels.js';
import type { Inputs, SourceLine } from './types.js';

export function sourceLines(inputs: Inputs): SourceLine[] {
  const lines: SourceLine[] = [];
  const { sale, rsu } = inputs;
  const cg = capitalGains(sale);
  lines.push({
    id: 'sale',
    kind: 'sale',
    label: he.src.sale,
    enabled: sale.enabled,
    gross: sale.salePrice,
    // tax = capital-gains tax; payoff and fees are further deductions between gross and net
    tax: cg.tax,
    net: netFromSale(sale),
  });
  const rsuGross = rsu.valueUsd * rsu.usdIls;
  const rsuTax = rsuGross * rsu.taxRate;
  lines.push({ id: 'rsu', kind: 'rsu', label: he.src.rsu, enabled: rsu.enabled, gross: rsuGross, tax: rsuTax, net: rsuGross - rsuTax });
  for (const f of inputs.studyFunds) {
    lines.push({ id: f.id, kind: 'studyFund', label: `${f.name} (${f.holder})`, enabled: f.enabled, gross: f.amount, tax: 0, net: f.amount });
  }
  for (const s of inputs.savings) {
    const tax = s.taxableGain * s.taxRate;
    lines.push({ id: s.id, kind: 'savings', label: s.name, enabled: s.enabled, gross: s.gross, tax, net: s.gross - tax });
  }
  for (const c of inputs.custom) {
    lines.push({ id: c.id, kind: 'custom', label: c.name, enabled: c.enabled, gross: c.amount, tax: 0, net: c.amount });
  }
  return lines;
}

export function totalNetSources(lines: SourceLine[]): number {
  return lines.reduce((sum, l) => sum + (l.enabled ? l.net : 0), 0);
}
