import React from 'react';
import { User } from '../../types';
import { useChat } from '../../contexts/ChatContext';
import { format } from 'date-fns';
import { getOrCreateChat } from '../../utils/storage';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  closeSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, closeSidebar }) => {
  const { state: chatState, setActiveChat } = useChat();
  const { state: authState } = useAuth();
  
  // Helper function to get last message preview
  const getLastMessage = (chatId: string) => {
    const chat = chatState.chats.find(c => c.id === chatId);
    if (!chat || chat.messages.length === 0) return null;
    
    const lastMessage = chat.messages[chat.messages.length - 1];
    return {
      content: lastMessage.content.length > 25 
        ? `${lastMessage.content.substring(0, 25)}...` 
        : lastMessage.content,
      timestamp: lastMessage.timestamp,
      status: lastMessage.status,
      isSentByMe: lastMessage.senderId === authState.user?.id
    };
  };
  
  // Helper function to get chat name
  const getChatName = (chat: any) => {
    if (!authState.user) return '';
    
    const otherUserId = chat.participants.find(
      (id: string) => id !== authState.user?.id
    );
    
    const otherUser = chatState.users.find(user => user.id === otherUserId);
    return otherUser?.name || 'Unknown User';
  };
  
  // Handle chat selection
  const handleChatSelect = (userId: string) => {
    if (!authState.user) return;
    
    // Find or create chat
    const chat = getOrCreateChat(authState.user.id, userId);
    setActiveChat(chat.id);
    
    // Close sidebar on mobile
    closeSidebar();
  };
  
  return (
    <div 
      className={`fixed md:relative top-0 left-0 h-full w-72 bg-white shadow-md z-10 transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}
    >
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Contacts</h2>
      </div>
      
      <div className="overflow-y-auto h-[calc(100%-60px)]">
        {chatState.users.map(user => {
          // Find chat with this user if exists
          const chat = chatState.chats.find(c => 
            c.participants.includes(user.id) && 
            c.participants.includes(authState.user?.id || '')
          );
          
          const lastMessage = chat ? getLastMessage(chat.id) : null;
          
          return (
            <div
              key={user.id}
              className={`p-3 border-b hover:bg-gray-100 cursor-pointer ${
                chat && chat.id === chatState.activeChat ? 'bg-gray-100' : ''
              }`}
              onClick={() => handleChatSelect(user.id)}
            >
              <div className="flex items-start">
                <div className="relative mr-3">
                  <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                    <span className="text-gray-600 font-medium">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span 
                    className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${
                      user.online ? 'bg-green-500' : 'bg-gray-400'
                    }`}
                  ></span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {user.name}
                    </h3>
                    {lastMessage && (
                      <span className="text-xs text-gray-500">
                        {format(new Date(lastMessage.timestamp), 'HH:mm')}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate flex items-center">
                    {lastMessage ? (
                      <>
                        {lastMessage.isSentByMe && (
                          <span className="mr-1">
                            {lastMessage.status === 'sent' && '✓'}
                            {lastMessage.status === 'delivered' && '✓✓'}
                            {lastMessage.status === 'seen' && (
                              <span className="text-blue-500">✓✓</span>
                            )}
                          </span>
                        )}
                        {lastMessage.content}
                      </>
                    ) : (
                      'Start a conversation'
                    )}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        
        {chatState.users.length === 0 && (
          <div className="p-4 text-center text-gray-500">
            No contacts available. Invite your friends to join!
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;