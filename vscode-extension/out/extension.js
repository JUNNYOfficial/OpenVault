"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = require("vscode");
const openvaultManager_1 = require("./openvaultManager");
const qrCodePanel_1 = require("./qrCodePanel");
const passwordGeneratorPanel_1 = require("./passwordGeneratorPanel");
const treeProvider_1 = require("./treeProvider");
function activate(context) {
    const manager = new openvaultManager_1.OpenVaultManager();
    const treeProvider = new treeProvider_1.OpenVaultTreeProvider();
    // Register tree view
    vscode.window.registerTreeDataProvider('openvaultExplorer', treeProvider);
    // Check if OpenVault is initialized
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (workspaceRoot) {
        manager.isInitialized(workspaceRoot).then((initialized) => {
            vscode.commands.executeCommand('setContext', 'workspaceHasOpenVault', initialized);
            if (initialized) {
                treeProvider.refresh();
            }
        });
    }
    // Register commands
    context.subscriptions.push(vscode.commands.registerCommand('openvault.seal', async (uri) => {
        try {
            const filePath = uri?.fsPath || vscode.window.activeTextEditor?.document.fileName;
            if (!filePath) {
                vscode.window.showErrorMessage('No file selected');
                return;
            }
            // Show quick pick for key mode
            const config = vscode.workspace.getConfiguration('openvault');
            const keyMode = await vscode.window.showQuickPick([
                { label: '🔓 Git-Only', description: 'Key from Git state only', value: 'git-only' },
                { label: '🔒 Password-Enhanced', description: 'Git + password (two-factor)', value: 'password-enhanced' },
                { label: '🔐 Password-Only', description: 'Password only (portable)', value: 'password-only' }
            ], { placeHolder: 'Select key mode' });
            if (!keyMode)
                return;
            // Show quick pick for camouflage type
            const camoType = await vscode.window.showQuickPick([
                { label: '📝 Markdown Tutorial', description: 'React Hooks guide', value: 'markdown-tutorial' },
                { label: '📝 Markdown Blog', description: 'Web performance article', value: 'markdown-blog' },
                { label: '🐍 Python Script', description: 'CSV converter script', value: 'python-script' },
                { label: '⚙️ JS Config', description: 'Vite configuration', value: 'js-config' },
                { label: '🐳 Dockerfile', description: 'Docker container config', value: 'dockerfile' },
                { label: '🔧 GitHub Action', description: 'CI/CD workflow', value: 'github-action' },
                { label: '📦 JSON Config', description: 'Package/Project config', value: 'json-config' },
                { label: '🔷 TypeScript Config', description: 'TS compiler config', value: 'typescript-config' },
                { label: '🦀 Rust Cargo', description: 'Rust package manifest', value: 'rust-cargo' },
                { label: '🔵 Go Module', description: 'Go module definition', value: 'go-module' },
                { label: '🐚 Shell Script', description: 'Bash deployment script', value: 'shell-script' },
                { label: '🔑 Env File', description: 'Environment variables example', value: 'env-file' }
            ], { placeHolder: 'Select camouflage type' });
            if (!camoType)
                return;
            let password;
            let generatePassword = false;
            if (keyMode.value !== 'git-only') {
                const pwdChoice = await vscode.window.showQuickPick([
                    { label: '🔐 Auto-generate strong password', value: 'auto' },
                    { label: '⌨️ Enter my own password', value: 'manual' }
                ], { placeHolder: 'How do you want to set the password?' });
                if (!pwdChoice)
                    return;
                if (pwdChoice.value === 'auto') {
                    generatePassword = true;
                }
                else {
                    password = await vscode.window.showInputBox({
                        prompt: 'Enter password',
                        password: true,
                        validateInput: (value) => value.length < 8 ? 'Password must be at least 8 characters' : null
                    });
                    if (!password)
                        return;
                }
            }
            // Show progress
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Sealing file...',
                cancellable: false
            }, async () => {
                const result = await manager.seal(filePath, {
                    keyMode: keyMode.value,
                    camouflageType: camoType.value,
                    password,
                    generatePassword
                });
                if (result.success) {
                    let message = `✅ Sealed: ${result.outputPath}`;
                    if (result.password) {
                        message += `\n\n🔐 Password: ${result.password}`;
                        message += `\n⚠️ Save this password! It will not be shown again.`;
                        // Show password in a modal
                        const action = await vscode.window.showInformationMessage(`File sealed successfully!\n\nPassword: ${result.password}\n\nSave this password - it will not be shown again.`, 'Copy Password', 'Show QR Code', 'OK');
                        if (action === 'Copy Password') {
                            await vscode.env.clipboard.writeText(result.password);
                            vscode.window.showInformationMessage('Password copied to clipboard!');
                        }
                        else if (action === 'Show QR Code') {
                            qrCodePanel_1.QRCodePanel.createOrShow(context.extensionUri, result.password);
                        }
                    }
                    else {
                        vscode.window.showInformationMessage(message);
                    }
                    treeProvider.refresh();
                }
                else {
                    vscode.window.showErrorMessage(`❌ Seal failed: ${result.error}`);
                }
            });
        }
        catch (error) {
            vscode.window.showErrorMessage(`Error: ${error}`);
        }
    }));
    context.subscriptions.push(vscode.commands.registerCommand('openvault.unlock', async (uri) => {
        try {
            const filePath = uri?.fsPath || vscode.window.activeTextEditor?.document.fileName;
            if (!filePath) {
                vscode.window.showErrorMessage('No file selected');
                return;
            }
            // Check if file might need password
            const needsPassword = await manager.checkIfNeedsPassword(filePath);
            let password;
            if (needsPassword) {
                password = await vscode.window.showInputBox({
                    prompt: 'Enter password to unlock',
                    password: true
                });
                if (!password)
                    return;
            }
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Unlocking file...',
                cancellable: false
            }, async () => {
                const result = await manager.unlock(filePath, { password });
                if (result.success && result.outputPath) {
                    vscode.window.showInformationMessage(`🔓 Unlocked: ${result.outputPath}`);
                    // Open the decrypted file
                    const doc = await vscode.workspace.openTextDocument(result.outputPath);
                    await vscode.window.showTextDocument(doc);
                }
                else {
                    vscode.window.showErrorMessage(`❌ Unlock failed: ${result.error}`);
                }
            });
        }
        catch (error) {
            vscode.window.showErrorMessage(`Error: ${error}`);
        }
    }));
    context.subscriptions.push(vscode.commands.registerCommand('openvault.generatePassword', async () => {
        passwordGeneratorPanel_1.PasswordGeneratorPanel.createOrShow(context.extensionUri);
    }));
    context.subscriptions.push(vscode.commands.registerCommand('openvault.showQRCode', async () => {
        const password = await vscode.window.showInputBox({
            prompt: 'Enter password to encode as QR Code',
            password: true
        });
        if (password) {
            qrCodePanel_1.QRCodePanel.createOrShow(context.extensionUri, password);
        }
    }));
    context.subscriptions.push(vscode.commands.registerCommand('openvault.listShards', async () => {
        try {
            const shards = await manager.listShards();
            if (shards.length === 0) {
                vscode.window.showInformationMessage('📭 No sealed files found');
                return;
            }
            const items = shards.map((shard) => ({
                label: `$(file) ${shard.originalName || 'Unknown'}`,
                description: shard.file,
                detail: `Type: ${shard.type} | Mode: ${shard.keyMode} | ${new Date(shard.created).toLocaleDateString()}`
            }));
            const selected = await vscode.window.showQuickPick(items, {
                placeHolder: 'Select a sealed file to unlock'
            });
            if (selected) {
                vscode.commands.executeCommand('openvault.unlock', vscode.Uri.file(selected.description));
            }
        }
        catch (error) {
            vscode.window.showErrorMessage(`Error: ${error}`);
        }
    }));
    context.subscriptions.push(vscode.commands.registerCommand('openvault.init', async () => {
        try {
            const result = await manager.init();
            if (result.success) {
                vscode.window.showInformationMessage('✅ OpenVault initialized!');
                vscode.commands.executeCommand('setContext', 'workspaceHasOpenVault', true);
                treeProvider.refresh();
            }
            else {
                vscode.window.showErrorMessage(`❌ Init failed: ${result.error}`);
            }
        }
        catch (error) {
            vscode.window.showErrorMessage(`Error: ${error}`);
        }
    }));
    context.subscriptions.push(vscode.commands.registerCommand('openvault.keyInfo', async () => {
        try {
            const info = await manager.getKeyInfo();
            const panel = vscode.window.createWebviewPanel('openvaultKeyInfo', 'OpenVault Key Info', vscode.ViewColumn.One, {});
            panel.webview.html = `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <style>
                            body { font-family: var(--vscode-font-family); padding: 20px; }
                            .card { background: var(--vscode-editor-background); border: 1px solid var(--vscode-panel-border); padding: 15px; margin: 10px 0; border-radius: 6px; }
                            .label { color: var(--vscode-descriptionForeground); font-size: 12px; }
                            .value { font-size: 16px; margin: 5px 0; }
                            .mode { display: flex; align-items: center; gap: 10px; padding: 8px; margin: 5px 0; border-radius: 4px; }
                            .mode:hover { background: var(--vscode-list-hoverBackground); }
                            .icon { font-size: 20px; }
                        </style>
                    </head>
                    <body>
                        <h2>🔑 OpenVault Key Derivation Info</h2>
                        <div class="card">
                            <div class="label">Repository</div>
                            <div class="value">${info.repoName}</div>
                        </div>
                        <div class="card">
                            <div class="label">Commit Hash</div>
                            <div class="value">${info.commitHash}</div>
                        </div>
                        <div class="card">
                            <div class="label">Identity</div>
                            <div class="value">${info.userEmail}</div>
                        </div>
                        <div class="card">
                            <div class="label">SSH Key</div>
                            <div class="value">${info.sshFingerprint || 'Not found'}</div>
                        </div>
                        <h3>Key Modes</h3>
                        <div class="mode">
                            <span class="icon">🔓</span>
                            <div>
                                <strong>Git-Only</strong><br>
                                <small>Derived from Git state only</small>
                            </div>
                        </div>
                        <div class="mode">
                            <span class="icon">🔒</span>
                            <div>
                                <strong>Password-Enhanced</strong><br>
                                <small>Git state + your password (two-factor)</small>
                            </div>
                        </div>
                        <div class="mode">
                            <span class="icon">🔐</span>
                            <div>
                                <strong>Password-Only</strong><br>
                                <small>Password only (portable across devices)</small>
                            </div>
                        </div>
                    </body>
                    </html>
                `;
        }
        catch (error) {
            vscode.window.showErrorMessage(`Error: ${error}`);
        }
    }));
    // Status bar item
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.text = '$(shield) OpenVault';
    statusBarItem.tooltip = 'Click to seal/unlock files';
    statusBarItem.command = 'openvault.listShards';
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);
    console.log('OpenVault extension activated');
}
function deactivate() {
    console.log('OpenVault extension deactivated');
}
//# sourceMappingURL=extension.js.map