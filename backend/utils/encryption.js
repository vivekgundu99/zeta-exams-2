const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

// Generate a proper 32-byte key from the environment variable
const generateKey = (secret) => {
  // Use SHA-256 to create a consistent 32-byte key from any string
  return crypto.createHash('sha256').update(secret).digest();
};

const ENCRYPTION_KEY = generateKey(
  process.env.PHONE_ENCRYPTION_KEY || 'default-secret-key-change-this-in-production'
);

// Encrypt phone number
const encryptPhone = (phoneNumber) => {
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    
    let encrypted = cipher.update(phoneNumber, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt phone number');
  }
};

// Decrypt phone number
const decryptPhone = (encryptedPhone) => {
  try {
    const parts = encryptedPhone.split(':');
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted phone format');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = parts[1];
    
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt phone number');
  }
};

module.exports = {
  encryptPhone,
  decryptPhone
};

// Example .env configuration:
// PHONE_ENCRYPTION_KEY=your-super-secure-random-string-here