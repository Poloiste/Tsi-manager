import { useState, useEffect, useCallback } from 'react';

// Get API URL from environment or use default
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

/**
 * Hook for managing channels in a group
 * @param {string} groupId - ID of the group
 * @param {string} userId - ID of the current user
 * @returns {Object} Channel management state and functions
 */
export function useChannels(groupId, userId) {
  const [channels, setChannels] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load channels for the group
  const loadChannels = useCallback(async () => {
    if (!groupId || !userId) {
      console.error('[useChannels] Missing groupId or userId');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/groups/${groupId}/channels?user_id=${userId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setChannels(data || []);
    } catch (error) {
      console.error('[useChannels] Error loading channels:', error);
      setError(error.message || 'Failed to load channels');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [groupId, userId]);

  // Create a new channel
  const createChannel = useCallback(async (channelName, type = 'group') => {
    if (!groupId || !userId) {
      throw new Error('Missing groupId or userId');
    }

    if (!channelName || !channelName.trim()) {
      throw new Error('Channel name is required');
    }

    setError(null);

    try {
      const response = await fetch(`${API_URL}/groups/${groupId}/channels`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          name: channelName.trim(),
          type
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const newChannel = await response.json();
      
      // Add the new channel to the list
      setChannels(prev => [...prev, newChannel]);
      
      return newChannel;
    } catch (error) {
      console.error('[useChannels] Error creating channel:', error);
      setError(error.message || 'Failed to create channel');
      throw error;
    }
  }, [groupId, userId]);

  // Load channels when the component mounts or groupId changes
  useEffect(() => {
    if (groupId && userId) {
      loadChannels();
    }
  }, [groupId, userId, loadChannels]);

  return {
    channels,
    isLoading,
    error,
    loadChannels,
    createChannel
  };
}
