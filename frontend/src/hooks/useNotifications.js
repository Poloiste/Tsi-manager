import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

/**
 * Hook de gestion des notifications et rappels
 * @param {string} userId - ID de l'utilisateur connecté
 * @returns {Object} État et fonctions de notifications
 */
export function useNotifications(userId) {
  // États
  const [settings, setSettings] = useState(null);
  const [reminders, setReminders] = useState([]);
  const [permission, setPermission] = useState('default');
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // Charger les préférences utilisateur
  const loadSettings = useCallback(async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('user_notification_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = not found
        throw error;
      }

      if (data) {
        setSettings(data);
      } else {
        // Create default settings if none exist
        const defaultSettings = {
          user_id: userId,
          browser_notifications_enabled: false,
          daily_reminder_enabled: true,
          daily_reminder_time: '19:00',
          due_cards_reminder_enabled: true,
          streak_warning_enabled: true,
          upcoming_test_reminder_enabled: true,
          upcoming_test_days_before: 3,
          daily_goal_cards: 20,
          goal_achieved_notification_enabled: true
        };

        const { data: newData, error: insertError } = await supabase
          .from('user_notification_settings')
          .insert([defaultSettings])
          .select()
          .single();

        if (insertError) throw insertError;
        setSettings(newData);
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  }, [userId]);

  // Charger les rappels
  const loadReminders = useCallback(async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('scheduled_reminders')
        .select('*')
        .eq('user_id', userId)
        .is('dismissed_at', null)
        .order('scheduled_for', { ascending: true });

      if (error) throw error;

      setReminders(data || []);
      
      // Count unread reminders (delivered but not dismissed)
      const unread = (data || []).filter(r => r.delivered_at && !r.dismissed_at).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error loading reminders:', error);
    }
  }, [userId]);

  // Sauvegarder les préférences
  const updateSettings = useCallback(async (newSettings) => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('user_notification_settings')
        .update(newSettings)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      setSettings(data);
      return true;
    } catch (error) {
      console.error('Error updating notification settings:', error);
      return false;
    }
  }, [userId]);

  // Demander la permission pour les notifications browser
  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted' && userId) {
        // Update settings in database
        await updateSettings({ browser_notifications_enabled: true });
      }
      
      return result === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, [userId, updateSettings]);

  // Programmer un rappel
  const scheduleReminder = useCallback(async (reminder) => {
    if (!userId) return null;

    try {
      const { data, error } = await supabase
        .from('scheduled_reminders')
        .insert([{
          user_id: userId,
          type: reminder.type,
          title: reminder.title,
          message: reminder.message,
          scheduled_for: reminder.scheduledFor,
          metadata: reminder.metadata || {}
        }])
        .select()
        .single();

      if (error) throw error;

      await loadReminders(); // Reload to update list
      return data;
    } catch (error) {
      console.error('Error scheduling reminder:', error);
      return null;
    }
  }, [userId, loadReminders]);

  // Annuler un rappel
  const cancelReminder = useCallback(async (reminderId) => {
    if (!userId) return false;

    try {
      const { error } = await supabase
        .from('scheduled_reminders')
        .delete()
        .eq('id', reminderId)
        .eq('user_id', userId);

      if (error) throw error;

      await loadReminders(); // Reload to update list
      return true;
    } catch (error) {
      console.error('Error canceling reminder:', error);
      return false;
    }
  }, [userId, loadReminders]);

  // Marquer un rappel comme lu
  const dismissReminder = useCallback(async (reminderId) => {
    if (!userId) return false;

    try {
      const { error } = await supabase
        .from('scheduled_reminders')
        .update({ dismissed_at: new Date().toISOString() })
        .eq('id', reminderId)
        .eq('user_id', userId);

      if (error) throw error;

      await loadReminders(); // Reload to update list
      return true;
    } catch (error) {
      console.error('Error dismissing reminder:', error);
      return false;
    }
  }, [userId, loadReminders]);

  // Marquer tous les rappels comme lus
  const dismissAllReminders = useCallback(async () => {
    if (!userId) return false;

    try {
      const { error } = await supabase
        .from('scheduled_reminders')
        .update({ dismissed_at: new Date().toISOString() })
        .eq('user_id', userId)
        .is('dismissed_at', null);

      if (error) throw error;

      await loadReminders(); // Reload to update list
      return true;
    } catch (error) {
      console.error('Error dismissing all reminders:', error);
      return false;
    }
  }, [userId, loadReminders]);

  // Envoyer une notification browser
  const sendBrowserNotification = useCallback((title, body, icon = '🔔') => {
    if (!settings?.browser_notifications_enabled || permission !== 'granted') {
      return false;
    }

    try {
      new Notification(title, { 
        body, 
        icon: icon,
        badge: icon,
        tag: 'tsi-manager-notification'
      });
      return true;
    } catch (error) {
      console.error('Error sending browser notification:', error);
      return false;
    }
  }, [settings, permission]);

  // Vérifier et afficher les rappels dus
  const checkDueReminders = useCallback(async () => {
    if (!userId || !settings) return [];

    try {
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('scheduled_reminders')
        .select('*')
        .eq('user_id', userId)
        .is('delivered_at', null)
        .lte('scheduled_for', now)
        .order('scheduled_for', { ascending: true });

      if (error) throw error;

      const dueReminders = data || [];

      // Mark reminders as delivered
      if (dueReminders.length > 0) {
        const reminderIds = dueReminders.map(r => r.id);
        await supabase
          .from('scheduled_reminders')
          .update({ delivered_at: now })
          .in('id', reminderIds);

        // Show browser notifications if enabled (limit to first 3 to avoid spam)
        if (settings.browser_notifications_enabled && permission === 'granted') {
          const notificationsToShow = dueReminders.slice(0, 3);
          notificationsToShow.forEach(reminder => {
            sendBrowserNotification(reminder.title, reminder.message, '🔔');
          });
          
          // If more than 3, show a summary notification
          if (dueReminders.length > 3) {
            sendBrowserNotification(
              'Rappels en attente',
              `${dueReminders.length} rappels vous attendent`,
              '🔔'
            );
          }
        }

        await loadReminders(); // Reload to update list
      }

      return dueReminders;
    } catch (error) {
      console.error('Error checking due reminders:', error);
      return [];
    }
  }, [userId, settings, permission, loadReminders, sendBrowserNotification]);

  // Initialiser au chargement
  useEffect(() => {
    const init = async () => {
      if (userId) {
        setIsLoading(true);
        await Promise.all([loadSettings(), loadReminders()]);
        setIsLoading(false);
      }
    };
    init();
  }, [userId, loadSettings, loadReminders]);

  // Vérifier la permission des notifications au chargement
  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  // Vérifier les rappels dus régulièrement (toutes les minutes)
  useEffect(() => {
    if (!userId || !settings) return;

    const interval = setInterval(() => {
      checkDueReminders();
    }, 60000); // Check every minute

    // Check immediately on mount
    checkDueReminders();

    return () => clearInterval(interval);
  }, [userId, settings, checkDueReminders]);

  return {
    settings,
    reminders,
    permission,
    isLoading,
    unreadCount,
    loadSettings,
    updateSettings,
    requestPermission,
    scheduleReminder,
    cancelReminder,
    dismissReminder,
    dismissAllReminders,
    checkDueReminders,
    sendBrowserNotification
  };
}
