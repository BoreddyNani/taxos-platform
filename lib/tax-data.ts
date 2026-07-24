// lib/tax-data.ts

export type Role = 'CLIENT_NEW' | 'CLIENT_RETURNING' | 'PREPARER' | 'REVIEWER' | 'ADMIN';
export type ReturnStatus = 'AWAITING_DOCS' | 'IN_PREPARATION' | 'IN_REVIEW' | 'READY_TO_SIGN' | 'FILED';
export type DataAffordance = 'AI_EXTRACTED' | 'VERIFIED' | 'NEEDS_APPROVAL' | 'LOCKED' | 'HUMAN_EDITED';

export interface ExtractedField {
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
}

export interface CommentThread {
  id: string;
  author: string;
  role: 'Client' | 'CPA' | 'Reviewer';
  isInternal: boolean;
  text: string;
  timestamp: string;
  targetFieldId?: string;
}

export interface TaxReturn {
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

export const initialMockReturns: TaxReturn[] = [
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
      { 
        id: 'c1', 
        author: 'Sarah Jenkins', 
        role: 'CPA', 
        isInternal: true, 
        text: 'AI flagged a discrepancy between the provided W-2 summary and the state tax table. Need to review this before sending to the client.', 
        timestamp: '10 mins ago', 
        targetFieldId: 'f1' 
      },
      { 
        id: 'c2', 
        author: 'David Miller', 
        role: 'Reviewer', 
        isInternal: true, 
        text: 'Looks like the statutory minimum applies here. Can you verify?', 
        timestamp: '5 mins ago', 
        targetFieldId: 'f2' 
      }
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
        aiExplanation: 'Matched line items across payroll summaries to aggregate total gross wages.',
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
        aiExplanation: 'Statutory minimum value based on entity type.',
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