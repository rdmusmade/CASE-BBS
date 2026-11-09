'use client';

import React, { useState } from 'react';
import { Sparkles, Upload, FileText, CheckCircle2, AlertCircle, RefreshCw, X, ArrowRight } from 'lucide-react';
import { ExtractedMemberData } from '@/lib/ai/geminiDrawingOcr';

export interface AiDrawingScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportMembers: (members: ExtractedMemberData[]) => void;
}

export const AiDrawingScannerModal: React.FC<AiDrawingScannerModalProps> = ({
  isOpen,
  onClose,
  onImportMembers,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<string>('BEAM');
  const [customText, setCustomText] = useState<string>('');
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [extractedData, setExtractedData] = useState<ExtractedMemberData[] | null>(null);
  const [source, setSource] = useState<string>('');

  if (!isOpen) return null;

  const presets = [
    { id: 'BEAM', label: 'Continuous Beam (B101) Schedule', snippet: 'Beam B101 size 300x650mm, span 5500mm, Top 3-16# continuous, Bottom 4-20# Fe500D, 2-16# top extra L/3, 8# 2-leg stirrups @ 100 c/c support, 150 c/c midspan.' },
    { id: 'COLUMN', label: 'Ground Floor Column (C1) Detailing', snippet: 'Column C1 300x600mm, height 3600mm, 8-20# main longitudinal Fe500D with 350mm L-anchor into footing, 8# outer ties @ 100mm c/c confining (lo=600mm) with 135° hooks, 8# diamond tie.' },
    { id: 'FOOTING', label: 'Raft Foundation (F1) Layout', snippet: 'Combined Raft Footing F1 2400x2400x600mm, Clear cover 50mm, Bottom mat 12# @ 150 c/c both ways with 500mm bend-ups, Top mat 10# @ 200 c/c, 12# chairs @ 1m grid.' },
    { id: 'WATER_TANK', label: 'Underground Water Tank Wall (IS 3370)', snippet: 'UGWT Wall 6000x3500mm, thickness 250mm, Liquid face cover 40mm, Vertical liquid face 16# @ 150 c/c with 450mm base anchor, Vertical outer face 12# @ 150 c/c, Horizontal 10# @ 150 c/c.' },
  ];

  const handleScan = async (queryText?: string) => {
    setAnalyzing(true);
    setExtractedData(null);

    const promptText = queryText || customText || presets.find((p) => p.id === selectedPreset)?.snippet;

    try {
      const res = await fetch('/api/ai/drawing-ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          textQuery: promptText,
          mimeType: 'text/plain',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setExtractedData(data.extractedMembers);
        setSource(data.source);
      } else {
        alert(data.error || 'Failed to extract drawing data');
      }
    } catch (err) {
      console.error(err);
      alert('Error during OCR extraction');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleImport = () => {
    if (extractedData && extractedData.length > 0) {
      onImportMembers(extractedData);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-sky-950/40 via-slate-900 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">AI Drawing to BBS Extractor</h3>
              <p className="text-xs text-slate-400">
                Powered by Google Gemini 1.5 API & IS Code Structural Engine
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Preset Structural Drawing Snippets */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-2">
              Select Sample Drawing Schedule or Paste OCR Text:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => {
                    setSelectedPreset(preset.id);
                    setCustomText(preset.snippet);
                  }}
                  className={`p-3 rounded-xl text-left border text-xs transition-all ${
                    selectedPreset === preset.id
                      ? 'bg-sky-500/20 border-sky-500 text-sky-200'
                      : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="font-bold text-white mb-1 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-sky-400" />
                    <span>{preset.label}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">{preset.snippet}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Textarea for Custom Drawing Text */}
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">
              Drawing Structural Notes / Schedule Text:
            </label>
            <textarea
              rows={3}
              value={customText || presets.find((p) => p.id === selectedPreset)?.snippet}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="Paste drawing schedule text, beam dimensions, column rebar notes, or upload snippet..."
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 font-mono"
            />
          </div>

          {/* Run Button */}
          <button
            onClick={() => handleScan()}
            disabled={analyzing}
            className="w-full py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-sky-500/30 transition-all active:scale-[0.99]"
          >
            {analyzing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Analyzing Drawing with Gemini 1.5 API...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Extract BBS Rebar Schedule</span>
              </>
            )}
          </button>

          {/* Extracted Members Preview */}
          {extractedData && extractedData.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Extracted {extractedData.length} Structural Member(s)</span>
                </h4>
                <span className="text-[11px] text-sky-400 font-bold px-2 py-0.5 rounded-md bg-sky-500/10 border border-sky-500/20">
                  {source}
                </span>
              </div>

              <div className="space-y-3">
                {extractedData.map((member, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-sky-500 text-white text-xs font-black">
                          {member.memberTag}
                        </span>
                        <span className="text-xs text-slate-300 font-bold">
                          {member.memberType} ({member.concreteGrade} / {member.steelGrade})
                        </span>
                      </div>
                      <span className="text-xs text-emerald-400 font-bold">
                        Confidence: {(member.confidenceScore * 100).toFixed(0)}%
                      </span>
                    </div>

                    <p className="text-xs text-slate-400">{member.notes}</p>

                    {/* Rebar table */}
                    <div className="overflow-x-auto rounded-xl border border-slate-800">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-900 text-slate-400 text-[10px] uppercase">
                          <tr>
                            <th className="py-2 px-2.5">Mark</th>
                            <th className="py-2 px-2.5">Description</th>
                            <th className="py-2 px-2.5">Shape</th>
                            <th className="py-2 px-2.5">Dia</th>
                            <th className="py-2 px-2.5">Qty</th>
                            <th className="py-2 px-2.5">Remarks</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-850 text-slate-300">
                          {member.rebarDetails.map((rebar, rIdx) => (
                            <tr key={rIdx}>
                              <td className="py-2 px-2.5 font-bold text-sky-400">{rebar.barMark}</td>
                              <td className="py-2 px-2.5">{rebar.description}</td>
                              <td className="py-2 px-2.5">{rebar.shapeCode}</td>
                              <td className="py-2 px-2.5 font-bold">Ø {rebar.dia}</td>
                              <td className="py-2 px-2.5 font-bold">{rebar.count}</td>
                              <td className="py-2 px-2.5 text-[11px] text-slate-400">{rebar.remarks}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={!extractedData || extractedData.length === 0}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all"
          >
            <span>Import to BBS Schedule</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
