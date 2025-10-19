const currencySymbols: Record<string, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  AUD: 'A$',
  CAD: 'C$',
  JPY: '¥',
  AED: 'د.إ',
}

export function formatCurrency(amount: number, currency: string = 'INR', locale: string = 'en-IN') {
  const symbol = currencySymbols[currency] || currencySymbols.INR
  if (currency === 'INR' && locale === 'en-IN') {
    return `${symbol}${amount.toLocaleString('en-IN')}`
  }
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatAmount(amount: number, locale: string = 'en-IN') {
  return amount.toLocaleString(locale)
}

export function getCurrencySymbol(currency: string = 'INR') {
  return currencySymbols[currency] || currencySymbols.INR
}

export function formatCurrencyWithSymbol(amount: number, currency: string = 'INR') {
  const symbol = getCurrencySymbol(currency)
  return `${symbol} ${amount.toLocaleString('en-IN')}`
}
