import { NextResponse } from 'next/server';
import { Prisma, PrismaClient } from '../../generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import { GoogleGenAI } from '@google/genai'; // Correctly import from the unified SDK

// Initialize Prisma 
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL as string });
const prisma = new PrismaClient({ adapter });

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let { base64Data, mimeType = 'application/pdf', fileName = 'tax_document.pdf' } = body;

    // 1. Rigorous Input Guard Checks
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is not configured' }, { status: 500 });
    }
    if (!base64Data || typeof base64Data !== 'string' || base64Data.trim() === '') {
      return NextResponse.json({ error: 'No valid document data provided from frontend' }, { status: 400 });
    }

    // Strip the data URI prefix if present (e.g., "data:application/pdf;base64,...")
    if (base64Data.includes(',')) {
      base64Data = base64Data.split(',')[1];
    }

    // 2. Initialize Gemini Client
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const taxDataSchema = {
      type: "object",
      properties: {
        taxpayerName: { type: "string" },
        taxYear: { type: "integer" },
        documentType: { type: "string" },
        wages: { type: "number" },
        taxWithheld: { type: "number" }
      },
      required: ["taxpayerName", "documentType", "wages", "taxWithheld"]
    };

    // 3. Isolate the Gemini API call with explicit error trapping
    let response;
    try {
      response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType || 'application/pdf'
            }
          },
          'You are a highly accurate tax assistant. Extract the requested fields from this document into structured JSON.'
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: taxDataSchema
        }
      });
    } catch (aiError: any) {
      console.error("Gemini Extraction Error:", aiError);
      return NextResponse.json(
        { error: `AI Extraction Failed: ${aiError.message || 'The document could not be processed or has no readable pages.'}` },
        { status: 400 }
      );
    }

    const responseText = response.text || "{}";
    const extractedData = JSON.parse(responseText);

    // 4. Map fields safely with strict default values to prevent null constraint violations
    const extractedFields = Object.entries(extractedData).map(([key, value]) => ({
      fieldKey: key,
      label: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1').trim(),
      value: value !== null && value !== undefined ? String(value) : 'N/A',
      sourceDocName: fileName,
      sourceDocPage: 1,
      sourceDocSection: 'Document Body',
      confidence: 0.95,
      aiExplanation: 'Extracted securely via Gemini Structured Output',
      affordance: 'AI_EXTRACTED'
    }));

    if (extractedFields.length === 0) {
      return NextResponse.json({ error: 'No fields could be extracted from the document.' }, { status: 400 });
    }

    // 5. Save securely to PostgreSQL via Prisma
    const document = await prisma.document.create({
      data: {
        fileName: fileName,
        fields: {
          create: extractedFields.map(field => ({
            fieldKey: field.fieldKey,
            label: field.label,
            value: field.value,
            sourceDocName: field.sourceDocName,
            sourceDocPage: field.sourceDocPage,
            sourceDocSection: field.sourceDocSection,
            confidence: field.confidence,
            aiExplanation: field.aiExplanation,
            affordance: field.affordance
          }))
        }
      },
      include: { fields: true }
    });

    return NextResponse.json({ success: true, document });

  } catch (error: any) {
    console.error("Server Route Error:", error);
    return NextResponse.json({ error: error.message || "Failed to process document upload" }, { status: 500 });
  }
}