import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class OpenVaultTreeProvider implements vscode.TreeDataProvider<OpenVaultItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<OpenVaultItem | undefined | null | void> = new vscode.EventEmitter<OpenVaultItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<OpenVaultItem | undefined | null | void> = this._onDidChangeTreeData.event;

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: OpenVaultItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: OpenVaultItem): Thenable<OpenVaultItem[]> {
        if (element) {
            return Promise.resolve([]);
        }

        const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (!workspaceRoot) {
            return Promise.resolve([]);
        }

        const manifestPath = path.join(workspaceRoot, '.openvault', 'manifest.json');
        if (!fs.existsSync(manifestPath)) {
            return Promise.resolve([]);
        }

        try {
            const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
            const shards = manifest.shards || [];

            if (shards.length === 0) {
                return Promise.resolve([
                    new OpenVaultItem(
                        'No sealed files',
                        vscode.TreeItemCollapsibleState.None,
                        'info'
                    )
                ]);
            }

            return Promise.resolve(shards.map((shard: any) => {
                const modeIcon = shard.keyMode === 'password-only' ? '🔐' :
                    shard.keyMode === 'password-enhanced' ? '🔒' : '🔓';
                
                const typeIcon = shard.type?.includes('python') ? '🐍' :
                    shard.type?.includes('js') ? '⚙️' : '📝';

                return new OpenVaultItem(
                    `${typeIcon} ${shard.originalName || 'Unknown'}`,
                    vscode.TreeItemCollapsibleState.None,
                    'shard',
                    {
                        command: 'openvault.unlock',
                        title: 'Unlock',
                        arguments: [vscode.Uri.file(path.join(workspaceRoot, shard.file))]
                    },
                    `${modeIcon} ${shard.type} | ${new Date(shard.created).toLocaleDateString()}`
                );
            }));
        } catch {
            return Promise.resolve([]);
        }
    }
}

export class OpenVaultItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly contextValue: string,
        public readonly command?: vscode.Command,
        public readonly description?: string
    ) {
        super(label, collapsibleState);
        this.tooltip = this.label;
        this.description = this.description;
        
        if (contextValue === 'shard') {
            this.iconPath = new vscode.ThemeIcon('lock');
        } else if (contextValue === 'info') {
            this.iconPath = new vscode.ThemeIcon('info');
        }
    }
}
