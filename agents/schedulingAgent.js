const fs = require('fs');
const path = require('path');

class SchedulingAgent {
  constructor() {
    this.name = 'scheduling';
    this.appointments = [];
    this.serviceCenters = this.loadServiceCenters();
  }

  // Load service centers
  loadServiceCenters() {
    return [
      {
        id: 'SC001',
        name: 'Mumbai Service Center',
        location: 'Mumbai',
        workingHours: { start: 9, end: 18 },
        maxCapacityPerHour: 4,
        services: ['Engine', 'Brake System', 'Battery', 'Oil System', 'General']
      },
      {
        id: 'SC002',
        name: 'Delhi Service Center',
        location: 'Delhi',
        workingHours: { start: 9, end: 18 },
        maxCapacityPerHour: 5,
        services: ['Engine', 'Brake System', 'Battery', 'Oil System', 'General']
      },
      {
        id: 'SC003',
        name: 'Bangalore Service Center',
        location: 'Bangalore',
        workingHours: { start: 9, end: 19 },
        maxCapacityPerHour: 6,
        services: ['Engine', 'Brake System', 'Battery', 'Oil System', 'General']
      },
      {
        id: 'SC004',
        name: 'Pune Service Center',
        location: 'Pune',
        workingHours: { start: 9, end: 18 },
        maxCapacityPerHour: 3,
        services: ['Engine', 'Brake System', 'Battery', 'Oil System', 'General']
      },
      {
        id: 'SC005',
        name: 'Chennai Service Center',
        location: 'Chennai',
        workingHours: { start: 9, end: 18 },
        maxCapacityPerHour: 4,
        services: ['Engine', 'Brake System', 'Battery', 'Oil System', 'General']
      }
    ];
  }

  // Find available service center based on location
  findNearestServiceCenter(customerCity) {
    // Find exact match first
    let center = this.serviceCenters.find(sc => sc.location === customerCity);
    
    // If no match, return first available
    if (!center) {
      center = this.serviceCenters[0];
    }
    
    return center;
  }

  // Check availability for a service center
  checkAvailability(serviceCenterId, date, durationHours) {
    const center = this.serviceCenters.find(sc => sc.id === serviceCenterId);
    if (!center) {
      throw new Error(`Service center not found: ${serviceCenterId}`);
    }

    // Get appointments for this center on this date
    const dateStr = date.toISOString().split('T')[0];
    const existingAppointments = this.appointments.filter(apt => 
      apt.serviceCenterId === serviceCenterId && 
      apt.date === dateStr &&
      apt.status !== 'cancelled'
    );

    // Calculate available slots
    const availableSlots = [];
    const workStart = center.workingHours.start;
    const workEnd = center.workingHours.end;

    for (let hour = workStart; hour < workEnd - durationHours; hour++) {
      const slotTime = `${String(hour).padStart(2, '0')}:00`;
      const slotEnd = hour + durationHours;
      
      // Count appointments in this slot
      const appointmentsInSlot = existingAppointments.filter(apt => {
        const aptHour = parseInt(apt.time.split(':')[0]);
        return aptHour >= hour && aptHour < slotEnd;
      }).length;

      if (appointmentsInSlot < center.maxCapacityPerHour) {
        availableSlots.push({
          time: slotTime,
          endTime: `${String(slotEnd).padStart(2, '0')}:00`,
          availableCapacity: center.maxCapacityPerHour - appointmentsInSlot
        });
      }
    }

    return availableSlots;
  }

  // Propose appointment slots
  async proposeAppointments(vehicleData, diagnosisResult) {
    console.log(`📅 Scheduling Agent: Finding slots for ${vehicleData.ownerName}`);

    const serviceCenter = this.findNearestServiceCenter(vehicleData.city);
    const durationHours = Math.ceil(diagnosisResult.estimatedDuration.hours);
    
    // Check next 7 days
    const proposedSlots = [];
    const today = new Date();

    for (let dayOffset = 1; dayOffset <= 7; dayOffset++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() + dayOffset);
      
      const availableSlots = this.checkAvailability(
        serviceCenter.id, 
        checkDate, 
        durationHours
      );

      if (availableSlots.length > 0) {
        proposedSlots.push({
          date: checkDate.toISOString().split('T')[0],
          dayName: checkDate.toLocaleDateString('en-US', { weekday: 'long' }),
          slots: availableSlots.slice(0, 3) // Top 3 slots per day
        });
      }
    }

    console.log(`✅ Found ${proposedSlots.length} available days`);

    return {
      serviceCenter,
      proposedSlots,
      estimatedDuration: diagnosisResult.estimatedDuration,
      estimatedCost: diagnosisResult.estimatedCost
    };
  }

  // Book appointment
  async bookAppointment(vehicleData, diagnosisResult, selectedSlot) {
    console.log(`📝 Scheduling Agent: Booking appointment for ${vehicleData.id}`);

    const appointmentId = `APT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    const appointment = {
      id: appointmentId,
      vehicleId: vehicleData.id,
      customerId: vehicleData.ownerId,
      customerName: vehicleData.ownerName,
      customerPhone: vehicleData.ownerPhone,
      serviceCenterId: selectedSlot.serviceCenterId,
      serviceCenterName: selectedSlot.serviceCenterName,
      date: selectedSlot.date,
      time: selectedSlot.time,
      endTime: selectedSlot.endTime,
      estimatedDuration: diagnosisResult.estimatedDuration,
      estimatedCost: diagnosisResult.estimatedCost,
      serviceType: diagnosisResult.predictions.map(p => p.component).join(', '),
      urgency: diagnosisResult.urgencyLevel.level,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
      diagnosis: {
        overallRisk: diagnosisResult.overallRisk,
        predictions: diagnosisResult.predictions
      }
    };

    this.appointments.push(appointment);

    console.log(`✅ Appointment booked: ${appointmentId}`);

    return appointment;
  }

  // Cancel appointment
  cancelAppointment(appointmentId, reason) {
    const appointment = this.appointments.find(apt => apt.id === appointmentId);
    
    if (!appointment) {
      throw new Error(`Appointment not found: ${appointmentId}`);
    }

    appointment.status = 'cancelled';
    appointment.cancelledAt = new Date().toISOString();
    appointment.cancellationReason = reason;

    console.log(`❌ Appointment cancelled: ${appointmentId}`);

    return appointment;
  }

  // Reschedule appointment
  async rescheduleAppointment(appointmentId, newSlot) {
    const appointment = this.appointments.find(apt => apt.id === appointmentId);
    
    if (!appointment) {
      throw new Error(`Appointment not found: ${appointmentId}`);
    }

    appointment.previousDate = appointment.date;
    appointment.previousTime = appointment.time;
    appointment.date = newSlot.date;
    appointment.time = newSlot.time;
    appointment.endTime = newSlot.endTime;
    appointment.rescheduledAt = new Date().toISOString();

    console.log(`🔄 Appointment rescheduled: ${appointmentId}`);

    return appointment;
  }

  // Get appointment by ID
  getAppointment(appointmentId) {
    return this.appointments.find(apt => apt.id === appointmentId);
  }

  // Get all appointments for a vehicle
  getVehicleAppointments(vehicleId) {
    return this.appointments.filter(apt => apt.vehicleId === vehicleId);
  }

  // Get upcoming appointments
  getUpcomingAppointments() {
    const today = new Date().toISOString().split('T')[0];
    return this.appointments.filter(apt => 
      apt.date >= today && 
      apt.status === 'confirmed'
    );
  }

  // Forecast service demand
  forecastDemand(days = 7) {
    console.log(`📊 Scheduling Agent: Forecasting demand for next ${days} days`);

    const forecast = [];
    const today = new Date();

    for (let dayOffset = 1; dayOffset <= days; dayOffset++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() + dayOffset);
      const dateStr = checkDate.toISOString().split('T')[0];

      // Count appointments per service center
      const demandByCenter = {};
      
      this.serviceCenters.forEach(center => {
        const appointmentsCount = this.appointments.filter(apt =>
          apt.serviceCenterId === center.id &&
          apt.date === dateStr &&
          apt.status === 'confirmed'
        ).length;

        const maxCapacity = center.maxCapacityPerHour * (center.workingHours.end - center.workingHours.start);
        const utilizationRate = (appointmentsCount / maxCapacity * 100).toFixed(1);

        demandByCenter[center.id] = {
          centerName: center.name,
          appointments: appointmentsCount,
          capacity: maxCapacity,
          utilizationRate: parseFloat(utilizationRate),
          status: utilizationRate > 80 ? 'HIGH' : utilizationRate > 50 ? 'MEDIUM' : 'LOW'
        };
      });

      forecast.push({
        date: dateStr,
        dayName: checkDate.toLocaleDateString('en-US', { weekday: 'long' }),
        demandByCenter
      });
    }

    console.log(`✅ Demand forecast completed`);

    return forecast;
  }

  // Get all appointments
  getAllAppointments() {
    return this.appointments;
  }
}

module.exports = new SchedulingAgent();