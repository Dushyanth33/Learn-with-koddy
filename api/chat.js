import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Only use the secure server-side environment variable.
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: '🚨 API Key is missing in Vercel Environment Variables. Please add GEMINI_API_KEY.' });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Updated models for 2026 API standards
    const modelsToTry = ["gemini-2.0-flash", "gemini-2.5-flash", "gemini-flash-latest"];
    let lastError = null;

    for (const modelName of modelsToTry) {
        try {
            const model = genAI.getGenerativeModel({ 
                model: modelName,
                systemInstruction: req.body.systemInstruction || "You are Koddy, a smart coding assistant. You help students with coding explanations, debugging, and programming concepts. Be encouraging, professional, and concise. Use markdown for code blocks."
            });

            const chatSession = model.startChat({
                history: req.body.history || [],
                generationConfig: { temperature: 0.7 }
            });

            const result = await chatSession.sendMessage(req.body.message || "");
            return res.status(200).json({ text: result.response.text() });
        } catch (error) {
            lastError = error;
            // If it's a 404 meaning model not found, try the next one
            if (!error?.message?.includes("is not found") && !error?.message?.includes("404")) {
                if(error?.message?.includes("API key not valid") || error?.message?.includes("PERMISSION_DENIED")) {
                  break; // Stop immediately if API key is invalid
                }
            }
        }
    }
    
    throw lastError;
  } catch (error) {
    console.error("Gemini Backend Error:", error);
    return res.status(500).json({ error: `Backend Google API Error: ${error.message}` });
  }
}
