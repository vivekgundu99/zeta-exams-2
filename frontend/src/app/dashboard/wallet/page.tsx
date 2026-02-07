// frontend/src/app/dashboard/wallet/page.tsx - USER WALLET PAGE
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import Card, { CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Loader from '@/components/ui/Loader';
import Modal from '@/components/ui/Modal';
import { walletAPI } from '@/lib/api';
import { formatCurrency, formatDate, formatTime } from '@/lib/utils';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function WalletPage() {
  const router = useRouter();
  const [wallet, setWallet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showTopupModal, setShowTopupModal] = useState(false);
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [topupAmount, setTopupAmount] = useState('');
  const [processingTopup, setProcessingTopup] = useState(false);
  const [processingSubscribe, setProcessingSubscribe] = useState(false);

  useEffect(() => {
    loadWallet();
    loadRazorpayScript();
  }, []);

  const loadRazorpayScript = () => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
  };

  const loadWallet = async () => {
    try {
      setLoading(true);
      const response = await walletAPI.getWallet();
      if (response.data.success) {
        setWallet(response.data.wallet);
      }
    } catch (error: any) {
      console.error('Load wallet error:', error);
      toast.error('Failed to load wallet');
    } finally {
      setLoading(false);
    }
  };

  const handleTopup = async () => {
    const amount = parseInt(topupAmount);

    if (!amount || amount < 10 || amount > 5000) {
      toast.error('Amount must be between ₹10 and ₹5000');
      return;
    }

    try {
      setProcessingTopup(true);

      // Create order
      const orderResponse = await walletAPI.createTopupOrder(amount);

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderResponse.data.order.amount,
        currency: orderResponse.data.order.currency,
        name: 'Zeta Exams',
        description: `Wallet Top-up - ₹${amount}`,
        order_id: orderResponse.data.order.id,
        handler: async function (response: any) {
          try {
            const verifyResponse = await walletAPI.verifyTopup({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              amount: amount,
            });

            if (verifyResponse.data.success) {
              toast.success(`₹${amount} added to wallet!`);
              setShowTopupModal(false);
              setTopupAmount('');
              loadWallet();
            }
          } catch (error) {
            toast.error('Payment verification failed');
          }
        },
        theme: {
          color: '#8b5cf6',
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Top-up failed');
    } finally {
      setProcessingTopup(false);
    }
  };

  const handleSubscribe = async (plan: string, duration: string, price: number) => {
    if (wallet.balance < price) {
      toast.error(`Insufficient balance! Need ₹${price - wallet.balance} more.`);
      return;
    }

    try {
      setProcessingSubscribe(true);
      const response = await walletAPI.purchaseSubscription(plan, duration);

      if (response.data.success) {
        toast.success('Subscription activated successfully!');
        setShowSubscribeModal(false);
        loadWallet();
        setTimeout(() => router.push('/dashboard'), 1000);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Subscription purchase failed');
    } finally {
      setProcessingSubscribe(false);
    }
  };

  const plans = [
    {
      name: 'Silver',
      pricing: [
        { duration: '1month', label: '1 Month', sp: 49 },
        { duration: '6months', label: '6 Months', sp: 249 },
        { duration: '1year', label: '1 Year', sp: 399 },
      ],
    },
    {
      name: 'Gold',
      pricing: [
        { duration: '1month', label: '1 Month', sp: 299 },
        { duration: '6months', label: '6 Months', sp: 1299 },
        { duration: '1year', label: '1 Year', sp: 2000 },
      ],
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader size="lg" text="Loading wallet..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">My Wallet</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your wallet and subscriptions</p>
        </div>
      </div>

      {/* Balance Card */}
      <Card className="bg-gradient-to-br from-purple-600 to-indigo-600 text-white">
        <CardBody className="p-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 mb-2">Available Balance</p>
              <h2 className="text-5xl font-bold mb-4">{formatCurrency(wallet?.balance || 0)}</h2>
              <Button
                onClick={() => setShowTopupModal(true)}
                className="bg-white text-purple-600 hover:bg-gray-100"
              >
                + Add Money
              </Button>
            </div>
            <div className="text-6xl opacity-20">💰</div>
          </div>
        </CardBody>
      </Card>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card hover onClick={() => setShowTopupModal(true)} className="cursor-pointer">
          <CardBody className="p-6 text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">💳</span>
            </div>
            <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2">Top-up Wallet</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Add ₹10 - ₹5000 to your wallet</p>
          </CardBody>
        </Card>

        <Card hover onClick={() => setShowSubscribeModal(true)} className="cursor-pointer">
          <CardBody className="p-6 text-center">
            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">⭐</span>
            </div>
            <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2">Buy Subscription</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Use wallet money for subscriptions</p>
          </CardBody>
        </Card>
      </div>

      {/* Transaction History */}
      <Card>
        <CardBody>
          <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4">Transaction History</h3>
          
          {wallet?.transactions?.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">📜</span>
              </div>
              <p className="text-gray-600 dark:text-gray-400">No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {wallet?.transactions?.map((txn: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        txn.type === 'topup' || txn.type === 'admin_credit'
                          ? 'bg-green-100 dark:bg-green-900/30'
                          : 'bg-red-100 dark:bg-red-900/30'
                      }`}
                    >
                      <span className="text-xl">
                        {txn.type === 'topup' || txn.type === 'admin_credit' ? '↓' : '↑'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{txn.description}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(txn.timestamp)} • {formatTime(txn.timestamp)}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`font-bold ${
                      txn.type === 'topup' || txn.type === 'admin_credit'
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {txn.type === 'topup' || txn.type === 'admin_credit' ? '+' : '-'}
                    {formatCurrency(txn.amount)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Top-up Modal */}
      <Modal isOpen={showTopupModal} onClose={() => setShowTopupModal(false)} title="Add Money to Wallet">
        <div className="space-y-4">
          <Input
            type="number"
            label="Amount (₹10 - ₹5000)"
            value={topupAmount}
            onChange={(e) => setTopupAmount(e.target.value)}
            placeholder="Enter amount"
            min={10}
            max={5000}
          />
          <div className="grid grid-cols-3 gap-2">
            {[100, 500, 1000, 2000, 5000].map((amount) => (
              <Button
                key={amount}
                size="sm"
                variant="outline"
                onClick={() => setTopupAmount(amount.toString())}
              >
                ₹{amount}
              </Button>
            ))}
          </div>
          <Button
            fullWidth
            onClick={handleTopup}
            isLoading={processingTopup}
            disabled={!topupAmount || parseInt(topupAmount) < 10 || parseInt(topupAmount) > 5000}
          >
            Add ₹{topupAmount || 0} to Wallet
          </Button>
        </div>
      </Modal>

      {/* Subscribe Modal */}
      <Modal
        isOpen={showSubscribeModal}
        onClose={() => setShowSubscribeModal(false)}
        title="Purchase Subscription"
        size="lg"
      >
        <div className="space-y-6">
          <div className="bg-purple-50 dark:bg-purple-900/30 p-4 rounded-lg">
            <p className="text-sm text-purple-900 dark:text-purple-100">
              💰 Wallet Balance: <span className="font-bold">{formatCurrency(wallet?.balance || 0)}</span>
            </p>
          </div>

          {plans.map((plan) => (
            <div key={plan.name}>
              <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-3">{plan.name} Plan</h4>
              <div className="space-y-2">
                {plan.pricing.map((price) => (
                  <div
                    key={price.duration}
                    className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-purple-400 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{price.label}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{formatCurrency(price.sp)}</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleSubscribe(plan.name.toLowerCase(), price.duration, price.sp)}
                      disabled={wallet.balance < price.sp || processingSubscribe}
                      isLoading={processingSubscribe}
                    >
                      {wallet.balance < price.sp ? 'Insufficient Balance' : 'Buy Now'}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}