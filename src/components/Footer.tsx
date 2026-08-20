import React from 'react';
import { MapPin, Mail } from 'lucide-react';
import { User } from '../types';

interface FooterProps {
  onNavigate: (view: 'home' | 'sessions' | 'guests' | 'about' | 'bookings' | 'admin') => void;
  currentUser?: User | null;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, currentUser }) => {
  const isAdmin = currentUser?.role === 'admin';
  return (
    <footer className="bg-slate-950 text-white border-t border-slate-900 pt-16 pb-12 text-right">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-12">
          
          {/* Col 1: Brand & Identity */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-sky-400 font-black text-xl">
                ✦
              </div>
              <div>
                <span className="text-sky-400 font-mono text-[10px] font-bold block mb-0.5 tracking-wider">1:1 meeting</span>
                <h3 className="font-extrabold text-lg text-white">الجلسات الحوارية</h3>
                <p className="text-xs text-sky-400 font-semibold">أسبوع المستجدين 2026</p>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              منصة تفاعلية متكاملة لتنظيم وحجز حضور الجلسات الإرشادية والأكاديمية الموجهة للطلبة المستجدين في عمادة شؤون الطلاب.
            </p>
            <div className="text-xs text-slate-500 font-mono">
              25 - 27 أغسطس 2026م
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white border-b border-slate-800 pb-2">روابط المنصة</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <button
                  onClick={() => onNavigate('home')}
                  className="hover:text-sky-400 transition-colors cursor-pointer"
                >
                  الرئيسية
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('sessions')}
                  className="hover:text-sky-400 transition-colors cursor-pointer"
                >
                  جدول الجلسات الحوارية (1:1)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('guests')}
                  className="hover:text-sky-400 transition-colors cursor-pointer"
                >
                  نخبة الضيوف والمرشدين
                </button>
              </li>
              {isAdmin ? (
                <li>
                  <button
                    onClick={() => onNavigate('admin')}
                    className="hover:text-sky-400 transition-colors cursor-pointer"
                  >
                    لوحة الإدارة
                  </button>
                </li>
              ) : (
                <li>
                  <button
                    onClick={() => onNavigate('bookings')}
                    className="hover:text-sky-400 transition-colors cursor-pointer"
                  >
                    حجوزاتي
                  </button>
                </li>
              )}
            </ul>
          </div>

          {/* Col 3: Contact & Venue Info */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white border-b border-slate-800 pb-2">الموقع والتواصل</h4>
            <div className="space-y-2.5 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-500 shrink-0" />
                <span>عمادة شؤون الطلاب، جامعة تبوك</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-500 shrink-0" />
                <span className="font-mono">st-af@ut.edu.sa</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom copyright line */}
        <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>عمادة شؤون الطلاب - أسبوع المستجدين 2026</p>
          <p className="text-slate-400">
            عمادة شؤون الطلاب • جامعة تبوك
          </p>
        </div>
      </div>
    </footer>
  );
};
