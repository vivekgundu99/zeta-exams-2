'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Card, { CardBody } from '@/components/ui/Card';
import { questionsAPI } from '@/lib/api';
import LatexRenderer from '@/components/ui/LatexRenderer';

export default function QuestionViewerPage() {
  const params = useParams();
  const router = useRouter();
  const [question, setQuestion] = useState<any>(null);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuestion();
  }, [params.questionId]);

  const loadQuestion = async () => {
    try {
      const response = await questionsAPI.getQuestion(params.questionId as string);
      if (response.data.success) {
        setQuestion(response.data.question);
        // If already attempted, show the result
        if (response.data.question.attempted && response.data.question.userAnswer) {
          setSelectedAnswer(response.data.question.userAnswer);
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load question');
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!selectedAnswer) {
      toast.error('Please select an answer');
      return;
    }

    try {
      const response = await questionsAPI.submitAnswer({
        questionId: params.questionId,
        userAnswer: selectedAnswer,
      });

      if (response.data.success) {
        setResult(response.data);
        setShowResult(true);
        toast.success(response.data.isCorrect ? 'Correct! 🎉' : 'Incorrect ❌');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit');
    }
  };

  if (loading) return (
    <div className="flex justify-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
    </div>
  );

  if (!question) return <div>Question not found</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => router.back()}>
        ← Back to Questions
      </Button>

      <Card>
        <CardBody className="p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
                Question
              </span>
            </div>
            <div className="text-sm text-gray-600">
              <p>ID: {question.questionId}</p>
              <p>Serial: {question.serialNumber}</p>
            </div>
          </div>

          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                question.questionType === 'S' 
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-green-100 text-green-700'
              }`}>
                {question.questionType === 'S' ? 'MCQ' : 'Numerical'}
              </span>
              <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                {question.subject} • {question.chapter}
              </span>
            </div>

            <div className="text-lg font-medium text-gray-900 mb-4">
              <LatexRenderer text={question.question} />
            </div>

            {question.questionImageUrl && (
              <img
                src={question.questionImageUrl}
                alt="Question"
                className="max-w-full h-auto rounded-lg mb-4"
              />
            )}
          </div>

          {/* OPTIONS - Always visible */}
          <div className="space-y-3 mb-6">
            {question.questionType === 'S' ? (
              ['A', 'B', 'C', 'D'].map((option) => {
                const isSelected = selectedAnswer === option;
                const isCorrect = showResult && result?.correctAnswer === option;
                const isWrong = showResult && isSelected && !result?.isCorrect;

                return (
                  <label
                    key={option}
                    className={`flex items-center p-4 border-2 rounded-lg transition-all ${
                      !showResult
                        ? isSelected
                          ? 'border-purple-600 bg-purple-50 cursor-pointer'
                          : 'border-gray-200 hover:border-purple-300 cursor-pointer'
                        : isCorrect
                        ? 'border-green-500 bg-green-50'
                        : isWrong
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="answer"
                      value={option}
                      checked={isSelected}
                      onChange={(e) => !showResult && setSelectedAnswer(e.target.value)}
                      disabled={showResult}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{option}.</span>
                        <LatexRenderer text={question[`option${option}`]} />
                      </div>
                    </div>
                    {showResult && isCorrect && (
                      <span className="ml-2 text-green-600 font-bold">✓ Correct</span>
                    )}
                    {showResult && isWrong && (
                      <span className="ml-2 text-red-600 font-bold">✗ Your Answer</span>
                    )}
                  </label>
                );
              })
            ) : (
              <div>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Enter your answer"
                  value={selectedAnswer}
                  onChange={(e) => !showResult && setSelectedAnswer(e.target.value)}
                  disabled={showResult}
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none ${
                    showResult
                      ? result?.isCorrect
                        ? 'border-green-500 bg-green-50'
                        : 'border-red-500 bg-red-50'
                      : 'border-gray-300 focus:border-purple-600'
                  }`}
                />
                {showResult && (
                  <p className="mt-2 text-sm">
                    <span className="font-medium">Correct Answer:</span>{' '}
                    <span className="text-green-600 font-bold">{result?.correctAnswer}</span>
                  </p>
                )}
              </div>
            )}
          </div>

          {/* RESULT - Show after submission */}
          {showResult && (
            <div className={`p-6 rounded-lg mb-6 ${
              result.isCorrect ? 'bg-green-50 border-2 border-green-500' : 'bg-red-50 border-2 border-red-500'
            }`}>
              <p className="font-semibold text-lg mb-2">
                {result.isCorrect ? '✅ Correct!' : '❌ Incorrect'}
              </p>
              {question.questionType === 'S' && (
                <p className="text-sm">
                  Correct Answer: <strong>{result.correctAnswer}</strong>
                </p>
              )}
            </div>
          )}

          {/* EXPLANATION - Always show after submission */}
          {showResult && result?.explanation && (
            <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-3 text-lg">📘 Explanation:</h4>
              <div className="text-blue-800">
                <LatexRenderer text={result.explanation} />
              </div>
              {result.explanationImageUrl && (
                <img
                  src={result.explanationImageUrl}
                  alt="Explanation"
                  className="mt-4 max-w-full h-auto rounded-lg border-2 border-blue-300"
                />
              )}
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <Button variant="outline" onClick={() => router.back()}>
              ← Back to Questions
            </Button>
            {!showResult ? (
              <Button onClick={submitAnswer} className="flex-1">
                Submit Answer
              </Button>
            ) : (
              <Button onClick={() => router.back()} className="flex-1">
                Next Question →
              </Button>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}