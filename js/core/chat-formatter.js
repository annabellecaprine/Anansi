/*
 * Anansi Chat Formatter
 * File: js/core/chat-formatter.js
 * Purpose: Secure markdown-to-HTML conversion for chat messages.
 * 
 * SECURITY: Escapes HTML BEFORE applying markdown transforms to prevent XSS.
 */

(function (A) {
    'use strict';

    const ChatFormatter = {
        /**
         * Escapes HTML entities to prevent XSS
         * @param {string} text - Raw text input
         * @returns {string} - Escaped text
         */
        escapeHtml: function (text) {
            if (!text) return '';
            return text
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        },

        /**
         * Converts markdown-like syntax to HTML
         * Order matters: escape first, then transform
         * 
         * Supported syntax:
         * - **bold** or __bold__
         * - *italics* or _italics_
         * - ~~strikethrough~~
         * - `inline code`
         * - ```code blocks```
         * - Line breaks (\n)
         * 
         * @param {string} text - Raw message content
         * @returns {string} - HTML-formatted string (safe for innerHTML)
         */
        format: function (text) {
            if (!text) return '';

            // Step 1: Escape HTML entities (CRITICAL for security)
            let html = this.escapeHtml(text);

            // Step 2: Handle code blocks first (triple backticks)
            // These should NOT have inner formatting applied
            html = html.replace(/```([\s\S]*?)```/g, (match, code) => {
                return `<pre class="chat-code-block"><code>${code.trim()}</code></pre>`;
            });

            // Step 3: Handle inline code (single backticks)
            // Protect inline code from further transforms
            const codeTokens = [];
            html = html.replace(/`([^`\n]+)`/g, (match, code) => {
                const token = `%%CODE_${codeTokens.length}%%`;
                codeTokens.push(`<code class="chat-code-inline">${code}</code>`);
                return token;
            });

            // Step 4: Bold (**text** or __text__)
            html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
            html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');

            // Step 5: Italics (*text* or _text_)
            // Must be careful not to match underscores within words
            html = html.replace(/\*([^*\n]+?)\*/g, '<em>$1</em>');
            html = html.replace(/(?<!\w)_([^_\n]+?)_(?!\w)/g, '<em>$1</em>');

            // Step 6: Strikethrough (~~text~~)
            html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');

            // Step 7: Restore code tokens
            codeTokens.forEach((code, i) => {
                html = html.replace(`%%CODE_${i}%%`, code);
            });

            // Step 8: Line breaks (preserve double newlines as paragraph breaks)
            html = html.replace(/\n\n/g, '</p><p>');
            html = html.replace(/\n/g, '<br>');

            // Wrap in paragraph if we used paragraph breaks
            if (html.includes('</p><p>')) {
                html = `<p>${html}</p>`;
            }

            return html;
        },

        /**
         * Strips formatting and returns plain text
         * Useful for copy-to-clipboard
         * @param {string} text - Raw message content
         * @returns {string} - Plain text without markdown
         */
        toPlainText: function (text) {
            if (!text) return '';
            return text
                .replace(/\*\*(.+?)\*\*/g, '$1')
                .replace(/__(.+?)__/g, '$1')
                .replace(/\*(.+?)\*/g, '$1')
                .replace(/_(.+?)_/g, '$1')
                .replace(/~~(.+?)~~/g, '$1')
                .replace(/`([^`]+)`/g, '$1')
                .replace(/```[\s\S]*?```/g, (m) => m.replace(/```/g, '').trim());
        }
    };

    A.ChatFormatter = ChatFormatter;
    console.log('[Core] ChatFormatter registered.');

})(window.Anansi);
