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
            throw new Error('Please paste the sealed file content');
        }
        
        if (keyMode !== 'git-only' && !password) {
            throw new Error('Password is required for this key mode');
        }
        
        // Extract hidden payload
        const payload = OpenVaultCrypto.extractPayload(content);
        
        // Parse payload
        const data = JSON.parse(payload);
        
        // Decrypt
        const decrypted = await OpenVaultCrypto.decrypt(
            data.data,
            data.iv,
            data.authTag,
            password
        );
        
        resultContent.textContent = decrypted;
        result.classList.add('show');
        
    } catch (err) {
        error.textContent = '❌ ' + err.message;
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
    navigator.clipboard.writeText(content).then(() => {
        showToast('Copied to clipboard!');
    });
}

function copyPassword() {
    const password = document.getElementById('generated-password').textContent;
    if (password && password !== 'Tap Generate') {
        navigator.clipboard.writeText(password).then(() => {
            showToast('Password copied!');
        });
    }
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        bottom: 100px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 12px 24px;
        border-radius: 24px;
        font-size: 14px;
        z-index: 1000;
        animation: fadeIn 0.3s;
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
