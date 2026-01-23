// backend/utils/jwt.js - UPDATED WITH ADMIN EXCEPTION
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('🔴 JWT_SECRET is not set!');
  throw new Error('JWT_SECRET is required');
}

console.log('✅ JWT_SECRET loaded (length:', JWT_SECRET.length, ')');

// 🔥 UPDATED: Generate token with admin exception
const generateToken = (userId, email, isAdmin = false, sessionVersion = 0) => {
  try {
    console.log('🔑 Generating token:', {
      userId,
      email,
      isAdmin,
      sessionVersion: isAdmin ? 'N/A (Admin)' : sessionVersion
    });

    const payload = {
      userId, 
      email,
      isAdmin,
      sessionVersion,  // For admin: 0 (ignored), For users: incremental version
      timestamp: Date.now()
    };

    const token = jwt.sign(
      payload,
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('✅ Token generated');
    
    return token;
  } catch (error) {
    console.error('❌ Token generation failed:', error);
    throw new Error('Failed to generate token: ' + error.message);
  }
};

// Verify JWT Token
const verifyToken = (token) => {
  try {
    const cleanToken = token.trim().replace(/^["']|["']$/g, '');
    
    if (!cleanToken) {
      throw new Error('Token is empty');
    }

    const decoded = jwt.verify(cleanToken, JWT_SECRET);
    
    console.log('✅ Token verified:', {
      userId: decoded.userId,
      isAdmin: decoded.isAdmin,
      sessionVersion: decoded.isAdmin ? 'N/A (Admin)' : decoded.sessionVersion,
      expiresAt: new Date(decoded.exp * 1000).toISOString()
    });

    return decoded;
  } catch (error) {
    console.error('❌ Token verification failed:', error.message);

    if (error.name === 'TokenExpiredError') {
      throw new Error('Token has expired. Please login again.');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Token is invalid or malformed.');
    }
    
    throw new Error('Token verification failed: ' + error.message);
  }
};

module.exports = {
  generateToken,
  verifyToken,
};