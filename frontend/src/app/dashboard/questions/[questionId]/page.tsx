'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Card, { CardBody } from '@/components/ui/Card';
import { questionsAPI } from '@/lib/api';
import { parseLatex } from '@/lib/utils';
import katex from 'katex';
import 'katex/dist/katex.min.css';

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

  const renderLatex = (text: string) => {
    const parts = text.split(/(latex:.*?)(?=\s|$|,|\.|;)/g);
    return parts.map((part, i) => {
      if (part.startsWith('latex:')) {
        const formula = part.replace('latex:', '');
        return (
          <span
            key={i}
            dangerouslySetInnerHTML={{
              __html: katex.renderToString(formula, { throwOnError: false }),
            }}
          />
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  if (loading) return <div>Loading...</div>;
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
                Question {1} of {1}
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
            </div>

            <div className="text-lg font-medium text-gray-900 mb-4">
              {renderLatex(question.question)}
            </div>

            {question.questionImageUrl && (
              <img
                src={question.questionImageUrl}
                alt="Question"
                className="max-w-full h-auto rounded-lg mb-4"
              />
            )}
          </div>

          {!showResult && (
            <div className="space-y-3 mb-6">
              {question.questionType === 'S' ? (
                ['A', 'B', 'C', 'D'].map((option) => (
                  <label
                    key={option}
                    className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedAnswer === option
                        ? 'border-purple-600 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="answer"
                      value={option}
                      checked={selectedAnswer === option}
                      onChange={(e) => setSelectedAnswer(e.target.value)}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      {renderLatex(question[`option${option}`])}
                    </div>
                  </label>
                ))
              ) : (
                <input
                  type="number"
                  step="0.01"
                  placeholder="Enter your answer"
                  value={selectedAnswer}
                  onChange={(e) => setSelectedAnswer(e.target.value)}
                  className="w-full px-4 py-3 border-2 rounded-lg focus:border-purple-600 focus:outline-none"
                />
              )}
            </div>
          )}

          {showResult && (
            <div className={`p-6 rounded-lg mb-6 ${
              result.isCorrect ? 'bg-green-50 border-2 border-green-500' : 'bg-red-50 border-2 border-red-500'
            }`}>
              <p className="font-semibold mb-2">
                {result.isCorrect ? '✅ Correct!' : '❌ Incorrect'}
              </p>
              <p className="text-sm">
                Correct Answer: <strong>{result.correctAnswer}</strong>
              </p>
            </div>
          )}

          {showResult && result.explanation && (
            <div className="bg-blue-50 p-6 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Explanation:</h4>
              <p className="text-blue-800">{renderLatex(result.explanation)}</p>
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <Button variant="outline" onClick={() => router.back()}>
              Previous
            </Button>
            {!showResult ? (
              <Button onClick={submitAnswer} className="flex-1">
                Submit Answer
              </Button>
            ) : (
              <Button onClick={() => router.back()} className="flex-1">
                Next Question
              </Button>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}