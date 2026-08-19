export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  CAD: '$',
  AUD: '$',
  INR: '₹',
  JPY: '¥',
  CNY: '¥',
  CHF: 'Fr',
  MXN: '$',
  BRL: 'R$',
  RUB: '₽',
  KRW: '₩',
  SGD: '$',
  HKD: '$',
  NZD: '$',
  ZAR: 'R',
  TRY: '₺',
  SEK: 'kr',
  NOK: 'kr',
  DKK: 'kr',
  PLN: 'zł',
  THB: '฿',
  IDR: 'Rp',
  MYR: 'RM',
  PHP: '₱',
  VND: '₫',
  AED: 'د.إ',
  SAR: '﷼',
  EGP: 'E£',
  NGN: '₦',
  KES: 'KSh',
  GHS: '₵',
  ZMW: 'ZK',
};

export const getCurrencySymbol = (currencyCode: string): string => {
  return CURRENCY_SYMBOLS[currencyCode] || '$';
};

export const formatCurrency = (
  amount: number,
  currencyCode: string = 'USD',
  locale: string = 'en-US'
): string => {
  const symbol = getCurrencySymbol(currencyCode);
  return `${symbol}${amount.toFixed(2)}`;
};

export const formatCurrencyWithLocale = (
  amount: number,
  currencyCode: string = 'USD',
  locale: string = 'en-US'
): string => {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
    }).format(amount);
  } catch (error) {
    // Fallback to simple formatting if Intl fails
    return formatCurrency(amount, currencyCode, locale);
  }
};
