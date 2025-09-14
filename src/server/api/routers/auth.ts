import {z} from "zod";
import { createTRPCRouter,publicProcedure } from "@/lib/trpc/server";

import { hashPassword,verifyPassword } from "../../utils";
import { db } from "../../../lib/db/db";

export const authRouter = createTRPCRouter({
    signUp: publicProcedure
    .input(z.object({
        email: z.string().email(),
        name: z.string().min(2).max(100),
        password: z.string().min(6)
    }))
    .mutation(async ({ctx,input})=>{
        const existingUser = await ctx.db.users.findUnique({
            where:{email:input.email},
        });
        if(existingUser){
            throw new Error("User already exists");
        }

        const passwordHash = await hashPassword(input.password)

        const user = await ctx.db.users.create({
            data:{
                email:input.email,
                name:input.name,
                password_hash: passwordHash,
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
      const user = await ctx.db.users.findUnique({
        where: { email: input.email },
      });

      if (!user || !user.password_hash) {
        throw new Error('Invalid credentials');
      }

      const isValidPassword = await verifyPassword(input.password, user.password_hash);

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

      const user = await ctx.db.users.findUnique({
        where: { id: input.userId },
        select: {
          id: true,
          email: true,
          name: true,
        },
      });

      return user;
    }),
})