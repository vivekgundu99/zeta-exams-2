'use client';

import { useEffect, useState } from 'react';
import Card, { CardBody } from '@/components/ui/Card';
import { adminAPI } from '@/lib/api';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await adminAPI.getDashboardStats();
      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Failed to load stats');
    }
  };

  if (!stats) return <div>Loading...</div>;

  const statCards = [
    {
      title: 'Total Users',
      value: stats.users.total,
      subtitle: `Free: ${stats.users.free} | Silver: ${stats.users.silver} | Gold: ${stats.users.gold}`,
      icon: '👥',
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      title: 'Questions',
      value: stats.questions.total,
      subtitle: `JEE: ${stats.questions.jee} | NEET: ${stats.questions.neet}`,
      icon: '❓',
      gradient: 'from-green-500 to-emerald-500',
    },
    {
      title: 'Mock Tests',
      value: stats.mockTests.total,
      subtitle: `Attempts: ${stats.mockTests.attempts}`,
      icon: '🎯',
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      title: 'Gift Codes',
      value: stats.giftCodes.total,
      subtitle: `Used: ${stats.giftCodes.used} | Available: ${stats.giftCodes.available}`,
      icon: '🎁',
      gradient: 'from-orange-500 to-red-500',
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => (
          <Card key={card.title}>
            <CardBody className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 bg-gradient-to-r ${card.gradient} rounded-lg flex items-center justify-center text-2xl`}>
                  {card.icon}
                </div>
              </div>
              <h3 className="text-sm text-gray-600 mb-1">{card.title}</h3>
              <p className="text-3xl font-bold text-gray-900 mb-2">{card.value}</p>
              <p className="text-xs text-gray-500">{card.subtitle}</p>
            </CardBody>
          </Card>
        ))}
      </div>

      {stats.tickets.active > 0 && (
        <Card className="border-2 border-orange-200 bg-orange-50">
          <CardBody className="p-6">
            <div className="flex items-center gap-4">
              <span className="text-3xl">⚠️</span>
              <div>
                <h3 className="font-bold text-orange-900">Active Tickets</h3>
                <p className="text-orange-700">
                  You have {stats.tickets.active} active support tickets
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}