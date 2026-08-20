import React, { useState, useEffect } from 'react';
import { 
  Ticket, 
  Calendar, 
  Clock, 
  MapPin, 
  Trash2, 
  CheckCircle2, 
  Sparkles,
  RefreshCw,
  Copy,
  Users,
  AlertTriangle,
  Clock3
} from 'lucide-react';
import { Booking, User, WaitlistEntry } from '../types';
import { api } from '../lib/api';

interface MyBookingsViewProps {
  currentUser: User | null;
  onOpenAuth: () => void;
  onExploreSessions: () => void;
  onBookingCancelled?: () => void;
}

export const MyBookingsView: React.FC<MyBookingsViewProps> = ({
  currentUser,
  onOpenAuth,
  onExploreSessions,
  onBookingCancelled,
}) => {
  const [activeTab, setActiveTab] = useState<'bookings' | 'waitlist'>('bookings');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [waitlistEntries, setWaitlistEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      if (currentUser) {
        const [userBookings, userWaitlist] = await Promise.all([
          api.getBookings({
            universityId: currentUser.universityId,
            email: currentUser.email,
          }),
          api.getWaitlist({
            universityId: currentUser.universityId,
            email: currentUser.email,
          }),
        ]);
        setBookings(userBookings);
        setWaitlistEntries(userWaitlist);
      } else {
        const local = await api.getBookings();
        setBookings(local);
        const waitlist = await api.getWaitlist();
        setWaitlistEntries(waitlist);
      }
    } catch {
      setActionMessage({ type: 'error', text: 'تعذر تحميل البيانات، يرجى المحاولة لاحقاً' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [currentUser]);

  const handleExecuteCancelBooking = async (bookingId: string) => {
    setCancellingId(bookingId);
    try {
      const res = await api.cancelBooking(bookingId);
      if (res.success) {
        setBookings((prev) => prev.filter((b) => b.id !== bookingId && b.bookingCode !== bookingId));
        setConfirmCancelId(null);
        setActionMessage({ type: 'success', text: 'تم إلغاء الحجز بنجاح وتحرير المقعد للطلبة الآخرين.' });
        if (onBookingCancelled) {
          onBookingCancelled();
        }
        // Re-fetch to get latest state
        fetchUserData();
      } else {
        setActionMessage({ type: 'error', text: res.error || 'فشل إلغاء الحجز' });
      }
    } catch {
      setActionMessage({ type: 'error', text: 'حدث خطأ أثناء محاولة إلغاء الحجز' });
    } finally {
      setCancellingId(null);
    }
  };

  const handleCancelWaitlist = async (waitlistId: string) => {
    setCancellingId(waitlistId);
    try {
      const res = await api.cancelWaitlist(waitlistId);
      if (res.success) {
        setWaitlistEntries((prev) => prev.filter((w) => w.id !== waitlistId));
        setActionMessage({ type: 'success', text: 'تم إلغاء الانضمام لقائمة الانتظار بنجاح.' });
        fetchUserData();
      } else {
        setActionMessage({ type: 'error', text: res.error || 'فشل إلغاء طلب الانتظار' });
      }
    } catch {
      setActionMessage({ type: 'error', text: 'حدث خطأ أثناء محاولة إلغاء طلب الانتظار' });
    } finally {
      setCancellingId(null);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(code);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="py-12 bg-slate-50 min-h-[70vh]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold mb-2">
              <Ticket className="w-3.5 h-3.5" />
              <span>إدارة الحجوزات والانتظار</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
              حجوزاتي وقوائم الانتظار
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              استعرض جلساتك المسجلة أو قم بإلغاء الحجز ومتابعة دورك في الانتظار
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              id="refresh-my-bookings-btn"
              onClick={fetchUserData}
              className="p-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="تحديث البيانات"
            >
              <RefreshCw className="w-4 h-4" />
              <span>تحديث</span>
            </button>

            <button
              id="explore-sessions-from-bookings-btn"
              onClick={onExploreSessions}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>استعراض الجلسات</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200 mb-6 pb-2">
          <button
            id="tab-my-confirmed-bookings"
            onClick={() => setActiveTab('bookings')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm transition-all cursor-pointer ${
              activeTab === 'bookings'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Ticket className="w-4 h-4" />
            <span>الحجوزات المؤكدة ({bookings.length})</span>
          </button>

          <button
            id="tab-my-waitlist"
            onClick={() => setActiveTab('waitlist')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm transition-all cursor-pointer ${
              activeTab === 'waitlist'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>قائمة الانتظار ({waitlistEntries.filter((w) => w.status === 'waiting').length})</span>
          </button>
        </div>

        {/* Action Message Alert */}
        {actionMessage && (
          <div
            id="bookings-action-message-alert"
            className={`p-4 rounded-xl text-xs font-bold mb-6 flex items-center justify-between animate-fadeIn ${
              actionMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            <span>{actionMessage.text}</span>
            <button
              onClick={() => setActionMessage(null)}
              className="text-slate-400 hover:text-slate-600 cursor-pointer text-sm font-black p-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* Loading state */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-28 bg-white rounded-2xl border border-slate-200 animate-pulse p-6" />
            ))}
          </div>
        ) : activeTab === 'bookings' ? (
          /* Bookings Tab */
          bookings.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center max-w-lg mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4 border border-blue-100">
                <Ticket className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">لا توجد حجوزات مؤكدة حتى الآن</h3>
              <p className="text-xs sm:text-sm text-slate-500 mb-6 leading-relaxed">
                لم تقم بحجز أي مقعد في الجلسات الحوارية بعد. استعرض جدول الجلسات واختر الموعد والمجال المناسب لك.
              </p>
              <button
                onClick={onExploreSessions}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md transition-all cursor-pointer"
              >
                استعرض جدول الجلسات الآن
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  id={`booking-item-${booking.id}`}
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all p-5 sm:p-6"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    
                    {/* Booking Code & Status */}
                    <div className="space-y-1.5 shrink-0">
                      <span className="text-[10px] text-slate-400 font-bold block">رقم الحجز:</span>
                      <div className="flex items-center gap-1.5 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100">
                        <span className="font-mono font-black text-blue-950 text-sm">{booking.bookingCode}</span>
                        <button
                          onClick={() => copyCode(booking.bookingCode)}
                          className="text-blue-700 hover:text-blue-900 p-0.5 cursor-pointer"
                          title="نسخ الرمز"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {copiedId === booking.bookingCode && (
                        <span className="text-[10px] text-blue-600 font-bold block">تم النسخ!</span>
                      )}
                      
                      <div className="pt-0.5">
                        {booking.attended ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                            <CheckCircle2 className="w-3 h-3" />
                            تم تسجيل الحضور
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                            حجز مؤكد
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Booking Meta Details */}
                    <div className="flex-1 space-y-1.5 text-right">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {booking.fields?.map((f, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-100"
                          >
                            {f}
                          </span>
                        ))}
                      </div>

                      <h3 className="text-lg font-black text-slate-900">
                        {booking.guestName}
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 pt-1">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span>{booking.dateLabel}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span className="font-mono dir-ltr">{booking.timeLabel}</span>
                        </div>
                        <div className="flex items-center gap-1.5 sm:col-span-2">
                          <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span>{booking.location}</span>
                        </div>
                      </div>
                    </div>

                    {/* Cancel Action */}
                    <div className="shrink-0 pt-2 sm:pt-0">
                      {confirmCancelId === booking.id ? (
                        <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl flex flex-col gap-2 items-center text-center">
                          <span className="text-[11px] font-bold text-rose-800 flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                            تأكيد الإلغاء وتحرير المقعد؟
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              id={`confirm-cancel-btn-${booking.id}`}
                              disabled={cancellingId === booking.id}
                              onClick={() => handleExecuteCancelBooking(booking.id)}
                              className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                            >
                              {cancellingId === booking.id ? 'جارِ الإلغاء...' : 'نعم، ألغِ الحجز'}
                            </button>
                            <button
                              onClick={() => setConfirmCancelId(null)}
                              className="px-3 py-1 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                            >
                              تراجع
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          id={`cancel-booking-btn-${booking.id}`}
                          onClick={() => setConfirmCancelId(booking.id)}
                          className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>إلغاء الحجز</span>
                        </button>
                      )}
                    </div>

                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          /* Waiting List Tab */
          waitlistEntries.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center max-w-lg mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-100">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">لا توجد طلبات في قائمة الانتظار</h3>
              <p className="text-xs sm:text-sm text-slate-500 mb-6 leading-relaxed">
                إذا كانت أي جلسة ممتلئة بالكامل، يمكنك الانضمام لقائمة الانتظار وسيتم ترقيتك تلقائياً عند توفر مقعد شاغر.
              </p>
              <button
                onClick={onExploreSessions}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md transition-all cursor-pointer"
              >
                استعراض الجلسات
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {waitlistEntries.map((entry) => (
                <div
                  key={entry.id}
                  id={`waitlist-item-${entry.id}`}
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all p-5 sm:p-6"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    
                    {/* Waitlist Position Status */}
                    <div className="space-y-1.5 shrink-0">
                      <span className="text-[10px] text-slate-400 font-bold block">حالة الانتظار:</span>
                      {entry.status === 'waiting' ? (
                        <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
                          <Clock3 className="w-4 h-4 text-amber-600" />
                          <span className="font-extrabold text-amber-900 text-xs sm:text-sm">
                            الترتيب في الانتظار: #{entry.position || 1}
                          </span>
                        </div>
                      ) : entry.status === 'promoted' ? (
                        <div className="flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span className="font-extrabold text-emerald-900 text-xs">
                            تمت الترقية إلى حجز مؤكد!
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 font-bold bg-slate-100 px-2.5 py-1 rounded-lg">
                          ملغي
                        </span>
                      )}
                    </div>

                    {/* Meta Details */}
                    <div className="flex-1 space-y-1.5 text-right">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {entry.fields?.map((f, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-100"
                          >
                            {f}
                          </span>
                        ))}
                      </div>

                      <h3 className="text-lg font-black text-slate-900">
                        {entry.guestName}
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 pt-1">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span>{entry.dateLabel}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span className="font-mono dir-ltr">{entry.timeLabel}</span>
                        </div>
                        <div className="flex items-center gap-1.5 sm:col-span-2">
                          <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span>{entry.location}</span>
                        </div>
                      </div>
                    </div>

                    {/* Cancel Waitlist Button */}
                    {entry.status === 'waiting' && (
                      <div className="shrink-0 pt-2 sm:pt-0">
                        <button
                          id={`cancel-waitlist-btn-${entry.id}`}
                          disabled={cancellingId === entry.id}
                          onClick={() => handleCancelWaitlist(entry.id)}
                          className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 hover:border-rose-200 text-xs font-bold transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{cancellingId === entry.id ? 'جارِ الإلغاء...' : 'مغادرة الانتظار'}</span>
                        </button>
                      </div>
                    )}

                  </div>
                </div>
              ))}
            </div>
          )
        )}

      </div>
    </div>
  );
};
