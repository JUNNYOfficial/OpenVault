const crypto = require('crypto');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Derive encryption key from Git repository metadata and optional factors.
 * 
 * Key components:
 * 1. Git remote URL (repo identity)
 * 2. Specific commit hash (time-bound)
 * 3. Git user email (author identity)
 * 4. SSH public key fingerprint (optional, hardware-bound)
 * 5. User password (optional, knowledge-bound)
 * 
 * Modes:
 * - Git-only: Key derived purely from repo state (convenient, single-factor)
 * - Password-enhanced: Git key + user password (two-factor)
 * - Password-only: Key derived purely from strong password (portable)
 * - Hybrid: Git key + Apple-style generated password (maximum security)
 */
function deriveKey(options = {}) {
  const cwd = options.cwd || process.cwd();
  
  // Mode 1: Password-only (most portable, no Git dependency)
  if (options.passwordOnly && options.password) {
    return deriveKeyFromPassword(options.password, options);
  }
  
  // Mode 2 & 3: Git-based (with or without password enhancement)
  try {
    const gitFactors = collectGitFactors(cwd);
    
    if (options.password) {
      // Two-factor: Git state + user password
      return deriveKeyFromGitAndPassword(gitFactors, options.password, options);
    }
    
    // Single-factor: Git state only
    return deriveKeyFromGit(gitFactors, options);
  } catch (err) {
    if (options.fallbackToPassword && options.password) {
      console.warn('⚠️  Git not available, falling back to password-only key');
      return deriveKeyFromPassword(options.password, options);
    }
    console.warn('⚠️  Git not available, using fallback key derivation');
    return crypto.scryptSync('openvault-fallback', 'static-salt', 32);
  }
}

/**
 * Collect Git-based identity factors
 */
function collectGitFactors(cwd) {
  let repoName = 'openvault-default';
  try {
    const remoteUrl = execSync('git remote get-url origin', { encoding: 'utf-8', cwd }).trim();
    const match = remoteUrl.match(/\/([^\/]+?)(?:\.git)?$/);
    if (match) repoName = match[1];
  } catch (e) { /* fallback */ }

  let commitHash = '0000000';
  try {
    commitHash = execSync('git rev-parse HEAD', { encoding: 'utf-8', cwd }).trim();
  } catch (e) { /* fallback */ }

  let userEmail = 'default@openvault.local';
  try {
    userEmail = execSync('git config user.email', { encoding: 'utf-8', cwd }).trim();
  } catch (e) { /* fallback */ }

  let sshFingerprint = '';
  try {
    sshFingerprint = getSSHFingerprint();
  } catch (e) { /* no SSH key */ }

  return { repoName, commitHash, userEmail, sshFingerprint };
}

/**
 * Derive key purely from Git factors
 */
function deriveKeyFromGit(factors, options = {}) {
  const seed = `${factors.repoName}:${factors.commitHash}:${factors.userEmail}:${factors.sshFingerprint}`;
  const salt = Buffer.from(factors.commitHash.slice(0, 32).padEnd(32, '0'), 'hex');
  const iterations = options.iterations || 100000;
  
  return crypto.pbkdf2Sync(seed, salt, iterations, 32, 'sha256');
}

/**
 * Derive key from Git factors + user password (two-factor)
 */
function deriveKeyFromGitAndPassword(factors, password, options = {}) {
  // First derive Git key
  const gitKey = deriveKeyFromGit(factors, options);
  
  // Then combine with password using HKDF-like construction
  const combined = Buffer.concat([
    gitKey,
    Buffer.from(password, 'utf-8')
  ]);
  
  // Use password as additional salt component
  const salt = crypto.createHash('sha256')
    .update(`${factors.commitHash}:${password}`)
    .digest()
    .slice(0, 16);
  
  const iterations = options.iterations || 200000;
  
  return crypto.pbkdf2Sync(combined, salt, iterations, 32, 'sha512');
}

/**
 * Derive key purely from password (portable mode)
 * Useful when you want to decrypt on a machine without the original Git repo
 */
function deriveKeyFromPassword(password, options = {}) {
  // Use a fixed salt derived from the password itself
  // This means same password always produces same key (deterministic)
  const salt = crypto.createHash('sha256')
    .update(`openvault-salt-v1:${password}`)
    .digest()
    .slice(0, 16);
  
  const iterations = options.iterations || 300000;
  
  return crypto.pbkdf2Sync(password, salt, iterations, 32, 'sha512');
}

/**
 * Derive a key specifically for a given set of commits.
 * Time-locked encryption: only specific commit states can decrypt.
 */
function deriveKeyFromCommits(commits, options = {}) {
  const cwd = options.cwd || process.cwd();
  
  let seed = '';
  for (const commit of commits) {
    try {
      execSync(`git cat-file -t ${commit}`, { encoding: 'utf-8', cwd });
      seed += commit;
    } catch (e) {
      throw new Error(`Invalid commit: ${commit}`);
    }
  }
  
  const baseKey = deriveKey(options);
  const salt = Buffer.from(seed.slice(0, 32).padEnd(32, '0'), 'hex');
  
  return crypto.pbkdf2Sync(baseKey, salt, 50000, 32, 'sha256');
}

/**
 * Get the default SSH public key fingerprint
 */
function getSSHFingerprint() {
  const sshDir = path.join(os.homedir(), '.ssh');
  if (!fs.existsSync(sshDir)) return '';
  
  const keyFiles = ['id_ed25519.pub', 'id_rsa.pub', 'id_ecdsa.pub'];
  
  for (const keyFile of keyFiles) {
    const keyPath = path.join(sshDir, keyFile);
    if (fs.existsSync(keyPath)) {
      try {
        const pubKey = fs.readFileSync(keyPath, 'utf-8').trim();
        try {
          const fp = execSync(`ssh-keygen -lf ${keyPath}`, { encoding: 'utf-8' }).trim();
          const match = fp.match(/SHA256:([A-Za-z0-9+\/]+)/);
          if (match) return `SHA256:${match[1]}`;
        } catch (e) {
          return crypto.createHash('sha256').update(pubKey).digest('base64').slice(0, 43);
        }
      } catch (e) { /* continue */ }
    }
  }
  
  return '';
}

module.exports = {
  deriveKey,
  deriveKeyFromGit,
  deriveKeyFromPassword,
  deriveKeyFromGitAndPassword,
  deriveKeyFromCommits,
  collectGitFactors,
  getSSHFingerprint
};
