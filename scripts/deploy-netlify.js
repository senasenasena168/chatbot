#!/usr/bin/env node

/**
 * Netlify Deployment Script
 * Handles deployment to Netlify with proper configuration
 */

require('dotenv').config();
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, '..', 'external-folder', 'debug-log.md');

function logToFile(message, severity = 'INFO') {
  const timestamp = new Date().toISOString();
  const logEntry = `### ${timestamp} - NETLIFY_DEPLOY - ${severity}

**Description**: ${message}

**Context**: Netlify deployment process

**Technical Details**:
- **Script**: scripts/deploy-netlify.js
- **Platform**: Netlify
- **Environment**: ${process.env.NODE_ENV || 'development'}

**Impact**: Application deployment to production

**Additional Data**:
- Automated deployment script for Netlify platform
- Includes environment validation and build optimization

---

`;

  try {
    fs.appendFileSync(LOG_FILE, logEntry);
  } catch (error) {
    console.warn('Warning: Could not write to debug log:', error.message);
  }
}

function checkEnvironment() {
  console.log('🔍 Checking environment configuration...');

  const requiredEnvVars = [
    'OPENROUTER_API_KEY'
  ];

  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);

  if (missing.length > 0) {
    console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
    console.log('Please check your .env file and Netlify dashboard environment variables');
    logToFile(`Missing environment variables: ${missing.join(', ')}`, 'ERROR');
    return false;
  }

  console.log('✅ All required environment variables are set');
  logToFile('Environment variables validated successfully');
  return true;
}

function checkNetlifyCLI() {
  console.log('🔍 Checking Netlify CLI...');

  try {
    const version = execSync('npx netlify --version', { encoding: 'utf8' }).trim();
    console.log(`✅ Netlify CLI version: ${version}`);
    logToFile(`Netlify CLI version: ${version}`);
    return true;
  } catch (error) {
    console.log('⚠️  Netlify CLI not found globally, will use npx');
    logToFile('Netlify CLI not found globally, using npx');
    return true;
  }
}

function buildApplication() {
  console.log('🔨 Building Next.js application...');

  try {
    console.log('Installing dependencies with legacy peer deps...');
    execSync('npm install --legacy-peer-deps', { stdio: 'inherit' });

    console.log('Running build command...');
    execSync('npm run build', { stdio: 'inherit' });
    console.log('✅ Build completed successfully');
    logToFile('Next.js build completed successfully');
    return true;
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    logToFile(`Build failed: ${error.message}`, 'ERROR');
    return false;
  }
}

function deployToNetlify() {
  console.log('🚀 Deploying to Netlify...');

  try {
    console.log('Initiating Netlify deployment...');

    // Check if site is already connected to Netlify
    try {
      const siteInfo = execSync('npx netlify status', { encoding: 'utf8' });
      console.log('📍 Found existing Netlify site configuration');
      console.log(siteInfo);
    } catch (error) {
      console.log('🔗 No existing Netlify site found, will create new deployment');
    }

    console.log('🌐 Deploying to production...');
    const deployOutput = execSync('npx netlify deploy --prod --dir=.next', { encoding: 'utf8' });

    console.log('✅ Deployment completed successfully');
    console.log('Deploy output:', deployOutput);

    logToFile('Netlify deployment completed successfully');
    return true;
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);

    if (error.message.includes('not linked')) {
      console.log('\n🔗 To link your site to Netlify:');
      console.log('1. Go to https://netlify.com');
      console.log('2. Click "Add new site"');
      console.log('3. Choose "Import an existing project"');
      console.log('4. Connect your GitHub repository');
      console.log('5. Deploy settings will be auto-detected');
    }

    logToFile(`Netlify deployment failed: ${error.message}`, 'ERROR');
    return false;
  }
}

function setupNetlifyConfig() {
  console.log('⚙️  Setting up Netlify configuration...');

  const netlifyConfig = {
    build: {
      command: 'npm run build',
      publish: '.next'
    },
    functions: {
      directory: 'netlify/functions'
    },
    headers: [
      {
        for: '/api/*',
        values: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
        }
      }
    ],
    redirects: [
      {
        from: '/api/*',
        to: '/.netlify/functions/:splat',
        status: 200
      }
    ]
  };

  try {
    fs.writeFileSync('netlify.toml', JSON.stringify(netlifyConfig, null, 2));
    console.log('✅ Created netlify.toml configuration file');
    logToFile('Netlify configuration file created');
    return true;
  } catch (error) {
    console.error('❌ Could not create netlify.toml:', error.message);
    logToFile(`Could not create netlify.toml: ${error.message}`, 'ERROR');
    return false;
  }
}

// Main deployment function
async function deploy() {
  console.log('🚀 Chatbot Netlify Deployment');
  console.log('==============================');

  // Step 1: Environment check
  if (!checkEnvironment()) {
    process.exit(1);
  }

  // Step 2: CLI check
  checkNetlifyCLI();

  // Step 3: Setup configuration
  setupNetlifyConfig();

  // Step 4: Build application
  if (!buildApplication()) {
    process.exit(1);
  }

  // Step 5: Deploy to Netlify
  if (!deployToNetlify()) {
    process.exit(1);
  }

  console.log('==============================');
  console.log('🎉 Deployment completed successfully!');
  console.log('\n📝 Next steps:');
  console.log('1. Set environment variables in Netlify dashboard');
  console.log('2. Configure custom domain (optional)');
  console.log('3. Set up form handling if needed');
  console.log('4. Monitor deployment in Netlify dashboard');

  console.log('\n🔗 Useful links:');
  console.log('- Netlify Dashboard: https://netlify.com');
  console.log('- Supabase Dashboard: https://supabase.com');
  console.log('- OpenRouter Dashboard: https://openrouter.ai');
}

// Alternative deployment methods
function showDeploymentOptions() {
  console.log('\n🔄 Alternative Deployment Methods:');
  console.log('\n1️⃣  GitHub Integration (Recommended):');
  console.log('   - Connect your GitHub repo to Netlify');
  console.log('   - Auto-deploy on every push to main branch');
  console.log('   - Build settings auto-detected');

  console.log('\n2️⃣  Manual Deployment:');
  console.log('   - Use "npx netlify deploy --prod"');
  console.log('   - Requires Netlify CLI authentication');

  console.log('\n3️⃣  Drag & Drop:');
  console.log('   - Build locally with "npm run build"');
  console.log('   - Drag .next folder to Netlify dashboard');
}

if (require.main === module) {
  deploy().catch(console.error);
}

module.exports = {
  deploy,
  checkEnvironment,
  buildApplication,
  deployToNetlify,
  setupNetlifyConfig
};