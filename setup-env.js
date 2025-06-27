#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupEnvironment() {
  console.log('🚀 ConvoAI Environment Setup\n');
  console.log('This script will help you set up your API keys for ConvoAI.');
  console.log('You can skip any API key you don\'t want to use by pressing Enter.\n');

  const envPath = path.join(__dirname, '.env.local');
  
  // Check if .env.local already exists
  if (fs.existsSync(envPath)) {
    const overwrite = await question('⚠️  .env.local already exists. Overwrite? (y/N): ');
    if (overwrite.toLowerCase() !== 'y') {
      console.log('Setup cancelled.');
      rl.close();
      return;
    }
  }

  const envContent = [];

  // AI Service Configuration
  envContent.push('# AI Service Configuration');
  
  console.log('\n📝 OpenAI API Key (for gpt-4o, gpt-4-turbo models)');
  console.log('Get it from: https://platform.openai.com/api-keys');
  const openaiKey = await question('OPENAI_API_KEY (starts with sk-): ');
  if (openaiKey.trim()) {
    envContent.push(`OPENAI_API_KEY=${openaiKey.trim()}`);
  }

  console.log('\n📝 Anthropic API Key (for claude-3 models)');
  console.log('Get it from: https://console.anthropic.com/');
  const anthropicKey = await question('ANTHROPIC_API_KEY (starts with sk-ant-): ');
  if (anthropicKey.trim()) {
    envContent.push(`ANTHROPIC_API_KEY=${anthropicKey.trim()}`);
  }

  console.log('\n📝 OpenRouter API Key (for ConvoMini model)');
  console.log('Get it from: https://openrouter.ai/keys');
  const openrouterKey = await question('OPENROUTER_API_KEY (starts with sk-or-): ');
  if (openrouterKey.trim()) {
    envContent.push(`OPENROUTER_API_KEY=${openrouterKey.trim()}`);
  }

  console.log('\n📝 Groq API Key (for ConvoQ model - ultra-fast)');
  console.log('Get it from: https://console.groq.com/keys');
  const groqKey = await question('GROQ_API_KEY (starts with gsk_): ');
  if (groqKey.trim()) {
    envContent.push(`GROQ_API_KEY=${groqKey.trim()}`);
  }

  // Application Configuration
  envContent.push('');
  envContent.push('# Application Configuration');
  envContent.push('NEXTAUTH_URL=http://localhost:3000');
  envContent.push('NEXTAUTH_SECRET=your-nextauth-secret-here');

  // Development Configuration
  envContent.push('');
  envContent.push('# Development Configuration');
  envContent.push('NODE_ENV=development');
  envContent.push('NEXT_PUBLIC_APP_URL=http://localhost:3000');

  // Write the file
  try {
    fs.writeFileSync(envPath, envContent.join('\n'));
    console.log('\n✅ .env.local file created successfully!');
    console.log('\n📋 Summary of configured API keys:');
    
    if (openaiKey.trim()) console.log('✅ OpenAI API Key');
    if (anthropicKey.trim()) console.log('✅ Anthropic API Key');
    if (openrouterKey.trim()) console.log('✅ OpenRouter API Key');
    if (groqKey.trim()) console.log('✅ Groq API Key');
    
    console.log('\n🔄 Next steps:');
    console.log('1. Restart your development server: npm run dev');
    console.log('2. Test the chat functionality');
    console.log('3. Check the browser console for any API key validation errors');
    
    if (!openaiKey.trim() && !anthropicKey.trim() && !openrouterKey.trim() && !groqKey.trim()) {
      console.log('\n⚠️  No API keys were configured. You can still use the app with limited functionality.');
      console.log('   To add API keys later, edit the .env.local file or run this script again.');
    }
    
  } catch (error) {
    console.error('❌ Error creating .env.local file:', error.message);
  }

  rl.close();
}

// Handle script termination
process.on('SIGINT', () => {
  console.log('\n\nSetup cancelled.');
  rl.close();
  process.exit(0);
});

setupEnvironment().catch(console.error); 