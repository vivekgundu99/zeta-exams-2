'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Card, { CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { analyticsAPI, userAPI } from '@/lib/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AnalyticsPage() {
  const router = useRouter();
  const [subscription, setSubscription] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAndLoadAnalytics();
  }, []);

  const checkAndLoadAnalytics = async () => {
    try {
      const response = await userAPI.getProfile();
      if (response.data.success) {
        setSubscription(response.data.subscription);
        
        if (response.data.subscription.subscription === 'gold') {
          const analyticsResponse = await analyticsAPI.getOverview();
          if (analyticsResponse.data.success) {
            setAnalytics(analyticsResponse.data.analytics);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  if (subscription?.subscription !== 'gold') {
    return (
      <Card className="border-2 border-purple-200">
        <CardBody className="p-12 text-center">
          <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">📊</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Upgrade to Gold for Analytics
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Get detailed performance insights, chapter-wise analysis, and track your progress
          </p>
          <Button size="lg" onClick={() => router.push('/subscription')}>
            Upgrade to Gold Plan
          </Button>
        </CardBody>
      </Card>
    );
  }

  const subjects = ['physics', 'chemistry', analytics?.mathematics ? 'mathematics' : 'biology'];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Performance Analytics</h1>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardBody className="text-center p-6">
            <p className="text-gray-600 mb-2">Total Questions</p>
            <p className="text-4xl font-bold text-purple-600">
              {analytics?.overallStats.totalQuestions || 0}
            </p>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody className="text-center p-6">
            <p className="text-gray-600 mb-2">Correct Answers</p>
            <p className="text-4xl font-bold text-green-600">
              {analytics?.overallStats.totalCorrect || 0}
            </p>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody className="text-center p-6">
            <p className="text-gray-600 mb-2">Overall Accuracy</p>
            <p className="text-4xl font-bold text-blue-600">
              {analytics?.overallStats.overallAccuracy || 0}%
            </p>
          </CardBody>
        </Card>
      </div>

      {/* Subject-wise Performance */}
      {subjects.map((subject) => {
        const subjectData = analytics?.[subject];
        if (!subjectData) return null;

        const topChapters = subjectData.chapters
          .filter((c: any) => c.totalAttempted > 0)
          .sort((a: any, b: any) => b.accuracy - a.accuracy)
          .slice(0, 5);

        const weakChapters = subjectData.chapters
          .filter((c: any) => c.totalAttempted > 0)
          .sort((a: any, b: any) => a.accuracy - b.accuracy)
          .slice(0, 5);

        return (
          <Card key={subject}>
            <CardBody className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 capitalize">{subject}</h2>
              
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Attempted</p>
                  <p className="text-2xl font-bold text-blue-600">{subjectData.totalAttempted}</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Correct</p>
                  <p className="text-2xl font-bold text-green-600">{subjectData.correctAnswers}</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Accuracy</p>
                  <p className="text-2xl font-bold text-purple-600">{subjectData.accuracy}%</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-green-700 mb-3">Top 5 Chapters</h3>
                  <div className="space-y-2">
                    {topChapters.map((chapter: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-green-50 rounded">
                        <span className="text-sm">{chapter.chapterName}</span>
                        <span className="font-semibold text-green-600">{chapter.accuracy}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-red-700 mb-3">Needs Improvement</h3>
                  <div className="space-y-2">
                    {weakChapters.map((chapter: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-red-50 rounded">
                        <span className="text-sm">{chapter.chapterName}</span>
                        <span className="font-semibold text-red-600">{chapter.accuracy}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        );
      })}
    </div>
  );
}