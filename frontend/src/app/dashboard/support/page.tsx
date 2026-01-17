'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import Card, { CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Loader from '@/components/ui/Loader';
import { storage } from '@/lib/utils';
import { userAPI } from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://zeta-exams-backend-2.vercel.app';

export default function TicketsPage() {
  const router = useRouter();
  const [subscription, setSubscription] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [issue, setIssue] = useState('');
  const [creating, setCreating] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    checkSubscriptionAndLoad();
  }, []);

  const checkSubscriptionAndLoad = async () => {
    try {
      const response = await userAPI.getProfile();
      if (response.data.success) {
        setSubscription(response.data.subscription);
        
        // Only load tickets if user has Silver or Gold
        if (response.data.subscription.subscription !== 'free') {
          loadTickets();
        } else {
          setLoading(false);
        }
      }
    } catch (error) {
      console.error('Failed to load subscription');
      setLoading(false);
    }
  };

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
      setLoading(true);
      const headers = getAuthHeaders();
      if (!headers) {
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_URL}/api/tickets/my-tickets`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error('Failed to load tickets');
      }

      const data = await response.json();
      if (data.success) {
        setTickets(data.tickets || []);
      }
    } catch (error: any) {
      console.error('Load tickets error:', error);
      toast.error(error.message || 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const createTicket = async () => {
    if (!issue.trim()) {
      toast.error('Please describe your issue');
      return;
    }

    if (issue.length > 150) {
      toast.error('Issue description must not exceed 150 characters');
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
        if (data.upgradeRequired) {
          toast.error(data.message);
          setTimeout(() => router.push('/subscription'), 2000);
          return;
        }
        throw new Error(data.message || 'Failed to create ticket');
      }

      if (data.success) {
        toast.success('Ticket created successfully!');
        setShowCreateModal(false);
        setIssue('');
        loadTickets();
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to create ticket');
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
        if (data.maxReached) {
          toast.error(data.message);
          setSelectedTicket({ ...selectedTicket, maxReached: true });
          return;
        }
        throw new Error(data.message || 'Failed to send message');
      }

      if (data.success) {
        toast.success(`Message sent! ${data.messagesRemaining} messages remaining.`);
        setReplyMessage('');
        setSelectedTicket(data.ticket);
        loadTickets();
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  // Check if user is Free tier
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader size="lg" text="Loading..." />
      </div>
    );
  }

  if (subscription?.subscription === 'free') {
    return (
      <Card className="border-2 border-purple-200">
        <CardBody className="p-12 text-center">
          <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">🎫</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Upgrade to Access Support
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Support tickets are available for Silver and Gold subscribers
          </p>
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <p className="text-sm text-blue-900 font-semibold mb-2">With Support Access:</p>
            <ul className="text-sm text-blue-800 space-y-1 text-left max-w-md mx-auto">
              <li>• Create 1 support ticket per day</li>
              <li>• Get help from our support team</li>
              <li>• Up to 10 messages per ticket</li>
              <li>• Fast response times</li>
            </ul>
          </div>
          <Button size="lg" onClick={() => router.push('/subscription')}>
            Upgrade Now
          </Button>
        </CardBody>
      </Card>
    );
  }

  const activeTickets = tickets.filter((t) => t.status === 'active');
  const closedTickets = tickets.filter((t) => t.status === 'inactive');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
          <p className="text-gray-600">
            Active: {activeTickets.length} | Resolved: {closedTickets.length}
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          + Create Ticket
        </Button>
      </div>

      {/* Active Tickets */}
      {activeTickets.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Active Tickets</h2>
          <div className="grid gap-4">
            {activeTickets.map((ticket) => (
              <Card key={ticket.ticketNumber} className="border-2 border-orange-200">
                <CardBody>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-mono text-lg font-bold text-purple-600">
                          {ticket.ticketNumber}
                        </span>
                        <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold">
                          Active
                        </span>
                      </div>
                      <p className="text-gray-700 mb-2">{ticket.issue}</p>
                      <div className="flex gap-2 text-xs">
                        <span className="px-2 py-1 bg-gray-100 rounded">
                          {ticket.userMessageCount}/{ticket.maxUserMessages} messages used
                        </span>
                        <span className="text-gray-500">
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
          <h2 className="text-xl font-bold text-gray-900 mb-4">Resolved Tickets</h2>
          <div className="grid gap-4">
            {closedTickets.map((ticket) => (
              <Card key={ticket.ticketNumber}>
                <CardBody>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-mono text-sm font-bold text-gray-600">
                          {ticket.ticketNumber}
                        </span>
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                          Resolved
                        </span>
                      </div>
                      <p className="text-gray-700 text-sm mb-2">{ticket.issue}</p>
                      <p className="text-xs text-gray-500">
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
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🎫</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Tickets</h3>
            <p className="text-gray-600 mb-4">You haven't created any support tickets yet</p>
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
          <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800">
            <p className="font-semibold mb-1">Important:</p>
            <ul className="space-y-1">
              <li>• You can create 1 ticket per day</li>
              <li>• Maximum 10 messages per ticket</li>
              <li>• Response within 24-48 hours</li>
            </ul>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Describe your issue ({issue.length}/150)
            </label>
            <textarea
              value={issue}
              onChange={(e) => setIssue(e.target.value)}
              maxLength={150}
              rows={4}
              className="w-full px-4 py-2 border-2 rounded-lg focus:border-purple-600 focus:outline-none"
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
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-900 font-semibold mb-2">Issue:</p>
              <p className="text-blue-800">{selectedTicket.issue}</p>
            </div>

            {/* Conversation */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              <h4 className="font-semibold text-gray-900">
                Conversation ({selectedTicket.userMessageCount}/{selectedTicket.maxUserMessages} messages used):
              </h4>
              {selectedTicket.conversation.map((msg: any, i: number) => (
                <div
                  key={i}
                  className={`p-3 rounded-lg ${
                    msg.sender === 'user'
                      ? 'bg-gray-100 ml-0 mr-8'
                      : 'bg-purple-100 ml-8 mr-0'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-gray-600">
                      {msg.sender === 'user' ? 'You' : 'Support'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(msg.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-800">{msg.message}</p>
                </div>
              ))}
            </div>

            {selectedTicket.status === 'active' && (
              <>
                {selectedTicket.userMessageCount < selectedTicket.maxUserMessages ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Reply ({replyMessage.length}/150)
                        <span className="text-purple-600 ml-2">
                          {selectedTicket.maxUserMessages - selectedTicket.userMessageCount} messages left
                        </span>
                      </label>
                      <textarea
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        maxLength={150}
                        rows={3}
                        className="w-full px-4 py-2 border-2 rounded-lg focus:border-purple-600 focus:outline-none"
                        placeholder="Type your reply..."
                      />
                    </div>

                    <Button onClick={sendReply} isLoading={sending} fullWidth>
                      Send Reply
                    </Button>
                  </>
                ) : (
                  <div className="bg-red-50 p-4 rounded-lg text-center">
                    <p className="text-red-900 font-semibold">
                      Maximum messages reached
                    </p>
                    <p className="text-sm text-red-700 mt-1">
                      You've used all {selectedTicket.maxUserMessages} available messages for this ticket.
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