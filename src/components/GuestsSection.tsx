import React, { useState } from 'react';
import { 
  Users, 
  GraduationCap, 
  Calendar, 
  ArrowLeft, 
  Search
} from 'lucide-react';
import { Guest, Session } from '../types';

interface GuestsSectionProps {
  guests: Guest[];
  sessions: Session[];
  onSelectGuestSessions: (guestName: string) => void;
  onOpenBooking: (session: Session) => void;
}

export const GuestsSection: React.FC<GuestsSectionProps> = ({
  guests,
  sessions,
  onSelectGuestSessions,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedField, setSelectedField] = useState('all');

  const allFields = Array.from(
    new Set(guests.flatMap((g) => g.fields).filter((f) => f !== 'سيتم الإعلان لاحقاً'))
  );

  const filteredGuests = guests.filter((g) => {
    const matchesSearch =
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.fields.some((f) => f.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesField = selectedField === 'all' || g.fields.includes(selectedField);

    return matchesSearch && matchesField;
  });

  return (
    <section id="guests-page-section" className="py-16 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold mb-3">
            <Users className="w-4 h-4 text-blue-700" />
            <span>نخبة المتحدثين والمرشدين</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            ضيوف الجلسات الحوارية
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mt-2">
            مستشارون وأكاديميون متخصصون في الإرشاد الأكاديمي، المهني، والتكيف النفسي والاجتماعي
          </p>
        </div>

        {/* Search & Field Filters */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search */}
          <div className="relative w-full md:w-96">
            <input
              type="text"
              id="guest-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث باسم الضيف أو المجال..."
              className="w-full px-3.5 py-2.5 pr-10 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-hidden transition-all text-right"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
          </div>

          {/* Field Filter Chips */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-start md:justify-end">
            <button
              onClick={() => setSelectedField('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                selectedField === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              جميع المجالات ({guests.length})
            </button>
            {allFields.map((field) => (
              <button
                key={field}
                onClick={() => setSelectedField(field)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  selectedField === field
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {field}
              </button>
            ))}
          </div>
        </div>

        {/* Guests Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGuests.map((guest) => {
            const guestSessions = sessions.filter((s) => s.guestName === guest.name);

            return (
              <div
                key={guest.id}
                id={`guest-card-${guest.id}`}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-lg transition-all duration-200 p-6 flex flex-col justify-between hover:border-blue-300 group"
              >
                <div>
                  {/* Avatar & Basic Info */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-slate-800 flex items-center justify-center text-white text-xl font-black shadow-md shrink-0 group-hover:scale-105 transition-transform">
                      <GraduationCap className="w-8 h-8 text-blue-200" />
                    </div>

                    <div>
                      <h3 className="text-lg font-black text-slate-900 group-hover:text-blue-700 transition-colors leading-tight">
                        {guest.name}
                      </h3>
                      <p className="text-xs font-semibold text-slate-500 mt-0.5">
                        {guest.title}
                      </p>
                    </div>
                  </div>

                  {/* Fields */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {guest.fields.map((field, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200/60"
                      >
                        {field}
                      </span>
                    ))}
                  </div>

                  {/* Participation Days */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 space-y-1.5 mb-4">
                    <span className="text-[11px] font-bold text-slate-500 block flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-blue-600" />
                      أيام التواجد في الفعالية:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {guest.days.map((day, dIdx) => (
                        <span
                          key={dIdx}
                          className="px-2 py-0.5 rounded bg-white text-slate-800 font-semibold border border-slate-200 text-[11px]"
                        >
                          {day}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card Action */}
                <div className="pt-2">
                  <button
                    id={`view-guest-sessions-${guest.id}`}
                    onClick={() => onSelectGuestSessions(guest.name)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold bg-slate-100 hover:bg-blue-50 text-slate-800 hover:text-blue-800 border border-slate-200 hover:border-blue-200 transition-all cursor-pointer"
                  >
                    <span>استعراض وحجز جلسات الضيف ({guestSessions.length})</span>
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filteredGuests.length === 0 && (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-800">لا توجد نتائج مطابقة</h3>
            <p className="text-xs text-slate-500 mt-1">
              جرب تغيير معايير البحث أو اختيار مجال آخر
            </p>
          </div>
        )}

      </div>
    </section>
  );
};
