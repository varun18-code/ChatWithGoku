export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  lastSeen?: Date;
  online?: boolean;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: Date;
  status: 'sent' | 'delivered' | 'seen';
  encrypted: boolean;
  selfDestruct?: {
    enabled: boolean;
    timeout: number;
  };
}

export interface Chat {
  id: string;
  participants: string[];
  messages: Message[];
  lastMessageTimestamp?: Date;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface ChatState {
  chats: Chat[];
  activeChat: string | null;
  users: User[];
  loading: boolean;
  error: string | null;
}