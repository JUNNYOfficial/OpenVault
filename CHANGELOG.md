# Changelog

All notable changes to this project will be documented in this file.

## [0.4.0-beta] - 2024

### Added
- **5 new camouflage templates** (12 total):
  - `typescript-config` — TypeScript compiler configuration
  - `rust-cargo` — Rust Cargo.toml manifest
  - `go-module` — Go module definition
  - `shell-script` — Bash deployment script
  - `env-file` — Environment variables example
- **`ov verify <file>` command** — Quickly check if a file is a valid OpenVault sealed file without decrypting
- **GitHub Action auto-deploy workflow** — Automatically deploys the mobile PWA to GitHub Pages on push
- **Auto-deploy validation workflow** — Tests all 12 camouflage templates on every push

### Improved
- VS Code Extension now supports all 12 camouflage types in the quick pick menu
- VS Code Extension unlock context menu now recognizes `.json`, `.yml`, `.toml`, `.sh` files
- `.gitignore` properly ignores backup directories while keeping manifest tracked
- Removed debug `console.log` from camouflage encoding
- Suppressed noisy Git stderr output during key derivation
- Fixed redundant regex ranges in zero-width character extraction
- Added defensive check to prevent data loss when `slots > sections.length` in templates
- Fixed duplicate manifest entries when re-sealing the same file

### Security
- Key derivation stderr suppression prevents information leakage in CI environments

## [0.3.0] - 2024

### Added
- 7 camouflage types (Markdown, Python, JS, Dockerfile, GitHub Action, JSON)
- 4 password manager integrations (1Password, Bitwarden, KeePass, LastPass)
- Mobile unlock PWA for iOS/Android
- VS Code Extension
- QR Code backup system
- Apple-style strong password generator

## [0.2.0] - 2024

### Added
- Apple-style strong password generation
- 3 key modes (git-only, password-enhanced, password-only)
- Enhanced camouflage templates

## [0.1.0] - 2024

### Added
- Initial MVP release
- CLI tool with basic seal/unlock
- Git-native key derivation
- 4 camouflage templates
