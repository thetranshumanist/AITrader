import { betterAuth } from "better-auth";
import { Pool } from "pg";

// Database connection for Better Auth
// Use a mock connection string if DATABASE_URL is not provided for development
const databaseUrl = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/aitrader';

let database: Pool;
try {
  database = new Pool({
    connectionString: databaseUrl,
    // Add connection options for development
    ...(process.env.NODE_ENV === 'development' && {
      max: 1, // Reduce connection pool size in development
      idleTimeoutMillis: 1000,
      connectionTimeoutMillis: 1000,
    })
  });
} catch (error) {
  console.warn('Failed to create database connection for Better Auth:', error);
  // Create a mock pool for development
  database = new Pool({
    connectionString: 'postgresql://mock:mock@localhost:5432/mock',
    max: 0 // No actual connections
  });
}

export const auth = betterAuth({
  database,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "user",
        required: false,
      },
      emailVerified: {
        type: "boolean",
        defaultValue: false,
        required: true,
      },
      twoFactorEnabled: {
        type: "boolean",
        defaultValue: false,
        required: false,
      },
      avatarUrl: {
        type: "string",
        required: false,
      },
    },
  },
  plugins: [],
  trustedOrigins: [
    "http://localhost:3000",
    "https://ai-trader.vercel.app",
  ],
  rateLimit: {
    window: 60, // 1 minute
    max: 100, // 100 requests per minute
  },
  advanced: {
    crossSubDomainCookies: {
      enabled: false,
    },
    useSecureCookies: process.env.NODE_ENV === "production",
  },
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;