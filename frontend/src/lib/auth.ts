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
  
  generateGiftCodes: (data: any) =>
    api.post('/api/admin/giftcodes/generate', data),
  
  getGiftCodes: (filter: string) =>
    api.get(`/api/admin/giftcodes/list?filter=${filter}`),
  
  getTickets: () =>
    api.get('/api/admin/tickets'),
  
  replyToTicket: (ticketNumber: string, message: string) =>
    api.post('/api/admin/tickets/reply', { ticketNumber, message }),
  
  closeTicket: (ticketNumber: string) =>
    api.post('/api/admin/tickets/close', { ticketNumber }),
};