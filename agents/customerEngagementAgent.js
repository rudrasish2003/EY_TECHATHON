const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

class CustomerEngagementAgent {
  constructor() {
    this.name = 'customerEngagement';
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
    this.conversations = new Map();
  }

  // Initiate contact with customer
  async initiateContact(vehicleData, diagnosisResult) {
    console.log(`📞 Customer Engagement Agent: Initiating contact with ${vehicleData.ownerName}`);
    
    const conversationId = `CONV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Create personalized opening message
    const openingMessage = await this.generateOpeningMessage(vehicleData, diagnosisResult);
    
    const conversation = {
      id: conversationId,
      vehicleId: vehicleData.id,
      customerId: vehicleData.ownerId,
      customerName: vehicleData.ownerName,
      startTime: new Date().toISOString(),
      status: 'initiated',
      messages: [
        {
          role: 'agent',
          content: openingMessage,
          timestamp: new Date().toISOString()
        }
      ],
      diagnosisResult,
      appointmentBooked: false
    };
    
    this.conversations.set(conversationId, conversation);
    
    console.log(`✅ Contact initiated - Conversation ID: ${conversationId}`);
    
    return {
      conversationId,
      openingMessage,
      customerName: vehicleData.ownerName,
      customerPhone: vehicleData.ownerPhone
    };
  }

  // Generate personalized opening message using Gemini
  async generateOpeningMessage(vehicleData, diagnosisResult) {
    const prompt = `You are a friendly and professional automotive service assistant. 
    
Customer Details:
- Name: ${vehicleData.ownerName}
- Vehicle: ${vehicleData.make} ${vehicleData.model} (${vehicleData.year})
- Current Mileage: ${vehicleData.currentMileage} km

Diagnosis Summary:
- Risk Level: ${diagnosisResult.overallRisk.toUpperCase()}
- Urgency: ${diagnosisResult.urgencyLevel.level}
- Issues Detected: ${diagnosisResult.predictions.map(p => p.component).join(', ')}
- Estimated Cost: ₹${diagnosisResult.estimatedCost.min} - ₹${diagnosisResult.estimatedCost.max}
- Summary: ${diagnosisResult.diagnosticSummary}

Generate a warm, persuasive voice call opening message (2-3 sentences) that:
1. Greets the customer by name
2. Mentions their vehicle
3. Explains the detected issue in simple terms
4. Creates urgency without being alarming
5. Offers to schedule a service appointment

Keep it conversational and friendly, like a real phone call.`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Gemini API error:', error.message);
      // Fallback message
      return `Hello ${vehicleData.ownerName}, this is a courtesy call from your automotive service center. Our predictive system has detected that your ${vehicleData.make} ${vehicleData.model} may need attention soon. We'd like to schedule a maintenance appointment to prevent any issues. Would you like to book a service?`;
    }
  }

  // Handle customer response
  async handleCustomerResponse(conversationId, customerResponse) {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      throw new Error(`Conversation not found: ${conversationId}`);
    }

    console.log(`💬 Customer response received for ${conversationId}`);
    
    // Add customer message
    conversation.messages.push({
      role: 'customer',
      content: customerResponse,
      timestamp: new Date().toISOString()
    });

    // Analyze response intent
    const intent = await this.analyzeIntent(customerResponse, conversation);
    
    // Generate appropriate response
    const agentResponse = await this.generateResponse(intent, conversation);
    
    // Add agent message
    conversation.messages.push({
      role: 'agent',
      content: agentResponse.message,
      timestamp: new Date().toISOString()
    });

    // Update conversation status
    if (intent.type === 'accept') {
      conversation.status = 'appointment_requested';
      conversation.appointmentBooked = true;
    } else if (intent.type === 'decline') {
      conversation.status = 'declined';
    }

    return {
      conversationId,
      agentResponse: agentResponse.message,
      intent: intent.type,
      shouldSchedule: intent.type === 'accept',
      conversationStatus: conversation.status
    };
  }

  // Analyze customer intent using Gemini
  async analyzeIntent(customerResponse, conversation) {
    const prompt = `Analyze the customer's response to determine their intent.

Customer Response: "${customerResponse}"

Context: We're trying to schedule a vehicle maintenance appointment.

Classify the intent as one of:
- "accept" - Customer wants to book appointment
- "decline" - Customer doesn't want to book
- "question" - Customer has questions
- "reschedule" - Customer wants different time
- "uncertain" - Customer is unsure

Respond with ONLY the intent type (one word).`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const intentType = response.text().trim().toLowerCase();
      
      return {
        type: intentType,
        confidence: 0.8
      };
    } catch (error) {
      console.error('Intent analysis error:', error.message);
      // Simple keyword-based fallback
      const lower = customerResponse.toLowerCase();
      if (lower.includes('yes') || lower.includes('sure') || lower.includes('book')) {
        return { type: 'accept', confidence: 0.6 };
      } else if (lower.includes('no') || lower.includes('not')) {
        return { type: 'decline', confidence: 0.6 };
      } else {
        return { type: 'question', confidence: 0.5 };
      }
    }
  }

  // Generate response based on intent
  async generateResponse(intent, conversation) {
    const diagnosis = conversation.diagnosisResult;
    
    let prompt = '';
    
    switch (intent.type) {
      case 'accept':
        prompt = `Customer agreed to book appointment. Generate a brief, friendly confirmation message mentioning:
        - Thank them for agreeing
        - Mention we'll schedule the appointment
        - Estimated service duration: ${diagnosis.estimatedDuration.formatted}
        Keep it 1-2 sentences.`;
        break;
        
      case 'decline':
        prompt = `Customer declined the appointment. Generate a polite, understanding response that:
        - Respects their decision
        - Mentions they can call anytime
        - Reminds them about the ${diagnosis.urgencyLevel.level} urgency
        Keep it 1-2 sentences.`;
        break;
        
      case 'question':
        prompt = `Customer has questions. Generate a helpful response that:
        - Offers to explain more details
        - Mentions key issues: ${diagnosis.predictions.map(p => p.component).join(', ')}
        - Asks what specifically they'd like to know
        Keep it 2-3 sentences.`;
        break;
        
      case 'reschedule':
        prompt = `Customer wants to reschedule. Generate a flexible response offering:
        - Different time slots
        - Acknowledges their timing preference
        Keep it 1-2 sentences.`;
        break;
        
      default:
        prompt = `Customer seems uncertain. Generate a reassuring message that:
        - Simplifies the issue
        - Emphasizes vehicle safety
        - Asks if they'd like to proceed
        Keep it 2 sentences.`;
    }

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return {
        message: response.text(),
        intent: intent.type
      };
    } catch (error) {
      console.error('Response generation error:', error.message);
      // Fallback responses
      const fallbacks = {
        'accept': 'Great! I\'ll schedule your appointment right away. The service will take about ' + diagnosis.estimatedDuration.formatted + '.',
        'decline': 'I understand. Please feel free to call us when you\'re ready. Remember, this is a ' + diagnosis.urgencyLevel.level + ' priority issue.',
        'question': 'I\'d be happy to explain more. What specific details would you like to know about the maintenance?',
        'reschedule': 'No problem! What time works best for you?',
        'uncertain': 'I understand your concern. This is about keeping your vehicle safe. Would you like to proceed with scheduling?'
      };
      return {
        message: fallbacks[intent.type] || fallbacks['uncertain'],
        intent: intent.type
      };
    }
  }

  // Get conversation history
  getConversation(conversationId) {
    return this.conversations.get(conversationId);
  }

  // Get all conversations
  getAllConversations() {
    return Array.from(this.conversations.values());
  }

  // End conversation
  endConversation(conversationId, outcome) {
    const conversation = this.conversations.get(conversationId);
    if (conversation) {
      conversation.status = 'completed';
      conversation.endTime = new Date().toISOString();
      conversation.outcome = outcome;
      console.log(`✅ Conversation ${conversationId} ended - Outcome: ${outcome}`);
    }
    return conversation;
  }
}

module.exports = new CustomerEngagementAgent();