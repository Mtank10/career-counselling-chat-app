import {z} from "zod";
import { createTRPCRouter,publicProcedure } from "../../trpc";

import { hashPassword,verifyPassword } from "../../utils";
import { db } from "../../db";

export const authRouter = createTRPCRouter({
    signUp: publicProcedure
    .input(z.object({
        email: z.string().email(),
        name: z.string().min(2).max(100),
        password: z.string().min(6)
    }))
    .mutation(async ({ctx,input})=>{
        const existingUser = await ctx.db.user.findUnique({
            where:{email:input.email},
        });
        if(existingUser){
            throw new Error("User already exists");
        }

        const passwordHash = await hashPassword(input.password)

        const user = await ctx.db.user.create({
            data:{
                email:input.email,
                name:input.name,
                passwordHash,
            }
        });
        return {
            id: user.id,
            email: user.email,
            name: user.name,
        }
    }),

    signIn: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(6),
    }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { email: input.email },
      });

      if (!user || !user.passwordHash) {
        throw new Error('Invalid credentials');
      }

      const isValidPassword = await verifyPassword(input.password, user.passwordHash);

      if (!isValidPassword) {
        throw new Error('Invalid credentials');
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
      };
    }),
   
    getSession: publicProcedure
    .input(z.object({ userId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      if (!input.userId) {
        return null;
      }

      const user = await ctx.db.user.findUnique({
        where: { id: input.userId },
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
        },
      });

      return user;
    }),
})