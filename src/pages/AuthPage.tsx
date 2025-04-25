import React, { useState } from 'react';
import Login from '../components/Auth/Login';
import Register from '../components/Auth/Register';

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-[#FF6B00] p-4 text-white text-center">
          <div className="flex justify-center mb-2">
            <img 
              src="https://cdn-icons-png.flaticon.com/512/627/627495.png" 
              alt="Goku Icon" 
              className="h-16 w-16"
            />
          </div>
          <h1 className="text-2xl font-bold">Chat with Goku</h1>
          <p className="text-sm opacity-90">Secure. Private. Super Saiyan.</p>
        </div>
        
        <div className="p-6">
          {isLogin ? <Login /> : <Register />}
          
          <div className="mt-4 text-center">
            <p className="text-gray-600">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="ml-1 text-orange-500 hover:text-orange-600 font-medium"
              >
                {isLogin ? 'Sign Up' : 'Login'}
              </button>
            </p>
          </div>
        </div>
      </div>
      
      <div className="mt-8 max-w-md text-center">
        <h2 className="text-xl font-semibold mb-2">Advanced Security Features</h2>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
          <li className="bg-white p-2 rounded shadow-sm text-sm">
            <span className="font-medium">End-to-End Encryption</span>: AES-256 for complete privacy
          </li>
          <li className="bg-white p-2 rounded shadow-sm text-sm">
            <span className="font-medium">Self-Destructing Messages</span>: Prevent unwanted data retention
          </li>
          <li className="bg-white p-2 rounded shadow-sm text-sm">
            <span className="font-medium">Message Status</span>: Know when messages are seen
          </li>
          <li className="bg-white p-2 rounded shadow-sm text-sm">
            <span className="font-medium">Steganography</span>: Hide messages in images
          </li>
        </ul>
      </div>
    </div>
  );
};

export default AuthPage;