'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import Card, { CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Dropdown from '@/components/ui/Dropdown';
import { adminAPI } from '@/lib/api';

export default function AdminGiftCodesPage() {
  const [codes, setCodes] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    subscriptionType: 'silver',
    duration: '1month',
    quantity: 1,
    notes: '',
  });
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);

  useEffect(() => {
    loadCodes();
  }, [filter]);

  const loadCodes = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getGiftCodes(filter);
      if (response.data.success) {
        setCodes(response.data.giftCodes || []);
      }
    } catch (error) {
      toast.error('Failed to load gift codes');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.quantity < 1 || formData.quantity > 100) {
      toast.error('Quantity must be between 1 and 100');
      return;
    }

    try {
      setLoading(true);
      const response = await adminAPI.generateGiftCodes({
        subscriptionType: formData.subscriptionType,
        duration: formData.duration,
        quantity: formData.quantity,
        notes: formData.notes || undefined,
      });

      if (response.data.success) {
        toast.success(`${formData.quantity} gift codes generated!`);
        setGeneratedCodes(response.data.codes);
        setShowForm(false);
        loadCodes();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to generate codes');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (code: string) => {
    if (!window.confirm(`Are you sure you want to delete code: ${code}?`)) {
      return;
    }

    try {
      const response = await adminAPI.deleteGiftCode(code);
      if (response.data.success) {
        toast.success('Gift code deleted successfully');
        loadCodes();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete code');
    }
  };

  const copyAllCodes = () => {
    const text = generatedCodes.join('\n');
    navigator.clipboard.writeText(text);
    toast.success('All codes copied to clipboard!');
  };

  const getDurationLabel = (duration: string) => {
    const labels: Record<string, string> = {
      '1month': '1 Month',
      '6months': '6 Months',
      '1year': '1 Year',
    };
    return labels[duration] || duration;
  };

  const stats = {
    total: codes.length,
    used: codes.filter(c => c.status === 'used').length,
    available: codes.filter(c => c.status === 'available').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gift Code Management</h1>
          <p className="text-gray-600">
            Total: {stats.total} | Used: {stats.used} | Available: {stats.available}
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Generate Codes'}
        </Button>
      </div>

      {/* Generated Codes Modal */}
      {generatedCodes.length > 0 && (
        <Card className="border-2 border-green-200 bg-green-50">
          <CardBody>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-bold text-green-900 mb-2">
                  ✅ {generatedCodes.length} Codes Generated Successfully!
                </h3>
                <p className="text-sm text-green-700">
                  Save these codes. They won't be shown again.
                </p>
              </div>
              <Button size="sm" onClick={copyAllCodes}>
                Copy All
              </Button>
            </div>
            <div className="bg-white p-4 rounded-lg max-h-60 overflow-y-auto">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {generatedCodes.map((code, i) => (
                  <div
                    key={i}
                    className="font-mono text-sm bg-gray-100 px-3 py-2 rounded border border-gray-300"
                  >
                    {code}
                  </div>
                ))}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              fullWidth
              className="mt-3"
              onClick={() => setGeneratedCodes([])}
            >
              Close
            </Button>
          </CardBody>
        </Card>
      )}

      {showForm && (
        <Card>
          <CardBody>
            <h3 className="font-semibold mb-4">Generate Gift Codes</h3>
            <form onSubmit={handleGenerate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Dropdown
                  label="Subscription Type"
                  value={formData.subscriptionType}
                  onChange={(e) => setFormData({ ...formData, subscriptionType: e.target.value })}
                  options={[
                    { value: 'silver', label: 'Silver Plan' },
                    { value: 'gold', label: 'Gold Plan' },
                  ]}
                />

                <Dropdown
                  label="Duration"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  options={[
                    { value: '1month', label: '1 Month' },
                    { value: '6months', label: '6 Months' },
                    { value: '1year', label: '1 Year' },
                  ]}
                />
              </div>

              <Input
                label="Quantity (Max 100)"
                type="number"
                min="1"
                max="100"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                required
              />

              <Input
                label="Notes (Optional)"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="e.g., For marketing campaign"
              />

              <Button type="submit" fullWidth isLoading={loading}>
                Generate {formData.quantity} Code{formData.quantity > 1 ? 's' : ''}
              </Button>
            </form>
          </CardBody>
        </Card>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {[
          { value: 'all', label: 'All Codes' },
          { value: 'available', label: 'Available' },
          { value: 'used', label: 'Used' },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`px-4 py-2 font-medium transition-colors ${
              filter === tab.value
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <Card>
        <CardBody>
          {loading ? (
            <div className="text-center py-8">Loading codes...</div>
          ) : codes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No gift codes {filter !== 'all' ? filter : 'generated'} yet
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Used By</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Used At</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {codes.map((code) => (
                    <tr key={code.code} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap font-mono text-sm font-bold text-purple-600">
                        {code.code}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          code.subscriptionType === 'gold'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-200 text-gray-700'
                        }`}>
                          {code.subscriptionType.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        {getDurationLabel(code.duration)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          code.status === 'used'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {code.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {code.usedBy || '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {code.usedAt ? new Date(code.usedAt).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                        {code.notes || '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleDelete(code.code)}
                          disabled={code.status === 'used'}
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