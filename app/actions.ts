// app/actions.ts
"use server";

import { prisma } from '../lib/prisma';
import { TaxReturn } from '../lib/tax-data';

export async function getTaxReturns(): Promise<TaxReturn[]> {
  const returns = await prisma.taxReturn.findMany({
    include: {
      fields: true,
      comments: true,
    },
    orderBy: {
      urgencyScore: 'desc',
    },
  });

  // Explicitly map database objects to match frontend interfaces, omitting unneeded foreign keys
  return returns.map((ret) => ({
    id: ret.id,
    clientName: ret.clientName,
    type: ret.type,
    year: ret.year,
    status: ret.status as TaxReturn['status'],
    urgencyScore: ret.urgencyScore,
    assignedPreparer: ret.assignedPreparer,
    assignedReviewer: ret.assignedReviewer,
    actionOwner: ret.actionOwner as TaxReturn['actionOwner'],
    blockers: JSON.parse(ret.blockers),
    fields: ret.fields.map(f => ({
      id: f.id,
      fieldKey: f.fieldKey,
      label: f.label,
      value: f.value,
      sourceDocName: f.sourceDocName,
      sourceDocPage: f.sourceDocPage,
      sourceDocSection: f.sourceDocSection,
      calculationFormula: f.calculationFormula ?? undefined,
      confidence: f.confidence,
      aiExplanation: f.aiExplanation,
      affordance: f.affordance as any,
    })),
    comments: ret.comments.map(c => ({
      id: c.id,
      author: c.author,
      role: c.role as any,
      isInternal: c.isInternal,
      text: c.text,
      timestamp: c.timestamp,
      targetFieldId: c.targetFieldId ?? undefined,
    }))
  }));
}

export async function addCommentAction(
  returnId: string, 
  author: string, 
  role: string, 
  text: string, 
  isInternal: boolean
) {
  const newComment = await prisma.commentThread.create({
    data: {
      taxReturnId: returnId,
      author,
      role,
      text,
      isInternal,
      timestamp: 'Just now',
    }
  });
  return newComment;
}