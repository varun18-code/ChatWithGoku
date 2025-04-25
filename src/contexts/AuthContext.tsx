import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { User, AuthState } from '../types';
import { getCurrentUser, registerUser, loginUser, clearCurrentUser, saveCurrentUser, getUsers, saveUsers } from '../utils/storage';
import { verifyZKP } from '../utils/encryption';

// Initial state
const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  loading: true,
  error: null
};

// Action types
type AuthAction = 
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'REGISTER_SUCCESS'; payload: User }
  | { type: 'LOGOUT' }
  | { type: 'AUTH_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'LOADING' }
  | { type: 'LOADED' };

// Reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
    case 'REGISTER_SUCCESS':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload,
        loading: false,
        error: null
      };
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        loading: false
      };
    case 'AUTH_ERROR':
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

// Create context
interface AuthContextType {
  state: AuthState;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check if user is logged in on mount
  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      dispatch({ type: 'LOGIN_SUCCESS', payload: user });
    } else {
      dispatch({ type: 'LOADED' });
    }
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    dispatch({ type: 'LOADING' });
    try {
      // Simulate ZKP authentication
      verifyZKP({ email, password });
      
      const user = loginUser(email, password);
      dispatch({ type: 'LOGIN_SUCCESS', payload: user });
    } catch (error) {
      dispatch({ 
        type: 'AUTH_ERROR', 
        payload: error instanceof Error ? error.message : 'Login failed' 
      });
    }
  };

  // Register function
  const register = async (name: string, email: string, password: string) => {
    dispatch({ type: 'LOADING' });
    try {
      const user = registerUser(name, email, password);
      
      // Ensure the user is added to the users list with online status
      const users = getUsers();
      const updatedUsers = users.map(u => u.id === user.id ? user : u);
      if (!updatedUsers.some(u => u.id === user.id)) {
        updatedUsers.push(user);
      }
      saveUsers(updatedUsers);
      
      dispatch({ type: 'REGISTER_SUCCESS', payload: user });
    } catch (error) {
      dispatch({ 
        type: 'AUTH_ERROR', 
        payload: error instanceof Error ? error.message : 'Registration failed' 
      });
    }
  };

  // Logout function
  const logout = () => {
    clearCurrentUser();
    dispatch({ type: 'LOGOUT' });
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // Update user status on window focus/blur
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (state.user) {
        const updatedUser = {
          ...state.user,
          online: document.visibilityState === 'visible',
          lastSeen: new Date()
        };
        saveCurrentUser(updatedUser);
        
        // Update user in the users list to ensure visibility to other users
        const users = getUsers();
        const updatedUsers = users.map(u => u.id === updatedUser.id ? updatedUser : u);
        saveUsers(updatedUsers);
        
        dispatch({ type: 'LOGIN_SUCCESS', payload: updatedUser });
      }
    };
    
    // Throttle function to prevent excessive updates causing freezing
    const throttledVisibilityChange = () => {
      let lastCall = 0;
      return () => {
        const now = Date.now();
        if (now - lastCall >= 1000) { // Limit to once per second
          lastCall = now;
          handleVisibilityChange();
        }
      };
    };
    
    const throttled = throttledVisibilityChange();

    document.addEventListener('visibilitychange', throttled);
    window.addEventListener('focus', throttled);
    window.addEventListener('blur', throttled);

    return () => {
      document.removeEventListener('visibilitychange', throttled);
      window.removeEventListener('focus', throttled);
      window.removeEventListener('blur', throttled);
    };
  }, [state.user]);

  return (
    <AuthContext.Provider value={{ state, login, register, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};