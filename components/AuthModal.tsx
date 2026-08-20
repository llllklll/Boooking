import React, { useState } from 'react';
import { X, Lock, Mail, User as UserIcon, Hash, Phone, Shield, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { User } from '../types';
import { api } from '../lib/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
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

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const cleanIdent = identifier.trim().toLowerCase();

        if (role === 'student' && (cleanIdent === 'admin' || cleanIdent === 'admin@university.edu.sa' || cleanIdent === 'admin-01')) {
          setErrorMsg('هذا الحساب مخصص لإدارة المنصة، لا يمكن الدخول إليه من خانة الطالب/الزائر. يرجى اختيار تبويب "دخول مشرف / منظم" واستخدام كلمة المرور المعتمدة.');
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
          onClose();
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
          onClose();
        } else {
          setErrorMsg(res.error || 'تعذر إنشاء الحساب');
        }
      }
    } catch {
      setErrorMsg('حدث خطأ في النظام أثناء تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200 my-8 text-right">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-sky-400 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">
                {mode === 'login' ? 'تسجيل الدخول' : 'إنشاء حساب طالب جديد'}
              </h3>
              <p className="text-xs text-slate-400">بوابة أسبوع المستجدين 2026</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4">
          
          {/* Mode Switcher Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg('');
              }}
              className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
                mode === 'login' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              تسجيل الدخول
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setRole('student');
                setErrorMsg('');
              }}
              className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
                mode === 'register' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              إنشاء حساب جديد
            </button>
          </div>

          {/* Student vs Admin Switcher in Login Mode */}
          {mode === 'login' && (
            <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setRole('student');
                  setErrorMsg('');
                }}
                className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                  role === 'student' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                طالب / مستجد
              </button>
              <button
                type="button"
                onClick={() => {
                  setRole('admin');
                  setErrorMsg('');
                }}
                className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  role === 'admin' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                مشرف / منظم
              </button>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'register' ? (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الاسم الكامل (رباعي) *</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="مثال: تركي بن صالح الحربي"
                      className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-hidden"
                    />
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الرقم الجامعي *</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={universityId}
                      onChange={(e) => setUniversityId(e.target.value)}
                      placeholder="مثال: 44310982"
                      className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-hidden font-mono"
                    />
                    <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">البريد الإلكتروني الجامعي أو الشخصي *</label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="student@stu.edu.sa"
                      className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-hidden font-mono"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رقم الجوال للتواصل *</label>
                  <div className="relative">
                    <input
                      type="tel"
                      required
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="0551234567"
                      className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-hidden font-mono"
                    />
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">كلمة المرور *</label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-hidden font-mono"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>
              </>
            ) : (
              <>
                {role === 'admin' && (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs leading-relaxed">
                    بوابة المشرفين • يتطلب بريد وكلمة مرور إدارة عمادة شؤون الطلاب.
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {role === 'admin' ? 'البريد الإلكتروني للإدارة *' : 'الرقم الجامعي أو البريد المسجل *'}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      id="auth-identifier-input"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder={role === 'admin' ? 'admin@university.edu.sa' : '44310982 أو student@stu.edu.sa'}
                      className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-hidden font-mono"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {role === 'admin' ? 'كلمة المرور المعتمدة للإدارة *' : 'كلمة المرور *'}
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      id="auth-password-input"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-hidden font-mono"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              id="auth-submit-btn"
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer mt-2"
            >
              {loading ? 'جاري التحقق...' : mode === 'login' ? 'دخول إلى المنصة' : 'إنشاء الحساب ودخول'}
            </button>
          </form>

          {/* Switch Mode */}
          <div className="pt-2 text-center text-xs text-slate-500">
            {mode === 'login' ? (
              <p>
                طالب جديد وليس لديك حساب؟{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setRole('student');
                    setErrorMsg('');
                  }}
                  className="font-bold text-blue-600 hover:underline cursor-pointer"
                >
                  إنشاء حساب طالب جديد
                </button>
              </p>
            ) : (
              <p>
                لديك حساب بالفعل؟{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMsg('');
                  }}
                  className="font-bold text-blue-600 hover:underline cursor-pointer"
                >
                  تسجيل الدخول
                </button>
              </p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
