'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import Card, { CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Dropdown from '@/components/ui/Dropdown';
import Loader from '@/components/ui/Loader';
import { questionsAPI, userAPI } from '@/lib/api';
import { storage } from '@/lib/utils';

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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUserExam();
  }, []);

  useEffect(() => {
    if (examType) {
      loadSubjects();
    }
  }, [examType]);

  useEffect(() => {
    if (selectedSubject) {
      loadChapters();
    }
  }, [selectedSubject]);

  useEffect(() => {
    if (selectedChapter) {
      loadTopics();
    }
  }, [selectedChapter]);

  useEffect(() => {
    if (selectedTopic) {
      loadQuestions();
    }
  }, [selectedTopic]);

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
        topic: selectedTopic,
      });

      if (response.data.success) {
        setQuestions(response.data.questions);
      }
    } catch (error) {
      toast.error('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const viewQuestion = (questionId: string) => {
    router.push(`/dashboard/questions/${questionId}`);
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
                ...topics.map((t) => ({ value: t, label: t })),
              ]}
              disabled={!selectedChapter}
            />
          </div>
        </CardBody>
      </Card>

      {/* Questions List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader size="lg" text="Loading questions..." />
        </div>
      ) : questions.length > 0 ? (
        <Card>
          <CardBody>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">
                Questions ({questions.length} total)
              </h3>
              <p className="text-sm text-gray-600">
                Showing {questions.length} of {questions.length}
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      #
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Question
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {questions.map((question, index) => (
                    <tr key={question.questionId} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 max-w-md">
                        <div className="truncate">
                          {question.question.replace(/latex:/g, '')}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            question.questionType === 'S'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {question.questionType === 'S' ? 'MCQ' : 'Numerical'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                        ID: {question.questionId}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => viewQuestion(question.questionId)}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
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