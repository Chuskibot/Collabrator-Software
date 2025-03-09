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
import { formatDistanceToNow } from '@/lib/utils';

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
  const [newMessage, setNewMessage] = useState('');
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isAttachmentDrawerOpen, setIsAttachmentDrawerOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState<{sender: string; content: string} | null>(null);
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    sender: string;
    avatar: string;
    content: string;
    timestamp: Date;
    read: boolean;
  }>>([]);
  
  const messageEndRef = useRef<HTMLDivElement>(null);
  const notificationSoundRef = useRef<HTMLAudioElement | null>(null);
  const notificationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Initialize notification sound
  useEffect(() => {
    notificationSoundRef.current = new Audio('/assets/sounds/notification.mp3');
    
    // Clean up timeouts on unmount
    return () => {
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
    };
  }, []);
  
  // Get chat messages from Liveblocks storage
  const chatMessages = useStorage((root) => root.chatMessages);
  
  // Get other users in the room
  const others = useOthers();
  
  // Get current user
  const self = useSelf();
  
  // Set typing status
  const [{ isTyping }, updateMyPresence] = useMyPresence();
  
  // Broadcast typing events
  const broadcast = useBroadcastEvent();
  
  // Create a conversation from Liveblocks messages
  const createConversationFromMessages = useCallback(() => {
    if (!chatMessages) return null;
    
    // Create participants list from others and self
    const participants: User[] = others.map(other => ({
      id: other.id,
      name: other.info.name,
      avatar: other.info.avatar,
      isOnline: true,
    }));
    
    if (self?.info) {
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
      lastMessageTimestamp: messages.length > 0 ? messages[messages.length - 1].timestamp : new Date(),
    };
  }, [chatMessages, others, self]);
  
  // Update the active conversation when chat messages change
  useEffect(() => {
    const conversation = createConversationFromMessages();
    if (conversation) {
      // Check if there's a new message
      if (activeConversation && conversation.messages.length > activeConversation.messages.length) {
        const latestMessage = conversation.messages[0];
        
        // Show notification for all messages except our own
        if (latestMessage.sender.id !== self?.id) {
          // Show notification regardless of chat open state
          setNotificationMessage({
            sender: latestMessage.sender.name,
            content: latestMessage.content.length > 30 
              ? latestMessage.content.substring(0, 30) + '...' 
              : latestMessage.content
          });
          setShowNotification(true);
          
          // Play notification sound
          if (notificationSoundRef.current) {
            notificationSoundRef.current.play().catch(err => console.error("Error playing notification sound:", err));
          }
          
          // Vibrate for mobile devices (if supported)
          if (navigator.vibrate) {
            navigator.vibrate([100, 50, 100]);
          }
          
          // Hide notification after 5 seconds
          setTimeout(() => {
            setShowNotification(false);
          }, 5000);
          
          // Scroll to the latest message if chat is open
          if (isChatOpen && !isMinimized) {
            setTimeout(() => {
              messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
          }
        }
      }
      
      setActiveConversation(conversation);
    }
  }, [chatMessages, createConversationFromMessages, activeConversation, self, isChatOpen, isMinimized]);
  
  // Scroll to bottom of messages when opening chat or when minimized state changes
  useEffect(() => {
    if (isChatOpen && !isMinimized) {
      setTimeout(() => {
        messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    }
  }, [isChatOpen, isMinimized]);
  
  // Listen for typing events and new message notifications
  useEventListener(({ event }) => {
    if (event.type === "TYPING_START" || event.type === "TYPING_STOP") {
      // The typing status is already reflected in the others' presence
      // which will trigger a re-render and update the conversation
    } else if (event.type === "NEW_MESSAGE") {
      // If the chat is not open or minimized, show a notification
      const { sender, content } = event.data;
      
      // Only show notification for messages from others, not our own
      if (sender.id !== self?.id) {
        // Create unique ID for this notification
        const notificationId = nanoid();
        
        // Add to notifications array
        const newNotification = {
          id: notificationId,
          sender: sender.name,
          avatar: sender.avatar,
          content: content.length > 60 ? content.substring(0, 60) + '...' : content,
          timestamp: new Date(),
          read: false
        };
        
        // Add to notifications list
        setNotifications(prev => [newNotification, ...prev.slice(0, 9)]); // Keep last 10 notifications
        
        // Show toast notification
        setNotificationMessage({
          sender: sender.name,
          content: content.length > 60 ? content.substring(0, 60) + '...' : content
        });
        setShowNotification(true);
        
        // Play notification sound if chat is not focused
        if ((!isChatOpen || isMinimized) && notificationSoundRef.current) {
          notificationSoundRef.current.play().catch(err => console.error("Error playing notification sound:", err));
        }
        
        // Vibrate for mobile devices (if supported)
        if (navigator.vibrate) {
          navigator.vibrate([100, 50, 100]);
        }
        
        // Clear any existing timeout
        if (notificationTimeoutRef.current) {
          clearTimeout(notificationTimeoutRef.current);
        }
        
        // Hide notification after 5 seconds
        notificationTimeoutRef.current = setTimeout(() => {
          setShowNotification(false);
        }, 5000);
      }
    }
  });
  
  // Mark all notifications as read when opening chat
  useEffect(() => {
    if (isChatOpen && !isMinimized) {
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
    }
  }, [isChatOpen, isMinimized]);
  
  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
    if (isMinimized) setIsMinimized(false);
    
    // If opening the chat, ensure we scroll to the latest messages
    if (!isChatOpen) {
      setTimeout(() => {
        messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    }
  };
  
  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
    
    // If un-minimizing, ensure we scroll to the latest messages
    if (isMinimized) {
      setTimeout(() => {
        messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    }
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
    
    // Broadcast a notification to all users
    broadcast({
      type: "NEW_MESSAGE",
      data: {
        sender: {
          id: self.id,
          name: self.info.name,
          avatar: self.info.avatar
        },
        content
      }
    });
  }, [self, isRecording]);
  
  // Handle sending a message
  const handleSendMessage = () => {
    if (newMessage.trim() || isRecording) {
      addMessage(newMessage);
      setNewMessage('');
      setIsRecording(false);
      
      // Reset typing status
      updateMyPresence({ isTyping: false });
      broadcast({ type: "TYPING_STOP" });
      
      // Scroll to the latest message
      setTimeout(() => {
        messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };
  
  // Handle key press in the message input
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // Toggle recording state
  const toggleRecording = () => {
    setIsRecording(!isRecording);
  };
  
  // Add emoji to message
  const addEmoji = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    setIsEmojiPickerOpen(false);
  };
  
  // Create current user object
  const currentUser: User = {
    id: self?.id || 'current-user',
    name: self?.info?.name || 'You',
    avatar: self?.info?.avatar || '/assets/icons/user.svg',
    isOnline: true,
  };
  
  return (
    <div className="chat-system">
      {/* Notification */}
      <AnimatePresence>
        {showNotification && notificationMessage && (
          <motion.div 
            initial={{ opacity: 0, y: 50, x: 20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: 20, x: 0 }}
            transition={{ 
              type: "spring", 
              stiffness: 500, 
              damping: 30 
            }}
            className="fixed bottom-24 right-6 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-200 dark:border-gray-700 max-w-xs"
            onClick={() => {
              setShowNotification(false);
              setIsChatOpen(true);
              if (isMinimized) setIsMinimized(false);
              
              // Mark this notification as read
              setNotifications(prev => 
                prev.map(notification => 
                  notification.sender === notificationMessage.sender && 
                  notification.content === notificationMessage.content
                    ? { ...notification, read: true }
                    : notification
                )
              );
            }}
          >
            <div className="flex items-start gap-3">
              <div className="relative">
                <motion.div 
                  className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 overflow-hidden"
                  animate={{ 
                    boxShadow: ['0 0 0 0 rgba(59, 130, 246, 0.5)', '0 0 0 10px rgba(59, 130, 246, 0)'],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    repeatType: "loop"
                  }}
                >
                  {notificationMessage.sender.charAt(0).toUpperCase()}
                </motion.div>
                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white dark:border-gray-800"></span>
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">{notificationMessage.sender}</h4>
                  <span className="text-xs text-gray-500">just now</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{notificationMessage.content}</p>
              </div>
            </div>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-purple-500">
              <motion.div 
                className="h-full bg-gradient-to-r from-blue-500 to-purple-600"
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 5, ease: "linear" }}
              />
            </div>
            <div className="absolute bottom-1 right-3">
              <motion.span 
                className="text-xs text-blue-500 cursor-pointer font-medium"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Open Chat
              </motion.span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notifications Badge */}
      <div className="fixed bottom-24 right-6 z-40">
        <AnimatePresence>
          {notifications.some(n => !n.read) && !isChatOpen && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="bg-red-500 text-white rounded-full py-1 px-3 text-xs font-medium shadow-lg"
              onClick={() => {
                setIsChatOpen(true);
                if (isMinimized) setIsMinimized(false);
              }}
            >
              {notifications.filter(n => !n.read).length} new {notifications.filter(n => !n.read).length === 1 ? 'message' : 'messages'}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Chat toggle button */}
      <button 
        onClick={toggleChat}
        className="chat-toggle-button fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-blue-500 text-white shadow-lg hover:bg-blue-600 transition-all duration-300"
      >
        <MessageCircle size={24} />
        {notifications.some(n => !n.read) && (
          <motion.span 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 500,
              damping: 20
            }}
            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
          >
            {notifications.filter(n => !n.read).length}
          </motion.span>
        )}
      </button>
      
      {/* Notification Center */}
      <AnimatePresence>
        {isChatOpen && !isMinimized && notifications.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="fixed top-4 right-4 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 w-80"
            style={{ maxHeight: 'calc(100vh - 200px)' }}
          >
            <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="font-medium text-gray-900 dark:text-gray-100">Recent Notifications</h3>
              <button 
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                onClick={() => setNotifications([])}
              >
                Clear All
              </button>
            </div>
            <div className="overflow-y-auto p-2" style={{ maxHeight: 'calc(100vh - 250px)' }}>
              {notifications.length > 0 ? (
                notifications.map(notification => (
                  <div 
                    key={notification.id}
                    className={`p-3 mb-2 rounded-lg cursor-pointer transition-colors ${
                      notification.read 
                        ? 'bg-gray-50 dark:bg-gray-700' 
                        : 'bg-blue-50 dark:bg-blue-900/30'
                    }`}
                    onClick={() => {
                      // Mark as read
                      setNotifications(prev => 
                        prev.map(n => 
                          n.id === notification.id
                            ? { ...n, read: true }
                            : n
                        )
                      );
                    }}
                  >
                    <div className="flex items-start gap-2">
                      <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center text-blue-500 dark:text-blue-300">
                        {notification.sender.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{notification.sender}</p>
                          <p className="text-xs text-gray-500">
                            {formatDistanceToNow(notification.timestamp)} ago
                          </p>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                          {notification.content}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-gray-500">
                  No notifications
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat window */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={isMinimized 
              ? { opacity: 1, y: 0, scale: 0.95, height: 'auto' }
              : { opacity: 1, y: 0, scale: 1, height: 'auto' }
            }
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`chat-window fixed bottom-24 right-6 z-50 w-[380px] rounded-2xl overflow-hidden bg-white dark:bg-gray-800 shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col ${
              isMinimized ? 'h-14' : 'h-[500px]'
            }`}
          >
            {/* Chat header */}
            <div className="chat-header flex items-center justify-between p-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <MessageCircle size={20} className="text-blue-500 mr-2" />
                <h3 className="font-medium text-gray-800 dark:text-gray-200">Chat</h3>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setIsChatOpen(false)}
                  className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors"
                >
                  <Bell size={16} />
                </button>
                <button 
                  onClick={toggleMinimize}
                  className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors"
                >
                  {isMinimized ? <MessageCircle size={16} /> : <Minimize2 size={16} />}
                </button>
                <button 
                  onClick={() => setIsChatOpen(false)}
                  className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            
            {/* Chat content */}
            {!isMinimized && activeConversation && (
              <MessageWindow 
                conversation={activeConversation}
                currentUser={currentUser}
                onSendMessage={handleSendMessage}
                newMessage={newMessage}
                setNewMessage={(value) => {
                  setNewMessage(value);
                  // Update typing status based on the new value
                  if (value.trim() && !isTyping) {
                    updateMyPresence({ isTyping: true });
                    broadcast({ type: "TYPING_START" });
                  } else if (!value.trim() && isTyping) {
                    updateMyPresence({ isTyping: false });
                    broadcast({ type: "TYPING_STOP" });
                  }
                }}
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
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatSystem; 