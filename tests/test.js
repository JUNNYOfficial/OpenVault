const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { seal, unlock, initRepo } = require('../src/core');
const { camouflage, decamouflage } = require('../src/camouflage');

console.log('🧪 Running OpenVault MVP Tests...\n');

// Test 1: Camouflage round-trip
console.log('Test 1: Camouflage round-trip');
const secret = 'This is my secret diary entry. Password: hunter2';
const camo = camouflage(secret, 'markdown-tutorial');
const recovered = decamouflage(camo);
assert.strictEqual(recovered, secret, 'Camouflage round-trip failed');
console.log('✅ Pass\n');

// Test 2: Camouflage looks like normal markdown
console.log('Test 2: Camouflage looks legitimate');
assert(camo.includes('# Understanding React Hooks'), 'Missing header');
assert(camo.includes('useState'), 'Missing hook reference');
assert(camo.includes('```jsx'), 'Missing code blocks');
console.log('✅ Pass - looks like a real tutorial\n');

// Test 3: Seal and unlock (integration)
console.log('Test 3: Seal → Unlock integration');
const testDir = path.join(__dirname, 'tmp');
fs.mkdirSync(testDir, { recursive: true });
process.chdir(testDir);

// Init git repo for key derivation
require('child_process').execSync('git init && git config user.email "test@openvault.local" && git config user.name "Test"');
fs.writeFileSync('dummy.txt', 'hello');
require('child_process').execSync('git add . && git commit -m "init"');

initRepo(testDir);

const secretFile = path.join(testDir, 'my-secret.txt');
fs.writeFileSync(secretFile, 'My bank PIN is 1234\nSSH key: abc-def-ghi');

const sealedPath = seal(secretFile, 'markdown-tutorial');
console.log(`   Sealed to: ${sealedPath}`);

const unlockedPath = unlock(sealedPath);
console.log(`   Unlocked to: ${unlockedPath}`);

const decrypted = fs.readFileSync(unlockedPath, 'utf-8');
assert.strictEqual(decrypted, 'My bank PIN is 1234\nSSH key: abc-def-ghi', 'Decryption failed');
console.log('✅ Pass\n');

// Cleanup
fs.rmSync(testDir, { recursive: true, force: true });

console.log('🎉 All tests passed!');
