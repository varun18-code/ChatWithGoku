import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LogOut, Menu } from 'lucide-react';

interface HeaderProps {
  toggleSidebar: () => void;
  isMobile: boolean;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar, isMobile }) => {
  const { state, logout } = useAuth();
  
  return (
    <header className="bg-[#FF6B00] text-white px-4 py-3 shadow-md">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          {isMobile && (
            <button 
              onClick={toggleSidebar}
              className="mr-3 text-white"
            >
              <Menu className="h-6 w-6" />
            </button>
          )}
          <div className="flex items-center">
            <img 
              src="https://cdn-icons-png.flaticon.com/512/627/627495.png" 
              alt="Goku Icon" 
              className="h-8 w-8 mr-2"
            />
            <h1 className="text-xl font-bold">Chat with Goku</h1>
          </div>
        </div>
        
        {state.isAuthenticated && state.user && (
          <div className="flex items-center">
            <span className="mr-3 text-sm hidden md:inline">
              {state.user.name}
            </span>
            <button 
              onClick={logout}
              className="text-white hover:bg-orange-600 p-2 rounded"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;