// frontend/src/app/dashboard/support/page.tsx - COMPLETE FIXED VERSION
'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import Card, { CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Loader from '@/components/ui/Loader';
import { storage } from '@/lib/utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://zeta-exams-backend-2.vercel.app';

export default function TicketsPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [issue, setIssue] = useState('');
  const [creating, setCreating] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadTickets();
  }, []);

  const getAuthHeaders = () => {
    const token = storage.get('token');
    console.log('🔑 Getting auth headers, token exists:', !!token);
    
    if (!token) {
      console.error('❌ No token found in storage');
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
      console.log('📋 Loading tickets...');
      
      const headers = getAuthHeaders();
      if (!headers) {
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_URL}/api/tickets/my-tickets`, {
        method: 'GET',
        headers,
      });

      console.log('📋 Tickets response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to load tickets');
      }

      const data = await response.json();
      console.log('✅ Tickets loaded:', data);

      if (data.success) {
        setTickets(data.tickets || []);
      } else {
        throw new Error(data.message || 'Failed to load tickets');
      }
    } catch (error: any) {
      console.error('💥 Load tickets error:', error);
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
      console.log('🎫 Creating ticket with issue:', issue);

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

      console.log('🎫 Create ticket response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create ticket');
      }

      const data = await response.json();
      console.log('✅ Ticket created:', data);

      if (data.success) {
        toast.success('Ticket created successfully!');
        setShowCreateModal(false);
        setIssue('');
        loadTickets();
      } else {
        throw new Error(data.message || 'Failed to create ticket');
      }
    } catch (error: any) {
      console.error('💥 Create ticket error:', error);
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
      console.log('💬 Sending reply to ticket:', selectedTicket.ticketNumber);

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

      console.log('💬 Reply response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send message');
      }

      const data = await response.json();
      console.log('✅ Reply sent:', data);

      if (data.success) {
        toast.success('Message sent successfully!');
        setReplyMessage('');
        setSelectedTicket(data.ticket);
        loadTickets();
      } else {
        throw new Error(data.message || 'Failed to send message');
      }
    } catch (error: any) {
      console.error('💥 Send reply error:', error);
      toast.error(error.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const requestRefund = async (ticketNumber: string) => {
    if (!window.confirm('Request refund for this ticket?')) {
      return;
    }

    try {
      console.log('💰 Requesting refund for ticket:', ticketNumber);

      const headers = getAuthHeaders();
      if (!headers) return;

      const response = await fetch(`${API_URL}/api/tickets/request-refund`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ ticketNumber }),
      });

      console.log('💰 Refund request response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to request refund');
      }

      const data = await response.json();
      console.log('✅ Refund requested:', data);

      if (data.success) {
        toast.success('Refund request submitted!');
        loadTickets();
      } else {
        throw new Error(data.message || 'Failed to request refund');
      }
    } catch (error: any) {
      console.error('💥 Request refund error:', error);
      toast.error(error.message || 'Failed to request refund');
    }
  };

  const activeTickets = tickets.filter((t) => t.status === 'active');
  const closedTickets = tickets.filter((t) => t.status === 'inactive');

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader size="lg" text="Loading tickets..." />
      </div>
    );
  }

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
                        {ticket.refundRequested && (
                          <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold">
                            Refund Requested
                          </span>
                        )}
                      </div>
                      <p className="text-gray-700 mb-2">{ticket.issue}</p>
                      <p className="text-xs text-gray-500">
                        Created: {new Date(ticket.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedTicket(ticket)}
                    >
                      View Conversation
                    </Button>
                    {!ticket.refundRequested && (
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => requestRefund(ticket.ticketNumber)}
                      >
                        Request Refund
                      </Button>
                    )}
                  </div>
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

            <div className="space-y-3 max-h-96 overflow-y-auto">
              <h4 className="font-semibold text-gray-900">Conversation:</h4>
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reply ({replyMessage.length}/150)
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
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}