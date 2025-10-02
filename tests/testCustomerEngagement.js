const customerEngagementAgent = require('../agents/customerEngagementAgent');
const diagnosisAgent = require('../agents/diagnosisAgent');
const dataAnalysisAgent = require('../agents/dataAnalysisAgent');
const fs = require('fs');
const path = require('path');

async function testCustomerEngagement() {
  console.log('📞 Testing Customer Engagement Agent...\n');
  console.log('='.repeat(60));
  
  try {
    // Load test vehicle
    const vehiclesPath = path.join(__dirname, '../data/synthetic/vehicles.json');
    const vehicles = JSON.parse(fs.readFileSync(vehiclesPath, 'utf8'));
    const testVehicle = vehicles[0];
    
    // Run analysis and diagnosis
    console.log('Step 1: Running vehicle analysis...');
    const analysis = await dataAnalysisAgent.analyzeVehicle(testVehicle.id);
    
    console.log('Step 2: Running diagnosis...');
    const diagnosis = await diagnosisAgent.diagnose(testVehicle.id, analysis);
    
    // Initiate customer contact
    console.log('\nStep 3: Initiating customer contact...');
    console.log('-'.repeat(60));
    const contact = await customerEngagementAgent.initiateContact(testVehicle, diagnosis);
    
    console.log(`\n📱 Calling: ${contact.customerName} at ${contact.customerPhone}`);
    console.log(`\n🤖 Agent says:`);
    console.log(`"${contact.openingMessage}"`);
    
    // Simulate customer responses
    console.log('\n\nTest Case 1: Customer Accepts');
    console.log('-'.repeat(60));
    const response1 = await customerEngagementAgent.handleCustomerResponse(
      contact.conversationId,
      "Yes, that sounds good. I'd like to book an appointment."
    );
    console.log(`👤 Customer: "Yes, that sounds good. I'd like to book an appointment."`);
    console.log(`🤖 Agent: "${response1.agentResponse}"`);
    console.log(`📊 Intent Detected: ${response1.intent}`);
    console.log(`📅 Should Schedule: ${response1.shouldSchedule}`);
    
    // Test Case 2: New conversation - Customer Declines
    console.log('\n\nTest Case 2: Customer Declines');
    console.log('-'.repeat(60));
    const contact2 = await customerEngagementAgent.initiateContact(testVehicle, diagnosis);
    const response2 = await customerEngagementAgent.handleCustomerResponse(
      contact2.conversationId,
      "Not right now, maybe later."
    );
    console.log(`👤 Customer: "Not right now, maybe later."`);
    console.log(`🤖 Agent: "${response2.agentResponse}"`);
    console.log(`📊 Intent Detected: ${response2.intent}`);
    
    // Test Case 3: Customer Has Questions
    console.log('\n\nTest Case 3: Customer Has Questions');
    console.log('-'.repeat(60));
    const contact3 = await customerEngagementAgent.initiateContact(testVehicle, diagnosis);
    const response3 = await customerEngagementAgent.handleCustomerResponse(
      contact3.conversationId,
      "What exactly is wrong with my car?"
    );
    console.log(`👤 Customer: "What exactly is wrong with my car?"`);
    console.log(`🤖 Agent: "${response3.agentResponse}"`);
    console.log(`📊 Intent Detected: ${response3.intent}`);
    
    // Show conversation history
    console.log('\n\n📜 Conversation History (First Conversation):');
    console.log('='.repeat(60));
    const conversation = customerEngagementAgent.getConversation(contact.conversationId);
    conversation.messages.forEach((msg, idx) => {
      console.log(`\n[${idx + 1}] ${msg.role.toUpperCase()}:`);
      console.log(`    ${msg.content}`);
      console.log(`    Time: ${msg.timestamp}`);
    });
    
    console.log('\n\n✅ Customer Engagement Agent test completed!');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

testCustomerEngagement();