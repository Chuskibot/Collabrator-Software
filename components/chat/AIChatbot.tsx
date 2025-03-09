'use client';

import React, { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { createChatSession, sendMessageToGemini } from '@/lib/gemini';
import { 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  Loader2, 
  X, 
  Minimize2, 
  Maximize2, 
  Trash2,
  Copy,
  RefreshCw
} from 'lucide-react';

type Message = {
  id: string;
  role: 'user' | 'bot';
  content: string;
  timestamp: Date;
};

const AIChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatSession, setChatSession] = useState<any>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Initialize chat session
  useEffect(() => {
    const initChat = async () => {
      try {
        const session = await createChatSession();
        setChatSession(session);
        
        // Add initial welcome message
        setMessages([
          {
            id: Date.now().toString(),
            role: 'bot',
            content: "👋 Hello! I'm VU BOT, your AI assistant. I can help you with document editing, research, writing suggestions, and more. How can I assist you today?",
            timestamp: new Date()
          }
        ]);
      } catch (error) {
        console.error("Failed to initialize chat session:", error);
        
        // Display error message to user
        setMessages([
          {
            id: Date.now().toString(),
            role: 'bot',
            content: "There was an error connecting to the Gemini API. Please check your API key configuration in the .env.local file. Make sure it starts with 'AIzaSy'.",
            timestamp: new Date()
          },
          {
            id: (Date.now() + 1).toString(),
            role: 'bot',
            content: "You can get a Gemini API key from the Google AI Studio (https://aistudio.google.com/app/apikey).",
            timestamp: new Date()
          }
        ]);
      }
    };
    
    if (isOpen && !chatSession) {
      initChat();
    }
  }, [isOpen, chatSession]);
  
  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);
  
  const handleToggleChat = () => {
    setIsOpen(!isOpen);
    if (isMinimized) setIsMinimized(false);
  };
  
  const handleToggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };
  
  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    
    // Create new user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };
    
    // Add to messages list
    setMessages(prev => [...prev, userMessage]);
    
    // Clear input
    setInputMessage('');
    
    // Show loading state
    setIsLoading(true);
    
    try {
      // Check if chat session is valid
      if (!chatSession) {
        // Attempt to reinitialize chat session
        const session = await createChatSession();
        setChatSession(session);
        
        if (!session) {
          throw new Error("Failed to initialize chat session");
        }
      }
      
      // Send message to Gemini
      const botResponse = await sendMessageToGemini(chatSession, inputMessage);
      
      // Check if response is an error message
      const isErrorResponse = botResponse.startsWith("Error:");
      
      // Create new bot message
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        content: botResponse,
        timestamp: new Date()
      };
      
      // Add to messages list
      setMessages(prev => [...prev, botMessage]);
      
      // If there was an API key error, display a helpful message about setting up the API key
      if (isErrorResponse && botResponse.includes("API key")) {
        setTimeout(() => {
          setMessages(prev => [
            ...prev,
            {
              id: (Date.now() + 2).toString(),
              role: 'bot',
              content: "To set up your Gemini API key:\n\n1. Get a key from the Google AI Studio (https://aistudio.google.com/app/apikey)\n2. Add it to your .env.local file as NEXT_PUBLIC_GEMINI_API_KEY\n3. Make sure it starts with 'AIzaSy'\n4. Restart your development server",
              timestamp: new Date()
            }
          ]);
        }, 1000);
      }
    } catch (error) {
      console.error("Error in handleSendMessage:", error);
      
      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        content: "I'm having trouble connecting to the Gemini API. Please check your API key and internet connection.",
        timestamp: new Date()
      };
      
      // Add to messages list
      setMessages(prev => [...prev, errorMessage]);
      
      // Try to reset the chat session
      setTimeout(resetChat, 2000);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const clearMessages = () => {
    // Keep only the welcome message
    setMessages([
      {
        id: Date.now().toString(),
        role: 'bot',
        content: "👋 Hello! I'm VU BOT, your AI assistant. I can help you with document editing, research, writing suggestions, and more. How can I assist you today?",
        timestamp: new Date()
      }
    ]);
  };
  
  const resetChat = async () => {
    try {
      setIsLoading(true);
      
      // Create a new chat session
      const session = await createChatSession();
      setChatSession(session);
      
      // Reset messages
      clearMessages();
    } catch (error) {
      console.error("Failed to reset chat session:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const copyMessageToClipboard = (content: string) => {
    navigator.clipboard.writeText(content)
      .then(() => {
        // Maybe show a brief toast notification here
        console.log('Message copied to clipboard');
      })
      .catch(err => {
        console.error('Failed to copy message: ', err);
      });
  };
  
  const formatMessageContent = (content: string) => {
    // Handle code blocks
    let formattedContent = content.replace(
      /```([^`]*?)```/g, 
      '<pre class="bg-gray-800 text-gray-200 p-3 rounded-md my-2 overflow-x-auto"><code>$1</code></pre>'
    );
    
    // Handle inline code
    formattedContent = formattedContent.replace(
      /`(.+?)`/g,
      '<code class="bg-gray-800 text-gray-200 px-1 rounded-sm">$1</code>'
    );
    
    // Handle bullet points
    formattedContent = formattedContent.replace(
      /^- (.+)$/gm,
      '<li class="ml-4">$1</li>'
    );
    
    // Handle headings
    formattedContent = formattedContent.replace(
      /^### (.+)$/gm,
      '<h3 class="text-lg font-bold mt-2 mb-1">$1</h3>'
    );
    formattedContent = formattedContent.replace(
      /^## (.+)$/gm,
      '<h2 class="text-xl font-bold mt-3 mb-2">$1</h2>'
    );
    formattedContent = formattedContent.replace(
      /^# (.+)$/gm,
      '<h1 class="text-2xl font-bold mt-4 mb-3">$1</h1>'
    );
    
    // Handle links
    formattedContent = formattedContent.replace(
      /\[(.+?)\]\((.+?)\)/g,
      '<a href="$2" target="_blank" class="text-blue-500 underline">$1</a>'
    );
    
    // Handle paragraphs (add some spacing)
    formattedContent = formattedContent.replace(
      /\n\n/g,
      '</p><p class="mb-2">'
    );
    
    return '<p>' + formattedContent + '</p>';
  };
  
  return (
    <div className="ai-chatbot-container">
      {/* Chat toggle button */}
      <button 
        onClick={handleToggleChat}
        className="fixed bottom-6 left-6 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-r from-purple-600 to-blue-500 text-white shadow-lg hover:from-purple-700 hover:to-blue-600 transition-all duration-300"
        aria-label="Toggle AI Chatbot"
      >
        <Sparkles className="h-6 w-6" />
      </button>
      
      {/* Chat window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={isMinimized 
              ? { opacity: 1, y: 0, scale: 0.95, height: 'auto' }
              : { opacity: 1, y: 0, scale: 1, height: 'auto' }
            }
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`fixed bottom-24 left-6 z-50 w-[90vw] sm:w-[380px] md:w-[420px] lg:w-[450px] rounded-2xl overflow-hidden bg-white dark:bg-gray-800 shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col ${
              isMinimized ? 'h-14' : 'max-h-[80vh] h-[500px]'
            }`}
          >
            {/* Chat header */}
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-600 to-blue-500 text-white">
              <div className="flex items-center gap-2">
                <Bot size={20} />
                <h3 className="font-medium">VU BOT</h3>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={resetChat}
                  className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
                  aria-label="Reset chat"
                >
                  <RefreshCw size={16} />
                </button>
                <button 
                  onClick={clearMessages}
                  className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
                  aria-label="Clear messages"
                >
                  <Trash2 size={16} />
                </button>
                <button 
                  onClick={handleToggleMinimize}
                  className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
                  aria-label={isMinimized ? "Maximize" : "Minimize"}
                >
                  {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                </button>
                <button 
                  onClick={handleToggleChat}
                  className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
                  aria-label="Close"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            
            {/* Messages area - only visible when not minimized */}
            {!isMinimized && (
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} group`}
                    style={{ animation: 'message-fade-in 0.3s ease-out' }}
                  >
                    <div className={`flex gap-2 max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div 
                        className={`
                          flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center 
                          ${message.role === 'user' 
                            ? 'bg-blue-100 text-blue-500 dark:bg-blue-900 dark:text-blue-300' 
                            : 'bg-purple-100 text-purple-500 dark:bg-purple-900 dark:text-purple-300'
                          }
                        `}
                      >
                        {message.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                      </div>
                      <div className="max-w-full">
                        <div 
                          className={`
                            rounded-2xl px-4 py-3 shadow-sm relative group
                            ${message.role === 'user'
                              ? 'bg-blue-500 text-white rounded-tr-sm'
                              : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-sm'
                            }
                          `}
                        >
                          {/* Message content */}
                          {message.role === 'user' ? (
                            <p className="whitespace-pre-wrap break-words">{message.content}</p>
                          ) : (
                            <div 
                              className="whitespace-pre-wrap break-words prose-sm dark:prose-invert max-w-none"
                              dangerouslySetInnerHTML={{ __html: formatMessageContent(message.content) }}
                            />
                          )}
                          
                          {/* Copy button for bot messages */}
                          {message.role === 'bot' && (
                            <button 
                              onClick={() => copyMessageToClipboard(message.content)}
                              className="absolute top-2 right-2 p-1 rounded-full bg-gray-100 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity dark:bg-gray-700 dark:text-gray-300"
                              aria-label="Copy message"
                            >
                              <Copy size={14} />
                            </button>
                          )}
                        </div>
                        <div 
                          className={`
                            text-xs text-gray-400 mt-1 
                            ${message.role === 'user' ? 'text-right' : 'text-left'}
                          `}
                        >
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
                
                {/* Loading indicator */}
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className="flex gap-2 max-w-[80%]">
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-purple-100 text-purple-500 dark:bg-purple-900 dark:text-purple-300 flex items-center justify-center">
                        <Bot size={16} />
                      </div>
                      <div>
                        <div className="rounded-2xl px-4 py-3 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 shadow-sm rounded-tl-sm">
                          <div className="flex gap-1 items-center">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <p className="text-sm">Thinking...</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
                
                {/* Invisible element for scrolling to bottom */}
                <div ref={messagesEndRef} />
              </div>
            )}
            
            {/* Input area - only visible when not minimized */}
            {!isMinimized && (
              <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-full px-4 py-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Ask VU BOT anything..."
                    className="w-full bg-transparent border-none focus:outline-none text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400"
                    disabled={isLoading}
                  />
                  <button 
                    className={`
                      p-2 rounded-full transition-colors ml-2
                      ${inputMessage.trim() && !isLoading
                        ? 'bg-gradient-to-r from-purple-600 to-blue-500 text-white hover:from-purple-700 hover:to-blue-600'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-600'
                      }
                    `}
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || isLoading}
                  >
                    <Send size={18} />
                  </button>
                </div>
                <div className="text-xs text-center mt-2 text-gray-400">
                  Powered by Varendra University
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AIChatbot; 