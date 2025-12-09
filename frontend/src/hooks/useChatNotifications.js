import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook de gestion des notifications pour le chat
 * @param {string} userId - ID de l'utilisateur connecté
 * @param {Object} selectedChannel - Canal actuellement sélectionné
 * @param {Array} channels - Liste de tous les canaux
 * @returns {Object} État et fonctions de notifications de chat
 */
export function useChatNotifications(userId, selectedChannel, channels) {
  // État des messages non lus par canal
  const [unreadMessages, setUnreadMessages] = useState({});
  
  // État pour savoir si on a demandé la permission
  const [permissionRequested, setPermissionRequested] = useState(false);
  
  // État pour le son des notifications
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('chatSoundEnabled');
    return saved ? JSON.parse(saved) : true;
  });
  
  // État pour les notifications du navigateur
  const [browserNotificationsEnabled, setBrowserNotificationsEnabled] = useState(() => {
    const saved = localStorage.getItem('chatBrowserNotificationsEnabled');
    return saved ? JSON.parse(saved) : false;
  });
  
  // Référence pour la dernière notification (pour éviter le spam)
  const lastNotificationTime = useRef({});
  const NOTIFICATION_COOLDOWN_MS = 3000; // 3 secondes entre notifications du même canal
  
  // Référence pour l'audio de notification
  const notificationSound = useRef(null);
  
  // Initialiser l'audio de notification
  useEffect(() => {
    // Créer un son simple avec l'API Web Audio
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const createBeep = () => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
      };
      
      notificationSound.current = createBeep;
    } catch (error) {
      console.warn('Web Audio API not supported:', error);
    }
  }, []);
  
  // Calculer le nombre total de messages non lus
  const totalUnreadCount = Object.values(unreadMessages).reduce((sum, count) => sum + count, 0);
  
  // Charger les compteurs non lus depuis localStorage
  useEffect(() => {
    if (!userId) return;
    
    const saved = localStorage.getItem(`chatUnreadMessages_${userId}`);
    if (saved) {
      try {
        setUnreadMessages(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading unread messages:', error);
      }
    }
  }, [userId]);
  
  // Sauvegarder les compteurs non lus dans localStorage
  useEffect(() => {
    if (!userId) return;
    
    localStorage.setItem(`chatUnreadMessages_${userId}`, JSON.stringify(unreadMessages));
  }, [unreadMessages, userId]);
  
  // Sauvegarder les préférences de son
  useEffect(() => {
    localStorage.setItem('chatSoundEnabled', JSON.stringify(soundEnabled));
  }, [soundEnabled]);
  
  // Sauvegarder les préférences de notifications navigateur
  useEffect(() => {
    localStorage.setItem('chatBrowserNotificationsEnabled', JSON.stringify(browserNotificationsEnabled));
  }, [browserNotificationsEnabled]);
  
  // Demander la permission pour les notifications navigateur
  const requestBrowserNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }
    
    if (Notification.permission === 'granted') {
      setBrowserNotificationsEnabled(true);
      setPermissionRequested(true);
      return true;
    }
    
    if (Notification.permission === 'denied') {
      setPermissionRequested(true);
      return false;
    }
    
    try {
      const result = await Notification.requestPermission();
      setPermissionRequested(true);
      
      if (result === 'granted') {
        setBrowserNotificationsEnabled(true);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      setPermissionRequested(true);
      return false;
    }
  }, []);
  
  // Vérifier si on peut envoyer une notification (cooldown)
  const canSendNotification = useCallback((channelId) => {
    const now = Date.now();
    const lastTime = lastNotificationTime.current[channelId] || 0;
    return (now - lastTime) >= NOTIFICATION_COOLDOWN_MS;
  }, []);
  
  // Jouer le son de notification
  const playNotificationSound = useCallback(() => {
    if (soundEnabled && notificationSound.current) {
      try {
        notificationSound.current();
      } catch (error) {
        console.warn('Error playing notification sound:', error);
      }
    }
  }, [soundEnabled]);
  
  // Envoyer une notification navigateur
  const sendBrowserNotification = useCallback((title, body, channelName) => {
    if (!browserNotificationsEnabled || Notification.permission !== 'granted') {
      return false;
    }
    
    // Ne pas notifier si le document est visible
    if (document.visibilityState === 'visible') {
      return false;
    }
    
    try {
      const notification = new Notification(title, {
        body,
        icon: '💬',
        badge: '💬',
        tag: `chat-${channelName}`, // Empêche les doublons pour le même canal
        requireInteraction: false,
        silent: true // Le son est géré par notre système
      });
      
      // Auto-fermer après 5 secondes
      setTimeout(() => notification.close(), 5000);
      
      return true;
    } catch (error) {
      console.error('Error sending browser notification:', error);
      return false;
    }
  }, [browserNotificationsEnabled]);
  
  // Marquer les messages comme lus pour un canal
  const markChannelAsRead = useCallback((channelId) => {
    if (!channelId) return;
    
    setUnreadMessages(prev => {
      const updated = { ...prev };
      delete updated[channelId];
      return updated;
    });
  }, []);
  
  // Incrémenter le compteur de messages non lus pour un canal
  const incrementUnreadCount = useCallback((channelId, channelName) => {
    if (!channelId) return;
    
    setUnreadMessages(prev => ({
      ...prev,
      [channelId]: (prev[channelId] || 0) + 1
    }));
  }, []);
  
  // Gérer un nouveau message
  const handleNewMessage = useCallback((message, isCurrentChannel, channelName) => {
    // Ne pas notifier pour nos propres messages
    if (message.user_id === userId) {
      return;
    }
    
    const channelId = message.channel_id;
    
    // Vérifier le cooldown
    if (!canSendNotification(channelId)) {
      return;
    }
    
    // Mettre à jour le timestamp de la dernière notification
    lastNotificationTime.current[channelId] = Date.now();
    
    // Si c'est dans le canal actuel, juste jouer le son
    if (isCurrentChannel) {
      playNotificationSound();
      return;
    }
    
    // Sinon, incrémenter le compteur et envoyer notifications
    incrementUnreadCount(channelId, channelName);
    playNotificationSound();
    
    // Envoyer notification navigateur si activée
    sendBrowserNotification(
      `💬 ${channelName}`,
      `${message.user_name}: ${message.content.substring(0, 100)}${message.content.length > 100 ? '...' : ''}`,
      channelName
    );
  }, [userId, canSendNotification, playNotificationSound, incrementUnreadCount, sendBrowserNotification]);
  
  // Marquer le canal actuel comme lu quand il change
  useEffect(() => {
    if (selectedChannel?.id) {
      markChannelAsRead(selectedChannel.id);
    }
  }, [selectedChannel?.id, markChannelAsRead]);
  
  // Toggle du son
  const toggleSound = useCallback(() => {
    setSoundEnabled(prev => !prev);
  }, []);
  
  // Toggle des notifications navigateur
  const toggleBrowserNotifications = useCallback(async () => {
    if (!browserNotificationsEnabled) {
      // Si on veut activer, demander la permission d'abord
      const granted = await requestBrowserNotificationPermission();
      if (!granted) {
        return false;
      }
    } else {
      // Si on désactive, juste changer l'état
      setBrowserNotificationsEnabled(false);
    }
    return true;
  }, [browserNotificationsEnabled, requestBrowserNotificationPermission]);
  
  return {
    unreadMessages,
    totalUnreadCount,
    soundEnabled,
    browserNotificationsEnabled,
    permissionRequested,
    handleNewMessage,
    markChannelAsRead,
    toggleSound,
    toggleBrowserNotifications,
    requestBrowserNotificationPermission
  };
}
