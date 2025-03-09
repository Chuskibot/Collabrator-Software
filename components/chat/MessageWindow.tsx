'use client';

import React, { useState, useRef, useEffect } from 'react';
import { formatDistanceToNow } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Paperclip, Mic, Send, Smile, Image as ImageIcon, FileText, AtSign, Bold, Italic, List, Link, Search, ChevronUp, ChevronDown, MoreVertical, ChevronLeft, ChevronRight } from 'lucide-react';
import { Conversation, Message, User } from './ChatSystem';
import EmojiPicker from './EmojiPicker';

interface MessageWindowProps {
  conversation: Conversation;
  currentUser: User;
  onSendMessage: () => void;
  newMessage: string;
  setNewMessage: (message: string) => void;
  isEmojiPickerOpen: boolean;
  setIsEmojiPickerOpen: (isOpen: boolean) => void;
  isAttachmentDrawerOpen: boolean;
  setIsAttachmentDrawerOpen: (isOpen: boolean) => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  isRecording: boolean;
  toggleRecording: () => void;
  addEmoji: (emoji: string) => void;
  messageEndRef: React.RefObject<HTMLDivElement>;
}

const MessageBubble = ({ message, currentUser }: { message: Message; currentUser: User }) => {
  const [showReactions, setShowReactions] = useState(false);
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const isCurrentUser = message.sender.id === currentUser.id;
  
  // Format file size
  const formatFileSize = (sizeInBytes: number | undefined) => {
    if (!sizeInBytes) return '';
    if (sizeInBytes < 1024) return `${sizeInBytes} B`;
    if (sizeInBytes < 1024 * 1024) return `${(sizeInBytes / 1024).toFixed(1)} KB`;
    return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
  };
  
  return (
    <div className={`flex w-full mb-4 group ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
      {/* Avatar for non-current user - always on the left */}
      {!isCurrentUser && (
        <div className="flex-shrink-0 mr-2">
          <img 
            src={message.sender.avatar} 
            alt={message.sender.name}
            className="h-8 w-8 rounded-full border-2 border-white shadow-sm"
          />
        </div>
      )}
      
      <div className="flex flex-col max-w-[75%]">
        {/* Sender name for non-current user */}
        {!isCurrentUser && (
          <span className="text-xs text-gray-500 mb-1 ml-1">{message.sender.name}</span>
        )}
        
        <div 
          className={`relative rounded-2xl px-4 py-3 group shadow-sm hover:shadow-md transition-shadow duration-200 ${
            isCurrentUser 
              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-sm' 
              : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-sm border border-gray-100 dark:border-gray-700'
          }`}
          onMouseEnter={() => setShowReactions(true)}
          onMouseLeave={() => setShowReactions(false)}
        >
          {/* Voice message */}
          {message.isVoiceMessage && (
            <div className="flex items-center gap-2 min-w-[150px]">
              <div className="flex-1 h-10 bg-opacity-20 bg-white rounded-full overflow-hidden">
                <div className="h-full w-full bg-opacity-20 bg-white flex items-center justify-center">
                  <div className="flex space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <motion.div
                        key={i}
                        className={`h-${1 + i} w-1 ${isCurrentUser ? 'bg-white' : 'bg-blue-500'}`}
                        animate={{
                          height: [4 + i * 2, 12 + i * 2, 4 + i * 2],
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          delay: i * 0.2,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <span className="text-sm">{message.duration}s</span>
            </div>
          )}
          
          {/* Regular text message */}
          {!message.isVoiceMessage && message.content && (
            <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">{message.content}</p>
          )}
          
          {/* Image attachment */}
          {message.attachments?.map((attachment, index) => (
            <div key={index} className="mt-2">
              {attachment.type === 'image' && (
                <img 
                  src={attachment.previewUrl || attachment.url} 
                  alt={attachment.name}
                  className="rounded-lg max-h-48 w-auto object-cover"
                />
              )}
              
              {/* Video attachment */}
              {attachment.type === 'video' && (
                <video 
                  src={attachment.url}
                  controls
                  className="rounded-lg max-h-48 w-auto"
                />
              )}
              
              {/* File attachment */}
              {attachment.type === 'file' && (
                <div className={`flex items-center gap-2 p-2 rounded-lg ${
                  isCurrentUser ? 'bg-blue-600' : 'bg-gray-100 dark:bg-gray-700'
                }`}>
                  <FileText size={20} />
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-medium truncate">{attachment.name}</p>
                    {attachment.size && (
                      <p className="text-xs opacity-70">{formatFileSize(attachment.size)}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {/* Reactions */}
          {message.reactions && message.reactions.length > 0 && (
            <div className={`absolute ${isCurrentUser ? 'left-0 -translate-x-[80%]' : 'right-0 translate-x-[80%]'} bottom-0 flex -mb-1`}>
              {message.reactions.map((reaction, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-center bg-white dark:bg-gray-800 rounded-full shadow-md p-1 border border-gray-100 dark:border-gray-700"
                >
                  <span className="text-sm">{reaction.emoji}</span>
                  <span className="text-xs ml-1 text-gray-500">{reaction.users.length}</span>
                </div>
              ))}
            </div>
          )}
          
          {/* Reaction picker */}
          {showReactions && (
            <div className={`absolute ${isCurrentUser ? 'right-0 -translate-y-full -mt-2' : 'left-0 -translate-y-full -mt-2'} top-0 bg-white dark:bg-gray-800 rounded-full shadow-lg p-1 border border-gray-100 dark:border-gray-700 flex opacity-0 group-hover:opacity-100 transition-opacity duration-200`}>
              {['❤️', '👍', '😂', '😮', '😢', '🔥'].map((emoji) => (
                <button 
                  key={emoji}
                  className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                  onClick={() => {
                    // Add reaction logic here
                    console.log(`Added reaction ${emoji} to message ${message.id}`);
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Message timestamp */}
        <div className={`text-xs text-gray-400 mt-1 ${isCurrentUser ? 'text-right mr-1' : 'text-left ml-1'}`}>
          {formatDistanceToNow(message.timestamp)} ago
          {isCurrentUser && (
            <span className="ml-1 inline-flex items-center">
              <Check size={12} className="text-blue-500" />
            </span>
          )}
        </div>
      </div>
      
      {/* Avatar for current user - always on the right */}
      {isCurrentUser && (
        <div className="flex-shrink-0 ml-2">
          <img 
            src={message.sender.avatar} 
            alt={message.sender.name}
            className="h-8 w-8 rounded-full border-2 border-white shadow-sm"
          />
        </div>
      )}
    </div>
  );
};

const MessageWindow = ({
  conversation,
  currentUser,
  onSendMessage,
  newMessage,
  setNewMessage,
  isEmojiPickerOpen,
  setIsEmojiPickerOpen,
  isAttachmentDrawerOpen,
  setIsAttachmentDrawerOpen,
  onKeyPress,
  isRecording,
  toggleRecording,
  addEmoji,
  messageEndRef,
}: MessageWindowProps) => {
  // Pagination state
  const MESSAGES_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  // Calculate total pages
  const totalMessages = conversation.messages.length;
  const totalPages = Math.ceil(totalMessages / MESSAGES_PER_PAGE);
  
  // Get current messages
  const indexOfLastMessage = Math.min(currentPage * MESSAGES_PER_PAGE, totalMessages);
  const indexOfFirstMessage = Math.max(0, indexOfLastMessage - MESSAGES_PER_PAGE);
  const currentMessages = conversation.messages.slice(indexOfFirstMessage, indexOfLastMessage);
  
  // Handle page changes
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  const goToFirstPage = () => {
    setCurrentPage(1);
  };
  
  const goToLastPage = () => {
    setCurrentPage(totalPages);
  };
  
  // Always show latest messages when a new message arrives
  useEffect(() => {
    setCurrentPage(totalPages);
  }, [totalMessages, totalPages]);
  
  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <div className="flex -space-x-2 mr-3">
            {conversation.participants.slice(0, 3).map((participant) => (
              <img 
                key={participant.id}
                src={participant.avatar}
                alt={participant.name}
                className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800"
              />
            ))}
          </div>
          <div>
            <h3 className="font-medium text-gray-800 dark:text-gray-200">
              {conversation.participants.length > 2 
                ? `${conversation.participants.length} participants` 
                : conversation.participants.find(p => p.id !== currentUser.id)?.name || 'Chat'}
            </h3>
            {conversation.isTyping && (
              <p className="text-xs text-gray-500 flex items-center">
                <span className="mr-1">typing</span>
                <span className="flex space-x-1">
                  <motion.div
                    className="bg-gray-400 h-1 w-1 rounded-full"
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                  <motion.div
                    className="bg-gray-400 h-1 w-1 rounded-full"
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                  />
                  <motion.div
                    className="bg-gray-400 h-1 w-1 rounded-full"
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                  />
                </span>
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            {totalMessages > 0 ? 
              `Showing ${indexOfFirstMessage + 1}-${indexOfLastMessage} of ${totalMessages}` : 
              'No messages'}
          </span>
        </div>
      </div>
      
      {/* Messages container with pagination */}
      <div className="relative flex-1 flex flex-col">
        <div 
          ref={messagesContainerRef}
          className="flex-1 p-4 space-y-4 bg-gray-50 dark:bg-gray-900 overflow-y-auto"
        >
          {currentMessages.length > 0 ? (
            currentMessages.map((message) => (
              <MessageBubble 
                key={message.id} 
                message={message} 
                currentUser={currentUser} 
              />
            ))
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">No messages in this conversation yet.</p>
            </div>
          )}
          <div ref={messageEndRef} />
        </div>
        
        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center p-2 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="flex items-center space-x-1">
              <button
                onClick={goToFirstPage}
                disabled={currentPage === 1}
                className={`p-2 rounded-full ${
                  currentPage === 1 
                    ? 'text-gray-400 cursor-not-allowed' 
                    : 'text-blue-500 hover:bg-blue-100 dark:hover:bg-gray-700'
                }`}
                aria-label="First page"
              >
                <ChevronLeft size={16} className="inline" />
                <ChevronLeft size={16} className="inline -ml-1" />
              </button>
              <button
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                className={`p-2 rounded-full ${
                  currentPage === 1 
                    ? 'text-gray-400 cursor-not-allowed' 
                    : 'text-blue-500 hover:bg-blue-100 dark:hover:bg-gray-700'
                }`}
                aria-label="Previous page"
              >
                <ChevronLeft size={16} />
              </button>
              
              <span className="px-2 text-sm">
                Page {currentPage} of {totalPages}
              </span>
              
              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className={`p-2 rounded-full ${
                  currentPage === totalPages 
                    ? 'text-gray-400 cursor-not-allowed' 
                    : 'text-blue-500 hover:bg-blue-100 dark:hover:bg-gray-700'
                }`}
                aria-label="Next page"
              >
                <ChevronRight size={16} />
              </button>
              <button
                onClick={goToLastPage}
                disabled={currentPage === totalPages}
                className={`p-2 rounded-full ${
                  currentPage === totalPages 
                    ? 'text-gray-400 cursor-not-allowed' 
                    : 'text-blue-500 hover:bg-blue-100 dark:hover:bg-gray-700'
                }`}
                aria-label="Last page"
              >
                <ChevronRight size={16} className="inline" />
                <ChevronRight size={16} className="inline -ml-1" />
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Message input */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-3 bg-white dark:bg-gray-800">
        <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-full px-4 py-2">
          <button 
            className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors mr-2"
            onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
          >
            <Smile size={20} className="text-gray-500 dark:text-gray-400" />
          </button>
          
          <div className="relative flex-1">
            {isEmojiPickerOpen && (
              <div className="absolute bottom-full mb-2 left-0">
                <EmojiPicker onEmojiSelect={addEmoji} />
              </div>
            )}
            
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={onKeyPress}
              placeholder="Type a message..."
              className="w-full bg-transparent border-none focus:outline-none text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>
          
          <div className="flex items-center">
            <button 
              className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors mr-2"
              onClick={() => setIsAttachmentDrawerOpen(!isAttachmentDrawerOpen)}
            >
              <Paperclip size={20} className="text-gray-500 dark:text-gray-400" />
            </button>
            
            <button 
              className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors mr-2"
              onClick={toggleRecording}
            >
              <Mic size={20} className={`${isRecording ? 'text-red-500 animate-pulse' : 'text-gray-500 dark:text-gray-400'}`} />
            </button>
            
            <button 
              className="p-2 rounded-full bg-blue-500 hover:bg-blue-600 transition-colors text-white"
              onClick={() => {
                onSendMessage();
                // Go to the last page to see newly sent message
                setTimeout(() => {
                  setCurrentPage(totalPages + 1);
                }, 100);
              }}
              disabled={!newMessage.trim() && !isRecording}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageWindow; 