import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { UserRole } from '../types';
import { Loader2, CheckCircle } from 'lucide-react';

const LoginPage = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(UserRole.ADMIN);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot password state
  const [view, setView] = useState('login'); // 'login' | 'forgot' | 'reset'
  const [fpEmail, setFpEmail] = useState('');
  const [fpMessage, setFpMessage] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  // Check for reset token in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      setResetToken(token);
      setView('reset');
    }
  }, []);

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFpMessage('');
    try {
      const res = await axios.post('http://localhost:5002/api/auth/forgot-password', { email: fpEmail });
      if (res.data.resetUrl) {
        setFpMessage(`⚠️ Email could not be sent. Use this link: ${res.data.resetUrl}`);
      } else {
        setFpMessage('✅ Reset link sent! Check your email.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to send reset email';
      const status = err.response?.status;
      setFpMessage(`Error ${status || ''}: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { setFpMessage('Passwords do not match'); return; }
    if (newPassword.length < 6) { setFpMessage('Password must be at least 6 characters'); return; }
    setLoading(true);
    setFpMessage('');
    try {
      await axios.post('http://localhost:5002/api/auth/reset-password', { token: resetToken, newPassword });
      setResetSuccess(true);
      setTimeout(() => { setView('login'); window.history.replaceState({}, '', '/'); }, 3000);
    } catch (err) {
      setFpMessage(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    if (!username || !password) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    try {
      console.log('🔄 Attempting login with:', { username, password, role });
      console.log('🌐 API URL:', 'http://localhost:5002/api/auth/login');
      
      const res = await axios.post('http://localhost:5002/api/auth/login', {
        username,
        password,
        role
      });

      console.log('✅ Login response:', res.data);
      const user = res.data;

      // Store the token and user data in localStorage
      localStorage.setItem('token', user.token);
      localStorage.setItem('currentUser', JSON.stringify(user));
      
      // Store user info if remember me is checked
      if (rememberMe) {
        localStorage.setItem('rememberedUser', JSON.stringify({
          username: user.username,
          role: user.role
        }));
      }

      // Call the onLogin function passed as props
      onLogin(user);

    } catch (err) {
      console.error('❌ Login error:', err);
      console.error('❌ Error response:', err.response?.data);
      console.error('❌ Error status:', err.response?.status);
      
      if (err.response?.status === 400) {
        setError(err.response.data.message || 'Invalid credentials');
      } else if (err.response?.status === 500) {
        setError('Server error. Please try again later.');
      } else if (err.code === 'ECONNREFUSED') {
        setError('Cannot connect to server. Please ensure the backend is running.');
      } else {
        setError('Login failed. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Load remembered user on component mount
  React.useEffect(() => {
    const remembered = localStorage.getItem('rememberedUser');
    if (remembered) {
      try {
        const userData = JSON.parse(remembered);
        setUsername(userData.username);
        setRole(userData.role);
        setRememberMe(true);
      } catch (e) {
        localStorage.removeItem('rememberedUser');
      }
    }
  }, []);

  const roles = [
    { id: UserRole.ADMIN, label: 'Administrator' },
    { id: UserRole.WAITER, label: 'Waiter / Staff' },
    { id: UserRole.KITCHEN, label: 'Kitchen Crew' },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left side - Restaurant kitchen image */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <div
          className="w-full bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://images.stockcake.com/public/c/d/3/cd3d0ecd-3d1b-4c55-a7f3-802cbc8fcd50_large/chef-cooking-flamboyantly-stockcake.jpg')`
          }}
        >
          <div className="absolute inset-0 bg-black bg-opacity-30"></div>
        </div>
      </div>

      {/* Right side - Login / Forgot / Reset form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-8 py-12 bg-gray-50">
        <div className="w-full max-w-md space-y-8">

          {/* Forgot Password View */}
          {view === 'forgot' && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900">Forgot Password</h2>
                <p className="text-sm text-gray-500 mt-2">Enter your email and we'll send a reset link</p>
              </div>
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <input
                  type="email"
                  value={fpEmail}
                  onChange={e => setFpEmail(e.target.value)}
                  placeholder="Your email address"
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-emerald-500"
                />
                {fpMessage && (
                  <div className={`text-sm p-3 rounded-lg ${fpMessage.startsWith('✅') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                    {fpMessage.startsWith('⚠️') ? (
                      <div>
                        <p className="mb-2">Email could not be sent. Use this link to reset your password:</p>
                        <a href={fpMessage.split(': ')[1]} className="text-emerald-600 underline break-all text-xs" onClick={(e) => { e.preventDefault(); window.location.href = fpMessage.split(': ')[1]; }}>
                          Click here to reset password
                        </a>
                      </div>
                    ) : fpMessage}
                  </div>
                )}
                <button type="submit" disabled={loading} className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading ? <><Loader2 size={18} className="animate-spin" /> Sending...</> : 'Send Reset Link'}
                </button>
                <button type="button" onClick={() => setView('login')} className="w-full text-sm text-gray-500 hover:text-emerald-600">
                  ← Back to Login
                </button>
              </form>
            </div>
          )}

          {/* Reset Password View */}
          {view === 'reset' && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900">Set New Password</h2>
                <p className="text-sm text-gray-500 mt-2">Enter your new password below</p>
              </div>
              {resetSuccess ? (
                <div className="text-center space-y-4">
                  <CheckCircle size={48} className="text-emerald-600 mx-auto" />
                  <p className="text-emerald-700 font-bold">Password reset successfully!</p>
                  <p className="text-sm text-gray-500">Redirecting to login...</p>
                </div>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="New password (min 6 characters)"
                    required
                    minLength={6}
                    autoComplete="new-password"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-emerald-500"
                  />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    required
                    autoComplete="new-password"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-emerald-500"
                  />
                  {fpMessage && (
                    <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">{fpMessage}</p>
                  )}
                  <button type="submit" disabled={loading} className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2">
                    {loading ? <><Loader2 size={18} className="animate-spin" /> Resetting...</> : 'Reset Password'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Login View */}
          {view === 'login' && (
            <div className="space-y-8">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-600 rounded-2xl mb-6">
                  <img src="/logo.svg" alt="Smart Restro" width="40" height="40" />
                </div>
                <h1 className="text-2xl font-bold text-emerald-600 mb-2">Smart Restro</h1>
                <p className="text-lg text-gray-700 mb-8">Welcome Back, Please login to your account</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Select Role</label>
                  <div className="grid grid-cols-3 gap-3">
                    {roles.map((r) => (
                      <button key={r.id} type="button" onClick={() => setRole(r.id)}
                        className={`p-3 border-2 rounded-lg transition-all text-center ${role === r.id ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-300 hover:border-emerald-300 text-gray-600'}`}
                        disabled={loading}>
                        <div className="text-xs font-semibold">{r.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                  <input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-emerald-500 text-gray-900 placeholder-gray-400 disabled:opacity-50"
                    required disabled={loading} />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                  <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password" placeholder="Enter your Password"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-emerald-500 text-gray-900 placeholder-gray-400 disabled:opacity-50"
                    required disabled={loading} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input id="remember-me" type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded disabled:opacity-50" disabled={loading} />
                    <label htmlFor="remember-me" className="ml-2 text-sm text-gray-600">Remember me</label>
                  </div>
                  <button type="button" onClick={() => setView('forgot')}
                    className="text-sm text-emerald-600 hover:text-emerald-700 font-medium" disabled={loading}>
                    Forgot password?
                  </button>
                </div>

                {error && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">{error}</div>}

                <button type="submit"
                  className="w-full bg-emerald-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  disabled={loading}>
                  {loading ? <><Loader2 size={20} className="animate-spin" />Signing In...</> : 'Sign In'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
