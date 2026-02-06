// frontend/src/app/dashboard/support/page.tsx - CHATBOT STYLE SUPPORT
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import Card, { CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Loader from '@/components/ui/Loader';
import { userAPI } from '@/lib/api';
import { storage } from '@/lib/utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://zeta-exams-backend-2.vercel.app';

interface Message {
  type: 'bot' | 'user';
  text: string;
  timestamp: Date;
}

export default function SupportPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMenu, setCurrentMenu] = useState('main');
  const [userInput, setUserInput] = useState('');
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadSubscription();
    // Show initial message
    addBotMessage(getMainMenuMessage());
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadSubscription = async () => {
    try {
      const response = await userAPI.getProfile();
      if (response.data.success) {
        setSubscription(response.data.subscription);
      }
    } catch (error) {
      console.error('Failed to load subscription');
    } finally {
      setLoading(false);
    }
  };

  const addBotMessage = (text: string) => {
    setMessages((prev) => [
      ...prev,
      { type: 'bot', text, timestamp: new Date() },
    ]);
  };

  const addUserMessage = (text: string) => {
    setMessages((prev) => [
      ...prev,
      { type: 'user', text, timestamp: new Date() },
    ]);
  };

  const getMainMenuMessage = () => {
    return `How can I help you? Type the number below:

1. I have problem with login
2. I have problem with website features
3. I want to cancel my subscription and want refund
4. Other`;
  };

  const getLoginMenuMessage = () => {
    return `How can I help you in login? Type the number below:

11. I have forgot my password
12. I want to change password
13. I want to change user details
14. Back`;
  };

  const getFeaturesMenuMessage = () => {
    return `How can I help you in website features? Type the number below:

21. What is Topic wise Questions?
22. What is Chapter wise Tests?
23. What is Formulas?
24. What is Tasks?
25. What is Mock tests?
26. What is Wallet?
27. What is Analytics?
28. What is Account?
29. Back`;
  };

  const getRefundMenuMessage = () => {
    return `How can I help you in refund? Type the number below:

31. Do you really want to cancel your subscription?
32. Back`;
  };

  const handleSend = async () => {
    if (!userInput.trim()) return;

    const input = userInput.trim();
    addUserMessage(input);
    setUserInput('');

    // Process based on current menu
    if (currentMenu === 'main') {
      handleMainMenu(input);
    } else if (currentMenu === 'login') {
      handleLoginMenu(input);
    } else if (currentMenu === 'features') {
      handleFeaturesMenu(input);
    } else if (currentMenu === 'refund') {
      await handleRefundMenu(input);
    }
  };

  const handleMainMenu = (input: string) => {
    switch (input) {
      case '1':
        setCurrentMenu('login');
        addBotMessage(getLoginMenuMessage());
        break;
      case '2':
        setCurrentMenu('features');
        addBotMessage(getFeaturesMenuMessage());
        break;
      case '3':
        setCurrentMenu('refund');
        addBotMessage(getRefundMenuMessage());
        break;
      case '4':
        addBotMessage(
          'Please create a support ticket to chat with our team. You will be redirected to the ticket creation page.'
        );
        setTimeout(() => {
          router.push('/dashboard/tickets');
        }, 2000);
        break;
      default:
        addBotMessage('Invalid option. Please select a valid number.');
        setTimeout(() => {
          addBotMessage(getMainMenuMessage());
        }, 1000);
    }
  };

  const handleLoginMenu = (input: string) => {
    switch (input) {
      case '11':
        addBotMessage(
          '🔐 Forgot Password:\n\nYou can select "Forgot Password" and reset your password on the login page.\n\nSteps:\n1. Go to login page\n2. Click "Forgot Password"\n3. Enter your email\n4. Enter OTP sent to your email\n5. Set new password'
        );
        setTimeout(() => {
          addBotMessage(getLoginMenuMessage());
        }, 2000);
        break;
      case '12':
        addBotMessage(
          '🔑 Change Password:\n\nYou can reset your password in the Account section.\n\nSteps:\n1. Go to Dashboard\n2. Click "Account" in the sidebar\n3. Scroll to "Change Password" section\n4. Enter current password\n5. Enter new password\n6. Confirm new password\n7. Click "Update Password"'
        );
        setTimeout(() => {
          addBotMessage(getLoginMenuMessage());
        }, 2000);
        break;
      case '13':
        addBotMessage(
          '✏️ Change User Details:\n\nYou can change your user details in the Account section.\n\nSteps:\n1. Go to Dashboard\n2. Click "Account" in the sidebar\n3. Click "Edit Details" button\n4. Update your information (name, profession, grade, college, etc.)\n5. Click "Save Changes"\n\nNote: You cannot change your email or phone number after registration.'
        );
        setTimeout(() => {
          addBotMessage(getLoginMenuMessage());
        }, 2000);
        break;
      case '14':
        setCurrentMenu('main');
        addBotMessage(getMainMenuMessage());
        break;
      default:
        addBotMessage('Invalid option. Please select a valid number.');
        setTimeout(() => {
          addBotMessage(getLoginMenuMessage());
        }, 1000);
    }
  };

  const handleFeaturesMenu = (input: string) => {
    switch (input) {
      case '21':
        addBotMessage(
          '📚 Topic wise Questions:\n\nThis feature allows you to practice questions organized by topics.\n\nHow it works:\n• Select your exam (JEE/NEET)\n• Choose a subject (Physics, Chemistry, Mathematics/Biology)\n• Select a chapter\n• Pick a specific topic\n• Practice questions one by one\n• Get instant feedback with explanations\n• Track your progress\n\nBenefits:\n• Focus on weak topics\n• Build strong fundamentals\n• Topic-by-topic mastery\n• Detailed explanations with images and LaTeX formulas\n\nDaily Limits:\n• Free: 20 questions/day\n• Silver: 200 questions/day\n• Gold: 5000 questions/day'
        );
        setTimeout(() => {
          addBotMessage(getFeaturesMenuMessage());
        }, 2000);
        break;
      case '22':
        addBotMessage(
          '📝 Chapter wise Tests:\n\nTake 10-question tests to evaluate your chapter understanding.\n\nFeatures:\n• 10 random questions per chapter\n• Mix of MCQs and Numerical questions\n• Timed practice\n• Instant results and analysis\n• Detailed solutions\n• Filter by favorites (Gold only)\n\nHow to take a test:\n1. Go to "Chapter Tests"\n2. Select subject and chapter\n3. Click "Generate Test"\n4. Answer all 10 questions\n5. Submit to see results\n\nDaily Limits:\n• Free: 0 tests/day (upgrade required)\n• Silver: 10 tests/day\n• Gold: 50 tests/day\n\nNote: You can also select "All Chapters" option to get mixed questions from all chapters in a subject.'
        );
        setTimeout(() => {
          addBotMessage(getFeaturesMenuMessage());
        }, 2000);
        break;
      case '23':
        addBotMessage(
          '📖 Formulas:\n\nQuick reference guide for important formulas and concepts.\n\nFeatures:\n• Subject-wise formula sheets\n• Chapter-wise organization\n• High-quality PDF formulas\n• Download and save offline\n• LaTeX-formatted equations\n• Concept summaries\n\nAvailability:\n• Free: Not available ❌\n• Silver: Not available ❌\n• Gold: Full access ✅\n\nHow to access:\n1. Go to "Formulas" (Gold plan required)\n2. Select your exam type\n3. Choose subject and chapter\n4. View or download formula PDFs\n\nPerfect for:\n• Quick revision before exams\n• Last-minute preparation\n• Formula memorization\n• Concept clarity'
        );
        setTimeout(() => {
          addBotMessage(getFeaturesMenuMessage());
        }, 2000);
        break;
      case '24':
        addBotMessage(
          '📋 Tasks:\n\nPersonal task manager to organize your study schedule.\n\nFeatures:\n• Create up to 10 active tasks\n• Set due dates and priorities\n• Mark tasks as complete\n• View completed task history (up to 6000 tasks)\n• Get notifications for overdue tasks\n• Track daily progress\n\nHow to use:\n1. Go to "Tasks" in sidebar\n2. Click "Add Task" button\n3. Enter task title (max 50 characters)\n4. Optionally set due date\n5. Click "Create"\n6. Mark as complete when done\n\nTask Management:\n• Edit task title or due date\n• Delete unwanted tasks\n• Complete tasks to move to history\n• View statistics (active, completed, overdue)\n\nPerfect for:\n• Daily study planning\n• Exam preparation scheduling\n• Chapter completion tracking\n• Assignment deadlines\n• Revision reminders'
        );
        setTimeout(() => {
          addBotMessage(getFeaturesMenuMessage());
        }, 2000);
        break;
      case '25':
        addBotMessage(
          '🎯 Mock Tests:\n\nFull-length practice tests simulating actual JEE/NEET exams.\n\nTest Structure:\n• JEE: 90 questions (30 Physics + 30 Chemistry + 30 Maths)\n• NEET: 180 questions (45 Physics + 45 Chemistry + 90 Biology)\n• Duration: 3 hours (180 minutes)\n• Mix of MCQs and Numerical questions\n\nFeatures:\n• Real exam interface\n• Timer countdown\n• Question navigation\n• Flag for review\n• Submit answers section-wise\n• Detailed performance analysis\n• Question-wise solutions\n• Time analysis per question\n\nDaily Limits:\n• Free: 0 tests/day (upgrade required)\n• Silver: 0 tests/day (upgrade required)\n• Gold: 8 tests/day ✅\n\nHow to attempt:\n1. Go to "Mock Tests"\n2. Select a test\n3. Click "Start Test"\n4. Answer questions\n5. Submit test\n6. View detailed results\n\nResults include:\n• Score and rank prediction\n• Subject-wise analysis\n• Time management insights\n• Accuracy percentage\n• Correct/incorrect/unattempted breakdown'
        );
        setTimeout(() => {
          addBotMessage(getFeaturesMenuMessage());
        }, 2000);
        break;
      case '26':
        addBotMessage(
          '💰 Wallet:\n\nDigital wallet for managing your Zeta Exams account balance.\n\nFeatures:\n• Add money (₹50 - ₹5000 per transaction)\n• Use wallet balance to buy subscriptions\n• View transaction history\n• Secure Razorpay payment integration\n• Admin credit/debit support\n\nHow to add money:\n1. Go to "Wallet"\n2. Click "Add Money"\n3. Enter amount (₹50 - ₹5000)\n4. Complete Razorpay payment\n5. Balance updated instantly\n\nHow to buy subscription:\n1. Go to "Wallet"\n2. Click "Buy Subscription"\n3. Select plan and duration\n4. Confirm purchase\n5. Money deducted from wallet\n6. Subscription activated immediately\n\nTransaction Types:\n• Top-up: Money added via Razorpay\n• Debit: Money used for subscription\n• Admin Credit: Manual addition by admin\n• Admin Debit: Manual deduction by admin\n\nBenefits:\n• No repeated card details entry\n• Quick subscription renewals\n• Track all transactions\n• Refunds credited to wallet (50% on eligible cancellations)'
        );
        setTimeout(() => {
          addBotMessage(getFeaturesMenuMessage());
        }, 2000);
        break;
      case '27':
        addBotMessage(
          '📊 Analytics:\n\nAdvanced performance tracking and insights (Gold plan exclusive).\n\nFeatures:\n• Overall performance dashboard\n• Subject-wise statistics\n• Chapter-wise accuracy tracking\n• Strong and weak topic identification\n• Progress over time graphs\n• Question attempt history\n• Accuracy trends\n\nMetrics Tracked:\n• Total questions attempted\n• Correct answers count\n• Overall accuracy percentage\n• Chapter tests completed\n• Mock tests attempted\n• Subject-wise performance\n• Top performing chapters\n• Chapters needing improvement\n\nAvailability:\n• Free: Not available ❌\n• Silver: Not available ❌\n• Gold: Full access ✅\n\nHow to use:\n1. Go to "Analytics" (Gold plan required)\n2. View overall dashboard\n3. Click on subjects for detailed stats\n4. Identify weak chapters\n5. Focus practice on weak areas\n\nInsights provided:\n• Which chapters need more practice\n• Your strongest subjects\n• Accuracy trends over time\n• Recommended focus areas\n• Performance comparison across topics'
        );
        setTimeout(() => {
          addBotMessage(getFeaturesMenuMessage());
        }, 2000);
        break;
      case '28':
        addBotMessage(
          '👤 Account:\n\nManage your profile and account settings.\n\nProfile Information:\n• Name and email (view only)\n• Phone number (view only)\n• Profession (Student/Teacher)\n• Grade/Class\n• College name\n• State\n• Life ambition\n• Exam preference (JEE/NEET)\n\nAccount Settings:\n• View subscription details\n• Check plan and validity\n• Change password\n• Edit user details\n• Update profile information\n\nSubscription Details:\n• Current plan (Free/Silver/Gold)\n• Subscription type (Original/Gift Code)\n• Start and end dates\n• Days remaining\n• Auto-renewal status\n\nHow to edit details:\n1. Go to "Account"\n2. Click "Edit Details" button\n3. Update information\n4. Click "Save Changes"\n\nHow to change password:\n1. Go to "Account"\n2. Scroll to "Change Password"\n3. Enter current password\n4. Enter new password\n5. Confirm new password\n6. Click "Update Password"\n\nNote: Email and phone number cannot be changed after registration for security reasons.'
        );
        setTimeout(() => {
          addBotMessage(getFeaturesMenuMessage());
        }, 2000);
        break;
      case '29':
        setCurrentMenu('main');
        addBotMessage(getMainMenuMessage());
        break;
      default:
        addBotMessage('Invalid option. Please select a valid number.');
        setTimeout(() => {
          addBotMessage(getFeaturesMenuMessage());
        }, 1000);
    }
  };

  const handleRefundMenu = async (input: string) => {
    switch (input) {
      case '31':
        await processRefund();
        break;
      case '32':
        setCurrentMenu('main');
        addBotMessage(getMainMenuMessage());
        break;
      default:
        addBotMessage('Invalid option. Please select a valid number.');
        setTimeout(() => {
          addBotMessage(getRefundMenuMessage());
        }, 1000);
    }
  };

  const processRefund = async () => {
    try {
      // Check subscription type
      if (subscription.subscriptionType === 'giftcode') {
        addBotMessage(
          '❌ Refund Not Available\n\nSorry, refunds are not available for gift code subscriptions.\n\nGift code subscriptions cannot be refunded as they were obtained through promotional codes.'
        );
        setTimeout(() => {
          setCurrentMenu('main');
          addBotMessage(getMainMenuMessage());
        }, 3000);
        return;
      }

      if (subscription.subscription === 'free') {
        addBotMessage(
          '❌ No Active Subscription\n\nYou are currently on the FREE plan. There is nothing to cancel or refund.'
        );
        setTimeout(() => {
          setCurrentMenu('main');
          addBotMessage(getMainMenuMessage());
        }, 3000);
        return;
      }

      // Process refund
      addBotMessage('Processing your refund request...');

      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${storage.get('token')}`,
      };

      const response = await fetch(`${API_URL}/api/subscription/cancel-refund`, {
        method: 'POST',
        headers,
      });

      const data = await response.json();

      if (data.success) {
        if (data.refunded) {
          addBotMessage(
            `✅ Subscription Cancelled & Refund Processed\n\nYour subscription has been cancelled successfully.\n\n💰 Refund Details:\n• Refund Amount: ₹${data.refundAmount}\n• Credited to: Wallet\n• New Balance: ₹${data.walletBalance}\n\nYour account has been downgraded to FREE plan.\n\nThank you for using Zeta Exams! 🙏`
          );

          // Reload subscription data
          setTimeout(() => {
            loadSubscription();
          }, 2000);
        } else {
          addBotMessage(
            `❌ Refund Not Eligible\n\n${data.message}\n\nYour subscription has been cancelled and downgraded to FREE plan, but no refund is applicable as more than 50% of the subscription period has elapsed.`
          );

          // Reload subscription data
          setTimeout(() => {
            loadSubscription();
          }, 2000);
        }

        setTimeout(() => {
          setCurrentMenu('main');
          addBotMessage(getMainMenuMessage());
        }, 5000);
      } else {
        addBotMessage(`❌ Error: ${data.message}`);
        setTimeout(() => {
          setCurrentMenu('main');
          addBotMessage(getMainMenuMessage());
        }, 3000);
      }
    } catch (error: any) {
      console.error('Refund error:', error);
      addBotMessage(
        '❌ Failed to process refund. Please try again or contact support.'
      );
      setTimeout(() => {
        setCurrentMenu('main');
        addBotMessage(getMainMenuMessage());
      }, 3000);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader size="lg" text="Loading support..." />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardBody className="p-0">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <span className="text-2xl">🤖</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold">Support Assistant</h1>
                <p className="text-purple-100">
                  How can I help you today?
                </p>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div className="h-[500px] overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`mb-4 flex ${
                  message.type === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-4 ${
                    message.type === 'user'
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white'
                      : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <p
                    className={`whitespace-pre-line ${
                      message.type === 'user'
                        ? 'text-white'
                        : 'text-gray-900 dark:text-gray-100'
                    }`}
                  >
                    {message.text}
                  </p>
                  <p
                    className={`text-xs mt-2 ${
                      message.type === 'user'
                        ? 'text-purple-100'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
            <div className="flex gap-3">
              <Input
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type your option number..."
                className="flex-1"
              />
              <Button onClick={handleSend} disabled={!userInput.trim()}>
                Send
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}