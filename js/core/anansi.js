/*
 * Anansi Kernel
 * File: js/core/anansi.js
 * Purpose: Global namespace, module registry, and panel registration.
 * 
 * This is the entry point that defines the global Anansi (A) namespace.
 * All other modules attach themselves to this namespace.
 */

window.Anansi = window.Anansi || {};

(function (A) {
    'use strict';

    /**
     * @typedef {Object} PanelConfig
     * @property {string} label - Display name shown in navigation
     * @property {string} [subtitle] - Secondary text shown below label
     * @property {string} [title] - Page title (if different from label)
     * @property {string} category - Navigation category (e.g., 'Loom', 'Seeds', 'Weave')
     * @property {string} [subcategory] - Optional subcategory for grouped display
     * @property {number} [order] - Sort order within category (lower = first)
     * @property {string} [icon] - Icon identifier or SVG string
     * @property {function(HTMLElement, Object=): void} render - Panel render function
     * @property {function(): void} [onShow] - Called when panel becomes active
     * @property {function(): void} [onHide] - Called when panel is hidden
     */

    /** @type {Object<string, Object>} */
    const modules = {};

    /** @type {Array<{id: string} & PanelConfig>} */
    const navSections = [];

    /**
     * Register a module in the global namespace.
     * @param {string} id - Unique module identifier
     * @param {Object} module - Module object to register
     */
    A.registerModule = function (id, module) {
        modules[id] = module;
        console.log(`[Kernel] Registered module: ${id}`);
    };

    /**
     * Register or update a UI panel.
     * Panels appear in the sidebar navigation grouped by category.
     * 
     * @param {string} id - Unique panel identifier (e.g., 'actors', 'lorebook')
     * @param {PanelConfig} config - Panel configuration
     * 
     * @example
     * A.registerPanel('myPanel', {
     *     label: 'My Panel',
     *     subtitle: 'Does cool things',
     *     category: 'Magic',
     *     order: 5,
     *     render: (container) => {
     *         container.innerHTML = '<h1>Hello World</h1>';
     *     }
     * });
     */
    A.registerPanel = function (id, config) {
        const idx = navSections.findIndex(s => s.id === id);
        if (idx !== -1) {
            navSections[idx] = { id, ...config };
            console.log(`[Kernel] Updated panel: ${config.label}`);
        } else {
            navSections.push({ id, ...config });
            console.log(`[Kernel] Registered panel: ${config.label}`);
        }

        // If UI is loaded and initialized, refresh nav
        if (A.UI && A.UI.els) A.UI.refreshNav();
    };

    /**
     * Get all registered navigation sections/panels.
     * Used by UI to build the sidebar.
     * @returns {Array<{id: string} & PanelConfig>} Array of panel configurations
     */
    A.getNavSections = function () {
        return navSections;
    };

    /**
     * Initialize the Anansi application.
     * Loads state from storage and renders the UI shell.
     * @async
     * @returns {Promise<void>}
     */
    A.init = async function () {
        console.log('[Kernel] Initializing systems...');

        // Initialize IO (loads project) - AWAIT this!
        await A.IO.init();

        // Initialize UI (renders shell)
        A.UI.init();

        console.log('[Kernel] Ready.');
    };

})(window.Anansi);
