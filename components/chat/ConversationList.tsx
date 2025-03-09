'use client';

import React from 'react';
import { formatDistanceToNow } from '@/lib/utils';
import { Conversation, User } from './ChatSystem';
import { motion } from 'framer-motion';

interface ConversationListProps {
  conversations: Conversation[];
  activeConversationId: string | undefined;
  onSelectConversation: (conversation: Conversation) => void;
}

// Helper component for typing indicator
const TypingIndicator = () => (
  <div className="flex space-x-1 items-center">
    <motion.div
      className="bg-gray-400 h-1.5 w-1.5 rounded-full"
      animate={{ scale: [1, 1.3, 1] }}
      transition={{ duration: 1, repeat: Infinity, repeatType: "loop" }}
    />
    <motion.div
      className="bg-gray-400 h-1.5 w-1.5 rounded-full"
      animate={{ scale: [1, 1.3, 1] }}
      transition={{ duration: 1, repeat: Infinity, repeatType: "loop", delay: 0.2 }}
    />
    <motion.div
      className="bg-gray-400 h-1.5 w-1.5 rounded-full"
      animate={{ scale: [1, 1.3, 1] }}
      transition={{ duration: 1, repeat: Infinity, repeatType: "loop", delay: 0.4 }}
    />
  </div>
);

// Helper component for status indicator
const StatusIndicator = ({ isOnline, lastSeen }: { isOnline: boolean; lastSeen?: Date }) => (
  <div className="flex items-center">
    <div className={`h-2.5 w-2.5 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'} ${isOnline ? 'animate-pulse' : ''}`} />
    {!isOnline && lastSeen && (
      <span className="ml-1 text-xs text-gray-400">
        {formatDistanceToNow(lastSeen)}
      </span>
    )}
  </div>
);

const ConversationList = ({ conversations, activeConversationId, onSelectConversation }: ConversationListProps) => {
  // Function to get the other participant in a conversation (not the current user)
  const getOtherParticipant = (conversation: Conversation): User => {
    return conversation.participants.find(p => p.id !== 'current-user') || conversation.participants[0];
  };
  
  // Function to get a preview of the last message
  const getMessagePreview = (conversation: Conversation): string => {
    if (conversation.messages.length === 0) return 'No messages yet';
    
    const lastMessage = conversation.messages[0];
    
    if (lastMessage.isVoiceMessage) return '🎤 Voice message';
    if (lastMessage.attachments?.length) {
      const attachment = lastMessage.attachments[0];
      if (attachment.type === 'image') return '📷 Photo';
      if (attachment.type === 'file') return `📎 ${attachment.name}`;
      return '📎 Attachment';
    }
    
    return lastMessage.content.length > 30 
      ? `${lastMessage.content.substring(0, 30)}...` 
      : lastMessage.content;
  };

  return (
    <div className="w-1/3 border-r overflow-y-auto">
      <div className="divide-y">
        {conversations.map(conversation => {
          const otherParticipant = getOtherParticipant(conversation);
          const isActive = conversation.id === activeConversationId;
          
          return (
            <button
              key={conversation.id}
              className={`w-full text-left p-3 hover:bg-gray-50 transition-colors ${isActive ? 'bg-blue-50' : ''}`}
              onClick={() => onSelectConversation(conversation)}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img 
                    src={otherParticipant.avatar} 
                    alt={otherParticipant.name}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                  <div className="absolute -bottom-0.5 -right-0.5">
                    <StatusIndicator 
                      isOnline={otherParticipant.isOnline} 
                      lastSeen={otherParticipant.lastSeen}
                    />
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium text-sm truncate">{otherParticipant.name}</h3>
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(conversation.lastMessageTimestamp)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-gray-500 truncate">
                      {conversation.isTyping ? (
                        <span className="flex items-center text-blue-500">
                          <TypingIndicator />
                        </span>
                      ) : (
                        getMessagePreview(conversation)
                      )}
                    </p>
                    
                    {conversation.unreadCount > 0 && (
                      <span className="bg-blue-500 text-white text-xs rounded-full h-5 min-w-5 flex items-center justify-center px-1">
                        {conversation.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ConversationList; 