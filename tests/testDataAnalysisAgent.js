const dataAnalysisAgent = require('../agents/dataAnalysisAgent');

async function testDataAnalysisAgent() {
  console.log('🧪 Testing Data Analysis Agent...\n');
  
  try {
    // Test with vehicle VEH001
    const result = await dataAnalysisAgent.analyzeVehicle('VEH001');
    
    console.log('📊 Analysis Result:');
    console.log(JSON.stringify(result, null, 2));
    
    console.log('\n✅ Test completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testDataAnalysisAgent();