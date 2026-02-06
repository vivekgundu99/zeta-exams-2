// frontend/src/app/dashboard/mock-tests/result/[attemptId]/page.tsx - FIXED
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import Card, { CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Loader from '@/components/ui/Loader';
import LatexRenderer from '@/components/ui/LatexRenderer';
import { mockTestsAPI } from '@/lib/api';

export default function MockTestResultPage() {
  const params = useParams();
  const router = useRouter();
  const [attempt, setAttempt] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResult();
  }, []);

  const loadResult = async () => {
    try {
      const response = await mockTestsAPI.getResult(params.attemptId as string);
      
      if (response.data.success) {
        setAttempt(response.data.attempt);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load result');
      router.push('/dashboard/mock-tests');
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

  if (!attempt) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Result Summary Card */}
      <Card className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
        <CardBody className="p-8">
          <h1 className="text-3xl font-bold mb-6">Test Results</h1>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-purple-100 text-sm mb-1">Score</p>
              <p className="text-4xl font-bold">{attempt.score}</p>
            </div>
            <div>
              <p className="text-purple-100 text-sm mb-1">Accuracy</p>
              <p className="text-4xl font-bold">{attempt.accuracy}%</p>
            </div>
            <div>
              <p className="text-purple-100 text-sm mb-1">Correct</p>
              <p className="text-4xl font-bold text-green-300">{attempt.correctAnswers}</p>
            </div>
            <div>
              <p className="text-purple-100 text-sm mb-1">Wrong</p>
              <p className="text-4xl font-bold text-red-300">{attempt.incorrectAnswers}</p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-purple-400">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Total Questions</p>
                <p className="text-xl font-semibold">{attempt.totalQuestions}</p>
              </div>
              <div>
                <p className="text-purple-100 text-sm">Attempted</p>
                <p className="text-xl font-semibold">{attempt.attemptedQuestions}</p>
              </div>
              <div>
                <p className="text-purple-100 text-sm">Unanswered</p>
                <p className="text-xl font-semibold">{attempt.unanswered}</p>
              </div>
              <div>
                <p className="text-purple-100 text-sm">Time Taken</p>
                <p className="text-xl font-semibold">{attempt.timeTaken} min</p>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Question-wise Analysis */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Question-wise Analysis</h2>
        
        {attempt.detailedResults?.map((result: any, index: number) => (
          <Card key={index} className="mb-4">
            <CardBody className="p-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="font-semibold text-gray-900">
                  Question {index + 1}
                </h3>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  result.isCorrect
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {result.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                </span>
              </div>

              <div className="text-gray-900 mb-4">
                <LatexRenderer text={result.question} />
              </div>

              {/* Options */}
              {result.questionType === 'S' && (
                <div className="space-y-2 mb-4">
                  {['A', 'B', 'C', 'D'].map((option) => {
                    const isUserAnswer = result.userAnswer === option;
                    const isCorrectAnswer = result.correctAnswer === option;
                    
                    return (
                      <div
                        key={option}
                        className={`p-3 rounded-lg border-2 ${
                          isCorrectAnswer
                            ? 'border-green-500 bg-green-50'
                            : isUserAnswer && !result.isCorrect
                            ? 'border-red-500 bg-red-50'
                            : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <span className="font-bold text-gray-700 mt-1">
                            {option}.
                          </span>
                          <div className="flex-1">
                            <LatexRenderer text={result[`option${option}`]} />
                          </div>
                          {isCorrectAnswer && (
                            <span className="text-green-600 font-bold">✓ Correct</span>
                          )}
                          {isUserAnswer && !isCorrectAnswer && (
                            <span className="text-red-600 font-bold">✗ Your Answer</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Numerical Answer */}
              {result.questionType === 'N' && (
                <div className="bg-gray-50 p-4 rounded-lg space-y-2 mb-4">
                  <p className="text-sm">
                    <span className="font-medium">Your Answer:</span>{' '}
                    <span className={result.isCorrect ? 'text-green-600' : 'text-red-600'}>
                      {result.userAnswer || 'Not answered'}
                    </span>
                  </p>
                  {!result.isCorrect && (
                    <p className="text-sm">
                      <span className="font-medium">Correct Answer:</span>{' '}
                      <span className="text-green-600">{result.correctAnswer}</span>
                    </p>
                  )}
                </div>
              )}

              {/* Explanation */}
              {result.explanation && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-900 mb-1">Explanation:</p>
                  <div className="text-sm text-blue-800">
                    <LatexRenderer text={result.explanation} />
                  </div>
                  {result.explanationImageUrl && (
                    <img
                      src={result.explanationImageUrl}
                      alt="Explanation"
                      className="max-w-[50%] h-auto rounded-lg mb-4 border border-gray-200 dark:border-gray-700"
                    />
                  )}
                </div>
              )}
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={() => router.push('/dashboard/mock-tests')}
          className="flex-1"
        >
          Back to Mock Tests
        </Button>
        <Button
          onClick={() => router.push('/dashboard')}
          className="flex-1"
        >
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}