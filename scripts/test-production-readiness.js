#!/usr/bin/env node

/**
 * Production Readiness Test Script for Mindscape Agent
 * This script tests all critical functionality before going live
 */

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function recordTest(name, passed, details = '') {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    log(`PASS: ${name}`, 'success');
  } else {
    testResults.failed++;
    log(`FAIL: ${name}`, 'error');
  }
  testResults.details.push({ name, passed, details });
}

async function testEndpoint(endpoint, method = 'GET', body = null) {
  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();
    
    return { success: response.ok, status: response.status, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function runTests() {
  log('🚀 Starting Production Readiness Tests for Mindscape Agent', 'info');
  log(`📍 Testing against: ${BASE_URL}`, 'info');
  log('', 'info');

  // Test 1: Basic connectivity
  log('🔌 Testing basic connectivity...', 'info');
  const connectivity = await testEndpoint('/api/test-connection');
  recordTest('Basic Connectivity', connectivity.success, 
    connectivity.success ? 'API responding' : `Status: ${connectivity.status}`);

  // Test 2: Database connectivity
  log('🗄️ Testing database connectivity...', 'info');
  const dbTest = await testEndpoint('/api/test-database');
  recordTest('Database Connectivity', dbTest.success,
    dbTest.success ? 'Database accessible' : 'Database connection failed');

  // Test 3: Authentication system
  log('🔐 Testing authentication system...', 'info');
  const authTest = await testEndpoint('/api/test-auth');
  recordTest('Authentication System', authTest.success,
    authTest.success ? 'Auth working' : 'Auth system failed');

  // Test 4: Contact management
  log('👥 Testing contact management...', 'info');
  const contactTest = await testEndpoint('/api/test-add-contact', 'POST', {
    phone_number: '+1234567890',
    name: 'Test Contact'
  });
  recordTest('Contact Management', contactTest.success,
    contactTest.success ? 'Contact created' : 'Contact creation failed');

  // Test 5: Phone number formatting
  log('📱 Testing phone number formatting...', 'info');
  const phoneTest = await testEndpoint('/api/test-phone-format');
  recordTest('Phone Number Formatting', phoneTest.success,
    phoneTest.success ? 'Formatting working' : 'Formatting failed');

  // Test 6: SMS reception simulation
  log('📨 Testing SMS reception simulation...', 'info');
  const smsTest = await testEndpoint('/api/test-sms-reception', 'POST', {
    action: 'simulate_incoming_sms',
    phoneNumber: '+1234567890',
    messageText: 'Test SMS message'
  });
  recordTest('SMS Reception Simulation', smsTest.success,
    smsTest.success ? 'SMS simulated' : 'SMS simulation failed');

  // Test 7: Webhook endpoint accessibility
  log('🔗 Testing webhook endpoint...', 'info');
  const webhookTest = await testEndpoint('/api/test-sms-reception', 'POST', {
    action: 'check_webhook'
  });
  recordTest('Webhook Endpoint', webhookTest.success,
    webhookTest.success ? 'Webhook accessible' : 'Webhook test failed');

  // Test 8: Telnyx number setup
  log('📞 Testing Telnyx number configuration...', 'info');
  const telnyxTest = await testEndpoint('/api/setup-telnyx-number');
  recordTest('Telnyx Configuration', telnyxTest.success,
    telnyxTest.success ? 'Telnyx configured' : 'Telnyx setup failed');

  // Test 9: Messaging profiles
  log('📋 Testing messaging profiles...', 'info');
  const profileTest = await testEndpoint('/api/messaging-profiles');
  recordTest('Messaging Profiles', profileTest.success,
    profileTest.success ? 'Profiles accessible' : 'Profile access failed');

  // Test 10: Real-time events
  log('⚡ Testing real-time events...', 'info');
  const eventsTest = await testEndpoint('/api/events');
  recordTest('Real-time Events', eventsTest.success,
    eventsTest.success ? 'Events working' : 'Events failed');

  // Test 11: Contact list
  log('📋 Testing contact list...', 'info');
  const contactsTest = await testEndpoint('/api/contacts');
  recordTest('Contact List', contactsTest.success,
    contactsTest.success ? 'Contacts accessible' : 'Contact access failed');

  // Test 12: Message history
  log('💬 Testing message history...', 'info');
  const messagesTest = await testEndpoint('/api/messages');
  recordTest('Message History', messagesTest.success,
    messagesTest.success ? 'Messages accessible' : 'Message access failed');

  // Test 13: Inbound settings
  log('⚙️ Testing inbound settings...', 'info');
  const settingsTest = await testEndpoint('/api/settings/inbound');
  recordTest('Inbound Settings', settingsTest.success,
    settingsTest.success ? 'Settings accessible' : 'Settings access failed');

  log('', 'info');
  log('📊 Test Results Summary:', 'info');
  log(`✅ Passed: ${testResults.passed}`, 'success');
  log(`❌ Failed: ${testResults.failed}`, 'error');
  log(`📊 Total: ${testResults.total}`, 'info');
  log(`📈 Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`, 'info');

  if (testResults.failed > 0) {
    log('', 'info');
    log('❌ Failed Tests:', 'error');
    testResults.details
      .filter(test => !test.passed)
      .forEach(test => {
        log(`   • ${test.name}: ${test.details}`, 'error');
      });
    
    log('', 'info');
    log('🚨 Production readiness check FAILED. Please fix the issues above.', 'error');
    process.exit(1);
  } else {
    log('', 'info');
    log('🎉 All tests passed! Mindscape Agent is ready for production use.', 'success');
    log('', 'info');
    log('📋 Production Checklist:', 'info');
    log('   ✅ All API endpoints responding', 'success');
    log('   ✅ Database connectivity verified', 'success');
    log('   ✅ Authentication system working', 'success');
    log('   ✅ Contact management functional', 'success');
    log('   ✅ Phone number formatting working', 'success');
    log('   ✅ SMS reception simulation working', 'success');
    log('   ✅ Webhook endpoint accessible', 'success');
    log('   ✅ Telnyx configuration ready', 'success');
    log('   ✅ Real-time events working', 'success');
    log('   ✅ All database operations functional', 'success');
    log('', 'info');
    log('🚀 Ready to deploy to production!', 'success');
  }
}

// Handle script execution
if (require.main === module) {
  runTests().catch(error => {
    log(`Fatal error during testing: ${error.message}`, 'error');
    process.exit(1);
  });
}

module.exports = { runTests, testResults };
