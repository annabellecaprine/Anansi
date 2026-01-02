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
                // Initialize ProjectDB first
                await A.ProjectDB.init();

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
                A.State.subscribe(IO.save);

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
        save: function (state) {
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
         * Export current project to file
         */
        exportToFile: function () {
            const state = A.State.get();
            const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${(state.meta?.name || 'project').replace(/[^a-z0-9]/gi, '_').toLowerCase()}.anansi.json`;
            a.click();
            URL.revokeObjectURL(url);
            if (A.UI && A.UI.Toast) {
                A.UI.Toast.show('Project exported successfully!', 'success');
            }
        },

        /**
         * Import project from file (legacy - use ProjectPicker for multi-project)
         */
        importFromFile: function (file) {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
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
