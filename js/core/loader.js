(function (A) {
    'use strict';

    /**
     * Anansi Loader
     * Handles dynamic loading of panels and their dependencies.
     */
    A.Loader = {
        loadedScripts: new Set(),
        loadingPromises: {},

        /**
         * Load a script dynamically
         * @param {string} src - Path to script
         * @returns {Promise}
         */
        loadScript: function (src) {
            // Normalize path (remove leading slash if present for consistency)
            const path = src.startsWith('/') ? src.slice(1) : src;

            // Check if already loaded (by us or via index.html)
            if (this.loadedScripts.has(path) || document.querySelector(`script[src="${path}"]`) || document.querySelector(`script[src="${src}"]`)) {
                this.loadedScripts.add(path); // Ensure tracked
                return Promise.resolve();
            }

            // Check if already loading
            if (this.loadingPromises[path]) {
                return this.loadingPromises[path];
            }

            const promise = new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = src; // Keep original src for loading
                script.async = true;

                script.onload = () => {
                    this.loadedScripts.add(path);
                    delete this.loadingPromises[path];
                    console.log(`[Loader] Loaded: ${path}`);
                    resolve();
                };

                script.onerror = (err) => {
                    delete this.loadingPromises[path];
                    console.error(`[Loader] Failed to load: ${path}`, err);
                    reject(err);
                };

                document.head.appendChild(script);
            });

            this.loadingPromises[path] = promise;
            return promise;
        },

        /**
         * Load a panel and its dependencies
         * @param {string} id - Panel ID
         * @returns {Promise}
         */
        loadPanel: async function (id) {
            const manifest = A.PanelManifest[id];
            if (!manifest) {
                console.error(`[Loader] Panel not found in manifest: ${id}`);
                // Fallback: If not in manifest, maybe it's core?
                return Promise.resolve();
            }

            // 1. Load Dependencies (Sequentially to ensure order, e.g. Core -> Engine -> UI)
            if (manifest.dependencies && Array.isArray(manifest.dependencies)) {
                for (const dep of manifest.dependencies) {
                    try {
                        await this.loadScript(dep);
                    } catch (e) {
                        // Some deps might be optional or fail, but we should try to continue or throw?
                        // For critical systems like RPG, failure here is fatal.
                        throw new Error(`Dependency failed: ${dep}`);
                    }
                }
            }

            // 2. Load Panel Script
            // Infer path if not explicit: js/panels/[id]/index.js
            let panelPath = manifest.path;
            if (!panelPath) {
                // If path not in manifest, assume standard structure
                // EXCEPT if it was manually loaded (check global registry?)
                // Actually, just try the standard path.
                panelPath = `js/panels/${id}/index.js`;
            }

            try {
                await this.loadScript(panelPath);
            } catch (e) {
                throw new Error(`Panel script failed: ${panelPath}`);
            }

            // 3. Verify Registration
            // Wait a tick? Usually script execution matches.
            // A.registerPanel calls should happen immediately upon script load.
            // We can check if A.UI.panels includes the ID now, IF we had a unified registry.
            // But A.registerPanel calls A.UI.registerPanel which updates internal state.
        }
    };

    // Expose globally
    window.Anansi.Loader = A.Loader;
    console.log('[Loader] Initialized');

})(window.Anansi);
