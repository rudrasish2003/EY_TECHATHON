const schedulingAgent = require('../agents/schedulingAgent');
const diagnosisAgent = require('../agents/diagnosisAgent');
const dataAnalysisAgent = require('../agents/dataAnalysisAgent');
const fs = require('fs');
const path = require('path');

async function testSchedulingAgent() {
  console.log('📅 Testing Scheduling Agent...\n');
  console.log('='.repeat(60));
  
  try {
    // Load test vehicle
    const vehiclesPath = path.join(__dirname, '../data/synthetic/vehicles.json');
    const vehicles = JSON.parse(fs.readFileSync(vehiclesPath, 'utf8'));
    const testVehicle = vehicles[0];
    
    // Run diagnosis
    console.log('Step 1: Running diagnosis...');
    const analysis = await dataAnalysisAgent.analyzeVehicle(testVehicle.id);
    const diagnosis = await diagnosisAgent.diagnose(testVehicle.id, analysis);
    console.log('✅ Diagnosis complete\n');
    
    // Propose appointments
    console.log('Step 2: Finding available appointment slots...');
    console.log('-'.repeat(60));
    const proposedSlots = await schedulingAgent.proposeAppointments(testVehicle, diagnosis);
    
    console.log(`\n🏢 Service Center: ${proposedSlots.serviceCenter.name}`);
    console.log(`📍 Location: ${proposedSlots.serviceCenter.location}`);
    console.log(`⏱️  Estimated Duration: ${proposedSlots.estimatedDuration.formatted}`);
    console.log(`💰 Estimated Cost: ₹${proposedSlots.estimatedCost.min} - ₹${proposedSlots.estimatedCost.max}`);
    
    console.log(`\n📆 Available Slots (Next 7 days):`);
    proposedSlots.proposedSlots.forEach((day, idx) => {
      console.log(`\n${idx + 1}. ${day.dayName}, ${day.date}`);
      day.slots.forEach(slot => {
        console.log(`   ⏰ ${slot.time} - ${slot.endTime} (Capacity: ${slot.availableCapacity})`);
      });
    });
    
    // Book appointment
    console.log('\n\nStep 3: Booking appointment...');
    console.log('-'.repeat(60));
    const selectedSlot = {
      serviceCenterId: proposedSlots.serviceCenter.id,
      serviceCenterName: proposedSlots.serviceCenter.name,
      date: proposedSlots.proposedSlots[0].date,
      time: proposedSlots.proposedSlots[0].slots[0].time,
      endTime: proposedSlots.proposedSlots[0].slots[0].endTime
    };
    
    const appointment = await schedulingAgent.bookAppointment(testVehicle, diagnosis, selectedSlot);
    
    console.log(`\n✅ Appointment Confirmed!`);
    console.log(`   ID: ${appointment.id}`);
    console.log(`   Customer: ${appointment.customerName}`);
    console.log(`   Phone: ${appointment.customerPhone}`);
    console.log(`   Date: ${appointment.date} at ${appointment.time}`);
    console.log(`   Service Center: ${appointment.serviceCenterName}`);
    console.log(`   Services: ${appointment.serviceType}`);
    console.log(`   Urgency: ${appointment.urgency}`);
    
    // Book more appointments for testing
    console.log('\n\nStep 4: Booking more appointments for demand forecast...');
    for (let i = 1; i < 5; i++) {
      const vehicle = vehicles[i];
      const analysis = await dataAnalysisAgent.analyzeVehicle(vehicle.id);
      const diag = await diagnosisAgent.diagnose(vehicle.id, analysis);
      const slots = await schedulingAgent.proposeAppointments(vehicle, diag);
      
      if (slots.proposedSlots.length > 0) {
        const slot = {
          serviceCenterId: slots.serviceCenter.id,
          serviceCenterName: slots.serviceCenter.name,
          date: slots.proposedSlots[0].date,
          time: slots.proposedSlots[0].slots[0].time,
          endTime: slots.proposedSlots[0].slots[0].endTime
        };
        await schedulingAgent.bookAppointment(vehicle, diag, slot);
        console.log(`   ✅ Booked for ${vehicle.ownerName}`);
      }
    }
    
    // Forecast demand
    console.log('\n\nStep 5: Service Demand Forecast');
    console.log('='.repeat(60));
    const forecast = schedulingAgent.forecastDemand(7);
    
    forecast.forEach(day => {
      console.log(`\n📅 ${day.dayName}, ${day.date}`);
      Object.values(day.demandByCenter).forEach(center => {
        console.log(`   ${center.centerName}:`);
        console.log(`      Appointments: ${center.appointments}/${center.capacity}`);
        console.log(`      Utilization: ${center.utilizationRate}% [${center.status}]`);
      });
    });
    
    // Show all upcoming appointments
    console.log('\n\n📋 Upcoming Appointments Summary');
    console.log('='.repeat(60));
    const upcoming = schedulingAgent.getUpcomingAppointments();
    console.log(`Total upcoming appointments: ${upcoming.length}\n`);
    upcoming.slice(0, 5).forEach(apt => {
      console.log(`${apt.id} | ${apt.customerName} | ${apt.date} ${apt.time} | ${apt.serviceCenterName}`);
    });
    
    console.log('\n\n✅ Scheduling Agent test completed!');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

testSchedulingAgent();