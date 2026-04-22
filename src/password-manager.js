/**
 * Password Manager Integration
 * 
 * Supports:
 * - 1Password CLI (op)
 * - Bitwarden CLI (bw)
 * - KeePass CLI (kpcli)
 * - LastPass CLI (lpass)
 * 
 * Allows storing generated passwords directly to password managers.
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const MANAGERS = {
  onepassword: {
    name: '1Password',
    cli: 'op',
    checkCmd: 'op --version',
    saveCmd: (title, password, vault) => 
      `op item create --category=password --title="${title}" --vault="${vault}" password="${password}"`,
    getCmd: (title, vault) =>
      `op item get "${title}" --vault="${vault}" --fields=password`
  },
  bitwarden: {
    name: 'Bitwarden',
    cli: 'bw',
    checkCmd: 'bw --version',
    saveCmd: (title, password) => {
      const item = JSON.stringify({
        type: 2,
        name: title,
        login: { password }
      });
      return { cmd: 'bw', args: ['create', 'item'], stdin: item };
    },
    getCmd: (title) =>
      `bw list items --search "${title}" | jq -r '.[0].login.password'`
  },
  keepass: {
    name: 'KeePass',
    cli: 'kpcli',
    checkCmd: 'which kpcli',
    saveCmd: (title, password, dbPath, keyFile) => {
      // kpcli uses interactive commands
      const commands = [
        `open ${dbPath}${keyFile ? ' -keyfile:' + keyFile : ''}`,
        `add -t "${title}" -p "${password}"`,
        'save',
        'quit'
      ];
      return { cmd: 'kpcli', args: ['-kdb:' + dbPath], stdin: commands.join('\n') };
    },
    getCmd: (title, dbPath, keyFile) => {
      return `kpcli -kdb:${dbPath} -command:"get -t \\"${title}\\""`;
    }
  },
  lastpass: {
    name: 'LastPass',
    cli: 'lpass',
    checkCmd: 'lpass --version',
    saveCmd: (title, password, username = '') => {
      if (username) {
        return `lpass add --non-interactive --username="${username}" --password="${password}" "${title}"`;
      }
      return `lpass add --non-interactive --password="${password}" "${title}"`;
    },
    getCmd: (title) =>
      `lpass show --password "${title}"`
  }
};

/**
 * Check if a password manager CLI is installed
 */
function checkManager(manager) {
  const config = MANAGERS[manager];
  if (!config) {
    return { available: false, error: `Unknown manager: ${manager}` };
  }

  try {
    const version = execSync(config.checkCmd, { encoding: 'utf-8' }).trim();
    return { available: true, version, name: config.name };
  } catch (err) {
    return { 
      available: false, 
      error: `${config.name} CLI not found. Install: ${getInstallUrl(manager)}` 
    };
  }
}

/**
 * Get installation URL for password manager CLI
 */
function getInstallUrl(manager) {
  const urls = {
    onepassword: 'https://developer.1password.com/docs/cli/get-started/',
    bitwarden: 'https://bitwarden.com/help/cli/',
    keepass: 'https://kpcli.sourceforge.io/install.html',
    lastpass: 'https://github.com/lastpass/lastpass-cli'
  };
  return urls[manager] || 'https://example.com';
}

/**
 * Save password to password manager
 */
function savePassword(manager, title, password, options = {}) {
  const config = MANAGERS[manager];
  if (!config) {
    return { success: false, error: `Unknown manager: ${manager}` };
  }

  const check = checkManager(manager);
  if (!check.available) {
    return check;
  }

  try {
    if (manager === 'onepassword') {
      const vault = options.vault || 'Private';
      const cmd = config.saveCmd(title, password, vault);
      const result = execSync(cmd, { encoding: 'utf-8' });
      return { success: true, result: result.trim() };
      
    } else if (manager === 'bitwarden') {
      try {
        execSync('bw login --check', { encoding: 'utf-8' });
      } catch {
        return { 
          success: false, 
          error: 'Bitwarden not logged in. Run: bw login' 
        };
      }

      const { cmd, args, stdin } = config.saveCmd(title, password);
      const result = execSync(`echo '${stdin}' | ${cmd} ${args.join(' ')}`, { encoding: 'utf-8' });
      return { success: true, result: result.trim() };
      
    } else if (manager === 'keepass') {
      const dbPath = options.dbPath || findKeePassDB();
      if (!dbPath) {
        return { 
          success: false, 
          error: 'KeePass database not found. Use --db-path to specify.' 
        };
      }
      
      const { cmd, args, stdin } = config.saveCmd(title, password, dbPath, options.keyFile);
      const result = execSync(`echo '${stdin}' | ${cmd} ${args.join(' ')}`, { encoding: 'utf-8' });
      return { success: true, result: result.trim() };
      
    } else if (manager === 'lastpass') {
      // Check if logged in
      try {
        execSync('lpass status', { encoding: 'utf-8' });
      } catch {
        return { 
          success: false, 
          error: 'LastPass not logged in. Run: lpass login <email>' 
        };
      }
      
      const cmd = config.saveCmd(title, password, options.username);
      const result = execSync(cmd, { encoding: 'utf-8' });
      return { success: true, result: result.trim() };
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Retrieve password from password manager
 */
function getPassword(manager, title, options = {}) {
  const config = MANAGERS[manager];
  if (!config) {
    return { success: false, error: `Unknown manager: ${manager}` };
  }

  const check = checkManager(manager);
  if (!check.available) {
    return check;
  }

  try {
    if (manager === 'onepassword') {
      const vault = options.vault || 'Private';
      const cmd = config.getCmd(title, vault);
      const result = execSync(cmd, { encoding: 'utf-8' }).trim();
      return { success: true, password: result };
      
    } else if (manager === 'bitwarden') {
      const cmd = config.getCmd(title);
      const result = execSync(cmd, { encoding: 'utf-8' }).trim();
      return { success: true, password: result };
      
    } else if (manager === 'keepass') {
      const dbPath = options.dbPath || findKeePassDB();
      if (!dbPath) {
        return { success: false, error: 'KeePass database not found' };
      }
      
      const cmd = config.getCmd(title, dbPath, options.keyFile);
      const result = execSync(cmd, { encoding: 'utf-8' }).trim();
      return { success: true, password: result };
      
    } else if (manager === 'lastpass') {
      const cmd = config.getCmd(title);
      const result = execSync(cmd, { encoding: 'utf-8' }).trim();
      return { success: true, password: result };
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Find KeePass database file
 */
function findKeePassDB() {
  const commonPaths = [
    path.join(os.homedir(), 'Documents', 'Passwords.kdbx'),
    path.join(os.homedir(), 'Dropbox', 'Passwords.kdbx'),
    path.join(os.homedir(), 'Google Drive', 'Passwords.kdbx'),
    path.join(os.homedir(), '.password-store', 'Passwords.kdbx')
  ];
  
  for (const dbPath of commonPaths) {
    if (fs.existsSync(dbPath)) {
      return dbPath;
    }
  }
  
  return null;
}

/**
 * List available password managers
 */
function listAvailableManagers() {
  const results = {};
  for (const [key, config] of Object.entries(MANAGERS)) {
    results[key] = checkManager(key);
  }
  return results;
}

/**
 * Auto-detect and use best available password manager
 */
function autoSavePassword(title, password, options = {}) {
  const managers = listAvailableManagers();
  
  // Priority: 1Password > Bitwarden > KeePass > LastPass
  const priority = ['onepassword', 'bitwarden', 'keepass', 'lastpass'];
  
  for (const manager of priority) {
    if (managers[manager].available) {
      return savePassword(manager, title, password, options);
    }
  }
  
  return { 
    success: false, 
    error: 'No password manager CLI found. Install 1Password, Bitwarden, KeePass, or LastPass CLI.' 
  };
}

module.exports = {
  checkManager,
  savePassword,
  getPassword,
  listAvailableManagers,
  autoSavePassword,
  findKeePassDB,
  MANAGERS
};
