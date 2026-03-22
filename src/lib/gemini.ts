import { GoogleGenerativeAI } from '@google/generative-ai';

// MUST be provided via environment variables in Vercel
const rawApiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
const cleanApiKey = rawApiKey.replace(/^["'`]+|["'`]+$/g, '').trim();

let genAI: GoogleGenerativeAI | null = null;
if (cleanApiKey) {
  genAI = new GoogleGenerativeAI(cleanApiKey);
}

const systemInstruction = "You are Koddy, a smart coding assistant. You help students with coding explanations, debugging, and programming concepts. Be encouraging, professional, and concise. Use markdown for code blocks.";

export async function chatWithKoddy(history: {role: 'user' | 'model', parts: {text: string}[]}[], message: string) {
  
  // 1. Try hitting the secure Vercel backend proxy first
  // This bypasses entirely all strict Browser AdBlockers / CORS issues
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ history, message, systemInstruction })
    });
    
    if (response.ok) {
       const data = await response.json();
       if (data.text) return data.text;
    } else {
       const errData = await response.json();
       // Only specifically throw if the backend complained about the API key,
       // otherwise let it fall through to local fallback.
       if (response.status === 500 && errData.error?.includes('API Key is missing')) {
           return errData.error;
       }
    }
  } catch (e) {
    // Ignore fetch errors to /api/chat. (It returns 404 in `npm run dev` locally)
  }

  // 2. Fallback to direct browser call (for local Vite dev testing)
  if (!genAI) {
    return "🚨 Setup Error: VITE_GEMINI_API_KEY is completely missing from your deployed build! Please go to Vercel Settings -> Environment Variables, add VITE_GEMINI_API_KEY, and click REDEPLOY.";
  }

  // Updated fallback chain for modern 2026 Google API regions and key tiers
  const modelsToTry = ["gemini-2.0-flash", "gemini-2.5-flash", "gemini-flash-latest"];
  let lastError: any = null;

  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({ 
        model: modelName, 
        systemInstruction
      });
      
      const chatSession = model.startChat({
        history: history,
        generationConfig: { temperature: 0.7 }
      });

      const result = await chatSession.sendMessage(message);
      return result.response.text() || "I couldn't generate a response.";
    } catch (error: any) {
      console.warn(`Local model ${modelName} failed:`, error?.message);
      lastError = error;
      if (!error?.message?.includes("is not found") && !error?.message?.includes("404")) {
         if(error?.message?.includes("API key not valid") || error?.message?.includes("PERMISSION_DENIED")) {
           break;
         }
      }
    }
  }

  console.error("All local Gemini models failed. Last Error:", lastError);
  return `API Key detected, but Google rejected the local request: ${(lastError?.message || "Unknown error").substring(0,100)}... Ensure you aren't using Brave Shields/Adblockers.`;
}
