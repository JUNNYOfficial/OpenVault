# OpenVault 🔒

> **Hide in plain sight.** Encrypt your secrets into files that look completely normal.

[![CI](https://github.com/JUNNYOfficial/OpenVault/actions/workflows/ci.yml/badge.svg)](https://github.com/JUNNYOfficial/OpenVault/actions/workflows/ci.yml)

OpenVault encrypts your sensitive files and camouflages them as ordinary documents — tutorials, blog posts, Python scripts, config files. Store them in any public GitHub repository. They look like regular content, but only you can unlock them.

**v0.3.0** now includes **7 camouflage types**, **password manager integration**, and **VS Code Extension**!

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| **Semantic Camouflage** | Encrypted data hidden inside realistic-looking content |
| **Zero-Width Steganography** | Invisible Unicode characters carry the payload |
| **🔐 Apple-Style Passwords** | Auto-generate 119-bit entropy strong passwords |
| **📱 QR Code Backup** | Scan passwords with your phone camera |
| **🔑 Password Manager** | Auto-save to 1Password / Bitwarden |
| **🖥️ VS Code Extension** | Seal/unlock directly from your editor |
| **Three Key Modes** | Git-only / Password-enhanced / Password-only |
| **7 Camouflage Types** | Markdown, Python, JS, Dockerfile, GitHub Action, JSON |
| **Zero Servers** | Everything local — no external services |
| **Plausible Deniability** | Files look legitimate, not like encrypted blobs |

---

## 🚀 Quick Start

### CLI

```bash
# Clone this repo
git clone https://github.com/JUNNYOfficial/OpenVault.git
cd OpenVault

# Install dependencies
npm install

# Link the CLI globally
npm link

# Initialize OpenVault in a Git repository
ov init

# Seal with auto-generated password + QR backup
ov seal my-diary.txt -m password-only --generate-password --backup-qr

# Unlock with password
ov unlock docs/react-hooks-guide.md -p "your-password"
```

### VS Code Extension

```bash
cd vscode-extension
code .
# Press F5 to launch Extension Development Host
```

---

## 🎭 7 Camouflage Types

```bash
$ ov types

🎭 Available camouflage types:

  markdown-tutorial    React Hooks tutorial (.md)
  markdown-blog        Web performance blog post (.md)
  python-script        Python CSV converter script (.py)
  js-config            Vite build configuration (.js)
  dockerfile           Docker container config
  github-action        CI/CD workflow (.yml)
  json-config          Package/Project config (.json)
```

### Usage Examples

```bash
# Disguise as Dockerfile
ov seal secret.txt -t dockerfile

# Disguise as GitHub Action workflow
ov seal secret.txt -t github-action

# Disguise as package.json
ov seal secret.txt -t json-config
```

---

## 🔑 Password Manager Integration

OpenVault can auto-save passwords to your password manager!

### Supported Managers
- **1Password** (`op` CLI)
- **Bitwarden** (`bw` CLI)

### Check Status
```bash
$ ov password-manager

🔐 Password Manager Status:

  ✅ 1Password          Version: 2.24.0
  ❌ Bitwarden          Bitwarden CLI not found. Install: https://bitwarden.com/help/cli/
```

### Auto-Save on Seal
When you seal with `--generate-password`, OpenVault automatically tries to save to your password manager:
```bash
ov seal secret.txt -m password-only --generate-password
# ✅ Saved to password manager
```

### Manual Save/Get
```bash
# Save password manually
ov password-manager --save "My Secret" --password "abc123"

# Retrieve password
ov password-manager --get "My Secret"
```

---

## 🔐 Key Modes

### 1. 🔓 Git-Only (Default)
```bash
ov seal secret.txt
```
- Key derived from: `repo + commit + email + SSH fingerprint`

### 2. 🔒 Password-Enhanced (Two-Factor)
```bash
ov seal secret.txt -m password-enhanced --generate-password
```
- Key derived from: `Git factors + your strong password`

### 3. 🔐 Password-Only (Portable)
```bash
ov seal secret.txt -m password-only --generate-password --backup-qr
```
- Key derived from: `password only`
- **Best with**: QR code backup for easy mobile access

---

## 📱 QR Code Password Backup

```bash
# Display QR in terminal
ov backup "your-password"

# Save QR as PNG
ov backup "your-password" --qr -o ~/Desktop/qr.png

# Full backup package
ov backup "your-password" --full --recovery-password "recovery-pwd"

# Restore from encrypted backup
ov restore password.enc -p "recovery-pwd"
```

---

## 🖥️ VS Code Extension

- **Right-click menu**: Seal/Unlock files directly
- **Command Palette**: All OpenVault commands
- **Password Generator**: Interactive webview with QR codes
- **Explorer Sidebar**: View all sealed files
- **Shortcuts**: `Ctrl+Shift+O S` (seal) / `Ctrl+Shift+O U` (unlock)

---

## 🛡️ Security Model

| Threat | Protection |
|--------|-----------|
| Casual observer | File looks like normal content |
| Automated scanner | No encryption markers |
| Fork analysis | Fork breaks key derivation |
| Brute force | PBKDF2 with 100k-300k iterations |
| Password guessing | 119-bit entropy passwords |
| Password loss | QR Code + password manager backup |

> ⚠️ **MVP Disclaimer**: Proof-of-concept. Do not use for production secrets without security audit.

---

## 📁 Project Structure

```
OpenVault/
├── src/                          # CLI core
│   ├── cli.js
│   ├── core.js
│   ├── camouflage.js
│   ├── key-derivation.js
│   ├── password-generator.js
│   ├── password-manager.js       # 1Password/Bitwarden integration ⭐ NEW
│   ├── backup.js
│   └── templates/
│       ├── tutorial.js
│       ├── blog.js
│       ├── python-script.js
│       ├── js-config.js
│       ├── dockerfile.js         # ⭐ NEW
│       ├── github-action.js      # ⭐ NEW
│       └── json-config.js        # ⭐ NEW
├── vscode-extension/             # VS Code Extension
│   ├── src/
│   ├── out/
│   └── package.json
├── tests/
│   └── test.js
├── README.md
└── package.json
```

---

## 🧪 Testing

```bash
npm test
```

**19 tests** covering all core functionality.

---

## 🗺️ Roadmap

| Phase | Features |
|-------|----------|
| **MVP v0.1** ✅ | CLI seal/unlock, 4 camouflage types |
| **v0.2** ✅ | Apple-style passwords, 3 key modes |
| **v0.3** ✅ | QR Code backup, 7 templates, password manager, VS Code extension |
| **Beta** | Mobile app, more templates, GitHub Action auto-deploy |
| **v1.0** | Multi-repo sharding, self-destruct protocol |

---

## 🤝 Contributing

```bash
git clone https://github.com/JUNNYOfficial/OpenVault.git
cd OpenVault
npm install
npm test
```

---

## 📜 License

MIT — See [LICENSE](LICENSE) for details.

---

*"Privacy is not about hiding. It's about controlling what others can see."*
