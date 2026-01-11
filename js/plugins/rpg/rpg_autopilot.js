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

            const actors = Object.values(state.nodes?.actors?.items || {});

            // PRIORITY 0: Check for quests to turn in at current location
            if (RPG?.Quests?.getAvailableTurnIns) {
                const turnIns = RPG.Quests.getAvailableTurnIns();
                if (turnIns.length > 0) {
                    const quest = turnIns[0];
                    this.logSystem(`🤖 Quest: Turning in "${quest.title}"`);
                    RPG.Quests.turnIn(quest.id);
                    return;
                }
            }

            // PRIORITY 1: Retrieve corpses (death items)
            if (RPG?.Death?.getCorpsesAtLocation) {
                const corpses = RPG.Death.getCorpsesAtLocation(currentLocId);
                if (corpses.length > 0) {
                    this.logSystem(`🤖 Action: Retrieving items from corpse`);
                    RPG.Death.retrieveCorpse(corpses[0].id);
                    return;
                }
            }

            // PRIORITY 2: Check for NPCs with dialogue
            const npcsHere = actors.filter(a =>
                a.data?.rpg?.locationId === currentLocId &&
                a.data?.rpg?.type !== 'monster' &&
                a.data?.rpg?.type !== 'party_member' &&
                (a.data?.rpg?.hp || 1) > 0
            );

            for (const npc of npcsHere) {
                // Check for dialogue
                if (RPG?.Dialogue?.hasDialogue?.(npc.id) && !npc._autoPilotTalked) {
                    this.logSystem(`🤖 Action: Talking to ${npc.name}`);
                    npc._autoPilotTalked = true; // Don't repeat dialogue
                    RPG.Dialogue.startDialogue(npc.id);
                    // Auto-advance dialogue after a moment (non-blocking)
                    setTimeout(() => this.autoAdvanceDialogue(), 500);
                    return;
                }
            }

            // PRIORITY 3: Accept available quests
            const questionBoard = state.rpg?.questBoard || [];
            for (const questId of questionBoard) {
                const db = state.rpg?.questDB || [];
                const template = db.find(q => q.id === questId);
                if (template && RPG?.Quests?.checkPrerequisites?.(template)) {
                    const isTaken = state.rpg.quests?.active?.find(q => q.id.startsWith(questId));
                    const isDone = state.rpg.quests?.completed?.includes(questId);
                    if (!isTaken && !isDone) {
                        this.logSystem(`🤖 Quest: Accepting "${template.title}"`);
                        RPG.Quests.accept(template);
                        return;
                    }
                }
            }

            // PRIORITY 4: Shop for healing items if low on HP and at shop
            const party = actors.filter(a => a.data?.rpg?.enabled && a.data?.rpg?.type !== 'monster');
            const needsHealing = party.some(a => (a.data.rpg.hp || 0) < (a.data.rpg.maxHp || 10) * 0.5);
            if (needsHealing) {
                const shops = state.rpg?.shops || [];
                const shopHere = shops.find(s => s.locationId === currentLocId);
                if (shopHere && RPG?.Shops?.buyItem) {
                    // Look for healing items
                    const healingItem = (shopHere.stock || []).find(s => {
                        const armory = state.rpg?.armory?.items || [];
                        const item = armory.find(a => a.id === s.itemId);
                        return item && (item.type === 'consumable' || item.name?.toLowerCase().includes('potion'));
                    });
                    if (healingItem) {
                        this.logSystem(`🤖 Shop: Buying healing item`);
                        RPG.Shops.buyItem(shopHere.id, healingItem.itemId);
                        return;
                    }
                }
            }

            // PRIORITY 5: Loot dead monsters
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

            // PRIORITY 6: Search room
            if (!location.rpg) location.rpg = {};
            if (!location.rpg.autoSearched) {
                this.logSystem(`🤖 Action: Searching room`);
                engine.processCommand(`[SEARCH]`, {}, []);
                location.rpg.autoSearched = true;
                return;
            }

            // PRIORITY 7: Rest if hurt and safe
            if (needsHealing) {
                const enemies = actors.filter(a => a.data?.rpg?.locationId === currentLocId && a.data?.rpg?.type === 'monster' && (a.data.rpg.hp || 0) > 0);
                if (enemies.length === 0) {
                    this.logSystem(`🤖 Action: Resting (Low HP)`);
                    engine.processCommand(`[REST] short`, {}, []);
                    return;
                }
            }

            // PRIORITY 8: Move toward quest objectives
            const activeQuests = state.rpg?.quests?.active || [];
            for (const quest of activeQuests) {
                for (const obj of quest.objectives || []) {
                    if (obj.completed) continue;
                    // If objective has a location, try to go there
                    if (obj.location && obj.location !== currentLocId) {
                        const targetLoc = this.findLocation(state, obj.location);
                        if (targetLoc && this.canReach(state, location, targetLoc)) {
                            this.logSystem(`🤖 Quest: Moving toward objective in ${targetLoc.name}`);
                            engine.processCommand(`[MOVE] ${targetLoc.name}`, {}, []);
                            return;
                        }
                    }
                }
            }

            // PRIORITY 9: Explore new areas
            const exits = location.exits || [];
            if (exits.length === 0) return;

            const visited = state.rpg.visitedLocations || [];
            const resolvedExits = exits.map(e => {
                const id = typeof e === 'string' ? e : e.id;
                return this.findLocation(state, id);
            }).filter(l => l);

            if (resolvedExits.length === 0) return;

            const unvisited = resolvedExits.filter(l => !visited.includes(l.id));
            const candidate = unvisited.length > 0
                ? unvisited[Math.floor(Math.random() * unvisited.length)]
                : resolvedExits[Math.floor(Math.random() * resolvedExits.length)];

            this.logSystem(`🤖 Action: Moving to ${candidate.name}`);
            this.logSystem('debug: <LLM Trigger: Transition/Description>');
            engine.processCommand(`[MOVE] ${candidate.name}`, {}, []);
        },

        /**
         * Auto-advance dialogue (for autopilot)
         */
        autoAdvanceDialogue: function () {
            if (!RPG?.Dialogue?.currentNode) return;

            const node = RPG.Dialogue.currentNode;
            if (node.choices && node.choices.length > 0) {
                // Pick first available choice (or one that advances quest)
                RPG.Dialogue.selectChoice(0);
            } else if (node.next) {
                RPG.Dialogue.goToNode(node.next);
            } else {
                RPG.Dialogue.endDialogue();
            }

            // Continue advancing if dialogue still active
            if (RPG.Dialogue.currentDialogue) {
                setTimeout(() => this.autoAdvanceDialogue(), 300);
            }
        },

        /**
         * Find a location by ID
         */
        findLocation: function (state, locId) {
            if (!state.weaves?.maps) return null;
            for (const map of state.weaves.maps) {
                const found = (map.locations || []).find(l => l.id === locId);
                if (found) return found;
            }
            return null;
        },

        /**
         * Check if location is reachable (simple check)
         */
        canReach: function (state, fromLoc, toLoc) {
            if (!fromLoc?.exits) return false;
            return fromLoc.exits.some(e => {
                const id = typeof e === 'string' ? e : e.id;
                return id === toLoc.id;
            });
        }
    };

    // Export
    if (!window.RPG) window.RPG = {};
    window.RPG.AutoPilot = AutoPilot;
    A.RPGAutoPilot = AutoPilot; // Alias

})(window.Anansi);
