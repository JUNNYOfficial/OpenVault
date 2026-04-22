# OpenVault 🔒

> **Hide in plain sight.** Encrypt your secrets into files that look completely normal.

[![CI](https://github.com/JUNNYOfficial/OpenVault/actions/workflows/ci.yml/badge.svg)](https://github.com/JUNNYOfficial/OpenVault/actions/workflows/ci.yml)

OpenVault encrypts your sensitive files and camouflages them as ordinary documents — tutorials, blog posts, Python scripts, config files. Store them in any public GitHub repository. They look like regular content, but only you can unlock them.

**v0.3.0** now includes **QR Code password backup** for easy mobile recovery!

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| **Semantic Camouflage** | Encrypted data hidden inside realistic-looking content |
| **Zero-Width Steganography** | Invisible Unicode characters carry the payload |
| **🔐 Apple-Style Passwords** | Auto-generate 119-bit entropy strong passwords |
| **📱 QR Code Backup** | Scan passwords with your phone camera |
| **Three Key Modes** | Git-only / Password-enhanced / Password-only |
| **Multi-Format Support** | Markdown, Python, JavaScript config files |
| **Zero Servers** | Everything local — no external services |
| **Plausible Deniability** | Files look legitimate, not like encrypted blobs |

---

## 🚀 Quick Start

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
# Output:
# 🔐 Generated password: 9jws-Jkzu-TNnx-QP2e-SKkA
# 📱 [QR Code displayed in terminal]
# 🔒 Sealed: docs/react-hooks-guide.md

# Unlock with password
ov unlock docs/react-hooks-guide.md -p "9jws-Jkzu-TNnx-QP2e-SKkA"
```

---

## 📱 QR Code Password Backup

### Generate QR Code for your password
```bash
# Display QR in terminal (scan with phone)
ov backup "your-password"

# Save QR as PNG file
ov backup "your-password" --qr -o ~/Desktop/my-password-qr.png

# Create full backup package
ov backup "your-password" --full --recovery-password "my-recovery-pwd"
# Creates:
#   📱 password-qr.png    → Scan with phone
#   📝 password.txt        → Plain text (delete after use!)
#   🔐 password.enc        → Encrypted with recovery password
#   📋 README.txt          → Recovery instructions

# Restore from encrypted backup
ov restore password.enc -p "my-recovery-pwd"
```

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

## 🔑 Password Commands

### Generate Apple-style strong passwords
```bash
$ ov password
🔐 Apple-Style Strong Passwords:

  72uu-z5DS-tW7a-HQXZ-AwhE  (119.1 bits)
  5v6K-4Dve-TtNY-SVuG-NdKJ  (119.1 bits)
```

### Generate memorable passphrases
```bash
$ ov password --passphrase --words 4
🎲 Memorable Passphrases:

  crystal-mirror-orchid-mountain  (126.9 bits)
```

### Check your key derivation factors
```bash
$ ov key-info
🔑 Current Key Derivation Factors:

  Repository: OpenVault
  Commit:     51ad7a1ca0cf...
  Identity:   user@example.com
  SSH Key:    SHA256:FtaJYkvIZPixZYLd...
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

### Password Characteristics
- **20 characters** in 5 groups of 4
- **Mixed case + numbers**, separated by hyphens
- **Excludes visually similar chars** (0/O, 1/l/I)
- **119 bits of entropy** — uncrackable by brute force
- **Cryptographically secure** random generation

### Backup Security
- **QR Code**: Store in phone's secure notes or photo vault
- **Encrypted file**: Requires separate recovery password
- **Plain text**: Temporary only, delete after secure storage
- **NEVER commit** backup files to Git

> ⚠️ **MVP Disclaimer**: This is a proof-of-concept. Do not use for production secrets without a security audit.

---

## 📁 Project Structure

```
OpenVault/
├── src/
│   ├── cli.js                 # CLI entry point
│   ├── core.js                # Core encryption/decryption
│   ├── camouflage.js          # Semantic camouflage engine
│   ├── key-derivation.js      # Git-native + password key derivation
│   ├── password-generator.js  # Apple-style password generation
│   ├── backup.js              # QR Code + encrypted backup ⭐ NEW
│   └── templates/             # Camouflage templates
├── tests/
│   └── test.js                # 19 comprehensive tests
├── examples/
│   └── sample-secret.txt
├── .github/workflows/
│   └── ci.yml                 # CI with camouflage validation
├── README.md
└── package.json
```

---

## 🧪 Testing

```bash
npm test
```

**19 tests** covering:
- ✅ Password generation (format, entropy, uniqueness)
- ✅ Passphrase generation
- ✅ Password-derived key determinism
- ✅ Camouflage round-trip (all 4 types)
- ✅ Git key derivation determinism
- ✅ Key invalidation on new commits
- ✅ Password-enhanced vs git-only differentiation
- ✅ Seal/unlock integration (all 3 key modes)
- ✅ Shard listing and removal
- ✅ Cross-type differentiation

---

## 🗺️ Roadmap

| Phase | Features |
|-------|----------|
| **MVP v0.1** ✅ | CLI seal/unlock, 4 camouflage types, Git key derivation |
| **v0.2** ✅ | Apple-style passwords, 3 key modes, passphrase generation |
| **v0.3** ✅ | QR Code backup, encrypted recovery, full backup package |
| **Beta** | VS Code plugin, more templates, GitHub Action auto-deploy |
| **v1.0** | Multi-repo sharding, mobile unlock, self-destruct protocol |

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
