const axios = require('axios');

class MistralService {
  constructor() {
    this.apiKey = process.env.MISTRAL_API_KEY;
    this.baseURL = 'https://api.mistral.ai/v1';
    
    if (!this.apiKey) {
      console.warn('MISTRAL_API_KEY not found in environment variables');
    }
  }

  async generateResponse(message, conversationHistory = []) {
    if (!this.apiKey) {
      throw new Error('Mistral API key not configured');
    }

    try {
      // Create the system prompt - let Mistral use its own plant knowledge
      const systemPrompt = `You are an enthusiastic and expert gardening assistant specialized in helping users grow edible vegetables, fruits, and herbs. You have comprehensive knowledge about all types of plants, fruits, and vegetables.

CRITICAL: Always provide COMPLETE responses. Never end a response mid-sentence or with incomplete information. If you start listing items or varieties, finish the entire list. Ensure every response has a proper conclusion.

IMPORTANT GUIDELINES:
- Provide detailed, specific information about any plant the user asks about
- Include information about:
  * Plant description and benefits
  * Sunlight requirements (full sun, partial sun, shade)
  * Space requirements (small containers, medium pots, large spaces)
  * Maintenance level (low, medium, high)
  * Growing time and harvest timeline
  * Watering needs
  * Soil requirements
  * Growing tips and best practices
  * Container growing advice when relevant
  * Common varieties that work well for home growing

- MAINTAIN CONVERSATION CONTEXT - if the user asks follow-up questions like "How much water does it need?", "What size pot?", "How long until fruit?", refer to the plant discussed in previous messages
- Be specific and detailed in your responses
- Always encourage users and be positive about their gardening goals
- Focus on practical, actionable advice for home gardeners
- When discussing fruits and vegetables, emphasize container-friendly and small-space growing options
- Provide variety recommendations when relevant

Your goal is to help users successfully grow their own food and herbs, whether they have a large garden or just a balcony. Be encouraging, informative, and practical.`;

      // Build conversation messages
      const messages = [
        { role: 'system', content: systemPrompt }
      ];

      // Add conversation history
      conversationHistory.forEach(msg => {
        messages.push(msg);
      });

      // Add current user message
      messages.push({ role: 'user', content: message });

      // Make API call to Mistral
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: 'mistral-small-latest',
          messages: messages,
          temperature: 0.7,
          max_tokens: 2000  // Increased to allow complete responses
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('Mistral API Error:', error.response?.data || error.message);
      
      // If API fails, throw error so chatbot controller can handle it
      throw new Error('Failed to generate response from Mistral API: ' + (error.response?.data?.message || error.message));
    }
  }

  // Validate response quality
  validateResponse(response) {
    if (!response || response.trim().length < 20) {
      return false;
    }

    // Check if response is meaningful
    const meaninglessResponses = [
      'i don\'t know',
      'i cannot help',
      'i\'m not sure',
      'please contact',
      'as an ai'
    ];

    const responseLower = response.toLowerCase();
    if (meaninglessResponses.some(phrase => responseLower.includes(phrase))) {
      return false;
    }

    return true;
  }

  // Method to get response with validation
  async getFilteredResponse(message, conversationHistory = []) {
    // If no API key is configured, inform the user
    if (!this.apiKey) {
      return "I'm sorry, the AI chat service is currently not configured. Please ask the administrator to set up the MISTRAL_API_KEY environment variable to enable the plant growing assistant.";
    }

    try {
      const response = await this.generateResponse(message, conversationHistory);
      
      // Validate the response
      if (!this.validateResponse(response)) {
        throw new Error('Response validation failed');
      }

      return response;
    } catch (error) {
      console.error('Error getting filtered response:', error);
      
      // Return a helpful error message
      return "I'm having trouble connecting to the AI service right now. Please try asking your question again in a moment. If the problem persists, please contact support.";
    }
  }
}

module.exports = new MistralService();

