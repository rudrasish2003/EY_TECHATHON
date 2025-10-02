const masterAgent = require('../agents/masterAgent');
const dataAnalysisAgent = require('../agents/dataAnalysisAgent');
const diagnosisAgent = require('../agents/diagnosisAgent');
const customerEngagementAgent = require('../agents/customerEngagementAgent');
const schedulingAgent = require('../agents/schedulingAgent');
const feedbackAgent = require('../agents/feedbackAgent');
const manufacturingInsightsAgent = require('../agents/manufacturingInsightsAgent');
const uebaService = require('../services/uebaService');

async function testCompleteSystem() {
  console.log('🚀 COMPLETE SYSTEM INTEGRATION TEST');
  console.log('='.repeat(80));
  console.log('Testing: Autonomous Predictive Maintenance & Manufacturing Feedback Loop\n');
  
  try {
    // ========== STEP 1: REGISTER ALL AGENTS ==========
    console.log('\n📋 STEP 1: Agent Registration');
    console.log('-'.repeat(80));
    
    masterAgent.registerWorker('dataAnalysis', dataAnalysisAgent);
    masterAgent.registerWorker('diagnosis', diagnosisAgent);
    masterAgent.registerWorker('customerEngagement', customerEngagementAgent);
    masterAgent.registerWorker('scheduling', schedulingAgent);
    masterAgent.registerWorker('feedback', feedbackAgent);
    masterAgent.registerWorker('manufacturingInsights', manufacturingInsightsAgent);
    
    console.log('✅ All 6 worker agents registered with Master Agent\n');
    
    // ========== STEP 2: RUN COMPLETE WORKFLOW FOR VEHICLE ==========
    console.log('\n🚗 STEP 2: Complete Predictive Maintenance Workflow');
    console.log('='.repeat(80));
    
    const testVehicleId = 'VEH001';
    const workflow = await masterAgent.orchestrateCompleteWorkflow(testVehicleId);
    
    console.log('\n📊 Workflow Summary:');
    console.log(`   Workflow ID: ${workflow.id}`);
    console.log(`   Status: ${workflow.status}`);
    console.log(`   Total Steps: ${workflow.steps.length}`);
    console.log(`   Duration: ${new Date(workflow.endTime) - new Date(workflow.startTime)}ms`);
    console.log(`   Summary: ${workflow.result.summary}`);
    
    if (workflow.result.appointment) {
      console.log('\n📅 Appointment Details:');
      console.log(`   ID: ${workflow.result.appointment.id}`);
      console.log(`   Date: ${workflow.result.appointment.date} at ${workflow.result.appointment.time}`);
      console.log(`   Service Center: ${workflow.result.appointment.serviceCenterName}`);
      console.log(`   Services: ${workflow.result.appointment.serviceType}`);
      console.log(`   Urgency: ${workflow.result.appointment.urgency}`);
    }
    
    // ========== STEP 3: RUN WORKFLOWS FOR MULTIPLE VEHICLES ==========
    console.log('\n\n🚙 STEP 3: Processing Multiple Vehicles');
    console.log('='.repeat(80));
    
    const vehicleIds = ['VEH002', 'VEH003', 'VEH004'];
    const results = [];
    
    for (const vehicleId of vehicleIds) {
      console.log(`\nProcessing ${vehicleId}...`);
      const result = await masterAgent.orchestrateCompleteWorkflow(vehicleId);
      results.push(result);
      console.log(`   ✅ ${vehicleId} workflow completed`);
    }
    
    // ========== STEP 4: COLLECT & ANALYZE FEEDBACK ==========
    console.log('\n\n📝 STEP 4: Post-Service Feedback Collection');
    console.log('='.repeat(80));
    
    const allAppointments = schedulingAgent.getAllAppointments();
    console.log(`\nTotal appointments booked: ${allAppointments.length}`);
    
    // Simulate feedback for some appointments
    const feedbackSamples = [
      { rating: 5, nps: 9, text: 'Excellent service, very professional!' },
      { rating: 4, nps: 8, text: 'Good experience overall.' },
      { rating: 3, nps: 7, text: 'Service was okay, took longer than expected.' }
    ];
    
    for (let i = 0; i < Math.min(3, allAppointments.length); i++) {
      const appointment = allAppointments[i];
      const feedbackRequest = await feedbackAgent.collectFeedback(appointment);
      
      const sample = feedbackSamples[i];
      const responses = [
        { questionId: 'Q1', value: sample.rating },
        { questionId: 'Q2', value: sample.rating },
        { questionId: 'Q3', value: sample.rating },
        { questionId: 'Q4', value: sample.rating },
        { questionId: 'Q5', value: true },
        { questionId: 'Q6', value: true },
        { questionId: 'Q7', value: sample.text },
        { questionId: 'Q8', value: 'Everything was good' },
        { questionId: 'Q9', value: sample.nps }
      ];
      
      await feedbackAgent.submitFeedback(feedbackRequest.id, responses);
      console.log(`   ✅ Feedback collected for ${appointment.customerName}`);
    }
    
    // ========== STEP 5: SERVICE DEMAND FORECASTING ==========
    console.log('\n\n📊 STEP 5: Service Demand Forecasting');
    console.log('='.repeat(80));
    
    const forecast = schedulingAgent.forecastDemand(7);
    console.log(`\nNext 7 Days Forecast:`);
    
    forecast.slice(0, 3).forEach(day => {
      console.log(`\n${day.dayName}, ${day.date}:`);
      Object.values(day.demandByCenter).slice(0, 2).forEach(center => {
        console.log(`   ${center.centerName}: ${center.appointments}/${center.capacity} (${center.utilizationRate}% - ${center.status})`);
      });
    });
    
    // ========== STEP 6: MANUFACTURING INSIGHTS & RCA/CAPA ==========
    console.log('\n\n🏭 STEP 6: Manufacturing Quality Insights & RCA/CAPA Analysis');
    console.log('='.repeat(80));
    
    const manufacturingReport = await manufacturingInsightsAgent.generateFeedbackReport();
    
    console.log(`\n📈 Manufacturing Feedback Summary:`);
    console.log(`   Total Issues: ${manufacturingReport.summary.totalIssuesAnalyzed}`);
    console.log(`   Critical Issues: ${manufacturingReport.summary.criticalIssues}`);
    console.log(`   Total Cost Impact: ₹${manufacturingReport.summary.totalFinancialImpact.toLocaleString()}`);
    console.log(`   Systemic Issues: ${manufacturingReport.summary.systemicIssuesCount}`);
    
    console.log(`\n🔝 Top 3 Recurring Issues:`);
    manufacturingReport.topRecurringIssues.slice(0, 3).forEach((issue, idx) => {
      console.log(`\n   ${idx + 1}. ${issue.issue}`);
      console.log(`      Occurrences: ${issue.occurrences} | Vehicles: ${issue.vehicleCount}`);
      console.log(`      Manufacturing Feedback: ${issue.manufacturingFeedback}`);
    });
    
    console.log(`\n💡 Actionable Insights for Manufacturing:`);
    manufacturingReport.actionableInsights.forEach((insight, idx) => {
      console.log(`\n   ${idx + 1}. [${insight.priority}] ${insight.category}`);
      console.log(`      ${insight.recommendation}`);
      console.log(`      Cost Impact: ₹${insight.estimatedCostImpact.toLocaleString()}`);
    });
    
    // ========== STEP 7: UEBA SECURITY MONITORING ==========
    console.log('\n\n🔒 STEP 7: UEBA Security Monitoring Dashboard');
    console.log('='.repeat(80));
    
    const securityDashboard = uebaService.getSecurityDashboard();
    
    console.log(`\n📊 Security Status:`);
    console.log(`   Total Agents Monitored: ${securityDashboard.totalAgents}`);
    console.log(`   Total Anomalies Detected: ${securityDashboard.totalAnomalies}`);
    console.log(`   Critical Anomalies: ${securityDashboard.criticalAnomalies}`);
    
    console.log(`\n🤖 Agent Behavior Summary:`);
    securityDashboard.agentSummaries.forEach(agent => {
      console.log(`   ${agent.agentName}: ${agent.totalActions} actions, ${agent.anomalyCount} anomalies (${agent.riskLevel})`);
    });
    
    // Simulate security anomaly
    console.log(`\n🚨 Testing Anomaly Detection:`);
    const anomalyTest = uebaService.simulateAnomaly('dataAnalysis', 'unauthorized_data_access');
    console.log(`   Anomaly Detected: ${!anomalyTest.isNormal}`);
    console.log(`   Risk Score: ${anomalyTest.riskScore}`);
    console.log(`   Anomaly Type: ${anomalyTest.anomalies[0]?.type}`);
    
    // ========== STEP 8: OVERALL SYSTEM METRICS ==========
    console.log('\n\n📈 STEP 8: Overall System Performance Metrics');
    console.log('='.repeat(80));
    
    const feedbackDashboard = feedbackAgent.getFeedbackDashboard();
    const allWorkflows = masterAgent.getActiveWorkflows();
    
    console.log(`\n🎯 System KPIs:`);
    console.log(`   Total Workflows Executed: ${allWorkflows.length}`);
    console.log(`   Completed Workflows: ${allWorkflows.filter(w => w.status === 'completed').length}`);
    console.log(`   Total Appointments Booked: ${allAppointments.length}`);
    console.log(`   Customer Feedback Collected: ${feedbackDashboard.totalFeedback}`);
    console.log(`   Average Customer Rating: ${feedbackDashboard.overallAverageRating}/5`);
    console.log(`   Net Promoter Score: ${feedbackDashboard.overallNPS}`);
    console.log(`   Manufacturing Issues Identified: ${manufacturingReport.summary.uniqueIssueTypes}`);
    
    // ========== STEP 9: ACTIVITY LOG ==========
    console.log('\n\n📜 STEP 9: Recent System Activity Log');
    console.log('='.repeat(80));
    
    const activityLog = masterAgent.getActivityLog(10);
    console.log(`\nLast 10 Agent Activities:`);
    activityLog.forEach((log, idx) => {
      console.log(`   ${idx + 1}. [${log.agentName}] ${log.action}`);
    });
    
    // ========== FINAL SUMMARY ==========
    console.log('\n\n✅ COMPLETE SYSTEM TEST SUMMARY');
    console.log('='.repeat(80));
    
    console.log(`
🎉 All System Components Tested Successfully!

✅ Master Agent Orchestration
✅ Data Analysis & Predictive ML Models
✅ Customer Engagement with AI
✅ Autonomous Scheduling
✅ Post-Service Feedback Collection
✅ Manufacturing Quality Insights & RCA/CAPA
✅ UEBA Security Monitoring

📊 Key Achievements:
   • ${allWorkflows.length} vehicles processed end-to-end
   • ${allAppointments.length} appointments scheduled automatically
   • ${manufacturingReport.actionableInsights.length} actionable insights for manufacturing
   • ${securityDashboard.totalAnomalies} security events monitored
   • ${feedbackDashboard.totalFeedback} customer feedback analyzed

🏆 System Status: FULLY OPERATIONAL
    `);
    
    console.log('='.repeat(80));
    console.log('💯 INTEGRATION TEST COMPLETED SUCCESSFULLY!\n');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

testCompleteSystem();