// frontend/src/app/dashboard/questions/[questionId]/page.tsx - WITH FAVORITES
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Card, { CardBody } from '@/components/ui/Card';
import { questionsAPI } from '@/lib/api';
import LatexRenderer from '@/components/ui/LatexRenderer';

interface Question {
  questionId: string;
  serialNumber: string;
  questionType: string;
  subject: string;
  chapter: string;
  topic: string;
  question: string;
  questionImageUrl?: string;
  optionA?: string;
  optionB?: string;
  optionC?: string;
  optionD?: string;
  optionAImageUrl?: string;
  attempted?: boolean;
  userAnswer?: string;
  status?: string;
  isFavorite?: boolean; // 🔥 NEW
}

interface Result {
  isCorrect: boolean;
  correctAnswer: string;
  explanation?: string;
  explanationImageUrl?: string;
}

export default function QuestionViewerPage() {
  const params = useParams();
  const router = useRouter();
  
  const [question, setQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(true);
  const [questionsList, setQuestionsList] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [listParams, setListParams] = useState<any>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [currentListPage, setCurrentListPage] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false); // 🔥 NEW
  const [favoriteLoading, setFavoriteLoading] = useState(false); // 🔥 NEW

  useEffect(() => {
    loadQuestionsList();
    loadQuestion();
  }, [params.questionId]);

  const loadQuestionsList = () => {
    try {
      const savedList = sessionStorage.getItem('questionsList');
      const savedParams = sessionStorage.getItem('questionsListParams');
      
      if (savedList) {
        const list = JSON.parse(savedList);
        setQuestionsList(list);
        
        const index = list.findIndex((q: Question) => q.questionId === params.questionId);
        if (index !== -1) {
          setCurrentIndex(index);
        }
      }
      
      if (savedParams) {
        const parsedParams = JSON.parse(savedParams);
        setListParams(parsedParams);
        setCurrentListPage(parseInt(parsedParams.page) || 1);
      }
      
      const savedTotalPages = sessionStorage.getItem('questionsTotalPages');
      if (savedTotalPages) {
        setTotalPages(parseInt(savedTotalPages));
      }
      
      const savedTotal = sessionStorage.getItem('questionsTotalCount');
      if (savedTotal) {
        setTotalQuestions(parseInt(savedTotal));
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
        setIsFavorite(q.isFavorite || false); // 🔥 NEW
        
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

  const loadQuestionsPage = async (page: number) => {
    if (!listParams) return;
    
    try {
      setLoading(true);
      const response = await questionsAPI.getQuestions({
        ...listParams,
        page: page,
        limit: 20
      });

      if (response.data.success) {
        const newQuestions = response.data.questions;
        setQuestionsList(newQuestions);
        setTotalPages(response.data.totalPages || 1);
        setTotalQuestions(response.data.total || 0);
        setCurrentListPage(page);
        setCurrentIndex(0);
        
        sessionStorage.setItem('questionsList', JSON.stringify(newQuestions));
        sessionStorage.setItem('questionsListParams', JSON.stringify({
          ...listParams,
          page: page.toString()
        }));
        sessionStorage.setItem('questionsTotalPages', (response.data.totalPages || 1).toString());
        sessionStorage.setItem('questionsTotalCount', (response.data.total || 0).toString());
        
        if (newQuestions.length > 0) {
          const urlParams = new URLSearchParams({
            ...listParams,
            page: page.toString()
          });
          router.push(`/dashboard/questions/${newQuestions[0].questionId}?${urlParams.toString()}`);
        }
      }
    } catch (error) {
      toast.error('Failed to load questions page');
    } finally {
      setLoading(false);
    }
  };

  // 🔥 NEW: Toggle favorite
  const toggleFavorite = async () => {
    if (!question) return;
    
    try {
      setFavoriteLoading(true);
      const response = await questionsAPI.toggleFavorite(question.questionId);
      
      if (response.data.success) {
        setIsFavorite(response.data.isFavorite);
        toast.success(response.data.message);
        
        // Update in list
        const updatedList = [...questionsList];
        updatedList[currentIndex] = {
          ...updatedList[currentIndex],
          isFavorite: response.data.isFavorite
        };
        setQuestionsList(updatedList);
        sessionStorage.setItem('questionsList', JSON.stringify(updatedList));
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update favorite');
    } finally {
      setFavoriteLoading(false);
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
        
        const updatedList = [...questionsList];
        updatedList[currentIndex] = {
          ...updatedList[currentIndex],
          attempted: true,
          status: 'attempted'
        };
        setQuestionsList(updatedList);
        sessionStorage.setItem('questionsList', JSON.stringify(updatedList));
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit');
    }
  };

  const navigateToQuestion = (index: number) => {
    if (index < 0 || index >= questionsList.length) return;
    
    const targetQuestion = questionsList[index];
    if (!targetQuestion) return;

    const urlParams = new URLSearchParams();
    if (listParams?.examType) urlParams.set('examType', listParams.examType);
    if (listParams?.subject) urlParams.set('subject', listParams.subject);
    if (listParams?.chapter) urlParams.set('chapter', listParams.chapter);
    if (listParams?.topic) urlParams.set('topic', listParams.topic);
    if (listParams?.page) urlParams.set('page', listParams.page);
    if (listParams?.filter) urlParams.set('filter', listParams.filter); // 🔥 NEW

    router.push(`/dashboard/questions/${targetQuestion.questionId}?${urlParams.toString()}`);
  };

  const handleNextQuestion = () => {
    if (currentIndex < questionsList.length - 1) {
      navigateToQuestion(currentIndex + 1);
    } else if (currentListPage < totalPages) {
      loadQuestionsPage(currentListPage + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentIndex > 0) {
      navigateToQuestion(currentIndex - 1);
    } else if (currentListPage > 1) {
      loadQuestionsPage(currentListPage - 1);
    }
  };

  const backToList = () => {
    if (listParams) {
      const urlParams = new URLSearchParams(listParams);
      router.push(`/dashboard/questions?${urlParams.toString()}`);
    } else {
      router.push('/dashboard/questions');
    }
  };

  const globalQuestionNumber = (currentListPage - 1) * 20 + currentIndex + 1;

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!question) {
    return <div className="text-center py-12">Question not found</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={backToList}>
          ← Back to Questions
        </Button>
        
        <div className="flex items-center gap-4">
          {/* 🔥 NEW: Favorite Button */}
          <button
            onClick={toggleFavorite}
            disabled={favoriteLoading}
            className={`p-2 rounded-lg transition-all ${
              isFavorite
                ? 'text-pink-500 hover:text-pink-600 bg-pink-50 dark:bg-pink-900/20'
                : 'text-gray-400 hover:text-pink-500 hover:bg-pink-50 dark:hover:bg-pink-900/20'
            } ${favoriteLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <svg
              className="w-6 h-6"
              fill={isFavorite ? 'currentColor' : 'none'}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </button>
          
          {questionsList.length > 0 && totalQuestions > 0 && (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Question {globalQuestionNumber} of {totalQuestions}
            </div>
          )}
        </div>
      </div>

      <Card>
        <CardBody className="p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-100 rounded-full text-sm font-semibold">
                Question {globalQuestionNumber} {totalQuestions > 0 && `of ${totalQuestions}`}
              </span>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 text-right">
              <p className="font-mono">ID: {question.questionId}</p>
              <p className="font-mono text-xs">Serial: {question.serialNumber}</p>
            </div>
          </div>

          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                question.questionType === 'S' 
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-100'
                  : 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-100'
              }`}>
                {question.questionType === 'S' ? 'MCQ' : 'Numerical'}
              </span>
              <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-100 rounded-full text-sm">
                {question.subject} • {question.chapter}
              </span>
              {/* 🔥 NEW: Favorite badge */}
              {isFavorite && (
                <span className="px-3 py-1 bg-pink-100 dark:bg-pink-900 text-pink-700 dark:text-pink-100 rounded-full text-sm font-semibold">
                  ❤️ Favorite
                </span>
              )}
            </div>

            <div className="text-lg font-medium text-gray-900 dark:text-gray-50 mb-4 question-text">
              <LatexRenderer text={question.question} />
            </div>

            {question.questionImageUrl && (
              <img
                src={question.questionImageUrl}
                alt="Question"
                className="max-w-[50%] h-auto rounded-lg mb-4 border border-gray-200 dark:border-gray-700"
              />
            )}
          </div>

          <div className="space-y-3 mb-6">
            {question.questionType === 'S' ? (
              <>
                {['A', 'B', 'C', 'D'].map((option) => {
                  const isSelected = selectedAnswer === option;
                  const isCorrect = showResult && result?.correctAnswer === option;
                  const isWrong = showResult && isSelected && !result?.isCorrect;
                  
                  return (
                    <label
                      key={option}
                      className={`flex items-center p-4 border-2 rounded-lg transition-all option-text ${
                        showResult
                          ? isCorrect
                            ? 'border-green-500 bg-green-50 dark:bg-green-900/30'
                            : isWrong
                            ? 'border-red-500 bg-red-50 dark:bg-red-900/30'
                            : 'border-gray-200 dark:border-gray-700'
                          : isSelected
                          ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/30 option-selected'
                          : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700 cursor-pointer'
                      }`}
                    >
                      {!showResult && (
                        <input
                          type="radio"
                          name="answer"
                          value={option}
                          checked={isSelected}
                          onChange={(e) => setSelectedAnswer(e.target.value)}
                          className="mr-3"
                        />
                      )}
                      {showResult && (
                        <span className="mr-3 font-bold">
                          {isCorrect ? '✓' : isWrong ? '✗' : ' '}
                        </span>
                      )}
                      <div className="flex-1">
                        <LatexRenderer text={question[`option${option}` as keyof Question] as string} />
                      </div>
                    </label>
                  );
                })}

                {question.optionAImageUrl && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Options Image:</p>
                    <img
                      src={question.optionAImageUrl}
                      alt="Options"
                      className="max-w-full h-auto rounded-lg border border-gray-200 dark:border-gray-700"
                    />
                  </div>
                )}
              </>
            ) : (
              <input
                type="number"
                step="0.01"
                placeholder="Enter your answer"
                value={selectedAnswer}
                onChange={(e) => setSelectedAnswer(e.target.value)}
                disabled={showResult}
                className="w-full px-4 py-3 border-2 rounded-lg focus:border-purple-600 focus:outline-none disabled:bg-gray-100 dark:disabled:bg-gray-800 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
              />
            )}
          </div>

          {showResult && result && (
            <>
              <div className={`p-6 rounded-lg mb-6 ${
                result.isCorrect 
                  ? 'bg-green-50 dark:bg-green-900/30 border-2 border-green-500' 
                  : 'bg-red-50 dark:bg-red-900/30 border-2 border-red-500'
              }`}>
                <p className="font-semibold mb-2 text-gray-900 dark:text-gray-100">
                  {result.isCorrect ? '✅ Correct!' : '❌ Incorrect'}
                </p>
                <p className="text-sm text-gray-800 dark:text-gray-200">
                  Your Answer: <strong>{selectedAnswer}</strong>
                </p>
                <p className="text-sm text-gray-800 dark:text-gray-200">
                  Correct Answer: <strong>{result.correctAnswer}</strong>
                </p>
              </div>

              {result.explanation && (
                <div className="bg-blue-50 dark:bg-blue-900/30 p-6 rounded-lg mb-6 border-2 border-blue-200 dark:border-blue-800 explanation-text">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Explanation:</h4>
                  <div className="text-sm text-blue-800 dark:text-blue-200">
                    <LatexRenderer text={result.explanation} />
                  </div>

                  {result.explanationImageUrl && (
                    <img
                      src={result.explanationImageUrl}
                      alt="Explanation"
                      className="mt-4 max-w-[50%] h-auto rounded-lg border border-blue-200 dark:border-blue-700"
                    />
                  )}
                </div>
              )}
            </>
          )}

          <div className="flex gap-3 mt-6">
            {questionsList.length > 0 ? (
              <>
                <Button
                  variant="outline"
                  onClick={handlePreviousQuestion}
                  disabled={currentIndex === 0 && currentListPage === 1}
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
                    onClick={handleNextQuestion}
                    disabled={currentIndex >= questionsList.length - 1 && currentListPage >= totalPages}
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

          {questionsList.length > 0 && (
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Current Page Questions ({((currentListPage - 1) * 20) + 1} - {Math.min(currentListPage * 20, totalQuestions)}):
                </p>
                {totalPages > 1 && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Page {currentListPage} of {totalPages}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-10 gap-2">
                {questionsList.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => navigateToQuestion(i)}
                    className={`w-10 h-10 rounded-lg font-medium text-sm transition-all ${
                      i === currentIndex
                        ? 'bg-purple-600 text-white ring-2 ring-purple-300 dark:ring-purple-700'
                        : q.isFavorite // 🔥 UPDATED: Pink for favorites
                        ? 'bg-pink-500 text-white hover:bg-pink-600'
                        : q.status === 'attempted' || q.attempted
                        ? 'bg-green-500 text-white hover:bg-green-600'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
          )}

          {questionsList.length > 0 && totalPages > 1 && (
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadQuestionsPage(currentListPage - 1)}
                disabled={currentListPage === 1 || loading}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Previous 20
              </Button>
              
              <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                Page {currentListPage} of {totalPages}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadQuestionsPage(currentListPage + 1)}
                disabled={currentListPage === totalPages || loading}
              >
                Next 20
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Button>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}