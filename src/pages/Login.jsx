import React, { useState, useEffect } from 'react';
import { useAuth, ApiUrl } from '../context/AuthContext';
import { Leaf } from 'lucide-react';
import Swal from 'sweetalert2';
import bgDesktop from '../assets/login_bg.png';
import bgMobile from '../assets/login_mobile.png';
import { biometricService } from '../services/biometricService';

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricUsername, setBiometricUsername] = useState('');

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    
    // Check biometrics availability
    const initBiometrics = async () => {
      const avail = await biometricService.checkAvailability();
      setBiometricAvailable(avail.isAvailable);
      setBiometricEnabled(avail.hasCredentials);
      if (avail.configuredUsername) {
        setBiometricUsername(avail.configuredUsername);
      }
    };
    initBiometrics();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLoginProcess = async (userVal, passVal) => {
    setError('');
    setLoading(true);
    try {
      await login(userVal, passVal);
      // Handle enrollment check on success
      await handleBiometricEnrollment(userVal, passVal);
    } catch (err) {
      setError(err.message || 'Login failed. Check server status.');
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricEnrollment = async (userVal, passVal) => {
    try {
      const avail = await biometricService.checkAvailability();
      if (avail.isAvailable) {
        // If it's not enabled, or it was enabled for a different account, prompt enrollment
        if (!avail.hasCredentials || avail.configuredUsername !== userVal) {
          const result = await Swal.fire({
            title: 'Enable Biometric Login?',
            text: 'Use your fingerprint or supported biometric authentication to log in faster next time.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Enable',
            cancelButtonText: 'Not Now',
            confirmButtonColor: '#0f172a',
            cancelButtonColor: '#64748b'
          });

          if (result.isConfirmed) {
            try {
              const enrolled = await biometricService.saveCredentials(userVal, passVal);
              if (enrolled) {
                Swal.fire('Success', 'Biometric login enabled successfully!', 'success');
                setBiometricEnabled(true);
                setBiometricUsername(userVal);
              }
            } catch (err) {
              console.warn('Biometric registration cancelled or failed', err);
            }
          }
        }
      }
    } catch (err) {
      console.error('Error during biometric enrollment check', err);
    }
  };

  const handleBiometricLogin = async () => {
    if (loading) return;
    try {
      const creds = await biometricService.getCredentials();
      if (creds && creds.username && creds.password) {
        await handleLoginProcess(creds.username, creds.password);
      }
    } catch (err) {
      const errMsg = err.message || '';
      // Check if user cancelled
      if (err.code === 10 || errMsg.toLowerCase().includes('cancel') || errMsg.toLowerCase().includes('user clear')) {
        return;
      }
      
      // Check if credentials are no longer available (e.g. fingerprint settings changed)
      if (errMsg.toLowerCase().includes('credentials') || errMsg.toLowerCase().includes('not found') || errMsg.toLowerCase().includes('unavailable')) {
        Swal.fire('Unavailable', 'Biometric login is no longer available. Please log in with your password and enable biometric login again.', 'warning');
        await biometricService.deleteCredentials();
        setBiometricEnabled(false);
        return;
      }
      
      Swal.fire('Failed', 'Biometric verification failed. Please try again or use your password.', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await handleLoginProcess(username, password);
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
      className="fixed inset-0 w-screen h-screen bg-cover bg-center bg-no-repeat z-50 overflow-hidden font-sans"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      {/* Very subtle overlay */}
      <div className="absolute inset-0 bg-black/5 z-0" />

      {/* ====== MOBILE LAYOUT: card anchored to bottom half ====== */}
      {isMobile ? (
        <div className="absolute bottom-20 left-4 right-4 z-10 flex flex-col"
          style={{
            background: 'rgba(10, 15, 35, 0.18)',
            backdropFilter: 'blur(22px)',
            WebkitBackdropFilter: 'blur(22px)',
            border: '1px solid rgba(255,255,255,0.18)',
            borderRadius: '24px',
            boxShadow: '0 -8px 32px rgba(0,0,0,0.3)',
            paddingBottom: 'env(safe-area-inset-bottom, 20px)',
          }}
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-white/25" />
          </div>

          <div className="px-6 pt-3 pb-6">

            {error && (
              <div className="bg-blue-500/20 border border-white/20 text-white text-[10px] rounded-xl p-2.5 mb-3 text-center font-bold">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Username */}
              <div>
                <label className="block text-[10px] font-bold text-white/80 mb-1">Username or Email</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-white/60 pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  </span>
                  <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-white/8 border border-white/20 focus:border-white/60 rounded-xl pl-8 pr-4 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none transition"
                    placeholder="Enter username or email" required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-[10px] font-bold text-white/80 mb-1">Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-white/60 pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  </span>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/8 border border-white/20 focus:border-white/60 rounded-xl pl-8 pr-4 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none transition"
                    placeholder="Enter password" required
                  />
                </div>
              </div>

              <div className="flex justify-between items-center text-[10px] pt-0.5">
                <label className="flex items-center gap-1.5 text-white/70 font-semibold cursor-pointer">
                  <input type="checkbox" className="accent-white rounded border-white/30" />
                  Remember me
                </label>
                <a href="#forgot" className="text-white/70 font-bold hover:text-white transition">Forgot Password?</a>
              </div>

              <button type="submit" disabled={loading}
                className="w-full bg-[#fff7f9] hover:bg-white text-slate-900 rounded-xl py-3 text-sm font-extrabold shadow-lg transition-all flex items-center justify-center gap-1.5 mt-1 active:scale-95 cursor-pointer"
              >
                {loading ? 'Authenticating...' : 'Login'}
                {!loading && <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>}
              </button>
            </form>

            {biometricAvailable && biometricEnabled && (
              <div className="flex flex-col items-center mt-4 space-y-2">
                <div className="flex items-center gap-3 w-full">
                  <div className="flex-1 h-px bg-white/15" />
                  <span className="text-[9px] text-white/45 uppercase tracking-widest font-bold whitespace-nowrap">or use biometrics</span>
                  <div className="flex-1 h-px bg-white/15" />
                </div>
                <button type="button" onClick={handleBiometricLogin}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full text-indigo-300 text-xs font-bold transition-all active:scale-95"
                  style={{ background: 'rgba(99,102,241,0.14)', border: '1px solid rgba(99,102,241,0.3)' }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 10a2 2 0 0 0-2 2c0 .24.01.48.04.72"/><path d="M14 8a4 4 0 0 0-8 0v4"/><path d="M8 10a6 6 0 0 1 12 0v4"/><path d="M12 6a8 8 0 0 0-8 8v4"/><path d="M12 2a10 10 0 0 0-10 10v4"/><path d="M12 14v4"/><path d="M12 18h.01"/></svg>
                  Login with Fingerprint
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ====== DESKTOP LAYOUT: left-positioned glassmorphic card ====== */
        <div className="absolute inset-0 flex items-center justify-start pl-48 lg:pl-72 z-10">
          <div
            className="w-full max-w-md rounded-[28px] p-8 pb-6 flex flex-col gap-4"
            style={{
              background: 'rgba(15, 23, 42, 0.45)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              boxShadow: '0 24px 56px rgba(0, 0, 0, 0.3)'
            }}
          >
            {error && (
              <div className="bg-blue-500/20 border border-brand-accent/35 text-white text-xs rounded-xl p-2.5 text-center font-bold">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-white mb-1" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}>Username or Email</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-white/80 pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  </span>
                  <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-slate-950/35 border border-white/25 focus:border-white focus:bg-slate-950/50 rounded-xl pl-8 pr-4 py-2 text-sm text-white placeholder-white/50 focus:outline-none transition"
                    placeholder="Username or Email" required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-white mb-1" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}>Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-white/80 pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  </span>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-950/35 border border-white/25 focus:border-white focus:bg-slate-950/50 rounded-xl pl-8 pr-4 py-2 text-sm text-white placeholder-white/50 focus:outline-none transition"
                    placeholder="Password" required
                  />
                </div>
              </div>

              <div className="flex justify-between items-center text-xs pt-0.5">
                <label className="flex items-center gap-1.5 text-white font-semibold cursor-pointer" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}>
                  <input type="checkbox" className="accent-white rounded border-white/30" />
                  Remember me
                </label>
                <a href="#forgot" className="text-white font-bold hover:underline" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}>Forgot Password?</a>
              </div>

              <button type="submit" disabled={loading}
                className="w-full bg-[#fff7f9] hover:bg-white/90 text-stone-900 rounded-xl py-2.5 text-sm font-extrabold shadow-md transition-all flex items-center justify-center gap-1.5 mt-2 cursor-pointer"
              >
                {loading ? 'Authenticating...' : 'Login'}
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </button>
            </form>

            {biometricAvailable && biometricEnabled && (
              <div className="flex flex-col items-center pt-1 space-y-1">
                <span className="text-[9px] text-white/90 uppercase tracking-widest font-bold" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}>or continue with</span>
                <button type="button" onClick={handleBiometricLogin}
                  className="p-3 bg-slate-950/65 border border-white/20 hover:bg-slate-900/80 text-indigo-400 rounded-full shadow-lg transition cursor-pointer hover:scale-105"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 10a2 2 0 0 0-2 2c0 .24.01.48.04.72"/><path d="M14 8a4 4 0 0 0-8 0v4"/><path d="M8 10a6 6 0 0 1 12 0v4"/><path d="M12 6a8 8 0 0 0-8 8v4"/><path d="M12 2a10 10 0 0 0-10 10v4"/><path d="M12 14v4"/><path d="M12 18h.01"/></svg>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

