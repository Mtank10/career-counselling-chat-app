import { TRPCReactProvider } from "@/lib/trpc/react";
import { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";

export function Providers({children,session}: {children: React.ReactNode;session:Session | null}) {
    return (
        <SessionProvider session={session}>
        <TRPCReactProvider>
            {children}
        </TRPCReactProvider>
        </SessionProvider>
    )
}