import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';
import { Send, Lock, Clock, Image } from 'lucide-react';
import { encryptMessage } from '../../utils/encryption';

const ChatWindow: React.FC = () => {
  const [message, setMessage] = useState('');
  const [encrypted, setEncrypted] = useState(true);
  const [selfDestruct, setSelfDestruct] = useState(false);
  const [selfDestructTime, setSelfDestructTime] = useState(60); // seconds
  const [showSteganography, setShowSteganography] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { state: chatState, sendNewMessage, getReceiverUser } = useChat();
  const { state: authState } = useAuth();
  
  // Auto scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatState.chats, chatState.activeChat]);
  
  // Get active chat
  const activeChat = chatState.chats.find(chat => chat.id === chatState.activeChat);
  
  // Get receiver user
  const receiver = chatState.activeChat ? getReceiverUser(chatState.activeChat) : undefined;
  
  // Handle message submit
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || !chatState.activeChat || !authState.user || !receiver) {
      return;
    }
    
    // Send message
    sendNewMessage(
      receiver.id, 
      message, 
      encrypted,
      selfDestruct ? { enabled: true, timeout: selfDestructTime } : undefined
    );
    
    // Clear input
    setMessage('');
  };
  
  // Render message status indicator
  const renderMessageStatus = (status: 'sent' | 'delivered' | 'seen') => {
    switch (status) {
      case 'sent':
        return <span className="text-gray-400">✓</span>;
      case 'delivered':
        return <span className="text-gray-400">✓✓</span>;
      case 'seen':
        return <span className="text-blue-500">✓✓</span>;
      default:
        return null;
    }
  };
  
  if (!chatState.activeChat) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center p-4 bg-gray-50">
        <img 
          src="https://cdn-icons-png.flaticon.com/512/627/627495.png" 
          alt="Goku Icon" 
          className="h-24 w-24 mb-4 opacity-50"
        />
        <p className="text-gray-500 text-center">
          Select a contact to start chatting
        </p>
      </div>
    );
  }
  
  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Chat header */}
      <div className="bg-white p-3 shadow-sm border-b flex items-center">
        <div className="relative mr-3">
          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
            <span className="text-gray-600 font-medium">
              {receiver?.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <span 
            className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${
              receiver?.online ? 'bg-green-500' : 'bg-gray-400'
            }`}
          ></span>
        </div>
        <div>
          <h3 className="font-medium">{receiver?.name}</h3>
          <p className="text-xs text-gray-500">
            {receiver?.online 
              ? 'Online' 
              : receiver?.lastSeen 
                ? `Last seen ${format(new Date(receiver.lastSeen), 'HH:mm')}`
                : 'Offline'
            }
          </p>
        </div>
      </div>
      
      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto bg-[#f0f0f0]">
        {activeChat?.messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <Lock className="h-12 w-12 mb-2" />
            <p className="text-center mb-1">End-to-end encrypted</p>
            <p className="text-center text-sm">
              Send a message to start your secure conversation
            </p>
          </div>
        ) : (
          activeChat?.messages.map((message) => {
            const isMe = message.senderId === authState.user?.id;
            
            return (
              <div 
                key={message.id} 
                className={`flex mb-3 ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[75%] rounded-lg p-3 ${
                    isMe 
                      ? 'bg-[#dcf8c6] rounded-tr-none' 
                      : 'bg-white rounded-tl-none'
                  }`}
                >
                  <div className="flex items-center mb-1">
                    {message.encrypted && (
                      <Lock className="h-3 w-3 mr-1 text-gray-500" />
                    )}
                    {message.selfDestruct?.enabled && (
                      <Clock className="h-3 w-3 mr-1 text-gray-500" />
                    )}
                  </div>
                  <p className="text-sm">{message.content}</p>
                  <div className="flex justify-end items-center mt-1">
                    <span className="text-xs text-gray-500 mr-1">
                      {format(new Date(message.timestamp), 'HH:mm')}
                    </span>
                    {isMe && renderMessageStatus(message.status)}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Message input */}
      <form onSubmit={handleSendMessage} className="bg-white p-3 border-t">
        {/* Security options */}
        <div className="flex items-center mb-2 text-xs">
          <div className="flex items-center mr-4">
            <input
              type="checkbox"
              id="encrypted"
              checked={encrypted}
              onChange={(e) => setEncrypted(e.target.checked)}
              className="mr-1"
            />
            <label htmlFor="encrypted" className="flex items-center">
              <Lock className="h-3 w-3 mr-1" />
              Encrypted
            </label>
          </div>
          
          <div className="flex items-center mr-4">
            <input
              type="checkbox"
              id="selfDestruct"
              checked={selfDestruct}
              onChange={(e) => setSelfDestruct(e.target.checked)}
              className="mr-1"
            />
            <label htmlFor="selfDestruct" className="flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              Self-destruct
            </label>
          </div>
          
          {selfDestruct && (
            <select
              value={selfDestructTime}
              onChange={(e) => setSelfDestructTime(Number(e.target.value))}
              className="text-xs border rounded p-1"
            >
              <option value="10">10 seconds</option>
              <option value="30">30 seconds</option>
              <option value="60">1 minute</option>
              <option value="300">5 minutes</option>
            </select>
          )}
          
          <button
            type="button"
            onClick={() => setShowSteganography(!showSteganography)}
            className="flex items-center text-gray-500 hover:text-gray-700"
          >
            <Image className="h-3 w-3 mr-1" />
            Steganography
          </button>
        </div>
        
        {/* Steganography input (simplified) */}
        {showSteganography && (
          <div className="bg-gray-100 p-2 rounded mb-2 text-xs">
            <p className="mb-1">Hide your message in an image (simulated)</p>
            <input
              type="file"
              accept="image/*"
              className="w-full"
            />
          </div>
        )}
        
        <div className="flex items-center">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message"
            className="flex-1 border border-gray-300 rounded-l-full p-2 px-4 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <button
            type="submit"
            className="bg-[#FF6B00] text-white p-2 rounded-r-full hover:bg-orange-600 transition"
            disabled={!message.trim()}
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatWindow;