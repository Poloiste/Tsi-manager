import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { createDebugLogger } from '../utils/guardUtils';
import { fetchJson, handleApiError, fetchWithLogging } from '../utils/apiHelpers';

// Development logging utility
const isDev = process.env.NODE_ENV === 'development';
const logger = createDebugLogger('useGroupChat');
const log = (...args) => {
  if (isDev) console.log(...args);
};
const logError = (...args) => console.error(...args); // Always log errors

// Get API URL from environment or use default
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

/**
 * Hook de gestion du chat de groupe via l'API backend
 * @param {string} groupId - ID du groupe
 * @param {string} userId - ID de l'utilisateur connecté
 * @param {string} userName - Nom de l'utilisateur connecté
 * @returns {Object} État et fonctions de gestion du chat
 */
export function useGroupChat(groupId, userId, userName) {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [channelId, setChannelId] = useState(null);

  // Charger les messages du groupe via l'API backend
  const loadMessages = useCallback(async () => {
    if (!groupId || !userId) {
      logError('[useGroupChat] Missing groupId or userId');
      return;
    }

    logger.log('Loading messages for group:', groupId);
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await fetchJson(
        `${API_URL}/groups/${groupId}/messages?limit=100&user_id=${userId}`,
        {},
        'useGroupChat.loadMessages'
      );
      
      logger.log('Messages loaded:', data?.length || 0);
      setMessages(data || []);
      
      // Récupérer le channel_id pour les abonnements en temps réel
      if (data && data.length > 0) {
        setChannelId(data[0].channel_id);
      } else {
        // Sinon, récupérer le channel_id via Supabase
        const { data: channel } = await supabase
          .from('chat_channels')
          .select('id')
          .eq('group_id', groupId)
          .single();
        
        if (channel) {
          setChannelId(channel.id);
        }
      }
    } catch (error) {
      logError('[useGroupChat] Error loading messages:', error);
      setError(error.message || 'Impossible de charger les messages');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [groupId, userId]);

  // Envoyer un nouveau message via l'API backend
  const sendMessage = useCallback(async (messageText) => {
    if (!groupId || !userId || !userName) {
      logError('[useGroupChat] Missing groupId, userId, or userName');
      throw new Error('User not authenticated or group not selected');
    }

    if (!messageText?.trim()) {
      logError('[useGroupChat] Empty message');
      throw new Error('Message cannot be empty');
    }

    logger.log('Sending message to group:', groupId);
    setError(null);

    try {
      const data = await fetchJson(
        `${API_URL}/groups/${groupId}/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: userId,
            user_name: userName,
            content: messageText.trim()
          }),
        },
        'useGroupChat.sendMessage'
      );
      
      logger.log('Message sent successfully:', data.id);
      return data;
    } catch (error) {
      logError('[useGroupChat] Error sending message:', error);
      setError(error.message || 'Impossible d\'envoyer le message');
      throw error;
    }
  }, [groupId, userId, userName]);

  // Supprimer un message via l'API backend
  const deleteMessage = useCallback(async (messageId) => {
    if (!userId) {
      logError('[useGroupChat] Missing userId');
      throw new Error('User not authenticated');
    }

    logger.log('Deleting message:', messageId);
    setError(null);

    try {
      const response = await fetchWithLogging(
        `${API_URL}/groups/${groupId}/messages/${messageId}?user_id=${userId}`,
        {
          method: 'DELETE',
        },
        'useGroupChat.deleteMessage'
      );
      
      if (!response.ok) {
        await handleApiError(response, 'useGroupChat.deleteMessage');
      }

      logger.log('Message deleted successfully');
    } catch (error) {
      logError('[useGroupChat] Error deleting message:', error);
      setError(error.message || 'Impossible de supprimer le message');
      throw error;
    }
  }, [groupId, userId]);

  // Configurer les abonnements en temps réel
  useEffect(() => {
    if (!groupId || !userId) {
      log('[useGroupChat] Skipping realtime setup - missing groupId or userId');
      return;
    }

    log('[useGroupChat] Setting up realtime subscription for group:', groupId);

    // Charger les messages initiaux
    loadMessages();

    // Attendre que le channelId soit disponible
    if (!channelId) {
      return;
    }

    // S'abonner aux nouveaux messages via chat_messages table
    const channel = supabase
      .channel(`group-chat:${groupId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `channel_id=eq.${channelId}`
      }, (payload) => {
        log('[useGroupChat] New message received:', payload.new);
        setMessages(prev => {
          // Éviter les doublons
          const exists = prev.some(msg => msg.id === payload.new.id);
          if (exists) return prev;
          return [...prev, payload.new];
        });
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'chat_messages',
        filter: `channel_id=eq.${channelId}`
      }, (payload) => {
        log('[useGroupChat] Message deleted:', payload.old.id);
        setMessages(prev => prev.filter(msg => msg.id !== payload.old.id));
      })
      .subscribe((status) => {
        log('[useGroupChat] Realtime subscription status:', status);
      });

    // Cleanup
    return () => {
      log('[useGroupChat] Cleaning up realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [groupId, userId, channelId, loadMessages]);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    deleteMessage,
    loadMessages
  };
}
