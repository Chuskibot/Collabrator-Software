'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MessageCircle, Bell, BellOff, Minimize2, X, Search, Paperclip, Mic, Send, Smile, Image as ImageIcon, FileText, AtSign, Bold, Italic, List, Link, MessageSquare } from 'lucide-react';
import MessageWindow from './MessageWindow';
import { cn } from '@/lib/utils';
import { nanoid } from 'nanoid';
import { 
  useMyPresence, 
  useOthers, 
  useSelf, 
  useStorage, 
  useMutation, 
  useEventListener, 
  useBroadcastEvent 
} from '@liveblocks/react/suspense';
import { ChatMessage } from '@/liveblocks.config';

// Types
export interface User {
  id: string;
  name: string;
  avatar: string;
  isOnline: boolean;
  lastSeen?: Date;
}

export interface Message {
  id: string;
  sender: User;
  content: string;
  timestamp: Date;
  isRead: boolean;
  reactions?: {
    emoji: string;
    users: User[];
  }[];
  attachments?: {
    type: 'image' | 'video' | 'file';
    url: string;
    name: string;
    size?: number;
    previewUrl?: string;
  }[];
  isVoiceMessage?: boolean;
  voiceUrl?: string;
  duration?: number;
  mentions?: {
    userId: string;
    startIndex: number;
    endIndex: number;
  }[];
}

export interface Conversation {
  id: string;
  participants: User[];
  messages: Message[];
  unreadCount: number;
  isTyping: boolean;
  lastMessageTimestamp: Date;
}

const ChatSystem = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isAttachmentDrawerOpen, setIsAttachmentDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const messageEndRef = useRef<HTMLDivElement>(null);
  
  // Liveblocks hooks
  const [myPresence, updateMyPresence] = useMyPresence();
  const others = useOthers();
  const self = useSelf();
  const broadcast = useBroadcastEvent();
  
  // Get chat messages from Liveblocks storage
  const chatMessages = useStorage((root) => root.chatMessages || []);
  
  // Create a conversation from the chat messages
  const createConversationFromMessages = useCallback(() => {
    if (!chatMessages || !self) return null;
    
    // Convert Liveblocks users to our User type
    const participants: User[] = others.map(other => ({
      id: other.id,
      name: other.info?.name || 'Unknown User',
      avatar: other.info?.avatar || '/assets/icons/user.svg',
      isOnline: true,
    }));
    
    // Add current user to participants
    if (self.info) {
      participants.push({
        id: self.id,
        name: self.info.name,
        avatar: self.info.avatar,
        isOnline: true,
      });
    }
    
    // Convert Liveblocks messages to our Message type
    const messages: Message[] = chatMessages.map(msg => ({
      id: msg.id,
      sender: {
        id: msg.sender.id,
        name: msg.sender.name,
        avatar: msg.sender.avatar,
        isOnline: others.some(other => other.id === msg.sender.id) || (self && self.id === msg.sender.id),
      },
      content: msg.content,
      timestamp: new Date(msg.timestamp),
      isRead: true,
      reactions: msg.reactions?.map(reaction => ({
        emoji: reaction.emoji,
        users: reaction.users.map(userId => {
          const user = others.find(other => other.id === userId);
          return {
            id: userId,
            name: user?.info?.name || 'Unknown User',
            avatar: user?.info?.avatar || '/assets/icons/user.svg',
            isOnline: !!user,
          };
        }),
      })),
      attachments: msg.attachments,
    }));
    
    // Check if any other user is typing
    const isTyping = others.some(other => other.presence?.isTyping);
    
    // Create the conversation
    return {
      id: 'room-conversation',
      participants,
      messages,
      unreadCount: 0,
      isTyping,
      lastMessageTimestamp: messages.length > 0 ? messages[0].timestamp : new Date(),
    };
  }, [chatMessages, others, self]);
  
  // Update the active conversation when chat messages change
  useEffect(() => {
    const conversation = createConversationFromMessages();
    if (conversation) {
      setActiveConversation(conversation);
    }
  }, [chatMessages, createConversationFromMessages]);
  
  // Listen for typing events
  useEventListener(({ event }) => {
    if (event.type === "TYPING_START" || event.type === "TYPING_STOP") {
      // The typing status is already reflected in the others' presence
      // which will trigger a re-render and update the conversation
    }
  });
  
  // Scroll to bottom of messages when changing conversations or new messages arrive
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation]);
  
  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
    if (isMinimized) setIsMinimized(false);
  };
  
  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };
  
  // Add a new message to the chat
  const addMessage = useMutation(({ storage }, content) => {
    if (!self?.info) return;
    
    const newMessage: ChatMessage = {
      id: nanoid(),
      sender: {
        id: self.id,
        name: self.info.name,
        avatar: self.info.avatar,
        color: self.info.color,
      },
      content,
      timestamp: Date.now(),
      ...(isRecording ? {
        isVoiceMessage: true,
        voiceUrl: '#',
        duration: Math.floor(Math.random() * 30) + 5, // 5-35 seconds
      } : {}),
    };
    
    // Add the message to storage
    storage.get('chatMessages').push(newMessage);
    
    // Reset typing status
    updateMyPresence({ isTyping: false });
  }, [self, isRecording]);
  
  const handleSendMessage = () => {
    if (!newMessage.trim() && !isRecording) return;
    
    const content = isRecording ? '[Voice Message]' : newMessage;
    
    // Add the message to Liveblocks storage
    addMessage(content);
    
    // Clear the input
    setNewMessage('');
    setIsRecording(false);
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // Handle typing status
  const handleTyping = useCallback((value: string) => {
    setNewMessage(value);
    
    // Update typing status
    const isTyping = value.length > 0;
    if (isTyping !== myPresence.isTyping) {
      updateMyPresence({ isTyping });
      broadcast({ type: isTyping ? "TYPING_START" : "TYPING_STOP" });
    }
  }, [myPresence.isTyping, updateMyPresence, broadcast]);
  
  const toggleNotifications = () => {
    setNotificationsEnabled(!notificationsEnabled);
  };
  
  const addEmoji = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    setIsEmojiPickerOpen(false);
  };
  
  const toggleRecording = () => {
    setIsRecording(!isRecording);
  };
  
  // Filter conversations based on search query
  const filteredConversations = activeConversation && searchQuery
    ? searchQuery.toLowerCase() !== ''
      ? {
          ...activeConversation,
          messages: activeConversation.messages.filter(msg => 
            msg.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
            msg.sender.name.toLowerCase().includes(searchQuery.toLowerCase())
          )
        }
      : activeConversation
    : activeConversation;
  
  // Check if there are unread messages
  const hasUnreadMessages = activeConversation?.unreadCount && activeConversation.unreadCount > 0;

  return (
    <>
      {/* Chat bubble button - always visible */}
      <button 
        onClick={toggleChat}
        className="fixed bottom-6 right-6 size-14 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 shadow-lg flex items-center justify-center text-white z-50 hover:shadow-xl transition-all duration-300"
      >
        <MessageCircle size={24} />
        {!isChatOpen && hasUnreadMessages && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full size-5 flex items-center justify-center animate-pulse">
            {activeConversation?.unreadCount}
          </span>
        )}
      </button>

      {/* Main chat window */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={isMinimized 
              ? { opacity: 1, y: 0, scale: 0.95, height: '60px' }
              : { opacity: 1, y: 0, scale: 1, height: 'auto' }
            }
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "fixed bottom-24 right-6 w-96 rounded-2xl bg-white shadow-2xl z-40 flex flex-col overflow-hidden",
              isMinimized ? "max-h-[60px]" : "max-h-[600px]"
            )}
          >
            {/* Chat header */}
            <div className="h-15 bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <MessageCircle size={20} className="text-white" />
                <h3 className="text-white font-semibold">Team Chat</h3>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={toggleNotifications} className="text-white hover:bg-white/10 rounded-full p-1.5 transition-colors">
                  {notificationsEnabled ? <Bell size={16} /> : <BellOff size={16} />}
                </button>
                <button onClick={toggleMinimize} className="text-white hover:bg-white/10 rounded-full p-1.5 transition-colors">
                  <Minimize2 size={16} />
                </button>
                <button onClick={toggleChat} className="text-white hover:bg-white/10 rounded-full p-1.5 transition-colors">
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Chat content area - hidden when minimized */}
            <AnimatePresence>
              {!isMinimized && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col h-[calc(600px-60px)]"
                >
                  {/* Search bar */}
                  <div className="p-3 border-b">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search messages..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full py-2 pl-8 pr-4 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <Search size={16} className="absolute left-2.5 top-2.5 text-gray-500" />
                    </div>
                  </div>

                  {/* Main content area */}
                  <div className="flex h-[430px]">
                    {/* Message window - full width */}
                    {activeConversation ? (
                      <MessageWindow
                        conversation={filteredConversations || activeConversation}
                        currentUser={self?.info ? {
                          id: self.id,
                          name: self.info.name,
                          avatar: self.info.avatar,
                          isOnline: true,
                        } : {
                          id: 'current-user',
                          name: 'You',
                          avatar: '/assets/icons/user.svg',
                          isOnline: true,
                        }}
                        onSendMessage={handleSendMessage}
                        newMessage={newMessage}
                        setNewMessage={handleTyping}
                        isEmojiPickerOpen={isEmojiPickerOpen}
                        setIsEmojiPickerOpen={setIsEmojiPickerOpen}
                        isAttachmentDrawerOpen={isAttachmentDrawerOpen}
                        setIsAttachmentDrawerOpen={setIsAttachmentDrawerOpen}
                        onKeyPress={handleKeyPress}
                        isRecording={isRecording}
                        toggleRecording={toggleRecording}
                        addEmoji={addEmoji}
                        messageEndRef={messageEndRef}
                      />
                    ) : (
                      <div className="flex-grow flex items-center justify-center p-4 bg-gray-50">
                        <p className="text-gray-500 text-center">Loading chat...</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatSystem; 