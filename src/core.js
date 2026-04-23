const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { camouflage, decamouflage } = require('./camouflage');
const { deriveKey } = require('./key-derivation');
const { generatePassword } = require('./password-generator');

const OVAULT_DIR = '.openvault';
const MANIFEST_FILE = 'manifest.json';
const PASSWORD_FILE = '.ovault-key'; // Stores encrypted password hint (not the password itself)

// Default output paths for different camouflage types
const OUTPUT_PATHS = {
  'markdown-tutorial': 'docs/react-hooks-guide.md',
  'markdown-blog': 'docs/web-performance-tips.md',
  'python-script': 'scripts/csv_converter.py',
  'js-config': 'config/vite.config.js',
  'dockerfile': 'Dockerfile',
  'github-action': '.github/workflows/ci.yml',
  'json-config': 'package.json',
  'typescript-config': 'tsconfig.json',
  'rust-cargo': 'Cargo.toml',
  'go-module': 'go.mod',
  'shell-script': 'scripts/deploy.sh',
  'env-file': '.env.example'
};

function initRepo(cwd) {
  const ovDir = path.join(cwd, OVAULT_DIR);
  if (!fs.existsSync(ovDir)) {
    fs.mkdirSync(ovDir, { recursive: true });
  }
  const manifest = {
    version: '0.4.0-beta',
    cipher: 'aes-256-gcm',
    kdf: 'pbkdf2',
    keyMode: 'git-only', // git-only | password-enhanced | password-only
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

  // Validate camouflage type
  const validTypes = Object.keys(require('./camouflage').TEMPLATES || {});
  if (!validTypes.includes(camoType)) {
    throw new Error(`Unknown camouflage type: ${camoType}. Valid types: ${validTypes.join(', ')}`);
  }

  const plaintext = fs.readFileSync(absPath, 'utf-8');
  
  // Determine key mode and generate password if needed
  let keyMode = options.keyMode || 'git-only';
  let userPassword = options.password;
  let generatedPassword = null;
  
  if (keyMode === 'password-only' || keyMode === 'password-enhanced') {
    if (!userPassword) {
      // Generate an Apple-style strong password
      generatedPassword = generatePassword();
      userPassword = generatedPassword;
    }
  }
  
  const key = deriveKey({
    ...options,
    password: userPassword,
    passwordOnly: keyMode === 'password-only'
  });

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
    sealedAt: new Date().toISOString(),
    keyMode: keyMode,
    hasPassword: !!userPassword
  });

  // Camouflage
  const camoResult = camouflage(payload, camoType);

  // Write to appropriate path
  const outputName = options.output || OUTPUT_PATHS[camoType] || `docs/sealed-${Date.now()}.md`;
  const outputPath = path.join(process.cwd(), outputName);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, camoResult, 'utf-8');

  // Update manifest
  updateManifest(outputName, camoType, path.basename(filePath), keyMode);

  // Return result with password info
  const result = {
    path: outputPath,
    keyMode: keyMode
  };
  
  if (generatedPassword) {
    result.generatedPassword = generatedPassword;
    result.warning = '⚠️  SAVE THIS PASSWORD - it will not be shown again!';
  }
  
  return result;
}

function unlock(filePath, options = {}) {
  const absPath = path.resolve(filePath);
  if (!fs.existsSync(absPath)) {
    throw new Error(`File not found: ${absPath}`);
  }

  const camoContent = fs.readFileSync(absPath, 'utf-8');
  const payload = decamouflage(camoContent);

  const { iv, authTag, data, originalName, keyMode, hasPassword } = JSON.parse(payload);
  
  // Determine how to derive key
  let key;
  if (keyMode === 'password-only') {
    if (!options.password) {
      throw new Error('This file was sealed with password-only mode. Use --password to unlock.');
    }
    key = deriveKey({
      ...options,
      password: options.password,
      passwordOnly: true
    });
  } else if (keyMode === 'password-enhanced' && hasPassword) {
    if (!options.password) {
      throw new Error('This file was sealed with password-enhanced mode. Use --password to unlock.');
    }
    key = deriveKey({
      ...options,
      password: options.password
    });
  } else {
    key = deriveKey(options);
  }

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
  
  manifest.shards = manifest.shards.filter(s => path.resolve(s.file) !== absPath);
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  
  if (fs.existsSync(absPath)) {
    fs.unlinkSync(absPath);
  }
  
  return true;
}

function updateManifest(file, camoType, originalName, keyMode = 'git-only') {
  const manifestPath = path.join(process.cwd(), OVAULT_DIR, MANIFEST_FILE);
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  
  // Remove existing entry for same file to avoid duplicates
  manifest.shards = manifest.shards.filter(s => s.file !== file);
  
  manifest.shards.push({
    file,
    type: camoType,
    originalName,
    keyMode,
    created: new Date().toISOString()
  });
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
}

function verify(filePath) {
  try {
    const absPath = path.resolve(filePath);
    if (!fs.existsSync(absPath)) {
      return { valid: false, error: 'File not found' };
    }

    const camoContent = fs.readFileSync(absPath, 'utf-8');
    const payload = decamouflage(camoContent);
    const parsed = JSON.parse(payload);

    // Validate required fields
    if (!parsed.iv || !parsed.authTag || !parsed.data) {
      return { valid: false, error: 'Invalid payload structure' };
    }

    return {
      valid: true,
      originalName: parsed.originalName,
      keyMode: parsed.keyMode || 'unknown',
      hasPassword: parsed.hasPassword || false,
      sealedAt: parsed.sealedAt
    };
  } catch (err) {
    return { valid: false, error: err.message };
  }
}

module.exports = { seal, unlock, initRepo, listShards, removeShard, verify };
