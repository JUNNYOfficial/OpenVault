# OpenVault 🔒

> **Hide in plain sight.** Encrypt your secrets into files that look completely normal.

[![CI](https://github.com/JUNNYOfficial/OpenVault/actions/workflows/ci.yml/badge.svg)](https://github.com/JUNNYOfficial/OpenVault/actions/workflows/ci.yml)

OpenVault encrypts your sensitive files and camouflages them as ordinary documents — tutorials, blog posts, Python scripts, config files. Store them in any public GitHub repository. They look like regular content, but only you can unlock them.

**v0.3.0** now includes **VS Code Extension** for seamless IDE integration!

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| **Semantic Camouflage** | Encrypted data hidden inside realistic-looking content |
| **Zero-Width Steganography** | Invisible Unicode characters carry the payload |
| **🔐 Apple-Style Passwords** | Auto-generate 119-bit entropy strong passwords |
| **📱 QR Code Backup** | Scan passwords with your phone camera |
| **🖥️ VS Code Extension** | Seal/unlock directly from your editor |
| **Three Key Modes** | Git-only / Password-enhanced / Password-only |
| **Multi-Format Support** | Markdown, Python, JavaScript config files |
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
# Open the extension folder in VS Code
cd vscode-extension
code .

# Press F5 to launch Extension Development Host
# In the new window, right-click any file → "🔒 Seal (Encrypt)"
```

---

## 🖥️ VS Code Extension Features

### Right-Click Menu
- **🔒 Seal** — Right-click any file in the explorer to encrypt
- **🔓 Unlock** — Right-click a sealed file to decrypt

### Command Palette (`Ctrl+Shift+P`)
| Command | Description | Shortcut |
|---------|-------------|----------|
| `OpenVault: Seal` | Encrypt current file | `Ctrl+Shift+O S` |
| `OpenVault: Unlock` | Decrypt sealed file | `Ctrl+Shift+O U` |
| `OpenVault: Generate Strong Password` | Open password generator | - |
| `OpenVault: Show QR Code` | Generate QR for password | - |
| `OpenVault: List Sealed Files` | View all sealed files | - |

### Password Generator Panel
- Interactive webview with Apple-style password generation
- Memorable passphrase generation (diceware-style)
- Real-time entropy calculation
- One-click copy and QR code generation

### Explorer Sidebar
- Dedicated "OpenVault" panel in the file explorer
- Lists all sealed files with their key mode icons
- Click to unlock directly from the sidebar

---

## 🔐 Key Modes

### 1. 🔓 Git-Only (Default)
```bash
ov seal secret.txt
```
- Key derived from: `repo + commit + email + SSH fingerprint`
- **Pros**: Zero passwords to remember, automatic
- **Cons**: Tied to this specific Git state

### 2. 🔒 Password-Enhanced (Two-Factor)
```bash
ov seal secret.txt -m password-enhanced --generate-password
```
- Key derived from: `Git factors + your strong password`
- **Pros**: Even if Git repo is compromised, password needed
- **Cons**: Must save the generated password

### 3. 🔐 Password-Only (Portable)
```bash
ov seal secret.txt -m password-only --generate-password --backup-qr
```
- Key derived from: `password only`
- **Pros**: Decrypt on any device, no Git needed
- **Cons**: Password is the single point of failure
- **Best with**: QR code backup for easy mobile access

---

## 📱 QR Code Password Backup

```bash
# Display QR in terminal (scan with phone)
ov backup "your-password"

# Save QR as PNG file
ov backup "your-password" --qr -o ~/Desktop/my-password-qr.png

# Create full backup package
ov backup "your-password" --full --recovery-password "my-recovery-pwd"

# Restore from encrypted backup
ov restore password.enc -p "my-recovery-pwd"
```

---

## 🎭 Camouflage Types

```bash
$ ov types

🎭 Available camouflage types:

  markdown-tutorial    React Hooks tutorial (default) (.md)
  markdown-blog        Web performance blog post (.md)
  python-script        Python CSV converter script (.py)
  js-config            Vite build configuration (.js)
```

---

## 🛡️ Security Model

| Threat | Protection |
|--------|-----------|
| Casual observer | File looks like normal content |
| Automated scanner | No encryption markers or base64 blobs |
| Fork analysis | Fork breaks key derivation chain |
| History tampering | Invalidates keys (self-verifying) |
| Brute force | PBKDF2 with 100k-300k iterations |
| Password guessing | 119-bit entropy Apple-style passwords |
| Password loss | QR Code backup + encrypted recovery file |

> ⚠️ **MVP Disclaimer**: This is a proof-of-concept. Do not use for production secrets without a security audit.

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
│   ├── backup.js
│   └── templates/
├── vscode-extension/             # VS Code Extension ⭐ NEW
│   ├── src/
│   │   ├── extension.ts          # Main extension entry
│   │   ├── openvaultManager.ts   # CLI integration
│   │   ├── qrCodePanel.ts        # QR Code webview
│   │   ├── passwordGeneratorPanel.ts # Password generator UI
│   │   └── treeProvider.ts       # Explorer sidebar
│   ├── out/                      # Compiled JS
│   ├── package.json
│   └── README.md
├── tests/
│   └── test.js
├── .github/workflows/
│   └── ci.yml
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
| **MVP v0.1** ✅ | CLI seal/unlock, 4 camouflage types, Git key derivation |
| **v0.2** ✅ | Apple-style passwords, 3 key modes, passphrase generation |
| **v0.3** ✅ | QR Code backup, encrypted recovery, VS Code extension |
| **Beta** | More templates, GitHub Action auto-deploy, mobile app |
| **v1.0** | Multi-repo sharding, self-destruct protocol, audit log |

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
