import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { loginCustomer } from '../services/api';

const Login = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Controlled component states
  const [email, setEmail] = useState(location.state?.registeredEmail || '');
  const [password, setPassword] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);

    try {
      await loginCustomer({
        email: email.trim(),
        password,
      });

      if (onLoginSuccess) onLoginSuccess();

      // On success -> Navigate to /home
      navigate('/home');
    } catch (err) {
      // Show "Invalid Credentials" on failure
      if (err.response?.status === 401) {
        setError('Invalid credentials');
      } else {
        setError(err.response?.data?.message || 'Invalid credentials');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center py-12 px-4 sm:px-6">
      <div className="max-w-md w-full bg-white p-8 sm:p-10 border border-slate-200/90 rounded-3xl shadow-sm">
        <div className="mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100 mb-2">
            ShopKart Account
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Sign in to ShopKart</h2>
          <p className="text-sm text-slate-500 mt-1">
            Welcome back! Please enter your login credentials.
          </p>
        </div>

        {location.state?.registeredEmail && !error && (
          <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-2xl shadow-xs">
            Registration successful! Please login with your password.
          </div>
        )}

        {error && (
          <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-2xl shadow-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@gmail.com"
              className="w-full px-3.5 py-2.5 border border-slate-200 bg-slate-50/50 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 border border-slate-200 bg-slate-50/50 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all font-medium"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 active:scale-[0.99] text-white font-semibold py-3 px-4 rounded-xl text-sm transition-all shadow-md shadow-indigo-500/25 disabled:opacity-60 cursor-pointer"
          >
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-slate-500">
          Don't have an account?{' '}
          <Link to="/register" className="text-indigo-600 hover:text-indigo-800 font-semibold hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
