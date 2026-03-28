const systemInstruction = "You are Koddy, a smart coding assistant. You help students with coding explanations, debugging, and programming concepts. Be encouraging, professional, and concise. Use markdown for code blocks.";

export async function chatWithKoddy(history: {role: 'user' | 'model', parts: {text: string}[]}[], message: string) {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ history, message, systemInstruction })
    });
    
    if (response.ok) {
       const data = await response.json();
       if (data.text) return data.text;
       return "I couldn't generate a response.";
    } else {
       const errData = await response.json();
       return errData.error || "An error occurred contacting the chat API.";
    }
  } catch (e) {
    return "Error connecting to backend chat API. Please ensure the server is running.";
  }
}
