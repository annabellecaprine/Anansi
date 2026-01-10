/**
 * RPG Plugin Core - Isolated Bootstrap
 * File: js/plugins/rpg/rpg_core.js
 * 
 * This file provides:
 * 1. Read-only hooks to access Anansi data safely
 * 2. Isolated RPG state namespace
 * 3. Error containment for all RPG operations
 * 
 * RULE: RPG code should NEVER directly modify state.nodes.* or state.strands.*
 *       Only state.rpg.* is safe to write to.
 */

(function () {
    'use strict';

    // Wait for Anansi to be ready
    if (!window.Anansi) {
        console.warn('[RPG Plugin] Anansi not ready, deferring load...');
        return;
    }

    const A = window.Anansi;

    // =========================================
    // RPG NAMESPACE (Isolated)
    // =========================================
    window.RPG = window.RPG || {};

    // =========================================
    // READ-ONLY HOOKS (Safe accessors)
    // These return COPIES of data, not references
    // =========================================

    RPG.Hooks = {
        /**
         * Get all actors as a frozen copy
         * @returns {Object} Copy of actors keyed by ID
         */
        getActors: function () {
            try {
                const state = A.State.get();
                const actors = state?.nodes?.actors?.items || {};
                return JSON.parse(JSON.stringify(actors));
            } catch (e) {
                console.error('[RPG] Failed to get actors:', e);
                return {};
            }
        },

        /**
         * Get a specific actor by ID or name
         * @param {string} idOrName 
         * @returns {Object|null} Copy of actor or null
         */
        getActor: function (idOrName) {
            try {
                const actors = this.getActors();
                // Try by ID first
                if (actors[idOrName]) return actors[idOrName];
                // Then by name (case-insensitive)
                const lower = idOrName.toLowerCase();
                return Object.values(actors).find(a => a.name?.toLowerCase() === lower) || null;
            } catch (e) {
                console.error('[RPG] Failed to get actor:', e);
                return null;
            }
        },

        /**
         * Get party members (actors with rpg.enabled and not monsters)
         * @returns {Array} Array of actor copies
         */
        getParty: function () {
            try {
                const actors = this.getActors();
                return Object.values(actors).filter(a =>
                    a.data?.rpg?.enabled && a.data.rpg.type !== 'monster'
                );
            } catch (e) {
                console.error('[RPG] Failed to get party:', e);
                return [];
            }
        },

        /**
         * Get active enemies (monsters with hp > 0)
         * @returns {Array} Array of actor copies
         */
        getEnemies: function () {
            try {
                const actors = this.getActors();
                return Object.values(actors).filter(a =>
                    a.data?.rpg?.enabled &&
                    a.data.rpg.type === 'monster' &&
                    (a.data.rpg.hp || 0) > 0
                );
            } catch (e) {
                console.error('[RPG] Failed to get enemies:', e);
                return [];
            }
        },

        /**
         * Get locations as frozen copy
         * @returns {Object} Copy of locations
         */
        getLocations: function () {
            try {
                const state = A.State.get();
                return JSON.parse(JSON.stringify(state?.nodes?.pairs?.items || {}));
            } catch (e) {
                console.error('[RPG] Failed to get locations:', e);
                return {};
            }
        },

        /**
         * Get the armory items
         * @returns {Array} Copy of items array
         */
        getArmory: function () {
            try {
                const state = A.State.get();
                return JSON.parse(JSON.stringify(state?.rpg?.items || []));
            } catch (e) {
                console.error('[RPG] Failed to get armory:', e);
                return [];
            }
        },

        /**
         * Get feat database
         * @returns {Array} Copy of feats array
         */
        getFeats: function () {
            try {
                const state = A.State.get();
                return JSON.parse(JSON.stringify(state?.rpg?.featDatabase || []));
            } catch (e) {
                console.error('[RPG] Failed to get feats:', e);
                return [];
            }
        },

        /**
         * Get bestiary
         * @returns {Array} Copy of bestiary array
         */
        getBestiary: function () {
            try {
                const state = A.State.get();
                return JSON.parse(JSON.stringify(state?.rpg?.bestiary || []));
            } catch (e) {
                console.error('[RPG] Failed to get bestiary:', e);
                return [];
            }
        }
    };

    // =========================================
    // SAFE WRITE OPERATIONS
    // Only writes to state.rpg.* namespace
    // =========================================

    RPG.State = {
        /**
         * Initialize RPG state if not present
         */
        init: function () {
            try {
                const state = A.State.get();
                if (!state) return {}; // State not ready yet
                if (!state.rpg) {
                    state.rpg = {
                        enabled: true,
                        mechanics: 'd20',
                        combat: null,
                        entities: {}, // ISOLATED ENTITY STORAGE
                        bestiary: [],
                        featDatabase: [],
                        items: [],
                        rulesets: {}
                    };
                }
                // Migration: Ensure entities object exists
                if (!state.rpg.entities) state.rpg.entities = {};

                return state.rpg;
            } catch (e) {
                console.error('[RPG] Failed to init state:', e);
                return {};
            }
        },

        /**
         * Get RPG state (safe reference)
         */
        get: function () {
            try {
                const state = A.State.get();
                return state?.rpg || this.init();
            } catch (e) {
                console.error('[RPG] Failed to get RPG state:', e);
                return {};
            }
        },

        /**
         * Notify state change
         */
        notify: function () {
            try {
                A.State.notify();
            } catch (e) {
                console.error('[RPG] Failed to notify:', e);
            }
        },

        /**
         * Subscribe to state changes
         */
        subscribe: function (callback) {
            try {
                return A.State.subscribe(callback);
            } catch (e) {
                console.error('[RPG] Failed to subscribe:', e);
                return () => { };
            }
        }
    };

    // =========================================
    // ENTITY MANAGEMENT (ISOLATED)
    // Manages characters within the RPG sandbox
    // =========================================

    RPG.Entities = {
        /**
         * Get a specific entity by ID
         */
        get: function (id) {
            try {
                const state = RPG.State.get();
                return state.entities?.[id] || null;
            } catch (e) {
                console.error('[RPG] Failed to get entity:', e);
                return null;
            }
        },

        /**
         * Get all valid entities
         */
        getAll: function () {
            try {
                const state = RPG.State.get();
                return Object.values(state.entities || {});
            } catch (e) {
                console.error('[RPG] Failed to get entities:', e);
                return [];
            }
        },

        /**
         * Create a new RPG entity
         * @param {Object} data - Initial data
         * @param {string} [sourceActorId] - Optional ID of core actor to link (read-only reference)
         */
        create: function (data, sourceActorId = null) {
            try {
                const state = RPG.State.get();
                if (!state.entities) state.entities = {};

                const id = 'rpg_ent_' + Math.random().toString(36).substr(2, 9);

                // If importing an actor, copy their name/type initially
                let name = data.name || "Unknown Entity";
                if (sourceActorId && !data.name) {
                    const sourceActor = RPG.Hooks.getActor(sourceActorId);
                    if (sourceActor) name = sourceActor.name;
                }

                // Handle duplicate names for pure RPG entities
                if (!sourceActorId && data.name) {
                    const existing = Object.values(state.entities);
                    const baseName = data.name;
                    const sameCount = existing.filter(e =>
                        e.name === baseName || e.name?.startsWith(baseName + ' ')
                    ).length;
                    if (sameCount > 0) name = `${baseName} ${sameCount + 1}`;
                }

                const newEntity = {
                    id: id,
                    name: name,
                    enabled: true, // Default to enabled for visibility
                    type: data.type || 'monster', // monster | npc | party_member
                    sourceActorId: sourceActorId, // Link to core actor if applicable

                    // Location Persistence
                    locationId: data.locationId || null,
                    encounterId: data.encounterId || null,

                    // RPG Stats
                    level: data.level || 1,
                    hp: data.hp || 10,
                    maxHp: data.maxHp || 10,
                    ac: data.ac || 10,
                    speed: data.speed || 30,
                    xp: data.xp || 0,

                    // Attributes
                    stats: data.stats || {
                        STR: 10, DEX: 10, CON: 10,
                        INT: 10, WIS: 10, CHA: 10
                    },

                    // Combat
                    actions: data.actions || 1,
                    bonusActions: data.bonusActions || 1,

                    // Inventory
                    inventory: data.inventory || [],
                    equipped: data.equipped || {},

                    // Abilities
                    feats: data.feats || [],

                    // Meta
                    description: data.description || "",
                    notes: ""
                };

                state.entities[id] = newEntity;

                state.entities[id] = newEntity;

                // CRITICAL SYNC: Also create a Graph Node for this entity
                // The Lens and Combat Engine iterate over state.nodes.actors.items, not state.entities
                const globalState = A.State.get();
                if (!globalState.nodes) globalState.nodes = {};
                if (!globalState.nodes.actors) globalState.nodes.actors = { items: {} };
                if (!globalState.nodes.actors.items) globalState.nodes.actors.items = {};

                globalState.nodes.actors.items[id] = {
                    id: id,
                    name: name,
                    type: 'actor',
                    data: {
                        rpg: newEntity // Link the RPG data directly
                    },
                    // Legacy compatibility
                    locationId: newEntity.locationId
                };

                RPG.State.notify();
                return id;
            } catch (e) {
                console.error('[RPG] Failed to create entity:', e);
                return null;
            }
        },

        /**
         * Update an entity safely
         */
        update: function (id, updater) {
            try {
                const state = RPG.State.get();
                const entity = state.entities?.[id];

                if (!entity) {
                    console.warn('[RPG] Update failed: Entity not found', id);
                    return false;
                }

                // If linked to an actor, refresh name just in case it changed in core
                if (entity.sourceActorId) {
                    const sourceActor = RPG.Hooks.getActor(entity.sourceActorId);
                    if (sourceActor) entity.name = sourceActor.name;
                }

                updater(entity);
                RPG.State.notify();
                return true;
            } catch (e) {
                console.error('[RPG] Failed to update entity:', e);
                return false;
            }
        },

        /**
         * Delete an entity
         */
        remove: function (id) {
            try {
                const state = RPG.State.get();
                if (state.entities?.[id]) {
                    delete state.entities[id];
                    RPG.State.notify();
                    return true;
                }
                return false;
            } catch (e) {
                console.error('[RPG] Failed to remove entity:', e);
                return false;
            }
        }
    };


    // =========================================
    // PANEL REGISTRATION (Safe wrapper)
    // =========================================

    RPG.registerPanel = function (id, config) {
        try {
            if (A && A.registerPanel) {
                // Wrap render function with error handling
                const originalRender = config.render;
                config.render = function (container) {
                    try {
                        originalRender(container);
                    } catch (e) {
                        console.error(`[RPG Panel: ${id}] Render failed:`, e);
                        container.innerHTML = `
                            <div style="padding:20px; color:var(--status-error);">
                                <h3>⚠️ RPG Panel Error</h3>
                                <p>This panel encountered an error:</p>
                                <pre style="font-size:11px; opacity:0.7;">${e.message}</pre>
                            </div>
                        `;
                    }
                };
                A.registerPanel(id, config);
            }
        } catch (e) {
            console.error(`[RPG] Failed to register panel ${id}:`, e);
        }
    };

    // =========================================
    // UTILITY FUNCTIONS
    // =========================================

    RPG.Utils = {
        /**
         * Safe dice roller
         */
        rollDice: function (formula) {
            try {
                if (!formula) return { total: 0, str: '0' };
                if (!isNaN(formula)) return { total: parseInt(formula), str: String(formula) };

                const parts = formula.toLowerCase().replace(/\s/g, '').split('+');
                let grandTotal = 0;
                let logStr = [];

                parts.forEach(part => {
                    if (part.includes('d')) {
                        let [count, face] = part.split('d');
                        count = count === '' ? 1 : parseInt(count || 1);
                        face = parseInt(face);
                        let subTotal = 0;
                        let rolls = [];
                        for (let i = 0; i < count; i++) {
                            let r = Math.floor(Math.random() * face) + 1;
                            subTotal += r;
                            rolls.push(r);
                        }
                        grandTotal += subTotal;
                        logStr.push(`[${rolls.join(',')}]`);
                    } else {
                        const n = parseInt(part);
                        if (!isNaN(n)) {
                            grandTotal += n;
                            logStr.push(String(n));
                        }
                    }
                });

                return { total: grandTotal, str: logStr.join('+') };
            } catch (e) {
                console.error('[RPG] Dice roll failed:', e);
                return { total: 0, str: 'error' };
            }
        },

        /**
         * Calculate ability modifier from score
         */
        calcMod: function (score) {
            return Math.floor((score - 10) / 2);
        },

        /**
         * Format modifier for display
         */
        formatMod: function (score) {
            const mod = this.calcMod(score);
            return mod >= 0 ? `+${mod}` : String(mod);
        }
    };

    // =========================================
    // TOAST WRAPPER
    // =========================================

    RPG.toast = function (message, type = 'info') {
        try {
            if (A.UI?.Toast?.show) {
                A.UI.Toast.show(message, type);
            } else {
                console.log(`[RPG Toast] ${type}: ${message}`);
            }
        } catch (e) {
            console.log(`[RPG Toast] ${type}: ${message}`);
        }
    };

    // =========================================
    // INITIALIZATION
    // =========================================

    console.log('[RPG Plugin] Core loaded successfully');
    RPG.State.init();

})();
