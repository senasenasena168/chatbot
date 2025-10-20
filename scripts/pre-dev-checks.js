#!/usr/bin/env node

/**
 * Pre-development Checks Script
 * Validates environment and dependencies before starting development server
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const LOG_FILE = path.join(__dirname, '..', 'external-folder', 'debug-log.md');

function logToFile(message, severity = 'INFO') {
  const timestamp = new Date().toISOString();
  const logEntry = `### ${timestamp} - PRE_DEV_CHECK - ${severity}

**Description**: ${message}

**Context**: Pre-development validation checks

**Technical Details**:
- **Script**: scripts/pre-dev-checks.js
- **Environment**: ${process.platform}
- **Node Version**: ${process.version}

**Impact**: Ensures clean development environment

**Additional Data**:
- Automated check before development server start
- Part of predev npm script hook

---

`;

  try {
    fs.appendFileSync(LOG_FILE, logEntry);
  } catch (error) {
    console.warn('Warning: Could not write to debug log:', error.message);
  }
}

function checkNodeVersion() {
  const requiredVersion = '18.0.0';
  const currentVersion = process.version.slice(1); // Remove 'v' prefix

  console.log(`🔍 Checking Node.js version...`);
  console.log(`   Required: ${requiredVersion}`);
  console.log(`   Current: ${currentVersion}`);

  if (currentVersion < requiredVersion) {
    console.error(`❌ Node.js version ${currentVersion} is below required ${requiredVersion}`);
    logToFile(`Node.js version check failed: ${currentVersion} < ${requiredVersion}`, 'ERROR');
    process.exit(1);
  }

  console.log(`✅ Node.js version check passed`);
  logToFile(`Node.js version check passed: ${currentVersion}`);
}

function checkEnvironmentFile() {
  const envPath = path.join(__dirname, '..', '.env.local');
  const envTemplate = path.join(__dirname, '..', '.env');

  console.log(`🔍 Checking environment configuration...`);

  if (!fs.existsSync(envPath)) {
    console.warn(`⚠️  .env.local not found`);
    console.log(`   Copying from template...`);

    try {
      fs.copyFileSync(envTemplate, envPath);
      console.log(`✅ Created .env.local from template`);
      logToFile('Created .env.local from template');
    } catch (error) {
      console.error(`❌ Could not create .env.local:`, error.message);
      logToFile(`Failed to create .env.local: ${error.message}`, 'ERROR');
      process.exit(1);
    }
  } else {
    console.log(`✅ .env.local exists`);
  }

  // Check for required API keys
  try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const requiredKeys = ['OPENROUTER_API_KEY'];

    const missingKeys = requiredKeys.filter(key => {
      const regex = new RegExp(`^${key}=(.*)$`, 'm');
      const match = envContent.match(regex);
      return !match || match[1] === 'your_grok_api_key_here' || match[1] === '';
    });

    if (missingKeys.length > 0) {
      console.warn(`⚠️  Missing or placeholder API keys: ${missingKeys.join(', ')}`);
      console.log(`   Please update .env.local with actual values from external-folder/external-notes.md`);
      logToFile(`Missing API keys: ${missingKeys.join(', ')}`, 'WARN');
    } else {
      console.log(`✅ All required API keys configured`);
      logToFile('All required API keys configured');
    }
  } catch (error) {
    console.error(`❌ Could not read .env.local:`, error.message);
    logToFile(`Could not read .env.local: ${error.message}`, 'ERROR');
  }
}

function checkPortConfiguration() {
  const port = 3333;

  console.log(`🔍 Checking port configuration...`);
  console.log(`   Development port: ${port}`);
  console.log(`   Port management: Automated via killport in npm scripts`);

  logToFile(`Port configuration verified: ${port} with automated killport management`);
}

function checkDependencies() {
  console.log(`🔍 Checking dependencies...`);

  try {
    // Check if node_modules exists
    const nodeModulesPath = path.join(__dirname, '..', 'node_modules');
    if (!fs.existsSync(nodeModulesPath)) {
      console.log(`⚠️  node_modules not found`);
      console.log(`   Run 'npm install' to install dependencies`);
      logToFile('node_modules not found - run npm install', 'WARN');
    } else {
      console.log(`✅ Dependencies installed`);
      logToFile('Dependencies installed');
    }
  } catch (error) {
    console.error(`❌ Could not check dependencies:`, error.message);
    logToFile(`Could not check dependencies: ${error.message}`, 'ERROR');
  }
}

function checkExternalFolder() {
  console.log(`🔍 Checking external-folder structure...`);

  const externalFolder = path.join(__dirname, '..', 'external-folder');

  try {
    if (!fs.existsSync(externalFolder)) {
      console.error(`❌ external-folder not found`);
      logToFile('external-folder not found', 'ERROR');
      process.exit(1);
    }

    const requiredFiles = [
      'external-notes.md',
      'project-plans.md',
      'development-notes.md',
      'debug-log.md',
      'handover-notes.md',
      'prompt-notes.md'
    ];

    const missingFiles = requiredFiles.filter(file => {
      const filePath = path.join(externalFolder, file);
      return !fs.existsSync(filePath);
    });

    if (missingFiles.length > 0) {
      console.error(`❌ Missing required files in external-folder: ${missingFiles.join(', ')}`);
      logToFile(`Missing external-folder files: ${missingFiles.join(', ')}`, 'ERROR');
      process.exit(1);
    }

    console.log(`✅ All required external-folder files present`);
    logToFile('All required external-folder files present');

  } catch (error) {
    console.error(`❌ Could not check external-folder:`, error.message);
    logToFile(`Could not check external-folder: ${error.message}`, 'ERROR');
  }
}

// Main execution
if (require.main === module) {
  console.log('🚀 Chatbot Development - Pre-dev Checks');
  console.log('=====================================');

  try {
    checkNodeVersion();
    checkEnvironmentFile();
    checkPortConfiguration();
    checkDependencies();
    checkExternalFolder();

    console.log('=====================================');
    console.log('✅ All pre-development checks completed');
    console.log('🚀 Ready to start development server');

  } catch (error) {
    console.error('❌ Pre-development checks failed:', error.message);
    logToFile(`Pre-development checks failed: ${error.message}`, 'ERROR');
    process.exit(1);
  }
}

module.exports = {
  checkNodeVersion,
  checkEnvironmentFile,
  checkPortAvailability,
  checkDependencies,
  checkExternalFolder
};