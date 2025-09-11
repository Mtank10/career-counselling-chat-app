import {z} from "zod";
import { createTRPCRouter,publicProcedure } from "../../trpc";


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
            orderBy: { sequenceNumber: 'asc' },
          },
        },
      });
    }),

    
        
})