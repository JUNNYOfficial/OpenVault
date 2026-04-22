const crypto = require('crypto');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Derive encryption key from Git repository metadata and optional SSH identity.
 * 
 * Key components:
 * 1. Git remote URL (repo identity)
 * 2. Specific commit hash (time-bound)
 * 3. Git user email (author identity)
 * 4. SSH public key fingerprint (optional, hardware-bound)
 */
function deriveKey(options = {}) {
  const cwd = options.cwd || process.cwd();
  
  try {
    // Component 1: Repository identity
    let repoName = 'openvault-default';
    try {
      const remoteUrl = execSync('git remote get-url origin', { encoding: 'utf-8', cwd }).trim();
      const match = remoteUrl.match(/\/([^\/]+?)(?:\.git)?$/);
      if (match) repoName = match[1];
    } catch (e) { /* fallback */ }

    // Component 2: Commit hash (time-bound, prevents replay)
    let commitHash = '0000000';
    try {
      commitHash = execSync('git rev-parse HEAD', { encoding: 'utf-8', cwd }).trim();
    } catch (e) { /* fallback */ }

    // Component 3: Author identity
    let userEmail = 'default@openvault.local';
    try {
      userEmail = execSync('git config user.email', { encoding: 'utf-8', cwd }).trim();
    } catch (e) { /* fallback */ }

    // Component 4: SSH key fingerprint (hardware-bound, optional)
    let sshFingerprint = '';
    if (options.sshKey) {
      sshFingerprint = options.sshKey;
    } else {
      try {
        sshFingerprint = getSSHFingerprint();
      } catch (e) { /* no SSH key available */ }
    }

    // Combine into a seed
    const seed = `${repoName}:${commitHash}:${userEmail}:${sshFingerprint}`;
    
    // Derive 256-bit key using PBKDF2
    const salt = Buffer.from(commitHash.slice(0, 32).padEnd(32, '0'), 'hex');
    const key = crypto.pbkdf2Sync(seed, salt, 100000, 32, 'sha256');
    
    return key;
  } catch (err) {
    console.warn('⚠️  Git not available, using fallback key derivation');
    return crypto.scryptSync('openvault-fallback', 'static-salt', 32);
  }
}

/**
 * Get the default SSH public key fingerprint.
 * Looks for keys in ~/.ssh/ and returns the fingerprint of the first valid one.
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
        // Extract fingerprint using ssh-keygen if available
        try {
          const fp = execSync(`ssh-keygen -lf ${keyPath}`, { encoding: 'utf-8' }).trim();
          const match = fp.match(/SHA256:([A-Za-z0-9+\/]+)/);
          if (match) return `SHA256:${match[1]}`;
        } catch (e) {
          // ssh-keygen not available, hash the key content directly
          return crypto.createHash('sha256').update(pubKey).digest('base64').slice(0, 43);
        }
      } catch (e) { /* continue to next key */ }
    }
  }
  
  return '';
}

/**
 * Derive a key specifically for a given set of commits.
 * This allows "time-locked" encryption where only specific commit states can decrypt.
 */
function deriveKeyFromCommits(commits, options = {}) {
  const cwd = options.cwd || process.cwd();
  
  let seed = '';
  for (const commit of commits) {
    try {
      // Verify commit exists
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

module.exports = { deriveKey, deriveKeyFromCommits, getSSHFingerprint };
