export type DayKey = 'tuesday' | 'wednesday' | 'thursday';
export type AppTheme = 'royal' | 'modern' | 'vibrant' | 'dark';

export interface ThemeConfig {
  id: AppTheme;
  name: string;
  subtitle: string;
  primaryColor: string;
  badgeBg: string;
  cardBg: string;
  heroGradient: string;
}

export interface Guest {
  id: string;
  name: string;
  title: string;
  fields: string[];
  bio?: string;
  avatarUrl?: string;
  days: string[];
}

export interface Session {
  id: string;
  guestId: string;
  guestName: string;
  title?: string;
  dayKey: DayKey;
  dayName: string;
  dateStr: string; // e.g. "2026-08-25"
  dateLabel: string; // e.g. "الثلاثاء 25 أغسطس 2026"
  startTimeStr: string; // e.g. "10:20 AM"
  endTimeStr: string; // e.g. "1:00 PM"
  startIso: string; // e.g. "2026-08-25T10:20:00"
  endIso: string; // e.g. "2026-08-25T13:00:00"
  fields: string[];
  location: string;
  totalSeats: number;
  bookedSeats: number;
  isOpen: boolean;
  description?: string;
  isPendingInfo?: boolean; // For Dr. Hanan and Dr. Maysa whose time is pending
  waitlistCount?: number;
}

export interface WaitlistEntry {
  id: string;
  sessionId: string;
  sessionTitle?: string;
  guestName: string;
  fields: string[];
  dateLabel: string;
  timeLabel: string;
  location: string;
  studentName: string;
  studentEmail: string;
  universityId: string; // الرقم الجامعي
  phoneNumber: string;
  createdAt: string;
  status: 'waiting' | 'promoted' | 'cancelled';
  promotedBookingId?: string;
  promotedBookingCode?: string;
  position?: number;
}

export interface Booking {
  id: string;
  bookingCode: string; // e.g. "BK-25AUG-9182"
  sessionId: string;
  sessionTitle?: string;
  guestName: string;
  fields: string[];
  dateLabel: string;
  timeLabel: string;
  location: string;
  studentName: string;
  studentEmail: string;
  universityId: string; // الرقم الجامعي
  phoneNumber: string;
  createdAt: string;
  attended: boolean;
  attendedAt?: string;
  verificationToken: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  universityId: string;
  phoneNumber?: string;
  role: 'student' | 'admin';
}

export interface StageScheduleItem {
  id: string;
  dayKey: 'tuesday' | 'wednesday';
  dayLabel: string;
  timeRange: string;
  title: string;
  description?: string;
  type: 'welcome' | 'talk' | 'interactive' | 'closing';
}

export interface InteractiveSegment {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  description: string;
  iconName: string;
}
