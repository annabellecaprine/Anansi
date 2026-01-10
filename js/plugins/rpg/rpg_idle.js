/**
 * Anansi RPG: Idle Action System
 * File: js/plugins/rpg/rpg_idle.js
 * Purpose: Generate ambient NPC behavior for a living world
 * Inspired by LlamaTale's idle_action system
 */

(function (RPG) {
    'use strict';

    RPG.Idle = {
        // Probability of generating idle action per NPC per turn (0-1)
        IDLE_CHANCE: 0.3,

        // Track last idle time to prevent spam
        _lastIdleTick: 0,
        _minTickInterval: 5000, // 5 seconds between idle generations

        /**
         * Generate idle actions for NPCs in a location
         * @param {string} locationId - Location to generate for
         * @returns {Promise<string[]>} Array of idle action strings
         */
        generateForLocation: async function (locationId) {
            // Throttle idle generation
            const now = Date.now();
            if (now - this._lastIdleTick < this._minTickInterval) {
                return [];
            }
            this._lastIdleTick = now;

            const entities = RPG.Entities.getAll();
            const npcsHere = entities.filter(e =>
                e.locationId === locationId &&
                e.type !== 'party_member' &&
                (e.hp || 1) > 0
            );

            const actions = [];

            for (const npc of npcsHere) {
                // Random chance check
                if (Math.random() > this.IDLE_CHANCE) continue;

                const action = await this.generateIdleAction(npc, locationId);
                if (action) {
                    actions.push(action);

                    // Record as observed event for other NPCs in location
                    if (RPG.Memory) {
                        RPG.Memory.broadcastEvent(locationId, action, npc.id);
                    }
                }
            }

            return actions;
        },

        /**
         * Generate a single idle action for an NPC
         * Uses fallback if LLM not available
         * @param {object} npc - The NPC entity
         * @param {string} locationId - Current location
         * @returns {Promise<string|null>} The action text or null
         */
        generateIdleAction: async function (npc, locationId) {
            // Try LLM generation first
            if (A.LLM?.generate && RPG.Prompts) {
                try {
                    const prompt = RPG.Prompts.render('IDLE_ACTION', {
                        npc_name: npc.name,
                        occupation: npc.class || npc.occupation || 'person',
                        personality: npc.personality || '',
                        location: locationId || 'the area'
                    });

                    // Check cache first
                    if (RPG.Cache) {
                        const cacheKey = RPG.Cache.hash(`idle_${npc.id}_${Math.floor(Date.now() / 60000)}`);
                        const cached = RPG.Cache.get(cacheKey);
                        if (cached) return cached;
                    }

                    const response = await A.LLM.generate({
                        prompt: prompt,
                        maxTokens: 60,
                        temperature: 0.9
                    });

                    if (response) {
                        const action = `${npc.name} ${response.trim()}`;

                        // Cache the result
                        if (RPG.Cache) {
                            const cacheKey = RPG.Cache.hash(`idle_${npc.id}_${Math.floor(Date.now() / 60000)}`);
                            RPG.Cache.set(cacheKey, action);
                        }

                        return action;
                    }
                } catch (e) {
                    console.warn('[RPG.Idle] LLM generation failed:', e);
                }
            }

            // Fallback: Use pre-defined idle actions
            return this.generateFallbackAction(npc);
        },

        /**
         * Generate a fallback idle action without LLM
         * @param {object} npc - The NPC entity
         * @returns {string} A pre-defined idle action
         */
        generateFallbackAction: function (npc) {
            const genericActions = [
                'shifts their weight from one foot to the other.',
                'glances around the area cautiously.',
                'adjusts their gear.',
                'mutters something under their breath.',
                'scratches their chin thoughtfully.',
                'stretches their arms.',
                'yawns quietly.',
                'cracks their knuckles.',
                'taps their foot impatiently.',
                'examines their surroundings.'
            ];

            const combatActions = [
                'grips their weapon tightly.',
                'sizes up potential threats.',
                'takes a defensive stance.',
                'rolls their shoulders, ready for action.',
                'narrows their eyes, scanning for danger.'
            ];

            const merchantActions = [
                'counts their coins.',
                'arranges their wares.',
                'polishes a trinket.',
                'calls out to passersby.',
                'examines their inventory.'
            ];

            // Choose action set based on NPC type
            let actionSet = genericActions;
            const occupation = (npc.class || npc.occupation || '').toLowerCase();

            if (['warrior', 'soldier', 'guard', 'knight', 'fighter'].some(c => occupation.includes(c))) {
                actionSet = actionSet.concat(combatActions);
            }
            if (['merchant', 'trader', 'shopkeeper', 'vendor'].some(c => occupation.includes(c))) {
                actionSet = actionSet.concat(merchantActions);
            }

            const action = actionSet[Math.floor(Math.random() * actionSet.length)];
            return `${npc.name} ${action}`;
        },

        /**
         * Inject idle actions into context/system notes
         * @param {object} context - The context object with system_notes
         * @param {string} locationId - Current location
         */
        injectIntoContext: async function (context, locationId) {
            const actions = await this.generateForLocation(locationId);

            if (actions.length > 0) {
                const ambient = '\n\n[Ambient Activity]\n' + actions.join('\n');
                context.system_notes = (context.system_notes || '') + ambient;
            }

            return actions;
        },

        /**
         * Set the idle action probability
         * @param {number} chance - Value between 0 and 1
         */
        setIdleChance: function (chance) {
            this.IDLE_CHANCE = Math.max(0, Math.min(1, chance));
        }
    };

    console.log('[RPG] Idle action system loaded');

})(window.RPG || (window.RPG = {}));
