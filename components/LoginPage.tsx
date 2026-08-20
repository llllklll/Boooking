import React, { useState } from 'react';
import { 
  Sparkles, 
  Lock, 
  Mail, 
  User as UserIcon, 
  Hash, 
  Phone, 
  Shield, 
  Calendar, 
  ArrowLeft,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { User } from '../types';
import { api } from '../lib/api';

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [role, setRole] = useState<'student' | 'admin'>('student');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [universityId, setUniversityId] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const cleanIdent = identifier.trim().toLowerCase();

        // Check if student tries admin credentials in student tab
        if (role === 'student' && (cleanIdent === 'admin' || cleanIdent === 'admin@university.edu.sa' || cleanIdent === 'admin-01')) {
          setErrorMsg('هذا الحساب مخصص لإدارة المنصة، لا يمكن الدخول إليه من خانة الطالب/الزائر. يرجى اختيار تبويب "مشرف / منظم" وإدخال كلمة المرور المعتمدة.');
          setLoading(false);
          return;
        }

        const res = await api.login({
          identifier: identifier.trim(),
          password: password.trim(),
          role,
        });

        if (res.success && res.user) {
          onLoginSuccess(res.user);
        } else {
          setErrorMsg(res.error || 'بيانات الدخول غير صحيحة');
        }
      } else {
        if (!name.trim()) {
          setErrorMsg('يرجى كتابة الاسم الكامل (رباعي)');
          setLoading(false);
          return;
        }
        if (!universityId.trim()) {
          setErrorMsg('يرجى إدخال الرقم الجامعي');
          setLoading(false);
          return;
        }
        if (!email.trim() || !email.includes('@')) {
          setErrorMsg('يرجى إدخال بريد إلكتروني صحيح');
          setLoading(false);
          return;
        }
        if (!phoneNumber.trim()) {
          setErrorMsg('يرجى إدخال رقم الجوال للتواصل');
          setLoading(false);
          return;
        }

        const res = await api.register({
          name: name.trim(),
          email: email.trim(),
          universityId: universityId.trim(),
          phoneNumber: phoneNumber.trim(),
          password: password.trim(),
          role: 'student',
        });

        if (res.success && res.user) {
          onLoginSuccess(res.user);
        } else {
          setErrorMsg(res.error || 'تعذر إنشاء الحساب');
        }
      }
    } catch {
      setErrorMsg('حدث خطأ في الاتصال بالخادم، يرجى المحاولة مرة أخرى');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-12 relative overflow-hidden font-sans">
      
      {/* Background Decorative Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/30 via-slate-950 to-slate-950 pointer-events-none" />
      <div className="absolute top-10 right-10 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-sky-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="relative w-full max-w-md z-10">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 shadow-xl shadow-blue-600/30 text-white mb-4">
            <Sparkles className="w-7 h-7" />
          </div>

          <div className="inline-block px-3.5 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-sky-300 text-xs font-bold mb-3">
            عمادة شؤون الطلاب • أسبوع المستجدين 2026
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            منصة الجلسات الحوارية
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            يرجى تسجيل الدخول أو إنشاء حساب جديد للوصول وحجز المقاعد
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          
          {/* Mode Switcher Tabs */}
          <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs font-bold mb-6">
            <button
              type="button"
              id="tab-login-btn"
              onClick={() => {
                setMode('login');
                setErrorMsg('');
              }}
              className={`flex-1 py-2.5 rounded-xl transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              تسجيل الدخول
            </button>
            <button
              type="button"
              id="tab-register-btn"
              onClick={() => {
                setMode('register');
                setRole('student');
                setErrorMsg('');
              }}
              className={`flex-1 py-2.5 rounded-xl transition-all cursor-pointer ${
                mode === 'register'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              إنشاء حساب جديد
            </button>
          </div>

          {/* Student vs Admin Switcher in Login Mode */}
          {mode === 'login' && (
            <div className="flex bg-slate-950/60 p-1 rounded-xl border border-slate-800 text-xs font-semibold mb-4">
              <button
                type="button"
                id="role-student-btn"
                onClick={() => {
                  setRole('student');
                  setErrorMsg('');
                }}
                className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                  role === 'student' ? 'bg-slate-800 text-white font-bold' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                طالب / مستجد
              </button>
              <button
                type="button"
                id="role-admin-btn"
                onClick={() => {
                  setRole('admin');
                  setErrorMsg('');
                }}
                className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  role === 'admin' ? 'bg-slate-800 text-amber-300 font-bold' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                مشرف / منظم
              </button>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="flex items-start gap-2 p-3.5 bg-rose-950/50 border border-rose-800/80 text-rose-300 rounded-xl text-xs font-semibold mb-4 text-right">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Auth Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* REGISTER MODE FIELDS */}
            {mode === 'register' ? (
              <>
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 text-right">
                    الاسم الكامل (رباعي) *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      id="register-input-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="مثال: تركي بن صالح الحربي"
                      className="w-full px-3.5 py-2.5 pr-10 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-hidden text-white transition-all text-right"
                    />
                    <UserIcon className="w-4 h-4 text-slate-500 absolute right-3.5 top-3" />
                  </div>
                </div>

                {/* University ID */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 text-right">
                    الرقم الجامعي *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      id="register-input-universityId"
                      value={universityId}
                      onChange={(e) => setUniversityId(e.target.value)}
                      placeholder="مثال: 44310982"
                      className="w-full px-3.5 py-2.5 pr-10 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-hidden text-white transition-all text-right font-mono"
                    />
                    <Hash className="w-4 h-4 text-slate-500 absolute right-3.5 top-3" />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 text-right">
                    البريد الإلكتروني الجامعي أو الشخصي *
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      id="register-input-email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="student@stu.edu.sa"
                      className="w-full px-3.5 py-2.5 pr-10 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-hidden text-white transition-all text-right font-mono"
                    />
                    <Mail className="w-4 h-4 text-slate-500 absolute right-3.5 top-3" />
                  </div>
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 text-right">
                    رقم الجوال للتواصل *
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      required
                      id="register-input-phone"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="0551234567"
                      className="w-full px-3.5 py-2.5 pr-10 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-hidden text-white transition-all text-right font-mono"
                    />
                    <Phone className="w-4 h-4 text-slate-500 absolute right-3.5 top-3" />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 text-right">
                    كلمة المرور للحساب *
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      id="register-input-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 pr-10 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-hidden text-white transition-all text-right font-mono"
                    />
                    <Lock className="w-4 h-4 text-slate-500 absolute right-3.5 top-3" />
                  </div>
                </div>
              </>
            ) : (
              /* LOGIN MODE FIELDS */
              <>
                {role === 'admin' && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-xl text-xs leading-relaxed text-right">
                    بوابة المشرفين المعتمدة • يتطلب بريد وكلمة مرور إدارة عمادة شؤون الطلاب.
                  </div>
                )}

                {/* Identifier */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 text-right">
                    {role === 'admin'
                      ? 'البريد الإلكتروني للإدارة *'
                      : 'الرقم الجامعي أو البريد المسجل *'}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      id="auth-input-identifier"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder={
                        role === 'admin'
                          ? 'admin@university.edu.sa'
                          : 'مثال: 44310982 أو student@stu.edu.sa'
                      }
                      className="w-full px-3.5 py-2.5 pr-10 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-hidden text-white transition-all text-right font-mono"
                    />
                    <Mail className="w-4 h-4 text-slate-500 absolute right-3.5 top-3" />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 text-right">
                    {role === 'admin' ? 'كلمة المرور المعتمدة للإدارة *' : 'كلمة المرور *'}
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      id="auth-input-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 pr-10 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-hidden text-white transition-all text-right font-mono"
                    />
                    <Lock className="w-4 h-4 text-slate-500 absolute right-3.5 top-3" />
                  </div>
                </div>
              </>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              id="auth-main-submit-btn"
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>جاري التحقق...</span>
                </>
              ) : (
                <>
                  <span>{mode === 'login' ? 'دخول إلى المنصة' : 'إنشاء الحساب ودخول'}</span>
                  <ArrowLeft className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Switch Mode Prompt Link */}
            <div className="text-center pt-2">
              {mode === 'login' ? (
                <p className="text-xs text-slate-400">
                  طالب جديد وليس لديك حساب؟{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('register');
                      setRole('student');
                      setErrorMsg('');
                    }}
                    className="text-sky-400 font-bold hover:underline cursor-pointer"
                  >
                    إنشاء حساب طالب جديد
                  </button>
                </p>
              ) : (
                <p className="text-xs text-slate-400">
                  لديك حساب مسجل بالفعل؟{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setErrorMsg('');
                    }}
                    className="text-sky-400 font-bold hover:underline cursor-pointer"
                  >
                    تسجيل الدخول
                  </button>
                </p>
              )}
            </div>
          </form>

        </div>

        {/* Footer Note */}
        <div className="text-center mt-6 text-xs text-slate-500">
          جامعة تبوك • عمادة شؤون الطلاب • أسبوع المستجدين 2026
        </div>

      </div>
    </div>
  );
};
