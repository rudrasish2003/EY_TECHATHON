const fs = require('fs');
const path = require('path');

// Generate realistic sensor readings for a vehicle
function generateSensorReading(vehicleId, mileage) {
  // Simulate wear and tear based on mileage
  const wearFactor = Math.min(mileage / 100000, 1); // 0 to 1 scale
  
  // Normal ranges with some random variation
  const baseEngine = 85 + Math.random() * 10; // 85-95°C
  const baseOil = 80 + Math.random() * 15; // 80-95 PSI
  const baseBrake = 90 + Math.random() * 10; // 90-100%
  const baseBattery = 12.5 + Math.random() * 0.8; // 12.5-13.3V
  const baseTire = 32 + Math.random() * 4; // 32-36 PSI
  
  // Add wear-based degradation
  const engineTemp = baseEngine + (wearFactor * 15); // Higher temp with wear
  const oilPressure = baseOil - (wearFactor * 20); // Lower pressure with wear
  const brakeHealth = baseBrake - (wearFactor * 30); // Degraded brakes
  const batteryVoltage = baseBattery - (wearFactor * 0.8); // Weaker battery
  const tirePressure = baseTire - (wearFactor * 5); // Lower pressure
  
  // Randomly introduce some anomalies (10% chance)
  const hasAnomaly = Math.random() < 0.1;
  
  return {
    vehicleId,
    timestamp: new Date().toISOString(),
    mileage: Math.floor(mileage),
    sensors: {
      engineTemp: parseFloat((hasAnomaly ? engineTemp + 20 : engineTemp).toFixed(1)),
      oilPressure: parseFloat((hasAnomaly ? oilPressure - 15 : oilPressure).toFixed(1)),
      brakeHealth: parseFloat((hasAnomaly ? brakeHealth - 20 : brakeHealth).toFixed(1)),
      batteryVoltage: parseFloat((hasAnomaly ? batteryVoltage - 1 : batteryVoltage).toFixed(2)),
      tirePressure: parseFloat((hasAnomaly ? tirePressure - 8 : tirePressure).toFixed(1)),
      fuelLevel: parseFloat((Math.random() * 100).toFixed(1)),
      rpm: Math.floor(800 + Math.random() * 2200),
      speed: Math.floor(Math.random() * 120)
    },
    diagnosticCodes: hasAnomaly ? generateDTC() : [],
    alerts: hasAnomaly ? ['Anomaly detected'] : []
  };
}

// Generate Diagnostic Trouble Codes
function generateDTC() {
  const dtcCodes = [
    'P0300', // Random/Multiple Cylinder Misfire
    'P0420', // Catalyst System Efficiency Below Threshold
    'P0171', // System Too Lean
    'P0128', // Coolant Thermostat Temperature Below Regulating
    'C0035', // Left Front Wheel Speed Sensor Circuit
    'B1342', // ECM Defective
    'U0100'  // Lost Communication with ECM/PCM
  ];
  
  const numCodes = Math.floor(Math.random() * 2) + 1;
  const codes = [];
  for (let i = 0; i < numCodes; i++) {
    codes.push(dtcCodes[Math.floor(Math.random() * dtcCodes.length)]);
  }
  return codes;
}

// Generate sensor readings for all vehicles
function generateAllSensors() {
  const vehiclesPath = path.join(__dirname, '../synthetic/vehicles.json');
  const vehicles = JSON.parse(fs.readFileSync(vehiclesPath, 'utf8'));
  
  const sensorData = vehicles.map(vehicle => 
    generateSensorReading(vehicle.id, vehicle.currentMileage)
  );
  
  return sensorData;
}

// Save sensor data
function saveSensorData() {
  const sensorData = generateAllSensors();
  const dataDir = path.join(__dirname, '../synthetic');
  const filePath = path.join(dataDir, 'sensors.json');
  
  fs.writeFileSync(filePath, JSON.stringify(sensorData, null, 2));
  
  console.log(`✅ Generated sensor data for ${sensorData.length} vehicles`);
  console.log(`📁 Saved to: ${filePath}`);
  
  return sensorData;
}

// Run if called directly
if (require.main === module) {
  saveSensorData();
}

module.exports = { 
  generateSensorReading, 
  generateAllSensors, 
  saveSensorData 
};