/**
 * OpenVault Mobile App Logic
 */

function switchTab(tabName) {
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    event.target.classList.add('active');
    document.getElementById(tabName + '-tab').classList.add('active');
}

async function decrypt() {
    const content = document.getElementById('sealed-content').value;
    const password = document.getElementById('password').value;
    const keyMode = document.getElementById('key-mode').value;

    const loading = document.getElementById('loading');
    const result = document.getElementById('result');
    const error = document.getElementById('error');
    const resultContent = document.getElementById('result-content');

    loading.classList.add('show');
    result.classList.remove('show');
    error.classList.remove('show');

    try {
        if (!content.trim()) {
            throw new Error(tm('errorEmptyContent'));
        }

        if (keyMode !== 'git-only' && !password) {
            throw new Error(tm('errorPasswordRequired'));
        }

        const payload = OpenVaultCrypto.extractPayload(content);
        const data = JSON.parse(payload);

        const decrypted = await OpenVaultCrypto.decrypt(
            data.data,
            data.iv,
            data.authTag,
            password
        );

        resultContent.textContent = decrypted;
        result.classList.add('show');

    } catch (err) {
        error.textContent = err.message;
        error.classList.add('show');
    } finally {
        loading.classList.remove('show');
    }
}

function generatePassword() {
    const password = OpenVaultCrypto.generatePassword();
    document.getElementById('generated-password').textContent = password;

    const entropy = OpenVaultCrypto.calculateEntropy(password);
    document.getElementById('entropy-badge').textContent = entropy.toFixed(1) + ' bits';
}

function generatePassphrase() {
    const passphrase = OpenVaultCrypto.generatePassphrase();
    document.getElementById('generated-passphrase').textContent = passphrase;

    const entropy = OpenVaultCrypto.calculateEntropy(passphrase);
    document.getElementById('passphrase-entropy').textContent = entropy.toFixed(1) + ' bits';
}

function copyResult() {
    const content = document.getElementById('result-content').textContent;
    if (content.trim()) {
        navigator.clipboard.writeText(content).then(() => {
            showToast(tm('copied'));
        });
    } else {
        showToast(tm('errorCopy'));
    }
}

function copyPassword() {
    const password = document.getElementById('generated-password').textContent;
    const placeholder = tm('tapGenerate');
    if (password && password !== placeholder) {
        navigator.clipboard.writeText(password).then(() => {
            showToast(tm('copied'));
        });
    } else {
        showToast(tm('errorCopy'));
    }
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        bottom: 100px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0,0,0,0.85);
        color: #e5e5e5;
        padding: 12px 24px;
        border-radius: 24px;
        font-size: 14px;
        z-index: 1000;
        animation: fadeIn 0.3s;
        border: 1px solid rgba(255,255,255,0.08);
    `;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s';
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

// Generate initial passwords
generatePassword();
generatePassphrase();

// Register service worker for PWA
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(console.error);
}
