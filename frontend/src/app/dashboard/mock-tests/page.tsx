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
  const [tests, setTests] = useState<any[]>([]);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const [examType, setExamType] = useState('');
  const [loading, setLoading] = useState(true);
  const [ongoingTest, setOngoingTest] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, [filter]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const profileResponse = await userAPI.getProfile();
      if (profileResponse.data.success) {
        const userExam = profileResponse.data.user.exam;
        setExamType(userExam);

        const testsResponse = await mockTestsAPI.getList(userExam, filter);
        if (testsResponse.data.success) {
          setTests(testsResponse.data.tests || []);
        }

        const attemptsResponse = await mockTestsAPI.getAttempts();
        if (attemptsResponse.data.success) {
          setAttempts(attemptsResponse.data.attempts || []);
          
          const ongoing = attemptsResponse.data.attempts?.find(
            (a: any) => a.status === 'ongoing'
          );
          setOngoingTest(ongoing);
        }
      }
    } catch (error) {
      console.error('Failed to load mock tests');
    } finally {
      setLoading(false);
    }
  };

  const startTest = (testId: string) => {
    if (ongoingTest) {
      toast.error('Please complete your ongoing test first');
      return;
    }
    router.push(`/dashboard/mock-tests/${testId}/attempt`);
  };

  const resumeTest = () => {
    if (ongoingTest) {
      router.push(`/dashboard/mock-tests/${ongoingTest.testId}/attempt`);
    }
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mock Tests</h1>
          <p className="text-gray-600">Full-length practice tests</p>
        </div>
      </div>

      {/* Ongoing Test Alert */}
      {ongoingTest && (
        <Card className="border-2 border-orange-200 bg-orange-50">
          <CardBody className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">⏱️</span>
                </div>
                <div>
                  <h3 className="font-bold text-orange-900 mb-1">Ongoing Test</h3>
                  <p className="text-sm text-orange-700">
                    You have an unfinished test. Please complete it.
                  </p>
                </div>
              </div>
              <Button variant="primary" onClick={resumeTest}>
                Resume Test
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {[
          { value: 'all', label: 'All Tests' },
          { value: 'attempted', label: 'Attempted' },
          { value: 'unattempted', label: 'Unattempted' },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`px-4 py-2 font-medium transition-colors ${
              filter === tab.value
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tests Grid */}
      {tests.length === 0 ? (
        <Card>
          <CardBody className="py-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Tests Found</h3>
            <p className="text-gray-600">No mock tests available for selected filter</p>
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tests.map((test) => {
            const attempt = attempts.find((a) => a.testId === test.testId);
            
            return (
              <Card key={test.testId} hover>
                <CardBody>
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl">🎯</span>
                    </div>
                    {attempt && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-semibold">
                        Attempted
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-gray-900 mb-2">{test.testName}</h3>
                  
                  <div className="space-y-2 mb-4 text-sm text-gray-600">
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

                  {attempt && attempt.status === 'completed' && (
                    <div className="bg-gray-50 p-3 rounded-lg mb-4">
                      <p className="text-sm text-gray-600 mb-1">Best Score:</p>
                      <p className="text-lg font-bold text-purple-600">
                        {attempt.score} / {attempt.totalQuestions}
                      </p>
                      <p className="text-xs text-gray-500">
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
                    
                    {attempt && attempt.status === 'completed' && (
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
    </div>
  );
}