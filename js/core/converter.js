/*
 * Anansi Converter
 * File: js/core/converter.js
 * Purpose: Handling data interoperability and format translation (e.g. Lorebook Import/Export).
 */

(function (A) {
    'use strict';

    const Converter = {

        /**
         * Import Lorebook Data
         * Tries to detect format (V2 Card, ST JSON, Anansi native) and return normalized entries.
         * @param {string|object} rawData - The raw JSON string or object from file.
         * @returns {object} - Normalized Anansi Lorebook Entries { [id]: Entry }
         */
        importLorebook: function (rawData) {
            let data;
            try {
                data = (typeof rawData === 'string') ? JSON.parse(rawData) : rawData;
            } catch (e) {
                console.error('[Converter] Failed to parse JSON', e);
                throw new Error('Invalid JSON format');
            }

            const entries = {};
            let sourceEntries = [];

            // --- Heuristic 1: V2 Character Card (spec: data.character_book) ---
            if (data.data && data.data.character_book && Array.isArray(data.data.character_book.entries)) {
                console.log('[Converter] Detected V2 Character Card');
                sourceEntries = data.data.character_book.entries;
            }
            // --- Heuristic 2: SillyTavern / Standard JSON (root.entries is array) ---
            else if (data.entries && Array.isArray(data.entries)) {
                console.log('[Converter] Detected Standard/ST Lorebook');
                sourceEntries = data.entries;
            }
            // --- Heuristic 3: Anansi Native Export (weaves.lorebook.entries object) ---
            else if (data.weaves && data.weaves.lorebook && data.weaves.lorebook.entries) {
                console.log('[Converter] Detected Anansi Native Project');
                return data.weaves.lorebook.entries; // Already valid
            }
            // --- Heuristic 4: Direct Object Map (Anansi snippet) ---
            else if (typeof data === 'object' && !Array.isArray(data)) {
                // Check if it looks like a dictionary of entries
                const values = Object.values(data);
                if (values.length > 0 && values[0].content && values[0].keywords) {
                    console.log('[Converter] Detected Anansi Entry Map');
                    return data;
                }
            }

            if (!sourceEntries.length) {
                // Last ditch: check if 'data' itself is an array of entries
                if (Array.isArray(data)) {
                    console.log('[Converter] Assuming raw array of entries');
                    sourceEntries = data;
                } else {
                    throw new Error('Unknown Lorebook format. Could not find entries.');
                }
            }

            // Normalize
            sourceEntries.forEach(src => {
                const entry = Converter._normalizeEntry(src);
                if (entry) {
                    entries[entry.id] = entry;
                }
            });

            return entries;
        },

        /**
         * Normalize a single entry from unknown source to Anansi format.
         */
        _normalizeEntry: function (src) {
            if (!src) return null;

            // ID Generation
            const id = src.id || A.ProjectDB.generateId();

            // Text Fields
            const title = src.comment || src.name || src.title || 'Untitled Entry';
            const content = src.content || src.entry || '';

            // Keywords (Array normalize)
            let keywords = [];
            if (Array.isArray(src.keys)) keywords = src.keys;
            else if (Array.isArray(src.keywords)) keywords = src.keywords;
            else if (typeof src.keys === 'string') keywords = src.keys.split(',').map(s => s.trim());
            else if (typeof src.keywords === 'string') keywords = src.keywords.split(',').map(s => s.trim());

            // Config / Logic
            // ST uses 'constant' for always active (high prob?), 'selective' for... logic?
            const probability = (src.constant === true) ? 100 : (src.probability !== undefined ? src.probability : 100);
            const priority = src.order || src.priority || 50;

            // ST features
            const caseSensitive = src.case_sensitive || src.caseSensitive || false;
            // ST: secondary_keys -> secondaryKeys
            const secondaryKeys = src.secondary_keys || src.secondaryKeys || '';

            return {
                id: id,
                uuid: src.uuid || A.ProjectDB.generateId(), // Internal tracking
                title: title,
                content: content,
                keywords: keywords.filter(k => k), // Filter empty
                secondaryKeys: secondaryKeys,

                // Logic
                priority: priority,
                probability: probability,

                // Defaults for Anansi-specifics
                category: 'imported',
                enabled: src.enabled !== false, // Default true unless explicitly false

                // Advanced matching
                caseSensitive: caseSensitive,
                matchWholeWords: false, // Default safe

                // Preserve unknown useful props just in case? Or strip clean?
                // Let's keep it clean to avoid state bloat.
            };
        }
    };

    A.Converter = Converter;

})(window.Anansi);
