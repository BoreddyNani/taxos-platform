// prisma/seed.ts
import { prisma } from '../lib/prisma'; // Import the shared client with the driver adapter
import { initialMockReturns } from '../lib/tax-data';

async function main() {
  // Clear existing data
  await prisma.commentThread.deleteMany();
  await prisma.extractedField.deleteMany();
  await prisma.taxReturn.deleteMany();

  console.log('Database cleared. Seeding new data to Supabase...');

  for (const ret of initialMockReturns) {
    await prisma.taxReturn.create({
      data: {
        id: ret.id,
        clientName: ret.clientName,
        type: ret.type,
        year: ret.year,
        status: ret.status,
        urgencyScore: ret.urgencyScore,
        assignedPreparer: ret.assignedPreparer,
        assignedReviewer: ret.assignedReviewer,
        actionOwner: ret.actionOwner,
        blockers: JSON.stringify(ret.blockers),
        fields: {
          create: ret.fields.map(field => ({
            id: field.id,
            fieldKey: field.fieldKey,
            label: field.label,
            value: field.value,
            sourceDocName: field.sourceDocName,
            sourceDocPage: field.sourceDocPage,
            sourceDocSection: field.sourceDocSection,
            calculationFormula: field.calculationFormula,
            confidence: field.confidence,
            aiExplanation: field.aiExplanation,
            affordance: field.affordance,
          }))
        },
        comments: {
          create: ret.comments.map(comment => ({
            id: comment.id,
            author: comment.author,
            role: comment.role,
            isInternal: comment.isInternal,
            text: comment.text,
            timestamp: comment.timestamp,
            targetFieldId: comment.targetFieldId,
          }))
        }
      }
    });
  }
  
  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });