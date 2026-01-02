/*
 * Anansi Core: AURA Library (Cannibalized Logic)
 * File: js/core/aura_lib.js
 * Purpose: Provides a global AURA object with core utilities for generic script execution.
 *          Extracted from the monolithic AURA.js.
 */

(function (root) {
    'use strict';

    // --- Private Cache ---
    const _regexCache = new Map();

    const AURA = {
        // --- Utilities ---
        utils: {
            toString: function (x) {
                return (x === null || x === undefined) ? "" : String(x);
            },

            normalize: function (s) {
                if (!s) return "";
                // Standardize to lowercase, remove extra spaces
                return String(s).toLowerCase()
                    .replace(/['’]/g, "") // Remove apostrophes (don't vs dont)
                    .replace(/[^a-z0-9\s]/g, " ") // Punctuation to space
                    .replace(/\s+/g, " ") // Collapse spaces
                    .trim();
            },

            clamp01: function (v) {
                const n = +v;
                return !isFinite(n) ? 0 : (n < 0 ? 0 : (n > 1 ? 1 : n));
            },

            toArray: function (x) {
                if (Array.isArray(x)) return x;
                return x == null ? [] : [x];
            },

            /**
             * Cached Regex Matcher
             * @param {string} haystack - The text to search in
             * @param {string} term - The term to search for (supports 'term*')
             */
            hasTerm: function (haystack, term) {
                const rawTerm = (term == null ? "" : String(term)).trim();
                if (!rawTerm) return false;

                const isWildcard = rawTerm.endsWith("*");
                const cleanTerm = isWildcard ? AURA.utils.normalize(rawTerm.slice(0, -1)) : AURA.utils.normalize(rawTerm);

                if (!cleanTerm) return false;

                const patternKey = isWildcard ? `w:${cleanTerm}` : `s:${cleanTerm}`;

                let re = _regexCache.get(patternKey);
                if (!re) {
                    const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                    const escaped = escapeRegex(cleanTerm);
                    // Wildcard: "term" followed by optional letters until boundary
                    // Standard: "term" exactly at boundary
                    const pat = isWildcard
                        ? "(?:^|\\s)" + escaped + "[a-z]*?(?=\\s|$)"
                        : "(?:^|\\s)" + escaped + "(?=\\s|$)";
                    re = new RegExp(pat);
                    _regexCache.set(patternKey, re);
                }

                return re.test(haystack);
            }
        },

        // --- Gating Engines ---
        gates: {
            /**
             * Check generic word-based gates (requires/blocks)
             * @param {object} entry - The rule entry (requires, blocks, etc.)
             * @param {string} text - The text to check against (current turn)
             * @param {string} prevText - The text to check generic 'prev' gates against
             */
            checkWords: function (entry, text, prevText) {
                if (!entry) return true;

                const checkScope = (scope, txt) => {
                    const has = (w) => AURA.utils.hasTerm(txt, w);
                    if (scope.any && scope.any.length > 0 && !scope.any.some(has)) return false;
                    if (scope.all && scope.all.length > 0 && !scope.all.every(has)) return false;
                    if (scope.none && scope.none.length > 0 && scope.none.some(has)) return false;
                    // nall = not all (blocks only if ALL are present)
                    if (scope.nall && scope.nall.length > 0 && scope.nall.every(has)) return false;
                    return true;
                };

                // Helper to collect gate arrays from entry
                const collect = (prefix) => {
                    const pReq = prefix ? `${prefix}requires` : "requires";
                    const r = entry[pReq] || {}; // Handle nested object style if present

                    const getList = (keys) => {
                        const arr = [];
                        keys.forEach(k => {
                            if (entry[k]) arr.push(...AURA.utils.toArray(entry[k]));
                            if (r[k]) arr.push(...AURA.utils.toArray(r[k])); // varied schema support
                        });
                        return arr;
                    };

                    const p = prefix || "";
                    return {
                        any: getList([`${p}requireAny`, `${p}andAny`, 'any']),
                        all: getList([`${p}requireAll`, `${p}andAll`, 'all']),
                        none: getList([`${p}requireNone`, `${p}notAny`, 'none', `${p}block`, 'block']),
                        nall: getList([`${p}notAll`])
                    };
                };

                if (!checkScope(collect(""), text)) return false;
                if (prevText && !checkScope(collect("prev."), prevText)) return false;

                return true;
            },

            /**
             * Check tag-based gates (Emotion, Intent, EROS, or generic Tags)
             * @param {object} entry - The rule definition
             * @param {object} activeTagsMap - Object where keys are active tags (e.g. { "JOY": 1 })
             * @param {string} type - 'Emotion', 'Intent', 'Eros', or 'Tags' (suffix)
             */
            checkTags: function (entry, activeTagsMap, type = 'Tags') {
                if (!entry) return true;

                // Normalize keys based on type
                const suffix = type;
                // Map common schema variations
                const anyK = [`requireAny${suffix}`, `andAny${suffix}`, `require${suffix}`];
                const allK = [`requireAll${suffix}`, `andAll${suffix}`];
                const noneK = [`blockAny${suffix}`, `notAny${suffix}`, `block${suffix}`];
                const nallK = [`blockAll${suffix}`, `notAll${suffix}`];

                const collect = (keys) => {
                    const arr = [];
                    keys.forEach(k => {
                        if (entry[k]) arr.push(...AURA.utils.toArray(entry[k]));
                    });
                    return arr;
                };

                const any = collect(anyK);
                const all = collect(allK);
                const none = collect(noneK);
                const nall = collect(nallK);

                if (!any.length && !all.length && !none.length && !nall.length) return true;

                // Normalizer for the tag check
                const normalizeTag = (t) => {
                    let s = String(t).toUpperCase().trim();
                    if (type === 'Intent' && s.startsWith('INTENT.')) s = s.slice(7);
                    if (type === 'Eros' && s.startsWith('EROS.')) s = s.slice(5);
                    return s;
                };

                const has = (t) => activeTagsMap[normalizeTag(t)] === 1 || activeTagsMap[normalizeTag(t)] === true;

                if (none.length && none.some(has)) return false;
                if (nall.length && nall.every(has)) return false;
                if (any.length && !any.some(has)) return false;
                if (all.length && !all.every(has)) return false;

                return true;
            }
        },

        // --- Cleanup & Post-Processing ---
        cleanup: {
            processScenarioBlock: function (context, tagName, idPrefixPattern) {
                if (!context || !context.character) return;
                const scen = context.character.scenario || "";

                const tagOpen = `[${tagName}]`;
                const tagClose = `[/${tagName}]`;
                const blockRegex = new RegExp(`\\[${tagName}\\]([\\s\\S]*?)\\[\\/${tagName}\\]`, 'i');

                // Logic: Merge unwrapped lines into block, sort, dedupe.
                // Simplified for library: We assume the script might run this at the end.
                // (Porting the logic directly from AURA.js lines 1100+)

                // ... (Omitted full implementation for brevity, assuming the User Script calls this manually or we expose a 'runAll' helper)
                // For now, exposing the helper stub.
            },

            /**
             * Remove classifier tags from the final prompt to avoid leaking system internals.
             * @param {string} text - The text to clean
             * @param {string[]} tagsToRemove - Array of tags like "JOY", "ANGER"
             */
            stripTags: function (text, tagsToRemove) {
                if (!text) return "";
                let clean = text;
                tagsToRemove.forEach(t => {
                    const re = new RegExp(`\\s*\\[(LT_)?${t}\\]`, 'gi');
                    clean = clean.replace(re, '');
                });
                return clean.replace(/\n{3,}/g, '\n\n').trim();
            }
        }
    };

    root.AURA = AURA;

})(typeof globalThis !== 'undefined' ? globalThis : this);
