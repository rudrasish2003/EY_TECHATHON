const predictiveService = require('../services/predictiveService');
const fs = require('fs');
const path = require('path');

async function testPredictiveModel() {
  console.log('🤖 Testing Predictive Maintenance ML Model...\n');
  
  try {
    // Train the model
    console.log('📚 Training model with historical data...');
    const failurePatterns = predictiveService.trainModel();
    console.log('\n Failure patterns learned:');
    console.log(JSON.stringify(failurePatterns, null, 2));
    
    // Load test vehicle data
    const vehiclesPath = path.join(__dirname, '../data/synthetic/vehicles.json');
    const vehicles = JSON.parse(fs.readFileSync(vehiclesPath, 'utf8'));
    const testVehicle = vehicles[0];
    
    const sensorsPath = path.join(__dirname, '../data/synthetic/sensors.json');
    const sensors = JSON.parse(fs.readFileSync(sensorsPath, 'utf8'));
    const testSensor = sensors.find(s => s.vehicleId === testVehicle.id);
    
    const maintenancePath = path.join(__dirname, '../data/synthetic/maintenance-history.json');
    const maintenance = JSON.parse(fs.readFileSync(maintenancePath, 'utf8'));
    const testHistory = maintenance.filter(m => m.vehicleId === testVehicle.id);
    
    // Make prediction
    console.log('\n\n🔮 Making prediction for vehicle:', testVehicle.id);
    const prediction = predictiveService.predictFailure(testVehicle, testSensor, testHistory);
    
    console.log('\n📊 Prediction Result:');
    console.log(JSON.stringify(prediction, null, 2));
    
    console.log('\n✅ ML Model test completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

testPredictiveModel();