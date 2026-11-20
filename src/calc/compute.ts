import { capitalGains } from './capitalGains.js';
import { annuityPayment } from './mortgage.js';
import { purchaseTaxBoth } from './purchaseTax.js';
import { sourceLines, totalNetSources } from './sources.js';
import { renovationParts, useLines } from './uses.js';
import type { Inputs, Results } from './types.js';

export function compute(inputs: Inputs): Results {
  const sources = sourceLines(inputs);
  const netSources = totalNetSources(sources);
  const uses = useLines(inputs);
  const totalUses = uses.reduce((s, u) => s + u.amount, 0);
  const mortgage = Math.max(0, totalUses - netSources);
  const surplus = Math.max(0, netSources - totalUses);
  const price = inputs.purchase.price;
  const ltv = price > 0 ? mortgage / price : 0;
  const both = purchaseTaxBoth(price);
  const { construction, rent } = renovationParts(inputs.renovation);
  return {
    sources,
    totalNetSources: netSources,
    uses,
    totalUses,
    mortgage,
    surplus,
    monthlyPayment: annuityPayment(mortgage, inputs.mortgage.annualRate, inputs.mortgage.termYears),
    ltv,
    ltvOverCap: ltv > inputs.mortgage.ltvCap,
    purchaseTax: inputs.purchase.taxMode === 'single' ? both.single : both.additional,
    purchaseTaxSingle: both.single,
    purchaseTaxAdditional: both.additional,
    purchaseTaxRisk: both.risk,
    capitalGains: capitalGains(inputs.sale),
    renovationBase: construction + rent,
  };
}
