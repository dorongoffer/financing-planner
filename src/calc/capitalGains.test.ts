import { describe, expect, it } from 'vitest';
import { capitalGains, netFromSale } from './capitalGains.js';
import { exampleInputs } from './testFixtures.js';

describe('capitalGains', () => {
  it('is zero when the sale price is below the exemption ceiling', () => {
    const s = { ...exampleInputs().sale, salePrice: 4_500_000 };
    const c = capitalGains(s);
    expect(c.taxableShare).toBe(0);
    expect(c.tax).toBe(0);
  });

  it('example case is internally consistent', () => {
    const s = exampleInputs().sale;
    const c = capitalGains(s);
    expect(c.sellerLawyer).toBeCloseTo(s.salePrice * s.sellerLawyerPct * (1 + s.vatPct), 6);
    expect(c.realtor).toBe(0);
    expect(c.indexedPurchasePrice).toBeCloseTo(s.purchasePrice * s.cpiFactor, 6);
    expect(c.realGain).toBeCloseTo(s.salePrice - c.indexedPurchasePrice - c.deductions, 6);
    expect(c.taxableShare).toBeCloseTo((s.salePrice - s.exemptionCeiling) / s.salePrice, 9);
    expect(c.tax).toBeCloseTo(Math.max(0, c.realGain) * c.taxableShare * s.capitalGainsRate, 6);
    expect(c.tax).toBeGreaterThan(0);
    expect(netFromSale(s)).toBeCloseTo(s.salePrice - s.mortgagePayoff - c.sellerLawyer - c.realtor - c.tax, 6);
  });

  it('realtor toggle adds the fee including VAT', () => {
    const s = { ...exampleInputs().sale, realtorEnabled: true };
    const c = capitalGains(s);
    expect(c.realtor).toBeCloseTo(s.salePrice * s.realtorPct * (1 + s.vatPct), 6);
  });

  it('negative real gain gives zero tax', () => {
    const s = { ...exampleInputs().sale, purchasePrice: 7_000_000 };
    const c = capitalGains(s);
    expect(c.realGain).toBeLessThan(0);
    expect(c.tax).toBe(0);
  });
});
