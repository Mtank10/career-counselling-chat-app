import { createTRPCRouter,publicProcedure } from "@/lib/trpc/server";

import {chatRouter} from './chat'
import { authRouter } from "./auth";


export const appRouter = createTRPCRouter({
    chat:chatRouter,
    auth:authRouter,
    
});

export type AppRouter = typeof appRouter;