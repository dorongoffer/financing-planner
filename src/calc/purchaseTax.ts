import {
  PURCHASE_TAX_ADDITIONAL_2026,
  PURCHASE_TAX_SINGLE_2026,
  type TaxBracket,
} from './config/purchaseTax.js';
import type { PurchaseTaxMode } from './types.js';

function marginal(price: number, brackets: TaxBracket[]): number {
  let tax = 0;
  let lower = 0;
  for (const b of brackets) {
    if (price <= lower) break;
    tax += (Math.min(price, b.upTo) - lower) * b.rate;
    lower = b.upTo;
  }
  return tax;
}

/** Purchase tax by marginal brackets. Unrounded. */
export function purchaseTax(price: number, mode: PurchaseTaxMode): number {
  return marginal(Math.max(0, price), mode === 'single' ? PURCHASE_TAX_SINGLE_2026 : PURCHASE_TAX_ADDITIONAL_2026);
}

export function purchaseTaxBoth(price: number): { single: number; additional: number; risk: number } {
  const single = purchaseTax(price, 'single');
  const additional = purchaseTax(price, 'additional');
  return { single, additional, risk: additional - single };
}
