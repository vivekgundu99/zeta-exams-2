'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { mockTestsAPI } from '@/lib/api';

export default function MockTestAttemptPage() {
  const params = useParams();
  const router = useRouter();
  
  const [test, setTest] = useState<any>(null);
  const [attemptId, setAttemptId] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<any[]>([]);
  const [flagged, setFlagged] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    startTest();
  }, []);

  useEffect(() => {
    if (timeLeft <= 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const startTest = async () => {
    try {
      const response = await mockTestsAPI.startTest(params.testId as string);
      
      if (response.data.success) {
        const testData = response.data.test;
        const attempt = response.data.attempt;
        
        setTest(testData);
        setAttemptId(attempt._id);
        setTimeLeft(testData.duration * 60); // Convert to seconds
        setAnswers(new Array(testData.totalQuestions).fill({ answer: '', timeTaken: 0 }));
        
        toast.success('Test started! All questions loaded.');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to start test');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const response = await mockTestsAPI.submitTest(attemptId, answers);
      
      if (response.data.success) {
        toast.success('Test submitted successfully!');
        router.push(`/dashboard/mock-tests/result/${attemptId}`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit test');
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getQuestionStatus = (index: number) => {
    if (flagged.includes(index)) {
      return answers[index]?.answer ? 'answered-flagged' : 'flagged';
    }
    return answers[index]?.answer ? 'answered' : 'unanswered';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'unanswered': 'bg-gray-200 text-gray-700',
      'answered': 'bg-green-500 text-white',
      'flagged': 'bg-purple-500 text-white',
      'answered-flagged': 'bg-blue-500 text-white',
    };
    return colors[status] || colors.unanswered;
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">
      <div>Loading test...</div>
    </div>;
  }

  if (!test) return null;

  const question = test.questions[currentQuestion];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-900">{test.testName}</h1>
          
          <div className="flex items-center gap-4">
            <div className={`px-4 py-2 rounded-lg font-mono font-bold ${
              timeLeft < 600 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
            }`}>
              ⏱️ {formatTime(timeLeft)}
            </div>
            
            <Button variant="danger" onClick={() => setShowSubmitModal(true)}>
              Submit Test
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Question Panel */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <span className="text-sm text-gray-600">
                    Question {currentQuestion + 1} of {test.totalQuestions}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant={flagged.includes(currentQuestion) ? 'primary' : 'outline'}
                  onClick={() => {
                    setFlagged(prev => 
                      prev.includes(currentQuestion)
                        ? prev.filter(i => i !== currentQuestion)
                        : [...prev, currentQuestion]
                    );
                  }}
                >
                  {flagged.includes(currentQuestion) ? '🚩 Flagged' : '🏴 Flag'}
                </Button>
              </div>

              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    question.questionType === 'S' 
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {question.questionType === 'S' ? 'Multiple Choice' : 'Numerical'}
                  </span>
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-semibold">
                    {question.subject}
                  </span>
                </div>

                <div className="text-lg font-medium text-gray-900 mb-4">
                  {question.question}
                </div>

                {question.questionImageUrl && (
                  <img src={question.questionImageUrl} alt="Question" className="max-w-full h-auto rounded-lg mb-4" />
                )}
              </div>

              {/* Answer Options */}
              <div className="space-y-3 mb-6">
                {question.questionType === 'S' ? (
                  ['A', 'B', 'C', 'D'].map((option) => (
                    <label
                      key={option}
                      className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        answers[currentQuestion]?.answer === option
                          ? 'border-purple-600 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="answer"
                        value={option}
                        checked={answers[currentQuestion]?.answer === option}
                        onChange={(e) => {
                          const newAnswers = [...answers];
                          newAnswers[currentQuestion] = {
                            answer: e.target.value,
                            timeTaken: test.duration * 60 - timeLeft,
                          };
                          setAnswers(newAnswers);
                        }}
                        className="mr-3"
                      />
                      <div className="flex-1">{question[`option${option}`]}</div>
                    </label>
                  ))
                ) : (
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Enter your answer"
                    value={answers[currentQuestion]?.answer || ''}
                    onChange={(e) => {
                      const newAnswers = [...answers];
                      newAnswers[currentQuestion] = {
                        answer: e.target.value,
                        timeTaken: test.duration * 60 - timeLeft,
                      };
                      setAnswers(newAnswers);
                    }}
                    className="w-full px-4 py-3 border-2 rounded-lg focus:border-purple-600 focus:outline-none text-lg"
                  />
                )}
              </div>

              {/* Navigation */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                  disabled={currentQuestion === 0}
                >
                  ← Previous
                </Button>
                
                <Button
                  onClick={() => {
                    if (!answers[currentQuestion]?.answer) {
                      const newAnswers = [...answers];
                      newAnswers[currentQuestion] = { answer: '', timeTaken: 0 };
                      setAnswers(newAnswers);
                    }
                    setCurrentQuestion(Math.min(test.totalQuestions - 1, currentQuestion + 1));
                  }}
                  className="flex-1"
                  disabled={currentQuestion === test.totalQuestions - 1}
                >
                  {currentQuestion === test.totalQuestions - 1 ? 'Last Question' : 'Next →'}
                </Button>
              </div>
            </div>
          </div>

          {/* Question Navigator */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md p-6 sticky top-24">
              <h3 className="font-bold text-gray-900 mb-4">Question Palette</h3>
              
              {/* Legend */}
              <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span>Answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-200 rounded"></div>
                  <span>Unanswered</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-purple-500 rounded"></div>
                  <span>Flagged</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-500 rounded"></div>
                  <span>Both</span>
                </div>
              </div>

              {/* Question Grid */}
              <div className="grid grid-cols-5 gap-2">
                {test.questions.map((_: any, index: number) => (
                  <button
                    key={index}
                    onClick={() => setCurrentQuestion(index)}
                    className={`w-10 h-10 rounded-lg font-medium text-sm transition-all ${
                      index === currentQuestion
                        ? 'ring-2 ring-purple-600 scale-110'
                        : ''
                    } ${getStatusColor(getQuestionStatus(index))}`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>

              {/* Stats */}
              <div className="mt-6 pt-4 border-t space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Answered:</span>
                  <span className="font-semibold">{answers.filter(a => a?.answer).length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Unanswered:</span>
                  <span className="font-semibold">{test.totalQuestions - answers.filter(a => a?.answer).length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Flagged:</span>
                  <span className="font-semibold">{flagged.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Modal */}
      <Modal isOpen={showSubmitModal} onClose={() => setShowSubmitModal(false)} title="Submit Test?">
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to submit the test? You cannot change answers after submission.
          </p>
          
          <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Total Questions:</span>
              <span className="font-semibold">{test.totalQuestions}</span>
            </div>
            <div className="flex justify-between">
              <span>Answered:</span>
              <span className="font-semibold text-green-600">{answers.filter(a => a?.answer).length}</span>
            </div>
            <div className="flex justify-between">
              <span>Unanswered:</span>
              <span className="font-semibold text-red-600">{test.totalQuestions - answers.filter(a => a?.answer).length}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowSubmitModal(false)} className="flex-1">
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmit} className="flex-1">
              Submit Test
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}