#!/usr/bin/env node

/**
 * API Connectivity Test Script
 * Tests if the Grok API key is working properly
 */

require('dotenv').config();
const https = require('https');

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const API_URL = 'https://openrouter.ai/api/v1/chat/completions';

async function testOpenRouterAPI() {
  console.log('🔍 Testing OpenRouter API connectivity...');
  console.log(`API URL: ${API_URL}`);
  console.log(`API Key: ${OPENROUTER_API_KEY ? OPENROUTER_API_KEY.substring(0, 10) + '...' : 'Not found'}`);

  if (!OPENROUTER_API_KEY) {
    console.error('❌ OPENROUTER_API_KEY not found in environment variables');
    console.log('Please check your .env file');
    return false;
  }

  const postData = JSON.stringify({
    messages: [
      {
        role: 'user',
        content: 'Hello! Please respond with just "API test successful" to confirm you are working.'
      }
    ],
    model: 'meta-llama/llama-3.2-3b-instruct:free',
    max_tokens: 50,
    temperature: 0.1
  });

  const options = {
    hostname: 'openrouter.ai',
    port: 443,
    path: '/api/v1/chat/completions',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Length': Buffer.byteLength(postData),
      'HTTP-Referer': 'https://localhost:3333',
      'X-Title': 'Chatbot Development'
    }
  };

  return new Promise((resolve) => {
    const req = https.request(options, (res) => {
      let data = '';

      console.log(`Status: ${res.statusCode}`);
      console.log(`Headers:`, res.headers);

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('Response:', JSON.stringify(response, null, 2));

          if (res.statusCode === 200) {
            console.log('✅ Grok API test successful!');
            resolve(true);
          } else {
            console.error('❌ Grok API test failed!');
            console.error('Error response:', response);
            resolve(false);
          }
        } catch (error) {
          console.error('❌ Error parsing API response:', error.message);
          console.error('Raw response:', data);
          resolve(false);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request error:', error.message);

      if (error.message.includes('ENOTFOUND')) {
        console.error('DNS resolution failed - check internet connection');
      } else if (error.message.includes('ECONNREFUSED')) {
        console.error('Connection refused - API server may be down');
      } else if (error.message.includes('401')) {
        console.error('Authentication failed - check API key');
      }

      resolve(false);
    });

    req.write(postData);
    req.end();
  });
}

async function main() {
  console.log('🚀 Chatbot API Connectivity Test');
  console.log('================================');

  try {
    const isWorking = await testOpenRouterAPI();

    console.log('================================');
    if (isWorking) {
      console.log('✅ API connectivity test PASSED');
      console.log('🎉 Ready to build the chatbot!');
    } else {
      console.log('❌ API connectivity test FAILED');
      console.log('Please check your API key and internet connection');
    }

    return isWorking;
  } catch (error) {
    console.error('❌ Test script error:', error.message);
    return false;
  }
}

if (require.main === module) {
  main().then((success) => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { testOpenRouterAPI };