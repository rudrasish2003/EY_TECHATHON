require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const vehiclesRoutes = require('./routes/vehicles');
const telematicsRoutes = require('./routes/telematics');
const maintenanceRoutes = require('./routes/maintenance');

// Basic health check route
app.get('/', (req, res) => {
  res.json({
    message: 'Automotive Predictive Maintenance API',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      vehicles: '/api/vehicles',
      vehicle: '/api/vehicles/:id',
      telematics: '/api/telematics',
      vehicleTelematics: '/api/telematics/:vehicleId',
      realtimeTelematics: '/api/telematics/:vehicleId/realtime',
      maintenance: '/api/maintenance',
      vehicleMaintenance: '/api/maintenance/vehicle/:vehicleId',
      rcaCapa: '/api/maintenance/rca-capa',
      manufacturingInsights: '/api/maintenance/manufacturing-insights'
    }
  });
});

// API Routes
app.use('/api/vehicles', vehiclesRoutes);
app.use('/api/telematics', telematicsRoutes);
app.use('/api/maintenance', maintenanceRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`🚗 Server running on port ${PORT}`);
  console.log(`📡 API: http://localhost:${PORT}`);
});