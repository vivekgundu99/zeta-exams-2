'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import Card, { CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Dropdown from '@/components/ui/Dropdown';
import Loader from '@/components/ui/Loader';
import LatexRenderer from '@/components/ui/LatexRenderer';
import { questionsAPI, userAPI } from '@/lib/api';

export default function QuestionsPage() {
  const router = useRouter();
  const [examType, setExamType] = useState('');
  const [subjects, setSubjects] = useState<string[]>([]);
  const [chapters, setChapters] = useState<string[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
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

  useEffect(() => {
    if (selectedChapter) loadTopics();
  }, [selectedChapter]);

  useEffect(() => {
    if (selectedTopic) loadQuestions();
  }, [selectedTopic, currentPage]);

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
        setTopics([]);
        setQuestions([]);
        setCurrentPage(1);
      }
    } catch (error) {
      toast.error('Failed to load chapters');
    }
  };

  const loadTopics = async () => {
    try {
      const response = await questionsAPI.getTopics(selectedSubject, selectedChapter, examType);
      if (response.data.success) {
        setTopics(response.data.topics);
        setSelectedTopic('');
        setQuestions([]);
        setCurrentPage(1);
      }
    } catch (error) {
      toast.error('Failed to load topics');
    }
  };

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const response = await questionsAPI.getQuestions({
        examType,
        subject: selectedSubject,
        chapter: selectedChapter,
        topic: selectedTopic === 'ALL_TOPICS' ? '' : selectedTopic,
        page: currentPage,
        limit: 20
      });

      if (response.data.success) {
        setQuestions(response.data.questions);
        setTotalPages(response.data.totalPages || 1);
        setTotal(response.data.total || 0);
        
        // 🔥 SAVE TO SESSION - INCLUDING TOTAL PAGES AND TOTAL COUNT
        sessionStorage.setItem('questionsList', JSON.stringify(response.data.questions));
        sessionStorage.setItem('questionsListParams', JSON.stringify({
          examType,
          subject: selectedSubject,
          chapter: selectedChapter,
          topic: selectedTopic,
          page: currentPage.toString()
        }));
        sessionStorage.setItem('questionsTotalPages', (response.data.totalPages || 1).toString());
        sessionStorage.setItem('questionsTotalCount', (response.data.total || 0).toString());
      }
    } catch (error) {
      toast.error('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const viewQuestion = (questionId: string) => {
    const params = new URLSearchParams({
      examType,
      subject: selectedSubject,
      chapter: selectedChapter,
      topic: selectedTopic,
      page: currentPage.toString()
    });
    router.push(`/dashboard/questions/${questionId}?${params.toString()}`);
  };

  const getStatusBadge = (status: string) => {
    if (status === 'attempted') {
      return (
        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">
          ✓ Attempted
        </span>
      );
    }
    return (
      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-semibold">
        Unattempted
      </span>
    );
  };

  const renderPaginationButtons = () => {
    const buttons = [];
    const maxButtons = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);
    
    if (endPage - startPage < maxButtons - 1) {
      startPage = Math.max(1, endPage - maxButtons + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => setCurrentPage(i)}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            i === currentPage
              ? 'bg-purple-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {i}
        </button>
      );
    }

    return buttons;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chapterwise Questions</h1>
          <p className="text-gray-600">Practice questions topic by topic</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

            <Dropdown
              label="Topic"
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              options={[
                { value: '', label: selectedChapter ? 'Select Topic' : 'Select Chapter First' },
                { value: 'ALL_TOPICS', label: '📚 All Topics' },
                ...topics.map((t) => ({ value: t, label: t })),
              ]}
              disabled={!selectedChapter}
            />
          </div>
        </CardBody>
      </Card>

      {/* Questions Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader size="lg" text="Loading questions..." />
        </div>
      ) : questions.length > 0 ? (
        <>
          <div className="mb-4 text-sm text-gray-600">
            Showing {questions.length} questions (Page {currentPage} of {totalPages} • Total: {total})
          </div>

          <div className="grid grid-cols-1 gap-4">
            {questions.map((question, index) => (
              <Card key={question.questionId} hover>
                <CardBody className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-purple-600">
                        #{(currentPage - 1) * 20 + index + 1}
                      </span>
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          question.questionType === 'S'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {question.questionType === 'S' ? 'MCQ' : 'Numerical'}
                      </span>
                      {getStatusBadge(question.status)}
                    </div>
                    <span className="text-xs text-gray-500 font-mono">
                      ID: {question.questionId}
                    </span>
                  </div>

                  <div className="mb-4 text-gray-900">
                    <LatexRenderer text={question.question} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      {question.subject} • {question.chapter} • {question.topic}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => viewQuestion(question.questionId)}
                    >
                      {question.status === 'attempted' ? 'Review' : 'Attempt'}
                    </Button>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                ← Previous
              </Button>
              
              {renderPaginationButtons()}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Next →
              </Button>
            </div>
          )}
        </>
      ) : (
        !selectedTopic && (
          <Card>
            <CardBody className="py-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Questions Selected
              </h3>
              <p className="text-gray-600">
                Please select subject, chapter, and topic to view questions
              </p>
            </CardBody>
          </Card>
        )
      )}
    </div>
  );
}