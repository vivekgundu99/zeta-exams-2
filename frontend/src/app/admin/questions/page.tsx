'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import Card, { CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Dropdown from '@/components/ui/Dropdown';
import { adminAPI } from '@/lib/api';

export default function AdminQuestionsPage() {
  const [examType, setExamType] = useState('jee');
  const [csvText, setCsvText] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    if (!csvText.trim()) {
      toast.error('Please enter CSV data');
      return;
    }

    try {
      setUploading(true);
      const response = await adminAPI.bulkUploadQuestions({
        csvText,
        examType,
      });

      if (response.data.success) {
        toast.success(`${response.data.uploaded} questions uploaded!`);
        setCsvText('');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Question Management</h1>

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
    </div>
  );
}