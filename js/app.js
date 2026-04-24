/**
 * OpenVault Frontend App
 * Browser-native seal/unlock interface — no server needed.
 */

// Tab switching
function switchTab(tabName) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    event.target.classList.add('active');
    document.getElementById(tabName + '-tab').classList.add('active');
}

function showResult(id, title, content) {
    const el = document.getElementById(id);
    el.querySelector('.result-title').textContent = title;
    el.querySelector('.result-content').textContent = content;
    el.classList.add('show');
}

function showError(id, message) {
    document.getElementById(id).textContent = message;
    document.getElementById(id).classList.add('show');
}

function hideResults() {
    document.querySelectorAll('.result, .error').forEach(el => el.classList.remove('show'));
}

// ===== SEAL =====

function generateSealPassword() {
    const pwd = PasswordGenerator.generatePassword();
    document.getElementById('seal-password').value = pwd;
    updateSealEntropy();
}

function updateSealEntropy() {
    const pwd = document.getElementById('seal-password').value;
    if (pwd) {
        const entropy = PasswordGenerator.calculateEntropy(pwd);
        document.getElementById('seal-entropy').textContent = `${entropy.toFixed(1)} bits`;
    } else {
        document.getElementById('seal-entropy').textContent = '';
    }
}

document.getElementById('seal-password').addEventListener('input', updateSealEntropy);

async function doSeal() {
    hideResults();
    const loading = document.getElementById('seal-loading');
    loading.classList.add('show');

    try {
        const content = document.getElementById('seal-content').value;
        if (!content.trim()) {
            throw new Error(t('errorEmptyContent'));
        }

        const camoType = document.getElementById('seal-type').value;
        const password = document.getElementById('seal-password').value;

        if (!password) {
            throw new Error(t('errorEmptyPassword'));
        }

        // Encrypt
        const encrypted = await OpenVaultCrypto.encrypt(content, password);

        // Build payload
        const payload = JSON.stringify({
            iv: encrypted.iv,
            authTag: encrypted.authTag,
            data: encrypted.data,
            originalName: 'secret.txt',
            sealedAt: new Date().toISOString(),
            keyMode: 'password-only',
            hasPassword: true
        });

        // Camouflage
        const camo = Camouflage.camouflage(payload, camoType);

        // Show result
        showResult('seal-result', t('sealResult'), camo);

        // Setup download
        const blob = new Blob([camo], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.getElementById('seal-download');
        const extMap = {
            'markdown-tutorial': 'md',
            'markdown-blog': 'md',
            'python-script': 'py',
            'js-config': 'js',
            'dockerfile': 'Dockerfile',
            'github-action': 'yml',
            'json-config': 'json',
            'typescript-config': 'json',
            'rust-cargo': 'toml',
            'go-module': 'mod',
            'shell-script': 'sh',
            'env-file': 'env'
        };
        link.href = url;
        link.download = `sealed.${extMap[camoType] || 'txt'}`;
        link.style.display = 'inline-block';

    } catch (err) {
        showError('seal-error', err.message);
    } finally {
        loading.classList.remove('show');
    }
}

// ===== UNLOCK =====

async function doUnlock() {
    hideResults();
    const loading = document.getElementById('unlock-loading');
    loading.classList.add('show');

    try {
        const content = document.getElementById('unlock-content').value;
        const password = document.getElementById('unlock-password').value;

        if (!content.trim()) {
            throw new Error(t('errorEmptyUnlockContent'));
        }
        if (!password) {
            throw new Error(t('errorEmptyUnlockPassword'));
        }

        // Extract payload
        const payload = Camouflage.decamouflage(content);
        const data = JSON.parse(payload);

        // Decrypt
        const decrypted = await OpenVaultCrypto.decrypt(
            data.data,
            data.iv,
            data.authTag,
            password
        );

        showResult('unlock-result', t('unlockResult'), decrypted);

        // Setup download
        const blob = new Blob([decrypted], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.getElementById('unlock-download');
        link.href = url;
        link.download = data.originalName || 'decrypted.txt';
        link.style.display = 'inline-block';

    } catch (err) {
        showError('unlock-error', err.message);
    } finally {
        loading.classList.remove('show');
    }
}

// ===== PASSWORD =====

function doGeneratePassword() {
    const pwd = PasswordGenerator.generatePassword();
    document.getElementById('password-output').textContent = pwd;
    const entropy = PasswordGenerator.calculateEntropy(pwd);
    document.getElementById('password-entropy').textContent = `${entropy.toFixed(1)} bits`;
}

function doCopyPassword() {
    const text = document.getElementById('password-output').textContent;
    const placeholder = t('pwdOutput');
    if (text && text !== placeholder) {
        navigator.clipboard.writeText(text);
        const btn = event.target;
        const original = btn.textContent;
        btn.textContent = t('pwdCopied');
        setTimeout(() => btn.textContent = original, 1500);
    }
}

function doGeneratePassphrase() {
    const phrase = PasswordGenerator.generatePassphrase();
    document.getElementById('passphrase-output').textContent = phrase;
    const entropy = PasswordGenerator.calculateEntropy(phrase);
    document.getElementById('passphrase-entropy').textContent = `${entropy.toFixed(1)} bits`;
}

function doCopyPassphrase() {
    const text = document.getElementById('passphrase-output').textContent;
    const placeholder = t('passphraseOutput');
    if (text && text !== placeholder) {
        navigator.clipboard.writeText(text);
        const btn = event.target;
        const original = btn.textContent;
        btn.textContent = t('pwdCopied');
        setTimeout(() => btn.textContent = original, 1500);
    }
}

// ===== VERIFY =====

function doVerify() {
    hideResults();

    try {
        const content = document.getElementById('verify-content').value;
        if (!content.trim()) {
            throw new Error(t('errorEmptyVerifyContent'));
        }

        const payload = Camouflage.decamouflage(content);
        const data = JSON.parse(payload);

        if (!data.iv || !data.authTag || !data.data) {
            throw new Error('Invalid payload structure');
        }

        let resultText = `${t('verifyValid')}\n\n`;
        resultText += `${t('verifyOriginalName')}: ${data.originalName || 'unknown'}\n`;
        resultText += `${t('verifyKeyMode')}: ${data.keyMode || 'unknown'}\n`;
        resultText += `${t('verifyHasPassword')}: ${data.hasPassword ? t('verifyYes') : t('verifyNo')}\n`;
        if (data.sealedAt) {
            resultText += `${t('verifySealed')}: ${new Date(data.sealedAt).toLocaleString()}\n`;
        }

        showResult('verify-result', t('verifyResult'), resultText);

    } catch (err) {
        showError('verify-error', `${t('verifyInvalid')}\n${t('errorReason')}: ${err.message}`);
    }
}

function copyVerifyResult() {
    const el = document.querySelector('#verify-result .result-content');
    if (el && el.textContent.trim()) {
        navigator.clipboard.writeText(el.textContent);
        const btn = event.target;
        const original = btn.textContent;
        btn.textContent = t('copied');
        setTimeout(() => btn.textContent = original, 1500);
    }
}

function copySealResult() {
    const el = document.querySelector('#seal-result .result-content');
    if (el && el.textContent.trim()) {
        navigator.clipboard.writeText(el.textContent);
        const btn = event.target;
        const original = btn.textContent;
        btn.textContent = t('copied');
        setTimeout(() => btn.textContent = original, 1500);
    }
}

function copyUnlockResult() {
    const el = document.querySelector('#unlock-result .result-content');
    if (el && el.textContent.trim()) {
        navigator.clipboard.writeText(el.textContent);
        const btn = event.target;
        const original = btn.textContent;
        btn.textContent = t('copied');
        setTimeout(() => btn.textContent = original, 1500);
    }
}

// ===== FILE UPLOAD HELPERS =====

function handleFileUpload(inputId, targetId) {
    const input = document.getElementById(inputId);
    const target = document.getElementById(targetId);
    input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            target.value = ev.target.result;
        };
        reader.readAsText(file);

        // Update file label with selected filename
        const label = input.labels && input.labels[0];
        if (label) {
            label.textContent = file.name;
            label.style.color = 'var(--text-secondary)';
        }
    });
}

handleFileUpload('seal-file', 'seal-content');
handleFileUpload('unlock-file', 'unlock-content');
handleFileUpload('verify-file', 'verify-content');
