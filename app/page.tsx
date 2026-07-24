"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Shield, Sparkles, User, Lock } from 'lucide-react';
import { initialMockReturns, Role, TaxReturn, ExtractedField } from '../lib/tax-data';
import { ActionQueue } from '../components/ActionQueue';
import { CollaborationPanel } from '../components/CollaborationPanel';
import { Onboarding } from '../components/Onboarding';
import { TraceEngineDrawer } from '../components/TraceEngineDrawer';
import { getTaxReturns, addCommentAction } from './actions';

// Helper for file uploads
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

export default function TaxPlatformApp() {
  // Global State
  const [currentRole, setCurrentRole] = useState<Role>('PREPARER');
  const [returnsData, setReturnsData] = useState<TaxReturn[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Navigation & UI State
  const [selectedReturnId, setSelectedReturnId] = useState<string>('ret-101');
  const [workspaceTab, setWorkspaceTab] = useState<'FORM' | 'COLLAB'>('FORM');
  const [activeField, setActiveField] = useState<ExtractedField | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Onboarding State
  const [isOnboardingCompleted, setIsOnboardingCompleted] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
      useEffect(() => {
        async function loadData() {
          const data = await getTaxReturns();
          setReturnsData(data);
          if (data.length > 0) setSelectedReturnId(data[0].id);
          setIsLoading(false);
        }
        loadData();
      }, []);

  // Derived State
  const activeReturn = useMemo(() => 
    returnsData.find(r => r.id === selectedReturnId) || returnsData[0], 
  [selectedReturnId, returnsData]);

  const filteredReturns = useMemo(() => {
    return returnsData
      .filter(r => r.clientName.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => b.urgencyScore - a.urgencyScore);
  }, [searchTerm, returnsData]);

  // Handlers
  const handleAddComment = async (text: string, isInternal: boolean) => {
    const isClient = currentRole === 'CLIENT_NEW' || currentRole === 'CLIENT_RETURNING';
    const author = isClient ? 'Client User' : 'Sarah Jenkins';
    const roleString = isClient ? 'Client' : 'CPA';

    // 1. Optimistic UI update (feels instant to the user)
    const optimisticComment = {
      id: `temp-${Date.now()}`,
      author,
      role: roleString as any,
      isInternal,
      text,
      timestamp: 'Just now'
    };

    setReturnsData(prev => prev.map(ret =>
      ret.id === selectedReturnId
        ? { ...ret, comments: [...ret.comments, optimisticComment] }
        : ret
    ));

    // 2. Persist to database
    await addCommentAction(selectedReturnId, author, roleString, text, isInternal);
  };

  const handleViewField = (fieldId: string) => {
    const field = activeReturn.fields.find(f => f.id === fieldId);
    if (field) {
      setWorkspaceTab('FORM');
      setActiveField(field);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const base64Data = await fileToBase64(file);
      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, base64Data, mimeType: file.type })
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert(`Successfully parsed ${file.name}!`);
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
        
        setReturnsData(prev => prev.map(ret => 
          ret.id === selectedReturnId ? { ...ret, fields: [...ret.fields, ...newFields] } : ret
        ));
        setIsOnboardingCompleted(true);
      } else {
        alert("Error: " + data.error);
      }
    } catch (error) {
      console.error(error);
      alert("Simulated backend upload failed. Check network tab.");
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-blue-400">
        <Shield size={48} className="animate-pulse mb-4" />
        <p>Loading Workspace...</p>
      </div>
    );
  }

  if (!activeReturn) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400">
        No tax returns found in the database.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans h-screen">
      {/* HEADER */}
      <header className="bg-slate-950 border-b border-slate-800 px-6 py-3 flex justify-between items-center z-20 shrink-0">
        <h1 className="font-bold text-lg text-white flex items-center gap-2">
          <Shield size={22} className="text-blue-500"/> TaxOS Workspace
        </h1>
        <div className="flex items-center space-x-3 bg-slate-900 border border-slate-800 p-1.5 rounded-xl">
          <span className="text-xs text-slate-400 font-medium px-2"><User size={14} className="inline mr-1"/> Role:</span>
          <select 
            value={currentRole}
            onChange={(e) => {
              setCurrentRole(e.target.value as Role);
              setActiveField(null);
            }}
            className="bg-slate-800 text-slate-200 text-xs rounded-lg px-3 py-1.5 outline-none"
          >
            <option value="CLIENT_NEW">Client (New)</option>
            <option value="CLIENT_RETURNING">Client (Returning)</option>
            <option value="PREPARER">Tax Preparer</option>
          </select>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {currentRole === 'CLIENT_NEW' && !isOnboardingCompleted ? (
          <Onboarding isUploading={isUploading} onFileUpload={handleFileUpload} />
        ) : (
          <div className="flex-1 flex overflow-hidden">
            <ActionQueue 
              returns={filteredReturns}
              selectedId={selectedReturnId}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              onSelect={(id) => {
                setSelectedReturnId(id);
                setActiveField(null);
              }}
            />

            <main className="flex-1 flex flex-col overflow-hidden bg-slate-900 p-6 space-y-4">
              {/* Workspace Navigation Tabs */}
              <div className="flex gap-4 border-b border-slate-800 pb-2 shrink-0">
                <button 
                  onClick={() => setWorkspaceTab('FORM')}
                  className={`text-sm font-semibold pb-2 transition-colors ${workspaceTab === 'FORM' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Extracted Data Fields
                </button>
                <button 
                  onClick={() => setWorkspaceTab('COLLAB')}
                  className={`text-sm font-semibold pb-2 flex items-center gap-2 transition-colors ${workspaceTab === 'COLLAB' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Collaboration 
                  <span className="bg-slate-800 text-xs px-2 py-0.5 rounded-full">{activeReturn.comments.length}</span>
                </button>
              </div>

              {workspaceTab === 'FORM' ? (
                <div className="flex flex-col flex-1 overflow-hidden space-y-4">
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex gap-4 text-xs font-medium shrink-0">
                    <span className="text-blue-400 flex items-center gap-1"><Sparkles size={14}/> AI Extracted</span>
                    <span className="text-slate-400 flex items-center gap-1"><Lock size={14}/> Read-Only</span>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-y-auto flex-1">
                    <div className="divide-y divide-slate-800/60">
                      {activeReturn.fields.map(field => (
                        <div key={field.id} className="p-4 flex items-center justify-between hover:bg-slate-900/40 transition-colors">
                          <div>
                            <div className="text-sm font-semibold text-slate-200">{field.label}</div>
                            <div className="text-xs text-slate-500 mt-1">Source: {field.sourceDocName}</div>
                          </div>
                          <div className="flex gap-3">
                            {field.affordance === 'AI_EXTRACTED' && (
                              <button 
                                onClick={() => setActiveField(field)} 
                                className="flex items-center gap-2 bg-blue-950/40 border border-dashed border-blue-500/60 text-blue-300 font-mono text-sm px-3 py-1.5 rounded-lg hover:bg-blue-900/60 transition-colors"
                              >
                                <Sparkles size={14} className="text-blue-400" /> {field.value} 
                                <span className="text-[10px] bg-blue-500/20 px-1.5 py-0.5 rounded">Trace AI</span>
                              </button>
                            )}
                            {field.affordance === 'LOCKED' && (
                              <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 text-slate-500 font-mono text-sm px-3 py-1.5 rounded-lg cursor-not-allowed">
                                <Lock size={14} /> {field.value}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      {activeReturn.fields.length === 0 && (
                        <div className="p-8 text-center text-slate-500 text-sm">No data fields extracted yet.</div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <CollaborationPanel 
                  comments={activeReturn.comments} 
                  role={currentRole} 
                  onAddComment={handleAddComment}
                  onViewField={handleViewField}
                />
              )}
            </main>

            {activeField && workspaceTab === 'FORM' && (
              <TraceEngineDrawer 
                field={activeField} 
                onClose={() => setActiveField(null)} 
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}


