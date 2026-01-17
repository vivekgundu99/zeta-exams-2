'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import Card, { CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Dropdown from '@/components/ui/Dropdown';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://zeta-exams-backend-2.vercel.app';

export default function AdminQuestionsPage() {
  const [activeTab, setActiveTab] = useState('upload');
  const [examType, setExamType] = useState('jee');
  const [csvText, setCsvText] = useState('');
  const [uploading, setUploading] = useState(false);

  // Search & Edit State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  const handleUpload = async () => {
    if (!csvText.trim()) {
      toast.error('Please enter CSV data');
      return;
    }

    try {
      setUploading(true);
      const response = await fetch(`${API_URL}/api/admin/questions/bulk-upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ csvText, examType }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`${data.uploaded} questions uploaded!`);
        setCsvText('');
      } else {
        toast.error(data.message || 'Upload failed');
      }
    } catch (error: any) {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const searchQuestions = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    try {
      setSearching(true);
      console.log('🔍 Searching for:', searchQuery);
      
      const response = await fetch(
        `${API_URL}/api/admin/questions/search?query=${encodeURIComponent(searchQuery.trim())}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();
      console.log('📥 Search response:', data);
      
      if (data.success) {
        setSearchResults(data.questions || []);
        if (data.questions.length === 0) {
          toast.error('No questions found');
        } else {
          toast.success(`Found ${data.questions.length} question(s)`);
        }
      } else {
        toast.error(data.message || 'Search failed');
      }
    } catch (error: any) {
      console.error('Search error:', error);
      toast.error('Search failed');
    } finally {
      setSearching(false);
    }
  };

  const handleEdit = (question: any) => {
    setEditingQuestion(question.questionId);
    setEditForm({ ...question });
  };

  const cancelEdit = () => {
    setEditingQuestion(null);
    setEditForm({});
  };

  const saveEdit = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/questions/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(editForm),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Question updated successfully!');
        setEditingQuestion(null);
        searchQuestions();
      } else {
        toast.error(data.message || 'Update failed');
      }
    } catch (error: any) {
      toast.error('Update failed');
    }
  };

  const deleteQuestion = async (questionId: string) => {
    if (!window.confirm('Are you sure you want to delete this question?')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/admin/questions/${questionId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Question deleted successfully!');
        searchQuestions();
      } else {
        toast.error(data.message || 'Delete failed');
      }
    } catch (error: any) {
      toast.error('Delete failed');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Question Management</h1>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('upload')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'upload'
              ? 'text-purple-600 border-b-2 border-purple-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Upload Questions
        </button>
        <button
          onClick={() => setActiveTab('search')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'search'
              ? 'text-purple-600 border-b-2 border-purple-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Search & Edit
        </button>
      </div>

      {/* Upload Tab */}
      {activeTab === 'upload' && (
        <Card>
          <CardBody>
            <h3 className="font-semibold mb-4">CSV Format Help</h3>
            <div className="bg-gray-50 p-4 rounded-lg text-sm space-y-2 mb-6">
              <p><strong>MCQ:</strong> S#Physics#Gravitation#Topic#Question?#OptA#OptB#OptC#OptD#A#img#img#img#img#img#Explanation</p>
              <p><strong>Numerical:</strong> N#Physics#Gravitation#Topic#Question?#####Answer#img#####Explanation</p>
            </div>

            <Dropdown
              label="Exam Type"
              value={examType}
              onChange={(e) => setExamType(e.target.value)}
              options={[
                { value: 'jee', label: 'JEE' },
                { value: 'neet', label: 'NEET' },
              ]}
            />

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CSV Text ({csvText.split('\n').filter(l => l.trim()).length} questions)
              </label>
              <textarea
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                rows={15}
                className="w-full px-4 py-3 border-2 rounded-lg focus:border-purple-600 focus:outline-none font-mono text-sm"
                placeholder="Paste CSV formatted questions here..."
              />
            </div>

            <Button
              fullWidth
              onClick={handleUpload}
              isLoading={uploading}
              className="mt-4"
            >
              Upload Questions
            </Button>
          </CardBody>
        </Card>
      )}

      {/* Search & Edit Tab */}
      {activeTab === 'search' && (
        <Card>
          <CardBody>
            <h3 className="font-semibold mb-4">Search & Edit Questions</h3>
            
            <div className="flex gap-3 mb-6">
              <Input
                placeholder="Enter Question ID (e.g., 0000001) or Serial Number"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchQuestions()}
                className="flex-1"
              />
              <Button onClick={searchQuestions} isLoading={searching}>
                Search
              </Button>
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Found {searchResults.length} question(s)
                </p>

                {searchResults.map((question) => (
                  <div
                    key={question.questionId}
                    className="border-2 border-gray-200 rounded-lg p-4"
                  >
                    {editingQuestion === question.questionId ? (
                      // Edit Mode
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <Input
                            label="Question ID"
                            value={editForm.questionId}
                            disabled
                          />
                          <Input
                            label="Serial Number"
                            value={editForm.serialNumber}
                            disabled
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Question
                          </label>
                          <textarea
                            value={editForm.question}
                            onChange={(e) =>
                              setEditForm({ ...editForm, question: e.target.value })
                            }
                            rows={3}
                            className="w-full px-3 py-2 border-2 rounded focus:border-purple-600 focus:outline-none"
                          />
                        </div>

                        {editForm.questionType === 'S' && (
                          <div className="grid grid-cols-2 gap-4">
                            <Input
                              label="Option A"
                              value={editForm.optionA || ''}
                              onChange={(e) =>
                                setEditForm({ ...editForm, optionA: e.target.value })
                              }
                            />
                            <Input
                              label="Option B"
                              value={editForm.optionB || ''}
                              onChange={(e) =>
                                setEditForm({ ...editForm, optionB: e.target.value })
                              }
                            />
                            <Input
                              label="Option C"
                              value={editForm.optionC || ''}
                              onChange={(e) =>
                                setEditForm({ ...editForm, optionC: e.target.value })
                              }
                            />
                            <Input
                              label="Option D"
                              value={editForm.optionD || ''}
                              onChange={(e) =>
                                setEditForm({ ...editForm, optionD: e.target.value })
                              }
                            />
                          </div>
                        )}

                        <Input
                          label="Answer"
                          value={editForm.answer}
                          onChange={(e) =>
                            setEditForm({ ...editForm, answer: e.target.value })
                          }
                        />

                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Explanation
                          </label>
                          <textarea
                            value={editForm.explanation || ''}
                            onChange={(e) =>
                              setEditForm({ ...editForm, explanation: e.target.value })
                            }
                            rows={2}
                            className="w-full px-3 py-2 border-2 rounded focus:border-purple-600 focus:outline-none"
                          />
                        </div>

                        <div className="flex gap-3">
                          <Button onClick={saveEdit}>Save Changes</Button>
                          <Button variant="outline" onClick={cancelEdit}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // View Mode
                      <div>
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <span className="font-mono text-sm font-bold text-purple-600">
                                ID: {question.questionId}
                              </span>
                              <span className="font-mono text-sm text-gray-600">
                                Serial: {question.serialNumber}
                              </span>
                              <span
                                className={`px-2 py-1 rounded text-xs font-semibold ${
                                  question.questionType === 'S'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-green-100 text-green-700'
                                }`}
                              >
                                {question.questionType === 'S' ? 'MCQ' : 'Numerical'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">
                              {question.examType.toUpperCase()} • {question.subject} •{' '}
                              {question.chapter}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(question)}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => deleteQuestion(question.questionId)}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>

                        <div className="bg-gray-50 p-3 rounded">
                          <p className="text-sm font-medium mb-2">Question:</p>
                          <p className="text-sm text-gray-800">{question.question}</p>

                          {question.questionType === 'S' && (
                            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                              <p>
                                <strong>A:</strong> {question.optionA}
                              </p>
                              <p>
                                <strong>B:</strong> {question.optionB}
                              </p>
                              <p>
                                <strong>C:</strong> {question.optionC}
                              </p>
                              <p>
                                <strong>D:</strong> {question.optionD}
                              </p>
                            </div>
                          )}

                          <p className="mt-2 text-sm">
                            <strong className="text-green-700">Answer:</strong>{' '}
                            {question.answer}
                          </p>

                          {question.explanation && (
                            <p className="mt-2 text-sm text-gray-600">
                              <strong>Explanation:</strong> {question.explanation}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      )}
    </div>
  );
}