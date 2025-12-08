import React, { useState, useEffect } from 'react';
import { Bell, Clock, AlertTriangle, Target, X } from 'lucide-react';

/**
 * Composant de paramètres de notifications
 * @param {Object} settings - Paramètres actuels
 * @param {Function} onUpdate - Callback pour mettre à jour les paramètres
 * @param {Function} onClose - Callback pour fermer le modal
 * @param {Function} onRequestPermission - Callback pour demander la permission
 * @param {string} permission - État de la permission ('default', 'granted', 'denied')
 */
export function NotificationSettings({ settings, onUpdate, onClose, onRequestPermission, permission }) {
  const [localSettings, setLocalSettings] = useState(settings || {});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  const handleSave = async () => {
    setIsSaving(true);
    const success = await onUpdate(localSettings);
    setIsSaving(false);
    
    if (success && onClose) {
      onClose();
    }
  };

  const handleChange = (field, value) => {
    setLocalSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleRequestPermission = async () => {
    const granted = await onRequestPermission();
    if (granted) {
      handleChange('browser_notifications_enabled', true);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl p-8 max-w-2xl w-full border border-indigo-500/30 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-white flex items-center gap-2">
            <Bell className="w-6 h-6 text-indigo-400" />
            🔔 Paramètres de Notifications
          </h3>
          {onClose && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          )}
        </div>

        <div className="space-y-6">
          {/* Notifications navigateur */}
          <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-indigo-400" />
                <span className="text-white font-semibold">Notifications navigateur</span>
              </div>
              {permission === 'denied' && (
                <span className="text-xs text-red-400 bg-red-900/30 px-2 py-1 rounded">
                  Bloquées
                </span>
              )}
            </div>
            
            {permission === 'granted' ? (
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localSettings.browser_notifications_enabled || false}
                  onChange={(e) => handleChange('browser_notifications_enabled', e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-slate-700 rounded focus:ring-indigo-500"
                />
                <span className="text-slate-300 text-sm">Activer les notifications navigateur</span>
              </label>
            ) : permission === 'denied' ? (
              <p className="text-xs text-slate-400">
                Les notifications sont bloquées. Veuillez les autoriser dans les paramètres de votre navigateur.
              </p>
            ) : (
              <button
                onClick={handleRequestPermission}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all text-sm font-semibold"
              >
                Autoriser les notifications
              </button>
            )}
          </div>

          {/* Rappels quotidiens */}
          <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-5 h-5 text-purple-400" />
              <span className="text-white font-semibold">📅 Rappels quotidiens</span>
            </div>
            
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localSettings.daily_reminder_enabled || false}
                  onChange={(e) => handleChange('daily_reminder_enabled', e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-slate-700 rounded focus:ring-indigo-500"
                />
                <span className="text-slate-300 text-sm">Rappel de révision quotidien</span>
              </label>
              
              {localSettings.daily_reminder_enabled && (
                <div className="ml-7 flex items-center gap-2">
                  <span className="text-slate-400 text-sm">Heure:</span>
                  <input
                    type="time"
                    value={localSettings.daily_reminder_time || '19:00'}
                    onChange={(e) => handleChange('daily_reminder_time', e.target.value)}
                    className="px-3 py-1 bg-slate-800 border border-slate-600 rounded text-white text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              )}

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localSettings.due_cards_reminder_enabled || false}
                  onChange={(e) => handleChange('due_cards_reminder_enabled', e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-slate-700 rounded focus:ring-indigo-500"
                />
                <span className="text-slate-300 text-sm">Rappel si cartes à réviser</span>
              </label>
            </div>
          </div>

          {/* Alertes */}
          <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-orange-400" />
              <span className="text-white font-semibold">📊 Alertes</span>
            </div>
            
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localSettings.streak_warning_enabled || false}
                  onChange={(e) => handleChange('streak_warning_enabled', e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-slate-700 rounded focus:ring-indigo-500"
                />
                <span className="text-slate-300 text-sm">Alerte streak en danger (pas de révision hier)</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localSettings.upcoming_test_reminder_enabled || false}
                  onChange={(e) => handleChange('upcoming_test_reminder_enabled', e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-slate-700 rounded focus:ring-indigo-500"
                />
                <span className="text-slate-300 text-sm">Rappel DS à venir</span>
              </label>

              {localSettings.upcoming_test_reminder_enabled && (
                <div className="ml-7 flex items-center gap-2">
                  <span className="text-slate-400 text-sm">Jours avant:</span>
                  <select
                    value={localSettings.upcoming_test_days_before || 3}
                    onChange={(e) => handleChange('upcoming_test_days_before', parseInt(e.target.value))}
                    className="px-3 py-1 bg-slate-800 border border-slate-600 rounded text-white text-sm focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="1">1 jour</option>
                    <option value="2">2 jours</option>
                    <option value="3">3 jours</option>
                    <option value="5">5 jours</option>
                    <option value="7">7 jours</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Objectifs */}
          <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-5 h-5 text-green-400" />
              <span className="text-white font-semibold">🎯 Objectifs</span>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-slate-300 text-sm">Objectif quotidien:</span>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={localSettings.daily_goal_cards || 20}
                  onChange={(e) => handleChange('daily_goal_cards', parseInt(e.target.value))}
                  className="w-20 px-3 py-1 bg-slate-800 border border-slate-600 rounded text-white text-sm focus:border-indigo-500 focus:outline-none"
                />
                <span className="text-slate-400 text-sm">cartes</span>
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localSettings.goal_achieved_notification_enabled || false}
                  onChange={(e) => handleChange('goal_achieved_notification_enabled', e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-slate-700 rounded focus:ring-indigo-500"
                />
                <span className="text-slate-300 text-sm">Notification quand objectif atteint</span>
              </label>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          {onClose && (
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-all"
            >
              Annuler
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}
