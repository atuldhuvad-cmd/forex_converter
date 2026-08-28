import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
// Cloud Run provides the listening port through PORT. Keep 3000 for local use.
const PORT = Number(process.env.PORT) || 3000;

// High limit for PDF uploads / base64 statement data
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Server-side Gemini AI initialization
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    time: new Date().toISOString(),
  });
});

// AI-powered PDF / Image / Text Card Statement Parser Endpoint
app.post("/api/parse-statement", async (req, res) => {
  try {
    const { fileData, mimeType, fileName, textContent, defaultCurrency } = req.body;

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(400).json({
        error: "Gemini API key is not configured in server environment. You can enter transactions manually or use sample import.",
        code: "NO_API_KEY",
      });
    }

    const systemInstruction = `You are an expert financial document parser specialized in extracting transaction data from Forex Card Statements, Bank Account Statements, Credit Card Statements, and Travel Expense Receipts.
Your goal is to parse foreign currency statements (especially CAD, USD, EUR, GBP, AUD, etc.) and extract all individual expense/purchase and credit transactions accurately.
For each transaction, extract:
1. date: in YYYY-MM-DD format (if year is missing, assume current year or statement year)
2. description: clean merchant name or description (e.g., "Tim Hortons Toronto", "Uber Vancouver", "Walmart", "ATM Withdrawal CAD")
3. amount: numeric positive float for the transaction amount in foreign currency
4. currency: ISO 3-letter currency code (e.g., CAD, USD, EUR, INR)
5. type: "debit" for expenses/purchases/withdrawals, or "credit" for refunds/top-ups/reversals
6. category: best matching category from: ["Food & Dining", "Groceries", "Shopping", "Transit & Transport", "Accommodation", "Entertainment", "Utilities & Telecom", "Health & Medical", "Forex & ATM Fee", "Miscellaneous"]
7. foreignFee: any international transaction markup fee or ATM fee if explicitly mentioned as a separate fee (or 0)
8. rawText: original line item text

Also extract statement summary details:
- statementPeriod: e.g. "Aug 2026" or "01 Aug 2026 - 25 Aug 2026"
- cardLast4: last 4 digits of card if visible
- totalDebits: total debits in statement
- primaryCurrency: main currency of statement (e.g. CAD, USD)`;

    let contentsPayload: any;

    if (fileData && mimeType) {
      // Base64 file (PDF, PNG, JPEG, WEBP)
      contentsPayload = {
        parts: [
          {
            inlineData: {
              data: fileData,
              mimeType: mimeType,
            },
          },
          {
            text: `Please parse this card statement document completely. Extract all individual transaction records. Preferred currency if unclear: ${defaultCurrency || "CAD"}. Return the result in strictly valid JSON matching the schema.`,
          },
        ],
      };
    } else if (textContent) {
      contentsPayload = {
        parts: [
          {
            text: `Parse the following raw statement text/CSV export and extract all transaction records:\n\n${textContent}\n\nPreferred currency: ${defaultCurrency || "CAD"}.`,
          },
        ],
      };
    } else {
      return res.status(400).json({ error: "Missing fileData or textContent in request payload." });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: contentsPayload,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            statementPeriod: { type: Type.STRING, description: "Statement period or date range" },
            cardLast4: { type: Type.STRING, description: "Last 4 digits of forex/bank card" },
            primaryCurrency: { type: Type.STRING, description: "Primary currency code e.g. CAD" },
            totalDebits: { type: Type.NUMBER, description: "Total debits found in document" },
            transactions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  date: { type: Type.STRING, description: "Date in YYYY-MM-DD" },
                  description: { type: Type.STRING, description: "Merchant or line item description" },
                  amount: { type: Type.NUMBER, description: "Transaction amount (positive number)" },
                  currency: { type: Type.STRING, description: "ISO 3-letter currency code, e.g. CAD" },
                  type: { type: Type.STRING, description: "'debit' for expense or 'credit' for refund/top-up" },
                  category: { type: Type.STRING, description: "One of the standard categories" },
                  foreignFee: { type: Type.NUMBER, description: "Fee amount if applicable" },
                  rawText: { type: Type.STRING, description: "Original snippet" },
                },
                required: ["date", "description", "amount", "currency", "type", "category"],
              },
            },
          },
          required: ["transactions"],
        },
      },
    });

    const responseText = response.text || "{}";
    const parsed = JSON.parse(responseText);

    return res.json({
      success: true,
      data: parsed,
      fileName: fileName || "statement.pdf",
    });
  } catch (error: any) {
    console.error("Statement parsing error:", error);
    return res.status(500).json({
      error: error?.message || "Failed to process statement with Gemini AI",
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Forex PWA Server running on port ${PORT}`);
  });
}

startServer();
