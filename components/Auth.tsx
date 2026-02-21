
import React, { useState } from 'react';
import { Layout, Lock, Mail, ArrowRight, ShieldCheck, Info } from 'lucide-react';
import { signIn, signUp } from '../lib/api';

interface AuthProps {
  onLogin: (userData: { id: string; email: string }) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        const data = await signIn(email, password);
        if (data.user) {
          onLogin({ id: data.user.id, email: data.user.email || email });
        }
      } else {
        const data = await signUp(email, password);
        if (data.user) {
          onLogin({ id: data.user.id, email: data.user.email || email });
        } else {
          setError('Check your email for a confirmation link, or try logging in.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[500] bg-white flex overflow-hidden font-inter">
      {/* Left Panel: Branding & Visual */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 relative items-center justify-center p-12 overflow-hidden">
        {/* Abstract Background Shapes */}
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-rose-500/10 rounded-full blur-[120px]" />

        <div className="relative z-10 max-w-md">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-500/20">
              <Layout className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">RMI <span className="text-indigo-400">v0.7</span></h1>
          </div>

          <h2 className="text-4xl font-bold text-white mb-6 leading-tight">
            Mapping the geometry of human connection.
          </h2>

          <div className="space-y-6">
            <div className="flex gap-4 p-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
              <ShieldCheck className="w-6 h-6 text-indigo-400 shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-white mb-1">Privacy by Design</h4>
                <p className="text-xs text-slate-400 leading-relaxed">Your data is securely stored with row-level security. Only you can access your relational map.</p>
              </div>
            </div>
            <div className="flex gap-4 p-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
              <Info className="w-6 h-6 text-indigo-400 shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-white mb-1">Research Prototype</h4>
                <p className="text-xs text-slate-400 leading-relaxed">This interface is part of an ongoing study on digital mediation and agency preservation.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel: Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-slate-50 lg:bg-white">
        <div className="w-full max-w-sm">
          <div className="mb-10">
            <h3 className="text-2xl font-bold text-slate-900 mb-2">{isLogin ? 'Welcome Back' : 'Create Account'}</h3>
            <p className="text-sm text-slate-500">
              {isLogin ? 'Enter your credentials to access your relational map.' : 'Start your journey into relational reflection.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-300" />
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-300" />
                <input
                  type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg text-xs font-bold text-rose-600 animate-shake">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-indigo-600 text-white rounded-xl font-bold shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-[0.98] mt-6 disabled:opacity-60"
            >
              {loading ? 'Please wait...' : (isLogin ? 'Login to Interface' : 'Initialize Account')}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className="text-sm font-medium text-slate-400 hover:text-indigo-600 transition-colors"
            >
              {isLogin ? "Don't have an account? Register" : "Already have an account? Log in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;