'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { authAPI } from '@/lib/api';
import { storage } from '@/lib/utils';

interface LoginFormData {
  email: string;
  phoneNumber: string;
  password: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>();

  /* ------------------------------------------------------------------
     🔥 SESSION MESSAGE + AUTO REDIRECT
  -------------------------------------------------------------------*/
  useEffect(() => {
    const message = sessionStorage.getItem('loginMessage');
    if (message) {
      toast.error(message, { duration: 5000 });
      sessionStorage.removeItem('loginMessage');
    }

    const token = storage.get('token');
    const user = storage.get('user');
    const isAdminStored = storage.get('isAdmin');

    if (token && user) {
      if (isAdminStored) {
        router.push('/admin');
      } else if (!user.userDetails) {
        router.push('/user-details');
      } else if (!user.exam) {
        router.push('/select-exam');
      } else {
        router.push('/dashboard');
      }
    }
  }, [router]);

  /* ------------------------------------------------------------------
     LOGIN SUBMIT
  -------------------------------------------------------------------*/
  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);

      console.log('🔵 Login attempt:', { email: data.email, isAdmin });

      const response = await authAPI.login({
        ...data,
        isAdmin,
      });

      console.log('✅ Login response:', response.data);

      if (response.data.success) {
        storage.set('token', response.data.token);
        storage.set('isAdmin', response.data.isAdmin || false);

        if (response.data.user) {
          storage.set('user', response.data.user);
        }

        toast.success('Login successful!');

        if (response.data.isAdmin) {
          router.push('/admin');
        } else if (!response.data.user?.userDetails) {
          router.push('/user-details');
        } else if (!response.data.user?.exam) {
          router.push('/select-exam');
        } else {
          router.push('/dashboard');
        }
      }
    } catch (error: any) {
      console.error('❌ Login error:', error);
      const errorMessage = error.response?.data?.message || 'Login failed. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  /* ------------------------------------------------------------------
     RENDER
  -------------------------------------------------------------------*/
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center p-4">

      {/* BACKGROUND DECORATIONS */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform 
          -translate-x-1/2 -translate-y-1/2 
          w-80 h-80 bg-pink-300 rounded-full 
          mix-blend-multiply filter blur-xl opacity-20 
          animate-blob animation-delay-4000">
        </div>
      </div>

      <div className="max-w-md w-full relative z-10">

        {/* LOGO / BRAND */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4">
            <img src="/logo.svg" alt="Zeta Exams" className="w-full h-full" />
          </div>
          <h1 className="text-4xl font-bold text-gradient mb-2">
            Welcome Back!
          </h1>
          <p className="text-gray-600">
            Login to continue your preparation
          </p>
        </div>

        {/* 🔒 SESSION INFO */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 text-sm">
          <p className="text-blue-900 font-semibold mb-2">
            🔒 Security Feature
          </p>
          <p className="text-blue-800">
            You can only be logged in on one device at a time.
            Logging in here will automatically log you out from other devices.
          </p>
        </div>

        {/* LOGIN FORM CARD */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 backdrop-blur-sm bg-opacity-90">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

            {/* EMAIL */}
            <Input
              label="Email Address"
              type="email"
              placeholder="your@email.com"
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Invalid email address',
                },
              })}
              error={errors.email?.message}
              leftIcon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5
                       a2.5 2.5 0 005 0V12a9 9 0 10-9 9
                       m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              }
            />

            {/* PHONE */}
            {!isAdmin && (
              <Input
                label="Phone Number"
                type="tel"
                placeholder="9876543210"
                {...register('phoneNumber', {
                  required: !isAdmin && 'Phone number is required',
                  pattern: {
                    value: /^[6-9]\d{9}$/,
                    message: 'Invalid phone number',
                  },
                })}
                error={errors.phoneNumber?.message}
                helperText="10-digit Indian mobile number"
                leftIcon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498
                         4.493a1 1 0 01-.502 1.21l-2.257
                         1.13a11.042 11.042 0 005.516
                         5.516l1.13-2.257a1 1 0 011.21-.502
                         l4.493 1.498a1 1 0 01.684.949V19
                         a2 2 0 01-2 2h-1C9.716 21 3 14.284
                         3 6V5z" />
                  </svg>
                }
              />
            )}

            {/* PASSWORD */}
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 8,
                  message: 'Password must be at least 8 characters',
                },
              })}
              error={errors.password?.message}
              leftIcon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2
                       v-6a2 2 0 00-2-2H6a2 2 0 00-2
                       2v6a2 2 0 002 2zm10-10V7
                       a4 4 0 00-8 0v4h8z" />
                </svg>
              }
            />

            {/* OPTIONS */}
            <div className="flex items-center justify-between">
              <label className="flex items-center cursor-pointer group">
                <input
                  type="checkbox"
                  checked={isAdmin}
                  onChange={(e) => setIsAdmin(e.target.checked)}
                  className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
                />
                <span className="ml-2 text-sm text-gray-600 group-hover:text-purple-600 transition-colors">
                  Admin Login
                </span>
              </label>

              <button
                type="button"
                onClick={() => router.push('/forgot-password')}
                className="text-sm text-purple-600 hover:text-purple-700 font-medium transition-colors"
              >
                Forgot Password?
              </button>
            </div>

            {/* SUBMIT */}
            <Button type="submit" fullWidth isLoading={isLoading} size="lg">
              {isLoading ? 'Logging in...' : 'Login'}
            </Button>
          </form>

          {/* REGISTER */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don&apos;t have an account?{' '}
              <button
                onClick={() => router.push('/register')}
                className="text-purple-600 hover:text-purple-700 font-semibold transition-colors"
              >
                Register Now
              </button>
            </p>
          </div>
        </div>

        {/* FOOTER */}
        <p className="text-center mt-6 text-gray-500 text-sm">
          © 2026 Zeta Exams. All rights reserved.
        </p>
      </div>
    </div>
  );
}