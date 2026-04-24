# OpenVault

> Hide in plain sight. Encrypt your secrets into files that look completely normal.

[![CI](https://github.com/JUNNYOfficial/OpenVault/actions/workflows/ci.yml/badge.svg)](https://github.com/JUNNYOfficial/OpenVault/actions/workflows/ci.yml)

OpenVault encrypts your sensitive files and camouflages them as ordinary documents. Store them in any public GitHub repository. They look like regular content, but only you can unlock them.

**v0.4.0-beta** — 12 camouflage types, bilingual browser frontend, 4 password manager integrations, VS Code extension, and mobile PWA support.

---

## Features

| Feature | Description |
|---------|-------------|
| **Semantic Camouflage** | Encrypted data hidden inside realistic-looking content |
| **Zero-Width Steganography** | Invisible Unicode characters carry the payload |
| **Apple-Style Passwords** | Auto-generate 119-bit entropy strong passwords |
| **QR Code Backup** | Scan passwords with your phone camera |
| **Password Managers** | Auto-save to 1Password / Bitwarden / KeePass / LastPass |
| **Mobile Unlock** | PWA web app for iOS/Android decryption |
| **VS Code Extension** | Seal/unlock directly from your editor |
| **Browser Frontend** | Seal/unlock in your browser, no install needed. English / Chinese |
| **12 Camouflage Types** | Markdown, Python, JS, TS, Dockerfile, GitHub Action, JSON, Rust, Go, Shell, Env |
| **Zero Servers** | Everything local — no external services |

---

## Quick Start

### CLI

```bash
git clone https://github.com/JUNNYOfficial/OpenVault.git
cd OpenVault
npm install
npm link

ov init
ov seal secret.txt -m password-only --generate-password --backup-qr
ov unlock docs/react-hooks-guide.md -p "your-password"
```

### Browser (No Install)

**Live Demo:** [https://junnyofficial.github.io/OpenVault/](https://junnyofficial.github.io/OpenVault/)

Works entirely in your browser — no server, no Node.js, no build step. All encryption happens locally using the Web Crypto API. Supports English and Chinese.

Serve locally:

```bash
python3 -m http.server 8080
# Open http://localhost:8080
```

### Mobile (iOS/Android)

1. Open Safari/Chrome: [https://junnyofficial.github.io/OpenVault/](https://junnyofficial.github.io/OpenVault/)
2. Tap Share / Add to Home Screen
3. Use offline to seal/unlock files anywhere

### VS Code

```bash
cd vscode-extension
code .
# Press F5 to launch
```

---

## 12 Camouflage Types

```bash
$ ov types

Available camouflage types:

  markdown-tutorial    React Hooks tutorial (.md)
  markdown-blog        Web performance blog post (.md)
  python-script        Python CSV converter script (.py)
  js-config            Vite build configuration (.js)
  dockerfile           Docker container config
  github-action        CI/CD workflow (.yml)
  json-config          Package/Project config (.json)
  typescript-config    TypeScript compiler config (.json)
  rust-cargo           Rust package manifest (.toml)
  go-module            Go module definition (.mod)
  shell-script         Bash deployment script (.sh)
  env-file             Environment variables example
```

---

## Password Manager Integrations

```bash
$ ov password-manager

Password Manager Status:

  1Password          Version: 2.24.0
  Bitwarden          Version: 2024.1.0
  KeePass            KeePass CLI not found
  LastPass           LastPass CLI not found
```

### Auto-Save on Seal

```bash
ov seal secret.txt -m password-only --generate-password
# Auto-saved to available password manager
```

### Manual Operations

```bash
# Save to specific manager
ov password-manager --save "MyKey" --password "abc123" --manager bitwarden

# Retrieve password
ov password-manager --get "MyKey" --manager onepassword

# KeePass with database path
ov password-manager --save "MyKey" --password "abc123" --manager keepass --db-path ~/Passwords.kdbx

# LastPass with username
ov password-manager --save "MyKey" --password "abc123" --manager lastpass --username user@example.com
```

---

## Mobile Unlock

### PWA Web App
- **iOS Safari**: Share / Add to Home Screen
- **Android Chrome**: Menu / Add to Home Screen
- Works offline after first load
- Paste sealed content / Enter password / Decrypt

### iOS Shortcut

Create a Shortcut that receives text and opens the web app:

```
Receive: Text from Share Sheet
Ask: Password
Open URL: https://junnyofficial.github.io/OpenVault/mobile/?content=[Input]&password=[Password]
```

---

## Key Modes

| Mode | Command | Security |
|------|---------|----------|
| Git-Only | `ov seal file.txt` | Single factor (Git state) |
| Password-Enhanced | `ov seal file.txt -m password-enhanced` | Two factor (Git + password) |
| Password-Only | `ov seal file.txt -m password-only` | Portable (password only) |

---

## QR Code Backup

```bash
ov backup "password" --qr -o ~/Desktop/qr.png
ov backup "password" --full --recovery-password "recovery"
ov restore backup.enc -p "recovery"
```

---

## Verify Without Decrypting

```bash
ov verify docs/react-hooks-guide.md
# Returns whether the file is a valid OpenVault sealed file
```

The browser frontend also has a Verify tab for the same purpose.

---

## VS Code Extension

- Right-click seal/unlock
- Command palette commands
- Password generator webview
- QR Code display
- Explorer sidebar for sealed files
- Shortcuts: `Ctrl+Shift+O S/U`

---

## Project Structure

```
OpenVault/
├── index.html              # Browser frontend entry
├── css/style.css           # Browser frontend styles
├── js/                     # Browser frontend scripts
│   ├── app.js
│   ├── crypto.js
│   ├── camouflage.js
│   ├── password-generator.js
│   ├── templates.js
│   └── i18n.js
├── src/                    # CLI core
│   ├── cli.js
│   ├── core.js
│   ├── camouflage.js
│   ├── key-derivation.js
│   ├── password-generator.js
│   ├── password-manager.js
│   ├── backup.js
│   └── templates/
├── mobile/                 # PWA for iOS/Android
│   └── src/
├── vscode-extension/       # VS Code Extension
├── tests/
│   └── test.js
└── README.md
```

---

## Testing

```bash
npm test
```

29 tests covering all core functionality.

---

## Roadmap

| Phase | Features |
|-------|----------|
| **v0.1** | CLI, 4 templates, Git key derivation |
| **v0.2** | Apple passwords, 3 key modes |
| **v0.3** | 7 templates, 4 password managers, mobile PWA, VS Code extension |
| **v0.4-beta** | 12 templates, bilingual browser frontend, verify command, GitHub Pages deploy |
| **v1.0** | Multi-repo sharding, self-destruct protocol |

---

## Contributing

```bash
git clone https://github.com/JUNNYOfficial/OpenVault.git
cd OpenVault
npm install
npm test
```

---

## License

MIT — See [LICENSE](LICENSE) for details.

---

*"Privacy is not about hiding. It's about controlling what others can see."*
