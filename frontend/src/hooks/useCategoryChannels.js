import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { fetchJson } from '../utils/apiHelpers';

// Get API URL from environment or use default
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

/**
 * Hook for managing categories and channels with hierarchy
 * @param {string} userId - ID of the current user
 * @returns {Object} Categories, channels, and management functions
 */
export function useCategoryChannels(userId) {
  const [categories, setCategories] = useState([]);
  const [orphanChannels, setOrphanChannels] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load all categories and channels with hierarchy
  const loadChannels = useCallback(async () => {
    if (!userId) {
      console.error('[useCategoryChannels] Missing userId');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch all channels including categories
      const data = await fetchJson(
        `${API_URL}/channels?user_id=${userId}&include_children=true`,
        {},
        'useCategoryChannels.loadChannels'
      );

      // Organize data into categories with their children
      const categoriesMap = new Map();
      const orphans = [];

      // First pass: collect all channels
      const allChannels = data.channels || [];
      
      allChannels.forEach(channel => {
        if (channel.channel_type === 'category') {
          categoriesMap.set(channel.id, {
            ...channel,
            children: []
          });
        }
      });

      // Second pass: assign children to categories or mark as orphans
      allChannels.forEach(channel => {
        if (channel.channel_type !== 'category') {
          if (channel.parent_id && categoriesMap.has(channel.parent_id)) {
            categoriesMap.get(channel.parent_id).children.push(channel);
          } else {
            orphans.push(channel);
          }
        }
      });

      // Convert map to array and sort by position
      const categoriesArray = Array.from(categoriesMap.values())
        .sort((a, b) => (a.position || 0) - (b.position || 0));

      // Sort children within each category
      categoriesArray.forEach(category => {
        category.children.sort((a, b) => (a.position || 0) - (b.position || 0));
      });

      setCategories(categoriesArray);
      setOrphanChannels(orphans);
    } catch (error) {
      console.error('[useCategoryChannels] Error loading channels:', error);
      setError(error.message || 'Failed to load channels');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Create a new category
  const createCategory = useCallback(async (name, visibility = 'public') => {
    if (!userId) {
      throw new Error('Missing userId');
    }

    if (!name || !name.trim()) {
      throw new Error('Category name is required');
    }

    setError(null);

    try {
      const newCategory = await fetchJson(
        `${API_URL}/channels`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: name.trim(),
            type: 'category',
            visibility,
            created_by: userId
          }),
        },
        'useCategoryChannels.createCategory'
      );
      
      // Reload to get updated list
      await loadChannels();
      
      return newCategory;
    } catch (error) {
      console.error('[useCategoryChannels] Error creating category:', error);
      setError(error.message || 'Failed to create category');
      throw error;
    }
  }, [userId, loadChannels]);

  // Create a new channel
  const createChannel = useCallback(async (name, type = 'text', parentId, visibility = 'public') => {
    if (!userId) {
      throw new Error('Missing userId');
    }

    if (!name || !name.trim()) {
      throw new Error('Channel name is required');
    }

    if (!['text', 'voice'].includes(type)) {
      throw new Error('Invalid channel type');
    }

    setError(null);

    try {
      const newChannel = await fetchJson(
        `${API_URL}/channels`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: name.trim(),
            type,
            parent_id: parentId,
            visibility,
            created_by: userId
          }),
        },
        'useCategoryChannels.createChannel'
      );
      
      // Reload to get updated list
      await loadChannels();
      
      return newChannel;
    } catch (error) {
      console.error('[useCategoryChannels] Error creating channel:', error);
      setError(error.message || 'Failed to create channel');
      throw error;
    }
  }, [userId, loadChannels]);

  // Delete a channel or category
  const deleteChannel = useCallback(async (channelId) => {
    if (!userId) {
      throw new Error('Missing userId');
    }

    setError(null);

    try {
      await fetchJson(
        `${API_URL}/channels/${channelId}?user_id=${userId}`,
        {
          method: 'DELETE',
        },
        'useCategoryChannels.deleteChannel'
      );
      
      // Reload to get updated list
      await loadChannels();
    } catch (error) {
      console.error('[useCategoryChannels] Error deleting channel:', error);
      setError(error.message || 'Failed to delete channel');
      throw error;
    }
  }, [userId, loadChannels]);

  // Load channels when userId changes
  useEffect(() => {
    if (userId) {
      loadChannels();
    }
  }, [userId, loadChannels]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!userId) return;

    // Subscribe to chat_channels changes
    const channelsSubscription = supabase
      .channel('category-channels-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_channels',
          filter: `group_id=is.null` // Only standalone channels, not group channels
        },
        (payload) => {
          console.log('[useCategoryChannels] Channel change detected:', payload);
          // Reload channels on any change
          loadChannels();
        }
      )
      .subscribe();

    return () => {
      channelsSubscription.unsubscribe();
    };
  }, [userId, loadChannels]);

  return {
    categories,
    orphanChannels,
    isLoading,
    error,
    loadChannels,
    createCategory,
    createChannel,
    deleteChannel
  };
}
