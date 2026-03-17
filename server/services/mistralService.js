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
      // Create the system prompt for vegetable and fruit focused chatbot
      const systemPrompt = `You are a specialized gardening assistant focused EXCLUSIVELY on edible vegetables and fruits. You ONLY answer questions about:

1. Growing edible vegetables and fruits (planting, care, harvesting)
2. Plant diseases and pests affecting edible crops
3. Disease prevention and treatment for edible plants
4. Container and small-space gardening for edible crops
5. Nutrition and fertilization for edible plants
6. Soil requirements for edible vegetables and fruits
7. Watering and care schedules for edible crops
8. Companion planting for vegetable gardens
9. Seasonal planting for edible crops
10. Pruning and maintenance of edible plants

CRITICAL RULES:
- ONLY answer questions related to growing, caring for, and protecting EDIBLE vegetables and fruits
- If asked about cooking, recipes, food preparation, or unrelated topics, politely redirect to gardening
- NEVER provide cooking instructions, recipes, or food preparation advice
- ONLY discuss growing, diseases, pests, care, and harvesting of edible plants
- If asked about noodles, cooking, or recipes, say: "I specialize in growing vegetables and fruits, not cooking. I can help you grow ingredients for recipes though! What would you like to grow?"
- Focus on container gardening, small spaces, disease management, and plant care

Your expertise includes:

EDIBLE VEGETABLES AND FRUITS ONLY:
- Leafy greens (lettuce, spinach, kale, arugula, Swiss chard)
- Root vegetables (carrots, radishes, beets, turnips)
- Fruiting vegetables (tomatoes, peppers, cucumbers, zucchini, eggplant)
- Legumes (beans, peas)
- Alliums (onions, garlic, leeks, green onions)
- Cruciferous vegetables (broccoli, cauliflower, cabbage, Brussels sprouts)
- Squash and pumpkins
- Edible fruits (strawberries, blueberries, raspberries, apples, citrus, etc.)

HYBRID AND CONTAINER VARIETIES EXPERTISE:
- Dwarf and compact hybrid fruit trees (dwarf apple, citrus, cherry trees)
- Container-friendly hybrid vegetables (patio tomatoes, bush beans, compact peppers)
- Fast-growing hybrid varieties that produce quickly
- Space-saving vertical growing techniques
- Grafted plants that combine multiple varieties
- Self-pollinating hybrid fruits perfect for small spaces
- Determinate vs indeterminate varieties for containers

IMPORTANT APPROACH:
- NEVER discourage or degrade user ideas - always be positive and supportive
- Focus ONLY on plants that produce edible vegetables or fruits
- Emphasize container growing and small-space solutions
- Always provide practical requirements rather than discouraging words
- Highlight hybrid varieties that grow faster and more compactly

RESPONSE GUIDELINES:
- Always start with encouragement and positivity
- Provide specific growing requirements (space, sunlight, water, soil)
- Mention container sizes needed for successful growing
- Suggest hybrid varieties that are perfect for small spaces
- Include care level, harvest timing, and expected yields
- Offer alternatives if space is limited (suggest compact/dwarf varieties)
- Be enthusiastic about the user's growing ambitions
- ALWAYS complete your thoughts fully - never leave sentences hanging
- End responses with proper punctuation and positive encouragement
- Use encouraging phrases like "Happy growing!", "You've got this!", or "Let's grow together!"
 - Prefer short paragraphs and simple bullet points; avoid long walls of text

FORMATTING RULES - VERY IMPORTANT:
- ABSOLUTELY NEVER use any asterisks (*) or stars in your responses
- NEVER use markdown symbols like ####, **, ##, ***, or any * symbols
- DO NOT use hashtags (#) for formatting
- Instead of **bold text**, just write the text normally or use CAPITAL LETTERS for emphasis
- Instead of *italic text*, just write the text normally
- Use clear paragraph breaks and natural language structure
- Use simple text formatting with line breaks for organization
- Write in a conversational, easy-to-read format
- Use bullet points with simple dashes (-) if needed
- Structure information with clear sentences and paragraphs
- If you need to emphasize something, use CAPITAL LETTERS or write it in a separate line

NEVER say things like "that's difficult", "you can't", "it won't work", or "that's too hard". Instead, provide the requirements and suggest the best varieties for their situation.

If asked about non-edible plants, herbs, or ornamental plants, enthusiastically redirect to edible vegetables and fruits that would work great in their space.`;

      // Build the conversation messages
      const messages = [
        {
          role: 'system',
          content: systemPrompt
        },
        ...conversationHistory,
        {
          role: 'user',
          content: message
        }
      ];

      const response = await axios.post(`${this.baseURL}/chat/completions`, {
        model: process.env.MISTRAL_MODEL || 'mistral-small-latest',
        messages: messages,
        temperature: 0.7,
        max_tokens: 1500,
        top_p: 0.95
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('Mistral API Error:', error.response?.data || error.message);
      
      // Handle specific API errors with better fallback responses
      if (error.response?.data?.code === '3505') {
        // Service tier capacity exceeded - provide a helpful fallback
        return this.generateIntelligentFallback(message);
      }
      
      throw new Error('Failed to generate response from Mistral API');
    }
  }

  // Attempt a refinement pass if the first answer is too generic/short
  async refineResponse(originalUserMessage, firstResponse, conversationHistory = []) {
    try {
      const refinementSystemPrompt = `You are revising your previous answer that was too generic. Provide a detailed, context-aware, step-by-step answer that:

- References prior user context if helpful
- Offers specific varieties, container sizes, sunlight/water/soil requirements
- Provides alternatives for small spaces
- Asks at most 1 brief clarifying question if something critical is missing
- Ends with a clear next action for the user

Avoid marketing-style introductions. Go straight to helpful, actionable guidance.`;

      const messages = [
        { role: 'system', content: refinementSystemPrompt },
        ...conversationHistory,
        { role: 'user', content: originalUserMessage },
        { role: 'assistant', content: firstResponse },
        { role: 'user', content: 'Please expand with specific, step-by-step guidance tailored to my situation.' }
      ];

      const response = await axios.post(`${this.baseURL}/chat/completions`, {
        model: process.env.MISTRAL_MODEL || 'mistral-small-latest',
        messages,
        temperature: 0.7,
        max_tokens: 1500,
        top_p: 0.95
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('Mistral refinement error:', error.response?.data || error.message);
      return null;
    }
  }

  // Helper method to validate if the response is about edible plants
  validateResponse(response) {
    const edibleKeywords = [
      'vegetable', 'fruit', 'tomato', 'lettuce', 'spinach', 'carrot', 'radish',
      'pepper', 'cucumber', 'zucchini', 'broccoli', 'cauliflower', 'cabbage',
      'bean', 'pea', 'onion', 'garlic', 'strawberry', 'blueberry', 'raspberry',
      'apple', 'citrus', 'squash', 'pumpkin', 'kale', 'arugula', 'chard',
      'beet', 'turnip', 'eggplant', 'leek', 'brussels sprout',
      // Hybrid and container growing terms
      'hybrid', 'dwarf', 'compact', 'container', 'patio', 'bush', 'determinate',
      'indeterminate', 'grafted', 'self-pollinating', 'vertical', 'space-saving',
      'fast-growing', 'quick-growing', 'miniature', 'small-space', 'balcony'
    ];

    const herbKeywords = [
      'herb', 'basil', 'parsley', 'cilantro', 'mint', 'oregano', 'thyme',
      'rosemary', 'sage', 'dill', 'chives', 'tarragon', 'bay leaf'
    ];

    const responseLower = response.toLowerCase();
    
    // Check if response contains herb keywords
    const hasHerbs = herbKeywords.some(keyword => responseLower.includes(keyword));
    
    // Check if response contains edible plant keywords
    const hasEdiblePlants = edibleKeywords.some(keyword => responseLower.includes(keyword));

    // If response mentions herbs but no edible plants, it's not appropriate
    if (hasHerbs && !hasEdiblePlants) {
      return false;
    }

    return true;
  }

  // Clean up markdown formatting from response
  cleanMarkdownFormatting(text) {
    if (!text) return text;
    
    let cleanText = text;
    
    // Remove markdown headers (####, ###, ##, #)
    cleanText = cleanText.replace(/#{1,6}\s*/g, '');
    
    // Remove ALL asterisk patterns - be very aggressive
    cleanText = cleanText.replace(/\*{1,4}([^*\n]+?)\*{1,4}/g, '$1'); // Remove **text**, ***text***, ****text****
    cleanText = cleanText.replace(/\*([^*\n]+?)\*/g, '$1'); // Remove single *text*
    cleanText = cleanText.replace(/\*{2,}/g, ''); // Remove any remaining multiple asterisks
    cleanText = cleanText.replace(/\*/g, ''); // Remove any remaining single asterisks
    
    // Remove other markdown symbols
    cleanText = cleanText.replace(/`([^`]+)`/g, '$1'); // Remove code backticks
    cleanText = cleanText.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'); // Remove links, keep text
    cleanText = cleanText.replace(/_{1,2}([^_]+)_{1,2}/g, '$1'); // Remove underscores for emphasis
    
    // Preserve paragraph breaks and bullets; normalize excessive blank lines
    cleanText = cleanText.replace(/\n{3,}/g, '\n\n');
    
    // Ensure proper spacing after periods without removing newlines
    cleanText = cleanText.replace(/\.([A-Z])/g, '. $1');
    
    // Remove plant emojis that might appear in responses
    cleanText = cleanText.replace(/🌱/g, ''); // Remove seedling emoji
    cleanText = cleanText.replace(/🌿/g, ''); // Remove herb emoji
    cleanText = cleanText.replace(/🍅/g, ''); // Remove tomato emoji
    cleanText = cleanText.replace(/🥬/g, ''); // Remove leafy greens emoji
    cleanText = cleanText.replace(/🥕/g, ''); // Remove carrot emoji
    
    // Clean up trailing spaces while preserving line breaks
    cleanText = cleanText.replace(/[ \t]+\n/g, '\n'); // Trim line endings
    cleanText = cleanText.replace(/\n\s+\n/g, '\n\n'); // Collapse spaced blank lines
    
    return cleanText.trim();
  }

  // Ensure the response ends properly with appropriate punctuation
  ensureProperEnding(text) {
    if (!text) return text;
    
    let response = text.trim();
    
    // Check if this is a very short, generic response that should be replaced
    const shortGenericResponses = [
      "that's an exciting idea",
      "that's a great question", 
      "that's fantastic",
      "that's wonderful",
      "that's amazing",
      "oh, you're in for a treat",
      "that sounds great",
      "that's perfect"
    ];
    
    const responseLower = response.toLowerCase();
    const isShortGeneric = shortGenericResponses.some(phrase => responseLower.includes(phrase));
    
    // If it's a short generic response, don't add "Happy growing!" - let the intelligent fallback handle it
    if (isShortGeneric && response.length < 50) {
      return response;
    }
    
    // If the response doesn't end with proper punctuation, add it
    if (!response.match(/[.!?]$/)) {
      // Check if it ends mid-sentence (no space before last word)
      const words = response.split(' ');
      const lastWord = words[words.length - 1];
      
      // If the last word seems incomplete (very short or no vowels), it might be cut off
      if (lastWord.length < 3 || !/[aeiou]/i.test(lastWord)) {
        // Remove the incomplete word and add proper ending
        words.pop();
        response = words.join(' ') + '.';
      } else {
        // Just add a period
        response += '.';
      }
    }
    
    // Ensure it ends with a positive gardening note (only for longer responses)
    if (response.length > 50 && !response.toLowerCase().includes('happy') && !response.toLowerCase().includes('enjoy') && 
        !response.toLowerCase().includes('good luck') && !response.toLowerCase().includes('together')) {
      response += ' Happy growing!';
    }
    
    return response;
  }

  // Generate intelligent fallback responses based on user's question
  generateIntelligentFallback(message) {
    const messageLower = message.toLowerCase();
    
    // Hybrid fruits (check this first to avoid container vegetables matching)
    if (messageLower.includes('hybrid') && messageLower.includes('fruit')) {
      return "Excellent question about hybrid fruits! For container growing, try these amazing hybrid varieties: Dwarf apple trees like 'Urban Apple' (self-pollinating), compact citrus trees (Meyer lemon, Calamondin orange), dwarf cherry trees, hybrid strawberries like 'Seascape' (everbearing), and even dwarf peach trees. These hybrids are bred for small spaces and often produce fruit faster than traditional varieties. Most need 6-8 hours of sun and regular watering. Start with strawberries for quick results! Happy growing!";
    }
    
    // Fast-growing varieties
    if (messageLower.includes('fast') || messageLower.includes('quick') || messageLower.includes('rapid')) {
      return "Perfect question about fast-growing plants! Here are some speedy varieties that produce quickly: Radishes (21-30 days), leafy greens like lettuce and spinach (30-45 days), bush beans (50-60 days), compact tomatoes like 'Early Girl' (60-70 days), fast-growing peppers like 'Jalapeno' (70-80 days), and even dwarf carrots (60-75 days). For fruits, try everbearing strawberries or dwarf citrus trees. These varieties are perfect for impatient gardeners! Most need 6-8 hours of sun and consistent moisture. Start with radishes for instant gratification! Happy growing!";
    }
    
    // Container-friendly vegetables (but not if it's about fruits)
    if ((messageLower.includes('container') || messageLower.includes('pot') || messageLower.includes('small space') || messageLower.includes('balcony')) && 
        !messageLower.includes('fruit')) {
      return "Great question about container gardening! Here are some fantastic vegetables perfect for pots and small spaces: Patio tomatoes (determinate varieties), bush beans, compact peppers like 'Mini Bell' or 'Lunchbox', leafy greens like lettuce and spinach, radishes (super fast growing!), dwarf carrots like 'Paris Market', and even compact zucchini varieties. Most need 6-8 hours of sun and well-draining soil. Start with lettuce or radishes for quick success! Happy growing!";
    }
    
    // General fruit questions
    if (messageLower.includes('fruit')) {
      return "Great question about fruits! For small spaces, I recommend these container-friendly options: Strawberries (everbearing varieties like 'Seascape'), dwarf citrus trees (Meyer lemon, Calamondin orange), dwarf apple trees (self-pollinating varieties), compact blueberry bushes, and even dwarf peach trees. These are bred specifically for small spaces and often produce fruit faster than traditional varieties. Most need 6-8 hours of sun and regular watering. Start with strawberries for quick results! Happy growing!";
    }
    
    // General vegetable questions
    if (messageLower.includes('vegetable') || messageLower.includes('veggie')) {
      return "Wonderful question about vegetables! I recommend starting with these easy, productive varieties: Leafy greens like lettuce and spinach (great for beginners), compact tomatoes like 'Patio' or 'Bush Early Girl', bush beans (no staking needed!), peppers like 'Mini Bell' or 'Lunchbox', and fast-growing radishes. These are perfect for small spaces and containers. Most need 6-8 hours of sun, well-draining soil, and regular watering. Start with lettuce for quick success! Happy growing!";
    }
    
    // Default fallback
    return "That's a fantastic question! I'm Sprouty, your container gardening expert! I specialize in edible vegetables and fruits perfect for small spaces. I can help you with dwarf tomatoes, compact peppers, leafy greens, strawberries, dwarf fruit trees, and hybrid varieties that grow fast in pots. What delicious plants would you like to grow together? Happy growing!";
  }

  // Method to get filtered response that only discusses edible vegetables and fruits
  async getFilteredResponse(message, conversationHistory = []) {
    try {
      const response = await this.generateResponse(message, conversationHistory);
      
      // Check if this is a short, generic response that should be replaced
      const shortGenericResponses = [
        "that's an exciting idea",
        "that's a great question", 
        "that's fantastic",
        "that's wonderful",
        "that's amazing",
        "oh, you're in for a treat",
        "that sounds great",
        "that's perfect",
        "absolutely, let's dive",
        "great question",
        "excellent question",
        "perfect question",
        "wonderful question",
        "fantastic question"
      ];
      
      const responseLower = response.toLowerCase();
      const isShortGeneric = shortGenericResponses.some(phrase => responseLower.includes(phrase));
      
      // Check if the response is about cooking, recipes, or unrelated topics
      const cookingKeywords = ['noodle', 'recipe', 'cook', 'baking', 'food preparation', 'dish', 'ingredient list', 'making', 'prepare food'];
      const isCookingRelated = cookingKeywords.some(keyword => responseLower.includes(keyword));
      
      if (isCookingRelated && !responseLower.includes('grow') && !responseLower.includes('plant') && !responseLower.includes('garden')) {
        return "I specialize in growing vegetables and fruits, not cooking! I can help you grow ingredients though. Would you like help growing tomatoes, peppers, or other vegetables for your recipes?";
      }
      
      // If it's a short generic response, try a refinement pass first
      if (isShortGeneric && response.length < 120) {
        const refined = await this.refineResponse(message, response, conversationHistory);
        if (refined) {
          const cleanedRefined = this.ensureProperEnding(this.cleanMarkdownFormatting(refined));
          if (cleanedRefined && cleanedRefined.length > 80) return cleanedRefined;
        }
        console.log('Refinement failed or still too short, using intelligent fallback');
        return this.generateIntelligentFallback(message);
      }
      
      // Also check if response is too short and doesn't contain specific plant information
      if (response.length < 100 && !responseLower.includes('tomato') && !responseLower.includes('lettuce') && 
          !responseLower.includes('pepper') && !responseLower.includes('strawberry') && !responseLower.includes('apple') &&
          !responseLower.includes('citrus') && !responseLower.includes('cherry') && !responseLower.includes('blueberry')) {
        // Try a refinement pass before falling back
        const refined = await this.refineResponse(message, response, conversationHistory);
        if (refined) {
          const cleanedRefined = this.ensureProperEnding(this.cleanMarkdownFormatting(refined));
          if (cleanedRefined && cleanedRefined.length > 100) return cleanedRefined;
        }
        console.log('Detected non-specific short response, using intelligent fallback');
        return this.generateIntelligentFallback(message);
      }
      
      // Validate the response
      if (!this.validateResponse(response)) {
        // If response is not appropriate, generate a redirecting response
        return "That's a great question! I'm Sprouty, and I specialize in helping you grow amazing edible vegetables and fruits in small spaces! I can help you with container-friendly plants like dwarf tomatoes, compact peppers, leafy greens, strawberries, and even dwarf fruit trees that grow perfectly in pots. I know all about hybrid varieties that grow fast and don't need much space. What delicious plants would you like to grow together?";
      }

      // Clean up any markdown formatting
      const cleanResponse = this.cleanMarkdownFormatting(response);
      
      // Ensure the response ends properly
      const finalResponse = this.ensureProperEnding(cleanResponse);
      
      return finalResponse;
    } catch (error) {
      console.error('Error getting filtered response:', error);
      
      // Generate intelligent fallback based on the user's question
      return this.generateIntelligentFallback(message);
    }
  }
}

module.exports = new MistralService();



