import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { ChatState, Message, User, Chat } from '../types';
import { getUsers, getChats, saveChats, getOrCreateChat, sendMessage, updateMessageStatus, getChatById } from '../utils/storage';
import { useAuth } from './AuthContext';
import { encryptMessage, decryptMessage } from '../utils/encryption';

const initialState: ChatState = {
  chats: [],
  activeChat: null,
  users: [],
  loading: true,
  error: null
};

type ChatAction = 
  | { type: 'SET_CHATS'; payload: Chat[] }
  | { type: 'SET_ACTIVE_CHAT'; payload: string }
  | { type: 'SET_USERS'; payload: User[] }
  | { type: 'SEND_MESSAGE'; payload: Message }
  | { type: 'UPDATE_MESSAGE_STATUS'; payload: { messageId: string; status: 'delivered' | 'seen' } }
  | { type: 'CHAT_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'LOADING' }
  | { type: 'LOADED' };

const chatReducer = (state: ChatState, action: ChatAction): ChatState => {
  switch (action.type) {
    case 'SET_CHATS':
      return {
        ...state,
        chats: action.payload,
        loading: false
      };
    case 'SET_ACTIVE_CHAT':
      return {
        ...state,
        activeChat: action.payload
      };
    case 'SET_USERS':
      return {
        ...state,
        users: action.payload,
        loading: false
      };
    case 'SEND_MESSAGE': {
      try {
        const updatedChats = state.chats.map(chat => {
          if (
            chat.participants.includes(action.payload.senderId) && 
            chat.participants.includes(action.payload.receiverId)
          ) {
            return {
              ...chat,
              messages: [...chat.messages, action.payload],
              lastMessageTimestamp: action.payload.timestamp
            };
          }
          return chat;
        });

        const chatExists = updatedChats.some(chat => 
          chat.participants.includes(action.payload.senderId) && 
          chat.participants.includes(action.payload.receiverId)
        );

        if (!chatExists) {
          updatedChats.push({
            id: `chat-${Date.now()}`,
            participants: [action.payload.senderId, action.payload.receiverId],
            messages: [action.payload],
            lastMessageTimestamp: action.payload.timestamp
          });
        }

        saveChats(updatedChats);
        return {
          ...state,
          chats: updatedChats,
          error: null
        };
      } catch (error) {
        console.error('Error in SEND_MESSAGE reducer:', error);
        return {
          ...state,
          error: 'Failed to send message'
        };
      }
    }
    case 'UPDATE_MESSAGE_STATUS': {
      try {
        const updatedChats = state.chats.map(chat => ({
          ...chat,
          messages: chat.messages.map(message => 
            message.id === action.payload.messageId
              ? { ...message, status: action.payload.status }
              : message
          )
        }));

        saveChats(updatedChats);
        return {
          ...state,
          chats: updatedChats,
          error: null
        };
      } catch (error) {
        console.error('Error in UPDATE_MESSAGE_STATUS reducer:', error);
        return state;
      }
    }
    case 'CHAT_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };
    case 'LOADING':
      return {
        ...state,
        loading: true
      };
    case 'LOADED':
      return {
        ...state,
        loading: false
      };
    default:
      return state;
  }
};

interface ChatContextType {
  state: ChatState;
  sendNewMessage: (receiverId: string, content: string, encrypted?: boolean, selfDestruct?: { enabled: boolean, timeout: number }) => void;
  setActiveChat: (chatId: string) => void;
  markMessageAsSeen: (messageId: string) => void;
  getReceiverUser: (chatId: string) => User | undefined;
  clearError: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const { state: authState } = useAuth();

  useEffect(() => {
    if (authState.isAuthenticated && authState.user) {
      try {
        dispatch({ type: 'LOADING' });
        
        const users = getUsers().filter(user => user.id !== authState.user?.id);
        dispatch({ type: 'SET_USERS', payload: users });
        
        const chats = getChats().filter(chat => 
          chat.participants.includes(authState.user.id)
        );
        
        const processedChats = chats.map(chat => ({
          ...chat,
          messages: chat.messages.map(message => {
            if (message.encrypted) {
              try {
                if (message.receiverId === authState.user?.id || message.senderId === authState.user?.id) {
                  return {
                    ...message,
                    content: decryptMessage(message.content)
                  };
                }
              } catch (error) {
                console.error('Failed to decrypt message:', error);
              }
            }
            return message;
          })
        }));
        
        dispatch({ type: 'SET_CHATS', payload: processedChats });
      } catch (error) {
        console.error('Error loading initial data:', error);
        dispatch({ type: 'CHAT_ERROR', payload: 'Failed to load chat data' });
      }
    }
  }, [authState.isAuthenticated, authState.user]);

  useEffect(() => {
    if (authState.isAuthenticated && authState.user) {
      const interval = setInterval(() => {
        try {
          const chats = getChats().filter(chat => 
            chat.participants.includes(authState.user!.id)
          );
          
          const processedChats = chats.map(chat => ({
            ...chat,
            messages: chat.messages.map(message => {
              if (message.encrypted) {
                try {
                  if (message.receiverId === authState.user?.id || message.senderId === authState.user?.id) {
                    return {
                      ...message,
                      content: decryptMessage(message.content)
                    };
                  }
                } catch (error) {
                  console.error('Failed to decrypt message:', error);
                }
              }
              return message;
            })
          }));
          
          dispatch({ type: 'SET_CHATS', payload: processedChats });
          
          processedChats.forEach(chat => {
            chat.messages.forEach(message => {
              if (
                message.receiverId === authState.user?.id && 
                message.status === 'sent'
              ) {
                updateMessageStatus(message.id, 'delivered');
              }
            });
          });
        } catch (error) {
          console.error('Error in polling interval:', error);
        }
      }, 2000);
      
      return () => clearInterval(interval);
    }
  }, [authState.isAuthenticated, authState.user]);

  const sendNewMessage = async (
    receiverId: string, 
    content: string, 
    encrypted: boolean = true,
    selfDestruct?: { enabled: boolean, timeout: number }
  ) => {
    if (!authState.user) return;
    
    try {
      const messageContent = encrypted ? encryptMessage(content) : content;
      
      const message = sendMessage(
        authState.user.id, 
        receiverId, 
        messageContent, 
        encrypted,
        selfDestruct
      );
      
      const uiMessage = {
        ...message,
        content
      };
      
      dispatch({ type: 'SEND_MESSAGE', payload: uiMessage });
      
      if (selfDestruct?.enabled) {
        setTimeout(() => {
          try {
            const chats = getChats();
            const updatedChats = chats.map(chat => ({
              ...chat,
              messages: chat.messages.filter(msg => msg.id !== message.id)
            }));
            
            saveChats(updatedChats);
            dispatch({ type: 'SET_CHATS', payload: updatedChats });
          } catch (error) {
            console.error('Error handling self-destruct:', error);
          }
        }, selfDestruct.timeout * 1000);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      dispatch({ 
        type: 'CHAT_ERROR', 
        payload: 'Failed to send message'
      });
    }
  };

  const setActiveChat = (chatId: string) => {
    try {
      dispatch({ type: 'SET_ACTIVE_CHAT', payload: chatId });
      
      if (authState.user) {
        const chat = getChatById(chatId);
        if (chat) {
          chat.messages.forEach(message => {
            if (
              message.receiverId === authState.user?.id && 
              message.status !== 'seen'
            ) {
              updateMessageStatus(message.id, 'seen');
              dispatch({ 
                type: 'UPDATE_MESSAGE_STATUS', 
                payload: { messageId: message.id, status: 'seen' } 
              });
            }
          });
        }
      }
    } catch (error) {
      console.error('Error setting active chat:', error);
    }
  };

  const markMessageAsSeen = (messageId: string) => {
    try {
      updateMessageStatus(messageId, 'seen');
      dispatch({ 
        type: 'UPDATE_MESSAGE_STATUS', 
        payload: { messageId, status: 'seen' } 
      });
    } catch (error) {
      console.error('Error marking message as seen:', error);
    }
  };

  const getReceiverUser = (chatId: string): User | undefined => {
    try {
      const chat = state.chats.find(c => c.id === chatId);
      if (!chat || !authState.user) return undefined;
      
      const receiverId = chat.participants.find(id => id !== authState.user?.id);
      return state.users.find(user => user.id === receiverId);
    } catch (error) {
      console.error('Error getting receiver user:', error);
      return undefined;
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  return (
    <ChatContext.Provider value={{ 
      state, 
      sendNewMessage, 
      setActiveChat, 
      markMessageAsSeen,
      getReceiverUser,
      clearError 
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};