import { useState, useEffect, useCallback, useRef } from 'react';
import { socketService } from '../services/socketService';
import { fetchJson, handleApiError, fetchWithLogging } from '../utils/apiHelpers';

// Get API URL from environment or use default
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

/**
 * Hook for managing messages in a channel with real-time updates
 * @param {string} channelId - ID of the channel
 * @param {string} userId - ID of the current user
 * @param {string} userName - Name of the current user
 * @returns {Object} Message management state and functions
 */
export function useChannelMessages(channelId, userId, userName) {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [typingUsers, setTypingUsers] = useState(new Set());
  
  const limit = 50;
  const typingTimeoutRef = useRef({});
  // Track if initial load has been triggered for this channel to prevent re-loads
  const initialLoadTriggeredRef = useRef(false);
  const currentChannelRef = useRef(null);

  // Reset initial load flag when channel changes
  if (currentChannelRef.current !== channelId) {
    initialLoadTriggeredRef.current = false;
    currentChannelRef.current = channelId;
  }

  // Load messages for the channel
  const loadMessages = useCallback(async (loadMore = false) => {
    if (!channelId || !userId) {
      console.error('[useChannelMessages] Missing channelId or userId');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const currentOffset = loadMore ? offset : 0;
      const data = await fetchJson(
        `${API_URL}/channels/${channelId}/messages?user_id=${userId}&limit=${limit}&offset=${currentOffset}`,
        {},
        'useChannelMessages.loadMessages'
      );
      
      if (loadMore) {
        // Append older messages to the top
        setMessages(prev => [...data.messages.reverse(), ...prev]);
      } else {
        // Replace messages with new data
        setMessages(data.messages.reverse());
      }
      
      setHasMore(data.hasMore);
      setOffset(currentOffset + data.messages.length);
    } catch (error) {
      console.error('[useChannelMessages] Error loading messages:', error);
      setError(error.message || 'Failed to load messages');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [channelId, userId, offset]);

  // Load more messages (for infinite scroll)
  const loadMoreMessages = useCallback(() => {
    if (!isLoading && hasMore) {
      loadMessages(true);
    }
  }, [isLoading, hasMore, loadMessages]);

  // Send a message via Socket.IO
  const sendMessage = useCallback(async (content) => {
    if (!channelId || !userId || !userName) {
      throw new Error('Missing required parameters');
    }

    if (!content || !content.trim()) {
      throw new Error('Message content is required');
    }

    setError(null);

    try {
      // Send via Socket.IO for real-time delivery
      socketService.sendMessage(channelId, content.trim());
      
      // Note: The message will be added to the list via the WebSocket event
      // No need to manually add it here
    } catch (error) {
      console.error('[useChannelMessages] Error sending message:', error);
      setError(error.message || 'Failed to send message');
      throw error;
    }
  }, [channelId, userId, userName]);

  // Delete a message
  const deleteMessage = useCallback(async (messageId) => {
    if (!userId) {
      throw new Error('User not authenticated');
    }

    setError(null);

    try {
      const response = await fetchWithLogging(
        `${API_URL}/channels/${channelId}/messages/${messageId}?user_id=${userId}`,
        {
          method: 'DELETE',
        },
        'useChannelMessages.deleteMessage'
      );
      
      if (!response.ok) {
        await handleApiError(response, 'useChannelMessages.deleteMessage');
      }

      // Remove message from local state
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
    } catch (error) {
      console.error('[useChannelMessages] Error deleting message:', error);
      setError(error.message || 'Failed to delete message');
      throw error;
    }
  }, [channelId, userId]);

  // Send typing indicator
  const sendTypingIndicator = useCallback((isTyping) => {
    if (channelId) {
      socketService.sendTypingIndicator(channelId, isTyping);
    }
  }, [channelId]);

  // Setup Socket.IO connection and event listeners
  useEffect(() => {
    if (!channelId || !userId || !userName) {
      return;
    }

    console.log('[useChannelMessages] Setting up Socket.IO for channel:', channelId);

    // Connect to Socket.IO
    socketService.connect();

    // Join the channel
    socketService.joinChannel(channelId, userId, userName);

    // Load initial messages only once per channel
    if (!initialLoadTriggeredRef.current) {
      initialLoadTriggeredRef.current = true;
      loadMessages(false);
    }

    // Listen for new messages
    const cleanupNewMessage = socketService.onNewMessage((message) => {
      console.log('[useChannelMessages] New message received:', message);
      
      // Add message to the end of the list (avoid duplicates)
      setMessages(prev => {
        const exists = prev.some(msg => msg.id === message.id);
        if (exists) return prev;
        return [...prev, message];
      });
    });

    // Listen for typing indicators
    const cleanupTyping = socketService.onUserTyping(({ userId: typingUserId, userName: typingUserName, isTyping }) => {
      setTypingUsers(prev => {
        const newSet = new Set(prev);
        
        if (isTyping) {
          newSet.add(typingUserName);
          
          // Clear existing timeout
          if (typingTimeoutRef.current[typingUserId]) {
            clearTimeout(typingTimeoutRef.current[typingUserId]);
          }
          
          // Remove after 3 seconds of inactivity
          typingTimeoutRef.current[typingUserId] = setTimeout(() => {
            setTypingUsers(prev2 => {
              const newSet2 = new Set(prev2);
              newSet2.delete(typingUserName);
              return newSet2;
            });
          }, 3000);
        } else {
          newSet.delete(typingUserName);
          
          // Clear timeout
          if (typingTimeoutRef.current[typingUserId]) {
            clearTimeout(typingTimeoutRef.current[typingUserId]);
            delete typingTimeoutRef.current[typingUserId];
          }
        }
        
        return newSet;
      });
    });

    // Listen for errors
    const cleanupError = socketService.onError((error) => {
      console.error('[useChannelMessages] Socket error:', error);
      setError(error.message || 'WebSocket error occurred');
    });

    // Cleanup function - called when channelId, userId, or userName changes, or component unmounts
    return () => {
      console.log('[useChannelMessages] Cleaning up Socket.IO for channel:', channelId);
      
      // Leave channel and remove all event listeners
      socketService.leaveChannel(channelId);
      cleanupNewMessage();
      cleanupTyping();
      cleanupError();
      
      // Clear all typing timeouts
      Object.values(typingTimeoutRef.current).forEach(timeout => clearTimeout(timeout));
      typingTimeoutRef.current = {};
    };
  }, [channelId, userId, userName, loadMessages]);

  return {
    messages,
    isLoading,
    error,
    hasMore,
    sendMessage,
    deleteMessage,
    loadMoreMessages,
    sendTypingIndicator,
    typingUsers: Array.from(typingUsers)
  };
}
