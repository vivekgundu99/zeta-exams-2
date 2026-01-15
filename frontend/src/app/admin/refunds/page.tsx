'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import Card, { CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { adminAPI } from '@/lib/api';

export default function AdminRefundsPage() {
  const [refunds, setRefunds] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRefunds();
  }, []);

  const loadRefunds = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getRefunds();
      if (response.data.success) {
        setRefunds(response.data.tickets || []);
      }
    } catch (error) {
      toast.error('Failed to load refund requests');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessRefund = async (ticketNumber: string) => {
    if (!window.confirm('Process 50% refund for this ticket? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await adminAPI.processRefund(ticketNumber);
      if (response.data.success) {
        toast.success(`Refund processed: ₹${response.data.refundAmount}`);
        loadRefunds();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to process refund');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Refund Management</h1>
          <p className="text-gray-600">Pending Refunds: {refunds.length}</p>
        </div>
      </div>

      {refunds.length === 0 ? (
        <Card>
          <CardBody className="text-center py-12">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">✅</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Pending Refunds
            </h3>
            <p className="text-gray-600">All refund requests have been processed</p>
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-6">
          {refunds.map((ticket) => (
            <Card key={ticket.ticketNumber} className="border-2 border-orange-200">
              <CardBody>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="font-mono text-lg font-bold text-purple-600">
                        {ticket.ticketNumber}
                      </span>
                      <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold">
                        💰 Refund Requested
                      </span>
                      {ticket.refundEligible && (
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                          ✅ Eligible
                        </span>
                      )}
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600">User</p>
                        <p className="font-semibold text-gray-900">{ticket.userName}</p>
                        <p className="text-sm text-gray-600">{ticket.userEmail}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">User ID</p>
                        <p className="font-mono text-sm text-gray-800">{ticket.userId}</p>
                      </div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg mb-4">
                      <p className="text-sm text-blue-900 font-semibold mb-1">Issue:</p>
                      <p className="text-blue-800">{ticket.issue}</p>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>Created:</span>
                      <span>{new Date(ticket.createdAt).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="ml-6">
                    <Button
                      variant="primary"
                      onClick={() => handleProcessRefund(ticket.ticketNumber)}
                      disabled={!ticket.refundEligible}
                    >
                      Process 50% Refund
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}