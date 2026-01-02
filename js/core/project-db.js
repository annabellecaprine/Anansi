/*
 * Anansi Core: Project Database
 * File: js/core/project-db.js
 * Purpose: IndexedDB storage for multi-project support (max 10 projects)
 */

(function (A) {
    'use strict';

    const DB_NAME = 'anansi_projects';
    const DB_VERSION = 1;
    const STORE_NAME = 'projects';
    const MAX_PROJECTS = 10;
    const CURRENT_PROJECT_KEY = 'anansi_current_project_id';

    let db = null;

    const ProjectDB = {

        /**
         * Initialize IndexedDB connection
         * @returns {Promise}
         */
        init: function () {
            return new Promise((resolve, reject) => {
                if (db) {
                    resolve(db);
                    return;
                }

                const request = indexedDB.open(DB_NAME, DB_VERSION);

                request.onerror = (e) => {
                    console.error('[ProjectDB] Failed to open database:', e);
                    reject(e);
                };

                request.onsuccess = (e) => {
                    db = e.target.result;
                    console.log('[ProjectDB] Database opened successfully');
                    resolve(db);
                };

                request.onupgradeneeded = (e) => {
                    const database = e.target.result;

                    // Create projects store
                    if (!database.objectStoreNames.contains(STORE_NAME)) {
                        const store = database.createObjectStore(STORE_NAME, { keyPath: 'id' });
                        store.createIndex('lastModified', 'lastModified', { unique: false });
                        store.createIndex('name', 'name', { unique: false });
                        console.log('[ProjectDB] Object store created');
                    }
                };
            });
        },

        /**
         * Generate a UUID for new projects
         * @returns {string}
         */
        generateId: function () {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                const r = Math.random() * 16 | 0;
                const v = c === 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        },

        /**
         * Get current project ID from localStorage
         * @returns {string|null}
         */
        getCurrentId: function () {
            return localStorage.getItem(CURRENT_PROJECT_KEY);
        },

        /**
         * Set current project ID in localStorage
         * @param {string} id
         */
        setCurrentId: function (id) {
            localStorage.setItem(CURRENT_PROJECT_KEY, id);
        },

        /**
         * Get count of stored projects
         * @returns {Promise<number>}
         */
        count: function () {
            return new Promise((resolve, reject) => {
                const tx = db.transaction(STORE_NAME, 'readonly');
                const store = tx.objectStore(STORE_NAME);
                const request = store.count();

                request.onsuccess = () => resolve(request.result);
                request.onerror = (e) => reject(e);
            });
        },

        /**
         * Check if at capacity
         * @returns {Promise<boolean>}
         */
        isFull: function () {
            return ProjectDB.count().then(count => count >= MAX_PROJECTS);
        },

        /**
         * Get max projects limit
         * @returns {number}
         */
        getMaxProjects: function () {
            return MAX_PROJECTS;
        },

        /**
         * List all projects (metadata only, sorted by lastModified desc)
         * @returns {Promise<Array>}
         */
        list: function () {
            return new Promise((resolve, reject) => {
                const tx = db.transaction(STORE_NAME, 'readonly');
                const store = tx.objectStore(STORE_NAME);
                const index = store.index('lastModified');
                const request = index.openCursor(null, 'prev'); // Descending order

                const projects = [];

                request.onsuccess = (e) => {
                    const cursor = e.target.result;
                    if (cursor) {
                        // Return metadata only (not full data)
                        const p = cursor.value;
                        projects.push({
                            id: p.id,
                            name: p.name,
                            lastModified: p.lastModified,
                            actorCount: p.actorCount || 0,
                            lorebookCount: p.lorebookCount || 0
                        });
                        cursor.continue();
                    } else {
                        resolve(projects);
                    }
                };

                request.onerror = (e) => reject(e);
            });
        },

        /**
         * Get a full project by ID
         * @param {string} id
         * @returns {Promise<Object|null>}
         */
        get: function (id) {
            return new Promise((resolve, reject) => {
                const tx = db.transaction(STORE_NAME, 'readonly');
                const store = tx.objectStore(STORE_NAME);
                const request = store.get(id);

                request.onsuccess = () => resolve(request.result || null);
                request.onerror = (e) => reject(e);
            });
        },

        /**
         * Save or update a project
         * @param {Object} state - Full Anansi state
         * @returns {Promise}
         */
        save: function (state) {
            return new Promise((resolve, reject) => {
                if (!state || !state.meta) {
                    reject(new Error('Invalid state object'));
                    return;
                }

                // Ensure ID exists
                if (!state.meta.id) {
                    state.meta.id = ProjectDB.generateId();
                }

                const project = {
                    id: state.meta.id,
                    name: state.meta.name || 'Untitled Project',
                    lastModified: Date.now(),
                    actorCount: Object.keys(state.nodes?.actors?.items || {}).length,
                    lorebookCount: Object.keys(state.weaves?.lorebook?.entries || {}).length,
                    data: state
                };

                const tx = db.transaction(STORE_NAME, 'readwrite');
                const store = tx.objectStore(STORE_NAME);
                const request = store.put(project);

                request.onsuccess = () => {
                    ProjectDB.setCurrentId(project.id);
                    resolve(project.id);
                };

                request.onerror = (e) => reject(e);
            });
        },

        /**
         * Delete a project by ID
         * @param {string} id
         * @returns {Promise}
         */
        delete: function (id) {
            return new Promise((resolve, reject) => {
                const tx = db.transaction(STORE_NAME, 'readwrite');
                const store = tx.objectStore(STORE_NAME);
                const request = store.delete(id);

                request.onsuccess = () => {
                    // If deleted current project, clear the reference
                    if (ProjectDB.getCurrentId() === id) {
                        localStorage.removeItem(CURRENT_PROJECT_KEY);
                    }
                    resolve();
                };

                request.onerror = (e) => reject(e);
            });
        },

        /**
         * Export a project as downloadable JSON file
         * @param {string} id
         * @returns {Promise}
         */
        exportProject: function (id) {
            return ProjectDB.get(id).then(project => {
                if (!project) {
                    throw new Error('Project not found');
                }

                const state = project.data;
                const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${(state.meta?.name || 'project').replace(/[^a-z0-9]/gi, '_').toLowerCase()}.anansi.json`;
                a.click();
                URL.revokeObjectURL(url);

                if (A.UI?.Toast) {
                    A.UI.Toast.show(`Exported "${project.name}"`, 'success');
                }
            });
        }
    };

    A.ProjectDB = ProjectDB;

})(window.Anansi);
