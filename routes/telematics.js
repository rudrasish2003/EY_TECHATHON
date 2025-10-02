const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { generateSensorReading } = require('../data/generators/sensorGenerator');

// Load sensor data
function loadSensorData() {
  const filePath = path.join(__dirname, '../data/synthetic/sensors.json');
  const data = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(data);
}

// Load vehicles to get mileage
function loadVehicles() {
  const filePath = path.join(__dirname, '../data/synthetic/vehicles.json');
  const data = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(data);
}

// GET all sensor readings
router.get('/', (req, res) => {
  try {
    const sensors = loadSensorData();
    res.json({
      success: true,
      count: sensors.length,
      data: sensors
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to load sensor data',
      message: error.message
    });
  }
});

// GET sensor data for specific vehicle
router.get('/:vehicleId', (req, res) => {
  try {
    const sensors = loadSensorData();
    const sensorData = sensors.find(s => s.vehicleId === req.params.vehicleId);
    
    if (!sensorData) {
      return res.status(404).json({
        success: false,
        error: 'Sensor data not found for this vehicle'
      });
    }
    
    res.json({
      success: true,
      data: sensorData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to load sensor data',
      message: error.message
    });
  }
});

// GET real-time sensor reading (simulated)
router.get('/:vehicleId/realtime', (req, res) => {
  try {
    const vehicles = loadVehicles();
    const vehicle = vehicles.find(v => v.id === req.params.vehicleId);
    
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        error: 'Vehicle not found'
      });
    }
    
    // Generate fresh sensor reading
    const realtimeData = generateSensorReading(vehicle.id, vehicle.currentMileage);
    
    res.json({
      success: true,
      data: realtimeData,
      note: 'Real-time simulated data'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to generate real-time data',
      message: error.message
    });
  }
});

module.exports = router;