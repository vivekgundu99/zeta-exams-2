'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import Card, { CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { adminAPI } from '@/lib/api';

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getTickets();
      if (response.data.success) {
        setTickets(response.data.tickets || []);
      }
    } catch (error) {
      toast.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async () => {
    if (!replyMessage.trim() || !selectedTicket) {
      toast.error('Please enter a reply');
      return;
    }

    if (replyMessage.length > 150) {
      toast.error('Reply must not exceed 150 characters');
      return;
    }

    try {
      const response = await adminAPI.replyToTicket({
        ticketNumber: selectedTicket.ticketNumber,
        message: replyMessage.trim(),
      });

      if (response.data.success) {
        toast.success('Reply sent successfully');
        setReplyMessage('');
        setSelectedTicket(response.data.ticket);
        loadTickets();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send reply');
    }
  };

  const handleClose = async (ticketNumber: string) => {
    if (!window.confirm('Are you sure you want to close this ticket?')) {
      return;
    }

    try {
      const response = await adminAPI.closeTicket(ticketNumber);
      if (response.data.success) {
        toast.success('Ticket closed successfully');
        setSelectedTicket(null);
        loadTickets();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to close ticket');
    }
  };

  const handleMarkRefundEligible = async (ticketNumber: string) => {
    if (!window.confirm('Mark this ticket as eligible for refund?')) {
      return;
    }

    try {
      const response = await adminAPI.markRefundEligible(ticketNumber);
      if (response.data.success) {
        toast.success('Ticket marked as eligible for refund');
        loadTickets();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update ticket');
    }
  };

  const activeTickets = tickets.filter(t => t.status === 'active');
  const closedTickets = tickets.filter(t => t.status === 'inactive');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Support Tickets</h1>
          <p className="text-gray-600">
            Active: {activeTickets.length} | Closed: {closedTickets.length}
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Active Tickets */}
        <Card>
          <CardBody>
            <h3 className="font-semibold mb-4 text-orange-600">🔥 Active Tickets</h3>
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : activeTickets.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No active tickets</div>
            ) : (
              <div className="space-y-3">
                {activeTickets.map((ticket) => (
                  <div
                    key={ticket.ticketNumber}
                    className="p-4 border-2 border-orange-200 rounded-lg hover:border-orange-400 cursor-pointer transition-all"
                    onClick={() => setSelectedTicket(ticket)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="font-mono text-sm font-bold text-purple-600">
                        {ticket.ticketNumber}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="font-semibold text-gray-900 mb-1">{ticket.userName}</p>
                    <p className="text-sm text-gray-600 mb-2">{ticket.userEmail}</p>
                    <p className="text-sm text-gray-700 line-clamp-2">{ticket.issue}</p>
                    {ticket.refundRequested && (
                      <span className="inline-block mt-2 px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-semibold">
                        💰 Refund Requested
                      </span>
                    )}
                    {ticket.refundEligible && (
                      <span className="inline-block mt-2 ml-2 px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">
                        ✅ Refund Eligible
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Closed Tickets */}
        <Card>
          <CardBody>
            <h3 className="font-semibold mb-4 text-green-600">✅ Closed Tickets</h3>
            {closedTickets.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No closed tickets</div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {closedTickets.map((ticket) => (
                  <div
                    key={ticket.ticketNumber}
                    className="p-4 border rounded-lg bg-gray-50 cursor-pointer hover:bg-gray-100"
                    onClick={() => setSelectedTicket(ticket)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="font-mono text-sm font-bold text-gray-600">
                        {ticket.ticketNumber}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(ticket.resolvedAt || ticket.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="font-semibold text-gray-700 mb-1">{ticket.userName}</p>
                    <p className="text-sm text-gray-600 line-clamp-2">{ticket.issue}</p>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Ticket Detail Modal */}
      <Modal
        isOpen={!!selectedTicket}
        onClose={() => setSelectedTicket(null)}
        title={`Ticket: ${selectedTicket?.ticketNumber}`}
        size="lg"
      >
        {selectedTicket && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">User</p>
              <p className="font-semibold text-gray-900">{selectedTicket.userName}</p>
              <p className="text-sm text-gray-600">{selectedTicket.userEmail}</p>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-900 font-semibold mb-2">Issue:</p>
              <p className="text-blue-800">{selectedTicket.issue}</p>
            </div>

            {/* Conversation */}
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
                      {msg.sender === 'user' ? 'User' : 'Admin'}
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

                <div className="flex gap-3">
                  <Button onClick={handleReply} className="flex-1">
                    Send Reply
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleClose(selectedTicket.ticketNumber)}
                  >
                    Close Ticket
                  </Button>
                </div>

                {selectedTicket.refundRequested && !selectedTicket.refundEligible && (
                  <Button
                    fullWidth
                    variant="secondary"
                    onClick={() => handleMarkRefundEligible(selectedTicket.ticketNumber)}
                  >
                    Mark Eligible for Refund
                  </Button>
                )}
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}