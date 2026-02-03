// frontend/src/app/dashboard/legal/privacy-policy/page.tsx
'use client';

import Card, { CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

export default function PrivacyPolicyPage() {
  const router = useRouter();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Privacy Policy</h1>
        <Button variant="outline" onClick={() => router.back()}>
          ← Back
        </Button>
      </div>

      <Card>
        <CardBody className="p-8 prose dark:prose-invert max-w-none">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Last updated: February 2026
          </p>

          <p className="mb-6">
            ZetaExams ("we", "our", "us") respects your privacy and is committed to protecting the personal 
            information of users ("you", "user") who access and use the website{' '}
            <a href="https://zetaexams.in" className="text-purple-600 dark:text-purple-400">
              https://zetaexams.in
            </a>.
          </p>

          <p className="mb-6">
            This Privacy Policy explains how we collect, use, store, and protect user data.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-8 mb-4">
            Information We Collect
          </h2>

          <p className="mb-4">We collect only basic user information necessary to operate the platform:</p>

          <div className="space-y-4 mb-6">
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
              <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">Email address</h3>
              <p className="text-sm text-purple-800 dark:text-purple-200">
                Used for login, authentication, and OTP verification
              </p>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
              <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">Phone number</h3>
              <p className="text-sm text-purple-800 dark:text-purple-200">
                Used for security, verification, and account protection
              </p>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
              <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">Basic user data</h3>
              <p className="text-sm text-purple-800 dark:text-purple-200">
                Such as account activity, exam progress, and usage data
              </p>
            </div>
          </div>

          <p className="mb-6">
            We do not collect sensitive personal data beyond what is required for platform functionality.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-8 mb-4">
            Purpose of Data Collection
          </h2>

          <p className="mb-4">User data is collected only for:</p>

          <ul className="list-disc list-inside space-y-2 mb-6">
            <li>Account creation and login</li>
            <li>Security and authentication (OTP verification)</li>
            <li>Improving user experience</li>
            <li>Communicating important platform-related information</li>
          </ul>

          <p className="mb-6 font-semibold">We do not sell, rent, or misuse user data.</p>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-8 mb-4">
            Data Protection & Security
          </h2>

          <ul className="list-disc list-inside space-y-2 mb-6">
            <li>All user data is securely stored in our database</li>
            <li>Data is protected using 32-bit encryption and standard security practices</li>
            <li>Access to user data is strictly limited to the platform admin</li>
            <li>Admin access is used only for support, security, and communication purposes</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-8 mb-4">
            Data Sharing
          </h2>

          <p className="mb-4">We do not share user data with third parties except:</p>

          <ul className="list-disc list-inside space-y-2 mb-6">
            <li>When required by law</li>
            <li>When necessary to protect platform security or legal rights</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-8 mb-4">
            User Rights
          </h2>

          <p className="mb-4">Users may:</p>

          <ul className="list-disc list-inside space-y-2 mb-6">
            <li>Request account deletion</li>
            <li>Request correction of personal data</li>
            <li>Contact us regarding privacy concerns</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-8 mb-4">
            Changes to This Policy
          </h2>

          <p className="mb-6">
            We may update this Privacy Policy from time to time. Continued use of the platform indicates 
            acceptance of updated policies.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-8 mb-4">
            Contact for Privacy Concerns
          </h2>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg">
            <p className="text-lg">
              📧 Email:{' '}
              <a 
                href="mailto:support@zetaexams.in" 
                className="text-purple-600 dark:text-purple-400 font-semibold"
              >
                support@zetaexams.in
              </a>
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}