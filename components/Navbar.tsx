'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme, useAuth, safeSignOut } from './common/Providers';
import {
  HardHat,
  Shield,
  User,
  Building,
  Clock,
  Sun,
  Moon,
  LogOut,
  AlertTriangle,
  Ban,
  FolderKanban,
  CheckCircle2,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const isSystemAdmin =
    user?.role === 'SYSTEM_ADMIN' ||
    user?.email === 'admin' ||
    user?.email === 'admin@smartbbs.com' ||
    user?.email === 'creativeassociates17@gmail.com';

  // Calculate Renewal Days
  const getRenewalBadge = () => {
    if (isSystemAdmin) {
      return (
        <span className="px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 inline-flex items-center gap-1.5 shadow-sm">
          <Shield className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
          <span>Master Admin License</span>
        </span>
      );
    }

    if (!user) return null;

    if (user.subscriptionStatus === 'SUSPENDED') {
      return (
        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30 inline-flex items-center gap-1.5">
          <Ban className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
          <span>Account Suspended</span>
        </span>
      );
    }

    if (user.subscriptionStatus === 'REJECTED') {
      return (
        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30 inline-flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
          <span>Registration Rejected</span>
        </span>
      );
    }

    if (!user.isApprovedByAdmin || user.subscriptionStatus === 'PENDING') {
      return (
        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 inline-flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
          <span>Pending Admin Approval</span>
        </span>
      );
    }

    if (user.subscriptionExpiresAt) {
      const now = new Date();
      const expiry = new Date(user.subscriptionExpiresAt);
      const diffMs = expiry.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays <= 0) {
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30 inline-flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
            <span>Expired — Renew Now</span>
          </span>
        );
      }

      return (
        <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 inline-flex items-center gap-1.5 shadow-sm">
          <Clock className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
          <span>{diffDays} Days Remaining for Renew</span>
        </span>
      );
    }

    return (
      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 inline-flex items-center gap-1.5">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
        <span>Active License</span>
      </span>
    );
  };

  return (
    <header className="sticky top-0 z-40 w-full transition-colors shadow-md">
      {/* ============================================================== */}
      {/* TOP FIXED BAR 1: Software Name • Firm Name • Tagline          */}
      {/* ============================================================== */}
      <div className="w-full bg-slate-900 dark:bg-[#070b13] text-slate-100 border-b border-white/10 dark:border-slate-800/80 px-4 sm:px-6 lg:px-8 py-2">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1.5 sm:gap-4 text-center sm:text-left">
          {/* Software Name & Category Badge */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-sky-500 via-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/25 flex-shrink-0">
              <HardHat className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={isSystemAdmin ? '/admin' : '/dashboard'}
                className="text-base font-black tracking-tight text-white hover:text-sky-300 transition-colors"
              >
                CASE - BBS
              </Link>
              <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                IS 2502 / IS 456
              </span>
            </div>
          </div>

          {/* Firm Name Developed By */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-medium">Developed by:</span>
            <span className="font-extrabold text-sky-400 tracking-wide font-sans">
              Creative Associate LLP
            </span>
          </div>

          {/* Tagline */}
          <div className="text-[11px] sm:text-xs font-serif italic text-amber-300/90 tracking-wide">
            &ldquo;Every Design Has a Story...&rdquo;
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* TOP FIXED BAR 2: User Details • Days Remaining • Theme • Logout*/}
      {/* ============================================================== */}
      <div className="w-full bg-white/95 dark:bg-[#0a0f1d]/95 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 px-4 sm:px-6 lg:px-8 py-2.5 transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Left Side: User Name, Company Name, Days Remaining for Renew */}
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
            {/* User Icon & Name */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 shadow-sm font-bold text-xs flex-shrink-0">
                {isSystemAdmin ? (
                  <Shield className="w-4 h-4 text-amber-500" />
                ) : (
                  <User className="w-4 h-4 text-sky-500" />
                )}
              </div>
              <div>
                <div className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100 leading-tight">
                  {user?.name || (isSystemAdmin ? 'Creative Associate LLP' : 'Valued Engineer')}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1">
                  <Building className="w-3 h-3 text-slate-400 flex-shrink-0" />
                  <span className="truncate max-w-[150px] sm:max-w-[220px]">
                    {user?.companyName || (isSystemAdmin ? 'Creative Associate LLP' : 'Engineering Consultant')}
                  </span>
                </div>
              </div>
            </div>

            {/* Days Remaining for Renewal Badge */}
            <div className="flex items-center">
              {getRenewalBadge()}
            </div>
          </div>

          {/* Right Side: Admin Shortcut Links, Theme Toggle & Logout */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Admin Quick Module Switchers (Shown only to Admin) */}
            {isSystemAdmin && (
              <div className="hidden sm:flex items-center gap-1.5 mr-1">
                <Link
                  href="/admin"
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    pathname === '/admin'
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:text-amber-500 border border-slate-200 dark:border-slate-700/60'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Admin Console</span>
                </Link>

                <Link
                  href="/admin?tab=projects"
                  className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:text-amber-500 border border-slate-200 dark:border-slate-700/60"
                >
                  <FolderKanban className="w-3.5 h-3.5" />
                  <span>Projects</span>
                </Link>
              </div>
            )}

            {/* Theme Toggle Button (Light / Dark) */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-sky-500 dark:hover:text-amber-400 hover:border-sky-500/40 transition-all shadow-sm"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>

            {/* Sign Out Button */}
            <button
              onClick={safeSignOut}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold transition-all shadow-sm"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
