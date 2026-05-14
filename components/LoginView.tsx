'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Home, Mail, Lock, Eye, EyeOff, AlertCircle, Sparkles, User, Building2, Crown, ArrowLeft, Check } from 'lucide-react';

export default function LoginView() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'tenant' | 'owner'>('tenant');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setLoading(false);
  };

  const handleRegister = async () => {
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName, role, phone } }
    });
    if (error) setError(error.message);
    else {
      setError('');
      alert('Akun berhasil dibuat! Silakan login.');
      setMode('login');
    }
    setLoading(false);
  };

  const quickLogin = async (r: 'tenant' | 'owner' | 'admin') => {
    const creds = {
      tenant: { email: 'tenant@demo.com', pass: 'demo12345' },
      owner: { email: 'owner@demo.com', pass: 'demo12345' },
      admin: { email: 'admin@demo.com', pass: 'demo12345' },
    }[r];
    setEmail(creds.email);
    setPassword(creds.pass);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: creds.email, password: creds.pass });
    if (error) {
      // Auto-create demo account if not exists
      const { error: signupErr } = await supabase.auth.signUp({
        email: creds.email, password: creds.pass,
        options: { data: { full_name: r === 'admin' ? 'Admin Mamikos' : r === 'owner' ? 'Owner Demo' : 'Tenant Demo', role: r } }
      });
      if (!signupErr) {
        await supabase.auth.signInWithPassword({ email: creds.email, password: creds.pass });
      } else {
        setError(signupErr.message);
      }
    }
    setLoading(false);
  };

  if (mode === 'register') {
    return (
      <div className="animate-fade-in min-h-screen">
        <div className="sticky top-0 bg-white border-b border-stone-100 px-5 py-4 flex items-center gap-3">
          <button onClick={() => setMode('login')}><ArrowLeft size={22} /></button>
          <h1 className="font-display text-lg font-bold text-stone-900">Daftar Akun</h1>
        </div>
        <div className="p-6">
          <h2 className="font-display text-xl font-bold text-stone-900 mb-1">Buat akun baru</h2>
          <p className="text-sm text-stone-500 mb-6">Pilih tipe akun yang sesuai</p>

          <div className="space-y-3 mb-6">
            {[
              { id: 'tenant', icon: User, title: 'Pencari Kos', desc: 'Mencari dan menyewa kamar', color: 'bg-blue-100 text-blue-600' },
              { id: 'owner', icon: Building2, title: 'Pemilik Kos', desc: 'Mengelola dan menyewakan kos', color: 'bg-green-100 text-green-700' },
            ].map(r => (
              <button key={r.id} onClick={() => setRole(r.id as any)} className={`w-full p-4 rounded-2xl border-2 flex items-center gap-3 text-left transition-colors ${role === r.id ? 'border-green-700 bg-green-50' : 'border-stone-100 bg-white'}`}>
                <div className={`w-12 h-12 rounded-xl ${r.color} flex items-center justify-center`}>
                  <r.icon size={22} />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-stone-900">{r.title}</p>
                  <p className="text-xs text-stone-500">{r.desc}</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 ${role === r.id ? 'border-green-700 bg-green-700' : 'border-stone-300'} flex items-center justify-center`}>
                  {role === r.id && <Check size={12} className="text-white" />}
                </div>
              </button>
            ))}
          </div>

          <div className="space-y-3">
            <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Nama Lengkap" className="w-full px-4 py-3 bg-stone-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-700" />
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="w-full px-4 py-3 bg-stone-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-700" />
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="No. Telepon" className="w-full px-4 py-3 bg-stone-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-700" />
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password (min 6 karakter)" className="w-full px-4 py-3 bg-stone-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-700" />
          </div>

          {error && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
              <AlertCircle size={16} className="text-red-600 flex-shrink-0" />
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}

          <button onClick={handleRegister} disabled={loading} className="w-full mt-6 py-3.5 bg-green-700 hover:bg-green-800 disabled:bg-stone-300 text-white rounded-xl font-bold">
            {loading ? 'Memproses...' : 'Daftar'}
          </button>

          <div className="mt-6 text-center text-sm text-stone-600">
            Sudah punya akun?{' '}
            <button onClick={() => setMode('login')} className="text-green-700 font-bold">Masuk</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in min-h-screen flex flex-col">
      <div className="relative px-6 pt-16 pb-12 text-white overflow-hidden" style={{ background: 'linear-gradient(135deg, #14532d 0%, #166534 50%, #15803d 100%)' }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 80%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center mb-4">
            <Home size={28} className="text-white" />
          </div>
          <h1 className="font-display text-3xl font-bold mb-1">Mamikos</h1>
          <p className="text-sm text-green-100">Cari kos idaman dengan mudah</p>
        </div>
      </div>

      <div className="flex-1 px-6 py-8">
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
          <p className="text-xs font-semibold text-amber-900 mb-2 flex items-center gap-1">
            <Sparkles size={12} /> Akun Demo (klik untuk login otomatis)
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button onClick={() => quickLogin('tenant')} disabled={loading} className="px-2 py-2 bg-white border border-amber-200 rounded-lg text-[10px] font-semibold text-stone-700 hover:bg-amber-100 disabled:opacity-50">
              <User size={14} className="mx-auto mb-1 text-blue-600" />Tenant
            </button>
            <button onClick={() => quickLogin('owner')} disabled={loading} className="px-2 py-2 bg-white border border-amber-200 rounded-lg text-[10px] font-semibold text-stone-700 hover:bg-amber-100 disabled:opacity-50">
              <Building2 size={14} className="mx-auto mb-1 text-green-700" />Owner
            </button>
            <button onClick={() => quickLogin('admin')} disabled={loading} className="px-2 py-2 bg-white border border-amber-200 rounded-lg text-[10px] font-semibold text-stone-700 hover:bg-amber-100 disabled:opacity-50">
              <Crown size={14} className="mx-auto mb-1 text-purple-600" />Admin
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-stone-700 mb-1.5 block">Email</label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" className="w-full pl-10 pr-4 py-3 bg-stone-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-700" />
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold text-stone-700 mb-1.5 block">Password</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" className="w-full pl-10 pr-12 py-3 bg-stone-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-700" />
              <button onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400">
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
              <AlertCircle size={16} className="text-red-600 flex-shrink-0" />
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}

          <button onClick={handleLogin} disabled={loading} className="w-full py-3.5 bg-green-700 hover:bg-green-800 disabled:bg-stone-300 text-white rounded-xl font-bold">
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
        </div>

        <div className="mt-6 text-center text-sm text-stone-600">
          Belum punya akun?{' '}
          <button onClick={() => setMode('register')} className="text-green-700 font-bold">Daftar di sini</button>
        </div>
      </div>
    </div>
  );
}
