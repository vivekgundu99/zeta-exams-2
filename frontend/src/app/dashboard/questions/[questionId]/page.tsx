'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Card, { CardBody } from '@/components/ui/Card';
import { questionsAPI } from '@/lib/api';
import LatexRenderer from '@/components/ui/LatexRenderer';

export default function QuestionViewerPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [question, setQuestion] = useState<any>(null);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // NEW: Question list navigation state
  const [questionsList, setQuestionsList] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [listParams, setListParams] = useState<any>(null);

  useEffect(() => {
    loadQuestionsList();
    loadQuestion();
  }, [params.questionId]);

  // NEW: Load questions list from sessionStorage
  const loadQuestionsList = () => {
    try {
      const savedList = sessionStorage.getItem('questionsList');
      const savedParams = sessionStorage.getItem('questionsListParams');
      
      if (savedList) {
        const list = JSON.parse(savedList);
        setQuestionsList(list);
        
        // Find current question index
        const index = list.findIndex((q: any) => q.questionId === params.questionId);
        if (index !== -1) {
          setCurrentIndex(index);
        }
      }
      
      if (savedParams) {
        setListParams(JSON.parse(savedParams));
      }
    } catch (error) {
      console.error('Failed to load questions list from session:', error);
    }
  };

  const loadQuestion = async () => {
    try {
      const response = await questionsAPI.getQuestion(params.questionId as string);
      if (response.data.success) {
        const q = response.data.question;
        setQuestion(q);
        
        // If question was already attempted, load the previous answer
        if (q.attempted && q.userAnswer) {
          setSelectedAnswer(q.userAnswer);
        } else {
          setSelectedAnswer('');
        }
        
        setShowResult(false);
        setResult(null);
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

  // NEW: Navigate to specific question by index
  const navigateToQuestion = (index: number) => {
    if (index < 0 || index >= questionsList.length) return;
    
    const targetQuestion = questionsList[index];
    if (!targetQuestion) return;

    // Build URL with preserved query params
    const params = new URLSearchParams();
    if (listParams?.examType) params.set('examType', listParams.examType);
    if (listParams?.subject) params.set('subject', listParams.subject);
    if (listParams?.chapter) params.set('chapter', listParams.chapter);
    if (listParams?.topic) params.set('topic', listParams.topic);
    if (listParams?.page) params.set('page', listParams.page);

    router.push(`/dashboard/questions/${targetQuestion.questionId}?${params.toString()}`);
  };

  // NEW: Go back to questions list
  const backToList = () => {
    if (listParams) {
      const params = new URLSearchParams(listParams);
      router.push(`/dashboard/questions?${params.toString()}`);
    } else {
      router.push('/dashboard/questions');
    }
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div></div>;
  if (!question) return <div className="text-center py-12">Question not found</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={backToList}>
          ← Back to Questions
        </Button>
        
        {questionsList.length > 0 && (
          <div className="text-sm text-gray-600">
            Question {currentIndex + 1} of {questionsList.length}
          </div>
        )}
      </div>

      <Card>
        <CardBody className="p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
                Question {currentIndex + 1} {questionsList.length > 0 && `of ${questionsList.length}`}
              </span>
            </div>
            <div className="text-sm text-gray-600 text-right">
              <p className="font-mono">ID: {question.questionId}</p>
              <p className="font-mono text-xs">Serial: {question.serialNumber}</p>
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
                      <LatexRenderer text={question[`option${option}`]} />
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
            <>
              <div className={`p-6 rounded-lg mb-6 ${
                result.isCorrect ? 'bg-green-50 border-2 border-green-500' : 'bg-red-50 border-2 border-red-500'
              }`}>
                <p className="font-semibold mb-2">
                  {result.isCorrect ? '✅ Correct!' : '❌ Incorrect'}
                </p>
                <p className="text-sm">
                  Your Answer: <strong>{selectedAnswer}</strong>
                </p>
                <p className="text-sm">
                  Correct Answer: <strong>{result.correctAnswer}</strong>
                </p>
              </div>

              {result.explanation && (
                <div className="bg-blue-50 p-6 rounded-lg mb-6">
                  <h4 className="font-semibold text-blue-900 mb-2">Explanation:</h4>
                  <div className="text-blue-800">
                    <LatexRenderer text={result.explanation} />
                  </div>
                  {result.explanationImageUrl && (
                    <img
                      src={result.explanationImageUrl}
                      alt="Explanation"
                      className="mt-4 max-w-full h-auto rounded-lg"
                    />
                  )}
                </div>
              )}
            </>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 mt-6">
            {questionsList.length > 0 ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => navigateToQuestion(currentIndex - 1)}
                  disabled={currentIndex === 0}
                  className="flex-1"
                >
                  ← Previous Question
                </Button>
                
                {!showResult ? (
                  <Button onClick={submitAnswer} className="flex-1">
                    Submit Answer
                  </Button>
                ) : (
                  <Button
                    onClick={() => navigateToQuestion(currentIndex + 1)}
                    disabled={currentIndex >= questionsList.length - 1}
                    className="flex-1"
                  >
                    Next Question →
                  </Button>
                )}
              </>
            ) : (
              <>
                <Button variant="outline" onClick={backToList}>
                  Back to Questions
                </Button>
                {!showResult && (
                  <Button onClick={submitAnswer} className="flex-1">
                    Submit Answer
                  </Button>
                )}
              </>
            )}
          </div>

          {/* Question Navigator Grid */}
          {questionsList.length > 0 && (
            <div className="mt-8 pt-6 border-t">
              <p className="text-sm font-medium text-gray-700 mb-3">Quick Navigation:</p>
              <div className="grid grid-cols-10 gap-2">
                {questionsList.map((q: any, i: number) => (
                  <button
                    key={i}
                    onClick={() => navigateToQuestion(i)}
                    className={`w-10 h-10 rounded-lg font-medium text-sm transition-all ${
                      i === currentIndex
                        ? 'bg-purple-600 text-white ring-2 ring-purple-300'
                        : q.status === 'attempted'
                        ? 'bg-green-500 text-white hover:bg-green-600'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}