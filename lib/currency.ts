// Fixed exchange rate: 1 EUR = 1.95583 BGN
export const EUR_TO_BGN_RATE = 1.95583;

export type Currency = 'BGN' | 'EUR';

/**
 * Convert BGN to EUR
 */
export function bgnToEur(bgn: number): number {
  return Number((bgn / EUR_TO_BGN_RATE).toFixed(2));
}

/**
 * Convert EUR to BGN
 */
export function eurToBgn(eur: number): number {
  return Number((eur * EUR_TO_BGN_RATE).toFixed(2));
}

/**
 * Format price with currency symbol
 */
export function formatPrice(amount: number, currency: Currency): string {
  return currency === 'BGN' 
    ? `${amount.toFixed(2)} лв.`
    : `€${amount.toFixed(2)}`;
}

/**
 * Get price in requested currency
 */
export function getPrice(priceBgn: number, currency: Currency): number {
  return currency === 'BGN' ? priceBgn : bgnToEur(priceBgn);
}

/**
 * Format and display price in requested currency
 */
export function displayPrice(priceBgn: number, currency: Currency): string {
  const amount = getPrice(priceBgn, currency);
  return formatPrice(amount, currency);
}


