/*
 * Anansi Core: Character Card Encoder
 * File: js/core/card-encoder.js
 * Purpose: PNG tEXt chunk manipulation for Character Card v2 format
 * 
 * Character Card v2 Spec:
 * - PNG image with JSON embedded in tEXt chunk
 * - Key: "chara"
 * - Value: Base64-encoded JSON string
 */

(function (A) {
    'use strict';

    const CHARA_KEY = 'chara';

    /**
     * Convert ArrayBuffer to Base64 string
     */
    function arrayBufferToBase64(buffer) {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    /**
     * Convert Base64 string to ArrayBuffer
     */
    function base64ToArrayBuffer(base64) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer;
    }

    /**
     * Calculate CRC32 for PNG chunk verification
     */
    function crc32(data) {
        let crc = 0xFFFFFFFF;
        const table = [];

        // Build CRC table
        for (let n = 0; n < 256; n++) {
            let c = n;
            for (let k = 0; k < 8; k++) {
                c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
            }
            table[n] = c;
        }

        // Calculate CRC
        for (let i = 0; i < data.length; i++) {
            crc = table[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
        }

        return (crc ^ 0xFFFFFFFF) >>> 0;
    }

    /**
     * Create a PNG tEXt chunk
     */
    function createTextChunk(keyword, text) {
        const keywordBytes = new TextEncoder().encode(keyword);
        const textBytes = new TextEncoder().encode(text);

        // tEXt chunk: keyword + null separator + text
        const data = new Uint8Array(keywordBytes.length + 1 + textBytes.length);
        data.set(keywordBytes, 0);
        data[keywordBytes.length] = 0; // Null separator
        data.set(textBytes, keywordBytes.length + 1);

        // Chunk structure: length (4) + type (4) + data + crc (4)
        const chunkType = new TextEncoder().encode('tEXt');
        const chunkData = new Uint8Array(4 + 4 + data.length + 4);
        const view = new DataView(chunkData.buffer);

        // Length (big-endian)
        view.setUint32(0, data.length, false);

        // Type
        chunkData.set(chunkType, 4);

        // Data
        chunkData.set(data, 8);

        // CRC (over type + data)
        const crcData = new Uint8Array(4 + data.length);
        crcData.set(chunkType, 0);
        crcData.set(data, 4);
        view.setUint32(8 + data.length, crc32(crcData), false);

        return chunkData;
    }

    /**
     * Parse PNG chunks from ArrayBuffer
     */
    function parsePngChunks(buffer) {
        const bytes = new Uint8Array(buffer);
        const chunks = [];

        // Verify PNG signature
        const signature = [137, 80, 78, 71, 13, 10, 26, 10];
        for (let i = 0; i < 8; i++) {
            if (bytes[i] !== signature[i]) {
                throw new Error('Invalid PNG signature');
            }
        }

        let offset = 8;
        while (offset < bytes.length) {
            const view = new DataView(buffer, offset);
            const length = view.getUint32(0, false);
            const type = new TextDecoder().decode(bytes.slice(offset + 4, offset + 8));
            const data = bytes.slice(offset + 8, offset + 8 + length);
            const crc = view.getUint32(8 + length, false);

            chunks.push({ type, data, length, crc, offset });
            offset += 12 + length;

            if (type === 'IEND') break;
        }

        return chunks;
    }

    /**
     * Extract Character Card data from PNG
     * @param {Blob|ArrayBuffer} png - PNG image
     * @returns {Promise<Object|null>} - Parsed card data or null
     */
    async function extractCharaCard(png) {
        try {
            const buffer = png instanceof Blob ? await png.arrayBuffer() : png;
            const chunks = parsePngChunks(buffer);

            for (const chunk of chunks) {
                if (chunk.type === 'tEXt') {
                    // Parse keyword and text
                    const nullIndex = chunk.data.indexOf(0);
                    if (nullIndex === -1) continue;

                    const keyword = new TextDecoder().decode(chunk.data.slice(0, nullIndex));
                    if (keyword !== CHARA_KEY) continue;

                    const textData = new TextDecoder().decode(chunk.data.slice(nullIndex + 1));

                    // Decode base64 and parse JSON
                    try {
                        const jsonStr = atob(textData);
                        const cardData = JSON.parse(jsonStr);
                        return cardData;
                    } catch (e) {
                        console.warn('[CardEncoder] Failed to parse card data:', e);
                    }
                }
            }

            return null;
        } catch (err) {
            console.error('[CardEncoder] Extract error:', err);
            return null;
        }
    }

    /**
     * Embed Character Card data into PNG
     * @param {Blob|ArrayBuffer} png - Source PNG image
     * @param {Object} cardData - Character card data object
     * @returns {Promise<Blob>} - New PNG with embedded data
     */
    async function embedCharaCard(png, cardData) {
        const buffer = png instanceof Blob ? await png.arrayBuffer() : png;
        const chunks = parsePngChunks(buffer);

        // Remove existing chara chunks
        const filteredChunks = chunks.filter(chunk => {
            if (chunk.type !== 'tEXt') return true;
            const nullIndex = chunk.data.indexOf(0);
            if (nullIndex === -1) return true;
            const keyword = new TextDecoder().decode(chunk.data.slice(0, nullIndex));
            return keyword !== CHARA_KEY;
        });

        // Create new chara chunk
        const jsonStr = JSON.stringify(cardData);
        const base64Data = btoa(unescape(encodeURIComponent(jsonStr)));
        const charaChunk = createTextChunk(CHARA_KEY, base64Data);

        // Rebuild PNG
        const signature = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
        const originalBytes = new Uint8Array(buffer);

        // Calculate total size
        let totalSize = 8; // signature
        for (const chunk of filteredChunks) {
            totalSize += 12 + chunk.length;
        }
        totalSize += charaChunk.length;

        // Build new PNG
        const newPng = new Uint8Array(totalSize);
        let offset = 0;

        // Signature
        newPng.set(signature, offset);
        offset += 8;

        // Insert chara chunk after IHDR (first chunk)
        let insertedChara = false;
        for (const chunk of filteredChunks) {
            const chunkBytes = originalBytes.slice(chunk.offset, chunk.offset + 12 + chunk.length);
            newPng.set(chunkBytes, offset);
            offset += 12 + chunk.length;

            // Insert chara chunk after IHDR
            if (!insertedChara && chunk.type === 'IHDR') {
                newPng.set(charaChunk, offset);
                offset += charaChunk.length;
                insertedChara = true;
            }
        }

        return new Blob([newPng], { type: 'image/png' });
    }

    /**
     * Convert actor data to Character Card v2 format
     */
    function actorToCharaCard(actor, seed = {}) {
        return {
            spec: 'chara_card_v2',
            spec_version: '2.0',
            data: {
                name: actor.name || 'Unnamed',
                description: actor.traits?.description || '',
                personality: actor.traits?.personality || '',
                scenario: seed.scenario || '',
                first_mes: seed.firstMessage || '',
                mes_example: seed.examples || '',
                creator_notes: actor.notes || '',
                system_prompt: '',
                post_history_instructions: '',
                tags: actor.tags || [],
                creator: seed.author || 'Anansi',
                character_version: '1.0',
                extensions: {
                    anansi: {
                        actorId: actor.id,
                        gender: actor.gender,
                        aliases: actor.aliases
                    }
                }
            }
        };
    }

    /**
     * Convert Character Card v2 to actor data
     */
    function charaCardToActor(cardData) {
        const d = cardData.data || cardData;
        return {
            name: d.name || 'Imported Character',
            tags: d.tags || [],
            notes: d.creator_notes || '',
            gender: d.extensions?.anansi?.gender || 'N',
            aliases: d.extensions?.anansi?.aliases || [],
            traits: {
                description: d.description || '',
                personality: d.personality || ''
            },
            imported: {
                scenario: d.scenario || '',
                firstMessage: d.first_mes || '',
                examples: d.mes_example || '',
                creator: d.creator || ''
            }
        };
    }

    // Export
    A.CardEncoder = {
        extract: extractCharaCard,
        embed: embedCharaCard,
        actorToCard: actorToCharaCard,
        cardToActor: charaCardToActor
    };

})(window.Anansi);
