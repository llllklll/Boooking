import React, { useState, useEffect } from 'react';
import { Timer, Sparkles, CheckCircle2 } from 'lucide-react';
import { calculateTimeLeft, EVENT_START_DATE, TimeLeft } from '../lib/dateUtils';

export const CountdownSection: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft(EVENT_START_DATE));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(EVENT_START_DATE));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatNumber = (num: number): string => {
    return num.toString().padStart(2, '0');
  };

  const isStarted = timeLeft.isPast;

  return (
    <section className="py-12 bg-white border-b border-slate-200">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Section Header */}
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="p-1.5 rounded-xl bg-blue-50 text-blue-600">
            <Timer className="w-5 h-5" />
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">
            {isStarted ? 'الجلسات بدأت الآن' : 'باقي على انطلاق الجلسات'}
          </h2>
        </div>

        <p className="text-xs sm:text-sm text-slate-500 mb-8 font-medium">
          {isStarted
            ? 'نرحب بكم في عمادة شؤون الطلاب لحضور الجلسات الحوارية'
            : 'موعد الانطلاق الرسمي: الثلاثاء 25 أغسطس 2026 • الساعة 10:00 صباحاً'}
        </p>

        {isStarted ? (
          <div className="bg-blue-600 text-white rounded-2xl p-6 sm:p-8 shadow-lg max-w-xl mx-auto flex items-center justify-center gap-4">
            <CheckCircle2 className="w-10 h-10 text-sky-200" />
            <div className="text-right">
              <h3 className="text-xl font-bold">الفعالية جارية حالياً</h3>
              <p className="text-sky-100 text-sm mt-1">
                تفضل بالتوجه إلى عمادة شؤون الطلاب
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2.5 sm:gap-6 max-w-2xl mx-auto">
            {/* Days Card */}
            <div className="bg-slate-950 text-white rounded-2xl p-3.5 sm:p-6 shadow-md border border-slate-800 flex flex-col items-center justify-center transition-transform hover:scale-105">
              <span className="text-2xl sm:text-5xl font-black font-mono tracking-tight text-sky-400">
                {formatNumber(timeLeft.days)}
              </span>
              <span className="text-xs sm:text-sm font-semibold text-slate-300 mt-2">
                يوم
              </span>
            </div>

            {/* Hours Card */}
            <div className="bg-slate-950 text-white rounded-2xl p-3.5 sm:p-6 shadow-md border border-slate-800 flex flex-col items-center justify-center transition-transform hover:scale-105">
              <span className="text-2xl sm:text-5xl font-black font-mono tracking-tight text-blue-300">
                {formatNumber(timeLeft.hours)}
              </span>
              <span className="text-xs sm:text-sm font-semibold text-slate-300 mt-2">
                ساعة
              </span>
            </div>

            {/* Minutes Card */}
            <div className="bg-slate-950 text-white rounded-2xl p-3.5 sm:p-6 shadow-md border border-slate-800 flex flex-col items-center justify-center transition-transform hover:scale-105">
              <span className="text-2xl sm:text-5xl font-black font-mono tracking-tight text-sky-300">
                {formatNumber(timeLeft.minutes)}
              </span>
              <span className="text-xs sm:text-sm font-semibold text-slate-300 mt-2">
                دقيقة
              </span>
            </div>

            {/* Seconds Card */}
            <div className="bg-slate-950 text-white rounded-2xl p-3.5 sm:p-6 shadow-md border border-slate-800 flex flex-col items-center justify-center transition-transform hover:scale-105">
              <span className="text-2xl sm:text-5xl font-black font-mono tracking-tight text-blue-400 animate-pulse">
                {formatNumber(timeLeft.seconds)}
              </span>
              <span className="text-xs sm:text-sm font-semibold text-slate-300 mt-2">
                ثانية
              </span>
            </div>
          </div>
        )}

        <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-slate-400">
          <Sparkles className="w-3.5 h-3.5 text-blue-500" />
          <span>عمادة شؤون الطلاب • أسبوع المستجدين 2026</span>
        </div>
      </div>
    </section>
  );
};
