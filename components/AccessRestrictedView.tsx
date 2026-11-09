'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldAlert,
  Sparkles,
  Phone,
  Mail,
  CheckCircle2,
  RefreshCw,
  Clock,
  User,
  Building,
  Lock,
  MessageCircle,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '@/components/common/Providers';

export const AccessRestrictedView: React.FC = () => {
  const { user, refreshSession } = useAuth();
  const [checking, setChecking] = useState(false);

  const handleCheckStatus = async () => {
    setChecking(true);
    try {
      await refreshSession();
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch {
      window.location.reload();
    } finally {
      setChecking(false);
    }
  };

  const isSuspended = user?.subscriptionStatus === 'SUSPENDED';
  const isRejected = user?.subscriptionStatus === 'REJECTED';
  const isExpired = user?.subscriptionStatus === 'EXPIRED';

  // Construct Direct WhatsApp pre-filled message with user details
  const whatsappMessage = encodeURIComponent(
    `Hello Creative Associate LLP,\n\nI have registered on CASE - BBS software and am requesting account approval:\n\n👤 Name: ${
      user?.name || 'Engineer'
    }\n🏢 Company: ${user?.companyName || 'Not specified'}\n📱 Mobile: ${
      user?.phone || 'Not specified'
    }\n📧 Login ID: ${user?.email || ''}\n\nPlease review and approve my account.\n\nThank you!`
  );
  const whatsappUrl = `https://wa.me/918484866868?text=${whatsappMessage}`;

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 sm:p-6 max-w-5xl mx-auto w-full font-sans transition-colors">
      {/* Alert Header Badge */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-2xl mb-8"
      >
        <div
          className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-4 border ${
            isSuspended || isRejected || isExpired
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          {isSuspended
            ? 'Account Login Suspended by Administrator'
            : isRejected
            ? 'Registration Request Rejected'
            : isExpired
            ? 'Subscription Expired — Renewal Required'
            : 'Wait for Admin to Approve You'}
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight mb-3">
          {isSuspended
            ? 'Access Temporarily Suspended'
            : isRejected
            ? 'Registration Rejected'
            : isExpired
            ? 'Your Subscription Has Ended'
            : 'Profile Submitted — Awaiting Approval'}
        </h1>

        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl mx-auto">
          {isSuspended
            ? 'Your login access has been suspended by the System Administrator. Your structural project data is safely preserved. Contact administration to reactivate your workspace.'
            : isRejected
            ? 'Your registration has been declined by the administrator. Contact Creative Associate LLP below for assistance or re-application.'
            : isExpired
            ? 'Your awarded subscription duration has completed. All your BBS projects and steel records remain intact. Please contact the administrator for renewal.'
            : 'Your user profile has been created and submitted. The System Administrator at Creative Associate LLP will review your profile and award access (14-Day Free Trial, Monthly @ ₹150, or Yearly @ ₹1,095). Please wait for approval.'}
        </p>

        {/* Registered Profile Summary Box */}
        {user && (
          <div className="mt-6 p-5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-left max-w-lg mx-auto shadow-md dark:shadow-xl transition-colors">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-sky-500" />
              Registered User Profile
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">
                  Full Name:
                </span>
                <span className="text-slate-900 dark:text-slate-100 font-bold">
                  {user.name || 'Valued Engineer'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">
                  Login ID / Email:
                </span>
                <span className="text-slate-900 dark:text-slate-100 font-mono font-bold">
                  {user.email}
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">
                  Firm / Agency:
                </span>
                <span className="text-slate-800 dark:text-slate-200 font-semibold">
                  {user.companyName || 'Individual Consultant'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">
                  Contact Phone:
                </span>
                <span className="text-slate-800 dark:text-slate-200 font-mono">
                  {user.phone || '—'}
                </span>
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-500" />
                Current Status:
              </span>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full uppercase ${
                  isSuspended || isRejected
                    ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30'
                    : isExpired
                    ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                    : 'bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-500/30'
                }`}
              >
                {user.subscriptionStatus || 'PENDING APPROVAL'}
              </span>
            </div>
          </div>
        )}

        {/* Action Controls: Refresh Status + Direct WhatsApp Action */}
        <div className="mt-5 flex items-center justify-center gap-3 flex-wrap">
          <button
            onClick={handleCheckStatus}
            disabled={checking}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-2 border border-slate-700 shadow-md transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
            {checking ? 'Checking Live Status...' : 'Check Approval Status'}
          </button>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/25 transition-all"
          >
            <MessageCircle className="w-4 h-4" />
            Contact Admin on WhatsApp
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </motion.div>

      {/* 3-Card Subscription Tier Panel (Managed by Admin) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full mb-8">
        {/* Card 1: 14-Day Free Trial */}
        <div className="p-6 rounded-3xl bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 backdrop-blur-xl flex flex-col justify-between shadow-lg dark:shadow-xl relative transition-colors">
          <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-500 mb-3">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">
              14-Day Free Trial
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
              Complimentary evaluation awarded upon administrator approval.
            </p>

            <div className="mb-4">
              <span className="text-3xl font-black text-slate-900 dark:text-slate-100">₹ 0</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">
                / 14 days valid
              </span>
            </div>

            <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300 mb-6">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-500 flex-shrink-0" />
                <span>All 7 Structural Member Types</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-500 flex-shrink-0" />
                <span>IS 2502 & IS 456 Cutting Engine</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-500 flex-shrink-0" />
                <span>A3 Engineering Sheet PDF</span>
              </li>
            </ul>
          </div>

          <div className="py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-center text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5">
            <Lock className="w-3 h-3 text-amber-500" />
            Awarded by Admin
          </div>
        </div>

        {/* Card 2: Monthly Pro Plan (Exact User Pricing: ₹ 150 per month) */}
        <div className="p-6 rounded-3xl bg-white/80 dark:bg-slate-900/60 border-2 border-sky-500/50 backdrop-blur-xl flex flex-col justify-between shadow-xl relative transition-colors">
          <div className="absolute -top-3 right-5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-sky-500 text-slate-950 shadow-md">
            Most Popular
          </div>
          <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-500 mb-3">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">
              Monthly Pro
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
              30-day active consulting license assigned by administrator.
            </p>

            <div className="mb-4">
              <span className="text-3xl font-black text-sky-600 dark:text-sky-400">₹ 150</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">
                / 30 days valid
              </span>
            </div>

            <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300 mb-6">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-500 flex-shrink-0" />
                <span>Unlimited BBS Projects & Members</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-500 flex-shrink-0" />
                <span>Steel Stocks Inward/Outward Ledger</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-500 flex-shrink-0" />
                <span>Excel Spreadsheet BBS Schedule</span>
              </li>
            </ul>
          </div>

          <div className="py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-center text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5">
            <Lock className="w-3 h-3 text-amber-500" />
            Awarded by Admin
          </div>
        </div>

        {/* Card 3: Yearly Pro (Exact User Pricing: ₹ 1,095 per year) */}
        <div className="p-6 rounded-3xl bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 backdrop-blur-xl flex flex-col justify-between shadow-lg dark:shadow-xl relative transition-colors">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500 mb-3">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">
              Yearly Pro
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
              365-day annual organization license (only ₹3 / day!).
            </p>

            <div className="mb-4">
              <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                ₹ 1,095
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">
                / 365 days valid
              </span>
            </div>

            <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300 mb-6">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                <span>Full IS 13920 Ductile Detailing</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                <span>Complete Project Steel Reconciliation</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                <span>Priority Technical & Structural Support</span>
              </li>
            </ul>
          </div>

          <div className="py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-center text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5">
            <Lock className="w-3 h-3 text-amber-500" />
            Awarded by Admin
          </div>
        </div>
      </div>

      {/* Official Creative Associate LLP Contact Details Card */}
      <div className="w-full p-6 rounded-3xl bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-center max-w-2xl mx-auto shadow-md dark:shadow-xl transition-colors">
        <div className="font-black text-sm text-slate-900 dark:text-white mb-0.5">
          Creative Associate LLP
        </div>
        <div className="text-xs font-serif italic text-amber-600 dark:text-amber-400 mb-2">
          &ldquo;Every Design Has a Story...&rdquo;
        </div>

        <div className="flex items-center justify-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 mb-3 max-w-lg mx-auto">
          <MapPin className="w-4 h-4 text-sky-500 flex-shrink-0" />
          <span>
            Shop No. 20, Union Building, Near Shivaji Maharaj Statue, A P Rahurifactory, Tal Rahuri, Dist Ahilyanagar, 413 706.
          </span>
        </div>

        <div className="flex items-center justify-center gap-3 flex-wrap pt-1">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all"
          >
            <MessageCircle className="w-4 h-4" />
            WhatsApp (+91 8484 86 6868)
          </a>

          <a
            href="tel:+918484866868"
            className="py-2 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-2 transition-all border border-slate-300 dark:border-slate-700"
          >
            <Phone className="w-3.5 h-3.5 text-sky-500" />
            Call +91 8484 86 6868
          </a>

          <a
            href="mailto:creativeassociates17@gmail.com?subject=CASE%20-%20BBS%20Account%20Approval%20Request"
            className="py-2 px-4 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-500/30 text-xs font-bold flex items-center gap-2 transition-all"
          >
            <Mail className="w-3.5 h-3.5" />
            Email Admin
          </a>
        </div>
      </div>
    </div>
  );
};
