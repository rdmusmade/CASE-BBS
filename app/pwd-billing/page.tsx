'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Sidebar } from '@/components/Sidebar';
import { MeasurementBookTable } from '@/components/pwd/MeasurementBookTable';
import { GeneratedRebarItem } from '@/lib/engine/members/footing';
import { FileSpreadsheet, HardHat } from 'lucide-react';

export default function PwdBillingPage() {
  const [items, setItems] = useState<GeneratedRebarItem[]>([]);
  const [projectName, setProjectName] = useState<string>('PWD Commercial Complex (G+12 Floors)');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/projects');
        const data = await res.json();
        if (data.success && data.projects.length > 0) {
          const p = data.projects[0];
          setProjectName(p.projectName);
          const allItems = p.members.flatMap((m: any) =>
            m.rebarItems.map((r: any) => ({
              ...r,
              description: `${m.memberTag} ${r.remarks || r.barMark}`,
            }))
          );
          setItems(allItems);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleTogglePayable = (idx: number) => {
    const updated = [...items];
    updated[idx].isPayable = !updated[idx].isPayable;
    setItems(updated);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 flex flex-col">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex gap-8">
        <Sidebar />

        <main className="flex-1 space-y-6 min-w-0">
          <div className="p-6 rounded-3xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/20 dark:border-slate-800/80 shadow-neo-dark-sm space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                PWD SSR DSR Item Bd.F.5
              </span>
              <span className="text-xs text-slate-400">Maharashtra Public Works Department Audit Standard</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">
              Measurement Book (MB) & Rolling Margin Portal
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Theoretical unit weight factor (d²/162.2 kg/m), separate binding wire quantification (8-10 kg/MT), and diameter-wise billing abstract.
            </p>
          </div>

          <MeasurementBookTable
            items={items}
            projectName={projectName}
            onTogglePayable={handleTogglePayable}
          />
        </main>
      </div>
    </div>
  );
}
