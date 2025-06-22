import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { JWT } from "next-auth/jwt";

export interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
  plan: 'free' | 'pro' | 'premium';
  apiKey?: string;
  twoFactorEnabled: boolean;
  walletAddress?: string;
  subscriptionStatus: 'active' | 'inactive' | 'expired';
  subscriptionExpiry?: Date;
  dailyUsage: number;
  totalUsage: number;
  createdAt: Date;
}

export interface Session {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// Mock user database (replace with actual database)
const users: User[] = [];

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        twoFactorCode: { label: "2FA Code", type: "text", placeholder: "000000" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Find user in database
        const user = users.find(u => u.email === credentials.email);
        
        if (!user) {
          return null;
        }

        // Verify password (implement proper hashing)
        // const isValidPassword = await verifyPassword(credentials.password, user.hashedPassword);
        
        // Verify 2FA if enabled
        if (user.twoFactorEnabled && credentials.twoFactorCode) {
          // const isValid2FA = await verify2FA(user.id, credentials.twoFactorCode);
          // if (!isValid2FA) return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
      }
      return session;
    }
  },
  pages: {
    signIn: "/auth/signin",
    signUp: "/auth/signup",
    error: "/auth/error",
  }
};

// Utility functions for user management
export async function createUser(userData: Partial<User>): Promise<User> {
  const newUser: User = {
    id: generateUserId(),
    email: userData.email!,
    name: userData.name,
    plan: 'free',
    twoFactorEnabled: false,
    subscriptionStatus: 'inactive',
    dailyUsage: 0,
    totalUsage: 0,
    createdAt: new Date(),
    ...userData
  };
  
  users.push(newUser);
  return newUser;
}

export async function getUserById(id: string): Promise<User | null> {
  return users.find(u => u.id === id) || null;
}

export async function updateUserPlan(userId: string, plan: User['plan'], subscriptionExpiry?: Date) {
  const user = users.find(u => u.id === userId);
  if (user) {
    user.plan = plan;
    user.subscriptionStatus = 'active';
    user.subscriptionExpiry = subscriptionExpiry;
  }
}

export async function incrementUsage(userId: string) {
  const user = users.find(u => u.id === userId);
  if (user) {
    user.dailyUsage += 1;
    user.totalUsage += 1;
  }
}

export async function resetDailyUsage(userId: string) {
  const user = users.find(u => u.id === userId);
  if (user) {
    user.dailyUsage = 0;
  }
}

export function generateApiKey(): string {
  return 'cvai_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export function generateUserId(): string {
  return 'user_' + Math.random().toString(36).substring(2, 15);
}

// Rate limiting based on user plan
export function getRateLimit(plan: User['plan']): number {
  switch (plan) {
    case 'free':
      return 10; // 10 requests per day
    case 'pro':
    case 'premium':
      return -1; // Unlimited
    default:
      return 10;
  }
}

export function canMakeRequest(user: User): boolean {
  const limit = getRateLimit(user.plan);
  if (limit === -1) return true; // Unlimited
  return user.dailyUsage < limit;
} 