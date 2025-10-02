const manufacturingInsightsAgent = require('../agents/manufacturingInsightsAgent');

async function testManufacturingInsights() {
  console.log('🏭 Testing Manufacturing Insights Agent...\n');
  console.log('='.repeat(60));
  
  try {
    // Test 1: Analyze RCA/CAPA Patterns
    console.log('\n📊 Test 1: Analyzing RCA/CAPA Patterns');
    console.log('-'.repeat(60));
    const analysis = await manufacturingInsightsAgent.analyzeRCAPatterns();
    
    console.log(`\nTotal RCA Records: ${analysis.totalRCARecords}`);
    console.log(`Unique Issues: ${analysis.uniqueIssues}`);
    
    console.log(`\nTop 5 Issues by Impact:`);
    analysis.patterns.slice(0, 5).forEach((pattern, idx) => {
      console.log(`\n${idx + 1}. ${pattern.issue}`);
      console.log(`   Occurrences: ${pattern.occurrences}`);
      console.log(`   Affected Vehicles: ${pattern.vehicleCount}`);
      console.log(`   Severity: ${pattern.severity.toUpperCase()}`);
      console.log(`   Impact Score: ${pattern.impact}`);
      console.log(`   Avg Cost: ₹${pattern.avgCost}`);
      console.log(`   Root Cause: ${pattern.rootCause}`);
      console.log(`   Manufacturing Feedback: ${pattern.manufacturingFeedback}`);
    });
    
    // Test 2: Generate Manufacturing Feedback Report
    console.log('\n\n📋 Test 2: Manufacturing Feedback Report');
    console.log('='.repeat(60));
    const report = await manufacturingInsightsAgent.generateFeedbackReport();
    
    console.log(`\nSummary:`);
    console.log(`   Total Issues Analyzed: ${report.summary.totalIssuesAnalyzed}`);
    console.log(`   Critical Issues: ${report.summary.criticalIssues}`);
    console.log(`   Medium Issues: ${report.summary.mediumIssues}`);
    console.log(`   Low Issues: ${report.summary.lowIssues}`);
    console.log(`   Total Financial Impact: ₹${report.summary.totalFinancialImpact.toLocaleString()}`);
    console.log(`   Systemic Issues: ${report.summary.systemicIssuesCount}`);
    
    console.log(`\n🚨 Top Recurring Issues:`);
    report.topRecurringIssues.forEach((issue, idx) => {
      console.log(`\n   ${idx + 1}. ${issue.issue}`);
      console.log(`      Occurrences: ${issue.occurrences} | Impact: ${issue.impact}`);
      console.log(`      Feedback: ${issue.manufacturingFeedback}`);
    });
    
    console.log(`\n💡 Actionable Insights:`);
    report.actionableInsights.forEach((insight, idx) => {
      console.log(`\n   ${idx + 1}. ${insight.category} [${insight.priority}]`);
      console.log(`      Issues: ${insight.issueCount}`);
      console.log(`      Cost Impact: ₹${insight.estimatedCostImpact.toLocaleString()}`);
      console.log(`      Recommendation: ${insight.recommendation}`);
    });
    
    // Test 3: Track Improvements
    console.log('\n\n📈 Test 3: Quality Improvement Trends');
    console.log('='.repeat(60));
    const trends = await manufacturingInsightsAgent.trackImprovements();
    
    console.log(`\nMonthly Trend:`);
    trends.trend.forEach(month => {
      console.log(`   ${month.month}: ${month.issueCount} issues, ₹${month.totalCost.toLocaleString()}, ${month.uniqueIssues} unique`);
    });
    
    console.log(`\nAverage Metrics:`);
    console.log(`   Avg Issues/Month: ${trends.summary.avgIssuesPerMonth}`);
    console.log(`   Avg Cost/Month: ₹${trends.summary.avgCostPerMonth.toLocaleString()}`);
    
    // Test 4: Defect Patterns by Component
    console.log('\n\n🔧 Test 4: Defect Patterns by Component');
    console.log('='.repeat(60));
    const componentPatterns = await manufacturingInsightsAgent.getDefectPatternsByComponent();
    
    componentPatterns.forEach(comp => {
      console.log(`\n${comp.component}:`);
      console.log(`   Defect Count: ${comp.defectCount}`);
      console.log(`   Total Cost: ₹${comp.totalCost.toLocaleString()}`);
      console.log(`   Issues:`);
      comp.issues.slice(0, 3).forEach(issue => {
        console.log(`      - ${issue.issue} (${issue.occurrences} times, ${issue.severity})`);
      });
    });
    
    // Test 5: CAPA Effectiveness
    console.log('\n\n✅ Test 5: CAPA Effectiveness Evaluation');
    console.log('='.repeat(60));
    const capaEval = await manufacturingInsightsAgent.evaluateCAPAEffectiveness();
    
    console.log(`\nSummary:`);
    console.log(`   Total CAPAs: ${capaEval.summary.totalCAPAs}`);
    console.log(`   High Effectiveness: ${capaEval.summary.highEffectiveness}`);
    console.log(`   Medium Effectiveness: ${capaEval.summary.mediumEffectiveness}`);
    console.log(`   Low Effectiveness: ${capaEval.summary.lowEffectiveness}`);
    
    console.log(`\nCAPA Details (Top 5):`);
    capaEval.capaResults.slice(0, 5).forEach((capa, idx) => {
      console.log(`\n   ${idx + 1}. ${capa.issue}`);
      console.log(`      Occurrences: ${capa.totalOccurrences}`);
      console.log(`      Recurrence Rate: ${capa.recurrenceRate}/month`);
      console.log(`      Effectiveness: ${capa.effectiveness}`);
      console.log(`      Action: ${capa.preventiveAction}`);
    });
    
    console.log('\n\n✅ Manufacturing Insights Agent test completed!');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

testManufacturingInsights();