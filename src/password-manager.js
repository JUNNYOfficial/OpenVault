/**
 * Password Manager Integration
 * 
 * Supports:
 * - 1Password CLI (op)
 * - Bitwarden CLI (bw)
 * 
 * Allows storing generated passwords directly to password managers.
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

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
      // Bitwarden uses stdin for secure input
      const item = JSON.stringify({
        type: 2, // Login type
        name: title,
        login: { password }
      });
      return { cmd: 'bw', args: ['create', 'item'], stdin: item };
    },
    getCmd: (title) =>
      `bw list items --search "${title}" | jq -r '.[0].login.password'`
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
    bitwarden: 'https://bitwarden.com/help/cli/'
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
      // Check if logged in
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
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
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
  
  // Priority: 1Password > Bitwarden
  const priority = ['onepassword', 'bitwarden'];
  
  for (const manager of priority) {
    if (managers[manager].available) {
      return savePassword(manager, title, password, options);
    }
  }
  
  return { 
    success: false, 
    error: 'No password manager CLI found. Install 1Password CLI or Bitwarden CLI.' 
  };
}

module.exports = {
  checkManager,
  savePassword,
  getPassword,
  listAvailableManagers,
  autoSavePassword,
  MANAGERS
};
