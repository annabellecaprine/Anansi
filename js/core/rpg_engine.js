/**
 * Anansi RPG Engine v1.0
 * File: js/core/rpg_engine.js
 * 
 * Purpose: Self-contained RPG game engine with full AURA Stack integration.
 * Decoupled from A.Simulator but shares AuraSimBuilder and Scripts.
 * 
 * This is a MUD-first engine where gameplay is deterministic without LLM.
 * LLM integration is an optional narrative layer.
 */

(function (A) {
    'use strict';

    // ========== CONFIGURATION ==========
    const DEBUG = false;
    const LOG_PREFIX = '[RPG Engine]';
    const DEFAULT_ACTIONS = 1;
    const DEFAULT_BONUS_ACTIONS = 1;

    // ========== EVENT SYSTEM ==========
    const eventHandlers = {};

    // ========== RPG ENGINE NAMESPACE ==========
    const RPGEngine = {

        // ===== INITIALIZATION =====
        /**
         * Ensure RPG state structure exists
         */
        ensureState: function () {
            const state = A.State.get();
            if (!state) return { rpg: { enabled: true, mechanics: 'd20', combat: { active: false } } };
            if (!state.rpg) {
                state.rpg = {
                    enabled: true,
                    mechanics: 'd20',
                    rulesets: {},
                    combat: null,
                    currentLocation: null,
                    startingLocation: null,
                    visitedLocations: [],
                    locationVisibility: {}, // id -> 'unknown'|'neighboring'|'visited'|'revealed'
                    narrationEnabled: true,
                    history: [] // RPG-specific chat history
                };
            }
            // Ensure locationVisibility exists (for existing states)
            if (!state.rpg.locationVisibility) state.rpg.locationVisibility = {};
            if (!state.rpg.combat) {
                state.rpg.combat = { active: false, round: 0, turn: 0, order: [] };
            }
            return state;
        },

        // ===== EVENT EMISSION SYSTEM =====
        /**
         * Register an event handler
         */
        on: function (eventType, handler) {
            if (!eventHandlers[eventType]) {
                eventHandlers[eventType] = [];
            }
            eventHandlers[eventType].push(handler);
        },

        /**
         * Emit an event to all registered handlers
         */
        emit: function (eventType, eventData) {
            if (DEBUG) console.log(LOG_PREFIX, 'Event:', eventType, eventData);
            const handlers = eventHandlers[eventType] || [];
            handlers.forEach(handler => {
                try {
                    handler(eventData);
                } catch (e) {
                    console.error(LOG_PREFIX, 'Event handler error:', e);
                }
            });
            return eventData;
        },

        // ===== AURA STACK PROCESSING =====
        /**
         * Build context from sources (mirrors Simulator.processRound context building)
         */
        buildContext: function (userInput, history, phase, params = {}) {
            const state = this.ensureState();

            // Resolve Sources (same logic as Simulator)
            const definedSources = (state.strands && state.strands.sources && state.strands.sources.items)
                ? state.strands.sources.items : {};
            const rawSources = {};

            // Merge keys
            const allSourceKeys = new Set([
                ...Object.keys(definedSources),
                ...Object.keys(state.sim?.simSources || {}),
                'character.name', 'character.personality', 'character.scenario', 'user.name'
            ]);

            allSourceKeys.forEach(key => {
                const src = definedSources[key] || { id: key, defaultValue: '' };
                let val = state.sim?.simSources?.[key];

                if (!val) {
                    const compiled = state.character?.compiled;
                    if (compiled) {
                        if (key === 'character.name' || key === 'name') val = compiled.name;
                        else if (key === 'character.personality' || key === 'personality') val = compiled.personality;
                        else if (key === 'character.scenario' || key === 'scenario') val = compiled.scenario;
                        else if (key === 'character.exampleDialogs' || key === 'example') val = compiled.examples;
                    }

                    if (!val) {
                        if (!state.seed) state.seed = {};
                        if (key === 'character.name' || key === 'name') val = state.seed.name || state.seed.characterName;
                        else if (key === 'character.personality' || key === 'personality') val = state.seed.persona;
                        else if (key === 'character.scenario' || key === 'scenario') val = state.seed.scenario;
                        else if (key === 'character.examples' || key === 'example') val = state.seed.examples;
                    }

                    if (key === 'user.name' && !val) val = state.meta?.author || 'User';
                }
                if (!val && val !== '') val = src.defaultValue;
                rawSources[key] = val || '';
            });

            // Build chat history format
            const chatHistory = (history || []).map(m => ({
                role: m.role,
                content: m.content || '',
                mes: m.content || '',
                message: m.content || '',
                name: m.role === 'user' ? (rawSources['user.name'] || 'User') : (rawSources['character.name'] || 'Char')
            }));

            const hybridChat = [...chatHistory];
            hybridChat.last_messages = chatHistory;

            // Build the context object
            return {
                chat: hybridChat,
                messages: chatHistory,
                phase: phase || 'input',
                user_input: userInput,
                responseText: phase === 'output' ? userInput : undefined,
                ...rawSources,
                ...params,
                source: 'rpg_session', // Critical: identifies RPG context
                sources: rawSources,
                character: {
                    name: rawSources['character.name'] || rawSources.name || 'Unknown',
                    personality: rawSources['character.personality'] || rawSources.personality || '',
                    description: rawSources['character.description'] || rawSources.description || '',
                    scenario: rawSources['character.scenario'] || rawSources.scenario || '',
                    example: rawSources['character.exampleDialogs'] || rawSources.example || ''
                },
                tags: [...(state.sim?.activeTags || [])],
                stats: state.weaves?.stats?.values || {},
                locations: state.weaves?.locations || [],
                actors: [...(state.sim?.actors || [])],
                system_notes: '' // Will be populated by scripts and RPG logic
            };
        },

        /**
         * Execute the script stack (pulse, intent, eros, aura)
         */
        runScripts: function (context, options = {}) {
            const state = A.State.get();
            const logs = [];

            // Get all scripts
            let scripts = (A.Scripts && A.Scripts.getAll) ? A.Scripts.getAll() : [];

            // Execution order (AURA stack + RPG at the end)
            const executionOrder = ['sys_pulse', 'sys_intent', 'sys_eros', 'sys_aura'];

            scripts.sort((a, b) => {
                const aIdx = executionOrder.indexOf(a.id);
                const bIdx = executionOrder.indexOf(b.id);
                if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
                if (aIdx !== -1) return -1;
                if (bIdx !== -1) return 1;
                return (a.order || 0) - (b.order || 0);
            });

            // Filter out sys_rpg - we handle RPG logic internally now
            scripts = scripts.filter(s => s.id !== 'sys_rpg');

            // Dynamic AURA compilation
            if (A.AuraSimBuilder) {
                const auraScript = scripts.find(s => s.id === 'sys_aura');
                if (auraScript && auraScript.enabled) {
                    try {
                        const dynamicCode = A.AuraSimBuilder.build(state);
                        scripts = scripts.map(s => s.id === 'sys_aura' ? { ...s, source: { code: dynamicCode } } : s);
                        logs.push("AURA Stack Compiled (Instrumented)");
                    } catch (e) {
                        logs.push("AURA SimBuild Failed: " + e.message);
                    }
                }
            } else if (A.AuraBuilder) {
                const auraScript = scripts.find(s => s.id === 'sys_aura');
                if (auraScript && auraScript.enabled) {
                    try {
                        const dynamicCode = A.AuraBuilder.build(state);
                        scripts = scripts.map(s => s.id === 'sys_aura' ? { ...s, source: { code: dynamicCode } } : s);
                        logs.push("AURA Stack Compiled");
                    } catch (e) {
                        logs.push("AURA Build Failed: " + e.message);
                    }
                }
            }

            // Execute scripts
            const scriptLogs = [];
            scripts.forEach(script => {
                if (!script.enabled) return;

                const logger = {
                    log: (...args) => scriptLogs.push(`[${script.name}] ${args.join(' ')}`),
                    warn: (...args) => scriptLogs.push(`[${script.name}] WARN: ${args.join(' ')}`),
                    error: (...args) => scriptLogs.push(`[${script.name}] ERROR: ${args.join(' ')}`),
                    info: (...args) => scriptLogs.push(`[${script.name}] INFO: ${args.join(' ')}`)
                };

                try {
                    const phase = context.phase || 'input';
                    const checkPhase = 'if (!context.phase) context.phase = "' + phase + '";\n';
                    const body = '"use strict";\n' +
                        'try {\n' +
                        checkPhase +
                        script.source.code + '\n' +
                        '} catch (e) { console.error("[Script Error] " + e.message); }';

                    const runFn = new Function('context', 'console', 'A', body);
                    runFn(context, logger, A);
                } catch (err) {
                    scriptLogs.push(`[${script.name}] CRITICAL: ${err.message}`);
                }
            });

            // Log to FlowLogger if available
            if (A.FlowLogger) {
                scripts.forEach(script => {
                    A.FlowLogger.log({
                        name: script.name,
                        type: 'script',
                        passed: script.enabled,
                        reason: script.enabled ? 'Script executed' : 'Script disabled'
                    });
                });
                A.FlowLogger.endTurn();
            }

            return { logs: [...logs, ...scriptLogs], context };
        },

        /**
         * Full processing round: User input → AURA Stack → RPG Commands → Output
         */
        processRound: function (userInput, history, phase = 'input', params = {}) {
            try {
                const state = this.ensureState();

                // 1. Build context
                const context = this.buildContext(userInput, history, phase, params);
                const snapshot = JSON.parse(JSON.stringify(context));

                // 2. Run AURA script stack
                const scriptResult = this.runScripts(context);
                const logs = scriptResult.logs;

                // 3. Process RPG commands (only on input phase)
                const sysLogs = [];
                if (phase === 'input') {
                    this.processCommand(userInput, context, sysLogs);
                }

                // 4. Build HUD
                this.renderHUD(context, sysLogs);

                // 5. Append system logs to context
                if (sysLogs.length > 0) {
                    context.system_notes = (context.system_notes || "") + "\n\n[RPG System]\n" + sysLogs.join('\n');
                }

                // 6. Emit event for narration hook
                if (sysLogs.length > 0) {
                    this.emit('round_complete', {
                        input: userInput,
                        logs: sysLogs,
                        context: context
                    });
                }

                return {
                    context: context,
                    logs: [...logs, ...sysLogs],
                    snapshot: snapshot,
                    sysLogs: sysLogs
                };

            } catch (err) {
                console.error(LOG_PREFIX, "Critical Error in processRound:", err);
                if (A.UI && A.UI.Toast) A.UI.Toast.show("RPG Engine Crash: " + err.message, 'error');
                return {
                    context: {},
                    logs: ["CRITICAL EXECUTION FAILURE: " + err.message],
                    snapshot: {},
                    sysLogs: []
                };
            }
        },

        // ===== DICE MECHANICS =====
        /**
         * Roll dice from a formula like "2d6+3"
         */
        rollDice: function (formula) {
            if (!formula) return { total: 0, str: "0" };
            if (!isNaN(formula)) return { total: parseInt(formula), str: String(formula) };

            const parts = formula.toLowerCase().replace(/\s/g, '').split('+');
            let grandTotal = 0;
            const logStr = [];

            parts.forEach(part => {
                if (part.includes('d')) {
                    let [count, face] = part.split('d');
                    count = count === '' ? 1 : parseInt(count || 1);
                    face = parseInt(face);

                    let subTotal = 0;
                    const rolls = [];
                    for (let i = 0; i < count; i++) {
                        const r = Math.floor(Math.random() * face) + 1;
                        subTotal += r;
                        rolls.push(r);
                    }
                    grandTotal += subTotal;
                    logStr.push(`[${rolls.join(',')}]`);
                } else {
                    const n = parseInt(part);
                    if (!isNaN(n)) {
                        grandTotal += n;
                        logStr.push(`${n}`);
                    }
                }
            });

            return { total: grandTotal, str: logStr.join('+') };
        },

        // ===== STAT RESOLUTION =====
        /**
         * Get a stat value from an actor
         */
        getStat: function (actor, key) {
            if (!actor || !key) return 0;
            const originalKey = key;
            key = key.replace(/\+/g, '').replace('Mod', '').trim().toUpperCase();
            const isMod = originalKey.toLowerCase().includes('mod');

            const rpgData = actor.data?.rpg || {};

            // 1. Core stats
            if (rpgData[key.toLowerCase()] !== undefined) {
                return parseInt(rpgData[key.toLowerCase()] || 0);
            }

            // 2. Stats matrix
            let val = null;
            if (rpgData.stats_matrix && rpgData.stats_matrix.values) {
                const blocks = Object.values(rpgData.stats_matrix.values);
                for (const block of blocks) {
                    if (block[key] !== undefined) {
                        val = parseInt(block[key]);
                        break;
                    }
                }
            }

            // 3. Modifier calculation
            if (val !== null) {
                if (isMod) return Math.floor((val - 10) / 2);
                return val;
            }
            return 0;
        },

        /**
         * Find an actor by name
         */
        findActor: function (name) {
            if (!name) return null;
            const state = A.State.get();
            const actors = Object.values(state.nodes?.actors?.items || {});
            let hit = actors.find(a => a.name?.toLowerCase() === name.toLowerCase());
            if (!hit) hit = actors.find(a => a.name?.toLowerCase().includes(name.toLowerCase()));
            return hit;
        },

        // ===== ACTION ECONOMY =====
        /**
         * Consume an action from the current combatant
         */
        consumeAction: function (sysLogs) {
            const state = A.State.get();
            if (!state.rpg?.combat?.active) return true;

            const c = state.rpg.combat;
            const currentCombatant = c.order[c.turn];
            if (!currentCombatant) return true;

            // Initialize if missing
            if (typeof currentCombatant.actions !== 'number') {
                const mainActions = currentCombatant.maxActions || DEFAULT_ACTIONS;
                const bonusActions = currentCombatant.maxBonusActions || DEFAULT_BONUS_ACTIONS;
                currentCombatant.actions = mainActions + bonusActions;
                currentCombatant.maxActions = currentCombatant.actions;
            }

            if (currentCombatant.actions <= 0) {
                sysLogs.push(`⚠️ **${currentCombatant.name}** has no actions remaining!`);
                return false;
            }

            currentCombatant.actions--;
            sysLogs.push(`*(Action used. ${currentCombatant.actions} action${currentCombatant.actions !== 1 ? 's' : ''} remaining)*`);

            // Auto-end turn if all actions exhausted
            if (currentCombatant.actions <= 0) {
                sysLogs.push(`🔄 **${currentCombatant.name}** has used all actions. Turn ends automatically.`);
                this.nextTurn(sysLogs);
            }

            return true;
        },

        // ===== COMBAT SYSTEM =====
        /**
         * Start combat with all enabled actors
         */
        startCombat: function (sysLogs) {
            const state = A.State.get();
            const actors = Object.values(state.nodes?.actors?.items || {});

            // Filter by Location AND Enabled
            // Combat should only include actors in the current room
            const currentLocation = state.rpg?.currentLocation;
            if (!currentLocation) {
                sysLogs.push("⚠️ Cannot start combat: No location set.");
                return;
            }

            const combatants = actors.filter(a =>
                a.data?.rpg?.enabled &&
                a.data?.rpg?.locationId === currentLocation
            );

            if (combatants.length === 0) {
                sysLogs.push("⚠️ No valid combatants found in this location.");
                return;
            }

            const order = combatants.map(a => {
                const roll = this.rollDice('1d20');
                const dex = this.getStat(a, 'DEXMod');
                const mainActions = a.data.rpg.maxActions || DEFAULT_ACTIONS;
                const bonusActions = a.data.rpg.maxBonusActions || DEFAULT_BONUS_ACTIONS;
                const totalActions = mainActions + bonusActions;

                return {
                    id: a.id,
                    name: a.name,
                    init: roll.total + dex,
                    base: roll.total,
                    mod: dex,
                    acted: false,
                    actions: totalActions,
                    maxActions: totalActions
                };
            });

            order.sort((a, b) => b.init - a.init);

            if (order.length === 0) return; // Should be covered above, but safe.

            state.rpg.combat = {
                active: true,
                round: 1,
                turn: 0,
                order: order
            };

            sysLogs.push(`**Combat Started!**`);
            order.forEach(c => {
                sysLogs.push(`> ${c.name}: ${c.init} (${c.base} + ${c.mod}) [${c.actions} action${c.actions !== 1 ? 's' : ''}]`);
            });
            sysLogs.push(`**Round 1 Start**. It is **${order[0].name}**'s turn. (${order[0].actions} action${order[0].actions !== 1 ? 's' : ''} remaining)`);

            this.emit('combat_start', { order, round: 1 });

            // Check if first actor is AI-controlled
            const firstActor = this.findActor(order[0].name);
            if (firstActor?.data?.rpg?.type === 'monster') {
                this.runAI(firstActor, sysLogs);
                if (this.checkCombatEnd(sysLogs)) return;
                this.nextTurn(sysLogs);
            }
        },

        /**
         * Advance to next turn
         */
        nextTurn: function (sysLogs) {
            const state = A.State.get();
            if (!state.rpg?.combat?.active) {
                sysLogs.push("Combat is not active.");
                return;
            }

            const c = state.rpg.combat;

            // Safety check for invalid turn index
            if (!c.order || c.turn < 0 || c.turn >= c.order.length) {
                console.warn(LOG_PREFIX, 'Invalid turn index during nextTurn:', c.turn);
                // Try to recover: Reset to 0? Or just abort?
                // If we abort, combat might hang. Let's try reset to 0 if valid order.
                if (c.order && c.order.length > 0) {
                    c.turn = 0;
                } else {
                    // Total failure
                    sysLogs.push("Combat Error: Invalid order state.");
                    return;
                }
            }

            if (c.order[c.turn]) {
                c.order[c.turn].acted = true;
            }
            c.turn++;

            // Check for round wrap
            if (c.turn >= c.order.length) {
                c.turn = 0;
                c.round++;
                c.order.forEach(o => {
                    o.acted = false;
                    o.actions = o.maxActions || 2;
                });
                sysLogs.push(`**Round ${c.round} Start**`);
                this.emit('round_start', { round: c.round });
            }

            // Reset actions for current combatant
            const currentCombatant = c.order[c.turn];
            currentCombatant.actions = currentCombatant.maxActions || 2;

            let nextActor = c.order[c.turn];
            sysLogs.push(`It is now **${nextActor.name}**'s turn. (${nextActor.actions} action${nextActor.actions !== 1 ? 's' : ''} remaining)`);

            this.emit('turn_start', { combatant: nextActor, round: c.round, turn: c.turn });

            // AI Loop - execute AI turns until we hit a player
            let safety = 0;
            while (safety < 10) {
                const actorObj = this.findActor(nextActor.name);

                // Skip dead actors
                if ((actorObj?.data?.rpg?.hp || 0) <= 0) {
                    sysLogs.push(`Turn skipped: **${nextActor.name}** is 💀 Unconscious.`);
                    c.order[c.turn].acted = true;
                    c.turn++;
                    if (c.turn >= c.order.length) {
                        c.turn = 0;
                        c.round++;
                        c.order.forEach(o => o.acted = false);
                        sysLogs.push(`**Round ${c.round} Start**`);
                    }
                    nextActor = c.order[c.turn];
                    safety++;
                    continue;
                }

                // Execute AI if monster
                if (actorObj?.data?.rpg?.type === 'monster') {
                    this.runAI(actorObj, sysLogs);
                    if (this.checkCombatEnd(sysLogs)) return;

                    c.order[c.turn].acted = true;
                    c.turn++;
                    if (c.turn >= c.order.length) {
                        c.turn = 0;
                        c.round++;
                        c.order.forEach(o => o.acted = false);
                        sysLogs.push(`**Round ${c.round} Start**`);
                    }

                    nextActor = c.order[c.turn];
                    sysLogs.push(`It is now **${nextActor.name}**'s turn.`);
                    safety++;
                } else {
                    break; // Player turn
                }
            }
        },

        /**
         * Run AI for a monster actor
         */
        runAI: function (actor, sysLogs) {
            if ((actor.data?.rpg?.hp || 0) <= 0) return;
            sysLogs.push(`*${actor.name} is thinking...*`);

            const state = A.State.get();
            const actors = Object.values(state.nodes?.actors?.items || {});
            const heroes = actors.filter(a => a.data?.rpg?.enabled && a.data?.rpg?.type !== 'monster' && (a.data?.rpg?.hp || 0) > 0);

            if (heroes.length === 0) {
                sysLogs.push(`${actor.name} roars in triumph! (No targets found)`);
                return;
            }

            const target = heroes[Math.floor(Math.random() * heroes.length)];
            sysLogs.push(`**${actor.name}** attacks **${target.name}**!`);

            // Roll attack
            const rollResult = this.rollDice('1d20');
            const modVal = this.getStat(actor, 'STRMod');
            const targetAC = this.getStat(target, 'AC') || 10;

            const finalRoll = rollResult.total + modVal;
            const success = finalRoll >= targetAC;

            const outcome = success ? "SUCCESS" : "FAILURE";
            let calcStr = `${rollResult.total}`;
            if (modVal !== 0) calcStr += ` + ${modVal} (Mod)`;

            sysLogs.push(`🎲 **${outcome}**`);
            sysLogs.push(`Result: **${finalRoll}** (${calcStr}) >= **${targetAC}** (AC)`);

            if (success) {
                const dmgResult = this.rollDice('1d6');
                const dmgMod = this.getStat(actor, 'STRMod');
                const totalDmg = Math.max(1, dmgResult.total + dmgMod);

                if (!target.data.rpg) target.data.rpg = { hp: 10, maxHp: 10 };
                target.data.rpg.hp = Math.max(0, (target.data.rpg.hp || 0) - totalDmg);

                sysLogs.push(`⚔️ **Damage**: ${totalDmg} (${dmgResult.total} + ${dmgMod}) [Natural] -> ${target.name} (HP: ${target.data.rpg.hp})`);

                this.emit('damage', { source: actor, target, damage: totalDmg });
                A.State.notify();

                if (this.checkCombatEnd(sysLogs)) return;
            }
        },

        /**
         * Check if combat should end
         */
        checkCombatEnd: function (sysLogs) {
            const state = A.State.get();
            if (!state.rpg?.combat?.active) return false;

            const actors = Object.values(state.nodes?.actors?.items || {})
                .filter(a => a.data?.rpg?.enabled);
            const heroes = actors.filter(a => a.data?.rpg?.type !== 'monster');
            const monsters = actors.filter(a => a.data?.rpg?.type === 'monster');

            if (heroes.length === 0 && monsters.length === 0) return false;

            const allHeroesDown = heroes.length > 0 && heroes.every(h => (h.data?.rpg?.hp || 0) <= 0);
            const allMonstersDown = monsters.length > 0 && monsters.every(m => (m.data?.rpg?.hp || 0) <= 0);

            if (allHeroesDown || allMonstersDown) {
                sysLogs.push("");
                sysLogs.push("🛑 **COMBAT ENDED**");

                if (allMonstersDown) {
                    sysLogs.push("**Monsters Defeated**");
                    monsters.forEach(m => sysLogs.push(`- ${m.name}`));
                    this.emit('combat_victory', { monsters });
                }

                if (allHeroesDown) {
                    sysLogs.push("**Party Members Unconscious**");
                    heroes.forEach(h => sysLogs.push(`- ${h.name}`));
                    this.emit('combat_defeat', { heroes });
                }

                this.endCombat(sysLogs);
                return true;
            }
            return false;
        },

        /**
         * End combat
         */
        endCombat: function (sysLogs) {
            const state = A.State.get();
            state.rpg.combat = { active: false, round: 0, turn: 0, order: [] };
            sysLogs.push("**Combat Ended.**");
            this.emit('combat_end', {});
        },

        // ===== COMMAND PROCESSING =====
        /**
         * Process user input for RPG commands
         */
        processCommand: function (input, context, sysLogs) {
            if (!input) return;

            const state = this.ensureState();
            input = input.toLowerCase();

            // Combat commands
            if (input.includes('start combat')) {
                this.startCombat(sysLogs);
                return;
            }

            if (input.includes('end combat') || input.includes('stop combat')) {
                this.endCombat(sysLogs);
                return;
            }

            if (input.includes('end turn') || input.includes('pass turn')) {
                this.nextTurn(sysLogs);
                return;
            }

            // Recall command (debug: return to starting location)
            if (input.includes('[recall]') || input.includes('recall party')) {
                this.handleRecall(sysLogs);
                return;
            }

            // Movement commands
            if (input.includes('[move]')) {
                this.handleMove(input, sysLogs);
                return;
            }

            // Rules-based commands
            this.processRulesCommand(input, context, sysLogs);
        },

        /**
         * Handle movement between locations
         */
        handleMove: function (input, sysLogs) {
            const state = this.ensureState();

            // Get all locations from multi-map structure
            let locations = [];
            if (state.weaves?.maps) {
                state.weaves.maps.forEach(map => {
                    (map.locations || []).forEach(loc => locations.push(loc));
                });
            } else if (state.weaves?.locations) {
                locations = state.weaves.locations;
            }

            // Extract destination from input
            const match = input.match(/\[move\]\s*(.+)/i);
            if (!match) {
                sysLogs.push("⚠️ Invalid move command. Use: [MOVE] Location Name");
                return;
            }

            const destName = match[1].trim().toLowerCase();
            const destination = locations.find(l => l.name?.toLowerCase() === destName || l.id?.toLowerCase() === destName);

            if (!destination) {
                sysLogs.push(`⚠️ Unknown location: "${match[1].trim()}"`);
                return;
            }

            // Check if connected (if we have a current location)
            const currentLoc = state.rpg.currentLocation;
            if (currentLoc) {
                const current = locations.find(l => l.id === currentLoc);
                // Use 'exits' property instead of 'connections'
                const exits = current?.exits || [];
                const isConnected = exits.some(exit => {
                    const exitId = typeof exit === 'string' ? exit : exit.id;
                    return exitId === destination.id;
                });
                if (!isConnected) {
                    sysLogs.push(`⚠️ **${destination.name}** is not connected to your current location.`);
                    return;
                }
            }

            // Move to location
            const previousLocation = state.rpg.currentLocation;
            state.rpg.currentLocation = destination.id;

            // Track visited locations
            if (!state.rpg.visitedLocations) state.rpg.visitedLocations = [];
            if (!state.rpg.visitedLocations.includes(destination.id)) {
                state.rpg.visitedLocations.push(destination.id);
            }

            // Sync Party Location
            const actors = Object.values(state.nodes?.actors?.items || {});

            // Relaxed filter: Include if enabled is true OR undefined/null (default to enabled)
            // And strictly exclude monsters to find the party
            const party = actors.filter(a => {
                const rpg = a.data?.rpg;
                if (!rpg) return true; // Assume new actors are party
                if (rpg.type === 'monster') return false;
                return rpg.enabled !== false; // Allow true or undefined
            });

            console.log(LOG_PREFIX, 'Syncing party location to', destination.id, 'Count:', party.length);

            party.forEach(member => {
                if (!member.data) member.data = {};
                if (!member.data.rpg) member.data.rpg = { enabled: true };

                // Explicitly set locationId
                member.data.rpg.locationId = destination.id;

                // Also update root locationId if it exists on the node itself (some legacy nodes might use it)
                if (member.locationId !== undefined) member.locationId = destination.id;

                console.log(LOG_PREFIX, 'Updated member:', member.name, 'to', destination.id);
            });

            // Handle Encounters
            if (destination.encounters && destination.encounters.length > 0) {
                console.log(LOG_PREFIX, 'Checking encounters for', destination.name, destination.encounters);

                if (!state.rpg.clearedEncounters) state.rpg.clearedEncounters = [];

                destination.encounters.forEach((enc, index) => {
                    // Normalize encounter data
                    const monsterId = typeof enc === 'string' ? enc : (enc.id || enc.monsterId);
                    const count = typeof enc === 'object' ? (enc.count || 1) : 1;

                    if (!monsterId) return;

                    // Generate unique ID for THIS specific encounter instance in THIS room
                    // e.g. LOC_123_MOB_ORC_0
                    const uniqueEncounterId = `${destination.id}_${monsterId}_${index}`;

                    if (state.rpg.clearedEncounters.includes(uniqueEncounterId)) {
                        console.log(LOG_PREFIX, 'Encounter cleared:', uniqueEncounterId);
                        return;
                    }

                    // Check if currently active (alive in this room AND enabled)
                    // This creates a self-healing mechanism: if an entity exists but is broken/invisible (enabled=false/undefined),
                    // we ignore it here, allowing a fresh, correct spawn to replace it.
                    const existing = actors.find(a =>
                        a.data?.rpg?.encounterId === uniqueEncounterId &&
                        a.data?.rpg?.locationId === destination.id &&
                        (a.data?.rpg?.hp || 0) > 0 &&
                        a.data?.rpg?.enabled === true
                    );

                    if (!existing) {
                        console.log(LOG_PREFIX, 'Spawning encounter:', uniqueEncounterId);

                        // We need to look up the template from Bestiary
                        const bestiary = state.rpg.bestiary || [];
                        const template = bestiary.find(b => b.id === monsterId);

                        if (template) {
                            // Loop for count (if multiple of same mob in one slot)
                            // Actually, uniqueId relies on index, so if count > 1, 
                            // we should probably have treated them as separate entries or 
                            // added a sub-index. For now, assuming count is handled by user adding multiple entries
                            // or we just spawn one for this entry.
                            // UPDATE: The DM Atlas supports 'count'. We should loop count.

                            for (let i = 0; i < count; i++) {
                                // Sub-unique ID if count > 1
                                const specificId = count > 1 ? `${uniqueEncounterId}_${i}` : uniqueEncounterId;

                                if (state.rpg.clearedEncounters.includes(specificId)) continue;

                                // Check existing again for specific ID
                                const existingSpecific = actors.find(a => a.data?.rpg?.encounterId === specificId);
                                if (existingSpecific) continue;

                                const spawnData = {
                                    ...template,
                                    locationId: destination.id,
                                    encounterId: specificId
                                };

                                if (window.RPG && window.RPG.Entities) {
                                    const newId = window.RPG.Entities.create(spawnData);
                                    console.log(LOG_PREFIX, 'Spawned entity:', newId);
                                    if (i === 0) sysLogs.push(`⚠️ **Encounter!** ${template.name} appears!`);
                                } else {
                                    console.warn(LOG_PREFIX, "RPG.Entities not available for spawn.");
                                }
                            }
                        } else {
                            console.warn(LOG_PREFIX, 'Template not found for:', monsterId);
                        }
                    } else {
                        console.log(LOG_PREFIX, 'Encounter already active:', uniqueEncounterId);
                    }
                });

            } else {
                console.log(LOG_PREFIX, 'No encounters in', destination.name);
            }

            sysLogs.push(`📍 **Moved to ${destination.name}**`);
            if (destination.description) {
                sysLogs.push(destination.description);
            }

            // Update visibility for fog of war
            this.updateLocationVisibility(state, destination);

            // Emit location enter event (for UI image display)
            this.emit('location_enter', {
                location: destination,
                previousLocation: previousLocation,
                image: destination.image || null
            });

            A.State.notify();
        },

        /**
         * Update location visibility when entering a new location
         * @param {Object} state - Current game state
         * @param {Object} location - The location being entered
         */
        updateLocationVisibility: function (state, location) {
            if (!state.rpg.locationVisibility) state.rpg.locationVisibility = {};
            const visibility = state.rpg.locationVisibility;

            // Mark this location as visited
            visibility[location.id] = 'visited';

            // Add to visitedLocations if not already there
            if (!state.rpg.visitedLocations) state.rpg.visitedLocations = [];
            if (!state.rpg.visitedLocations.includes(location.id)) {
                state.rpg.visitedLocations.push(location.id);
            }

            // Mark connected exits as neighboring (if not already visited/revealed)
            const exits = location.exits || [];
            exits.forEach(exit => {
                const exitId = typeof exit === 'string' ? exit : exit.id;
                if (!visibility[exitId] || visibility[exitId] === 'unknown') {
                    visibility[exitId] = 'neighboring';
                }
            });
        },

        /**
         * Reveal a location by ID (GM tool)
         * @param {string} locationId - ID of location to reveal
         * @returns {boolean} Success
         */
        revealLocation: function (locationId) {
            const state = this.ensureState();
            if (!state.rpg.locationVisibility) state.rpg.locationVisibility = {};
            state.rpg.locationVisibility[locationId] = 'revealed';
            A.State.notify();
            this.emit('location_revealed', { locationId });
            return true;
        },

        /**
         * Get visibility state for a location
         * @param {string} locationId - ID of location
         * @returns {string} 'unknown'|'neighboring'|'visited'|'revealed'
         */
        getLocationVisibility: function (locationId) {
            const state = A.State.get();
            if (!state?.rpg?.locationVisibility) return 'unknown';
            return state.rpg.locationVisibility[locationId] || 'unknown';
        },

        /**
         * Recall party to starting location (debug/recovery tool)
         */
        handleRecall: function (sysLogs) {
            const state = this.ensureState();
            const startLoc = state.rpg.startingLocation;

            if (!startLoc) {
                sysLogs.push("⚠️ No starting location set. Set one in Game Master panel.");
                return;
            }

            const locations = state.weaves?.locations || [];
            const destination = locations.find(l => l.id === startLoc);

            if (!destination) {
                sysLogs.push("⚠️ Starting location not found in map.");
                return;
            }

            const previousLocation = state.rpg.currentLocation;
            state.rpg.currentLocation = startLoc;

            sysLogs.push(`🏠 **Party recalled to ${destination.name}**`);
            if (destination.description) {
                sysLogs.push(destination.description);
            }

            this.emit('location_enter', {
                location: destination,
                previousLocation: previousLocation,
                image: destination.image || null
            });

            A.State.notify();
        },

        /**
         * Process rules-based commands (attacks, skills, etc.)
         */
        processRulesCommand: function (input, context, sysLogs) {
            const state = A.State.get();
            const activeMech = state.rpg?.mechanics || 'd20';
            let rules = state.rpg?.rulesets?.[activeMech] || [];

            // Core rules that must exist
            const CORE_RULES = [
                { id: 'atk_melee', name: 'Melee Attack', roll: '1d20', mod: 'STR', target: 'AC', tmod: '0', op: '>=', category: 'combat', isCore: true },
                { id: 'atk_ranged', name: 'Ranged Attack', roll: '1d20', mod: 'DEX', target: 'AC', tmod: '0', op: '>=', category: 'combat', isCore: true },
                { id: 'atk_spell', name: 'Spell Attack', roll: '1d20', mod: 'INT', target: 'AC', tmod: '0', op: '>=', category: 'combat', isCore: true },
                { id: 'act_defend', name: 'Defend', roll: '', mod: '', target: '', tmod: '', op: '', category: 'combat', isCore: true, special: 'defend' },
                { id: 'act_flee', name: 'Flee', roll: '1d20', mod: 'DEX', target: '10', tmod: '0', op: '>=', category: 'combat', isCore: true, special: 'flee' },
                { id: 'act_use_item', name: 'Use Item', roll: '', mod: '', target: '', tmod: '', op: '', category: 'combat', isCore: true, special: 'item' },
                { id: 'act_use_ability', name: 'Use Ability', roll: '', mod: '', target: '', tmod: '', op: '', category: 'combat', isCore: true, special: 'ability' }
            ];

            // Ensure rules exist
            if (!rules || rules.length === 0) {
                if (!state.rpg.rulesets) state.rpg.rulesets = {};
                if (!state.rpg.rulesets[activeMech]) {
                    state.rpg.rulesets[activeMech] = JSON.parse(JSON.stringify(CORE_RULES));
                }
                rules = state.rpg.rulesets[activeMech];
            }

            // Ensure core rules exist
            CORE_RULES.filter(cr => cr.isCore).forEach(coreRule => {
                if (!rules.find(r => r.id === coreRule.id)) {
                    rules.unshift(JSON.parse(JSON.stringify(coreRule)));
                }
            });

            // Find matching rule
            const matchedRule = rules.find(r => r.name && input.includes(r.name.toLowerCase()));
            if (!matchedRule) return;

            // Get subject (active combatant or named actor)
            let subject = null;
            if (state.rpg?.combat?.active) {
                const c = state.rpg.combat;
                if (c.order?.[c.turn]) {
                    const activeId = c.order[c.turn].id;
                    subject = state.nodes?.actors?.items?.[activeId] || this.findActor(c.order[c.turn].name);
                }
            }

            if (!subject) {
                const potentialSubjects = Object.values(state.nodes?.actors?.items || {})
                    .filter(a => input.includes(a.name?.toLowerCase()));
                if (potentialSubjects.length > 0) subject = potentialSubjects[0];
                if (!subject) {
                    subject = this.findActor("Hero") || this.findActor("Player") ||
                        Object.values(state.nodes?.actors?.items || {})[0];
                }
            }

            // Validate subject
            if (!subject) return;

            // Check if monster (AI-controlled)
            if (state.rpg?.combat?.active && subject.data?.rpg?.type === 'monster') {
                sysLogs.push(`⚠️ **${subject.name}** is AI-controlled.`);
                return;
            }

            // Check if alive
            if ((subject.data?.rpg?.hp || 0) <= 0) {
                sysLogs.push(`🚫 **${subject.name}** is unconscious and cannot act!`);
                return;
            }

            // Consume action
            if (!this.consumeAction(sysLogs)) return;

            sysLogs.push(`**${subject.name}** triggers **${matchedRule.name}**`);

            // Handle special actions
            if (matchedRule.special === 'defend') {
                if (!subject.data.rpg.buffs) subject.data.rpg.buffs = [];
                subject.data.rpg.buffs.push({
                    type: 'defend',
                    name: 'Defending',
                    acBonus: 2,
                    expiresNextTurn: true
                });
                sysLogs.push(`🛡️ **${subject.name}** takes a defensive stance! (+2 AC until next turn)`);
                A.State.notify();
                return;
            }

            if (matchedRule.special === 'flee') {
                const fleeRoll = this.rollDice(matchedRule.roll || '1d20');
                const dexMod = this.getStat(subject, 'DEXMod');
                const dc = parseInt(matchedRule.target) || 10;
                const total = fleeRoll.total + dexMod;
                const success = total >= dc;

                sysLogs.push(`🎲 Flee attempt: **${total}** (${fleeRoll.total} + ${dexMod}) vs DC ${dc}`);

                if (success) {
                    sysLogs.push(`🏃 **${subject.name}** successfully escapes!`);
                    this.endCombat(sysLogs);
                } else {
                    sysLogs.push(`❌ **${subject.name}** failed to escape!`);
                }
                return;
            }

            // Standard roll logic
            let target = null;
            const potentialTargets = Object.values(state.nodes?.actors?.items || {});

            // Auto-target in combat
            if (state.rpg?.combat?.active && subject) {
                const isSubjectMonster = subject.data?.rpg?.type === 'monster';
                target = potentialTargets.find(a =>
                    a.data?.rpg?.enabled &&
                    (isSubjectMonster ? a.data?.rpg?.type !== 'monster' : a.data?.rpg?.type === 'monster') &&
                    (a.data?.rpg?.hp || 0) > 0 &&
                    a.id !== subject.id
                );
                if (target) sysLogs.push(`*(Auto-targeting **${target.name}**)*`);
            }

            // Roll
            const rollResult = this.rollDice(matchedRule.roll);
            const modVal = this.getStat(subject, matchedRule.mod + 'Mod');

            // Target calculation
            let targetVal = 0;
            if (!isNaN(parseInt(matchedRule.target))) {
                targetVal = parseInt(matchedRule.target);
            } else if (target) {
                targetVal = this.getStat(target, matchedRule.target);
            }

            const finalRoll = rollResult.total + modVal;
            const success = finalRoll >= targetVal;

            const outcome = success ? "SUCCESS" : "FAILURE";
            let calcStr = `${rollResult.total}`;
            if (modVal !== 0) calcStr += ` + ${modVal} (Mod)`;

            sysLogs.push(`🎲 **${outcome}**`);
            sysLogs.push(`Result: **${finalRoll}** (${calcStr}) >= **${targetVal}**`);

            // Damage on success
            if (success && target && (matchedRule.id.includes('atk') || matchedRule.name.includes('Attack'))) {
                let dmgDice = "1d4"; // Unarmed
                let weaponName = "Unarmed";

                if (subject.data?.rpg?.equipped?.main_hand) {
                    const armory = state.rpg?.items || [];
                    const wpn = armory.find(i => i.id === subject.data.rpg.equipped.main_hand);
                    if (wpn?.dmg || wpn?.effect) {
                        dmgDice = wpn.dmg || wpn.effect;
                        weaponName = wpn.name;
                    }
                }

                const dmgResult = this.rollDice(dmgDice);
                const dmgMod = this.getStat(subject, 'STRMod');
                const totalDmg = Math.max(1, dmgResult.total + dmgMod);

                if (!target.data.rpg) target.data.rpg = { hp: 10, maxHp: 10 };
                target.data.rpg.hp = Math.max(0, (target.data.rpg.hp || 0) - totalDmg);

                A.State.notify();
                sysLogs.push(`⚔️ **Damage**: ${totalDmg} (${dmgResult.total} + ${dmgMod}) [${weaponName}] -> ${target.name} (HP: ${target.data.rpg.hp})`);

                this.emit('damage', { source: subject, target, damage: totalDmg, weapon: weaponName });
                this.checkCombatEnd(sysLogs);
            }
        },

        // ===== HUD RENDERING =====
        /**
         * Render the compact HUD to context.system_notes
         */
        renderHUD: function (context, sysLogs) {
            const state = A.State.get();
            const hudLines = [];
            const actors = Object.values(state.nodes?.actors?.items || {});
            const party = actors.filter(a => a.data?.rpg?.enabled);

            if (state.rpg?.combat?.active) {
                hudLines.push(`**COMBAT ROUND ${state.rpg.combat.round}**`);
            }

            party.forEach(a => {
                const line = this.renderCompactHUD(a);
                if (line) hudLines.push(line);
            });

            if (hudLines.length > 0) {
                context.system_notes = (context.system_notes || "") + "\n--- RPG STATE ---\n" + hudLines.join('\n') + "\n-----------------";
            }
        },

        /**
         * Render a single actor's compact HUD line
         */
        renderCompactHUD: function (actor) {
            if (!actor?.data?.rpg) return "";
            const rpg = actor.data.rpg;
            const state = A.State.get();

            // Calculate effective AC
            let effAC = rpg.ac || 10;
            if (rpg.equipped) {
                const armory = state.rpg?.items || [];
                if (rpg.equipped.armor) {
                    const arm = armory.find(i => i.id === rpg.equipped.armor);
                    if (arm?.ac) effAC += parseInt(arm.ac);
                }
                if (rpg.equipped.off_hand) {
                    const off = armory.find(i => i.id === rpg.equipped.off_hand);
                    if (off?.type === 'armor' && off?.ac) effAC += parseInt(off.ac);
                }
            }

            let core = `HP: ${rpg.hp}/${rpg.maxHp} | AC: ${effAC}`;
            if (rpg.equipped) {
                if (rpg.equipped.main_hand) core += ` | Wpn: Main`;
                if (rpg.equipped.armor) core += ` | Arm: Worn`;
            }

            // Stats
            const statKeys = state.rpg?.stats || ['STR', 'DEX', 'INT'];
            const statStr = statKeys.map(k => {
                const val = this.getStat(actor, k);
                const mod = Math.floor((val - 10) / 2);
                return `${k}:${val}(${mod >= 0 ? '+' : ''}${mod})`;
            }).join(' ');

            let prefix = "";
            if (state.rpg?.combat?.active) {
                const c = state.rpg.combat;
                const entry = c.order.find(o => o.id === actor.id);
                if (entry) {
                    if (c.order[c.turn].id === actor.id) prefix = "⚔️ >";
                    else if (entry.acted) prefix = "💤 ";
                    else prefix = "⏳ ";
                }
            }

            if (rpg.type === 'monster') {
                prefix = "💀 " + prefix;
            }

            return `${prefix}[${actor.name}: Lvl ${rpg.level || 1} ${rpg.class || 'Unknown'}] ${core} | ${statStr}`;
        },

        // ===== LLM NARRATION =====
        /**
         * Generate narrative text for game events using LLM
         */
        narrateEvent: async function (event) {
            const state = this.ensureState();
            if (!state.rpg.narrationEnabled) return null;

            // Get active LLM config
            const config = A.UI?.getActiveLLMConfig?.();
            if (!config?.apiKey) {
                console.warn(LOG_PREFIX, 'No LLM config available for narration');
                return null;
            }

            // Build narrative prompt
            const prompt = this.buildNarrativePrompt(event);

            try {
                // Use A.API if available, otherwise fall back to direct call
                if (A.API?.chat) {
                    return await A.API.chat(config, prompt, event.context?.messages || []);
                }
                return null;
            } catch (err) {
                console.error(LOG_PREFIX, 'Narration failed:', err);
                return null;
            }
        },

        /**
         * Build a narrative prompt from game events
         */
        buildNarrativePrompt: function (event) {
            const lines = event.logs || [];
            return `You are a game narrator. Describe the following game events in vivid, engaging prose. Keep it brief (2-3 sentences max).\n\nEvents:\n${lines.join('\n')}`;
        }
    };

    // ===== EXPORT =====
    // ===== EXPORT =====
    A.RPGEngine = RPGEngine;

    // Also export to isolated RPG namespace if available
    if (window.RPG) {
        window.RPG.Engine = RPGEngine;
    }

    // Auto-initialize state on load
    RPGEngine.ensureState();

    console.log(LOG_PREFIX, 'RPG Engine v1.0 loaded', {
        anansi: !!A.RPGEngine,
        rpg: !!(window.RPG && window.RPG.Engine)
    });

})(window.Anansi);
