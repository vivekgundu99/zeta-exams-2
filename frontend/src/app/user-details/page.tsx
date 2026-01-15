'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { userAPI } from '@/lib/api';
import { INDIAN_STATES } from '@/lib/utils';

interface UserDetailsFormData {
  name: string;
  profession: 'student' | 'teacher';
  grade?: string;
  exam: 'jee' | 'neet';
  collegeName?: string;
  state: string;
  lifeAmbition?: string;
}

export default function UserDetailsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<UserDetailsFormData>();

  const profession = watch('profession');
  const name = watch('name');

  const onSubmit = async (data: UserDetailsFormData) => {
    try {
      setIsLoading(true);

      // Validate required fields
      if (!data.name?.trim()) {
        toast.error('Name is required');
        return;
      }

      if (!data.profession) {
        toast.error('Please select your profession');
        return;
      }

      if (!data.exam) {
        toast.error('Please select your exam');
        return;
      }

      if (data.profession === 'student' && !data.grade) {
        toast.error('Please select your grade');
        return;
      }

      if (!data.state) {
        toast.error('Please select your state');
        return;
      }

      // Prepare data
      const submitData = {
        name: data.name.trim(),
        profession: data.profession,
        grade: data.profession === 'student' ? data.grade : 'other',
        exam: data.exam,
        collegeName: data.collegeName?.trim() || '',
        state: data.state,
        lifeAmbition: data.lifeAmbition?.trim() || '',
      };

      console.log('Submitting user details:', submitData);

      const response = await userAPI.updateDetails(submitData);
      
      console.log('Response:', response.data);

      if (response.data.success) {
        toast.success('Profile updated successfully!');
        // Small delay to show success message
        setTimeout(() => {
          router.push('/subscription');
        }, 500);
      } else {
        toast.error(response.data.message || 'Update failed');
      }
    } catch (error: any) {
      console.error('User details error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Update failed';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 p-4">
      <div className="max-w-2xl mx-auto pt-12">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gradient mb-2">
              Complete Your Profile
            </h1>
            <p className="text-gray-600">
              Tell us more about yourself to personalize your experience
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Name */}
            <Input
              label="Full Name"
              placeholder="Vivek Gundu"
              {...register('name', {
                required: 'Name is required',
                minLength: {
                  value: 1,
                  message: 'Name cannot be empty',
                },
                maxLength: {
                  value: 50,
                  message: 'Max 50 characters',
                },
              })}
              error={errors.name?.message}
              helperText={`${name?.length || 0}/50 characters`}
            />

            {/* Profession */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                I am a <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-4">
                {['student', 'teacher'].map((prof) => (
                  <label
                    key={prof}
                    className="flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all hover:border-purple-500 has-[:checked]:border-purple-600 has-[:checked]:bg-purple-50"
                  >
                    <input
                      type="radio"
                      value={prof}
                      {...register('profession', {
                        required: 'Please select your profession',
                      })}
                      className="sr-only"
                    />
                    <span className="capitalize font-medium">{prof}</span>
                  </label>
                ))}
              </div>
              {errors.profession && (
                <p className="mt-1 text-sm text-red-600">{errors.profession.message}</p>
              )}
            </div>

            {/* Grade (only for students) */}
            {profession === 'student' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Grade <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('grade', {
                    required: profession === 'student' ? 'Please select your grade' : false,
                  })}
                  className="w-full px-4 py-2.5 border-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                >
                  <option value="">Select Grade</option>
                  <option value="9th">9th Class</option>
                  <option value="10th">10th Class</option>
                  <option value="11th">11th Class</option>
                  <option value="12th">12th Class</option>
                  <option value="12th passout">12th Pass Out</option>
                  <option value="other">Other</option>
                </select>
                {errors.grade && (
                  <p className="mt-1 text-sm text-red-600">{errors.grade.message}</p>
                )}
              </div>
            )}

            {/* Exam */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preparing For <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { value: 'jee', label: 'JEE Main', icon: '🎯' },
                  { value: 'neet', label: 'NEET', icon: '🏥' },
                ].map((exam) => (
                  <label
                    key={exam.value}
                    className="flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer transition-all hover:border-purple-500 has-[:checked]:border-purple-600 has-[:checked]:bg-purple-50"
                  >
                    <input
                      type="radio"
                      value={exam.value}
                      {...register('exam', {
                        required: 'Please select your exam',
                      })}
                      className="sr-only"
                    />
                    <span className="text-3xl mb-2">{exam.icon}</span>
                    <span className="font-medium">{exam.label}</span>
                  </label>
                ))}
              </div>
              {errors.exam && (
                <p className="mt-1 text-sm text-red-600">{errors.exam.message}</p>
              )}
            </div>

            {/* College/School Name */}
            <Input
              label="College/School Name"
              placeholder="RR Apollo Academy"
              {...register('collegeName', {
                maxLength: {
                  value: 50,
                  message: 'Max 50 characters',
                },
              })}
              error={errors.collegeName?.message}
            />

            {/* State */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State <span className="text-red-500">*</span>
              </label>
              <select
                {...register('state', {
                  required: 'Please select your state',
                })}
                className="w-full px-4 py-2.5 border-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
              >
                <option value="">Select State</option>
                {INDIAN_STATES.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
              {errors.state && (
                <p className="mt-1 text-sm text-red-600">{errors.state.message}</p>
              )}
            </div>

            {/* Life Ambition */}
            <Input
              label="Life Ambition"
              placeholder="Engineer, Doctor, etc."
              {...register('lifeAmbition', {
                maxLength: {
                  value: 50,
                  message: 'Max 50 characters',
                },
              })}
              error={errors.lifeAmbition?.message}
            />

            {/* Submit Button */}
            <Button type="submit" fullWidth size="lg" isLoading={isLoading}>
              {isLoading ? 'Saving...' : 'Save & Continue'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}