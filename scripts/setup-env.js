#!/usr/bin/env node

/**
 * Environment Setup Script for AI Trader
 * Helps users create .env.local from .env.example
 */

const fs = require('fs');
const path = require('path');

const chalk = {
  red: (text) => `\u001b[31m${text}\u001b[0m`,
  green: (text) => `\u001b[32m${text}\u001b[0m`,
  yellow: (text) => `\u001b[33m${text}\u001b[0m`,
  blue: (text) => `\u001b[34m${text}\u001b[0m`,
  bold: (text) => `\u001b[1m${text}\u001b[0m`
};

console.log('🛠️ AI Trader - Environment Setup');
console.log('=================================');
console.log('');

const envExamplePath = path.join(process.cwd(), '.env.example');
const envLocalPath = path.join(process.cwd(), '.env.local');

// Check if .env.example exists
if (!fs.existsSync(envExamplePath)) {
  console.log(chalk.red('❌ .env.example file not found!'));
  console.log('This file is required to set up your environment.');
  process.exit(1);
}

// Check if .env.local already exists
if (fs.existsSync(envLocalPath)) {
  console.log(chalk.yellow('⚠️  .env.local already exists'));
  console.log('');
  console.log('Options:');
  console.log('1. Delete .env.local and run this script again to create a fresh copy');
  console.log('2. Manually edit .env.local to add missing variables');
  console.log('3. Run npm run validate-env to check your current configuration');
  console.log('');
  process.exit(0);
}

try {
  // Copy .env.example to .env.local
  const exampleContent = fs.readFileSync(envExamplePath, 'utf8');
  fs.writeFileSync(envLocalPath, exampleContent);
  
  console.log(chalk.green('✅ Successfully created .env.local from .env.example'));
  console.log('');
  console.log(chalk.bold('Next steps:'));
  console.log('1. Edit .env.local and replace placeholder values with your actual configuration');
  console.log('2. See DEPLOYMENT_SETUP.md for detailed instructions on getting API keys');
  console.log('3. Run "npm run validate-env" to check your configuration');
  console.log('');
  console.log(chalk.blue('Required services to set up:'));
  console.log('• Supabase: https://supabase.com/dashboard');
  console.log('• Alpaca Markets: https://alpaca.markets/');
  console.log('• Gemini (optional): https://www.gemini.com/');
  console.log('• Sentry (optional): https://sentry.io/');
  
} catch (error) {
  console.log(chalk.red('❌ Failed to create .env.local'));
  console.log(chalk.red(`Error: ${error.message}`));
  process.exit(1);
}