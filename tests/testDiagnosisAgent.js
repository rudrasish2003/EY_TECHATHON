const diagnosisAgent = require('../agents/diagnosisAgent');
const dataAnalysisAgent = require('../agents/dataAnalysisAgent');

async function testDiagnosisAgent() {
  console.log('🧪 Testing Diagnosis Agent...\n');
  
  try {
    // First, run data analysis
    console.log('Step 1: Running Data Analysis...');
    const analysisResult = await dataAnalysisAgent.analyzeVehicle('VEH001');
    console.log('✅ Data Analysis complete\n');
    
    // Then, run diagnosis
    console.log('Step 2: Running Diagnosis with ML Model...');
    const diagnosisResult = await diagnosisAgent.diagnose('VEH001', analysisResult);
    
    console.log('\n📋 Diagnosis Report:');
    console.log(JSON.stringify(diagnosisResult, null, 2));
    
    console.log('\n✅ Diagnosis Agent test completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

testDiagnosisAgent();