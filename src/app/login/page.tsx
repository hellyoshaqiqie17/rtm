'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStreamContext } from '@/context/StreamContext';
import { User, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { loginAdmin, isAdminAuthenticated, logoUrl } = useStreamContext();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (isAdminAuthenticated) {
      router.push('/admin');
    }
  }, [isAdminAuthenticated, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    setTimeout(() => {
      const res = loginAdmin(username, password);
      setLoading(false);
      if (res.success) {
        router.push('/admin');
      } else {
        setError(res.error || 'Username atau kata sandi tidak valid.');
      }
    }, 300);
  };

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col justify-center items-center p-4 font-sans selection:bg-[#E50914] selection:text-white">
      <div className="max-w-md w-full space-y-6 bg-[#121212] p-8 rounded-2xl border border-white/10 shadow-2xl relative overflow-hidden">
        
        {/* Top Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#E50914]"></div>

        {/* Logo Header */}
        <div className="text-center space-y-3">
          <img
            src={logoUrl}
            alt="RTM MAUBERE"
            className="h-10 w-auto max-w-[180px] max-h-10 mx-auto object-contain drop-shadow-md"
            style={{ maxHeight: '40px', maxWidth: '180px' }}
          />
          <h2 className="text-2xl font-extrabold text-white tracking-tight font-sans">
            Masuk
          </h2>
          <p className="text-xs text-[#A3A3A3] font-sans">
            Selamat datang kembali di RTM MAUBERE
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="p-4 rounded-xl bg-red-950/60 border border-red-500/30 text-red-300 text-xs font-sans flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5 font-sans">
              Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-medium text-white placeholder-neutral-500 focus:outline-none focus:border-[#E50914] transition-all font-mono"
                placeholder="Username"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5 font-sans">
              Kata Sandi
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-medium text-white placeholder-neutral-500 focus:outline-none focus:border-[#E50914] transition-all font-mono"
                placeholder="Kata Sandi"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-neutral-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl bg-[#E50914] hover:bg-red-700 text-white text-sm font-bold transition-all shadow-lg shadow-red-900/30 flex items-center justify-center gap-2 active:scale-98 font-sans"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
            ) : (
              <span>Masuk</span>
            )}
          </button>
        </form>

        <div className="text-center pt-2">
          <span className="text-[11px] text-neutral-500 font-sans">
            © 2026 RTM MAUBERE Production.
          </span>
        </div>

      </div>
    </div>
  );
}
