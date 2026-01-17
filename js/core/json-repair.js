/*
 * Anansi Core: JSON Repair Utility
 * File: js/core/json-repair.js
 * Description: Robust JSON parsing for LLM outputs. Attempts to fix common formatting errors.
 */

(function (A) {
    'use strict';

    const JSONRepair = {};

    /**
     * cleanupJson
     * Extracts JSON from markdown blocks and attempts to fix common syntax errors.
     */
    function cleanupJson(str) {
        if (!str) return '';

        // 1. Extract from Markdown code blocks if present
        const codeBlockMatch = str.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
        if (codeBlockMatch) {
            str = codeBlockMatch[1];
        } else {
            // 2. Otherwise try to find the first '{' and last '}'
            const firstBrace = str.indexOf('{');
            const lastBrace = str.lastIndexOf('}');
            if (firstBrace !== -1 && lastBrace !== -1) {
                str = str.substring(firstBrace, lastBrace + 1);
            }
        }

        // 3. Remove comments (single line // and multi-line /* */)
        // Note: This is a simple regex and might strip URLs in strings, but risk is low for this specific data structure.
        str = str.replace(/\/\*[\s\S]*?\*\//g, ''); // block comments
        str = str.replace(/([^:]|^)\/\/.*$/gm, '$1'); // line comments (avoid http://)

        // 4. Fix Trailing Commas (objects and arrays)
        str = str.replace(/,(\s*[}\]])/g, '$1');

        // 5. Fix Unquoted Keys (e.g. key: "value" -> "key": "value")
        // Matches: whitespace, keychars, whitespace, colon
        str = str.replace(/([{,]\s*)([a-zA-Z0-9_]+)(\s*:)/g, '$1"$2"$3');

        // 6. Fix Single Quotes to Double Quotes (carefully)
        // This is risky if the content contains single quotes (e.g. "It's"). 
        // We'll skip this for now as LLMs usually get quotes right, but mix up keys.

        return str;
    }

    /**
     * repairAndParse
     * Attempts to parse JSON, applying repairs if immediate parse fails.
     * @param {string} text The raw string from LLM
     * @returns {Object} Parsed JSON object
     * @throws {Error} If parsing fails even after repair
     */
    JSONRepair.repairAndParse = function (text) {
        // Attempt 1: Raw Parse (in case it's perfect)
        try {
            return JSON.parse(text);
        } catch (e) {
            // Continue to repair
        }

        // Attempt 2: Extract and cleanup
        const cleanText = cleanupJson(text);

        try {
            return JSON.parse(cleanText);
        } catch (err) {
            // Throw error with the cleaned text for debugging
            const error = new Error(`JSON Parse Failed: ${err.message}`);
            error.originalText = text;
            error.cleanedText = cleanText;
            throw error;
        }
    };

    A.JSONRepair = JSONRepair;

})(window.Anansi);
