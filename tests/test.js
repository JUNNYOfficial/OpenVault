const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { seal, unlock, initRepo, listShards, removeShard, verify } = require('../src/core');
const { camouflage, decamouflage } = require('../src/camouflage');
const { deriveKey, deriveKeyFromPassword, collectGitFactors } = require('../src/key-derivation');
const { generatePassword, generatePassphrase, calculateEntropy, generatePasswordDerivedKey } = require('../src/password-generator');
const { saveTextBackup, saveEncryptedBackup, restoreEncryptedBackup } = require('../src/backup');

console.log('🧪 Running OpenVault v0.4.0-beta Tests...\n');

let passCount = 0;
let failCount = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    passCount++;
  } catch (err) {
    console.log(`❌ ${name}`);
    console.log(`   ${err.message}`);
    failCount++;
  }
}

// ===== Password Generator Tests =====

test('Password has correct format (xxxx-xxxx-xxxx-xxxx)', () => {
  const pwd = generatePassword();
  assert.match(pwd, /^[a-zA-Z0-9]{4}(?:-[a-zA-Z0-9]{4}){4}$/);
});

test('Password entropy is ~119 bits', () => {
  const pwd = generatePassword();
  const entropy = calculateEntropy(pwd);
  assert(entropy >= 110 && entropy <= 130, `Entropy ${entropy} out of range`);
});

test('Generated passwords are unique', () => {
  const passwords = new Set();
  for (let i = 0; i < 20; i++) {
    passwords.add(generatePassword());
  }
  assert.strictEqual(passwords.size, 20, 'Should have 20 unique passwords');
});

test('Passphrase has correct word count', () => {
  const phrase = generatePassphrase(4);
  assert.strictEqual(phrase.split('-').length, 4);
});

test('Password-derived key is deterministic', () => {
  const key1 = deriveKeyFromPassword('test-password-123');
  const key2 = deriveKeyFromPassword('test-password-123');
  assert(key1.equals(key2));
});

test('Different passwords produce different keys', () => {
  const key1 = deriveKeyFromPassword('password-one');
  const key2 = deriveKeyFromPassword('password-two');
  assert(!key1.equals(key2));
});

// ===== Camouflage Tests =====

test('Camouflage round-trip', () => {
  const secret = 'This is my secret diary entry. Password: hunter2';
  const camo = camouflage(secret, 'markdown-tutorial');
  const recovered = decamouflage(camo);
  assert.strictEqual(recovered, secret);
});

test('Camouflage looks legitimate', () => {
  const camo = camouflage('secret', 'markdown-tutorial');
  assert(camo.includes('# Understanding React Hooks'));
  assert(camo.includes('useState'));
  assert(camo.includes('```jsx'));
});

test('Python script camouflage', () => {
  const secret = 'import os; print(os.environ)';
  const camo = camouflage(secret, 'python-script');
  assert(camo.includes('#!/usr/bin/env python3'));
  const recovered = decamouflage(camo);
  assert.strictEqual(recovered, secret);
});

test('JS config camouflage', () => {
  const secret = '{"api_key": "secret123"}';
  const camo = camouflage(secret, 'js-config');
  assert(camo.includes('vite.config.js'));
  const recovered = decamouflage(camo);
  assert.strictEqual(recovered, secret);
});

// ===== Key Derivation Tests =====

test('Git key derivation is deterministic', () => {
  const testDir = path.join(__dirname, 'tmp-key');
  fs.mkdirSync(testDir, { recursive: true });
  execSync('git init && git config user.email "test@openvault.local" && git config user.name "Test"', { cwd: testDir });
  fs.writeFileSync(path.join(testDir, 'dummy.txt'), 'hello');
  execSync('git add . && git commit -m "init"', { cwd: testDir });
  
  const key1 = deriveKey({ cwd: testDir });
  const key2 = deriveKey({ cwd: testDir });
  
  assert(key1.equals(key2), 'Keys should be identical for same repo state');
  
  fs.rmSync(testDir, { recursive: true, force: true });
});

test('Key changes after new commit', () => {
  const testDir = path.join(__dirname, 'tmp-key2');
  fs.mkdirSync(testDir, { recursive: true });
  execSync('git init && git config user.email "test@openvault.local" && git config user.name "Test"', { cwd: testDir });
  fs.writeFileSync(path.join(testDir, 'v1.txt'), 'version 1');
  execSync('git add . && git commit -m "v1"', { cwd: testDir });
  
  const key1 = deriveKey({ cwd: testDir });
  
  fs.writeFileSync(path.join(testDir, 'v2.txt'), 'version 2');
  execSync('git add . && git commit -m "v2"', { cwd: testDir });
  
  const key2 = deriveKey({ cwd: testDir });
  
  assert(!key1.equals(key2), 'Keys should differ after new commit');
  
  fs.rmSync(testDir, { recursive: true, force: true });
});

test('Password-enhanced key differs from git-only', () => {
  const testDir = path.join(__dirname, 'tmp-pwd-enhanced');
  fs.mkdirSync(testDir, { recursive: true });
  execSync('git init && git config user.email "test@openvault.local" && git config user.name "Test"', { cwd: testDir });
  fs.writeFileSync(path.join(testDir, 'dummy.txt'), 'hello');
  execSync('git add . && git commit -m "init"', { cwd: testDir });
  
  const gitKey = deriveKey({ cwd: testDir });
  const enhancedKey = deriveKey({ cwd: testDir, password: 'my-secret-pwd' });
  
  assert(!gitKey.equals(enhancedKey), 'Password-enhanced key should differ from git-only');
  
  fs.rmSync(testDir, { recursive: true, force: true });
});

// ===== Integration Tests =====

test('Seal → Unlock with git-only mode', () => {
  const testDir = path.join(__dirname, 'tmp');
  fs.mkdirSync(testDir, { recursive: true });
  execSync('git init && git config user.email "test@openvault.local" && git config user.name "Test"', { cwd: testDir });
  fs.writeFileSync(path.join(testDir, 'dummy.txt'), 'hello');
  execSync('git add . && git commit -m "init"', { cwd: testDir });
  
  initRepo(testDir);
  
  const secretFile = path.join(testDir, 'my-secret.txt');
  fs.writeFileSync(secretFile, 'My bank PIN is 1234\nSSH key: abc-def-ghi');
  
  process.chdir(testDir);
  const result = seal(secretFile, 'markdown-tutorial', { keyMode: 'git-only' });
  const sealedPath = result.path;
  const unlockedPath = unlock(sealedPath);
  
  const decrypted = fs.readFileSync(unlockedPath, 'utf-8');
  assert.strictEqual(decrypted, 'My bank PIN is 1234\nSSH key: abc-def-ghi');
  
  process.chdir(__dirname);
  fs.rmSync(testDir, { recursive: true, force: true });
});

test('Seal → Unlock with password-only mode', () => {
  const testDir = path.join(__dirname, 'tmp-pwd');
  fs.mkdirSync(testDir, { recursive: true });
  execSync('git init && git config user.email "test@openvault.local" && git config user.name "Test"', { cwd: testDir });
  fs.writeFileSync(path.join(testDir, 'dummy.txt'), 'hello');
  execSync('git add . && git commit -m "init"', { cwd: testDir });
  
  initRepo(testDir);
  
  const secretFile = path.join(testDir, 'secret.txt');
  fs.writeFileSync(secretFile, 'Password-only secret');
  
  const password = generatePassword();
  
  process.chdir(testDir);
  const result = seal(secretFile, 'markdown-tutorial', { keyMode: 'password-only', password });
  const sealedPath = result.path;
  
  // Unlock with correct password
  const unlockedPath = unlock(sealedPath, { password });
  const decrypted = fs.readFileSync(unlockedPath, 'utf-8');
  assert.strictEqual(decrypted, 'Password-only secret');
  
  // Unlock with wrong password should fail
  assert.throws(() => {
    unlock(sealedPath, { password: 'wrong-password' });
  });
  
  process.chdir(__dirname);
  fs.rmSync(testDir, { recursive: true, force: true });
});

test('Seal → Unlock with password-enhanced mode', () => {
  const testDir = path.join(__dirname, 'tmp-enhanced');
  fs.mkdirSync(testDir, { recursive: true });
  execSync('git init && git config user.email "test@openvault.local" && git config user.name "Test"', { cwd: testDir });
  fs.writeFileSync(path.join(testDir, 'dummy.txt'), 'hello');
  execSync('git add . && git commit -m "init"', { cwd: testDir });
  
  initRepo(testDir);
  
  const secretFile = path.join(testDir, 'secret.txt');
  fs.writeFileSync(secretFile, 'Enhanced secret');
  
  const password = generatePassword();
  
  process.chdir(testDir);
  const result = seal(secretFile, 'markdown-blog', { keyMode: 'password-enhanced', password });
  const sealedPath = result.path;
  
  const unlockedPath = unlock(sealedPath, { password });
  const decrypted = fs.readFileSync(unlockedPath, 'utf-8');
  assert.strictEqual(decrypted, 'Enhanced secret');
  
  process.chdir(__dirname);
  fs.rmSync(testDir, { recursive: true, force: true });
});

test('List shards', () => {
  const testDir = path.join(__dirname, 'tmp-list');
  fs.mkdirSync(testDir, { recursive: true });
  execSync('git init && git config user.email "test@openvault.local" && git config user.name "Test"', { cwd: testDir });
  fs.writeFileSync(path.join(testDir, 'dummy.txt'), 'hello');
  execSync('git add . && git commit -m "init"', { cwd: testDir });
  
  initRepo(testDir);
  
  process.chdir(testDir);
  const secretFile = path.join(testDir, 'secret1.txt');
  fs.writeFileSync(secretFile, 'secret 1');
  seal(secretFile, 'markdown-tutorial', { keyMode: 'git-only' });
  
  const shards = listShards(testDir);
  assert.strictEqual(shards.length, 1);
  assert.strictEqual(shards[0].originalName, 'secret1.txt');
  assert.strictEqual(shards[0].keyMode, 'git-only');
  
  process.chdir(__dirname);
  fs.rmSync(testDir, { recursive: true, force: true });
});

test('Remove shard', () => {
  const testDir = path.join(__dirname, 'tmp-rm');
  fs.mkdirSync(testDir, { recursive: true });
  execSync('git init && git config user.email "test@openvault.local" && git config user.name "Test"', { cwd: testDir });
  fs.writeFileSync(path.join(testDir, 'dummy.txt'), 'hello');
  execSync('git add . && git commit -m "init"', { cwd: testDir });
  
  initRepo(testDir);
  
  process.chdir(testDir);
  const secretFile = path.join(testDir, 'secret.txt');
  fs.writeFileSync(secretFile, 'secret');
  const result = seal(secretFile, 'markdown-tutorial', { keyMode: 'git-only' });
  
  assert(fs.existsSync(result.path));
  removeShard(result.path, testDir);
  assert(!fs.existsSync(result.path));
  
  const shards = listShards(testDir);
  assert.strictEqual(shards.length, 0);
  
  process.chdir(__dirname);
  fs.rmSync(testDir, { recursive: true, force: true });
});

test('TypeScript config camouflage', () => {
  const secret = '{"compilerOptions": {}}';
  const camo = camouflage(secret, 'typescript-config');
  assert(camo.includes('compilerOptions'));
  const recovered = decamouflage(camo);
  assert.strictEqual(recovered, secret);
});

test('Rust Cargo camouflage', () => {
  const secret = '[package]\nname = "test"';
  const camo = camouflage(secret, 'rust-cargo');
  assert(camo.includes('[package]'));
  const recovered = decamouflage(camo);
  assert.strictEqual(recovered, secret);
});

test('Go module camouflage', () => {
  const secret = 'module example.com/test';
  const camo = camouflage(secret, 'go-module');
  assert(camo.includes('module'));
  const recovered = decamouflage(camo);
  assert.strictEqual(recovered, secret);
});

test('Shell script camouflage', () => {
  const secret = '#!/bin/bash\necho "secret"';
  const camo = camouflage(secret, 'shell-script');
  assert(camo.includes('#!/bin/bash'));
  const recovered = decamouflage(camo);
  assert.strictEqual(recovered, secret);
});

test('Env file camouflage', () => {
  const secret = 'DB_PASSWORD=secret123';
  const camo = camouflage(secret, 'env-file');
  assert(camo.includes('DB_PASSWORD'));
  const recovered = decamouflage(camo);
  assert.strictEqual(recovered, secret);
});

test('Verify valid sealed file', () => {
  const testDir = path.join(__dirname, 'tmp-verify');
  fs.mkdirSync(testDir, { recursive: true });
  execSync('git init && git config user.email "test@openvault.local" && git config user.name "Test"', { cwd: testDir });
  fs.writeFileSync(path.join(testDir, 'dummy.txt'), 'hello');
  execSync('git add . && git commit -m "init"', { cwd: testDir });
  
  initRepo(testDir);
  
  process.chdir(testDir);
  const secretFile = path.join(testDir, 'secret.txt');
  fs.writeFileSync(secretFile, 'verify test secret');
  const result = seal(secretFile, 'markdown-tutorial', { keyMode: 'password-only', password: 'test-pwd-1234' });
  
  const verifyResult = verify(result.path);
  assert.strictEqual(verifyResult.valid, true);
  assert.strictEqual(verifyResult.originalName, 'secret.txt');
  assert.strictEqual(verifyResult.keyMode, 'password-only');
  assert.strictEqual(verifyResult.hasPassword, true);
  
  process.chdir(__dirname);
  fs.rmSync(testDir, { recursive: true, force: true });
});

test('Verify invalid file', () => {
  const testDir = path.join(__dirname, 'tmp-verify-invalid');
  fs.mkdirSync(testDir, { recursive: true });
  fs.writeFileSync(path.join(testDir, 'not-sealed.txt'), 'This is just a normal file');
  
  const verifyResult = verify(path.join(testDir, 'not-sealed.txt'));
  assert.strictEqual(verifyResult.valid, false);
  
  fs.rmSync(testDir, { recursive: true, force: true });
});

test('Text backup saves password correctly', () => {
  const testDir = path.join(__dirname, 'tmp-backup');
  fs.mkdirSync(testDir, { recursive: true });
  process.chdir(testDir);
  
  const backupPath = saveTextBackup('test-password-123');
  const content = fs.readFileSync(backupPath, 'utf-8');
  assert(content.includes('test-password-123'));
  assert(content.includes('WARNING'));
  
  process.chdir(__dirname);
  fs.rmSync(testDir, { recursive: true, force: true });
});

test('Encrypted backup round-trip', () => {
  const testDir = path.join(__dirname, 'tmp-enc-backup');
  fs.mkdirSync(testDir, { recursive: true });
  process.chdir(testDir);
  
  const originalPassword = 'my-secret-password';
  const recoveryPassword = 'recovery-key-456';
  
  const backupPath = saveEncryptedBackup(originalPassword, recoveryPassword);
  const restored = restoreEncryptedBackup(backupPath, recoveryPassword);
  
  assert.strictEqual(restored, originalPassword);
  
  process.chdir(__dirname);
  fs.rmSync(testDir, { recursive: true, force: true });
});

test('Encrypted backup fails with wrong recovery password', () => {
  const testDir = path.join(__dirname, 'tmp-enc-backup-wrong');
  fs.mkdirSync(testDir, { recursive: true });
  process.chdir(testDir);
  
  const backupPath = saveEncryptedBackup('secret', 'correct-recovery');
  
  assert.throws(() => {
    restoreEncryptedBackup(backupPath, 'wrong-recovery');
  });
  
  process.chdir(__dirname);
  fs.rmSync(testDir, { recursive: true, force: true });
});

test('Different camouflage types produce different outputs', () => {
  const secret = 'same secret';
  const camo1 = camouflage(secret, 'markdown-tutorial');
  const camo2 = camouflage(secret, 'markdown-blog');
  const camo3 = camouflage(secret, 'python-script');
  
  assert.notStrictEqual(camo1, camo2);
  assert.notStrictEqual(camo2, camo3);
  
  assert(camo1.includes('React'));
  assert(camo2.includes('performance'));
  assert(camo3.includes('python3'));
});

console.log(`\n📊 Results: ${passCount} passed, ${failCount} failed`);

if (failCount > 0) {
  process.exit(1);
} else {
  console.log('\n🎉 All tests passed!');
}
