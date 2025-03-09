import { cn, formatDistanceToNow } from '@/lib/utils';
import { useIsThreadActive } from '@liveblocks/react-lexical';
import { Composer, Thread } from '@liveblocks/react-ui';
import { useOthers, useThreads, useSelf, useStorage } from '@liveblocks/react/suspense';
import React, { useState, useEffect, useCallback, useMemo, FormEvent } from 'react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import { UserRound, MessageSquare, Zap, ChevronDown, ChevronUp, Image as ImageIcon, 
         Paperclip, Sun, Moon, Filter, Clock, CheckCircle, Search } from 'lucide-react';

// Type definitions
interface StatusIndicatorProps {
  isOnline: boolean;
  lastSeen?: Date;
}

interface ThreadData {
  id: string;
  comments: any[];
  resolved?: boolean;
  metadata?: {
    parentId?: string;
    timestamp?: string;
    [key: string]: any;
  };
}

interface ThreadWrapperProps {
  thread: ThreadData;
  level?: number;
  parentId?: string;
  isExpanded?: boolean;
}

interface CommentSummaryProps {
  thread: ThreadData;
}

interface ComposerSubmitComment {
  body: any;
}

type SortType = 'newest' | 'oldest' | 'mostReplies';

// Helper components
const StatusIndicator = ({ isOnline, lastSeen }: StatusIndicatorProps) => {
  return (
    <div className="flex items-center gap-1">
      <motion.div
        className={`h-2 w-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}
        animate={{ scale: isOnline ? [1, 1.2, 1] : 1 }}
        transition={{ repeat: isOnline ? Infinity : 0, duration: 2 }}
      />
      {!isOnline && lastSeen && (
        <span className="text-xs text-gray-400">
          {formatDistanceToNow(lastSeen)}
        </span>
      )}
    </div>
  );
};

const CommentSummary = ({ thread }: CommentSummaryProps) => {
  const [summary, setSummary] = useState<string>("");
  
  useEffect(() => {
    // In a real implementation, this would call an AI service
    // For this example, we'll just create a placeholder summary
    const firstComment = thread.comments[0]?.body?.content || "";
    setSummary(firstComment.length > 50 
      ? `${firstComment.substring(0, 50)}...` 
      : firstComment);
  }, [thread]);

  return (
    <div className="px-3 py-2 bg-blue-500/10 rounded-md mt-2 text-sm">
      <div className="flex gap-2 items-center mb-1">
        <Zap size={14} className="text-blue-400" />
        <span className="font-medium text-blue-400">AI Summary</span>
      </div>
      <p className="text-gray-300">{summary}</p>
    </div>
  );
};

// Main thread wrapper component
const ThreadWrapper = ({ thread, level = 0, parentId, isExpanded = true }: ThreadWrapperProps) => {
  const isActive = useIsThreadActive(thread.id);
  const [showSummary, setShowSummary] = useState(false);
  const [expanded, setExpanded] = useState(isExpanded);
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === 'dark';
  
  const childThreads = useThreads().threads.filter(t => 
    t.metadata && 'parentId' in t.metadata && t.metadata.parentId === thread.id
  );
  
  const gradientBorder = isActive 
    ? 'border-transparent bg-gradient-to-r from-blue-500 to-purple-500 p-[1px]' 
    : 'border border-dark-300 p-0';

  return (
    <div className={`relative ${level > 0 ? 'ml-6' : ''}`}>
      {/* Connector lines for nested comments */}
      {level > 0 && (
        <div className="absolute left-[-20px] top-0 h-full w-[1px] bg-gradient-to-b from-blue-500/50 to-purple-500/30" />
      )}
      {level > 0 && (
        <div className="absolute left-[-20px] top-[20px] h-[1px] w-[10px] bg-gradient-to-r from-blue-500/50 to-purple-500/30" />
      )}
      
      <div className={cn(
        'rounded-lg mb-4 overflow-hidden',
        gradientBorder,
        thread.resolved && 'opacity-60',
      )}>
        <div className="bg-dark-200 dark:bg-dark-300 rounded-[inherit]">
          {/* Thread header with controls - always visible */}
          <button 
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-between px-3 py-2 bg-dark-300/50 hover:bg-dark-300/80 transition-colors"
          >
            <div className="flex items-center gap-2">
              <MessageSquare size={16} className={expanded ? "text-blue-400" : "text-gray-400"} />
              <span className="text-sm font-medium">
                {thread.comments.length > 1 
                  ? `${thread.comments.length} replies` 
                  : '1 comment'}
              </span>
              
              {thread.resolved && (
                <span className="flex items-center text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                  <CheckCircle size={12} className="mr-1" />
                  Resolved
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {thread.comments.length > 1 && expanded && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowSummary(!showSummary);
                  }} 
                  className="text-xs text-gray-400 hover:text-blue-400 transition-colors"
                >
                  {showSummary ? 'Show all' : 'Show summary'}
                </button>
              )}
              <div className="text-gray-400">
                {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </div>
          </button>
          
          {/* Main thread content - collapsible */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {showSummary ? (
                  <CommentSummary thread={thread} />
                ) : (
    <Thread 
                    thread={thread as any}
      data-state={isActive ? 'active' : null}
                    className={cn('comment-thread border-0 text-white')}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      {/* Child threads/replies - also collapsed when parent is collapsed */}
      {childThreads.length > 0 && (
        <div className="child-threads">
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {childThreads.map((childThread) => (
                  <ThreadWrapper 
                    key={childThread.id} 
                    thread={childThread} 
                    level={level + 1}
                    parentId={thread.id}
                    isExpanded={false} // Child threads start collapsed by default
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

// Main Comments component
const Comments = () => {
  const { threads } = useThreads();
  const others = useOthers();
  const self = useSelf();
  const { resolvedTheme, setTheme } = useTheme();
  const isDarkMode = resolvedTheme === 'dark';
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortType>('newest');
  const [showActive, setShowActive] = useState(false);
  
  // Filter root-level threads (those without parents)
  const rootThreads = useMemo(() => {
    let filtered = threads.filter(thread => 
      !thread.metadata || !('parentId' in thread.metadata)
    );
    
    // Filter by resolved status if activeFilter is set
    if (activeFilter === 'resolved') {
      filtered = filtered.filter(thread => thread.resolved);
    } else if (activeFilter === 'unresolved') {
      filtered = filtered.filter(thread => !thread.resolved);
    }
    
    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(thread => {
        const content = thread.comments.map(c => c.body?.content || '').join(' ').toLowerCase();
        return content.includes(searchQuery.toLowerCase());
      });
    }
    
    // Sort the threads
    return filtered.sort((a, b) => {
      if (sortBy === 'oldest') {
        return new Date(a.comments[0]?.createdAt || 0).getTime() - 
               new Date(b.comments[0]?.createdAt || 0).getTime();
      } else if (sortBy === 'newest') {
        return new Date(b.comments[0]?.createdAt || 0).getTime() - 
               new Date(a.comments[0]?.createdAt || 0).getTime();
      } else if (sortBy === 'mostReplies') {
        return b.comments.length - a.comments.length;
      }
      return 0;
    });
  }, [threads, activeFilter, searchQuery, sortBy]);
  
  // Get active participants for avatar stack
  const activeParticipants = useMemo(() => {
    const participants = [...others];
    if (self) {
      // Add the current user to participants
      participants.push(self);
    }
    return participants;
  }, [others, self]);

  return (
    <div className="comments-container relative">
      {/* Theme toggle */}
      <div className="absolute top-[-40px] right-0 flex items-center gap-2">
        <button 
          onClick={() => setTheme(isDarkMode ? 'light' : 'dark')}
          className="flex items-center justify-center w-8 h-8 rounded-full bg-dark-300/50 hover:bg-dark-300 transition-colors"
        >
          {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
      
      {/* Comments header with tools */}
      <div className="w-full max-w-[800px] lg:w-[350px] mb-4">
        <h3 className="text-lg font-semibold mb-2">Comments</h3>
        
        {/* Search bar */}
        <div className="relative mb-3">
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search comments..."
            className="w-full bg-dark-300/50 border border-dark-300 rounded-md py-1.5 pl-8 pr-3 text-sm focus:outline-none focus:border-blue-500 transition-colors"
          />
          <Search size={14} className="absolute left-2.5 top-2 text-gray-400" />
        </div>
        
        {/* Filters and sort controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setActiveFilter(activeFilter === 'resolved' ? null : 'resolved')}
              className={`px-2 py-1 text-xs rounded flex items-center ${activeFilter === 'resolved' ? 'bg-green-500/20 text-green-400' : 'bg-dark-300 text-gray-400 hover:bg-dark-300/80'}`}
            >
              <CheckCircle size={12} className="mr-1" />
              Resolved
            </button>
            <button 
              onClick={() => setActiveFilter(activeFilter === 'unresolved' ? null : 'unresolved')}
              className={`px-2 py-1 text-xs rounded flex items-center ${activeFilter === 'unresolved' ? 'bg-blue-500/20 text-blue-400' : 'bg-dark-300 text-gray-400 hover:bg-dark-300/80'}`}
            >
              <MessageSquare size={12} className="mr-1" />
              Unresolved
            </button>
          </div>
          
          <div className="relative group">
            <button 
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-400 transition-colors"
            >
              <Filter size={12} />
              Sort: {sortBy === 'newest' ? 'Newest' : sortBy === 'oldest' ? 'Oldest' : 'Most Replies'}
            </button>
            <div className="absolute right-0 top-full mt-1 bg-dark-300 border border-dark-400 rounded-md shadow-lg p-1 z-10 hidden group-hover:block">
              <button 
                onClick={() => setSortBy('newest')}
                className={`block w-full text-left px-2 py-1 text-xs rounded ${sortBy === 'newest' ? 'bg-blue-500/20 text-blue-400' : 'text-gray-300 hover:bg-dark-400'}`}
              >
                Newest First
              </button>
              <button 
                onClick={() => setSortBy('oldest')}
                className={`block w-full text-left px-2 py-1 text-xs rounded ${sortBy === 'oldest' ? 'bg-blue-500/20 text-blue-400' : 'text-gray-300 hover:bg-dark-400'}`}
              >
                Oldest First
              </button>
              <button 
                onClick={() => setSortBy('mostReplies')}
                className={`block w-full text-left px-2 py-1 text-xs rounded ${sortBy === 'mostReplies' ? 'bg-blue-500/20 text-blue-400' : 'text-gray-300 hover:bg-dark-400'}`}
              >
                Most Replies
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Active participants avatar stack */}
      {activeParticipants.length > 0 && (
        <div className="mb-4 flex items-center w-full max-w-[800px] lg:w-[350px]">
          <div className="flex -space-x-2">
            {activeParticipants.slice(0, 5).map((participant) => (
              <div 
                key={participant.id} 
                className="relative rounded-full w-8 h-8 border-2 border-dark-200 overflow-hidden bg-dark-300 flex items-center justify-center"
                style={{ 
                  zIndex: participant.id === self?.id ? 10 : undefined,
                  borderColor: participant.id === self?.id ? '#3371FF' : undefined 
                }}
              >
                {participant.info?.avatar ? (
                  <img 
                    src={participant.info.avatar} 
                    alt={participant.info.name || 'User'} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserRound size={16} className="text-gray-400" />
                )}
                <div className="absolute bottom-0 right-0">
                  <StatusIndicator isOnline={true} />
                </div>
              </div>
            ))}
            {activeParticipants.length > 5 && (
              <div className="relative rounded-full w-8 h-8 border-2 border-dark-200 bg-dark-300 flex items-center justify-center">
                <span className="text-xs font-medium">+{activeParticipants.length - 5}</span>
              </div>
            )}
          </div>
          <span className="ml-3 text-sm text-gray-400">
            {activeParticipants.length} {activeParticipants.length === 1 ? 'person' : 'people'} viewing
          </span>
        </div>
      )}
      
      {/* Enhanced composer */}
      <div className="mb-6 overflow-hidden rounded-lg border-transparent bg-gradient-to-r from-blue-500 to-purple-500 p-[1px] w-full max-w-[800px] lg:w-[350px]">
        <div className="bg-dark-200 dark:bg-dark-300 rounded-[inherit] p-1">
          <Composer 
            className="comment-composer border-0 bg-transparent text-white" 
            onComposerSubmit={(composer, event) => {
              // Create a thread with the data from the composer
              // Note: This doesn't return anything, it just submits the thread
              console.log("Submitting thread with data:", composer.body);
            }}
          />
          <div className="flex items-center gap-2 px-3 py-2">
            <button className="text-gray-400 hover:text-blue-400 transition-colors">
              <ImageIcon size={16} />
            </button>
            <button className="text-gray-400 hover:text-blue-400 transition-colors">
              <Paperclip size={16} />
            </button>
            <span className="text-xs text-gray-500 ml-auto">Press Enter to send, Shift+Enter for new line</span>
          </div>
        </div>
      </div>
      
      {/* Comments count */}
      {rootThreads.length > 0 && (
        <div className="w-full max-w-[800px] lg:w-[350px] mb-2">
          <span className="text-sm text-gray-400">
            Showing {rootThreads.length} comments
            {activeFilter && ` (filtered by ${activeFilter})`}
            {searchQuery && ` matching "${searchQuery}"`}
          </span>
        </div>
      )}
      
      {/* Empty state */}
      {rootThreads.length === 0 && (
        <div className="w-full max-w-[800px] lg:w-[350px] flex flex-col items-center justify-center py-10 text-center">
          <MessageSquare size={40} className="text-gray-500 mb-2" />
          <h4 className="text-lg font-medium text-gray-300">No comments yet</h4>
          <p className="text-sm text-gray-400 mt-1">
            {searchQuery || activeFilter 
              ? 'No comments match your current filters. Try adjusting them.' 
              : 'Be the first to start the conversation!'}
          </p>
        </div>
      )}
      
      {/* Threads list */}
      <div className="w-full max-w-[800px] lg:w-[350px] space-y-4">
        {rootThreads.map((thread) => (
        <ThreadWrapper key={thread.id} thread={thread} />
      ))}
      </div>
    </div>
  );
};

export default Comments;