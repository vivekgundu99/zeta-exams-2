// frontend/src/app/dashboard/legal/contact/page.tsx
'use client';

import Card, { CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

export default function ContactPage() {
  const router = useRouter();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Contact Us</h1>
        <Button variant="outline" onClick={() => router.back()}>
          ← Back
        </Button>
      </div>

      <Card>
        <CardBody className="p-8">
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-8">
            If you have any questions, concerns, or require support, feel free to reach out to us.
          </p>

          <div className="space-y-6">
            {/* Email Support */}
            <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20">
              <CardBody className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-800 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-purple-600 dark:text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      Email Support
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-3">
                      For general inquiries, support requests, and technical assistance
                    </p>
                    <a 
                      href="mailto:support@zetaexams.in"
                      className="inline-flex items-center gap-2 text-purple-600 dark:text-purple-400 font-semibold hover:underline"
                    >
                      <span className="text-xl">📧</span>
                      support@zetaexams.in
                    </a>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Support Tickets */}
            <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
              <CardBody className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-800 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-blue-600 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      Support Tickets
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-3">
                      Silver and Gold members can create support tickets for personalized assistance
                    </p>
                    <Button 
                      variant="outline"
                      onClick={() => router.push('/dashboard/support')}
                    >
                      Go to Support Tickets →
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Response Time */}
            <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
              <CardBody className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-800 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-green-600 dark:text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      Response Time
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      We typically respond to all queries within <strong>24-48 hours</strong>
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                      During peak times, responses may take slightly longer
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Social Media (Future) */}
            <Card className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20">
              <CardBody className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-orange-100 dark:bg-orange-800 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-orange-600 dark:text-orange-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      More Contact Options Coming Soon
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      We're working on adding more ways to reach us, including:
                    </p>
                    <ul className="mt-3 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                      <li>• Social media channels</li>
                      <li>• Live chat support</li>
                      <li>• Phone support hotline</li>
                    </ul>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Office Address (Optional - Add when available) */}
          <div className="mt-8 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
              📍 Business Address
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              ZetaExams<br />
              Hyderabad, Telangana, India
            </p>
          </div>

          {/* Quick Links */}
          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Quick Links
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <Button 
                variant="outline" 
                onClick={() => router.push('/dashboard/legal/privacy-policy')}
                className="justify-start"
              >
                Privacy Policy →
              </Button>
              <Button 
                variant="outline" 
                onClick={() => router.push('/dashboard/legal/terms-conditions')}
                className="justify-start"
              >
                Terms & Conditions →
              </Button>
              <Button 
                variant="outline" 
                onClick={() => router.push('/dashboard/legal/refund-policy')}
                className="justify-start"
              >
                Refund Policy →
              </Button>
              <Button 
                variant="outline" 
                onClick={() => router.push('/dashboard/support')}
                className="justify-start"
              >
                Support Tickets →
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}