const fs = require('fs');
const path = require('path');

class ManufacturingInsightsAgent {
  constructor() {
    this.name = 'manufacturingInsights';
  }

  // Load maintenance history with RCA/CAPA data
  loadMaintenanceData() {
    const filePath = path.join(__dirname, '../data/synthetic/maintenance-history.json');
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  }

  // Analyze RCA/CAPA patterns
  async analyzeRCAPatterns() {
    console.log('🏭 Manufacturing Insights Agent: Analyzing RCA/CAPA patterns...');
    
    const maintenanceRecords = this.loadMaintenanceData();
    const rcaRecords = maintenanceRecords.filter(r => r.rcaData !== null);
    
    if (rcaRecords.length === 0) {
      return {
        totalIssues: 0,
        message: 'No RCA/CAPA data available'
      };
    }

    // Group by issue type
    const issuePatterns = {};
    
    rcaRecords.forEach(record => {
      const issue = record.issueReported;
      
      if (!issuePatterns[issue]) {
        issuePatterns[issue] = {
          issue,
          occurrences: 0,
          affectedVehicles: new Set(),
          dtcCodes: new Set(),
          rootCause: record.rcaData.rootCause,
          correctiveAction: record.rcaData.correctiveAction,
          preventiveAction: record.rcaData.preventiveAction,
          severity: record.rcaData.severity,
          manufacturingFeedback: record.rcaData.manufacturingFeedback,
          totalCost: 0,
          avgMileage: 0,
          totalMileage: 0,
          serviceCenters: new Set()
        };
      }
      
      issuePatterns[issue].occurrences++;
      issuePatterns[issue].affectedVehicles.add(record.vehicleId);
      issuePatterns[issue].totalCost += record.cost;
      issuePatterns[issue].totalMileage += record.mileageAtService;
      issuePatterns[issue].serviceCenters.add(record.serviceCenterLocation);
      
      if (record.diagnosticCodes) {
        record.diagnosticCodes.forEach(code => {
          issuePatterns[issue].dtcCodes.add(code);
        });
      }
    });

    // Convert sets to arrays and calculate averages
    const patterns = Object.values(issuePatterns).map(pattern => ({
      issue: pattern.issue,
      occurrences: pattern.occurrences,
      affectedVehicles: Array.from(pattern.affectedVehicles),
      vehicleCount: pattern.affectedVehicles.size,
      dtcCodes: Array.from(pattern.dtcCodes),
      rootCause: pattern.rootCause,
      correctiveAction: pattern.correctiveAction,
      preventiveAction: pattern.preventiveAction,
      severity: pattern.severity,
      manufacturingFeedback: pattern.manufacturingFeedback,
      totalCost: pattern.totalCost,
      avgCost: Math.floor(pattern.totalCost / pattern.occurrences),
      avgMileage: Math.floor(pattern.totalMileage / pattern.occurrences),
      affectedLocations: Array.from(pattern.serviceCenters),
      impact: this.calculateImpact(pattern)
    }));

    // Sort by impact (high to low)
    patterns.sort((a, b) => b.impact - a.impact);

    console.log(`✅ Analyzed ${patterns.length} unique issue patterns from ${rcaRecords.length} records`);

    return {
      totalRCARecords: rcaRecords.length,
      uniqueIssues: patterns.length,
      patterns,
      analysisDate: new Date().toISOString()
    };
  }

  // Calculate impact score
  calculateImpact(pattern) {
    const severityWeight = {
      'critical': 1.0,
      'high': 0.7,
      'medium': 0.4,
      'low': 0.2
    };

    const occurrenceScore = Math.min(pattern.occurrences / 10, 1.0); // Normalize to 0-1
    const vehicleScore = Math.min(pattern.affectedVehicles.size / 5, 1.0);
    const costScore = Math.min(pattern.totalCost / 50000, 1.0);
    const severity = severityWeight[pattern.severity] || 0.5;

    return parseFloat(
      ((occurrenceScore * 0.3) + (vehicleScore * 0.2) + (costScore * 0.2) + (severity * 0.3)).toFixed(2)
    );
  }

  // Generate manufacturing feedback report
  async generateFeedbackReport() {
    console.log('📊 Manufacturing Insights Agent: Generating feedback report...');
    
    const analysis = await this.analyzeRCAPatterns();
    
    if (analysis.totalRCARecords === 0) {
      return {
        summary: 'No manufacturing feedback data available'
      };
    }

    // Categorize by severity
    const criticalIssues = analysis.patterns.filter(p => p.severity === 'high' || p.severity === 'critical');
    const mediumIssues = analysis.patterns.filter(p => p.severity === 'medium');
    const lowIssues = analysis.patterns.filter(p => p.severity === 'low');

    // Top recurring issues
    const topRecurring = analysis.patterns.slice(0, 5);

    // Calculate total financial impact
    const totalFinancialImpact = analysis.patterns.reduce((sum, p) => sum + p.totalCost, 0);

    // Identify systemic issues (multiple vehicles affected)
    const systemicIssues = analysis.patterns.filter(p => p.vehicleCount >= 3);

    const report = {
      summary: {
        totalIssuesAnalyzed: analysis.totalRCARecords,
        uniqueIssueTypes: analysis.uniqueIssues,
        criticalIssues: criticalIssues.length,
        mediumIssues: mediumIssues.length,
        lowIssues: lowIssues.length,
        totalFinancialImpact,
        systemicIssuesCount: systemicIssues.length
      },
      topRecurringIssues: topRecurring.map(issue => ({
        issue: issue.issue,
        occurrences: issue.occurrences,
        vehicleCount: issue.vehicleCount,
        impact: issue.impact,
        severity: issue.severity,
        avgCost: issue.avgCost,
        manufacturingFeedback: issue.manufacturingFeedback
      })),
      criticalIssues: criticalIssues.map(issue => ({
        issue: issue.issue,
        rootCause: issue.rootCause,
        preventiveAction: issue.preventiveAction,
        affectedVehicles: issue.affectedVehicles,
        manufacturingFeedback: issue.manufacturingFeedback
      })),
      systemicIssues: systemicIssues.map(issue => ({
        issue: issue.issue,
        vehicleCount: issue.vehicleCount,
        occurrences: issue.occurrences,
        rootCause: issue.rootCause,
        preventiveAction: issue.preventiveAction
      })),
      actionableInsights: this.generateActionableInsights(analysis.patterns),
      reportGeneratedAt: new Date().toISOString()
    };

    console.log(`✅ Manufacturing feedback report generated`);
    
    return report;
  }

  // Generate actionable insights for manufacturing team
  generateActionableInsights(patterns) {
    const insights = [];

    // Group by root cause category
    const supplierIssues = patterns.filter(p => 
      p.manufacturingFeedback.toLowerCase().includes('supplier')
    );
    
    const assemblyIssues = patterns.filter(p => 
      p.manufacturingFeedback.toLowerCase().includes('assembly')
    );
    
    const designIssues = patterns.filter(p => 
      p.manufacturingFeedback.toLowerCase().includes('design')
    );
    
    const qualityControlIssues = patterns.filter(p => 
      p.manufacturingFeedback.toLowerCase().includes('quality')
    );

    if (supplierIssues.length > 0) {
      insights.push({
        category: 'SUPPLIER_QUALITY',
        priority: 'HIGH',
        issueCount: supplierIssues.length,
        recommendation: 'Review supplier quality standards and implement stricter inspection protocols',
        affectedComponents: supplierIssues.map(i => i.issue),
        estimatedCostImpact: supplierIssues.reduce((sum, i) => sum + i.totalCost, 0)
      });
    }

    if (assemblyIssues.length > 0) {
      insights.push({
        category: 'ASSEMBLY_PROCESS',
        priority: 'MEDIUM',
        issueCount: assemblyIssues.length,
        recommendation: 'Retrain assembly line technicians and implement torque verification systems',
        affectedComponents: assemblyIssues.map(i => i.issue),
        estimatedCostImpact: assemblyIssues.reduce((sum, i) => sum + i.totalCost, 0)
      });
    }

    if (designIssues.length > 0) {
      insights.push({
        category: 'PRODUCT_DESIGN',
        priority: 'HIGH',
        issueCount: designIssues.length,
        recommendation: 'Initiate design review and engineering change request for affected components',
        affectedComponents: designIssues.map(i => i.issue),
        estimatedCostImpact: designIssues.reduce((sum, i) => sum + i.totalCost, 0)
      });
    }

    if (qualityControlIssues.length > 0) {
      insights.push({
        category: 'QUALITY_CONTROL',
        priority: 'HIGH',
        issueCount: qualityControlIssues.length,
        recommendation: 'Enhance quality control checkpoints and implement automated inspection systems',
        affectedComponents: qualityControlIssues.map(i => i.issue),
        estimatedCostImpact: qualityControlIssues.reduce((sum, i) => sum + i.totalCost, 0)
      });
    }

    // Check for high-cost issues
    const highCostIssues = patterns.filter(p => p.avgCost > 5000);
    if (highCostIssues.length > 0) {
      insights.push({
        category: 'COST_REDUCTION',
        priority: 'CRITICAL',
        issueCount: highCostIssues.length,
        recommendation: 'Prioritize resolution of high-cost issues through immediate engineering review',
        affectedComponents: highCostIssues.map(i => i.issue),
        estimatedCostImpact: highCostIssues.reduce((sum, i) => sum + i.totalCost, 0)
      });
    }

    return insights;
  }

  // Track improvement over time
  async trackImprovements() {
    const maintenanceRecords = this.loadMaintenanceData();
    const rcaRecords = maintenanceRecords.filter(r => r.rcaData !== null);

    // Group by month
    const monthlyData = {};
    
    rcaRecords.forEach(record => {
      const date = new Date(record.serviceDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthKey,
          issueCount: 0,
          totalCost: 0,
          uniqueIssues: new Set()
        };
      }
      
      monthlyData[monthKey].issueCount++;
      monthlyData[monthKey].totalCost += record.cost;
      monthlyData[monthKey].uniqueIssues.add(record.issueReported);
    });

    // Convert to array and sort by month
    const trend = Object.values(monthlyData)
      .map(data => ({
        month: data.month,
        issueCount: data.issueCount,
        totalCost: data.totalCost,
        uniqueIssues: data.uniqueIssues.size
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return {
      trend,
      summary: {
        totalMonths: trend.length,
        avgIssuesPerMonth: trend.length > 0 
          ? Math.floor(trend.reduce((sum, t) => sum + t.issueCount, 0) / trend.length)
          : 0,
        avgCostPerMonth: trend.length > 0
          ? Math.floor(trend.reduce((sum, t) => sum + t.totalCost, 0) / trend.length)
          : 0
      }
    };
  }

  // Get defect patterns by component
  async getDefectPatternsByComponent() {
    const analysis = await this.analyzeRCAPatterns();
    
    const componentPatterns = {};
    
    analysis.patterns.forEach(pattern => {
      // Extract component from issue (simplified - in production, use NLP)
      let component = 'Other';
      
      if (pattern.issue.toLowerCase().includes('engine')) component = 'Engine';
      else if (pattern.issue.toLowerCase().includes('brake')) component = 'Brake System';
      else if (pattern.issue.toLowerCase().includes('battery')) component = 'Battery';
      else if (pattern.issue.toLowerCase().includes('oil')) component = 'Oil System';
      else if (pattern.issue.toLowerCase().includes('tire')) component = 'Tires';
      
      if (!componentPatterns[component]) {
        componentPatterns[component] = {
          component,
          defectCount: 0,
          totalCost: 0,
          issues: []
        };
      }
      
      componentPatterns[component].defectCount += pattern.occurrences;
      componentPatterns[component].totalCost += pattern.totalCost;
      componentPatterns[component].issues.push({
        issue: pattern.issue,
        occurrences: pattern.occurrences,
        severity: pattern.severity
      });
    });

    return Object.values(componentPatterns).sort((a, b) => b.defectCount - a.defectCount);
  }

  // Generate CAPA effectiveness report
  async evaluateCAPAEffectiveness() {
    const maintenanceRecords = this.loadMaintenanceData();
    const rcaRecords = maintenanceRecords.filter(r => r.rcaData !== null);

    // Track if preventive actions reduced recurrence
    const issueRecurrence = {};
    
    rcaRecords.forEach(record => {
      const issue = record.issueReported;
      const date = new Date(record.serviceDate);
      
      if (!issueRecurrence[issue]) {
        issueRecurrence[issue] = {
          issue,
          occurrences: [],
          preventiveAction: record.rcaData.preventiveAction
        };
      }
      
      issueRecurrence[issue].occurrences.push({
        date: date,
        vehicleId: record.vehicleId
      });
    });

    // Analyze effectiveness
    const capaResults = Object.values(issueRecurrence).map(data => {
      const occurrences = data.occurrences.sort((a, b) => a.date - b.date);
      const timeSpan = occurrences.length > 1 
        ? (occurrences[occurrences.length - 1].date - occurrences[0].date) / (1000 * 60 * 60 * 24)
        : 0;
      
      const recurrenceRate = occurrences.length > 1 
        ? (occurrences.length / timeSpan * 30).toFixed(2) // Per month
        : 0;

      return {
        issue: data.issue,
        totalOccurrences: occurrences.length,
        timeSpanDays: Math.floor(timeSpan),
        recurrenceRate: parseFloat(recurrenceRate),
        preventiveAction: data.preventiveAction,
        effectiveness: occurrences.length > 5 ? 'LOW' : occurrences.length > 2 ? 'MEDIUM' : 'HIGH'
      };
    });

    return {
      capaResults: capaResults.sort((a, b) => b.totalOccurrences - a.totalOccurrences),
      summary: {
        totalCAPAs: capaResults.length,
        highEffectiveness: capaResults.filter(c => c.effectiveness === 'HIGH').length,
        mediumEffectiveness: capaResults.filter(c => c.effectiveness === 'MEDIUM').length,
        lowEffectiveness: capaResults.filter(c => c.effectiveness === 'LOW').length
      }
    };
  }
}

module.exports = new ManufacturingInsightsAgent();