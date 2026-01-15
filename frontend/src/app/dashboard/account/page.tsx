'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Dropdown from '@/components/ui/Dropdown';
import Modal from '@/components/ui/Modal';
import { userAPI } from '@/lib/api';
import { formatDate, INDIAN_STATES } from '@/lib/utils';
import { useForm } from 'react-hook-form';

export default function AccountPage() {
  const [user, setUser] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const [changePasswordModal, setChangePasswordModal] = useState(false);
  const [ticketModal, setTicketModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors }, watch, reset } = useForm();
  const { register: registerPassword, handleSubmit: handleSubmitPassword, formState: { errors: passwordErrors }, watch: watchPassword } = useForm();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await userAPI.getProfile();
      if (response.data.success) {
        setUser(response.data.user);
        setSubscription(response.data.subscription);
        reset(response.data.user);
      }
    } catch (error) {
      toast.error('Failed to load account data');
    }
  };

  const updateDetails = async (data: any) => {
    try {
      setLoading(true);
      await userAPI.editDetails(data);
      toast.success('Details updated successfully!');
      setEditMode(false);
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (data: any) => {
    try {
      setLoading(true);
      await userAPI.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success('Password changed successfully! Please login again.');
      setChangePasswordModal(false);
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Password change failed');
    } finally {
      setLoading(false);
    }
  };

  const profession = watch('profession');
  const newPassword = watchPassword('newPassword');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>

      {/* Subscription Info */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Subscription</h2>
        </CardHeader>
        <CardBody>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="px-4 py-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full font-semibold">
                  {subscription?.subscription?.toUpperCase()}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  subscription?.subscriptionStatus === 'active'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {subscription?.subscriptionStatus}
                </span>
              </div>
              {subscription?.subscriptionEndTime && subscription?.subscription !== 'free' && (
                <p className="text-sm text-gray-600">
                  Valid until: {formatDate(subscription.subscriptionEndTime)}
                </p>
              )}
            </div>
            <Button onClick={() => window.location.href = '/subscription'}>
              {subscription?.subscription === 'free' ? 'Upgrade Plan' : 'Manage Plan'}
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Personal Information</h2>
            {!editMode && (
              <Button variant="outline" size="sm" onClick={() => setEditMode(true)}>
                Edit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardBody>
          {editMode ? (
            <form onSubmit={handleSubmit(updateDetails)} className="space-y-4">
              <Input
                label="Full Name"
                {...register('name', { maxLength: 50 })}
                error={errors.name?.message as string}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profession
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {['student', 'teacher'].map((prof) => (
                    <label
                      key={prof}
                      className="flex items-center p-3 border-2 rounded-lg cursor-pointer has-[:checked]:border-purple-600 has-[:checked]:bg-purple-50"
                    >
                      <input
                        type="radio"
                        value={prof}
                        {...register('profession')}
                        className="mr-2"
                      />
                      <span className="capitalize">{prof}</span>
                    </label>
                  ))}
                </div>
              </div>

              {profession === 'student' && (
                <Dropdown
                  label="Grade"
                  {...register('grade')}
                  options={[
                    { value: '9th', label: '9th Class' },
                    { value: '10th', label: '10th Class' },
                    { value: '11th', label: '11th Class' },
                    { value: '12th', label: '12th Class' },
                    { value: '12th passout', label: '12th Pass Out' },
                    { value: 'other', label: 'Other' },
                  ]}
                />
              )}

              <Input
                label="College/School Name"
                {...register('collegeName', { maxLength: 50 })}
              />

              <Dropdown
                label="State"
                {...register('state')}
                options={[
                  { value: '', label: 'Select State' },
                  ...INDIAN_STATES.map(s => ({ value: s, label: s }))
                ]}
              />

              <Input
                label="Life Ambition"
                {...register('lifeAmbition', { maxLength: 50 })}
              />

              <div className="flex gap-3">
                <Button type="submit" isLoading={loading}>
                  Save Changes
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setEditMode(false);
                    reset(user);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-medium">{user?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium">{user?.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-medium">{user?.phoneNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Profession</p>
                  <p className="font-medium capitalize">{user?.profession}</p>
                </div>
                {user?.profession === 'student' && (
                  <div>
                    <p className="text-sm text-gray-600">Grade</p>
                    <p className="font-medium">{user?.grade}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600">Exam</p>
                  <p className="font-medium uppercase">{user?.exam}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">College/School</p>
                  <p className="font-medium">{user?.collegeName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">State</p>
                  <p className="font-medium">{user?.state}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Life Ambition</p>
                  <p className="font-medium">{user?.lifeAmbition}</p>
                </div>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Security</h2>
        </CardHeader>
        <CardBody>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Password</p>
              <p className="text-sm text-gray-600">Last changed: {user?.lastPasswordChange || 'Never'}</p>
            </div>
            <Button variant="outline" onClick={() => setChangePasswordModal(true)}>
              Change Password
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Support */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Support</h2>
        </CardHeader>
        <CardBody>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Need help?</p>
              <p className="text-sm text-gray-600">Raise a support ticket</p>
            </div>
            <Button variant="outline" onClick={() => setTicketModal(true)}>
              Raise Ticket
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Change Password Modal */}
      <Modal
        isOpen={changePasswordModal}
        onClose={() => setChangePasswordModal(false)}
        title="Change Password"
      >
        <form onSubmit={handleSubmitPassword(changePassword)} className="space-y-4">
          <Input
            label="Current Password"
            type="password"
            {...registerPassword('currentPassword', { required: 'Required' })}
            error={passwordErrors.currentPassword?.message as string}
          />

          <Input
            label="New Password"
            type="password"
            {...registerPassword('newPassword', {
              required: 'Required',
              minLength: { value: 8, message: 'Min 8 characters' }
            })}
            error={passwordErrors.newPassword?.message as string}
          />

          <Input
            label="Confirm New Password"
            type="password"
            {...registerPassword('confirmPassword', {
              required: 'Required',
              validate: (value) => value === newPassword || 'Passwords do not match'
            })}
            error={passwordErrors.confirmPassword?.message as string}
          />

          <div className="flex gap-3">
            <Button type="submit" isLoading={loading} className="flex-1">
              Change Password
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setChangePasswordModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* Ticket Modal - You can expand this */}
      <Modal
        isOpen={ticketModal}
        onClose={() => setTicketModal(false)}
        title="Raise Support Ticket"
      >
        <div className="space-y-4">
          <Input label="Issue Description" placeholder="Describe your issue..." />
          <Button fullWidth>Submit Ticket</Button>
        </div>
      </Modal>
    </div>
  );
}