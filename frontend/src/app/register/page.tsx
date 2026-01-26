'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { authAPI } from '@/lib/api';
import { storage } from '@/lib/utils';

interface RegisterFormData {
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
  termsAccepted: boolean;
}

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [verifying, setVerifying] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    getValues,
  } = useForm<RegisterFormData>();

  const password = watch('password');

  const sendOTP = async (data: RegisterFormData) => {
    try {
      setIsLoading(true);
      
      const response = await authAPI.sendOTP(data.email, 'registration');

      if (response.data.success) {
        setOtpSent(true);
        toast.success('OTP sent to your email!');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to send OTP';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const verifyAndRegister = async () => {
    const otpValue = otp.join('');
    
    if (otpValue.length !== 6) {
      toast.error('Please enter complete OTP');
      return;
    }

    try {
      setVerifying(true);
      const formData = getValues();

      console.log('🔵 Starting registration with OTP...');

      const response = await authAPI.register({
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        otp: otpValue,
      });

      console.log('✅ Registration API response:', response.data);

      // FIX: Check response structure properly
      if (response.data && response.data.success) {
        // Store auth data
        if (response.data.token) {
          storage.set('token', response.data.token);
          console.log('✅ Token stored');
        }
        
        if (response.data.user) {
          storage.set('user', response.data.user);
          console.log('✅ User data stored');
        }
        
        toast.success('✅ Registration successful!');
        
        // Delay navigation slightly
        setTimeout(() => {
          console.log('🔀 Navigating to user-details...');
          router.push('/user-details');
        }, 500);
      } else {
        // Handle unsuccessful response
        const errorMsg = response.data?.message || 'Registration failed';
        console.error('❌ Registration failed:', errorMsg);
        toast.error(errorMsg);
      }
    } catch (error: any) {
      console.error('💥 Registration error:', error);
      
      // FIX: Better error handling
      if (error.response?.data?.success === true) {
        // Sometimes the response is actually successful but axios treats it as error
        console.log('⚠️ False error - registration was actually successful');
        
        if (error.response.data.token) {
          storage.set('token', error.response.data.token);
        }
        if (error.response.data.user) {
          storage.set('user', error.response.data.user);
        }
        
        toast.success('✅ Registration successful!');
        setTimeout(() => {
          router.push('/user-details');
        }, 500);
      } else {
        // Actual error
        const errorMessage = error.response?.data?.message || error.message || 'Registration failed';
        toast.error(errorMessage);
      }
    } finally {
      setVerifying(false);
    }
  };

  if (otpSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gradient mb-2">Verify Email</h2>
              <p className="text-gray-600">
                We've sent a 6-digit OTP to<br />
                <span className="font-semibold text-purple-600">{getValues('email')}</span><br />
                OTP Not Recieved? Check spam folder in Email.
              </p>
            </div>

            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
                Enter OTP
              </label>
              <div className="flex justify-center gap-2">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className="w-12 h-12 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all"
                  />
                ))}
              </div>
            </div>

            <Button
              fullWidth
              size="lg"
              onClick={verifyAndRegister}
              isLoading={verifying}
            >
              {verifying ? 'Verifying...' : 'Verify & Continue'}
            </Button>

            <div className="mt-4 text-center">
              <button
                onClick={() => sendOTP(getValues())}
                className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                disabled={isLoading}
              >
                Didn't receive? Resend OTP
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl shadow-lg shadow-purple-500/50 mb-4">
            <span className="text-3xl font-bold text-white">Z</span>
          </div>
          <h1 className="text-4xl font-bold text-gradient mb-2">Create Account</h1>
          <p className="text-gray-600">Join Zeta Exams and start your preparation</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <form onSubmit={handleSubmit(sendOTP)} className="space-y-5">
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
            />

            <Input
              label="Phone Number"
              type="tel"
              placeholder="9876543210"
              {...register('phoneNumber', {
                required: 'Phone number is required',
                pattern: {
                  value: /^[6-9]\d{9}$/,
                  message: 'Invalid phone number',
                },
              })}
              error={errors.phoneNumber?.message}
              helperText="Used for account security"
            />

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
                pattern: {
                  value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
                  message: 'Must contain uppercase, lowercase, number and special character',
                },
              })}
              error={errors.password?.message}
            />

            <Input
              label="Confirm Password"
              type="password"
              placeholder="••••••••"
              {...register('confirmPassword', {
                required: 'Please confirm your password',
                validate: (value) =>
                  value === password || 'Passwords do not match',
              })}
              error={errors.confirmPassword?.message}
            />

            <div className="flex items-start">
              <input
                type="checkbox"
                id="terms"
                {...register('termsAccepted', {
                  required: 'You must accept the terms',
                })}
                className="mt-1 w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
              />
              <label htmlFor="terms" className="ml-2 text-sm text-gray-600">
                I agree to the{' '}
                <a href="#" className="text-purple-600 hover:text-purple-700 font-medium">
                  Terms & Conditions
                </a>{' '}
                and{' '}
                <a href="#" className="text-purple-600 hover:text-purple-700 font-medium">
                  Privacy Policy
                </a>
              </label>
            </div>
            {errors.termsAccepted && (
              <p className="text-sm text-red-600">{errors.termsAccepted.message}</p>
            )}

            <Button type="submit" fullWidth isLoading={isLoading} size="lg">
              {isLoading ? 'Sending OTP...' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <button
                onClick={() => router.push('/')}
                className="text-purple-600 hover:text-purple-700 font-semibold transition-colors"
              >
                Login
              </button>
            </p>
          </div>
        </div>

        <p className="text-center mt-6 text-gray-500 text-sm">
          © 2026 Zeta Exams. All rights reserved.
        </p>
      </div>
    </div>
  );
}