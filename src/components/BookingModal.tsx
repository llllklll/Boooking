import React, { useState, useEffect } from 'react';
import { 
  X, 
  Ticket, 
  Calendar, 
  Clock, 
  MapPin, 
  User as UserIcon, 
  Mail, 
  Hash, 
  Phone, 
  CheckCircle2, 
  Copy, 
  AlertCircle,
  ShieldCheck,
  Users,
  Clock3
} from 'lucide-react';
import { Booking, Session, User, WaitlistEntry } from '../types';
import { api } from '../lib/api';

interface BookingModalProps {
  session: Session | null;
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onBookingSuccess: (booking: Booking) => void;
  onWaitlistSuccess?: (waitlistEntry: WaitlistEntry) => void;
  onGoToBookings: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  session,
  isOpen,
  onClose,
  currentUser,
  onBookingSuccess,
  onWaitlistSuccess,
  onGoToBookings,
}) => {
  const [formData, setFormData] = useState({
    studentName: '',
    studentEmail: '',
    universityId: '',
    phoneNumber: '',
    termsAgreed: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);
  const [confirmedWaitlist, setConfirmedWaitlist] = useState<{ entry: WaitlistEntry; position?: number } | null>(null);
  const [copied, setCopied] = useState(false);

  const isFull = session ? session.bookedSeats >= session.totalSeats : false;

  // Autofill user details if logged in
  useEffect(() => {
    if (currentUser) {
      setFormData((prev) => ({
        ...prev,
        studentName: currentUser.name || '',
        studentEmail: currentUser.email || '',
        universityId: currentUser.universityId || '',
        phoneNumber: currentUser.phoneNumber || prev.phoneNumber,
      }));
    }
  }, [currentUser]);

  // Reset state when opening modal
  useEffect(() => {
    if (isOpen) {
      setConfirmedBooking(null);
      setConfirmedWaitlist(null);
      setErrorMessage('');
      setCopied(false);
    }
  }, [isOpen, session]);

  if (!isOpen || !session) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!formData.studentName.trim()) {
      setErrorMessage('يرجى إدخال الاسم الكامل');
      return;
    }
    if (!formData.studentEmail.trim() || !formData.studentEmail.includes('@')) {
      setErrorMessage('يرجى إدخال بريد إلكتروني صحيح');
      return;
    }
    if (!formData.universityId.trim()) {
      setErrorMessage('يرجى إدخال الرقم الجامعي');
      return;
    }
    if (!formData.phoneNumber.trim()) {
      setErrorMessage('يرجى إدخال رقم الجوال للتواصل');
      return;
    }
    if (!formData.termsAgreed) {
      setErrorMessage('يجب الموافقة على شروط الحجز والالتزام بالحضور');
      return;
    }

    setIsLoading(true);

    try {
      if (isFull) {
        // Join Waiting List
        const result = await api.joinWaitlist({
          sessionId: session.id,
          studentName: formData.studentName,
          studentEmail: formData.studentEmail,
          universityId: formData.universityId,
          phoneNumber: formData.phoneNumber,
        });

        if (result.success && result.waitlistEntry) {
          setConfirmedWaitlist({ entry: result.waitlistEntry, position: result.position });
          if (onWaitlistSuccess) {
            onWaitlistSuccess(result.waitlistEntry);
          }
        } else {
          setErrorMessage(result.error || 'تعذر الانضمام لقائمة الانتظار، يرجى المحاولة مرة أخرى');
        }
      } else {
        // Create normal booking
        const result = await api.createBooking({
          sessionId: session.id,
          studentName: formData.studentName,
          studentEmail: formData.studentEmail,
          universityId: formData.universityId,
          phoneNumber: formData.phoneNumber,
        });

        if (result.success && result.booking) {
          setConfirmedBooking(result.booking);
          onBookingSuccess(result.booking);
        } else {
          setErrorMessage(result.error || 'تعذر تأكيد الحجز، يرجى المحاولة مرة أخرى');
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'حدث خطأ في النظام أثناء إتمام الطلب');
    } finally {
      setIsLoading(false);
    }
  };

  const copyBookingCode = () => {
    if (confirmedBooking) {
      navigator.clipboard.writeText(confirmedBooking.bookingCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200 my-8">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 sm:p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isFull ? 'bg-amber-500/20 border border-amber-500/30 text-amber-400' : 'bg-blue-500/20 border border-blue-500/30 text-sky-400'
            }`}>
              {isFull ? <Users className="w-5 h-5" /> : <Ticket className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">
                {confirmedBooking
                  ? 'تأكيد الحجز'
                  : confirmedWaitlist
                  ? 'تأكيد الانضمام لقائمة الانتظار'
                  : isFull
                  ? 'الانضمام لقائمة الانتظار'
                  : 'حجز مقعد في الجلسة'}
              </h3>
              <p className="text-xs text-slate-300">
                أسبوع المستجدين 2026 • عمادة شؤون الطلاب
              </p>
            </div>
          </div>

          <button
            id="close-booking-modal-btn"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {confirmedBooking ? (
            /* --- SUCCESS CONFIRMED BOOKING SCREEN --- */
            <div className="space-y-6 text-center">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-2 border border-blue-100">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div>
                <h4 className="text-2xl font-black text-slate-900">
                  تم تأكيد حجزك بنجاح
                </h4>
                <p className="text-sm text-slate-600 mt-1">
                  تم تسجيل مقعدك بنجاح في الجلسة الحوارية
                </p>
              </div>

              {/* Booking Details Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-right relative overflow-hidden">
                <div className="space-y-2 text-xs text-slate-700 w-full">
                  <div className="bg-blue-50 border border-blue-100 p-2.5 rounded-xl mb-3">
                    <span className="text-slate-500 block text-[11px]">رقم الحجز المرجعي:</span>
                    <span className="font-mono font-black text-base text-blue-900">{confirmedBooking.bookingCode}</span>
                  </div>

                  <p className="font-bold text-sm text-slate-900 leading-tight">
                    {confirmedBooking.guestName}
                  </p>
                  <p className="text-slate-600">
                    الطالب: <strong className="text-slate-900">{confirmedBooking.studentName}</strong>
                  </p>
                  <p className="text-slate-600 font-mono">
                    الرقم الجامعي: <strong className="text-slate-900">{confirmedBooking.universityId}</strong>
                  </p>
                  <p className="text-slate-600">
                    الموعد: <strong>{confirmedBooking.dateLabel}</strong>
                  </p>
                  <p className="text-slate-600 font-mono dir-ltr text-right">
                    الوقت: <strong>{confirmedBooking.timeLabel}</strong>
                  </p>
                  <p className="text-slate-600">
                    المكان: <strong>{confirmedBooking.location}</strong>
                  </p>

                  <div className="flex items-center justify-between p-2.5 bg-blue-100/70 border border-blue-200 rounded-xl mt-3 text-xs">
                    <span className="font-bold text-blue-950">المقاعد المتبقية في الجلسة:</span>
                    <span className="font-bold text-blue-800 bg-white px-2.5 py-0.5 rounded-lg border border-blue-200 shadow-2xs">
                      {Math.max(0, session.totalSeats - session.bookedSeats)} مقاعد متبقية (من أصل {session.totalSeats})
                    </span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <button
                  onClick={copyBookingCode}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copied ? 'تم نسخ الرمز!' : 'نسخ رقم الحجز'}</span>
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onGoToBookings();
                  }}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-sm shadow-blue-600/20"
                >
                  <Ticket className="w-3.5 h-3.5" />
                  <span>عرض في قائمة حجوزاتي</span>
                </button>
              </div>
            </div>
          ) : confirmedWaitlist ? (
            /* --- SUCCESS WAITING LIST SCREEN --- */
            <div className="space-y-6 text-center">
              <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-2 border border-amber-200">
                <Clock3 className="w-9 h-9" />
              </div>

              <div>
                <h4 className="text-2xl font-black text-slate-900">
                  تمت إضافتك لقائمة الانتظار بنجاح!
                </h4>
                <p className="text-sm text-slate-600 mt-1">
                  ترتيبك الحالي في قائمة الانتظار هو: <strong className="text-amber-700 font-bold">#{confirmedWaitlist.position || 1}</strong>
                </p>
              </div>

              <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5 text-right">
                <p className="text-xs text-amber-900 leading-relaxed">
                  في حال قام أي طالب بإلغاء حجزه في هذه الجلسة، سيقوم النظام تلقائياً بترقية حجزك وتأكيد مقعدك وإشعارك في قائمة حجوزاتك.
                </p>
                <div className="mt-3 pt-3 border-t border-amber-200/60 text-xs text-slate-700 space-y-1">
                  <p>المرشد / الضيف: <strong>{session.guestName}</strong></p>
                  <p>الموعد: <strong>{session.dateLabel} ({session.startTimeStr} - {session.endTimeStr})</strong></p>
                  <p>الاسم: <strong>{formData.studentName}</strong></p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => {
                    onClose();
                    onGoToBookings();
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-sm"
                >
                  عرض قائمة الانتظار وحجوزاتي
                </button>
              </div>
            </div>
          ) : (
            /* --- FORM SCREEN --- */
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Selected Session Info Summary Box */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-right">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                    الجلسة المختارة
                  </span>
                  {isFull ? (
                    <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 flex items-center gap-1">
                      <Clock3 className="w-3 h-3 text-amber-600" />
                      المقاعد ممتلئة (قائمة انتظار)
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      متبقي {session.totalSeats - session.bookedSeats} مقاعد
                    </span>
                  )}
                </div>

                <h4 className="font-extrabold text-base text-slate-900 mt-2">
                  {session.guestName}
                </h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  المجال: {session.fields.join('، ')}
                </p>

                <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-slate-200 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>{session.dateLabel}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span className="font-mono dir-ltr">{session.startTimeStr} - {session.endTimeStr}</span>
                  </div>
                  <div className="flex items-center gap-1.5 col-span-2">
                    <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>{session.location}</span>
                  </div>
                </div>
              </div>

              {/* Waiting list explanation if full */}
              {isFull && (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs leading-relaxed flex items-start gap-2 text-right">
                  <Clock3 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    اكتملت مقاعد هذه الجلسة. عند تسجيلك ستتم إضافتك مباشرة إلى <strong>قائمة الانتظار</strong> وستحصل على أولوية الترقية التلقائية فور تحرير أي مقعد.
                  </span>
                </div>
              )}

              {/* Error Message */}
              {errorMessage && (
                <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Student Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 text-right">
                  الاسم الكامل (رباعي) *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    id="booking-input-name"
                    value={formData.studentName}
                    onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                    placeholder="مثال: فيصل محمد أحمد الغامدي"
                    className="w-full px-3.5 py-2.5 pr-10 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-hidden transition-all text-right"
                  />
                  <UserIcon className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                </div>
              </div>

              {/* Student University ID & Mobile Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 text-right">
                    الرقم الجامعي *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      id="booking-input-universityId"
                      value={formData.universityId}
                      onChange={(e) => setFormData({ ...formData, universityId: e.target.value })}
                      placeholder="مثال: 44310982"
                      className="w-full px-3.5 py-2.5 pr-10 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-hidden transition-all text-right font-mono"
                    />
                    <Hash className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 text-right">
                    رقم الجوال *
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      required
                      id="booking-input-phone"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      placeholder="مثال: 0551234567"
                      className="w-full px-3.5 py-2.5 pr-10 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-hidden transition-all text-right font-mono"
                    />
                    <Phone className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                  </div>
                </div>
              </div>

              {/* Student Email */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 text-right">
                  البريد الإلكتروني الجامعي أو الشخصي *
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    id="booking-input-email"
                    value={formData.studentEmail}
                    onChange={(e) => setFormData({ ...formData, studentEmail: e.target.value })}
                    placeholder="student@stu.edu.sa"
                    className="w-full px-3.5 py-2.5 pr-10 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-hidden transition-all text-right font-mono"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                </div>
              </div>

              {/* Terms & Conditions Checkbox */}
              <div className="flex items-start gap-2.5 pt-2">
                <input
                  type="checkbox"
                  id="booking-terms-checkbox"
                  checked={formData.termsAgreed}
                  onChange={(e) => setFormData({ ...formData, termsAgreed: e.target.checked })}
                  className="mt-1 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="booking-terms-checkbox" className="text-xs text-slate-600 leading-relaxed text-right cursor-pointer select-none">
                  أوافق على شروط الحجز والالتزام بالحضور في الموعد المحدد في عمادة شؤون الطلاب.
                </label>
              </div>

              {/* Submit Button */}
              <div className="pt-3">
                <button
                  type="submit"
                  id="confirm-booking-submit-btn"
                  disabled={isLoading}
                  className={`w-full py-3.5 px-4 rounded-xl text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    isFull
                      ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
                      : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'
                  } disabled:bg-slate-300`}
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>{isFull ? 'جارِ الانضمام لقائمة الانتظار...' : 'جارِ تأكيد الحجز...'}</span>
                    </>
                  ) : isFull ? (
                    <>
                      <Users className="w-4 h-4" />
                      <span>الانضمام إلى قائمة الانتظار</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>تأكيد الحجز</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          )}
        </div>
      </div>
    </div>
  );
};
