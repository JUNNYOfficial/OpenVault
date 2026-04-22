# OpenVault 🔒

> **Hide in plain sight.** Encrypt your secrets into files that look completely normal.

[![CI](https://github.com/JUNNYOfficial/OpenVault/actions/workflows/ci.yml/badge.svg)](https://github.com/JUNNYOfficial/OpenVault/actions/workflows/ci.yml)

OpenVault is a minimal CLI tool that encrypts your sensitive files and camouflages them as ordinary documents — tutorials, blog posts, Python scripts, config files. Store them in any public GitHub repository. They look like regular content, but only you can unlock them.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| **Semantic Camouflage** | Encrypted data hidden inside realistic-looking content |
| **Zero-Width Steganography** | Invisible Unicode characters carry the payload |
| **Git-Native Keys** | Keys derived from repo metadata — no passwords to remember |
| **Multi-Format Support** | Markdown tutorials, blog posts, Python scripts, JS configs |
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

# Seal (encrypt) a secret file — choose your disguise
ov seal my-diary.txt                    # → React tutorial (default)
ov seal passwords.txt -t markdown-blog  # → Web performance blog
ov seal api-keys.txt -t python-script   # → Python CSV converter
ov seal config.json -t js-config        # → Vite config file

# Later, unlock it
ov unlock docs/react-hooks-guide.md
# → Creates docs/react-hooks-guide.md.decrypted

# List all sealed files
ov list

# Remove a sealed file
ov remove docs/react-hooks-guide.md
```

---

## 🎭 Camouflage Types

```
$ ov types

🎭 Available camouflage types:

  markdown-tutorial    React Hooks tutorial (default) (.md)
  markdown-blog        Web performance blog post (.md)
  python-script        Python CSV converter script (.py)
  js-config            Vite build configuration (.js)
```

### Example: What attackers see vs. what you get

**What GitHub shows:**
```markdown
# Understanding React Hooks: A Beginner's Guide

> This guide was written for internal team onboarding...

## 1. useState: Managing Local State

The `useState` hook is the simplest way to add state...

<!-- TODO: review  before merge -->
```

*(The `<!-- TODO -->` comment contains your encrypted data as invisible characters)*

**What you get after `ov unlock`:**
```
=== My Private Notes ===
Bank Account: 6222 **** **** 8888
AWS Access Key: AKIA********************
```

---

## 🔐 How It Works

### 1. Encryption
- **AES-256-GCM** for authenticated encryption
- Key derived from your Git repository's metadata:
  ```
  Key = PBKDF2(repo_name + commit_hash + user_email + ssh_fingerprint, salt, 100k iterations)
  ```

### 2. Camouflage
- Encrypted payload → zero-width Unicode characters
- Embedded inside HTML comments within realistic templates
- Human eyes see a normal document; machines see nothing suspicious

### 3. Key Derivation
| Component | Purpose |
|-----------|---------|
| `repo_name` | Repository identity |
| `commit_hash` | Time-bound (prevents replay) |
| `user_email` | Author identity |
| `ssh_fingerprint` | Hardware-bound (optional) |

The key is **never stored** — computed on demand from your local Git state.

---

## 🛡️ Security Model

| Threat | Protection |
|--------|-----------|
| Casual observer | File looks like normal content |
| Automated scanner | No encryption markers or base64 blobs |
| Fork analysis | Fork breaks key derivation chain |
| History tampering | Invalidates keys (self-verifying) |
| Brute force | PBKDF2 with 100k iterations |

> ⚠️ **MVP Disclaimer**: This is a proof-of-concept. Do not use for production secrets without a security audit.

---

## 📁 Project Structure

```
OpenVault/
├── src/
│   ├── cli.js              # CLI entry point (ov seal/unlock/list)
│   ├── core.js             # Core encryption/decryption logic
│   ├── camouflage.js       # Semantic camouflage engine
│   ├── key-derivation.js   # Git-native + SSH key derivation
│   └── templates/          # Camouflage templates
│       ├── tutorial.js     # React Hooks tutorial
│       ├── blog.js         # Web performance blog
│       ├── python-script.js # Python CSV converter
│       └── js-config.js    # Vite configuration
├── tests/
│   └── test.js             # Comprehensive test suite
├── examples/
│   └── sample-secret.txt   # Example secret file
├── docs/                   # Generated camouflage files
├── scripts/                # Generated Python scripts
├── config/                 # Generated JS configs
├── .openvault/
│   └── manifest.json       # Shard tracking
├── .github/workflows/
│   └── ci.yml              # CI with camouflage validation
├── README.md
└── package.json
```

---

## 🧪 Testing

```bash
npm test
```

Tests cover:
- ✅ Camouflage round-trip (all types)
- ✅ Key derivation determinism
- ✅ Key invalidation on new commits
- ✅ Seal/unlock integration
- ✅ Shard listing and removal
- ✅ Cross-type differentiation

---

## 🗺️ Roadmap

| Phase | Features |
|-------|----------|
| **MVP** ✅ | CLI seal/unlock, 4 camouflage types, Git key derivation |
| **Beta** | VS Code plugin, more templates, GitHub Action auto-deploy |
| **v1.0** | Multi-repo sharding, mobile unlock, self-destruct protocol |

---

## 🤝 Contributing

This is an open-source experiment. Issues, PRs, and security reviews are welcome!

### Development

```bash
git clone https://github.com/JUNNYOfficial/OpenVault.git
cd OpenVault
npm install
npm test        # Run tests
node src/cli.js seal <file>   # Test CLI
```

---

## 📜 License

MIT — See [LICENSE](LICENSE) for details.

---

*"Privacy is not about hiding. It's about controlling what others can see."*
