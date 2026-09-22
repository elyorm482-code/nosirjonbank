/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CreditCard, 
  Users, 
  Send, 
  Zap, 
  History, 
  Clock, 
  Wallet, 
  TrendingUp, 
  ShieldCheck, 
  ArrowUpRight, 
  ArrowDownLeft,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { Header } from './components/Header';
import { CardsManager } from './components/banking/CardsManager';
import { TransfersSection } from './components/banking/TransfersSection';
import { PaymentsSection } from './components/banking/PaymentsSection';
import { TransactionsHistory } from './components/banking/TransactionsHistory';
import { AttendanceDashboard } from './components/attendance/AttendanceDashboard';
import { AttendanceKiosk } from './components/attendance/AttendanceKiosk';

import { 
  BankCard, 
  Transaction, 
  Employee, 
  AttendanceRecord, 
  QuickContact, 
  Currency, 
  PaymentCategory 
} from './types';

import { 
  INITIAL_CARDS, 
  INITIAL_TRANSACTIONS, 
  INITIAL_EMPLOYEES, 
  INITIAL_ATTENDANCE_RECORDS, 
  QUICK_CONTACTS 
} from './data/mockData';

import { formatCurrency } from './utils/formatters';

export default function App() {
  // Navigation & Theme
  const [activeTab, setActiveTab] = useState<'banking' | 'attendance' | 'kiosk'>('banking');
  const [bankingSubTab, setBankingSubTab] = useState<'cards' | 'transfers' | 'payments' | 'history'>('cards');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Core State with LocalStorage Persistence
  const [cards, setCards] = useState<BankCard[]>(() => {
    const saved = localStorage.getItem('apex_cards');
    return saved ? JSON.parse(saved) : INITIAL_CARDS;
  });

  const [selectedCardId, setSelectedCardId] = useState<string>(() => {
    return cards[0]?.id || 'card-1';
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('apex_transactions');
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  const [employees, setEmployees] = useState<Employee[]>(() => {
    const saved = localStorage.getItem('apex_employees');
    return saved ? JSON.parse(saved) : INITIAL_EMPLOYEES;
  });

  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() => {
    const saved = localStorage.getItem('apex_attendance');
    return saved ? JSON.parse(saved) : INITIAL_ATTENDANCE_RECORDS;
  });

  const [quickContacts] = useState<QuickContact[]>(QUICK_CONTACTS);

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem('apex_cards', JSON.stringify(cards));
  }, [cards]);

  useEffect(() => {
    localStorage.setItem('apex_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('apex_employees', JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    localStorage.setItem('apex_attendance', JSON.stringify(attendanceRecords));
  }, [attendanceRecords]);

  // Total Net Worth Calculation (in UZS equivalent, assuming 1 USD = 12,850 UZS, 1 EUR = 13,950 UZS)
  const totalBalanceInUZS = cards.reduce((total, c) => {
    if (c.currency === 'UZS') return total + c.balance;
    if (c.currency === 'USD') return total + c.balance * 12850;
    if (c.currency === 'EUR') return total + c.balance * 13950;
    return total;
  }, 0);

  // Reset to default data
  const handleResetData = () => {
    if (window.confirm("Barcha ma'lumotlarni boshlang'ich holatga qaytarishni xohlaysizmi?")) {
      setCards(INITIAL_CARDS);
      setTransactions(INITIAL_TRANSACTIONS);
      setEmployees(INITIAL_EMPLOYEES);
      setAttendanceRecords(INITIAL_ATTENDANCE_RECORDS);
      setSelectedCardId(INITIAL_CARDS[0].id);
      localStorage.clear();
    }
  };

  // 1. Card Freeze / Unfreeze Handler
  const handleToggleFreeze = (cardId: string) => {
    setCards((prev) =>
      prev.map((c) => (c.id === cardId ? { ...c, isFrozen: !c.isFrozen } : c))
    );
  };

  // 2. Card Limit Update Handler
  const handleUpdateLimit = (cardId: string, newLimit: number) => {
    setCards((prev) =>
      prev.map((c) => (c.id === cardId ? { ...c, dailyLimit: newLimit } : c))
    );
  };

  // 3. Add New Card
  const handleAddCard = (newCardData: Omit<BankCard, 'id' | 'spentToday'>) => {
    const newId = `card-${Date.now()}`;
    const newCard: BankCard = {
      ...newCardData,
      id: newId,
      spentToday: 0,
    };
    setCards((prev) => [newCard, ...prev]);
    setSelectedCardId(newId);
  };

  // 4. Deposit / Top up
  const handleDeposit = (cardId: string, amount: number) => {
    setCards((prev) =>
      prev.map((c) => (c.id === cardId ? { ...c, balance: c.balance + amount } : c))
    );

    const targetCard = cards.find((c) => c.id === cardId);
    const receiptNum = `APX-${Math.floor(10000000 + Math.random() * 90000000)}`;

    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      cardId,
      type: 'deposit',
      category: 'transfer',
      title: 'Hisob to\'ldirildi (Depozit)',
      description: `${targetCard?.cardName || 'Karta'} hisobiga naqd/onlayn to'ldirish`,
      amount,
      currency: targetCard?.currency || 'UZS',
      fee: 0,
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      timestamp: Date.now(),
      status: 'completed',
      receiptNumber: receiptNum,
    };

    setTransactions((prev) => [newTx, ...prev]);
  };

  // 5. Money Transfer Handler
  const handleExecuteTransfer = (
    fromCardId: string,
    toCardNumber: string,
    recipientName: string,
    amount: number,
    currency: Currency,
    note?: string
  ) => {
    const sender = cards.find((c) => c.id === fromCardId);
    if (!sender) return { success: false, message: "Karta topilmadi!" };
    if (sender.isFrozen) return { success: false, message: "Karta muzlatilgan!" };
    if (sender.balance < amount) return { success: false, message: "Mablag' yetarli emas!" };

    // Deduct balance
    setCards((prev) =>
      prev.map((c) =>
        c.id === fromCardId
          ? { ...c, balance: c.balance - amount, spentToday: c.spentToday + amount }
          : c
      )
    );

    const receiptNum = `APX-${Math.floor(10000000 + Math.random() * 90000000)}`;

    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      cardId: fromCardId,
      type: 'transfer_out',
      category: 'transfer',
      title: `${recipientName}ga o'tkazma`,
      description: note || `O'tkazma: ${toCardNumber}`,
      amount,
      currency,
      fee: 0,
      recipientCard: toCardNumber,
      recipientName,
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      timestamp: Date.now(),
      status: 'completed',
      receiptNumber: receiptNum,
    };

    setTransactions((prev) => [newTx, ...prev]);
    return { success: true, message: "O'tkazma muvaffaqiyatli bajarildi!", transaction: newTx };
  };

  // 6. Currency Exchange Handler
  const handleExecuteExchange = (
    fromCardId: string,
    toCardId: string,
    amount: number,
    targetAmount: number
  ) => {
    const source = cards.find((c) => c.id === fromCardId);
    const dest = cards.find((c) => c.id === toCardId);
    if (!source || !dest) return { success: false, message: "Kartalar topilmadi" };

    setCards((prev) =>
      prev.map((c) => {
        if (c.id === fromCardId) return { ...c, balance: c.balance - amount };
        if (c.id === toCardId) return { ...c, balance: c.balance + targetAmount };
        return c;
      })
    );

    const receiptNum = `APX-${Math.floor(10000000 + Math.random() * 90000000)}`;

    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      cardId: fromCardId,
      type: 'exchange',
      category: 'transfer',
      title: `Valyuta konvertatsiyasi (${source.currency} -> ${dest.currency})`,
      description: `${formatCurrency(amount, source.currency)} -> ${formatCurrency(targetAmount, dest.currency)}`,
      amount,
      currency: source.currency,
      fee: 0,
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      timestamp: Date.now(),
      status: 'completed',
      receiptNumber: receiptNum,
    };

    setTransactions((prev) => [newTx, ...prev]);
    return { success: true, message: "Konvertatsiya bajarildi", transaction: newTx };
  };

  // 7. Payment Handler
  const handleExecutePayment = (
    fromCardId: string,
    category: PaymentCategory,
    providerName: string,
    accountNumber: string,
    amount: number
  ) => {
    const sender = cards.find((c) => c.id === fromCardId);
    if (!sender) return { success: false, message: "Karta topilmadi" };
    if (sender.balance < amount) return { success: false, message: "Mablag' yetarli emas" };

    setCards((prev) =>
      prev.map((c) =>
        c.id === fromCardId
          ? { ...c, balance: c.balance - amount, spentToday: c.spentToday + amount }
          : c
      )
    );

    const receiptNum = `APX-${Math.floor(10000000 + Math.random() * 90000000)}`;

    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      cardId: fromCardId,
      type: 'payment',
      category,
      title: providerName,
      description: `Hisob / Tel: ${accountNumber}`,
      amount,
      currency: sender.currency,
      fee: 0,
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      timestamp: Date.now(),
      status: 'completed',
      receiptNumber: receiptNum,
    };

    setTransactions((prev) => [newTx, ...prev]);
    return { success: true, message: "To'lov qabul qilindi", transaction: newTx };
  };

  // 8. Attendance Handlers
  const handleKioskCheckIn = (
    employeeId: string,
    time: string,
    isLate: boolean,
    lateMinutes: number
  ) => {
    const emp = employees.find((e) => e.id === employeeId);
    if (!emp) return;

    setEmployees((prev) =>
      prev.map((e) =>
        e.id === employeeId
          ? {
              ...e,
              status: isLate ? 'late' : 'active',
              currentCheckInTime: time.slice(0, 5),
            }
          : e
      )
    );

    const todayStr = new Date().toISOString().split('T')[0];

    // Check if record exists for today
    setAttendanceRecords((prev) => {
      const existing = prev.find((r) => r.employeeId === employeeId && r.date === todayStr);
      if (existing) {
        return prev.map((r) =>
          r.id === existing.id
            ? {
                ...r,
                checkInTime: time,
                status: isLate ? 'late' : 'on_time',
                lateMinutes,
              }
            : r
        );
      } else {
        const newRecord: AttendanceRecord = {
          id: `att-${Date.now()}`,
          employeeId: emp.id,
          employeeName: emp.fullName,
          department: emp.department,
          date: todayStr,
          checkInTime: time,
          status: isLate ? 'late' : 'on_time',
          lateMinutes,
          method: 'Kiosk',
        };
        return [newRecord, ...prev];
      }
    });
  };

  const handleKioskCheckOut = (employeeId: string, time: string) => {
    setEmployees((prev) =>
      prev.map((e) =>
        e.id === employeeId
          ? {
              ...e,
              status: 'left',
              currentCheckOutTime: time.slice(0, 5),
            }
          : e
      )
    );

    const todayStr = new Date().toISOString().split('T')[0];

    setAttendanceRecords((prev) =>
      prev.map((r) =>
        r.employeeId === employeeId && r.date === todayStr
          ? { ...r, checkOutTime: time }
          : r
      )
    );
  };

  const handleToggleBreak = (employeeId: string) => {
    setEmployees((prev) =>
      prev.map((e) => {
        if (e.id === employeeId) {
          const newStatus = e.status === 'on_break' ? 'active' : 'on_break';
          return { ...e, status: newStatus };
        }
        return e;
      })
    );
  };

  const handleAddEmployee = (newEmpData: Omit<Employee, 'id'>) => {
    const newId = `emp-${Date.now()}`;
    const newEmp: Employee = {
      ...newEmpData,
      id: newId,
    };
    setEmployees((prev) => [newEmp, ...prev]);
  };

  const handleUpdateAttendance = (recordId: string, updates: Partial<AttendanceRecord>) => {
    setAttendanceRecords((prev) =>
      prev.map((r) => (r.id === recordId ? { ...r, ...updates } : r))
    );
  };

  const handleManualCheckIn = (employeeId: string, time: string, note?: string) => {
    const emp = employees.find((e) => e.id === employeeId);
    if (!emp) return;

    setEmployees((prev) =>
      prev.map((e) =>
        e.id === employeeId
          ? { ...e, status: 'active', currentCheckInTime: time }
          : e
      )
    );

    const newRecord: AttendanceRecord = {
      id: `att-${Date.now()}`,
      employeeId: emp.id,
      employeeName: emp.fullName,
      department: emp.department,
      date: new Date().toISOString().split('T')[0],
      checkInTime: time,
      status: 'on_time',
      lateMinutes: 0,
      note,
      method: 'AdminManual',
    };

    setAttendanceRecords((prev) => [newRecord, ...prev]);
  };

  const handleManualCheckOut = (employeeId: string, time: string) => {
    setEmployees((prev) =>
      prev.map((e) =>
        e.id === employeeId
          ? { ...e, status: 'left', currentCheckOutTime: time }
          : e
      )
    );

    const todayStr = new Date().toISOString().split('T')[0];
    setAttendanceRecords((prev) =>
      prev.map((r) =>
        r.employeeId === employeeId && r.date === todayStr
          ? { ...r, checkOutTime: time }
          : r
      )
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      
      {/* Top Main Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
      />

      {/* Main App Canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* VIEW 1: MIJOZ BANKI (Banking View) */}
        {activeTab === 'banking' && (
          <motion.div
            key="banking-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Top Asset Summary Banner */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center p-5 rounded-2xl bg-gradient-to-r from-blue-950/40 via-slate-900 to-indigo-950/40 border border-slate-800 shadow-xl">
              <div className="md:col-span-7 space-y-1">
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5" /> JAMI MOLIYAVIY AKTIVLAR (BARCHA KARTALAR)
                </span>
                <div className="text-2xl sm:text-3xl lg:text-4xl font-black font-mono text-white tracking-tight">
                  {new Intl.NumberFormat('uz-UZ').format(Math.round(totalBalanceInUZS))} so'm
                </div>
                <p className="text-xs text-slate-400">
                  {cards.length} ta hisob (Humo, Uzcard, Visa, Mastercard) | Real-vaqtli konvertatsiya
                </p>
              </div>

              <div className="md:col-span-5 flex flex-wrap items-center justify-end gap-2">
                <button
                  onClick={() => setBankingSubTab('transfers')}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 transition"
                >
                  <Send className="w-4 h-4" />
                  <span>Pul O'tkazish</span>
                </button>

                <button
                  onClick={() => setBankingSubTab('payments')}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition"
                >
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>To'lovlar</span>
                </button>
              </div>
            </div>

            {/* Sub-tab Navigation */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-slate-800">
              {[
                { id: 'cards', label: 'Kartalarim & Hisoblar', icon: CreditCard },
                { id: 'transfers', label: 'Pul O\'tkazmalari', icon: Send },
                { id: 'payments', label: 'To\'lovlar & Xizmatlar', icon: Zap },
                { id: 'history', label: 'Amallar Tarixi', icon: History },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = bankingSubTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setBankingSubTab(tab.id as typeof bankingSubTab)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap ${
                      isActive
                        ? 'border-blue-500 text-white bg-slate-900/60'
                        : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Sub-tab content */}
            <AnimatePresence mode="wait">
              {bankingSubTab === 'cards' && (
                <motion.div
                  key="sub-cards"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  <CardsManager
                    cards={cards}
                    selectedCardId={selectedCardId}
                    onSelectCard={setSelectedCardId}
                    onToggleFreeze={handleToggleFreeze}
                    onUpdateLimit={handleUpdateLimit}
                    onAddCard={handleAddCard}
                    onDeposit={handleDeposit}
                    soundEnabled={soundEnabled}
                  />

                  {/* Compact Quick Transfer below cards */}
                  <TransfersSection
                    cards={cards}
                    selectedCardId={selectedCardId}
                    quickContacts={quickContacts}
                    onExecuteTransfer={handleExecuteTransfer}
                    onExecuteExchange={handleExecuteExchange}
                    soundEnabled={soundEnabled}
                  />
                </motion.div>
              )}

              {bankingSubTab === 'transfers' && (
                <motion.div
                  key="sub-transfers"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <TransfersSection
                    cards={cards}
                    selectedCardId={selectedCardId}
                    quickContacts={quickContacts}
                    onExecuteTransfer={handleExecuteTransfer}
                    onExecuteExchange={handleExecuteExchange}
                    soundEnabled={soundEnabled}
                  />
                </motion.div>
              )}

              {bankingSubTab === 'payments' && (
                <motion.div
                  key="sub-payments"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <PaymentsSection
                    cards={cards}
                    selectedCardId={selectedCardId}
                    onExecutePayment={handleExecutePayment}
                    soundEnabled={soundEnabled}
                  />
                </motion.div>
              )}

              {bankingSubTab === 'history' && (
                <motion.div
                  key="sub-history"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <TransactionsHistory
                    transactions={transactions}
                    soundEnabled={soundEnabled}
                  />
                </motion.div>
              )}
            </AnimatePresence>

          </motion.div>
        )}

        {/* VIEW 2: HODIMLAR DAVOMATI ADMIN PANELI */}
        {activeTab === 'attendance' && (
          <motion.div
            key="attendance-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <AttendanceDashboard
              employees={employees}
              attendanceRecords={attendanceRecords}
              onAddEmployee={handleAddEmployee}
              onUpdateAttendance={handleUpdateAttendance}
              onManualCheckIn={handleManualCheckIn}
              onManualCheckOut={handleManualCheckOut}
              soundEnabled={soundEnabled}
            />
          </motion.div>
        )}

        {/* VIEW 3: DAVOMAT TERMINALI (KIOSK) */}
        {activeTab === 'kiosk' && (
          <motion.div
            key="kiosk-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <AttendanceKiosk
              employees={employees}
              onCheckIn={handleKioskCheckIn}
              onCheckOut={handleKioskCheckOut}
              onToggleBreak={handleToggleBreak}
              soundEnabled={soundEnabled}
            />
          </motion.div>
        )}

      </main>

      {/* Global Footer */}
      <footer className="w-full border-t border-slate-900 bg-slate-950 py-5 text-slate-500 text-xs mt-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">APEX BANK O'ZBEKISTON</span>
            <span>•</span>
            <span>Barcha hisoblar va davomat monitoringi himoyalangan</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleResetData}
              className="flex items-center gap-1 text-slate-400 hover:text-slate-200 transition"
              title="Boshlang'ich test ma'lumotlarini tiklash"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Ma'lumotlarni tiklash</span>
            </button>
            <span>Qo'llab-quvvatlash: 1144</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
