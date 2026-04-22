const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { camouflage, decamouflage } = require('./camouflage');
const { deriveKey } = require('./key-derivation');

const OVAULT_DIR = '.openvault';
const MANIFEST_FILE = 'manifest.json';

function initRepo(cwd) {
  const ovDir = path.join(cwd, OVAULT_DIR);
  if (!fs.existsSync(ovDir)) {
    fs.mkdirSync(ovDir, { recursive: true });
  }
  const manifest = {
    version: '0.1.0',
    cipher: 'aes-256-gcm',
    kdf: 'pbkdf2',
    camouflage: {
      format: 'markdown',
      style_guide: 'technical-blog'
    },
    shards: [],
    key_derivation: {
      type: 'git-native',
      identity: 'github-user-pubkey-fingerprint'
    }
  };
  fs.writeFileSync(path.join(ovDir, MANIFEST_FILE), JSON.stringify(manifest, null, 2));
}

function seal(filePath, camoType = 'markdown-tutorial') {
  const absPath = path.resolve(filePath);
  if (!fs.existsSync(absPath)) {
    throw new Error(`File not found: ${absPath}`);
  }

  const plaintext = fs.readFileSync(absPath, 'utf-8');
  const key = deriveKey();

  // Encrypt
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(plaintext, 'utf-8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  const payload = JSON.stringify({
    iv: iv.toString('hex'),
    authTag,
    data: encrypted
  });

  // Camouflage
  const camoResult = camouflage(payload, camoType);

  // Write to docs/ as a "tutorial"
  const outputName = `docs/react-hooks-guide.md`;
  const outputPath = path.join(process.cwd(), outputName);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, camoResult, 'utf-8');

  // Update manifest
  updateManifest(outputName, camoType);

  return outputPath;
}

function unlock(filePath) {
  const absPath = path.resolve(filePath);
  if (!fs.existsSync(absPath)) {
    throw new Error(`File not found: ${absPath}`);
  }

  const camoContent = fs.readFileSync(absPath, 'utf-8');
  const payload = decamouflage(camoContent);

  const { iv, authTag, data } = JSON.parse(payload);
  const key = deriveKey();

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'hex'));
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));
  let decrypted = decipher.update(data, 'hex', 'utf-8');
  decrypted += decipher.final('utf-8');

  const outputPath = absPath.replace('.md', '.decrypted');
  fs.writeFileSync(outputPath, decrypted, 'utf-8');

  return outputPath;
}

function updateManifest(file, camoType) {
  const manifestPath = path.join(process.cwd(), OVAULT_DIR, MANIFEST_FILE);
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  manifest.shards.push({ file, type: camoType, created: new Date().toISOString() });
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
}

module.exports = { seal, unlock, initRepo };
