import { Session } from '../types';

// Event kickoff timestamp: Tuesday, August 25, 2026 at 10:00 AM AST
export const EVENT_START_DATE = new Date('2026-08-25T10:00:00');
export const EVENT_END_DATE = new Date('2026-08-27T15:00:00');

export interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
  totalMs: number;
}

export function calculateTimeLeft(targetDate: Date | string, customNow?: Date): TimeLeft {
  const target = typeof targetDate === 'string' ? new Date(targetDate) : targetDate;
  const now = customNow || new Date();
  const diff = target.getTime() - now.getTime();

  if (diff <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isPast: true,
      totalMs: 0,
    };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return {
    days,
    hours,
    minutes,
    seconds,
    isPast: false,
    totalMs: diff,
  };
}

export type EventStatus = 'before' | 'during' | 'day_ended' | 'completed';

export function getOverallEventStatus(now = new Date()): {
  status: EventStatus;
  headline: string;
  badgeText: string;
} {
  const start = EVENT_START_DATE.getTime();
  const end = EVENT_END_DATE.getTime();
  const currentTime = now.getTime();

  if (currentTime < start) {
    return {
      status: 'before',
      headline: 'باقي على انطلاق الجلسات',
      badgeText: 'قريباً',
    };
  } else if (currentTime >= start && currentTime <= end) {
    return {
      status: 'during',
      headline: 'الجلسات مستمرة الآن',
      badgeText: 'مباشر الآن',
    };
  } else {
    return {
      status: 'completed',
      headline: 'اختتمت فعاليات الجلسات الحوارية',
      badgeText: 'انتهت الفعالية',
    };
  }
}

/**
 * Finds the next upcoming session or the currently active session
 */
export function getNextOrCurrentSession(sessions: Session[], now = new Date()): {
  session: Session | null;
  isLive: boolean;
  timeLeft: TimeLeft;
} {
  if (!sessions || sessions.length === 0) {
    return { session: null, isLive: false, timeLeft: calculateTimeLeft(now, now) };
  }

  const validSessions = sessions
    .filter((s) => !s.isPendingInfo && s.startIso)
    .sort((a, b) => new Date(a.startIso).getTime() - new Date(b.startIso).getTime());

  const currentTime = now.getTime();

  // 1. Check if any session is currently LIVE (now between start and end)
  const currentLive = validSessions.find((s) => {
    const start = new Date(s.startIso).getTime();
    const end = new Date(s.endIso).getTime();
    return currentTime >= start && currentTime <= end;
  });

  if (currentLive) {
    const timeLeftToEnd = calculateTimeLeft(currentLive.endIso, now);
    return {
      session: currentLive,
      isLive: true,
      timeLeft: timeLeftToEnd,
    };
  }

  // 2. Find earliest future session
  const nextFuture = validSessions.find((s) => {
    const start = new Date(s.startIso).getTime();
    return start > currentTime;
  });

  if (nextFuture) {
    const timeLeftToStart = calculateTimeLeft(nextFuture.startIso, now);
    return {
      session: nextFuture,
      isLive: false,
      timeLeft: timeLeftToStart,
    };
  }

  // 3. If all sessions are in the past, return the very first session as default display
  const defaultSession = validSessions[0] || sessions[0];
  const timeLeft = calculateTimeLeft(defaultSession.startIso, now);

  return {
    session: defaultSession,
    isLive: false,
    timeLeft,
  };
}

export function formatSeatStatus(booked: number, total: number, isOpen = true): {
  label: string;
  countLabel: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  dotColor: string;
  isFull: boolean;
} {
  if (!isOpen) {
    return {
      label: 'الحجز مغلق',
      countLabel: 'مغلق حالياً',
      colorClass: 'text-slate-600',
      bgClass: 'bg-slate-100',
      borderClass: 'border-slate-300',
      dotColor: 'bg-slate-400',
      isFull: true,
    };
  }

  const remaining = Math.max(0, total - booked);

  if (remaining === 0) {
    return {
      label: 'اكتمل الحجز',
      countLabel: 'المقاعد مكتملة',
      colorClass: 'text-red-700',
      bgClass: 'bg-red-50',
      borderClass: 'border-red-200',
      dotColor: 'bg-red-500',
      isFull: true,
    };
  }

  if (remaining <= 8) {
    return {
      label: 'المقاعد محدودة',
      countLabel: `متبقي ${remaining} مقاعد فقط`,
      colorClass: 'text-amber-700',
      bgClass: 'bg-amber-50',
      borderClass: 'border-amber-200',
      dotColor: 'bg-amber-500',
      isFull: false,
    };
  }

  return {
    label: 'متاح للتسجيل',
    countLabel: `متبقي ${remaining} مقعد`,
    colorClass: 'text-emerald-700',
    bgClass: 'bg-emerald-50',
    borderClass: 'border-emerald-200',
    dotColor: 'bg-emerald-500',
    isFull: false,
  };
}
