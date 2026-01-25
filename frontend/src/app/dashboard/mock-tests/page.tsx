// frontend/src/app/dashboard/mock-tests/page.tsx - FIXED AUTO-ABANDON + CLEAR ONGOING
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import Card, { CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Loader from '@/components/ui/Loader';
import { mockTestsAPI, userAPI } from '@/lib/api';
import { formatDate } from '@/lib/utils';

export default function MockTestsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('all');
  const [tests, setTests] = useState<any[]>([]);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [examType, setExamType] = useState('');
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [ongoingTest, setOngoingTest] = useState<any>(null);
  const [clearing, setClearing] = useState(false); // 🔥 NEW

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const profileResponse = await userAPI.getProfile();
      if (profileResponse.data.success) {
        const userExam = profileResponse.data.user.exam;
        const userSubscription = profileResponse.data.subscription;
        
        setExamType(userExam);
        setSubscription(userSubscription);

        if (userSubscription.subscription === 'gold') {
          const testsResponse = await mockTestsAPI.getList(userExam, 'all');
          if (testsResponse.data.success) {
            setTests(testsResponse.data.tests || []);
          }

          const attemptsResponse = await mockTestsAPI.getAttempts();
          if (attemptsResponse.data.success) {
            const allAttempts = attemptsResponse.data.attempts || [];
            setAttempts(allAttempts);
            
            const ongoing = allAttempts.find((a: any) => a.status === 'ongoing');
            
            // 🔥 NEW: Auto-abandon if ongoing test is older than 4 hours
            if (ongoing) {
              const testStartTime = new Date(ongoing.startTime).getTime();
              const now = new Date().getTime();
              const hoursPassed = (now - testStartTime) / (1000 * 60 * 60);
              
              if (hoursPassed > 4) {
                console.log('⚠️ Auto-abandoning old test (>4 hours)');
                await abandonOldTest(ongoing._id);
                // Reload data after abandoning
                setTimeout(() => loadData(), 1000);
                return;
              }
              
              setOngoingTest(ongoing);
              setActiveTab('ongoing');
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to load mock tests');
    } finally {
      setLoading(false);
    }
  };

  // 🔥 NEW: Abandon old ongoing tests
  const abandonOldTest = async (attemptId: string) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://zeta-exams-backend-2.vercel.app';
      const response = await fetch(`${API_URL}/api/mock-tests/abandon`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ attemptId }),
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success('Old test automatically abandoned');
      }
    } catch (error) {
      console.error('Failed to abandon test:', error);
    }
  };

  // 🔥 NEW: Clear stuck ongoing tests
  const clearOngoingTests = async () => {
    if (!window.confirm('This will abandon all ongoing tests. Continue?')) {
      return;
    }
    
    try {
      setClearing(true);
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://zeta-exams-backend-2.vercel.app';
      
      const response = await fetch(`${API_URL}/api/mock-tests/clear-ongoing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Ongoing tests cleared successfully!');
        setOngoingTest(null);
        // Reload data
        setTimeout(() => loadData(), 1000);
      } else {
        toast.error(data.message || 'Failed to clear tests');
      }
    } catch (error) {
      console.error('Failed to clear ongoing tests:', error);
      toast.error('Failed to clear ongoing tests');
    } finally {
      setClearing(false);
    }
  };

  const resumeTest = () => {
    if (ongoingTest) {
      router.push(`/dashboard/mock-tests/${ongoingTest.testId}/attempt`);
    }
  };

  const startTest = (testId: string) => {
    if (ongoingTest) {
      toast.error('Please complete your ongoing test first');
      return;
    }
    router.push(`/dashboard/mock-tests/${testId}/attempt`);
  };

  const viewResult = (attemptId: string) => {
    router.push(`/dashboard/mock-tests/result/${attemptId}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader size="lg" text="Loading mock tests..." />
      </div>
    );
  }

  if (subscription?.subscription !== 'gold') {
    return (
      <Card className="border-2 border-yellow-200">
        <CardBody className="p-12 text-center">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">👑</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Upgrade to Gold for Mock Tests
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Full-length mock tests are exclusive to Gold subscribers
          </p>
          <Button size="lg" onClick={() => router.push('/subscription')}>
            Upgrade to Gold Plan
          </Button>
        </CardBody>
      </Card>
    );
  }

  let displayTests = tests;
  if (activeTab === 'attempted') {
    const attemptedTestIds = attempts
      .filter(a => a.status === 'completed')
      .map(a => a.testId);
    displayTests = tests.filter(t => attemptedTestIds.includes(t.testId));
  } else if (activeTab === 'unattempted') {
    const attemptedTestIds = attempts.map(a => a.testId);
    displayTests = tests.filter(t => !attemptedTestIds.includes(t.testId));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Mock Tests</h1>
          <p className="text-gray-600 dark:text-gray-400">Full-length practice tests</p>
        </div>
      </div>

      {/* 🔥 ADMIN/DEBUG: Clear stuck ongoing tests */}
      {ongoingTest && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-yellow-900 dark:text-yellow-100">Stuck on Ongoing Test?</h3>
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                If you can't start new tests, click here to clear the ongoing test.
              </p>
            </div>
            <Button 
              variant="danger"
              size="sm"
              onClick={clearOngoingTests}
              isLoading={clearing}
            >
              Clear Ongoing Test
            </Button>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        {[
          { value: 'all', label: 'All Tests' },
          { value: 'ongoing', label: '⏱️ Ongoing', badge: ongoingTest ? '1' : null },
          { value: 'attempted', label: 'Attempted' },
          { value: 'unattempted', label: 'Unattempted' },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            disabled={tab.value === 'ongoing' && !ongoingTest}
            className={`px-4 py-2 font-medium transition-colors relative ${
              activeTab === tab.value
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 disabled:text-gray-300 dark:disabled:text-gray-600'
            }`}
          >
            {tab.label}
            {tab.badge && (
              <span className="ml-2 px-2 py-0.5 bg-orange-500 text-white text-xs rounded-full">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Ongoing Test Tab */}
      {activeTab === 'ongoing' && ongoingTest && (
        <Card className="border-2 border-orange-200 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-800">
          <CardBody className="p-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-6 flex-1">
                <div className="w-20 h-20 bg-orange-100 dark:bg-orange-800 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-4xl">⏱️</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-orange-900 dark:text-orange-100 mb-2">
                    Ongoing Test
                  </h3>
                  <p className="text-lg text-orange-800 dark:text-orange-200 mb-1">
                    {ongoingTest.testName}
                  </p>
                  <p className="text-sm text-orange-700 dark:text-orange-300">
                    Started: {new Date(ongoingTest.startTime).toLocaleString()}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <span className="px-3 py-1 bg-orange-200 dark:bg-orange-800 text-orange-900 dark:text-orange-100 rounded-full text-sm font-semibold">
                      {ongoingTest.examType.toUpperCase()}
                    </span>
                    <span className="px-3 py-1 bg-orange-200 dark:bg-orange-800 text-orange-900 dark:text-orange-100 rounded-full text-sm font-semibold">
                      {ongoingTest.totalQuestions} Questions
                    </span>
                  </div>
                </div>
              </div>
              <Button 
                size="lg" 
                variant="primary" 
                onClick={resumeTest}
                className="w-full md:w-auto"
              >
                Resume Test →
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Tests Grid */}
      {(activeTab === 'all' || activeTab === 'attempted' || activeTab === 'unattempted') && (
        <>
          {displayTests.length === 0 ? (
            <Card>
              <CardBody className="py-12 text-center">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No Tests Found</h3>
                <p className="text-gray-600 dark:text-gray-400">No {activeTab} mock tests available</p>
              </CardBody>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayTests.map((test) => {
                const attempt = attempts.find((a) => a.testId === test.testId && a.status === 'completed');
                
                return (
                  <Card key={test.testId} hover>
                    <CardBody>
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-2xl">🎯</span>
                        </div>
                        {attempt && (
                          <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-100 text-xs rounded-full font-semibold">
                            ✓ Attempted
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2">{test.testName}</h3>
                      
                      <div className="space-y-2 mb-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{test.totalQuestions} Questions</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{test.duration} Minutes</span>
                        </div>
                      </div>

                      {attempt && (
                        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg mb-4">
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Best Score:</p>
                          <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                            {attempt.score} / {attempt.totalQuestions * 4}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Accuracy: {attempt.accuracy}%
                          </p>
                        </div>
                      )}

                      <div className="space-y-2">
                        <Button
                          fullWidth
                          onClick={() => startTest(test.testId)}
                          disabled={!!ongoingTest}
                        >
                          {attempt ? 'Re-attempt Test' : 'Attempt Test'}
                        </Button>
                        
                        {attempt && (
                          <Button
                            fullWidth
                            variant="outline"
                            size="sm"
                            onClick={() => viewResult(attempt._id)}
                          >
                            View Results
                          </Button>
                        )}
                      </div>
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}