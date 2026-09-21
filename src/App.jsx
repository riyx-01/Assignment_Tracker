import React, { useEffect, useState } from 'react';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import { setupNotifications } from './utils/notifications';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('isAuthenticated') === 'true';
  });

  useEffect(() => {
    setupNotifications();
  }, []);

  const handleLogin = () => {
    sessionStorage.setItem('isAuthenticated', 'true');
    setIsAuthenticated(true);
  };

  return (
    <div className="min-h-screen bg-[#ececec] text-gray-900 selection:bg-[#e581a2]/30 selection:text-pink-900 relative overflow-hidden">
      <div className="relative z-10 h-screen overflow-y-auto">
        {!isAuthenticated ? (
          <Login onLogin={handleLogin} />
        ) : (
          <Dashboard />
        )}
      </div>
    </div>
  );
}

export default App;
