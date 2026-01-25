// frontend/src/app/dashboard/page.tsx - FIXED: Backend limits only
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Card, { CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Loader from '@/components/ui/Loader';
import { userAPI } from '@/lib/api';
import { getGreeting, formatDate } from '@/lib/utils';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [limits, setLimits] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('📊 Loading dashboard data...');

      // Single API call to get profile (includes limits from backend)
      const response = await userAPI.getProfile();
      
      console.log('✅ Profile response:', response.data);

      if (response.data.success) {
        setUser(response.data.user);
        setSubscription(response.data.subscription);
        // 🔥 BACKEND LIMITS ARE THE SINGLE SOURCE OF TRUTH
        setLimits(response.data.limits);
        
        console.log('✅ Dashboard loaded:', {
          user: response.data.user?.name,
          subscription: response.data.subscription?.subscription,
          limits: response.data.limits
        });
      } else {
        setError('Failed to load dashboard data');
      }
    } catch (error: any) {
      console.error('💥 Dashboard load error:', error);
      setError(error.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: 'Chapterwise Questions',
      description: 'Practice questions topic-wise',
      icon: '📚',
      href: '/dashboard/questions',
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      title: 'Chapter Tests',
      description: '10 question tests per chapter',
      icon: '📝',
      href: '/dashboard/chapter-tests',
      gradient: 'from-green-500 to-emerald-500',
    },
    {
      title: 'Formulas',
      description: 'Quick reference formulas',
      icon: '📖',
      href: '/dashboard/formulas',
      gradient: 'from-purple-500 to-pink-500',
      locked: subscription?.subscription !== 'gold',
    },
    {
      title: 'Mock Tests',
      description: 'Full-length practice tests',
      icon: '🎯',
      href: '/dashboard/mock-tests',
      gradient: 'from-orange-500 to-red-500',
    },
  ];

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-red-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader size="lg" text="Loading dashboard..." />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-2 border-red-200">
        <CardBody className="p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Error Loading Dashboard</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={loadDashboardData}>Retry</Button>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <Card gradient className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
        <CardBody className="p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {getGreeting()}, {user?.name || 'User'}! 👋
              </h1>
              <p className="text-purple-100">
                Preparing for {subscription?.exam?.toUpperCase() || 'Exam'} • {formatDate(new Date())}
              </p>
            </div>
            {subscription && (
              <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg px-6 py-3">
                <p className="text-sm text-purple-100 mb-1">Current Plan</p>
                <p className="text-2xl font-bold">{subscription.subscription.toUpperCase()}</p>
                {subscription.subscriptionEndTime && subscription.subscription !== 'free' && (
                  <p className="text-xs text-purple-100 mt-1">
                    {subscription.subscriptionStatus === 'active' 
                      ? `Valid till ${formatDate(subscription.subscriptionEndTime)}`
                      : 'Expired - Please renew'
                    }
                  </p>
                )}
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Stats Grid - 🔥 BACKEND LIMITS ONLY */}
      {limits ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardBody>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Questions Today</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {limits.questions?.used || 0}/{limits.questions?.limit || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">📚</span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${getProgressColor(
                    ((limits.questions?.used || 0) / (limits.questions?.limit || 1)) * 100
                  )}`}
                  style={{
                    width: `${Math.min(((limits.questions?.used || 0) / (limits.questions?.limit || 1)) * 100, 100)}%`,
                  }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-2">Resets daily at 4 AM IST</p>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Chapter Tests Today</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {limits.chapterTests?.used || 0}/{limits.chapterTests?.limit || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">📝</span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${getProgressColor(
                    ((limits.chapterTests?.used || 0) / (limits.chapterTests?.limit || 1)) * 100
                  )}`}
                  style={{
                    width: `${Math.min(((limits.chapterTests?.used || 0) / (limits.chapterTests?.limit || 1)) * 100, 100)}%`,
                  }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-2">Resets daily at 4 AM IST</p>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Mock Tests Today</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {limits.mockTests?.used || 0}/{limits.mockTests?.limit || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">🎯</span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${getProgressColor(
                    ((limits.mockTests?.used || 0) / (limits.mockTests?.limit || 1)) * 100
                  )}`}
                  style={{
                    width: `${Math.min(((limits.mockTests?.used || 0) / (limits.mockTests?.limit || 1)) * 100, 100)}%`,
                  }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-2">Resets daily at 4 AM IST</p>
            </CardBody>
          </Card>
        </div>
      ) : (
        <Card>
          <CardBody className="p-8 text-center">
            <p className="text-gray-600">Loading usage limits...</p>
          </CardBody>
        </Card>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action) => (
            <Card
              key={action.title}
              hover={!action.locked}
              className="relative overflow-hidden"
            >
              {action.locked && (
                <div className="absolute top-2 right-2 bg-gray-900 text-white text-xs px-2 py-1 rounded-full">
                  🔒 Gold Only
                </div>
              )}
              <CardBody className="text-center p-6">
                <div
                  className={`w-16 h-16 bg-gradient-to-r ${action.gradient} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg`}
                >
                  <span className="text-3xl">{action.icon}</span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{action.title}</h3>
                <p className="text-sm text-gray-600 mb-4">{action.description}</p>
                <Button
                  size="sm"
                  fullWidth
                  variant={action.locked ? 'outline' : 'primary'}
                  onClick={() => {
                    if (action.locked) {
                      router.push('/subscription');
                    } else {
                      router.push(action.href);
                    }
                  }}
                >
                  {action.locked ? 'Upgrade to Access' : 'Get Started'}
                </Button>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>

      {/* Subscription Alert */}
      {subscription?.subscription === 'free' && (
        <Card className="border-2 border-purple-200">
          <CardBody className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">⭐</span>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Upgrade to Premium</h3>
                  <p className="text-sm text-gray-600">
                    Get unlimited questions, chapter tests, formulas, and mock tests
                  </p>
                </div>
              </div>
              <Button onClick={() => router.push('/subscription')}>
                View Plans
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {subscription?.subscription !== 'free' && subscription?.subscriptionStatus === 'inactive' && (
        <Card className="border-2 border-red-200 bg-red-50">
          <CardBody className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">⚠️</span>
                </div>
                <div>
                  <h3 className="font-bold text-red-900 mb-1">Subscription Expired</h3>
                  <p className="text-sm text-red-700">
                    Your subscription has expired. Renew now to continue accessing premium features.
                  </p>
                </div>
              </div>
              <Button variant="danger" onClick={() => router.push('/subscription')}>
                Renew Now
              </Button>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}