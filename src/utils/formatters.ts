import { CardType, Currency } from '../types';

export function formatCurrency(amount: number, currency: Currency): string {
  if (currency === 'UZS') {
    return new Intl.NumberFormat('uz-UZ').format(Math.round(amount)) + " so'm";
  }
  if (currency === 'USD') {
    return '$' + new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
  }
  if (currency === 'EUR') {
    return '€' + new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
  }
  return `${amount} ${currency}`;
}

export function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, '');
  const chunks = digits.match(/.{1,4}/g);
  return chunks ? chunks.join(' ') : digits;
}

export function maskCardNumber(cardNumber: string): string {
  const clean = cardNumber.replace(/\s+/g, '');
  if (clean.length < 12) return cardNumber;
  const first4 = clean.slice(0, 4);
  const last4 = clean.slice(-4);
  return `${first4} •••• •••• ${last4}`;
}

export function detectCardType(input: string): CardType {
  const digits = input.replace(/\D/g, '');
  if (digits.startsWith('9860')) return 'humo';
  if (digits.startsWith('8600')) return 'uzcard';
  if (digits.startsWith('4')) return 'visa';
  if (digits.startsWith('5')) return 'mastercard';
  return 'humo';
}

export function getCardBadge(type: CardType): { name: string; bg: string; text: string } {
  switch (type) {
    case 'humo':
      return { name: 'HUMO', bg: 'bg-amber-500/20 text-amber-300 border-amber-500/30', text: 'text-amber-400' };
    case 'uzcard':
      return { name: 'UZCARD', bg: 'bg-blue-500/20 text-blue-300 border-blue-500/30', text: 'text-blue-400' };
    case 'visa':
      return { name: 'VISA', bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', text: 'text-emerald-400' };
    case 'mastercard':
      return { name: 'MASTERCARD', bg: 'bg-rose-500/20 text-rose-300 border-rose-500/30', text: 'text-rose-400' };
  }
}

export function calculateLateMinutes(checkInTimeStr: string, shiftTimeStr: string = '09:00'): number {
  const [shiftHour, shiftMin] = shiftTimeStr.split(':').map(Number);
  const [inHour, inMin] = checkInTimeStr.split(':').map(Number);

  const shiftTotalMin = shiftHour * 60 + shiftMin;
  const inTotalMin = inHour * 60 + inMin;

  const diff = inTotalMin - shiftTotalMin;
  return diff > 0 ? diff : 0;
}
