/**
 * Anansi Plugin: RPG Auto-Pilot
 * File: js/plugins/rpg/rpg_autopilot.js
 * 
 * Purpose: A deterministic "Bot Player" that drives the RPG Engine for simulation/stress-testing.
 * It replaces the human player, making decisions for exploration, combat, and interaction.
 * explicitly AVOIDS LLM calls, logging diagnostic markers instead.
 */

(function (A) {
    'use strict';

    const LOG_PREFIX = '[Auto-Pilot]';
    const TICK_RATE = 1500; // ms between actions

    const AutoPilot = {
        enabled: false,
        timer: null,
        mode: 'standard', // standard, random_walk

        /**
         * toggle Simulation Mode
         */
        toggle: function (enable) {
            this.enabled = (enable !== undefined) ? enable : !this.enabled;

            if (this.enabled) {
                console.log(LOG_PREFIX, 'Simulation Started');
                this.startLoop();
                // Disable LLM narration if active (Simulation implies raw mechanic test)
                if (A.RPGEngine) {
                    /* We assume the UI will handle the visual toggle state */
                }
                this.logSystem('🤖 **Simulation Mode Active**');
                this.logSystem('debug: <LLM Narration Disabled>');
            } else {
                console.log(LOG_PREFIX, 'Simulation Stopped');
                this.stopLoop();
                this.logSystem('🤖 **Simulation Mode Deactivated**');
            }
        },

        startLoop: function () {
            if (this.timer) clearInterval(this.timer);
            this.timer = setInterval(() => this.tick(), TICK_RATE);
        },

        stopLoop: function () {
            if (this.timer) clearInterval(this.timer);
            this.timer = null;
        },

        logSystem: function (msg) {
            // Push directly to chat log if possible, simulating system msg
            const chatLog = document.getElementById('rpg-chat-log');
            if (chatLog) {
                const div = document.createElement('div');
                div.className = 'msg-system';
                div.style.cssText = 'padding:4px 8px; font-size:11px; color:var(--text-muted); font-family:monospace; border-left:2px solid var(--accent-primary); margin:2px 0;';
                div.innerHTML = msg; // Trust local content
                chatLog.appendChild(div);
                chatLog.scrollTop = chatLog.scrollHeight;
            }
        },

        /**
         * Main Decision Loop
         */
        tick: function () {
            if (!this.enabled) return;

            const state = A.State.get();
            const engine = A.RPGEngine || (window.RPG && window.RPG.Engine);

            if (!engine || !state.rpg) return;

            // 1. Combat Logic
            if (state.rpg.combat && state.rpg.combat.active) {
                this.handleCombat(state, engine);
                return;
            }

            // 2. Exploration Logic
            this.handleExploration(state, engine);
        },

        /**
         * Combat AI (Player Side)
         */
        handleCombat: function (state, engine) {
            // Check whose turn it is
            const c = state.rpg.combat;
            const combatant = c.order[c.turn];

            // If it's a monster, wait (Engine AI handles it)
            const actor = engine.findActor(combatant.name);
            if (actor && actor.data?.rpg?.type === 'monster') {
                return; // Wait for engine
            }

            // If it's a player, ACT!
            this.logSystem(`🤖 Action: ${combatant.name} is thinking...`);

            // Simple Logic: Attack nearest/random enemy
            const activeEnemies = c.order.filter(o => {
                const a = engine.findActor(o.name);
                return a && a.data?.rpg?.type === 'monster' && (a.data?.rpg?.hp || 0) > 0;
            });

            if (activeEnemies.length > 0) {
                const target = activeEnemies[0]; // Just hit the first one
                engine.processCommand(`[ATTACK] ${target.name}`, {}, []); // [] logs will be handled by engine
            } else {
                // No enemies? End turn or combat
                engine.processCommand(`[END TURN]`, {}, []);
            }
        },

        /**
         * Exploration AI
         */
        handleExploration: function (state, engine) {
            const currentLocId = state.rpg.currentLocation;
            if (!currentLocId) return;

            // Get location data
            let location = null;
            if (state.weaves?.maps) {
                state.weaves.maps.forEach(map => {
                    const found = (map.locations || []).find(l => l.id === currentLocId);
                    if (found) location = found;
                });
            }

            if (!location) return;

            // A. Check for Loot (Dead bodies)
            const actors = Object.values(state.nodes?.actors?.items || {});
            const deadMonsters = actors.filter(a =>
                a.data?.rpg?.locationId === currentLocId &&
                a.data?.rpg?.type === 'monster' &&
                (a.data?.rpg?.hp || 0) <= 0 &&
                !a.data?.rpg?.looted
            );

            if (deadMonsters.length > 0) {
                this.logSystem(`🤖 Action: Looting ${deadMonsters[0].name}`);
                engine.processCommand(`[LOOT] ${deadMonsters[0].name}`, {}, []);
                return;
            }

            // B. Search Room (if not searched)
            if (!location.rpg) location.rpg = {};
            if (!location.rpg.autoSearched) {
                this.logSystem(`🤖 Action: Searching room`);
                engine.processCommand(`[SEARCH]`, {}, []);
                location.rpg.autoSearched = true;
                return;
            }

            // C. Rest (if hurt)
            const party = actors.filter(a => a.data?.rpg?.enabled && a.data?.rpg?.type !== 'monster');
            const needsRest = party.some(a => (a.data.rpg.hp || 0) < (a.data.rpg.maxHp || 10) * 0.5);

            if (needsRest) {
                // Ensure no enemies nearby (Engine check covers this, but we can check too)
                const enemies = actors.filter(a => a.data?.rpg?.locationId === currentLocId && a.data?.rpg?.type === 'monster' && (a.data.rpg.hp || 0) > 0);
                if (enemies.length === 0) {
                    this.logSystem(`🤖 Action: Resting (Low HP)`);
                    engine.processCommand(`[REST] short`, {}, []);
                    return;
                }
            }

            // D. Move (Explore)
            // Pick an exit
            const exits = location.exits || []; // array of IDs
            if (exits.length === 0) return;

            // Prefer unvisited
            const visited = state.rpg.visitedLocations || [];

            // Resolve exit objects (some might be strings, some objects)
            const resolvedExits = exits.map(e => {
                const id = typeof e === 'string' ? e : e.id;
                // Find location name for command
                let targetLoc = null;
                if (state.weaves?.maps) {
                    state.weaves.maps.forEach(map => {
                        const found = (map.locations || []).find(l => l.id === id);
                        if (found) targetLoc = found;
                    });
                }
                return targetLoc;
            }).filter(l => l);

            if (resolvedExits.length === 0) return;

            const unvisited = resolvedExits.filter(l => !visited.includes(l.id));
            const candidate = unvisited.length > 0 ? unvisited[Math.floor(Math.random() * unvisited.length)] : resolvedExits[Math.floor(Math.random() * resolvedExits.length)];

            this.logSystem(`🤖 Action: Moving to ${candidate.name}`);
            this.logSystem('debug: <LLM Trigger: Transition/Description>');
            engine.processCommand(`[MOVE] ${candidate.name}`, {}, []);
        }
    };

    // Export
    if (!window.RPG) window.RPG = {};
    window.RPG.AutoPilot = AutoPilot;
    A.RPGAutoPilot = AutoPilot; // Alias

})(window.Anansi);
