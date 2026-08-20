import React from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  MapPin, 
  Ticket, 
  GraduationCap,
  Users
} from 'lucide-react';
import { Session } from '../types';
import { formatSeatStatus } from '../lib/dateUtils';

interface SessionDetailModalProps {
  session: Session | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenBooking: (session: Session) => void;
}

export const SessionDetailModal: React.FC<SessionDetailModalProps> = ({
  session,
  isOpen,
  onClose,
  onOpenBooking,
}) => {
  if (!isOpen || !session) return null;

  const seatStatus = formatSeatStatus(session.bookedSeats, session.totalSeats, session.isOpen);
  const remainingSeats = Math.max(0, session.totalSeats - session.bookedSeats);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200 my-8">
        
        {/* Header with guest banner */}
        <div className="bg-slate-950 text-white p-6 relative border-b border-slate-850">
          <button
            id="close-session-detail-modal-btn"
            onClick={onClose}
            className="absolute top-5 left-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4 pt-2">
            <div className="w-16 h-16 rounded-2xl bg-blue-600/20 border-2 border-blue-500/40 flex items-center justify-center text-sky-300 shadow-md shrink-0">
              <GraduationCap className="w-9 h-9" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                {session.fields.map((field, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-500/20 text-sky-300 border border-blue-500/30"
                  >
                    {field}
                  </span>
                ))}
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white">
                {session.guestName}
              </h3>
            </div>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6 text-right">
          {/* Description */}
          {session.description && (
            <div>
              <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                {session.description}
              </p>
            </div>
          )}

          {/* Time & Venue Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
              <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                اليوم والتاريخ
              </span>
              <p className="text-sm font-bold text-slate-800">{session.dateLabel}</p>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
              <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                وقت الجلسة
              </span>
              <p className="text-sm font-bold text-slate-800 font-mono dir-ltr text-right">
                {session.startTimeStr} - {session.endTimeStr}
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl space-y-1 sm:col-span-2">
              <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                الموقع
              </span>
              <p className="text-sm font-bold text-slate-800">{session.location}</p>
            </div>
          </div>

          {/* Seat Capacity Card */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-blue-600" />
                حالة المقاعد
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${seatStatus.bgClass} ${seatStatus.colorClass} ${seatStatus.borderClass}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${seatStatus.dotColor}`}></span>
                {seatStatus.countLabel}
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden mb-2">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  seatStatus.isFull
                    ? 'bg-rose-500'
                    : 'bg-blue-600'
                }`}
                style={{ width: `${Math.min(100, (session.bookedSeats / session.totalSeats) * 100)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
              <span>المحجوز: {session.bookedSeats}</span>
              <span>الإجمالي: {session.totalSeats} مقعد</span>
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-2 flex items-center gap-3">
            <button
              id="detail-modal-book-now-btn"
              onClick={() => {
                onClose();
                onOpenBooking(session);
              }}
              className={`flex-1 py-3.5 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                seatStatus.isFull
                  ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/20'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20'
              }`}
            >
              <Ticket className="w-4 h-4" />
              <span>{seatStatus.isFull ? 'الانضمام لقائمة الانتظار' : 'احجز مقعدك الآن'}</span>
            </button>

            <button
              onClick={onClose}
              className="py-3.5 px-5 rounded-xl font-semibold text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
