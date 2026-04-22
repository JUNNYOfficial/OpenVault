const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { seal, unlock, initRepo, listShards, removeShard } = require('../src/core');
const { camouflage, decamouflage } = require('../src/camouflage');
const { deriveKey, getSSHFingerprint } = require('../src/key-derivation');

console.log('🧪 Running OpenVault MVP Tests...\n');

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

// Test 1: Camouflage round-trip
test('Camouflage round-trip', () => {
  const secret = 'This is my secret diary entry. Password: hunter2';
  const camo = camouflage(secret, 'markdown-tutorial');
  const recovered = decamouflage(camo);
  assert.strictEqual(recovered, secret);
});

// Test 2: Camouflage looks like normal markdown
test('Camouflage looks legitimate', () => {
  const camo = camouflage('secret', 'markdown-tutorial');
  assert(camo.includes('# Understanding React Hooks'));
  assert(camo.includes('useState'));
  assert(camo.includes('```jsx'));
});

// Test 3: Python script camouflage
test('Python script camouflage', () => {
  const secret = 'import os; print(os.environ)';
  const camo = camouflage(secret, 'python-script');
  assert(camo.includes('#!/usr/bin/env python3'));
  assert(camo.includes('class CSVConverter'));
  const recovered = decamouflage(camo);
  assert.strictEqual(recovered, secret);
});

// Test 4: JS config camouflage
test('JS config camouflage', () => {
  const secret = '{"api_key": "secret123"}';
  const camo = camouflage(secret, 'js-config');
  assert(camo.includes('vite.config.js'));
  assert(camo.includes('export default'));
  const recovered = decamouflage(camo);
  assert.strictEqual(recovered, secret);
});

// Test 5: Key derivation is deterministic
test('Key derivation is deterministic', () => {
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

// Test 6: Key changes after new commit
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

// Test 7: Seal and unlock integration
test('Seal → Unlock integration', () => {
  const testDir = path.join(__dirname, 'tmp');
  fs.mkdirSync(testDir, { recursive: true });
  
  execSync('git init && git config user.email "test@openvault.local" && git config user.name "Test"', { cwd: testDir });
  fs.writeFileSync(path.join(testDir, 'dummy.txt'), 'hello');
  execSync('git add . && git commit -m "init"', { cwd: testDir });
  
  initRepo(testDir);
  
  const secretFile = path.join(testDir, 'my-secret.txt');
  fs.writeFileSync(secretFile, 'My bank PIN is 1234\nSSH key: abc-def-ghi');
  
  process.chdir(testDir);
  const sealedPath = seal(secretFile, 'markdown-tutorial');
  const unlockedPath = unlock(sealedPath);
  
  const decrypted = fs.readFileSync(unlockedPath, 'utf-8');
  assert.strictEqual(decrypted, 'My bank PIN is 1234\nSSH key: abc-def-ghi');
  
  process.chdir(__dirname);
  fs.rmSync(testDir, { recursive: true, force: true });
});

// Test 8: List shards
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
  seal(secretFile, 'markdown-tutorial');
  
  const shards = listShards(testDir);
  assert.strictEqual(shards.length, 1);
  assert.strictEqual(shards[0].originalName, 'secret1.txt');
  
  process.chdir(__dirname);
  fs.rmSync(testDir, { recursive: true, force: true });
});

// Test 9: Remove shard
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
  const sealedPath = seal(secretFile, 'markdown-tutorial');
  
  assert(fs.existsSync(sealedPath));
  removeShard(sealedPath, testDir);
  assert(!fs.existsSync(sealedPath));
  
  const shards = listShards(testDir);
  assert.strictEqual(shards.length, 0);
  
  process.chdir(__dirname);
  fs.rmSync(testDir, { recursive: true, force: true });
});

// Test 10: Different camouflage types produce different outputs
test('Different types produce different outputs', () => {
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
