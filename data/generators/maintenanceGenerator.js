const fs = require('fs');
const path = require('path');

// Service types
const serviceTypes = [
  'Oil Change',
  'Brake Pad Replacement',
  'Battery Replacement',
  'Tire Rotation',
  'Air Filter Replacement',
  'Coolant Flush',
  'Transmission Service',
  'Spark Plug Replacement',
  'Wheel Alignment',
  'General Inspection'
];

// Common issues and their RCA/CAPA data
const commonIssues = [
  {
    issue: 'Engine Overheating',
    rootCause: 'Coolant leak due to worn hose clamps',
    correctiveAction: 'Replace coolant hoses and clamps',
    preventiveAction: 'Implement enhanced quality check for hose clamps in assembly',
    severity: 'high',
    manufacturingFeedback: 'Supplier quality issue - batch defect in clamp material'
  },
  {
    issue: 'Brake Noise',
    rootCause: 'Brake pad material degradation',
    correctiveAction: 'Replace brake pads with improved compound',
    preventiveAction: 'Change brake pad supplier and material specification',
    severity: 'medium',
    manufacturingFeedback: 'Design improvement needed - better pad material required'
  },
  {
    issue: 'Battery Drain',
    rootCause: 'Parasitic electrical draw from infotainment system',
    correctiveAction: 'Update infotainment software and check wiring',
    preventiveAction: 'Redesign power management circuit',
    severity: 'medium',
    manufacturingFeedback: 'Software bug - push OTA update to all vehicles'
  },
  {
    issue: 'Oil Leak',
    rootCause: 'Gasket failure due to improper torque during assembly',
    correctiveAction: 'Replace gasket and retorque to specification',
    preventiveAction: 'Improve assembly line torque verification process',
    severity: 'high',
    manufacturingFeedback: 'Assembly process issue - retrain technicians'
  },
  {
    issue: 'Tire Wear Uneven',
    rootCause: 'Suspension misalignment from factory',
    correctiveAction: 'Perform wheel alignment',
    preventiveAction: 'Add alignment check to pre-delivery inspection',
    severity: 'low',
    manufacturingFeedback: 'Quality control gap in final inspection'
  }
];

// Generate maintenance record
function generateMaintenanceRecord(vehicleId, vehicleMileage, serviceNumber) {
  const daysAgo = Math.floor(Math.random() * 180) + (serviceNumber * 90);
  const serviceDate = new Date();
  serviceDate.setDate(serviceDate.getDate() - daysAgo);
  
  const mileageAtService = Math.max(
    1000, 
    vehicleMileage - (daysAgo * 15) - Math.floor(Math.random() * 2000)
  );
  
  const hasIssue = Math.random() < 0.4; // 40% chance of issue
  const issue = hasIssue ? commonIssues[Math.floor(Math.random() * commonIssues.length)] : null;
  
  const serviceType = hasIssue 
    ? issue.correctiveAction 
    : serviceTypes[Math.floor(Math.random() * serviceTypes.length)];
  
  const cost = hasIssue 
    ? Math.floor(Math.random() * 8000) + 5000 
    : Math.floor(Math.random() * 3000) + 1000;
  
  return {
    recordId: `MAINT-${vehicleId}-${String(serviceNumber).padStart(3, '0')}`,
    vehicleId,
    serviceDate: serviceDate.toISOString().split('T')[0],
    mileageAtService: Math.floor(mileageAtService),
    serviceType,
    serviceCenterId: `SC${String(Math.floor(Math.random() * 5) + 1).padStart(3, '0')}`,
    serviceCenterLocation: ['Mumbai', 'Delhi', 'Bangalore', 'Pune', 'Chennai'][Math.floor(Math.random() * 5)],
    technician: `Tech-${Math.floor(Math.random() * 20) + 1}`,
    duration: Math.floor(Math.random() * 180) + 30, // minutes
    cost: cost,
    partsReplaced: hasIssue ? [issue.correctiveAction] : [],
    diagnosticCodes: hasIssue ? generateRelatedDTC(issue.issue) : [],
    issueReported: hasIssue ? issue.issue : 'None',
    rcaData: hasIssue ? {
      rootCause: issue.rootCause,
      correctiveAction: issue.correctiveAction,
      preventiveAction: issue.preventiveAction,
      severity: issue.severity,
      manufacturingFeedback: issue.manufacturingFeedback,
      reportedToManufacturing: true,
      capaId: `CAPA-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    } : null,
    customerSatisfaction: Math.floor(Math.random() * 2) + 4, // 4-5 stars
    nextServiceDue: Math.floor(mileageAtService + 5000 + Math.random() * 2000),
    status: 'completed'
  };
}

// Generate related DTC codes
function generateRelatedDTC(issue) {
  const dtcMap = {
    'Engine Overheating': ['P0217', 'P0118'],
    'Brake Noise': ['C1234', 'C0035'],
    'Battery Drain': ['B1342', 'U0100'],
    'Oil Leak': ['P0520', 'P0523'],
    'Tire Wear Uneven': ['C0040', 'C0045']
  };
  return dtcMap[issue] || [];
}

// Generate maintenance history for all vehicles
function generateAllMaintenance() {
  const vehiclesPath = path.join(__dirname, '../synthetic/vehicles.json');
  const vehicles = JSON.parse(fs.readFileSync(vehiclesPath, 'utf8'));
  
  const maintenanceRecords = [];
  
  vehicles.forEach(vehicle => {
    // Generate 3-6 service records per vehicle
    const numRecords = Math.floor(Math.random() * 4) + 3;
    
    for (let i = 0; i < numRecords; i++) {
      maintenanceRecords.push(
        generateMaintenanceRecord(vehicle.id, vehicle.currentMileage, i + 1)
      );
    }
  });
  
  return maintenanceRecords;
}

// Save maintenance data
function saveMaintenanceData() {
  const maintenanceRecords = generateAllMaintenance();
  const dataDir = path.join(__dirname, '../synthetic');
  const filePath = path.join(dataDir, 'maintenance-history.json');
  
  fs.writeFileSync(filePath, JSON.stringify(maintenanceRecords, null, 2));
  
  console.log(`✅ Generated ${maintenanceRecords.length} maintenance records`);
  console.log(`📁 Saved to: ${filePath}`);
  
  return maintenanceRecords;
}

// Run if called directly
if (require.main === module) {
  saveMaintenanceData();
}

module.exports = { 
  generateMaintenanceRecord, 
  generateAllMaintenance, 
  saveMaintenanceData 
};