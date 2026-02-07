// frontend/src/app/dashboard/support/page.tsx - UPDATED WITH TICKETS BUTTON
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import Card, { CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
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

  // Ticket System States
  const [showTicketView, setShowTicketView] = useState(false);
  const [tickets, setTickets] = useState<any[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [issue, setIssue] = useState('');
  const [creating, setCreating] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadSubscription();
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
4. Other (Create Support Ticket)`;
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
        // 🔥 UPDATED: No subscription check - all users can access tickets
        addBotMessage('Loading your support tickets...');
        loadTickets();
        setTimeout(() => {
          setShowTicketView(true);
        }, 1000);
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
          '✏️ Change User Details:\n\nYou can change your user details in the Account section.\n\nSteps:\n1. Go to Dashboard\n2. Click "Account" in the sidebar\n3. Click "Edit Details" button\n4. Update your information\n5. Click "Save Changes"\n\nNote: Email and phone cannot be changed.'
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
    const responses: { [key: string]: string } = {
      '21': '📚 Topic wise Questions:\n\nPractice questions organized by topics.\n\nDaily Limits:\n• Free: 20 questions/day\n• Silver: 200 questions/day\n• Gold: 5000 questions/day',
      '22': '📝 Chapter wise Tests:\n\n10-question tests per chapter.\n\nDaily Limits:\n• Free: 0 tests/day\n• Silver: 10 tests/day\n• Gold: 50 tests/day',
      '23': '📖 Formulas:\n\nQuick reference guide.\n\nAvailability:\n• Gold plan only ✅',
      '24': '📋 Tasks:\n\nPersonal task manager.\n\nCreate up to 10 active tasks with due dates.',
      '25': '🎯 Mock Tests:\n\nFull-length practice tests.\n\nAvailability:\n• Gold: 8 tests/day ✅',
      '26': '💰 Wallet:\n\nDigital wallet for subscriptions.\n\nAdd ₹10-₹5000 per transaction.',
      '27': '📊 Analytics:\n\nPerformance tracking.\n\nAvailability:\n• Gold plan only ✅',
      '28': '👤 Account:\n\nManage profile and settings.\n\nChange password, edit details, view subscription.',
    };

    if (responses[input]) {
      addBotMessage(responses[input]);
      setTimeout(() => {
        addBotMessage(getFeaturesMenuMessage());
      }, 2000);
    } else if (input === '29') {
      setCurrentMenu('main');
      addBotMessage(getMainMenuMessage());
    } else {
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
      if (subscription.subscriptionType === 'giftcode') {
        addBotMessage(
          '❌ Refund Not Available\n\nSorry, refunds are not available for gift code subscriptions.'
        );
        setTimeout(() => {
          setCurrentMenu('main');
          addBotMessage(getMainMenuMessage());
        }, 3000);
        return;
      }

      if (subscription.subscription === 'free') {
        addBotMessage(
          '❌ No Active Subscription\n\nYou are on the FREE plan.'
        );
        setTimeout(() => {
          setCurrentMenu('main');
          addBotMessage(getMainMenuMessage());
        }, 3000);
        return;
      }

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
            `✅ Subscription Cancelled & Refund Processed\n\n💰 Refund Amount: ₹${data.refundAmount}\n• Credited to Wallet\n• New Balance: ₹${data.walletBalance}\n\nDowngraded to FREE plan.`
          );
          setTimeout(() => {
            loadSubscription();
          }, 2000);
        } else {
          addBotMessage(
            `❌ Refund Not Eligible\n\n${data.message}\n\nSubscription cancelled but no refund (>50% period used).`
          );
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
      addBotMessage('❌ Failed to process refund. Please try again.');
      setTimeout(() => {
        setCurrentMenu('main');
        addBotMessage(getMainMenuMessage());
      }, 3000);
    }
  };

  // Ticket System Functions
  const getAuthHeaders = () => {
    const token = storage.get('token');
    if (!token) {
      toast.error('Please login again');
      return null;
    }
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  };

  const loadTickets = async () => {
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const response = await fetch(`${API_URL}/api/tickets/my-tickets`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) throw new Error('Failed to load tickets');

      const data = await response.json();
      if (data.success) {
        setTickets(data.tickets || []);
      }
    } catch (error: any) {
      toast.error('Failed to load tickets');
    }
  };

  const createTicket = async () => {
    if (!issue.trim()) {
      toast.error('Please describe your issue');
      return;
    }

    if (issue.length > 150) {
      toast.error('Issue must not exceed 150 characters');
      return;
    }

    try {
      setCreating(true);
      const headers = getAuthHeaders();
      if (!headers) {
        setCreating(false);
        return;
      }

      const response = await fetch(`${API_URL}/api/tickets/create`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ issue: issue.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create ticket');
      }

      if (data.success) {
        toast.success('Ticket created successfully!');
        setShowCreateModal(false);
        setIssue('');
        loadTickets();
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setCreating(false);
    }
  };

  const sendReply = async () => {
    if (!replyMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }

    if (replyMessage.length > 150) {
      toast.error('Message must not exceed 150 characters');
      return;
    }

    try {
      setSending(true);
      const headers = getAuthHeaders();
      if (!headers) {
        setSending(false);
        return;
      }

      const response = await fetch(`${API_URL}/api/tickets/add-message`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ticketNumber: selectedTicket.ticketNumber,
          message: replyMessage.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send message');
      }

      if (data.success) {
        toast.success(`Message sent! ${data.messagesRemaining} messages remaining.`);
        setReplyMessage('');
        setSelectedTicket(data.ticket);
        loadTickets();
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader size="lg" text="Loading support..." />
      </div>
    );
  }

  // Show Ticket View
  if (showTicketView) {
    const activeTickets = tickets.filter((t) => t.status === 'active');
    const closedTickets = tickets.filter((t) => t.status === 'inactive');

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Support Tickets</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Active: {activeTickets.length} | Resolved: {closedTickets.length}
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowTicketView(false)}>
              ← Back to Chat
            </Button>
            <Button onClick={() => setShowCreateModal(true)}>
              + Create Ticket
            </Button>
          </div>
        </div>

        {/* 🔥 UPDATED: Info card for ALL users */}
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800">
          <CardBody className="p-4">
            <div className="flex items-start gap-3">
              <div className="text-2xl">ℹ️</div>
              <div>
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  Support Tickets Information
                </h3>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• All users can create 1 ticket per day</li>
                  <li>• Maximum 10 messages per ticket</li>
                  <li>• Response within 24-48 hours</li>
                  <li>• Limits reset daily at 4 AM IST</li>
                </ul>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Active Tickets */}
        {activeTickets.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Active Tickets</h2>
            <div className="grid gap-4">
              {activeTickets.map((ticket) => (
                <Card key={ticket.ticketNumber} className="border-2 border-orange-200 dark:border-orange-800">
                  <CardBody>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-mono text-lg font-bold text-purple-600 dark:text-purple-400">
                            {ticket.ticketNumber}
                          </span>
                          <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-full text-sm font-semibold">
                            Active
                          </span>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 mb-2">{ticket.issue}</p>
                        <div className="flex gap-2 text-xs">
                          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-gray-700 dark:text-gray-300">
                            {ticket.userMessageCount}/{ticket.maxUserMessages} messages used
                          </span>
                          <span className="text-gray-500 dark:text-gray-400">
                            Created: {new Date(ticket.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedTicket(ticket)}
                    >
                      View Conversation
                    </Button>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Closed Tickets */}
        {closedTickets.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Resolved Tickets</h2>
            <div className="grid gap-4">
              {closedTickets.map((ticket) => (
                <Card key={ticket.ticketNumber}>
                  <CardBody>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-mono text-sm font-bold text-gray-600 dark:text-gray-400">
                            {ticket.ticketNumber}
                          </span>
                          <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm font-semibold">
                            Resolved
                          </span>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 text-sm mb-2">{ticket.issue}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Resolved: {new Date(ticket.resolvedAt || ticket.updatedAt).toLocaleString()}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedTicket(ticket)}
                      >
                        View
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* No Tickets */}
        {tickets.length === 0 && (
          <Card>
            <CardBody className="py-12 text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🎫</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No Tickets</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">You haven't created any support tickets yet</p>
              <Button onClick={() => setShowCreateModal(true)}>Create Your First Ticket</Button>
            </CardBody>
          </Card>
        )}

        {/* Create Ticket Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Create Support Ticket"
        >
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg text-sm text-blue-800 dark:text-blue-200">
              <p className="font-semibold mb-1">Important:</p>
              <ul className="space-y-1">
                <li>• All users can create 1 ticket per day</li>
                <li>• Maximum 10 messages per ticket</li>
                <li>• Response within 24-48 hours</li>
              </ul>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-100 mb-2">
                Describe your issue ({issue.length}/150)
              </label>
              <textarea
                value={issue}
                onChange={(e) => setIssue(e.target.value)}
                maxLength={150}
                rows={4}
                className="w-full px-4 py-2 border-2 rounded-lg focus:border-purple-600 focus:outline-none text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                placeholder="Describe your issue in detail..."
              />
            </div>

            <div className="flex gap-3">
              <Button onClick={createTicket} isLoading={creating} className="flex-1">
                Create Ticket
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowCreateModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </Modal>

        {/* Ticket Detail Modal */}
        <Modal
          isOpen={!!selectedTicket}
          onClose={() => setSelectedTicket(null)}
          title={`Ticket: ${selectedTicket?.ticketNumber}`}
          size="lg"
        >
          {selectedTicket && (
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
                <p className="text-sm text-blue-900 dark:text-blue-100 font-semibold mb-2">Issue:</p>
                <p className="text-blue-800 dark:text-blue-200">{selectedTicket.issue}</p>
              </div>

              {/* Conversation */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                  Conversation ({selectedTicket.userMessageCount}/{selectedTicket.maxUserMessages} messages used):
                </h4>
                {selectedTicket.conversation.map((msg: any, i: number) => (
                  <div
                    key={i}
                    className={`p-3 rounded-lg ${
                      msg.sender === 'user'
                        ? 'bg-gray-100 dark:bg-gray-700 ml-0 mr-8'
                        : 'bg-purple-100 dark:bg-purple-900/30 ml-8 mr-0'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                        {msg.sender === 'user' ? 'You' : 'Support'}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(msg.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-800 dark:text-gray-200">{msg.message}</p>
                  </div>
                ))}
              </div>

              {selectedTicket.status === 'active' && (
                <>
                  {selectedTicket.userMessageCount < selectedTicket.maxUserMessages ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-100 mb-2">
                          Reply ({replyMessage.length}/150)
                          <span className="text-purple-600 dark:text-purple-400 ml-2">
                            {selectedTicket.maxUserMessages - selectedTicket.userMessageCount} messages left
                          </span>
                        </label>
                        <textarea
                          value={replyMessage}
                          onChange={(e) => setReplyMessage(e.target.value)}
                          maxLength={150}
                          rows={3}
                          className="w-full px-4 py-2 border-2 rounded-lg focus:border-purple-600 focus:outline-none text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                          placeholder="Type your reply..."
                        />
                      </div>

                      <Button onClick={sendReply} isLoading={sending} fullWidth>
                        Send Reply
                      </Button>
                    </>
                  ) : (
                    <div className="bg-red-50 dark:bg-red-900/30 p-4 rounded-lg text-center">
                      <p className="text-red-900 dark:text-red-100 font-semibold">
                        Maximum messages reached
                      </p>
                      <p className="text-sm text-red-700 dark:text-red-200 mt-1">
                        You've used all {selectedTicket.maxUserMessages} available messages.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </Modal>
      </div>
    );
  }

  // Show Chatbot View
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 🔥 NEW: Support Tickets Button */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          onClick={() => {
            loadTickets();
            setShowTicketView(true);
          }}
          leftIcon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
          }
        >
          View Support Tickets
        </Button>
      </div>

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