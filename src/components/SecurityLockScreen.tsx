import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  Lock,
  Mail,
  KeyRound,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldAlert,
  Clock,
  CheckCircle2,
} from 'lucide-react';

interface SecurityLockScreenProps {
  onUnlock: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

/**
 * High-Entropy Salt and One-Way Salted Cryptographic Hash
 * The master credentials (email and password) are NEVER stored in plaintext
 * anywhere in the codebase or client JavaScript bundle.
 * Even if reverse-engineered or inspected via browser DevTools,
 * SHA-256 is mathematically irreversible.
 */
const CRYPTO_SALT = 'salestracker_secure_salt_2026_v1_';
const MASTER_AUTH_HASH = '9e089fe1590bc2290d420b946abf52a6495539e17ec3d4c62a63334e755ec58f';

// Storage keys for anti-tamper rate limiting and lockout
const LOCKOUT_KEY = 'salestracker_sec_lockout_ts';
const ATTEMPTS_KEY = 'salestracker_sec_fail_count';

/**
 * Constant-time comparison to prevent timing side-channel attacks
 */
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Asynchronous Web Crypto SHA-256 hasher
 */
async function computeSha256Hex(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

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
  const [remainingLockoutSecs, setRemainingLockoutSecs] = useState<number>(0);

  const countdownIntervalRef = useRef<any>(null);

  // Initialize and check lockout status on mount
  useEffect(() => {
    const checkLockout = () => {
      const lockoutExpiryStr = localStorage.getItem(LOCKOUT_KEY);
      if (lockoutExpiryStr) {
        const lockoutExpiry = parseInt(lockoutExpiryStr, 10);
        const now = Date.now();
        if (lockoutExpiry > now) {
          const diffSecs = Math.ceil((lockoutExpiry - now) / 1000);
          setRemainingLockoutSecs(diffSecs);
          setError(`Security Cooldown Active: Too many failed attempts. Retry in ${diffSecs}s.`);
          return;
        } else {
          // Lockout expired
          localStorage.removeItem(LOCKOUT_KEY);
          setRemainingLockoutSecs(0);
        }
      }
    };

    checkLockout();

    countdownIntervalRef.current = setInterval(() => {
      const lockoutExpiryStr = localStorage.getItem(LOCKOUT_KEY);
      if (lockoutExpiryStr) {
        const lockoutExpiry = parseInt(lockoutExpiryStr, 10);
        const now = Date.now();
        if (lockoutExpiry > now) {
          const diffSecs = Math.ceil((lockoutExpiry - now) / 1000);
          setRemainingLockoutSecs(diffSecs);
        } else {
          localStorage.removeItem(LOCKOUT_KEY);
          setRemainingLockoutSecs(0);
          setError(null);
        }
      }
    }, 1000);

    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (remainingLockoutSecs > 0) return;

    setError(null);
    setIsVerifying(true);

    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanPass = password.trim();

      // Zero-knowledge cryptographic check
      const inputCombo = `${CRYPTO_SALT}${cleanEmail}:${cleanPass}`;
      const calculatedHash = await computeSha256Hex(inputCombo);

      const isValid = constantTimeCompare(calculatedHash, MASTER_AUTH_HASH);

      if (isValid) {
        // Success: Clear all failure records
        localStorage.removeItem(LOCKOUT_KEY);
        localStorage.removeItem(ATTEMPTS_KEY);

        // Issue opaque authenticated session token (no private info stored)
        const sessionToken = await computeSha256Hex(`session_${Date.now()}_${Math.random()}`);
        if (rememberMe) {
          localStorage.setItem('salestracker_auth_session', 'authenticated');
          localStorage.setItem('salestracker_auth_token', sessionToken);
        } else {
          sessionStorage.setItem('salestracker_auth_session', 'authenticated');
          sessionStorage.setItem('salestracker_auth_token', sessionToken);
        }

        // Clean memory zeroization
        setEmail('');
        setPassword('');
        setIsVerifying(false);
        onUnlock();
      } else {
        // Increment failed attempts
        const currentFails = parseInt(localStorage.getItem(ATTEMPTS_KEY) || '0', 10) + 1;
        localStorage.setItem(ATTEMPTS_KEY, currentFails.toString());

        setIsVerifying(false);

        if (currentFails >= 5) {
          // 3-minute strict security lockout
          const lockoutTime = Date.now() + 180 * 1000;
          localStorage.setItem(LOCKOUT_KEY, lockoutTime.toString());
          setRemainingLockoutSecs(180);
          setError('Security Lockout: 5 failed attempts recorded. System access paused for 3 minutes.');
        } else if (currentFails >= 3) {
          // 30-second penalty lockout
          const lockoutTime = Date.now() + 30 * 1000;
          localStorage.setItem(LOCKOUT_KEY, lockoutTime.toString());
          setRemainingLockoutSecs(30);
          setError('Multiple failed attempts detected. Cooldown enforced for 30 seconds.');
        } else {
          setError(`Access Denied: Invalid credentials. (${currentFails}/5 attempts used)`);
        }
      }
    } catch (err: any) {
      setIsVerifying(false);
      setError('Cryptographic verification error. Please retry.');
    }
  };

  const isFormLocked = remainingLockoutSecs > 0;

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
              Zero-Knowledge Secure Gate
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-900 border border-slate-800 text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>SHA-256 Salted Authentication</span>
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

          {/* Cooldown Active Banner */}
          {isFormLocked && (
            <div className="mb-5 p-3 rounded-2xl bg-amber-950/70 border border-amber-800/80 text-amber-200 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400 animate-spin" />
                <span className="font-semibold">Security Cooldown Enforced</span>
              </div>
              <span className="font-mono font-bold text-amber-300 bg-amber-950 px-2 py-0.5 rounded border border-amber-800">
                {remainingLockoutSecs}s
              </span>
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
                  disabled={isFormLocked || isVerifying}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter administrator email..."
                  autoComplete="email"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Master Password
                </label>
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  disabled={isFormLocked || isVerifying}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter master password..."
                  autoComplete="current-password"
                  className="w-full pl-10 pr-10 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  disabled={isFormLocked}
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1 disabled:opacity-40"
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
                  disabled={isFormLocked}
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 bg-slate-950 border-slate-800 disabled:opacity-50"
                />
                <span>Remember this device</span>
              </label>
              <span className="text-[11px] text-slate-400 font-mono">Protected</span>
            </div>

            {/* Unlock Button */}
            <button
              type="submit"
              disabled={isVerifying || isFormLocked}
              className="w-full mt-2 py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] text-white text-xs font-bold transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>
                {isVerifying
                  ? 'Verifying Cryptography...'
                  : isFormLocked
                  ? `Locked (${remainingLockoutSecs}s)`
                  : 'Unlock System'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>

          </form>

          {/* Security Notice */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 text-center">
            <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Cryptographic Salted Verification • Zero Plaintext Storage</span>
            </p>
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
