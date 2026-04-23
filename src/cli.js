#!/usr/bin/env node

const { program } = require('commander');
const fs = require('fs');
const path = require('path');
const { seal, unlock, initRepo, listShards, removeShard, verify } = require('./core');
const { generatePassword, generatePassphrase, calculateEntropy } = require('./password-generator');
const { checkManager, savePassword, getPassword, listAvailableManagers, autoSavePassword } = require('./password-manager');
const {
  generateQRBackup,
  generateQRTerminal,
  generateQRCompact,
  saveTextBackup,
  saveEncryptedBackup,
  restoreEncryptedBackup,
  generateFullBackup,
  printPasswordForCopy
} = require('./backup');

program
  .name('ov')
  .description('OpenVault - Semantic-preserving encryption for public repos')
  .version('0.4.0-beta');

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
  .option('-t, --type <type>', 'camouflage type', 'markdown-tutorial')
  .option('-o, --output <path>', 'custom output path')
  .option('--ssh-key <fingerprint>', 'SSH key fingerprint for key derivation')
  .option('-m, --mode <mode>', 'key mode (git-only, password-enhanced, password-only)', 'git-only')
  .option('-p, --password <password>', 'use specific password (or auto-generate if empty)')
  .option('--generate-password', 'generate and display an Apple-style strong password')
  .option('--backup', 'automatically create backup after sealing')
  .option('--backup-qr', 'create QR code backup')
  .option('--backup-encrypted', 'create encrypted backup with recovery password')
  .action(async (file, options) => {
    try {
      const sealOptions = {
        keyMode: options.mode
      };
      
      if (options.output) sealOptions.output = options.output;
      if (options.sshKey) sealOptions.sshKey = options.sshKey;
      
      let generatedPassword = null;
      
      // Handle password modes
      if (options.generatePassword || options.mode === 'password-only' || options.mode === 'password-enhanced') {
        if (!options.password) {
          generatedPassword = generatePassword();
          sealOptions.password = generatedPassword;
        } else {
          sealOptions.password = options.password;
        }
      }
      
      const result = seal(file, options.type, sealOptions);
      
      console.log(`🔒 Sealed: ${result.path}`);
      console.log(`   Camouflage: ${options.type}`);
      console.log(`   Key mode: ${result.keyMode}`);
      
      // Display password if generated
      if (result.generatedPassword || generatedPassword) {
        const pwd = result.generatedPassword || generatedPassword;
        console.log('');
        console.log(printPasswordForCopy(pwd));
        console.log(`   Entropy: ${calculateEntropy(pwd).toFixed(1)} bits`);
        console.log('');
        console.log('   ⚠️  SAVE THIS PASSWORD NOW!');
        console.log('   It will NOT be shown again and CANNOT be recovered.');
        console.log('');
        
        // Try to save to password manager
        const pmResult = autoSavePassword(`OpenVault: ${path.basename(file)}`, pwd);
        if (pmResult.success) {
          console.log('   ✅ Saved to password manager');
        }
        
        // Auto-backup if requested
        if (options.backup || options.backupQr || options.backupEncrypted) {
          console.log('📦 Creating backup...');
          
          const backupOptions = {
            outputDir: path.join(process.cwd(), '.openvault/backups', `backup-${Date.now()}`)
          };
          
          if (options.backupEncrypted) {
            console.log('   Creating encrypted backup...');
            backupOptions.recoveryPassword = generatedPassword;
          }
          
          const backup = await generateFullBackup(pwd, backupOptions);
          console.log(`   Backup saved to: ${backup.directory}`);
          console.log('   Files:');
          backup.files.forEach(f => {
            const icon = f.type === 'qr-code' ? '📱' : f.type === 'encrypted' ? '🔐' : f.type === 'text' ? '📝' : '📋';
            console.log(`     ${icon} ${path.basename(f.path)}`);
          });
          
          // Show QR in terminal if requested
          if (options.backupQr) {
            console.log('');
            console.log('📱 QR Code (scan with phone):');
            const qrTerminal = await generateQRTerminal(pwd);
            console.log(qrTerminal);
          }
        }
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
  .command('verify <file>')
  .description('Verify if a file is a valid OpenVault sealed file')
  .action((file) => {
    try {
      const result = verify(file);
      
      if (result.valid) {
        console.log('✅ Valid OpenVault sealed file');
        console.log(`   Original: ${result.originalName || 'unknown'}`);
        console.log(`   Key mode: ${result.keyMode}`);
        console.log(`   Password: ${result.hasPassword ? 'required' : 'not required'}`);
        if (result.sealedAt) {
          console.log(`   Sealed:   ${new Date(result.sealedAt).toLocaleString()}`);
        }
      } else {
        console.log('❌ Not a valid OpenVault sealed file');
        console.log(`   Reason: ${result.error}`);
        process.exit(1);
      }
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
      { name: 'js-config', desc: 'Vite build configuration', ext: '.js' },
      { name: 'dockerfile', desc: 'Docker container config', ext: '' },
      { name: 'github-action', desc: 'CI/CD workflow', ext: '.yml' },
      { name: 'json-config', desc: 'Package/Project config', ext: '.json' },
      { name: 'typescript-config', desc: 'TypeScript compiler config', ext: '.json' },
      { name: 'rust-cargo', desc: 'Rust package manifest', ext: '.toml' },
      { name: 'go-module', desc: 'Go module definition', ext: '.mod' },
      { name: 'shell-script', desc: 'Bash deployment script', ext: '.sh' },
      { name: 'env-file', desc: 'Environment variables example', ext: '' }
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
  .command('password-manager')
  .alias('pm')
  .description('Password manager integration')
  .option('--save <title>', 'save password to manager')
  .option('--get <title>', 'get password from manager')
  .option('--manager <name>', 'password manager (onepassword, bitwarden, keepass, lastpass)', 'onepassword')
  .option('-p, --password <password>', 'password to save')
  .option('--vault <name>', 'vault name (1Password only)', 'Private')
  .option('--db-path <path>', 'KeePass database path')
  .option('--key-file <path>', 'KeePass key file path')
  .option('--username <name>', 'LastPass username')
  .action((options) => {
    if (options.save) {
      if (!options.password) {
        console.error('❌ Error: --password required');
        process.exit(1);
      }
      const result = savePassword(options.manager, options.save, options.password, { 
        vault: options.vault,
        dbPath: options.dbPath,
        keyFile: options.keyFile,
        username: options.username
      });
      if (result.success) {
        console.log(`✅ Saved to ${options.manager}: ${options.save}`);
      } else {
        console.error(`❌ Failed: ${result.error}`);
      }
    } else if (options.get) {
      const result = getPassword(options.manager, options.get, { 
        vault: options.vault,
        dbPath: options.dbPath,
        keyFile: options.keyFile
      });
      if (result.success) {
        console.log(`🔓 Password: ${result.password}`);
      } else {
        console.error(`❌ Failed: ${result.error}`);
      }
    } else {
      console.log('🔐 Password Manager Status:\n');
      const managers = listAvailableManagers();
      Object.entries(managers).forEach(([key, status]) => {
        const icon = status.available ? '✅' : '❌';
        console.log(`  ${icon} ${status.name || key}`);
        if (status.version) console.log(`     Version: ${status.version}`);
        if (status.error) console.log(`     ${status.error}`);
      });
      console.log('\n💡 Install a password manager CLI to auto-save passwords');
    }
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

// ===== Backup Commands =====

program
  .command('backup <password>')
  .description('Create a backup of your password')
  .option('--qr', 'generate QR code for scanning')
  .option('--text', 'save as plain text file')
  .option('--encrypted', 'save as encrypted file (requires recovery password)')
  .option('--full', 'create full backup package (QR + text + instructions)')
  .option('-o, --output <path>', 'custom output path')
  .option('--recovery-password <pwd>', 'recovery password for encrypted backup')
  .action(async (password, options) => {
    try {
      if (options.full) {
        console.log('📦 Creating full backup package...\n');
        const backupOptions = {
          outputDir: options.output || path.join(process.cwd(), '.openvault/backups', `backup-${Date.now()}`)
        };
        if (options.recoveryPassword) {
          backupOptions.recoveryPassword = options.recoveryPassword;
        }
        
        const backup = await generateFullBackup(password, backupOptions);
        
        console.log(`✅ Backup package created: ${backup.directory}\n`);
        console.log('Files:');
        backup.files.forEach(f => {
          const icon = f.type === 'qr-code' ? '📱' : f.type === 'encrypted' ? '🔐' : f.type === 'text' ? '📝' : '📋';
          console.log(`  ${icon} ${path.basename(f.path)}`);
        });
        console.log('');
        console.log('⚠️  Security reminders:');
        console.log('   • Store QR code in your phone\'s secure notes');
        console.log('   • Save password to 1Password/Bitwarden');
        console.log('   • Keep encrypted backup on USB drive');
        console.log('   • Delete backup directory after secure storage');
        console.log('   • NEVER commit backup files to Git');
      } else if (options.qr) {
        console.log('📱 Generating QR Code...\n');
        const outputPath = options.output || path.join(process.cwd(), '.openvault/backups', `qr-${Date.now()}.png`);
        await generateQRBackup(password, { output: outputPath });
        console.log(`✅ QR Code saved: ${outputPath}`);
        console.log('');
        console.log('Scan with your phone camera:');
        const qrTerminal = await generateQRTerminal(password);
        console.log(qrTerminal);
      } else if (options.text) {
        const outputPath = saveTextBackup(password, { output: options.output });
        console.log(`📝 Text backup saved: ${outputPath}`);
        console.log('⚠️  Remember to delete this file after secure storage!');
      } else if (options.encrypted) {
        if (!options.recoveryPassword) {
          console.error('❌ Error: --recovery-password required for encrypted backup');
          process.exit(1);
        }
        const outputPath = saveEncryptedBackup(password, options.recoveryPassword, { output: options.output });
        console.log(`🔐 Encrypted backup saved: ${outputPath}`);
        console.log('   Restore with: ov restore <file> -p <recovery-password>');
      } else {
        // Default: show QR in terminal
        console.log('📱 Password QR Code:\n');
        const qrTerminal = await generateQRTerminal(password);
        console.log(qrTerminal);
        console.log('');
        console.log('💡 Tips:');
        console.log('   • Scan with your phone camera');
        console.log('   • Use --qr to save as PNG file');
        console.log('   • Use --full for complete backup package');
        console.log('   • Use --encrypted for encrypted backup');
      }
    } catch (err) {
      console.error(`❌ Error: ${err.message}`);
      process.exit(1);
    }
  });

program
  .command('restore <file>')
  .description('Restore password from encrypted backup')
  .requiredOption('-p, --password <password>', 'recovery password')
  .action((file, options) => {
    try {
      const password = restoreEncryptedBackup(file, options.password);
      console.log('🔓 Password restored successfully!\n');
      console.log(printPasswordForCopy(password));
    } catch (err) {
      console.error(`❌ Error: ${err.message}`);
      process.exit(1);
    }
  });

program.parse();
