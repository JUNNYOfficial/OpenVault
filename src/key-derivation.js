const crypto = require('crypto');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function deriveKey() {
  try {
    // Get the latest commit hash
    const commitHash = execSync('git rev-parse HEAD', { encoding: 'utf-8', cwd: process.cwd() }).trim();
    
    // Get repo name from remote
    let repoName = 'openvault-default';
    try {
      const remoteUrl = execSync('git remote get-url origin', { encoding: 'utf-8', cwd: process.cwd() }).trim();
      const match = remoteUrl.match(/\/([^\/]+?)(?:\.git)?$/);
      if (match) repoName = match[1];
    } catch (e) {
      // fallback
    }

    // Get user identity from git config
    let userEmail = 'default@openvault.local';
    try {
      userEmail = execSync('git config user.email', { encoding: 'utf-8', cwd: process.cwd() }).trim();
    } catch (e) {
      // fallback
    }

    // Combine into a seed
    const seed = `${repoName}:${commitHash}:${userEmail}`;
    
    // Derive 256-bit key using PBKDF2
    const salt = Buffer.from(commitHash.slice(0, 32), 'hex');
    const key = crypto.pbkdf2Sync(seed, salt, 100000, 32, 'sha256');
    
    return key;
  } catch (err) {
    console.warn('⚠️  Git not available, using fallback key derivation');
    return crypto.scryptSync('openvault-fallback', 'static-salt', 32);
  }
}

module.exports = { deriveKey };
