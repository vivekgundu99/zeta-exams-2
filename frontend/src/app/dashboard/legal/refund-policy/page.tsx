// frontend/src/app/dashboard/legal/refund-policy/page.tsx
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

          <div className="bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-200 dark:border-orange-800 p-6 rounded-lg mb-8">
            <h2 className="text-xl font-bold text-orange-900 dark:text-orange-100 mb-4">
              ⚠️ Current Policy: No Refunds
            </h2>
            <p className="text-orange-800 dark:text-orange-200">
              At present, ZetaExams does not offer any refunds or cancellations for purchased courses, 
              subscriptions, or services.
            </p>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-8 mb-4">
            No Refund Policy (Current)
          </h2>

          <ul className="list-disc list-inside space-y-3 mb-6">
            <li className="text-gray-700 dark:text-gray-300">
              <strong>All payments made are final</strong>
            </li>
            <li className="text-gray-700 dark:text-gray-300">
              <strong>No refunds will be issued once access is granted</strong>
            </li>
            <li className="text-gray-700 dark:text-gray-300">
              <strong>Users are advised to review details before purchasing</strong>
            </li>
          </ul>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-6 rounded-lg mb-8">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
              💡 Important Information
            </h3>
            <ul className="space-y-2 text-blue-800 dark:text-blue-200">
              <li>• Please verify all subscription details before payment</li>
              <li>• Check the plan duration and features carefully</li>
              <li>• Ensure you understand the terms before subscribing</li>
              <li>• Contact support if you have any questions before purchasing</li>
            </ul>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-8 mb-4">
            Future Changes
          </h2>

          <p className="mb-6">
            ZetaExams may introduce a refund or cancellation policy in the future.
          </p>

          <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-lg mb-6">
            <p className="text-purple-900 dark:text-purple-100 mb-4">
              <strong>If a refund policy is implemented:</strong>
            </p>
            <ul className="list-disc list-inside space-y-2 text-purple-800 dark:text-purple-200">
              <li>Terms will be clearly updated on this page</li>
              <li>Refund eligibility and timelines will be defined</li>
              <li>All users will be notified of the changes</li>
            </ul>
          </div>

          <p className="mb-8">
            Continued use of the platform implies acceptance of the current policy.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-8 mb-4">
            Payment Support
          </h2>

          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-6 rounded-lg">
            <p className="text-green-900 dark:text-green-100 mb-4">
              <strong>For payment-related queries or issues:</strong>
            </p>
            <ul className="space-y-2 text-green-800 dark:text-green-200">
              <li>• Payment failures or transaction errors</li>
              <li>• Subscription not activated after payment</li>
              <li>• Double charge or incorrect amount deducted</li>
              <li>• Any other billing concerns</li>
            </ul>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg mt-8">
            <p className="text-lg mb-2">
              📧 Contact Us:
            </p>
            <p className="text-xl">
              <a 
                href="mailto:support@zetaexams.in" 
                className="text-purple-600 dark:text-purple-400 font-semibold hover:underline"
              >
                support@zetaexams.in
              </a>
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
              Our support team will respond within 24-48 hours
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}