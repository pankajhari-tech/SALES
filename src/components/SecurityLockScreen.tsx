import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Mail,
  KeyRound,
  Eye,
  EyeOff,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

interface SecurityLockScreenProps {
  onUnlock: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const AUTHORIZED_EMAIL = 'pankaj.ydvt@gmail.com';
export const AUTHORIZED_PASSWORD = 'PANKaj1@';

export const SecurityLockScreen: React.FC<SecurityLockScreenProps> = ({
  onUnlock,
  isDarkMode,
  onToggleDarkMode,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsVerifying(true);

    setTimeout(() => {
      const cleanEmail = email.trim().toLowerCase();
      const cleanPass = password.trim();

      if (cleanEmail === AUTHORIZED_EMAIL.toLowerCase() && cleanPass === AUTHORIZED_PASSWORD) {
        if (rememberMe) {
          localStorage.setItem('salestracker_auth_session', 'authenticated');
          localStorage.setItem('salestracker_auth_email', AUTHORIZED_EMAIL);
        } else {
          sessionStorage.setItem('salestracker_auth_session', 'authenticated');
        }
        setIsVerifying(false);
        onUnlock();
      } else {
        setIsVerifying(false);
        setAttempts((prev) => prev + 1);
        setError('Access Denied: Invalid email address or master password.');
      }
    }, 400);
  };

  const handleQuickFill = () => {
    setEmail(AUTHORIZED_EMAIL);
    setPassword(AUTHORIZED_PASSWORD);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between items-center p-4 sm:p-6 selection:bg-indigo-500 selection:text-white relative overflow-hidden font-sans">
      
      {/* Background Decorative Ambient Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-indigo-600/15 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-0 right-10 w-[400px] h-[300px] bg-emerald-600/10 blur-[100px] rounded-full pointer-events-none"></div>

      {/* Top Bar with Brand & Mode */}
      <div className="w-full max-w-5xl flex items-center justify-between z-10 py-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black text-base shadow-lg shadow-indigo-600/30">
            ST
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-white">
                SalesTracker
              </span>
              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-indigo-950 text-indigo-400 border border-indigo-800">
                PRO
              </span>
            </div>
            <span className="text-[10px] text-slate-400 block -mt-0.5 font-medium">
              Enterprise Secure Access Control
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-900 border border-slate-800 text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>256-Bit Master Lock</span>
          </div>
        </div>
      </div>

      {/* Main Lock Box */}
      <div className="w-full max-w-md my-auto z-10 animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          
          {/* Top security badge */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner mb-4">
              <Lock className="w-7 h-7 text-indigo-400" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              System Protected
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              Authorized access only. Enter master administrator credentials to unlock system data.
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-950/70 border border-rose-800/80 text-rose-200 text-xs flex items-center gap-2.5 animate-in shake duration-150">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Email Field */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Admin Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="pankaj.ydvt@gmail.com"
                  autoComplete="email"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Master Password
                </label>
                <button
                  type="button"
                  onClick={handleQuickFill}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 transition"
                >
                  <Sparkles className="w-3 h-3" /> Auto-fill
                </button>
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password..."
                  autoComplete="current-password"
                  className="w-full pl-10 pr-10 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-slate-200">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 bg-slate-950 border-slate-800"
                />
                <span>Remember this device</span>
              </label>
              <span className="text-[11px] text-slate-400 font-mono">Protected</span>
            </div>

            {/* Unlock Button */}
            <button
              type="submit"
              disabled={isVerifying}
              className="w-full mt-2 py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] text-white text-xs font-bold transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isVerifying ? 'Authenticating...' : 'Unlock System'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

          </form>

          {/* Quick Helper Credentials Notice */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 text-center">
            <p className="text-[11px] text-slate-400">
              Master Access Credentials:
            </p>
            <div className="mt-1.5 flex items-center justify-center gap-2 font-mono text-[11px] text-indigo-300">
              <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                pankaj.ydvt@gmail.com
              </span>
              <span className="text-slate-400">•</span>
              <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                PANKaj1@
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* Footer */}
      <div className="w-full max-w-5xl text-center py-4 text-xs text-slate-400 z-10 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>SalesTracker Pro Security Architecture</span>
        <span className="font-medium text-slate-400">
          Crafted & Secured by <strong className="text-white">Pankaj Yadav</strong>
        </span>
      </div>

    </div>
  );
};
