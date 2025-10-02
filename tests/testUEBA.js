const uebaService = require('../services/uebaService');
const masterAgent = require('../agents/masterAgent');
const dataAnalysisAgent = require('../agents/dataAnalysisAgent');
const diagnosisAgent = require('../agents/diagnosisAgent');

async function testUEBA() {
  console.log('🔒 Testing UEBA Security Monitoring...\n');
  console.log('='.repeat(60));
  
  try {
    // Register agents
    masterAgent.registerWorker('dataAnalysis', dataAnalysisAgent);
    masterAgent.registerWorker('diagnosis', diagnosisAgent);
    
    console.log('\n📋 Test 1: Normal Agent Behavior');
    console.log('-'.repeat(60));
    
    // Run normal workflow
    await masterAgent.orchestratePredictiveMaintenance('VEH001');
    console.log('✅ Normal workflow completed\n');
    
    console.log('\n🚨 Test 2: Simulating Security Anomalies');
    console.log('-'.repeat(60));
    
    // Test 1: Unauthorized Action
    console.log('\n1️⃣  Simulating: Unauthorized Action');
    const anomaly1 = uebaService.simulateAnomaly('dataAnalysis', 'unauthorized_action');
    console.log(`   Result: ${anomaly1.isNormal ? 'Normal' : 'ANOMALY DETECTED'}`);
    console.log(`   Risk Score: ${anomaly1.riskScore}`);
    
    // Test 2: Unauthorized Data Access
    console.log('\n2️⃣  Simulating: Unauthorized Data Access');
    const anomaly2 = uebaService.simulateAnomaly('diagnosis', 'unauthorized_data_access');
    console.log(`   Result: ${anomaly2.isNormal ? 'Normal' : 'ANOMALY DETECTED'}`);
    console.log(`   Risk Score: ${anomaly2.riskScore}`);
    
    // Test 3: Workflow Manipulation (Non-master agent trying to control workflow)
    console.log('\n3️⃣  Simulating: Workflow Manipulation by Worker Agent');
    const anomaly3 = uebaService.simulateAnomaly('dataAnalysis', 'workflow_manipulation');
    console.log(`   Result: ${anomaly3.isNormal ? 'Normal' : 'ANOMALY DETECTED'}`);
    console.log(`   Risk Score: ${anomaly3.riskScore}`);
    
    console.log('\n\n📊 Security Dashboard');
    console.log('='.repeat(60));
    const dashboard = uebaService.getSecurityDashboard();
    console.log(JSON.stringify(dashboard, null, 2));
    
    console.log('\n\n📈 Agent Behavior Summaries');
    console.log('='.repeat(60));
    const agents = ['MASTER', 'dataAnalysis', 'diagnosis'];
    agents.forEach(agent => {
      const summary = uebaService.getAgentBehaviorSummary(agent);
      if (!summary.error) {
        console.log(`\n${agent}:`);
        console.log(`   Total Actions: ${summary.totalActions}`);
        console.log(`   Anomalies: ${summary.anomalyCount} (${summary.anomalyRate})`);
        console.log(`   Risk Level: ${summary.riskLevel}`);
      }
    });
    
    console.log('\n\n⚠️  Recent Anomalies');
    console.log('='.repeat(60));
    const anomalies = uebaService.getAnomalyReport(5);
    anomalies.forEach(anom => {
      console.log(`\n[${anom.id}] ${anom.agentName} - Risk: ${anom.riskScore.toFixed(2)}`);
      anom.anomalies.forEach(a => {
        console.log(`   [${a.severity}] ${a.type}`);
        console.log(`   Details: ${a.details}`);
      });
    });
    
    console.log('\n\n✅ UEBA test completed successfully!');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

testUEBA();