/**
 * OpenVault Backup & Recovery System
 * 
 * Provides multiple ways to backup and restore passwords:
 * - QR Code (scan with phone camera)
 * - Plain text file
 * - Encrypted recovery file
 * - Terminal display (for manual copy)
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const QRCode = require('qrcode');
const os = require('os');

const BACKUP_DIR = '.openvault/backups';

/**
 * Generate a QR Code backup of a password
 */
async function generateQRBackup(password, options = {}) {
  const outputPath = options.output || path.join(process.cwd(), BACKUP_DIR, `ovault-backup-${Date.now()}.png`);
  
  // Ensure backup directory exists
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  
  // Generate QR code with password
  await QRCode.toFile(outputPath, password, {
    width: 400,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    },
    errorCorrectionLevel: 'H' // High error correction for better scanning
  });
  
  return outputPath;
}

/**
 * Generate QR Code as ASCII art for terminal display
 */
async function generateQRTerminal(password) {
  return new Promise((resolve, reject) => {
    QRCode.toString(password, {
      type: 'terminal',
      errorCorrectionLevel: 'H'
    }, (err, url) => {
      if (err) reject(err);
      else resolve(url);
    });
  });
}

/**
 * Generate QR Code as small ASCII (compact mode)
 */
async function generateQRCompact(password) {
  return new Promise((resolve, reject) => {
    QRCode.toString(password, {
      type: 'utf8',
      errorCorrectionLevel: 'H',
      small: true
    }, (err, url) => {
      if (err) reject(err);
      else resolve(url);
    });
  });
}

/**
 * Save password to a plain text file (with warnings)
 */
function saveTextBackup(password, options = {}) {
  const outputPath = options.output || path.join(process.cwd(), BACKUP_DIR, `ovault-backup-${Date.now()}.txt`);
  
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  
  const content = `OpenVault Password Backup
=========================
Generated: ${new Date().toISOString()}
Password: ${password}

⚠️  WARNING: This file contains your unencrypted password.
    Store it securely (password manager, encrypted USB, safe).
    Delete this file after transferring to secure storage.

Recovery Instructions:
1. Use this password with: ov unlock <file> -p "${password}"
2. Or scan the QR code if available
3. If lost, this password CANNOT be recovered
`;
  
  fs.writeFileSync(outputPath, content, 'utf-8');
  
  return outputPath;
}

/**
 * Save password to an encrypted recovery file
 * Requires a recovery password to decrypt
 */
function saveEncryptedBackup(password, recoveryPassword, options = {}) {
  const outputPath = options.output || path.join(process.cwd(), BACKUP_DIR, `ovault-backup-${Date.now()}.enc`);
  
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  
  // Derive key from recovery password
  const salt = crypto.randomBytes(16);
  const key = crypto.pbkdf2Sync(recoveryPassword, salt, 100000, 32, 'sha256');
  
  // Encrypt the actual password
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(password, 'utf-8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  
  const backup = {
    version: '1.0',
    type: 'encrypted-backup',
    created: new Date().toISOString(),
    salt: salt.toString('hex'),
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
    data: encrypted
  };
  
  fs.writeFileSync(outputPath, JSON.stringify(backup, null, 2), 'utf-8');
  
  return outputPath;
}

/**
 * Restore password from encrypted backup
 */
function restoreEncryptedBackup(backupPath, recoveryPassword) {
  const backup = JSON.parse(fs.readFileSync(backupPath, 'utf-8'));
  
  if (backup.type !== 'encrypted-backup') {
    throw new Error('Invalid backup file format');
  }
  
  const salt = Buffer.from(backup.salt, 'hex');
  const iv = Buffer.from(backup.iv, 'hex');
  const authTag = Buffer.from(backup.authTag, 'hex');
  
  const key = crypto.pbkdf2Sync(recoveryPassword, salt, 100000, 32, 'sha256');
  
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(backup.data, 'hex', 'utf-8');
  decrypted += decipher.final('utf-8');
  
  return decrypted;
}

/**
 * Generate a comprehensive backup package
 * Includes QR code + encrypted file + text file
 */
async function generateFullBackup(password, options = {}) {
  const backupDir = options.outputDir || path.join(process.cwd(), BACKUP_DIR, `backup-${Date.now()}`);
  fs.mkdirSync(backupDir, { recursive: true });
  
  const results = {
    directory: backupDir,
    files: []
  };
  
  // 1. QR Code
  const qrPath = path.join(backupDir, 'password-qr.png');
  await generateQRBackup(password, { output: qrPath });
  results.files.push({ type: 'qr-code', path: qrPath });
  
  // 2. Text backup
  const txtPath = path.join(backupDir, 'password.txt');
  saveTextBackup(password, { output: txtPath });
  results.files.push({ type: 'text', path: txtPath });
  
  // 3. Encrypted backup (if recovery password provided)
  if (options.recoveryPassword) {
    const encPath = path.join(backupDir, 'password.enc');
    saveEncryptedBackup(password, options.recoveryPassword, { output: encPath });
    results.files.push({ type: 'encrypted', path: encPath });
  }
  
  // 4. Recovery instructions
  const readmePath = path.join(backupDir, 'README.txt');
  const readme = `OpenVault Password Backup Package
==================================
Generated: ${new Date().toISOString()}

This directory contains your password backup:

📱 password-qr.png
   Scan with your phone camera or QR scanner app

📝 password.txt
   Plain text password (DELETE AFTER SECURE STORAGE)

🔐 password.enc (if present)
   Encrypted backup, requires recovery password to unlock

Recovery Commands:
------------------
# Using password directly:
ov unlock <sealed-file> -p "${password}"

# Restore from encrypted backup:
ov restore password.enc -p <recovery-password>

Security Recommendations:
-------------------------
1. Store QR code in your phone's secure notes
2. Save password to 1Password/Bitwarden
3. Keep encrypted backup on a USB drive
4. Delete this backup directory after secure storage
5. NEVER commit backup files to Git

⚠️  If you lose this password, your sealed files CANNOT be recovered.
`;
  fs.writeFileSync(readmePath, readme, 'utf-8');
  results.files.push({ type: 'instructions', path: readmePath });
  
  return results;
}

/**
 * Print password with visual formatting for manual copy
 */
function printPasswordForCopy(password) {
  const lines = [
    '',
    '╔══════════════════════════════════════════╗',
    '║         YOUR OPENVAULT PASSWORD          ║',
    '╠══════════════════════════════════════════╣',
  ];
  
  // Split password into chunks for readability
  const chunks = password.split('-');
  const displayLine = '║  ' + chunks.join('  -  ') + '  ║';
  lines.push(displayLine);
  
  lines.push('╠══════════════════════════════════════════╣');
  lines.push('║  Write this down or save to password    ║');
  lines.push('║  manager. It will NOT be shown again.   ║');
  lines.push('╚══════════════════════════════════════════╝');
  lines.push('');
  
  return lines.join('\n');
}

module.exports = {
  generateQRBackup,
  generateQRTerminal,
  generateQRCompact,
  saveTextBackup,
  saveEncryptedBackup,
  restoreEncryptedBackup,
  generateFullBackup,
  printPasswordForCopy
};
