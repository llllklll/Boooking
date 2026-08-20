import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Sparkles, 
  X, 
  Layers
} from 'lucide-react';
import { Session } from '../types';
import { SessionCard } from './SessionCard';

interface SessionsPageProps {
  sessions: Session[];
  onOpenBooking: (session: Session) => void;
  onOpenDetails: (session: Session) => void;
  presetGuestFilter?: string | null;
  onClearPreset?: () => void;
}

export const SessionsPage: React.FC<SessionsPageProps> = ({
  sessions,
  onOpenBooking,
  onOpenDetails,
  presetGuestFilter,
  onClearPreset,
}) => {
  const [selectedDay, setSelectedDay] = useState<string>('tuesday');
  const [selectedField, setSelectedField] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [onlyAvailable, setOnlyAvailable] = useState<boolean>(false);

  // Extract all unique fields across sessions
  const allFields = useMemo(() => {
    const fieldSet = new Set<string>();
    sessions.forEach((s) => {
      s.fields.forEach((f) => {
        if (f !== 'سيتم الإعلان لاحقاً') {
          fieldSet.add(f);
        }
      });
    });
    return Array.from(fieldSet);
  }, [sessions]);

  // Filter sessions
  const filteredSessions = useMemo(() => {
    return sessions.filter((session) => {
      // 1. Preset Guest Filter if active
      if (presetGuestFilter && session.guestName !== presetGuestFilter) {
        return false;
      }

      // 2. Day Filter
      if (session.dayKey !== selectedDay) {
        return false;
      }

      // 3. Field Filter
      if (selectedField !== 'all' && !session.fields.includes(selectedField)) {
        return false;
      }

      // 4. Available only filter
      if (onlyAvailable && session.bookedSeats >= session.totalSeats) {
        return false;
      }

      // 5. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesGuest = session.guestName.toLowerCase().includes(q);
        const matchesTitle = session.title ? session.title.toLowerCase().includes(q) : false;
        const matchesField = session.fields.some((f) => f.toLowerCase().includes(q));
        const matchesLocation = session.location.toLowerCase().includes(q);

        if (!matchesGuest && !matchesTitle && !matchesField && !matchesLocation) {
          return false;
        }
      }

      return true;
    });
  }, [sessions, selectedDay, selectedField, searchQuery, onlyAvailable, presetGuestFilter]);

  const daysList = [
    { key: 'tuesday', label: 'الثلاثاء 25 أغسطس', sub: 'اليوم الأول' },
    { key: 'wednesday', label: 'الأربعاء 26 أغسطس', sub: 'اليوم الثاني' },
    { key: 'thursday', label: 'الخميس 27 أغسطس', sub: 'اليوم الثالث' },
  ];

  return (
    <div id="sessions-container" className="space-y-8">
      
      {/* Preset Filter Indicator if navigating from Guest card */}
      {presetGuestFilter && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2 text-blue-700 text-xs sm:text-sm font-bold">
            <Sparkles className="w-4 h-4" />
            <span>عرض جلسات الضيف: <strong>{presetGuestFilter}</strong></span>
          </div>
          {onClearPreset && (
            <button
              onClick={onClearPreset}
              className="flex items-center gap-1 text-xs font-bold bg-white px-3 py-1.5 rounded-lg border border-blue-200 cursor-pointer shadow-xs text-blue-700 hover:bg-blue-50"
            >
              <X className="w-3.5 h-3.5" />
              <span>إلغاء التصفية بالضيف</span>
            </button>
          )}
        </div>
      )}

      {/* Day Tabs */}
      <div className="flex justify-center">
        <div className="grid grid-cols-3 gap-2 bg-slate-100 border border-slate-200 p-1.5 rounded-2xl max-w-2xl w-full">
          {daysList.map((day) => {
            const isActive = selectedDay === day.key;
            return (
              <button
                key={day.key}
                id={`day-filter-${day.key}`}
                onClick={() => setSelectedDay(day.key)}
                className={`py-2.5 px-3 rounded-xl text-center transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'text-slate-600 hover:bg-white hover:text-slate-900'
                }`}
              >
                <span className="block text-xs sm:text-sm font-extrabold">{day.label}</span>
                <span className="block text-[10px] font-medium opacity-80">
                  {day.sub}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search & Advanced Filters Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          
          {/* Live Search Input */}
          <div className="relative w-full md:w-96">
            <input
              type="text"
              id="session-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث باسم الضيف، المجال، أو الموضوع..."
              className="w-full px-3.5 py-2.5 pr-10 text-xs sm:text-sm bg-slate-50 border border-slate-200 text-slate-900 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-hidden transition-all text-right"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Availability Checkbox & Reset */}
          <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                id="only-available-checkbox"
                checked={onlyAvailable}
                onChange={(e) => setOnlyAvailable(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
              />
              <span>عرض الجلسات المتاحة للحجز فقط</span>
            </label>

            {(selectedDay !== 'tuesday' || selectedField !== 'all' || searchQuery || onlyAvailable || presetGuestFilter) && (
              <button
                onClick={() => {
                  setSelectedDay('tuesday');
                  setSelectedField('all');
                  setSearchQuery('');
                  setOnlyAvailable(false);
                  if (onClearPreset) onClearPreset();
                }}
                className="text-xs font-semibold text-rose-500 hover:text-rose-700 hover:underline cursor-pointer"
              >
                إعادة ضبط الفلاتر
              </button>
            )}
          </div>
        </div>

        {/* Field Filter Pills */}
        <div className="pt-2 border-t border-slate-100 flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs text-slate-400 font-bold whitespace-nowrap pl-1">
            المجال:
          </span>
          <button
            onClick={() => setSelectedField('all')}
            className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
              selectedField === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            جميع المجالات
          </button>
          {allFields.map((field) => (
            <button
              key={field}
              onClick={() => setSelectedField(field)}
              className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
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

      {/* Results Count & Location note */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 font-medium px-1">
        <span>
          عرض <strong className="text-slate-900">{filteredSessions.length}</strong> جلسة حوارية
        </span>
        <span>
          مكان الانعقاد: عمادة شؤون الطلاب
        </span>
      </div>

      {/* Sessions Grid */}
      {filteredSessions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              onOpenBooking={onOpenBooking}
              onOpenDetails={onOpenDetails}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 shadow-xs">
          <Layers className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-900 mb-1">لم يتم العثور على جلسات مطابقة</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
            جرب اختيار يوم آخر أو تغيير مجال التخصص أو إزالة الفلاتر المحددة.
          </p>
          <button
            onClick={() => {
              setSelectedDay('all');
              setSelectedField('all');
              setSearchQuery('');
              setOnlyAvailable(false);
              if (onClearPreset) onClearPreset();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            عرض كافة الجلسات
          </button>
        </div>
      )}

    </div>
  );
};
