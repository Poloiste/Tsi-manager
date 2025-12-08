import React, { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

/**
 * Composant Toast - notification temporaire
 * @param {string} message - Message à afficher
 * @param {string} type - Type de toast ('info', 'success', 'warning', 'error')
 * @param {Function} onClose - Callback pour fermer le toast
 * @param {number} duration - Durée d'affichage en ms (défaut: 5000)
 */
export function Toast({ message, type = 'info', onClose, duration = 5000 }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Slide in animation
    setTimeout(() => setIsVisible(true), 10);

    // Auto dismiss
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      if (onClose) onClose();
    }, 300); // Match animation duration
  };

  const getToastStyle = () => {
    const styles = {
      info: {
        bg: 'bg-blue-900/90 border-blue-500',
        icon: <Info className="w-5 h-5 text-blue-400" />,
        iconBg: 'bg-blue-500/20'
      },
      success: {
        bg: 'bg-green-900/90 border-green-500',
        icon: <CheckCircle className="w-5 h-5 text-green-400" />,
        iconBg: 'bg-green-500/20'
      },
      warning: {
        bg: 'bg-yellow-900/90 border-yellow-500',
        icon: <AlertTriangle className="w-5 h-5 text-yellow-400" />,
        iconBg: 'bg-yellow-500/20'
      },
      error: {
        bg: 'bg-red-900/90 border-red-500',
        icon: <AlertCircle className="w-5 h-5 text-red-400" />,
        iconBg: 'bg-red-500/20'
      }
    };
    return styles[type] || styles.info;
  };

  const style = getToastStyle();

  return (
    <div
      className={`
        ${style.bg} border-l-4 rounded-lg shadow-2xl p-4 min-w-[320px] max-w-md backdrop-blur-sm
        transition-all duration-300 ease-out
        ${isVisible && !isLeaving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      <div className="flex items-start gap-3">
        <div className={`${style.iconBg} rounded-full p-1.5 flex-shrink-0`}>
          {style.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium leading-relaxed">
            {message}
          </p>
        </div>
        <button
          onClick={handleClose}
          className="text-slate-400 hover:text-white transition-colors flex-shrink-0 ml-2"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/**
 * Composant ToastContainer - conteneur pour afficher plusieurs toasts empilés
 * @param {Array} toasts - Liste des toasts à afficher
 * @param {Function} onRemove - Callback pour retirer un toast
 */
export function ToastContainer({ toasts = [], onRemove }) {
  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => onRemove(toast.id)}
            duration={toast.duration}
          />
        </div>
      ))}
    </div>
  );
}

/**
 * Hook pour gérer les toasts
 * @returns {Object} Fonctions pour gérer les toasts
 */
export function useToast() {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info', duration = 5000) => {
    const id = Date.now() + Math.random();
    const newToast = { id, message, type, duration };
    
    setToasts(prev => [...prev, newToast]);
    
    return id;
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const showSuccess = (message, duration) => addToast(message, 'success', duration);
  const showError = (message, duration) => addToast(message, 'error', duration);
  const showInfo = (message, duration) => addToast(message, 'info', duration);
  const showWarning = (message, duration) => addToast(message, 'warning', duration);

  return {
    toasts,
    addToast,
    removeToast,
    showSuccess,
    showError,
    showInfo,
    showWarning
  };
}
