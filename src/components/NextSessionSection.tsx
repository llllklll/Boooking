import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Ticket, 
  ArrowLeft,
  Flame,
  Radio
} from 'lucide-react';
import { Session } from '../types';
import { getNextOrCurrentSession, formatSeatStatus, TimeLeft } from '../lib/dateUtils';

interface NextSessionSectionProps {
  sessions: Session[];
  onOpenBooking: (session: Session) => void;
  onOpenDetails: (session: Session) => void;
}

export const NextSessionSection: React.FC<NextSessionSectionProps> = ({
  sessions,
  onOpenBooking,
  onOpenDetails,
}) => {
  const [data, setData] = useState<{
    session: Session | null;
    isLive: boolean;
    timeLeft: TimeLeft;
  }>({
    session: null,
    isLive: false,
    timeLeft: { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: false, totalMs: 0 },
  });

  useEffect(() => {
    const update = () => {
      const result = getNextOrCurrentSession(sessions);
      setData(result);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [sessions]);

  const { session, isLive, timeLeft } = data;

  if (!session) return null;

  const seatStatus = formatSeatStatus(session.bookedSeats, session.totalSeats, session.isOpen);

  const formatNumber = (num: number) => num.toString().padStart(2, '0');

  return (
    <section className="py-12 sm:py-16 bg-slate-50 border-b border-slate-200">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold mb-2">
            {isLive ? (
              <>
                <Radio className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                <span className="text-rose-500 font-bold">تجري الآن</span>
              </>
            ) : (
              <>
                <Flame className="w-3.5 h-3.5 text-blue-600" />
                <span>أقرب موعد حواري</span>
              </>
            )}
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            {isLive ? 'الجلسة الحالية' : 'الجلسة القادمة'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            يتم تحديث الجلسة القادمة والعداد تلقائياً حسب التوقيت الفعلي
          </p>
        </div>

        {/* Featured Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12">
            
            {/* Left/Main info column */}
            <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between">
              <div>
                {/* Guest & Field Badges */}
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  {session.fields.map((f, i) => (
                    <span 
                      key={i}
                      className="px-3 py-1 rounded-xl bg-blue-50 text-blue-800 border border-blue-100 text-xs font-bold"
                    >
                      {f}
                    </span>
                  ))}
                  
                  {/* Seat availability badge */}
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border ${seatStatus.bgClass} ${seatStatus.colorClass} ${seatStatus.borderClass}`}>
                    <span className={`w-2 h-2 rounded-full ${seatStatus.dotColor}`}></span>
                    {seatStatus.countLabel}
                  </span>
                </div>

                {/* Guest Name & Title */}
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mb-6 leading-tight">
                  {session.guestName}
                </h3>

                {/* Metadata List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs sm:text-sm text-slate-600 bg-slate-50 border-slate-100 p-4 rounded-2xl border mb-6">
                  <div className="flex items-center gap-2.5">
                    <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="font-bold">{session.dateLabel}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="font-semibold font-mono dir-ltr">{session.startTimeStr} - {session.endTimeStr}</span>
                  </div>
                  <div className="flex items-center gap-2.5 sm:col-span-2">
                    <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>{session.location}</span>
                  </div>
                </div>

                {session.description && (
                  <p className="text-xs sm:text-sm text-slate-500 leading-relaxed line-clamp-2 mb-6">
                    {session.description}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <button
                  id="next-session-book-btn"
                  onClick={() => onOpenBooking(session)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-5 rounded-xl font-bold text-sm transition-all shadow-md cursor-pointer ${
                    seatStatus.isFull
                      ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/30'
                      : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30'
                  }`}
                >
                  <Ticket className="w-4 h-4" />
                  <span>{seatStatus.isFull ? 'الانضمام لقائمة الانتظار' : 'احجز مقعدك في الجلسة'}</span>
                </button>

                <button
                  id="next-session-details-btn"
                  onClick={() => onOpenDetails(session)}
                  className="flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl font-semibold text-sm transition-colors cursor-pointer bg-white hover:bg-slate-50 text-slate-700 border border-slate-200"
                >
                  <span>التفاصيل</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Right Countdown Column */}
            <div className="lg:col-span-5 bg-slate-950 text-white p-6 sm:p-8 flex flex-col justify-center items-center text-center border-t lg:border-t-0 lg:border-r border-slate-800">
              
              <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-sky-300 mb-4">
                <Clock className="w-7 h-7" />
              </div>

              <span className="text-xs tracking-widest text-sky-300 font-bold mb-1">
                {isLive ? 'الوقت المتبقي لانتهاء الجلسة' : 'باقي على بدء الجلسة'}
              </span>

              <p className="text-xs text-slate-400 mb-6">
                {isLive ? 'الجلسة منعقدة حالياً' : 'استعد وكن متواجداً قبل بدء الجلسة'}
              </p>

              {/* Countdown Digits */}
              <div className="grid grid-cols-4 gap-2 w-full max-w-xs mb-6">
                <div className="bg-slate-900 rounded-xl p-2.5 border border-slate-800">
                  <span className="block text-xl sm:text-2xl font-black font-mono text-sky-300">
                    {formatNumber(timeLeft.days)}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">يوم</span>
                </div>

                <div className="bg-slate-900 rounded-xl p-2.5 border border-slate-800">
                  <span className="block text-xl sm:text-2xl font-black font-mono text-blue-200">
                    {formatNumber(timeLeft.hours)}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">ساعة</span>
                </div>

                <div className="bg-slate-900 rounded-xl p-2.5 border border-slate-800">
                  <span className="block text-xl sm:text-2xl font-black font-mono text-sky-300">
                    {formatNumber(timeLeft.minutes)}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">دقيقة</span>
                </div>

                <div className="bg-slate-900 rounded-xl p-2.5 border border-slate-800">
                  <span className="block text-xl sm:text-2xl font-black font-mono text-sky-400 animate-pulse">
                    {formatNumber(timeLeft.seconds)}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">ثانية</span>
                </div>
              </div>

              {/* Capacity Progress Mini bar */}
              <div className="w-full max-w-xs bg-slate-900 p-3 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-400">نسبة الحجز</span>
                  <span className="font-bold text-sky-300 font-mono">
                    {Math.round((session.bookedSeats / session.totalSeats) * 100)}%
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (session.bookedSeats / session.totalSeats) * 100)}%` }}
                  />
                </div>
              </div>

            </div>

          </div>
        </div>
      </div>
    </section>
  );
};
