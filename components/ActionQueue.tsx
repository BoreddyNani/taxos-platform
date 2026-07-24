"use client";

import React from 'react';
import { TaxReturn } from '../lib/tax-data';

interface Props {
  returns: TaxReturn[];
  selectedId: string;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onSelect: (id: string) => void;
}

export function ActionQueue({ returns, selectedId, searchTerm, onSearchChange, onSelect }: Props) {
  return (
    <aside className="w-80 bg-slate-950 border-r border-slate-800 flex flex-col shrink-0 h-full">
      <div className="p-4 border-b border-slate-800">
        <h3 className="font-bold text-xs uppercase text-slate-400 mb-3">Action Queue</h3>
        <input 
          type="text" 
          placeholder="Search returns..." 
          value={searchTerm} 
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 text-xs rounded-lg px-3 py-2 outline-none text-slate-200"
        />
      </div>
      <div className="flex-1 overflow-y-auto divide-y divide-slate-900">
        {returns.map(item => (
          <div 
            key={item.id} 
            onClick={() => onSelect(item.id)} 
            className={`p-4 cursor-pointer hover:bg-slate-900/60 transition-colors ${item.id === selectedId ? 'bg-slate-900 border-l-4 border-l-blue-500' : 'border-l-4 border-l-transparent'}`}
          >
            <h4 className="font-semibold text-sm text-slate-200">{item.clientName}</h4>
            <div className="text-xs text-slate-400 mb-2">{item.type}</div>
            <div className="text-[10px] bg-slate-950 p-2 rounded border border-slate-800 flex justify-between items-center">
              <span>Owner: <strong className="text-slate-300">{item.actionOwner}</strong></span>
              <span className="text-blue-400">{item.status.replace('_', ' ')}</span>
            </div>
          </div>
        ))}
        {returns.length === 0 && (
          <div className="p-4 text-center text-xs text-slate-500">No returns found.</div>
        )}
      </div>
    </aside>
  );
}