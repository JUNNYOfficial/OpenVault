# iOS Shortcut for OpenVault

You can create an iOS Shortcut to quickly decrypt OpenVault files on your iPhone/iPad.

## Setup

1. **Install the Shortcut**
   - Download the Shortcut app from App Store (if not installed)
   - Create a new Shortcut

2. **Shortcut Steps**

```
Shortcut: "OpenVault Decrypt"

1. Receive: Text from Share Sheet
2. Ask for: Text (Password)
   - Prompt: "Enter OpenVault password"
3. Open URL: 
   https://junnyofficial.github.io/OpenVault/mobile/?
   content=[Shortcut Input]&
   password=[Provided Input]
```

3. **Usage**
   - Open a sealed file in any app (GitHub, Files, etc.)
   - Tap Share → "OpenVault Decrypt"
   - Enter your password
   - The mobile web app opens with decrypted content

## Alternative: Direct Web App

1. Open Safari and go to:
   `https://junnyofficial.github.io/OpenVault/mobile/`

2. Tap Share → "Add to Home Screen"

3. Use the app offline to decrypt files

## Security Notes

- The web app runs entirely on your device
- No data is sent to any server
- Passwords are never stored
- Clear clipboard after use
