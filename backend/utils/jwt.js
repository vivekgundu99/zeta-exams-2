const jwt = require('jsonwebtoken');

// CRITICAL: Ensure JWT_SECRET is set
const JWT_SECRET = process.env.JWT_SECRET;

// Validate JWT_SECRET on startup
if (!JWT_SECRET) {
  console.error('');
  console.error('🔴🔴🔴 CRITICAL ERROR 🔴🔴🔴');
  console.error('JWT_SECRET is not set in environment variables!');
  console.error('Please set JWT_SECRET in Vercel environment variables');
  console.error('Example: JWT_SECRET=your-super-secret-key-minimum-32-characters');
  console.error('');
  throw new Error('JWT_SECRET is required but not set');
}

if (JWT_SECRET.length < 32) {
  console.warn('⚠️ WARNING: JWT_SECRET should be at least 32 characters for security');
}

console.log('✅ JWT_SECRET loaded successfully (length:', JWT_SECRET.length, ')');

// Generate JWT Token
const generateToken = (userId, email, isAdmin = false) => {
  try {
    console.log('🔑 Generating token for:', {
      userId: userId,
      email: email,
      isAdmin: isAdmin
    });

    const payload = {
      userId, 
      email,
      isAdmin,
      timestamp: Date.now()
    };

    const token = jwt.sign(
      payload,
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('✅ Token generated successfully');
    console.log('Token preview:', token.substring(0, 20) + '...');
    
    return token;
  } catch (error) {
    console.error('❌ Token generation failed:', error);
    throw new Error('Failed to generate token: ' + error.message);
  }
};

// Verify JWT Token
const verifyToken = (token) => {
  try {
    // Clean the token - remove quotes if present
    const cleanToken = token.trim().replace(/^["']|["']$/g, '');
    
    console.log('🔍 Verifying token:', cleanToken.substring(0, 20) + '...');
    
    if (!cleanToken) {
      throw new Error('Token is empty or undefined');
    }

    const decoded = jwt.verify(cleanToken, JWT_SECRET);
    
    console.log('✅ Token verified successfully:', {
      userId: decoded.userId,
      email: decoded.email,
      isAdmin: decoded.isAdmin,
      expiresAt: new Date(decoded.exp * 1000).toISOString()
    });

    return decoded;
  } catch (error) {
    console.error('❌ Token verification failed:', {
      error: error.name,
      message: error.message
    });

    if (error.name === 'TokenExpiredError') {
      throw new Error('Token has expired. Please login again.');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Token is invalid or malformed.');
    } else if (error.name === 'NotBeforeError') {
      throw new Error('Token not active yet.');
    }
    
    throw new Error('Token verification failed: ' + error.message);
  }
};

// Decode token without verification (for debugging)
const decodeToken = (token) => {
  try {
    const decoded = jwt.decode(token);
    console.log('📋 Token decoded (no verification):', decoded);
    return decoded;
  } catch (error) {
    console.error('❌ Token decode failed:', error);
    return null;
  }
};

module.exports = {
  generateToken,
  verifyToken,
  decodeToken
};