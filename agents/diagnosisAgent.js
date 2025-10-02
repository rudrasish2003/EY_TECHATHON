const predictiveService = require('../services/predictiveService');
const fs = require('fs');
const path = require('path');

class DiagnosisAgent {
  constructor() {
    this.name = 'diagnosis';
    // Train model on initialization
    this.failurePatterns = predictiveService.trainModel();
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

  // Main diagnosis function
  async diagnose(vehicleId, analysisResult) {
    console.log(`🔬 Diagnosis Agent: Running diagnosis for vehicle ${vehicleId}`);
    
    const vehicle = this.loadVehicle(vehicleId);
    const sensorData = this.loadSensorData(vehicleId);
    const maintenanceHistory = this.loadMaintenanceHistory(vehicleId);

    // Run ML prediction
    const prediction = predictiveService.predictFailure(vehicle, sensorData, maintenanceHistory);

    // Determine if maintenance is required
    const maintenanceRequired = prediction.overallRisk !== 'low' || 
                                 prediction.predictions.length > 0;

    // Generate diagnosis report
    const diagnosis = {
      vehicleId,
      timestamp: new Date().toISOString(),
      maintenanceRequired,
      overallRisk: prediction.overallRisk,
      predictions: prediction.predictions,
      remainingUsefulLife: prediction.remainingUsefulLife,
      recommendedAction: prediction.recommendedAction,
      urgencyLevel: this.calculateUrgency(prediction),
      estimatedCost: this.estimateCost(prediction.predictions),
      estimatedDuration: this.estimateDuration(prediction.predictions),
      diagnosticSummary: this.generateSummary(prediction)
    };

    console.log(`✅ Diagnosis completed: ${maintenanceRequired ? 'Maintenance Required' : 'Vehicle OK'}`);
    
    return diagnosis;
  }

  // Calculate urgency level
  calculateUrgency(prediction) {
    const criticalPredictions = prediction.predictions.filter(p => p.severity === 'critical');
    const highPredictions = prediction.predictions.filter(p => p.severity === 'high');

    if (criticalPredictions.length > 0) {
      return {
        level: 'CRITICAL',
        message: 'Immediate attention required - Risk of breakdown',
        scheduleWithin: '24 hours'
      };
    }

    if (highPredictions.length > 0) {
      return {
        level: 'HIGH',
        message: 'Schedule service soon to prevent failure',
        scheduleWithin: '7 days'
      };
    }

    if (prediction.predictions.length > 0) {
      return {
        level: 'MEDIUM',
        message: 'Routine maintenance recommended',
        scheduleWithin: '14 days'
      };
    }

    return {
      level: 'LOW',
      message: 'Vehicle in good condition',
      scheduleWithin: 'Next scheduled service'
    };
  }

  // Estimate service cost
  estimateCost(predictions) {
    if (predictions.length === 0) return { min: 0, max: 0 };

    const costMap = {
      'Engine': { min: 5000, max: 15000 },
      'Brake System': { min: 3000, max: 8000 },
      'Battery': { min: 4000, max: 7000 },
      'Oil System': { min: 1500, max: 3000 }
    };

    let totalMin = 0;
    let totalMax = 0;

    predictions.forEach(prediction => {
      const cost = costMap[prediction.component] || { min: 2000, max: 5000 };
      totalMin += cost.min;
      totalMax += cost.max;
    });

    return {
      min: totalMin,
      max: totalMax,
      currency: 'INR'
    };
  }

  // Estimate service duration
  estimateDuration(predictions) {
    if (predictions.length === 0) return 0;

    const durationMap = {
      'Engine': 180,
      'Brake System': 120,
      'Battery': 60,
      'Oil System': 45
    };

    const totalMinutes = predictions.reduce((sum, prediction) => {
      return sum + (durationMap[prediction.component] || 90);
    }, 0);

    return {
      minutes: totalMinutes,
      hours: Math.ceil(totalMinutes / 60),
      formatted: `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`
    };
  }

  // Generate human-readable summary
  generateSummary(prediction) {
    if (prediction.predictions.length === 0) {
      return 'Vehicle is in good condition. Continue with regular maintenance schedule.';
    }

    const components = prediction.predictions.map(p => p.component).join(', ');
    const highestRisk = prediction.predictions[0];

    return `Detected potential issues with ${components}. ` +
           `Primary concern: ${highestRisk.component} with ${Math.floor(highestRisk.probability * 100)}% failure probability. ` +
           `${prediction.recommendedAction}`;
  }

  // Get failure patterns for a specific issue
  getFailurePattern(issue) {
    return this.failurePatterns[issue] || null;
  }
}

module.exports = new DiagnosisAgent();