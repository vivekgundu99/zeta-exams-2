// frontend/src/app/admin/wallet/page.tsx - ADMIN WALLET PAGE
'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import Card, { CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Loader from '@/components/ui/Loader';
import Modal from '@/components/ui/Modal';
import { adminWalletAPI } from '@/lib/api';
import { formatCurrency, formatDate, formatTime } from '@/lib/utils';

export default function AdminWalletPage() {
  const [topups, setTopups] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showUserWalletModal, setShowUserWalletModal] = useState(false);
  const [showAddMoneyModal, setShowAddMoneyModal] = useState(false);
  const [showDeductMoneyModal, setShowDeductMoneyModal] = useState(false);
  const [userWallet, setUserWallet] = useState<any>(null);
  const [searchUserId, setSearchUserId] = useState('');
  const [adminUserId, setAdminUserId] = useState('');
  const [adminAmount, setAdminAmount] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [processing, setProcessing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    loadTopups();
    loadStats();
  }, [currentPage]);

  const loadTopups = async () => {
    try {
      setLoading(true);
      const response = await adminWalletAPI.getTopups(currentPage);
      if (response.data.success) {
        setTopups(response.data.topups);
      }
    } catch (error) {
      console.error('Load top-ups error:', error);
      toast.error('Failed to load top-ups');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await adminWalletAPI.getStats();
      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Load stats error:', error);
    }
  };

  const loadUserWallet = async () => {
    if (!searchUserId.trim()) {
      toast.error('Please enter a user ID');
      return;
    }

    try {
      setProcessing(true);
      const response = await adminWalletAPI.getUserWallet(searchUserId.trim());
      if (response.data.success) {
        setUserWallet(response.data.wallet);
        setShowUserWalletModal(true);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'User not found');
    } finally {
      setProcessing(false);
    }
  };

  const handleAddMoney = async () => {
    const amount = parseInt(adminAmount);

    if (!adminUserId.trim() || !amount || amount <= 0) {
      toast.error('Please enter valid user ID and amount');
      return;
    }

    try {
      setProcessing(true);
      const response = await adminWalletAPI.addMoney(
        adminUserId.trim(),
        amount,
        adminNote.trim() || undefined
      );

      if (response.data.success) {
        toast.success(`₹${amount} added successfully!`);
        setShowAddMoneyModal(false);
        setAdminUserId('');
        setAdminAmount('');
        setAdminNote('');
        loadTopups();
        loadStats();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add money');
    } finally {
      setProcessing(false);
    }
  };

  const handleDeductMoney = async () => {
    const amount = parseInt(adminAmount);

    if (!adminUserId.trim() || !amount || amount <= 0) {
      toast.error('Please enter valid user ID and amount');
      return;
    }

    try {
      setProcessing(true);
      const response = await adminWalletAPI.deductMoney(
        adminUserId.trim(),
        amount,
        adminNote.trim() || undefined
      );

      if (response.data.success) {
        toast.success(`₹${amount} deducted successfully!`);
        setShowDeductMoneyModal(false);
        setAdminUserId('');
        setAdminAmount('');
        setAdminNote('');
        loadTopups();
        loadStats();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to deduct money');
    } finally {
      setProcessing(false);
    }
  };

  if (loading && topups.length === 0) {
    return (
      <div className="flex justify-center py-12">
        <Loader size="lg" text="Loading wallet data..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Wallet Management</h1>
        <div className="flex gap-2">
          <Button onClick={() => setShowAddMoneyModal(true)} className="bg-green-600 hover:bg-green-700">
            + Add Money
          </Button>
          <Button onClick={() => setShowDeductMoneyModal(true)} variant="danger">
            - Deduct Money
          </Button>
        </div>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardBody>
              <p className="text-sm text-gray-600 mb-1">Total Wallets</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalWallets}</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <p className="text-sm text-gray-600 mb-1">Total Balance</p>
              <p className="text-3xl font-bold text-green-600">{formatCurrency(stats.totalBalance)}</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <p className="text-sm text-gray-600 mb-1">Active Wallets</p>
              <p className="text-3xl font-bold text-purple-600">{stats.walletsWithBalance}</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <p className="text-sm text-gray-600 mb-1">Avg. Balance</p>
              <p className="text-3xl font-bold text-blue-600">{formatCurrency(parseFloat(stats.averageBalance))}</p>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Search User Wallet */}
      <Card>
        <CardBody>
          <h3 className="font-semibold mb-4">Search User Wallet</h3>
          <div className="flex gap-3">
            <Input
              placeholder="Enter User ID"
              value={searchUserId}
              onChange={(e) => setSearchUserId(e.target.value)}
              className="flex-1"
            />
            <Button onClick={loadUserWallet} isLoading={processing}>
              Search
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* All Top-ups */}
      <Card>
        <CardBody>
          <h3 className="font-semibold mb-4">All Wallet Top-ups</h3>

          {topups.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">💰</span>
              </div>
              <p className="text-gray-600">No top-ups yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {topups.map((topup, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {topup.userId}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                        {topup.userEmail}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                          +{formatCurrency(topup.amount)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 font-mono">
                        {topup.razorpayPaymentId?.substring(0, 20)}...
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(topup.timestamp)} • {formatTime(topup.timestamp)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {/* User Wallet Modal */}
      <Modal
        isOpen={showUserWalletModal}
        onClose={() => {
          setShowUserWalletModal(false);
          setUserWallet(null);
        }}
        title="User Wallet Details"
        size="lg"
      >
        {userWallet && (
          <div className="space-y-4">
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-purple-900 mb-1">User ID: {userWallet.userId}</p>
              <p className="text-sm text-purple-900 mb-3">Email: {userWallet.userEmail}</p>
              <p className="text-3xl font-bold text-purple-600">{formatCurrency(userWallet.balance)}</p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Recent Transactions</h4>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {userWallet.transactions?.length === 0 ? (
                  <p className="text-gray-600 text-sm">No transactions</p>
                ) : (
                  userWallet.transactions?.slice(0, 20).map((txn: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{txn.description}</p>
                        <p className="text-xs text-gray-500">
                          {formatDate(txn.timestamp)} • {formatTime(txn.timestamp)}
                        </p>
                      </div>
                      <span
                        className={`font-bold ${
                          txn.type === 'topup' || txn.type === 'admin_credit'
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {txn.type === 'topup' || txn.type === 'admin_credit' ? '+' : '-'}
                        {formatCurrency(txn.amount)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Money Modal */}
      <Modal isOpen={showAddMoneyModal} onClose={() => setShowAddMoneyModal(false)} title="Add Money to User Wallet">
        <div className="space-y-4">
          <Input
            label="User ID"
            value={adminUserId}
            onChange={(e) => setAdminUserId(e.target.value)}
            placeholder="Enter user ID"
          />
          <Input
            type="number"
            label="Amount"
            value={adminAmount}
            onChange={(e) => setAdminAmount(e.target.value)}
            placeholder="Enter amount"
            min={1}
          />
          <Input
            label="Note (Optional)"
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value)}
            placeholder="Reason for adding money"
          />
          <Button fullWidth onClick={handleAddMoney} isLoading={processing}>
            Add ₹{adminAmount || 0} to Wallet
          </Button>
        </div>
      </Modal>

      {/* Deduct Money Modal */}
      <Modal
        isOpen={showDeductMoneyModal}
        onClose={() => setShowDeductMoneyModal(false)}
        title="Deduct Money from User Wallet"
      >
        <div className="space-y-4">
          <Input
            label="User ID"
            value={adminUserId}
            onChange={(e) => setAdminUserId(e.target.value)}
            placeholder="Enter user ID"
          />
          <Input
            type="number"
            label="Amount"
            value={adminAmount}
            onChange={(e) => setAdminAmount(e.target.value)}
            placeholder="Enter amount"
            min={1}
          />
          <Input
            label="Note (Optional)"
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value)}
            placeholder="Reason for deducting money"
          />
          <Button fullWidth onClick={handleDeductMoney} variant="danger" isLoading={processing}>
            Deduct ₹{adminAmount || 0} from Wallet
          </Button>
        </div>
      </Modal>
    </div>
  );
}