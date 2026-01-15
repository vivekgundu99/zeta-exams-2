const jwt = require('jsonwebtoken');

// Generate JWT Token
const generateToken = (userId, email, isAdmin = false) => {
  return jwt.sign(
    { 
      userId, 
      email,
      isAdmin,
      timestamp: Date.now()
    },
    process.env.JWT_SECRET,
    { 
      expiresIn: '7d' // Token valid for 7 days
    }
  );
};

// Verify JWT Token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

// Decode token without verification (for debugging)
const decodeToken = (token) => {
  return jwt.decode(token);
};

module.exports = {
  generateToken,
  verifyToken,
  decodeToken
};