const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Load vehicles data
function loadVehicles() {
  const filePath = path.join(__dirname, '../data/synthetic/vehicles.json');
  const data = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(data);
}

// GET all vehicles
router.get('/', (req, res) => {
  try {
    const vehicles = loadVehicles();
    res.json({
      success: true,
      count: vehicles.length,
      data: vehicles
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to load vehicles',
      message: error.message
    });
  }
});

// GET single vehicle by ID
router.get('/:id', (req, res) => {
  try {
    const vehicles = loadVehicles();
    const vehicle = vehicles.find(v => v.id === req.params.id);
    
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        error: 'Vehicle not found'
      });
    }
    
    res.json({
      success: true,
      data: vehicle
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to load vehicle',
      message: error.message
    });
  }
});

module.exports = router;