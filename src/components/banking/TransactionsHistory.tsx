import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  History, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Search, 
  Filter, 
  Receipt, 
  Printer, 
  X, 
  Calendar,
  CreditCard,
  CheckCircle2,
  DollarSign
} from 'lucide-react';
import { Transaction } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { sound } from '../../utils/audio';

interface TransactionsHistoryProps {
  transactions: Transaction[];
  soundEnabled: boolean;
}

export const TransactionsHistory: React.FC<TransactionsHistoryProps> = ({
  transactions,
  soundEnabled,
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const filteredTransactions = transactions.filter((tx) => {
    const matchesFilter =
      filterType === 'all'
        ? true
        : filterType === 'income'
        ? tx.type === 'transfer_in' || tx.type === 'deposit'
        : filterType === 'outcome'
        ? tx.type === 'transfer_out' || tx.type === 'payment'
        : filterType === 'transfer'
        ? tx.type === 'transfer_out' || tx.type === 'transfer_in'
        : true;

    const matchesSearch =
      tx.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="w-full bg-slate-900/70 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl backdrop-blur-md">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-blue-400" />
            Amallar va Tranzaksiyalar Tarixi
          </h2>
          <p className="text-xs text-slate-400">
            Jami {transactions.length} ta operatsiya qayd etilgan
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex p-1 rounded-xl bg-slate-950 border border-slate-800">
          {[
            { id: 'all', label: 'Barchasi' },
            { id: 'outcome', label: 'Chiqim (-)' },
            { id: 'income', label: 'Kirim (+)' },
            { id: 'transfer', label: 'O\'tkazmalar' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                if (soundEnabled) sound.playClick();
                setFilterType(item.id);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filterType === item.id
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Tranzaksiya nomi, qabul qiluvchi yoki chek raqami bo'yicha qidiruv..."
          className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs sm:text-sm focus:outline-none focus:border-blue-500"
        />
        <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
      </div>

      {/* List */}
      <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
        {filteredTransactions.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs">
            Ushbu qidiruv bo'yicha hech qanday operatsiya topilmadi
          </div>
        ) : (
          filteredTransactions.map((tx) => {
            const isIncome = tx.type === 'transfer_in' || tx.type === 'deposit';
            return (
              <div
                key={tx.id}
                onClick={() => {
                  if (soundEnabled) sound.playClick();
                  setSelectedTx(tx);
                }}
                className="p-3 sm:p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/40 transition flex items-center justify-between cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isIncome
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}
                  >
                    {isIncome ? (
                      <ArrowDownLeft className="w-5 h-5" />
                    ) : (
                      <ArrowUpRight className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-semibold text-white group-hover:text-blue-400 transition truncate max-w-[200px] sm:max-w-xs">
                      {tx.title}
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2">
                      <span>{tx.date}</span>
                      <span>•</span>
                      <span className="font-mono text-[10px] text-slate-500">
                        {tx.receiptNumber}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div
                    className={`text-xs sm:text-sm font-bold font-mono ${
                      isIncome ? 'text-emerald-400' : 'text-slate-100'
                    }`}
                  >
                    {isIncome ? '+' : '-'}
                    {formatCurrency(tx.amount, tx.currency)}
                  </div>
                  <div className="text-[10px] text-emerald-400 font-medium">
                    Muvaffaqiyatli
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Transaction Receipt Modal */}
      <AnimatePresence>
        {selectedTx && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-6 text-white shadow-2xl relative"
            >
              <button
                onClick={() => setSelectedTx(null)}
                className="absolute right-4 top-4 p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="text-center mb-5">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center mx-auto mb-2">
                  <Receipt className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white">Elektron To'lov Kvitansiyasi</h3>
                <p className="text-[11px] text-slate-400">APEX BANK XALQARO TIZIMI</p>
                <div className="text-2xl font-black font-mono text-emerald-400 my-2">
                  {formatCurrency(selectedTx.amount, selectedTx.currency)}
                </div>
              </div>

              <div className="space-y-2.5 p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs mb-5">
                <div className="flex justify-between text-slate-400">
                  <span>Tranzaksiya turi:</span>
                  <span className="font-semibold text-white uppercase">{selectedTx.type}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Operatsiya:</span>
                  <span className="font-semibold text-white">{selectedTx.title}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Tafsilot:</span>
                  <span className="text-slate-300">{selectedTx.description}</span>
                </div>
                {selectedTx.recipientCard && (
                  <div className="flex justify-between text-slate-400">
                    <span>Qabul qiluvchi:</span>
                    <span className="font-mono text-slate-200">{selectedTx.recipientCard}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-400">
                  <span>Sana va vaqt:</span>
                  <span className="text-slate-200">{selectedTx.date}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Chek raqami:</span>
                  <span className="font-mono text-blue-400 font-bold">{selectedTx.receiptNumber}</span>
                </div>
                <div className="flex justify-between text-slate-400 pt-2 border-t border-slate-800">
                  <span>Holati:</span>
                  <span className="flex items-center gap-1 text-emerald-400 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Bajarildi
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex-1 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Chop etish</span>
                </button>
                <button
                  onClick={() => setSelectedTx(null)}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white"
                >
                  Yopish
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
