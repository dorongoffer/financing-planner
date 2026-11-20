/** Hebrew labels that calc results carry (source / use / sensitivity names). Re-exported through ui/i18n/he.ts. */
export const calcLabels = {
  src: { sale: 'מכירת הדירה', rsu: 'מניות RSU' },
  use: {
    purchase: 'מחיר הדירה',
    purchaseTax: 'מס רכישה',
    fees: 'עו"ד ושונות',
    renovation: 'שיפוץ',
    contingency: 'בלתי צפוי',
    reserve: 'רזרבת מזומן',
  },
  sens: {
    salePrice: 'מחיר מכירה ±100,000',
    renovation: 'רמת שיפוץ (נמוך / גבוה)',
    usdIls: 'שער דולר ±0.15',
    rsuTax: 'מס על RSU (30% / 40%)',
    contingency: 'בלתי צפוי (15% / 35%)',
    levelLow: 'נמוך',
    levelHigh: 'גבוה',
  },
} as const;
