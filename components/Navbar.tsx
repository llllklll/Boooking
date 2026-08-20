import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Users, 
  Ticket, 
  Shield, 
  Menu, 
  X, 
  Clock, 
  Sparkles, 
  LogOut, 
  User as UserIcon, 
  ChevronLeft 
} from 'lucide-react';
import { Session, User } from '../types';
import { getNextOrCurrentSession } from '../lib/dateUtils';

interface NavbarProps {
  currentView: 'home' | 'sessions' | 'guests' | 'about' | 'bookings' | 'admin';
  onNavigate: (view: 'home' | 'sessions' | 'guests' | 'about' | 'bookings' | 'admin') => void;
  currentUser: User | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  sessions: Session[];
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  currentUser,
  onOpenAuth,
  onLogout,
  sessions,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [nextSessionData, setNextSessionData] = useState<{
    session: Session | null;
    isLive: boolean;
    timeText: string;
  }>({ session: null, isLive: false, timeText: '' });

  // Update mini badge countdown every second
  useEffect(() => {
    const updateCountdown = () => {
      const { session, isLive, timeLeft } = getNextOrCurrentSession(sessions);
      if (session) {
        let text = '';
        if (isLive) {
          text = 'مباشر الآن';
        } else if (timeLeft.days > 0) {
          text = `بعد ${timeLeft.days} يوم و ${timeLeft.hours} س`;
        } else {
          text = `بعد ${timeLeft.hours} س و ${timeLeft.minutes} د`;
        }
        setNextSessionData({ session, isLive, timeText: text });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [sessions]);

  const isAdmin = currentUser?.role === 'admin';

  const navItems = [
    { id: 'home' as const, label: 'الرئيسية', icon: Sparkles },
    { id: 'sessions' as const, label: 'الجلسات الحوارية (1:1)', icon: Calendar },
    { id: 'guests' as const, label: 'الضيوف والمرشدين', icon: Users },
    ...(!isAdmin ? [{ id: 'bookings' as const, label: 'حجوزاتي', icon: Ticket }] : []),
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 shadow-md">
      
      {/* Top Notification / Next Session Quick Bar */}
      {nextSessionData.session && (
        <div className="bg-blue-950/60 border-b border-blue-900/40 text-white text-xs py-1.5 px-4">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold ${
                nextSessionData.isLive 
                  ? 'bg-rose-500 text-white animate-pulse' 
                  : 'bg-blue-500/20 text-sky-300 border border-blue-500/40'
              }`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                {nextSessionData.isLive ? 'الجلسة جارية الآن' : 'الجلسة القادمة'}
              </span>
              <span className="font-bold text-white">{nextSessionData.session.guestName}</span>
              <span className="text-white/40 hidden sm:inline">•</span>
              <span className="text-slate-300 hidden sm:inline">{nextSessionData.session.fields[0]}</span>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-sky-300">
                <Clock className="w-3.5 h-3.5" />
                <span className="font-mono">{nextSessionData.timeText}</span>
              </div>
              <button
                onClick={() => onNavigate('sessions')}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-2.5 py-0.5 rounded-md text-xs transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
              >
                <span>احجز مقعدك</span>
                <ChevronLeft className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          
          {/* Brand / Logo */}
          <div 
            onClick={() => onNavigate('home')}
            className="flex items-center gap-3 cursor-pointer group select-none"
            id="brand-logo-btn"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black shadow-md shadow-blue-600/30 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col text-right">
              <span className="font-extrabold text-base sm:text-lg text-white tracking-tight leading-none">
                أسبوع المستجدين 2026
              </span>
              <span className="text-[11px] text-sky-300 font-semibold mt-1 flex items-center gap-1.5">
                <span className="font-mono bg-blue-500/20 text-sky-300 px-1 py-0.2 rounded text-[9px] font-bold">1:1 meeting</span>
                <span>الجلسات الحوارية • عمادة شؤون الطلاب</span>
              </span>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-link-${item.id}`}
                  onClick={() => onNavigate(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* User Controls & Admin (Admin Button ONLY visible for admins) */}
          <div className="hidden sm:flex items-center gap-2.5">
            
            {/* Admin Dashboard - ONLY FOR ADMINS */}
            {isAdmin && (
              <button
                id="admin-nav-btn"
                onClick={() => onNavigate('admin')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  currentView === 'admin'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900'
                }`}
                title="لوحة تحكم المشرفين"
              >
                <Shield className="w-4 h-4 text-sky-300" />
                <span>لوحة الإدارة</span>
              </button>
            )}

            {/* User Profile / Logout */}
            {currentUser ? (
              <div className="flex items-center gap-2 bg-slate-900 pl-2 pr-3 py-1.5 rounded-xl border border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-black">
                    {currentUser.name.charAt(0)}
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-white leading-none">{currentUser.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {currentUser.role === 'admin' ? 'مشرف' : currentUser.universityId}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onLogout}
                  id="user-logout-btn"
                  className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-rose-400 transition-colors mr-1 cursor-pointer"
                  title="تسجيل الخروج"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                id="login-modal-open-btn"
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black px-3.5 py-2 rounded-xl shadow-md shadow-blue-600/30 transition-all cursor-pointer"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>تسجيل الدخول</span>
              </button>
            )}
          </div>

          {/* Mobile Controls */}
          <div className="flex sm:hidden items-center gap-2">
            {!isAdmin && (
              <button
                onClick={() => onNavigate('bookings')}
                className="p-2 text-sky-300 bg-slate-900 rounded-xl cursor-pointer"
                title="حجوزاتي"
              >
                <Ticket className="w-5 h-5" />
              </button>
            )}
            <button
              id="mobile-menu-toggle-btn"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl text-white hover:bg-slate-900 focus:outline-hidden cursor-pointer"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-800 bg-slate-950 px-4 pt-3 pb-6 space-y-3 shadow-2xl text-white">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="pt-2 space-y-2">
            {/* Show admin button on mobile ONLY if admin */}
            {isAdmin && (
              <button
                onClick={() => {
                  onNavigate('admin');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-900 text-white font-bold rounded-xl text-xs cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-sky-300" />
                  لوحة تحكم المشرفين
                </span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}

            {currentUser ? (
              <div className="flex items-center justify-between p-3 bg-slate-900 rounded-xl border border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                    {currentUser.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">{currentUser.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {currentUser.role === 'admin' ? 'مشرف' : currentUser.universityId}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    onLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="text-xs text-rose-400 font-bold px-2 py-1 bg-rose-500/10 rounded cursor-pointer"
                >
                  خروج
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  onOpenAuth();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full py-2.5 bg-blue-600 text-white text-center font-black rounded-xl text-xs cursor-pointer"
              >
                تسجيل الدخول / حساب جديد
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
