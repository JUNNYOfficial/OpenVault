const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { camouflage, decamouflage } = require('./camouflage');
const { deriveKey } = require('./key-derivation');

const OVAULT_DIR = '.openvault';
const MANIFEST_FILE = 'manifest.json';

// Default output paths for different camouflage types
const OUTPUT_PATHS = {
  'markdown-tutorial': 'docs/react-hooks-guide.md',
  'markdown-blog': 'docs/web-performance-tips.md',
  'python-script': 'scripts/csv_converter.py',
  'js-config': 'config/vite.config.js'
};

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

function seal(filePath, camoType = 'markdown-tutorial', options = {}) {
  const absPath = path.resolve(filePath);
  if (!fs.existsSync(absPath)) {
    throw new Error(`File not found: ${absPath}`);
  }

  const plaintext = fs.readFileSync(absPath, 'utf-8');
  const key = deriveKey(options);

  // Encrypt
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(plaintext, 'utf-8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  const payload = JSON.stringify({
    iv: iv.toString('hex'),
    authTag,
    data: encrypted,
    originalName: path.basename(filePath),
    sealedAt: new Date().toISOString()
  });

  // Camouflage
  const camoResult = camouflage(payload, camoType);

  // Write to appropriate path
  const outputName = options.output || OUTPUT_PATHS[camoType] || `docs/sealed-${Date.now()}.md`;
  const outputPath = path.join(process.cwd(), outputName);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, camoResult, 'utf-8');

  // Update manifest
  updateManifest(outputName, camoType, path.basename(filePath));

  return outputPath;
}

function unlock(filePath, options = {}) {
  const absPath = path.resolve(filePath);
  if (!fs.existsSync(absPath)) {
    throw new Error(`File not found: ${absPath}`);
  }

  const camoContent = fs.readFileSync(absPath, 'utf-8');
  const payload = decamouflage(camoContent);

  const { iv, authTag, data, originalName } = JSON.parse(payload);
  const key = deriveKey(options);

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'hex'));
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));
  let decrypted = decipher.update(data, 'hex', 'utf-8');
  decrypted += decipher.final('utf-8');

  const outputName = options.output || (originalName ? `${originalName}.decrypted` : `${path.basename(filePath)}.decrypted`);
  const outputPath = path.join(path.dirname(absPath), outputName);
  fs.writeFileSync(outputPath, decrypted, 'utf-8');

  return outputPath;
}

function listShards(cwd) {
  const manifestPath = path.join(cwd || process.cwd(), OVAULT_DIR, MANIFEST_FILE);
  if (!fs.existsSync(manifestPath)) {
    return [];
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  return manifest.shards || [];
}

function removeShard(filePath, cwd) {
  const manifestPath = path.join(cwd || process.cwd(), OVAULT_DIR, MANIFEST_FILE);
  if (!fs.existsSync(manifestPath)) {
    throw new Error('OpenVault not initialized in this directory');
  }
  
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  const absPath = path.resolve(filePath);
  
  // Remove from manifest
  manifest.shards = manifest.shards.filter(s => path.resolve(s.file) !== absPath);
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  
  // Optionally delete the file
  if (fs.existsSync(absPath)) {
    fs.unlinkSync(absPath);
  }
  
  return true;
}

function updateManifest(file, camoType, originalName) {
  const manifestPath = path.join(process.cwd(), OVAULT_DIR, MANIFEST_FILE);
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  manifest.shards.push({
    file,
    type: camoType,
    originalName,
    created: new Date().toISOString()
  });
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
}

module.exports = { seal, unlock, initRepo, listShards, removeShard };
