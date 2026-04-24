/**
 * OpenVault Crypto Module — Browser Edition
 * Uses Web Crypto API for AES-256-GCM encryption and PBKDF2 key derivation.
 */

var OpenVaultCrypto = (function() {
    async function deriveKeyFromPassword(password, salt, iterations = 300000) {
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

    async function encrypt(plaintext, password) {
        const salt = 'openvault-salt-v1:' + password;
        const key = await deriveKeyFromPassword(password, salt);
        
        const iv = crypto.getRandomValues(new Uint8Array(16));
        
        const encoder = new TextEncoder();
        const plaintextData = encoder.encode(plaintext);
        
        const cryptoKey = await crypto.subtle.importKey(
            'raw',
            key,
            { name: 'AES-GCM' },
            false,
            ['encrypt']
        );
        
        const encrypted = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv: iv },
            cryptoKey,
            plaintextData
        );
        
        const encryptedBytes = new Uint8Array(encrypted);
        const authTag = encryptedBytes.slice(-16);
        const data = encryptedBytes.slice(0, -16);
        
        return {
            iv: Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join(''),
            authTag: Array.from(authTag).map(b => b.toString(16).padStart(2, '0')).join(''),
            data: Array.from(data).map(b => b.toString(16).padStart(2, '0')).join('')
        };
    }

    async function decrypt(encryptedHex, ivHex, authTagHex, password) {
        const salt = 'openvault-salt-v1:' + password;
        const key = await deriveKeyFromPassword(password, salt);
        
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
            { name: 'AES-GCM', iv: iv },
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

    return {
        encrypt,
        decrypt,
        deriveKeyFromPassword
    };
})();
