

import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '@/lib/trpc/server';
import {GoogleGeminiService } from '@/server/service/ai/aiservice';

const openaiService = new GoogleGeminiService();

export const chatRouter = createTRPCRouter({
  createSession: protectedProcedure
    .input(z.object({ title: z.string().optional() }))
    .mutation(async ({ ctx }) => {
      if (!ctx.session.user) {
        throw new Error('User not authenticated');
      }
      
      return ctx.db.chat_sessions.create({
        data: {
          title: 'New Conversation',
          user_id: ctx.session.user.id,
        },
      });
    }),

  getSessions: protectedProcedure
    .query(async ({ ctx }) => {
      if (!ctx.session.user.id) {
        throw new Error('User not authenticated');
      }

      return ctx.db.chat_sessions.findMany({
        where: { 
          user_id: ctx.session.user.id,
          is_active: true 
        },
        orderBy: { updated_at: 'desc' },
        include: {
          messages: {
            orderBy: { created_at: 'asc' },
            take: 1,
          },
        },
      });
    }),

  getSession: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.session.user.id) {
        throw new Error('User not authenticated');
      }

      const session = await ctx.db.chat_sessions.findFirst({
        where: { 
          id: input.id,
          user_id: ctx.session.user.id 
        },
        include: {
          messages: {
            orderBy: { created_at: 'asc' },
          },
        },
      });

      if (!session) {
        throw new Error('Session not found or access denied');
      }

      return session;
    }),

  sendMessage: protectedProcedure
    .input(z.object({
      sessionId: z.string(),
      message: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session.user.id) {
        throw new Error('User not authenticated');
      }

      // Verify the user owns this session
      const session = await ctx.db.chat_sessions.findFirst({
        where: { 
          id: input.sessionId,
          user_id: ctx.session.user.id 
        },
      });

      if (!session) {
        throw new Error('Session not found or access denied');
      }

      // Create user message
      const userMessage = await ctx.db.messages.create({
        data: {
          chat_session_id: input.sessionId,
          role: 'user',
          content: input.message,
          sequence_number: (await ctx.db.messages.count({
            where: { chat_session_id: input.sessionId },
          })) + 1,
        },
      });
      const messageCount = await ctx.db.messages.count({
        where: { chat_session_id: input.sessionId },
      });
      
       // Update session title if it's the first message
      if (messageCount === 0) {
        const title = input.message.length > 40 
          ? input.message.substring(0, 40) + '...' 
          : input.message;
        
        await ctx.db.chat_sessions.update({
          where: { id: input.sessionId },
          data: { title, updated_at: new Date() },
        });
      } else {
        // Just update the timestamp
        await ctx.db.chat_sessions.update({
          where: { id: input.sessionId },
          data: { updated_at: new Date() },
        });
      }
      

      // Get conversation history for context
      const previousMessages = await ctx.db.messages.findMany({
        where: { chat_session_id: input.sessionId },
        orderBy: { created_at: 'asc' },
      });

      // Format messages for AI
      const messagesForAI = previousMessages.map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

      // Add the current user message
      messagesForAI.push({ role: 'user', content: input.message });

      // Generate AI response using Hugging Face
      const aiResponse = await openaiService.generateResponse(messagesForAI);

      // Create AI message
      const aiMessage = await ctx.db.messages.create({
        data: {
          chat_session_id: input.sessionId,
          role: 'assistant',
          content: aiResponse,
          sequence_number: userMessage.sequence_number + 1,
        },
      });

      // Update session title if it's the first message
      if (previousMessages.length === 0) {
        const title = input.message.length > 40 
          ? input.message.substring(0, 40) + '...' 
          : input.message;
        
        await ctx.db.chat_sessions.update({
          where: { id: input.sessionId },
          data: { title },
        });
      }

      return {
        userMessage,
        aiMessage,
      };
    }),

  deleteSession: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session.user.id) {
        throw new Error('User not authenticated');
      }

      const session = await ctx.db.chat_sessions.findFirst({
        where: { 
          id: input.id,
          user_id: ctx.session.user.id 
        },
      });

      if (!session) {
        throw new Error('Session not found or access denied');
      }

      return ctx.db.chat_sessions.update({
        where: { id: input.id },
        data: { is_active: false },
      });
    }),
});