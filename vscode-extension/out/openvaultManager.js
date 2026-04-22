"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenVaultManager = void 0;
const vscode = require("vscode");
const child_process_1 = require("child_process");
const path = require("path");
const fs = require("fs");
class OpenVaultManager {
    get ovaultPath() {
        const config = vscode.workspace.getConfiguration('openvault');
        const customPath = config.get('ovaultPath');
        if (customPath && fs.existsSync(customPath)) {
            return customPath;
        }
        // Try to find ov CLI in PATH or use local
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (workspaceRoot) {
            const localPath = path.join(workspaceRoot, 'src', 'cli.js');
            if (fs.existsSync(localPath)) {
                return `node ${localPath}`;
            }
        }
        return 'ov';
    }
    get workspaceRoot() {
        return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    }
    async isInitialized(dir) {
        try {
            return fs.existsSync(path.join(dir, '.openvault', 'manifest.json'));
        }
        catch {
            return false;
        }
    }
    async init() {
        try {
            const cwd = this.workspaceRoot;
            if (!cwd) {
                return { success: false, error: 'No workspace open' };
            }
            (0, child_process_1.execSync)(`${this.ovaultPath} init`, { cwd });
            return { success: true };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async seal(filePath, options) {
        try {
            const cwd = this.workspaceRoot;
            if (!cwd) {
                return { success: false, error: 'No workspace open' };
            }
            let cmd = `${this.ovaultPath} seal "${filePath}" -m ${options.keyMode} -t ${options.camouflageType}`;
            if (options.password) {
                cmd += ` -p "${options.password}"`;
            }
            else if (options.generatePassword) {
                cmd += ' --generate-password';
            }
            const output = (0, child_process_1.execSync)(cmd, { cwd, encoding: 'utf-8' });
            // Parse output to extract password if generated
            const passwordMatch = output.match(/Password:\s*(\S+)/);
            const password = passwordMatch ? passwordMatch[1] : undefined;
            // Extract output path
            const pathMatch = output.match(/Sealed:\s*(.+)/);
            const outputPath = pathMatch ? pathMatch[1].trim() : undefined;
            return { success: true, outputPath, password };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async unlock(filePath, options) {
        try {
            const cwd = this.workspaceRoot;
            if (!cwd) {
                return { success: false, error: 'No workspace open' };
            }
            let cmd = `${this.ovaultPath} unlock "${filePath}"`;
            if (options.password) {
                cmd += ` -p "${options.password}"`;
            }
            const output = (0, child_process_1.execSync)(cmd, { cwd, encoding: 'utf-8' });
            const pathMatch = output.match(/Unlocked:\s*(.+)/);
            const outputPath = pathMatch ? pathMatch[1].trim() : undefined;
            return { success: true, outputPath };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async checkIfNeedsPassword(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            // Check if file contains password-only or password-enhanced marker
            // This is a heuristic - in production, we'd check the manifest
            return content.includes('password-only') || content.includes('password-enhanced');
        }
        catch {
            return false;
        }
    }
    async listShards() {
        try {
            const cwd = this.workspaceRoot;
            if (!cwd)
                return [];
            const manifestPath = path.join(cwd, '.openvault', 'manifest.json');
            if (!fs.existsSync(manifestPath))
                return [];
            const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
            return manifest.shards || [];
        }
        catch {
            return [];
        }
    }
    async getKeyInfo() {
        try {
            const cwd = this.workspaceRoot;
            if (!cwd) {
                return { repoName: 'N/A', commitHash: 'N/A', userEmail: 'N/A', sshFingerprint: 'N/A' };
            }
            let repoName = 'unknown';
            let commitHash = 'unknown';
            let userEmail = 'unknown';
            let sshFingerprint = 'not found';
            try {
                repoName = (0, child_process_1.execSync)('git remote get-url origin', { cwd, encoding: 'utf-8' }).trim();
                const match = repoName.match(/\/([^\/]+?)(?:\.git)?$/);
                if (match)
                    repoName = match[1];
            }
            catch { /* ignore */ }
            try {
                commitHash = (0, child_process_1.execSync)('git rev-parse HEAD', { cwd, encoding: 'utf-8' }).trim().slice(0, 12);
            }
            catch { /* ignore */ }
            try {
                userEmail = (0, child_process_1.execSync)('git config user.email', { cwd, encoding: 'utf-8' }).trim();
            }
            catch { /* ignore */ }
            try {
                const sshDir = path.join(require('os').homedir(), '.ssh');
                const keyFiles = ['id_ed25519.pub', 'id_rsa.pub'];
                for (const keyFile of keyFiles) {
                    const keyPath = path.join(sshDir, keyFile);
                    if (fs.existsSync(keyPath)) {
                        const fp = (0, child_process_1.execSync)(`ssh-keygen -lf ${keyPath}`, { encoding: 'utf-8' }).trim();
                        const match = fp.match(/SHA256:([A-Za-z0-9+\/]+)/);
                        if (match) {
                            sshFingerprint = `SHA256:${match[1]}`;
                            break;
                        }
                    }
                }
            }
            catch { /* ignore */ }
            return { repoName, commitHash, userEmail, sshFingerprint };
        }
        catch {
            return { repoName: 'unknown', commitHash: 'unknown', userEmail: 'unknown', sshFingerprint: 'not found' };
        }
    }
}
exports.OpenVaultManager = OpenVaultManager;
//# sourceMappingURL=openvaultManager.js.map