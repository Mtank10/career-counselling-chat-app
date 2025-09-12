import {fetchRequestHandler} from '@trpc/server/adapters/fetch';
import { createTRPCContext } from '@/lib/trpc/server';
import { appRouter } from '@/server/api/routers';


const handler = (request: Request) => {
    return fetchRequestHandler({
        endpoint: '/api/trpc',
        req:request,
        router: appRouter,
        createContext:()=>createTRPCContext({headers:request.headers}),
    });
}

export {handler as GET, handler as POST};