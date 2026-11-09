'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/common/Providers';
import { Navbar } from '@/components/Navbar';
import { Sidebar } from '@/components/Sidebar';
import { AccessRestrictedView } from '@/components/AccessRestrictedView';
import { MemberWizardModal, MemberCategory } from '@/components/wizards/MemberWizardModal';
import { NewProjectModal } from '@/components/wizards/NewProjectModal';
import { Rebar2DCanvas } from '@/components/visualizer/Rebar2DCanvas';
import { GeneratedRebarItem } from '@/lib/engine/members/footing';
import { STANDARD_BAR_DIAMETERS } from '@/lib/engine/is2502';
import {
  Plus,
  Sparkles,
  ShieldCheck,
  Scissors,
  FileSpreadsheet,
  Download,
  Trash2,
  Eye,
  Layers,
  HardHat,
  Search,
  Filter,
  CheckCircle2,
  RefreshCw,
  FolderKanban,
  FileText,
  Building,
  UserCheck,
  Compass,
  X,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function DashboardPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [activeProject, setActiveProject] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDiaFilter, setSelectedDiaFilter] = useState<number | 'ALL'>('ALL');

  // Modals
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardType, setWizardType] = useState<MemberCategory>('BEAM');
  const [previewRebar, setPreviewRebar] = useState<GeneratedRebarItem | null>(null);
  const [exportingFormat, setExportingFormat] = useState<string | null>(null);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/projects');
      const data = await res.json();
      if (data.success && data.projects.length > 0) {
        setProjects(data.projects);
        if (!activeProject) {
          setActiveProject(data.projects[0]);
        } else {
          const updated = data.projects.find((p: any) => p.id === activeProject.id);
          setActiveProject(updated || data.projects[0]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // Check access permission
  const isSystemAdmin = user?.role === 'SYSTEM_ADMIN' || user?.email === 'admin' || user?.email === 'admin@smartbbs.com';
  const isAccessAllowed =
    isSystemAdmin ||
    (user?.isApprovedByAdmin === true &&
      user?.subscriptionStatus !== 'SUSPENDED' &&
      user?.subscriptionStatus !== 'EXPIRED' &&
      user?.subscriptionStatus !== 'PENDING' &&
      (!user?.subscriptionExpiresAt || new Date(user.subscriptionExpiresAt) >= new Date()));

  // Gather all rebar items from active project
  const allRebarItems: GeneratedRebarItem[] = activeProject && activeProject.members
    ? activeProject.members.flatMap((m: any) =>
        (m.rebarItems || []).map((r: any) => {
          const cutLen = Number(r.calculatedCutLength) || 0;
          const count = Number(r.count) || 0;
          const dia = Number(r.dia) || 12;
          const unitWeight = Number(r.unitWeight) || (dia * dia) / 162.2;
          const totalLengthM = (count * cutLen) / 1000;
          const totalWeightKg = totalLengthM * unitWeight;

          return {
            barMark: r.barMark || '1',
            shapeCode: r.shapeCode || '20',
            description: `${m.memberTag || ''} ${r.remarks || r.barMark || ''}`.trim(),
            dia,
            count,
            dimA: r.dimA || 0,
            dimB: r.dimB || 0,
            dimC: r.dimC || 0,
            dimD: r.dimD || 0,
            dimE: r.dimE || 0,
            rawCutLength: cutLen,
            calculatedCutLength: cutLen,
            unitWeight,
            totalLengthM: Number(totalLengthM.toFixed(2)),
            totalWeightKg: Number(totalWeightKg.toFixed(2)),
            remarks: r.remarks || '',
            isPayable: r.isPayable !== false,
            isChair: Boolean(r.isChair),
            isLap: Boolean(r.isLap),
          };
        })
      )
    : [];

  const filteredItems = allRebarItems.filter((item) => {
    const matchesSearch =
      (item.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.barMark || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.shapeCode || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDia = selectedDiaFilter === 'ALL' || item.dia === selectedDiaFilter;
    return matchesSearch && matchesDia;
  });

  const totalSteelWeightKg = allRebarItems.reduce(
    (acc, item) => acc + (Number(item.totalWeightKg) || 0),
    0
  );
  const totalLengthM = allRebarItems.reduce((acc, item) => acc + (Number(item.totalLengthM) || 0), 0);

  const handleSaveMember = async (memberData: any) => {
    try {
      const res = await fetch('/api/members/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(memberData),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
        });
        await fetchProjects();
      } else {
        alert(data.error || 'Failed to save member');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDownloadPdf = async (format: 'A4' | 'A3') => {
    if (allRebarItems.length === 0) {
      alert('No rebar items found in this project to export.');
      return;
    }
    setExportingFormat(format);
    try {
      const res = await fetch('/api/export/pdf-technical', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageSize: format,
          format: format,
          projectName: activeProject?.projectName,
          contractorName: activeProject?.contractorName,
          technicalAgency: activeProject?.technicalAgency,
          clientName: activeProject?.clientName,
          rccGrade: activeProject?.rccGrade,
          steelGrade: activeProject?.rebarGrade,
          items: allRebarItems,
        }),
      });

      if (!res.ok) throw new Error('PDF export failed');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CASE_BBS_${format}_Report_${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err: any) {
      alert(err.message || 'Failed to download PDF');
    } finally {
      setExportingFormat(null);
    }
  };

  const handleDownloadExcel = async () => {
    if (allRebarItems.length === 0) {
      alert('No rebar items found to export.');
      return;
    }
    setExportingFormat('EXCEL');
    try {
      const res = await fetch('/api/export/excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectName: activeProject?.projectName,
          contractorName: activeProject?.contractorName,
          technicalAgency: activeProject?.technicalAgency,
          clientName: activeProject?.clientName,
          items: allRebarItems,
        }),
      });

      if (!res.ok) throw new Error('Excel export failed');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CASE_BBS_Schedule_${Date.now()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err: any) {
      alert(err.message || 'Failed to download Excel MB');
    } finally {
      setExportingFormat(null);
    }
  };

  const handleDownloadDxf = async () => {
    if (allRebarItems.length === 0) {
      alert('No rebar items found to export.');
      return;
    }
    setExportingFormat('DXF');
    try {
      const res = await fetch('/api/export/dxf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectName: activeProject?.projectName,
          items: allRebarItems,
        }),
      });

      if (!res.ok) throw new Error('DXF export failed');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CASE_BBS_CAD_${Date.now()}.dxf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err: any) {
      alert(err.message || 'Failed to download DXF CAD');
    } finally {
      setExportingFormat(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar />

        <main className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-950 relative">
          {/* Background Ambient Glows */}
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-10 left-1/3 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

          {/* GATING: If User is Not Approved, Show Access Restricted / Trial Screen */}
          {!isAccessAllowed ? (
            <AccessRestrictedView />
          ) : (
            <div className="max-w-7xl mx-auto space-y-6 relative z-10">
              {/* Top Project Selector & Action Bar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl">
                <div className="flex items-center gap-4 flex-wrap">
                  <div>
                    <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider block mb-0.5">
                      Active Structural Project
                    </span>
                    <div className="flex items-center gap-2">
                      <select
                        value={activeProject?.id || ''}
                        onChange={(e) => {
                          const p = projects.find((proj) => proj.id === e.target.value);
                          if (p) setActiveProject(p);
                        }}
                        className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-sm font-bold text-slate-100 focus:outline-none focus:border-sky-500"
                      >
                        {projects.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.projectName}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => setNewProjectOpen(true)}
                        className="px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-sky-500/20"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        New Project
                      </button>
                    </div>
                  </div>

                  {/* Metadata Chips */}
                  {activeProject && (
                    <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-950/80 border border-slate-800 font-mono">
                        {activeProject.rccGrade} • {activeProject.rebarGrade}
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-slate-950/80 border border-slate-800 font-semibold text-slate-300">
                        {activeProject.contractorName || 'Creative Associates'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Primary Action Buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => {
                      setWizardType('BEAM');
                      setWizardOpen(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-sky-500/20 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    + Add Member
                  </button>
                </div>
              </div>

              {/* KPI Metrics Dashboard Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl">
                  <span className="text-[11px] font-semibold text-slate-400 block mb-1">Total Steel Quantity</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl sm:text-3xl font-black text-slate-100">
                      {(totalSteelWeightKg / 1000).toFixed(3)}
                    </span>
                    <span className="text-xs font-bold text-sky-400">M.T.</span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono block mt-1">
                    {totalSteelWeightKg.toFixed(1)} kg payable
                  </span>
                </div>

                <div className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl">
                  <span className="text-[11px] font-semibold text-slate-400 block mb-1">Total Rebar Running Length</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl sm:text-3xl font-black text-slate-100">
                      {totalLengthM.toFixed(1)}
                    </span>
                    <span className="text-xs font-bold text-emerald-400">meters</span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono block mt-1">
                    {allRebarItems.length} cut schedule lines
                  </span>
                </div>

                <div className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl">
                  <span className="text-[11px] font-semibold text-slate-400 block mb-1">Structural Members</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl sm:text-3xl font-black text-slate-100">
                      {activeProject?.members?.length || 0}
                    </span>
                    <span className="text-xs font-bold text-indigo-400">Elements</span>
                  </div>
                  <span className="text-[11px] text-slate-500 block mt-1 truncate">
                    Footing, Col, Beam, Slab, Wall, Stair
                  </span>
                </div>

                <div className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl">
                  <span className="text-[11px] font-semibold text-slate-400 block mb-1">IS Detailing Standards</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl sm:text-3xl font-black text-amber-400">
                      IS 2502 & IS 456
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 block mt-1">
                    Unit Wt w = d²/162.2 kg/m
                  </span>
                </div>
              </div>

              {/* Exports Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                  <Download className="w-4 h-4 text-sky-400" />
                  <span>MNC AEC Grade Technical BBS Exports:</span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => handleDownloadPdf('A3')}
                    disabled={exportingFormat === 'A3'}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-rose-600/20"
                  >
                    <FileText className="w-4 h-4" />
                    {exportingFormat === 'A3' ? 'Generating A3 Sheet...' : 'A3 Engineering Sheet (PDF)'}
                  </button>

                  <button
                    onClick={handleDownloadExcel}
                    disabled={exportingFormat === 'EXCEL'}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-emerald-600/20"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    {exportingFormat === 'EXCEL' ? 'Exporting Spreadsheet...' : 'Excel BBS Schedule (.xlsx)'}
                  </button>
                </div>
              </div>

              {/* Table Search & Filter Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search member, bar mark, shape..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-10 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  />
                </div>

                {/* Diameter Filters */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] text-slate-400 mr-1 font-semibold flex items-center gap-1">
                    <Filter className="w-3 h-3" /> Dia:
                  </span>
                  <button
                    onClick={() => setSelectedDiaFilter('ALL')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                      selectedDiaFilter === 'ALL'
                        ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    All
                  </button>
                  {STANDARD_BAR_DIAMETERS.map((dia) => (
                    <button
                      key={dia.toString()}
                      onClick={() => setSelectedDiaFilter(dia as any)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                        selectedDiaFilter === dia
                          ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                          : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Ø{dia}
                    </button>
                  ))}
                </div>
              </div>

              {/* Main Schedule Table */}
              <div className="rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="py-3.5 px-4">Mark</th>
                        <th className="py-3.5 px-4">Member & Description</th>
                        <th className="py-3.5 px-3 text-center">Shape</th>
                        <th className="py-3.5 px-3 text-center">Dia</th>
                        <th className="py-3.5 px-3 text-center">Count</th>
                        <th className="py-3.5 px-3 text-right">Dimensions (mm)</th>
                        <th className="py-3.5 px-3 text-right">Cut L (mm)</th>
                        <th className="py-3.5 px-3 text-right">Unit Wt</th>
                        <th className="py-3.5 px-4 text-right">Total Wt (kg)</th>
                        <th className="py-3.5 px-3 text-center">Drawing</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-xs">
                      {filteredItems.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="py-12 text-center text-slate-500">
                            No rebar schedule lines found. Click &quot;Add Member&quot; to begin.
                          </td>
                        </tr>
                      ) : (
                        filteredItems.map((item, idx) => (
                          <tr
                            key={idx}
                            className="hover:bg-slate-800/30 transition-colors group"
                          >
                            <td className="py-3 px-4 font-mono font-bold text-sky-400">
                              {item.barMark}
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-semibold text-slate-200 block">{item.description}</span>
                              <span className="text-[10px] text-slate-500">{item.remarks}</span>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono text-[11px]">
                                Shape {item.shapeCode}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center font-mono font-bold text-slate-200">
                              Ø {item.dia}
                            </td>
                            <td className="py-3 px-3 text-center font-mono text-slate-300">
                              {item.count} nos
                            </td>
                            <td className="py-3 px-3 text-right font-mono text-slate-400 text-[11px]">
                              {item.dimA ? `A:${item.dimA}` : ''}
                              {item.dimB ? ` | B:${item.dimB}` : ''}
                              {item.dimC ? ` | C:${item.dimC}` : ''}
                            </td>
                            <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">
                              {item.calculatedCutLength} mm
                            </td>
                            <td className="py-3 px-3 text-right font-mono text-slate-400 text-[11px]">
                              {item.unitWeight.toFixed(3)} kg/m
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-slate-100">
                              {item.totalWeightKg.toFixed(2)}
                            </td>
                            <td className="py-3 px-3 text-center">
                              <button
                                onClick={() => setPreviewRebar(item)}
                                className="p-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 transition-all"
                                title="Inspect Scale Vector Drawing"
                              >
                                <Eye className="w-3.5 h-3.5" />
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

      {/* Scale Technical Vector Drawing Modal */}
      {previewRebar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div>
                <h4 className="text-sm font-bold text-slate-100">
                  Scale Technical Drawing: {previewRebar.barMark}
                </h4>
                <p className="text-xs text-slate-400">{previewRebar.description}</p>
              </div>
              <button
                onClick={() => setPreviewRebar(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="h-64 mb-4">
              <Rebar2DCanvas
                shapeCode={previewRebar.shapeCode}
                dia={previewRebar.dia}
                dimA={previewRebar.dimA}
                dimB={previewRebar.dimB}
                dimC={previewRebar.dimC}
                calculatedCutLength={previewRebar.calculatedCutLength}
              />
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 space-y-1">
              <div className="flex justify-between">
                <span>IS 2502 Round-Up Cut:</span>
                <span className="text-emerald-400 font-bold">{previewRebar.calculatedCutLength} mm</span>
              </div>
              <div className="flex justify-between">
                <span>Theoretical Unit Weight:</span>
                <span>{previewRebar.unitWeight.toFixed(3)} kg/m (Ø{previewRebar.dia}²/162.2)</span>
              </div>
              <div className="flex justify-between">
                <span>Total Calculated Weight:</span>
                <span className="text-sky-400 font-bold">{previewRebar.totalWeightKg.toFixed(2)} kg</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <NewProjectModal
        isOpen={newProjectOpen}
        onClose={() => setNewProjectOpen(false)}
        onProjectCreated={(p) => {
          setProjects([p, ...projects]);
          setActiveProject(p);
        }}
      />

      <MemberWizardModal
        isOpen={wizardOpen}
        onClose={() => setWizardOpen(false)}
        projectId={activeProject?.id || ''}
        initialMemberType={wizardType}
        onSaveMember={handleSaveMember}
      />


    </div>
  );
}
