/*
 * Anansi JSON Repair Utility
 * File: js/core/json-repair.js
 * Version: 1.0.0
 * Description: Robust JSON extraction and repair for LLM responses.
 */

(function (A) {
    'use strict';

    const JSONRepair = {
        /**
         * Attempts to fix common JSON errors in LLM responses
         * @param {string} str - Raw text from LLM
         * @returns {string} - Cleaned/Repaired JSON string
         */
        repair: function (str) {
            if (!str) return str;
            let repaired = str;

            // 1. Strip <think> blocks (Chain of Thought)
            repaired = repaired.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
            if (repaired.includes('<think>')) repaired = repaired.split('<think>')[0].trim();

            // 2. Extract JSON block (handles markdown code blocks or first/last braces)
            const jsonMatch = repaired.match(/```(?:json)?\s*([\s\S]*?)```/) || repaired.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
            if (jsonMatch) {
                repaired = (jsonMatch[1] || jsonMatch[0]).trim();
            }

            // 3. Basic fixes for common LLM syntax errors

            // 3a. Fix unquoted keys: { key: "val" } -> { "key": "val" }
            repaired = repaired.replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');

            // 3b. Remove trailing commas: { "a": 1, } -> { "a": 1 }
            repaired = repaired.replace(/,(\s*[}\]])/g, '$1');

            // 3c. Handle unclosed quotes (often in truncated responses)
            const quoteCount = (repaired.match(/"/g) || []).length;
            if (quoteCount % 2 !== 0) {
                repaired += '"';
            }

            // 3d. Close unclosed braces/brackets
            const openBraces = (repaired.match(/\{/g) || []).length;
            const closeBraces = (repaired.match(/\}/g) || []).length;
            for (let i = 0; i < openBraces - closeBraces; i++) repaired += '}';

            const openBrackets = (repaired.match(/\[/g) || []).length;
            const closeBrackets = (repaired.match(/\]/g) || []).length;
            for (let i = 0; i < openBrackets - closeBrackets; i++) repaired += ']';

            return repaired;
        },

        /**
         * Extracts, repairs, and parses JSON from a string.
         * @param {string} str - Raw text from LLM
         * @returns {Object|Array} - Parsed JSON
         * @throws {Error} - If parsing fails after repair
         */
        repairAndParse: function (str) {
            if (!str) throw new Error("Empty input for JSON repair");

            try {
                // Attempt 1: Direct parse of first {} or [] match
                const match = str.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
                if (match) {
                    try {
                        return JSON.parse(match[0]);
                    } catch (e) {
                        // Continue to repair
                    }
                }

                // Attempt 2: Full repair pipeline
                const repaired = this.repair(str);
                try {
                    return JSON.parse(repaired);
                } catch (err) {
                    console.error('[JSONRepair] Failed to repair JSON. Raw:', str);
                    console.error('[JSONRepair] Repaired attempt:', repaired);

                    // Specific error message for truncated responses
                    if (str.length > 100 && !str.trim().endsWith('}') && !str.trim().endsWith(']')) {
                        throw new Error("AI response was truncated. Try increasing the token limit.");
                    }

                    throw err;
                }
            } catch (fatal) {
                console.error('[JSONRepair] Fatal error:', fatal);
                throw fatal;
            }
        }
    };

    A.JSONRepair = JSONRepair;

})(window.Anansi);
