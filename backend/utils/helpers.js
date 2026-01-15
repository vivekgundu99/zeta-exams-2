// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Generate unique user ID
const generateUserId = () => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `USR${timestamp}${randomStr}`.toUpperCase();
};

// Generate question ID
const generateQuestionId = (count) => {
  return String(count).padStart(7, '0');
};

// Generate serial number for question
// Example: JM1A1 (J=JEE, M=Maths, 1=Chapter, A=Topic, 1=Question number)
const generateSerialNumber = (examType, subject, chapterNum, topicId, questionNum) => {
  const examCode = examType === 'jee' ? 'J' : 'N';
  const subjectCode = {
    'physics': 'P',
    'chemistry': 'C',
    'mathematics': 'M',
    'biology': 'B'
  }[subject.toLowerCase()] || 'X';
  
  return `${examCode}${subjectCode}${chapterNum}${topicId}${questionNum}`;
};

// Generate test ID
const generateTestId = (examType) => {
  const timestamp = Date.now().toString(36);
  const examCode = examType === 'jee' ? 'JEE' : 'NEET';
  return `${examCode}${timestamp}`.toUpperCase();
};

// Generate ticket number
const generateTicketNumber = () => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 6);
  return `TKT${timestamp}${randomStr}`.toUpperCase();
};

// Generate gift code
const generateGiftCode = (subscriptionType, duration) => {
  const subCode = subscriptionType === 'silver' ? 'S' : 'G';
  const durCode = {
    '1month': '1',
    '6months': '6',
    '1year': 'Y'
  }[duration];
  
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${subCode}${durCode}${randomPart}`;
};

// Get next reset time (4:00 AM IST)
const getNextResetTime = () => {
  const now = new Date();
  
  // Convert to IST
  const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
  const istTime = new Date(now.getTime() + istOffset);
  
  // Set to 4:00 AM IST
  let resetTime = new Date(istTime);
  resetTime.setHours(4, 0, 0, 0);
  
  // If current time is past 4 AM, set for next day
  if (istTime >= resetTime) {
    resetTime.setDate(resetTime.getDate() + 1);
  }
  
  // Convert back to UTC
  return new Date(resetTime.getTime() - istOffset);
};

// Check if limit reset is needed
const needsLimitReset = (lastResetTime) => {
  return new Date() >= new Date(lastResetTime);
};

// Calculate subscription end date
const calculateSubscriptionEndDate = (duration) => {
  const now = new Date();
  const endDate = new Date(now);
  
  switch(duration) {
    case '1month':
      endDate.setMonth(endDate.getMonth() + 1);
      break;
    case '6months':
      endDate.setMonth(endDate.getMonth() + 6);
      break;
    case '1year':
      endDate.setFullYear(endDate.getFullYear() + 1);
      break;
  }
  
  return endDate;
};

// Parse CSV line for question import
const parseCSVLine = (line) => {
  // Split by # but handle escaped #
  const parts = line.split('#');
  return parts.map(part => part.trim());
};

// Get subscription price
const getSubscriptionPrice = (plan, duration) => {
  const prices = {
    silver: {
      '1month': { mrp: 100, sp: 49 },
      '6months': { mrp: 500, sp: 249 },
      '1year': { mrp: 1000, sp: 399 }
    },
    gold: {
      '1month': { mrp: 600, sp: 299 },
      '6months': { mrp: 2500, sp: 1299 },
      '1year': { mrp: 5000, sp: 2000 }
    }
  };
  
  return prices[plan]?.[duration] || null;
};

// Validate email format
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate phone number (Indian)
const isValidPhone = (phone) => {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone);
};

// Sanitize input
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input.trim().replace(/[<>]/g, '');
};

module.exports = {
  generateOTP,
  generateUserId,
  generateQuestionId,
  generateSerialNumber,
  generateTestId,
  generateTicketNumber,
  generateGiftCode,
  getNextResetTime,
  needsLimitReset,
  calculateSubscriptionEndDate,
  parseCSVLine,
  getSubscriptionPrice,
  isValidEmail,
  isValidPhone,
  sanitizeInput
};