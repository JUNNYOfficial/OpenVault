# OpenVault

> 🔒 **Hide in plain sight.** Encrypt your secrets into files that look completely normal.

OpenVault is a minimal CLI tool that encrypts your sensitive files and camouflages them as ordinary Markdown documents (tutorials, blog posts, etc.). Store them in any public GitHub repository — they look like regular content, but only you can unlock them.

---

## ✨ Features

- **Semantic Camouflage** — Encrypted data is hidden inside realistic-looking Markdown content
- **Git-Native Keys** — Derives encryption keys from your repository's Git history (no passwords to remember)
- **Zero Servers** — Everything happens locally; no external services required
- **Plausible Deniability** — Files look like legitimate content, not encrypted blobs

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

# Seal (encrypt) a secret file
ov seal my-diary.txt
# → Creates docs/react-hooks-guide.md (looks like a tutorial!)

# Later, unlock it
ov unlock docs/react-hooks-guide.md
# → Creates docs/react-hooks-guide.md.decrypted
```

## 📁 Project Structure

```
OpenVault/
├── src/
│   ├── cli.js              # CLI entry point
│   ├── core.js             # Seal / Unlock logic
│   ├── camouflage.js       # Semantic camouflage engine
│   ├── key-derivation.js   # Git-native key derivation
│   └── templates/          # Camouflage templates
│       ├── tutorial.js     # React Hooks tutorial
│       └── blog.js         # Web performance blog post
├── tests/
│   └── test.js             # Test suite
├── examples/
│   └── sample-secret.txt   # Example secret file
├── docs/                   # Generated camouflage files go here
├── .openvault/
│   └── manifest.json       # Shard tracking
└── package.json
```

## 🔐 How It Works

### 1. Encryption
- Your plaintext is encrypted with **AES-256-GCM**
- The key is derived from your Git repository's metadata (commit hash, remote URL, user identity)

### 2. Camouflage
- The encrypted payload is encoded using zero-width Unicode characters
- These characters are embedded inside HTML comments within a realistic Markdown template
- To human eyes (and most tools), it looks like a normal technical article

### 3. Key Derivation
```
Key = PBKDF2(repo_name + commit_hash + user_email, salt=commit_prefix, 100k iterations)
```

The key is never stored — it's computed on demand from your local Git state.

## 🛡️ Security Notes

> ⚠️ **MVP Disclaimer**: This is a proof-of-concept. Do not use for production secrets without a security audit.

- **Threat Model**: Protects against casual observers and automated scanners
- **Limitations**: 
  - Zero-width characters can be detected by specialized tools
  - Git history changes (rebase, force push) will invalidate keys
  - Forking the repo breaks the key derivation chain
- **Recommendations**: Combine with additional layers (e.g., password managers) for high-value secrets

## 🗺️ Roadmap

| Phase | Features |
|-------|----------|
| **MVP** (Now) | CLI seal/unlock, Markdown camouflage, Git key derivation |
| **Beta** | VS Code plugin, more templates (Python, JS code), GitHub Action |
| **v1.0** | Multi-repo sharding, mobile unlock, self-destruct protocol |

## 🤝 Contributing

This is an open-source experiment. Issues, PRs, and security reviews are welcome!

## 📜 License

MIT — See [LICENSE](LICENSE) for details.

---

*"Privacy is not about hiding. It's about controlling what others can see."*
