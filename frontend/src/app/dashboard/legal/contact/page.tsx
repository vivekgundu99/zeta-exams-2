// frontend/src/app/dashboard/legal/contact/page.tsx - UPDATED WITH SUPPORT ASSISTANT PRIORITY
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
            If you have any questions, concerns, or require support, we're here to help you.
          </p>

          <div className="space-y-6">
            {/* 🔥 PRIMARY: Support Assistant - MOST RECOMMENDED */}
            <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-2 border-purple-300 dark:border-purple-700">
              <CardBody className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-800 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">🤖</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100">
                        Support Assistant
                      </h3>
                      <span className="px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded-full">
                        RECOMMENDED
                      </span>
                    </div>
                    <p className="text-purple-800 dark:text-purple-200 mb-3">
                      Get instant help 24/7 with our AI-powered Support Assistant
                    </p>
                    <div className="bg-white dark:bg-purple-900/30 p-3 rounded-lg mb-3">
                      <p className="text-sm font-semibold text-purple-900 dark:text-purple-100 mb-2">
                        Instant help for:
                      </p>
                      <ul className="text-sm space-y-1 text-purple-800 dark:text-purple-200">
                        <li>• Login and password issues</li>
                        <li>• Website features and how to use them</li>
                        <li>• Subscription cancellation and refunds</li>
                        <li>• General questions about the platform</li>
                      </ul>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-purple-700 dark:text-purple-300 mb-3">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span className="font-semibold">Instant Response • Available 24/7</span>
                    </div>
                    <Button 
                      onClick={() => router.push('/dashboard/support')}
                      className="w-full"
                    >
                      Open Support Assistant →
                    </Button>
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
                    <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                      Support Tickets
                    </h3>
                    <p className="text-blue-800 dark:text-blue-200 mb-3">
                      Create a support ticket for detailed, personalized assistance
                    </p>
                    <div className="bg-white dark:bg-blue-900/30 p-3 rounded-lg mb-3">
                      <ul className="text-sm space-y-1 text-blue-800 dark:text-blue-200">
                        <li>• Available for all users (Free, Silver, Gold)</li>
                        <li>• 1 ticket per day, up to 10 messages per ticket</li>
                        <li>• Detailed back-and-forth conversation</li>
                      </ul>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300 mb-3">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Response within 24-48 hours</span>
                    </div>
                    <Button 
                      variant="outline"
                      onClick={() => router.push('/dashboard/support')}
                      className="w-full"
                    >
                      Go to Support Tickets →
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Email Support */}
            <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
              <CardBody className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-800 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-green-600 dark:text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">
                      Email Support
                    </h3>
                    <p className="text-green-800 dark:text-green-200 mb-3">
                      For general inquiries and feedback
                    </p>
                    <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300 mb-3">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Response within 24-48 hours</span>
                    </div>
                    <a 
                      href="mailto:support@zetaexams.in"
                      className="inline-flex items-center gap-2 text-green-600 dark:text-green-400 font-semibold hover:underline"
                    >
                      <span className="text-xl">📧</span>
                      support@zetaexams.in
                    </a>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Response Times Summary */}
            <Card className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20">
              <CardBody className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-orange-100 dark:bg-orange-800 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-orange-600 dark:text-orange-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-orange-900 dark:text-orange-100 mb-2">
                      Response Times
                    </h3>
                    <div className="space-y-2 text-orange-800 dark:text-orange-200">
                      <div className="flex justify-between items-center">
                        <span>Support Assistant:</span>
                        <span className="font-semibold text-green-600 dark:text-green-400">Instant (24/7)</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Support Tickets:</span>
                        <span className="font-semibold">24-48 hours</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Email Support:</span>
                        <span className="font-semibold">24-48 hours</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Tips Section */}
          <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-200 dark:border-blue-800">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
              <span>💡</span>
              Pro Tips for Faster Support
            </h3>
            <ol className="space-y-2 text-blue-800 dark:text-blue-200">
              <li><strong>1. Try Support Assistant first</strong> - Get instant answers to common questions</li>
              <li><strong>2. Create a Support Ticket</strong> - For issues that need detailed help</li>
              <li><strong>3. Email us</strong> - For general inquiries or feedback</li>
            </ol>
          </div>

          {/* Office Address */}
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
                Support Assistant →
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}