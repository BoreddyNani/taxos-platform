"use client";

import React, { useState } from 'react';
import { Send, ArrowRight, EyeOff } from 'lucide-react';
import { CommentThread, Role } from '../lib/tax-data';

interface Props {
  comments: CommentThread[];
  role: Role;
  onAddComment: (text: string, isInternal: boolean) => void;
  onViewField: (fieldId: string) => void;
}

export function CollaborationPanel({ comments, role, onAddComment, onViewField }: Props) {
  const [newText, setNewText] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  
  const isClient = role === 'CLIENT_NEW' || role === 'CLIENT_RETURNING';
  const visibleComments = isClient ? comments.filter(c => !c.isInternal) : comments;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;
    onAddComment(newText, isInternal);
    setNewText('');
    setIsInternal(false);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
      <div className="bg-slate-900 border-b border-slate-800 p-3">
        <h3 className="font-semibold text-sm text-slate-200">Issue Tracker & Communication</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {visibleComments.length === 0 && (
          <div className="text-center text-slate-500 text-sm mt-10">No messages yet.</div>
        )}
        {visibleComments.map(c => (
          <div key={c.id} className={`p-4 rounded-xl border ${c.isInternal ? 'bg-amber-950/10 border-amber-900/50' : 'bg-slate-900 border-slate-800'}`}>
             <div className="flex justify-between items-start mb-2">
               <div>
                 <span className="font-semibold text-sm text-slate-200">{c.author}</span>
                 <span className="text-xs text-slate-500 ml-2 border border-slate-700 rounded px-1.5 py-0.5">{c.role}</span>
               </div>
               {c.isInternal && (
                 <span className="text-[10px] uppercase font-bold text-amber-500 flex items-center gap-1 bg-amber-950/40 px-2 py-1 rounded">
                   <EyeOff size={12}/> Internal Only
                 </span>
               )}
             </div>
             <p className="text-sm text-slate-300 leading-relaxed">{c.text}</p>
             
             {c.targetFieldId && (
               <button 
                 onClick={() => onViewField(c.targetFieldId!)} 
                 className="mt-3 text-xs bg-blue-950/40 text-blue-400 px-3 py-1.5 rounded-lg border border-blue-900/50 hover:bg-blue-900/60 transition-colors flex items-center gap-2"
               >
                 Review Referenced Field <ArrowRight size={12} />
               </button>
             )}
          </div>
        ))}
      </div>

      <div className="p-4 bg-slate-900 border-t border-slate-800">
         <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <textarea 
              value={newText} 
              onChange={e => setNewText(e.target.value)} 
              placeholder="Type a message or ask a question..." 
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm outline-none resize-none h-20 text-slate-200" 
            />
            <div className="flex justify-between items-center">
              {!isClient ? (
                <label className="text-xs text-slate-400 flex items-center gap-2 cursor-pointer hover:text-slate-200 transition-colors">
                  <input 
                    type="checkbox" 
                    checked={isInternal} 
                    onChange={e => setIsInternal(e.target.checked)} 
                    className="rounded bg-slate-800 border-slate-700" 
                  />
                  Mark as Internal Note
                </label>
              ) : <div />}
              <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors">
                Send Message <Send size={14} />
              </button>
            </div>
         </form>
      </div>
    </div>
  )
}