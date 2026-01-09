/**
 * Anansi Plugin: RPG Context Injector
 * File: js/plugins/rpg/rpg_combat_engine.js
 * Purpose: Injects RPG State (Entities, HP, Status) into the Simulator context for the LLM.
 *          Does NOT execute game mechanics (moved to rpg_engine.js).
 */

(function (A) {
    'use strict';

    if (!window.RPG) window.RPG = {};

    const CombatEngine = {
        name: "sys_rpg",

        // --- Input Phase: Inject Context ---
        input: function (context) {
            // Only run if this is an RPG session
            if (context.source !== 'rpg_session') return;

            const state = RPG.State.get();
            if (!state || !state.entities) return;

            // 1. Generate Entity Summary (Natural Language)
            // Goal: "Alice (Cleric) is standing strong. Bob (Fighter) is bloodied. An Orc is dead."

            const describeHealth = (cur, max) => {
                const pct = cur / max;
                if (pct <= 0) return 'defeated';
                if (pct < 0.25) return 'near death';
                if (pct < 0.5) return 'bloodied';
                if (pct < 0.9) return 'wounded';
                return 'healthy';
            };

            let entities = state.entities || [];
            if (!Array.isArray(entities)) {
                entities = Object.values(entities);
            }

            const activeEntities = entities.filter(e => {
                // Filter out dead/gone unless significant?
                // Let's keep them but mark as defeated contextually
                return true;
            });

            if (activeEntities.length === 0) return;

            const descriptions = activeEntities.map(e => {
                const hp = e.stats.hp || 0;
                const maxHp = e.stats.max_hp || 10;
                const status = describeHealth(hp, maxHp);

                // e.g. "Wango the Level 1 Unknown (healthy)"
                return `${e.name} (${e.class || e.type || 'Unknown'}, ${status})`;
            });

            const sceneContext = `[RPG Context: The following characters are present: ${descriptions.join(', ')}.]`;

            // 2. Inject into User Input (Prepend)
            // The Simulator treats this as part of the "message" sent to the LLM,
            // so the LLM knows who is there even if the user just says "Look around".
            if (context.user_input) {
                context.user_input = `${sceneContext}\n\n${context.user_input}`;
            }

            // 3. Inject Narrative Control (from RPG.Engine)
            // If the Engine ran logic (e.g. Attack), it passed a request via params.
            // We prepend this so the LLM knows what *just happened* mechanically.
            if (context.narrativeControl) {
                const narrativeNote = `[GM Guidance: ${context.narrativeControl}]`;
                context.user_input = `${narrativeNote}\n\n${context.user_input}`;

                // Also log it for debugging
                if (context.console) context.console.log("Injected Narrative Control:", context.narrativeControl);
            }
        },

        // --- Output Phase: No Op ---
        output: function (context) {
            // We rely on the standard Simulator output handling.
        }
    };

    // Register as a System Script
    // We update the existing 'sys_rpg' slot if it exists, or likely it's loaded via A.Scripts
    if (A.Scripts && A.Scripts.register) {
        A.Scripts.register(CombatEngine);
    } else {
        // Fallback or early load manual registration if needed
        // Ideally scripts.js handles loading this file
    }

    // Also expose globally for debugging
    window.RPG.CombatEngine = CombatEngine;
    console.log("[RPG] Context Injector Loaded");

})(window.Anansi);
