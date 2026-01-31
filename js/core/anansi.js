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
            // Smart Merge: If panel exists (stub), update render but preserve Manifest metadata if present.
            // This prevents old panel files (with 'Creative' category) from overwriting Manifest ('Seeds').
            const existing = navSections[idx];
            navSections[idx] = {
                ...existing,                // Keep existing (Manifest)
                ...config,                  // Overwrite with new

                // Enforce Manifest Authority for structural metadata
                category: existing.category || config.category,
                subcategory: existing.subcategory || config.subcategory, // Preserve Subcategory
                label: existing.label || config.label,
                icon: existing.icon || config.icon,
                order: (existing.order !== undefined) ? existing.order : config.order,

                // Merge Flags
                gmOnly: existing.gmOnly || config.gmOnly,
                dependencies: existing.dependencies || config.dependencies
            };
            // Note: 'render' will be taken from config, which is what we want.

            console.log(`[Kernel] Updated panel: ${navSections[idx].label}`);
        } else {
            // New Registration - Check Manifest for metadata
            // Ensure we pick up centralized config (Manifest) even for fresh loads
            const meta = (A.PanelManifest && A.PanelManifest[id]) || {};
            navSections.push({
                ...meta,    // Load defaults from Manifest
                ...config,  // Apply panel config (render fn)
                // Enforce Manifest Authority for structural metadata
                category: meta.category || config.category,
                subcategory: meta.subcategory || config.subcategory,
                label: meta.label || config.label,
                icon: meta.icon || config.icon,
                order: (meta.order !== undefined) ? meta.order : config.order,
                id
            });
            console.log(`[Kernel] Registered panel: ${meta.label || config.label}`);
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
     * Get a registered panel by ID.
     * @param {string} id - Panel ID
     * @returns {Object|undefined} Panel configuration
     */
    A.getPanel = function (id) {
        return navSections.find(s => s.id === id);
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
