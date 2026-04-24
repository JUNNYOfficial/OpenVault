/**
 * OpenVault Camouflage Engine — Browser Edition
 * Embeds encrypted payload into realistic-looking content using zero-width steganography.
 */

var Camouflage = (function() {
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

    function splitIntoChunks(str, count) {
        const chunkSize = Math.ceil(str.length / count);
        const chunks = [];
        for (let i = 0; i < str.length; i += chunkSize) {
            chunks.push(str.slice(i, i + chunkSize));
        }
        return chunks;
    }

    function camouflage(payload, type) {
        const template = TEMPLATES[type] || TEMPLATES['tutorial'];
        const encoded = encodePayload(payload);
        
        // Defensive: ensure slots doesn't exceed available sections
        const slots = Math.min(template.slots, template.sections.length);
        const chunks = splitIntoChunks(encoded, slots);
        
        let result = template.header;
        
        for (let i = 0; i < template.sections.length; i++) {
            result += template.sections[i];
            if (i < chunks.length) {
                result += `\n<!-- TODO: review ${chunks[i]} before merge -->\n`;
            }
        }
        
        result += template.footer;
        return result;
    }

    function decamouflage(content) {
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
            throw new Error('No hidden payload found in this file');
        }
        
        return decodePayload(encoded);
    }

    return {
        camouflage,
        decamouflage,
        encodePayload,
        decodePayload
    };
})();
