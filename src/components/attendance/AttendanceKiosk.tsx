import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Clock, 
  LogIn, 
  LogOut, 
  Coffee, 
  CheckCircle, 
  AlertTriangle, 
  KeyRound, 
  Fingerprint, 
  Sparkles, 
  Building2, 
  Check, 
  X,
  User
} from 'lucide-react';
import { Employee, AttendanceRecord } from '../../types';
import { calculateLateMinutes } from '../../utils/formatters';
import { sound } from '../../utils/audio';

interface AttendanceKioskProps {
  employees: Employee[];
  onCheckIn: (employeeId: string, time: string, isLate: boolean, lateMinutes: number) => void;
  onCheckOut: (employeeId: string, time: string) => void;
  onToggleBreak: (employeeId: string) => void;
  soundEnabled: boolean;
}

export const AttendanceKiosk: React.FC<AttendanceKioskProps> = ({
  employees,
  onCheckIn,
  onCheckOut,
  onToggleBreak,
  soundEnabled,
}) => {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(employees[0]?.id || '');
  const [pinInput, setPinInput] = useState<string>('');
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [lastActionFeedback, setLastActionFeedback] = useState<{
    type: 'check_in' | 'check_out' | 'break';
    employeeName: string;
    time: string;
    isLate?: boolean;
    lateMinutes?: number;
  } | null>(null);

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
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      );
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const activeEmployee = employees.find((e) => e.id === selectedEmployeeId) || employees[0];

  const handleQuickKeypad = (num: string) => {
    if (soundEnabled) sound.playClick();
    if (pinInput.length < 4) {
      const updated = pinInput + num;
      setPinInput(updated);
      if (updated.length === 4) {
        // Auto match employee with PIN
        const found = employees.find((e) => e.pin === updated);
        if (found) {
          setSelectedEmployeeId(found.id);
        }
      }
    }
  };

  const handleCheckIn = () => {
    if (!activeEmployee) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const lateMin = calculateLateMinutes(timeStr.slice(0, 5), activeEmployee.shiftStartTime || '09:00');
    const isLate = lateMin > 0;

    onCheckIn(activeEmployee.id, timeStr, isLate, lateMin);
    if (soundEnabled) sound.playAttendanceBell(isLate);

    setLastActionFeedback({
      type: 'check_in',
      employeeName: activeEmployee.fullName,
      time: timeStr,
      isLate,
      lateMinutes: lateMin,
    });

    setPinInput('');
    setTimeout(() => setLastActionFeedback(null), 4000);
  };

  const handleCheckOut = () => {
    if (!activeEmployee) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    onCheckOut(activeEmployee.id, timeStr);
    if (soundEnabled) sound.playClick();

    setLastActionFeedback({
      type: 'check_out',
      employeeName: activeEmployee.fullName,
      time: timeStr,
    });

    setPinInput('');
    setTimeout(() => setLastActionFeedback(null), 4000);
  };

  const handleBreak = () => {
    if (!activeEmployee) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });

    onToggleBreak(activeEmployee.id);
    if (soundEnabled) sound.playClick();

    setLastActionFeedback({
      type: 'break',
      employeeName: activeEmployee.fullName,
      time: timeStr,
    });

    setPinInput('');
    setTimeout(() => setLastActionFeedback(null), 4000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Terminal Title Banner */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-2">
          <Fingerprint className="w-3.5 h-3.5" />
          <span>Elektron Biometrik Davomat Terminali (Kiosk)</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">
          Ish vaqtini qayd etish
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Ismingizni tanlang yoki PIN-kod kiriting va kelgan/ketganingizni belgilang
        </p>
      </div>

      {/* Main Terminal Screen */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
        
        {/* Large Live Digital Clock */}
        <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-950/80 border border-slate-800/80 mb-6 text-center">
          <span className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-1">
            {currentDate}
          </span>
          <div className="text-4xl sm:text-6xl font-black font-mono tracking-tight text-white drop-shadow-md">
            {currentTime || '09:00:00'}
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Markaziy Toshkent filiali serveriga ulangan</span>
          </div>
        </div>

        {/* Employee Selection & Keypad Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Left: Quick Employee Picker */}
          <div className="md:col-span-7 space-y-3">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              1. Hodimni tanlang:
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-1">
              {employees.map((emp) => {
                const isSelected = emp.id === activeEmployee.id;
                return (
                  <button
                    key={emp.id}
                    onClick={() => {
                      if (soundEnabled) sound.playClick();
                      setSelectedEmployeeId(emp.id);
                    }}
                    className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2.5 ${
                      isSelected
                        ? 'bg-blue-600/20 border-blue-500 ring-1 ring-blue-500'
                        : 'bg-slate-950/60 border-slate-800 hover:bg-slate-800/40 hover:border-slate-700'
                    }`}
                  >
                    <img
                      src={emp.avatar}
                      alt={emp.fullName}
                      referrerPolicy="no-referrer"
                      className="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-700"
                    />
                    <div className="truncate">
                      <div className="text-xs font-bold text-white truncate">
                        {emp.fullName}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {emp.role}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Active Selected Card Info */}
            <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 flex items-center justify-between mt-3">
              <div className="flex items-center gap-3">
                <img
                  src={activeEmployee.avatar}
                  alt={activeEmployee.fullName}
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-full object-cover border-2 border-indigo-500 shadow-md"
                />
                <div>
                  <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">
                    Tanlangan hodim
                  </span>
                  <div className="text-sm font-bold text-white">
                    {activeEmployee.fullName}
                  </div>
                  <div className="text-xs text-slate-400">
                    {activeEmployee.department}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-500 uppercase block">Joriy Holat</span>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                    activeEmployee.status === 'active'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : activeEmployee.status === 'late'
                      ? 'bg-rose-500/20 text-rose-400'
                      : activeEmployee.status === 'on_break'
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {activeEmployee.status === 'active'
                    ? 'Ishda'
                    : activeEmployee.status === 'late'
                    ? 'Kechikkan'
                    : activeEmployee.status === 'on_break'
                    ? 'Tushlikda'
                    : 'Kelmagan'}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Keypad & Action Buttons */}
          <div className="md:col-span-5 flex flex-col justify-between space-y-4">
            
            {/* PIN Code entry simulation */}
            <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-blue-400" />
                  PIN-KOD:
                </span>
                <button
                  onClick={() => setPinInput('')}
                  className="text-[10px] text-slate-500 hover:text-white"
                >
                  Tozalash
                </button>
              </div>

              <div className="flex justify-center gap-3 my-2">
                {[0, 1, 2, 3].map((idx) => (
                  <div
                    key={idx}
                    className={`w-9 h-9 rounded-xl border flex items-center justify-center font-mono font-bold text-lg ${
                      pinInput[idx]
                        ? 'border-blue-500 bg-blue-500/20 text-white'
                        : 'border-slate-800 bg-slate-900 text-slate-600'
                    }`}
                  >
                    {pinInput[idx] ? '●' : ''}
                  </div>
                ))}
              </div>

              {/* Number pad */}
              <div className="grid grid-cols-3 gap-1.5 mt-2">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '✓'].map((key) => (
                  <button
                    key={key}
                    onClick={() => {
                      if (key === 'C') setPinInput('');
                      else if (key === '✓') {
                        const found = employees.find((e) => e.pin === pinInput);
                        if (found) setSelectedEmployeeId(found.id);
                      } else {
                        handleQuickKeypad(key);
                      }
                    }}
                    className="py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 font-mono text-xs font-bold border border-slate-800 transition"
                  >
                    {key}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Check-in / Out Action Buttons */}
            <div className="space-y-2">
              <button
                id="kiosk-checkin-btn"
                onClick={handleCheckIn}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm tracking-wide shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition"
              >
                <LogIn className="w-5 h-5" />
                <span>🟢 KELDIM (Ishni boshlash)</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  id="kiosk-break-btn"
                  onClick={handleBreak}
                  className="py-2.5 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 font-bold text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <Coffee className="w-4 h-4" />
                  <span>☕ Tushlik</span>
                </button>

                <button
                  id="kiosk-checkout-btn"
                  onClick={handleCheckOut}
                  className="py-2.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 font-bold text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <LogOut className="w-4 h-4" />
                  <span>🔴 KETDIM</span>
                </button>
              </div>
            </div>

          </div>

        </div>

        {/* Feedback Overlay Animation */}
        <AnimatePresence>
          {lastActionFeedback && (
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 20 }}
              className="absolute inset-x-6 top-12 z-30 p-6 rounded-3xl bg-slate-900/95 border-2 border-emerald-500 shadow-2xl backdrop-blur-md text-center text-white"
            >
              <div
                className={`w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center shadow-lg ${
                  lastActionFeedback.type === 'check_in'
                    ? lastActionFeedback.isLate
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                }`}
              >
                {lastActionFeedback.isLate ? (
                  <AlertTriangle className="w-8 h-8" />
                ) : (
                  <CheckCircle className="w-8 h-8" />
                )}
              </div>

              <h2 className="text-xl font-bold">
                {lastActionFeedback.type === 'check_in'
                  ? lastActionFeedback.isLate
                    ? 'Kechikish bilan qayd etildi!'
                    : "Xush kelibsiz! O'z vaqtida kelindi."
                  : lastActionFeedback.type === 'check_out'
                  ? 'Ish vaqti yakunlandi!'
                  : 'Tushlik holati o\'zgartirildi!'}
              </h2>

              <p className="text-sm text-slate-300 mt-1">
                <span className="font-bold text-white">{lastActionFeedback.employeeName}</span>{' '}
                — Vaqt: <span className="font-mono font-bold text-emerald-400">{lastActionFeedback.time}</span>
              </p>

              {lastActionFeedback.isLate && (
                <div className="text-xs text-rose-400 font-semibold mt-2">
                  Ogohlantirish: +{lastActionFeedback.lateMinutes} daqiqa kechikdingiz (Reja: 09:00)
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};
