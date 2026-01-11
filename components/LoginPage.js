import React, { useState } from 'react';
import axios from 'axios';
import { UserRole } from '../types';
import { Loader2 } from 'lucide-react';

const LoginPage = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(UserRole.ADMIN);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
      const res = await axios.post('http://localhost:5002/api/auth/login', {
        username,
        password,
        role
      });

      const user = res.data;

      // Store the token in localStorage
      localStorage.setItem('token', user.token);
      
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

      {/* Right side - Login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-8 py-12 bg-gray-50">
        <div className="w-full max-w-md space-y-8">
          {/* Logo and title */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-600 rounded-2xl mb-6">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 12L8 20M16 8L16 24M24 12L24 20" stroke="white" strokeWidth="2" strokeLinecap="round" />
                <path d="M20 8L20 12M12 20L12 24" stroke="white" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-emerald-600 mb-2">Smart Restro</h1>
            <p className="text-lg text-gray-700 mb-8">Welcome Back, Please login to your account</p>
          </div>

          {/* Login form */}
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Select Role</label>
              <div className="grid grid-cols-3 gap-3">
                {roles.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRole(r.id)}
                    className={`p-3 border-2 rounded-lg transition-all text-center ${
                      role === r.id
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-gray-300 hover:border-emerald-300 text-gray-600'
                    }`}
                    disabled={loading}
                  >
                    <div className="text-xs font-semibold">{r.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Username Input */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-emerald-500 text-gray-900 placeholder-gray-400 disabled:opacity-50"
                required
                disabled={loading}
              />
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your Password"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-emerald-500 text-gray-900 placeholder-gray-400 disabled:opacity-50"
                required
                disabled={loading}
              />
            </div>

            {/* Remember me and forgot password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded disabled:opacity-50"
                  disabled={loading}
                />
                <label htmlFor="remember-me" className="ml-2 text-sm text-gray-600">
                  Remember me
                </label>
              </div>
              <button
                type="button"
                className="text-sm text-gray-600 hover:text-emerald-600 disabled:opacity-50"
                disabled={loading}
              >
                Forgot password?
              </button>
            </div>

            {/* Display Error if any */}
            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
                {error}
              </div>
            )}

            {/* Sign in button */}
            <button
              type="submit"
              className="w-full bg-emerald-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
