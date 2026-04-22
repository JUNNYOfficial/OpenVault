#!/usr/bin/env node

const { program } = require('commander');
const fs = require('fs');
const path = require('path');
const { seal, unlock, initRepo, listShards, removeShard } = require('./core');

program
  .name('ov')
  .description('OpenVault - Semantic-preserving encryption for public repos')
  .version('0.1.0');

program
  .command('init')
  .description('Initialize OpenVault in current repository')
  .action(() => {
    initRepo(process.cwd());
    console.log('✅ OpenVault initialized.');
    console.log('   Run `ov seal <file>` to encrypt and camouflage.');
  });

program
  .command('seal <file>')
  .description('Encrypt a file with semantic camouflage')
  .option('-t, --type <type>', 'camouflage type (markdown-tutorial, markdown-blog, python-script, js-config)', 'markdown-tutorial')
  .option('-o, --output <path>', 'custom output path')
  .option('--ssh-key <fingerprint>', 'SSH key fingerprint for key derivation')
  .action((file, options) => {
    try {
      const sealOptions = {};
      if (options.output) sealOptions.output = options.output;
      if (options.sshKey) sealOptions.sshKey = options.sshKey;
      
      const result = seal(file, options.type, sealOptions);
      console.log(`🔒 Sealed: ${result}`);
      console.log(`   Camouflage: ${options.type}`);
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
  .action((file, options) => {
    try {
      const unlockOptions = {};
      if (options.output) unlockOptions.output = options.output;
      if (options.sshKey) unlockOptions.sshKey = options.sshKey;
      
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
      console.log(`  ${i + 1}. ${shard.file}`);
      console.log(`     Type: ${shard.type}`);
      console.log(`     Original: ${shard.originalName || 'unknown'}`);
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

program.parse();
