const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

class FeedbackAgent {
  constructor() {
    this.name = 'feedback';
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
    this.feedbackRecords = [];
  }

  // Initiate feedback collection
  async collectFeedback(appointment) {
    console.log(`📝 Feedback Agent: Collecting feedback for appointment ${appointment.id}`);
    
    const feedbackId = `FB-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Generate personalized feedback questions
    const questions = await this.generateFeedbackQuestions(appointment);
    
    const feedbackRecord = {
      id: feedbackId,
      appointmentId: appointment.id,
      vehicleId: appointment.vehicleId,
      customerId: appointment.customerId,
      customerName: appointment.customerName,
      serviceCenterId: appointment.serviceCenterId,
      serviceCenterName: appointment.serviceCenterName,
      serviceDate: appointment.date,
      status: 'pending',
      questions,
      responses: [],
      createdAt: new Date().toISOString(),
      completedAt: null
    };
    
    this.feedbackRecords.push(feedbackRecord);
    
    console.log(`✅ Feedback request created: ${feedbackId}`);
    
    return feedbackRecord;
  }

  // Generate personalized feedback questions
  async generateFeedbackQuestions(appointment) {
    const baseQuestions = [
      {
        id: 'Q1',
        type: 'rating',
        question: 'How satisfied are you with the overall service experience?',
        scale: 5,
        category: 'overall_satisfaction'
      },
      {
        id: 'Q2',
        type: 'rating',
        question: 'How would you rate the quality of work performed on your vehicle?',
        scale: 5,
        category: 'service_quality'
      },
      {
        id: 'Q3',
        type: 'rating',
        question: 'How satisfied are you with the communication from our service team?',
        scale: 5,
        category: 'communication'
      },
      {
        id: 'Q4',
        type: 'rating',
        question: 'How would you rate the cleanliness and professionalism of our service center?',
        scale: 5,
        category: 'facility'
      },
      {
        id: 'Q5',
        type: 'boolean',
        question: 'Was the service completed within the estimated time?',
        category: 'timeliness'
      },
      {
        id: 'Q6',
        type: 'boolean',
        question: 'Did the final cost match the initial estimate?',
        category: 'cost_accuracy'
      },
      {
        id: 'Q7',
        type: 'text',
        question: 'What did you like most about your service experience?',
        category: 'positive_feedback'
      },
      {
        id: 'Q8',
        type: 'text',
        question: 'What areas do you think we could improve?',
        category: 'improvement_suggestions'
      },
      {
        id: 'Q9',
        type: 'rating',
        question: 'How likely are you to recommend our service center to others?',
        scale: 10,
        category: 'nps'
      }
    ];

    return baseQuestions;
  }

  // Submit customer feedback
  async submitFeedback(feedbackId, responses) {
    console.log(`📥 Feedback Agent: Processing feedback ${feedbackId}`);
    
    const feedbackRecord = this.feedbackRecords.find(fb => fb.id === feedbackId);
    
    if (!feedbackRecord) {
      throw new Error(`Feedback record not found: ${feedbackId}`);
    }

    feedbackRecord.responses = responses;
    feedbackRecord.status = 'completed';
    feedbackRecord.completedAt = new Date().toISOString();

    // Analyze feedback sentiment
    const analysis = await this.analyzeFeedback(feedbackRecord);
    feedbackRecord.analysis = analysis;

    console.log(`✅ Feedback processed: ${feedbackId}`);
    console.log(`   Overall Sentiment: ${analysis.sentiment}`);
    console.log(`   NPS Score: ${analysis.npsScore}`);

    return feedbackRecord;
  }

  // Analyze feedback using AI
  async analyzeFeedback(feedbackRecord) {
    const ratings = {};
    const textResponses = [];
    let npsScore = null;

    feedbackRecord.responses.forEach(response => {
      const question = feedbackRecord.questions.find(q => q.id === response.questionId);
      
      if (question.type === 'rating') {
        ratings[question.category] = response.value;
        
        if (question.category === 'nps') {
          npsScore = response.value;
        }
      } else if (question.type === 'text') {
        textResponses.push({
          category: question.category,
          text: response.value
        });
      }
    });

    // Calculate average rating
    const ratingValues = Object.values(ratings).filter(r => r !== null && typeof r === 'number');
    const averageRating = ratingValues.length > 0 
      ? (ratingValues.reduce((sum, r) => sum + r, 0) / ratingValues.length).toFixed(2)
      : 0;

    // Determine sentiment
    let sentiment = 'neutral';
    if (averageRating >= 4.5) sentiment = 'very_positive';
    else if (averageRating >= 4) sentiment = 'positive';
    else if (averageRating >= 3) sentiment = 'neutral';
    else if (averageRating >= 2) sentiment = 'negative';
    else sentiment = 'very_negative';

    // NPS categorization
    let npsCategory = 'passive';
    if (npsScore >= 9) npsCategory = 'promoter';
    else if (npsScore <= 6) npsCategory = 'detractor';

    // Analyze text feedback with AI
    let aiInsights = null;
    if (textResponses.length > 0) {
      aiInsights = await this.generateAIInsights(textResponses);
    }

    return {
      averageRating: parseFloat(averageRating),
      sentiment,
      npsScore,
      npsCategory,
      ratings,
      aiInsights,
      analysisDate: new Date().toISOString()
    };
  }

  // Generate AI insights from text feedback
  async generateAIInsights(textResponses) {
    const textContent = textResponses.map(tr => 
      `${tr.category}: ${tr.text}`
    ).join('\n');

    const prompt = `Analyze the following customer feedback and provide insights:

${textContent}

Provide a brief analysis covering:
1. Key positive points
2. Areas for improvement
3. Action items

Keep it concise (3-4 sentences).`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('AI insights generation error:', error.message);
      return 'Unable to generate AI insights at this time.';
    }
  }

  // Get feedback summary for a service center
  getServiceCenterFeedback(serviceCenterId) {
    const centerFeedback = this.feedbackRecords.filter(
      fb => fb.serviceCenterId === serviceCenterId && fb.status === 'completed'
    );

    if (centerFeedback.length === 0) {
      return {
        serviceCenterId,
        totalFeedback: 0,
        message: 'No feedback available'
      };
    }

    // Calculate metrics
    const totalRating = centerFeedback.reduce((sum, fb) => sum + fb.analysis.averageRating, 0);
    const averageRating = (totalRating / centerFeedback.length).toFixed(2);

    const npsScores = centerFeedback.filter(fb => fb.analysis.npsScore !== null);
    const promoters = npsScores.filter(fb => fb.analysis.npsCategory === 'promoter').length;
    const detractors = npsScores.filter(fb => fb.analysis.npsCategory === 'detractor').length;
    const npsScore = npsScores.length > 0 
      ? Math.round(((promoters - detractors) / npsScores.length) * 100)
      : 0;

    const sentimentBreakdown = {
      very_positive: centerFeedback.filter(fb => fb.analysis.sentiment === 'very_positive').length,
      positive: centerFeedback.filter(fb => fb.analysis.sentiment === 'positive').length,
      neutral: centerFeedback.filter(fb => fb.analysis.sentiment === 'neutral').length,
      negative: centerFeedback.filter(fb => fb.analysis.sentiment === 'negative').length,
      very_negative: centerFeedback.filter(fb => fb.analysis.sentiment === 'very_negative').length
    };

    return {
      serviceCenterId,
      serviceCenterName: centerFeedback[0].serviceCenterName,
      totalFeedback: centerFeedback.length,
      averageRating: parseFloat(averageRating),
      npsScore,
      sentimentBreakdown,
      recentFeedback: centerFeedback.slice(-5).map(fb => ({
        id: fb.id,
        customerName: fb.customerName,
        rating: fb.analysis.averageRating,
        sentiment: fb.analysis.sentiment,
        date: fb.completedAt
      }))
    };
  }

  // Get overall feedback dashboard
  getFeedbackDashboard() {
    const completedFeedback = this.feedbackRecords.filter(fb => fb.status === 'completed');

    if (completedFeedback.length === 0) {
      return {
        totalFeedback: 0,
        message: 'No feedback data available'
      };
    }

    const totalRating = completedFeedback.reduce((sum, fb) => sum + fb.analysis.averageRating, 0);
    const overallAverageRating = (totalRating / completedFeedback.length).toFixed(2);

    const npsScores = completedFeedback.filter(fb => fb.analysis.npsScore !== null);
    const promoters = npsScores.filter(fb => fb.analysis.npsCategory === 'promoter').length;
    const detractors = npsScores.filter(fb => fb.analysis.npsCategory === 'detractor').length;
    const overallNPS = npsScores.length > 0 
      ? Math.round(((promoters - detractors) / npsScores.length) * 100)
      : 0;

    // Group by service center
    const serviceCenters = [...new Set(completedFeedback.map(fb => fb.serviceCenterId))];
    const centerSummaries = serviceCenters.map(centerId => 
      this.getServiceCenterFeedback(centerId)
    );

    return {
      totalFeedback: completedFeedback.length,
      overallAverageRating: parseFloat(overallAverageRating),
      overallNPS,
      serviceCenters: centerSummaries,
      recentFeedback: completedFeedback.slice(-10).reverse()
    };
  }

  // Get feedback by ID
  getFeedback(feedbackId) {
    return this.feedbackRecords.find(fb => fb.id === feedbackId);
  }

  // Get all feedback
  getAllFeedback() {
    return this.feedbackRecords;
  }
}

module.exports = new FeedbackAgent();