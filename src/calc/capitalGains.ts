import type { CapitalGainsBreakdown, SaleInputs } from './types.js';

export function capitalGains(s: SaleInputs): CapitalGainsBreakdown {
  const sellerLawyer = s.salePrice * s.sellerLawyerPct * (1 + s.vatPct);
  const realtor = s.realtorEnabled ? s.salePrice * s.realtorPct * (1 + s.vatPct) : 0;
  const indexedPurchasePrice = s.purchasePrice * s.cpiFactor;
  const deductions =
    s.purchaseTaxPaid * s.cpiFactor + s.otherDeductibles + s.improvements + sellerLawyer + realtor;
  const realGain = s.salePrice - indexedPurchasePrice - deductions;
  const taxableShare = s.salePrice > 0 ? Math.max(0, (s.salePrice - s.exemptionCeiling) / s.salePrice) : 0;
  const tax = Math.max(0, realGain) * taxableShare * s.capitalGainsRate;
  return { sellerLawyer, realtor, indexedPurchasePrice, deductions, realGain, taxableShare, tax };
}

export function netFromSale(s: SaleInputs): number {
  const c = capitalGains(s);
  return s.salePrice - s.mortgagePayoff - c.sellerLawyer - c.realtor - c.tax;
}
