const masterAgent = require('../agents/masterAgent');
const dataAnalysisAgent = require('../agents/dataAnalysisAgent');
const diagnosisAgent = require('../agents/diagnosisAgent');

async function testMasterAgent() {
  console.log('🧪 Testing Master Agent Orchestration...\n');
  console.log('='.repeat(60));
  
  try {
    // Register worker agents
    console.log('\n📋 Step 1: Registering Worker Agents...');
    masterAgent.registerWorker('dataAnalysis', dataAnalysisAgent);
    masterAgent.registerWorker('diagnosis', diagnosisAgent);
    console.log('✅ All workers registered\n');
    
    // Test orchestration for multiple vehicles
    const testVehicles = ['VEH001', 'VEH002', 'VEH003'];
    
    for (const vehicleId of testVehicles) {
      console.log('\n' + '='.repeat(60));
      console.log(`\n🚗 Testing vehicle: ${vehicleId}`);
      console.log('-'.repeat(60));
      
      const result = await masterAgent.orchestratePredictiveMaintenance(vehicleId);
      
      console.log('\n📊 Workflow Result:');
      console.log(`   Workflow ID: ${result.id}`);
      console.log(`   Status: ${result.status}`);
      console.log(`   Duration: ${new Date(result.endTime) - new Date(result.startTime)}ms`);
      console.log(`   Steps Completed: ${result.steps.length}`);
      
      if (result.result.diagnosisResult) {
        const diagnosis = result.result.diagnosisResult;
        console.log(`\n   🔍 Diagnosis Summary:`);
        console.log(`      Risk Level: ${diagnosis.overallRisk.toUpperCase()}`);
        console.log(`      Urgency: ${diagnosis.urgencyLevel.level}`);
        console.log(`      Estimated Cost: ₹${diagnosis.estimatedCost.min}-${diagnosis.estimatedCost.max}`);
        console.log(`      Message: ${diagnosis.diagnosticSummary}`);
      }
      
      console.log('\n' + '-'.repeat(60));
    }
    
    // Show activity log
    console.log('\n\n📝 Activity Log (Last 10 entries):');
    console.log('='.repeat(60));
    const logs = masterAgent.getActivityLog(10);
    logs.forEach(log => {
      console.log(`[${log.timestamp}] ${log.agentName}: ${log.action}`);
    });
    
    // Show all active workflows
    console.log('\n\n📂 Active Workflows:');
    console.log('='.repeat(60));
    const workflows = masterAgent.getActiveWorkflows();
    workflows.forEach(wf => {
      console.log(`${wf.id} - ${wf.type} - ${wf.status}`);
    });
    
    console.log('\n\n✅ Master Agent orchestration test completed successfully!');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

testMasterAgent();