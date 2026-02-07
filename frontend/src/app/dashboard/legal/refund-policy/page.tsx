// frontend/src/app/dashboard/legal/refund-policy/page.tsx - UPDATED WITH WALLET REFUND
'use client';

import Card, { CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

export default function RefundPolicyPage() {
  const router = useRouter();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Refund & Cancellation Policy</h1>
        <Button variant="outline" onClick={() => router.back()}>
          ← Back
        </Button>
      </div>

      <Card>
        <CardBody className="p-8 prose dark:prose-invert max-w-none">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Last updated: February 2026
          </p>

          {/* 🔥 NEW: We Now Offer Refunds Section */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-800 p-6 rounded-lg mb-8">
            <h2 className="text-2xl font-bold text-green-900 dark:text-green-100 mb-4 flex items-center gap-2">
              ✅ We Now Offer Refunds!
            </h2>
            <p className="text-green-800 dark:text-green-200 text-lg mb-4">
              ZetaExams now provides refunds for eligible subscription cancellations.
            </p>
            <div className="bg-white dark:bg-green-900/30 p-4 rounded-lg">
              <h3 className="font-semibold text-green-900 dark:text-green-100 mb-3">Refund Eligibility:</h3>
              <ul className="space-y-2 text-green-800 dark:text-green-200">
                <li>✓ Subscription used for less than 50% of its duration</li>
                <li>✓ Original payment subscription (not gift code)</li>
                <li>✓ 50% of subscription amount credited to wallet</li>
                <li>✓ Wallet money can only be used for platform subscriptions</li>
              </ul>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-8 mb-4">
            Refund Policy Details
          </h2>

          {/* Eligibility Section */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-6 rounded-lg mb-6">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
              📋 Refund Eligibility
            </h3>
            <p className="text-blue-800 dark:text-blue-200 mb-4">
              You are eligible for a refund if:
            </p>
            <ul className="list-disc list-inside space-y-2 text-blue-800 dark:text-blue-200">
              <li>You have used less than 50% of your subscription duration</li>
              <li>Your subscription was purchased with actual payment (not a gift code)</li>
              <li>You request the refund through our Support Assistant</li>
            </ul>
          </div>

          {/* Refund Amount */}
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 p-6 rounded-lg mb-6">
            <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100 mb-3">
              💰 Refund Amount
            </h3>
            <p className="text-purple-800 dark:text-purple-200 mb-4">
              <strong>50% of your subscription price</strong> will be credited to your wallet if eligible.
            </p>
            <div className="bg-white dark:bg-purple-900/30 p-4 rounded-lg">
              <p className="text-sm text-purple-900 dark:text-purple-100 font-semibold mb-2">Important Notes:</p>
              <ul className="text-sm space-y-1 text-purple-800 dark:text-purple-200">
                <li>• Refund is credited to your ZetaExams wallet</li>
                <li>• Wallet money can ONLY be used for platform subscriptions</li>
                <li>• Wallet money CANNOT be withdrawn to bank account</li>
                <li>• Your subscription will be immediately downgraded to FREE</li>
              </ul>
            </div>
          </div>

          {/* Examples */}
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Examples
          </h3>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            {/* Eligible Example */}
            <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">✅</span>
                <h4 className="font-semibold text-green-900 dark:text-green-100">Eligible for Refund</h4>
              </div>
              <ul className="space-y-2 text-sm text-green-800 dark:text-green-200">
                <li>• Subscription: Gold 6-Month</li>
                <li>• Price Paid: ₹1299</li>
                <li>• Duration Used: 2 months (33%)</li>
                <li>• <strong>Refund: ₹649.50 to wallet</strong></li>
                <li>• New Plan: FREE</li>
              </ul>
            </div>

            {/* Not Eligible Example */}
            <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">❌</span>
                <h4 className="font-semibold text-red-900 dark:text-red-100">Not Eligible</h4>
              </div>
              <ul className="space-y-2 text-sm text-red-800 dark:text-red-200">
                <li>• Subscription: Silver 1-Year</li>
                <li>• Price Paid: ₹399</li>
                <li>• Duration Used: 8 months (67%)</li>
                <li>• <strong>Refund: Not eligible (>50% used)</strong></li>
                <li>• New Plan: Continues until expiry</li>
              </ul>
            </div>
          </div>

          {/* How to Request */}
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            How to Request a Refund
          </h3>

          <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg mb-6">
            <ol className="space-y-3">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">Go to Support Page</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Navigate to Dashboard → Support</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">Use Support Assistant</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Type option "3" for subscription cancellation and refund</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">Confirm Cancellation</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Type "31" to proceed with refund request</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">4</span>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">Instant Processing</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">System automatically checks eligibility and processes refund</p>
                </div>
              </li>
            </ol>
          </div>

          {/* Gift Code Subscriptions */}
          <div className="bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-200 dark:border-orange-800 p-6 rounded-lg mb-6">
            <h3 className="text-lg font-semibold text-orange-900 dark:text-orange-100 mb-3">
              🎁 Gift Code Subscriptions
            </h3>
            <p className="text-orange-800 dark:text-orange-200">
              Subscriptions activated using gift codes are <strong>NOT eligible for refunds</strong>. 
              Gift code subscriptions will remain active until their expiration date.
            </p>
          </div>

          {/* Wallet Usage */}
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Using Your Wallet Money
          </h3>

          <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 p-6 rounded-lg mb-6">
            <p className="text-indigo-900 dark:text-indigo-100 mb-4">
              After receiving a refund to your wallet, you can:
            </p>
            <ul className="list-disc list-inside space-y-2 text-indigo-800 dark:text-indigo-200">
              <li>Purchase any subscription plan (Silver or Gold)</li>
              <li>Choose any duration (1 month, 6 months, or 1 year)</li>
              <li>Combine wallet money with additional payment if needed</li>
            </ul>
            <p className="mt-4 text-sm font-semibold text-indigo-900 dark:text-indigo-100">
              ⚠️ Wallet money cannot be withdrawn to your bank account
            </p>
          </div>

          {/* Contact Section */}
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Need Help?
          </h3>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg">
            <p className="text-lg mb-4 text-blue-900 dark:text-blue-100">
              <strong>Use our Support Assistant for fastest help!</strong>
            </p>
            <p className="text-blue-800 dark:text-blue-200 mb-4">
              For any questions about refunds or cancellations:
            </p>
            <div className="flex flex-col gap-3">
              <Button 
                onClick={() => router.push('/dashboard/support')}
                className="justify-center"
              >
                Go to Support Assistant →
              </Button>
              <p className="text-sm text-center text-blue-700 dark:text-blue-300">
                or email us at{' '}
                <a 
                  href="mailto:support@zetaexams.in" 
                  className="text-purple-600 dark:text-purple-400 font-semibold hover:underline"
                >
                  support@zetaexams.in
                </a>
              </p>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}