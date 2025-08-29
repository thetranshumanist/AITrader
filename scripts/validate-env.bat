@echo off
REM Environment Validation Script for AI Trader (Windows)
REM This script helps validate that all required environment variables are properly configured

setlocal enabledelayedexpansion

echo 🚀 AI Trader - Environment Validation
echo ======================================
echo.

set /a MISSING_COUNT=0
set /a PRESENT_COUNT=0

REM Function to check environment variables
:check_env_var
set "VAR_NAME=%~1"
set "IS_REQUIRED=%~2"
set "DESCRIPTION=%~3"

REM Get the value of the environment variable
call set "VAR_VALUE=%%%VAR_NAME%%%"

if not "%VAR_VALUE%"=="" (
    echo ✓ %VAR_NAME% is set
    set /a PRESENT_COUNT+=1
) else (
    if "%IS_REQUIRED%"=="true" (
        echo ✗ %VAR_NAME% is missing ^(required^)
        set /a MISSING_COUNT+=1
    ) else (
        echo ⚠ %VAR_NAME% is missing ^(optional^)
    )
    
    if not "%DESCRIPTION%"=="" (
        echo     %DESCRIPTION%
    )
)
goto :eof

REM Main validation logic
echo Checking Core Application Variables:
echo -----------------------------------

call :check_env_var "NEXT_PUBLIC_SUPABASE_URL" "true" "Get from Supabase Dashboard > Settings > API"
call :check_env_var "NEXT_PUBLIC_SUPABASE_ANON_KEY" "true" "Get from Supabase Dashboard > Settings > API"  
call :check_env_var "SUPABASE_SERVICE_ROLE_KEY" "true" "Get from Supabase Dashboard > Settings > API"

echo.
echo Checking Authentication Variables:
echo --------------------------------

call :check_env_var "BETTER_AUTH_SECRET" "true" "Generate a random 32+ character string"
call :check_env_var "BETTER_AUTH_URL" "true" "Your application URL (e.g., http://localhost:3000 for dev)"

echo.
echo Checking Trading Platform Variables:
echo ----------------------------------

call :check_env_var "ALPACA_API_KEY" "true" "Get from Alpaca Markets dashboard"
call :check_env_var "ALPACA_SECRET_KEY" "true" "Get from Alpaca Markets dashboard"
call :check_env_var "ALPACA_BASE_URL" "true" "Use https://paper-api.alpaca.markets for paper trading"

call :check_env_var "GEMINI_API_KEY" "true" "Get from Gemini Exchange API settings"
call :check_env_var "GEMINI_SECRET_KEY" "true" "Get from Gemini Exchange API settings"

echo.
echo Checking Optional Integrations:
echo -----------------------------

call :check_env_var "GOOGLE_SHEETS_PRIVATE_KEY" "false" "For Google Sheets integration"
call :check_env_var "GOOGLE_SHEETS_CLIENT_EMAIL" "false" "For Google Sheets integration"
call :check_env_var "GOOGLE_SHEETS_SPREADSHEET_ID" "false" "For Google Sheets integration"

call :check_env_var "SENTRY_DSN" "false" "For error monitoring and logging"
call :check_env_var "SENTRY_ORG" "false" "For error monitoring and logging"
call :check_env_var "SENTRY_PROJECT" "false" "For error monitoring and logging"
call :check_env_var "SENTRY_AUTH_TOKEN" "false" "For error monitoring and logging"

echo.
echo Checking System Variables:
echo ------------------------

call :check_env_var "ENABLE_SCHEDULER" "false" "Set to 'true' to enable automated trading"
call :check_env_var "CRON_SECRET" "true" "Generate a random string for cron job security"
call :check_env_var "NODE_ENV" "false" "Should be 'development', 'production', or 'test'"

echo.
echo ================================================

if %MISSING_COUNT% equ 0 (
    echo 🎉 All required environment variables are configured!
    echo.
    echo Next steps:
    echo 1. Test your configuration: npm run dev
    echo 2. Run tests: npm test
    echo 3. Build for production: npm run build
) else (
    echo ❌ %MISSING_COUNT% required environment variable^(s^) missing
    echo.
    echo To fix:
    echo 1. Copy .env.example to .env.local: copy .env.example .env.local
    echo 2. Edit .env.local and add the missing variables
    echo 3. See DEPLOYMENT_SETUP.md for detailed configuration guide
    echo.
    exit /b 1
)

echo.
echo Summary:
echo - ✓ Required variables present: %PRESENT_COUNT%
echo - ✗ Required variables missing: %MISSING_COUNT%
echo.

if %MISSING_COUNT% equ 0 (
    echo Environment validation passed!
) else (
    echo Environment validation failed!
    exit /b 1
)