import React from 'react';
import { Bell, X, Settings, CheckCheck } from 'lucide-react';

/**
 * Composant Centre de Notifications
 * @param {Array} notifications - Liste des notifications
 * @param {Function} onDismiss - Callback pour marquer une notification comme lue
 * @param {Function} onDismissAll - Callback pour marquer toutes les notifications comme lues
 * @param {Function} onClose - Callback pour fermer le dropdown
 * @param {Function} onOpenSettings - Callback pour ouvrir les paramètres
 */
export function NotificationCenter({ 
  notifications = [], 
  onDismiss, 
  onDismissAll, 
  onClose,
  onOpenSettings 
}) {
  const unreadNotifications = notifications.filter(n => n.delivered_at && !n.dismissed_at);
  
  const getNotificationIcon = (type) => {
    const icons = {
      'due_cards': '🔴',
      'daily_review': '📅',
      'streak_warning': '🔥',
      'upcoming_test': '📅',
      'goal_achieved': '🏆',
      'badge_unlocked': '🏆'
    };
    return icons[type] || '🔔';
  };

  const getNotificationColor = (type) => {
    const colors = {
      'due_cards': 'border-red-500/30 bg-red-900/10',
      'daily_review': 'border-blue-500/30 bg-blue-900/10',
      'streak_warning': 'border-orange-500/30 bg-orange-900/10',
      'upcoming_test': 'border-yellow-500/30 bg-yellow-900/10',
      'goal_achieved': 'border-green-500/30 bg-green-900/10',
      'badge_unlocked': 'border-purple-500/30 bg-purple-900/10'
    };
    return colors[type] || 'border-slate-500/30 bg-slate-900/10';
  };

  const formatRelativeTime = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now - time;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    return time.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="absolute right-0 top-12 w-96 max-w-[calc(100vw-2rem)] bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 max-h-[80vh] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-700 flex items-center justify-between bg-slate-900/50">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-indigo-400" />
          <h3 className="text-white font-bold">Notifications</h3>
          {unreadNotifications.length > 0 && (
            <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full font-bold">
              {unreadNotifications.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="text-slate-400 hover:text-white transition-colors p-1"
              title="Paramètres"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {unreadNotifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">Aucune notification</p>
            <p className="text-slate-500 text-xs mt-1">Vous êtes à jour !</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-700">
            {unreadNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 hover:bg-slate-700/30 transition-colors border-l-4 ${getNotificationColor(notification.type)}`}
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-semibold text-sm mb-1">
                      {notification.title}
                    </h4>
                    <p className="text-slate-300 text-sm mb-2">
                      {notification.message}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 text-xs">
                        {formatRelativeTime(notification.delivered_at || notification.created_at)}
                      </span>
                      <button
                        onClick={() => onDismiss(notification.id)}
                        className="text-indigo-400 hover:text-indigo-300 text-xs font-semibold transition-colors"
                      >
                        Marquer comme lu
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {unreadNotifications.length > 0 && (
        <div className="p-3 border-t border-slate-700 bg-slate-900/50">
          <button
            onClick={onDismissAll}
            className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <CheckCheck className="w-4 h-4" />
            Tout marquer comme lu
          </button>
        </div>
      )}
    </div>
  );
}
