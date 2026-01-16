'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { storage } from '@/lib/utils';
import { authAPI } from '@/lib/api';
import { toast } from 'react-hot-toast';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = () => {
    const token = storage.get('token');
    const isAdmin = storage.get('isAdmin');
    
    console.log('Admin layout check:', { hasToken: !!token, isAdmin });
    
    if (!token || !isAdmin) {
      console.log('Not authenticated as admin, redirecting...');
      router.push('/');
      return;
    }
    
    setIsAuthenticated(true);
    setLoading(false);
  };

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      storage.remove('token');
      storage.remove('user');
      storage.remove('isAdmin');
      toast.success('Logged out successfully');
      router.push('/');
    }
  };

  const menuItems = [
    { icon: '📊', label: 'Dashboard', href: '/admin' },
    { icon: '❓', label: 'Questions', href: '/admin/questions' },
    { icon: '📖', label: 'Formulas', href: '/admin/formulas' },
    { icon: '🎯', label: 'Mock Tests', href: '/admin/mock-tests' },
    { icon: '👥', label: 'Users', href: '/admin/users' },
    { icon: '🎁', label: 'Gift Codes', href: '/admin/giftcodes' },
    { icon: '🎫', label: 'Tickets', href: '/admin/tickets' },
    { icon: '💰', label: 'Refunds', href: '/admin/refunds' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <aside className="fixed top-0 left-0 z-40 w-64 h-screen bg-white border-r">
        <div className="h-full px-3 py-4 overflow-y-auto">
          <div className="flex items-center gap-3 mb-8 px-3">
            <div className="w-10 h-10 bg-gradient-to-r from-red-600 to-orange-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">A</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-red-600">Admin Panel</h1>
            </div>
          </div>

          <nav className="space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all
                  ${pathname === item.href
                    ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                  }
                `}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>

          <button
            onClick={handleLogout}
            className="w-full mt-6 flex items-center gap-3 px-3 py-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-all"
          >
            <span className="text-xl">🚪</span>
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      <div className="ml-64">
        <header className="bg-white border-b sticky top-0 z-30">
          <div className="px-4 py-3">
            <h2 className="text-xl font-semibold text-gray-900">
              {menuItems.find((item) => item.href === pathname)?.label || 'Admin Panel'}
            </h2>
          </div>
        </header>

        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}