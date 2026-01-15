'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { authAPI } from '@/lib/api';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors }, watch } = useForm();
  const newPassword = watch('newPassword');

  const sendOTP = async (data: any) => {
    try {
      setLoading(true);
      setEmail(data.email);
      
      const response = await authAPI.sendOTP(data.email, 'password-reset');
      
      if (response.data.success) {
        toast.success('OTP sent to your email!');
        setStep(2);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
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

  const verifyOTP = () => {
    const otpValue = otp.join('');
    if (otpValue.length !== 6) {
      toast.error('Please enter complete OTP');
      return;
    }
    setStep(3);
  };

  const resetPassword = async (data: any) => {
    try {
      setLoading(true);
      
      const response = await authAPI.resetPassword({
        email,
        otp: otp.join(''),
        newPassword: data.newPassword,
      });

      if (response.data.success) {
        toast.success('Password reset successful!');
        router.push('/');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Password reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl shadow-lg shadow-purple-500/50 mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gradient mb-2">Reset Password</h1>
          <p className="text-gray-600">
            {step === 1 && "Enter your email to receive OTP"}
            {step === 2 && "Enter the OTP sent to your email"}
            {step === 3 && "Enter your new password"}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Step 1: Email */}
          {step === 1 && (
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
                error={errors.email?.message as string}
                leftIcon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                }
              />

              <Button type="submit" fullWidth isLoading={loading} size="lg">
                Send OTP
              </Button>
            </form>
          )}

          {/* Step 2: OTP */}
          {step === 2 && (
            <div>
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

              <Button fullWidth size="lg" onClick={verifyOTP}>
                Verify OTP
              </Button>

              <div className="mt-4 text-center">
                <button
                  onClick={() => sendOTP({ email })}
                  className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                >
                  Resend OTP
                </button>
              </div>
            </div>
          )}

          {/* Step 3: New Password */}
          {step === 3 && (
            <form onSubmit={handleSubmit(resetPassword)} className="space-y-5">
              <Input
                label="New Password"
                type="password"
                placeholder="••••••••"
                {...register('newPassword', {
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
                error={errors.newPassword?.message as string}
              />

              <Input
                label="Confirm Password"
                type="password"
                placeholder="••••••••"
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: (value) => value === newPassword || 'Passwords do not match',
                })}
                error={errors.confirmPassword?.message as string}
              />

              <Button type="submit" fullWidth isLoading={loading} size="lg">
                Reset Password
              </Button>
            </form>
          )}

          <div className="mt-6 text-center">
            <button
              onClick={() => router.push('/')}
              className="text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}