#!/bin/bash

# Environment Validation Script for AI Trader
# This script helps validate that all required environment variables are properly configured

set -e

echo "🚀 AI Trader - Environment Validation"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
MISSING_COUNT=0
PRESENT_COUNT=0

check_env_var() {
    local var_name=$1
    local is_required=${2:-true}
    local description=${3:-""}
    
    if [ -n "${!var_name}" ]; then
        echo -e "${GREEN}✓${NC} $var_name is set"
        ((PRESENT_COUNT++))
    else
        if [ "$is_required" = true ]; then
            echo -e "${RED}✗${NC} $var_name is missing (required)"
            ((MISSING_COUNT++))
        else
            echo -e "${YELLOW}⚠${NC} $var_name is missing (optional)"
        fi
        
        if [ -n "$description" ]; then
            echo "    $description"
        fi
    fi
}

echo "Checking Core Application Variables:"
echo "-----------------------------------"

# Supabase
check_env_var "NEXT_PUBLIC_SUPABASE_URL" true "Get from Supabase Dashboard > Settings > API"
check_env_var "NEXT_PUBLIC_SUPABASE_ANON_KEY" true "Get from Supabase Dashboard > Settings > API"
check_env_var "SUPABASE_SERVICE_ROLE_KEY" true "Get from Supabase Dashboard > Settings > API"

echo ""
echo "Checking Authentication Variables:"
echo "--------------------------------"

# Better Auth
check_env_var "BETTER_AUTH_SECRET" true "Generate a random 32+ character string"
check_env_var "BETTER_AUTH_URL" true "Your application URL (e.g., http://localhost:3000 for dev)"

echo ""
echo "Checking Trading Platform Variables:"
echo "----------------------------------"

# Alpaca
check_env_var "ALPACA_API_KEY" true "Get from Alpaca Markets dashboard"
check_env_var "ALPACA_SECRET_KEY" true "Get from Alpaca Markets dashboard"
check_env_var "ALPACA_BASE_URL" true "Use https://paper-api.alpaca.markets for paper trading"

# Gemini
check_env_var "GEMINI_API_KEY" true "Get from Gemini Exchange API settings"
check_env_var "GEMINI_SECRET_KEY" true "Get from Gemini Exchange API settings"

echo ""
echo "Checking Optional Integrations:"
echo "-----------------------------"

# Google Sheets (optional)
check_env_var "GOOGLE_SHEETS_PRIVATE_KEY" false "For Google Sheets integration"
check_env_var "GOOGLE_SHEETS_CLIENT_EMAIL" false "For Google Sheets integration"
check_env_var "GOOGLE_SHEETS_SPREADSHEET_ID" false "For Google Sheets integration"

echo ""
echo "Checking System Variables:"
echo "------------------------"

# System
check_env_var "ENABLE_SCHEDULER" false "Set to 'true' to enable automated trading"
check_env_var "CRON_SECRET" true "Generate a random string for cron job security"
check_env_var "NODE_ENV" false "Should be 'development', 'production', or 'test'"

echo ""
echo "================================================"

if [ $MISSING_COUNT -eq 0 ]; then
    echo -e "${GREEN}🎉 All required environment variables are configured!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Test your configuration: npm run dev"
    echo "2. Run tests: npm test"
    echo "3. Build for production: npm run build"
else
    echo -e "${RED}❌ $MISSING_COUNT required environment variable(s) missing${NC}"
    echo ""
    echo "To fix:"
    echo "1. Copy .env.example to .env.local: cp .env.example .env.local"
    echo "2. Edit .env.local and add the missing variables"
    echo "3. See DEPLOYMENT_SETUP.md for detailed configuration guide"
    echo ""
    exit 1
fi

echo ""
echo "Summary:"
echo "- ✓ Required variables present: $PRESENT_COUNT"
echo "- ✗ Required variables missing: $MISSING_COUNT"
echo ""

if [ $MISSING_COUNT -eq 0 ]; then
    echo -e "${GREEN}Environment validation passed!${NC}"
else
    echo -e "${RED}Environment validation failed!${NC}"
    exit 1
fi