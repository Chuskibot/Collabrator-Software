'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
}

// Common emoji categories
const emojiCategories = [
  {
    name: 'Smileys',
    emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘']
  },
  {
    name: 'Gestures',
    emojis: ['👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '👋', '🤚', '🖐️', '✋']
  },
  {
    name: 'Reactions',
    emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️']
  },
  {
    name: 'Objects',
    emojis: ['🎉', '🎊', '🎈', '🎂', '🎁', '🎗️', '🎟️', '🎫', '🎖️', '🏆', '🥇', '🥈', '🥉', '⚽', '🏀', '🏈', '⚾']
  }
];

const EmojiPicker: React.FC<EmojiPickerProps> = ({ onEmojiSelect }) => {
  const [activeCategory, setActiveCategory] = useState(0);

  return (
    <motion.div 
      className="bg-white rounded-lg shadow-lg border overflow-hidden w-64"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.1 }}
    >
      {/* Category tabs */}
      <div className="flex border-b">
        {emojiCategories.map((category, index) => (
          <button
            key={category.name}
            className={`flex-1 py-2 text-xs font-medium ${
              activeCategory === index 
                ? 'text-blue-500 border-b-2 border-blue-500' 
                : 'text-gray-500 hover:bg-gray-50'
            }`}
            onClick={() => setActiveCategory(index)}
          >
            {category.name}
          </button>
        ))}
      </div>
      
      {/* Emoji grid */}
      <div className="p-2 h-48 overflow-y-auto">
        <div className="grid grid-cols-7 gap-1">
          {emojiCategories[activeCategory].emojis.map((emoji, index) => (
            <button
              key={index}
              className="h-8 w-8 flex items-center justify-center rounded hover:bg-gray-100 transition-colors"
              onClick={() => onEmojiSelect(emoji)}
            >
              <span className="text-lg">{emoji}</span>
            </button>
          ))}
        </div>
      </div>
      
      {/* Search and recently used */}
      <div className="border-t p-2">
        <div className="text-xs text-gray-500 mb-1">Recently Used</div>
        <div className="flex">
          {['👍', '❤️', '😊', '🎉', '🔥'].map((emoji, index) => (
            <button
              key={index}
              className="h-8 w-8 flex items-center justify-center rounded hover:bg-gray-100"
              onClick={() => onEmojiSelect(emoji)}
            >
              <span className="text-lg">{emoji}</span>
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default EmojiPicker; 