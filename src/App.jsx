import React, { useEffect } from 'react';
import Dashboard from './components/Dashboard';
import { setupNotifications } from './utils/notifications';

function App() {
  useEffect(() => {
    setupNotifications();
  }, []);

  return (
    <div className="min-h-screen bg-[#ececec] text-gray-900 selection:bg-[#e581a2]/30 selection:text-pink-900 relative overflow-hidden">
      <div className="relative z-10 h-screen overflow-y-auto">
        <Dashboard />
      </div>
    </div>
  );
}

export default App;
