import { purchaseTax } from './purchaseTax.js';
import { calcLabels as he } from './labels.js';
import type { Inputs, RenovationItem, RenovationInputs, UseLine } from './types.js';

export function itemAmount(item: RenovationItem, level: RenovationInputs['level']): number {
  return item.override ?? item[level];
}

export function renovationParts(r: RenovationInputs): { construction: number; rent: number } {
  let construction = 0;
  let rent = 0;
  for (const it of r.items) {
    const a = itemAmount(it, r.level);
    if (it.isTemporaryRent) rent += a;
    else construction += a;
  }
  return { construction, rent };
}

export function useLines(inputs: Inputs): UseLine[] {
  const { purchase: p, renovation: r } = inputs;
  const { construction, rent } = renovationParts(r);
  const fees = p.price * p.buyerLawyerPct * (1 + p.vatPct) + p.price * p.realtorPct * (1 + p.vatPct) + p.misc;
  const contingency = r.contingencyPct * (construction + (r.contingencyIncludesRent ? rent : 0));
  return [
    { id: 'purchase', label: he.use.purchase, amount: p.price },
    { id: 'purchaseTax', label: he.use.purchaseTax, amount: purchaseTax(p.price, p.taxMode) },
    { id: 'fees', label: he.use.fees, amount: fees },
    { id: 'renovation', label: he.use.renovation, amount: construction + rent },
    { id: 'contingency', label: he.use.contingency, amount: contingency },
    { id: 'reserve', label: he.use.reserve, amount: inputs.cashReserve },
  ];
}
