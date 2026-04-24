/**
 * OpenVault Password Generator — Browser Edition
 */

var PasswordGenerator = (function() {
    const CHAR_SET = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';
    
    const WORD_LIST = [
        'apple', 'bridge', 'candle', 'dragon', 'eagle', 'forest', 'garden', 'harbor',
        'island', 'jungle', 'knight', 'lemon', 'mountain', 'noble', 'ocean', 'palace',
        'quartz', 'river', 'silver', 'tiger', 'unicorn', 'valley', 'winter', 'yellow',
        'amber', 'breeze', 'crystal', 'diamond', 'emerald', 'falcon', 'golden', 'horizon',
        'iceberg', 'jasmine', 'kingdom', 'lunar', 'mirror', 'nebula', 'orchid', 'phoenix',
        'quantum', 'rocket', 'shadow', 'thunder', 'velvet', 'whisper', 'zenith', 'azure'
    ];

    function generatePassword() {
        const groupSize = 4;
        const groupCount = 5;
        const totalChars = groupSize * groupCount;
        const randomValues = new Uint8Array(totalChars * 2);
        crypto.getRandomValues(randomValues);
        
        let password = '';
        let byteIndex = 0;
        
        for (let g = 0; g < groupCount; g++) {
            if (g > 0) password += '-';
            for (let i = 0; i < groupSize; i++) {
                let randomValue;
                do {
                    randomValue = randomValues[byteIndex++];
                } while (randomValue >= 256 - (256 % CHAR_SET.length));
                password += CHAR_SET[randomValue % CHAR_SET.length];
            }
        }
        return password;
    }

    function generatePassphrase(wordCount = 4) {
        const randomValues = new Uint8Array(wordCount * 2);
        crypto.getRandomValues(randomValues);
        const words = [];
        
        for (let i = 0; i < wordCount; i++) {
            const index = (randomValues[i * 2] << 8 | randomValues[i * 2 + 1]) % WORD_LIST.length;
            words.push(WORD_LIST[index]);
        }
        return words.join('-');
    }

    function calculateEntropy(password) {
        const clean = password.replace(/[^a-zA-Z0-9]/g, '');
        let poolSize = 0;
        if (/[a-z]/.test(clean)) poolSize += 26;
        if (/[A-Z]/.test(clean)) poolSize += 26;
        if (/[0-9]/.test(clean)) poolSize += 10;
        if (/[^a-zA-Z0-9]/.test(clean)) poolSize += 32;
        return Math.log2(Math.pow(poolSize, clean.length));
    }

    return {
        generatePassword,
        generatePassphrase,
        calculateEntropy
    };
})();
