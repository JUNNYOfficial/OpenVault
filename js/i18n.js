const I18N = {
    en: {
        title: 'OpenVault',
        pageTitle: 'OpenVault',
        subtitle: 'Encrypt your secrets into files that look completely normal. No server needed.',
        langSwitch: '中文',

        tabSeal: 'Seal',
        tabUnlock: 'Unlock',
        tabPassword: 'Password',
        tabVerify: 'Verify',

        sealTitle: 'Content to Encrypt',
        sealInfo: 'Enter text below or upload a file. Your content will be encrypted with AES-256-GCM and hidden inside a realistic-looking file.',
        sealUpload: 'Choose file',
        sealPlaceholder: 'Paste your secret content here...',
        sealType: 'Camouflage Type',
        sealPassword: 'Password',
        sealPasswordPlaceholder: 'Enter a strong password',
        sealEntropy: 'Entropy',
        sealAutoGen: 'Auto-Generate',
        sealClear: 'Clear',
        sealBtn: 'Seal & Camouflage',
        sealLoading: 'Encrypting...',
        sealResult: 'Sealed Content',
        sealDownload: 'Download File',

        unlockTitle: 'Sealed File Content',
        unlockInfo: 'Paste the content of a sealed file below or upload it. The file looks normal but contains hidden encrypted data.',
        unlockUpload: 'Choose file',
        unlockPlaceholder: 'Paste the entire file content here...',
        unlockPassword: 'Password',
        unlockPasswordPlaceholder: 'Enter the password used to seal this file',
        unlockBtn: 'Unlock & Decrypt',
        unlockLoading: 'Decrypting...',
        unlockResult: 'Decrypted Content',
        unlockDownload: 'Download Original',

        pwdTitle: 'Strong Password',
        pwdOutput: 'Click Generate',
        pwdGenerate: 'Generate',
        pwdCopy: 'Copy',
        pwdCopied: 'Copied!',
        copyBtn: 'Copy',
        copied: 'Copied!',
        passphraseTitle: 'Memorable Passphrase',
        passphraseOutput: 'Click Generate',

        verifyTitle: 'File to Verify',
        verifyInfo: 'Check if a file contains valid OpenVault encrypted data without decrypting it.',
        verifyUpload: 'Choose file',
        verifyPlaceholder: 'Paste file content here...',
        verifyBtn: 'Verify',
        verifyResult: 'Verification Result',
        verifyValid: 'Valid OpenVault sealed file',
        verifyInvalid: 'Not a valid OpenVault sealed file',
        verifyOriginalName: 'Original name',
        verifyKeyMode: 'Key mode',
        verifyHasPassword: 'Has password',
        verifyYes: 'Yes',
        verifyNo: 'No',
        verifySealed: 'Sealed',

        footerVersion: 'OpenVault v0.4.0-beta — Browser Edition',
        footerPrivacy: 'Everything happens locally in your browser. No data leaves your device.',

        typeMarkdownTutorial: 'Markdown Tutorial (.md)',
        typeMarkdownBlog: 'Markdown Blog (.md)',
        typePythonScript: 'Python Script (.py)',
        typeJSConfig: 'JS Config (.js)',
        typeDockerfile: 'Dockerfile',
        typeGitHubAction: 'GitHub Action (.yml)',
        typeJSONConfig: 'JSON Config (.json)',
        typeTSConfig: 'TypeScript Config (.json)',
        typeRustCargo: 'Rust Cargo (.toml)',
        typeGoModule: 'Go Module (.mod)',
        typeShellScript: 'Shell Script (.sh)',
        typeEnvFile: 'Env File (.env)',

        errorEmptyContent: 'Please enter content to encrypt',
        errorEmptyPassword: 'Please enter or generate a password',
        errorEmptyUnlockContent: 'Please paste the sealed file content',
        errorEmptyUnlockPassword: 'Please enter the password',
        errorEmptyVerifyContent: 'Please paste content to verify',
        errorInvalidFile: 'Not a valid OpenVault sealed file',
        errorReason: 'Reason',
    },
    zh: {
        title: 'OpenVault',
        pageTitle: 'OpenVault',
        subtitle: '将你的秘密加密隐藏成看似普通的文件。无需服务器，纯前端运行.',
        langSwitch: 'English',

        tabSeal: '加密',
        tabUnlock: '解密',
        tabPassword: '密码',
        tabVerify: '验证',

        sealTitle: '要加密的内容',
        sealInfo: '在下方输入文本或上传文件。内容将使用 AES-256-GCM 加密，并隐藏在一个逼真的文件里。',
        sealUpload: '选择文件',
        sealPlaceholder: '在此粘贴你的秘密内容...',
        sealType: '伪装类型',
        sealPassword: '密码',
        sealPasswordPlaceholder: '输入一个强密码',
        sealEntropy: '熵值',
        sealAutoGen: '自动生成',
        sealClear: '清空',
        sealBtn: '加密并伪装',
        sealLoading: '加密中...',
        sealResult: '伪装后的内容',
        sealDownload: '下载文件',

        unlockTitle: '伪装文件内容',
        unlockInfo: '在下方粘贴伪装文件的内容或上传文件。文件看起来正常，但内含隐藏的加密数据。',
        unlockUpload: '选择文件',
        unlockPlaceholder: '在此粘贴完整的文件内容...',
        unlockPassword: '密码',
        unlockPasswordPlaceholder: '输入加密时使用的密码',
        unlockBtn: '解密',
        unlockLoading: '解密中...',
        unlockResult: '解密后的内容',
        unlockDownload: '下载原文件',

        pwdTitle: '强密码',
        pwdOutput: '点击生成',
        pwdGenerate: '生成',
        pwdCopy: '复制',
        pwdCopied: '已复制!',
        copyBtn: '复制',
        copied: '已复制!',
        passphraseTitle: '易记口令',
        passphraseOutput: '点击生成',

        verifyTitle: '要验证的文件',
        verifyInfo: '验证一个文件是否包含有效的 OpenVault 加密数据，无需解密。',
        verifyUpload: '选择文件',
        verifyPlaceholder: '在此粘贴文件内容...',
        verifyBtn: '验证',
        verifyResult: '验证结果',
        verifyValid: '有效的 OpenVault 伪装文件',
        verifyInvalid: '不是有效的 OpenVault 伪装文件',
        verifyOriginalName: '原始文件名',
        verifyKeyMode: '密钥模式',
        verifyHasPassword: '使用密码',
        verifyYes: '是',
        verifyNo: '否',
        verifySealed: '加密时间',

        footerVersion: 'OpenVault v0.4.0-beta — 浏览器版',
        footerPrivacy: '所有操作均在浏览器本地完成，数据不会离开你的设备。',

        typeMarkdownTutorial: 'Markdown 教程 (.md)',
        typeMarkdownBlog: 'Markdown 博客 (.md)',
        typePythonScript: 'Python 脚本 (.py)',
        typeJSConfig: 'JS 配置 (.js)',
        typeDockerfile: 'Dockerfile',
        typeGitHubAction: 'GitHub Action (.yml)',
        typeJSONConfig: 'JSON 配置 (.json)',
        typeTSConfig: 'TypeScript 配置 (.json)',
        typeRustCargo: 'Rust Cargo (.toml)',
        typeGoModule: 'Go 模块 (.mod)',
        typeShellScript: 'Shell 脚本 (.sh)',
        typeEnvFile: 'Env 文件 (.env)',

        errorEmptyContent: '请输入要加密的内容',
        errorEmptyPassword: '请输入或生成密码',
        errorEmptyUnlockContent: '请粘贴伪装文件的内容',
        errorEmptyUnlockPassword: '请输入密码',
        errorEmptyVerifyContent: '请粘贴要验证的内容',
        errorInvalidFile: '不是有效的 OpenVault 伪装文件',
        errorReason: '原因',
    }
};

let currentLang = 'en';

try {
    const saved = localStorage.getItem('ov-lang');
    if (saved && I18N[saved]) currentLang = saved;
} catch (e) {}

function t(key) {
    return I18N[currentLang][key] || I18N['en'][key] || key;
}

function toggleLang() {
    currentLang = currentLang === 'en' ? 'zh' : 'en';
    try { localStorage.setItem('ov-lang', currentLang); } catch (e) {}
    applyI18n();
}

function applyI18n() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        // Skip file labels that already show a selected filename
        if (el.classList.contains('file-label')) {
            const inputId = el.getAttribute('for');
            const input = document.getElementById(inputId);
            if (input && input.files && input.files.length > 0) return;
        }
        const key = el.getAttribute('data-i18n');
        if (key.startsWith('placeholder:')) {
            el.placeholder = t(key.replace('placeholder:', ''));
        } else if (key.startsWith('html:')) {
            el.innerHTML = t(key.replace('html:', ''));
        } else {
            el.textContent = t(key);
        }
    });

    // Update tab labels that don't use data-i18n
    const tabMap = { seal: 'tabSeal', unlock: 'tabUnlock', password: 'tabPassword', verify: 'tabVerify' };
    document.querySelectorAll('.tab').forEach((tab, idx) => {
        const keys = ['seal', 'unlock', 'password', 'verify'];
        if (keys[idx]) tab.textContent = t(tabMap[keys[idx]]);
    });

    // Update document lang
    document.documentElement.lang = currentLang === 'zh' ? 'zh-CN' : 'en';

    // Update page title
    document.title = t('pageTitle');

    // Update password display placeholders if they haven't been generated yet
    const pwdOut = document.getElementById('password-output');
    if (pwdOut && pwdOut.textContent === 'Click Generate' || pwdOut.textContent === '点击生成') {
        pwdOut.textContent = t('pwdOutput');
    }
    const phraseOut = document.getElementById('passphrase-output');
    if (phraseOut && (phraseOut.textContent === 'Click Generate' || phraseOut.textContent === '点击生成')) {
        phraseOut.textContent = t('passphraseOutput');
    }
}
