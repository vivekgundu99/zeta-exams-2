'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import Card, { CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Dropdown from '@/components/ui/Dropdown';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://zeta-exams-backend-2.vercel.app';

export default function AdminMockTestsPage() {
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    examType: 'jee',
    testName: '',
    csvText: '',
  });

  useEffect(() => {
    loadTests();
  }, []);

  const loadTests = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/admin/mock-tests/list`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setTests(data.tests || []);
      }
    } catch (error) {
      console.error('Failed to load tests');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.testName || !formData.csvText) {
      toast.error('Please fill all fields');
      return;
    }

    const lines = formData.csvText.trim().split('\n').filter(l => l.trim());
    const requiredQuestions = formData.examType === 'jee' ? 90 : 180;

    if (lines.length !== requiredQuestions) {
      toast.error(`Test must have exactly ${requiredQuestions} questions. Found: ${lines.length}`);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/admin/mock-tests/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Mock test created successfully!');
        setShowForm(false);
        setFormData({ examType: 'jee', testName: '', csvText: '' });
        loadTests();
      } else {
        toast.error(data.message || 'Failed to create test');
      }
    } catch (error: any) {
      toast.error('Failed to create test');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (testId: string) => {
    if (!window.confirm('Are you sure you want to delete this mock test?')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/admin/mock-tests/${testId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Mock test deleted successfully!');
        loadTests();
      } else {
        toast.error(data.message || 'Failed to delete test');
      }
    } catch (error: any) {
      toast.error('Failed to delete test');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mock Test Management</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Create Mock Test'}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardBody>
            <h3 className="font-semibold mb-4">Create New Mock Test</h3>
            
            <div className="bg-blue-50 p-4 rounded-lg text-sm mb-6">
              <p className="font-semibold text-blue-900 mb-2">CSV Format Guide:</p>
              <div className="space-y-2 text-blue-800">
                <p><strong>JEE:</strong> 90 questions (30 Physics + 30 Chemistry + 30 Maths)</p>
                <p><strong>NEET:</strong> 180 questions (45 Physics + 45 Chemistry + 90 Biology)</p>
                <p className="mt-3"><strong>Format:</strong></p>
                <p className="font-mono text-xs bg-white p-2 rounded">
                  Type#Subject#Chapter#Topic#Question#OptA#OptB#OptC#OptD#Answer#QImg#AImg#BImg#CImg#DImg#Explanation#ExpImg
                </p>
                <p className="mt-2"><strong>Important:</strong></p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Chapter and Topic can be EMPTY (use ##)</li>
                  <li>MCQ: Type=S, provide all 4 options</li>
                  <li>Numerical: Type=N, leave options empty (#####)</li>
                </ul>
                <p className="mt-2"><strong>Examples:</strong></p>
                <p className="font-mono text-xs bg-white p-2 rounded">
                  S#Physics##Topic1#Question?#OptA#OptB#OptC#OptD#A#img####Explanation#
                </p>
                <p className="font-mono text-xs bg-white p-2 rounded">
                  N#Chemistry##Topic2#Question?#####42.5#img#####Explanation#
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Dropdown
                label="Exam Type"
                value={formData.examType}
                onChange={(e) => setFormData({ ...formData, examType: e.target.value })}
                options={[
                  { value: 'jee', label: 'JEE Main (90 Questions)' },
                  { value: 'neet', label: 'NEET (180 Questions)' },
                ]}
              />

              <Input
                label="Test Name"
                value={formData.testName}
                onChange={(e) => setFormData({ ...formData, testName: e.target.value })}
                placeholder="e.g., JEE Main Mock Test 1"
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CSV Text ({formData.csvText.split('\n').filter(l => l.trim()).length} questions)
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <textarea
                  value={formData.csvText}
                  onChange={(e) => setFormData({ ...formData, csvText: e.target.value })}
                  rows={15}
                  className="w-full px-4 py-3 border-2 rounded-lg focus:border-purple-600 focus:outline-none font-mono text-sm"
                  placeholder="Paste CSV formatted questions here..."
                  required
                />
              </div>

              <Button type="submit" fullWidth isLoading={loading}>
                Create Mock Test
              </Button>
            </form>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardBody>
          <h3 className="font-semibold mb-4">Existing Mock Tests ({tests.length})</h3>
          
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : tests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No mock tests created yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Test ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Test Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Exam</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Questions</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tests.map((test) => (
                    <tr key={test.testId} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-gray-600">
                        {test.testId}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {test.testName}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
                          {test.examType.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        {test.totalQuestions}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        {test.duration} min
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {new Date(test.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleDelete(test.testId)}
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}