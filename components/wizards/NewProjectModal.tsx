'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FolderPlus, Building2, HardHat, FileText, CheckCircle2, ShieldCheck } from 'lucide-react';

export interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: (project: any) => void;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({
  isOpen,
  onClose,
  onProjectCreated,
}) => {
  const [projectName, setProjectName] = useState('');
  const [contractorName, setContractorName] = useState('Creative Associates & Builders');
  const [technicalAgency, setTechnicalAgency] = useState('Creative Structural Consultants & Associates');
  const [clientName, setClientName] = useState('Urban Infrastructure Development');
  const [siteLocation, setSiteLocation] = useState('Site Office');
  const [rccGrade, setRccGrade] = useState('M25');
  const [rebarGrade, setRebarGrade] = useState('Fe500D');
  const [authorityStandard, setAuthorityStandard] = useState('IS_STANDARD');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectName,
          contractorName,
          technicalAgency,
          clientName,
          siteLocation,
          rccGrade,
          rebarGrade,
          authorityStandard,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create project');
      }

      onProjectCreated(data.project);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden relative"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                <FolderPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-100">Create New BBS Project</h3>
                <p className="text-xs text-slate-400">
                  Configure structural project details, contractor agency, and IS 2502 standards.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium mb-4">
              {error}
            </div>
          )}

          {/* Project Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Project Title / Structure Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Commercial Hub (G+14 Floors & 2 Basements)"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Contractor / Agency Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Creative Associates & Builders"
                  value={contractorName}
                  onChange={(e) => setContractorName(e.target.value)}
                  className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Technical Agency / Consultant
                </label>
                <input
                  type="text"
                  placeholder="e.g. Creative Structural Consultants"
                  value={technicalAgency}
                  onChange={(e) => setTechnicalAgency(e.target.value)}
                  className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Client / Government Department
                </label>
                <input
                  type="text"
                  placeholder="e.g. Infrastructure Corporation / Client"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Site Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. BKC, Mumbai / Kothrud, Pune"
                  value={siteLocation}
                  onChange={(e) => setSiteLocation(e.target.value)}
                  className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Concrete Grade</label>
                <select
                  value={rccGrade}
                  onChange={(e) => setRccGrade(e.target.value)}
                  className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
                >
                  <option value="M20">M20 (1:1.5:3)</option>
                  <option value="M25">M25 (Standard IS 456)</option>
                  <option value="M30">M30 (High Performance)</option>
                  <option value="M35">M35 (Ductile Seismic)</option>
                  <option value="M40">M40 (High Strength)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Steel Grade (TMT)</label>
                <select
                  value={rebarGrade}
                  onChange={(e) => setRebarGrade(e.target.value)}
                  className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
                >
                  <option value="Fe415">Fe 415</option>
                  <option value="Fe500D">Fe 500D (IS 1786 Standard)</option>
                  <option value="Fe550D">Fe 550D (High Yield)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !projectName}
                className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-sky-500/20 disabled:opacity-50"
              >
                {loading ? 'Creating Project...' : 'Initialize Project Workspace'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
