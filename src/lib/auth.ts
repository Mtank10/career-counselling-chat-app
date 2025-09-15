import {NextAuthOptions} from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import {db} from "./db/db";
import {PrismaAdapter} from "@next-auth/prisma-adapter";
import { verifyPassword } from "@/server/utils";

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(db),
     session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth/signin',
    signUp: '/auth/signup',
  },
    providers: [
        CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await db.users.findUnique({
          where: {
            email: credentials.email
          }
        });

        if (!user ) {
          return null;
        }

        const isPasswordValid = await verifyPassword(
          credentials.password,
          user.password_hash
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      }
    })
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                const u = user 
                return {
                    ...token,
                    id: u.id,
                };
            }
            return token;
        },
        session: ({ session, token }) => {
            return {
                ...session,
                user: {
                    ...session.user,
                    id: token.id as string,
                }
            }
        }
    },
}
