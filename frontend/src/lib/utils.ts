import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Jammu and Kashmir',
  'Outside India',
] as const;

export const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

export const formatTime = (date: string | Date) => {
  return new Date(date).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(amount);
};

export const getTimeRemaining = (endDate: string | Date) => {
  const total = new Date(endDate).getTime() - new Date().getTime();
  const days = Math.floor(total / (1000 * 60 * 60 * 24));
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((total / 1000 / 60) % 60);
  const seconds = Math.floor((total / 1000) % 60);

  return { total, days, hours, minutes, seconds };
};

export const formatSeconds = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const calculatePercentage = (value: number, total: number) => {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
};

export const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const parseLatex = (text: string) => {
  return text.replace(/latex:(.*?)(?=\s|$|,|\.|;)/g, '$$1$');
};

export const getPlanFeatures = (plan: 'free' | 'silver' | 'gold') => {
  const features = {
    free: {
      questionsPerDay: 50,
      chapterTests: 0,
      mockTests: 0,
      formulas: false,
      analytics: false,
    },
    silver: {
      questionsPerDay: 200,
      chapterTests: 10,
      mockTests: 0,
      formulas: false,
      analytics: false,
    },
    gold: {
      questionsPerDay: 5000,
      chapterTests: 50,
      mockTests: 8,
      formulas: true,
      analytics: true,
    },
  };
  return features[plan];
};

export const getDurationLabel = (duration: string) => {
  const labels: Record<string, string> = {
    '1month': '1 Month',
    '6months': '6 Months',
    '1year': '1 Year',
  };
  return labels[duration] || duration;
};

export const getExamLabel = (exam: string) => {
  return exam === 'jee' ? 'JEE Main' : 'NEET';
};

export const getQuestionTypeLabel = (type: string) => {
  return type === 'S' ? 'MCQ' : 'Numerical';
};

export const downloadFile = (url: string, filename: string) => {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    return false;
  }
};

export const isValidEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPhone = (phone: string) => {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone);
};

export const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
};

export const getQuestionStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    unanswered: 'bg-gray-200 text-gray-700',
    answered: 'bg-green-500 text-white',
    'not-answered': 'bg-red-500 text-white',
    'marked-review': 'bg-purple-500 text-white',
    'answered-marked': 'bg-blue-500 text-white',
  };
  return colors[status] || colors.unanswered;
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Enhanced storage with better error handling and token cleaning
export const storage = {
  get: (key: string) => {
    if (typeof window === 'undefined') return null;
    try {
      const item = window.localStorage.getItem(key);
      if (!item || item === 'undefined' || item === 'null') return null;
      
      // Try to parse as JSON
      try {
        return JSON.parse(item);
      } catch {
        // If not JSON, return as-is
        return item;
      }
    } catch (error) {
      console.error(`Storage get error for key "${key}":`, error);
      return null;
    }
  },
  
  set: (key: string, value: any) => {
    if (typeof window === 'undefined') return;
    try {
      if (value === null || value === undefined) {
        window.localStorage.removeItem(key);
        return;
      }
      
      // For strings that are already valid (like tokens), don't double-stringify
      if (typeof value === 'string' && key === 'token') {
        // Store token directly without JSON.stringify to avoid quote issues
        window.localStorage.setItem(key, value);
      } else {
        window.localStorage.setItem(key, JSON.stringify(value));
      }
      
      console.log(`✅ Storage set: ${key}`);
    } catch (error) {
      console.error(`Storage set error for key "${key}":`, error);
    }
  },
  
  remove: (key: string) => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem(key);
      console.log(`✅ Storage removed: ${key}`);
    } catch (error) {
      console.error(`Storage remove error for key "${key}":`, error);
    }
  },
  
  clearAuth: () => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem('token');
      window.localStorage.removeItem('user');
      window.localStorage.removeItem('isAdmin');
      console.log('✅ Auth storage cleared');
    } catch (error) {
      console.error('Storage clearAuth error:', error);
    }
  }
};