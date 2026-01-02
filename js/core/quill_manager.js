/**
 * QuillManager
 * File: js/core/quill_manager.js
 * Purpose: Centralized manager for Quill rich text editor instances.
 * Provides initialization, content get/set, and destruction methods.
 */

(function (A) {
    'use strict';

    const QuillManager = {
        instances: {},

        // Default toolbar configuration
        defaultToolbar: [
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            [{ 'indent': '-1' }, { 'indent': '+1' }],
            ['blockquote', 'code-block'],
            [{ 'color': [] }, { 'background': [] }],
            ['clean']
        ],

        // Minimal toolbar for smaller fields
        minimalToolbar: [
            ['bold', 'italic', 'underline'],
            [{ 'list': 'bullet' }],
            ['clean']
        ],

        /**
         * Initialize a Quill editor on a container element
         * @param {string} containerId - The element ID to attach Quill to
         * @param {Object} options - Configuration options
         * @param {string} options.placeholder - Placeholder text
         * @param {Function} options.onChange - Callback when content changes
         * @param {boolean} options.readOnly - Whether the editor is read-only
         * @param {boolean} options.minimal - Use minimal toolbar
         * @returns {Quill} The Quill instance
         */
        init(containerId, options = {}) {
            // Destroy existing instance if present
            if (this.instances[containerId]) {
                this.destroy(containerId);
            }

            const container = document.getElementById(containerId);
            if (!container) {
                console.warn(`QuillManager: Container #${containerId} not found`);
                return null;
            }

            // Check if Quill is loaded
            if (typeof Quill === 'undefined') {
                console.warn('QuillManager: Quill library not loaded');
                return null;
            }

            const toolbar = options.minimal ? this.minimalToolbar : this.defaultToolbar;

            const quill = new Quill(`#${containerId}`, {
                theme: 'snow',
                placeholder: options.placeholder || 'Enter text...',
                readOnly: options.readOnly || false,
                modules: {
                    toolbar: options.readOnly ? false : toolbar
                }
            });

            // Apply custom styling to match Anansi theme
            this._applyThemeStyles(containerId);

            // Set up change callback
            if (options.onChange && typeof options.onChange === 'function') {
                quill.on('text-change', () => {
                    options.onChange(quill, this.getHTML(containerId));
                });
            }

            this.instances[containerId] = quill;
            return quill;
        },

        /**
         * Get the HTML content from a Quill instance
         * @param {string} containerId - The element ID of the Quill container
         * @returns {string} HTML content or empty string
         */
        getHTML(containerId) {
            const quill = this.instances[containerId];
            if (!quill) return '';

            const html = quill.root.innerHTML;
            // Return empty string instead of just a paragraph break
            if (html === '<p><br></p>' || html === '<p></p>') {
                return '';
            }
            return html;
        },

        /**
         * Get the plain text content from a Quill instance
         * @param {string} containerId - The element ID of the Quill container
         * @returns {string} Plain text content
         */
        getText(containerId) {
            const quill = this.instances[containerId];
            if (!quill) return '';
            return quill.getText().trim();
        },

        /**
         * Set the HTML content of a Quill instance
         * @param {string} containerId - The element ID of the Quill container
         * @param {string} html - HTML content to set
         */
        setHTML(containerId, html) {
            const quill = this.instances[containerId];
            if (!quill) return;

            // Use clipboard to safely insert HTML
            quill.root.innerHTML = html || '';
        },

        /**
         * Set the plain text content of a Quill instance
         * @param {string} containerId - The element ID of the Quill container
         * @param {string} text - Plain text content to set
         */
        setText(containerId, text) {
            const quill = this.instances[containerId];
            if (!quill) return;
            quill.setText(text || '');
        },

        /**
         * Check if a Quill instance exists
         * @param {string} containerId - The element ID to check
         * @returns {boolean} Whether the instance exists
         */
        exists(containerId) {
            return !!this.instances[containerId];
        },

        /**
         * Get a Quill instance
         * @param {string} containerId - The element ID of the Quill container
         * @returns {Quill|null} The Quill instance or null
         */
        get(containerId) {
            return this.instances[containerId] || null;
        },

        /**
         * Destroy a Quill instance and clean up
         * @param {string} containerId - The element ID of the Quill container
         */
        destroy(containerId) {
            const quill = this.instances[containerId];
            if (quill) {
                // Remove event listeners
                quill.off('text-change');
                delete this.instances[containerId];
            }
        },

        /**
         * Destroy all Quill instances
         */
        destroyAll() {
            Object.keys(this.instances).forEach(id => this.destroy(id));
        },

        /**
         * Apply Anansi theme styles to Quill container
         * @private
         */
        _applyThemeStyles(containerId) {
            const container = document.getElementById(containerId);
            if (!container) return;

            // Style the container
            container.style.cssText = `
                background: var(--bg-elevated);
                border: 1px solid var(--border-default);
                border-radius: var(--radius-md);
                min-height: 120px;
            `;

            // Override Quill toolbar and editor styles
            const style = document.createElement('style');
            style.id = `quill-theme-${containerId}`;
            style.textContent = `
                #${containerId} .ql-toolbar {
                    background: var(--bg-base);
                    border: none;
                    border-bottom: 1px solid var(--border-subtle);
                    border-radius: var(--radius-md) var(--radius-md) 0 0;
                    padding: 6px;
                }
                #${containerId} .ql-toolbar .ql-stroke {
                    stroke: var(--text-muted);
                }
                #${containerId} .ql-toolbar .ql-fill {
                    fill: var(--text-muted);
                }
                #${containerId} .ql-toolbar button:hover .ql-stroke,
                #${containerId} .ql-toolbar button.ql-active .ql-stroke {
                    stroke: var(--accent-primary);
                }
                #${containerId} .ql-toolbar button:hover .ql-fill,
                #${containerId} .ql-toolbar button.ql-active .ql-fill {
                    fill: var(--accent-primary);
                }
                #${containerId} .ql-container {
                    border: none;
                    font-family: var(--font-body);
                    font-size: 13px;
                    color: var(--text-main);
                }
                #${containerId} .ql-editor {
                    min-height: 100px;
                    padding: 12px;
                }
                #${containerId} .ql-editor.ql-blank::before {
                    color: var(--text-muted);
                    font-style: normal;
                }
                #${containerId} .ql-editor blockquote {
                    border-left: 3px solid var(--accent-primary);
                    padding-left: 12px;
                    color: var(--text-secondary);
                }
                #${containerId} .ql-editor code,
                #${containerId} .ql-editor pre {
                    background: var(--bg-base);
                    color: var(--accent-primary);
                    font-family: var(--font-mono);
                    border-radius: var(--radius-sm);
                }
                #${containerId} .ql-snow .ql-picker {
                    color: var(--text-muted);
                }
                #${containerId} .ql-snow .ql-picker-options {
                    background: var(--bg-elevated);
                    border: 1px solid var(--border-default);
                }
            `;

            // Remove any existing theme styles
            const existing = document.getElementById(`quill-theme-${containerId}`);
            if (existing) existing.remove();

            document.head.appendChild(style);
        }
    };

    // Export to Anansi namespace
    A.QuillManager = QuillManager;

    // Also export globally for direct access
    window.QuillManager = QuillManager;

})(window.Anansi = window.Anansi || {});
