class UEBAService {
  constructor() {
    this.behaviorBaselines = new Map();
    this.anomalyLog = [];
    this.alertThreshold = 0.7; // 70% confidence for alerts
    
    // Define expected behavior patterns for each agent
    this.expectedBehaviors = {
      'MASTER': {
        allowedActions: [
          'Workflow started',
          'Workflow step completed',
          'Workflow completed',
          'Workflow error',
          'Delegating to Data Analysis Agent',
          'Delegating to Diagnosis Agent',
          'Customer engagement required'
        ],
        maxActionsPerMinute: 100,
        allowedDataAccess: ['workflows', 'activity_log']
      },
      'dataAnalysis': {
        allowedActions: [
          'Analyzing vehicle'
        ],
        maxActionsPerMinute: 50,
        allowedDataAccess: ['vehicles', 'sensors', 'maintenance_history']
      },
      'diagnosis': {
        allowedActions: [
          'Running diagnosis',
          'Diagnosis completed'
        ],
        maxActionsPerMinute: 50,
        allowedDataAccess: ['vehicles', 'sensors', 'maintenance_history', 'ml_model']
      },
      'customerEngagement': {
        allowedActions: [
          'Initiating contact',
          'Conversation started',
          'Recommendation sent',
          'Customer responded'
        ],
        maxActionsPerMinute: 30,
        allowedDataAccess: ['vehicles', 'customers', 'diagnosis_results']
      },
      'scheduling': {
        allowedActions: [
          'Checking availability',
          'Appointment proposed',
          'Appointment confirmed',
          'Appointment cancelled'
        ],
        maxActionsPerMinute: 40,
        allowedDataAccess: ['service_centers', 'appointments', 'customers']
      }
    };
  }

  // Initialize behavior baseline for an agent
  initializeBaseline(agentName) {
    if (!this.behaviorBaselines.has(agentName)) {
      this.behaviorBaselines.set(agentName, {
        totalActions: 0,
        actionFrequency: {},
        lastActionTime: null,
        dataAccessPatterns: {},
        anomalyCount: 0
      });
    }
  }

  // Monitor agent activity
  monitorActivity(logEntry) {
    const { agentName, action, metadata } = logEntry;
    
    this.initializeBaseline(agentName);
    const baseline = this.behaviorBaselines.get(agentName);
    const expectedBehavior = this.expectedBehaviors[agentName];

    // Update baseline
    baseline.totalActions++;
    baseline.actionFrequency[action] = (baseline.actionFrequency[action] || 0) + 1;
    baseline.lastActionTime = new Date(logEntry.timestamp);

    const anomalies = [];

    // Check 1: Unauthorized action
    if (expectedBehavior && !expectedBehavior.allowedActions.includes(action)) {
      anomalies.push({
        type: 'UNAUTHORIZED_ACTION',
        severity: 'HIGH',
        details: `Agent ${agentName} performed unauthorized action: ${action}`,
        expectedActions: expectedBehavior.allowedActions
      });
    }

    // Check 2: Unusual data access
    if (metadata.dataAccess) {
      const accessedData = metadata.dataAccess;
      if (expectedBehavior && !expectedBehavior.allowedDataAccess.includes(accessedData)) {
        anomalies.push({
          type: 'UNAUTHORIZED_DATA_ACCESS',
          severity: 'CRITICAL',
          details: `Agent ${agentName} accessed unauthorized data: ${accessedData}`,
          allowedDataAccess: expectedBehavior.allowedDataAccess
        });
      }
    }

    // Check 3: Rate limiting - too many actions
    const actionRate = this.calculateActionRate(agentName);
    if (expectedBehavior && actionRate > expectedBehavior.maxActionsPerMinute) {
      anomalies.push({
        type: 'RATE_LIMIT_EXCEEDED',
        severity: 'MEDIUM',
        details: `Agent ${agentName} exceeded rate limit: ${actionRate} actions/min (limit: ${expectedBehavior.maxActionsPerMinute})`,
        currentRate: actionRate,
        limit: expectedBehavior.maxActionsPerMinute
      });
    }

    // Check 4: Unusual timing (activity outside normal hours)
    const hour = new Date(logEntry.timestamp).getHours();
    if (hour < 6 || hour > 23) {
      anomalies.push({
        type: 'UNUSUAL_TIMING',
        severity: 'LOW',
        details: `Agent ${agentName} active at unusual hour: ${hour}:00`,
        timestamp: logEntry.timestamp
      });
    }

    // Check 5: Workflow manipulation
    if (action.includes('Workflow') && agentName !== 'MASTER') {
      anomalies.push({
        type: 'WORKFLOW_MANIPULATION',
        severity: 'CRITICAL',
        details: `Non-master agent ${agentName} attempted workflow manipulation: ${action}`
      });
    }

    // Log anomalies
    if (anomalies.length > 0) {
      baseline.anomalyCount++;
      this.logAnomaly(agentName, logEntry, anomalies);
    }

    return {
      isNormal: anomalies.length === 0,
      anomalies,
      riskScore: this.calculateRiskScore(anomalies)
    };
  }

  // Calculate action rate per minute
  calculateActionRate(agentName) {
    const baseline = this.behaviorBaselines.get(agentName);
    if (!baseline || !baseline.lastActionTime) return 0;

    const now = new Date();
    const timeDiff = (now - baseline.lastActionTime) / 1000 / 60; // minutes
    
    if (timeDiff < 1) {
      // Count actions in the last minute
      return baseline.totalActions; // Simplified - in production, track time windows
    }
    
    return 0;
  }

  // Calculate risk score
  calculateRiskScore(anomalies) {
    if (anomalies.length === 0) return 0;

    const severityWeights = {
      'CRITICAL': 1.0,
      'HIGH': 0.7,
      'MEDIUM': 0.4,
      'LOW': 0.2
    };

    const totalScore = anomalies.reduce((score, anomaly) => {
      return score + (severityWeights[anomaly.severity] || 0.5);
    }, 0);

    return Math.min(totalScore / anomalies.length, 1.0);
  }

  // Log anomaly
  logAnomaly(agentName, logEntry, anomalies) {
    const anomalyEntry = {
      id: `ANOM-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      agentName,
      originalLog: logEntry,
      anomalies,
      riskScore: this.calculateRiskScore(anomalies),
      status: 'detected',
      actionTaken: null
    };

    this.anomalyLog.push(anomalyEntry);

    // Auto-respond to critical anomalies
    const criticalAnomalies = anomalies.filter(a => a.severity === 'CRITICAL');
    if (criticalAnomalies.length > 0) {
      this.handleCriticalAnomaly(anomalyEntry);
    }

    // Keep only last 500 anomalies
    if (this.anomalyLog.length > 500) {
      this.anomalyLog.shift();
    }

    console.log(`⚠️  UEBA Alert: Anomaly detected in agent ${agentName}`);
    anomalies.forEach(anomaly => {
      console.log(`   [${anomaly.severity}] ${anomaly.type}: ${anomaly.details}`);
    });
  }

  // Handle critical anomalies
  handleCriticalAnomaly(anomalyEntry) {
    console.log(`🚨 CRITICAL ALERT: ${anomalyEntry.agentName} - Immediate action required`);
    
    anomalyEntry.actionTaken = 'ALERT_SENT';
    
    // In production, this would:
    // - Send alerts to security team
    // - Temporarily suspend agent
    // - Log to security monitoring system
    
    return {
      alert: true,
      message: `Critical security event detected`,
      anomalyId: anomalyEntry.id
    };
  }

  // Get anomaly report
  getAnomalyReport(limit = 50) {
    return this.anomalyLog.slice(-limit);
  }

  // Get agent behavior summary
  getAgentBehaviorSummary(agentName) {
    const baseline = this.behaviorBaselines.get(agentName);
    if (!baseline) {
      return { error: 'Agent not found' };
    }

    return {
      agentName,
      totalActions: baseline.totalActions,
      anomalyCount: baseline.anomalyCount,
      anomalyRate: baseline.totalActions > 0 ? 
        (baseline.anomalyCount / baseline.totalActions * 100).toFixed(2) + '%' : '0%',
      actionBreakdown: baseline.actionFrequency,
      lastActivity: baseline.lastActionTime,
      riskLevel: baseline.anomalyCount > 5 ? 'HIGH' : baseline.anomalyCount > 2 ? 'MEDIUM' : 'LOW'
    };
  }

  // Get security dashboard
  getSecurityDashboard() {
    const agents = Array.from(this.behaviorBaselines.keys());
    const agentSummaries = agents.map(agent => this.getAgentBehaviorSummary(agent));

    const recentAnomalies = this.anomalyLog.slice(-10);
    const criticalAnomalies = this.anomalyLog.filter(a => 
      a.anomalies.some(anom => anom.severity === 'CRITICAL')
    );

    return {
      timestamp: new Date().toISOString(),
      totalAgents: agents.length,
      totalAnomalies: this.anomalyLog.length,
      criticalAnomalies: criticalAnomalies.length,
      agentSummaries,
      recentAnomalies: recentAnomalies.map(a => ({
        id: a.id,
        agent: a.agentName,
        timestamp: a.timestamp,
        riskScore: a.riskScore,
        anomalyTypes: a.anomalies.map(an => an.type)
      }))
    };
  }

  // Simulate anomaly for testing
  simulateAnomaly(agentName, anomalyType) {
    const testLog = {
      timestamp: new Date().toISOString(),
      agentName,
      action: 'TEST_UNAUTHORIZED_ACTION',
      metadata: {}
    };

    switch (anomalyType) {
      case 'unauthorized_action':
        testLog.action = 'DELETE_ALL_DATA';
        break;
      case 'unauthorized_data_access':
        testLog.metadata.dataAccess = 'admin_panel';
        break;
      case 'workflow_manipulation':
        testLog.agentName = 'dataAnalysis';
        testLog.action = 'Workflow started';
        break;
    }

    return this.monitorActivity(testLog);
  }
}

module.exports = new UEBAService();