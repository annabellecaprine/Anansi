/*
 * Anansi Kernel
 * File: js/core/anansi.js
 * Purpose: Global namespace and module registry.
 */

window.Anansi = window.Anansi || {};

(function (A) {
    'use strict';

    // Module Registry
    const modules = {};

    // Navigation Registry
    const navSections = [];

    A.registerModule = function (id, module) {
        modules[id] = module;
        console.log(`[Kernel] Registered module: ${id}`);
    };

    A.registerPanel = function (id, config) {
        // config: { label, subtitle, icon, render(container), onShow(), onHide() }
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

    A.getNavSections = function () {
        return navSections;
    };

    A.init = async function () {
        console.log('[Kernel] Initializing systems...');

        // Initialize IO (loads project) - AWAIT this!
        await A.IO.init();

        // Initialize UI (renders shell)
        A.UI.init();

        console.log('[Kernel] Ready.');
    };

})(window.Anansi);
