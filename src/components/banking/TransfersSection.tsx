import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  ArrowRightLeft, 
  Phone, 
  CreditCard, 
  CheckCircle2, 
  Receipt, 
  Sparkles, 
  Share2, 
  Printer, 
  RefreshCw,
  AlertCircle,
  Copy,
  Check,
  UserCheck
} from 'lucide-react';
import { BankCard, QuickContact, Transaction, Currency } from '../../types';
import { formatCurrency, formatCardNumber, detectCardType, getCardBadge } from '../../utils/formatters';
import { sound } from '../../utils/audio';

interface TransfersSectionProps {
  cards: BankCard[];
  selectedCardId: string;
  quickContacts: QuickContact[];
  onExecuteTransfer: (
    fromCardId: string,
    toCardNumber: string,
    recipientName: string,
    amount: number,
    currency: Currency,
    note?: string
  ) => { success: boolean; message: string; transaction?: Transaction };
  onExecuteExchange: (
    fromCardId: string,
    toCardId: string,
    amount: number,
    targetAmount: number
  ) => { success: boolean; message: string; transaction?: Transaction };
  soundEnabled: boolean;
}

export const TransfersSection: React.FC<TransfersSectionProps> = ({
  cards,
  selectedCardId,
  quickContacts,
  onExecuteTransfer,
  onExecuteExchange,
  soundEnabled,
}) => {
  const [transferMode, setTransferMode] = useState<'card' | 'phone' | 'exchange'>('card');
  const [fromCardId, setFromCardId] = useState<string>(selectedCardId);
  const [targetCardNumber, setTargetCardNumber] = useState<string>('');
  const [targetPhone, setTargetPhone] = useState<string>('');
  const [recipientName, setRecipientName] = useState<string>('');
  const [amountInput, setAmountInput] = useState<string>('');
  const [transferNote, setTransferNote] = useState<string>('');

  // Exchange state
  const [exchangeFromCardId, setExchangeFromCardId] = useState<string>(
    cards.find((c) => c.currency === 'UZS')?.id || cards[0].id
  );
  const [exchangeToCardId, setExchangeToCardId] = useState<string>(
    cards.find((c) => c.currency === 'USD')?.id || cards[1]?.id || cards[0].id
  );
  const [exchangeAmount, setExchangeAmount] = useState<string>('1285000');

  // Animation & Feedback state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [completedReceipt, setCompletedReceipt] = useState<Transaction | null>(null);
  const [copiedReceiptId, setCopiedReceiptId] = useState<boolean>(false);

  const activeFromCard = cards.find((c) => c.id === fromCardId) || cards[0];
  const detectedType = detectCardType(targetCardNumber);
  const detectedBadge = getCardBadge(detectedType);

  // Quick select contact
  const handleSelectContact = (contact: QuickContact) => {
    if (soundEnabled) sound.playClick();
    setTransferMode('card');
    setTargetCardNumber(contact.cardNumber);
    setRecipientName(contact.name);
    setErrorText(null);
  };

  // Card number input formatting
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    if (formatted.replace(/\s+/g, '').length <= 16) {
      setTargetCardNumber(formatted);
      if (formatted.replace(/\s+/g, '').length === 16) {
        // Auto resolve recipient mock
        if (!recipientName) {
          setRecipientName('Foydalanuvchi (' + detectedBadge.name + ')');
        }
      }
    }
    setErrorText(null);
  };

  // Preset amount button
  const handlePresetAmount = (val: number) => {
    if (soundEnabled) sound.playClick();
    setAmountInput(String(val));
    setErrorText(null);
  };

  // Submit transfer
  const handleSubmitTransfer = () => {
    setErrorText(null);

    if (activeFromCard.isFrozen) {
      setErrorText("Tanlangan yuboruvchi karta muzlatilgan. Avval muzlatishdan chiqaring!");
      return;
    }

    const cleanCard = targetCardNumber.replace(/\s+/g, '');
    if (transferMode === 'card' && cleanCard.length < 16) {
      setErrorText("Iltimos, to'liq 16 xonali karta raqamini kiriting!");
      return;
    }

    if (transferMode === 'phone' && targetPhone.length < 9) {
      setErrorText("Iltimos, to'g'ri telefon raqamini kiriting!");
      return;
    }

    const parsedAmount = parseFloat(amountInput.replace(/\s+/g, ''));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorText("Iltimos, o'tkazma summasini to'g'ri kiriting!");
      return;
    }

    if (parsedAmount > activeFromCard.balance) {
      setErrorText("Kartada yetarli mablag' mavjud emas!");
      return;
    }

    // Start animated processing
    if (soundEnabled) sound.playClick();
    setIsProcessing(true);

    setTimeout(() => {
      const destination =
        transferMode === 'card'
          ? targetCardNumber
          : `+998 ${targetPhone}`;

      const recName = recipientName || (transferMode === 'card' ? 'Karta egasi' : 'Telefon egasi');

      const result = onExecuteTransfer(
        activeFromCard.id,
        destination,
        recName,
        parsedAmount,
        activeFromCard.currency,
        transferNote
      );

      setIsProcessing(false);

      if (result.success && result.transaction) {
        setCompletedReceipt(result.transaction);
        if (soundEnabled) sound.playSuccess();
        // Reset inputs
        setAmountInput('');
        setTargetCardNumber('');
        setRecipientName('');
        setTargetPhone('');
        setTransferNote('');
      } else {
        setErrorText(result.message);
      }
    }, 1200);
  };

  // Submit Exchange
  const handleSubmitExchange = () => {
    setErrorText(null);
    const sourceCard = cards.find((c) => c.id === exchangeFromCardId);
    const destCard = cards.find((c) => c.id === exchangeToCardId);

    if (!sourceCard || !destCard || sourceCard.id === destCard.id) {
      setErrorText("Bir xil kartalar o'rtasida konvertatsiya qilib bo'lmaydi!");
      return;
    }

    const parsedAmount = parseFloat(exchangeAmount.replace(/\s+/g, ''));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorText("Iltimos, konvertatsiya summasini to'g'ri kiriting!");
      return;
    }

    if (parsedAmount > sourceCard.balance) {
      setErrorText("Yuboruvchi kartada yetarli mablag' yo'q!");
      return;
    }

    // Rate calculation (USD = 12,850 UZS)
    let targetAmount = 0;
    if (sourceCard.currency === 'UZS' && destCard.currency === 'USD') {
      targetAmount = Number((parsedAmount / 12850).toFixed(2));
    } else if (sourceCard.currency === 'USD' && destCard.currency === 'UZS') {
      targetAmount = Math.round(parsedAmount * 12820);
    } else {
      targetAmount = parsedAmount;
    }

    setIsProcessing(true);
    if (soundEnabled) sound.playClick();

    setTimeout(() => {
      const result = onExecuteExchange(sourceCard.id, destCard.id, parsedAmount, targetAmount);
      setIsProcessing(false);
      if (result.success && result.transaction) {
        setCompletedReceipt(result.transaction);
        if (soundEnabled) sound.playSuccess();
      } else {
        setErrorText(result.message);
      }
    }, 1200);
  };

  return (
    <div className="w-full bg-slate-900/70 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl backdrop-blur-md">
      
      {/* Header Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Send className="w-5 h-5 text-indigo-400" />
            Tezkor Pul O'tkazmalari
          </h2>
          <p className="text-xs text-slate-400">
            Karta, telefon raqami yoki valyuta konvertatsiyasi (Komissiya 0%)
          </p>
        </div>

        {/* Transfer mode pills */}
        <div className="flex p-1 rounded-xl bg-slate-950 border border-slate-800">
          <button
            onClick={() => {
              setTransferMode('card');
              setErrorText(null);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              transferMode === 'card'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Kartaga</span>
          </button>

          <button
            onClick={() => {
              setTransferMode('phone');
              setErrorText(null);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              transferMode === 'phone'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Telefonga</span>
          </button>

          <button
            onClick={() => {
              setTransferMode('exchange');
              setErrorText(null);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              transferMode === 'exchange'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Konvertatsiya</span>
          </button>
        </div>
      </div>

      {/* Quick Contacts Slider */}
      {transferMode !== 'exchange' && (
        <div className="mb-6">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2.5">
            Tezkor Kontaktlar
          </span>
          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
            {quickContacts.map((contact) => (
              <button
                key={contact.id}
                onClick={() => handleSelectContact(contact)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-800/40 transition shrink-0 text-left group"
              >
                <div
                  className={`w-8 h-8 rounded-full ${contact.avatarColor} text-white font-bold text-xs flex items-center justify-center shadow`}
                >
                  {contact.name.charAt(0)}
                </div>
                <div>
                  <div className="text-xs font-semibold text-white group-hover:text-blue-400 transition truncate max-w-[110px]">
                    {contact.name}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    •••• {contact.cardNumber.slice(-4)}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Transfer Form */}
      {transferMode !== 'exchange' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          
          {/* Left: Source Card & Recipient */}
          <div className="space-y-4">
            {/* Sender Card Selector */}
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1.5">
                Qaysi kartadan yuboriladi:
              </label>
              <select
                value={fromCardId}
                onChange={(e) => setFromCardId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs sm:text-sm font-medium focus:outline-none focus:border-blue-500"
              >
                {cards.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.cardName} (•••• {c.cardNumber.slice(-4)}) - {formatCurrency(c.balance, c.currency)}
                  </option>
                ))}
              </select>
            </div>

            {/* Recipient Input (Card or Phone) */}
            {transferMode === 'card' ? (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    Qabul qiluvchi karta raqami:
                  </label>
                  {targetCardNumber.replace(/\s+/g, '').length >= 4 && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${detectedBadge.bg}`}>
                      {detectedBadge.name}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={targetCardNumber}
                    onChange={handleCardNumberChange}
                    placeholder="8600 0000 0000 0000 yoki 9860..."
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-sm sm:text-base tracking-wider focus:outline-none focus:border-blue-500"
                  />
                  <CreditCard className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            ) : (
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1.5">
                  Qabul qiluvchi telefon raqami:
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-700 bg-slate-800 text-slate-300 text-sm font-mono">
                    +998
                  </span>
                  <input
                    type="tel"
                    value={targetPhone}
                    onChange={(e) => setTargetPhone(e.target.value.replace(/\D/g, '').slice(0, 9))}
                    placeholder="90 123 45 67"
                    className="w-full px-3.5 py-2.5 rounded-r-xl bg-slate-950 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            {/* Optional Recipient Name */}
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1.5">
                Qabul qiluvchi ismi / Izoh (ixtiyoriy):
              </label>
              <input
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Masalan: Sardorbek (Qarz qaytarildi)"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs sm:text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Right: Amount & Confirmation */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1.5">
                O'tkazma summasi ({activeFromCard.currency}):
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={amountInput}
                  onChange={(e) => {
                    setAmountInput(e.target.value);
                    setErrorText(null);
                  }}
                  placeholder="0"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono font-bold text-lg sm:text-xl focus:outline-none focus:border-blue-500"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  {activeFromCard.currency}
                </span>
              </div>

              {/* Amount Presets */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {(activeFromCard.currency === 'UZS'
                  ? [50000, 100000, 500000, 1000000, 5000000]
                  : [10, 50, 100, 500]
                ).map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handlePresetAmount(preset)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-mono text-slate-300 transition"
                  >
                    +{preset.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {/* Transfer Summary Card */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-1.5">
              <div className="flex justify-between text-slate-400">
                <span>Komissiya:</span>
                <span className="text-emerald-400 font-bold">0% (BEPUL)</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Yetib borish vaqti:</span>
                <span className="text-slate-200">Darhol (Real-time)</span>
              </div>
              <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-800">
                <span>Mavjud balans:</span>
                <span className="font-mono text-slate-200 font-bold">
                  {formatCurrency(activeFromCard.balance, activeFromCard.currency)}
                </span>
              </div>
            </div>

            {/* Error banner */}
            {errorText && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorText}</span>
              </div>
            )}

            {/* Action Submit Button */}
            <button
              id="execute-transfer-btn"
              onClick={handleSubmitTransfer}
              disabled={isProcessing}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-blue-600/20 transition flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Xavfsiz o'tkazma bajarilmoqda...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>O'tkazmani tasdiqlash</span>
                </>
              )}
            </button>
          </div>

        </div>
      ) : (
        /* Exchange View */
        <div className="max-w-xl mx-auto space-y-4">
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span>Sotish (Yechib olinadigan hisob):</span>
              <span className="text-emerald-400 font-mono">Kurs: 1 USD = 12,850 UZS</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <select
                value={exchangeFromCardId}
                onChange={(e) => setExchangeFromCardId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
              >
                {cards.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.cardName} ({c.currency}) - {formatCurrency(c.balance, c.currency)}
                  </option>
                ))}
              </select>

              <input
                type="number"
                value={exchangeAmount}
                onChange={(e) => setExchangeAmount(e.target.value)}
                placeholder="Summa"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-sm font-bold"
              />
            </div>

            <div className="flex justify-center my-1">
              <div className="p-2 rounded-full bg-indigo-600/30 text-indigo-400 border border-indigo-500/30">
                <ArrowRightLeft className="w-4 h-4" />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span>Sotib olish (Tushadigan hisob):</span>
              <span className="text-slate-300">
                Hisoblanadi: ~
                {Number(exchangeAmount) > 0
                  ? (Number(exchangeAmount) / 12850).toFixed(2)
                  : '0'}{' '}
                USD
              </span>
            </div>
            <select
              value={exchangeToCardId}
              onChange={(e) => setExchangeToCardId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
            >
              {cards.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.cardName} ({c.currency}) - {formatCurrency(c.balance, c.currency)}
                </option>
              ))}
            </select>
          </div>

          {errorText && (
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorText}</span>
            </div>
          )}

          <button
            onClick={handleSubmitExchange}
            disabled={isProcessing}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/20 transition flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Konvertatsiya qilinmoqda...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Valyutani Konvertatsiya Qilish</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Transaction Receipt Modal */}
      <AnimatePresence>
        {completedReceipt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 20 }}
              className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden"
            >
              {/* Top Success Badge */}
              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mb-3 shadow-lg shadow-emerald-500/10 animate-bounce">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <h3 className="text-xl font-bold text-white">To'lov Muvaffaqiyatli!</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Mablag' qabul qiluvchi hisobiga yetib bordi
                </p>
                <div className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-400 mt-3">
                  {formatCurrency(completedReceipt.amount, completedReceipt.currency)}
                </div>
              </div>

              {/* Receipt Details Box */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5 text-xs">
                <div className="flex justify-between items-center text-slate-400">
                  <span>Chek raqami:</span>
                  <div className="flex items-center gap-1.5 font-mono text-slate-200">
                    <span>{completedReceipt.receiptNumber}</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(completedReceipt.receiptNumber);
                        setCopiedReceiptId(true);
                        setTimeout(() => setCopiedReceiptId(false), 2000);
                      }}
                      className="p-1 hover:text-white"
                    >
                      {copiedReceiptId ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex justify-between text-slate-400">
                  <span>Qabul qiluvchi:</span>
                  <span className="font-semibold text-white">
                    {completedReceipt.recipientName || completedReceipt.title}
                  </span>
                </div>

                {completedReceipt.recipientCard && (
                  <div className="flex justify-between text-slate-400">
                    <span>Karta / Rekvizit:</span>
                    <span className="font-mono text-slate-300">
                      {completedReceipt.recipientCard}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-slate-400">
                  <span>Vaqti:</span>
                  <span className="text-slate-300">{completedReceipt.date}</span>
                </div>

                <div className="flex justify-between text-slate-400 pt-2 border-t border-slate-800">
                  <span>Komissiya:</span>
                  <span className="text-emerald-400 font-bold">0 so'm</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2.5 mt-6">
                <button
                  onClick={() => window.print()}
                  className="flex-1 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5 transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Chekni chop etish</span>
                </button>
                <button
                  onClick={() => setCompletedReceipt(null)}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow-md shadow-blue-600/30 transition"
                >
                  Tayyor
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
