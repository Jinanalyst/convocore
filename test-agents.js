const fetch = require('node-fetch');

async function testAgent(agent, prompt) {
  console.log(`\n🤖 Testing ${agent}:`);
  console.log(`📝 Prompt: "${prompt}"`);
  
  try {
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: [{
          role: 'user',
          content: prompt
        }],
        model: 'gpt-4o'
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    console.log(`✅ Status: ${response.status}`);
    console.log(`🎯 Agent Used:`, data.agentUsed ? data.agentUsed.name : 'None');
    console.log(`📖 Response Preview:`, data.response ? data.response.substring(0, 200) + '...' : 'No response');
    
    return {
      success: true,
      agent: data.agentUsed,
      responseLength: data.response ? data.response.length : 0
    };
    
  } catch (error) {
    console.log(`❌ Error:`, error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

async function runAgentTests() {
  console.log('🧪 Starting AI Agent Tests...\n');
  
  const tests = [
    { agent: '@codegen', prompt: '@codegen create a simple React button component with TypeScript' },
    { agent: '@debugger', prompt: '@debugger fix this React error: Cannot read property of undefined' },
    { agent: '@uiwizard', prompt: '@uiwizard design a modern pricing card component' },
    { agent: '@imagegen', prompt: '@imagegen create a prompt for a tech startup logo' },
    { agent: '@writer', prompt: '@writer write compelling copy for a SaaS landing page' },
    { agent: '@dbarchitect', prompt: '@dbarchitect design a user management database schema' },
    { agent: '@seohelper', prompt: '@seohelper optimize meta tags for a blog post about AI' },
    { agent: '@deploy', prompt: '@deploy setup a CI/CD pipeline for Next.js app' }
  ];
  
  let results = [];
  
  for (const test of tests) {
    const result = await testAgent(test.agent, test.prompt);
    results.push({
      agent: test.agent,
      ...result
    });
    
    // Wait 2 seconds between tests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Summary
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    const agentDetected = result.agent ? '🎯' : '❓';
    console.log(`${status} ${result.agent}: ${result.success ? 'Working' : 'Failed'} ${agentDetected}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
    if (result.responseLength) {
      console.log(`   Response length: ${result.responseLength} chars`);
    }
  });
  
  const successCount = results.filter(r => r.success).length;
  const agentDetectionCount = results.filter(r => r.agent).length;
  
  console.log(`\n📈 Overall Performance:`);
  console.log(`   API Success Rate: ${successCount}/${results.length} (${Math.round(successCount/results.length*100)}%)`);
  console.log(`   Agent Detection Rate: ${agentDetectionCount}/${results.length} (${Math.round(agentDetectionCount/results.length*100)}%)`);
}

// Only run if called directly
if (require.main === module) {
  runAgentTests().catch(console.error);
}

module.exports = { testAgent, runAgentTests }; 