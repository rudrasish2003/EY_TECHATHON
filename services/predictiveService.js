const fs = require('fs');
const path = require('path');

class PredictiveMaintenanceModel {
  constructor() {
    this.componentThresholds = {
      engine: { temp: 100, weight: 0.3 },
      oil: { pressure: 70, weight: 0.25 },
      brake: { health: 70, weight: 0.2 },
      battery: { voltage: 12.0, weight: 0.15 },
      tire: { pressure: 28, weight: 0.1 }
    };
  }

  // Train model with historical data
  trainModel() {
    console.log('🤖 Training predictive maintenance model...');
    
    // Load historical maintenance data
    const maintenancePath = path.join(__dirname, '../data/synthetic/maintenance-history.json');
    const maintenanceData = JSON.parse(fs.readFileSync(maintenancePath, 'utf8'));
    
    // Extract failure patterns
    const failurePatterns = this.extractFailurePatterns(maintenanceData);
    
    console.log('✅ Model trained with', maintenanceData.length, 'records');
    return failurePatterns;
  }

  // Extract failure patterns from historical data
  extractFailurePatterns(maintenanceData) {
    const patterns = {};
    
    maintenanceData.forEach(record => {
      if (record.issueReported && record.issueReported !== 'None') {
        const issue = record.issueReported;
        
        if (!patterns[issue]) {
          patterns[issue] = {
            issue,
            occurrences: 0,
            avgMileage: 0,
            dtcCodes: new Set(),
            severity: record.rcaData?.severity || 'medium',
            totalMileage: 0
          };
        }
        
        patterns[issue].occurrences++;
        patterns[issue].totalMileage += record.mileageAtService;
        
        // Collect DTC codes
        if (record.diagnosticCodes) {
          record.diagnosticCodes.forEach(code => {
            patterns[issue].dtcCodes.add(code);
          });
        }
      }
    });
    
    // Calculate average mileage for each issue
    Object.values(patterns).forEach(pattern => {
      pattern.avgMileage = Math.floor(pattern.totalMileage / pattern.occurrences);
      pattern.dtcCodes = Array.from(pattern.dtcCodes);
    });
    
    return patterns;
  }

  // Predict failure probability
  predictFailure(vehicleData, sensorData, maintenanceHistory) {
    console.log('🔮 Predicting failure for vehicle:', vehicleData.id);
    
    const predictions = [];
    const sensors = sensorData.sensors;
    const mileage = vehicleData.currentMileage;
    
    // 1. Engine Failure Prediction
    const engineScore = this.calculateEngineRisk(sensors, mileage, maintenanceHistory);
    if (engineScore.probability > 0.3) {
      predictions.push(engineScore);
    }
    
    // 2. Brake System Prediction
    const brakeScore = this.calculateBrakeRisk(sensors, mileage, maintenanceHistory);
    if (brakeScore.probability > 0.3) {
      predictions.push(brakeScore);
    }
    
    // 3. Battery Failure Prediction
    const batteryScore = this.calculateBatteryRisk(sensors, mileage, maintenanceHistory);
    if (batteryScore.probability > 0.3) {
      predictions.push(batteryScore);
    }
    
    // 4. Oil System Prediction
    const oilScore = this.calculateOilRisk(sensors, mileage, maintenanceHistory);
    if (oilScore.probability > 0.3) {
      predictions.push(oilScore);
    }
    
    // Calculate Remaining Useful Life (RUL)
    const rul = this.calculateRUL(predictions, mileage);
    
    return {
      vehicleId: vehicleData.id,
      predictions: predictions.sort((a, b) => b.probability - a.probability),
      overallRisk: this.calculateOverallRisk(predictions),
      remainingUsefulLife: rul,
      recommendedAction: this.getRecommendedAction(predictions),
      timestamp: new Date().toISOString()
    };
  }

  // Calculate engine failure risk
  calculateEngineRisk(sensors, mileage, history) {
    let probability = 0;
    
    // Temperature factor
    if (sensors.engineTemp > 100) {
      probability += (sensors.engineTemp - 100) / 50; // Max 0.4
    }
    
    // Mileage factor
    if (mileage > 80000) {
      probability += 0.2;
    }
    
    // Historical issues
    const engineIssues = history.filter(h => 
      h.issueReported && h.issueReported.toLowerCase().includes('engine')
    );
    if (engineIssues.length > 0) {
      probability += engineIssues.length * 0.1;
    }
    
    // DTC codes
    const engineDTCs = ['P0300', 'P0420', 'P0171', 'P0128', 'P0217', 'P0118'];
    const hasEngineDTC = sensors.diagnosticCodes?.some(code => 
      engineDTCs.includes(code)
    );
    if (hasEngineDTC) {
      probability += 0.25;
    }
    
    probability = Math.min(probability, 1.0);
    
    return {
      component: 'Engine',
      probability: parseFloat(probability.toFixed(2)),
      severity: probability > 0.7 ? 'critical' : probability > 0.5 ? 'high' : 'medium',
      estimatedDaysToFailure: Math.floor((1 - probability) * 60),
      factors: {
        temperature: sensors.engineTemp,
        mileage,
        historicalIssues: engineIssues.length,
        dtcDetected: hasEngineDTC
      }
    };
  }

  // Calculate brake system risk
  calculateBrakeRisk(sensors, mileage, history) {
    let probability = 0;
    
    // Brake health factor
    if (sensors.brakeHealth < 70) {
      probability += (70 - sensors.brakeHealth) / 70;
    }
    
    // Mileage factor
    if (mileage > 50000) {
      probability += 0.15;
    }
    
    // Historical issues
    const brakeIssues = history.filter(h => 
      h.issueReported && h.issueReported.toLowerCase().includes('brake')
    );
    if (brakeIssues.length > 0) {
      probability += brakeIssues.length * 0.15;
    }
    
    probability = Math.min(probability, 1.0);
    
    return {
      component: 'Brake System',
      probability: parseFloat(probability.toFixed(2)),
      severity: probability > 0.7 ? 'critical' : probability > 0.5 ? 'high' : 'medium',
      estimatedDaysToFailure: Math.floor((1 - probability) * 45),
      factors: {
        brakeHealth: sensors.brakeHealth,
        mileage,
        historicalIssues: brakeIssues.length
      }
    };
  }

  // Calculate battery risk
  calculateBatteryRisk(sensors, mileage, history) {
    let probability = 0;
    
    // Voltage factor
    if (sensors.batteryVoltage < 12.0) {
      probability += (12.0 - sensors.batteryVoltage) / 2;
    }
    
    // Age factor (based on mileage)
    if (mileage > 60000) {
      probability += 0.3;
    }
    
    // Historical issues
    const batteryIssues = history.filter(h => 
      h.issueReported && h.issueReported.toLowerCase().includes('battery')
    );
    if (batteryIssues.length > 0) {
      probability += batteryIssues.length * 0.2;
    }
    
    probability = Math.min(probability, 1.0);
    
    return {
      component: 'Battery',
      probability: parseFloat(probability.toFixed(2)),
      severity: probability > 0.7 ? 'critical' : probability > 0.5 ? 'high' : 'medium',
      estimatedDaysToFailure: Math.floor((1 - probability) * 30),
      factors: {
        voltage: sensors.batteryVoltage,
        mileage,
        historicalIssues: batteryIssues.length
      }
    };
  }

  // Calculate oil system risk
  calculateOilRisk(sensors, mileage, history) {
    let probability = 0;
    
    // Oil pressure factor
    if (sensors.oilPressure < 70) {
      probability += (70 - sensors.oilPressure) / 70;
    }
    
    // Check last oil change
    const oilChanges = history.filter(h => 
      h.serviceType && h.serviceType.toLowerCase().includes('oil')
    );
    
    if (oilChanges.length > 0) {
      const lastOilChange = oilChanges.sort((a, b) => 
        new Date(b.serviceDate) - new Date(a.serviceDate)
      )[0];
      
      const mileageSinceOilChange = mileage - lastOilChange.mileageAtService;
      if (mileageSinceOilChange > 5000) {
        probability += 0.3;
      }
    } else {
      probability += 0.4; // No oil change history
    }
    
    probability = Math.min(probability, 1.0);
    
    return {
      component: 'Oil System',
      probability: parseFloat(probability.toFixed(2)),
      severity: probability > 0.7 ? 'critical' : probability > 0.5 ? 'high' : 'medium',
      estimatedDaysToFailure: Math.floor((1 - probability) * 40),
      factors: {
        oilPressure: sensors.oilPressure,
        mileage
      }
    };
  }

  // Calculate overall risk
  calculateOverallRisk(predictions) {
    if (predictions.length === 0) return 'low';
    
    const avgProbability = predictions.reduce((sum, p) => sum + p.probability, 0) / predictions.length;
    
    if (avgProbability > 0.7) return 'critical';
    if (avgProbability > 0.5) return 'high';
    if (avgProbability > 0.3) return 'medium';
    return 'low';
  }

  // Calculate Remaining Useful Life
  calculateRUL(predictions, currentMileage) {
    if (predictions.length === 0) {
      return {
        estimatedMileage: currentMileage + 10000,
        estimatedDays: 120,
        confidence: 'low'
      };
    }
    
    const minDays = Math.min(...predictions.map(p => p.estimatedDaysToFailure));
    const avgProbability = predictions.reduce((sum, p) => sum + p.probability, 0) / predictions.length;
    
    return {
      estimatedMileage: currentMileage + (minDays * 15), // Assume 15 km/day
      estimatedDays: minDays,
      confidence: avgProbability > 0.6 ? 'high' : 'medium'
    };
  }

  // Get recommended action
  getRecommendedAction(predictions) {
    if (predictions.length === 0) {
      return 'Continue regular maintenance schedule';
    }
    
    const criticalPredictions = predictions.filter(p => p.severity === 'critical');
    const highPredictions = predictions.filter(p => p.severity === 'high');
    
    if (criticalPredictions.length > 0) {
      return `URGENT: Schedule immediate service for ${criticalPredictions.map(p => p.component).join(', ')}`;
    }
    
    if (highPredictions.length > 0) {
      return `Schedule service within 7 days for ${highPredictions.map(p => p.component).join(', ')}`;
    }
    
    return `Schedule maintenance for ${predictions[0].component} within ${predictions[0].estimatedDaysToFailure} days`;
  }
}

module.exports = new PredictiveMaintenanceModel();