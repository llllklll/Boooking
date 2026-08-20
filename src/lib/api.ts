import { Booking, Guest, Session, User } from '../types';
import { INITIAL_GUESTS, INITIAL_SESSIONS } from '../data/initialData';

const INITIAL_USERS: User[] = [
  {
    id: 'admin-1',
    name: 'المشرف العام - عمادة شؤون الطلاب',
    email: 'admin@university.edu.sa',
    universityId: 'ADMIN-01',
    role: 'admin',
  },
  {
    id: 'user-demo-1',
    name: 'طالب مستجد',
    email: 'student@stu.edu.sa',
    universityId: '44310982',
    phoneNumber: '0551234567',
    role: 'student',
  },
];

const STORAGE_KEYS = {
  SESSIONS: 'orientation_sessions_v1',
  GUESTS: 'orientation_guests_v1',
  BOOKINGS: 'orientation_bookings_v1',
  CURRENT_USER: 'orientation_user_v1',
  USERS: 'orientation_users_v1',
};

// Initial local storage setup for resilience
function getLocal<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function setLocal<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.error('Local storage write error', e);
  }
}

export const api = {
  // --- SESSIONS ---
  async getSessions(): Promise<Session[]> {
    try {
      const res = await fetch('/api/sessions');
      if (!res.ok) throw new Error('Failed to fetch from server');
      const data = await res.json();
      if (data.sessions) {
        setLocal(STORAGE_KEYS.SESSIONS, data.sessions);
        return data.sessions;
      }
    } catch {
      console.warn('Using local fallback for sessions');
    }
    return getLocal<Session[]>(STORAGE_KEYS.SESSIONS, INITIAL_SESSIONS);
  },

  async createSession(sessionData: Partial<Session>): Promise<Session> {
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData),
      });
      const data = await res.json();
      if (data.success) {
        return data.session;
      }
      throw new Error(data.error || 'Failed to create session');
    } catch (e: any) {
      const current = getLocal<Session[]>(STORAGE_KEYS.SESSIONS, INITIAL_SESSIONS);
      const newSess: Session = {
        ...(sessionData as Session),
        id: `sess-${Date.now()}`,
        bookedSeats: 0,
        totalSeats: sessionData.totalSeats || 50,
        isOpen: true,
      };
      const updated = [newSess, ...current];
      setLocal(STORAGE_KEYS.SESSIONS, updated);
      return newSess;
    }
  },

  async updateSession(id: string, updates: Partial<Session>): Promise<Session> {
    try {
      const res = await fetch(`/api/sessions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (data.success) return data.session;
      throw new Error(data.error || 'Failed to update session');
    } catch {
      const current = getLocal<Session[]>(STORAGE_KEYS.SESSIONS, INITIAL_SESSIONS);
      const updated = current.map((s) => (s.id === id ? { ...s, ...updates } : s));
      setLocal(STORAGE_KEYS.SESSIONS, updated);
      return updated.find((s) => s.id === id)!;
    }
  },

  async deleteSession(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/sessions/${id}`, { method: 'DELETE' });
      const data = await res.json();
      return !!data.success;
    } catch {
      const current = getLocal<Session[]>(STORAGE_KEYS.SESSIONS, INITIAL_SESSIONS);
      setLocal(STORAGE_KEYS.SESSIONS, current.filter((s) => s.id !== id));
      return true;
    }
  },

  // --- GUESTS ---
  async getGuests(): Promise<Guest[]> {
    try {
      const res = await fetch('/api/guests');
      if (!res.ok) throw new Error('Failed to fetch guests');
      const data = await res.json();
      if (data.guests) {
        setLocal(STORAGE_KEYS.GUESTS, data.guests);
        return data.guests;
      }
    } catch {
      console.warn('Using local fallback for guests');
    }
    return getLocal<Guest[]>(STORAGE_KEYS.GUESTS, INITIAL_GUESTS);
  },

  async createGuest(guestData: Partial<Guest>): Promise<Guest> {
    try {
      const res = await fetch('/api/guests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(guestData),
      });
      const data = await res.json();
      if (data.success) return data.guest;
      throw new Error(data.error || 'Failed to create guest');
    } catch {
      const current = getLocal<Guest[]>(STORAGE_KEYS.GUESTS, INITIAL_GUESTS);
      const newGuest: Guest = {
        ...(guestData as Guest),
        id: `guest-${Date.now()}`,
        fields: guestData.fields || ['الإرشاد الأكاديمي'],
        days: guestData.days || ['الثلاثاء 25 أغسطس'],
      };
      setLocal(STORAGE_KEYS.GUESTS, [...current, newGuest]);
      return newGuest;
    }
  },

  // --- BOOKINGS ---
  async getBookings(params?: { universityId?: string; email?: string }): Promise<Booking[]> {
    const localBookings = getLocal<Booking[]>(STORAGE_KEYS.BOOKINGS, []);
    try {
      const query = new URLSearchParams();
      if (params?.universityId) query.set('universityId', params.universityId);
      if (params?.email) query.set('email', params.email);

      const res = await fetch(`/api/bookings?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.bookings) {
          const serverBookings: Booking[] = data.bookings;
          // Merge server & local bookings to guarantee no data loss
          const map = new Map<string, Booking>();
          serverBookings.forEach((b) => map.set(b.id || b.bookingCode, b));
          localBookings.forEach((b) => {
            const key = b.id || b.bookingCode;
            if (!map.has(key)) map.set(key, b);
          });
          const merged = Array.from(map.values());

          if (!params?.universityId && !params?.email) {
            setLocal(STORAGE_KEYS.BOOKINGS, merged);
          }

          if (params?.universityId) {
            return merged.filter((b) => b.universityId.toLowerCase() === params.universityId!.toLowerCase());
          }
          if (params?.email) {
            return merged.filter((b) => b.studentEmail.toLowerCase() === params.email!.toLowerCase());
          }
          return merged;
        }
      }
    } catch {
      console.warn('Using local fallback for bookings');
    }

    if (params?.universityId) {
      return localBookings.filter((b) => b.universityId.toLowerCase() === params.universityId!.toLowerCase());
    }
    if (params?.email) {
      return localBookings.filter((b) => b.studentEmail.toLowerCase() === params.email!.toLowerCase());
    }
    return localBookings;
  },

  async createBooking(bookingPayload: {
    sessionId: string;
    studentName: string;
    studentEmail: string;
    universityId: string;
    phoneNumber: string;
  }): Promise<{ success: boolean; booking?: Booking; error?: string }> {
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingPayload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'تعذر تأكيد الحجز' };
      }
      if (data.booking) {
        // Save to local storage as well for instant persistent backup
        const currentBookings = getLocal<Booking[]>(STORAGE_KEYS.BOOKINGS, []);
        const filtered = currentBookings.filter(
          (b) => b.id !== data.booking.id && b.bookingCode !== data.booking.bookingCode
        );
        setLocal(STORAGE_KEYS.BOOKINGS, [data.booking, ...filtered]);

        // Update local session bookedSeats
        const allSessions = getLocal<Session[]>(STORAGE_KEYS.SESSIONS, INITIAL_SESSIONS);
        const updatedSessions = allSessions.map((s) =>
          s.id === data.booking.sessionId ? { ...s, bookedSeats: Math.min(s.totalSeats, s.bookedSeats + 1) } : s
        );
        setLocal(STORAGE_KEYS.SESSIONS, updatedSessions);
      }
      return { success: true, booking: data.booking };
    } catch (err: any) {
      // Fallback local booking
      const allSessions = getLocal<Session[]>(STORAGE_KEYS.SESSIONS, INITIAL_SESSIONS);
      const session = allSessions.find((s) => s.id === bookingPayload.sessionId);
      if (!session) return { success: false, error: 'الجلسة غير موجودة' };
      if (session.bookedSeats >= session.totalSeats) return { success: false, error: 'عذراً، اكتمل حجز هذه الجلسة' };

      const allBookings = getLocal<Booking[]>(STORAGE_KEYS.BOOKINGS, []);
      const existing = allBookings.find(
        (b) => b.sessionId === session.id && b.universityId.toLowerCase() === bookingPayload.universityId.toLowerCase()
      );
      if (existing) return { success: false, error: 'لقد قمت بحجز هذه الجلسة مسبقاً' };

      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const bookingCode = `BK-25AUG-${randomSuffix}`;
      const newBooking: Booking = {
        id: `bk-${Date.now()}`,
        bookingCode,
        sessionId: session.id,
        sessionTitle: session.title,
        guestName: session.guestName,
        fields: session.fields,
        dateLabel: session.dateLabel,
        timeLabel: `${session.startTimeStr} - ${session.endTimeStr}`,
        location: session.location,
        studentName: bookingPayload.studentName,
        studentEmail: bookingPayload.studentEmail,
        universityId: bookingPayload.universityId,
        phoneNumber: bookingPayload.phoneNumber,
        createdAt: new Date().toISOString(),
        attended: false,
        verificationToken: `v-tok-${Date.now()}`,
      };

      session.bookedSeats += 1;
      setLocal(STORAGE_KEYS.SESSIONS, allSessions);
      setLocal(STORAGE_KEYS.BOOKINGS, [newBooking, ...allBookings]);

      return { success: true, booking: newBooking };
    }
  },

  async cancelBooking(bookingId: string): Promise<{
    success: boolean;
    error?: string;
    promotedStudent?: string;
    promotedBookingCode?: string;
  }> {
    const currentBookings = getLocal<Booking[]>(STORAGE_KEYS.BOOKINGS, []);
    const targetBooking = currentBookings.find((b) => b.id === bookingId || b.bookingCode === bookingId);
    setLocal(
      STORAGE_KEYS.BOOKINGS,
      currentBookings.filter((b) => b.id !== bookingId && b.bookingCode !== bookingId)
    );
    if (targetBooking) {
      const allSessions = getLocal<Session[]>(STORAGE_KEYS.SESSIONS, INITIAL_SESSIONS);
      const updated = allSessions.map((s) =>
        s.id === targetBooking.sessionId && s.bookedSeats > 0 ? { ...s, bookedSeats: s.bookedSeats - 1 } : s
      );
      setLocal(STORAGE_KEYS.SESSIONS, updated);
    }
    try {
      const res = await fetch(`/api/bookings/${bookingId}/cancel`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        return {
          success: true,
          promotedStudent: data.promotedStudent,
          promotedBookingCode: data.promotedBookingCode,
        };
      }
      return { success: false, error: data.error };
    } catch {
      return { success: true };
    }
  },

  // --- WAITING LIST ---
  async getWaitlist(params?: { universityId?: string; email?: string; sessionId?: string }): Promise<import('../types').WaitlistEntry[]> {
    try {
      const query = new URLSearchParams();
      if (params?.universityId) query.set('universityId', params.universityId);
      if (params?.email) query.set('email', params.email);
      if (params?.sessionId) query.set('sessionId', params.sessionId);

      const res = await fetch(`/api/waitlist?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.waitlist) {
          return data.waitlist;
        }
      }
    } catch {
      console.warn('Failed to fetch waitlist');
    }
    return [];
  },

  async joinWaitlist(payload: {
    sessionId: string;
    studentName: string;
    studentEmail: string;
    universityId: string;
    phoneNumber: string;
  }): Promise<{ success: boolean; waitlistEntry?: import('../types').WaitlistEntry; position?: number; error?: string }> {
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'تعذر الانضمام لقائمة الانتظار' };
      }
      return {
        success: true,
        waitlistEntry: data.waitlistEntry,
        position: data.position,
      };
    } catch {
      return { success: false, error: 'حدث خطأ في الاتصال بالخادم' };
    }
  },

  async cancelWaitlist(waitlistId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch(`/api/waitlist/${waitlistId}/cancel`, { method: 'POST' });
      const data = await res.json();
      return { success: !!data.success, error: data.error };
    } catch {
      return { success: true };
    }
  },

  // --- ATTENDANCE & QR CHECK-IN ---
  async checkInAttendance(params: {
    qrData?: string;
    bookingCode?: string;
    bookingId?: string;
  }): Promise<{ success: boolean; message?: string; error?: string; alreadyAttended?: boolean; booking?: Booking }> {
    try {
      const res = await fetch('/api/attendance/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      const data = await res.json();
      return data;
    } catch (e: any) {
      return { success: false, error: 'حدث خطأ في الاتصال بنظام الحضور' };
    }
  },

  async toggleAttendance(bookingId: string): Promise<{
    success: boolean;
    booking?: Booking;
    promotedStudent?: string;
    promotedBookingCode?: string;
    message?: string;
  }> {
    try {
      const res = await fetch('/api/attendance/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId }),
      });
      const data = await res.json();
      return data;
    } catch {
      const current = getLocal<Booking[]>(STORAGE_KEYS.BOOKINGS, []);
      const updated = current.map((b) =>
        b.id === bookingId ? { ...b, attended: !b.attended, attendedAt: !b.attended ? new Date().toISOString() : undefined } : b
      );
      setLocal(STORAGE_KEYS.BOOKINGS, updated);
      return { success: true, booking: updated.find((b) => b.id === bookingId) };
    }
  },

  // --- STATS ---
  async getStats() {
    try {
      const res = await fetch('/api/stats');
      const data = await res.json();
      if (data.success) return data.stats;
    } catch {
      console.warn('Using local stats fallback');
    }
    const sessions = getLocal<Session[]>(STORAGE_KEYS.SESSIONS, INITIAL_SESSIONS);
    const bookings = getLocal<Booking[]>(STORAGE_KEYS.BOOKINGS, []);
    const attended = bookings.filter((b) => b.attended).length;
    const totalCapacity = sessions.reduce((acc, s) => acc + s.totalSeats, 0);
    const bookedCount = sessions.reduce((acc, s) => acc + s.bookedSeats, 0);
    return {
      totalSessions: sessions.length,
      totalBookings: bookings.length,
      attendedCount: attended,
      totalSeatsCapacity: totalCapacity,
      bookedSeatsCount: bookedCount,
      remainingSeats: Math.max(0, totalCapacity - bookedCount),
      attendanceRate: bookings.length > 0 ? Math.round((attended / bookings.length) * 100) : 0,
    };
  },

  // --- AUTH ---
  getCurrentUser(): User | null {
    return getLocal<User | null>(STORAGE_KEYS.CURRENT_USER, null);
  },

  setCurrentUser(user: User | null): void {
    if (user) {
      setLocal(STORAGE_KEYS.CURRENT_USER, user);
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  },

  async login(
    paramsOrIdentifier: string | { identifier: string; password?: string; role?: 'student' | 'admin' },
    maybePassword?: string
  ): Promise<{ success: boolean; user?: User; error?: string }> {
    const identifier = typeof paramsOrIdentifier === 'string' ? paramsOrIdentifier : paramsOrIdentifier.identifier;
    const password = typeof paramsOrIdentifier === 'string' ? maybePassword : paramsOrIdentifier.password;
    const role = typeof paramsOrIdentifier === 'object' ? paramsOrIdentifier.role : undefined;

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password, role }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        api.setCurrentUser(data.user);
        return { success: true, user: data.user };
      }
      return { success: false, error: data.error || 'فشل تسجيل الدخول' };
    } catch {
      const clean = identifier.trim().toLowerCase();
      const isAdmin = role === 'admin' || clean === 'admin' || clean === 'admin@university.edu.sa';

      if (role === 'student' && (clean === 'admin' || clean === 'admin@university.edu.sa' || clean === 'admin-01')) {
        return {
          success: false,
          error: 'هذا الحساب مخصص لإدارة المنصة، لا يمكن الدخول إليه من خانة الطالب/الزائر. يرجى اختيار تبويب "مشرف / منظم" واستخدام كلمة المرور المعتمدة.',
        };
      }

      if (isAdmin) {
        const cleanPassword = (password || '').trim();
        const isEmailValid = clean === 'admin@university.edu.sa' || clean === 'admin';
        const isPassValid = cleanPassword === 'admin 9080' || cleanPassword === 'admin9080';

        if (!isEmailValid || !isPassValid) {
          return {
            success: false,
            error: 'بيانات حساب المشرف غير صحيحة. يرجى إدخال البريد الإلكتروني (admin@university.edu.sa) وكلمة المرور المعتمدة الخاصة بالإدارة.',
          };
        }

        const user: User = {
          id: 'admin-1',
          name: 'المشرف العام - عمادة شؤون الطلاب',
          email: 'admin@university.edu.sa',
          universityId: 'ADMIN-01',
          role: 'admin',
        };
        api.setCurrentUser(user);
        return { success: true, user };
      }

      const allUsers = getLocal<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
      const existingUser = allUsers.find(
        (u) => u.email.toLowerCase() === clean || u.universityId.toLowerCase() === clean
      );

      if (!existingUser) {
        return {
          success: false,
          error: 'هذا الحساب غير مسجل في النظام. لا يمكنك تسجيل الدخول بحساب عشوائي، يرجى النقر على "إنشاء حساب جديد" أولاً لتسجيل بياناتك.',
        };
      }

      api.setCurrentUser(existingUser);
      return { success: true, user: existingUser };
    }
  },

  async register(params: {
    name: string;
    email: string;
    universityId: string;
    phoneNumber?: string;
    password?: string;
    role?: 'student' | 'admin';
  }): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      const data = await res.json();
      if (data.success && data.user) {
        api.setCurrentUser(data.user);
        const allUsers = getLocal<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
        if (!allUsers.some((u) => u.id === data.user.id)) {
          setLocal(STORAGE_KEYS.USERS, [...allUsers, data.user]);
        }
        return { success: true, user: data.user };
      }
      return { success: false, error: data.error || 'تعذر إنشاء الحساب' };
    } catch {
      const cleanEmail = params.email.trim().toLowerCase();
      const cleanUniId = params.universityId.trim().toLowerCase();

      if (params.role === 'admin' || cleanEmail === 'admin@university.edu.sa' || cleanUniId === 'admin-01') {
        return {
          success: false,
          error: 'لا يمكن إنشاء حساب مشرف جديد. حساب الإدارة محدد مسبقاً من قبل عمادة شؤون الطلاب.',
        };
      }

      const allUsers = getLocal<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
      if (allUsers.some((u) => u.email.toLowerCase() === cleanEmail || u.universityId.toLowerCase() === cleanUniId)) {
        return {
          success: false,
          error: 'هذا الرقم الجامعي أو البريد الإلكتروني مسجل مسبقاً بالفعل. يرجى التوجه إلى "تسجيل الدخول".',
        };
      }

      const user: User = {
        id: `user-${Date.now()}`,
        name: params.name.trim(),
        email: cleanEmail,
        universityId: params.universityId.trim(),
        phoneNumber: params.phoneNumber?.trim() || '',
        role: 'student',
      };
      setLocal(STORAGE_KEYS.USERS, [...allUsers, user]);
      api.setCurrentUser(user);
      return { success: true, user };
    }
  },

  logout(): void {
    api.setCurrentUser(null);
  },
};
