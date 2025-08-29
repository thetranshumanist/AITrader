# AI Trader - Authentication & Security Documentation

## 1. Better Auth Implementation

### 1.1 Core Configuration
```typescript
// lib/auth.ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg", // PostgreSQL
  }),
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
    },
  },
  plugins: [
    twoFactor(),
    emailOTP(),
    rateLimiter(),
  ],
});
```

### 1.2 Database Schema
```sql
-- Authentication tables
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  image TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  role TEXT DEFAULT 'user',
  two_factor_enabled BOOLEAN DEFAULT FALSE
);

CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  expires_at TIMESTAMP NOT NULL,
  token TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address TEXT,
  user_agent TEXT,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE accounts (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  access_token TEXT,
  refresh_token TEXT,
  id_token TEXT,
  access_token_expires_at TIMESTAMP,
  refresh_token_expires_at TIMESTAMP,
  scope TEXT,
  password TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE verification_tokens (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  token TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 1.3 User Roles & Permissions
```typescript
// types/auth.ts
export type UserRole = 'admin' | 'user' | 'viewer' | 'trader';

export interface Permission {
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete';
}

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    { resource: '*', action: 'create' },
    { resource: '*', action: 'read' },
    { resource: '*', action: 'update' },
    { resource: '*', action: 'delete' },
  ],
  trader: [
    { resource: 'portfolio', action: 'read' },
    { resource: 'portfolio', action: 'update' },
    { resource: 'trades', action: 'create' },
    { resource: 'trades', action: 'read' },
    { resource: 'signals', action: 'read' },
    { resource: 'market-data', action: 'read' },
  ],
  user: [
    { resource: 'portfolio', action: 'read' },
    { resource: 'trades', action: 'read' },
    { resource: 'signals', action: 'read' },
    { resource: 'market-data', action: 'read' },
  ],
  viewer: [
    { resource: 'portfolio', action: 'read' },
    { resource: 'market-data', action: 'read' },
  ],
};
```

## 2. Security Implementation

### 2.1 Password Security
```typescript
// lib/password.ts
import bcrypt from 'bcryptjs';
import zxcvbn from 'zxcvbn';

export class PasswordManager {
  private static readonly SALT_ROUNDS = 12;
  private static readonly MIN_STRENGTH = 3;

  static async hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  static async verify(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static validateStrength(password: string): {
    valid: boolean;
    score: number;
    feedback: string[];
  } {
    const result = zxcvbn(password);
    return {
      valid: result.score >= this.MIN_STRENGTH,
      score: result.score,
      feedback: result.feedback.suggestions,
    };
  }
}
```

### 2.2 Two-Factor Authentication
```typescript
// lib/2fa.ts
import { authenticator } from 'otplib';

export class TwoFactorAuth {
  static generateSecret(email: string): string {
    return authenticator.generateSecret();
  }

  static generateQRCodeUrl(email: string, secret: string): string {
    return authenticator.keyuri(email, 'AI Trader', secret);
  }

  static verifyToken(token: string, secret: string): boolean {
    return authenticator.verify({ token, secret });
  }

  static generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      codes.push(Math.random().toString(36).substring(2, 10).toUpperCase());
    }
    return codes;
  }
}
```

### 2.3 Rate Limiting
```typescript
// lib/rate-limit.ts
interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export const rateLimitConfigs = {
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 attempts per window
    skipSuccessfulRequests: true,
  },
  api: {
    windowMs: 1 * 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requests per minute
  },
  trading: {
    windowMs: 1 * 60 * 1000, // 1 minute
    maxRequests: 10, // 10 trades per minute
  },
};
```

## 3. Privacy Policy & Compliance

### 3.1 Data Collection
We collect the following information:
- Personal Information: Name, email address, phone number
- Trading Data: Portfolio information, trade history, preferences
- Technical Data: IP address, browser type, device information
- Usage Data: Pages visited, features used, time spent

### 3.2 Data Usage
Your data is used for:
- Providing trading services and portfolio management
- Improving our platform and user experience
- Communicating important updates and notifications
- Complying with legal and regulatory requirements

### 3.3 Data Protection
We implement industry-standard security measures:
- Data encryption in transit and at rest (AES-256)
- Regular security audits and penetration testing
- Access controls and authentication protocols
- Secure data backup and disaster recovery

### 3.4 User Rights (GDPR Compliance)
Users have the right to:
- Access their personal data
- Rectify inaccurate data
- Erase personal data (right to be forgotten)
- Restrict processing of personal data
- Data portability
- Object to processing

## 4. Terms of Service

### 4.1 Service Description
AI Trader provides automated trading services including:
- Real-time market data analysis
- Algorithmic trading signal generation
- Automated trade execution
- Portfolio management and reporting

### 4.2 User Responsibilities
Users agree to:
- Provide accurate and current information
- Maintain the security of their account credentials
- Comply with applicable laws and regulations
- Use the service only for lawful purposes
- Accept full responsibility for trading decisions

### 4.3 Risk Disclosure
Trading involves substantial risk:
- Past performance does not guarantee future results
- All trading decisions carry the risk of loss
- Users should only trade with funds they can afford to lose
- Market conditions can change rapidly
- Automated systems may experience technical failures

### 4.4 Limitation of Liability
The service is provided "as is" without warranties:
- We are not liable for trading losses
- System downtime or technical issues
- Data accuracy or completeness
- Third-party service interruptions

## 5. Cookie Policy

### 5.1 Types of Cookies
We use the following cookies:

**Essential Cookies:**
- Authentication tokens
- Session management
- Security tokens

**Performance Cookies:**
- Analytics and usage statistics
- Error tracking and monitoring
- Performance optimization

**Functional Cookies:**
- User preferences
- Language settings
- Theme preferences

### 5.2 Cookie Management
Users can:
- Accept or decline non-essential cookies
- Modify cookie preferences anytime
- Clear cookies through browser settings
- Opt-out of analytics tracking

### 5.3 Third-Party Cookies
We may use third-party services that set cookies:
- Google Analytics (analytics)
- Sentry (error monitoring)
- Vercel (hosting and performance)

## 6. Security Monitoring

### 6.1 Threat Detection
```typescript
// lib/security-monitor.ts
interface SecurityEvent {
  type: 'failed_login' | 'suspicious_activity' | 'data_breach' | 'unauthorized_access';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  metadata: Record<string, any>;
}

export class SecurityMonitor {
  static async logEvent(event: SecurityEvent): Promise<void> {
    // Log to database
    await db.securityLogs.insert(event);
    
    // Alert on high severity
    if (event.severity === 'high' || event.severity === 'critical') {
      await this.sendAlert(event);
    }
    
    // Update threat intelligence
    await this.updateThreatIntelligence(event);
  }

  static async detectAnomalies(userId: string): Promise<boolean> {
    const recentActivity = await this.getRecentActivity(userId);
    return this.analyzeActivity(recentActivity);
  }
}
```

### 6.2 Incident Response
1. **Detection**: Automated monitoring and alerts
2. **Assessment**: Evaluate severity and impact
3. **Containment**: Isolate affected systems
4. **Eradication**: Remove threats and vulnerabilities
5. **Recovery**: Restore normal operations
6. **Lessons Learned**: Update security measures

This documentation provides comprehensive security and compliance framework for the AI Trader platform.