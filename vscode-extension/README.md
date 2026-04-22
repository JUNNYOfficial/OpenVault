# OpenVault for VS Code

> 🔒 Encrypt your secrets into files that look completely normal — directly from VS Code.

## Features

- **🔒 Seal Files** — Right-click any file to encrypt and camouflage it
- **🔓 Unlock Files** — Decrypt sealed files with a click
- **🔐 Password Generator** — Built-in Apple-style strong password generator with QR codes
- **📱 QR Code Backup** — Scan passwords with your phone camera
- **📦 Explorer Panel** — View all sealed files in the sidebar
- **🎭 Multiple Camouflage Types** — Markdown tutorials, Python scripts, JS configs

## Quick Start

1. Install the extension
2. Open a workspace with a Git repository
3. Run `OpenVault: Initialize` from the command palette
4. Right-click any file → `🔒 Seal (Encrypt)`
5. Choose your key mode and camouflage type

## Commands

| Command | Description | Shortcut |
|---------|-------------|----------|
| `OpenVault: Seal` | Encrypt current file | `Ctrl+Shift+O S` |
| `OpenVault: Unlock` | Decrypt sealed file | `Ctrl+Shift+O U` |
| `OpenVault: Generate Strong Password` | Open password generator | - |
| `OpenVault: Show QR Code` | Generate QR for password | - |
| `OpenVault: List Sealed Files` | View all sealed files | - |
| `OpenVault: Initialize` | Setup OpenVault in workspace | - |
| `OpenVault: Key Info` | Show key derivation info | - |

## Key Modes

- **🔓 Git-Only** — Key derived from Git state (automatic)
- **🔒 Password-Enhanced** — Git + password (two-factor)
- **🔐 Password-Only** — Password only (portable)

## Requirements

- Node.js 16+
- Git repository initialized in workspace
- OpenVault CLI (`npm install -g openvault` or use bundled)

## Extension Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `openvault.defaultKeyMode` | `git-only` | Default key derivation mode |
| `openvault.defaultCamouflageType` | `markdown-tutorial` | Default camouflage type |
| `openvault.autoBackup` | `true` | Auto-create backup when sealing |
| `openvault.ovaultPath` | `""` | Custom path to ov CLI |

## Release Notes

### 0.3.0

- Initial release
- Seal/unlock with right-click menu
- Password generator with QR codes
- Explorer panel for sealed files
- Three key modes support

---

**Enjoy!**
