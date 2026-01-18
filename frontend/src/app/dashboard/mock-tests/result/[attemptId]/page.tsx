'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import Card, { CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Loader from '@/components/ui/Loader';
import { mockTestsAPI } from '@/lib/api';
import LatexRenderer from '@/components/ui/LatexRenderer';

export default function MockTestResultPage() {
  const params = useParams();
  const router = useRouter();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResult();
  }, []);

  const loadResult = async () => {
    try {
      const response = await mockTestsAPI.getResult(params.attemptId as string);
      if (response.data.success) {
        setResult(response.data.attempt);
      }
    } catch (error: any) {
      toast.error('Failed to load results');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader size="lg" text="Loading results..." />
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Score Card */}
      <Card className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
        <CardBody className="p-8 text-center">
          <h2 className="text-3xl font-bold mb-2">Test Completed!</h2>
          <p className="text-xl mb-4">
            Score: {result.score} / {result.totalQuestions * 4}
          </p>
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div>
              <p className="text-purple-200 text-sm">Correct</p>
              <p className="text-2xl font-bold">{result.correctAnswers}</p>
            </div>
            <div>
              <p className="text-purple-200 text-sm">Incorrect</p>
              <p className="text-2xl font-bold">{result.incorrectAnswers}</p>
            </div>
            <div>
              <p className="text-purple-200 text-sm">Accuracy</p>
              <p className="text-2xl font-bold">{result.accuracy}%</p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Detailed Solutions */}
      {result.detailedResults?.map((item: any, index: number) => (
        <Card key={index}>
          <CardBody className="p-6">
            <div className="flex items-start justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Question {index + 1}</h3>
              <span
                className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  item.isCorrect
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {item.isCorrect ? '✓ Correct' : '✗ Incorrect'}
              </span>
            </div>

            <div className="text-gray-900 mb-4">
              <LatexRenderer text={item.question} />
            </div>

            <div className="bg-gray-50 p-4 rounded-lg space-y-2 mb-4">
              <p className="text-sm">
                <span className="font-medium">Your Answer:</span>{' '}
                <span className={item.isCorrect ? 'text-green-600' : 'text-red-600'}>
                  {item.userAnswer || 'Not answered'}
                </span>
              </p>
              {!item.isCorrect && (
                <p className="text-sm">
                  <span className="font-medium">Correct Answer:</span>{' '}
                  <span className="text-green-600">{item.correctAnswer}</span>
                </p>
              )}
            </div>

            {item.explanation && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-blue-900 mb-2">Explanation:</p>
                <div className="text-sm text-blue-800">
                  <LatexRenderer text={item.explanation} />
                </div>
                {item.explanationImageUrl && (
                  <img
                    src={item.explanationImageUrl}
                    alt="Explanation"
                    className="mt-3 max-w-full h-auto rounded-lg"
                  />
                )}
              </div>
            )}
          </CardBody>
        </Card>
      ))}

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => router.push('/dashboard/mock-tests')} className="flex-1">
          Back to Tests
        </Button>
        <Button onClick={() => router.push('/dashboard')} className="flex-1">
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
}