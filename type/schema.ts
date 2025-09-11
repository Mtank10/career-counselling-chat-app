interface User {
    id: string,
    email:string,
    name: string
    createdAt: Date
    updatedAt: Date
}

interface ChatSession {
    id: string,
    userId: string,
    title: string,
    topic?: string,
    createdAt: Date,
    updatedAt: Date
}

interface Message {
    id: string,
    chatSessionId: string,
    role: 'user' | 'assistant' | 'system',
    content: string,
    ai_model?: string,
    tokens?: number,
    createdAt: Date,
    sequenceNumber: number
}

interface ChatResponse {
    message: Message,
    session: ChatSession
}

interface ChatHistoryResponse {
    sessions: ChatSession[],
    totalCount: number
}