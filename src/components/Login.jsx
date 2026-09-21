import React, { useState } from 'react';
import { Lock } from 'lucide-react';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('riyx'); // Default as requested
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username === 'riyx' && password === '010305') {
      onLogin();
    } else {
      setError(true);
      setTimeout(() => setError(false), 500); // Reset for shake animation
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className={`theme-card-wrapper w-full max-w-md ${error ? 'animate-shake' : ''}`} style={{ height: 'auto', aspectRatio: 'auto' }}>
        <div className="theme-card-bg"></div>
        
        <div className="theme-card-content !p-8 md:!p-10 relative z-10">
          <div className="w-16 h-16 bg-white/60 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-white/40">
            <Lock className="w-8 h-8 text-[#e581a2]" />
          </div>
          
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
            <p className="text-gray-600 font-medium text-sm">Please enter your credentials to access the tracker</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Login ID</label>
              <input 
                type="text" 
                value={username} 
                onChange={e => setUsername(e.target.value)}
                className="w-full bg-white/70 backdrop-blur-sm border border-white/50 rounded-xl p-3.5 text-gray-900 focus:ring-2 focus:ring-[#e581a2] outline-none font-bold shadow-sm transition-all" 
                placeholder="Enter ID"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Password</label>
              <input 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-white/70 backdrop-blur-sm border border-white/50 rounded-xl p-3.5 text-gray-900 focus:ring-2 focus:ring-[#e581a2] outline-none font-bold shadow-sm transition-all text-2xl tracking-widest" 
                placeholder="******"
                maxLength={6}
              />
            </div>

            <div className="h-4">
              {error && (
                <p className="text-rose-600 text-xs font-bold text-center">Incorrect ID or Password.</p>
              )}
            </div>

            <button 
              type="submit" 
              className="w-full py-4 mt-2 bg-gradient-to-r from-[#e581a2] to-[#ffb4c8] hover:opacity-90 text-white rounded-xl text-lg font-bold shadow-[0_4px_15px_rgba(229,129,162,0.3)] transition-all transform hover:scale-[1.02]"
            >
              Access Tracker
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
