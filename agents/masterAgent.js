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

  // Orchestrate COMPLETE end-to-end workflow (All agents)
  async orchestrateCompleteWorkflow(vehicleId) {
    const workflowId = await this.startWorkflow('COMPLETE_MAINTENANCE_FLOW', { vehicleId });
    
    try {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`🎯 MASTER AGENT: Starting COMPLETE END-TO-END WORKFLOW`);
      console.log(`   Vehicle ID: ${vehicleId}`);
      console.log(`   Workflow ID: ${workflowId}`);
      console.log(`${'='.repeat(80)}\n`);
      
      // Load vehicle data
      const vehiclesPath = path.join(__dirname, '../data/synthetic/vehicles.json');
      const vehicles = JSON.parse(fs.readFileSync(vehiclesPath, 'utf8'));
      const vehicleData = vehicles.find(v => v.id === vehicleId);
      
      if (!vehicleData) {
        throw new Error(`Vehicle not found: ${vehicleId}`);
      }

      // ============================================================
      // STEP 1: DATA ANALYSIS
      // ============================================================
      console.log(`📊 STEP 1: DATA ANALYSIS`);
      console.log(`${'─'.repeat(80)}`);
      this.logActivity('MASTER', 'Delegating to Data Analysis Agent', { workflowId, vehicleId });
      const dataAnalysisAgent = this.getWorker('dataAnalysis');
      const analysisResult = await dataAnalysisAgent.analyzeVehicle(vehicleId);
      this.updateWorkflowStep(workflowId, 'DATA_ANALYSIS', analysisResult);
      
      console.log(`✅ Analysis Complete`);
      console.log(`   Requires Diagnosis: ${analysisResult.requiresDiagnosis}`);
      console.log(`   Anomalies Detected: ${analysisResult.sensorAnalysis.anomalies.length}`);
      console.log(`   Service Due: ${analysisResult.maintenanceAnalysis.isServiceDue}\n`);

      // ============================================================
      // STEP 2: DIAGNOSIS (if needed)
      // ============================================================
      let diagnosisResult = null;
      let maintenanceRequired = false;

      if (analysisResult.requiresDiagnosis) {
        console.log(`🔬 STEP 2: DIAGNOSIS`);
        console.log(`${'─'.repeat(80)}`);
        this.logActivity('MASTER', 'Delegating to Diagnosis Agent', { workflowId, vehicleId });
        const diagnosisAgent = this.getWorker('diagnosis');
        diagnosisResult = await diagnosisAgent.diagnose(vehicleId, analysisResult);
        this.updateWorkflowStep(workflowId, 'DIAGNOSIS', diagnosisResult);
        maintenanceRequired = diagnosisResult.maintenanceRequired;
        
        console.log(`✅ Diagnosis Complete`);
        console.log(`   Maintenance Required: ${maintenanceRequired}`);
        console.log(`   Overall Risk: ${diagnosisResult.overallRisk.toUpperCase()}`);
        console.log(`   Urgency Level: ${diagnosisResult.urgencyLevel.level}`);
        console.log(`   Predicted Issues: ${diagnosisResult.predictions.length}`);
        console.log(`   Estimated Cost: ₹${diagnosisResult.estimatedCost.min} - ₹${diagnosisResult.estimatedCost.max}\n`);
      } else {
        console.log(`✅ STEP 2: DIAGNOSIS - SKIPPED`);
        console.log(`   Reason: Vehicle in good condition\n`);
      }

      // ============================================================
      // STEP 3: CUSTOMER ENGAGEMENT (if maintenance required)
      // ============================================================
      let conversationResult = null;
      let customerAccepted = false;

      if (maintenanceRequired) {
        console.log(`📞 STEP 3: CUSTOMER ENGAGEMENT`);
        console.log(`${'─'.repeat(80)}`);
        this.logActivity('MASTER', 'Delegating to Customer Engagement Agent', { workflowId, vehicleId });
        const customerEngagementAgent = this.getWorker('customerEngagement');
        
        // Initiate contact
        const contactResult = await customerEngagementAgent.initiateContact(vehicleData, diagnosisResult);
        console.log(`✅ Contact Initiated`);
        console.log(`   Customer: ${contactResult.customerName}`);
        console.log(`   Phone: ${contactResult.customerPhone}`);
        console.log(`   Conversation ID: ${contactResult.conversationId}`);
        console.log(`\n   Opening Message:`);
        console.log(`   "${contactResult.openingMessage}"`);
        
        // Simulate customer response
        const customerResponses = [
          "Yes, I'd like to book an appointment",
          "Sure, please schedule it for me",
          "Okay, when can I bring it in?"
        ];
        const simulatedResponse = customerResponses[Math.floor(Math.random() * customerResponses.length)];
        
        console.log(`\n   Customer Response: "${simulatedResponse}"`);
        
        // Handle customer response
        const responseResult = await customerEngagementAgent.handleCustomerResponse(
          contactResult.conversationId,
          simulatedResponse
        );
        
        console.log(`\n   Agent Response: "${responseResult.agentResponse}"`);
        console.log(`   Intent Detected: ${responseResult.intent}`);
        console.log(`   Should Schedule: ${responseResult.shouldSchedule}`);
        
        conversationResult = {
          conversationId: contactResult.conversationId,
          customerAccepted: responseResult.shouldSchedule,
          intent: responseResult.intent
        };
        customerAccepted = responseResult.shouldSchedule;
        
        this.updateWorkflowStep(workflowId, 'CUSTOMER_ENGAGEMENT', conversationResult);
        console.log(`\n✅ Customer Engagement Complete\n`);
      } else {
        console.log(`✅ STEP 3: CUSTOMER ENGAGEMENT - SKIPPED`);
        console.log(`   Reason: No maintenance required\n`);
      }

      // ============================================================
      // STEP 4: SCHEDULING (if customer accepted)
      // ============================================================
      let appointmentResult = null;

      if (customerAccepted) {
        console.log(`📅 STEP 4: SCHEDULING`);
        console.log(`${'─'.repeat(80)}`);
        this.logActivity('MASTER', 'Delegating to Scheduling Agent', { workflowId, vehicleId });
        const schedulingAgent = this.getWorker('scheduling');
        
        // Propose appointments
        const proposedSlots = await schedulingAgent.proposeAppointments(vehicleData, diagnosisResult);
        console.log(`✅ Slots Proposed`);
        console.log(`   Service Center: ${proposedSlots.serviceCenter.name}`);
        console.log(`   Location: ${proposedSlots.serviceCenter.location}`);
        console.log(`   Available Days: ${proposedSlots.proposedSlots.length}`);
        
        if (proposedSlots.proposedSlots.length > 0) {
          // Book first available slot
          const firstDay = proposedSlots.proposedSlots[0];
          const firstSlot = firstDay.slots[0];
          
          const selectedSlot = {
            serviceCenterId: proposedSlots.serviceCenter.id,
            serviceCenterName: proposedSlots.serviceCenter.name,
            date: firstDay.date,
            time: firstSlot.time,
            endTime: firstSlot.endTime
          };
          
          const appointment = await schedulingAgent.bookAppointment(vehicleData, diagnosisResult, selectedSlot);
          
          console.log(`\n✅ Appointment Booked`);
          console.log(`   Appointment ID: ${appointment.id}`);
          console.log(`   Date: ${appointment.date}`);
          console.log(`   Time: ${appointment.time} - ${appointment.endTime}`);
          console.log(`   Service Center: ${appointment.serviceCenterName}`);
          console.log(`   Estimated Duration: ${appointment.estimatedDuration.formatted}`);
          console.log(`   Estimated Cost: ₹${appointment.estimatedCost.min} - ₹${appointment.estimatedCost.max}`);
          
          appointmentResult = appointment;
          this.updateWorkflowStep(workflowId, 'SCHEDULING', appointmentResult);
        }
        console.log();
      } else {
        console.log(`✅ STEP 4: SCHEDULING - SKIPPED`);
        console.log(`   Reason: Customer did not accept or no maintenance needed\n`);
      }

      // ============================================================
      // STEP 5: FEEDBACK COLLECTION (simulated)
      // ============================================================
      let feedbackResult = null;

      if (appointmentResult) {
        console.log(`📝 STEP 5: FEEDBACK COLLECTION (Post-Service)`);
        console.log(`${'─'.repeat(80)}`);
        this.logActivity('MASTER', 'Delegating to Feedback Agent', { workflowId, vehicleId });
        const feedbackAgent = this.getWorker('feedback');
        
        // Initiate feedback collection
        const feedbackRequest = await feedbackAgent.collectFeedback(appointmentResult);
        console.log(`✅ Feedback Request Created`);
        console.log(`   Feedback ID: ${feedbackRequest.id}`);
        console.log(`   Questions: ${feedbackRequest.questions.length}`);
        
        // Simulate feedback submission
        const simulatedFeedback = [
          { questionId: 'Q1', value: 5 },
          { questionId: 'Q2', value: 4 },
          { questionId: 'Q3', value: 5 },
          { questionId: 'Q4', value: 4 },
          { questionId: 'Q5', value: true },
          { questionId: 'Q6', value: true },
          { questionId: 'Q7', value: 'Great service, very professional team' },
          { questionId: 'Q8', value: 'Waiting area could be improved' },
          { questionId: 'Q9', value: 9 }
        ];
        
        const completedFeedback = await feedbackAgent.submitFeedback(feedbackRequest.id, simulatedFeedback);
        
        console.log(`\n✅ Feedback Submitted`);
        console.log(`   Average Rating: ${completedFeedback.analysis.averageRating}/5`);
        console.log(`   Sentiment: ${completedFeedback.analysis.sentiment}`);
        console.log(`   NPS Score: ${completedFeedback.analysis.npsScore}/10`);
        console.log(`   NPS Category: ${completedFeedback.analysis.npsCategory}`);
        
        feedbackResult = completedFeedback;
        this.updateWorkflowStep(workflowId, 'FEEDBACK', feedbackResult);
        console.log();
      } else {
        console.log(`✅ STEP 5: FEEDBACK COLLECTION - SKIPPED`);
        console.log(`   Reason: No appointment was booked\n`);
      }

      // ============================================================
      // STEP 6: MANUFACTURING INSIGHTS (Background)
      // ============================================================
      console.log(`🏭 STEP 6: MANUFACTURING INSIGHTS ANALYSIS`);
      console.log(`${'─'.repeat(80)}`);
      this.logActivity('MASTER', 'Analyzing manufacturing patterns', { workflowId });
      const manufacturingInsightsAgent = this.getWorker('manufacturingInsights');
      
      const rcaAnalysis = await manufacturingInsightsAgent.analyzeRCAPatterns();
      console.log(`✅ RCA/CAPA Analysis Complete`);
      console.log(`   Total RCA Records: ${rcaAnalysis.totalRCARecords}`);
      console.log(`   Unique Issues: ${rcaAnalysis.uniqueIssues}`);
      
      if (rcaAnalysis.patterns && rcaAnalysis.patterns.length > 0) {
        console.log(`   Top Issue: ${rcaAnalysis.patterns[0].issue}`);
        console.log(`   Occurrences: ${rcaAnalysis.patterns[0].occurrences}`);
        console.log(`   Impact Score: ${rcaAnalysis.patterns[0].impact}`);
      }
      
      this.updateWorkflowStep(workflowId, 'MANUFACTURING_INSIGHTS', rcaAnalysis);
      console.log();

      // ============================================================
      // WORKFLOW SUMMARY
      // ============================================================
      console.log(`${'='.repeat(80)}`);
      console.log(`📊 WORKFLOW SUMMARY`);
      console.log(`${'='.repeat(80)}`);
      
      const finalResult = {
        workflowId,
        vehicleId,
        vehicleInfo: {
          id: vehicleData.id,
          make: vehicleData.make,
          model: vehicleData.model,
          owner: vehicleData.ownerName
        },
        stepsCompleted: [
          '1. Data Analysis',
          analysisResult.requiresDiagnosis ? '2. Diagnosis' : '2. Diagnosis (Skipped)',
          maintenanceRequired ? '3. Customer Engagement' : '3. Customer Engagement (Skipped)',
          customerAccepted ? '4. Scheduling' : '4. Scheduling (Skipped)',
          appointmentResult ? '5. Feedback Collection' : '5. Feedback Collection (Skipped)',
          '6. Manufacturing Insights'
        ],
        results: {
          analysisResult,
          diagnosisResult,
          conversationResult,
          appointmentResult,
          feedbackResult,
          manufacturingInsights: rcaAnalysis
        },
        summary: this.generateWorkflowSummary(
          analysisResult,
          diagnosisResult,
          conversationResult,
          appointmentResult,
          feedbackResult
        ),
        completed: true,
        timestamp: new Date().toISOString()
      };

      console.log(`\n${finalResult.summary}\n`);
      console.log(`${'='.repeat(80)}\n`);
      
      return this.completeWorkflow(workflowId, finalResult);
      
    } catch (error) {
      this.logActivity('MASTER', 'Workflow error', { 
        workflowId, 
        error: error.message 
      });
      console.error(`\n❌ WORKFLOW ERROR: ${error.message}\n`);
      throw error;
    }
  }

  // Generate workflow summary
  generateWorkflowSummary(analysis, diagnosis, conversation, appointment, feedback) {
    let summary = `WORKFLOW COMPLETED SUCCESSFULLY\n`;
    summary += `\n`;
    
    if (!analysis.requiresDiagnosis) {
      summary += `✅ Vehicle Health: GOOD - No maintenance required`;
      return summary;
    }
    
    if (diagnosis) {
      summary += `⚠️  Vehicle Health: ${diagnosis.overallRisk.toUpperCase()} RISK\n`;
      summary += `   Maintenance Required: YES\n`;
      summary += `   Urgency: ${diagnosis.urgencyLevel.level}\n`;
      summary += `   Issues: ${diagnosis.predictions.length} component(s) need attention\n`;
    }
    
    if (conversation) {
      summary += `\n📞 Customer Engagement: ${conversation.customerAccepted ? 'ACCEPTED' : 'DECLINED'}\n`;
      summary += `   Customer Intent: ${conversation.intent}\n`;
    }
    
    if (appointment) {
      summary += `\n📅 Appointment Status: CONFIRMED\n`;
      summary += `   Appointment ID: ${appointment.id}\n`;
      summary += `   Scheduled: ${appointment.date} at ${appointment.time}\n`;
      summary += `   Service Center: ${appointment.serviceCenterName}\n`;
    }
    
    if (feedback) {
      summary += `\n⭐ Post-Service Feedback: COLLECTED\n`;
      summary += `   Rating: ${feedback.analysis.averageRating}/5\n`;
      summary += `   Sentiment: ${feedback.analysis.sentiment}\n`;
      summary += `   NPS: ${feedback.analysis.npsScore}/10\n`;
    }
    
    return summary;
  }
}

// Create singleton instance
const masterAgent = new MasterAgent();

module.exports = masterAgent;