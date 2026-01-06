/*
 * Anansi Core: Vault Database
 * File: js/core/vault-db.js
 * Purpose: IndexedDB storage for cross-project asset library (Vault)
 * 
 * The Vault is a "GitHub for Anansi projects" - a repository of all published
 * assets that can be pulled into any project and pushed back with updates.
 */

(function (A) {
    'use strict';

    const DB_NAME = 'anansi_vault';
    const DB_VERSION = 1;
    const ITEMS_STORE = 'items';
    const REGISTRY_STORE = 'registry';
    const REGISTRY_KEY = 'vault_registry';

    let db = null;

    /**
     * Default registry document
     */
    function createDefaultRegistry() {
        return {
            id: REGISTRY_KEY,
            lastUpdatedAt: new Date().toISOString(),
            universes: [],
            allTags: [],
            itemCounts: {
                actor: 0,
                lorebook: 0,
                script: 0,
                location: 0,
                event: 0,
                pair: 0
            }
        };
    }

    /**
     * Generate a UUID for vault items
     */
    function generateId() {
        return 'vault_' + crypto.randomUUID();
    }

    const VaultDB = {

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
                    console.error('[VaultDB] Failed to open database:', e.target.error);
                    reject(e.target.error || e);
                };

                request.onsuccess = (e) => {
                    db = e.target.result;
                    console.log('[VaultDB] Database opened successfully');
                    resolve(db);
                };

                request.onupgradeneeded = (e) => {
                    const database = e.target.result;

                    // Create items store with indexes
                    if (!database.objectStoreNames.contains(ITEMS_STORE)) {
                        const itemsStore = database.createObjectStore(ITEMS_STORE, { keyPath: 'id' });
                        itemsStore.createIndex('type', 'type', { unique: false });
                        itemsStore.createIndex('universe', 'universe', { unique: false });
                        itemsStore.createIndex('sourceProjectId', 'sourceProjectId', { unique: false });
                        itemsStore.createIndex('updatedAt', 'updatedAt', { unique: false });
                        console.log('[VaultDB] Items store created');
                    }

                    // Create registry store (single document)
                    if (!database.objectStoreNames.contains(REGISTRY_STORE)) {
                        database.createObjectStore(REGISTRY_STORE, { keyPath: 'id' });
                        console.log('[VaultDB] Registry store created');
                    }
                };
            });
        },

        /**
         * Ensure registry exists, create if not
         * @returns {Promise<Object>}
         */
        getRegistry: function () {
            return new Promise((resolve, reject) => {
                if (!db) {
                    reject(new Error('VaultDB not initialized'));
                    return;
                }

                const tx = db.transaction(REGISTRY_STORE, 'readonly');
                const store = tx.objectStore(REGISTRY_STORE);
                const request = store.get(REGISTRY_KEY);

                request.onsuccess = () => {
                    if (request.result) {
                        resolve(request.result);
                    } else {
                        // Create default registry
                        VaultDB.updateRegistry(createDefaultRegistry()).then(resolve).catch(reject);
                    }
                };

                request.onerror = (e) => reject(e.target.error || e);
            });
        },

        /**
         * Update registry document
         * @param {Object} updates - Fields to update
         * @returns {Promise<Object>}
         */
        updateRegistry: function (updates) {
            return new Promise((resolve, reject) => {
                if (!db) {
                    reject(new Error('VaultDB not initialized'));
                    return;
                }

                const tx = db.transaction(REGISTRY_STORE, 'readwrite');
                const store = tx.objectStore(REGISTRY_STORE);

                // Get current, merge, save
                const getRequest = store.get(REGISTRY_KEY);

                getRequest.onsuccess = () => {
                    const current = getRequest.result || createDefaultRegistry();
                    const updated = {
                        ...current,
                        ...updates,
                        id: REGISTRY_KEY,
                        lastUpdatedAt: new Date().toISOString()
                    };

                    const putRequest = store.put(updated);
                    putRequest.onsuccess = () => resolve(updated);
                    putRequest.onerror = (e) => reject(e.target.error || e);
                };

                getRequest.onerror = (e) => reject(e.target.error || e);
            });
        },

        /**
         * Get total item count
         * @returns {Promise<number>}
         */
        count: function () {
            return new Promise((resolve, reject) => {
                if (!db) {
                    reject(new Error('VaultDB not initialized'));
                    return;
                }

                const tx = db.transaction(ITEMS_STORE, 'readonly');
                const store = tx.objectStore(ITEMS_STORE);
                const request = store.count();

                request.onsuccess = () => resolve(request.result);
                request.onerror = (e) => reject(e.target.error || e);
            });
        },

        /**
         * List all items with optional filtering
         * @param {Object} filters - { type, universe, sourceProjectId, tags }
         * @returns {Promise<Array>}
         */
        list: function (filters = {}) {
            return new Promise((resolve, reject) => {
                if (!db) {
                    reject(new Error('VaultDB not initialized'));
                    return;
                }

                const tx = db.transaction(ITEMS_STORE, 'readonly');
                const store = tx.objectStore(ITEMS_STORE);

                // Use index if filtering by single field, otherwise scan all
                let request;
                if (filters.type && !filters.universe && !filters.sourceProjectId) {
                    const index = store.index('type');
                    request = index.openCursor(IDBKeyRange.only(filters.type));
                } else if (filters.universe && !filters.type && !filters.sourceProjectId) {
                    const index = store.index('universe');
                    request = index.openCursor(IDBKeyRange.only(filters.universe));
                } else if (filters.sourceProjectId && !filters.type && !filters.universe) {
                    const index = store.index('sourceProjectId');
                    request = index.openCursor(IDBKeyRange.only(filters.sourceProjectId));
                } else {
                    request = store.openCursor();
                }

                const items = [];

                request.onsuccess = (e) => {
                    const cursor = e.target.result;
                    if (cursor) {
                        const item = cursor.value;
                        let matches = true;

                        // Apply filters
                        if (filters.type && item.type !== filters.type) matches = false;
                        if (filters.universe && item.universe !== filters.universe) matches = false;
                        if (filters.sourceProjectId && item.sourceProjectId !== filters.sourceProjectId) matches = false;
                        if (filters.tags && filters.tags.length > 0) {
                            const hasAllTags = filters.tags.every(t => item.tags?.includes(t));
                            if (!hasAllTags) matches = false;
                        }

                        if (matches) {
                            items.push(item);
                        }
                        cursor.continue();
                    } else {
                        // Sort by updatedAt descending
                        items.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
                        resolve(items);
                    }
                };

                request.onerror = (e) => reject(e.target.error || e);
            });
        },

        /**
         * Get a single item by ID
         * @param {string} id
         * @returns {Promise<Object|null>}
         */
        get: function (id) {
            return new Promise((resolve, reject) => {
                if (!db) {
                    reject(new Error('VaultDB not initialized'));
                    return;
                }

                const tx = db.transaction(ITEMS_STORE, 'readonly');
                const store = tx.objectStore(ITEMS_STORE);
                const request = store.get(id);

                request.onsuccess = () => resolve(request.result || null);
                request.onerror = (e) => reject(e.target.error || e);
            });
        },

        /**
         * Publish a new item to the Vault
         * @param {string} type - 'actor', 'lorebook', 'script', etc.
         * @param {Object} data - The full item data
         * @param {Object} metadata - { sourceProjectId, sourceProjectName, universe, tags }
         * @returns {Promise<Object>} - The created vault item
         */
        publish: function (type, data, metadata = {}) {
            return new Promise((resolve, reject) => {
                if (!db) {
                    reject(new Error('VaultDB not initialized'));
                    return;
                }

                const now = new Date().toISOString();
                const vaultItem = {
                    id: generateId(),
                    type: type,
                    version: 1,
                    versionHistory: [{
                        version: 1,
                        timestamp: now,
                        message: metadata.message || 'Initial publish'
                    }],
                    sourceProjectId: metadata.sourceProjectId || null,
                    sourceProjectName: metadata.sourceProjectName || 'Unknown Project',
                    universe: metadata.universe || '',
                    tags: metadata.tags || [],
                    publishedAt: now,
                    updatedAt: now,
                    data: data
                };

                const tx = db.transaction(ITEMS_STORE, 'readwrite');
                const store = tx.objectStore(ITEMS_STORE);
                const request = store.add(vaultItem);

                request.onsuccess = () => {
                    // Update registry
                    VaultDB._updateRegistryAfterChange(type, vaultItem.universe, vaultItem.tags, 1)
                        .then(() => resolve(vaultItem))
                        .catch(reject);
                };

                request.onerror = (e) => reject(e.target.error || e);
            });
        },

        /**
         * Push an update to an existing vault item (increment version)
         * @param {string} vaultId - The vault item ID
         * @param {Object} data - The updated item data
         * @param {string} message - Commit message (optional)
         * @returns {Promise<Object>} - The updated vault item
         */
        push: function (vaultId, data, message = '') {
            return new Promise((resolve, reject) => {
                if (!db) {
                    reject(new Error('VaultDB not initialized'));
                    return;
                }

                VaultDB.get(vaultId).then(existing => {
                    if (!existing) {
                        reject(new Error('Vault item not found'));
                        return;
                    }

                    const now = new Date().toISOString();
                    const newVersion = existing.version + 1;

                    const updated = {
                        ...existing,
                        version: newVersion,
                        versionHistory: [
                            ...existing.versionHistory,
                            {
                                version: newVersion,
                                timestamp: now,
                                message: message || `Updated to v${newVersion}`
                            }
                        ],
                        updatedAt: now,
                        data: data
                    };

                    const tx = db.transaction(ITEMS_STORE, 'readwrite');
                    const store = tx.objectStore(ITEMS_STORE);
                    const request = store.put(updated);

                    request.onsuccess = () => {
                        // Update registry timestamp
                        VaultDB.updateRegistry({}).then(() => resolve(updated)).catch(reject);
                    };

                    request.onerror = (e) => reject(e.target.error || e);
                }).catch(reject);
            });
        },

        /**
         * Update metadata on a vault item (universe, tags) without changing data
         * @param {string} vaultId
         * @param {Object} metadata - { universe, tags }
         * @returns {Promise<Object>}
         */
        updateMetadata: function (vaultId, metadata) {
            return new Promise((resolve, reject) => {
                if (!db) {
                    reject(new Error('VaultDB not initialized'));
                    return;
                }

                VaultDB.get(vaultId).then(existing => {
                    if (!existing) {
                        reject(new Error('Vault item not found'));
                        return;
                    }

                    const updated = {
                        ...existing,
                        universe: metadata.universe !== undefined ? metadata.universe : existing.universe,
                        tags: metadata.tags !== undefined ? metadata.tags : existing.tags,
                        updatedAt: new Date().toISOString()
                    };

                    const tx = db.transaction(ITEMS_STORE, 'readwrite');
                    const store = tx.objectStore(ITEMS_STORE);
                    const request = store.put(updated);

                    request.onsuccess = () => {
                        // Update registry with new tags/universes
                        VaultDB._rebuildRegistryStats()
                            .then(() => resolve(updated))
                            .catch(reject);
                    };

                    request.onerror = (e) => reject(e.target.error || e);
                }).catch(reject);
            });
        },

        /**
         * Delete a vault item
         * @param {string} vaultId
         * @returns {Promise}
         */
        delete: function (vaultId) {
            return new Promise((resolve, reject) => {
                if (!db) {
                    reject(new Error('VaultDB not initialized'));
                    return;
                }

                // Get item first to update counts
                VaultDB.get(vaultId).then(existing => {
                    if (!existing) {
                        resolve(); // Already gone
                        return;
                    }

                    const tx = db.transaction(ITEMS_STORE, 'readwrite');
                    const store = tx.objectStore(ITEMS_STORE);
                    const request = store.delete(vaultId);

                    request.onsuccess = () => {
                        VaultDB._updateRegistryAfterChange(existing.type, null, [], -1)
                            .then(resolve)
                            .catch(reject);
                    };

                    request.onerror = (e) => reject(e.target.error || e);
                }).catch(reject);
            });
        },

        /**
         * Search items by text query (searches name, description in data)
         * @param {string} query
         * @returns {Promise<Array>}
         */
        search: function (query) {
            if (!query || query.trim().length === 0) {
                return VaultDB.list();
            }

            const lowerQuery = query.toLowerCase().trim();

            return VaultDB.list().then(items => {
                return items.filter(item => {
                    const data = item.data || {};
                    const searchFields = [
                        data.name,
                        data.personality,
                        data.description,
                        data.content,
                        data.comment,
                        item.universe,
                        item.sourceProjectName,
                        ...(item.tags || [])
                    ].filter(Boolean);

                    return searchFields.some(field =>
                        field.toLowerCase().includes(lowerQuery)
                    );
                });
            });
        },

        /**
         * Get all unique universes
         * @returns {Promise<Array<string>>}
         */
        getUniverses: function () {
            return VaultDB.getRegistry().then(reg => reg.universes || []);
        },

        /**
         * Get all unique tags
         * @returns {Promise<Array<string>>}
         */
        getTags: function () {
            return VaultDB.getRegistry().then(reg => reg.allTags || []);
        },

        /**
         * Get items by universe
         * @param {string} universe
         * @returns {Promise<Array>}
         */
        getByUniverse: function (universe) {
            return VaultDB.list({ universe });
        },

        /**
         * Get items by source project
         * @param {string} projectId
         * @returns {Promise<Array>}
         */
        getByProject: function (projectId) {
            return VaultDB.list({ sourceProjectId: projectId });
        },

        /**
         * Internal: Update registry after item add/remove
         */
        _updateRegistryAfterChange: function (type, universe, tags, countDelta) {
            return VaultDB.getRegistry().then(reg => {
                const updates = {};

                // Update item count
                if (type && reg.itemCounts) {
                    updates.itemCounts = { ...reg.itemCounts };
                    updates.itemCounts[type] = (updates.itemCounts[type] || 0) + countDelta;
                    if (updates.itemCounts[type] < 0) updates.itemCounts[type] = 0;
                }

                // Add universe if new
                if (universe && !reg.universes.includes(universe)) {
                    updates.universes = [...reg.universes, universe];
                }

                // Add new tags
                if (tags && tags.length > 0) {
                    const newTags = tags.filter(t => !reg.allTags.includes(t));
                    if (newTags.length > 0) {
                        updates.allTags = [...reg.allTags, ...newTags];
                    }
                }

                if (Object.keys(updates).length > 0) {
                    return VaultDB.updateRegistry(updates);
                }
                return reg;
            });
        },

        /**
         * Internal: Rebuild registry stats by scanning all items
         * (Used after metadata changes to clean up orphaned universes/tags)
         */
        _rebuildRegistryStats: function () {
            return VaultDB.list().then(items => {
                const universes = new Set();
                const allTags = new Set();
                const itemCounts = {
                    actor: 0,
                    lorebook: 0,
                    script: 0,
                    location: 0,
                    event: 0,
                    pair: 0
                };

                items.forEach(item => {
                    if (item.universe) universes.add(item.universe);
                    (item.tags || []).forEach(t => allTags.add(t));
                    if (item.type && itemCounts[item.type] !== undefined) {
                        itemCounts[item.type]++;
                    }
                });

                return VaultDB.updateRegistry({
                    universes: Array.from(universes).sort(),
                    allTags: Array.from(allTags).sort(),
                    itemCounts
                });
            });
        },

        /**
         * Export vault items as downloadable .vault file
         * @param {Object} options - { universe, types, itemIds }
         * @returns {Promise}
         */
        exportVault: function (options = {}) {
            return VaultDB.list().then(items => {
                let filtered = items;

                if (options.universe) {
                    filtered = filtered.filter(i => i.universe === options.universe);
                }
                if (options.types && options.types.length > 0) {
                    filtered = filtered.filter(i => options.types.includes(i.type));
                }
                if (options.itemIds && options.itemIds.length > 0) {
                    filtered = filtered.filter(i => options.itemIds.includes(i.id));
                }

                const exportData = {
                    version: '1.0',
                    exportedAt: new Date().toISOString(),
                    itemCount: filtered.length,
                    items: filtered
                };

                const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                const filename = options.universe
                    ? `${options.universe.replace(/[^a-z0-9]/gi, '_')}.vault`
                    : 'anansi_vault.vault';
                a.download = filename;
                a.click();
                URL.revokeObjectURL(url);

                if (A.UI?.Toast) {
                    A.UI.Toast.show(`Exported ${filtered.length} items`, 'success');
                }
            });
        },

        /**
         * Import items from a .vault file
         * @param {Object} importData - Parsed vault file
         * @param {Object} options - { overwrite: boolean }
         * @returns {Promise<{ imported: number, skipped: number }>}
         */
        importVault: function (importData, options = {}) {
            if (!importData || !importData.items || !Array.isArray(importData.items)) {
                return Promise.reject(new Error('Invalid vault file format'));
            }

            return new Promise(async (resolve, reject) => {
                let imported = 0;
                let skipped = 0;

                for (const item of importData.items) {
                    try {
                        const existing = await VaultDB.get(item.id);
                        if (existing && !options.overwrite) {
                            skipped++;
                            continue;
                        }

                        // Save item
                        const tx = db.transaction(ITEMS_STORE, 'readwrite');
                        const store = tx.objectStore(ITEMS_STORE);
                        await new Promise((res, rej) => {
                            const req = store.put(item);
                            req.onsuccess = res;
                            req.onerror = rej;
                        });
                        imported++;
                    } catch (err) {
                        console.warn('[VaultDB] Failed to import item:', item.id, err);
                        skipped++;
                    }
                }

                // Rebuild registry
                await VaultDB._rebuildRegistryStats();

                resolve({ imported, skipped });
            });
        }
    };

    A.VaultDB = VaultDB;

})(window.Anansi);
