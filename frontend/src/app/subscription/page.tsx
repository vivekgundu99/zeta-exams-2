'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card, { CardBody, CardFooter } from '@/components/ui/Card';
import { subscriptionAPI, paymentAPI, giftCodesAPI } from '@/lib/api';
import { storage, formatCurrency } from '@/lib/utils';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function SubscriptionPage() {
  const router = useRouter();
  const [currentPlan, setCurrentPlan] = useState('free');
  const [loading, setLoading] = useState(false);
  const [giftCode, setGiftCode] = useState('');
  const [validatingCode, setValidatingCode] = useState(false);

  useEffect(() => {
    // 🔥 FORCE LIGHT THEME
    document.documentElement.classList.remove('dark');
    
    loadSubscriptionStatus();
    loadRazorpayScript();
    
    return () => {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      }
    };
  }, []);

  const loadSubscriptionStatus = async () => {
    try {
      const response = await subscriptionAPI.getStatus();
      if (response.data.success) {
        const sub = response.data.subscription;
        setCurrentPlan(sub?.subscription || 'free');
      }
    } catch (error) {
      console.error('Failed to load subscription');
    }
  };

  const loadRazorpayScript = () => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
  };

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      features: [
        { text: '20 Questions per day', available: true },
        { text: 'Chapter Tests', available: false },
        { text: 'Formulas & Flashcards', available: false },
        { text: 'Mock Tests', available: false },
        { text: 'Detailed Analytics', available: false },
      ],
      highlight: false,
      gradient: 'from-gray-400 to-gray-600',
    },
    {
      id: 'silver',
      name: 'Silver',
      subtitle: 'Best for beginners',
      pricing: [
        { duration: '1month', mrp: 100, sp: 49, save: 51 },
        { duration: '6months', mrp: 500, sp: 249, save: 50 },
        { duration: '1year', mrp: 1000, sp: 399, save: 60 },
      ],
      features: [
        { text: '200 Questions per day', available: true },
        { text: '10 Chapter Tests per day', available: true },
        { text: 'Formulas & Flashcards', available: false },
        { text: 'Mock Tests', available: false },
        { text: 'Detailed Analytics', available: false },
      ],
      highlight: false,
      gradient: 'from-gray-500 to-gray-700',
    },
    {
      id: 'gold',
      name: 'Gold (Popular)',
      subtitle: 'Complete preparation package',
      pricing: [
        { duration: '1month', mrp: 600, sp: 299, save: 50 },
        { duration: '6months', mrp: 2500, sp: 1299, save: 48 },
        { duration: '1year', mrp: 5000, sp: 2000, save: 60 },
      ],
      features: [
        { text: '5000 Questions per day (Almost Unlimited)', available: true },
        { text: '50 Chapter Tests per day', available: true },
        { text: 'Unlimited Formulas & Flashcards', available: true },
        { text: '8 Mock Tests per day', available: true },
        { text: 'Advanced Analytics & Reports', available: true },
      ],
      highlight: true,
      gradient: 'from-yellow-500 to-orange-500',
    },
  ];

  const handlePayment = async (plan: string, duration: string, amount: number) => {
    try {
      setLoading(true);

      const orderResponse = await paymentAPI.createOrder({
        plan,
        duration,
      });

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderResponse.data.order.amount,
        currency: orderResponse.data.order.currency,
        name: 'Zeta Exams',
        description: `${plan.toUpperCase()} - ${duration}`,
        order_id: orderResponse.data.order.id,
        handler: async function (response: any) {
          try {
            const verifyResponse = await paymentAPI.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verifyResponse.data.success) {
              toast.success('Payment successful! Subscription activated.');
              router.push('/dashboard');
            }
          } catch (error) {
            toast.error('Payment verification failed');
          }
        },
        prefill: {
          email: storage.get('user')?.email || '',
        },
        theme: {
          color: '#8b5cf6',
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGiftCode = async () => {
    if (!giftCode.trim()) {
      toast.error('Please enter a gift code');
      return;
    }

    try {
      setValidatingCode(true);
      const response = await giftCodesAPI.redeem(giftCode.toUpperCase());

      if (response.data.success) {
        toast.success('Gift code redeemed successfully!');
        
        // 🔥 CRITICAL: Force reload subscription status
        await loadSubscriptionStatus();
        
        // 🔥 CRITICAL: Clear any cached user data
        const { storage } = await import('@/lib/utils');
        storage.remove('user');
        
        setTimeout(() => {
          router.push('/dashboard');
          router.refresh(); // Force page refresh
        }, 500);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Invalid gift code');
    } finally {
      setValidatingCode(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 p-4 py-12">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard')}
            leftIcon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            }
          >
            Back to Dashboard
          </Button>
        </div>

        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gradient mb-3">Choose Your Plan</h1>
          <p className="text-xl text-gray-600">Start your preparation journey with the perfect plan</p>
          <p className="text-xl text-gray-600">Scroll Down for Subscription Plans and Gift code at Bottom</p>
          {currentPlan && currentPlan !== 'free' && (
            <div className="mt-4 inline-block px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full shadow-lg">
              Current: {currentPlan?.toUpperCase()}
            </div>
          )}
        </div>

        <div className="mb-12">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">Compare Plans</h2>
          <Card>
            <CardBody className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left p-4 text-gray-700 font-semibold">Features</th>
                    <th className="text-center p-4 text-gray-700 font-semibold">Free</th>
                    <th className="text-center p-4 text-gray-700 font-semibold">Silver</th>
                    <th className="text-center p-4 text-yellow-700 font-semibold bg-yellow-50">Gold (Popular)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="p-4 font-medium text-gray-900">Questions per day</td>
                    <td className="p-4 text-center">20</td>
                    <td className="p-4 text-center">200</td>
                    <td className="p-4 text-center bg-yellow-50 font-semibold">5000</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="p-4 font-medium text-gray-900">Chapter Tests per day</td>
                    <td className="p-4 text-center"><span className="text-red-500">✗</span></td>
                    <td className="p-4 text-center text-green-600">10 ✓</td>
                    <td className="p-4 text-center bg-yellow-50 text-green-600 font-semibold">50 ✓</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="p-4 font-medium text-gray-900">Formulas & Flashcards</td>
                    <td className="p-4 text-center"><span className="text-red-500">✗</span></td>
                    <td className="p-4 text-center"><span className="text-red-500">✗</span></td>
                    <td className="p-4 text-center bg-yellow-50 text-green-600 font-semibold">✓ Unlimited</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="p-4 font-medium text-gray-900">Mock Tests per day</td>
                    <td className="p-4 text-center"><span className="text-red-500">✗</span></td>
                    <td className="p-4 text-center"><span className="text-red-500">✗</span></td>
                    <td className="p-4 text-center bg-yellow-50 text-green-600 font-semibold">8 ✓</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-medium text-gray-900">Advanced Analytics</td>
                    <td className="p-4 text-center"><span className="text-red-500">✗</span></td>
                    <td className="p-4 text-center"><span className="text-red-500">✗</span></td>
                    <td className="p-4 text-center bg-yellow-50 text-green-600 font-semibold">✓ Full Access</td>
                  </tr>
                </tbody>
              </table>
            </CardBody>
          </Card>
        </div>

        <div className="mb-12">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">Select Your Plan</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className={`relative ${plan.highlight ? 'ring-4 ring-purple-500 scale-105' : ''}`}
                hover={!plan.highlight}
              >
                {plan.highlight && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-1 rounded-full text-sm font-semibold shadow-lg">
                      Most Popular
                    </span>
                  </div>
                )}

                <CardBody className="pt-8">
                  <div className="text-center mb-6">
                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r ${plan.gradient} mb-4`}>
                      <span className="text-2xl text-white font-bold">
                        {plan.name[0]}
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                    {plan.subtitle && (
                      <p className="text-sm text-gray-600 mt-1">{plan.subtitle}</p>
                    )}
                  </div>

                  {plan.id === 'free' ? (
                    <div className="text-center mb-6">
                      <p className="text-4xl font-bold text-gray-900">₹0</p>
                      <p className="text-gray-600">Forever</p>
                    </div>
                  ) : (
                    <div className="space-y-3 mb-6">
                      {plan.pricing?.map((price) => (
                        <div key={price.duration} className="border-2 border-purple-200 rounded-lg p-3 hover:border-purple-400 transition-colors">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-semibold text-gray-900">
                              {price.duration === '1month' && '1 Month'}
                              {price.duration === '6months' && '6 Months'}
                              {price.duration === '1year' && '1 Year'}
                            </span>
                            <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-semibold">
                              Save {price.save}%
                            </span>
                          </div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-purple-600">
                              {formatCurrency(price.sp)}
                            </span>
                            <span className="text-gray-400 line-through text-sm">
                              {formatCurrency(price.mrp)}
                            </span>
                          </div>
                          <Button
                            fullWidth
                            size="sm"
                            className="mt-2"
                            onClick={() => handlePayment(plan.id, price.duration, price.sp)}
                            disabled={loading || currentPlan === plan.id}
                          >
                            {currentPlan === plan.id ? 'Current Plan' : 'Subscribe Now'}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <svg
                          className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                            feature.available
                              ? 'text-green-500'
                              : 'text-red-500'
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          {feature.available ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          )}
                        </svg>
                        <span className="text-sm text-gray-700">{feature.text}</span>
                      </div>
                    ))}
                  </div>
                </CardBody>

                {plan.id === 'free' && (
                  <CardFooter>
                    <Button
                      fullWidth
                      variant={currentPlan === 'free' ? 'secondary' : 'outline'}
                      onClick={() => currentPlan === 'free' && router.push('/dashboard')}
                    >
                      {currentPlan === 'free' ? 'Current Plan' : 'Downgrade'}
                    </Button>
                  </CardFooter>
                )}
              </Card>
            ))}
          </div>
        </div>

        <Card className="max-w-md mx-auto">
          <CardBody>
            <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">
              Have a Gift Code?
            </h3>
            <div className="flex gap-3">
              <Input
                placeholder="Enter gift code"
                value={giftCode}
                onChange={(e) => setGiftCode(e.target.value.toUpperCase())}
                className="flex-1"
              />
              <Button
                onClick={handleGiftCode}
                isLoading={validatingCode}
              >
                Redeem
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}