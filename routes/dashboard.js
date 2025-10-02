const express = require('express');
const router = express.Router();
const masterAgent = require('../agents/masterAgent');
const schedulingAgent = require('../agents/schedulingAgent');
const feedbackAgent = require('../agents/feedbackAgent');
const manufacturingInsightsAgent = require('../agents/manufacturingInsightsAgent');
const uebaService = require('../services/uebaService');

// Main dashboard overview
router.get('/overview', async (req, res) => {
  try {
    const workflows = masterAgent.getActiveWorkflows();
    const appointments = schedulingAgent.getAllAppointments();
    const feedbackDashboard = feedbackAgent.getFeedbackDashboard();
    const securityDashboard = uebaService.getSecurityDashboard();
    
    res.json({
      success: true,
      data: {
        workflows: {
          total: workflows.length,
          completed: workflows.filter(w => w.status === 'completed').length,
          active: workflows.filter(w => w.status === 'started').length
        },
        appointments: {
          total: appointments.length,
          upcoming: schedulingAgent.getUpcomingAppointments().length
        },
        feedback: {
          total: feedbackDashboard.totalFeedback,
          averageRating: feedbackDashboard.overallAverageRating,
          nps: feedbackDashboard.overallNPS
        },
        security: {
          totalAgents: securityDashboard.totalAgents,
          anomalies: securityDashboard.totalAnomalies,
          criticalAnomalies: securityDashboard.criticalAnomalies
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Manufacturing insights endpoint
router.get('/manufacturing-insights', async (req, res) => {
  try {
    const report = await manufacturingInsightsAgent.generateFeedbackReport();
    
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Service demand forecast
router.get('/demand-forecast', (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const forecast = schedulingAgent.forecastDemand(days);
    
    res.json({
      success: true,
      data: forecast
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// UEBA security status
router.get('/security-status', (req, res) => {
  try {
    const dashboard = uebaService.getSecurityDashboard();
    
    res.json({
      success: true,
      data: dashboard
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Trigger predictive maintenance for a vehicle
router.post('/trigger-maintenance/:vehicleId', async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const workflow = await masterAgent.orchestrateCompleteWorkflow(vehicleId);
    
    res.json({
      success: true,
      data: workflow
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;