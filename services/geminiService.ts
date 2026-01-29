
import { GoogleGenAI, Type } from "@google/genai";
import { Trade, AnalysisResult } from "../types";

export const analyzeJournal = async (trades: Trade[], balance: number): Promise<AnalysisResult> => {
  // Always initialize inside the function to use the latest environment key
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  if (trades.length === 0) {
    return {
      summary: "Your journal is empty.",
      strengths: ["Ready to start"],
      weaknesses: ["No data yet"],
      recommendation: "Log your first trade to get AI-powered insights."
    };
  }

  const tradeSummary = trades.slice(0, 50).map(t => 
    `Date: ${t.date}, Pair: ${t.pair}, Type: ${t.type}, PnL: ${t.pnl}, Result: ${t.status}, Setup: ${t.setup || 'N/A'}`
  ).join('\n');

  const prompt = `
    You are a professional forex trading mentor. Analyze the following recent trades for a student with a $${balance} account.
    
    Trades:
    ${tradeSummary}

    Provide a JSON response with performance summary, strengths, risks, and a recommendation.
  `;

  try {
    // Using gemini-3-pro-preview for complex reasoning task as per guidelines
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendation: { type: Type.STRING },
          },
          required: ["summary", "strengths", "weaknesses", "recommendation"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as AnalysisResult;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return {
        summary: "Unable to generate analysis at this time.",
        strengths: [],
        weaknesses: [],
        recommendation: "Please try again later."
    };
  }
};
