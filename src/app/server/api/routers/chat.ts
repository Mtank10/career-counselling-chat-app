import {z} from "zod";
import { createTRPCRouter,publicProcedure } from "../../trpc";
import { HuggingFaceServce } from "../../service/ai/huggingface";

const hfService = new HuggingFaceServce(process.env.HUGGINGFACE_API_KEY!);

export const chatRouter = createTRPCRouter({
    createSession: publicProcedure
        .input(z.object({
            title: z.string().optional(),
            topic: z.string().optional(),
        }))
      .mutation(async ({ctx,input})=>{
        const session = await ctx.db.chatSession.create({
            data:{
                title: input.title || "New Chat",
                topic: input.topic
            }
        })
        return session;
      }),
      
      getSessions: publicProcedure
        .input(z.object({
            limit:z.number().default(10),cursor:z.string().optional()
        }))
        .query(async ({ctx,input})=>{
           const sessions = await ctx.db.chatSession.findMany({
            where:{isActive:true},
            orderBy:{createdAt:"desc"},
            take: input.limit + 1,
            cursor: input.cursor ? {id:input.cursor} :undefined,
            include:
            {
                messages:{
                    orderBy:{sequenceNumber:"asc"},
                    take:1
                },
                _count:{
                    select:{messages:true}
                }
            }
           })

              let nextCursor: typeof input.cursor | undefined = undefined;
                if (sessions.length > input.limit) {
                    const nextItem = sessions.pop();
                    nextCursor = nextItem!.id;
                }
              return {sessions,nextCursor};
        }),

        getSession: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.chatSession.findUnique({
        where: { id: input.id },
        include: {
          messages: {
            orderBy: { sequence_number: 'asc' },
          },
        },
      });
    }),

    sendMessage: publicProcedure
    .input(z.object({
        sessionId: z.string(),
        message:z.string().min(1),
    }))
    .mutation(async ({ctx,input})=>{
      const userMessage = await ctx.db.chatMessage.create({
        data:{
          chat_session_id: input.sessionId,
          role: "user",
          content: input.message,
          sequence_number: 1 + (await ctx.db.chatMessage.count({where:{chatSessionId:input.sessionId}}))
        }
      });

      //get conversation history for context
      const previousMessages = await ctx.db.message.findMany({
        where:{chat_session_id:input.sessionId},
        orderBy:{sequenceNumber:"desc"}
      });

      //format messages for hugging face api
      interface PreviousMessage {
        role: string;
        content: string;
      }

      const messageForAI: PreviousMessage[] = previousMessages.map((msg: PreviousMessage) => ({
        role: msg.role,
        content: msg.content,
      }));

      //add the current user message
      messageForAI.push({
        role:"user",
        content: input.message,
      });

      //generate ai respone using hugging face
      const aiResponse = await hfService.generateResponse(messageForAI);

      //create ai message
      const aiMessage = await ctx.db.chatMessage.create({
        data:{
          chat_session_id: input.sessionId,
          role: "assistant",
          content: aiResponse,        
          sequence_number: 1 + (await ctx.db.chatMessage.count({where:{chatSessionId:input.sessionId}}))
        }
      });

      if(previousMessages.length ===0){
        const title = input.message.slice(0,40);
        await ctx.db.chatSession.update({
          where:{id:input.sessionId},
          data:{title:title.length<input.message.length?title+"...":title}
        });
      }

      return {
        userMessage,
        aiMessage
      }
    })
        
})