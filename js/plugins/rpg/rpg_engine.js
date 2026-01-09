/**
 * Anansi Plugin: RPG Engine (Logic Core)
 * File: js/plugins/rpg/rpg_engine.js
 * Purpose: Handles deterministic game logic (dice, stats, combat) independent of the LLM.
 */

(function (A) {
    'use strict';

    if (!window.RPG) window.RPG = {};

    const Engine = {

        // --- Core Action Processor ---
        processAction: function (actionId, params = {}) {
            const state = RPG.State.get();
            if (!state) return { success: false, logs: ["RPG State not initialized."] };

            const actors = state.entities || [];
            const result = {
                success: true,
                logs: [],
                narrativeContext: null, // For LLM handoff
                changes: []
            };

            // Identify Actor & Targets
            const sourceId = params.sourceId;
            const targetIds = params.targetIds || [];

            const source = actors.find(a => a.id === sourceId);
            const targets = actors.filter(a => targetIds.includes(a.id));

            if (!source) {
                return { success: false, logs: [`Source entity not found: ${sourceId}`] };
            }

            // --- COMBAT ACTIONS ---
            if (actionId === 'attack_melee') {
                this.resolveAttack(source, targets, 'melee', result);
            } else if (actionId === 'attack_ranged') {
                this.resolveAttack(source, targets, 'ranged', result);
            } else if (actionId === 'defend') {
                source.stats.defending = true;
                result.logs.push(`${source.name} adopts a defensive stance.`);
                result.narrativeContext = `${source.name} raises their guard, preparing for incoming attacks.`;
            } else if (actionId === 'flee') {
                // Simple Flee Logic
                const roll = this.rollDice("1d20");
                if (roll.total > 10) {
                    result.logs.push(`${source.name} managed to escape!`);
                    result.narrativeContext = `${source.name} breaks valid engagement and flees the scene!`;
                    // In a real system, we might remove them from the encounter or end combat
                } else {
                    result.logs.push(`${source.name} failed to escape.`);
                    result.narrativeContext = `${source.name} tries to run but is blocked!`;
                }
            } else {
                result.logs.push(`Unknown action: ${actionId}`);
                result.success = false;
            }

            return result;
        },

        // --- Combat Resolution ---
        resolveAttack: function (source, targets, type, result) {
            if (targets.length === 0) {
                result.logs.push(`${source.name} attacks... but no target was selected!`);
                return;
            }

            targets.forEach(target => {
                // 1. Roll to Hit
                // Default d20 + modifiers (placeholder logic, refine with real stats later)
                const attackRoll = this.rollDice("1d20");
                const hitMod = 5; // Placeholder
                const totalHit = attackRoll.total + hitMod;
                const targetAC = target.stats.ac || 10;

                const isHit = totalHit >= targetAC;
                const isCrit = attackRoll.total === 20;

                let logMsg = `${source.name} attacks ${target.name} (${type})... Roll: ${attackRoll.total} + ${hitMod} = ${totalHit} vs AC ${targetAC}.`;

                if (isHit || isCrit) {
                    // 2. Roll Damage
                    // Default 1d6 + 2 (placeholder)
                    const dmgRoll = this.rollDice("1d6");
                    let damage = dmgRoll.total + 2;
                    if (isCrit) {
                        damage *= 2;
                        logMsg += " CRITICAL HIT!";
                    } else {
                        logMsg += " Hit!";
                    }

                    // Apply Damage
                    target.stats.hp = Math.max(0, (target.stats.hp || 0) - damage);
                    logMsg += ` Dealt ${damage} damage. (${target.stats.hp} HP remaining)`;

                    // Narrative Context
                    result.narrativeContext = `${source.name} attacks ${target.name} and HITS for ${damage} damage. ${target.name} is now at ${target.stats.hp} HP.`;

                    // Check Death
                    if (target.stats.hp <= 0) {
                        logMsg += ` ${target.name} was defeated!`;
                        result.narrativeContext += ` ${target.name} collapses, defeated.`;
                    }

                } else {
                    logMsg += " Miss.";
                    result.narrativeContext = `${source.name} attacks ${target.name} but MISSES.`;
                }

                result.logs.push(logMsg);
            });
        },


        // --- Utilities ---
        rollDice: function (notation) {
            // Simple parser: NdX
            const [count, sides] = notation.toLowerCase().split('d').map(Number);
            let total = 0;
            const rolls = [];
            for (let i = 0; i < count; i++) {
                const val = Math.floor(Math.random() * sides) + 1;
                rolls.push(val);
                total += val;
            }
            return { total, rolls, notation };
        }
    };

    window.RPG.Engine = Engine;
    console.log("[RPG] Engine Loaded");

})(window.Anansi);
