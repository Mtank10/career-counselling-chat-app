import { GoogleGenAI } from "@google/genai";

export class GoogleGeminiService {
  private ai;

  constructor() {
    // Automatically reads GEMINI_API_KEY from environment
    this.ai = new GoogleGenAI({});
  }

  async generateCareerResponse(messages: Array<{ role: string, content: string }>): Promise<string> {
  const systemPrompt = `You are a professional career counselor. Provide helpful, actionable career advice. Be supportive, practical, and focus on concrete steps the user can take. 

Format your responses with:
- Clear paragraphs separated by double line breaks
- Use bullet points (•) for lists when appropriate
- Keep responses under 300 words and conversational
- Make your advice specific and actionable

`;
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

      // Format the response for better readability
      let formattedResponse = response.text.trim();
      
      // Ensure proper paragraph spacing
      formattedResponse = formattedResponse.replace(/\n\n+/g, '\n\n');
      
      // Convert numbered lists to bullet points for consistency
      formattedResponse = formattedResponse.replace(/^\d+\.\s/gm, '• ');
      
      return formattedResponse;
    } catch (error:unknown) {
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
