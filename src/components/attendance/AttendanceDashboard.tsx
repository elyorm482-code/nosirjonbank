import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Clock, 
  AlertTriangle, 
  Coffee, 
  Search, 
  Filter, 
  Plus, 
  Edit3, 
  FileSpreadsheet, 
  CheckCircle, 
  ShieldCheck, 
  Phone, 
  Mail, 
  Building,
  Calendar,
  X,
  LogOut,
  Sparkles
} from 'lucide-react';
import { Employee, AttendanceRecord, Department, EmployeeStatus } from '../../types';
import { calculateLateMinutes } from '../../utils/formatters';
import { sound } from '../../utils/audio';

interface AttendanceDashboardProps {
  employees: Employee[];
  attendanceRecords: AttendanceRecord[];
  onAddEmployee: (emp: Omit<Employee, 'id'>) => void;
  onUpdateAttendance: (recordId: string, updates: Partial<AttendanceRecord>) => void;
  onManualCheckIn: (employeeId: string, time: string, note?: string) => void;
  onManualCheckOut: (employeeId: string, time: string) => void;
  soundEnabled: boolean;
}

const DEPARTMENTS: Department[] = [
  'Boshqaruv',
  'Kassa va Operatsiyalar',
  'Kreditlash bo\'limi',
  'IT va Axborot xavfsizligi',
  'Mijozlarga xizmat',
  'Buxgalteriya va Audit',
  'Valyuta nazorati',
];

export const AttendanceDashboard: React.FC<AttendanceDashboardProps> = ({
  employees,
  attendanceRecords,
  onAddEmployee,
  onUpdateAttendance,
  onManualCheckIn,
  onManualCheckOut,
  soundEnabled,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [showAddEmpModal, setShowAddEmpModal] = useState<boolean>(false);
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [showExportAlert, setShowExportAlert] = useState<boolean>(false);

  // New Employee Form State
  const [newFullName, setNewFullName] = useState<string>('');
  const [newRole, setNewRole] = useState<string>('');
  const [newDept, setNewDept] = useState<Department>('Kassa va Operatsiyalar');
  const [newPhone, setNewPhone] = useState<string>('+998 90 ');
  const [newPin, setNewPin] = useState<string>('1009');

  // Manual Edit State
  const [editCheckInTime, setEditCheckInTime] = useState<string>('');
  const [editCheckOutTime, setEditCheckOutTime] = useState<string>('');
  const [editNote, setEditNote] = useState<string>('');
  const [editStatus, setEditStatus] = useState<AttendanceRecord['status']>('on_time');

  // KPI Calculations
  const totalEmployees = employees.length;
  const activeNow = employees.filter((e) => e.status === 'active').length;
  const onBreakCount = employees.filter((e) => e.status === 'on_break').length;
  const lateCount = employees.filter((e) => e.status === 'late').length;
  const absentCount = employees.filter((e) => e.status === 'absent' || e.status === 'vacation').length;
  const presenceRate = totalEmployees > 0 ? Math.round(((activeNow + onBreakCount + lateCount) / totalEmployees) * 100) : 0;

  // Filter Employees with their today's record
  const filteredEmployees = employees.filter((emp) => {
    const matchesDept = deptFilter === 'all' || emp.department === deptFilter;
    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'active'
        ? emp.status === 'active'
        : statusFilter === 'late'
        ? emp.status === 'late'
        : statusFilter === 'on_break'
        ? emp.status === 'on_break'
        : statusFilter === 'absent'
        ? emp.status === 'absent' || emp.status === 'vacation'
        : true;

    const matchesSearch =
      emp.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.department.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesDept && matchesStatus && matchesSearch;
  });

  const handleOpenEdit = (emp: Employee) => {
    const rec = attendanceRecords.find((r) => r.employeeId === emp.id);
    if (rec) {
      setEditingRecord(rec);
      setEditCheckInTime(rec.checkInTime);
      setEditCheckOutTime(rec.checkOutTime || '');
      setEditNote(rec.note || '');
      setEditStatus(rec.status);
    } else {
      // Create record on the fly for absent employee
      onManualCheckIn(emp.id, '09:00', 'Admin tomonidan qayd etildi');
    }
  };

  const handleSaveEdit = () => {
    if (!editingRecord) return;
    const lateMin = calculateLateMinutes(editCheckInTime, '09:00');
    onUpdateAttendance(editingRecord.id, {
      checkInTime: editCheckInTime,
      checkOutTime: editCheckOutTime || undefined,
      status: lateMin > 0 ? 'late' : editStatus,
      lateMinutes: lateMin,
      note: editNote,
    });
    setEditingRecord(null);
    if (soundEnabled) sound.playSuccess();
  };

  const handleCreateEmployee = () => {
    if (!newFullName.trim() || !newRole.trim()) return;

    onAddEmployee({
      fullName: newFullName.trim(),
      role: newRole.trim(),
      department: newDept,
      phone: newPhone.trim(),
      email: `${newFullName.toLowerCase().replace(/\s+/g, '.')}@apexbank.uz`,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      pin: newPin || '1234',
      hireDate: new Date().toISOString().split('T')[0],
      shiftStartTime: '09:00',
      shiftEndTime: '18:00',
      status: 'active',
      currentCheckInTime: '08:55',
    });

    setShowAddEmpModal(false);
    setNewFullName('');
    setNewRole('');
    if (soundEnabled) sound.playSuccess();
  };

  return (
    <div className="space-y-6">
      
      {/* Top Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/70 border border-slate-800 rounded-2xl p-4 sm:p-6 backdrop-blur-md shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
              <Users className="w-6 h-6 text-indigo-400" />
              Hodimlar Davomatini Kuzatish Admin Paneli
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              JONLI MONITORING
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Bank filial hodimlarining kelib-ketish vaqti, kechikishlar daqiqasi va ish rejimi
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              if (soundEnabled) sound.playClick();
              setShowExportAlert(true);
              setTimeout(() => setShowExportAlert(false), 3000);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Excel Hisobot</span>
          </button>

          <button
            onClick={() => {
              if (soundEnabled) sound.playClick();
              setShowAddEmpModal(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Yangi Hodim Qo'shish</span>
          </button>
        </div>
      </div>

      {showExportAlert && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2"
        >
          <CheckCircle className="w-4 h-4" />
          <span>Bugungi to'liq davomat hisoboti (Excel/CSV) muvaffaqiyatli generatsiya qilindi!</span>
        </motion.div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        
        {/* Total */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-sm shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400">Jami Hodimlar</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-white">{totalEmployees} nafar</div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Shtat bo'yicha</span>
        </div>

        {/* Present in Office */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-emerald-500/20 backdrop-blur-sm shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-emerald-400">Hozir Ishda</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {activeNow + lateCount} <span className="text-xs text-slate-400 font-sans font-normal">({presenceRate}%)</span>
          </div>
          <span className="text-[10px] text-emerald-400/80 mt-0.5 block">Filialda mavjud</span>
        </div>

        {/* Latecomers */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-rose-500/20 backdrop-blur-sm shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-rose-400">Kechikkanlar</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-rose-400">{lateCount} nafar</div>
          <span className="text-[10px] text-rose-400/80 mt-0.5 block">09:00 dan keyin</span>
        </div>

        {/* Lunch Break */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-amber-500/20 backdrop-blur-sm shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-amber-400">Tushlikda</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Coffee className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400">{onBreakCount} nafar</div>
          <span className="text-[10px] text-amber-400/80 mt-0.5 block">Tanaffus vaqti</span>
        </div>

        {/* Absent */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-sm shadow-md col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400">Kelmagan / Sababli</span>
            <div className="p-2 rounded-xl bg-slate-800 text-slate-400">
              <UserX className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-300">{absentCount} nafar</div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Ta'til yoki kasallik</span>
        </div>

      </div>

      {/* Main Table Container */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 sm:p-6 backdrop-blur-md shadow-xl">
        
        {/* Table Filters & Search */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-5">
          
          {/* Status buttons */}
          <div className="flex flex-wrap gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800">
            {[
              { id: 'all', label: 'Barchasi' },
              { id: 'active', label: 'Ishda' },
              { id: 'late', label: 'Kechikkanlar' },
              { id: 'on_break', label: 'Tushlikda' },
              { id: 'absent', label: 'Kelmaganlar' },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setStatusFilter(st.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  statusFilter === st.id
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Department dropdown */}
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-medium focus:outline-none focus:border-indigo-500"
            >
              <option value="all">Barcha bo'limlar</option>
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>

            {/* Search */}
            <div className="relative flex-1 sm:w-60">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Hodim ismi yoki lavozimi..."
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

        </div>

        {/* Live Attendance Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3">Hodim</th>
                <th className="py-3 px-3">Bo'lim va Lavozim</th>
                <th className="py-3 px-3">Ish Grafigi</th>
                <th className="py-3 px-3">Kelgan Vaqti</th>
                <th className="py-3 px-3">Ketgan Vaqti</th>
                <th className="py-3 px-3">Holati & Kechikish</th>
                <th className="py-3 px-3">Qayd Usuli</th>
                <th className="py-3 px-3 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredEmployees.map((emp) => {
                const rec = attendanceRecords.find((r) => r.employeeId === emp.id);
                const isLate = emp.status === 'late' || (rec && rec.status === 'late');
                const lateMin = rec?.lateMinutes || 0;

                return (
                  <tr key={emp.id} className="hover:bg-slate-800/30 transition">
                    
                    {/* Employee Profile */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={emp.avatar}
                          alt={emp.fullName}
                          referrerPolicy="no-referrer"
                          className="w-9 h-9 rounded-full object-cover border border-slate-700 shadow"
                        />
                        <div>
                          <div className="font-bold text-white text-xs sm:text-sm">
                            {emp.fullName}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                            <Phone className="w-2.5 h-2.5" />
                            {emp.phone}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Department & Role */}
                    <td className="py-3 px-3">
                      <div className="text-slate-200 font-medium">{emp.role}</div>
                      <div className="text-[10px] text-slate-400">{emp.department}</div>
                    </td>

                    {/* Shift Schedule */}
                    <td className="py-3 px-3 font-mono text-slate-300">
                      {emp.shiftStartTime} - {emp.shiftEndTime}
                    </td>

                    {/* Check In Time */}
                    <td className="py-3 px-3">
                      {emp.currentCheckInTime || rec?.checkInTime ? (
                        <div className="font-mono font-bold text-white flex items-center gap-1">
                          <Clock className="w-3 h-3 text-indigo-400" />
                          <span>{emp.currentCheckInTime || rec?.checkInTime}</span>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">Qayd etilmagan</span>
                      )}
                    </td>

                    {/* Check Out Time */}
                    <td className="py-3 px-3">
                      {emp.currentCheckOutTime || rec?.checkOutTime ? (
                        <div className="font-mono text-slate-300">
                          {emp.currentCheckOutTime || rec?.checkOutTime}
                        </div>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-3">
                      {emp.status === 'active' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          O'z vaqtida (Ishda)
                        </span>
                      )}

                      {emp.status === 'late' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          <AlertTriangle className="w-3 h-3" />
                          Kechikkan {lateMin > 0 ? `(+${lateMin} daqiqa)` : ''}
                        </span>
                      )}

                      {emp.status === 'on_break' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          <Coffee className="w-3 h-3" />
                          Tushlikda
                        </span>
                      )}

                      {emp.status === 'absent' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                          <UserX className="w-3 h-3" />
                          Kelmagan / Sababli
                        </span>
                      )}
                    </td>

                    {/* Verification Method */}
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-medium">
                        {rec?.method || 'Kiosk'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(emp)}
                          title="Davomatni tahrirlash"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {emp.status === 'active' && (
                          <button
                            onClick={() => {
                              const nowTime = new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
                              onManualCheckOut(emp.id, nowTime);
                              if (soundEnabled) sound.playClick();
                            }}
                            title="Ishni yakunlash (Ketdi)"
                            className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 transition text-[10px] font-semibold flex items-center gap-1"
                          >
                            <LogOut className="w-3 h-3" />
                            <span>Ketdi</span>
                          </button>
                        )}
                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>

      {/* Modal: Add New Employee */}
      <AnimatePresence>
        {showAddEmpModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-white"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-indigo-400" />
                  Yangi Bank Hodimini Ro'yxatga Olish
                </h3>
                <button
                  onClick={() => setShowAddEmpModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3.5 mb-5 text-xs">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">
                    To'liq ismi sharifi (F.I.Sh):
                  </label>
                  <input
                    type="text"
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    placeholder="Masalan: Sardor Komilov"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">Lavozimi:</label>
                  <input
                    type="text"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    placeholder="Masalan: Yetakchi kredit mutaxassisi"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">Bo'limi:</label>
                  <select
                    value={newDept}
                    onChange={(e) => setNewDept(e.target.value as Department)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm font-medium"
                  >
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-300 font-medium block mb-1">Telefon:</label>
                    <input
                      type="text"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 font-medium block mb-1">
                      Kiosk PIN-Kodi (4 xonali):
                    </label>
                    <input
                      type="text"
                      value={newPin}
                      maxLength={4}
                      onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-sm font-bold text-center tracking-widest"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowAddEmpModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold"
                >
                  Bekor qilish
                </button>
                <button
                  onClick={handleCreateEmployee}
                  disabled={!newFullName.trim() || !newRole.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 disabled:opacity-50 text-white hover:bg-indigo-500 text-xs font-semibold"
                >
                  Hodimni Saqlash
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Edit Attendance Record */}
      <AnimatePresence>
        {editingRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-white"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-indigo-400" />
                  Davomat Ma'lumotini Tahrirlash
                </h3>
                <button
                  onClick={() => setEditingRecord(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3.5 mb-5 text-xs">
                <p className="text-slate-400">
                  Hodim: <span className="font-bold text-white">{editingRecord.employeeName}</span> ({editingRecord.department})
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-300 font-medium block mb-1">
                      Kelgan vaqti (HH:MM):
                    </label>
                    <input
                      type="text"
                      value={editCheckInTime}
                      onChange={(e) => setEditCheckInTime(e.target.value)}
                      placeholder="08:50"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-sm font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-medium block mb-1">
                      Ketgan vaqti (HH:MM):
                    </label>
                    <input
                      type="text"
                      value={editCheckOutTime}
                      onChange={(e) => setEditCheckOutTime(e.target.value)}
                      placeholder="18:05"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-sm font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">Izoh / Sabab:</label>
                  <input
                    type="text"
                    value={editNote}
                    onChange={(e) => setEditNote(e.target.value)}
                    placeholder="Masalan: Tirbandlik yoki xizmat safari"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setEditingRecord(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold"
                >
                  Bekor qilish
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 text-xs font-semibold"
                >
                  O'zgarishlarni Saqlash
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
