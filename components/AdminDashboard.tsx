import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Users, 
  Calendar, 
  Ticket, 
  Plus, 
  Edit3, 
  Trash2, 
  Download, 
  Search, 
  Clock, 
  X, 
  UserCheck, 
  GraduationCap 
} from 'lucide-react';
import { Booking, Guest, Session, User } from '../types';
import { api } from '../lib/api';

interface AdminDashboardProps {
  sessions: Session[];
  guests: Guest[];
  onRefreshData: () => void;
  currentUser: User | null;
  onOpenAuth: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  sessions,
  guests,
  onRefreshData,
  currentUser,
  onOpenAuth,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'sessions' | 'bookings' | 'waitlist' | 'guests'>('overview');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [adminWaitlist, setAdminWaitlist] = useState<import('../types').WaitlistEntry[]>([]);
  const [stats, setStats] = useState({
    totalSessions: 0,
    totalBookings: 0,
    attendedCount: 0,
    totalSeatsCapacity: 0,
    bookedSeatsCount: 0,
    remainingSeats: 0,
    attendanceRate: 0,
  });

  const [searchBooking, setSearchBooking] = useState('');
  const [filterDay, setFilterDay] = useState('all');
  const [filterAttended, setFilterAttended] = useState('all');

  // Session Edit / Create State
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [sessionFormData, setSessionFormData] = useState<Partial<Session>>({
    guestName: '',
    title: '',
    dayKey: 'tuesday',
    dayName: 'الثلاثاء',
    dateStr: '2026-08-25',
    dateLabel: 'الثلاثاء 25 أغسطس 2026',
    startTimeStr: '10:00 AM',
    endTimeStr: '11:00 AM',
    startIso: '2026-08-25T10:00:00',
    endIso: '2026-08-25T11:00:00',
    fields: ['الإرشاد الأكاديمي'],
    location: 'عمادة شؤون الطلاب',
    totalSeats: 6,
    bookedSeats: 0,
    isOpen: true,
    description: '',
  });

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // In-App Delete Confirmation Modal State (Reliable inside iframe)
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState<{
    isOpen: boolean;
    type: 'session' | 'booking' | 'waitlist' | 'guest';
    id: string;
    title: string;
    description: string;
  } | null>(null);

  const fetchBookingsAndStats = async () => {
    try {
      const [bList, wList, s] = await Promise.all([
        api.getBookings(),
        api.getWaitlist(),
        api.getStats(),
      ]);
      setBookings(bList);
      setAdminWaitlist(wList);
      if (s) setStats(s);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchBookingsAndStats();
  }, [sessions]);

  // Session form handlers
  const handleOpenEditSession = (session: Session) => {
    setEditingSession(session);
    setIsCreatingSession(false);
    setSessionFormData({ ...session });
  };

  const handleOpenCreateSession = () => {
    setIsCreatingSession(true);
    setEditingSession(null);
    setSessionFormData({
      guestName: guests[0]?.name || 'د. جديد',
      title: '',
      dayKey: 'tuesday',
      dayName: 'الثلاثاء',
      dateStr: '2026-08-25',
      dateLabel: 'الثلاثاء 25 أغسطس 2026',
      startTimeStr: '10:00 AM',
      endTimeStr: '11:00 AM',
      startIso: '2026-08-25T10:00:00',
      endIso: '2026-08-25T11:00:00',
      fields: ['الإرشاد الأكاديمي'],
      location: 'عمادة شؤون الطلاب',
      totalSeats: 6,
      bookedSeats: 0,
      isOpen: true,
      description: '',
    });
  };

  const handleSaveSession = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSession) {
        await api.updateSession(editingSession.id, sessionFormData);
        setNotification({ type: 'success', text: 'تم تحديث بيانات الجلسة بنجاح' });
      } else {
        await api.createSession(sessionFormData);
        setNotification({ type: 'success', text: 'تم إنشاء الجلسة الجديدة بنجاح' });
      }
      setEditingSession(null);
      setIsCreatingSession(false);
      onRefreshData();
    } catch {
      setNotification({ type: 'error', text: 'حدث خطأ أثناء حفظ الجلسة' });
    }
  };

  const executeDeleteAction = async () => {
    if (!deleteConfirmDialog) return;
    const { type, id } = deleteConfirmDialog;
    setDeleteConfirmDialog(null);

    try {
      if (type === 'session') {
        await api.deleteSession(id);
        setNotification({ type: 'success', text: 'تم حذف الجلسة بنجاح' });
        onRefreshData();
      } else if (type === 'booking') {
        const res = await api.cancelBooking(id);
        setBookings((prev) => prev.filter((b) => b.id !== id && b.bookingCode !== id));
        fetchBookingsAndStats();
        onRefreshData();
        setNotification({
          type: 'success',
          text: res.promotedStudent
            ? `تم إلغاء الحجز وترقية الطالب (${res.promotedStudent}) من قائمة الانتظار برقم ${res.promotedBookingCode}`
            : 'تم إلغاء حجز الطالب بنجاح وتحرير المقعد',
        });
      } else if (type === 'waitlist') {
        await api.cancelWaitlist(id);
        fetchBookingsAndStats();
        setNotification({ type: 'success', text: 'تمت إزالة الطالب من قائمة الانتظار بنجاح' });
      } else if (type === 'guest') {
        await fetch(`/api/guests/${id}`, { method: 'DELETE' });
        onRefreshData();
        setNotification({ type: 'success', text: 'تم حذف الضيف بنجاح' });
      }
    } catch {
      setNotification({ type: 'error', text: 'حدث خطأ أثناء تنفيذ عملية الحذف' });
    }
  };

  const handleToggleAttendance = async (bookingId: string) => {
    try {
      const res = await api.toggleAttendance(bookingId);
      if (res.success && res.booking) {
        setBookings((prev) => prev.map((b) => (b.id === bookingId ? res.booking! : b)));
        fetchBookingsAndStats();
        onRefreshData();
        if (res.promotedStudent) {
          setNotification({
            type: 'success',
            text: res.message || `تم تسجيل الحضور وترقية الطالب (${res.promotedStudent}) من قائمة الانتظار برقم حجز ${res.promotedBookingCode}`,
          });
        } else {
          setNotification({
            type: 'success',
            text: `تم ${res.booking.attended ? 'تسجيل حضور' : 'إلغاء حضور'} الطالب بنجاح`,
          });
        }
      }
    } catch {
      setNotification({ type: 'error', text: 'تعذر تحديث حالة الحضور' });
    }
  };

  const exportCSV = async () => {
    try {
      const res = await fetch('/api/export-bookings');
      if (!res.ok) throw new Error('فشل تحميل الملف');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'orientation-bookings.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      setNotification({ type: 'success', text: 'تم تحميل ملف CSV بنجاح' });
    } catch {
      setNotification({ type: 'error', text: 'تعذر تصدير ملف الحجوزات' });
    }
  };

  // Filter bookings
  const filteredBookings = bookings.filter((b) => {
    const matchesSearch =
      b.studentName.toLowerCase().includes(searchBooking.toLowerCase()) ||
      b.universityId.toLowerCase().includes(searchBooking.toLowerCase()) ||
      b.bookingCode.toLowerCase().includes(searchBooking.toLowerCase()) ||
      b.guestName.toLowerCase().includes(searchBooking.toLowerCase());

    const matchesDay =
      filterDay === 'all' ||
      (filterDay === 'tuesday' && b.dateLabel.includes('25')) ||
      (filterDay === 'wednesday' && b.dateLabel.includes('26')) ||
      (filterDay === 'thursday' && b.dateLabel.includes('27'));

    const matchesAttended =
      filterAttended === 'all' ||
      (filterAttended === 'yes' && b.attended) ||
      (filterAttended === 'no' && !b.attended);

    return matchesSearch && matchesDay && matchesAttended;
  });

  return (
    <div className="py-10 bg-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Admin Header */}
        <div className="bg-slate-950 text-white rounded-3xl p-6 sm:p-8 mb-8 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-sky-400">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-white">لوحة تحكم المشرفين</h1>
                <span className="text-xs font-bold bg-blue-600 text-white px-2.5 py-0.5 rounded-full">
                  عمادة شؤون الطلاب
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                إدارة جلسات أسبوع المستجدين 2026، سجل الحجوزات، وتأكيد الحضور
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <button
              onClick={exportCSV}
              id="export-csv-btn"
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>تصدير البيانات (CSV)</span>
            </button>
          </div>
        </div>

        {/* Notification banner */}
        {notification && (
          <div
            className={`p-4 rounded-2xl text-xs font-bold mb-6 flex items-center justify-between animate-in fade-in ${
              notification.type === 'success'
                ? 'bg-blue-50 text-blue-800 border border-blue-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            <span>{notification.text}</span>
            <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-600">
              ✕
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mb-6 border-b border-slate-200 pb-2 overflow-x-auto">
          {[
            { id: 'overview', label: 'نظرة عامة وإحصائيات', icon: Clock },
            { id: 'sessions', label: `إدارة الجلسات (${sessions.length})`, icon: Calendar },
            { id: 'bookings', label: `سجل الحجوزات (${bookings.length})`, icon: Ticket },
            { id: 'waitlist', label: `قائمة الانتظار (${adminWaitlist.length})`, icon: Users },
            { id: 'guests', label: `الضيوف (${guests.length})`, icon: GraduationCap },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`admin-tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                    : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* --- 1. OVERVIEW STATS TAB --- */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Sessions */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-500 font-bold">إجمالي الجلسات</span>
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                    <Calendar className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
                  {stats.totalSessions || sessions.length}
                </p>
                <span className="text-[11px] text-slate-400 mt-1 block">على مدار 3 أيام</span>
              </div>

              {/* Total Bookings */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-500 font-bold">إجمالي الحجوزات</span>
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                    <Ticket className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl sm:text-3xl font-black text-blue-700 font-mono">
                  {stats.totalBookings || bookings.length}
                </p>
                <span className="text-[11px] text-blue-600 font-bold mt-1 block">
                  طالب وطالبة مسجلين
                </span>
              </div>

              {/* Attendance Count */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-500 font-bold">الحضور المؤكد</span>
                  <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center">
                    <UserCheck className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl sm:text-3xl font-black text-sky-700 font-mono">
                  {stats.attendedCount || bookings.filter((b) => b.attended).length}
                </p>
                <span className="text-[11px] text-sky-600 font-bold mt-1 block">
                  نسبة الحضور {stats.attendanceRate}%
                </span>
              </div>

              {/* Remaining Seats */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-500 font-bold">المقاعد المتبقية</span>
                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl sm:text-3xl font-black text-slate-800 font-mono">
                  {stats.remainingSeats}
                </p>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  من إجمالي {stats.totalSeatsCapacity} مقعد
                </span>
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
              <h3 className="text-base font-extrabold text-slate-900 mb-4 flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-600" />
                <span>إجراءات المشرف السريعة</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={handleOpenCreateSession}
                  className="p-4 bg-blue-50 hover:bg-blue-100 text-blue-950 rounded-2xl border border-blue-200 text-right transition-colors cursor-pointer"
                >
                  <Plus className="w-6 h-6 text-blue-700 mb-2" />
                  <p className="font-bold text-sm">إضافة جلسة حوارية جديدة</p>
                  <p className="text-xs text-blue-700 mt-0.5">تحديد الضيف والموعد وعدد المقاعد</p>
                </button>

                <button
                  onClick={exportCSV}
                  className="p-4 bg-slate-50 hover:bg-slate-100 text-slate-900 rounded-2xl border border-slate-200 text-right transition-colors cursor-pointer"
                >
                  <Download className="w-6 h-6 text-slate-700 mb-2" />
                  <p className="font-bold text-sm">تحميل كشف الحضور (Excel / CSV)</p>
                  <p className="text-xs text-slate-600 mt-0.5">تصدير شامل لجميع بيانات الطلاب والحضور</p>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- 2. SESSIONS MANAGEMENT TAB --- */}
        {activeTab === 'sessions' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">إدارة وتعديل الجلسات</h3>
                <p className="text-xs text-slate-500">يمكنك تعديل المواعيد، المجالات، المقاعد وحالة الحجز</p>
              </div>
              <button
                onClick={handleOpenCreateSession}
                id="admin-add-session-btn"
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة جلسة جديدة</span>
              </button>
            </div>

            {/* Sessions Table */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3.5">الضيف</th>
                      <th className="p-3.5">المجال</th>
                      <th className="p-3.5">اليوم والتاريخ</th>
                      <th className="p-3.5">الوقت</th>
                      <th className="p-3.5 text-center">المقاعد (المحجوز / الإجمالي)</th>
                      <th className="p-3.5 text-center">حالة الحجز</th>
                      <th className="p-3.5 text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sessions.map((sess) => (
                      <tr key={sess.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3.5 font-bold text-slate-900">{sess.guestName}</td>
                        <td className="p-3.5">
                          <div className="flex flex-wrap gap-1">
                            {sess.fields.map((f, i) => (
                              <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-800 rounded text-[11px] font-bold">
                                {f}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-3.5 text-slate-700 font-medium">{sess.dateLabel}</td>
                        <td className="p-3.5 font-mono text-slate-600 dir-ltr text-right">
                          {sess.startTimeStr} - {sess.endTimeStr}
                        </td>
                        <td className="p-3.5 text-center font-mono font-bold">
                          <span className="text-blue-700">{sess.bookedSeats}</span> / {sess.totalSeats}
                        </td>
                        <td className="p-3.5 text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              sess.isOpen ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {sess.isOpen ? 'مفتوح' : 'مغلق'}
                          </span>
                        </td>
                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenEditSession(sess)}
                              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-700 hover:text-blue-700 cursor-pointer"
                              title="تعديل"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() =>
                                setDeleteConfirmDialog({
                                  isOpen: true,
                                  type: 'session',
                                  id: sess.id,
                                  title: 'حذف الجلسة الحوارية',
                                  description: `هل أنت متأكد من رغبتك في حذف جلسة (${sess.guestName}) المقررة في (${sess.dateLabel}) نهائياً؟ سيتم إلغاء كافة الحجوزات المرتبطة بها.`,
                                })
                              }
                              className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 cursor-pointer transition-colors"
                              title="حذف الجلسة"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* --- 3. BOOKINGS MANAGEMENT TAB --- */}
        {activeTab === 'bookings' && (
          <div className="space-y-4">
            {/* Search & Filters */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="relative w-full md:w-80">
                <input
                  type="text"
                  value={searchBooking}
                  onChange={(e) => setSearchBooking(e.target.value)}
                  placeholder="ابحث بالطالب، الرقم الجامعي، أو رقم الحجز..."
                  className="w-full px-3.5 py-2.5 pr-10 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-hidden"
                />
                <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <select
                  value={filterDay}
                  onChange={(e) => setFilterDay(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                >
                  <option value="all">جميع الأيام</option>
                  <option value="tuesday">الثلاثاء 25 أغسطس</option>
                  <option value="wednesday">الأربعاء 26 أغسطس</option>
                  <option value="thursday">الخميس 27 أغسطس</option>
                </select>

                <select
                  value={filterAttended}
                  onChange={(e) => setFilterAttended(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                >
                  <option value="all">كل حالات الحضور</option>
                  <option value="yes">حضر فقط</option>
                  <option value="no">لم يحضر بعد</option>
                </select>
              </div>
            </div>

            {/* Bookings Table */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3.5">رقم الحجز</th>
                      <th className="p-3.5">اسم الطالب</th>
                      <th className="p-3.5">الرقم الجامعي</th>
                      <th className="p-3.5">الضيف والجلسة</th>
                      <th className="p-3.5">الموعد</th>
                      <th className="p-3.5 text-center">تسجيل الحضور</th>
                      <th className="p-3.5 text-center">إلغاء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredBookings.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-blue-900">{b.bookingCode}</td>
                        <td className="p-3.5 font-bold text-slate-900">{b.studentName}</td>
                        <td className="p-3.5 font-mono text-slate-600">{b.universityId}</td>
                        <td className="p-3.5 text-slate-800">{b.guestName}</td>
                        <td className="p-3.5 text-slate-600">
                          {b.dateLabel} ({b.timeLabel})
                        </td>
                        <td className="p-3.5 text-center">
                          <button
                            onClick={() => handleToggleAttendance(b.id)}
                            className={`px-3 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                              b.attended
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700'
                            }`}
                          >
                            {b.attended ? '✓ حضر' : 'لم يحضر (اضغط للتأكيد)'}
                          </button>
                        </td>
                        <td className="p-3.5 text-center">
                          <button
                            onClick={() =>
                              setDeleteConfirmDialog({
                                isOpen: true,
                                type: 'booking',
                                id: b.id,
                                title: 'إلغاء حجز الطالب',
                                description: `هل أنت متأكد من رغبتك في إلغاء حجز الطالب (${b.studentName}) - الرقم الجامعي (${b.universityId}) لرقم الحجز [${b.bookingCode}] وتحرير المقعد؟`,
                              })
                            }
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="إلغاء الحجز"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredBookings.length === 0 && (
                      <tr>
                        <td colSpan={7} className="text-center p-8 text-slate-400">
                          لا توجد حجوزات مطابقة للبحث
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* --- 4. WAITLIST TAB --- */}
        {activeTab === 'waitlist' && (
          <div className="space-y-4 text-right">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div>
                <h3 className="text-base font-bold text-slate-900">سجل قوائم الانتظار</h3>
                <p className="text-xs text-slate-500">
                  الطلاب المسجلون على قوائم الانتظار حسب ترتيب الأسبقية والترقية التلقائية
                </p>
              </div>
              <span className="px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold rounded-xl">
                إجمالي المسجلين: {adminWaitlist.length}
              </span>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3.5">الترتيب</th>
                      <th className="p-3.5">اسم الطالب</th>
                      <th className="p-3.5">الرقم الجامعي</th>
                      <th className="p-3.5">الجوال</th>
                      <th className="p-3.5">المرشد / الجلسة</th>
                      <th className="p-3.5">حالة الانتظار</th>
                      <th className="p-3.5 text-center">إجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {adminWaitlist.map((w, idx) => (
                      <tr key={w.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3.5 font-bold font-mono text-amber-700">#{idx + 1}</td>
                        <td className="p-3.5 font-bold text-slate-900">{w.studentName}</td>
                        <td className="p-3.5 font-mono text-slate-600">{w.universityId}</td>
                        <td className="p-3.5 font-mono text-slate-600">{w.phoneNumber}</td>
                        <td className="p-3.5 text-slate-800">{w.guestName}</td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                            w.status === 'promoted'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}>
                            {w.status === 'promoted' ? 'تمت الترقية لمقعد' : 'في الانتظار'}
                          </span>
                        </td>
                        <td className="p-3.5 text-center">
                          <button
                            onClick={() =>
                              setDeleteConfirmDialog({
                                isOpen: true,
                                type: 'waitlist',
                                id: w.id,
                                title: 'إزالة من قائمة الانتظار',
                                description: `هل أنت متأكد من إزالة الطالب (${w.studentName}) - الرقم الجامعي (${w.universityId}) من قائمة انتظار جلسة (${w.guestName})؟`,
                              })
                            }
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="إزالة من الانتظار"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {adminWaitlist.length === 0 && (
                      <tr>
                        <td colSpan={7} className="text-center p-8 text-slate-400">
                          لا يوجد طلاب مسجلون في قوائم الانتظار حالياً
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* --- 5. GUESTS TAB --- */}
        {activeTab === 'guests' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900">قائمة الضيوف والمتحدثين المعتمدين</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {guests.map((g) => (
                <div key={g.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs text-right">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm">{g.name}</h4>
                      <p className="text-xs text-slate-500">{g.title}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {g.fields.map((f, i) => (
                      <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-800 text-[10px] font-bold rounded">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Edit / Create Session Modal */}
        {(editingSession || isCreatingSession) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 my-8 text-right">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                <h3 className="text-lg font-bold text-slate-900">
                  {editingSession ? 'تعديل بيانات الجلسة' : 'إضافة جلسة حوارية جديدة'}
                </h3>
                <button
                  onClick={() => {
                    setEditingSession(null);
                    setIsCreatingSession(false);
                  }}
                  className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveSession} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">اسم الضيف المتحدث *</label>
                  <input
                    type="text"
                    required
                    value={sessionFormData.guestName}
                    onChange={(e) => setSessionFormData({ ...sessionFormData, guestName: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">اليوم والتاريخ *</label>
                    <select
                      value={sessionFormData.dayKey}
                      onChange={(e) => {
                        const val = e.target.value as any;
                        const dateLabel =
                          val === 'tuesday'
                            ? 'الثلاثاء 25 أغسطس 2026'
                            : val === 'wednesday'
                            ? 'الأربعاء 26 أغسطس 2026'
                            : 'الخميس 27 أغسطس 2026';
                        setSessionFormData({
                          ...sessionFormData,
                          dayKey: val,
                          dateLabel,
                        });
                      }}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold"
                    >
                      <option value="tuesday">الثلاثاء 25 أغسطس</option>
                      <option value="wednesday">الأربعاء 26 أغسطس</option>
                      <option value="thursday">الخميس 27 أغسطس</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">إجمالي المقاعد *</label>
                    <input
                      type="number"
                      min={1}
                      max={500}
                      required
                      value={sessionFormData.totalSeats}
                      onChange={(e) => setSessionFormData({ ...sessionFormData, totalSeats: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">وقت البدء (نصياً) *</label>
                    <input
                      type="text"
                      required
                      placeholder="10:20 AM"
                      value={sessionFormData.startTimeStr}
                      onChange={(e) => setSessionFormData({ ...sessionFormData, startTimeStr: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">وقت الانتهاء *</label>
                    <input
                      type="text"
                      required
                      placeholder="1:00 PM"
                      value={sessionFormData.endTimeStr}
                      onChange={(e) => setSessionFormData({ ...sessionFormData, endTimeStr: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">المجال / المجالات (مفصولة بفاصلة)</label>
                  <input
                    type="text"
                    value={sessionFormData.fields?.join('، ')}
                    onChange={(e) =>
                      setSessionFormData({
                        ...sessionFormData,
                        fields: e.target.value.split('،').map((f) => f.trim()),
                      })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الموقع والقاعة</label>
                  <input
                    type="text"
                    value={sessionFormData.location}
                    onChange={(e) => setSessionFormData({ ...sessionFormData, location: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="session-isOpen-checkbox"
                    checked={sessionFormData.isOpen}
                    onChange={(e) => setSessionFormData({ ...sessionFormData, isOpen: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <label htmlFor="session-isOpen-checkbox" className="text-xs font-bold text-slate-700 cursor-pointer">
                    فتح باب الحجز في هذه الجلسة للطلاب
                  </label>
                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
                  >
                    حفظ التغييرات
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingSession(null);
                      setIsCreatingSession(false);
                    }}
                    className="px-4 py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* In-App Delete Confirmation Modal (Reliable inside iframe without window.confirm) */}
        {deleteConfirmDialog && deleteConfirmDialog.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-right animate-in fade-in zoom-in-95 my-8">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4 border border-rose-100">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-2">
                {deleteConfirmDialog.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mb-6 leading-relaxed">
                {deleteConfirmDialog.description}
              </p>
              <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                <button
                  id="confirm-delete-action-btn"
                  onClick={executeDeleteAction}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-colors"
                >
                  تأكيد الحذف
                </button>
                <button
                  id="cancel-delete-action-btn"
                  onClick={() => setDeleteConfirmDialog(null)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer transition-colors"
                >
                  تراجع
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
