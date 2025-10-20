import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";
import { getDatabase } from "@/lib/sqlite";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || "super-secret-key-for-development",
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async jwt({ token, user }) {
      // Persist user id in the JWT (supports credentials and OAuth providers)
      if (user && (user as any).id) {
        token.id = String((user as any).id);
      }
      // Fallback: ensure we always have an id via sub
      if (!token.id && token.sub) {
        token.id = String(token.sub);
      }
      return token;
    },
    async session({ session, token }) {
      // Expose id on session.user for server routes
      if (session.user) {
        (session.user as any).id = String((token as any).id || token.sub || "");
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Use environment variable for production URL or fallback to baseUrl
      const appUrl = process.env.NEXTAUTH_URL || baseUrl;
      
      // If the user is being redirected to the root of the application,
      // redirect them to the main app URL
      if (url === "/" || url === baseUrl || url === `${baseUrl}/`) {
        return appUrl;
      }

      // Allows relative callback URLs
      if (url.startsWith("/")) {
        return `${appUrl}${url}`;
      }

      // Allows callback URLs on the same origin
      if (new URL(url).origin === new URL(appUrl).origin) {
        return url;
      }

      return appUrl;
    },
  },
  providers: [
    CredentialsProvider({
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log('Missing credentials');
          return null;
        }

        console.log('Attempting to authenticate user:', credentials.email);
        
        // Retry logic for database operations
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            const db = getDatabase();
            const row = db
              .prepare(
                "SELECT id, email, name, encrypted_password FROM users WHERE email = ?"
              )
              .get(credentials.email.trim().toLowerCase());

            console.log(`Database query attempt ${attempt}, result:`, row ? 'User found' : 'User not found');
            
            if (!row || !row.encrypted_password) {
              console.log('No user found or missing encrypted_password');
              return null;
            }

            const valid = await bcrypt.compare(
              credentials.password,
              row.encrypted_password
            );

            console.log('Password validation result:', valid);
            
            if (!valid) {
              console.log('Invalid password for user:', credentials.email);
              return null;
            }

            console.log('Authentication successful for user:', row.email);
            return {
              id: String(row.id),
              email: row.email,
              name: row.name || row.email,
            } as any;
          } catch (error) {
            console.error(`Authentication error (attempt ${attempt}):`, error);
            
            // If this is the last attempt, return null
            if (attempt === 3) {
              console.error('All authentication attempts failed');
              return null;
            }
            
            // Wait a bit before retrying
            await new Promise(resolve => setTimeout(resolve, 100 * attempt));
          }
        }
        
        return null;
      },
    }),
    ...(process.env.GITHUB_ID && process.env.GITHUB_SECRET
      ? [
          GitHubProvider({
            clientId: process.env.GITHUB_ID!,
            clientSecret: process.env.GITHUB_SECRET!,
          }),
        ]
      : []),
  ],
  pages: {
    signIn: "/login",
  },
  debug: process.env.NODE_ENV !== "production",
};