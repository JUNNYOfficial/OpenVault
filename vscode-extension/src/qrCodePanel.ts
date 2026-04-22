import * as vscode from 'vscode';
import * as QRCode from 'qrcode';

export class QRCodePanel {
    public static currentPanel: QRCodePanel | undefined;
    public static readonly viewType = 'openvaultQRCode';

    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];

    public static createOrShow(extensionUri: vscode.Uri, password: string) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        if (QRCodePanel.currentPanel) {
            QRCodePanel.currentPanel._panel.reveal(column);
            QRCodePanel.currentPanel._update(password);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            QRCodePanel.viewType,
            'OpenVault QR Code',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [extensionUri]
            }
        );

        QRCodePanel.currentPanel = new QRCodePanel(panel, extensionUri, password);
    }

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, password: string) {
        this._panel = panel;
        this._extensionUri = extensionUri;

        this._update(password);

        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    }

    private async _update(password: string) {
        const webview = this._panel.webview;
        
        // Generate QR code as data URL
        const qrDataUrl = await QRCode.toDataURL(password, {
            width: 400,
            margin: 2,
            errorCorrectionLevel: 'H'
        });

        webview.html = this._getHtmlForWebview(webview, qrDataUrl, password);
    }

    private _getHtmlForWebview(webview: vscode.Webview, qrDataUrl: string, password: string) {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OpenVault QR Code</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            background: var(--vscode-editor-background);
            color: var(--vscode-foreground);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            padding: 20px;
        }
        .container {
            text-align: center;
            max-width: 500px;
        }
        .qr-container {
            background: white;
            padding: 20px;
            border-radius: 12px;
            margin: 20px 0;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }
        .qr-container img {
            max-width: 100%;
            height: auto;
        }
        .password-box {
            background: var(--vscode-input-background);
            border: 1px solid var(--vscode-input-border);
            padding: 15px;
            border-radius: 8px;
            margin: 15px 0;
            font-family: monospace;
            font-size: 18px;
            letter-spacing: 2px;
            word-break: break-all;
        }
        .warning {
            background: var(--vscode-inputValidation-warningBackground);
            border: 1px solid var(--vscode-inputValidation-warningBorder);
            padding: 12px;
            border-radius: 6px;
            margin: 15px 0;
            font-size: 14px;
        }
        .actions {
            display: flex;
            gap: 10px;
            justify-content: center;
            margin-top: 20px;
        }
        button {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
        }
        button:hover {
            background: var(--vscode-button-hoverBackground);
        }
        h1 {
            margin-bottom: 10px;
        }
        .subtitle {
            color: var(--vscode-descriptionForeground);
            margin-bottom: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>📱 OpenVault QR Code</h1>
        <p class="subtitle">Scan with your phone camera</p>
        
        <div class="qr-container">
            <img src="${qrDataUrl}" alt="QR Code" />
        </div>
        
        <div class="password-box">${password}</div>
        
        <div class="warning">
            ⚠️ <strong>Important:</strong> Save this password securely.<br>
            It will <strong>NOT</strong> be shown again and <strong>CANNOT</strong> be recovered.
        </div>
        
        <div class="actions">
            <button onclick="copyPassword()">📋 Copy Password</button>
            <button onclick="downloadQR()">💾 Download QR</button>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        
        function copyPassword() {
            navigator.clipboard.writeText('${password}');
            vscode.postMessage({ command: 'copyPassword' });
        }
        
        function downloadQR() {
            const link = document.createElement('a');
            link.download = 'openvault-password-qr.png';
            link.href = '${qrDataUrl}';
            link.click();
            vscode.postMessage({ command: 'downloadQR' });
        }
    </script>
</body>
</html>`;
    }

    public dispose() {
        QRCodePanel.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }
}
