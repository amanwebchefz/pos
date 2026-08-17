'use client';

import { useState } from 'react';
import { Lock, Mail, Store } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error, clearError } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      
      // Auto-open customer display in full screen on second monitor (only once per session per user)
      const { user, accessToken } = useAuthStore.getState();
      if (user?.id) {
         const storageKey = `customer-display-opened-${user.id}`;
        const hasOpenedDisplay = sessionStorage.getItem(storageKey);
        
        // Always try to open fresh customer display for each login session
        // This ensures new cashiers get their own display
        if (!hasOpenedDisplay) {
          try {
            // Use backend API to execute bat file for true full screen (kiosk mode)
            // This provides better full screen than JavaScript window.open
            await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/customer-display/open`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${accessToken}`,
                },
                body: JSON.stringify({
                  userId: user.id,
                }),
              },
            );
            
            // Store reference that we opened via backend
            localStorage.setItem(`customer-display-window-${user.id}`, 'backend');
            sessionStorage.setItem(storageKey, 'true');
            console.log('Customer display opened in full screen kiosk mode via backend for user:', user.id);
          } catch (error) {
            console.error('Failed to open customer display via backend, trying JavaScript fallback:', error);
            
            // Fallback: Direct JavaScript window.open (not true full screen, but better than nothing)
            try {
              const customerDisplayUrl = `${window.location.origin}/customer-display?userId=${user.id}`;
              const windowFeatures = 'width=1920,height=1080,left=1920,top=0,resizable=yes,scrollbars=yes';
              const newWindow = window.open(customerDisplayUrl, `customer-display-${user.id}`, windowFeatures);
              
              if (newWindow) {
                localStorage.setItem(`customer-display-window-${user.id}`, 'javascript');
                sessionStorage.setItem(storageKey, 'true');
                console.log('Customer display opened via JavaScript fallback for user:', user.id);
              }
            } catch (fallbackError) {
              console.error('JavaScript fallback also failed:', fallbackError);
            }
          }
        } else {
          console.log('Customer display already opened for this session for user:', user.id);
        }
      }
      
      router.push('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-700 rounded-2xl mb-4">
            <Store className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">POS System</h1>
          <p className="text-slate-600">Sign in to your account</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-colors"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-colors"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              {/* <label className="flex items-center">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-slate-300 bg-white text-slate-600 focus:ring-slate-400 focus:ring-offset-white"
                />
                <span className="ml-2 text-sm text-slate-600">Remember me</span>
              </label> */}
              {/* <Link href="/forgot-password" className="text-sm text-slate-700 hover:text-slate-900 transition-colors">
                Forgot password?
              </Link> */}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-slate-700 hover:bg-slate-800 text-white font-semibold py-3 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-white disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          {/* <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-500">Or continue with</span>
              </div>
            </div>
          </div> */}

          {/* Social Login Buttons */}
          {/* <div className="mt-6 grid grid-cols-2 gap-4">
            <button className="flex items-center justify-center px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors">
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Google
            </button>
            <button className="flex items-center justify-center px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              GitHub
            </button>
          </div> */}
        </div>

        {/* Sign Up Link */}
        {/* <p className="mt-8 text-center text-slate-600">
          Don't have an account?{' '}
          <Link href="/register" className="text-slate-700 hover:text-slate-900 font-medium transition-colors">
            Sign up
          </Link>
        </p> */}
      </div>
    </div>
  );
}
