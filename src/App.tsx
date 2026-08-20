import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { CountdownSection } from './components/CountdownSection';
import { NextSessionSection } from './components/NextSessionSection';
import { SessionsPage } from './components/SessionsPage';
import { GuestsSection } from './components/GuestsSection';
import { AboutSection } from './components/AboutSection';
import { FAQSection } from './components/FAQSection';
import { Footer } from './components/Footer';
import { BookingModal } from './components/BookingModal';
import { SessionDetailModal } from './components/SessionDetailModal';
import { AuthModal } from './components/AuthModal';
import { MyBookingsView } from './components/MyBookingsView';
import { AdminDashboard } from './components/AdminDashboard';
import { LoginPage } from './components/LoginPage';
import { Booking, Guest, Session, User } from './types';
import { api } from './lib/api';
import { INITIAL_GUESTS, INITIAL_SESSIONS } from './data/initialData';

export default function App() {
  const [currentView, setCurrentView] = useState<'home' | 'sessions' | 'guests' | 'about' | 'bookings' | 'admin'>('home');
  const [sessions, setSessions] = useState<Session[]>(INITIAL_SESSIONS);
  const [guests, setGuests] = useState<Guest[]>(INITIAL_GUESTS);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Modals state
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedSessionForBooking, setSelectedSessionForBooking] = useState<Session | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedSessionForDetail, setSelectedSessionForDetail] = useState<Session | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Pre-filtered state when navigating from Guests to Sessions
  const [presetGuestFilter, setPresetGuestFilter] = useState<string | null>(null);

  // Global notification banner
  const [bannerMessage, setBannerMessage] = useState<{ text: string; type: 'info' | 'success' } | null>(null);

  // Fetch initial data & check logged in user
  const loadData = async () => {
    try {
      const [fetchedSessions, fetchedGuests, user] = await Promise.all([
        api.getSessions(),
        api.getGuests(),
        api.getCurrentUser(),
      ]);

      if (fetchedSessions && fetchedSessions.length > 0) {
        setSessions(fetchedSessions);
      }
      if (fetchedGuests && fetchedGuests.length > 0) {
        setGuests(fetchedGuests);
      }
      if (user) {
        setCurrentUser(user);
      }
    } catch (e) {
      console.error('Error fetching initial data', e);
    } finally {
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleNavigate = (view: 'home' | 'sessions' | 'guests' | 'about' | 'bookings' | 'admin') => {
    // If student tries to navigate to admin, redirect to home
    if (view === 'admin' && currentUser?.role !== 'admin') {
      setCurrentView('home');
      return;
    }
    // If admin tries to navigate to bookings, redirect to admin dashboard
    if (view === 'bookings' && currentUser?.role === 'admin') {
      setCurrentView('admin');
      return;
    }
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenBooking = (session: Session) => {
    setSelectedSessionForBooking(session);
    setBookingModalOpen(true);
  };

  const handleOpenDetail = (session: Session) => {
    setSelectedSessionForDetail(session);
    setDetailModalOpen(true);
  };

  const handleBookingSuccess = async (booking: Booking) => {
    // Optimistically update session seats count immediately
    setSessions((prev) =>
      prev.map((s) =>
        s.id === booking.sessionId
          ? { ...s, bookedSeats: Math.min(s.totalSeats, s.bookedSeats + 1) }
          : s
      )
    );
    setSelectedSessionForBooking((prev) =>
      prev && prev.id === booking.sessionId
        ? { ...prev, bookedSeats: Math.min(prev.totalSeats, prev.bookedSeats + 1) }
        : prev
    );
    await loadData();
    setBannerMessage({
      type: 'success',
      text: `تم تأكيد حجزك بنجاح للجلسة مع ${booking.guestName}! رقم الحجز: ${booking.bookingCode}`,
    });
  };

  const handleSelectGuestSessions = (guestName: string) => {
    setPresetGuestFilter(guestName);
    setCurrentView('sessions');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = async () => {
    await api.logout();
    setCurrentUser(null);
    setCurrentView('home');
    setBannerMessage({
      type: 'info',
      text: 'تم تسجيل الخروج بنجاح',
    });
  };

  // If loading session on first boot
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white" dir="rtl">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-bold text-slate-300">جاري تحميل منصة أسبوع المستجدين...</p>
        </div>
      </div>
    );
  }

  // MANDATORY AUTHENTICATION GATEWAY
  // If user is not logged in, render the Login / Account Creation screen first
  if (!currentUser) {
    return (
      <LoginPage
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          if (user.role === 'admin') {
            setCurrentView('admin');
          } else {
            setCurrentView('home');
          }
          setBannerMessage({
            type: 'success',
            text: `مرحباً بك، ${user.name}!`,
          });
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans flex flex-col transition-colors duration-300" dir="rtl">
      
      {/* Top Banner if present */}
      {bannerMessage && (
        <div
          className={`py-2 px-4 text-center text-xs font-bold flex items-center justify-center gap-3 transition-all ${
            bannerMessage.type === 'success' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-white'
          }`}
        >
          <span>{bannerMessage.text}</span>
          <button
            onClick={() => setBannerMessage(null)}
            className="text-white hover:opacity-70 font-mono cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Navigation Header */}
      <Navbar
        currentView={currentView}
        onNavigate={handleNavigate}
        sessions={sessions}
        currentUser={currentUser}
        onOpenAuth={() => setAuthModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Content Area based on active view */}
      <main className="flex-1">
        
        {/* --- 1. HOME VIEW --- */}
        {currentView === 'home' && (
          <div className="space-y-0">
            {/* Hero Section */}
            <HeroSection
              onExploreSessions={() => handleNavigate('sessions')}
              onOpenBookings={() => handleNavigate('bookings')}
              currentUser={currentUser}
              onOpenAdmin={() => handleNavigate('admin')}
            />

            {/* Countdown Banner */}
            <CountdownSection />

            {/* Next Session Dynamic Live Card */}
            <NextSessionSection
              sessions={sessions}
              onOpenBooking={handleOpenBooking}
              onOpenDetails={handleOpenDetail}
            />

            {/* Featured Sessions Preview */}
            <div className="py-12 bg-slate-50 border-b border-slate-200">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                  <div>
                    <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-blue-100 border border-blue-200 text-blue-800 font-mono font-bold text-xs mb-1.5 uppercase">
                      1:1 meeting
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                      جدول الجلسات الحوارية
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                      جلسات إرشادية وتفاعلية متخصصة مع نخبة من الأكاديميين والمستشارين
                    </p>
                  </div>

                  <button
                    onClick={() => handleNavigate('sessions')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    عرض الجدول الكامل والفلاتر ←
                  </button>
                </div>

                {/* Session Page Component */}
                <SessionsPage
                  sessions={sessions}
                  onOpenBooking={handleOpenBooking}
                  onOpenDetails={handleOpenDetail}
                  presetGuestFilter={presetGuestFilter}
                  onClearPreset={() => setPresetGuestFilter(null)}
                />
              </div>
            </div>

            {/* Featured Guests Preview */}
            <GuestsSection
              guests={guests}
              sessions={sessions}
              onSelectGuestSessions={handleSelectGuestSessions}
              onOpenBooking={handleOpenBooking}
            />

            {/* About Section */}
            <AboutSection />

            {/* FAQ Section */}
            <FAQSection />
          </div>
        )}

        {/* --- 2. SESSIONS VIEW --- */}
        {currentView === 'sessions' && (
          <div className="py-10 min-h-[70vh]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="mb-6 text-right">
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-blue-100 border border-blue-200 text-blue-800 font-mono font-bold text-xs mb-1.5 uppercase">
                  1:1 meeting
                </div>
                <h1 className="text-3xl font-black text-slate-900">
                  جميع الجلسات الحوارية
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                  استعرض الجلسات حسب اليوم، المجال، والضيف واحجز مقعدك بكل سهولة
                </p>
              </div>

              <SessionsPage
                sessions={sessions}
                onOpenBooking={handleOpenBooking}
                onOpenDetails={handleOpenDetail}
                presetGuestFilter={presetGuestFilter}
                onClearPreset={() => setPresetGuestFilter(null)}
              />
            </div>
          </div>
        )}

        {/* --- 3. GUESTS VIEW --- */}
        {currentView === 'guests' && (
          <GuestsSection
            guests={guests}
            sessions={sessions}
            onSelectGuestSessions={handleSelectGuestSessions}
            onOpenBooking={handleOpenBooking}
          />
        )}

        {/* --- 4. ABOUT VIEW --- */}
        {currentView === 'about' && (
          <div>
            <AboutSection />
            <FAQSection />
          </div>
        )}

        {/* --- 6. MY BOOKINGS VIEW (STUDENTS ONLY) --- */}
        {currentView === 'bookings' && currentUser?.role !== 'admin' && (
          <MyBookingsView
            currentUser={currentUser}
            onOpenAuth={() => setAuthModalOpen(true)}
            onExploreSessions={() => handleNavigate('sessions')}
            onBookingCancelled={loadData}
          />
        )}

        {/* --- 7. ADMIN DASHBOARD VIEW (ADMINS ONLY) --- */}
        {currentView === 'admin' && currentUser?.role === 'admin' && (
          <AdminDashboard
            sessions={sessions}
            guests={guests}
            onRefreshData={loadData}
            currentUser={currentUser}
            onOpenAuth={() => setAuthModalOpen(true)}
          />
        )}

      </main>

      {/* Global Booking Modal */}
      <BookingModal
        isOpen={bookingModalOpen}
        session={
          selectedSessionForBooking
            ? sessions.find((s) => s.id === selectedSessionForBooking.id) || selectedSessionForBooking
            : null
        }
        onClose={() => setBookingModalOpen(false)}
        currentUser={currentUser}
        onBookingSuccess={handleBookingSuccess}
        onWaitlistSuccess={(waitlistEntry) => {
          loadData();
          setBannerMessage({
            type: 'success',
            text: `تمت إضافتك بنجاح إلى قائمة الانتظار للجلسة مع ${waitlistEntry.guestName}!`,
          });
        }}
        onGoToBookings={() => handleNavigate('bookings')}
      />

      {/* Global Session Detail Modal */}
      <SessionDetailModal
        isOpen={detailModalOpen}
        session={
          selectedSessionForDetail
            ? sessions.find((s) => s.id === selectedSessionForDetail.id) || selectedSessionForDetail
            : null
        }
        onClose={() => setDetailModalOpen(false)}
        onOpenBooking={handleOpenBooking}
      />

      {/* Auth Modal for account updates or switching */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setBannerMessage({
            type: 'success',
            text: `مرحباً بك، ${user.name}!`,
          });
        }}
      />

      {/* Global Footer */}
      <Footer onNavigate={handleNavigate} currentUser={currentUser} />

    </div>
  );
}
