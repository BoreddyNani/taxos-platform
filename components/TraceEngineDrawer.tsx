"use client";

import React from 'react';
import { Sparkles, FileText, X } from 'lucide-react';
import { ExtractedField } from '../lib/tax-data';

interface Props {
  field: ExtractedField;
  onClose: () => void;
}

export function TraceEngineDrawer({ field, onClose }: Props) {
  return (
    <aside className="w-[400px] bg-slate-950 border-l border-slate-800 flex flex-col shrink-0 shadow-2xl animate-in slide-in-from-right">
      <div className="p-4 border-b border-slate-800 flex justify-between items-center">
        <h3 className="font-bold text-xs text-slate-200 flex items-center gap-2">
          <Sparkles size={16} className="text-blue-400"/> Trace Engine
        </h3>
        <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded transition-colors">
          <X size={16} className="text-slate-500 hover:text-white"/>
        </button>
      </div>
      <div className="p-5 space-y-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-[10px] text-slate-500 font-bold uppercase mb-2">Source Origin</div>
          <div className="text-xs font-semibold text-slate-200 flex items-center gap-1">
            <FileText size={14} className="text-blue-400"/> {field.sourceDocName}
          </div>
          <div className="text-xs text-slate-400 mt-2 bg-slate-950 p-2 border border-slate-800 rounded">
            Extracted from: <span className="text-slate-200 font-mono">{field.sourceDocSection}</span>
          </div>
        </div>
        
        <div className="bg-blue-950/20 border border-blue-500/20 rounded-xl p-4">
          <div className="text-[10px] text-slate-500 font-bold uppercase mb-2">AI Reasoning</div>
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-bold text-blue-400">Confidence Score</span>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
              {(field.confidence * 100).toFixed(0)}%
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">{field.aiExplanation}</p>
          {field.calculationFormula && (
            <div className="mt-3 text-[10px] font-mono text-slate-400 bg-slate-900 p-2 rounded">
              Formula: {field.calculationFormula}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}