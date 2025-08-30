#!/usr/bin/env node

/**
 * Environment Validation Script for AI Trader
 * Cross-platform Node.js script to validate environment variables
 */

// Load environment variables from .env.local if it exists
const fs = require('fs');
const path = require('path');

// Simple dotenv loader
function loadEnvFile(filePath) {
  if (fs.existsSync(filePath)) {
    const envContent = fs.readFileSync(filePath, 'utf8');
    const lines = envContent.split('\n');
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [key, ...valueParts] = trimmed.split('=');
        const value = valueParts.join('=').trim();
        // Only set if not already set (prioritize actual env vars)
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    });
    return true;
  }
  return false;
}

// Load .env.local first, then .env
const envLocalPath = path.join(process.cwd(), '.env.local');
const envPath = path.join(process.cwd(), '.env');

const envLocalLoaded = loadEnvFile(envLocalPath);
const envLoaded = loadEnvFile(envPath);

const chalk = {
  red: (text) => `\u001b[31m${text}\u001b[0m`,
  green: (text) => `\u001b[32m${text}\u001b[0m`,
  yellow: (text) => `\u001b[33m${text}\u001b[0m`,
  blue: (text) => `\u001b[34m${text}\u001b[0m`,
  bold: (text) => `\u001b[1m${text}\u001b[0m`
};

console.log('🚀 AI Trader - Environment Validation');
console.log('======================================');

if (envLocalLoaded) {
  console.log('📄 Loaded environment from .env.local');
} else if (envLoaded) {
  console.log('📄 Loaded environment from .env');
} else {
  console.log('⚠️  No .env.local or .env file found, checking system environment only');
}

console.log('');

let missingCount = 0;
let presentCount = 0;

function checkEnvVar(varName, isRequired = true, description = '') {
  const value = process.env[varName];
  
  if (value && value.trim()) {
    console.log(`${chalk.green('✓')} ${varName} is set`);
    presentCount++;
  } else {
    if (isRequired) {
      console.log(`${chalk.red('✗')} ${varName} is missing (required)`);
      missingCount++;
    } else {
      console.log(`${chalk.yellow('⚠')} ${varName} is missing (optional)`);
    }
    
    if (description) {
      console.log(`    ${chalk.blue(description)}`);
    }
  }
}

// Core Application Variables
console.log('Checking Core Application Variables:');
console.log('-----------------------------------');

checkEnvVar('NEXT_PUBLIC_SUPABASE_URL', true, 'Get from Supabase Dashboard > Settings > API');
checkEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY', true, 'Get from Supabase Dashboard > Settings > API');
checkEnvVar('SUPABASE_SERVICE_ROLE_KEY', true, 'Get from Supabase Dashboard > Settings > API');

console.log('');
console.log('Checking Authentication Variables:');
console.log('--------------------------------');

checkEnvVar('BETTER_AUTH_SECRET', true, 'Generate a random 32+ character string');
checkEnvVar('BETTER_AUTH_URL', true, 'Your application URL (e.g., http://localhost:3000 for dev)');

console.log('');
console.log('Checking Trading Platform Variables:');
console.log('----------------------------------');

checkEnvVar('ALPACA_API_KEY', true, 'Get from Alpaca Markets dashboard');
checkEnvVar('ALPACA_SECRET_KEY', true, 'Get from Alpaca Markets dashboard');
checkEnvVar('ALPACA_BASE_URL', true, 'Use https://paper-api.alpaca.markets for paper trading');

checkEnvVar('GEMINI_API_KEY', true, 'Get from Gemini Exchange API settings');
checkEnvVar('GEMINI_SECRET_KEY', true, 'Get from Gemini Exchange API settings');

console.log('');
console.log('Checking Optional Integrations:');
console.log('-----------------------------');

checkEnvVar('GOOGLE_SHEETS_PRIVATE_KEY', false, 'For Google Sheets integration');
checkEnvVar('GOOGLE_SHEETS_CLIENT_EMAIL', false, 'For Google Sheets integration');
checkEnvVar('GOOGLE_SHEETS_SPREADSHEET_ID', false, 'For Google Sheets integration');

console.log('');
console.log('Checking System Variables:');
console.log('------------------------');

checkEnvVar('ENABLE_SCHEDULER', false, "Set to 'true' to enable automated trading");
checkEnvVar('CRON_SECRET', true, 'Generate a random string for cron job security');
checkEnvVar('NODE_ENV', false, "Should be 'development', 'production', or 'test'");

console.log('');
console.log('================================================');

if (missingCount === 0) {
  console.log(`${chalk.green('🎉 All required environment variables are configured!')}`);
  console.log('');
  console.log('Next steps:');
  console.log('1. Test your configuration: npm run dev');
  console.log('2. Run tests: npm test');
  console.log('3. Build for production: npm run build');
} else {
  console.log(`${chalk.red(`❌ ${missingCount} required environment variable(s) missing`)}`);
  console.log('');
  console.log('To fix:');
  console.log('1. Copy .env.example to .env.local');
  console.log('   Windows: copy .env.example .env.local');
  console.log('   macOS/Linux: cp .env.example .env.local');
  console.log('2. Edit .env.local and add the missing variables');
  console.log('3. See DEPLOYMENT_SETUP.md for detailed configuration guide');
  console.log('');
}

console.log('');
console.log('Summary:');
console.log(`- ✓ Required variables present: ${presentCount}`);
console.log(`- ✗ Required variables missing: ${missingCount}`);
console.log('');

if (missingCount === 0) {
  console.log(chalk.green('Environment validation passed!'));
  process.exit(0);
} else {
  console.log(chalk.red('Environment validation failed!'));
  process.exit(1);
}