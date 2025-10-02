const fs = require('fs');
const path = require('path');
const uebaService = require('../services/uebaService');

class MasterAgent {
  constructor() {
    this.workerAgents = new Map();
    this.activeWorkflows = new Map();
    this.activityLog = [];
  }

  // Register a worker agent
  registerWorker(agentName, agentInstance) {
    this.workerAgents.set(agentName, agentInstance);
    this.logActivity('SYSTEM', `Worker agent registered: ${agentName}`);
    console.log(`✅ Registered worker: ${agentName}`);
  }

  // Get a worker agent
  getWorker(agentName) {
    if (!this.workerAgents.has(agentName)) {
      throw new Error(`Worker agent not found: ${agentName}`);
    }
    return this.workerAgents.get(agentName);
  }

  // Log agent activity for UEBA monitoring
  logActivity(agentName, action, metadata = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      agentName,
      action,
      metadata,
      workflowId: metadata.workflowId || null
    };
    
    this.activityLog.push(logEntry);
    
    // UEBA monitoring
    const uebaResult = uebaService.monitorActivity(logEntry);
    if (!uebaResult.isNormal) {
      console.log(`⚠️  UEBA: Anomaly detected for ${agentName} - Risk Score: ${uebaResult.riskScore}`);
    }
    
    // Keep only last 1000 logs in memory
    if (this.activityLog.length > 1000) {
      this.activityLog.shift();
    }
    
    return logEntry;
  }

  // Start a workflow
  async startWorkflow(workflowType, data) {
    const workflowId = `WF-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    this.activeWorkflows.set(workflowId, {
      id: workflowId,
      type: workflowType,
      status: 'started',
      startTime: new Date().toISOString(),
      data,
      steps: []
    });
    
    this.logActivity('MASTER', `Workflow started: ${workflowType}`, { 
      workflowId, 
      data 
    });
    
    return workflowId;
  }

  // Update workflow step
  updateWorkflowStep(workflowId, stepName, result) {
    const workflow = this.activeWorkflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }
    
    workflow.steps.push({
      stepName,
      timestamp: new Date().toISOString(),
      result
    });
    
    this.logActivity('MASTER', `Workflow step completed: ${stepName}`, { 
      workflowId, 
      stepName 
    });
  }

  // Complete workflow
  completeWorkflow(workflowId, finalResult) {
    const workflow = this.activeWorkflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }
    
    workflow.status = 'completed';
    workflow.endTime = new Date().toISOString();
    workflow.result = finalResult;
    
    this.logActivity('MASTER', `Workflow completed: ${workflow.type}`, { 
      workflowId,
      duration: new Date(workflow.endTime) - new Date(workflow.startTime)
    });
    
    return workflow;
  }

  // Get workflow status
  getWorkflowStatus(workflowId) {
    return this.activeWorkflows.get(workflowId);
  }

  // Get all active workflows
  getActiveWorkflows() {
    return Array.from(this.activeWorkflows.values());
  }

  // Get activity log
  getActivityLog(limit = 100) {
    return this.activityLog.slice(-limit);
  }

  // Orchestrate predictive maintenance workflow
  async orchestratePredictiveMaintenance(vehicleId) {
    const workflowId = await this.startWorkflow('PREDICTIVE_MAINTENANCE', { vehicleId });
    
    try {
      console.log(`\n🎯 Master Agent: Starting predictive maintenance workflow for ${vehicleId}`);
      
      // Step 1: Analyze vehicle data
      this.logActivity('MASTER', 'Delegating to Data Analysis Agent', { workflowId, vehicleId });
      const dataAnalysisAgent = this.getWorker('dataAnalysis');
      const analysisResult = await dataAnalysisAgent.analyzeVehicle(vehicleId);
      this.updateWorkflowStep(workflowId, 'DATA_ANALYSIS', analysisResult);
      console.log(`✅ Step 1 Complete: Data Analysis - Requires Diagnosis: ${analysisResult.requiresDiagnosis}`);
      
      // Step 2: Run diagnosis if issues detected
      if (analysisResult.requiresDiagnosis) {
        this.logActivity('MASTER', 'Delegating to Diagnosis Agent', { workflowId, vehicleId });
        const diagnosisAgent = this.getWorker('diagnosis');
        const diagnosisResult = await diagnosisAgent.diagnose(vehicleId, analysisResult);
        this.updateWorkflowStep(workflowId, 'DIAGNOSIS', diagnosisResult);
        console.log(`✅ Step 2 Complete: Diagnosis - Maintenance Required: ${diagnosisResult.maintenanceRequired}`);
        
        // Step 3: Engage customer if maintenance needed
        if (diagnosisResult.maintenanceRequired) {
          this.logActivity('MASTER', 'Customer engagement required', { workflowId, vehicleId });
          console.log(`📞 Step 3: Customer engagement needed - ${diagnosisResult.urgencyLevel.level} priority`);
          
          this.updateWorkflowStep(workflowId, 'CUSTOMER_ENGAGEMENT', { 
            status: 'pending',
            urgency: diagnosisResult.urgencyLevel,
            estimatedCost: diagnosisResult.estimatedCost
          });
        }
      } else {
        console.log(`✅ Vehicle ${vehicleId} is in good condition. No action needed.`);
      }
      
      const finalResult = {
        workflowId,
        vehicleId,
        completed: true,
        analysisResult,
        diagnosisResult: analysisResult.requiresDiagnosis ? this.getWorkflowStatus(workflowId).steps.find(s => s.stepName === 'DIAGNOSIS')?.result : null,
        summary: analysisResult.requiresDiagnosis ? 
          'Predictive maintenance workflow completed - Action required' : 
          'Vehicle health check completed - No issues detected'
      };
      
      return this.completeWorkflow(workflowId, finalResult);
      
    } catch (error) {
      this.logActivity('MASTER', 'Workflow error', { 
        workflowId, 
        error: error.message 
      });
      console.error(`❌ Workflow error: ${error.message}`);
      throw error;
    }
  }
}

// Create singleton instance
const masterAgent = new MasterAgent();

module.exports = masterAgent;