import React, { useState, useRef, useEffect } from 'react';
import { Send, Trash2, Loader } from 'lucide-react';
import { useChannelMessages } from '../hooks/useChannelMessages';

/**
 * ChannelChat component - Chat interface for a specific channel
 * @param {string} channelId - ID of the channel
 * @param {string} channelName - Name of the channel
 * @param {string} userId - ID of the current user
 * @param {string} userName - Name of the current user
 * @param {boolean} isDark - Dark mode flag
 */
export function ChannelChat({ channelId, channelName, userId, userName, isDark = true }) {
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const { 
    messages, 
    isLoading, 
    error, 
    hasMore,
    sendMessage, 
    deleteMessage,
    loadMoreMessages,
    sendTypingIndicator,
    typingUsers
  } = useChannelMessages(channelId, userId, userName);

  // Auto-scroll to bottom when new messages arrive (only if already at bottom)
  useEffect(() => {
    if (isAtBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isAtBottom]);

  // Check if user is at the bottom of messages
  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isBottom = scrollHeight - scrollTop - clientHeight < 100;
    setIsAtBottom(isBottom);

    // Load more messages when scrolling to top
    if (scrollTop < 100 && hasMore && !isLoading) {
      loadMoreMessages();
    }
  };

  // Handle sending message
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
      
      // Stop typing indicator
      sendTypingIndicator(false);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  // Handle message deletion
  const handleDeleteMessage = async (messageId) => {
    try {
      await deleteMessage(messageId);
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  // Handle typing indicator
  const handleInputChange = (e) => {
    setInputMessage(e.target.value);

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Send typing indicator
    if (e.target.value.trim()) {
      sendTypingIndicator(true);
      
      // Stop typing indicator after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        sendTypingIndicator(false);
      }, 2000);
    } else {
      sendTypingIndicator(false);
    }
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    // If today
    if (diff < 24 * 60 * 60 * 1000 && date.getDate() === now.getDate()) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    }
    
    // If yesterday
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.getDate() === yesterday.getDate() && 
        date.getMonth() === yesterday.getMonth() && 
        date.getFullYear() === yesterday.getFullYear()) {
      return `Hier ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // Otherwise show full date
    return date.toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Channel header */}
      <div className={`
        px-4 py-3 border-b
        ${isDark ? 'border-slate-700 bg-slate-800' : 'border-gray-300 bg-white'}
      `}>
        <h2 className={`
          font-semibold text-lg
          ${isDark ? 'text-white' : 'text-gray-900'}
        `}>
          # {channelName}
        </h2>
      </div>

      {/* Error display */}
      {error && (
        <div className={`
          mx-4 mt-4 p-3 rounded-lg border
          ${isDark 
            ? 'bg-red-900/20 border-red-500/30 text-red-400' 
            : 'bg-red-100 border-red-300 text-red-700'
          }
        `}>
          {error}
        </div>
      )}

      {/* Messages container */}
      <div 
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
      >
        {/* Load more indicator */}
        {hasMore && (
          <div className="flex justify-center py-2">
            {isLoading ? (
              <Loader className={`w-5 h-5 animate-spin ${isDark ? 'text-slate-400' : 'text-gray-600'}`} />
            ) : (
              <button
                onClick={loadMoreMessages}
                className={`
                  text-sm px-4 py-2 rounded-lg transition-colors
                  ${isDark 
                    ? 'text-indigo-400 hover:bg-slate-700' 
                    : 'text-indigo-600 hover:bg-gray-100'
                  }
                `}
              >
                Charger plus de messages
              </button>
            )}
          </div>
        )}

        {/* Messages */}
        {messages.length === 0 && !isLoading ? (
          <div className={`
            text-center py-12
            ${isDark ? 'text-slate-400' : 'text-gray-600'}
          `}>
            <div className="text-6xl mb-4">💬</div>
            <p className="text-lg font-semibold mb-2">Aucun message</p>
            <p className="text-sm">Soyez le premier à envoyer un message dans ce canal !</p>
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
                    {/* Delete button (own messages only) */}
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
                    
                    {/* User name (for others' messages) */}
                    {!isOwnMessage && (
                      <p className={`
                        text-xs font-semibold mb-1
                        ${isDark ? 'text-slate-300' : 'text-gray-700'}
                      `}>
                        {message.user_name || 'Utilisateur'}
                      </p>
                    )}
                    
                    {/* Message content */}
                    <p className="whitespace-pre-wrap break-words">
                      {message.content || message.message}
                    </p>
                    
                    {/* Timestamp */}
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

      {/* Typing indicator */}
      {typingUsers.length > 0 && (
        <div className={`
          px-4 py-2 text-sm italic
          ${isDark ? 'text-slate-400' : 'text-gray-600'}
        `}>
          {typingUsers.length === 1 
            ? `${typingUsers[0]} est en train d'écrire...`
            : `${typingUsers.join(', ')} sont en train d'écrire...`
          }
        </div>
      )}

      {/* Message input form */}
      <div className={`
        p-4 border-t
        ${isDark ? 'border-slate-700 bg-slate-800' : 'border-gray-300 bg-white'}
      `}>
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={handleInputChange}
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
            maxLength={5000}
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
    </div>
  );
}
