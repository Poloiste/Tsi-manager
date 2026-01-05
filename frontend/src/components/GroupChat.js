import React, { useState, useRef, useEffect } from 'react';
import { Send, Trash2 } from 'lucide-react';
import { useGroupChat } from '../hooks/useGroupChat';

/**
 * Composant GroupChat - Interface de chat pour un groupe
 * @param {string} groupId - ID du groupe
 * @param {string} userId - ID de l'utilisateur connecté
 * @param {string} userName - Nom de l'utilisateur connecté
 * @param {boolean} isDark - Mode sombre
 */
export function GroupChat({ groupId, userId, userName, isDark = true }) {
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const { messages, isLoading, error, sendMessage, deleteMessage } = useGroupChat(groupId, userId, userName);

  // Auto-scroll vers le bas quand de nouveaux messages arrivent
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || isSending) {
      return;
    }

    setIsSending(true);
    try {
      await sendMessage(inputMessage);
      setInputMessage('');
      inputRef.current?.focus();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      await deleteMessage(messageId);
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    // Si c'est aujourd'hui
    if (diff < 24 * 60 * 60 * 1000 && date.getDate() === now.getDate()) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    }
    
    // Si c'est hier - calcul correct pour les limites de mois
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.getDate() === yesterday.getDate() && 
        date.getMonth() === yesterday.getMonth() && 
        date.getFullYear() === yesterday.getFullYear()) {
      return `Hier ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // Sinon afficher la date complète
    return date.toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading && messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className={`text-center ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p>Chargement des messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Zone d'erreur */}
      {error && (
        <div className={`
          mb-4 p-3 rounded-lg border
          ${isDark 
            ? 'bg-red-900/20 border-red-500/30 text-red-400' 
            : 'bg-red-100 border-red-300 text-red-700'
          }
        `}>
          {error}
        </div>
      )}

      {/* Liste des messages */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-3">
        {messages.length === 0 ? (
          <div className={`
            text-center py-12
            ${isDark ? 'text-slate-400' : 'text-gray-600'}
          `}>
            <div className="text-6xl mb-4">💬</div>
            <p className="text-lg font-semibold mb-2">Aucun message</p>
            <p className="text-sm">Soyez le premier à envoyer un message dans ce groupe !</p>
          </div>
        ) : (
          <>
            {messages.map((message) => {
              const isOwnMessage = message.user_id === userId;
              
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`
                      max-w-[80%] rounded-lg p-3 relative group
                      ${isOwnMessage
                        ? isDark
                          ? 'bg-indigo-600 text-white'
                          : 'bg-indigo-500 text-white'
                        : isDark
                          ? 'bg-slate-700 text-slate-100'
                          : 'bg-gray-200 text-gray-900'
                      }
                    `}
                  >
                    {/* Bouton de suppression (uniquement pour ses propres messages) */}
                    {isOwnMessage && (
                      <button
                        onClick={() => handleDeleteMessage(message.id)}
                        className={`
                          absolute -top-2 -right-2 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity
                          ${isDark 
                            ? 'bg-red-600 hover:bg-red-700 text-white' 
                            : 'bg-red-500 hover:bg-red-600 text-white'
                          }
                        `}
                        title="Supprimer ce message"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                    
                    {/* Nom de l'utilisateur (si ce n'est pas son propre message) */}
                    {!isOwnMessage && (
                      <p className={`
                        text-xs font-semibold mb-1
                        ${isDark ? 'text-slate-300' : 'text-gray-700'}
                      `}>
                        {message.user_name || 'Utilisateur'}
                      </p>
                    )}
                    
                    {/* Contenu du message */}
                    <p className="whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                    
                    {/* Heure */}
                    <p className={`
                      text-xs mt-1
                      ${isOwnMessage
                        ? 'text-indigo-200'
                        : isDark
                          ? 'text-slate-400'
                          : 'text-gray-600'
                      }
                    `}>
                      {formatTime(message.created_at)}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Formulaire d'envoi */}
      <form onSubmit={handleSendMessage} className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Écrivez un message..."
          disabled={isSending}
          className={`
            flex-1 px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-500
            ${isDark
              ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400'
              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
            }
            ${isSending ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          maxLength={1000}
        />
        <button
          type="submit"
          disabled={!inputMessage.trim() || isSending}
          className={`
            px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2
            ${!inputMessage.trim() || isSending
              ? isDark
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-500 hover:to-purple-500'
            }
          `}
        >
          <Send className="w-5 h-5" />
          {isSending ? 'Envoi...' : 'Envoyer'}
        </button>
      </form>
    </div>
  );
}
