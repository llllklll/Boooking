import React from 'react';
import { Sparkles, Calendar, Ticket, Shield, MapPin, Award, CheckCircle } from 'lucide-react';
import { User } from '../types';

interface HeroSectionProps {
  onExploreSessions: () => void;
  onOpenBookings: () => void;
  currentUser?: User | null;
  onOpenAdmin?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onExploreSessions,
  onOpenBookings,
  currentUser,
  onOpenAdmin,
}) => {
  const isAdmin = currentUser?.role === 'admin';
  return (
    <section className="relative overflow-hidden bg-slate-950 text-white py-16 sm:py-24 border-b border-slate-800">
      {/* Decorative background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-blue-900/30 via-transparent to-transparent pointer-events-none" />
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-sky-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        
        {/* Academic Event Badge */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-500/20 border border-blue-400/40 text-sky-300 text-xs sm:text-sm font-black font-mono tracking-wider backdrop-blur-md shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span>1:1 meeting</span>
          </div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-slate-300 text-xs sm:text-sm font-bold backdrop-blur-md">
            <span>عمادة شؤون الطلاب • أسبوع المستجدين 2026</span>
          </div>
        </div>

        {/* Main Title with 1:1 meeting above */}
        <div className="mb-4">
          <span className="inline-block text-sky-400 font-mono font-black tracking-widest text-sm sm:text-base uppercase mb-1 drop-shadow-xs">
            1:1 meeting
          </span>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white leading-tight font-sans">
            الجلسات الحوارية لأسبوع المستجدين
          </h1>
        </div>

        {/* Tagline */}
        <div className="inline-block px-5 py-2 rounded-2xl bg-white/5 border border-white/10 mb-6 backdrop-blur-xs">
          <p className="text-lg sm:text-2xl md:text-3xl font-extrabold text-sky-300 font-sans tracking-wide">
            “تجربة تبدأ بسؤال… وتنتهي بمنظور جديد”
          </p>
        </div>

        {/* Short Description */}
        <p className="text-sm sm:text-base md:text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed mb-10 font-normal">
          تجربة حوارية إرشادية تجمع الطلاب بنخبة من المستشارين الأكاديميين والنفسيين. بوابتك لاكتشاف أسرار التفوق الجامعي والتخطيط الأكاديمي والمهني.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
          <button
            id="hero-explore-sessions-btn"
            onClick={onExploreSessions}
            className="w-full sm:w-auto flex items-center justify-center gap-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black px-8 py-3.5 rounded-xl transition-all shadow-lg shadow-blue-600/30 transform hover:-translate-y-0.5 text-sm sm:text-base cursor-pointer"
          >
            <Calendar className="w-5 h-5" />
            <span>استعرض الجلسات الحوارية</span>
          </button>

          {isAdmin ? (
            <button
              id="hero-admin-btn"
              onClick={onOpenAdmin}
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 bg-slate-900 hover:bg-slate-800 text-white border border-slate-800 font-bold px-8 py-3.5 rounded-xl transition-all transform hover:-translate-y-0.5 text-sm sm:text-base cursor-pointer"
            >
              <Shield className="w-5 h-5 text-sky-300" />
              <span>لوحة الإدارة</span>
            </button>
          ) : (
            <button
              id="hero-book-seat-btn"
              onClick={onOpenBookings}
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 bg-slate-900 hover:bg-slate-800 text-white border border-slate-800 font-bold px-8 py-3.5 rounded-xl transition-all transform hover:-translate-y-0.5 text-sm sm:text-base cursor-pointer"
            >
              <Ticket className="w-5 h-5 text-sky-300" />
              <span>حجوزاتي</span>
            </button>
          )}
        </div>

        {/* Key Features Quick Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-14 max-w-4xl mx-auto pt-10 border-t border-slate-800 text-right">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 backdrop-blur-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-sky-400 shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-medium">الفترة الزمنية</p>
              <p className="text-xs sm:text-sm font-black text-white">25 - 27 أغسطس</p>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 backdrop-blur-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-sky-300 shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-medium">المكان</p>
              <p className="text-xs sm:text-sm font-black text-white">عمادة شؤون الطلاب</p>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 backdrop-blur-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-sky-300 shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-medium">نخبة الضيوف</p>
              <p className="text-xs sm:text-sm font-black text-white">12 متحدثاً ومرشداً</p>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 backdrop-blur-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-sky-300 shrink-0">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-medium">نظام الحجز</p>
              <p className="text-xs sm:text-sm font-black text-white">مقاعد محددة بالحجز</p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
