export class HuggingFaceServce{
    private apiKey:string;
    private baseURL = 'https://api-inference.huggingface.co/models';

    constructor(apiKey:string){
        this.apiKey = apiKey;
        
    }

    async generateCareerResponse(prompt:string,context:string =''):Promise<string>{
        const model = "microsoft/DialoGPT-medium";

        try{
            const response = await fetch(`${this.baseURL}/${model}`,{
                method:'POST',
                headers:{
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    inputs: `${context} User: ${prompt} Assistant:`,
                    parameters:{
                        max_length:500,
                        return_full_text:false,
                    }
                })
            });
            if(!response.ok){
                if(response.status === 503){
                    await new Promise(resolve=>setTimeout(resolve,5000));
                    return this.generateCareerResponse(prompt,context);
                }
                throw new Error(`HuggingFace API error: ${response.statusText}`);
            }
            const data = await response.json();

            if(Array.isArray(data) && data.length > 0 && data[0].generated_text){
                return data[0].generated_text.trim();
            }

            return "I'm here to help with your career questions. What would you like to discuss?"
        }
        catch(error){
            console.error('Error communicating with HuggingFace API:',error);
            return "I'm having trouble connecting to the AI service right now. Please try again later.";
        }  
    }

    async generateResponse(messages: Array<{role: string, content: string}>): Promise<string> {
    // Format conversation history for the model
    let conversation = "";
    for (const message of messages.slice(-6)) { // Use last 6 messages for context
      conversation += `${message.role === 'user' ? 'User' : 'Assistant'}: ${message.content}\n`;
    }
    
    const prompt = `${conversation}Assistant:`;
    
    return this.generateCareerResponse("", prompt);
  }
}