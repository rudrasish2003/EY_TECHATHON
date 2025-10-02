const fs = require('fs');
const path = require('path');

class DataAnalysisAgent {
  constructor() {
    this.name = 'dataAnalysis';
  }

  // Load vehicle data
  loadVehicle(vehicleId) {
    const filePath = path.join(__dirname, '../data/synthetic/vehicles.json');
    const vehicles = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return vehicles.find(v => v.id === vehicleId);
  }

  // Load sensor data
  loadSensorData(vehicleId) {
    const filePath = path.join(__dirname, '../data/synthetic/sensors.json');
    const sensors = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return sensors.find(s => s.vehicleId === vehicleId);
  }

  // Load maintenance history
  loadMaintenanceHistory(vehicleId) {
    const filePath = path.join(__dirname, '../data/synthetic/maintenance-history.json');
    const records = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return records.filter(r => r.vehicleId === vehicleId);
  }

  // Analyze vehicle data
  async analyzeVehicle(vehicleId) {
    console.log(`🔍 Data Analysis Agent: Analyzing vehicle ${vehicleId}`);
    
    const vehicle = this.loadVehicle(vehicleId);
    if (!vehicle) {
      throw new Error(`Vehicle not found: ${vehicleId}`);
    }

    const sensorData = this.loadSensorData(vehicleId);
    const maintenanceHistory = this.loadMaintenanceHistory(vehicleId);

    // Analyze sensor readings
    const sensorAnalysis = this.analyzeSensorData(sensorData);
    
    // Analyze maintenance patterns
    const maintenanceAnalysis = this.analyzeMaintenancePatterns(maintenanceHistory, vehicle);
    
    // Check if diagnosis is required
    const requiresDiagnosis = 
      sensorAnalysis.hasAnomalies || 
      sensorAnalysis.diagnosticCodes.length > 0 ||
      maintenanceAnalysis.isServiceDue;

    const result = {
      vehicleId,
      vehicle: {
        id: vehicle.id,
        make: vehicle.make,
        model: vehicle.model,
        mileage: vehicle.currentMileage,
        owner: vehicle.ownerName
      },
      sensorAnalysis,
      maintenanceAnalysis,
      requiresDiagnosis,
      timestamp: new Date().toISOString()
    };

    console.log(`✅ Data Analysis completed for ${vehicleId}`);
    return result;
  }

  // Analyze sensor data
  analyzeSensorData(sensorData) {
    const sensors = sensorData.sensors;
    const anomalies = [];

    // Check engine temperature
    if (sensors.engineTemp > 100) {
      anomalies.push({
        type: 'HIGH_ENGINE_TEMP',
        value: sensors.engineTemp,
        threshold: 100,
        severity: 'high'
      });
    }

    // Check oil pressure
    if (sensors.oilPressure < 70) {
      anomalies.push({
        type: 'LOW_OIL_PRESSURE',
        value: sensors.oilPressure,
        threshold: 70,
        severity: 'high'
      });
    }

    // Check brake health
    if (sensors.brakeHealth < 70) {
      anomalies.push({
        type: 'LOW_BRAKE_HEALTH',
        value: sensors.brakeHealth,
        threshold: 70,
        severity: 'medium'
      });
    }

    // Check battery voltage
    if (sensors.batteryVoltage < 12.0) {
      anomalies.push({
        type: 'LOW_BATTERY_VOLTAGE',
        value: sensors.batteryVoltage,
        threshold: 12.0,
        severity: 'medium'
      });
    }

    // Check tire pressure
    if (sensors.tirePressure < 28) {
      anomalies.push({
        type: 'LOW_TIRE_PRESSURE',
        value: sensors.tirePressure,
        threshold: 28,
        severity: 'low'
      });
    }

    return {
      hasAnomalies: anomalies.length > 0,
      anomalies,
      diagnosticCodes: sensorData.diagnosticCodes || [],
      sensorReadings: sensors
    };
  }

  // Analyze maintenance patterns
  analyzeMaintenancePatterns(maintenanceHistory, vehicle) {
    if (!maintenanceHistory || maintenanceHistory.length === 0) {
      return {
        totalServices: 0,
        lastServiceDate: null,
        daysSinceLastService: null,
        isServiceDue: true,
        recurringIssues: []
      };
    }

    // Sort by date
    const sortedHistory = maintenanceHistory.sort(
      (a, b) => new Date(b.serviceDate) - new Date(a.serviceDate)
    );

    const lastService = sortedHistory[0];
    const lastServiceDate = new Date(lastService.serviceDate);
    const today = new Date();
    const daysSinceLastService = Math.floor(
      (today - lastServiceDate) / (1000 * 60 * 60 * 24)
    );

    // Check if service is due (90 days or 5000 km)
    const mileageSinceService = vehicle.currentMileage - lastService.mileageAtService;
    const isServiceDue = daysSinceLastService > 90 || mileageSinceService > 5000;

    // Find recurring issues
    const issueCount = {};
    maintenanceHistory.forEach(record => {
      if (record.issueReported && record.issueReported !== 'None') {
        issueCount[record.issueReported] = (issueCount[record.issueReported] || 0) + 1;
      }
    });

    const recurringIssues = Object.entries(issueCount)
      .filter(([issue, count]) => count > 1)
      .map(([issue, count]) => ({ issue, count }));

    return {
      totalServices: maintenanceHistory.length,
      lastServiceDate: lastService.serviceDate,
      daysSinceLastService,
      mileageSinceService,
      isServiceDue,
      recurringIssues,
      averageServiceCost: Math.floor(
        maintenanceHistory.reduce((sum, r) => sum + r.cost, 0) / maintenanceHistory.length
      )
    };
  }
}

module.exports = new DataAnalysisAgent();