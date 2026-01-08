import React, { useState } from 'react';
import { UserRole } from '../types';

const LoginPage = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(UserRole.ADMIN);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please fill in all fields');
      return;
    }

    // Mock Authentication Logic - use selected role
    const user = {
      id: Math.random().toString(36).substr(2, 9),
      username,
      role,
      name: username.charAt(0).toUpperCase() + username.slice(1)
    };
    onLogin(user);
  };

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
                <path d="M8 12L8 20M16 8L16 24M24 12L24 20" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                <path d="M20 8L20 12M12 20L12 24" stroke="white" strokeWidth="2" strokeLinecap="round"/>
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
                <button
                  type="button"
                  onClick={() => setRole(UserRole.ADMIN)}
                  className={`p-3 border-2 rounded-lg transition-all text-center ${
                    role === UserRole.ADMIN 
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700' 
                      : 'border-gray-300 hover:border-emerald-300 text-gray-600'
                  }`}
                >
                  <div className="text-xs font-semibold">Admin</div>
                </button>
                <button
                  type="button"
                  onClick={() => setRole(UserRole.WAITER)}
                  className={`p-3 border-2 rounded-lg transition-all text-center ${
                    role === UserRole.WAITER 
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700' 
                      : 'border-gray-300 hover:border-emerald-300 text-gray-600'
                  }`}
                >
                  <div className="text-xs font-semibold">Waiter</div>
                </button>
                <button
                  type="button"
                  onClick={() => setRole(UserRole.KITCHEN)}
                  className={`p-3 border-2 rounded-lg transition-all text-center ${
                    role === UserRole.KITCHEN 
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700' 
                      : 'border-gray-300 hover:border-emerald-300 text-gray-600'
                  }`}
                >
                  <div className="text-xs font-semibold">Kitchen</div>
                </button>
              </div>
            </div>
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
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-emerald-500 text-gray-900 placeholder-gray-400"
                required
              />
            </div>

            <div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your Password"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-emerald-500 text-gray-900 placeholder-gray-400"
                required
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
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 text-sm text-gray-600">
                  Remember me
                </label>
              </div>
              <button
                type="button"
                className="text-sm text-gray-600 hover:text-emerald-600"
              >
                Forgot password ?
              </button>
            </div>

            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
                {error}
              </div>
            )}

            {/* Sign in button */}
            <button
              type="submit"
              className="w-full bg-emerald-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-colors"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;