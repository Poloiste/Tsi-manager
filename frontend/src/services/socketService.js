import { io } from 'socket.io-client';

/**
 * Socket.IO service for real-time messaging
 */
class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.currentChannel = null;
  }

  /**
   * Connect to the Socket.IO server
   */
  connect() {
    if (this.socket && this.isConnected) {
      return this.socket;
    }

    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';
    
    this.socket = io(API_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    this.socket.on('connect', () => {
      console.log('✅ Connected to WebSocket server');
      this.isConnected = true;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from WebSocket server:', reason);
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error);
    });

    this.socket.on('error', (error) => {
      console.error('❌ Socket error:', error);
    });

    return this.socket;
  }

  /**
   * Disconnect from the Socket.IO server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.currentChannel = null;
    }
  }

  /**
   * Join a channel
   * @param {string} channelId - Channel ID
   * @param {string} userId - User ID
   * @param {string} userName - User name
   */
  joinChannel(channelId, userId, userName) {
    if (!this.socket || !this.isConnected) {
      this.connect();
    }

    // Leave current channel if any
    if (this.currentChannel && this.currentChannel !== channelId) {
      this.leaveChannel(this.currentChannel);
    }

    this.socket.emit('join_channel', {
      channelId,
      userId,
      userName
    });

    this.currentChannel = channelId;
    console.log(`📥 Joining channel ${channelId}`);
  }

  /**
   * Leave a channel
   * @param {string} channelId - Channel ID
   */
  leaveChannel(channelId) {
    if (this.socket) {
      this.socket.emit('leave_channel', { channelId });
      console.log(`📤 Leaving channel ${channelId}`);
      
      if (this.currentChannel === channelId) {
        this.currentChannel = null;
      }
    }
  }

  /**
   * Send a message to the current channel
   * @param {string} channelId - Channel ID
   * @param {string} content - Message content
   */
  sendMessage(channelId, content) {
    if (!this.socket || !this.isConnected) {
      throw new Error('Not connected to server');
    }

    this.socket.emit('send_message', {
      channelId,
      content
    });
  }

  /**
   * Send typing indicator
   * @param {string} channelId - Channel ID
   * @param {boolean} isTyping - Whether user is typing
   */
  sendTypingIndicator(channelId, isTyping) {
    if (this.socket && this.isConnected) {
      this.socket.emit('typing', {
        channelId,
        isTyping
      });
    }
  }

  /**
   * Listen for new messages
   * @param {function} callback - Callback to handle new messages
   * @returns {function} Cleanup function
   */
  onNewMessage(callback) {
    if (!this.socket) {
      this.connect();
    }

    this.socket.on('new_message', callback);

    // Return cleanup function
    return () => {
      if (this.socket) {
        this.socket.off('new_message', callback);
      }
    };
  }

  /**
   * Listen for users joining
   * @param {function} callback - Callback to handle user joined event
   * @returns {function} Cleanup function
   */
  onUserJoined(callback) {
    if (!this.socket) {
      this.connect();
    }

    this.socket.on('user_joined', callback);

    return () => {
      if (this.socket) {
        this.socket.off('user_joined', callback);
      }
    };
  }

  /**
   * Listen for users leaving
   * @param {function} callback - Callback to handle user left event
   * @returns {function} Cleanup function
   */
  onUserLeft(callback) {
    if (!this.socket) {
      this.connect();
    }

    this.socket.on('user_left', callback);

    return () => {
      if (this.socket) {
        this.socket.off('user_left', callback);
      }
    };
  }

  /**
   * Listen for typing indicators
   * @param {function} callback - Callback to handle typing event
   * @returns {function} Cleanup function
   */
  onUserTyping(callback) {
    if (!this.socket) {
      this.connect();
    }

    this.socket.on('user_typing', callback);

    return () => {
      if (this.socket) {
        this.socket.off('user_typing', callback);
      }
    };
  }

  /**
   * Listen for errors
   * @param {function} callback - Callback to handle errors
   * @returns {function} Cleanup function
   */
  onError(callback) {
    if (!this.socket) {
      this.connect();
    }

    this.socket.on('error', callback);

    return () => {
      if (this.socket) {
        this.socket.off('error', callback);
      }
    };
  }

  /**
   * Get connection status
   * @returns {boolean} Connection status
   */
  getConnectionStatus() {
    return this.isConnected;
  }

  /**
   * Get current channel
   * @returns {string|null} Current channel ID
   */
  getCurrentChannel() {
    return this.currentChannel;
  }
}

// Export singleton instance
export const socketService = new SocketService();
