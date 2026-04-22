/**
 * Apple-Style Strong Password Generator
 * 
 * Generates cryptographically secure passwords similar to Apple's
 * iCloud Keychain strong password feature:
 * - 20 characters total
 * - Groups of 4 separated by hyphens
 * - Mixed case letters + numbers
 * - Excludes visually similar characters (0/O, 1/l/I)
 * - Uses crypto.randomBytes for CSPRNG
 */

const crypto = require('crypto');

// Character set excluding visually similar characters
const CHAR_SET = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';
const CHAR_SET_LENGTH = CHAR_SET.length;

/**
 * Generate a single Apple-style strong password
 * Format: xxxx-xxxx-xxxx-xxxx (20 chars + 4 hyphens = 24 total)
 */
function generatePassword(options = {}) {
  const groupSize = options.groupSize || 4;
  const groupCount = options.groupCount || 5;
  const separator = options.separator || '-';
  const includeSpecial = options.includeSpecial || false;
  
  let chars = CHAR_SET;
  if (includeSpecial) {
    chars += '!@#$%^&*';
  }
  
  const totalChars = groupSize * groupCount;
  const randomBytes = crypto.randomBytes(totalChars * 2);
  
  let password = '';
  let byteIndex = 0;
  
  for (let g = 0; g < groupCount; g++) {
    if (g > 0) password += separator;
    
    for (let i = 0; i < groupSize; i++) {
      // Use rejection sampling to avoid modulo bias
      let randomValue;
      do {
        randomValue = randomBytes[byteIndex++];
      } while (randomValue >= 256 - (256 % chars.length));
      
      password += chars[randomValue % chars.length];
    }
  }
  
  return password;
}

/**
 * Generate multiple passwords at once
 */
function generatePasswords(count = 1, options = {}) {
  const passwords = [];
  for (let i = 0; i < count; i++) {
    passwords.push(generatePassword(options));
  }
  return passwords;
}

/**
 * Generate a memorable passphrase (diceware-style)
 * Uses a wordlist for human-memorable but high-entropy passwords
 */
const WORD_LIST = [
  'apple', 'bridge', 'candle', 'dragon', 'eagle', 'forest', 'garden', 'harbor',
  'island', 'jungle', 'knight', 'lemon', 'mountain', 'noble', 'ocean', 'palace',
  'quartz', 'river', 'silver', 'tiger', 'unicorn', 'valley', 'winter', 'yellow',
  'amber', 'breeze', 'crystal', 'diamond', 'emerald', 'falcon', 'golden', 'horizon',
  'iceberg', 'jasmine', 'kingdom', 'lunar', 'mirror', 'nebula', 'orchid', 'phoenix',
  'quantum', 'rocket', 'shadow', 'thunder', 'velvet', 'whisper', 'zenith', 'azure'
];

function generatePassphrase(wordCount = 4, separator = '-') {
  const randomBytes = crypto.randomBytes(wordCount * 2);
  const words = [];
  
  for (let i = 0; i < wordCount; i++) {
    const index = randomBytes.readUInt16BE(i * 2) % WORD_LIST.length;
    words.push(WORD_LIST[index]);
  }
  
  return words.join(separator);
}

/**
 * Calculate password entropy in bits
 */
function calculateEntropy(password) {
  // Remove separators
  const clean = password.replace(/[^a-zA-Z0-9]/g, '');
  
  let poolSize = 0;
  if (/[a-z]/.test(clean)) poolSize += 26;
  if (/[A-Z]/.test(clean)) poolSize += 26;
  if (/[0-9]/.test(clean)) poolSize += 10;
  if (/[^a-zA-Z0-9]/.test(clean)) poolSize += 32;
  
  return Math.log2(Math.pow(poolSize, clean.length));
}

/**
 * Generate a password and derive a key from it
 * Combines user password with Git-native factors for 2FA-like security
 */
function generatePasswordDerivedKey(gitKey, userPassword, options = {}) {
  const crypto = require('crypto');
  
  // Combine Git-derived key with user password
  // This creates a two-factor system:
  // - Something you have (Git repo state)
  // - Something you know (password) or something generated
  const combined = Buffer.concat([
    gitKey,
    Buffer.from(userPassword, 'utf-8')
  ]);
  
  // Use Argon2id-style parameters with PBKDF2 fallback
  const salt = crypto.createHash('sha256').update(combined).digest().slice(0, 16);
  const iterations = options.iterations || 200000;
  
  return crypto.pbkdf2Sync(combined, salt, iterations, 32, 'sha512');
}

module.exports = {
  generatePassword,
  generatePasswords,
  generatePassphrase,
  calculateEntropy,
  generatePasswordDerivedKey,
  WORD_LIST
};
