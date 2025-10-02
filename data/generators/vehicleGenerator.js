const fs = require('fs');
const path = require('path');

// Vehicle makes and models
const vehicles = [
  { make: 'Maruti Suzuki', model: 'Swift' },
  { make: 'Hyundai', model: 'Creta' },
  { make: 'Tata', model: 'Nexon' },
  { make: 'Mahindra', model: 'Scorpio' },
  { make: 'Honda', model: 'City' }
];

const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Pune', 'Chennai', 'Kolkata'];

// Generate random VIN
function generateVIN() {
  const chars = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789';
  let vin = '';
  for (let i = 0; i < 17; i++) {
    vin += chars[Math.floor(Math.random() * chars.length)];
  }
  return vin;
}

// Generate 10 vehicles
function generateVehicles() {
  const vehicleData = [];
  
  for (let i = 0; i < 10; i++) {
    const vehicle = vehicles[i % vehicles.length];
    const purchaseDate = new Date(2020 + Math.floor(i / 2), Math.floor(Math.random() * 12), 1);
    const currentDate = new Date();
    const ageInMonths = Math.floor((currentDate - purchaseDate) / (1000 * 60 * 60 * 24 * 30));
    
    vehicleData.push({
      id: `VEH${String(i + 1).padStart(3, '0')}`,
      vin: generateVIN(),
      make: vehicle.make,
      model: vehicle.model,
      year: purchaseDate.getFullYear(),
      purchaseDate: purchaseDate.toISOString().split('T')[0],
      ownerId: `CUST${String(i + 1).padStart(3, '0')}`,
      ownerName: `Customer ${i + 1}`,
      ownerPhone: `+91-98${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
      city: cities[Math.floor(Math.random() * cities.length)],
      currentMileage: 5000 + (ageInMonths * 300) + Math.floor(Math.random() * 5000),
      status: 'active',
      lastServiceDate: new Date(currentDate.getTime() - (Math.random() * 90 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
      nextServiceDue: new Date(currentDate.getTime() + (Math.random() * 60 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]
    });
  }
  
  return vehicleData;
}

// Save to JSON file
function saveVehicles() {
  const vehicles = generateVehicles();
  const dataDir = path.join(__dirname, '../synthetic');
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  const filePath = path.join(dataDir, 'vehicles.json');
  fs.writeFileSync(filePath, JSON.stringify(vehicles, null, 2));
  
  console.log(`✅ Generated ${vehicles.length} vehicles`);
  console.log(`📁 Saved to: ${filePath}`);
  
  return vehicles;
}

// Run if called directly
if (require.main === module) {
  saveVehicles();
}

module.exports = { generateVehicles, saveVehicles };