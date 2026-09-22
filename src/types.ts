export type Currency = 'UZS' | 'USD' | 'EUR';

export type CardType = 'humo' | 'uzcard' | 'visa' | 'mastercard';

export interface BankCard {
  id: string;
  cardNumber: string;
  cardHolder: string;
  cardName: string;
  cardType: CardType;
  balance: number;
  currency: Currency;
  expiryDate: string;
  cvv: string;
  isFrozen: boolean;
  colorGradient: string;
  dailyLimit: number;
  spentToday: number;
  isVirtual?: boolean;
}

export type TransactionType = 'transfer_out' | 'transfer_in' | 'payment' | 'exchange' | 'deposit';

export type PaymentCategory = 
  | 'mobile' 
  | 'utility' 
  | 'internet' 
  | 'government' 
  | 'entertainment' 
  | 'shopping' 
  | 'transfer';

export interface Transaction {
  id: string;
  cardId: string;
  type: TransactionType;
  category: PaymentCategory;
  title: string;
  description: string;
  amount: number;
  currency: Currency;
  fee: number;
  recipientCard?: string;
  recipientName?: string;
  date: string;
  timestamp: number;
  status: 'completed' | 'processing' | 'failed';
  receiptNumber: string;
}

export interface QuickContact {
  id: string;
  name: string;
  cardNumber: string;
  cardType: CardType;
  phone: string;
  avatarColor: string;
  bankName: string;
}

export type Department = 
  | 'Boshqaruv'
  | 'Kassa va Operatsiyalar'
  | 'Kreditlash bo\'limi'
  | 'IT va Axborot xavfsizligi'
  | 'Mijozlarga xizmat'
  | 'Buxgalteriya va Audit'
  | 'Valyuta nazorati';

export type EmployeeStatus = 'active' | 'on_break' | 'late' | 'left' | 'absent' | 'vacation';

export interface Employee {
  id: string;
  pin: string; // 4-digit PIN for Kiosk quick check-in
  fullName: string;
  role: string;
  department: Department;
  phone: string;
  email: string;
  avatar: string;
  hireDate: string;
  shiftStartTime: string; // e.g. "09:00"
  shiftEndTime: string;   // e.g. "18:00"
  status: EmployeeStatus;
  currentCheckInTime?: string;
  currentCheckOutTime?: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  department: Department;
  date: string; // YYYY-MM-DD
  checkInTime: string; // HH:MM:SS or HH:MM
  checkOutTime?: string;
  status: 'on_time' | 'late' | 'early_leave' | 'absent' | 'excused';
  lateMinutes: number;
  workedHours?: number;
  note?: string;
  method: 'Kiosk' | 'FaceID' | 'QR-Kod' | 'AdminManual';
}

export interface CurrencyRate {
  code: Currency | 'RUB';
  name: string;
  buy: number;
  sell: number;
  diff: number; // positive or negative change
}
