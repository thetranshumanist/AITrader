# AI Trader - System Architecture Documentation

## 1. Overview

The AI Trader is a fully automated trading system that integrates real-time market data analysis, multi-strategy technical analysis, and automated trade execution for both stocks and cryptocurrencies.

## 2. High-Level Architecture

```mermaid
graph TB
    subgraph "External APIs"
        A[Alpaca Markets API]
        B[Gemini API]
        C[Google Sheets API]
    end
    
    subgraph "Frontend (Next.js App Router)"
        D[Landing Page]
        E[Dashboard]
        F[Portfolio View]
        G[Trade History]
        H[Settings]
    end
    
    subgraph "Backend Services"
        I[API Routes]
        J[Data Fetching Service]
        K[Technical Analysis Engine]
        L[Signal Generation]
        M[Trade Execution Engine]
        N[Portfolio Manager]
        O[Performance Calculator]
    end
    
    subgraph "Database & Storage"
        P[Supabase PostgreSQL]
        Q[Real-time Subscriptions]
    end
    
    subgraph "Authentication & Security"
        R[Better Auth]
        S[Row Level Security]
    end
    
    subgraph "Monitoring & Analytics"
        T[Sentry Error Tracking]
        U[Performance Metrics]
        V[Audit Logging]
    end
    
    subgraph "Deployment & CI/CD"
        W[Vercel Hosting]
        X[GitHub Actions]
        Y[Environment Management]
    end
    
    A -->|Stock Data| J
    B -->|Crypto Data| J
    J -->|Store Data| P
    J -->|Trigger Analysis| K
    K -->|Generate Signals| L
    L -->|Execute Trades| M
    M -->|Update Portfolio| N
    N -->|Calculate Metrics| O
    O -->|Log Performance| C
    
    D --> R
    E --> I
    F --> I
    G --> I
    H --> I
    
    I --> P
    I --> Q
    P --> S
    
    T --> U
    U --> V
    
    W --> X
    X --> Y
```

## 3. Component Architecture

### 3.1 Frontend Layer
- **Technology**: Next.js 14 (App Router), React 18, Shadcn/UI, Tailwind CSS
- **State Management**: Zustand for client-side state
- **Real-time Updates**: Supabase subscriptions for live data
- **Responsive Design**: Mobile-first approach with Tailwind CSS

### 3.2 Backend Services Layer
- **API Routes**: Next.js API routes for server-side logic
- **Data Services**: Centralized data fetching and management
- **Business Logic**: Trading algorithms and portfolio management
- **Scheduled Tasks**: Cron jobs for automated trading workflow

### 3.3 Data Layer
- **Primary Database**: Supabase PostgreSQL with Row Level Security
- **Real-time Features**: Supabase real-time subscriptions
- **Data Backup**: Automated backup to Google Sheets
- **Caching**: Redis-like caching for frequently accessed data

### 3.4 Security Layer
- **Authentication**: Better Auth with JWT tokens
- **Authorization**: Role-based access control (RBAC)
- **Data Protection**: Encryption at rest and in transit
- **API Security**: Rate limiting and request validation

## 4. Data Flow Architecture

### 4.1 Daily Automated Workflow
```mermaid
sequenceDiagram
    participant Scheduler
    participant DataService
    participant AlpacaAPI
    participant GeminiAPI
    participant Database
    participant AnalysisEngine
    participant SignalEngine
    participant TradeEngine
    participant PortfolioManager
    participant GoogleSheets
    
    Scheduler->>DataService: Trigger daily workflow
    DataService->>AlpacaAPI: Fetch stock data
    DataService->>GeminiAPI: Fetch crypto data
    DataService->>Database: Store market data
    DataService->>AnalysisEngine: Trigger analysis
    AnalysisEngine->>SignalEngine: Generate signals
    SignalEngine->>TradeEngine: Execute trades
    TradeEngine->>PortfolioManager: Update positions
    PortfolioManager->>Database: Update portfolio
    PortfolioManager->>GoogleSheets: Log performance
```

### 4.2 Real-time Data Flow
```mermaid
graph LR
    A[Market Data APIs] --> B[Data Validation]
    B --> C[Database Storage]
    C --> D[Real-time Subscriptions]
    D --> E[Frontend Updates]
    C --> F[Technical Analysis]
    F --> G[Signal Generation]
    G --> H[Trade Execution]
    H --> I[Portfolio Updates]
```

## 5. Database Schema

### 5.1 Core Tables
- **users**: User profiles and authentication data
- **portfolios**: User portfolio information
- **stock_data**: Real-time and historical stock data
- **crypto_data**: Real-time and historical cryptocurrency data
- **trading_signals**: Generated trading signals with reasoning
- **trades**: Executed trades with full audit trail
- **positions**: Current portfolio positions
- **performance_metrics**: Daily performance calculations

### 5.2 Relationships
```mermaid
erDiagram
    users ||--o{ portfolios : owns
    portfolios ||--o{ trades : contains
    portfolios ||--o{ positions : holds
    portfolios ||--o{ performance_metrics : tracks
    trading_signals ||--o{ trades : triggers
    stock_data }o--|| trading_signals : analyzes
    crypto_data }o--|| trading_signals : analyzes
```

## 6. API Endpoints

### 6.1 Authentication Endpoints
- `POST /api/auth/sign-in` - User sign in
- `POST /api/auth/sign-up` - User registration
- `POST /api/auth/sign-out` - User sign out
- `GET /api/auth/session` - Get current session

### 6.2 Data Endpoints
- `GET /api/market/stocks` - Get stock data
- `GET /api/market/crypto` - Get cryptocurrency data
- `POST /api/market/sync` - Sync market data
- `GET /api/analysis/signals` - Get trading signals

### 6.3 Trading Endpoints
- `POST /api/trades/execute` - Execute trade
- `GET /api/trades/history` - Get trade history
- `GET /api/portfolio/positions` - Get current positions
- `GET /api/portfolio/performance` - Get performance metrics

### 6.4 Admin Endpoints
- `POST /api/admin/scheduler/trigger` - Manually trigger workflow
- `GET /api/admin/health` - System health check
- `GET /api/admin/logs` - Get system logs

## 7. Security Architecture

### 7.1 Authentication Flow
```mermaid
sequenceDiagram
    participant Client
    participant BetterAuth
    participant Database
    participant API
    
    Client->>BetterAuth: Login request
    BetterAuth->>Database: Validate credentials
    Database->>BetterAuth: Return user data
    BetterAuth->>Client: Return JWT token
    Client->>API: Request with token
    API->>BetterAuth: Validate token
    BetterAuth->>API: Token valid
    API->>Client: Return protected data
```

### 7.2 Data Protection
- **Encryption**: AES-256 encryption for sensitive data
- **API Keys**: Stored in Vercel environment variables
- **Database**: Row Level Security (RLS) policies
- **Transport**: HTTPS/TLS 1.3 for all communications

## 8. Monitoring & Observability

### 8.1 Error Tracking
- **Sentry Integration**: Real-time error monitoring
- **Custom Metrics**: Trading performance metrics
- **Health Checks**: Automated system health monitoring
- **Alerting**: Critical error notifications

### 8.2 Performance Monitoring
- **API Response Times**: Track endpoint performance
- **Database Queries**: Monitor query execution times
- **Trade Execution**: Track trade latency
- **User Experience**: Frontend performance metrics

## 9. Deployment Architecture

### 9.1 Vercel Configuration
- **Runtime**: Node.js 18+ serverless functions
- **Static Assets**: CDN distribution
- **Environment Variables**: Secure configuration management
- **Preview Deployments**: Branch-based deployments

### 9.2 CI/CD Pipeline
```mermaid
graph LR
    A[Git Push] --> B[GitHub Actions]
    B --> C[Run Tests]
    C --> D[Build Application]
    D --> E[Deploy to Vercel]
    E --> F[Run E2E Tests]
    F --> G[Health Check]
```

## 10. Scalability Considerations

### 10.1 Performance Optimization
- **Database Indexing**: Optimized queries for large datasets
- **Caching Strategy**: Redis for frequently accessed data
- **Connection Pooling**: Efficient database connections
- **CDN**: Static asset optimization

### 10.2 Future Scaling
- **Microservices**: Split services for better scalability
- **Load Balancing**: Distribute traffic across instances
- **Database Sharding**: Horizontal scaling for large datasets
- **Queue System**: Async processing for heavy workloads

## 11. Risk Management

### 11.1 Trading Risks
- **Position Sizing**: Maximum position limits
- **Stop Losses**: Automatic loss protection
- **Diversification**: Cross-asset portfolio balance
- **Circuit Breakers**: Emergency trading halts

### 11.2 Technical Risks
- **API Rate Limits**: Graceful handling of rate limits
- **Data Validation**: Comprehensive input validation
- **Backup Systems**: Multiple data sources
- **Disaster Recovery**: Automated backup and restore

## 12. Compliance & Legal

### 12.1 Data Privacy
- **GDPR Compliance**: User data protection
- **Data Retention**: Automated data lifecycle management
- **User Consent**: Explicit consent for data processing
- **Right to Deletion**: User data deletion capabilities

### 12.2 Financial Regulations
- **Trade Logging**: Complete audit trail
- **Risk Disclosure**: Clear risk warnings
- **Paper Trading**: Safe testing environment
- **Regulatory Reporting**: Compliance with trading regulations