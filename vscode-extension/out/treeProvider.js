"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenVaultItem = exports.OpenVaultTreeProvider = void 0;
const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
class OpenVaultTreeProvider {
    constructor() {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }
    refresh() {
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
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
                    new OpenVaultItem('No sealed files', vscode.TreeItemCollapsibleState.None, 'info')
                ]);
            }
            return Promise.resolve(shards.map((shard) => {
                const modeIcon = shard.keyMode === 'password-only' ? '🔐' :
                    shard.keyMode === 'password-enhanced' ? '🔒' : '🔓';
                const typeIcon = shard.type?.includes('python') ? '🐍' :
                    shard.type?.includes('js') ? '⚙️' : '📝';
                return new OpenVaultItem(`${typeIcon} ${shard.originalName || 'Unknown'}`, vscode.TreeItemCollapsibleState.None, 'shard', {
                    command: 'openvault.unlock',
                    title: 'Unlock',
                    arguments: [vscode.Uri.file(path.join(workspaceRoot, shard.file))]
                }, `${modeIcon} ${shard.type} | ${new Date(shard.created).toLocaleDateString()}`);
            }));
        }
        catch {
            return Promise.resolve([]);
        }
    }
}
exports.OpenVaultTreeProvider = OpenVaultTreeProvider;
class OpenVaultItem extends vscode.TreeItem {
    constructor(label, collapsibleState, contextValue, command, description) {
        super(label, collapsibleState);
        this.label = label;
        this.collapsibleState = collapsibleState;
        this.contextValue = contextValue;
        this.command = command;
        this.description = description;
        this.tooltip = this.label;
        this.description = this.description;
        if (contextValue === 'shard') {
            this.iconPath = new vscode.ThemeIcon('lock');
        }
        else if (contextValue === 'info') {
            this.iconPath = new vscode.ThemeIcon('info');
        }
    }
}
exports.OpenVaultItem = OpenVaultItem;
//# sourceMappingURL=treeProvider.js.map