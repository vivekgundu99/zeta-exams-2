'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import Card, { CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Dropdown from '@/components/ui/Dropdown';
import { adminAPI } from '@/lib/api';

export default function AdminFormulasPage() {
  const [formulas, setFormulas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    examType: 'jee',
    subject: '',
    chapter: '',
    topicName: '',
    pdfUrl: '',
    description: '',
  });

  useEffect(() => {
    loadFormulas();
  }, []);

  const loadFormulas = async () => {
    try {
      setLoading(true);
      // You'll need to add this endpoint to adminAPI
      const response = await fetch('/api/formulas/admin/list', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setFormulas(data.formulas || []);
      }
    } catch (error) {
      console.error('Failed to load formulas');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.examType || !formData.subject || !formData.chapter || !formData.topicName || !formData.pdfUrl) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/admin/formulas/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Formula added successfully!');
        setShowForm(false);
        setFormData({
          examType: 'jee',
          subject: '',
          chapter: '',
          topicName: '',
          pdfUrl: '',
          description: '',
        });
        loadFormulas();
      } else {
        toast.error(data.message || 'Failed to add formula');
      }
    } catch (error: any) {
      toast.error('Failed to add formula');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this formula?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/formulas/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Formula deleted successfully!');
        loadFormulas();
      } else {
        toast.error(data.message || 'Failed to delete formula');
      }
    } catch (error) {
      toast.error('Failed to delete formula');
    }
  };

  const subjects = {
    jee: ['Physics', 'Chemistry', 'Mathematics'],
    neet: ['Physics', 'Chemistry', 'Biology'],
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Formula Management</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add Formula'}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardBody>
            <h3 className="font-semibold mb-4">Add New Formula</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Dropdown
                  label="Exam Type"
                  value={formData.examType}
                  onChange={(e) => setFormData({ ...formData, examType: e.target.value })}
                  options={[
                    { value: 'jee', label: 'JEE' },
                    { value: 'neet', label: 'NEET' },
                  ]}
                />

                <Dropdown
                  label="Subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  options={[
                    { value: '', label: 'Select Subject' },
                    ...subjects[formData.examType as 'jee' | 'neet'].map((s) => ({
                      value: s,
                      label: s,
                    })),
                  ]}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Chapter"
                  value={formData.chapter}
                  onChange={(e) => setFormData({ ...formData, chapter: e.target.value })}
                  placeholder="e.g., Gravitation"
                  required
                />

                <Input
                  label="Topic Name"
                  value={formData.topicName}
                  onChange={(e) => setFormData({ ...formData, topicName: e.target.value })}
                  placeholder="e.g., Newton's Laws"
                  required
                />
              </div>

              <Input
                label="PDF URL (CloudFront)"
                value={formData.pdfUrl}
                onChange={(e) => setFormData({ ...formData, pdfUrl: e.target.value })}
                placeholder="https://d1234567890.cloudfront.net/formulas/..."
                required
              />

              <Input
                label="Description (Optional)"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the formula"
              />

              <Button type="submit" fullWidth isLoading={loading}>
                Add Formula
              </Button>
            </form>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardBody>
          <h3 className="font-semibold mb-4">Existing Formulas ({formulas.length})</h3>
          
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : formulas.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No formulas added yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Exam</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Chapter</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Topic</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">PDF</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {formulas.map((formula) => (
                    <tr key={formula._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
                          {formula.examType.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">{formula.subject}</td>
                      <td className="px-4 py-3 text-sm">{formula.chapter}</td>
                      <td className="px-4 py-3 text-sm">{formula.topicName}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <a
                          href={formula.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-600 hover:text-purple-700"
                        >
                          View PDF
                        </a>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleDelete(formula._id)}
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