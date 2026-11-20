import { describe, expect, it } from 'vitest';
import { annuityPayment } from './mortgage.js';

describe('annuityPayment', () => {
  it('1,000,000 at 5% over 25 years is about 5,846 a month', () => {
    expect(Math.abs(annuityPayment(1_000_000, 0.05, 25) - 5_846)).toBeLessThanOrEqual(1);
  });
  it('rate 0 divides evenly', () => {
    expect(annuityPayment(1_200_000, 0, 10)).toBeCloseTo(10_000, 6);
  });
  it('zero principal is zero', () => {
    expect(annuityPayment(0, 0.05, 25)).toBe(0);
  });
});
