/**
 * Input model for the financing planner. Every number is an editable estimate.
 * Percentages are fractions (0.05 = 5%). Amounts are ILS unless the field says USD.
 * The real defaults live in data/defaults.local.json (gitignored); data/defaults.example.json has fake numbers.
 */

export type RenovationLevel = 'low' | 'mid' | 'high';
export type PurchaseTaxMode = 'single' | 'additional';

export interface SaleInputs {
  enabled: boolean;
  salePrice: number;
  mortgagePayoff: number;
  /** Seller lawyer fee as a fraction of the sale price, before VAT. */
  sellerLawyerPct: number;
  vatPct: number;
  realtorEnabled: boolean;
  /** Realtor fee as a fraction of the sale price, before VAT. */
  realtorPct: number;
  /** Original purchase price of the current home. */
  purchasePrice: number;
  /** CPI factor from the original purchase to the sale. */
  cpiFactor: number;
  /** Purchase tax paid when the current home was bought; deductible, indexed by cpiFactor. */
  purchaseTaxPaid: number;
  /** Other deductible expenses (purchase lawyer etc.), not indexed. */
  otherDeductibles: number;
  /** Improvements since purchase, deductible, not indexed. */
  improvements: number;
  /** Capital-gains exemption ceiling (תקרת פטור). */
  exemptionCeiling: number;
  capitalGainsRate: number;
}

export interface RsuInputs {
  enabled: boolean;
  valueUsd: number;
  usdIls: number;
  /** Effective tax rate on the whole value. */
  taxRate: number;
}

export interface StudyFund {
  id: string;
  /** Display name of the holder (a person). */
  holder: string;
  name: string;
  amount: number;
  enabled: boolean;
}

export interface SavingsSource {
  id: string;
  name: string;
  gross: number;
  /** The part of gross that is taxable gain. */
  taxableGain: number;
  taxRate: number;
  enabled: boolean;
}

export interface CustomSource {
  id: string;
  name: string;
  /** Net amount; custom sources carry no tax. */
  amount: number;
  enabled: boolean;
}

export interface PurchaseInputs {
  price: number;
  taxMode: PurchaseTaxMode;
  buyerLawyerPct: number;
  vatPct: number;
  /** Realtor fee on the purchase as a fraction of price, before VAT. 0 = none. */
  realtorPct: number;
  /** Appraisal, registration, inspection… a flat amount. */
  misc: number;
}

export interface RenovationItem {
  id: string;
  name: string;
  low: number;
  mid: number;
  high: number;
  /** When set, replaces the value chosen by `level`. */
  override: number | null;
  /** Temporary rent is excluded from contingency unless `contingencyIncludesRent`. */
  isTemporaryRent: boolean;
}

export interface RenovationInputs {
  items: RenovationItem[];
  level: RenovationLevel;
  /** 0–0.5 */
  contingencyPct: number;
  contingencyIncludesRent: boolean;
}

export interface MortgageInputs {
  /** Blended annual interest rate. */
  annualRate: number;
  termYears: number;
  /** Loan-to-value cap as a fraction of the purchase price. */
  ltvCap: number;
}

export interface Inputs {
  sale: SaleInputs;
  rsu: RsuInputs;
  studyFunds: StudyFund[];
  savings: SavingsSource[];
  custom: CustomSource[];
  purchase: PurchaseInputs;
  renovation: RenovationInputs;
  /** Cash kept out of the deal; counted as a use. */
  cashReserve: number;
  mortgage: MortgageInputs;
}

/** A preset = a name plus dot-path overrides on the default inputs, e.g. { "sale.salePrice": 1 }. */
export interface Preset {
  name: string;
  overrides: Record<string, number | string | boolean>;
}

export interface DefaultsFile {
  inputs: Inputs;
  presets: Preset[];
  /** Free-text notes shown in the UI (e.g. "figures from older statements"). */
  notes?: Record<string, string>;
}

// ---- Results ----

export type SourceKind = 'sale' | 'rsu' | 'studyFund' | 'savings' | 'custom';

export interface SourceLine {
  id: string;
  kind: SourceKind;
  label: string;
  enabled: boolean;
  gross: number;
  tax: number;
  net: number;
}

export type UseKind = 'purchase' | 'purchaseTax' | 'fees' | 'renovation' | 'contingency' | 'reserve';

export interface UseLine {
  id: UseKind;
  label: string;
  amount: number;
}

export interface CapitalGainsBreakdown {
  sellerLawyer: number;
  realtor: number;
  indexedPurchasePrice: number;
  deductions: number;
  realGain: number;
  taxableShare: number;
  tax: number;
}

export interface Results {
  sources: SourceLine[];
  /** Sum of net over enabled sources. */
  totalNetSources: number;
  uses: UseLine[];
  totalUses: number;
  /** max(0, totalUses - totalNetSources) */
  mortgage: number;
  /** max(0, totalNetSources - totalUses) */
  surplus: number;
  monthlyPayment: number;
  /** mortgage / purchase price */
  ltv: number;
  ltvOverCap: boolean;
  purchaseTax: number;
  purchaseTaxSingle: number;
  purchaseTaxAdditional: number;
  /** additional − single: what slipping past the replacement window costs. */
  purchaseTaxRisk: number;
  capitalGains: CapitalGainsBreakdown;
  renovationBase: number;
}

export interface SensitivityRow {
  id: string;
  label: string;
  /** Mortgage with the "low" variant of this input. */
  mortgageLow: number;
  /** Mortgage with the "high" variant. */
  mortgageHigh: number;
  /** Difference vs. the base mortgage, signed. */
  deltaLow: number;
  deltaHigh: number;
  /** Human-readable variant descriptions, Hebrew. */
  lowLabel: string;
  highLabel: string;
}
