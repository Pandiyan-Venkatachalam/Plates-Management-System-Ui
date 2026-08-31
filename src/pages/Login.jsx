import React, { useState, useEffect } from 'react';
import { useAuth, ApiUrl } from '../context/AuthContext';
import { Leaf } from 'lucide-react';
import Swal from 'sweetalert2';
import bgDesktop from '../assets/login_bg.png';
import bgMobile from '../assets/login_mobile.png';

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
    } catch (err) {
      setError(err.message || 'Login failed. Check server status.');
    } finally {
      setLoading(false);
    }
  };

  const handleSeed = async () => {
    try {

      const res = await fetch(`${ApiUrl}/auth/seed`, { method: 'POST' });
      if (res.ok) {
        Swal.fire('Success', 'Database seeded successfully! Use admin/admin123 to login.', 'success');
      } else {
        Swal.fire('Error', 'Failed to seed database.', 'error');
      }
    } catch (err) {
      Swal.fire('Error', 'Error connecting to seed endpoint: ' + err.message, 'error');
    }
  };

  const bgImage = isMobile ? bgMobile : bgDesktop;

  return (
    <div 
      className="fixed inset-0 w-screen h-screen flex items-center justify-center md:items-center md:justify-start p-4 md:p-16 lg:p-24 md:pl-48 lg:pl-72 bg-cover bg-center bg-no-repeat z-50 overflow-hidden font-sans"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      {/* Light overlay to maintain text readability while showing the background details */}
      <div className="absolute inset-0 bg-stone-900/10 z-0" />
 
      {/* Glassmorphic Card (centered on mobile, left on desktop) */}
      <div 
        className="w-full max-w-sm md:max-w-md h-auto rounded-[24px] p-6 pb-4 md:p-8 md:pb-5 z-10 flex flex-col justify-between overflow-hidden translate-y-5 md:translate-y-0"
        style={{ 
          background: 'rgba(15, 23, 42, 0.65)', 
          backdropFilter: 'blur(16px)', 
          WebkitBackdropFilter: 'blur(16px)', 
          border: '1px solid rgba(255, 255, 255, 0.15)', 
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)' 
        }}
      >
        {error && (
          <div className="bg-blue-500/20 border border-brand-accent/35 text-white text-[10px] md:text-xs rounded-xl p-2.5 mb-2.5 text-center font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 md:space-y-4">
          <div className="pt-0">
            <label className="block text-[10px] md:text-xs font-bold text-white mb-1" style={{ textShadow: '0 1px 3px rgba(0, 0, 0, 0.7)' }}>Username or Email</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-white/80 pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-950/35 border border-white/25 focus:border-white focus:bg-slate-950/50 rounded-xl pl-8 pr-4 py-2 text-xs md:text-sm text-white placeholder-white/50 focus:outline-none transition"
                placeholder="Username or Email"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] md:text-xs font-bold text-white mb-1" style={{ textShadow: '0 1px 3px rgba(0, 0, 0, 0.7)' }}>Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-white/80 pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950/35 border border-white/25 focus:border-white focus:bg-slate-950/50 rounded-xl pl-8 pr-4 py-2 text-xs md:text-sm text-white placeholder-white/50 focus:outline-none transition"
                placeholder="Password"
                required
              />
            </div>
          </div>

          <div className="flex justify-between items-center text-[10px] md:text-xs pt-0.5">
            <label className="flex items-center gap-1.5 text-white font-semibold cursor-pointer" style={{ textShadow: '0 1px 3px rgba(0, 0, 0, 0.7)' }}>
              <input type="checkbox" className="accent-white rounded border-white/30" />
              Remember me
            </label>
            <a href="#forgot" className="text-white font-bold hover:underline" style={{ textShadow: '0 1px 3px rgba(0, 0, 0, 0.7)' }}>Forgot Password?</a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#fff7f9] hover:bg-white/90 text-stone-900 rounded-xl py-2 md:py-2.5 text-xs md:text-sm font-extrabold shadow-md transition-all flex items-center justify-center gap-1.5 mt-2 cursor-pointer"
          >
            {loading ? 'Authenticating...' : 'Login'}
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-right"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </button>
        </form>

        <div className="flex flex-col items-center justify-center pt-2 md:pt-3 pb-0 md:pb-0 space-y-1">
          <span className="text-[8px] md:text-[9px] text-white/90 uppercase tracking-widest font-bold" style={{ textShadow: '0 1px 3px rgba(0, 0, 0, 0.7)' }}>or continue with</span>
          <button 
            type="button"
            onClick={() => Swal.fire('Feature Info', 'Fingerprint login requires setup in your device security settings.', 'info')} 
            className="p-3 bg-slate-950/65 border border-white/20 hover:bg-slate-900/80 text-indigo-400 rounded-full shadow-lg transition cursor-pointer hover:scale-105"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-fingerprint"><path d="M12 10a2 2 0 0 0-2 2c0 .24.01.48.04.72"/><path d="M14 8a4 4 0 0 0-8 0v4"/><path d="M8 10a6 6 0 0 1 12 0v4"/><path d="M12 6a8 8 0 0 0-8 8v4"/><path d="M12 2a10 10 0 0 0-10 10v4"/><path d="M12 14v4"/><path d="M12 18h.01"/></svg>
          </button>
        </div>

      </div>
    </div>
  );
}
