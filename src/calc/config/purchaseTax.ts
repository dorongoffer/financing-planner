/**
 * Purchase tax (מס רכישה) brackets, 2026, frozen. Public figures, safe to commit.
 * TODO(owner): verify the top single-home threshold and the additional-home brackets against the Tax Authority.
 */
export interface TaxBracket {
  /** Upper bound of the bracket in ILS; Infinity for the last one. */
  upTo: number;
  rate: number;
}

export const PURCHASE_TAX_SINGLE_2026: TaxBracket[] = [
  { upTo: 1_978_745, rate: 0 },
  { upTo: 2_347_040, rate: 0.035 },
  { upTo: 6_055_070, rate: 0.05 },
  { upTo: 20_183_565, rate: 0.08 },
  { upTo: Infinity, rate: 0.1 },
];

export const PURCHASE_TAX_ADDITIONAL_2026: TaxBracket[] = [
  { upTo: 6_055_070, rate: 0.08 },
  { upTo: Infinity, rate: 0.1 },
];

/** Replacement window for upgraders buying in 2026, in months. */
export const REPLACEMENT_WINDOW_MONTHS = 24;
