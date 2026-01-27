import NextAuth, { DefaultSession } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { z } from "zod"
import prisma from "@/lib/db"

declare module "next-auth" {
    interface Session {
        user: {
            section?: string | null
        } & DefaultSession["user"]
    }
}

import { getApiPath } from "@/lib/utils"

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        Credentials({
            name: "Credentials",
            credentials: {
                username: { label: "Username", type: "text" },
                password: { label: "Password", type: "password" }
            },
            authorize: async (credentials) => {
                console.log("Authorize called with:", credentials);
                const parsedCredentials = z
                    .object({ username: z.string(), password: z.string() })
                    .safeParse(credentials);

                if (parsedCredentials.success) {
                    const { username, password } = parsedCredentials.data;
                    const user = await prisma.user.findFirst({
                        where: { username: username }
                    });

                    console.log("User found:", user ? user.username : "null");

                    if (!user) return null;

                    // Plaintext password check as requested
                    if (user.password === password) {
                        console.log("Password match!");
                        return {
                            id: user.id,
                            name: user.EngName || user.username,
                            email: user.email,
                            section: user.Section, // Add section to user object
                            image_url: user.image_url,
                            ThaiName: user.ThaiName,
                            role: user.role
                        };
                    } else {
                        console.log("Password mismatch");
                    }
                }
                return null;
            },
        }),
    ],
    pages: {
        signIn: getApiPath('/login'),
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.section = (user as any).section
                token.image_url = (user as any).image_url
                token.ThaiName = (user as any).ThaiName
                token.role = (user as any).role
            }
            return token
        },
        async session({ session, token }) {
            if (session.user && token.sub) {
                session.user.id = token.sub;
                session.user.section = token.section as string | null | undefined;
                (session.user as any).image_url = token.image_url;
                (session.user as any).ThaiName = token.ThaiName;
                (session.user as any).role = token.role;
            }
            return session;
        }
    }
})
