'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/common/Providers';
import { Navbar } from '@/components/Navbar';
import { Sidebar } from '@/components/Sidebar';
import { AccessRestrictedView } from '@/components/AccessRestrictedView';
import { STANDARD_BAR_DIAMETERS } from '@/lib/engine/is2502';
import {
  Layers,
  Plus,
  Minus,
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Search,
  Filter,
  RefreshCw,
  FileSpreadsheet,
  Building,
  Calendar,
  X,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface StockTransaction {
  id: string;
  transactionType: 'PROCUREMENT' | 'ISSUE';
  dia: number;
  quantityKg: number;
  steelGrade: string;
  date: string;
  supplier?: string | null;
  invoiceNo?: string | null;
  projectId?: string | null;
  project?: { projectName: string } | null;
  remarks?: string | null;
}

interface ReconciliationItem {
  dia: number;
  procuredKg: number;
  issuedKg: number;
  inStockKg: number;
  bbsRequiredKg: number;
  balanceKg: number;
  status: 'SUFFICIENT' | 'SHORTAGE';
}

export default function StocksPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any | null>(null);
  const [matrix, setMatrix] = useState<ReconciliationItem[]>([]);
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [projectsList, setProjectsList] = useState<Array<{ id: string; projectName: string }>>([]);

  // Filters
  const [activeTab, setActiveTab] = useState<'ALL' | 'PROCUREMENT' | 'ISSUE'>('ALL');
  const [selectedDiaFilter, setSelectedDiaFilter] = useState<number | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'PROCUREMENT' | 'ISSUE'>('PROCUREMENT');
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formDia, setFormDia] = useState<number>(16);
  const [formQtyKg, setFormQtyKg] = useState<number>(1000);
  const [formGrade, setFormGrade] = useState<string>('Fe500D');
  const [formSupplier, setFormSupplier] = useState<string>('Tata Tiscon');
  const [formInvoiceNo, setFormInvoiceNo] = useState<string>('');
  const [formProjectId, setFormProjectId] = useState<string>('');
  const [formRemarks, setFormRemarks] = useState<string>('');
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const fetchStockData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/stocks');
      const data = await res.json();
      if (data.success) {
        setSummary(data.summary);
        setMatrix(data.reconciliationMatrix);
        setTransactions(data.transactions);
        setProjectsList(data.projects || []);
      }
    } catch (err) {
      console.error('Error fetching stocks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStockData();
  }, []);

  const isSystemAdmin = user?.role === 'SYSTEM_ADMIN' || user?.email === 'admin' || user?.email === 'admin@smartbbs.com';
  const isAccessAllowed =
    isSystemAdmin ||
    (user?.isApprovedByAdmin === true &&
      user?.subscriptionStatus !== 'SUSPENDED' &&
      user?.subscriptionStatus !== 'EXPIRED' &&
      user?.subscriptionStatus !== 'PENDING' &&
      (!user?.subscriptionExpiresAt || new Date(user.subscriptionExpiresAt) >= new Date()));

  const handleOpenModal = (type: 'PROCUREMENT' | 'ISSUE') => {
    setModalType(type);
    if (type === 'PROCUREMENT') {
      setFormSupplier('Tata Tiscon');
      setFormRemarks('Inward steel shipment received at central stockyard');
    } else {
      setFormSupplier('');
      setFormRemarks('Issued to rebar bending gang for fabrication');
    }
    setModalOpen(true);
  };

  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formQtyKg || formQtyKg <= 0) {
      alert('Please enter a valid steel quantity in kg.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/stocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionType: modalType,
          dia: Number(formDia),
          quantityKg: Number(formQtyKg),
          steelGrade: formGrade,
          date: formDate,
          supplier: formSupplier,
          invoiceNo: formInvoiceNo,
          projectId: formProjectId || null,
          remarks: formRemarks,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        confetti({ particleCount: 40, spread: 50, origin: { y: 0.8 } });
        setModalOpen(false);
        setFormQtyKg(1000);
        setFormInvoiceNo('');
        await fetchStockData();
      } else {
        alert(data.error || 'Failed to record transaction');
      }
    } catch (err: any) {
      alert(err.message || 'Error recording transaction');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!confirm('Are you sure you want to delete this stock entry?')) return;
    try {
      const res = await fetch(`/api/stocks?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchStockData();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete transaction');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredTransactions = transactions.filter((tx) => {
    const matchesTab = activeTab === 'ALL' || tx.transactionType === activeTab;
    const matchesDia = selectedDiaFilter === 'ALL' || tx.dia === selectedDiaFilter;
    const q = searchQuery.toLowerCase();
    const matchesQuery =
      !searchQuery ||
      (tx.supplier || '').toLowerCase().includes(q) ||
      (tx.invoiceNo || '').toLowerCase().includes(q) ||
      (tx.remarks || '').toLowerCase().includes(q) ||
      (tx.project?.projectName || '').toLowerCase().includes(q) ||
      `ø${tx.dia}`.includes(q);
    return matchesTab && matchesDia && matchesQuery;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar isSystemAdmin={user?.role === 'SYSTEM_ADMIN'} />

        <main className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-950 relative">
          {/* Ambient Glows */}
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-10 left-1/3 w-96 h-96 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

          {!isAccessAllowed ? (
            <AccessRestrictedView />
          ) : (
            <div className="max-w-7xl mx-auto space-y-6 relative z-10">
              {/* Header & Quick Action Buttons */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Steel Inventory Control
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">IS 1786:2008 Standard Sizes</span>
                  </div>
                  <h1 className="text-2xl font-black text-slate-100 tracking-tight">
                    Steel Stocks & Site Reconciliation
                  </h1>
                  <p className="text-xs text-slate-400">
                    Track inward procurement, site issues by diameter, and compare available steel vs BBS requirements.
                  </p>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                  <button
                    onClick={() => handleOpenModal('PROCUREMENT')}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-emerald-500/20"
                  >
                    <Plus className="w-4 h-4" />
                    + Inward Steel (Procurement)
                  </button>

                  <button
                    onClick={() => handleOpenModal('ISSUE')}
                    className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold flex items-center gap-2 transition-all"
                  >
                    <Minus className="w-4 h-4" />
                    - Issue Steel to Site
                  </button>

                  <button
                    onClick={fetchStockData}
                    disabled={loading}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
                    title="Refresh Stock Data"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-sky-400' : ''}`} />
                  </button>
                </div>
              </div>

              {/* 5-KPI Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
                {/* 1. Procured */}
                <div className="p-4 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl">
                  <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
                    <span>Total Procured</span>
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl sm:text-2xl font-black text-slate-100">
                      {summary?.totalProcuredMT || '0.000'}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-400">MT</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                    {summary?.totalProcuredKg?.toLocaleString() || 0} kg
                  </span>
                </div>

                {/* 2. Issued */}
                <div className="p-4 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl">
                  <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
                    <span>Total Issued to Site</span>
                    <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl sm:text-2xl font-black text-slate-100">
                      {summary?.totalIssuedMT || '0.000'}
                    </span>
                    <span className="text-[10px] font-bold text-rose-400">MT</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                    {summary?.totalIssuedKg?.toLocaleString() || 0} kg
                  </span>
                </div>

                {/* 3. Available On Site */}
                <div className="p-4 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl">
                  <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
                    <span>Available In-Stock</span>
                    <Package className="w-3.5 h-3.5 text-sky-400" />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl sm:text-2xl font-black text-sky-400">
                      {summary?.totalInStockMT || '0.000'}
                    </span>
                    <span className="text-[10px] font-bold text-sky-400">MT</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                    {summary?.totalInStockKg?.toLocaleString() || 0} kg on site
                  </span>
                </div>

                {/* 4. Required per BBS */}
                <div className="p-4 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl">
                  <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
                    <span>BBS Steel Required</span>
                    <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-400" />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl sm:text-2xl font-black text-slate-100">
                      {summary?.totalBbsRequiredMT || '0.000'}
                    </span>
                    <span className="text-[10px] font-bold text-indigo-400">MT</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                    {summary?.totalBbsRequiredKg?.toLocaleString() || 0} kg BBS sum
                  </span>
                </div>

                {/* 5. Net Balance / Health */}
                <div className="p-4 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl">
                  <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
                    <span>Stock Balance Status</span>
                    {summary?.overallHealth === 'HEALTHY' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    )}
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span
                      className={`text-xl sm:text-2xl font-black ${
                        (summary?.totalBalanceKg || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {summary?.totalBalanceMT || '0.000'}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">MT</span>
                  </div>
                  <span
                    className={`text-[10px] font-bold block mt-0.5 ${
                      (summary?.totalBalanceKg || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {(summary?.totalBalanceKg || 0) >= 0 ? 'Surplus In Stock' : 'Deficit — Procure Steel'}
                  </span>
                </div>
              </div>

              {/* SECTION 1: DIAMETER-WISE RECONCILIATION MATRIX */}
              <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
                  <div>
                    <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-sky-400" />
                      Diameter-Wise Steel Reconciliation Matrix (IS 1786)
                    </h3>
                    <p className="text-xs text-slate-400">
                      Full breakdown of Inward, Issued, Net In-Stock vs BBS Requirements across all 11 standard bar sizes.
                    </p>
                  </div>
                  <span className="text-xs font-mono text-slate-400">Unit: Kilograms (kg)</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="py-3 px-3">Bar Dia Ø</th>
                        <th className="py-3 px-3 text-right">Inward Procured (kg)</th>
                        <th className="py-3 px-3 text-right">Outward Issued (kg)</th>
                        <th className="py-3 px-3 text-right font-bold text-sky-300">Net In-Stock (kg)</th>
                        <th className="py-3 px-3 text-right">BBS Required (kg)</th>
                        <th className="py-3 px-3 text-right font-bold">Variance (kg)</th>
                        <th className="py-3 px-3 text-center">Stock Health</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-xs">
                      {matrix.map((row) => (
                        <tr key={row.dia} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-3 px-3 font-mono font-bold text-slate-100">
                            <span className="inline-block px-2.5 py-0.5 rounded-lg bg-slate-800 text-sky-400 border border-slate-700">
                              Ø {row.dia} mm
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-emerald-400">
                            {row.procuredKg.toLocaleString()}
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-rose-400">
                            {row.issuedKg.toLocaleString()}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-sky-400">
                            {row.inStockKg.toLocaleString()}
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-slate-300">
                            {row.bbsRequiredKg.toLocaleString()}
                          </td>
                          <td
                            className={`py-3 px-3 text-right font-mono font-bold ${
                              row.balanceKg >= 0 ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {row.balanceKg >= 0 ? `+${row.balanceKg.toLocaleString()}` : row.balanceKg.toLocaleString()}
                          </td>
                          <td className="py-3 px-3 text-center">
                            {row.balanceKg >= 0 ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                <CheckCircle2 className="w-3 h-3" />
                                Sufficient
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                                <AlertTriangle className="w-3 h-3" />
                                Shortage ({Math.abs(row.balanceKg).toLocaleString()} kg)
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SECTION 2: TRANSACTION LEDGER */}
              <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                      <Package className="w-4 h-4 text-emerald-400" />
                      Steel Inward & Outward Transaction Ledger
                    </h3>
                    <p className="text-xs text-slate-400">
                      Audit log of all steel procurement challans and site delivery issues.
                    </p>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
                    {(['ALL', 'PROCUREMENT', 'ISSUE'] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                          activeTab === tab
                            ? 'bg-sky-500 text-slate-950 shadow-md'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {tab === 'ALL' ? 'All' : tab === 'PROCUREMENT' ? 'Inward (+)' : 'Issued (-)'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Search & Diameter Filter Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="relative w-full sm:w-80">
                    <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search supplier, invoice, project..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-10 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  {/* Diameter Filter Buttons */}
                  <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                    <span className="text-[11px] text-slate-400 mr-1 flex items-center gap-1">
                      <Filter className="w-3 h-3" /> Dia:
                    </span>
                    <button
                      onClick={() => setSelectedDiaFilter('ALL')}
                      className={`px-2 py-0.5 rounded text-xs font-mono font-bold transition-all ${
                        selectedDiaFilter === 'ALL'
                          ? 'bg-sky-500 text-slate-950'
                          : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      All
                    </button>
                    {STANDARD_BAR_DIAMETERS.map((dia) => (
                      <button
                        key={dia}
                        onClick={() => setSelectedDiaFilter(dia)}
                        className={`px-2 py-0.5 rounded text-xs font-mono font-bold transition-all ${
                          selectedDiaFilter === dia
                            ? 'bg-sky-500 text-slate-950'
                            : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Ø{dia}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Ledger Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="py-3 px-3">Date</th>
                        <th className="py-3 px-3">Type</th>
                        <th className="py-3 px-3">Diameter</th>
                        <th className="py-3 px-3 text-right">Quantity</th>
                        <th className="py-3 px-3">Steel Grade</th>
                        <th className="py-3 px-3">Supplier / Invoice</th>
                        <th className="py-3 px-3">Project / Site Ref</th>
                        <th className="py-3 px-3">Remarks</th>
                        <th className="py-3 px-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-xs">
                      {filteredTransactions.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="py-10 text-center text-slate-500">
                            No stock transactions recorded matching the selected filter.
                          </td>
                        </tr>
                      ) : (
                        filteredTransactions.map((tx) => (
                          <tr key={tx.id} className="hover:bg-slate-800/20 transition-colors">
                            <td className="py-3 px-3 font-mono text-slate-300">
                              {new Date(tx.date).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-3">
                              {tx.transactionType === 'PROCUREMENT' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                  + INWARD
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                                  - ISSUED
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3 font-mono font-bold text-slate-100">
                              Ø {tx.dia} mm
                            </td>
                            <td className="py-3 px-3 text-right font-mono font-bold">
                              <span
                                className={
                                  tx.transactionType === 'PROCUREMENT' ? 'text-emerald-400' : 'text-rose-400'
                                }
                              >
                                {tx.transactionType === 'PROCUREMENT' ? '+' : '-'}
                                {tx.quantityKg.toLocaleString()} kg
                              </span>
                              <span className="text-[10px] text-slate-500 block">
                                ({(tx.quantityKg / 1000).toFixed(3)} MT)
                              </span>
                            </td>
                            <td className="py-3 px-3 font-mono text-slate-300">
                              {tx.steelGrade || 'Fe500D'}
                            </td>
                            <td className="py-3 px-3">
                              <span className="font-semibold text-slate-200 block">{tx.supplier || '-'}</span>
                              <span className="text-[10px] text-slate-400 font-mono">{tx.invoiceNo || ''}</span>
                            </td>
                            <td className="py-3 px-3">
                              <span className="text-slate-300">{tx.project?.projectName || 'Central Yard'}</span>
                            </td>
                            <td className="py-3 px-3 text-slate-400 max-w-[200px] truncate">
                              {tx.remarks || '-'}
                            </td>
                            <td className="py-3 px-3 text-center">
                              <button
                                onClick={() => handleDeleteTransaction(tx.id)}
                                className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                                title="Delete entry"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* INWARD / ISSUE MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    modalType === 'PROCUREMENT'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {modalType === 'PROCUREMENT' ? <Plus className="w-5 h-5" /> : <Minus className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-100">
                    {modalType === 'PROCUREMENT' ? 'Inward Steel Procurement' : 'Issue Steel to Site'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {modalType === 'PROCUREMENT'
                      ? 'Record stock delivery from steel manufacturer / supplier'
                      : 'Record bar distribution to rebar bending gang'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTransaction} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {/* Diameter */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Bar Diameter Ø</label>
                  <select
                    value={formDia}
                    onChange={(e) => setFormDia(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-100 focus:outline-none focus:border-sky-500"
                  >
                    {STANDARD_BAR_DIAMETERS.map((d) => (
                      <option key={d} value={d}>
                        Ø {d} mm
                      </option>
                    ))}
                  </select>
                </div>

                {/* Steel Grade */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Steel Grade (IS 1786)</label>
                  <select
                    value={formGrade}
                    onChange={(e) => setFormGrade(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-100 focus:outline-none focus:border-sky-500"
                  >
                    <option value="Fe500D">Fe 500D (Earthquake Resistant)</option>
                    <option value="Fe550D">Fe 550D (High Tensile)</option>
                    <option value="Fe415">Fe 415</option>
                  </select>
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Quantity in Kilograms (kg)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    value={formQtyKg}
                    onChange={(e) => setFormQtyKg(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono font-bold text-slate-100 focus:outline-none focus:border-sky-500"
                    placeholder="e.g. 2500"
                    required
                  />
                  <span className="absolute right-3 top-2 text-xs font-mono text-slate-500">
                    = {(formQtyKg / 1000).toFixed(3)} MT
                  </span>
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Transaction Date</label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* Supplier / Invoice for Procurement */}
              {modalType === 'PROCUREMENT' ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Steel Manufacturer</label>
                    <input
                      type="text"
                      value={formSupplier}
                      onChange={(e) => setFormSupplier(e.target.value)}
                      placeholder="e.g. Tata Tiscon, JSW"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">
                      Invoice / Challan No.
                    </label>
                    <input
                      type="text"
                      value={formInvoiceNo}
                      onChange={(e) => setFormInvoiceNo(e.target.value)}
                      placeholder="e.g. INV-2026-904"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>
              ) : (
                /* Project Target for Issue */
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Target Project</label>
                  <select
                    value={formProjectId}
                    onChange={(e) => setFormProjectId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
                  >
                    <option value="">General Site Stock Issue (All Projects)</option>
                    {projectsList.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.projectName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Remarks */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Remarks & Notes</label>
                <input
                  type="text"
                  value={formRemarks}
                  onChange={(e) => setFormRemarks(e.target.value)}
                  placeholder="e.g. Bundle heat test certificate verified, 12m stock lengths"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg transition-all ${
                    modalType === 'PROCUREMENT'
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                      : 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/20'
                  }`}
                >
                  {submitting ? 'Recording...' : modalType === 'PROCUREMENT' ? 'Record Procurement' : 'Issue Steel'}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
