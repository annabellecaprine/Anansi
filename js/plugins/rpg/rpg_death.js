/**
 * Anansi Plugin: RPG Death & Respawn System
 * File: js/plugins/rpg/rpg_death.js
 * 
 * Purpose: Handles party death, corpse creation, and respawn mechanics.
 * When the party is defeated:
 * - Creates a corpse object at the death location containing all party inventory
 * - Respawns party at starting location with empty inventories
 * - Corpses can be retrieved by returning to the death location
 */

(function (A) {
    'use strict';

    const LOG_PREFIX = '[RPG Death]';

    if (!window.RPG) window.RPG = {};

    const Death = {

        /**
         * Initialize death system - attach to combat_defeat event
         */
        init: function () {
            console.log(LOG_PREFIX, 'Initializing...');
            const engine = A.RPGEngine || (window.RPG && window.RPG.Engine);
            if (!engine) {
                console.warn(LOG_PREFIX, 'Engine not found, will retry...');
                setTimeout(() => this.init(), 1000);
                return;
            }

            // Listen for party defeat
            engine.on('combat_defeat', (data) => {
                console.log(LOG_PREFIX, 'Party defeated!');
                this.handlePartyWipe(data.heroes);
            });

            console.log(LOG_PREFIX, 'Initialized successfully');
        },

        /**
         * Handle total party wipe
         * @param {Array} heroes - Array of defeated hero actors
         */
        handlePartyWipe: function (heroes) {
            const state = A.State.get();
            const currentLocation = state.rpg?.currentLocation;

            if (!currentLocation) {
                console.warn(LOG_PREFIX, 'No current location, cannot create corpse');
                return;
            }

            // 1. Create corpse with all party inventory
            const corpse = this.createCorpse(heroes, currentLocation);

            // 2. Respawn party at starting location
            this.respawnParty(heroes);

            // 3. Notify
            this.notify(`💀 **Party Defeated!** Your belongings remain at ${this.getLocationName(currentLocation)}. You awaken at the starting area...`);

            A.State.notify();
        },

        /**
         * Create a corpse object containing party inventory
         * @param {Array} heroes - Defeated party members
         * @param {string} locationId - Location where party died
         * @returns {Object} The created corpse object
         */
        createCorpse: function (heroes, locationId) {
            const state = A.State.get();

            // Ensure corpses array exists
            if (!state.rpg.corpses) state.rpg.corpses = [];

            // Gather all inventory and currency from party
            const inventory = [];
            let totalCurrency = 0;

            heroes.forEach(hero => {
                const rpg = hero.data?.rpg;
                if (!rpg) return;

                // Collect inventory items
                if (rpg.inventory && rpg.inventory.length > 0) {
                    inventory.push(...rpg.inventory);
                }

                // Collect equipped items
                const equipped = rpg.equipped || {};
                ['main_hand', 'off_hand', 'armor', 'accessory', 'head', 'boots', 'gloves'].forEach(slot => {
                    if (equipped[slot]) {
                        inventory.push(equipped[slot]);
                    }
                });

                // Collect currency
                totalCurrency += (rpg.currency || 0);
            });

            // Create corpse object
            const corpse = {
                id: `corpse_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
                type: 'corpse',
                name: 'Fallen Adventurers',
                description: 'The remains of your previous expedition. Your belongings are scattered here.',
                locationId: locationId,
                inventory: inventory,
                currency: totalCurrency,
                createdAt: Date.now(),
                retrieved: false
            };

            state.rpg.corpses.push(corpse);
            console.log(LOG_PREFIX, `Corpse created with ${inventory.length} items and ${totalCurrency} gold`);

            return corpse;
        },

        /**
         * Respawn party at starting location with cleared inventories
         * @param {Array} heroes - Party members to respawn
         */
        respawnParty: function (heroes) {
            const state = A.State.get();
            const startingLocation = state.rpg?.startingLocation;

            if (!startingLocation) {
                console.warn(LOG_PREFIX, 'No starting location set, cannot respawn');
                return;
            }

            heroes.forEach(hero => {
                const rpg = hero.data?.rpg;
                if (!rpg) return;

                // Clear inventory
                rpg.inventory = [];

                // Clear equipped items
                rpg.equipped = {};

                // Clear currency
                rpg.currency = 0;

                // Restore HP to half max (or 1 if no max defined)
                const maxHp = rpg.maxHp || rpg.stats?.max_hp || 10;
                rpg.hp = Math.max(1, Math.floor(maxHp / 2));

                // Update location
                rpg.locationId = startingLocation;
            });

            // Move party to starting location
            state.rpg.currentLocation = startingLocation;

            console.log(LOG_PREFIX, `Party respawned at ${startingLocation}`);
        },

        /**
         * Get corpses at a specific location
         * @param {string} locationId - Location to check
         * @returns {Array} Corpses at that location
         */
        getCorpsesAtLocation: function (locationId) {
            const state = A.State.get();
            const corpses = state.rpg?.corpses || [];
            return corpses.filter(c => c.locationId === locationId && !c.retrieved);
        },

        /**
         * Retrieve items from a corpse
         * @param {string} corpseId - ID of corpse to loot
         * @returns {boolean} Success
         */
        retrieveCorpse: function (corpseId) {
            const state = A.State.get();
            const corpses = state.rpg?.corpses || [];
            const corpse = corpses.find(c => c.id === corpseId);

            if (!corpse) {
                this.notify('⚠️ Corpse not found.');
                return false;
            }

            if (corpse.retrieved) {
                this.notify('⚠️ This corpse has already been looted.');
                return false;
            }

            // Check if player is at corpse location
            const currentLocation = state.rpg?.currentLocation;
            if (corpse.locationId !== currentLocation) {
                this.notify('⚠️ You must be at the corpse location to retrieve items.');
                return false;
            }

            // Find party leader to receive items
            const leaderId = state.rpg?.partyLeader;
            let leader = null;
            const actors = state.nodes?.actors?.items || {};
            for (const id in actors) {
                const actor = actors[id];
                if (actor.data?.rpg?.enabled) {
                    if (leaderId && id === leaderId) {
                        leader = actor;
                        break;
                    } else if (!leader) {
                        leader = actor;
                    }
                }
            }

            if (!leader) {
                this.notify('⚠️ No party member to receive items.');
                return false;
            }

            // Ensure leader has inventory
            if (!leader.data.rpg) leader.data.rpg = {};
            if (!leader.data.rpg.inventory) leader.data.rpg.inventory = [];

            // Transfer items
            const itemCount = corpse.inventory.length;
            leader.data.rpg.inventory.push(...corpse.inventory);

            // Transfer currency
            leader.data.rpg.currency = (leader.data.rpg.currency || 0) + corpse.currency;

            // Mark corpse as retrieved
            corpse.retrieved = true;

            this.notify(`🎒 Retrieved ${itemCount} items and 💰 ${corpse.currency} gold from your fallen comrades.`);

            // Emit event
            const engine = A.RPGEngine || (window.RPG && window.RPG.Engine);
            if (engine && engine.emit) {
                engine.emit('corpse_retrieved', { corpse, recipient: leader });
            }

            A.State.notify();
            return true;
        },

        /**
         * Get location name by ID
         * @param {string} locationId 
         * @returns {string} Location name or ID
         */
        getLocationName: function (locationId) {
            const state = A.State.get();
            if (state.weaves?.maps) {
                for (const map of state.weaves.maps) {
                    const loc = (map.locations || []).find(l => l.id === locationId);
                    if (loc) return loc.name || locationId;
                }
            }
            return locationId;
        },

        /**
         * Send notification to chat log
         * @param {string} msg - Message to display
         */
        notify: function (msg) {
            const chatLog = document.getElementById('rpg-chat-log');
            if (chatLog) {
                const div = document.createElement('div');
                div.className = 'msg-system';
                div.style.cssText = 'padding:6px; background:var(--bg-inset); border:1px solid var(--accent-danger); border-radius:4px; margin:4px 0; font-size:12px;';
                div.innerHTML = msg;
                chatLog.appendChild(div);
                chatLog.scrollTop = chatLog.scrollHeight;
            } else {
                console.log(LOG_PREFIX, msg);
            }
        }
    };

    // Export
    window.RPG.Death = Death;
    A.RPGDeath = Death;

    // Auto-init
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => Death.init());
    } else {
        setTimeout(() => Death.init(), 500);
    }

})(window.Anansi);
