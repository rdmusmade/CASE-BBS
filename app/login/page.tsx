'use client';

import React, { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useTheme } from '@/components/common/Providers';
import {
  HardHat,
  Shield,
  User,
  Lock,
  Mail,
  Building,
  Phone,
  ArrowRight,
  CheckCircle2,
  MapPin,
  MessageCircle,
  Sun,
  Moon,
  Sparkles,
} from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme, toggleTheme } = useTheme();

  const [tab, setTab] = useState<'LOGIN' | 'REGISTER'>(
    searchParams.get('tab') === 'register' ? 'REGISTER' : 'LOGIN'
  );

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registerSuccess, setRegisterSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setRegisterSuccess(null);

    if (tab === 'REGISTER') {
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, companyName, phone, password }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to register profile');
        }

        setRegisterSuccess('Profile registered! Logging you into CASE - BBS...');

        // Auto sign in
        const signInRes = await signIn('credentials', {
          email,
          password,
          redirect: false,
        });

        if (signInRes?.error) {
          setError(signInRes.error);
        } else {
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 400);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    } else {
      // Sign in
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      setLoading(false);
      if (res?.error) {
        setError(res.error);
      } else {
        const isAdm = email.toLowerCase().trim() === 'admin';
        window.location.href = isAdm ? '/admin' : '/dashboard';
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between p-4 sm:p-6 bg-slate-50 dark:bg-[#070b13] text-slate-900 dark:text-slate-100 transition-colors relative overflow-hidden font-sans">
      {/* Background Subtle Ambient Glows */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-sky-500/10 dark:bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-amber-500/10 dark:bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Floating Control Bar */}
      <div className="w-full max-w-5xl mx-auto flex items-center justify-between py-2 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/25">
            <HardHat className="w-4 h-4" />
          </div>
          <div>
            <span className="text-sm font-black tracking-tight text-slate-900 dark:text-white">
              CASE - BBS
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block -mt-0.5">
              IS 2502 / IS 456 / IS 13920
            </span>
          </div>
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 hover:text-sky-500 dark:hover:text-amber-400 transition-all shadow-sm"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
        </button>
      </div>

      {/* Main Form Centerpiece */}
      <div className="w-full max-w-md mx-auto my-auto z-10 py-6">
        {/* Softwear & Firm Header */}
        <div className="text-center mb-6 space-y-1">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
            CASE - <span className="text-sky-500">BBS</span>
          </h1>
          <div className="text-sm font-bold text-slate-700 dark:text-slate-200">
            Creative Associate LLP
          </div>
          <p className="text-xs font-serif italic text-amber-600 dark:text-amber-300/90 tracking-wide">
            &ldquo;Every Design Has a Story...&rdquo;
          </p>
        </div>

        {/* Clean Glassmorphic Card Container */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white/85 dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800/80 backdrop-blur-2xl shadow-xl dark:shadow-2xl transition-all">
          {/* Tab Selector */}
          <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 mb-5">
            <button
              type="button"
              onClick={() => {
                setTab('LOGIN');
                setError(null);
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                tab === 'LOGIN'
                  ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('REGISTER');
                setError(null);
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                tab === 'REGISTER'
                  ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Register Profile
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-medium mb-4">
              {error}
            </div>
          )}

          {registerSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-medium mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              {registerSuccess}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {tab === 'REGISTER' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Er. Ramesh Patil"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-800 rounded-xl px-10 py-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-sky-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Company / Firm Name
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="text"
                      placeholder="e.g. Patil Infrastructure & Builders"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-800 rounded-xl px-10 py-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-sky-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Mobile Phone (WhatsApp) *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="tel"
                      required
                      placeholder="e.g. +91 98220 12345"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-800 rounded-xl px-10 py-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-sky-500 transition-colors"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {tab === 'REGISTER' ? 'Email Address (Login ID) *' : 'Admin ID or Email *'}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder={tab === 'REGISTER' ? 'engineer@company.com' : 'admin or engineer@company.com'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-800 rounded-xl px-10 py-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-sky-500 transition-colors font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-800 rounded-xl px-10 py-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-sky-500 transition-colors font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-sky-500/25 disabled:opacity-50 mt-1"
            >
              {loading ? (
                'Processing...'
              ) : tab === 'REGISTER' ? (
                <>
                  Register Profile & Submit for Approval <ArrowRight className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  Sign In to Workspace <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Neat Minimalist Office Contact & Address Footer */}
      <footer className="w-full max-w-3xl mx-auto text-center py-4 text-xs text-slate-600 dark:text-slate-400 border-t border-slate-200/80 dark:border-slate-800/80 space-y-1 z-10">
        <div className="font-extrabold text-slate-900 dark:text-slate-200 flex items-center justify-center gap-2 flex-wrap">
          <span>Creative Associate LLP</span>
          <span className="text-slate-400">•</span>
          <span className="font-serif italic text-amber-600 dark:text-amber-400">
            &ldquo;Every Design Has a Story...&rdquo;
          </span>
        </div>

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
          <MapPin className="w-3.5 h-3.5 text-sky-500 flex-shrink-0" />
          <span>
            Shop No. 20, Union Building, Near Shivaji Maharaj Statue, A P Rahurifactory, Tal Rahuri, Dist Ahilyanagar, 413 706.
          </span>
        </div>

        <div className="flex items-center justify-center gap-4 text-[11px] pt-1">
          <a
            href="tel:+918484866868"
            className="inline-flex items-center gap-1 text-sky-600 dark:text-sky-400 hover:underline font-mono font-bold"
          >
            <Phone className="w-3 h-3" />
            +91 8484 86 6868
          </a>
          <a
            href="https://wa.me/918484866868?text=Hello%20Creative%20Associate%20LLP,%20I%20have%20an%20inquiry%20regarding%20CASE%20-%20BBS."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline font-bold"
          >
            <MessageCircle className="w-3 h-3" />
            WhatsApp
          </a>
        </div>
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
          Loading CASE - BBS...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
