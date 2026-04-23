/**
 * Semantic-Preserving Camouflage Engine v1
 * 
 * Strategy: Embed encrypted payload into "plausible" Markdown content
 * using steganographic techniques.
 */

const TEMPLATES = {
  'markdown-tutorial': require('./templates/tutorial'),
  'markdown-blog': require('./templates/blog'),
  'python-script': require('./templates/python-script'),
  'js-config': require('./templates/js-config'),
  'dockerfile': require('./templates/dockerfile'),
  'github-action': require('./templates/github-action'),
  'json-config': require('./templates/json-config'),
  'typescript-config': require('./templates/typescript-config'),
  'rust-cargo': require('./templates/rust-cargo'),
  'go-module': require('./templates/go-module'),
  'shell-script': require('./templates/shell-script'),
  'env-file': require('./templates/env-file'),
};

/**
 * Encode binary data into "invisible" characters within Markdown.
 * We use zero-width characters and subtle whitespace variations.
 */
// Zero-width character pools (16 chars each, 4 bits)
const ZWC_LOW = [0x200B, 0x200C, 0x200D, 0x200E, 0x200F, 0x2060, 0x2061, 0x2062,
                 0x2063, 0x2064, 0x206A, 0x206B, 0x206C, 0x206D, 0x206E, 0x206F];

function encodePayload(payload) {   const bytes = Buffer.from(payload, 'utf-8');
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
  return Buffer.from(bytes).toString('utf-8');
}

/**
 * Main camouflage function.
 * Embeds encrypted payload into a template that looks like normal content.
 */
function camouflage(payload, type = 'markdown-tutorial') {
  const template = TEMPLATES[type] || TEMPLATES['markdown-tutorial'];
  const encoded = encodePayload(payload);
  
  // Defensive: ensure slots doesn't exceed available sections
  const slots = Math.min(template.slots, template.sections.length);
  
  // Split encoded data across the template's "comment blocks"
  const chunks = splitIntoChunks(encoded, slots);
    
  let result = template.header;
  
  for (let i = 0; i < template.sections.length; i++) {
        result += template.sections[i];
    if (i < chunks.length) {
      // Embed chunk INSIDE an HTML comment that looks like a TODO
      result += `\n<!-- TODO: review ${chunks[i]} before merge -->\n`;
    }
  }
  
  result += template.footer;
  return result;
}

function decamouflage(content) {
  // Extract zero-width characters from inside HTML comments
  const commentRegex = /<!--[\s\S]*?-->/g;
  let encoded = '';
  let match;
  
  while ((match = commentRegex.exec(content)) !== null) {
    const comment = match[0];
    // Extract zero-width chars from inside the comment
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

function splitIntoChunks(str, count) {
  const chunkSize = Math.ceil(str.length / count);
  const chunks = [];
  for (let i = 0; i < str.length; i += chunkSize) {
    chunks.push(str.slice(i, i + chunkSize));
  }
  return chunks;
}

module.exports = { camouflage, decamouflage, TEMPLATES };
