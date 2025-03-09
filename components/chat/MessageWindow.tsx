'use client';

import React, { useState, useRef } from 'react';
import { formatDistanceToNow } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Paperclip, Mic, Send, Smile, Image as ImageIcon, FileText, AtSign, Bold, Italic, List, Link, Search } from 'lucide-react';
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
    <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-3 group`}>
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
            className={`relative rounded-2xl px-3 py-2 group ${
              isCurrentUser 
                ? 'bg-blue-500 text-white rounded-br-none' 
                : 'bg-gray-100 text-gray-800 rounded-bl-none'
            }`}
            onMouseEnter={() => setShowReactions(true)}
            onMouseLeave={() => setShowReactions(false)}
          >
            {/* Voice message */}
            {message.isVoiceMessage && (
              <div className="flex items-center gap-2 min-w-[150px]">
                <div className="flex-1 h-8 bg-opacity-20 bg-white rounded-full overflow-hidden">
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
            {!message.isVoiceMessage && (
              <p className="whitespace-pre-wrap break-words">{message.content}</p>
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
                
                {/* File attachment */}
                {attachment.type === 'file' && (
                  <div className={`flex items-center gap-2 p-2 rounded-lg ${
                    isCurrentUser ? 'bg-blue-600' : 'bg-gray-200'
                  }`}>
                    <FileText size={20} className={isCurrentUser ? 'text-white' : 'text-blue-500'} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${
                        isCurrentUser ? 'text-white' : 'text-gray-800'
                      }`}>
                        {attachment.name}
                      </p>
                      {attachment.size && (
                        <p className={`text-xs ${
                          isCurrentUser ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {formatFileSize(attachment.size)}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {/* Reactions */}
            {message.reactions && message.reactions.length > 0 && (
              <div className={`absolute ${isCurrentUser ? 'left-0' : 'right-0'} -bottom-3 flex -space-x-1`}>
                {message.reactions.map((reaction, index) => (
                  <div 
                    key={index}
                    className="bg-white rounded-full shadow-sm px-1.5 py-0.5 flex items-center gap-1 text-xs border"
                    onMouseEnter={() => setIsTooltipVisible(true)}
                    onMouseLeave={() => setIsTooltipVisible(false)}
                  >
                    <span>{reaction.emoji}</span>
                    <span className="text-gray-500">{reaction.users.length}</span>
                    
                    {/* Tooltip */}
                    {isTooltipVisible && (
                      <div className="absolute bottom-full mb-1.5 bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                        {reaction.users.map(user => user.name).join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {/* Reaction button */}
            {showReactions && (
              <div className={`absolute ${isCurrentUser ? 'left-0' : 'right-0'} -bottom-8 bg-white rounded-full shadow-md p-1`}>
                {['👍', '❤️', '😊', '😂', '👏'].map((emoji) => (
                  <button 
                    key={emoji}
                    className="hover:bg-gray-100 rounded-full w-7 h-7 flex items-center justify-center"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
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
  const otherParticipants = conversation.participants.filter(p => p.id !== currentUser.id);
  
  return (
    <div className="flex-grow flex flex-col bg-white">
      {/* Chat header */}
      <div className="p-3 border-b flex items-center justify-between">
        <div className="flex items-center">
          <div className="flex -space-x-2">
            {otherParticipants.slice(0, 3).map((participant) => (
              <img 
                key={participant.id}
                src={participant.avatar} 
                alt={participant.name}
                className="h-8 w-8 rounded-full border-2 border-white"
              />
            ))}
          </div>
          <div className="ml-2">
            <h3 className="font-medium text-sm">
              {otherParticipants.length > 0 
                ? otherParticipants.map(p => p.name).join(', ')
                : 'Team Chat'}
            </h3>
            <div className="flex items-center text-xs text-gray-500">
              {conversation.isTyping ? (
                <span className="text-blue-500">typing...</span>
              ) : (
                <>
                  {otherParticipants.some(p => p.isOnline) ? (
                    <>
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 mr-1"></span>
                      <span>Online</span>
                    </>
                  ) : (
                    <>
                      <span className="h-1.5 w-1.5 rounded-full bg-gray-300 mr-1"></span>
                      <span>Offline</span>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Messages area */}
      <div className="flex-grow p-3 overflow-y-auto flex flex-col-reverse">
        <div ref={messageEndRef} />
        {conversation.messages.map((message) => (
          <MessageBubble 
            key={message.id} 
            message={message} 
            currentUser={currentUser} 
          />
        ))}
      </div>
      
      {/* Input area */}
      <div className="border-t p-3">
        {/* Formatting toolbar */}
        <div className="flex items-center gap-1 mb-2">
          <button className="p-1 rounded hover:bg-gray-100">
            <Bold size={16} className="text-gray-500" />
          </button>
          <button className="p-1 rounded hover:bg-gray-100">
            <Italic size={16} className="text-gray-500" />
          </button>
          <button className="p-1 rounded hover:bg-gray-100">
            <List size={16} className="text-gray-500" />
          </button>
          <button className="p-1 rounded hover:bg-gray-100">
            <Link size={16} className="text-gray-500" />
          </button>
          <button className="p-1 rounded hover:bg-gray-100">
            <AtSign size={16} className="text-gray-500" />
          </button>
        </div>
        
        {/* Message input */}
        <div className="flex items-end gap-2">
          <div className="relative flex-grow">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={onKeyPress}
              placeholder={isRecording ? "Recording..." : "Type a message..."}
              disabled={isRecording}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none min-h-[40px] max-h-[120px]"
              rows={1}
            />
            
            {/* Emoji picker */}
            <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
              <button 
                onClick={() => setIsAttachmentDrawerOpen(!isAttachmentDrawerOpen)}
                className="text-gray-500 hover:text-gray-700"
              >
                <Paperclip size={18} />
              </button>
              <button 
                onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
                className="text-gray-500 hover:text-gray-700"
              >
                <Smile size={18} />
              </button>
            </div>
            
            {/* Emoji picker dropdown */}
            <AnimatePresence>
              {isEmojiPickerOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute bottom-full mb-2 right-0"
                >
                  <EmojiPicker onEmojiSelect={addEmoji} />
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Attachment drawer */}
            <AnimatePresence>
              {isAttachmentDrawerOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute bottom-full mb-2 left-0 bg-white rounded-lg shadow-lg p-2 flex gap-2"
                >
                  <button className="p-2 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200">
                    <ImageIcon size={20} />
                  </button>
                  <button className="p-2 rounded-full bg-green-100 text-green-600 hover:bg-green-200">
                    <FileText size={20} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Voice message button */}
          <button 
            onClick={toggleRecording}
            className={`rounded-full p-2 ${
              isRecording 
                ? 'bg-red-500 text-white animate-pulse' 
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            <Mic size={20} />
          </button>
          
          {/* Send button */}
          <button 
            onClick={onSendMessage}
            disabled={!newMessage.trim() && !isRecording}
            className={`rounded-full p-2 ${
              !newMessage.trim() && !isRecording
                ? 'bg-gray-100 text-gray-400'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessageWindow; 