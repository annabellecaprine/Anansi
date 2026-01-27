/*
 * Anansi IO
 * File: js/core/io.js
 * Purpose: Persistence (IndexedDB with localStorage fallback for settings).
 */

(function (A) {
    'use strict';

    const LEGACY_STORAGE_KEY = 'anansi_project_v1';
    let saveDebounce = null;

    const IO = {
        /**
         * Initialize IO - sets up IndexedDB and loads current project
         */
        init: async function () {
            try {
                // Initialize databases
                await A.ProjectDB.init();
                await A.VaultDB.init();
                console.log('[IO] Databases initialized');

                // Check for legacy localStorage data to migrate
                const legacyData = localStorage.getItem(LEGACY_STORAGE_KEY);
                if (legacyData) {
                    await IO._migrateLegacyProject(legacyData);
                }

                // Load current project or create new one
                const currentId = A.ProjectDB.getCurrentId();
                if (currentId) {
                    const project = await A.ProjectDB.get(currentId);
                    if (project) {
                        A.State.load(project.data);
                        console.log('[IO] Project loaded:', project.name);
                    } else {
                        // Project was deleted externally, create new
                        await IO._createInitialProject();
                    }
                } else {
                    // No current project, check if any exist
                    const projects = await A.ProjectDB.list();
                    if (projects.length > 0) {
                        // Load most recent
                        const latest = await A.ProjectDB.get(projects[0].id);
                        A.State.load(latest.data);
                        A.ProjectDB.setCurrentId(latest.id);
                        console.log('[IO] Loaded most recent project:', latest.name);
                    } else {
                        // First time - create initial project
                        await IO._createInitialProject();
                    }
                }

                // Auto-save listener (debounced)
                A.State.subscribe(IO.persist);

            } catch (e) {
                console.error('[IO] Init failed, falling back to reset:', e);
                A.State.reset();
            }
        },

        /**
         * Migrate legacy localStorage project to IndexedDB
         */
        _migrateLegacyProject: async function (rawData) {
            try {
                const data = JSON.parse(rawData);

                // Assign ID if missing
                if (!data.meta) data.meta = {};
                if (!data.meta.id) data.meta.id = A.ProjectDB.generateId();

                // Save to IndexedDB
                await A.ProjectDB.save(data);

                // Remove legacy data
                localStorage.removeItem(LEGACY_STORAGE_KEY);

                console.log('[IO] Migrated legacy project to IndexedDB');
            } catch (e) {
                console.error('[IO] Migration failed:', e);
                // Remove corrupted legacy data
                localStorage.removeItem(LEGACY_STORAGE_KEY);
            }
        },

        /**
         * Create initial project for first-time users
         */
        _createInitialProject: async function () {
            A.State.reset();
            const state = A.State.get();
            state.meta.id = A.ProjectDB.generateId();
            state.meta.name = 'Untitled Project';
            await A.ProjectDB.save(state);
            console.log('[IO] Created initial project');
        },

        /**
         * Save current project (debounced for performance)
         */
        persist: function (state) {
            if (!state) return;

            // Debounce saves to IndexedDB (500ms)
            if (saveDebounce) {
                clearTimeout(saveDebounce);
            }

            saveDebounce = setTimeout(async () => {
                try {
                    await A.ProjectDB.save(state);
                    // console.log('[IO] Auto-saved to IndexedDB');
                } catch (e) {
                    console.error('[IO] Save failed:', e);
                }
            }, 500);
        },

        /**
         * Force immediate save (for before switching projects)
         */
        saveNow: async function () {
            if (saveDebounce) {
                clearTimeout(saveDebounce);
                saveDebounce = null;
            }

            const state = A.State.get();
            if (state) {
                await A.ProjectDB.save(state);
            }
        },

        /**
         * Generic file save handler
         * @param {any} content - String, Object (will be stringified), or Blob
         * @param {string} filename - Output filename
         * @param {string} type - MIME type (default: application/json or text/plain)
         */
        save: async function (content, filename, type) {
            try {
                let blob;
                if (content instanceof Blob) {
                    blob = content;
                } else if (typeof content === 'object') {
                    blob = new Blob([JSON.stringify(content, null, 2)], { type: type || 'application/json' });
                } else {
                    blob = new Blob([content], { type: type || 'text/plain' });
                }

                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a); // Firefox requirement
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                if (A.UI && A.UI.Toast) {
                    A.UI.Toast.show(`Saved "${filename}"`, 'success');
                }
            } catch (err) {
                console.error('[IO] Save failed:', err);
                if (A.UI && A.UI.Toast) {
                    A.UI.Toast.show(`Failed to save "${filename}"`, 'error');
                }
            }
        },

        /**
         * Generic file open handler
         * @param {Object} options - { accept: string, as: 'text'|'json'|'dataUrl'|'arrayBuffer' }
         * @returns {Promise<{content: any, file: File}>}
         */
        open: function (options = {}) {
            return new Promise((resolve, reject) => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = options.accept || '*';
                // Multiple selection support could be added here if needed

                input.onchange = (e) => {
                    const file = /** @type {HTMLInputElement} */ (e.target).files[0];
                    if (!file) {
                        return; // User cancelled
                    }

                    const reader = new FileReader();
                    reader.onload = (ev) => {
                        try {
                            let content = ev.target.result;
                            if (options.as === 'json') {
                                if (typeof content !== 'string') throw new Error('Invalid JSON file content');
                                content = JSON.parse(content);
                            }
                            resolve({ content, file });
                        } catch (err) {
                            reject(err);
                        }
                    };
                    reader.onerror = (err) => reject(err);

                    if (options.as === 'dataUrl') {
                        reader.readAsDataURL(file);
                    } else if (options.as === 'arrayBuffer') {
                        reader.readAsArrayBuffer(file);
                    } else {
                        reader.readAsText(file);
                    }
                };

                input.click();
            });
        },

        /**
         * Export current project to file
         */
        exportToFile: function () {
            const state = A.State.get();
            const name = (state.meta?.name || 'project').replace(/[^a-z0-9]/gi, '_').toLowerCase();
            IO.save(state, `${name}.anansi.json`, 'application/json');
        },

        /**
         * Import project from file (legacy - use ProjectPicker for multi-project)
         */
        importFromFile: function (file) {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    if (typeof e.target.result !== 'string') return;
                    const data = JSON.parse(e.target.result);

                    // For legacy import, replace current project
                    const currentId = A.ProjectDB.getCurrentId();
                    if (currentId) {
                        data.meta = data.meta || {};
                        data.meta.id = currentId; // Keep same ID
                    }

                    A.State.load(data);
                    await A.ProjectDB.save(data);

                    if (A.UI && A.UI.Toast) {
                        A.UI.Toast.show(`Project "${data.meta?.name || 'Untitled'}" imported!`, 'success');
                    }
                } catch (err) {
                    console.error('[IO] Import failed:', err);
                    if (A.UI && A.UI.Toast) {
                        A.UI.Toast.show('Failed to import project file.', 'error');
                    }
                }
            };
            reader.readAsText(file);
        }
    };

    A.IO = IO;

})(window.Anansi);
