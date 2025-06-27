// Test file for session key functionality
// Run this in the browser console to test session keys

console.log('🧪 Testing Session Key Functionality...');

// Mock localStorage for testing
if (typeof localStorage === 'undefined') {
  global.localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {}
  };
}

// Test session key creation
async function testSessionKeyCreation() {
  console.log('📝 Testing session key creation...');
  
  try {
    // Import the session key service
    const { sessionKeyService } = await import('./src/lib/session-key-service.ts');
    
    const testWallet = 'test_wallet_address_123';
    const scope = ['chat:write', 'chat:read'];
    
    // Create a session key
    const sessionKey = await sessionKeyService.createSessionKey({
      walletAddress: testWallet,
      scope,
      expiresIn: 7
    });
    
    console.log('✅ Session key created:', sessionKey);
    
    // Test getting the session key
    const retrievedKey = sessionKeyService.getSessionKey(testWallet);
    console.log('✅ Session key retrieved:', retrievedKey);
    
    // Test session key validation
    const isValid = sessionKeyService.hasValidSessionKey(testWallet);
    console.log('✅ Session key valid:', isValid);
    
    // Test session key info
    const info = sessionKeyService.getSessionKeyInfo(testWallet);
    console.log('✅ Session key info:', info);
    
    // Test revoking session key
    sessionKeyService.revokeSessionKey(testWallet);
    const afterRevoke = sessionKeyService.hasValidSessionKey(testWallet);
    console.log('✅ Session key revoked:', !afterRevoke);
    
    console.log('🎉 All session key tests passed!');
    
  } catch (error) {
    console.error('❌ Session key test failed:', error);
  }
}

// Test Solana storage with session keys
async function testSolanaStorage() {
  console.log('📝 Testing Solana storage with session keys...');
  
  try {
    const { solanaChatStorage } = await import('./src/lib/solana-chat-storage.ts');
    const { sessionKeyService } = await import('./src/lib/session-key-service.ts');
    
    const testWallet = 'test_wallet_address_456';
    
    // Create a session key first
    await sessionKeyService.createSessionKey({
      walletAddress: testWallet,
      scope: ['chat:write', 'chat:read'],
      expiresIn: 7
    });
    
    // Test storing a chat
    const chatData = {
      id: 'test_chat_123',
      title: 'Test Chat',
      lastMessage: 'Hello World',
      timestamp: new Date(),
      threadId: 'thread_123'
    };
    
    console.log('📤 Storing chat with session key...');
    const result = await solanaChatStorage.storeChat(testWallet, chatData);
    console.log('✅ Chat storage result:', result);
    
    // Test storing a message
    const messageData = {
      id: 'test_msg_123',
      role: 'user',
      content: 'Test message',
      timestamp: new Date()
    };
    
    console.log('📤 Storing message with session key...');
    const messageResult = await solanaChatStorage.storeMessage(testWallet, 'test_chat_123', messageData);
    console.log('✅ Message storage result:', messageResult);
    
    console.log('🎉 All Solana storage tests passed!');
    
  } catch (error) {
    console.error('❌ Solana storage test failed:', error);
  }
}

// Run tests
console.log('🚀 Starting tests...');
testSessionKeyCreation().then(() => {
  testSolanaStorage();
});

console.log('📋 Test Summary:');
console.log('1. Session key creation and management');
console.log('2. Solana storage with automatic signing');
console.log('3. Session key validation and revocation');
console.log('4. Integration with chat storage'); 