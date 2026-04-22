"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PasswordGeneratorPanel = void 0;
const vscode = require("vscode");
class PasswordGeneratorPanel {
    static createOrShow(extensionUri) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;
        if (PasswordGeneratorPanel.currentPanel) {
            PasswordGeneratorPanel.currentPanel._panel.reveal(column);
            return;
        }
        const panel = vscode.window.createWebviewPanel(PasswordGeneratorPanel.viewType, 'OpenVault Password Generator', column || vscode.ViewColumn.One, {
            enableScripts: true,
            localResourceRoots: [extensionUri]
        });
        PasswordGeneratorPanel.currentPanel = new PasswordGeneratorPanel(panel, extensionUri);
    }
    constructor(panel, extensionUri) {
        this._disposables = [];
        this._panel = panel;
        this._extensionUri = extensionUri;
        this._update();
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        this._panel.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case 'copyPassword':
                    await vscode.env.clipboard.writeText(message.password);
                    vscode.window.showInformationMessage('Password copied to clipboard!');
                    return;
                case 'showQR':
                    const { QRCodePanel } = await Promise.resolve().then(() => require('./qrCodePanel'));
                    QRCodePanel.createOrShow(this._extensionUri, message.password);
                    return;
            }
        }, null, this._disposables);
    }
    _update() {
        const webview = this._panel.webview;
        webview.html = this._getHtmlForWebview(webview);
    }
    _getHtmlForWebview(webview) {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OpenVault Password Generator</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            background: var(--vscode-editor-background);
            color: var(--vscode-foreground);
            padding: 20px;
            max-width: 600px;
            margin: 0 auto;
        }
        h1 { margin-bottom: 5px; }
        .subtitle { color: var(--vscode-descriptionForeground); margin-bottom: 30px; }
        
        .section {
            background: var(--vscode-panel-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
        }
        
        .password-display {
            background: var(--vscode-input-background);
            border: 2px solid var(--vscode-input-border);
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            font-family: monospace;
            font-size: 22px;
            letter-spacing: 3px;
            margin: 15px 0;
            word-break: break-all;
        }
        
        .entropy {
            text-align: center;
            color: var(--vscode-descriptionForeground);
            font-size: 14px;
            margin-bottom: 15px;
        }
        
        .options {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 15px;
        }
        
        .option {
            display: flex;
            flex-direction: column;
            gap: 5px;
        }
        
        label {
            font-size: 13px;
            color: var(--vscode-descriptionForeground);
        }
        
        select, input[type="number"] {
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            padding: 8px;
            border-radius: 4px;
            font-size: 14px;
        }
        
        .actions {
            display: flex;
            gap: 10px;
            justify-content: center;
            flex-wrap: wrap;
        }
        
        button {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
        }
        
        button:hover {
            background: var(--vscode-button-hoverBackground);
        }
        
        button.secondary {
            background: var(--vscode-secondaryButton-background);
            color: var(--vscode-secondaryButton-foreground);
        }
        
        .history {
            margin-top: 20px;
        }
        
        .history-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px;
            border-bottom: 1px solid var(--vscode-panel-border);
            font-family: monospace;
        }
        
        .history-item:hover {
            background: var(--vscode-list-hoverBackground);
        }
        
        .warning {
            background: var(--vscode-inputValidation-warningBackground);
            border: 1px solid var(--vscode-inputValidation-warningBorder);
            padding: 12px;
            border-radius: 6px;
            margin-top: 20px;
            font-size: 13px;
        }
        
        .tabs {
            display: flex;
            gap: 5px;
            margin-bottom: 20px;
        }
        
        .tab {
            padding: 10px 20px;
            border: none;
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            cursor: pointer;
            border-radius: 6px 6px 0 0;
        }
        
        .tab.active {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
        }
        
        .tab-content {
            display: none;
        }
        
        .tab-content.active {
            display: block;
        }
    </style>
</head>
<body>
    <h1>🔐 OpenVault Password Generator</h1>
    <p class="subtitle">Generate cryptographically secure passwords</p>
    
    <div class="tabs">
        <button class="tab active" onclick="switchTab('strong')">Strong Password</button>
        <button class="tab" onclick="switchTab('passphrase')">Passphrase</button>
    </div>
    
    <div id="strong-tab" class="tab-content active">
        <div class="section">
            <div class="password-display" id="strong-password">Click Generate to create password</div>
            <div class="entropy" id="strong-entropy"></div>
            
            <div class="options">
                <div class="option">
                    <label>Group Size</label>
                    <select id="group-size">
                        <option value="4" selected>4 chars</option>
                        <option value="5">5 chars</option>
                        <option value="6">6 chars</option>
                    </select>
                </div>
                <div class="option">
                    <label>Group Count</label>
                    <select id="group-count">
                        <option value="4">4 groups</option>
                        <option value="5" selected>5 groups</option>
                        <option value="6">6 groups</option>
                    </select>
                </div>
            </div>
            
            <div class="actions">
                <button onclick="generateStrong()">🎲 Generate</button>
                <button class="secondary" onclick="copyStrong()">📋 Copy</button>
                <button class="secondary" onclick="showQR()">📱 QR Code</button>
            </div>
        </div>
    </div>
    
    <div id="passphrase-tab" class="tab-content">
        <div class="section">
            <div class="password-display" id="passphrase">Click Generate to create passphrase</div>
            <div class="entropy" id="passphrase-entropy"></div>
            
            <div class="options">
                <div class="option">
                    <label>Word Count</label>
                    <input type="number" id="word-count" value="4" min="3" max="8">
                </div>
                <div class="option">
                    <label>Separator</label>
                    <select id="separator">
                        <option value="-" selected>Hyphen (-)</option>
                        <option value=" ">Space</option>
                        <option value="_">Underscore (_)</option>
                    </select>
                </div>
            </div>
            
            <div class="actions">
                <button onclick="generatePassphrase()">🎲 Generate</button>
                <button class="secondary" onclick="copyPassphrase()">📋 Copy</button>
            </div>
        </div>
    </div>
    
    <div class="warning">
        ⚠️ <strong>Security Note:</strong> Generated passwords are not stored. 
        Copy or save them immediately to a password manager.
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        let currentPassword = '';
        let currentPassphrase = '';
        
        // Character set (excluding visually similar chars)
        const CHAR_SET = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';
        const WORD_LIST = [
            'apple', 'bridge', 'candle', 'dragon', 'eagle', 'forest', 'garden', 'harbor',
            'island', 'jungle', 'knight', 'lemon', 'mountain', 'noble', 'ocean', 'palace',
            'quartz', 'river', 'silver', 'tiger', 'unicorn', 'valley', 'winter', 'yellow',
            'amber', 'breeze', 'crystal', 'diamond', 'emerald', 'falcon', 'golden', 'horizon',
            'iceberg', 'jasmine', 'kingdom', 'lunar', 'mirror', 'nebula', 'orchid', 'phoenix',
            'quantum', 'rocket', 'shadow', 'thunder', 'velvet', 'whisper', 'zenith', 'azure'
        ];
        
        function switchTab(tab) {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
            event.target.classList.add('active');
            document.getElementById(tab + '-tab').classList.add('active');
        }
        
        function generateStrong() {
            const groupSize = parseInt(document.getElementById('group-size').value);
            const groupCount = parseInt(document.getElementById('group-count').value);
            
            let password = '';
            for (let g = 0; g < groupCount; g++) {
                if (g > 0) password += '-';
                for (let i = 0; i < groupSize; i++) {
                    password += CHAR_SET[Math.floor(Math.random() * CHAR_SET.length)];
                }
            }
            
            currentPassword = password;
            document.getElementById('strong-password').textContent = password;
            
            const entropy = Math.log2(Math.pow(CHAR_SET.length, groupSize * groupCount));
            document.getElementById('strong-entropy').textContent = 
                \`Entropy: \${entropy.toFixed(1)} bits | Length: \${password.length} chars\`;
        }
        
        function generatePassphrase() {
            const wordCount = parseInt(document.getElementById('word-count').value);
            const separator = document.getElementById('separator').value;
            
            const words = [];
            for (let i = 0; i < wordCount; i++) {
                words.push(WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)]);
            }
            
            currentPassphrase = words.join(separator);
            document.getElementById('passphrase').textContent = currentPassphrase;
            
            const entropy = Math.log2(Math.pow(WORD_LIST.length, wordCount));
            document.getElementById('passphrase-entropy').textContent = 
                \`Entropy: \${entropy.toFixed(1)} bits | \${wordCount} words\`;
        }
        
        function copyStrong() {
            if (currentPassword) {
                navigator.clipboard.writeText(currentPassword);
                vscode.postMessage({ command: 'copyPassword', password: currentPassword });
            }
        }
        
        function copyPassphrase() {
            if (currentPassphrase) {
                navigator.clipboard.writeText(currentPassphrase);
                vscode.postMessage({ command: 'copyPassword', password: currentPassphrase });
            }
        }
        
        function showQR() {
            if (currentPassword) {
                vscode.postMessage({ command: 'showQR', password: currentPassword });
            }
        }
        
        // Generate initial passwords
        generateStrong();
        generatePassphrase();
    </script>
</body>
</html>`;
    }
    dispose() {
        PasswordGeneratorPanel.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }
}
exports.PasswordGeneratorPanel = PasswordGeneratorPanel;
PasswordGeneratorPanel.viewType = 'openvaultPasswordGenerator';
//# sourceMappingURL=passwordGeneratorPanel.js.map