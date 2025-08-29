# Deployment Setup Guide

This guide provides step-by-step instructions for setting up CI/CD deployment for the AI Trader application.

## Prerequisites

- GitHub repository with the AI Trader codebase
- Vercel account (free or paid)
- Access to repository settings (admin permissions)

## 1. Vercel Setup

### 1.1 Create Vercel Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Configure project settings:
   - **Framework Preset**: Next.js
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`

### 1.2 Get Vercel Credentials

After creating the project, you'll need these values:

1. **Vercel Token**: 
   - Go to [Vercel Settings > Tokens](https://vercel.com/account/tokens)
   - Create a new token with appropriate scope
   - Copy the token value

2. **Organization ID**:
   - Go to [Vercel Settings > General](https://vercel.com/account)
   - Copy the "Organization ID" value

3. **Project ID**:
   - Go to your project settings in Vercel
   - Copy the "Project ID" from the General tab

## 2. GitHub Repository Secrets

### 2.1 Required Secrets

Set the following secrets in your GitHub repository:

1. Go to your GitHub repository
2. Navigate to **Settings > Secrets and variables > Actions**
3. Click **"New repository secret"** for each of the following:

#### Core Vercel Secrets
```
VERCEL_TOKEN=your_vercel_token_here
VERCEL_ORG_ID=your_org_id_here  
VERCEL_PROJECT_ID=your_project_id_here
```

#### Application Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
BETTER_AUTH_SECRET=your_better_auth_secret_key
BETTER_AUTH_URL=https://your-domain.vercel.app
DATABASE_URL=your_database_connection_string
ALPACA_API_KEY=your_alpaca_api_key
ALPACA_SECRET_KEY=your_alpaca_secret_key
ALPACA_BASE_URL=https://paper-api.alpaca.markets
GEMINI_API_KEY=your_gemini_api_key
GEMINI_SECRET_KEY=your_gemini_secret_key
GOOGLE_SHEETS_PRIVATE_KEY=your_google_sheets_private_key
GOOGLE_SHEETS_CLIENT_EMAIL=your_google_sheets_client_email
GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id
SENTRY_DSN=your_sentry_dsn
SENTRY_ORG=your_sentry_org_name
SENTRY_PROJECT=your_sentry_project_name
SENTRY_AUTH_TOKEN=your_sentry_auth_token
CRON_SECRET=your_cron_secret_key
```

### 2.2 Secret Values Guide

#### Supabase Configuration
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings > API**
4. Copy:
   - **URL**: Use for `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key**: Use for `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key**: Use for `SUPABASE_SERVICE_ROLE_KEY`

#### Better Auth Configuration
- **BETTER_AUTH_SECRET**: Generate a random 32+ character string
- **BETTER_AUTH_URL**: Your production domain (e.g., `https://aitrader.vercel.app`)

#### Alpaca Markets Configuration
1. Sign up at [Alpaca Markets](https://alpaca.markets/)
2. Go to **Paper Trading** section
3. Generate API keys
4. Use paper trading URL: `https://paper-api.alpaca.markets`

#### Gemini Configuration
1. Sign up at [Gemini](https://www.gemini.com/)
2. Go to **API Settings**
3. Create new API key with appropriate permissions

#### Sentry Configuration (Optional)
1. Sign up at [Sentry](https://sentry.io/)
2. Create a new project
3. Get DSN from project settings
4. Create auth token with appropriate permissions

## 3. Vercel Environment Variables

In addition to GitHub secrets, configure the same environment variables in Vercel:

1. Go to your Vercel project dashboard
2. Navigate to **Settings > Environment Variables**
3. Add all the variables listed above
4. Set appropriate environments (Production, Preview, Development)

## 4. Testing the Setup

### 4.1 Test Deployment Pipeline

1. Make a small change to your repository
2. Create a pull request
3. Check GitHub Actions for successful:
   - Tests
   - Build
   - Preview deployment

### 4.2 Test Production Deployment

1. Merge your pull request to `main` branch
2. Check GitHub Actions for successful:
   - Production deployment
   - Release creation

## 5. Troubleshooting

### Common Issues

#### "No existing credentials found" Error
- **Cause**: Missing or invalid `VERCEL_TOKEN`
- **Solution**: Verify the token is correctly set in GitHub secrets

#### "Project not found" Error
- **Cause**: Incorrect `VERCEL_PROJECT_ID` or `VERCEL_ORG_ID`
- **Solution**: Double-check IDs from Vercel dashboard

#### Build Failures
- **Cause**: Missing environment variables
- **Solution**: Ensure all required secrets are set in both GitHub and Vercel

#### Permission Errors
- **Cause**: Insufficient Vercel token permissions
- **Solution**: Create new token with appropriate scope

### Verification Commands

To test your configuration locally:

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Pull environment configuration
vercel env pull .env.local

# Test build locally
npm run build
```

## 6. Security Best Practices

1. **Token Rotation**: Regularly rotate Vercel tokens and API keys
2. **Minimal Permissions**: Grant only necessary permissions to tokens
3. **Environment Isolation**: Use different API keys for development/production
4. **Secret Management**: Never commit secrets to version control
5. **Access Control**: Limit repository access to trusted team members

## 7. Monitoring and Maintenance

- Monitor deployment success in GitHub Actions
- Set up alerts for failed deployments
- Regularly update dependencies and security patches
- Review and rotate secrets periodically

---

## Need Help?

- Check [Vercel Documentation](https://vercel.com/docs)
- Review [GitHub Actions Documentation](https://docs.github.com/en/actions)
- Consult the project's issue tracker for common problems