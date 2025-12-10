import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { createDebugLogger } from '../utils/guardUtils';

// Development logging utility
const isDev = process.env.NODE_ENV === 'development';
const logger = createDebugLogger('useGroupChat');
const log = (...args) => {
  if (isDev) console.log(...args);
};
const logError = (...args) => console.error(...args); // Always log errors

/**
 * Hook de gestion du chat de groupe
 * @param {string} groupId - ID du groupe
 * @param {string} userId - ID de l'utilisateur connecté
 * @returns {Object} État et fonctions de gestion du chat
 */
export function useGroupChat(groupId, userId) {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Charger les messages du groupe
  const loadMessages = useCallback(async () => {
    if (!groupId || !userId) {
      logError('[useGroupChat] Missing groupId or userId');
      return;
    }

    logger.log('Loading messages for group:', groupId);
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('group_chats')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: true })
        .limit(100); // Limiter aux 100 derniers messages

      if (error) throw error;

      logger.log('Messages loaded:', data?.length || 0);
      setMessages(data || []);
    } catch (error) {
      logError('[useGroupChat] Error loading messages:', error);
      setError('Impossible de charger les messages');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [groupId, userId]);

  // Envoyer un nouveau message
  const sendMessage = useCallback(async (messageText) => {
    if (!groupId || !userId) {
      logError('[useGroupChat] Missing groupId or userId');
      throw new Error('User not authenticated or group not selected');
    }

    if (!messageText?.trim()) {
      logError('[useGroupChat] Empty message');
      throw new Error('Message cannot be empty');
    }

    logger.log('Sending message to group:', groupId);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('group_chats')
        .insert([{
          group_id: groupId,
          user_id: userId,
          message: messageText.trim()
        }])
        .select()
        .single();

      if (error) throw error;

      logger.log('Message sent successfully:', data.id);
      return data;
    } catch (error) {
      logError('[useGroupChat] Error sending message:', error);
      setError('Impossible d\'envoyer le message');
      throw error;
    }
  }, [groupId, userId]);

  // Supprimer un message
  const deleteMessage = useCallback(async (messageId) => {
    if (!userId) {
      logError('[useGroupChat] Missing userId');
      throw new Error('User not authenticated');
    }

    logger.log('Deleting message:', messageId);
    setError(null);

    try {
      const { error } = await supabase
        .from('group_chats')
        .delete()
        .eq('id', messageId)
        .eq('user_id', userId); // RLS vérifie aussi, mais on ajoute une sécurité côté client

      if (error) throw error;

      logger.log('Message deleted successfully');
    } catch (error) {
      logError('[useGroupChat] Error deleting message:', error);
      setError('Impossible de supprimer le message');
      throw error;
    }
  }, [userId]);

  // Configurer les abonnements en temps réel
  useEffect(() => {
    if (!groupId || !userId) {
      log('[useGroupChat] Skipping realtime setup - missing groupId or userId');
      return;
    }

    log('[useGroupChat] Setting up realtime subscription for group:', groupId);

    // Charger les messages initiaux
    loadMessages();

    // S'abonner aux nouveaux messages
    const channel = supabase
      .channel(`group-chat:${groupId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'group_chats',
        filter: `group_id=eq.${groupId}`
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
        table: 'group_chats',
        filter: `group_id=eq.${groupId}`
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
  }, [groupId, userId, loadMessages]);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    deleteMessage,
    loadMessages
  };
}
