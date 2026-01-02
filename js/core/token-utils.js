/*
 * Anansi Token Utilities
 * File: js/core/token-utils.js
 * Purpose: Token estimation helpers for inline display
 */

(function (A) {
    'use strict';

    A.Utils = A.Utils || {};

    /**
     * Estimate token count from text
     * @param {string} text - The text to estimate
     * @param {number} ratio - Characters per token (default: 4)
     * @returns {number} Estimated token count
     */
    A.Utils.estimateTokens = function (text, ratio) {
        const r = ratio || (A.State && A.State.get().sim?.tokenRatio) || 4;
        return Math.ceil((text || '').length / r);
    };

    /**
     * Create a token badge element
     * @param {number} count - Token count to display
     * @returns {HTMLElement} Badge span element
     */
    A.Utils.createTokenBadge = function (count) {
        const badge = document.createElement('span');
        badge.className = 'token-badge';
        badge.textContent = `${count} tkn`;
        return badge;
    };

    /**
     * Add live token counter to a textarea
     * @param {HTMLTextAreaElement} textarea - The textarea element
     * @param {HTMLElement} badgeContainer - Where to append the badge (or null to insert after textarea)
     */
    A.Utils.addTokenCounter = function (textarea, badgeContainer) {
        const badge = document.createElement('span');
        badge.className = 'token-badge';
        badge.style.marginLeft = '8px';

        const update = () => {
            const count = A.Utils.estimateTokens(textarea.value);
            badge.textContent = `${count} tkn`;
            // Color coding
            if (count > 500) {
                badge.style.color = 'var(--status-warning)';
            } else if (count > 1000) {
                badge.style.color = 'var(--status-error)';
            } else {
                badge.style.color = 'var(--text-muted)';
            }
        };

        update();
        textarea.addEventListener('input', update);

        if (badgeContainer) {
            badgeContainer.appendChild(badge);
        } else {
            textarea.parentNode.insertBefore(badge, textarea.nextSibling);
        }

        return badge;
    };

    /**
     * Format character count with token estimate
     * @param {string} text - The text to analyze
     * @returns {string} Formatted string like "1,234 chars (~308 tkn)"
     */
    A.Utils.formatTokenInfo = function (text) {
        const chars = (text || '').length;
        const tokens = A.Utils.estimateTokens(text);
        return `${chars.toLocaleString()} chars (~${tokens.toLocaleString()} tkn)`;
    };

})(window.Anansi);
