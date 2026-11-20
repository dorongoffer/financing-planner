import { describe, expect, it } from 'vitest';
import { purchaseTax, purchaseTaxBoth } from './purchaseTax.js';

describe('purchaseTax', () => {
  it('matches the public sanity value for 7,000,000 single', () => {
    expect(Math.round(purchaseTax(7_000_000, 'single'))).toBe(273_886);
  });
  it('is 0 below the first bracket', () => {
    expect(purchaseTax(1_500_000, 'single')).toBe(0);
  });
  it('charges 3.5% inside the second bracket', () => {
    expect(purchaseTax(2_000_000, 'single')).toBeCloseTo((2_000_000 - 1_978_745) * 0.035, 6);
  });
  it('charges 5% inside the third bracket', () => {
    const expected = (2_347_040 - 1_978_745) * 0.035 + (4_000_000 - 2_347_040) * 0.05;
    expect(purchaseTax(4_000_000, 'single')).toBeCloseTo(expected, 6);
  });
  it('charges 8% inside the fourth bracket', () => {
    const base = (2_347_040 - 1_978_745) * 0.035 + (6_055_070 - 2_347_040) * 0.05;
    expect(purchaseTax(10_000_000, 'single')).toBeCloseTo(base + (10_000_000 - 6_055_070) * 0.08, 6);
  });
  it('charges 10% in the top bracket', () => {
    const base =
      (2_347_040 - 1_978_745) * 0.035 + (6_055_070 - 2_347_040) * 0.05 + (20_183_565 - 6_055_070) * 0.08;
    expect(purchaseTax(25_000_000, 'single')).toBeCloseTo(base + (25_000_000 - 20_183_565) * 0.1, 6);
  });
  it('additional-home mode: 8% up to the threshold then 10%', () => {
    expect(purchaseTax(1_000_000, 'additional')).toBeCloseTo(80_000, 6);
    expect(purchaseTax(7_000_000, 'additional')).toBeCloseTo(6_055_070 * 0.08 + 944_930 * 0.1, 6);
  });
  it('both modes and the risk difference', () => {
    const b = purchaseTaxBoth(5_000_000);
    expect(b.risk).toBeCloseTo(b.additional - b.single, 9);
    expect(b.risk).toBeGreaterThan(0);
  });
  it('zero price is zero tax', () => {
    expect(purchaseTax(0, 'single')).toBe(0);
  });
});
