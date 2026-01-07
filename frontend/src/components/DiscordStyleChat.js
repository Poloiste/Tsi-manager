import React, { useState } from 'react';
import { CategoryChannelSidebar } from './CategoryChannelSidebar';
import { ChannelChat } from './ChannelChat';
import { GroupChatWithChannels } from './GroupChatWithChannels';
import { CreateCategoryChannelModal } from './CreateCategoryChannelModal';
import { useCategoryChannels } from '../hooks/useCategoryChannels';

/**
 * DiscordStyleChat - Main Discord-style chat interface with categories, channels, and groups
 * @param {string} userId - ID of the current user
 * @param {string} userName - Name of the current user
 * @param {Array} groups - List of study groups
 * @param {function} onCreateGroup - Callback to create a new group
 * @param {boolean} isAdmin - Whether the current user is an admin
 * @param {boolean} isDark - Dark mode flag
 */
export function DiscordStyleChat({ 
  userId, 
  userName, 
  groups = [], 
  onCreateGroup,
  isAdmin = false, 
  isDark = true 
}) {
  const [activeChannel, setActiveChannel] = useState(null);
  const [activeGroup, setActiveGroup] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createMode, setCreateMode] = useState('category'); // 'category' or 'channel'
  const [parentCategoryId, setParentCategoryId] = useState(null);
  
  const { 
    categories, 
    orphanChannels,
    isLoading, 
    error, 
    createCategory,
    createChannel
  } = useCategoryChannels(userId);

  // Auto-select first available channel when channels load
  React.useEffect(() => {
    if (!activeChannel && !activeGroup && categories.length > 0) {
      // Try to find first channel in first category
      const firstCategory = categories[0];
      if (firstCategory.children && firstCategory.children.length > 0) {
        setActiveChannel(firstCategory.children[0]);
      }
    } else if (!activeChannel && !activeGroup && orphanChannels.length > 0) {
      // Fallback to first orphan channel
      setActiveChannel(orphanChannels[0]);
    }
  }, [categories, orphanChannels, activeChannel, activeGroup]);

  const handleChannelSelect = (channel) => {
    setActiveChannel(channel);
    setActiveGroup(null); // Deselect any active group
  };
  
  const handleGroupSelect = (group) => {
    setActiveGroup(group);
    setActiveChannel(null); // Deselect any active channel
  };

  const handleCreateCategory = () => {
    setCreateMode('category');
    setParentCategoryId(null);
    setShowCreateModal(true);
  };

  const handleCreateChannel = (categoryId) => {
    setCreateMode('channel');
    setParentCategoryId(categoryId);
    setShowCreateModal(true);
  };

  const handleCreate = async ({ name, type, visibility, parentId }) => {
    if (createMode === 'category') {
      await createCategory(name, visibility);
    } else {
      await createChannel(name, type, parentId, visibility);
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
    <>
      <div className="flex h-full">
        {/* Category/Channel/Group sidebar */}
        <div className={`
          w-64 flex-shrink-0 border-r
          ${isDark ? 'border-slate-700' : 'border-gray-300'}
        `}>
          <CategoryChannelSidebar
            categories={categories}
            orphanChannels={orphanChannels}
            groups={groups}
            activeChannelId={activeChannel?.id}
            activeGroupId={activeGroup?.id}
            onChannelSelect={handleChannelSelect}
            onGroupSelect={handleGroupSelect}
            onCreateChannel={handleCreateChannel}
            onCreateCategory={handleCreateCategory}
            onCreateGroup={onCreateGroup}
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
          ) : activeGroup ? (
            <GroupChatWithChannels
              key={activeGroup.id} // Force remount when group changes
              groupId={activeGroup.id}
              groupName={activeGroup.name}
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
              <p className="text-lg font-semibold mb-2">Aucune discussion sélectionnée</p>
              <p className="text-sm">
                {categories.length === 0 && orphanChannels.length === 0 && groups.length === 0
                  ? isAdmin 
                    ? 'Créez une catégorie ou un groupe pour commencer'
                    : 'Aucune discussion disponible'
                  : 'Sélectionnez un salon ou un groupe pour commencer'
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Create Category/Channel Modal */}
      <CreateCategoryChannelModal
        show={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreate}
        mode={createMode}
        parentCategoryId={parentCategoryId}
        isDark={isDark}
      />
    </>
  );
}
