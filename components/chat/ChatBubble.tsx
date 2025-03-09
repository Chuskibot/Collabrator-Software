'use client';

import React from 'react';
import { formatDistanceToNow } from '@/lib/utils';
import { Check } from 'lucide-react';
import { Message, User } from './ChatSystem';

interface ChatBubbleProps {
  message: Message;
  currentUser: User;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message, currentUser }) => {
  const isCurrentUser = message.sender.id === currentUser.id;
  
  return (
    <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div className="flex flex-col max-w-[75%]">
        <div className="flex items-end gap-2">
          {!isCurrentUser && (
            <img 
              src={message.sender.avatar} 
              alt={message.sender.name}
              className="h-6 w-6 rounded-full"
            />
          )}
          
          <div 
            className={`relative rounded-2xl px-3 py-2 ${
              isCurrentUser 
                ? 'bg-blue-500 text-white rounded-br-none' 
                : 'bg-gray-100 text-gray-800 rounded-bl-none'
            }`}
          >
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          </div>
          
          {isCurrentUser && (
            <img 
              src={message.sender.avatar} 
              alt={message.sender.name}
              className="h-6 w-6 rounded-full"
            />
          )}
        </div>
        
        {/* Message timestamp */}
        <div className={`text-xs text-gray-500 mt-1 ${isCurrentUser ? 'text-right' : 'text-left'}`}>
          {formatDistanceToNow(message.timestamp)} ago
          {isCurrentUser && (
            <span className="ml-1 inline-flex items-center">
              <Check size={12} className="text-blue-500" />
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatBubble; 