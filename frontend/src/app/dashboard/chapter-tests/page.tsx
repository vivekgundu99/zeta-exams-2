'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import Card, { CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Dropdown from '@/components/ui/Dropdown';
import Modal from '@/components/ui/Modal';
import { questionsAPI, userAPI } from '@/lib/api';
import { parseLatex } from '@/lib/utils';

export default function ChapterTestsPage() {
  const router = useRouter();
  const [examType, setExamType] = useState('');
  const [subjects, setSubjects] = useState<string[]>([]);
  const [chapters, setChapters] = useState<string[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('');
  const [test, setTest] = useState<any>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUserExam();
  }, []);

  useEffect(() => {
    if (examType) loadSubjects();
  }, [examType]);

  useEffect(() => {
    if (selectedSubject) loadChapters();
  }, [selectedSubject]);

  const loadUserExam = async () => {
    try {
      const response = await userAPI.getProfile();
      if (response.data.success) {
        setExamType(response.data.user.exam);
      }
    } catch (error) {
      console.error('Failed to load user exam');
    }
  };

  const loadSubjects = async () => {
    try {
      const response = await questionsAPI.getSubjects(examType);
      if (response.data.success) {
        setSubjects(response.data.subjects);
      }
    } catch (error) {
      toast.error('Failed to load subjects');
    }
  };

  const loadChapters = async () => {
    try {
      const response = await questionsAPI.getChapters(selectedSubject, examType);
      if (response.data.success) {
        setChapters(response.data.chapters);
        setSelectedChapter('');
      }
    } catch (error) {
      toast.error('Failed to load chapters');
    }
  };

  const generateTest = async () => {
    if (!selectedChapter) {
      toast.error('Please select a chapter');
      return;
    }

    try {
      setLoading(true);
      // Generate test with random 10 questions
      const response = await questionsAPI.getQuestions({
        examType,
        subject: selectedSubject,
        chapter: selectedChapter,
      });

      if (response.data.success) {
        const allQuestions = response.data.questions;
        // Shuffle and pick 10
        const shuffled = allQuestions.sort(() => 0.5 - Math.random());
        const testQuestions = shuffled.slice(0, 10);

        setTest({ questions: testQuestions });
        setCurrentQuestion(0);
        setAnswers(new Array(testQuestions.length).fill(null));
        setShowResults(false);
        toast.success('Test generated successfully!');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to generate test');
    } finally {
      setLoading(false);
    }
  };

  const submitTest = () => {
    const unanswered = answers.filter(a => !a).length;
    if (unanswered > 0) {
      const confirm = window.confirm(
        `You have ${unanswered} unanswered questions. Submit anyway?`
      );
      if (!confirm) return;
    }

    let correct = 0;
    const results = test.questions.map((q: any, i: number) => {
      const isCorrect = answers[i] === q.answer;
      if (isCorrect) correct++;
      return {
        question: q,
        userAnswer: answers[i],
        correctAnswer: q.answer,
        isCorrect,
      };
    });

    setTest({ ...test, results, score: correct });
    setShowResults(true);
    toast.success(`Test submitted! Score: ${correct}/10`);
  };

  const resetTest = () => {
    setTest(null);
    setShowResults(false);
    setAnswers([]);
    setCurrentQuestion(0);
  };

  if (test && !showResults) {
    const question = test.questions[currentQuestion];

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Chapter Test</h1>
          <Button variant="outline" onClick={resetTest}>
            Exit Test
          </Button>
        </div>

        <Card>
          <CardBody className="p-8">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-gray-600">
                  Question {currentQuestion + 1} of {test.questions.length}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  question.questionType === 'S' 
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-green-100 text-green-700'
                }`}>
                  {question.questionType === 'S' ? 'MCQ' : 'Numerical'}
                </span>
              </div>

              <div className="text-lg font-medium text-gray-900 mb-4">
                {question.question}
              </div>

              {question.questionImageUrl && (
                <img
                  src={question.questionImageUrl}
                  alt="Question"
                  className="max-w-full h-auto rounded-lg mb-4"
                />
              )}
            </div>

            <div className="space-y-3 mb-6">
              {question.questionType === 'S' ? (
                ['A', 'B', 'C', 'D'].map((option) => (
                  <label
                    key={option}
                    className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      answers[currentQuestion] === option
                        ? 'border-purple-600 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${currentQuestion}`}
                      value={option}
                      checked={answers[currentQuestion] === option}
                      onChange={(e) => {
                        const newAnswers = [...answers];
                        newAnswers[currentQuestion] = e.target.value;
                        setAnswers(newAnswers);
                      }}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      {question[`option${option}`]}
                    </div>
                  </label>
                ))
              ) : (
                <input
                  type="number"
                  step="0.01"
                  placeholder="Enter your answer"
                  value={answers[currentQuestion] || ''}
                  onChange={(e) => {
                    const newAnswers = [...answers];
                    newAnswers[currentQuestion] = e.target.value;
                    setAnswers(newAnswers);
                  }}
                  className="w-full px-4 py-3 border-2 rounded-lg focus:border-purple-600 focus:outline-none"
                />
              )}
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                disabled={currentQuestion === 0}
              >
                Previous
              </Button>
              
              {currentQuestion < test.questions.length - 1 ? (
                <Button
                  onClick={() => setCurrentQuestion(currentQuestion + 1)}
                  className="flex-1"
                >
                  Next
                </Button>
              ) : (
                <Button onClick={submitTest} className="flex-1" variant="primary">
                  Submit Test
                </Button>
              )}
            </div>

            {/* Question Navigator */}
            <div className="mt-6 pt-6 border-t">
              <p className="text-sm font-medium text-gray-700 mb-3">Quick Navigation:</p>
              <div className="grid grid-cols-10 gap-2">
                {test.questions.map((_: any, i: number) => (
                  <button
                    key={i}
                    onClick={() => setCurrentQuestion(i)}
                    className={`w-10 h-10 rounded-lg font-medium text-sm transition-all ${
                      i === currentQuestion
                        ? 'bg-purple-600 text-white ring-2 ring-purple-300'
                        : answers[i]
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (showResults) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
          <CardBody className="p-8 text-center">
            <h2 className="text-3xl font-bold mb-2">Test Completed!</h2>
            <p className="text-xl mb-4">
              Your Score: {test.score}/{test.questions.length}
            </p>
            <p className="text-lg">
              Accuracy: {((test.score / test.questions.length) * 100).toFixed(1)}%
            </p>
          </CardBody>
        </Card>

        {test.results.map((result: any, index: number) => (
          <Card key={index}>
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

              <p className="text-gray-900 mb-4">{result.question.question}</p>

              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
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

              {result.question.explanation && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-900 mb-1">Explanation:</p>
                  <p className="text-sm text-blue-800">{result.question.explanation}</p>
                </div>
              )}
            </CardBody>
          </Card>
        ))}

        <div className="flex gap-3">
          <Button variant="outline" onClick={resetTest} className="flex-1">
            Take Another Test
          </Button>
          <Button onClick={() => router.push('/dashboard')} className="flex-1">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Chapter Tests</h1>
        <p className="text-gray-600">10 random questions from selected chapter</p>
      </div>

      <Card>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Dropdown
              label="Subject"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              options={[
                { value: '', label: 'Select Subject' },
                ...subjects.map((s) => ({ value: s, label: s })),
              ]}
            />

            <Dropdown
              label="Chapter"
              value={selectedChapter}
              onChange={(e) => setSelectedChapter(e.target.value)}
              options={[
                { value: '', label: selectedSubject ? 'Select Chapter' : 'Select Subject First' },
                ...chapters.map((c) => ({ value: c, label: c })),
              ]}
              disabled={!selectedSubject}
            />
          </div>

          <Button
            fullWidth
            onClick={generateTest}
            isLoading={loading}
            disabled={!selectedChapter}
          >
            Generate Test
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}