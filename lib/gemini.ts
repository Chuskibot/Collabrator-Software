import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

// Initialize the Gemini API with the key from environment variables
const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";

// Check if API key is available
if (!apiKey) {
  console.error("Gemini API key is missing! Set NEXT_PUBLIC_GEMINI_API_KEY in your .env.local file");
}

// Initialize the API client with the correct API version
const genAI = new GoogleGenerativeAI(apiKey);

// Try different model names - we'll try these in order until one works
const MODEL_NAMES = [
  "gemini-2.0-flash",      // Latest model from the curl example
  "gemini-2.0-pro",        // Possible pro version of 2.0
  "gemini-pro",            // Original model name
  "gemini-1.0-pro",        // Possible alternative name
  "gemini-1.5-pro",        // Newer model
  "gemini-1.5-flash",      // Alternative model
];

// Function to validate the API key format
const isValidApiKey = (key: string): boolean => {
  // Check if it's empty
  if (!key || key.trim() === '') {
    return false;
  }
  
  // Gemini API keys can be in two formats:
  // 1. Starting with "sk-or-v1-" (older format)
  // 2. Starting with "AIzaSy" (standard Google API key format)
  return /^sk-or-v1-[a-zA-Z0-9]{40,}$/.test(key) || /^AIzaSy[a-zA-Z0-9_-]{33}$/.test(key);
};

// Create a chat session
export async function createChatSession() {
  try {
    if (!isValidApiKey(apiKey)) {
      throw new Error("Invalid API key format. Gemini API keys should start with 'sk-or-v1-' or 'AIzaSy'");
    }
    
    // Try each model name until one works
    let chatSession = null;
    let lastError = null;
    let successfulModel = "";
    
    for (const modelName of MODEL_NAMES) {
      try {
        console.log(`Trying to create chat session with model: ${modelName}`);
        const currentModel = genAI.getGenerativeModel({ 
          model: modelName,
          safetySettings: [
            {
              category: HarmCategory.HARM_CATEGORY_HARASSMENT,
              threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            },
            {
              category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
              threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            },
            {
              category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
              threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            },
            {
              category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
              threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            },
          ],
        });
        
        chatSession = await currentModel.startChat({
          history: [
            {
              role: "user",
              parts: [{ text: "Hello, I'm using the collaborative document editor. Can you help me with my questions?" }],
            },
            {
              role: "model",
              parts: [{ text: "Hello! I'm your AI assistant for the collaborative document editor. I can help you with document editing, formatting, research, writing suggestions, and more. What would you like assistance with today?" }],
            },
          ],
          generationConfig: {
            maxOutputTokens: 1000,
            temperature: 0.7,
            topP: 0.95,
            topK: 40,
          },
        });
        
        console.log(`Successfully created chat session with model: ${modelName}`);
        successfulModel = modelName;
        break; // Exit the loop if successful
      } catch (error) {
        console.warn(`Failed to create chat session with model: ${modelName}`, error);
        lastError = error;
      }
    }
    
    if (!chatSession) {
      throw lastError || new Error("Failed to create chat session with any model");
    }
    
    // Store the successful model name for future use
    console.log(`Using model: ${successfulModel} for chat sessions`);
    
    return chatSession;
  } catch (error) {
    console.error("Error creating chat session:", error);
    throw error;
  }
}

// Send a message to the chat session and get a response
export async function sendMessageToGemini(chatSession: any, message: string) {
  try {
    if (!chatSession) {
      throw new Error("Chat session is not initialized");
    }
    
    if (!message || message.trim() === "") {
      throw new Error("Message cannot be empty");
    }
    
    const result = await chatSession.sendMessage(message);
    const response = result.response;
    return response.text();
  } catch (error: any) {
    console.error("Error sending message to Gemini:", error);
    
    // Return a more specific error message
    if (error.message && error.message.includes("API key")) {
      return "Error: Invalid API key. Please check your Gemini API key configuration.";
    }
    
    if (error.message && error.message.includes("quota")) {
      return "Error: API quota exceeded. Please try again later.";
    }
    
    if (error.message && error.message.includes("not found")) {
      return "Error: The specified model was not found. This might be due to using an outdated model name.";
    }
    
    return `Error: ${error.message || "An unknown error occurred. Please try again later."}`;
  }
}

// Generate a response directly without maintaining chat history
export async function generateGeminiResponse(prompt: string) {
  try {
    if (!isValidApiKey(apiKey)) {
      throw new Error("Invalid API key format");
    }
    
    // Try each model name until one works
    let response = null;
    let lastError = null;
    let successfulModel = "";
    
    for (const modelName of MODEL_NAMES) {
      try {
        console.log(`Trying to generate content with model: ${modelName}`);
        const currentModel = genAI.getGenerativeModel({ model: modelName });
        const result = await currentModel.generateContent(prompt);
        response = await result.response;
        console.log(`Successfully generated content with model: ${modelName}`);
        successfulModel = modelName;
        break; // Exit the loop if successful
      } catch (error) {
        console.warn(`Failed to generate content with model: ${modelName}`, error);
        lastError = error;
      }
    }
    
    if (!response) {
      throw lastError || new Error("Failed to generate content with any model");
    }
    
    // Store the successful model name for future use
    console.log(`Using model: ${successfulModel} for content generation`);
    
    return response.text();
  } catch (error: any) {
    console.error("Error generating content from Gemini:", error);
    
    // Return a more specific error message
    if (error.message && error.message.includes("API key")) {
      return "Error: Invalid API key. Please check your Gemini API key configuration.";
    }
    
    if (error.message && error.message.includes("quota")) {
      return "Error: API quota exceeded. Please try again later.";
    }
    
    if (error.message && error.message.includes("not found")) {
      return "Error: The specified model was not found. This might be due to using an outdated model name.";
    }
    
    return `Error: ${error.message || "An unknown error occurred. Please try again later."}`;
  }
} 