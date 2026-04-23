/**
 * OpenVault Mobile Crypto Module
 * Browser-compatible version of the core crypto functions
 */

const OpenVaultCrypto = (function() {
    // Zero-width character pools (16 chars each, 4 bits)
    const ZWC_LOW = [0x200B, 0x200C, 0x200D, 0x200E, 0x200F, 0x2060, 0x2061, 0x2062,
                     0x2063, 0x2064, 0x206A, 0x206B, 0x206C, 0x206D, 0x206E, 0x206F];

    function encodePayload(payload) {
        const encoder = new TextEncoder();
        const bytes = encoder.encode(payload);
        let encoded = '';
        for (let i = 0; i < bytes.length; i++) {
            const byte = bytes[i];
            encoded += String.fromCharCode(
                ZWC_LOW[byte & 0x0F],
                ZWC_LOW[(byte >> 4) & 0x0F]
            );
        }
        return encoded;
    }

    function decodePayload(encoded) {
        const bytes = [];
        for (let i = 0; i < encoded.length; i += 2) {
            const low = ZWC_LOW.indexOf(encoded.charCodeAt(i));
            const high = ZWC_LOW.indexOf(encoded.charCodeAt(i + 1));
            if (low === -1 || high === -1) continue;
            bytes.push((high << 4) | low);
        }
        const decoder = new TextDecoder();
        return decoder.decode(new Uint8Array(bytes));
    }

    function extractPayload(content) {
        const commentRegex = /<!--[\s\S]*?-->/g;
        let encoded = '';
        let match;
        
        while ((match = commentRegex.exec(content)) !== null) {
            const comment = match[0];
            const zwcMatch = comment.match(/[\u200B-\u200F\u2060-\u206F]+/g);
            if (zwcMatch) {
                encoded += zwcMatch.join('');
            }
        }
        
        if (!encoded) {
            throw new Error('No hidden payload found');
        }
        
        return decodePayload(encoded);
    }

    async function deriveKey(password, salt, iterations = 300000) {
        const encoder = new TextEncoder();
        const passwordData = encoder.encode(password);
        const saltData = encoder.encode(salt);
        
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            passwordData,
            'PBKDF2',
            false,
            ['deriveBits']
        );
        
        const keyBits = await crypto.subtle.deriveBits(
            {
                name: 'PBKDF2',
                salt: saltData,
                iterations: iterations,
                hash: 'SHA-512'
            },
            keyMaterial,
            256
        );
        
        return new Uint8Array(keyBits);
    }

    async function decrypt(encryptedHex, ivHex, authTagHex, password) {
        const salt = 'openvault-salt-v1:' + password;
        const key = await deriveKey(password, salt);
        
        const iv = hexToBytes(ivHex);
        const authTag = hexToBytes(authTagHex);
        const encrypted = hexToBytes(encryptedHex);
        
        // Combine encrypted data with auth tag for Web Crypto
        const ciphertext = new Uint8Array(encrypted.length + authTag.length);
        ciphertext.set(encrypted);
        ciphertext.set(authTag, encrypted.length);
        
        const cryptoKey = await crypto.subtle.importKey(
            'raw',
            key,
            { name: 'AES-GCM' },
            false,
            ['decrypt']
        );
        
        const decrypted = await crypto.subtle.decrypt(
            {
                name: 'AES-GCM',
                iv: iv
            },
            cryptoKey,
            ciphertext
        );
        
        const decoder = new TextDecoder();
        return decoder.decode(decrypted);
    }

    function hexToBytes(hex) {
        const bytes = new Uint8Array(hex.length / 2);
        for (let i = 0; i < hex.length; i += 2) {
            bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
        }
        return bytes;
    }

    function generatePassword() {
        const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';
        let result = '';
        const randomValues = new Uint8Array(20);
        crypto.getRandomValues(randomValues);
        
        for (let i = 0; i < 20; i++) {
            if (i > 0 && i % 4 === 0) result += '-';
            result += chars[randomValues[i] % chars.length];
        }
        return result;
    }

    function generatePassphrase() {
        const words = [
            'apple', 'bridge', 'candle', 'dragon', 'eagle', 'forest', 'garden', 'harbor',
            'island', 'jungle', 'knight', 'lemon', 'mountain', 'noble', 'ocean', 'palace',
            'quartz', 'river', 'silver', 'tiger', 'unicorn', 'valley', 'winter', 'yellow',
            'amber', 'breeze', 'crystal', 'diamond', 'emerald', 'falcon', 'golden', 'horizon',
            'iceberg', 'jasmine', 'kingdom', 'lunar', 'mirror', 'nebula', 'orchid', 'phoenix',
            'quantum', 'rocket', 'shadow', 'thunder', 'velvet', 'whisper', 'zenith', 'azure'
        ];
        
        const randomValues = new Uint8Array(8);
        crypto.getRandomValues(randomValues);
        
        const selected = [];
        for (let i = 0; i < 4; i++) {
            const index = (randomValues[i * 2] << 8 | randomValues[i * 2 + 1]) % words.length;
            selected.push(words[index]);
        }
        return selected.join('-');
    }

    function calculateEntropy(password) {
        const clean = password.replace(/[^a-zA-Z0-9]/g, '');
        let poolSize = 0;
        if (/[a-z]/.test(clean)) poolSize += 26;
        if (/[A-Z]/.test(clean)) poolSize += 26;
        if (/[0-9]/.test(clean)) poolSize += 10;
        return Math.log2(Math.pow(poolSize, clean.length));
    }

    return {
        extractPayload,
        decrypt,
        generatePassword,
        generatePassphrase,
        calculateEntropy
    };
})();
