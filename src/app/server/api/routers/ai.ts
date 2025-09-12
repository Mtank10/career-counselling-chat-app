import { NextRequest } from 'next/server';
import { HuggingFaceServce } from '../../service/ai/huggingface';

const hfService = new HuggingFaceServce(process.env.HUGGINGFACE_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    // Convert messages to the format expected by our service
    const formattedMessages = messages.map((msg: any) => ({
      role: msg.role,
      content: msg.content,
    }));

    const response = await hfService.generateResponse(formattedMessages);

    return new Response(JSON.stringify({ response }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Hugging Face API error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process chat message' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}