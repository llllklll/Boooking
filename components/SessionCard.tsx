import React from 'react';
import { Calendar, Clock, MapPin, Ticket, ArrowLeft, Users, Clock3 } from 'lucide-react';
import { Session } from '../types';
import { formatSeatStatus } from '../lib/dateUtils';

interface SessionCardProps {
  session: Session;
  onOpenBooking: (session: Session) => void;
  onOpenDetails: (session: Session) => void;
}

export const SessionCard: React.FC<SessionCardProps> = ({
  session,
  onOpenBooking,
  onOpenDetails,
}) => {
  const isFull = session.bookedSeats >= session.totalSeats;
  const remaining = Math.max(0, session.totalSeats - session.bookedSeats);
  const seatStatus = formatSeatStatus(session.bookedSeats, session.totalSeats, session.isOpen);

  return (
    <div 
      id={`session-card-${session.id}`}
      className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-xl transition-all duration-200 flex flex-col justify-between overflow-hidden group hover:border-blue-300"
    >
      <div className="p-5 sm:p-6">
        {/* Top meta tags */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {session.fields.map((field, idx) => (
              <span
                key={idx}
                className="px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-100"
              >
                {field}
              </span>
            ))}
          </div>

          {/* Seat status badge */}
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
              isFull
                ? 'bg-amber-50 text-amber-800 border-amber-200'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isFull ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
            {isFull ? 'مكتمل (قائمة انتظار)' : `متبقي ${remaining} مقاعد`}
          </span>
        </div>

        {/* Guest Name */}
        <h3 className="text-lg sm:text-xl font-black text-slate-900 mb-3 group-hover:text-blue-600 transition-colors">
          {session.guestName}
        </h3>

        {/* Timing & Location Details */}
        <div className="space-y-2 text-xs sm:text-sm text-slate-600 bg-slate-50 border-slate-100 p-3 rounded-xl border mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="font-bold">{session.dateLabel}</span>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="font-semibold font-mono dir-ltr">{session.startTimeStr} - {session.endTimeStr}</span>
          </div>

          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
            <span>{session.location}</span>
          </div>
        </div>

        {/* Capacity summary */}
        <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
          <span>{isFull ? 'حالة المقاعد' : 'المقاعد المتاحة'}</span>
          <span className="font-bold font-mono text-slate-900">
            {isFull ? `اكتملت المقاعد (${session.totalSeats}/${session.totalSeats})` : `${remaining} من ${session.totalSeats} مقعد`}
          </span>
        </div>
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-4">
          <div
            className={`h-full rounded-full transition-all ${
              isFull ? 'bg-amber-500' : 'bg-blue-600'
            }`}
            style={{ width: `${Math.min(100, (session.bookedSeats / session.totalSeats) * 100)}%` }}
          />
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-4 bg-slate-50 border-slate-100 border-t flex items-center gap-2">
        <button
          id={`book-btn-${session.id}`}
          onClick={() => onOpenBooking(session)}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            isFull
              ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/20'
              : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20'
          }`}
        >
          {isFull ? <Clock3 className="w-4 h-4" /> : <Ticket className="w-4 h-4" />}
          <span>{isFull ? 'انضم للانتظار' : 'احجز الآن'}</span>
        </button>

        <button
          id={`details-btn-${session.id}`}
          onClick={() => onOpenDetails(session)}
          className="flex items-center justify-center gap-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer bg-white hover:bg-slate-100 text-slate-700 border border-slate-200"
        >
          <span>التفاصيل</span>
          <ArrowLeft className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
