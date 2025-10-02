const feedbackAgent = require('../agents/feedbackAgent');
const schedulingAgent = require('../agents/schedulingAgent');
const diagnosisAgent = require('../agents/diagnosisAgent');
const dataAnalysisAgent = require('../agents/dataAnalysisAgent');
const fs = require('fs');
const path = require('path');

async function testFeedbackAgent() {
  console.log('📝 Testing Feedback Agent...\n');
  console.log('='.repeat(60));
  
  try {
    // Create some appointments first
    console.log('Step 1: Creating sample appointments...');
    const vehiclesPath = path.join(__dirname, '../data/synthetic/vehicles.json');
    const vehicles = JSON.parse(fs.readFileSync(vehiclesPath, 'utf8'));
    
    const appointments = [];
    for (let i = 0; i < 3; i++) {
      const vehicle = vehicles[i];
      const analysis = await dataAnalysisAgent.analyzeVehicle(vehicle.id);
      const diagnosis = await diagnosisAgent.diagnose(vehicle.id, analysis);
      const slots = await schedulingAgent.proposeAppointments(vehicle, diagnosis);
      
      if (slots.proposedSlots.length > 0) {
        const slot = {
          serviceCenterId: slots.serviceCenter.id,
          serviceCenterName: slots.serviceCenter.name,
          date: slots.proposedSlots[0].date,
          time: slots.proposedSlots[0].slots[0].time,
          endTime: slots.proposedSlots[0].slots[0].endTime
        };
        const appointment = await schedulingAgent.bookAppointment(vehicle, diagnosis, slot);
        appointments.push(appointment);
      }
    }
    console.log(`✅ Created ${appointments.length} appointments\n`);
    
    // Collect feedback for first appointment
    console.log('Step 2: Initiating feedback collection...');
    console.log('-'.repeat(60));
    const feedbackRequest = await feedbackAgent.collectFeedback(appointments[0]);
    
    console.log(`\n📋 Feedback Request Created`);
    console.log(`   ID: ${feedbackRequest.id}`);
    console.log(`   Customer: ${feedbackRequest.customerName}`);
    console.log(`   Service Center: ${feedbackRequest.serviceCenterName}`);
    console.log(`\n   Questions:`);
    feedbackRequest.questions.forEach((q, idx) => {
      console.log(`   ${idx + 1}. [${q.type}] ${q.question}`);
    });
    
    // Simulate customer responses - Positive feedback
    console.log('\n\nStep 3: Submitting positive customer feedback...');
    console.log('-'.repeat(60));
    const positiveResponses = [
      { questionId: 'Q1', value: 5 },
      { questionId: 'Q2', value: 5 },
      { questionId: 'Q3', value: 4 },
      { questionId: 'Q4', value: 5 },
      { questionId: 'Q5', value: true },
      { questionId: 'Q6', value: true },
      { questionId: 'Q7', value: 'The service was excellent and the staff was very professional. My car is running smoothly now.' },
      { questionId: 'Q8', value: 'Maybe add more waiting area seating, but overall everything was great!' },
      { questionId: 'Q9', value: 9 }
    ];
    
    const completedFeedback1 = await feedbackAgent.submitFeedback(feedbackRequest.id, positiveResponses);
    
    console.log(`\n✅ Feedback Analysis:`);
    console.log(`   Average Rating: ${completedFeedback1.analysis.averageRating}/5`);
    console.log(`   Sentiment: ${completedFeedback1.analysis.sentiment.toUpperCase()}`);
    console.log(`   NPS Score: ${completedFeedback1.analysis.npsScore}/10 (${completedFeedback1.analysis.npsCategory})`);
    console.log(`\n   AI Insights:`);
    console.log(`   ${completedFeedback1.analysis.aiInsights}`);
    
    // Collect and submit more feedback
    console.log('\n\nStep 4: Collecting more feedback samples...');
    console.log('-'.repeat(60));
    
    // Feedback 2 - Neutral
    const feedbackRequest2 = await feedbackAgent.collectFeedback(appointments[1]);
    const neutralResponses = [
      { questionId: 'Q1', value: 3 },
      { questionId: 'Q2', value: 4 },
      { questionId: 'Q3', value: 3 },
      { questionId: 'Q4', value: 3 },
      { questionId: 'Q5', value: false },
      { questionId: 'Q6', value: true },
      { questionId: 'Q7', value: 'Service was okay, nothing special.' },
      { questionId: 'Q8', value: 'Better time management needed. Took longer than expected.' },
      { questionId: 'Q9', value: 7 }
    ];
    await feedbackAgent.submitFeedback(feedbackRequest2.id, neutralResponses);
    console.log(`   ✅ Neutral feedback submitted`);
    
    // Feedback 3 - Positive
    const feedbackRequest3 = await feedbackAgent.collectFeedback(appointments[2]);
    const positiveResponses2 = [
      { questionId: 'Q1', value: 5 },
      { questionId: 'Q2', value: 5 },
      { questionId: 'Q3', value: 5 },
      { questionId: 'Q4', value: 4 },
      { questionId: 'Q5', value: true },
      { questionId: 'Q6', value: true },
      { questionId: 'Q7', value: 'Quick service and transparent communication throughout.' },
      { questionId: 'Q8', value: 'Everything was perfect!' },
      { questionId: 'Q9', value: 10 }
    ];
    await feedbackAgent.submitFeedback(feedbackRequest3.id, positiveResponses2);
    console.log(`   ✅ Positive feedback submitted`);
    
    // Get service center feedback summary
    console.log('\n\nStep 5: Service Center Feedback Summary');
    console.log('='.repeat(60));
    const centerFeedback = feedbackAgent.getServiceCenterFeedback(appointments[0].serviceCenterId);
    
    console.log(`\n🏢 ${centerFeedback.serviceCenterName}`);
    console.log(`   Total Feedback: ${centerFeedback.totalFeedback}`);
    console.log(`   Average Rating: ${centerFeedback.averageRating}/5`);
    console.log(`   NPS Score: ${centerFeedback.npsScore}`);
    console.log(`\n   Sentiment Breakdown:`);
    console.log(`      Very Positive: ${centerFeedback.sentimentBreakdown.very_positive}`);
    console.log(`      Positive: ${centerFeedback.sentimentBreakdown.positive}`);
    console.log(`      Neutral: ${centerFeedback.sentimentBreakdown.neutral}`);
    console.log(`      Negative: ${centerFeedback.sentimentBreakdown.negative}`);
    console.log(`      Very Negative: ${centerFeedback.sentimentBreakdown.very_negative}`);
    
    // Overall feedback dashboard
    console.log('\n\nStep 6: Overall Feedback Dashboard');
    console.log('='.repeat(60));
    const dashboard = feedbackAgent.getFeedbackDashboard();
    
    console.log(`\n📊 Overall Metrics:`);
    console.log(`   Total Feedback: ${dashboard.totalFeedback}`);
    console.log(`   Overall Average Rating: ${dashboard.overallAverageRating}/5`);
    console.log(`   Overall NPS: ${dashboard.overallNPS}`);
    
    console.log(`\n🏢 Service Centers:`);
    dashboard.serviceCenters.forEach(center => {
      console.log(`\n   ${center.serviceCenterName}`);
      console.log(`      Rating: ${center.averageRating}/5`);
      console.log(`      NPS: ${center.npsScore}`);
      console.log(`      Feedback Count: ${center.totalFeedback}`);
    });
    
    console.log('\n\n✅ Feedback Agent test completed!');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

testFeedbackAgent();