const nf = new Intl.NumberFormat('he-IL', { maximumFractionDigits: 0 });

export function formatNumber(n: number): string {
  return nf.format(Math.round(n));
}

export function formatIls(n: number): string {
  return `${formatNumber(n)} ₪`;
}

/** 0.255 -> "25.5%", 0.25 -> "25%". */
export function formatPct(fraction: number, digits = 1): string {
  const v = Number((fraction * 100).toFixed(digits));
  return `${v}%`;
}
