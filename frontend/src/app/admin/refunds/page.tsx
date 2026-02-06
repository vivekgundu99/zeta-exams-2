// frontend/src/app/admin/refunds/page.tsx - UPDATED ADMIN REFUND PAGE
'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import Card, { CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Loader from '@/components/ui/Loader';
import { adminAPI } from '@/lib/api';

interface RefundRequest {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  subscription: string;
  subscriptionAmount: number;
  subscriptionStartDate: string;
  subscriptionEndDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  processedAt?: string;
  refundAmount?: number;
}

export default function AdminRefundsPage() {
  const [refunds, setRefunds] = useState<RefundRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    loadRefunds();
  }, []);

  const loadRefunds = async () => {
    try {
      const response = await adminAPI.getRefundRequests();
      if (response.data.success) {
        setRefunds(response.data.refunds);
      }
    } catch (error: any) {
      toast.error('Failed to load refund requests');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessRefund = async (refundId: string, approve: boolean) => {
    try {
      setProcessing(refundId);

      const response = await adminAPI.processRefund(refundId, {
        approve,
      });

      if (response.data.success) {
        toast.success(
          approve
            ? 'Refund approved and credited to wallet'
            : 'Refund request rejected'
        );
        loadRefunds();
      } else {
        toast.error(response.data.message);
      }
    } catch (error: any) {
      toast.error('Failed to process refund');
    } finally {
      setProcessing(null);
    }
  };

  const calculateRefundAmount = (refund: RefundRequest) => {
    const now = new Date();
    const start = new Date(refund.subscriptionStartDate);
    const end = new Date(refund.subscriptionEndDate);

    const totalDuration = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    const percentageUsed = (elapsed / totalDuration) * 100;

    if (percentageUsed < 50) {
      return Math.floor(refund.subscriptionAmount * 0.5);
    }
    return 0;
  };

  const calculatePercentageUsed = (refund: RefundRequest) => {
    const now = new Date();
    const start = new Date(refund.subscriptionStartDate);
    const end = new Date(refund.subscriptionEndDate);

    const totalDuration = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    return Math.min(Math.floor((elapsed / totalDuration) * 100), 100);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader size="lg" text="Loading refund requests..." />
      </div>
    );
  }

  const pendingRefunds = refunds.filter((r) => r.status === 'pending');
  const processedRefunds = refunds.filter((r) => r.status !== 'pending');

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Refund Management
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Review and process user refund requests
        </p>
      </div>

      {/* Refund Policy Info */}
      <Card className="mb-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardBody className="p-6">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">
            💡 Refund Policy
          </h3>
          <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
            <li>• Gift code subscriptions: Not eligible for refund</li>
            <li>
              • Original subscriptions: 50% refund to wallet if less than 50%
              duration used
            </li>
            <li>• Refund amount credited to user's wallet, not bank account</li>
            <li>
              • User account immediately downgraded to FREE plan after approval
            </li>
          </ul>
        </CardBody>
      </Card>

      {/* Pending Refunds */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Pending Requests ({pendingRefunds.length})
        </h2>

        {pendingRefunds.length === 0 ? (
          <Card>
            <CardBody className="p-6 text-center text-gray-500 dark:text-gray-400">
              No pending refund requests
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-4">
            {pendingRefunds.map((refund) => {
              const refundAmount = calculateRefundAmount(refund);
              const percentageUsed = calculatePercentageUsed(refund);
              const isEligible = percentageUsed < 50;

              return (
                <Card key={refund._id}>
                  <CardBody className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {refund.userId.name}
                          </h3>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              isEligible
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            }`}
                          >
                            {isEligible ? 'Eligible' : 'Not Eligible'}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Email
                            </p>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {refund.userId.email}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Phone
                            </p>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {refund.userId.phone}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Subscription
                            </p>
                            <p className="font-medium text-gray-900 dark:text-white uppercase">
                              {refund.subscription}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Amount Paid
                            </p>
                            <p className="font-medium text-gray-900 dark:text-white">
                              ₹{refund.subscriptionAmount}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Duration Used
                            </p>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {percentageUsed}%
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Refund Amount
                            </p>
                            <p
                              className={`font-bold ${
                                refundAmount > 0
                                  ? 'text-green-600 dark:text-green-400'
                                  : 'text-red-600 dark:text-red-400'
                              }`}
                            >
                              {refundAmount > 0 ? `₹${refundAmount}` : 'Not Eligible'}
                            </p>
                          </div>
                        </div>

                        <div className="mb-4">
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                            Reason
                          </p>
                          <p className="text-gray-700 dark:text-gray-300">
                            {refund.reason || 'No reason provided'}
                          </p>
                        </div>

                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Requested: {new Date(refund.requestedAt).toLocaleString()}
                        </div>
                      </div>

                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="success"
                          onClick={() => handleProcessRefund(refund._id, true)}
                          disabled={processing === refund._id}
                        >
                          {processing === refund._id ? 'Processing...' : 'Approve'}
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() => handleProcessRefund(refund._id, false)}
                          disabled={processing === refund._id}
                        >
                          Reject
                        </Button>
                      </div>
                    </div>

                    {/* Refund Calculation Info */}
                    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        📋 Refund Calculation:
                      </p>
                      <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        <li>
                          • Subscription Period:{' '}
                          {new Date(refund.subscriptionStartDate).toLocaleDateString()} -{' '}
                          {new Date(refund.subscriptionEndDate).toLocaleDateString()}
                        </li>
                        <li>• Percentage Used: {percentageUsed}%</li>
                        <li>
                          • Eligibility: {isEligible ? 'Yes (<50% used)' : 'No (≥50% used)'}
                        </li>
                        <li>
                          • Refund Amount:{' '}
                          {refundAmount > 0
                            ? `₹${refundAmount} (50% of ₹${refund.subscriptionAmount})`
                            : '₹0'}
                        </li>
                        <li>
                          • Credit Destination: User Wallet (not bank account)
                        </li>
                      </ul>
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Processed Refunds */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Processed Requests ({processedRefunds.length})
        </h2>

        {processedRefunds.length === 0 ? (
          <Card>
            <CardBody className="p-6 text-center text-gray-500 dark:text-gray-400">
              No processed refund requests
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-4">
            {processedRefunds.map((refund) => (
              <Card key={refund._id}>
                <CardBody className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {refund.userId.name}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            refund.status === 'approved'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          }`}
                        >
                          {refund.status.toUpperCase()}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Subscription
                          </p>
                          <p className="font-medium text-gray-900 dark:text-white uppercase">
                            {refund.subscription}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Refund Amount
                          </p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {refund.refundAmount ? `₹${refund.refundAmount}` : '₹0'}
                          </p>
                        </div>
                      </div>

                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Processed: {refund.processedAt ? new Date(refund.processedAt).toLocaleString() : 'N/A'}
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}