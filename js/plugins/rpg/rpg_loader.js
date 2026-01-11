/**
 * RPG Plugin Loader - Error-Contained Bootstrap
 * File: js/plugins/rpg/rpg_loader.js
 * 
 * This is the ONLY file that should be referenced in index.html.
 * It loads all RPG modules in a try-catch so failures don't crash Anansi.
 */

(function () {
    'use strict';

    const PLUGIN_NAME = 'RPG Experiment';
    const PLUGIN_VERSION = '1.10.0';

    console.log(`[${PLUGIN_NAME}] Loading v${PLUGIN_VERSION}...`);

    // Check if Anansi is available
    if (!window.Anansi) {
        console.error(`[${PLUGIN_NAME}] Anansi not found. Plugin cannot load.`);
        return;
    }

    // Track loaded modules
    const loadedModules = [];
    const failedModules = [];

    /**
     * Safe module loader - wraps each module in error handling
     */
    window.RPG_LoadModule = function (name, initFn) {
        try {
            initFn();
            loadedModules.push(name);
            console.log(`[${PLUGIN_NAME}] ✓ Loaded: ${name}`);
        } catch (err) {
            failedModules.push({ name, error: err.message });
            console.error(`[${PLUGIN_NAME}] ✗ Failed: ${name}`, err);
        }
    };

    /**
     * Report loading status after all modules attempt to load
     */
    window.RPG_LoadComplete = function () {
        console.log(`[${PLUGIN_NAME}] Loading complete.`);
        console.log(`  ✓ Loaded: ${loadedModules.length} modules`);

        if (failedModules.length > 0) {
            console.warn(`  ✗ Failed: ${failedModules.length} modules`);
            failedModules.forEach(m => {
                console.warn(`    - ${m.name}: ${m.error}`);
            });

            // Show toast if UI available
            if (window.Anansi?.UI?.Toast?.show) {
                window.Anansi.UI.Toast.show(
                    `RPG Plugin: ${failedModules.length} module(s) failed to load. Check console.`,
                    'warning'
                );
            }
        }

        // Clean up loader functions
        delete window.RPG_LoadModule;
        delete window.RPG_LoadComplete;
    };

})();
