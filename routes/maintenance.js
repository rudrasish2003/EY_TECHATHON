const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Load maintenance data
function loadMaintenanceData() {
  const filePath = path.join(__dirname, '../data/synthetic/maintenance-history.json');
  const data = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(data);
}

// GET all maintenance records
router.get('/', (req, res) => {
  try {
    const records = loadMaintenanceData();
    res.json({
      success: true,
      count: records.length,
      data: records
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to load maintenance records',
      message: error.message
    });
  }
});

// GET maintenance records for specific vehicle
router.get('/vehicle/:vehicleId', (req, res) => {
  try {
    const records = loadMaintenanceData();
    const vehicleRecords = records.filter(r => r.vehicleId === req.params.vehicleId);
    
    if (vehicleRecords.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No maintenance records found for this vehicle'
      });
    }
    
    // Sort by date (most recent first)
    vehicleRecords.sort((a, b) => new Date(b.serviceDate) - new Date(a.serviceDate));
    
    res.json({
      success: true,
      count: vehicleRecords.length,
      data: vehicleRecords
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to load maintenance records',
      message: error.message
    });
  }
});

// GET records with RCA/CAPA data (for manufacturing insights)
router.get('/rca-capa', (req, res) => {
  try {
    const records = loadMaintenanceData();
    const rcaRecords = records.filter(r => r.rcaData !== null);
    
    res.json({
      success: true,
      count: rcaRecords.length,
      data: rcaRecords
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to load RCA/CAPA records',
      message: error.message
    });
  }
});

// GET manufacturing feedback summary
router.get('/manufacturing-insights', (req, res) => {
  try {
    const records = loadMaintenanceData();
    const rcaRecords = records.filter(r => r.rcaData !== null);
    
    // Group by issue type
    const issueGroups = {};
    rcaRecords.forEach(record => {
      const issue = record.issueReported;
      if (!issueGroups[issue]) {
        issueGroups[issue] = {
          issue,
          occurrences: 0,
          rootCause: record.rcaData.rootCause,
          preventiveAction: record.rcaData.preventiveAction,
          manufacturingFeedback: record.rcaData.manufacturingFeedback,
          severity: record.rcaData.severity,
          affectedVehicles: []
        };
      }
      issueGroups[issue].occurrences++;
      issueGroups[issue].affectedVehicles.push(record.vehicleId);
    });
    
    const insights = Object.values(issueGroups);
    
    res.json({
      success: true,
      totalIssues: rcaRecords.length,
      uniqueIssueTypes: insights.length,
      data: insights
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to generate manufacturing insights',
      message: error.message
    });
  }
});

module.exports = router;