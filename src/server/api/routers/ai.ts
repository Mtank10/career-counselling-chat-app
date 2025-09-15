import { NextRequest } from 'next/server';
import { GoogleGeminiService } from '@/server/service/ai/aiservice'; // Point to new service
const openaiService = new GoogleGeminiService();

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    // OpenAI expects an array of { role, content }
    interface Message {
      role: string;
      content: string;
    }

    const formattedMessages: Message[] = messages.map((msg: Message) => ({
      role: msg.role,
      content: msg.content,
    }));

    const response = await openaiService.generateResponse(formattedMessages);

    return new Response(JSON.stringify({ response }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('OpenAI API error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process chat message' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
