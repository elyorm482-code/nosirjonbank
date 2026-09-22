import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  CreditCard, 
  Users, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  Bell, 
  ShieldCheck, 
  Volume2, 
  VolumeX,
  Sparkles
} from 'lucide-react';
import { CurrencyRate } from '../types';
import { CURRENCY_RATES } from '../data/mockData';

interface HeaderProps {
  activeTab: 'banking' | 'attendance' | 'kiosk';
  setActiveTab: (tab: 'banking' | 'attendance' | 'kiosk') => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  unreadCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  soundEnabled,
  setSoundEnabled,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('uz-UZ', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      );
      setCurrentDate(
        now.toLocaleDateString('uz-UZ', {
          weekday: 'short',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/85 backdrop-blur-md text-white transition-all">
      {/* Top Banner: Exchange Rates & Status */}
      <div className="hidden md:flex items-center justify-between px-6 py-1.5 border-b border-slate-900 bg-slate-900/60 text-xs text-slate-400">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1.5 font-medium text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Markaziy Bank Litsenziyasi № 48-B | Xavfsiz tizim</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-slate-500 font-semibold tracking-wider text-[11px]">VALYUTA KURSLARI:</span>
            {CURRENCY_RATES.map((rate: CurrencyRate) => (
              <div key={rate.code} className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-300">1 {rate.code} =</span>
                <span className="text-white font-mono">{rate.sell.toLocaleString()} so'm</span>
                {rate.diff >= 0 ? (
                  <span className="flex items-center text-emerald-400 text-[10px]">
                    <TrendingUp className="w-3 h-3 mr-0.5" />+{rate.diff}
                  </span>
                ) : (
                  <span className="flex items-center text-rose-400 text-[10px]">
                    <TrendingDown className="w-3 h-3 mr-0.5" />{rate.diff}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-slate-300 font-mono">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span>{currentDate}</span>
            <span className="font-bold text-white px-1.5 py-0.5 rounded bg-slate-800/80 text-[11px]">
              {currentTime}
            </span>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & Identity */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('banking')}>
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg sm:text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  APEX BANK
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 uppercase tracking-widest">
                  PRO
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Onlayn Bank va Davomat Tizimi
              </p>
            </div>
          </div>

          {/* Navigation Pill Tabs */}
          <nav className="flex items-center p-1 rounded-xl bg-slate-900/90 border border-slate-800 shadow-inner">
            <button
              id="tab-banking"
              onClick={() => setActiveTab('banking')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'banking'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Mijoz Banki</span>
            </button>

            <button
              id="tab-attendance"
              onClick={() => setActiveTab('attendance')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'attendance'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Hodimlar Admin Paneli</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping hidden sm:inline-block" />
            </button>

            <button
              id="tab-kiosk"
              onClick={() => setActiveTab('kiosk')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'kiosk'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span className="hidden sm:inline">Davomat</span> Terminali
            </button>
          </nav>

          {/* Right Action Tools */}
          <div className="flex items-center gap-2">
            <button
              id="sound-toggle-btn"
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? "Ovozli effektlarni o'chirish" : "Ovozli effektlarni yoqish"}
              className="p-2 sm:p-2.5 rounded-lg border border-slate-800 bg-slate-900/60 text-slate-300 hover:text-white hover:bg-slate-800 transition"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            </button>

            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-800">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-xs text-white shadow">
                EM
              </div>
              <div className="text-left text-xs">
                <div className="font-semibold text-white">Elyor Mahmudov</div>
                <div className="text-[10px] text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 inline" /> Tasdiqlangan
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
};
