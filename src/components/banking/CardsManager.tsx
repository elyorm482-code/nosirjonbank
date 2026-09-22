import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CreditCard, 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock, 
  Plus, 
  Sliders, 
  ArrowUpRight, 
  Shield, 
  Sparkles, 
  Check, 
  Layers, 
  Wifi,
  DollarSign
} from 'lucide-react';
import { BankCard, CardType, Currency } from '../../types';
import { formatCurrency, formatCardNumber, getCardBadge } from '../../utils/formatters';
import { sound } from '../../utils/audio';

interface CardsManagerProps {
  cards: BankCard[];
  selectedCardId: string;
  onSelectCard: (cardId: string) => void;
  onToggleFreeze: (cardId: string) => void;
  onUpdateLimit: (cardId: string, newLimit: number) => void;
  onAddCard: (card: Omit<BankCard, 'id' | 'spentToday'>) => void;
  onDeposit: (cardId: string, amount: number) => void;
  soundEnabled: boolean;
}

export const CardsManager: React.FC<CardsManagerProps> = ({
  cards,
  selectedCardId,
  onSelectCard,
  onToggleFreeze,
  onUpdateLimit,
  onAddCard,
  onDeposit,
  soundEnabled,
}) => {
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [showNumbers, setShowNumbers] = useState<boolean>(false);
  const [showLimitModal, setShowLimitModal] = useState<boolean>(false);
  const [showDepositModal, setShowDepositModal] = useState<boolean>(false);
  const [showNewCardModal, setShowNewCardModal] = useState<boolean>(false);

  // Limit state
  const [limitInput, setLimitInput] = useState<string>('');
  // Deposit state
  const [depositAmount, setDepositAmount] = useState<string>('');
  // New Card State
  const [newCardType, setNewCardType] = useState<CardType>('humo');
  const [newCardName, setNewCardName] = useState<string>('');
  const [newCardCurrency, setNewCardCurrency] = useState<Currency>('UZS');

  const activeCard = cards.find((c) => c.id === selectedCardId) || cards[0];

  const handleFlip = () => {
    if (soundEnabled) sound.playClick();
    setIsFlipped(!isFlipped);
  };

  const handleSelectCard = (id: string) => {
    if (soundEnabled) sound.playClick();
    setIsFlipped(false);
    onSelectCard(id);
  };

  const handleSaveLimit = () => {
    const val = parseFloat(limitInput.replace(/\s+/g, ''));
    if (!isNaN(val) && val > 0 && activeCard) {
      onUpdateLimit(activeCard.id, val);
      setShowLimitModal(false);
      setLimitInput('');
      if (soundEnabled) sound.playSuccess();
    }
  };

  const handleConfirmDeposit = () => {
    const val = parseFloat(depositAmount.replace(/\s+/g, ''));
    if (!isNaN(val) && val > 0 && activeCard) {
      onDeposit(activeCard.id, val);
      setShowDepositModal(false);
      setDepositAmount('');
      if (soundEnabled) sound.playSuccess();
    }
  };

  const handleCreateNewCard = () => {
    if (!newCardName.trim()) return;

    // Generate realistic card number based on type
    let prefix = '9860';
    if (newCardType === 'uzcard') prefix = '8600';
    if (newCardType === 'visa') prefix = '4200';
    if (newCardType === 'mastercard') prefix = '5400';

    const randomDigits = Array.from({ length: 12 }, () => Math.floor(Math.random() * 10)).join('');
    const fullNumber = formatCardNumber(prefix + randomDigits);

    let gradient = 'from-slate-900 via-indigo-950 to-slate-900';
    if (newCardType === 'uzcard') gradient = 'from-blue-900 via-sky-900 to-indigo-950';
    if (newCardType === 'humo') gradient = 'from-amber-900 via-orange-950 to-slate-900';
    if (newCardType === 'visa') gradient = 'from-cyan-900 via-blue-900 to-slate-950';
    if (newCardType === 'mastercard') gradient = 'from-rose-900 via-purple-950 to-slate-950';

    onAddCard({
      cardNumber: fullNumber,
      cardHolder: 'ELYOR MAHMUDOV',
      cardName: newCardName.trim(),
      cardType: newCardType,
      balance: newCardCurrency === 'UZS' ? 500000 : 50,
      currency: newCardCurrency,
      expiryDate: '09/30',
      cvv: String(Math.floor(100 + Math.random() * 900)),
      isFrozen: false,
      colorGradient: gradient,
      dailyLimit: newCardCurrency === 'UZS' ? 20000000 : 5000,
      isVirtual: true,
    });

    setShowNewCardModal(false);
    setNewCardName('');
    if (soundEnabled) sound.playSuccess();
  };

  const badge = getCardBadge(activeCard.cardType);

  return (
    <div className="w-full bg-slate-900/70 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl relative backdrop-blur-md">
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-400" />
            Mening Kartalarim va Hisoblarim
          </h2>
          <p className="text-xs text-slate-400">
            Jami {cards.length} ta faol karta | 3D himoyalangan
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="open-deposit-modal"
            onClick={() => {
              setDepositAmount('1000000');
              setShowDepositModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold hover:bg-emerald-600/30 transition shadow-sm"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Hisobni To'ldirish</span>
          </button>

          <button
            id="open-new-card-modal"
            onClick={() => setShowNewCardModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-500 transition shadow-md shadow-blue-600/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Yangi Karta Ochish</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left Column: Interactive 3D Card Display */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center">
          <div className="w-full max-w-sm [perspective:1000px]">
            <motion.div
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.6, ease: 'easeInOut' }}
              className="relative w-full aspect-[1.586/1] rounded-2xl [transform-style:preserve-3d] shadow-2xl cursor-pointer"
              onClick={handleFlip}
            >
              {/* Card FRONT */}
              <div
                className={`absolute inset-0 w-full h-full rounded-2xl p-5 sm:p-6 bg-gradient-to-br ${activeCard.colorGradient} border border-white/20 text-white [backface-visibility:hidden] flex flex-col justify-between shadow-inner overflow-hidden select-none`}
              >
                {/* Background decorative watermark */}
                <div className="absolute -right-8 -bottom-8 w-44 h-44 rounded-full bg-white/5 blur-xl pointer-events-none" />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/5 font-black text-7xl italic pointer-events-none">
                  APEX
                </div>

                {/* Top Row: Bank & Chip */}
                <div className="flex items-center justify-between z-10">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm tracking-wider text-white">APEX BANK</span>
                    {activeCard.isVirtual && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/20 text-white/90">
                        VIRTUAL
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Wifi className="w-4 h-4 text-white/70 rotate-90" />
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${badge.bg}`}>
                      {badge.name}
                    </span>
                  </div>
                </div>

                {/* Middle: Golden Chip & Balance */}
                <div className="flex items-center justify-between z-10 my-1">
                  <div className="w-10 h-7 rounded-md bg-gradient-to-tr from-amber-400 via-amber-200 to-yellow-500 border border-amber-300 shadow-inner flex flex-col justify-center px-1 gap-1">
                    <div className="h-0.5 w-full bg-amber-700/40" />
                    <div className="h-0.5 w-full bg-amber-700/40" />
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-white/70 uppercase tracking-wider block">Balans</span>
                    <span className="text-xl sm:text-2xl font-bold font-mono tracking-tight drop-shadow">
                      {formatCurrency(activeCard.balance, activeCard.currency)}
                    </span>
                  </div>
                </div>

                {/* Bottom: Card Number, Name, Expiry */}
                <div className="z-10">
                  <div className="font-mono text-base sm:text-lg tracking-widest drop-shadow text-white/95">
                    {showNumbers
                      ? activeCard.cardNumber
                      : activeCard.cardNumber.replace(/^(\d{4})\s*(\d{4})\s*(\d{4})\s*(\d{4})$/, '$1 •••• •••• $4')}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-white/80 mt-1 uppercase font-medium">
                    <span className="truncate max-w-[180px]">{activeCard.cardHolder}</span>
                    <span className="font-mono">MUDDAT: {activeCard.expiryDate}</span>
                  </div>
                </div>

                {/* Frozen Overlay */}
                {activeCard.isFrozen && (
                  <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center text-rose-400 z-20">
                    <Lock className="w-8 h-8 mb-1 animate-bounce" />
                    <span className="font-bold text-sm text-white">KARTA MUZLATILGAN</span>
                    <span className="text-xs text-slate-300">Amallarni bajarish to'xtatildi</span>
                  </div>
                )}
              </div>

              {/* Card BACK */}
              <div
                className={`absolute inset-0 w-full h-full rounded-2xl bg-gradient-to-br from-slate-900 to-zinc-900 border border-white/20 text-white [transform:rotateY(180deg)] [backface-visibility:hidden] flex flex-col justify-between py-4 shadow-inner overflow-hidden select-none`}
              >
                {/* Magnetic Stripe */}
                <div className="w-full h-10 bg-black/90 shadow-inner mt-1" />

                {/* CVV Panel */}
                <div className="px-6">
                  <div className="flex items-center justify-end gap-2 bg-slate-200 text-slate-900 px-3 py-1.5 rounded text-xs font-mono">
                    <span className="text-[10px] text-slate-600 font-sans">CVV/CVC:</span>
                    <span className="font-bold text-sm tracking-wider">{activeCard.cvv}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2 text-center">
                    Ushbu kod maxfiy hisoblanadi. Hech kimga oshkor qilmang!
                  </p>
                </div>

                {/* Support details */}
                <div className="px-6 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-800 pt-2">
                  <span>Qo'llab-quvvatlash: 1144</span>
                  <span className="text-blue-400 font-semibold">apexbank.uz</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Quick controls underneath card */}
          <div className="flex items-center gap-3 mt-4 text-xs">
            <button
              onClick={handleFlip}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
            >
              <CreditCard className="w-3.5 h-3.5 text-cyan-400" />
              <span>{isFlipped ? "Karta oldini ko'rish" : "Orqa tomoni (CVV)"}</span>
            </button>

            <button
              onClick={() => setShowNumbers(!showNumbers)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
            >
              {showNumbers ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-indigo-400" />}
              <span>{showNumbers ? "Raqamni berkitish" : "Raqamni ko'rish"}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Card Details, Thumbnails, & Controls */}
        <div className="lg:col-span-6 flex flex-col justify-between h-full space-y-4">
          
          {/* Card Selection Thumbnails */}
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Barcha Kartalar ({cards.length})
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {cards.map((card) => {
                const isSelected = card.id === selectedCardId;
                return (
                  <button
                    key={card.id}
                    onClick={() => handleSelectCard(card.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-500/10 shadow-md ring-1 ring-blue-500'
                        : 'border-slate-800 bg-slate-800/40 hover:bg-slate-800/70 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="font-bold text-white uppercase">{card.cardType}</span>
                      {card.isFrozen && <Lock className="w-3 h-3 text-rose-400" />}
                    </div>
                    <div className="font-mono text-xs text-slate-300 font-semibold truncate">
                      •••• {card.cardNumber.slice(-4)}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">
                      {formatCurrency(card.balance, card.currency)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Card Specs & Security Controls */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400">Karta nomi</span>
                <p className="font-bold text-white text-sm">{activeCard.cardName}</p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400">Kunlik Sarf Limit</span>
                <p className="font-bold text-slate-200 text-sm font-mono">
                  {formatCurrency(activeCard.dailyLimit, activeCard.currency)}
                </p>
              </div>
            </div>

            {/* Spent progress bar */}
            <div>
              <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                <span>Bugungi xarajat: {formatCurrency(activeCard.spentToday, activeCard.currency)}</span>
                <span>
                  {Math.round((activeCard.spentToday / activeCard.dailyLimit) * 100)}% ishlatildi
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, (activeCard.spentToday / activeCard.dailyLimit) * 100)}%`,
                  }}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-1">
              <button
                id="freeze-toggle-btn"
                onClick={() => {
                  if (soundEnabled) sound.playClick();
                  onToggleFreeze(activeCard.id);
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition ${
                  activeCard.isFrozen
                    ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                    : 'bg-slate-800 text-rose-300 hover:bg-rose-500/20 border border-rose-500/30'
                }`}
              >
                {activeCard.isFrozen ? (
                  <>
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Muzlatishdan chiqarish</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5 text-rose-400" />
                    <span>Kartani Muzlatish</span>
                  </>
                )}
              </button>

              <button
                id="limit-setting-btn"
                onClick={() => {
                  setLimitInput(String(activeCard.dailyLimit));
                  setShowLimitModal(true);
                }}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition border border-slate-700"
              >
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                <span>Limitni o'zgartirish</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Modal: Change Limit */}
      <AnimatePresence>
        {showLimitModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-white"
            >
              <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-blue-400" />
                Kunlik sarf-xarajat limitini belgilash
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Xavfsizlik maqsadida kartangizdan bir kunda sarflanishi mumkin bo'lgan maksimal summani belgilang.
              </p>

              <div className="mb-4">
                <label className="text-xs text-slate-300 font-medium block mb-1">
                  Yangi limit miqdori ({activeCard.currency}):
                </label>
                <input
                  type="number"
                  value={limitInput}
                  onChange={(e) => setLimitInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono font-bold text-lg focus:outline-none focus:border-blue-500"
                  placeholder="0"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowLimitModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold"
                >
                  Bekor qilish
                </button>
                <button
                  onClick={handleSaveLimit}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-500 text-xs font-semibold"
                >
                  Saqlash
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Deposit / Top-up */}
      <AnimatePresence>
        {showDepositModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-white"
            >
              <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                Hisobni to'ldirish (Depozit kiritish)
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Karta: <span className="text-white font-mono">{activeCard.cardNumber}</span> ({activeCard.cardName})
              </p>

              <div className="mb-4">
                <label className="text-xs text-slate-300 font-medium block mb-1">
                  Summa ({activeCard.currency}):
                </label>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono font-bold text-lg focus:outline-none focus:border-emerald-500"
                  placeholder="Summani kiriting"
                />

                <div className="flex gap-2 mt-2">
                  {(activeCard.currency === 'UZS' ? [500000, 1000000, 5000000] : [50, 100, 500]).map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setDepositAmount(String(preset))}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-mono text-slate-300"
                    >
                      +{preset.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowDepositModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold"
                >
                  Bekor qilish
                </button>
                <button
                  onClick={handleConfirmDeposit}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 text-xs font-semibold"
                >
                  To'ldirish
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: New Card Application */}
      <AnimatePresence>
        {showNewCardModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-white"
            >
              <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-400" />
                Yangi Virtual / Plastik Karta Ochish
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Bir zumda yangi karta oching va onlayn to'lovlar uchun foydalaning.
              </p>

              <div className="space-y-3 mb-5">
                <div>
                  <label className="text-xs text-slate-300 font-medium block mb-1">
                    To'lov tizimi:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'humo', label: 'Humo (UZS)', curr: 'UZS' },
                      { id: 'uzcard', label: 'Uzcard (UZS)', curr: 'UZS' },
                      { id: 'visa', label: 'Visa (USD)', curr: 'USD' },
                      { id: 'mastercard', label: 'Mastercard (EUR)', curr: 'EUR' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setNewCardType(item.id as CardType);
                          setNewCardCurrency(item.curr as Currency);
                        }}
                        className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between ${
                          newCardType === item.id
                            ? 'border-blue-500 bg-blue-500/10 text-white ring-1 ring-blue-500'
                            : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <span>{item.label}</span>
                        {newCardType === item.id && <Check className="w-3.5 h-3.5 text-blue-400" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-medium block mb-1">
                    Karta nomi (masalan, Onlayn xaridlar, Jamg'arma):
                  </label>
                  <input
                    type="text"
                    value={newCardName}
                    onChange={(e) => setNewCardName(e.target.value)}
                    placeholder="Masalan: Apex Premium Gold"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowNewCardModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold"
                >
                  Bekor qilish
                </button>
                <button
                  onClick={handleCreateNewCard}
                  disabled={!newCardName.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 disabled:bg-slate-700 disabled:text-slate-500 text-white hover:bg-blue-500 text-xs font-semibold"
                >
                  Kartani Faollashtirish
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
