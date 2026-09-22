import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, 
  Smartphone, 
  Wifi, 
  FileText, 
  ShieldAlert, 
  Flame, 
  Droplet, 
  Tv, 
  CheckCircle2, 
  RefreshCw,
  Search,
  ArrowRight
} from 'lucide-react';
import { BankCard, PaymentCategory, Transaction } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { sound } from '../../utils/audio';

interface PaymentsSectionProps {
  cards: BankCard[];
  selectedCardId: string;
  onExecutePayment: (
    fromCardId: string,
    category: PaymentCategory,
    providerName: string,
    accountNumber: string,
    amount: number
  ) => { success: boolean; message: string; transaction?: Transaction };
  soundEnabled: boolean;
}

interface Provider {
  id: string;
  name: string;
  category: PaymentCategory;
  accountLabel: string;
  icon: React.ElementType;
  color: string;
}

const PROVIDERS: Provider[] = [
  { id: 'p-1', name: 'Hududiy Elektr Tarmoqlari', category: 'utility', accountLabel: 'Hisob raqam (10 ta raqam)', icon: Zap, color: 'text-amber-400 bg-amber-400/10' },
  { id: 'p-2', name: 'Hududgazta\'minot (Gaz)', category: 'utility', accountLabel: 'Gaz hisob raqami', icon: Flame, color: 'text-orange-400 bg-orange-400/10' },
  { id: 'p-3', name: 'O\'zsuvta\'minot (Suv)', category: 'utility', accountLabel: 'Suv hisob raqami', icon: Droplet, color: 'text-cyan-400 bg-cyan-400/10' },
  { id: 'p-4', name: 'Ucell Mobil Aloqa', category: 'mobile', accountLabel: 'Telefon raqam (+998...)', icon: Smartphone, color: 'text-purple-400 bg-purple-400/10' },
  { id: 'p-5', name: 'Beeline Uzbekistan', category: 'mobile', accountLabel: 'Telefon raqam (+998...)', icon: Smartphone, color: 'text-yellow-400 bg-yellow-400/10' },
  { id: 'p-6', name: 'Uztelecom / Uzmobile', category: 'mobile', accountLabel: 'Telefon raqam (+998...)', icon: Smartphone, color: 'text-blue-400 bg-blue-400/10' },
  { id: 'p-7', name: 'Mobiuz (UMS)', category: 'mobile', accountLabel: 'Telefon raqam (+998...)', icon: Smartphone, color: 'text-rose-400 bg-rose-400/10' },
  { id: 'p-8', name: 'UzOnline Internet', category: 'internet', accountLabel: 'Shartnoma / Login raqami', icon: Wifi, color: 'text-emerald-400 bg-emerald-400/10' },
  { id: 'p-9', name: 'YHXBB Yo\'l Jarimalari', category: 'government', accountLabel: 'Qaror raqami yoki Tex-pasport', icon: ShieldAlert, color: 'text-red-400 bg-red-400/10' },
];

export const PaymentsSection: React.FC<PaymentsSectionProps> = ({
  cards,
  selectedCardId,
  onExecutePayment,
  soundEnabled,
}) => {
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [fromCardId, setFromCardId] = useState<string>(selectedCardId);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [successReceipt, setSuccessReceipt] = useState<Transaction | null>(null);

  const activeCard = cards.find((c) => c.id === fromCardId) || cards[0];

  const filteredProviders = PROVIDERS.filter((p) => {
    const matchesCat = activeCategoryFilter === 'all' || p.category === activeCategoryFilter;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handlePay = () => {
    if (!selectedProvider) return;
    const parsedAmount = parseFloat(paymentAmount.replace(/\s+/g, ''));
    if (!accountNumber.trim()) {
      alert("Iltimos, hisob raqamini kiriting!");
      return;
    }
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert("Iltimos, to'lov summasini kiriting!");
      return;
    }
    if (parsedAmount > activeCard.balance) {
      alert("Kartada yetarli mablag' mavjud emas!");
      return;
    }

    setIsProcessing(true);
    if (soundEnabled) sound.playClick();

    setTimeout(() => {
      const res = onExecutePayment(
        activeCard.id,
        selectedProvider.category,
        selectedProvider.name,
        accountNumber,
        parsedAmount
      );
      setIsProcessing(false);
      if (res.success && res.transaction) {
        setSuccessReceipt(res.transaction);
        if (soundEnabled) sound.playSuccess();
        setSelectedProvider(null);
        setAccountNumber('');
        setPaymentAmount('');
      } else {
        alert(res.message);
      }
    }, 1200);
  };

  return (
    <div className="w-full bg-slate-900/70 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            To'lovlar va Xizmatlar
          </h2>
          <p className="text-xs text-slate-400">
            Kommunal xizmatlar, mobil aloqa, internet va jarimalarni bir zumda to'lang
          </p>
        </div>

        {/* Filter categories */}
        <div className="flex flex-wrap gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800">
          {[
            { id: 'all', label: 'Barchasi' },
            { id: 'utility', label: 'Kommunal' },
            { id: 'mobile', label: 'Mobil aloqa' },
            { id: 'internet', label: 'Internet' },
            { id: 'government', label: 'Jarimalar' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategoryFilter(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeCategoryFilter === cat.id
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Provider selection cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {filteredProviders.map((provider) => {
          const Icon = provider.icon;
          return (
            <button
              key={provider.id}
              onClick={() => {
                if (soundEnabled) sound.playClick();
                setSelectedProvider(provider);
              }}
              className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 hover:bg-slate-800/50 hover:border-blue-500/50 transition flex items-center justify-between text-left group"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${provider.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-blue-400 transition">
                    {provider.name}
                  </div>
                  <div className="text-[10px] text-slate-400">{provider.accountLabel}</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-1 transition shrink-0" />
            </button>
          );
        })}
      </div>

      {/* Payment Modal */}
      <AnimatePresence>
        {selectedProvider && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-white"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${selectedProvider.color}`}>
                  <selectedProvider.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{selectedProvider.name}</h3>
                  <span className="text-xs text-slate-400">Tezkor to'lov oynasi</span>
                </div>
              </div>

              <div className="space-y-4 mb-5">
                <div>
                  <label className="text-xs text-slate-300 font-medium block mb-1">
                    To'lov amalga oshiriladigan karta:
                  </label>
                  <select
                    value={fromCardId}
                    onChange={(e) => setFromCardId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-medium"
                  >
                    {cards.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.cardName} (•••• {c.cardNumber.slice(-4)}) - {formatCurrency(c.balance, c.currency)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-medium block mb-1">
                    {selectedProvider.accountLabel}:
                  </label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="Masalan: 2201948123 yoki 93 123 45 67"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-medium block mb-1">
                    To'lov summasi ({activeCard.currency}):
                  </label>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="0"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono font-bold text-lg focus:outline-none focus:border-blue-500"
                  />
                  <div className="flex gap-1.5 mt-2">
                    {[20000, 50000, 100000, 250000].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setPaymentAmount(String(preset))}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-mono text-slate-300"
                      >
                        +{preset.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedProvider(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold"
                >
                  Bekor qilish
                </button>
                <button
                  onClick={handlePay}
                  disabled={isProcessing}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>To'lanmoqda...</span>
                    </>
                  ) : (
                    <span>To'lovni tasdiqlash</span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Success Notification Modal */}
      <AnimatePresence>
        {successReceipt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl p-6 text-center text-white shadow-2xl"
            >
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white">To'lov Muvaffaqiyatli!</h3>
              <p className="text-xs text-slate-400 mt-1">{successReceipt.title}</p>
              <div className="text-2xl font-bold font-mono text-emerald-400 my-3">
                {formatCurrency(successReceipt.amount, successReceipt.currency)}
              </div>
              <p className="text-[11px] text-slate-400 font-mono mb-4">
                Kvitansiya №: {successReceipt.receiptNumber}
              </p>
              <button
                onClick={() => setSuccessReceipt(null)}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow"
              >
                Yopish
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
