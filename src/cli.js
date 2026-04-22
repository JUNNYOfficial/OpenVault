#!/usr/bin/env node

const { program } = require('commander');
const fs = require('fs');
const path = require('path');
const { seal, unlock, initRepo } = require('./core');

program
  .name('ov')
  .description('OpenVault - Semantic-preserving encryption for public repos')
  .version('0.1.0');

program
  .command('init')
  .description('Initialize OpenVault in current repository')
  .action(() => {
    initRepo(process.cwd());
    console.log('✅ OpenVault initialized. Run `ov seal <file>` to encrypt.');
  });

program
  .command('seal <file>')
  .description('Encrypt a file with semantic camouflage')
  .option('-t, --type <type>', 'camouflage type', 'markdown-tutorial')
  .action((file, options) => {
    const result = seal(file, options.type);
    console.log(`🔒 Sealed: ${result}`);
  });

program
  .command('unlock <file>')
  .description('Decrypt a sealed file')
  .action((file) => {
    const result = unlock(file);
    console.log(`🔓 Unlocked: ${result}`);
  });

program.parse();
