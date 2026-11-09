'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  FolderKanban,
  Package,
  Eye,
  Shield,
  Lock,
  Sparkles,
  Layers,
} from 'lucide-react';
import { useAuth } from '@/components/common/Providers';

interface SidebarProps {
  onOpenWizard?: (type?: string) => void;
  isSystemAdmin?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const isSystemAdmin =
    user?.role === 'SYSTEM_ADMIN' ||
    user?.email === 'admin' ||
    user?.email === 'admin@smartbbs.com' ||
    user?.email === 'creativeassociates17@gmail.com';

  const isAccessAllowed =
    isSystemAdmin ||
    (user?.isApprovedByAdmin === true &&
      user?.subscriptionStatus !== 'SUSPENDED' &&
      user?.subscriptionStatus !== 'EXPIRED' &&
      user?.subscriptionStatus !== 'REJECTED');

  // Navigation Items for Admin vs Standard User
  let navItems: any[] = [];

  if (isSystemAdmin) {
    // -------------------------------------------------------------
    // ADMIN MODULES: Strictly "Admin Console" and "Projects" ONLY!
    // -------------------------------------------------------------
    const currentTab = searchParams.get('tab');
    navItems = [
      {
        id: 'admin-console',
        label: 'Admin Console',
        icon: Shield,
        href: '/admin',
        isActive: pathname === '/admin' && currentTab !== 'projects',
        color: 'amber',
        badge: 'Governance',
        activeClass:
          'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/25',
        inactiveClass:
          'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-amber-600 dark:hover:text-amber-400',
        iconActive: 'text-slate-950',
        iconInactive: 'text-amber-500',
      },
      {
        id: 'admin-projects',
        label: 'Projects',
        icon: FolderKanban,
        href: '/admin?tab=projects',
        isActive: pathname === '/admin' && currentTab === 'projects',
        color: 'amber',
        badge: 'Read-Only Inspection',
        activeClass:
          'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/25',
        inactiveClass:
          'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-amber-600 dark:hover:text-amber-400',
        iconActive: 'text-slate-950',
        iconInactive: 'text-amber-500',
      },
    ];
  } else {
    // -------------------------------------------------------------
    // STANDARD USER MODULES: Core BBS Engineering Tools
    // -------------------------------------------------------------
    navItems = [
      {
        id: 'dashboard',
        label: 'BBS Projects & Overview',
        icon: FolderKanban,
        href: '/dashboard',
        isActive: pathname === '/dashboard',
        color: 'sky',
        badge: 'BBS Core',
        activeClass:
          'bg-sky-500 text-slate-950 font-black shadow-lg shadow-sky-500/25',
        inactiveClass:
          'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-sky-600 dark:hover:text-sky-400',
        iconActive: 'text-slate-950',
        iconInactive: 'text-sky-500 dark:text-sky-400',
      },
      {
        id: 'stocks',
        label: 'Steel Stocks & Inventory',
        icon: Package,
        href: '/stocks',
        isActive: pathname === '/stocks',
        color: 'emerald',
        badge: 'Kg / MT',
        activeClass:
          'bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/25',
        inactiveClass:
          'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-emerald-600 dark:hover:text-emerald-400',
        iconActive: 'text-slate-950',
        iconInactive: 'text-emerald-500 dark:text-emerald-400',
      },
      {
        id: 'visualizer',
        label: '2D & 3D Rebar Studio',
        icon: Eye,
        href: '/visualizer',
        isActive: pathname === '/visualizer',
        color: 'violet',
        badge: 'IS 2502 3D',
        activeClass:
          'bg-violet-600 text-white font-black shadow-lg shadow-violet-600/25',
        inactiveClass:
          'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-violet-600 dark:hover:text-violet-400',
        iconActive: 'text-white',
        iconInactive: 'text-violet-500 dark:text-violet-400',
      },
    ];
  }

  return (
    <aside className="w-64 shrink-0 hidden md:block">
      <div className="sticky top-28 rounded-3xl p-3.5 bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-slate-800/80 shadow-md dark:shadow-neo-dark-sm space-y-3 transition-colors">
        <div className="px-3 py-1.5 flex items-center justify-between text-[10px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400">
          <span>{isSystemAdmin ? 'Admin Platform' : 'BBS Engineering'}</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>

        {/* If user is not yet approved by admin, lock navigation and show pending banner */}
        {!isAccessAllowed ? (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center space-y-2">
            <Lock className="w-5 h-5 text-amber-500 dark:text-amber-400 mx-auto" />
            <div className="text-xs font-bold text-amber-600 dark:text-amber-300">
              Modules Locked
            </div>
            <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-tight">
              Awaiting Administrator Approval. Software modules will activate once approved.
            </p>
          </div>
        ) : (
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.isActive;

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all group ${
                    isActive ? item.activeClass : item.inactiveClass
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                        isActive ? item.iconActive : item.iconInactive
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${
                        isActive
                          ? 'bg-black/20 text-current'
                          : 'bg-slate-200/80 dark:bg-slate-800/90 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700/60'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        )}

        {/* Engine Verification Box */}
        <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-gradient-to-br dark:from-slate-950 dark:to-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] space-y-1 text-slate-700 dark:text-slate-300 transition-colors">
          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs">
            <Sparkles className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
            <span>CASE - BBS Engine</span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-[10px] leading-tight">
            IS 2502:1963, IS 456:2000, IS 13920:2016 & IS 1786:2008 mathematical pipeline.
          </p>
        </div>
      </div>
    </aside>
  );
};
