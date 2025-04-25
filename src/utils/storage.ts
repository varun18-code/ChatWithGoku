import { User, Chat, Message } from '../types';
import { v4 as uuidv4 } from 'uuid';

// Local storage keys
const USERS_KEY = 'chat-with-goku-users';
const CHATS_KEY = 'chat-with-goku-chats';
const CURRENT_USER_KEY = 'chat-with-goku-current-user';
const USER_PASSWORDS_KEY = 'chat-with-goku-user-passwords';

// Get all users
export const getUsers = (): User[] => {
  const users = localStorage.getItem(USERS_KEY);
  return users ? JSON.parse(users) : [];
};

// Save users to local storage
export const saveUsers = (users: User[]): void => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

// Get all chats
export const getChats = (): Chat[] => {
  const chats = localStorage.getItem(CHATS_KEY);
  return chats ? JSON.parse(chats) : [];
};

// Save chats to local storage
export const saveChats = (chats: Chat[]): void => {
  try {
    localStorage.setItem(CHATS_KEY, JSON.stringify(chats));
  } catch (error) {
    console.error('Failed to save chats:', error);
    throw new Error('Failed to save chat messages');
  }
};

// Get current user
export const getCurrentUser = (): User | null => {
  const user = localStorage.getItem(CURRENT_USER_KEY);
  return user ? JSON.parse(user) : null;
};

// Save current user
export const saveCurrentUser = (user: User): void => {
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
};

// Clear current user (logout)
export const clearCurrentUser = (): void => {
  localStorage.removeItem(CURRENT_USER_KEY);
};

// Register a new user
export const registerUser = (name: string, email: string, password: string): User => {
  const users = getUsers();
  
  if (users.some(user => user.email === email)) {
    throw new Error('Email already registered');
  }
  
  const newUser: User = {
    id: uuidv4(),
    name,
    email,
    lastSeen: new Date(),
    online: true
  };
  
  const usersWithPasswords = JSON.parse(localStorage.getItem(USER_PASSWORDS_KEY) || '{}');
  usersWithPasswords[email] = password;
  localStorage.setItem(USER_PASSWORDS_KEY, JSON.stringify(usersWithPasswords));
  
  users.push(newUser);
  saveUsers(users);
  saveCurrentUser(newUser);
  
  return newUser;
};

// Login a user
export const loginUser = (email: string, password: string): User => {
  const users = getUsers();
  const user = users.find(u => u.email === email);
  
  if (!user) {
    throw new Error('User not found');
  }
  
  const usersWithPasswords = JSON.parse(localStorage.getItem(USER_PASSWORDS_KEY) || '{}');
  const storedPassword = usersWithPasswords[email];
  
  if (storedPassword !== password) {
    throw new Error('Invalid password');
  }
  
  const updatedUser = {
    ...user,
    lastSeen: new Date(),
    online: true
  };
  
  const updatedUsers = users.map(u => u.id === updatedUser.id ? updatedUser : u);
  saveUsers(updatedUsers);
  saveCurrentUser(updatedUser);
  
  return updatedUser;
};

// Create or get a chat between two users
export const getOrCreateChat = (user1Id: string, user2Id: string): Chat => {
  const chats = getChats();
  
  const existingChat = chats.find(chat => 
    chat.participants.includes(user1Id) && 
    chat.participants.includes(user2Id)
  );
  
  if (existingChat) {
    return existingChat;
  }
  
  const newChat: Chat = {
    id: uuidv4(),
    participants: [user1Id, user2Id],
    messages: [],
    lastMessageTimestamp: new Date()
  };
  
  try {
    chats.push(newChat);
    saveChats(chats);
    return newChat;
  } catch (error) {
    console.error('Failed to create chat:', error);
    throw new Error('Failed to create chat');
  }
};

// Send a message
export const sendMessage = (
  senderId: string, 
  receiverId: string, 
  content: string, 
  encrypted: boolean = true,
  selfDestruct?: { enabled: boolean, timeout: number }
): Message => {
  try {
    const chats = getChats();
    
    let chat = chats.find(c => 
      c.participants.includes(senderId) && 
      c.participants.includes(receiverId)
    );
    
    if (!chat) {
      chat = {
        id: uuidv4(),
        participants: [senderId, receiverId],
        messages: [],
        lastMessageTimestamp: new Date()
      };
      chats.push(chat);
    }
    
    const message: Message = {
      id: uuidv4(),
      senderId,
      receiverId,
      content,
      timestamp: new Date(),
      status: 'sent',
      encrypted,
      selfDestruct
    };
    
    chat.messages.push(message);
    chat.lastMessageTimestamp = message.timestamp;
    
    saveChats(chats);
    return message;
  } catch (error) {
    console.error('Failed to send message:', error);
    throw new Error('Failed to send message');
  }
};

// Update message status
export const updateMessageStatus = (messageId: string, status: 'delivered' | 'seen'): void => {
  try {
    const chats = getChats();
    
    const updatedChats = chats.map(chat => ({
      ...chat,
      messages: chat.messages.map(message => 
        message.id === messageId ? { ...message, status } : message
      )
    }));
    
    saveChats(updatedChats);
  } catch (error) {
    console.error('Failed to update message status:', error);
  }
};

// Get a chat by ID
export const getChatById = (chatId: string): Chat | undefined => {
  try {
    const chats = getChats();
    return chats.find(chat => chat.id === chatId);
  } catch (error) {
    console.error('Failed to get chat:', error);
    return undefined;
  }
};

// Get chat between two users
export const getChatByUsers = (user1Id: string, user2Id: string): Chat | undefined => {
  try {
    const chats = getChats();
    return chats.find(chat => 
      chat.participants.includes(user1Id) && 
      chat.participants.includes(user2Id)
    );
  } catch (error) {
    console.error('Failed to get chat:', error);
    return undefined;
  }
};