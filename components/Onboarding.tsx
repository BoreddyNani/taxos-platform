"use client";

import React from 'react';
import { ArrowRight } from 'lucide-react';

interface Props {
  isUploading: boolean;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function Onboarding({ isUploading, onFileUpload }: Props) {
  return (
    <main className="flex-1 flex items-center justify-center p-8 bg-slate-900">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-8 max-w-xl w-full shadow-2xl">
        <h2 className="text-2xl font-bold text-white mb-6">Upload your W-2 to start</h2>
        <div className="bg-blue-950/40 border-2 border-blue-500 rounded-xl p-5 flex justify-between items-center">
          <div>
            <h4 className="font-bold text-white">Upload Primary Income Statements</h4>
            <p className="text-slate-400 text-xs mt-1">Our AI will auto-fill your numbers.</p>
          </div>
          <label className={`bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs px-4 py-2.5 rounded-lg flex items-center gap-2 cursor-pointer transition-colors ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
            {isUploading ? "Processing..." : "Upload File"} <ArrowRight size={14} />
            <input 
              type="file" 
              accept="image/*,application/pdf" 
              className="hidden" 
              onChange={onFileUpload} 
              disabled={isUploading} 
            />
          </label>
        </div>
      </div>
    </main>
  );
}