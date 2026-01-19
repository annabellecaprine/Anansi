/*
 * Anansi Core: Quirk Engine
 * File: js/core/quirk-engine.js
 * Purpose: RNG-based quirk injection tied to AURA tags
 */

(function (A) {
    'use strict';

    const CATEGORIES = ['physical', 'mental', 'emotional'];

    const QuirkEngine = {

        /**
         * Attempt to resolve a quirk for an actor based on AURA tags
         * @param {Object} actor - The actor object
         * @param {Array<string>} auraTags - Current AURA tags detected in scene
         * @returns {string|null} - Resolved quirk text or null
         */
        resolveQuirk: function (actor, auraTags = []) {
            if (!actor?.quirks) return null;

            const quirks = actor.quirks;
            const chance = quirks.activationChance ?? 20;

            // Step 1: Roll activation chance
            if (!this.rollActivation(chance)) {
                return null;
            }

            // Step 2: Pick random category
            const category = this.pickCategory();
            const categoryQuirks = quirks[category] || [];

            if (!categoryQuirks.length) {
                return null;
            }

            // Step 3: Filter by AURA tags
            const matches = this.filterByTags(categoryQuirks, auraTags);

            if (!matches.length) {
                return null;
            }

            // Step 4: Pick random match and resolve
            const picked = matches[Math.floor(Math.random() * matches.length)];
            return this.resolveText(picked.text, actor);
        },

        /**
         * Roll against activation chance
         * @param {number} chance - Percentage (0-100)
         * @returns {boolean}
         */
        rollActivation: function (chance) {
            return Math.random() * 100 < chance;
        },

        /**
         * Pick a random category (equal weight)
         * @returns {string}
         */
        pickCategory: function () {
            return CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
        },

        /**
         * Filter quirks that have at least one matching AURA tag
         * @param {Array} quirks - Array of quirk objects
         * @param {Array<string>} auraTags - Tags to match against
         * @returns {Array}
         */
        filterByTags: function (quirks, auraTags) {
            if (!auraTags.length) return [];

            // Use exact case matching for AURA tags
            const tagSet = new Set(auraTags);

            return quirks.filter(q => {
                if (!q.tags || !q.tags.length) return false;
                return q.tags.some(t => tagSet.has(t));
            });
        },

        /**
         * Resolve template placeholders in quirk text
         * Supports: {{name}}, {{PossessivePronoun}}, {{SubjectPronoun}}, {{ObjectPronoun}}
         * Supports custom pronouns via actor.pronouns (e.g., "ne/nem/nir")
         * @param {string} text - Template text
         * @param {Object} actor - Actor object
         * @returns {string}
         */
        resolveText: function (text, actor) {
            if (!text) return '';

            const name = actor.name || 'Actor';
            const gender = actor.gender || 'N';

            // Default pronoun maps
            const pronounMaps = {
                M: { subject: 'he', object: 'him', possessive: 'his' },
                F: { subject: 'she', object: 'her', possessive: 'her' },
                N: { subject: 'they', object: 'them', possessive: 'their' }
            };

            let p = pronounMaps[gender] || pronounMaps.N;

            // Check for custom pronouns (overrides gender-based defaults)
            if (actor.pronouns) {
                const standardMap = {
                    'he/him': pronounMaps.M,
                    'she/her': pronounMaps.F,
                    'they/them': pronounMaps.N
                };

                if (standardMap[actor.pronouns]) {
                    p = standardMap[actor.pronouns];
                } else {
                    // Parse custom pronouns: "subject/object/possessive" format
                    const parts = actor.pronouns.split('/').map(s => s.trim());
                    if (parts.length >= 3) {
                        p = { subject: parts[0], object: parts[1], possessive: parts[2] };
                    } else if (parts.length === 2) {
                        // Assume "subject/object" with possessive same as object
                        p = { subject: parts[0], object: parts[1], possessive: parts[1] };
                    }
                }
            }

            return text
                .replace(/\{\{name\}\}/gi, name)
                .replace(/\{\{SubjectPronoun\}\}/gi, p.subject)
                .replace(/\{\{ObjectPronoun\}\}/gi, p.object)
                .replace(/\{\{PossessivePronoun\}\}/gi, p.possessive)
                .replace(/\{\{pos\}\}/gi, p.possessive); // shorthand
        },

        /**
         * Migrate old quirks format to new structured format
         * @param {Object} oldQuirks - { physical: string[], mental: string[], emotional: string[] }
         * @returns {Object} - New quirks format
         */
        migrateQuirks: function (oldQuirks) {
            const newQuirks = {
                activationChance: 20,
                physical: [],
                mental: [],
                emotional: []
            };

            CATEGORIES.forEach(cat => {
                const items = oldQuirks[cat] || [];
                if (Array.isArray(items)) {
                    items.forEach(item => {
                        if (typeof item === 'string' && item.trim()) {
                            // Prepend {{name}} if not already present
                            let text = item.trim();
                            if (!text.toLowerCase().includes('{{name}}')) {
                                text = `{{name}} ${text}`;
                            }
                            newQuirks[cat].push({
                                text: text,
                                tags: [],
                                needsTags: true
                            });
                        } else if (typeof item === 'object' && item.text) {
                            // Already new format
                            newQuirks[cat].push(item);
                        }
                    });
                }
            });

            return newQuirks;
        },

        /**
         * Check if quirks need migration (old format)
         * @param {Object} quirks - Quirks object
         * @returns {boolean}
         */
        needsMigration: function (quirks) {
            if (!quirks) return false;
            // Old format has string arrays, new format has object arrays
            return CATEGORIES.some(cat => {
                const items = quirks[cat];
                return Array.isArray(items) && items.length > 0 && typeof items[0] === 'string';
            });
        }
    };

    // Expose
    A.QuirkEngine = QuirkEngine;

})(window.Anansi);
