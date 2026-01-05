import React, { useState } from 'react';
import { ChannelList } from './ChannelList';
import { ChannelChat } from './ChannelChat';
import { useChannels } from '../hooks/useChannels';

/**
 * GroupChatWithChannels - Main chat interface with channels for a group
 * @param {string} groupId - ID of the group
 * @param {string} userId - ID of the current user
 * @param {string} userName - Name of the current user
 * @param {boolean} isAdmin - Whether the current user is an admin
 * @param {boolean} isDark - Dark mode flag
 */
export function GroupChatWithChannels({ groupId, userId, userName, isAdmin = false, isDark = true }) {
  const [activeChannel, setActiveChannel] = useState(null);
  
  const { 
    channels, 
    isLoading, 
    error, 
    createChannel 
  } = useChannels(groupId, userId);

  // Auto-select first channel when channels load
  React.useEffect(() => {
    if (channels.length > 0 && !activeChannel) {
      setActiveChannel(channels[0]);
    }
  }, [channels, activeChannel]);

  const handleChannelSelect = (channel) => {
    setActiveChannel(channel);
  };

  const handleCreateChannel = async (channelName) => {
    try {
      const newChannel = await createChannel(channelName);
      // Auto-select the newly created channel
      setActiveChannel(newChannel);
    } catch (error) {
      console.error('Error creating channel:', error);
      throw error;
    }
  };

  if (error) {
    return (
      <div className={`
        p-6 text-center
        ${isDark ? 'text-slate-400' : 'text-gray-600'}
      `}>
        <p className="text-red-500 mb-2">Erreur</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Channel sidebar */}
      <div className={`
        w-64 flex-shrink-0 border-r
        ${isDark ? 'border-slate-700' : 'border-gray-300'}
      `}>
        <ChannelList
          channels={channels}
          activeChannelId={activeChannel?.id}
          onChannelSelect={handleChannelSelect}
          onCreateChannel={handleCreateChannel}
          isAdmin={isAdmin}
          isLoading={isLoading}
          isDark={isDark}
        />
      </div>

      {/* Chat area */}
      <div className="flex-1">
        {activeChannel ? (
          <ChannelChat
            key={activeChannel.id} // Force remount when channel changes
            channelId={activeChannel.id}
            channelName={activeChannel.name}
            userId={userId}
            userName={userName}
            isDark={isDark}
          />
        ) : (
          <div className={`
            flex flex-col items-center justify-center h-full
            ${isDark ? 'text-slate-400' : 'text-gray-600'}
          `}>
            <div className="text-6xl mb-4">💬</div>
            <p className="text-lg font-semibold mb-2">Aucun canal sélectionné</p>
            <p className="text-sm">
              {channels.length === 0 
                ? isAdmin 
                  ? 'Créez un canal pour commencer'
                  : 'Aucun canal disponible'
                : 'Sélectionnez un canal pour commencer à chatter'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
