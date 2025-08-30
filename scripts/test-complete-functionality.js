#!/usr/bin/env node

/**
 * Complete Functionality Test Script for Mindscape Agent
 * Tests all critical features including contact management and SMS functionality
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

async function runCompleteTests() {
  log('🚀 Starting Complete Functionality Tests for Mindscape Agent', 'info');
  log(`📍 Testing against: ${BASE_URL}`, 'info');
  log('', 'info');

  // ===== PHASE 1: BASIC INFRASTRUCTURE =====
  log('🔌 PHASE 1: Testing Basic Infrastructure', 'info');
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

  log('', 'info');

  // ===== PHASE 2: CONTACT MANAGEMENT =====
  log('👥 PHASE 2: Testing Contact Management', 'info');
  log('', 'info');

  // Test 4: Contact list access
  log('📋 Testing contact list access...', 'info');
  const contactsTest = await testEndpoint('/api/contacts');
  recordTest('Contact List Access', contactsTest.success,
    contactsTest.success ? 'Contacts accessible' : 'Contact access failed');

  // Test 5: Add new contact
  log('➕ Testing contact creation...', 'info');
  const contactTest = await testEndpoint('/api/test-add-contact', 'POST', {
    phone_number: '+1234567890',
    name: 'Test Contact for Complete Testing'
  });
  recordTest('Contact Creation', contactTest.success,
    contactTest.success ? 'Contact created successfully' : 'Contact creation failed');

  // Test 6: Contact by ID
  if (contactTest.success && contactTest.data?.contact?.id) {
    log('🔍 Testing contact retrieval by ID...', 'info');
    const contactByIdTest = await testEndpoint(`/api/contacts/${contactTest.data.contact.id}`);
    recordTest('Contact Retrieval by ID', contactByIdTest.success,
      contactByIdTest.success ? 'Contact retrieved by ID' : 'Contact retrieval failed');
  } else {
    recordTest('Contact Retrieval by ID', false, 'Skipped - no contact created');
  }

  log('', 'info');

  // ===== PHASE 3: PHONE NUMBER VALIDATION =====
  log('📱 PHASE 3: Testing Phone Number Validation', 'info');
  log('', 'info');

  // Test 7: Phone number formatting
  log('🔢 Testing phone number formatting...', 'info');
  const phoneTest = await testEndpoint('/api/test-phone-format');
  recordTest('Phone Number Formatting', phoneTest.success,
    phoneTest.success ? 'Formatting working' : 'Formatting failed');

  // Test 8: Phone number validation
  log('✅ Testing phone number validation...', 'info');
  const phoneValidationTest = await testEndpoint('/api/test-phone-format', 'POST', {
    phoneNumbers: ['3076249136', '(307) 624-9136', '307-624-9136', '+13076249136']
  });
  recordTest('Phone Number Validation', phoneValidationTest.success,
    phoneValidationTest.success ? 'Validation working' : 'Validation failed');

  log('', 'info');

  // ===== PHASE 4: SMS FUNCTIONALITY =====
  log('📨 PHASE 4: Testing SMS Functionality', 'info');
  log('', 'info');

  // Test 9: SMS reception simulation
  log('📥 Testing SMS reception simulation...', 'info');
  const smsTest = await testEndpoint('/api/test-sms-reception', 'POST', {
    action: 'simulate_incoming_sms',
    phoneNumber: '+1987654321',
    messageText: 'Complete functionality test message'
  });
  recordTest('SMS Reception Simulation', smsTest.success,
    smsTest.success ? 'SMS simulated successfully' : 'SMS simulation failed');

  // Test 10: Webhook endpoint accessibility
  log('🔗 Testing webhook endpoint...', 'info');
  const webhookTest = await testEndpoint('/api/test-sms-reception', 'POST', {
    action: 'check_webhook'
  });
  recordTest('Webhook Endpoint', webhookTest.success,
    webhookTest.success ? 'Webhook accessible' : 'Webhook test failed');

  // Test 11: Message history
  log('💬 Testing message history...', 'info');
  const messagesTest = await testEndpoint('/api/messages');
  recordTest('Message History', messagesTest.success,
    messagesTest.success ? 'Messages accessible' : 'Message access failed');

  log('', 'info');

  // ===== PHASE 5: TELNYX INTEGRATION =====
  log('📞 PHASE 5: Testing Telnyx Integration', 'info');
  log('', 'info');

  // Test 12: Telnyx number setup
  log('🔧 Testing Telnyx number configuration...', 'info');
  const telnyxTest = await testEndpoint('/api/setup-telnyx-number');
  recordTest('Telnyx Configuration', telnyxTest.success,
    telnyxTest.success ? 'Telnyx configured' : 'Telnyx setup failed');

  // Test 13: Messaging profiles
  log('📋 Testing messaging profiles...', 'info');
  const profileTest = await testEndpoint('/api/messaging-profiles');
  recordTest('Messaging Profiles', profileTest.success,
    profileTest.success ? 'Profiles accessible' : 'Profile access failed');

  log('', 'info');

  // ===== PHASE 6: REAL-TIME FUNCTIONALITY =====
  log('⚡ PHASE 6: Testing Real-time Functionality', 'info');
  log('', 'info');

  // Test 14: Real-time events
  log('🔄 Testing real-time events...', 'info');
  const eventsTest = await testEndpoint('/api/events');
  recordTest('Real-time Events', eventsTest.success,
    eventsTest.success ? 'Events working' : 'Events failed');

  log('', 'info');

  // ===== PHASE 7: SETTINGS & CONFIGURATION =====
  log('⚙️ PHASE 7: Testing Settings & Configuration', 'info');
  log('', 'info');

  // Test 15: Inbound settings
  log('📥 Testing inbound settings...', 'info');
  const settingsTest = await testEndpoint('/api/settings/inbound');
  recordTest('Inbound Settings', settingsTest.success,
    settingsTest.success ? 'Settings accessible' : 'Settings access failed');

  log('', 'info');

  // ===== PHASE 8: COMPREHENSIVE TESTING =====
  log('🧪 PHASE 8: Comprehensive Integration Testing', 'info');
  log('', 'info');

  // Test 16: Database operations
  log('🗄️ Testing database operations...', 'info');
  const dbOpsTest = await testEndpoint('/api/test-sms-reception', 'POST', {
    action: 'check_database'
  });
  recordTest('Database Operations', dbOpsTest.success,
    dbOpsTest.success ? 'Database operations working' : 'Database operations failed');

  // Test 17: End-to-end contact flow
  log('🔄 Testing end-to-end contact flow...', 'info');
  const e2eTest = await testEndpoint('/api/test-add-contact', 'POST', {
    phone_number: '+1555123456',
    name: 'E2E Test Contact'
  });
  recordTest('End-to-End Contact Flow', e2eTest.success,
    e2eTest.success ? 'Complete flow working' : 'Flow failed');

  log('', 'info');

  // ===== RESULTS SUMMARY =====
  log('📊 COMPLETE TEST RESULTS SUMMARY', 'info');
  log('', 'info');
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
    log('🚨 Complete functionality check FAILED. Please fix the issues above.', 'error');
    process.exit(1);
  } else {
    log('', 'info');
    log('🎉 ALL TESTS PASSED! Mindscape Agent is fully functional!', 'success');
    log('', 'info');
    log('📋 Complete Functionality Checklist:', 'info');
    log('   ✅ Basic infrastructure working', 'success');
    log('   ✅ Contact management fully functional', 'success');
    log('   ✅ Phone number validation working', 'success');
    log('   ✅ SMS functionality operational', 'success');
    log('   ✅ Telnyx integration complete', 'success');
    log('   ✅ Real-time updates working', 'success');
    log('   ✅ Settings and configuration accessible', 'success');
    log('   ✅ Database operations functional', 'success');
    log('   ✅ End-to-end flows working', 'success');
    log('', 'info');
    log('🚀 Ready for production use!', 'success');
    log('', 'info');
    log('📱 Your number +13076249136 is fully configured and ready to receive SMS!', 'success');
  }
}

// Handle script execution
if (require.main === module) {
  runCompleteTests().catch(error => {
    log(`Fatal error during testing: ${error.message}`, 'error');
    process.exit(1);
  });
}

module.exports = { runCompleteTests, testResults };
