// frontend/src/app/dashboard/legal/terms-conditions/page.tsx
'use client';

import Card, { CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

export default function TermsConditionsPage() {
  const router = useRouter();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Terms & Conditions</h1>
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
            By accessing or using ZetaExams, you agree to be bound by these Terms & Conditions. 
            If you do not agree, please do not use the platform.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-8 mb-4">
            Eligibility
          </h2>

          <ul className="list-disc list-inside space-y-2 mb-6">
            <li>Users must provide accurate and truthful information</li>
            <li>Accounts are personal and non-transferable</li>
            <li>Sharing login credentials is strictly prohibited</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-8 mb-4">
            Platform Usage
          </h2>

          <p className="mb-4">ZetaExams provides educational content including:</p>

          <ul className="list-disc list-inside space-y-2 mb-6">
            <li>Mock tests</li>
            <li>Question banks</li>
            <li>Exam-related practice material</li>
          </ul>

          <p className="mb-6 font-semibold">All content is for educational purposes only.</p>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-8 mb-4">
            User Discipline & Conduct
          </h2>

          <p className="mb-4">Users agree not to:</p>

          <ul className="list-disc list-inside space-y-2 mb-6">
            <li>Abuse, harass, or threaten other users or admins</li>
            <li>Attempt to hack, exploit, or misuse the platform</li>
            <li>Share accounts or sell access</li>
            <li>Upload or distribute harmful or illegal content</li>
            <li>Attempt academic dishonesty or system manipulation</li>
          </ul>

          <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 p-4 rounded-lg mb-6">
            <p className="text-red-900 dark:text-red-100 font-semibold">
              ⚠️ Violation may result in suspension or permanent termination without notice.
            </p>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-8 mb-4">
            Copyright & Intellectual Property
          </h2>

          <ul className="list-disc list-inside space-y-2 mb-6">
            <li>All content on ZetaExams (questions, text, design, branding) is the intellectual property of ZetaExams</li>
            <li>Copying, reproduction, resale, or redistribution is strictly prohibited</li>
            <li>Unauthorized use may result in legal action</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-8 mb-4">
            Disclaimer (Exam & Affiliation)
          </h2>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-200 dark:border-yellow-800 p-4 rounded-lg mb-6">
            <ul className="list-disc list-inside space-y-2">
              <li>ZetaExams is not affiliated with any government body or examination authority (NTA, CBSE, etc.)</li>
              <li>We do not guarantee exam selection, rank, or results</li>
              <li>Performance depends entirely on the user's preparation</li>
            </ul>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-8 mb-4">
            Limitation of Liability
          </h2>

          <p className="mb-4">ZetaExams shall not be liable for:</p>

          <ul className="list-disc list-inside space-y-2 mb-6">
            <li>Exam outcomes</li>
            <li>Data loss due to unavoidable technical issues</li>
            <li>Temporary service unavailability</li>
          </ul>

          <p className="mb-6 font-semibold">Use of the platform is at the user's own risk.</p>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-8 mb-4">
            Modification of Services
          </h2>

          <p className="mb-4">We reserve the right to:</p>

          <ul className="list-disc list-inside space-y-2 mb-6">
            <li>Modify content</li>
            <li>Update features</li>
            <li>Suspend services temporarily or permanently</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-8 mb-4">
            Governing Law
          </h2>

          <p className="mb-6">
            These Terms are governed by the laws of India. Jurisdiction lies exclusively with Indian courts.
          </p>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg mt-8">
            <p className="text-lg">
              📧 For any questions:{' '}
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