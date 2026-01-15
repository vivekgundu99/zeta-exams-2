// User Types
export interface User {
  userId: string;
  email: string;
  phoneNumber: string;
  name?: string;
  profession?: 'student' | 'teacher';
  grade?: string;
  exam?: 'jee' | 'neet';
  collegeName?: string;
  state?: string;
  lifeAmbition?: string;
  userDetails: boolean;
  lastLoginTime?: Date;
}

// Subscription Types
export interface Subscription {
  subscription: 'free' | 'silver' | 'gold';
  subscriptionType: 'original' | 'giftcode';
  subscriptionStatus: 'active' | 'inactive';
  subscriptionStartTime?: Date;
  subscriptionEndTime?: Date;
  exam?: 'jee' | 'neet';
}

// Limits Types
export interface Limits {
  questions: {
    used: number;
    limit: number;
    reached: boolean;
  };
  chapterTests: {
    used: number;
    limit: number;
    reached: boolean;
  };
  mockTests: {
    used: number;
    limit: number;
    reached: boolean;
  };
}

// Question Types
export interface Question {
  questionId: string;
  serialNumber: string;
  examType: 'jee' | 'neet';
  questionType: 'S' | 'N';
  subject: string;
  chapter: string;
  chapterId: string;
  topic: string;
  topicId: string;
  question: string;
  optionA?: string;
  optionB?: string;
  optionC?: string;
  optionD?: string;
  answer: string;
  questionImageUrl?: string;
  optionAImageUrl?: string;
  optionBImageUrl?: string;
  optionCImageUrl?: string;
  optionDImageUrl?: string;
  explanation?: string;
  explanationImageUrl?: string;
}

// Mock Test Types
export interface MockTest {
  testId: string;
  examType: 'jee' | 'neet';
  testName: string;
  duration: number;
  totalQuestions: number;
  questions: Question[];
}

export interface MockTestAttempt {
  _id: string;
  userId: string;
  testId: string;
  testName: string;
  status: 'ongoing' | 'completed' | 'abandoned';
  startTime: Date;
  endTime?: Date;
  timeTaken: number;
  answers: Answer[];
  score: number;
  totalQuestions: number;
  attemptedQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  unanswered: number;
  accuracy: number;
}

export interface Answer {
  questionIndex: number;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  timeTaken: number;
  flagged: boolean;
}

// Analytics Types
export interface ChapterStats {
  chapterId: string;
  chapterName: string;
  totalAttempted: number;
  correctAnswers: number;
  accuracy: number;
}

export interface SubjectAnalytics {
  totalAttempted: number;
  correctAnswers: number;
  accuracy: number;
  chapters: ChapterStats[];
}

export interface Analytics {
  physics: SubjectAnalytics;
  chemistry: SubjectAnalytics;
  mathematics?: SubjectAnalytics;
  biology?: SubjectAnalytics;
  overallStats: {
    totalQuestions: number;
    totalCorrect: number;
    overallAccuracy: number;
    totalChapterTests: number;
    totalMockTests: number;
  };
}

// Payment Types
export interface PaymentDetails {
  razorpayOrderId: string;
  amount: number;
  subscriptionPlan: 'silver' | 'gold';
  subscriptionDuration: '1month' | '6months' | '1year';
}

// Ticket Types
export interface Ticket {
  ticketNumber: string;
  userId: string;
  userEmail: string;
  userName: string;
  status: 'active' | 'inactive';
  issue: string;
  conversation: Message[];
  refundRequested: boolean;
  refundEligible: boolean;
  createdAt: Date;
}

export interface Message {
  sender: 'user' | 'admin';
  message: string;
  timestamp: Date;
}

// Gift Code Types
export interface GiftCode {
  code: string;
  subscriptionType: 'silver' | 'gold';
  duration: '1month' | '6months' | '1year';
  status: 'available' | 'used';
  usedBy?: string;
  usedAt?: Date;
  notes?: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// Form Types
export interface LoginFormData {
  email: string;
  phoneNumber: string;
  password: string;
  isAdmin?: boolean;
}

export interface RegisterFormData {
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
}

export interface UserDetailsFormData {
  name: string;
  profession: 'student' | 'teacher';
  grade?: string;
  exam: 'jee' | 'neet';
  collegeName: string;
  state: string;
  lifeAmbition: string;
}

// States of India
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