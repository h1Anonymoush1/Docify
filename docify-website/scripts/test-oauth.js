#!/usr/bin/env node

/**
 * OAuth Configuration Test Script
 *
 * This script tests the OAuth configuration for GitHub and Google
 * sign-in in the Docify website.
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkEnvFile() {
  log('\n🔍 Checking environment configuration...', 'blue');

  const envPath = path.join(__dirname, '..', '.env.local');
  const envExamplePath = path.join(__dirname, '..', '.env.example');

  if (!fs.existsSync(envPath)) {
    log('❌ .env.local file not found', 'red');
    log('   Please create .env.local with your Appwrite configuration', 'yellow');

    if (fs.existsSync(envExamplePath)) {
      log('   You can use .env.example as a template', 'cyan');
    }

    return false;
  }

  try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const requiredVars = [
      'NEXT_PUBLIC_APPWRITE_ENDPOINT',
      'NEXT_PUBLIC_APPWRITE_PROJECT_ID'
    ];

    const missingVars = requiredVars.filter(varName => !envContent.includes(varName));

    if (missingVars.length > 0) {
      log(`❌ Missing required environment variables: ${missingVars.join(', ')}`, 'red');
      return false;
    }

    log('✅ Environment configuration looks good', 'green');
    return true;
  } catch (error) {
    log(`❌ Error reading .env.local: ${error.message}`, 'red');
    return false;
  }
}

function checkAppwriteConfig() {
  log('\n🔍 Checking Appwrite configuration...', 'blue');

  const configPath = path.join(__dirname, '..', 'src', 'lib', 'appwrite.js');

  try {
    const configContent = fs.readFileSync(configPath, 'utf8');

    // Check for OAuth providers
    const hasGoogle = configContent.includes('OAuthProvider.Google');
    const hasGithub = configContent.includes('OAuthProvider.Github');

    if (!hasGoogle && !hasGithub) {
      log('❌ No OAuth providers configured in appwrite.js', 'red');
      return false;
    }

    if (hasGoogle) {
      log('✅ Google OAuth configured', 'green');
    } else {
      log('⚠️  Google OAuth not configured', 'yellow');
    }

    if (hasGithub) {
      log('✅ GitHub OAuth configured', 'green');
    } else {
      log('⚠️  GitHub OAuth not configured', 'yellow');
    }

    // Check for callback URL handling
    if (configContent.includes('handleOAuthCallback')) {
      log('✅ OAuth callback handler implemented', 'green');
    } else {
      log('❌ OAuth callback handler not found', 'red');
      return false;
    }

    return true;
  } catch (error) {
    log(`❌ Error reading appwrite.js: ${error.message}`, 'red');
    return false;
  }
}

function checkAuthContext() {
  log('\n🔍 Checking authentication context...', 'blue');

  const contextPath = path.join(__dirname, '..', 'src', 'lib', 'auth-context.tsx');

  try {
    const contextContent = fs.readFileSync(contextPath, 'utf8');

    const requiredMethods = [
      'loginWithGoogle',
      'loginWithGitHub',
      'refreshAuthStatus',
      'validateSession'
    ];

    const missingMethods = requiredMethods.filter(method =>
      !contextContent.includes(method)
    );

    if (missingMethods.length > 0) {
      log(`❌ Missing authentication methods: ${missingMethods.join(', ')}`, 'red');
      return false;
    }

    log('✅ Authentication context methods implemented', 'green');
    return true;
  } catch (error) {
    log(`❌ Error reading auth-context.tsx: ${error.message}`, 'red');
    return false;
  }
}

function checkCallbackPage() {
  log('\n🔍 Checking OAuth callback page...', 'blue');

  const callbackPath = path.join(__dirname, '..', 'src', 'app', 'auth', 'callback', 'page.tsx');

  try {
    const callbackContent = fs.readFileSync(callbackPath, 'utf8');

    // Check for proper error handling
    if (!callbackContent.includes('error') || !callbackContent.includes('error_description')) {
      log('❌ OAuth callback page missing error handling', 'red');
      return false;
    }

    // Check for auth context usage
    if (!callbackContent.includes('useAuth') || !callbackContent.includes('refreshAuthStatus')) {
      log('❌ OAuth callback page not using auth context properly', 'red');
      return false;
    }

    log('✅ OAuth callback page properly implemented', 'green');
    return true;
  } catch (error) {
    log(`❌ Error reading callback page: ${error.message}`, 'red');
    return false;
  }
}

function checkAppwriteJson() {
  log('\n🔍 Checking appwrite.json configuration...', 'blue');

  const appwriteJsonPath = path.join(__dirname, '..', '..', 'appwrite.json');

  try {
    const appwriteJson = JSON.parse(fs.readFileSync(appwriteJsonPath, 'utf8'));

    // Check OAuth configuration
    const auth = appwriteJson.settings?.auth;
    if (!auth) {
      log('❌ Auth settings not found in appwrite.json', 'red');
      return false;
    }

    const oauth = auth.methods?.oauth;
    if (!oauth) {
      log('❌ OAuth settings not found in appwrite.json', 'red');
      return false;
    }

    if (oauth.google) {
      log('✅ Google OAuth enabled in appwrite.json', 'green');
    } else {
      log('⚠️  Google OAuth not enabled in appwrite.json', 'yellow');
    }

    if (oauth.github) {
      log('✅ GitHub OAuth enabled in appwrite.json', 'green');
    } else {
      log('⚠️  GitHub OAuth not enabled in appwrite.json', 'yellow');
    }

    return true;
  } catch (error) {
    log(`❌ Error reading appwrite.json: ${error.message}`, 'red');
    return false;
  }
}

function main() {
  log('🚀 Docify OAuth Configuration Test', 'bright');
  log('=====================================', 'bright');

  let allChecksPass = true;

  allChecksPass &= checkEnvFile();
  allChecksPass &= checkAppwriteConfig();
  allChecksPass &= checkAuthContext();
  allChecksPass &= checkCallbackPage();
  allChecksPass &= checkAppwriteJson();

  log('\n=====================================', 'bright');

  if (allChecksPass) {
    log('🎉 All OAuth configuration checks passed!', 'green');
    log('\nNext steps:', 'cyan');
    log('1. Make sure your OAuth providers are configured in Appwrite Console', 'reset');
    log('2. Test the OAuth flow by visiting /auth/login', 'reset');
    log('3. Check browser console for any OAuth-related errors', 'reset');
  } else {
    log('❌ Some OAuth configuration checks failed', 'red');
    log('\nPlease fix the issues above before testing OAuth', 'yellow');
    process.exit(1);
  }
}

// Run the test
main();
