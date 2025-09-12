export class HuggingFaceService {
    private apiKey: string;
    private baseURL = 'https://api-inference.huggingface.co/models';

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    async generateCareerResponse(prompt: string, context: string = ''): Promise<string> {
        // Use a model suitable for career counseling - using a more specific model
        const model = "microsoft/DialoGPT-large"; // Better for conversational responses

        try {
            // Create a system prompt to guide the AI as a career counselor
            const systemPrompt = `You are a professional career counselor. Provide helpful, actionable career advice. 
Be supportive, practical, and focus on concrete steps the user can take. 
Keep your responses under 300 words and conversational.`;

            const fullPrompt = `${systemPrompt}

Previous conversation context:
${context}

User's question: ${prompt}

Career Counselor's response:`;

            const response = await fetch(`${this.baseURL}/${model}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    inputs: fullPrompt,
                    parameters: {
                        max_length: 500,
                        temperature: 0.7,
                        top_p: 0.9,
                        do_sample: true,
                        return_full_text: false,
                    },
                }),
            });

            if (!response.ok) {
                if (response.status === 503) {
                    // Model is loading, wait and retry
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    return this.generateCareerResponse(prompt, context);
                }
                throw new Error(`Hugging Face API error: ${response.statusText}`);
            }

            const data = await response.json();

            // Extract the generated text from the response
            if (Array.isArray(data) && data.length > 0 && data[0].generated_text) {
                let responseText = data[0].generated_text.trim();

                // Clean up the response if it includes the prompt
                if (responseText.includes("Career Counselor's response:")) {
                    responseText = responseText.split("Career Counselor's response:")[1].trim();
                }

                return responseText || "I'm here to help with your career questions. What specific area would you like to discuss?";
            }

            return "I'm here to help with your career questions. What would you like to discuss?";
        } catch (error) {
            console.error('Hugging Face API error:', error);
            return "I apologize, but I'm having trouble responding right now. Please try again in a moment.";
        }
    }

    async generateResponse(messages: Array<{ role: string, content: string }>): Promise<string> {
        // Format conversation history for the model (last 4 exchanges)
        let context = "";
        const recentMessages = messages.slice(-8); // Last 4 exchanges (each exchange has user + assistant)

        for (const message of recentMessages) {
            const speaker = message.role === 'user' ? 'User' : 'Career Counselor';
            context += `${speaker}: ${message.content}\n`;
        }

        // Get the latest user message
        const latestUserMessage = messages.filter(m => m.role === 'user').pop()?.content || "";

        return this.generateCareerResponse(latestUserMessage, context);
    }
}