'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { userAPI } from '@/lib/api';
import { INDIAN_STATES } from '@/types';

export default function UserDetailsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const profession = watch('profession');

  const onSubmit = async (data: any) => {
    try {
      setIsLoading(true);
      await userAPI.updateDetails(data);
      toast.success('Profile updated successfully!');
      router.push('/select-exam');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Update failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 p-4">
      <div className="max-w-2xl mx-auto pt-12">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h1 className="text-3xl font-bold text-gradient mb-2">
            Complete Your Profile
          </h1>
          <p className="text-gray-600 mb-8">
            Tell us more about yourself
          </p>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-6"
          >
            <Input
              label="Full Name"
              placeholder="Vivek Gundu"
              {...register('name', {
                required: 'Name is required',
                maxLength: {
                  value: 50,
                  message: 'Max 50 characters',
                },
              })}
              error={errors.name?.message?.toString()}
              helperText={`${watch('name')?.length || 0}/50 characters`}
            />

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
                        required: true,
                      })}
                      className="sr-only"
                    />
                    <span className="capitalize font-medium">
                      {prof}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {profession === 'student' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Grade <span className="text-red-500">*</span>
                </label>

                <select
                  {...register('grade', {
                    required: profession === 'student',
                  })}
                  className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select Grade</option>
                  <option value="9th">9th Class</option>
                  <option value="10th">10th Class</option>
                  <option value="11th">11th Class</option>
                  <option value="12th">12th Class</option>
                  <option value="12th passout">
                    12th Pass Out
                  </option>
                  <option value="other">Other</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preparing For{' '}
                <span className="text-red-500">*</span>
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
                        required: true,
                      })}
                      className="sr-only"
                    />
                    <span className="text-3xl mb-2">
                      {exam.icon}
                    </span>
                    <span className="font-medium">
                      {exam.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <Input
              label="College/School Name"
              placeholder="RR Apollo Academy"
              {...register('collegeName', {
                maxLength: {
                  value: 50,
                  message: 'Max 50 characters',
                },
              })}
              error={errors.collegeName?.message?.toString()}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State <span className="text-red-500">*</span>
              </label>

              <select
                {...register('state', {
                  required: 'State is required',
                })}
                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Select State</option>
                {INDIAN_STATES.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Life Ambition"
              placeholder="Engineer"
              {...register('lifeAmbition', {
                maxLength: {
                  value: 50,
                  message: 'Max 50 characters',
                },
              })}
              error={errors.lifeAmbition?.message?.toString()}
            />

            <Button
              type="submit"
              fullWidth
              size="lg"
              isLoading={isLoading}
            >
              Save & Continue
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
