import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://zeta-exams-backend-2.vercel.app';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      
      if (token && token !== 'null' && token !== 'undefined' && token.trim() !== '') {
        try {
          let cleanToken = token.trim();
          
          if (cleanToken.startsWith('"') && cleanToken.endsWith('"')) {
            cleanToken = JSON.parse(cleanToken);
          }
          
          cleanToken = cleanToken.replace(/^["']|["']$/g, '').trim();
          
          if (cleanToken && cleanToken.length > 20 && !cleanToken.includes(' ')) {
            config.headers.Authorization = `Bearer ${cleanToken}`;
          } else {
            localStorage.removeItem('token');
          }
        } catch (error) {
          localStorage.removeItem('token');
        }
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 🔥 UPDATED: Response interceptor with session handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('❌ API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      code: error.response?.data?.code,
      message: error.response?.data?.message,
    });

    if (!error.response) {
      return Promise.reject({
        response: {
          data: {
            success: false,
            message: 'Network error. Please check your connection.',
          },
        },
      });
    }

    // 🔥 HANDLE SESSION EXPIRED (401 with SESSION_EXPIRED code)
    if (error.response?.status === 401) {
      const errorCode = error.response?.data?.code;
      const currentPath = window.location.pathname;
      
      // Don't redirect if already on auth pages
      const isAuthPage = currentPath.includes('/login') || 
                         currentPath.includes('/register') || 
                         currentPath === '/' ||
                         currentPath === '/forgot-password';

      if (!isAuthPage) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('isAdmin');
          
          // 🔥 Show different messages based on error code
          const message = errorCode === 'SESSION_EXPIRED' 
            ? 'You have been logged in from another device.'
            : 'Your session has expired. Please login again.';
          
          // Store message in sessionStorage to show on login page
          sessionStorage.setItem('loginMessage', message);
          
          setTimeout(() => {
            window.location.href = '/';
          }, 100);
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// Auth API
export const authAPI = {
  sendOTP: (email: string, purpose: string) =>
    api.post('/api/auth/send-otp', { email, purpose }),
  
  register: (data: any) =>
    api.post('/api/auth/register', data),
  
  login: (data: any) =>
    api.post('/api/auth/login', data),
  
  logout: () =>
    api.post('/api/auth/logout'),
  
  logoutAll: (email: string) =>
    api.post('/api/auth/logout-all', { email }),
  
  resetPassword: (data: any) =>
    api.post('/api/auth/reset-password', data),
};

// User API
export const userAPI = {
  getProfile: () =>
    api.get('/api/user/profile'),
  
  updateDetails: (data: any) =>
    api.post('/api/user/update-details', data),
  
  editDetails: (data: any) =>
    api.put('/api/user/edit-details', data),
  
  changePassword: (data: any) =>
    api.post('/api/user/change-password', data),
  
  getLimits: () =>
    api.get('/api/user/limits'),
};

// Subscription API
export const subscriptionAPI = {
  getPlans: () =>
    api.get('/api/subscription/plans'),
  
  getStatus: () =>
    api.get('/api/subscription/status'),
};

// Payment API
export const paymentAPI = {
  createOrder: (data: any) =>
    api.post('/api/payment/create-order', data),
  
  verifyPayment: (data: any) =>
    api.post('/api/payment/verify', data),
  
  getHistory: () =>
    api.get('/api/payment/history'),
};

// Questions API
export const questionsAPI = {
  getSubjects: (examType: string) =>
    api.get(`/api/questions/subjects?examType=${examType}`),
  
  getChapters: (subject: string, examType: string) =>
    api.get(`/api/questions/chapters/${subject}?examType=${examType}`),
  
  getTopics: (subject: string, chapter: string, examType: string) =>
    api.get(`/api/questions/topics/${subject}/${chapter}?examType=${examType}`),
  
  getQuestions: (params: any) =>
    api.get('/api/questions/list', { params }),
  
  getQuestion: (questionId: string) =>
    api.get(`/api/questions/${questionId}`),
  
  submitAnswer: (data: any) =>
    api.post('/api/questions/submit-answer', data),
};

// Mock Tests API
export const mockTestsAPI = {
  getList: (examType: string, filter?: string) =>
    api.get(`/api/mock-tests/list?examType=${examType}&filter=${filter || 'all'}`),
  
  getTest: (testId: string) =>
    api.get(`/api/mock-tests/${testId}`),
  
  startTest: (testId: string) =>
    api.post('/api/mock-tests/start', { testId }),
  
  submitTest: (attemptId: string, answers: any[]) =>
    api.post('/api/mock-tests/submit', { attemptId, answers }),
  
  getAttempts: () =>
    api.get('/api/mock-tests/attempts'),
  
  getResult: (attemptId: string) =>
    api.get(`/api/mock-tests/result/${attemptId}`),
};

// Gift Codes API
export const giftCodesAPI = {
  validate: (code: string) =>
    api.post('/api/giftcodes/validate', { code }),
  
  redeem: (code: string) =>
    api.post('/api/giftcodes/redeem', { code }),
};

// Analytics API
export const analyticsAPI = {
  getOverview: () =>
    api.get('/api/analytics/overview'),
  
  getSubjectStats: (subject: string) =>
    api.get(`/api/analytics/subject/${subject}`),
};

// Admin API
export const adminAPI = {
  getDashboardStats: () =>
    api.get('/api/admin/dashboard/stats'),
  
  bulkUploadQuestions: (data: any) =>
    api.post('/api/admin/questions/bulk-upload', data),
  
  getUsers: (page: number) =>
    api.get(`/api/admin/users?page=${page}`),
  
  deactivateUser: (userId: string) =>
    api.post('/api/admin/users/deactivate', { userId }),
  
  generateGiftCodes: (data: any) =>
    api.post('/api/admin/giftcodes/generate', data),
  
  getGiftCodes: (filter: string) =>
    api.get(`/api/admin/giftcodes/list?filter=${filter}`),
  
  deleteGiftCode: (code: string) =>
    api.delete(`/api/admin/giftcodes/${code}`),
  
  createMockTest: (data: any) =>
    api.post('/api/admin/mock-tests/create', data),
  
  deleteMockTest: (testId: string) =>
    api.delete(`/api/admin/mock-tests/${testId}`),
  
  getTickets: () =>
    api.get('/api/admin/tickets'),
  
  replyToTicket: (data: any) =>
    api.post('/api/admin/tickets/reply', data),
  
  closeTicket: (ticketNumber: string) =>
    api.post('/api/admin/tickets/close', { ticketNumber }),
  
  requestRefund: (ticketNumber: string) =>
    api.post('/api/admin/tickets/request-refund', { ticketNumber }),
  
  markRefundEligible: (ticketNumber: string) =>
    api.post('/api/admin/tickets/refund-eligible', { ticketNumber }),
  
  getRefunds: () =>
  api.get('/api/admin/refunds'),
  
  processRefund: (ticketNumber: string) =>
    api.post('/api/admin/refunds/process', { ticketNumber }),
};