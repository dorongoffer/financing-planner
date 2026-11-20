import { compute } from './compute.js';
import { applyOverrides } from './presets.js';
import { formatIls } from './format.js';
import { calcLabels as he } from './labels.js';
import type { Inputs, SensitivityRow } from './types.js';

type Overrides = Record<string, number | string | boolean>;
interface Variant { label: string; overrides: Overrides }

/**
 * Mortgage swing for each unknown. "low" is the variant that yields the lower mortgage,
 * "high" the one that yields the higher mortgage (for the sale price, low = +100K).
 */
export function sensitivity(inputs: Inputs): SensitivityRow[] {
  const base = compute(inputs).mortgage;
  const sp = inputs.sale.salePrice;
  const fx = inputs.rsu.usdIls;
  const defs: { id: string; label: string; low: Variant; high: Variant }[] = [
    {
      id: 'salePrice', label: he.sens.salePrice,
      low: { label: `+${formatIls(100_000)}`, overrides: { 'sale.salePrice': sp + 100_000 } },
      high: { label: `−${formatIls(100_000)}`, overrides: { 'sale.salePrice': sp - 100_000 } },
    },
    {
      id: 'renovation', label: he.sens.renovation,
      low: { label: he.sens.levelLow, overrides: { 'renovation.level': 'low' } },
      high: { label: he.sens.levelHigh, overrides: { 'renovation.level': 'high' } },
    },
    {
      id: 'usdIls', label: he.sens.usdIls,
      low: { label: String(+(fx - 0.15).toFixed(2)), overrides: { 'rsu.usdIls': fx - 0.15 } },
      high: { label: String(+(fx + 0.15).toFixed(2)), overrides: { 'rsu.usdIls': fx + 0.15 } },
    },
    {
      id: 'rsuTax', label: he.sens.rsuTax,
      low: { label: '30%', overrides: { 'rsu.taxRate': 0.3 } },
      high: { label: '40%', overrides: { 'rsu.taxRate': 0.4 } },
    },
    {
      id: 'contingency', label: he.sens.contingency,
      low: { label: '15%', overrides: { 'renovation.contingencyPct': 0.15 } },
      high: { label: '35%', overrides: { 'renovation.contingencyPct': 0.35 } },
    },
  ];
  const rows = defs.map((d): SensitivityRow => {
    const a = compute(applyOverrides(inputs, d.low.overrides)).mortgage;
    const b = compute(applyOverrides(inputs, d.high.overrides)).mortgage;
    // Order by resulting mortgage so mortgageLow <= mortgageHigh regardless of direction.
    const lowIsA = a <= b;
    const lo = lowIsA ? d.low : d.high;
    const hi = lowIsA ? d.high : d.low;
    const mortgageLow = Math.min(a, b);
    const mortgageHigh = Math.max(a, b);
    return {
      id: d.id, label: d.label, mortgageLow, mortgageHigh,
      deltaLow: mortgageLow - base, deltaHigh: mortgageHigh - base,
      lowLabel: lo.label, highLabel: hi.label,
    };
  });
  return rows.sort((x, y) => (y.mortgageHigh - y.mortgageLow) - (x.mortgageHigh - x.mortgageLow));
}
