'use client';

export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import { useAppSession } from '@/components/common/Providers';
import { Navbar } from '@/components/Navbar';
import { Sidebar } from '@/components/Sidebar';
import { Check, Sparkles, Shield, Zap, CreditCard, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function PricingPage() {
  const { session, update } = useAppSession();
  const [upgrading, setUpgrading] = useState<string | null>(null);

  const currentTier = (session?.user as any)?.planTier || 'FREE_TRIAL';
  const isSystemAdmin = (session?.user as any)?.role === 'SYSTEM_ADMIN';

  const handleUpgrade = async (tier: string) => {
    if (!session?.user) {
      window.location.href = '/login';
      return;
    }

    setUpgrading(tier);
    try {
      const res = await fetch('/api/subscription/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planTier: tier,
          paymentProvider: 'RAZORPAY_INSTANT_CHECKOUT',
        }),
      });

      const data = await res.json();
      if (data.success) {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
        });
        await update({ planTier: tier });
        alert(`Congratulations! Upgraded to ${tier.replace('_', ' ')} Plan.`);
      } else {
        alert(data.error || 'Upgrade failed');
      }
    } catch (err) {
      console.error(err);
      alert('Error during checkout');
    } finally {
      setUpgrading(null);
    }
  };

  const plans = [
    {
      id: 'FREE_TRIAL',
      name: '14-Day Free Trial',
      price: '₹0',
      period: '14 Days Trial',
      description: 'Zero-cost exploration license for structural designers and contractors.',
      features: [
        'IS 2502:1963 & IS 456:2000 BBS calculations',
        'Multi-member parametric design wizards',
        '2D & 3D WebGL Rebar Studio visualization',
        'Steel Stock & Inventory management in kg',
        'Scalable A3 Engineering BBS Report (PDF)',
        'Excel BBS Schedule workbook export',
      ],
      buttonText: 'Awarded by Admin',
      highlighted: false,
    },
    {
      id: 'MONTHLY_PRO',
      name: 'Monthly Pro Plan',
      price: '₹150',
      period: '/ month',
      description: 'Full software access for civil engineers, site managers, and consultants.',
      features: [
        'Everything in Free Trial, plus:',
        'Unlimited structural projects & members',
        'All Footing types: Isolated, Sloped, Stepped, Combined',
        'Continuous & Cantilever beam multi-span detailing',
        'Multi-diameter top and bottom bar configuration',
        'Varying stirrups spacing (End zone & Mid span)',
        'Priority technical support from Creative Associate LLP',
      ],
      buttonText: 'Request ₹150 / Month',
      highlighted: true,
    },
    {
      id: 'YEARLY',
      name: 'Yearly Value Plan',
      price: '₹1,095',
      period: '/ year (₹3/day)',
      description: 'Maximum value long-term plan for design consultancies and contracting firms.',
      features: [
        'Everything in Monthly Pro, plus:',
        'Uninterrupted 365-day license validity',
        'Complete steel stock & issue tracking audit trail',
        'All future engineering member generator updates',
        'Dedicated account priority activation',
        'Direct consultation with Creative Associate LLP',
      ],
      buttonText: 'Request ₹1,095 / Year',
      highlighted: false,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 flex flex-col">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex gap-8">
        <Sidebar isSystemAdmin={isSystemAdmin} />

        <main className="flex-1 space-y-8 min-w-0">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Transparent SaaS Pricing</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
              Choose the Plan for Your Structural Workflow
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Instant activation with Razorpay & Stripe gateway simulation. Pre-configured admin bypass active.
            </p>
          </div>

          {/* Pricing Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const isCurrent = currentTier === plan.id || (isSystemAdmin && plan.id === 'ENTERPRISE');
              return (
                <div
                  key={plan.id}
                  className={`p-6 sm:p-8 rounded-3xl backdrop-blur-xl border flex flex-col justify-between transition-all ${
                    plan.highlighted
                      ? 'bg-gradient-to-b from-sky-950/40 via-slate-900/80 to-slate-900/90 border-sky-500/50 shadow-xl shadow-sky-500/10 relative scale-105'
                      : 'bg-white/60 dark:bg-slate-900/60 border-white/20 dark:border-slate-800/80 shadow-neo-dark-sm'
                  }`}
                >
                  {plan.highlighted && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-sky-500 text-white text-[10px] font-black uppercase tracking-wider shadow-md shadow-sky-500/40">
                      Most Popular
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">{plan.name}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{plan.description}</p>
                    </div>

                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-slate-900 dark:text-white">{plan.price}</span>
                      <span className="text-xs text-slate-400 font-semibold">{plan.period}</span>
                    </div>

                    <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                        Features Included:
                      </span>
                      {plan.features.map((f, fIdx) => (
                        <div key={fIdx} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                          <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-6">
                    <button
                      onClick={() => handleUpgrade(plan.id)}
                      disabled={isCurrent || Boolean(upgrading)}
                      className={`w-full py-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        isCurrent
                          ? 'bg-slate-800 text-slate-400 cursor-default'
                          : plan.highlighted
                          ? 'bg-sky-500 hover:bg-sky-400 text-white shadow-lg shadow-sky-500/30 hover:scale-105 active:scale-95'
                          : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-white border border-slate-700'
                      }`}
                    >
                      {upgrading === plan.id ? (
                        <span>Processing Instant Upgrade...</span>
                      ) : isCurrent ? (
                        <span>Current Active Plan</span>
                      ) : (
                        <>
                          <span>{plan.buttonText}</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}
