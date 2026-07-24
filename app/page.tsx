"use client";

import React, { useState, useMemo } from 'react';
import {
  FileText, Shield, AlertTriangle, CheckCircle2, MessageSquare,
  Search, Lock, Sparkles, ArrowRight, User, HelpCircle, X
} from 'lucide-react';

// --- TYPES ---
type Role = 'CLIENT_NEW' | 'CLIENT_RETURNING' | 'PREPARER' | 'REVIEWER' | 'ADMIN';
type ReturnStatus = 'AWAITING_DOCS' | 'IN_PREPARATION' | 'IN_REVIEW' | 'READY_TO_SIGN' | 'FILED';
type DataAffordance = 'AI_EXTRACTED' | 'VERIFIED' | 'NEEDS_APPROVAL' | 'LOCKED' | 'HUMAN_EDITED';

interface ExtractedField {
  id: string;
  fieldKey: string;
  label: string;
  value: string;
  sourceDocName: string;
  sourceDocPage: number;
  sourceDocSection: string;
  calculationFormula?: string;
  confidence: number;
  aiExplanation: string;
  affordance: DataAffordance;
  linkedTaskId?: string;
}

interface CommentThread {
  id: string;
  author: string;
  role: 'Client' | 'CPA' | 'Reviewer';
  isInternal: boolean;
  text: string;
  timestamp: string;
  targetFieldId?: string;
}

interface TaxReturn {
  id: string;
  clientName: string;
  type: string;
  year: number;
  status: ReturnStatus;
  urgencyScore: number;
  assignedPreparer: string;
  assignedReviewer: string;
  actionOwner: 'Client' | 'Preparer' | 'Reviewer';
  blockers: string[];
  fields: ExtractedField[];
  comments: CommentThread[];
}

// --- HELPER FUNCTION ---
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const pureBase64 = result.split(',')[1];
      resolve(pureBase64);
    };
    reader.onerror = (error) => reject(error);
  });
};

// --- MOCK DATASET FOR UI DEMONSTRATION ---
const initialMockReturns: TaxReturn[] = [
  {
    id: 'ret-101',
    clientName: 'Apex Tech Solutions LLC',
    type: '1120-S Corporate Return',
    year: 2025,
    status: 'IN_PREPARATION',
    urgencyScore: 92,
    assignedPreparer: 'Sarah Jenkins (CPA)',
    assignedReviewer: 'David Miller (Partner)',
    actionOwner: 'Preparer',
    blockers: ['W-2 / 1099 Discrepancy on Box 1'],
    comments: [
      { id: 'c1', author: 'Sarah Jenkins', role: 'CPA', isInternal: true, text: 'AI flagged discrepancy. Need review.', timestamp: '10 mins ago', targetFieldId: 'f1' }
    ],
    fields: [
      {
        id: 'f1',
        fieldKey: 'gross_wages',
        label: 'Gross Wages (Line 7)',
        value: '$485,200.00',
        sourceDocName: 'W2_Summary_2025.pdf',
        sourceDocPage: 1,
        sourceDocSection: 'Box 1: Wages',
        calculationFormula: 'Sum of Box 1 across 12 monthly exports',
        confidence: 0.96,
        aiExplanation: 'Matched line items across payroll summaries.',
        affordance: 'AI_EXTRACTED'
      },
      {
        id: 'f2',
        fieldKey: 'state_tax_locked',
        label: 'State Statutory Minimum Tax',
        value: '$800.00',
        sourceDocName: 'State_Tax_Table_2025.gov',
        sourceDocPage: 1,
        sourceDocSection: 'Section 4B',
        confidence: 1.0,
        aiExplanation: 'Statutory minimum value.',
        affordance: 'LOCKED'
      }
    ]
  },
  {
    id: 'ret-102',
    clientName: 'Marcus & Elena Rostova',
    type: '1040 Individual Tax Return',
    year: 2025,
    status: 'AWAITING_DOCS',
    urgencyScore: 85,
    assignedPreparer: 'Sarah Jenkins (CPA)',
    assignedReviewer: 'David Miller (Partner)',
    actionOwner: 'Client',
    blockers: ['Awaiting 1099-B from Fidelity'],
    comments: [],
    fields: []
  }
];

export default function TaxPlatformApp() {
  const [currentRole, setCurrentRole] = useState<Role>('PREPARER');
  const [selectedReturnId, setSelectedReturnId] = useState<string>('ret-101');
  const [returnsData, setReturnsData] = useState<TaxReturn[]>(initialMockReturns);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [isOnboardingCompleted, setIsOnboardingCompleted] = useState(false);
  const [activeField, setActiveField] = useState<ExtractedField | null>(null);
  const [activeTab, setActiveTab] = useState<'TRACE' | 'AI_REASONING' | 'COMMENTS'>('TRACE');
  const [isUploading, setIsUploading] = useState(false);

  const activeReturn = useMemo(() => returnsData.find(r => r.id === selectedReturnId) || returnsData[0], [selectedReturnId, returnsData]);

  const sortedReturns = useMemo(() => {
    return [...returnsData]
      .filter(r => (filterStatus === 'ALL' || r.status === filterStatus) && r.clientName.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => b.urgencyScore - a.urgencyScore);
  }, [searchTerm, filterStatus, returnsData]);

  // --- REAL BACKEND UPLOAD FUNCTION ---
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    
    try {
      // 1. Convert to clean base64
      const base64Data = await fileToBase64(file);
      
      // 2. Send the exact payload format our API route expects
      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          fileName: file.name, 
          base64Data: base64Data,
          mimeType: file.type
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert(`Successfully parsed ${file.name} using Gemini! Saved to Database.`);
        
        // 3. Inject real parsed fields into the UI
        const newFields: ExtractedField[] = data.document.fields.map((f: any) => ({
          id: f.id, 
          fieldKey: f.fieldKey, 
          label: f.label, 
          value: f.value,
          sourceDocName: file.name, 
          sourceDocPage: 1, 
          sourceDocSection: f.sourceDocSection,
          confidence: f.confidence, 
          aiExplanation: f.aiExplanation, 
          affordance: 'AI_EXTRACTED'
        }));
        
        setReturnsData(prev => prev.map(ret => {
          if (ret.id === selectedReturnId) {
            return { ...ret, fields: [...ret.fields, ...newFields] };
          }
          return ret;
        }));
        setIsOnboardingCompleted(true);
      } else {
        alert("Error: " + data.error);
      }
    } catch (error) {
      console.error(error);
      alert("Failed to upload document. Please check console.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* HEADER: Role-Aware Experience */}
      <header className="bg-slate-950 border-b border-slate-800 px-6 py-3 flex justify-between items-center z-20">
        <h1 className="font-bold text-lg text-white flex items-center gap-2">
          <Shield size={22} className="text-blue-500"/> TaxOS Workspace
        </h1>
        <div className="flex items-center space-x-3 bg-slate-900 border border-slate-800 p-1.5 rounded-xl">
          <span className="text-xs text-slate-400 font-medium px-2"><User size={14} className="inline"/> Role:</span>
          <select 
            value={currentRole}
            onChange={(e) => setCurrentRole(e.target.value as Role)}
            className="bg-slate-800 text-slate-200 text-xs rounded-lg px-3 py-1.5 outline-none"
          >
            <option value="CLIENT_NEW">Client (Onboarding)</option>
            <option value="PREPARER">Tax Preparer</option>
          </select>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* FIRST-TIME EXPERIENCE */}
        {currentRole === 'CLIENT_NEW' && !isOnboardingCompleted ? (
          <main className="flex-1 flex items-center justify-center p-8">
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-8 max-w-xl w-full shadow-2xl">
              <h2 className="text-2xl font-bold text-white mb-6">Upload your W-2 to start</h2>
              <div className="bg-blue-950/40 border-2 border-blue-500 rounded-xl p-5 flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-white">Upload Primary Income Statements</h4>
                  <p className="text-slate-400 text-xs">Our AI will auto-fill your numbers.</p>
                </div>
                <label className={`bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs px-4 py-2.5 rounded-lg flex items-center gap-1 cursor-pointer ${isUploading ? 'opacity-50' : ''}`}>
                  {isUploading ? "Processing..." : "Upload File"} <ArrowRight size={14} />
                  <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
                </label>
              </div>
            </div>
          </main>
        ) : (
          /* WORKSPACE (Actionable Dashboard & Complexity Made Navigable) */
          <div className="flex-1 flex overflow-hidden">
            <aside className="w-80 bg-slate-950 border-r border-slate-800 flex flex-col shrink-0">
              <div className="p-4 border-b border-slate-800">
                <h3 className="font-bold text-xs uppercase text-slate-400 mb-3">Action Queue</h3>
                <input 
                  type="text" placeholder="Search returns..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-xs rounded-lg px-3 py-2 outline-none mb-3"
                />
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-slate-900">
                {sortedReturns.map(item => (
                  <div key={item.id} onClick={() => setSelectedReturnId(item.id)} className={`p-4 cursor-pointer hover:bg-slate-900/60 ${item.id === selectedReturnId ? 'bg-slate-900 border-l-4 border-l-blue-500' : ''}`}>
                    <h4 className="font-semibold text-xs text-slate-200">{item.clientName}</h4>
                    <div className="text-[10px] text-slate-400 mb-2">{item.type}</div>
                    <div className="text-[10px] bg-slate-950 p-2 rounded border border-slate-800">
                      Owner: <strong>{item.actionOwner}</strong> | {item.status.replace('_', ' ')}
                    </div>
                  </div>
                ))}
              </div>
            </aside>

            <main className="flex-1 flex flex-col overflow-hidden bg-slate-900 p-6 space-y-6">
              {/* Affordance Legend */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex gap-4 text-xs font-medium">
                <span className="text-blue-400 flex items-center gap-1"><Sparkles size={14}/> AI Extracted</span>
                <span className="text-amber-400 flex items-center gap-1"><AlertTriangle size={14}/> Needs Review</span>
                <span className="text-slate-400 flex items-center gap-1"><Lock size={14}/> Read-Only</span>
              </div>

              {/* Form Line Items */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex-1 overflow-y-auto">
                <div className="divide-y divide-slate-800/60">
                  {activeReturn.fields.map(field => (
                    <div key={field.id} className="p-4 flex items-center justify-between hover:bg-slate-900/40">
                      <div>
                        <div className="text-sm font-semibold text-slate-200">{field.label}</div>
                        <div className="text-xs text-slate-500">Source: {field.sourceDocName}</div>
                      </div>
                      <div className="flex gap-3">
                        {field.affordance === 'AI_EXTRACTED' && (
                          <button onClick={() => setActiveField(field)} className="flex items-center gap-2 bg-blue-950/40 border border-dashed border-blue-500/60 text-blue-300 font-mono text-sm px-3 py-1.5 rounded-lg hover:bg-blue-900/40 transition-colors">
                            <Sparkles size={14} className="text-blue-400" /> {field.value} <span className="text-[10px] bg-blue-500/20 px-1.5 py-0.5 rounded">Trace</span>
                          </button>
                        )}
                        {field.affordance === 'LOCKED' && (
                          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 text-slate-500 font-mono text-sm px-3 py-1.5 rounded-lg">
                            <Lock size={14} /> {field.value}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </main>

            {/* TRACEABILITY DRAWER (Source Trace & Trustworthy AI) */}
            {activeField && (
              <aside className="w-[400px] bg-slate-950 border-l border-slate-800 flex flex-col shrink-0 shadow-2xl">
                <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                  <h3 className="font-bold text-xs text-slate-200 flex gap-2"><Sparkles size={16} className="text-blue-400"/> Trace Engine</h3>
                  <button onClick={() => setActiveField(null)}><X size={16} className="text-slate-500 hover:text-white"/></button>
                </div>
                <div className="p-5 space-y-4">
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                    <div className="text-[10px] text-slate-500 font-bold uppercase mb-2">Source Document</div>
                    <div className="text-xs font-semibold text-slate-200"><FileText size={14} className="inline text-blue-400"/> {activeField.sourceDocName}</div>
                    <div className="text-xs text-slate-400 mt-1">Found in: {activeField.sourceDocSection}</div>
                  </div>
                  
                  <div className="bg-blue-950/30 border border-blue-500/30 rounded-xl p-4">
                    <div className="text-[10px] text-slate-500 font-bold uppercase mb-2">AI Reasoning</div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-blue-400">Confidence</span>
                      <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">{(activeField.confidence * 100).toFixed(0)}%</span>
                    </div>
                    <p className="text-xs text-slate-300">{activeField.aiExplanation}</p>
                  </div>
                </div>
              </aside>
            )}
          </div>
        )}
      </div>
    </div>
  );
}