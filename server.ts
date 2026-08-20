import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { INITIAL_GUESTS, INITIAL_SESSIONS } from './src/data/initialData';
import { Booking, Guest, Session, User, WaitlistEntry } from './src/types';

// Persistent file-based storage
const DB_FILE = path.join(process.cwd(), 'orientation_db.json');

const defaultUsers: User[] = [
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

interface DBState {
  sessions: Session[];
  guests: Guest[];
  bookings: Booking[];
  users: User[];
  waitlist: WaitlistEntry[];
}

function loadDB(): DBState {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(data);

      // Merge sessions to include new initial sessions if missing (like Dr. Faten)
      let mergedSessions: Session[] = Array.isArray(parsed.sessions) && parsed.sessions.length > 0 ? parsed.sessions : [...INITIAL_SESSIONS];
      for (const initSess of INITIAL_SESSIONS) {
        if (!mergedSessions.some((s) => s.id === initSess.id)) {
          mergedSessions.push({ ...initSess });
        }
      }

      // Merge guests
      let mergedGuests: Guest[] = Array.isArray(parsed.guests) && parsed.guests.length > 0 ? parsed.guests : [...INITIAL_GUESTS];
      for (const initGuest of INITIAL_GUESTS) {
        if (!mergedGuests.some((g) => g.id === initGuest.id)) {
          mergedGuests.push({ ...initGuest });
        }
      }

      const loadedBookings: Booking[] = Array.isArray(parsed.bookings) ? parsed.bookings : [];
      const loadedUsers: User[] = Array.isArray(parsed.users) && parsed.users.length > 0 ? parsed.users : defaultUsers;
      const loadedWaitlist: WaitlistEntry[] = Array.isArray(parsed.waitlist) ? parsed.waitlist : [];

      return {
        sessions: mergedSessions,
        guests: mergedGuests,
        bookings: loadedBookings,
        users: loadedUsers,
        waitlist: loadedWaitlist,
      };
    }
  } catch (err) {
    console.error('Error loading DB from file, using initial data:', err);
  }
  return {
    sessions: [...INITIAL_SESSIONS],
    guests: [...INITIAL_GUESTS],
    bookings: [],
    users: defaultUsers,
    waitlist: [],
  };
}

const db = loadDB();
let sessions: Session[] = db.sessions;
let guests: Guest[] = db.guests;
let bookings: Booking[] = db.bookings;
let users: User[] = db.users;
let waitlist: WaitlistEntry[] = db.waitlist;

// Function to strictly recalculate booked seats count for each session
function syncSessionSeats() {
  const activeBookingsCount: Record<string, number> = {};
  for (const b of bookings) {
    // Only active (unattended) bookings hold a current physical seat reservation
    if (!b.attended) {
      activeBookingsCount[b.sessionId] = (activeBookingsCount[b.sessionId] || 0) + 1;
    }
  }
  const waitlistCounts: Record<string, number> = {};
  for (const w of waitlist) {
    if (w.status === 'waiting') {
      waitlistCounts[w.sessionId] = (waitlistCounts[w.sessionId] || 0) + 1;
    }
  }
  for (const s of sessions) {
    s.bookedSeats = Math.min(s.totalSeats, activeBookingsCount[s.id] || 0);
    s.waitlistCount = waitlistCounts[s.id] || 0;
  }
}

// Helper to auto-promote the next student from the waiting list into a confirmed booking
function promoteNextWaitlistStudent(sessionId: string): {
  promoted: boolean;
  promotedBooking?: Booking;
  promotedStudent?: string;
  promotedBookingCode?: string;
} {
  const activeWaitlist = waitlist.filter(
    (w) => w.sessionId === sessionId && w.status === 'waiting'
  );

  if (activeWaitlist.length === 0) {
    return { promoted: false };
  }

  const topWaitlist = activeWaitlist[0];
  const session = sessions.find((s) => s.id === sessionId);

  if (!session) {
    return { promoted: false };
  }

  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const dayPrefix = session.dayKey === 'tuesday' ? '25AUG' : session.dayKey === 'wednesday' ? '26AUG' : '27AUG';
  const newBookingCode = `BK-${dayPrefix}-${randomSuffix}`;
  const verificationToken = `v-tok-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

  const promotedBooking: Booking = {
    id: `bk-${Date.now()}`,
    bookingCode: newBookingCode,
    sessionId: session.id,
    sessionTitle: session.title,
    guestName: session.guestName,
    fields: session.fields,
    dateLabel: session.dateLabel,
    timeLabel: `${session.startTimeStr} - ${session.endTimeStr}`,
    location: session.location,
    studentName: topWaitlist.studentName,
    studentEmail: topWaitlist.studentEmail,
    universityId: topWaitlist.universityId,
    phoneNumber: topWaitlist.phoneNumber,
    createdAt: new Date().toISOString(),
    attended: false,
    verificationToken,
  };

  bookings.unshift(promotedBooking);
  topWaitlist.status = 'promoted';
  topWaitlist.promotedBookingId = promotedBooking.id;
  topWaitlist.promotedBookingCode = promotedBooking.bookingCode;

  // Auto create or update student user account so they can access their ticket immediately
  if (!users.some((u) => u.universityId.toLowerCase() === topWaitlist.universityId.toLowerCase())) {
    users.push({
      id: `u-${Date.now()}`,
      name: topWaitlist.studentName.trim(),
      email: topWaitlist.studentEmail.trim(),
      universityId: topWaitlist.universityId.trim(),
      phoneNumber: topWaitlist.phoneNumber.trim(),
      role: 'student',
    });
  }

  return {
    promoted: true,
    promotedBooking,
    promotedStudent: topWaitlist.studentName,
    promotedBookingCode: promotedBooking.bookingCode,
  };
}

function saveDB() {
  try {
    syncSessionSeats();
    fs.writeFileSync(
      DB_FILE,
      JSON.stringify({ sessions, guests, bookings, users, waitlist }, null, 2),
      'utf-8'
    );
  } catch (err) {
    console.error('Error saving DB to file:', err);
  }
}

// Initial sync
saveDB();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- REST API ENDPOINTS ---

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // 1. Sessions API
  app.get('/api/sessions', (_req, res) => {
    syncSessionSeats();
    res.json({ success: true, sessions });
  });

  app.post('/api/sessions', (req, res) => {
    const newSession: Session = {
      ...req.body,
      id: `sess-${Date.now()}`,
      bookedSeats: 0,
      totalSeats: Number(req.body.totalSeats || 50),
      isOpen: req.body.isOpen !== false,
    };
    sessions.unshift(newSession);
    saveDB();
    res.status(201).json({ success: true, session: newSession });
  });

  app.put('/api/sessions/:id', (req, res) => {
    const index = sessions.findIndex((s) => s.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'الجلسة غير موجودة' });
    }
    sessions[index] = {
      ...sessions[index],
      ...req.body,
      totalSeats: Number(req.body.totalSeats ?? sessions[index].totalSeats),
      bookedSeats: Number(req.body.bookedSeats ?? sessions[index].bookedSeats),
    };
    saveDB();
    res.json({ success: true, session: sessions[index] });
  });

  app.delete('/api/sessions/:id', (req, res) => {
    sessions = sessions.filter((s) => s.id !== req.params.id);
    saveDB();
    res.json({ success: true, message: 'تم حذف الجلسة بنجاح' });
  });

  // 2. Guests API
  app.get('/api/guests', (_req, res) => {
    res.json({ success: true, guests });
  });

  app.post('/api/guests', (req, res) => {
    const newGuest: Guest = {
      ...req.body,
      id: `guest-${Date.now()}`,
      fields: Array.isArray(req.body.fields) ? req.body.fields : [req.body.fields || 'الإرشاد الأكاديمي'],
      days: Array.isArray(req.body.days) ? req.body.days : [req.body.days || 'الثلاثاء 25 أغسطس'],
    };
    guests.push(newGuest);
    saveDB();
    res.status(201).json({ success: true, guest: newGuest });
  });

  app.put('/api/guests/:id', (req, res) => {
    const index = guests.findIndex((g) => g.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'الضيف غير موجود' });
    }
    guests[index] = { ...guests[index], ...req.body };
    saveDB();
    res.json({ success: true, guest: guests[index] });
  });

  app.delete('/api/guests/:id', (req, res) => {
    guests = guests.filter((g) => g.id !== req.params.id);
    saveDB();
    res.json({ success: true, message: 'تم حذف الضيف بنجاح' });
  });

  // 3. Bookings API
  app.get('/api/bookings', (req, res) => {
    syncSessionSeats();
    const { universityId, email } = req.query;
    if (universityId) {
      const userBookings = bookings.filter(
        (b) => b.universityId.toLowerCase() === String(universityId).toLowerCase()
      );
      return res.json({ success: true, bookings: userBookings });
    }
    if (email) {
      const userBookings = bookings.filter(
        (b) => b.studentEmail.toLowerCase() === String(email).toLowerCase()
      );
      return res.json({ success: true, bookings: userBookings });
    }
    res.json({ success: true, bookings });
  });

  app.post('/api/bookings', (req, res) => {
    const { sessionId, studentName, studentEmail, universityId, phoneNumber } = req.body;

    if (!sessionId || !studentName || !studentEmail || !universityId || !phoneNumber) {
      return res.status(400).json({ success: false, error: 'جميع الحقول مطلوبة لإتمام الحجز' });
    }

    const session = sessions.find((s) => s.id === sessionId);
    if (!session) {
      return res.status(404).json({ success: false, error: 'الجلسة غير موجودة' });
    }

    if (!session.isOpen) {
      return res.status(400).json({ success: false, error: 'الحجز في هذه الجلسة مغلق حالياً' });
    }

    // Sync seats count before checking
    syncSessionSeats();

    if (session.bookedSeats >= session.totalSeats) {
      return res.status(400).json({
        success: false,
        isFull: true,
        error: 'عذراً، اكتملت مقاعد هذه الجلسة. يمكنك الانضمام إلى قائمة الانتظار.',
      });
    }

    // Check duplicate booking by the same universityId for this session
    const existing = bookings.find(
      (b) => b.sessionId === sessionId && b.universityId.toLowerCase() === universityId.toLowerCase()
    );
    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'لقد قمت بحجز هذه الجلسة مسبقاً برقم الحجز: ' + existing.bookingCode,
        booking: existing,
      });
    }

    // Create booking
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const dayPrefix = session.dayKey === 'tuesday' ? '25AUG' : session.dayKey === 'wednesday' ? '26AUG' : '27AUG';
    const bookingCode = `BK-${dayPrefix}-${randomSuffix}`;
    const verificationToken = `v-tok-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

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
      studentName: studentName.trim(),
      studentEmail: studentEmail.trim(),
      universityId: universityId.trim(),
      phoneNumber: phoneNumber.trim(),
      createdAt: new Date().toISOString(),
      attended: false,
      verificationToken,
    };

    bookings.unshift(newBooking);

    // Auto-create or update student user
    if (!users.some((u) => u.universityId.toLowerCase() === universityId.toLowerCase())) {
      users.push({
        id: `u-${Date.now()}`,
        name: studentName.trim(),
        email: studentEmail.trim(),
        universityId: universityId.trim(),
        phoneNumber: phoneNumber.trim(),
        role: 'student',
      });
    }

    saveDB();
    res.status(201).json({ success: true, booking: newBooking, session });
  });

  // Cancel booking (Supports both POST /api/bookings/:id/cancel and DELETE /api/bookings/:id)
  const handleCancelBookingRoute = (req: express.Request, res: express.Response) => {
    const targetId = req.params.id;
    const bookingIndex = bookings.findIndex(
      (b) => b.id === targetId || b.bookingCode === targetId
    );

    if (bookingIndex === -1) {
      return res.status(404).json({ success: false, error: 'الحجز غير موجود أو تم إلغاؤه مسبقاً' });
    }

    const cancelledBooking = bookings[bookingIndex];
    const targetSessionId = cancelledBooking.sessionId;

    // Remove booking
    bookings.splice(bookingIndex, 1);

    // Auto-promote the next student from the waiting list if available
    const promo = promoteNextWaitlistStudent(targetSessionId);

    saveDB();
    res.json({
      success: true,
      message: promo.promoted
        ? `تم إلغاء الحجز وترقية الطالب التالي (${promo.promotedStudent}) من قائمة الانتظار برقم ${promo.promotedBookingCode}`
        : 'تم إلغاء الحجز بنجاح وتحرير المقعد',
      promotedStudent: promo.promotedStudent,
      promotedBookingCode: promo.promotedBookingCode,
    });
  };

  app.post('/api/bookings/:id/cancel', handleCancelBookingRoute);
  app.delete('/api/bookings/:id', handleCancelBookingRoute);

  // 4. Waiting List API
  app.get('/api/waitlist', (req, res) => {
    syncSessionSeats();
    const { universityId, email, sessionId } = req.query;
    let list = [...waitlist];

    if (universityId) {
      list = list.filter((w) => w.universityId.toLowerCase() === String(universityId).toLowerCase());
    }
    if (email) {
      list = list.filter((w) => w.studentEmail.toLowerCase() === String(email).toLowerCase());
    }
    if (sessionId) {
      list = list.filter((w) => w.sessionId === sessionId);
    }

    // Attach dynamic position for active waiting entries
    const responseList = list.map((entry) => {
      if (entry.status === 'waiting') {
        const sessionActiveWaiters = waitlist.filter(
          (w) => w.sessionId === entry.sessionId && w.status === 'waiting'
        );
        const position = sessionActiveWaiters.findIndex((w) => w.id === entry.id) + 1;
        return { ...entry, position: position > 0 ? position : 1 };
      }
      return entry;
    });

    res.json({ success: true, waitlist: responseList });
  });

  app.post('/api/waitlist', (req, res) => {
    const { sessionId, studentName, studentEmail, universityId, phoneNumber } = req.body;

    if (!sessionId || !studentName || !studentEmail || !universityId || !phoneNumber) {
      return res.status(400).json({ success: false, error: 'جميع الحقول مطلوبة للانضمام لقائمة الانتظار' });
    }

    const session = sessions.find((s) => s.id === sessionId);
    if (!session) {
      return res.status(404).json({ success: false, error: 'الجلسة غير موجودة' });
    }

    // Check if user already has a confirmed booking for this session
    const hasBooking = bookings.find(
      (b) => b.sessionId === sessionId && b.universityId.toLowerCase() === universityId.toLowerCase()
    );
    if (hasBooking) {
      return res.status(400).json({
        success: false,
        error: 'لديك حجز مؤكد بالفعل في هذه الجلسة برقم ' + hasBooking.bookingCode,
      });
    }

    // Check if already in waiting list with active status
    const existingWait = waitlist.find(
      (w) => w.sessionId === sessionId && w.universityId.toLowerCase() === universityId.toLowerCase() && w.status === 'waiting'
    );
    if (existingWait) {
      const sessionActive = waitlist.filter((w) => w.sessionId === sessionId && w.status === 'waiting');
      const pos = sessionActive.findIndex((w) => w.id === existingWait.id) + 1;
      return res.status(400).json({
        success: false,
        error: `أنت مسجل بالفعل في قائمة الانتظار لهذه الجلسة ورقمك هو #${pos}`,
        waitlistEntry: { ...existingWait, position: pos },
      });
    }

    const newWaitlistEntry: WaitlistEntry = {
      id: `wait-${Date.now()}`,
      sessionId: session.id,
      sessionTitle: session.title,
      guestName: session.guestName,
      fields: session.fields,
      dateLabel: session.dateLabel,
      timeLabel: `${session.startTimeStr} - ${session.endTimeStr}`,
      location: session.location,
      studentName: studentName.trim(),
      studentEmail: studentEmail.trim(),
      universityId: universityId.trim(),
      phoneNumber: phoneNumber.trim(),
      createdAt: new Date().toISOString(),
      status: 'waiting',
    };

    waitlist.push(newWaitlistEntry);
    saveDB();

    const sessionActiveWaiters = waitlist.filter((w) => w.sessionId === sessionId && w.status === 'waiting');
    const position = sessionActiveWaiters.findIndex((w) => w.id === newWaitlistEntry.id) + 1;

    res.status(201).json({
      success: true,
      waitlistEntry: { ...newWaitlistEntry, position },
      position,
      message: 'تمت إضافتك بنجاح إلى قائمة الانتظار',
    });
  });

  app.post('/api/waitlist/:id/cancel', (req, res) => {
    const entry = waitlist.find((w) => w.id === req.params.id);
    if (!entry) {
      return res.status(404).json({ success: false, error: 'الطلب غير موجود في قائمة الانتظار' });
    }
    entry.status = 'cancelled';
    saveDB();
    res.json({ success: true, message: 'تم إلغاء الانضمام لقائمة الانتظار بنجاح' });
  });

  // 5. Attendance Check-in API (QR Code verification)
  app.post('/api/attendance/check-in', (req, res) => {
    const { qrData, bookingCode, bookingId } = req.body;

    let booking: Booking | undefined;

    if (qrData) {
      try {
        const parsed = typeof qrData === 'string' ? JSON.parse(qrData) : qrData;
        booking = bookings.find(
          (b) => b.bookingCode === parsed.bookingCode || b.id === parsed.id || b.verificationToken === parsed.token
        );
      } catch {
        booking = bookings.find((b) => b.bookingCode === qrData || b.id === qrData || b.verificationToken === qrData);
      }
    } else if (bookingCode) {
      booking = bookings.find((b) => b.bookingCode.toUpperCase() === bookingCode.toUpperCase().trim());
    } else if (bookingId) {
      booking = bookings.find((b) => b.id === bookingId);
    }

    if (!booking) {
      return res.status(404).json({ success: false, error: 'رمز الحجز غير صحيح أو غير مسجل في النظام' });
    }

    if (booking.attended) {
      return res.status(400).json({
        success: false,
        alreadyAttended: true,
        message: 'تم تسجيل حضور هذا الطالب مسبقاً!',
        booking,
      });
    }

    booking.attended = true;
    booking.attendedAt = new Date().toISOString();

    // Auto-promote the next student on the waitlist for this session
    const promo = promoteNextWaitlistStudent(booking.sessionId);

    saveDB();

    res.json({
      success: true,
      message: promo.promoted
        ? `تم تأكيد الحضور بنجاح! وتمت ترقية الطالب التالي (${promo.promotedStudent}) من قائمة الانتظار برقم ${promo.promotedBookingCode}`
        : 'تم تأكيد الحضور بنجاح وتحرير مقعد إضافي',
      booking,
      promotedStudent: promo.promotedStudent,
      promotedBookingCode: promo.promotedBookingCode,
    });
  });

  // Toggle attendance state
  app.post('/api/attendance/toggle', (req, res) => {
    const { bookingId } = req.body;
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, error: 'الحجز غير موجود' });
    }
    booking.attended = !booking.attended;
    booking.attendedAt = booking.attended ? new Date().toISOString() : undefined;

    let promo: { promoted: boolean; promotedStudent?: string; promotedBookingCode?: string } = { promoted: false };

    // When student is marked as attended, promote the next waiting student!
    if (booking.attended) {
      promo = promoteNextWaitlistStudent(booking.sessionId);
    }

    saveDB();
    res.json({
      success: true,
      booking,
      promotedStudent: promo.promotedStudent,
      promotedBookingCode: promo.promotedBookingCode,
      message: promo.promoted
        ? `تم تسجيل حضور ${booking.studentName} وترقية الطالب التالي (${promo.promotedStudent}) من قائمة الانتظار برقم ${promo.promotedBookingCode}`
        : `تم تحديث حالة حضور ${booking.studentName}`,
    });
  });

  // 6. Auth API (Secured admin login with fixed credentials and strict student registration/login)
  app.post('/api/auth/login', (req, res) => {
    const { identifier, password, role } = req.body;
    if (!identifier) {
      return res.status(400).json({ success: false, error: 'يرجى إدخال البريد الإلكتروني أو الرقم الجامعي' });
    }

    const cleanIdentifier = identifier.trim().toLowerCase();
    const cleanPassword = (password || '').trim();

    // Prevent accessing admin account from student tab
    if (role === 'student' && (cleanIdentifier === 'admin' || cleanIdentifier === 'admin@university.edu.sa' || cleanIdentifier === 'admin-01')) {
      return res.status(403).json({
        success: false,
        error: 'هذا الحساب مخصص لإدارة المنصة، لا يمكن الدخول إليه من خانة الطالب/الزائر. يرجى اختيار تبويب "مشرف / منظم" واستخدام كلمة المرور المعتمدة.',
      });
    }

    // Check if attempting Admin login
    const isTryingAdmin = role === 'admin' || cleanIdentifier === 'admin' || cleanIdentifier === 'admin@university.edu.sa';

    if (isTryingAdmin) {
      const validAdminEmail = 'admin@university.edu.sa';
      const validAdminPass = 'admin 9080';

      const isEmailValid = cleanIdentifier === validAdminEmail || cleanIdentifier === 'admin';
      const isPasswordValid = cleanPassword === validAdminPass || cleanPassword === 'admin9080';

      if (!isEmailValid || !isPasswordValid) {
        return res.status(401).json({
          success: false,
          error: 'بيانات حساب المشرف غير صحيحة. يرجى إدخال البريد الإلكتروني (admin@university.edu.sa) وكلمة المرور المعتمدة الخاصة بالإدارة.',
        });
      }

      const adminUser = users.find((u) => u.role === 'admin') || {
        id: 'admin-1',
        name: 'المشرف العام - عمادة شؤون الطلاب',
        email: 'admin@university.edu.sa',
        universityId: 'ADMIN-01',
        role: 'admin' as const,
      };
      return res.json({ success: true, user: adminUser, token: 'tok_admin_' + Date.now() });
    }

    // Check student user existence - MUST BE REGISTERED FIRST!
    const user = users.find(
      (u) =>
        u.email.toLowerCase() === cleanIdentifier ||
        u.universityId.toLowerCase() === cleanIdentifier
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'هذا الحساب غير مسجل في النظام. لا يمكنك تسجيل الدخول بحساب عشوائي، يرجى النقر على "إنشاء حساب جديد" أولاً لتسجيل بياناتك.',
      });
    }

    res.json({ success: true, user, token: 'tok_user_' + Date.now() });
  });

  app.post('/api/auth/register', (req, res) => {
    const { name, email, universityId, phoneNumber, role } = req.body;
    if (!name || !email || !universityId) {
      return res.status(400).json({ success: false, error: 'يرجى تعبئة كافة الحقول المطلوبة (الاسم، الرقم الجامعي، البريد الإلكتروني)' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanUniId = universityId.trim().toLowerCase();

    if (role === 'admin' || cleanEmail === 'admin@university.edu.sa' || cleanUniId === 'admin-01' || cleanEmail.startsWith('admin')) {
      return res.status(403).json({
        success: false,
        error: 'لا يمكن إنشاء حساب مشرف جديد. حساب الإدارة محدد مسبقاً من قبل عمادة شؤون الطلاب.',
      });
    }

    const existing = users.find(
      (u) => u.email.toLowerCase() === cleanEmail || u.universityId.toLowerCase() === cleanUniId
    );

    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'هذا الرقم الجامعي أو البريد الإلكتروني مسجل مسبقاً بالفعل. يرجى التوجه إلى "تسجيل الدخول".',
      });
    }

    const newUser: User = {
      id: `user-${Date.now()}`,
      name: name.trim(),
      email: cleanEmail,
      universityId: universityId.trim(),
      phoneNumber: phoneNumber?.trim() || '',
      role: 'student',
    };
    users.push(newUser);
    saveDB();

    res.status(201).json({ success: true, user: newUser, token: 'tok_user_' + Date.now() });
  });

  // 7. Admin Stats API
  app.get('/api/stats', (_req, res) => {
    syncSessionSeats();
    const totalSessions = sessions.length;
    const totalBookings = bookings.length;
    const attendedCount = bookings.filter((b) => b.attended).length;
    const totalSeatsCapacity = sessions.reduce((acc, s) => acc + s.totalSeats, 0);
    const bookedSeatsCount = sessions.reduce((acc, s) => acc + s.bookedSeats, 0);
    const remainingSeats = Math.max(0, totalSeatsCapacity - bookedSeatsCount);
    const activeWaitlistCount = waitlist.filter((w) => w.status === 'waiting').length;

    res.json({
      success: true,
      stats: {
        totalSessions,
        totalBookings,
        attendedCount,
        totalSeatsCapacity,
        bookedSeatsCount,
        remainingSeats,
        activeWaitlistCount,
        attendanceRate: totalBookings > 0 ? Math.round((attendedCount / totalBookings) * 100) : 0,
      },
    });
  });

  // 8. CSV Export
  app.get('/api/export-bookings', (_req, res) => {
    let csv = '\uFEFFرقم الحجز,اسم الطالب,الرقم الجامعي,البريد الإلكتروني,رقم الجوال,الضيف,التاريخ,الوقت,المكان,حالة الحضور,تاريخ التسجيل\n';
    bookings.forEach((b) => {
      csv += `"${b.bookingCode}","${b.studentName}","${b.universityId}","${b.studentEmail}","${b.phoneNumber}","${b.guestName}","${b.dateLabel}","${b.timeLabel}","${b.location}","${b.attended ? 'حضر' : 'لم يحضر'}","${b.createdAt}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="orientation-bookings.csv"');
    res.send(csv);
  });

  // Vite middleware for development vs static serve for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
