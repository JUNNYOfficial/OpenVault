#!/usr/bin/env node

const { program } = require('commander');
const fs = require('fs');
const path = require('path');
const { seal, unlock, initRepo, listShards, removeShard } = require('./core');
const { generatePassword, generatePassphrase, calculateEntropy } = require('./password-generator');

program
  .name('ov')
  .description('OpenVault - Semantic-preserving encryption for public repos')
  .version('0.2.0');

program
  .command('init')
  .description('Initialize OpenVault in current repository')
  .option('-m, --mode <mode>', 'default key mode (git-only, password-enhanced, password-only)', 'git-only')
  .action((options) => {
    initRepo(process.cwd());
    console.log('✅ OpenVault initialized.');
    console.log(`   Default key mode: ${options.mode}`);
    console.log('   Run `ov seal <file>` to encrypt and camouflage.');
  });

program
  .command('seal <file>')
  .description('Encrypt a file with semantic camouflage')
  .option('-t, --type <type>', 'camouflage type (markdown-tutorial, markdown-blog, python-script, js-config)', 'markdown-tutorial')
  .option('-o, --output <path>', 'custom output path')
  .option('--ssh-key <fingerprint>', 'SSH key fingerprint for key derivation')
  .option('-m, --mode <mode>', 'key mode (git-only, password-enhanced, password-only)', 'git-only')
  .option('-p, --password <password>', 'use specific password (or auto-generate if empty)')
  .option('--generate-password', 'generate and display an Apple-style strong password')
  .action((file, options) => {
    try {
      const sealOptions = {
        keyMode: options.mode
      };
      
      if (options.output) sealOptions.output = options.output;
      if (options.sshKey) sealOptions.sshKey = options.sshKey;
      
      // Handle password modes
      if (options.generatePassword || options.mode === 'password-only' || options.mode === 'password-enhanced') {
        if (!options.password) {
          // Auto-generate a strong password
          const pwd = generatePassword();
          sealOptions.password = pwd;
          console.log('');
          console.log('🔐 Generated Apple-style strong password:');
          console.log('');
          console.log('   ┌─────────────────────────────────────┐');
          console.log(`   │  ${pwd}              │`);
          console.log('   └─────────────────────────────────────┘');
          console.log('');
          console.log(`   Entropy: ${calculateEntropy(pwd).toFixed(1)} bits`);
          console.log('');
          console.log('   ⚠️  SAVE THIS PASSWORD NOW!');
          console.log('   It will NOT be shown again and CANNOT be recovered.');
          console.log('   Store it in your password manager (1Password, Bitwarden, etc.)');
          console.log('');
        } else {
          sealOptions.password = options.password;
        }
      }
      
      const result = seal(file, options.type, sealOptions);
      
      console.log(`🔒 Sealed: ${result.path}`);
      console.log(`   Camouflage: ${options.type}`);
      console.log(`   Key mode: ${result.keyMode}`);
      
      if (result.generatedPassword) {
        console.log(`   Password: ${result.generatedPassword}`);
      }
      
      if (result.warning) {
        console.log(`   ${result.warning}`);
      }
    } catch (err) {
      console.error(`❌ Error: ${err.message}`);
      process.exit(1);
    }
  });

program
  .command('unlock <file>')
  .description('Decrypt a sealed file')
  .option('-o, --output <path>', 'custom output path')
  .option('--ssh-key <fingerprint>', 'SSH key fingerprint for key derivation')
  .option('-p, --password <password>', 'password for password-protected files')
  .action((file, options) => {
    try {
      const unlockOptions = {};
      if (options.output) unlockOptions.output = options.output;
      if (options.sshKey) unlockOptions.sshKey = options.sshKey;
      if (options.password) unlockOptions.password = options.password;
      
      const result = unlock(file, unlockOptions);
      console.log(`🔓 Unlocked: ${result}`);
    } catch (err) {
      console.error(`❌ Error: ${err.message}`);
      process.exit(1);
    }
  });

program
  .command('list')
  .alias('ls')
  .description('List all sealed shards in this repository')
  .action(() => {
    const shards = listShards(process.cwd());
    if (shards.length === 0) {
      console.log('📭 No sealed files found.');
      console.log('   Run `ov seal <file>` to create one.');
      return;
    }
    
    console.log(`📦 Found ${shards.length} sealed file(s):\n`);
    shards.forEach((shard, i) => {
      const modeIcon = shard.keyMode === 'password-only' ? '🔐' : 
                       shard.keyMode === 'password-enhanced' ? '🔒' : '🔓';
      console.log(`  ${i + 1}. ${shard.file}`);
      console.log(`     Type: ${shard.type}`);
      console.log(`     Original: ${shard.originalName || 'unknown'}`);
      console.log(`     Key mode: ${modeIcon} ${shard.keyMode}`);
      console.log(`     Created: ${shard.created}`);
      console.log('');
    });
  });

program
  .command('remove <file>')
  .alias('rm')
  .description('Remove a sealed shard from the repository')
  .action((file) => {
    try {
      removeShard(file, process.cwd());
      console.log(`🗑️  Removed: ${file}`);
    } catch (err) {
      console.error(`❌ Error: ${err.message}`);
      process.exit(1);
    }
  });

program
  .command('types')
  .description('List available camouflage types')
  .action(() => {
    console.log('🎭 Available camouflage types:\n');
    const types = [
      { name: 'markdown-tutorial', desc: 'React Hooks tutorial (default)', ext: '.md' },
      { name: 'markdown-blog', desc: 'Web performance blog post', ext: '.md' },
      { name: 'python-script', desc: 'Python CSV converter script', ext: '.py' },
      { name: 'js-config', desc: 'Vite build configuration', ext: '.js' }
    ];
    types.forEach(t => {
      console.log(`  ${t.name.padEnd(20)} ${t.desc} (${t.ext})`);
    });
  });

program
  .command('password')
  .alias('pwd')
  .description('Generate Apple-style strong passwords')
  .option('-c, --count <n>', 'number of passwords to generate', '1')
  .option('--passphrase', 'generate a memorable passphrase instead')
  .option('--words <n>', 'number of words in passphrase', '4')
  .action((options) => {
    const count = parseInt(options.count, 10);
    
    if (options.passphrase) {
      console.log('🎲 Memorable Passphrases:\n');
      for (let i = 0; i < count; i++) {
        const phrase = generatePassphrase(parseInt(options.words, 10));
        console.log(`  ${phrase}  (${calculateEntropy(phrase).toFixed(1)} bits)`);
      }
    } else {
      console.log('🔐 Apple-Style Strong Passwords:\n');
      for (let i = 0; i < count; i++) {
        const pwd = generatePassword();
        console.log(`  ${pwd}  (${calculateEntropy(pwd).toFixed(1)} bits)`);
      }
    }
    console.log('');
    console.log('💡 Use with: ov seal <file> -p <password>');
    console.log('   Or let OpenVault auto-generate one for you!');
  });

program
  .command('key-info')
  .description('Show current key derivation factors')
  .action(() => {
    const { collectGitFactors, getSSHFingerprint } = require('./key-derivation');
    
    try {
      const factors = collectGitFactors(process.cwd());
      console.log('🔑 Current Key Derivation Factors:\n');
      console.log(`  Repository: ${factors.repoName}`);
      console.log(`  Commit:     ${factors.commitHash.slice(0, 12)}...`);
      console.log(`  Identity:   ${factors.userEmail}`);
      console.log(`  SSH Key:    ${factors.sshFingerprint || 'not found'}`);
      console.log('');
      console.log('  Key modes:');
      console.log('    🔓 git-only         - Derived from Git state only');
      console.log('    🔒 password-enhanced - Git state + your password');
      console.log('    🔐 password-only    - Password only (portable across devices)');
    } catch (err) {
      console.log('⚠️  Not in a Git repository. Key derivation will use fallback mode.');
    }
  });

program.parse();
