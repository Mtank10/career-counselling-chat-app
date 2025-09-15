import { GoogleGenAI } from "@google/genai";

export class GoogleGeminiService {
  private ai;

  constructor() {
    // Automatically reads GEMINI_API_KEY from environment
    this.ai = new GoogleGenAI({});
  }

  async generateCareerResponse(messages: Array<{ role: string, content: string }>): Promise<string> {
  const systemPrompt = `You are a professional career counselor. Provide helpful, actionable career advice. Be supportive, practical, and focus on concrete steps the user can take. Keep your responses under 300 words and conversational.\n\n`;
  const promptText = systemPrompt +
    messages.map(msg => (msg.role === "user" ? "User" : "Career Counselor") + ": " + msg.content).join("\n") +
    "\nCareer Counselor:";

  const maxRetries = 3;
  const retryDelay = 3000; // 3 seconds

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: promptText,
       
      });

      return response.text.trim();
    } catch (error) {
      const err = error as { code?: number; message?: string };
      if (err?.code === 503 && attempt < maxRetries) {
        console.warn(`Model overloaded, retrying attempt ${attempt} after delay...`);
        await new Promise(res => setTimeout(res, retryDelay));
      } else {
        console.error("Google Gemini API error:", error);
        return "Sorry, the service is temporarily unavailable. Please try again shortly.";
      }
    }
  }

  return "Sorry, the service is temporarily unavailable. Please try again shortly.";
}

  async generateResponse(messages: Array<{ role: string; content: string }>): Promise<string> {
    return this.generateCareerResponse(messages);
  }
}
