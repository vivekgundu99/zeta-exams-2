// frontend/src/app/dashboard/formulas/page.tsx - FIXED
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import Card, { CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Dropdown from '@/components/ui/Dropdown';
import Loader from '@/components/ui/Loader';
import { userAPI } from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://zeta-exams-backend-2.vercel.app';

export default function FormulasPage() {
  const router = useRouter();
  const [subscription, setSubscription] = useState<any>(null);
  const [examType, setExamType] = useState('');
  const [subjects, setSubjects] = useState<string[]>([]);
  const [chapters, setChapters] = useState<string[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('');
  const [formulas, setFormulas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSubscriptionAndLoad();
  }, []);

  useEffect(() => {
    if (examType && subscription?.subscription === 'gold') {
      loadFormulaSubjects();
    }
  }, [examType]);

  useEffect(() => {
    if (selectedSubject) {
      loadFormulaChapters();
    }
  }, [selectedSubject]);

  useEffect(() => {
    if (examType && subscription?.subscription === 'gold') {
      loadFormulas();
    }
  }, [examType, selectedSubject, selectedChapter]);

  const checkSubscriptionAndLoad = async () => {
    try {
      const response = await userAPI.getProfile();
      if (response.data.success) {
        setSubscription(response.data.subscription);
        setExamType(response.data.user.exam);
      }
    } catch (error) {
      console.error('Failed to load subscription');
    } finally {
      setLoading(false);
    }
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please login again');
      return null;
    }
    
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  };

  // 🔥 FIXED: Load subjects from formulas, not questions
  const loadFormulaSubjects = async () => {
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const response = await fetch(
        `${API_URL}/api/formulas/list?examType=${examType}`,
        { method: 'GET', headers }
      );

      const data = await response.json();
      if (data.success && data.formulas) {
        // 🔥 FIXED: Use Array.from instead of spread operator
        const subjectSet = new Set(data.formulas.map((f: any) => f.subject));
        const uniqueSubjects = Array.from(subjectSet);
        setSubjects(uniqueSubjects as string[]);
      }
    } catch (error) {
      console.error('Failed to load subjects');
    }
  };

  // 🔥 FIXED: Load chapters from formulas, not questions
  const loadFormulaChapters = async () => {
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const params = new URLSearchParams();
      if (examType) params.append('examType', examType);
      if (selectedSubject) params.append('subject', selectedSubject);

      const response = await fetch(
        `${API_URL}/api/formulas/list?${params.toString()}`,
        { method: 'GET', headers }
      );

      const data = await response.json();
      if (data.success && data.formulas) {
        // 🔥 FIXED: Use Array.from instead of spread operator
        const chapterSet = new Set(data.formulas.map((f: any) => f.chapter));
        const uniqueChapters = Array.from(chapterSet);
        setChapters(uniqueChapters as string[]);
        setSelectedChapter('');
      }
    } catch (error) {
      console.error('Failed to load chapters');
    }
  };

  const loadFormulas = async () => {
    try {
      setLoading(true);
      const headers = getAuthHeaders();
      if (!headers) {
        setLoading(false);
        return;
      }

      const params = new URLSearchParams();
      if (examType) params.append('examType', examType);
      if (selectedSubject) params.append('subject', selectedSubject);
      if (selectedChapter) params.append('chapter', selectedChapter);

      const response = await fetch(`${API_URL}/api/formulas/list?${params.toString()}`, {
        method: 'GET',
        headers,
      });

      const data = await response.json();

      if (data.success) {
        setFormulas(data.formulas || []);
      } else {
        toast.error(data.message || 'Failed to load formulas');
      }
    } catch (error: any) {
      console.error('Load formulas error:', error);
      toast.error('Failed to load formulas');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !subscription) {
    return (
      <div className="flex justify-center py-12">
        <Loader size="lg" text="Loading..." />
      </div>
    );
  }

  if (subscription?.subscription !== 'gold') {
    return (
      <div className="space-y-6">
        <Card className="border-2 border-purple-200">
          <CardBody className="p-12 text-center">
            <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Upgrade to Gold to Access Formulas
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Get unlimited access to all formulas, flashcards, and quick reference materials
            </p>
            <Button size="lg" onClick={() => router.push('/subscription')}>
              Upgrade to Gold Plan
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Formulas & Quick Reference</h1>
        <p className="text-gray-600">Access all important formulas by subject and chapter</p>
      </div>

      <Card>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Dropdown
              label="Subject"
              value={selectedSubject}
              onChange={(e) => {
                setSelectedSubject(e.target.value);
                setSelectedChapter('');
              }}
              options={[
                { value: '', label: 'All Subjects' },
                ...subjects.map((s) => ({ value: s, label: s })),
              ]}
            />

            <Dropdown
              label="Chapter"
              value={selectedChapter}
              onChange={(e) => setSelectedChapter(e.target.value)}
              options={[
                { value: '', label: selectedSubject ? 'All Chapters' : 'Select Subject First' },
                ...chapters.map((c) => ({ value: c, label: c })),
              ]}
              disabled={!selectedSubject}
            />
          </div>

          {loading ? (
            <div className="py-12 text-center">
              <Loader size="md" text="Loading formulas..." />
            </div>
          ) : formulas.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Formulas Found</h3>
              <p className="text-gray-600">No formulas available for selected filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {formulas.map((formula, index) => (
                <Card key={index} hover>
                  <CardBody>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <span className="text-xl">📖</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{formula.topicName}</h3>
                        <p className="text-xs text-gray-600">{formula.subject} • {formula.chapter}</p>
                      </div>
                    </div>
                    {formula.description && (
                      <p className="text-sm text-gray-600 mb-3">{formula.description}</p>
                    )}
                    <Button
                      size="sm"
                      fullWidth
                      variant="outline"
                      onClick={() => window.open(formula.pdfUrl, '_blank')}
                    >
                      View PDF
                    </Button>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}