/**
 * Anansi RPG: Memory System
 * File: js/plugins/rpg/rpg_memory.js
 * Purpose: Track NPC memories of witnessed events and conversations
 * Inspired by LlamaTale's event caching system
 */

(function (RPG) {
    'use strict';

    const MAX_EVENTS = 50;           // Max observed events per entity
    const MAX_CONVERSATIONS = 10;    // Max conversation records per entity

    RPG.Memory = {
        /**
         * Generate a hash for an event string (for deduplication)
         * @param {string} eventText - The event description
         * @returns {string} Hash string like "evt_abc123"
         */
        hashEvent: function (eventText) {
            let hash = 0;
            const str = String(eventText || '');
            for (let i = 0; i < str.length; i++) {
                hash = ((hash << 5) - hash) + str.charCodeAt(i);
                hash |= 0; // Convert to 32-bit integer
            }
            return 'evt_' + Math.abs(hash).toString(36);
        },

        /**
         * Ensure entity has memory structure initialized
         * @param {object} entity - The entity object
         */
        ensureMemory: function (entity) {
            if (!entity.memory) {
                entity.memory = {
                    observedEvents: [],
                    conversations: [],
                    knownLocations: {}
                };
            }
        },

        /**
         * Record that an entity observed an event
         * @param {string} entityId - Entity that witnessed the event
         * @param {string} eventText - Description of what happened
         */
        recordEvent: function (entityId, eventText) {
            const entity = RPG.Entities.get(entityId);
            if (!entity) return;

            this.ensureMemory(entity);

            const hash = this.hashEvent(eventText);

            // Avoid duplicates
            if (!entity.memory.observedEvents.includes(hash)) {
                entity.memory.observedEvents.push(hash);

                // Trim to max capacity (FIFO)
                while (entity.memory.observedEvents.length > MAX_EVENTS) {
                    entity.memory.observedEvents.shift();
                }
            }
        },

        /**
         * Record a conversation between entities
         * @param {string} entityId - Entity having the conversation
         * @param {string} targetId - Who they spoke with
         * @param {string} summary - Brief summary of conversation content
         */
        recordConversation: function (entityId, targetId, summary) {
            const entity = RPG.Entities.get(entityId);
            if (!entity) return;

            this.ensureMemory(entity);

            const state = A.State.get();
            const turnNumber = state.sim?.history?.length || 0;

            entity.memory.conversations.push({
                with: targetId,
                summary: summary,
                turn: turnNumber,
                timestamp: Date.now()
            });

            // Trim old conversations (FIFO)
            while (entity.memory.conversations.length > MAX_CONVERSATIONS) {
                entity.memory.conversations.shift();
            }
        },

        /**
         * Record that an entity knows about a location
         * @param {string} entityId - Entity learning about the location
         * @param {string} locationName - Name of the location
         * @param {string} description - What they know about it
         */
        recordLocation: function (entityId, locationName, description) {
            const entity = RPG.Entities.get(entityId);
            if (!entity) return;

            this.ensureMemory(entity);
            entity.memory.knownLocations[locationName] = description;
        },

        /**
         * Check if entity has observed a specific event
         * @param {string} entityId 
         * @param {string} eventText 
         * @returns {boolean}
         */
        hasObserved: function (entityId, eventText) {
            const entity = RPG.Entities.get(entityId);
            if (!entity?.memory?.observedEvents) return false;

            const hash = this.hashEvent(eventText);
            return entity.memory.observedEvents.includes(hash);
        },

        /**
         * Get recent conversations for an entity
         * @param {string} entityId 
         * @param {number} count - Number of recent conversations to return
         * @returns {Array}
         */
        getRecentConversations: function (entityId, count = 3) {
            const entity = RPG.Entities.get(entityId);
            if (!entity?.memory?.conversations) return [];

            return entity.memory.conversations.slice(-count);
        },

        /**
         * Build a context string for LLM prompts
         * @param {string} entityId 
         * @returns {string} Formatted memory context
         */
        getContextForEntity: function (entityId) {
            const entity = RPG.Entities.get(entityId);
            if (!entity?.memory) return '';

            let ctx = '';

            // Recent conversations
            const convos = entity.memory.conversations || [];
            if (convos.length > 0) {
                ctx += '\n[Recent Conversations]';
                convos.slice(-3).forEach(c => {
                    ctx += `\n- With ${c.with}: ${c.summary}`;
                });
            }

            // Known locations
            const locs = Object.entries(entity.memory.knownLocations || {});
            if (locs.length > 0) {
                ctx += '\n[Known Locations]';
                locs.slice(0, 5).forEach(([name, desc]) => {
                    ctx += `\n- ${name}: ${desc}`;
                });
            }

            return ctx;
        },

        /**
         * Broadcast an event to all entities in a location
         * @param {string} locationId - Location where event occurred
         * @param {string} eventText - What happened
         * @param {string} excludeEntityId - Entity to exclude (usually the actor)
         */
        broadcastEvent: function (locationId, eventText, excludeEntityId = null) {
            const entities = RPG.Entities.getAll();
            const witnesses = entities.filter(e =>
                e.locationId === locationId &&
                e.id !== excludeEntityId &&
                (e.hp || 1) > 0
            );

            witnesses.forEach(witness => {
                this.recordEvent(witness.id, eventText);
            });

            return witnesses.length;
        },

        /**
         * Clear all memory for an entity
         * @param {string} entityId 
         */
        clearMemory: function (entityId) {
            const entity = RPG.Entities.get(entityId);
            if (entity) {
                entity.memory = {
                    observedEvents: [],
                    conversations: [],
                    knownLocations: {}
                };
            }
        }
    };

    console.log('[RPG] Memory system loaded');

})(window.RPG || (window.RPG = {}));
