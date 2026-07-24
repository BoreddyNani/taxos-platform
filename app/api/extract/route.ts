import { NextResponse } from 'next/server';
import { PrismaClient } from '../../generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import { GoogleGenAI } from '@google/genai'; // Correctly import from the unified SDK

// Initialize Prisma 
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL as string });
const prisma = new PrismaClient({ adapter });

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let { base64Data, mimeType, fileName = 'tax_document.pdf' } = body;

    // Guard Checks
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is not configured' }, { status: 500 });
    }
    if (!base64Data) {
      return NextResponse.json({ error: 'No image data provided' }, { status: 400 });
    }

    // 2. Strip the data URI prefix if the frontend sent it by mistake
    if (base64Data.includes(',')) {
      base64Data = base64Data.split(',')[1];
    }

    // 3. Initialize the Gemini Client
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    // 4. Define the strict JSON schema you want Gemini to extract
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

    // 5. Call generateContent using the multimodal array input
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          inlineData: {
            data: base64Data,
            mimeType: mimeType
          }
        },
        'You are a highly accurate tax assistant. Extract the requested fields from this document into structured JSON.'
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: taxDataSchema
      }
    });

    // 6. Parse the strictly generated JSON
    const extractedData = JSON.parse(response.text || "{}");

    // 7. Map Gemini's flat JSON response into the array format your Prisma model expects
    const extractedFields = Object.entries(extractedData).map(([key, value]) => ({
      fieldKey: key,
      label: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1').trim(), // Formats 'taxYear' to 'Tax Year'
      value: String(value),
      sourceDocSection: 'Document Body',
      confidence: 0.95, 
      aiExplanation: 'Extracted securely via Gemini Structured Output'
    }));

    // 8. Save directly to Postgres via Prisma
    const document = await prisma.document.create({
      data: {
        fileName: fileName,
        fields: {
          create: extractedFields.map((field: any) => ({
            fieldKey: field.fieldKey || 'unknown',
            label: field.label || 'Unknown Field',
            value: String(field.value || ''),
            sourceDocSection: field.sourceDocSection || 'Unknown',
            confidence: parseFloat(field.confidence) || 0.5,
            aiExplanation: field.aiExplanation || 'Extracted via AI',
            affordance: 'AI_EXTRACTED'
          }))
        }
      },
      include: { fields: true }
    });

    return NextResponse.json({ success: true, document });

  } catch (error: any) {
    console.error("Extraction Error:", error);
    return NextResponse.json({ error: error.message || "Failed to parse document" }, { status: 500 });
  }
}