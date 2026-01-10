
// SYSTEM SCRIPT: RPG Mechanics v5.0 (Combat System)
// Managed by: Game Master Panel & Party Panel

const state = A.State.get();

// --- Configuration ---
const DEBUG = true;
const LOG_PREFIX = '[RPG Engine]';

// Ensure RPG State
if (!state.rpg) state.rpg = { enabled: true, stats: [], mechanics: 'd20', rulesets: {}, combat: null };
if (!state.rpg.enabled) return;

// ISOLATION: Only run in RPG Roleplay sessions, not global chat
if (context.source !== 'rpg_session') return;

const activeMech = state.rpg.mechanics || 'd20';
let rules = (state.rpg.rulesets && state.rpg.rulesets[activeMech]) ? state.rpg.rulesets[activeMech] : [];

// --- HELPER: Dice Roller ---
function rollDice(formula) {
    if (!formula) return { total: 0, str: "0" };
    if (!isNaN(formula)) return { total: parseInt(formula), str: formula };

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
                logStr.push(`${n}`);
            }
        }
    });

    return { total: grandTotal, str: logStr.join('+') };
}

// --- HELPER: Stat Resolver ---
function getStat(actor, key, type = 'score') {
    if (!actor || !key) return 0;

    // Normalize Key
    key = key.replace(/\+/g, '').replace('Mod', '').trim().toUpperCase();
    const isMod = (arguments[2] === 'mod') || (arguments[1] && arguments[1].toLowerCase && arguments[1].toLowerCase().includes('mod')); // Handle legacy calls or type param

    // SHIM: Resolve Data Source
    let statsObj = {};
    if (actor.data && actor.data.rpg && actor.data.rpg.stats) {
        statsObj = actor.data.rpg.stats;
    } else if (actor.stats) {
        statsObj = actor.stats;
    }

    // AC Handling
    if (key === 'AC') {
        if (actor.data && actor.data.rpg && actor.data.rpg.ac !== undefined) return parseInt(actor.data.rpg.ac);
        if (actor.ac !== undefined) return parseInt(actor.ac);
        return 10;
    }

    // Value Lookup
    let val = statsObj[key];

    // Fallback: Matrix (Legacy)
    if (val === undefined && actor.data && actor.data.rpg && actor.data.rpg.stats_matrix) {
        const blocks = Object.values(actor.data.rpg.stats_matrix.values || {});
        for (const block of blocks) {
            if (block[key] !== undefined) {
                val = parseInt(block[key]);
                break;
            }
        }
    }

    val = parseInt(val || 10);

    if (type === 'mod' || isMod) {
        return Math.floor((val - 10) / 2);
    }
    return val;
}

// --- HELPER: Entity Discovery ---
function findEntity(idOrName) {
    if (!idOrName) return null;
    const entities = Object.values(state.rpg?.entities || {});
    // Try by ID first
    let hit = entities.find(e => e.id === idOrName);
    // Then by name (case-insensitive)
    if (!hit) hit = entities.find(e => e.name?.toLowerCase() === idOrName.toLowerCase());
    if (!hit) hit = entities.find(e => e.name?.toLowerCase().includes(idOrName.toLowerCase()));
    return hit;
}

// --- ACTION ECONOMY ---
// Consume an action from the current combatant
// Returns true if action was available, false if not enough actions
// All action types consume from the same pool (actions + bonusActions combined)
function consumeAction(sysLogs) {
    if (!state.rpg.combat || !state.rpg.combat.active) return true; // No combat, allow free actions

    const c = state.rpg.combat;
    const currentCombatant = c.order[c.turn];

    if (!currentCombatant) return true;

    // Initialize if missing (combine main + bonus into single pool)
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

    // Check if all actions exhausted - auto-end turn
    // MOVED: We now handle this at the end of the action loop to prevent premature AI turns
    /*
    if (currentCombatant.actions <= 0) {
        sysLogs.push(`🔄 **${currentCombatant.name}** has used all actions. Turn ends automatically.`);
        nextTurn(sysLogs);
    }
    */

    return true;
}

// --- COMBAT SYSTEM ---
// Default actions per turn (main + bonus combined)
const DEFAULT_ACTIONS = 1;
const DEFAULT_BONUS_ACTIONS = 1; // Added to DEFAULT_ACTIONS for total

function startCombat(sysLogs) {
    // USE RPG ENTITIES (state.rpg.entities) - NOT Core Actors
    const entities = Object.values(state.rpg?.entities || {});

    if (entities.length === 0) {
        sysLogs.push("⚠️ No combatants found. Spawn monsters or add party members first.");
        return;
    }

    const order = entities.map(e => {
        const roll = rollDice('1d20');
        const dex = getStat(e, 'DEX', 'mod');
        // Entity structure: e.actions, e.bonusActions (direct properties)
        const mainActions = e.actions || DEFAULT_ACTIONS;
        const bonusActions = e.bonusActions || DEFAULT_BONUS_ACTIONS;
        const totalActions = mainActions + bonusActions;
        return {
            id: e.id,
            name: e.name,
            init: roll.total + dex,
            base: roll.total,
            mod: dex,
            acted: false,
            actions: totalActions,
            maxActions: totalActions
        };
    });

    // Sort Descending
    order.sort((a, b) => b.init - a.init);

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

    if (order.length === 0) {
        sysLogs.push("⚠️ No combatants in order!");
        return;
    }

    sysLogs.push(`**Round 1 Start**. It is **${order[0].name}**'s turn. (${order[0].actions} action${order[0].actions !== 1 ? 's' : ''} remaining)`);

    // Check Start AI (if first combatant is a monster)
    const firstEntity = entities.find(e => e.id === order[0].id);
    if (firstEntity && firstEntity.type === 'monster') {
        runAI(firstEntity, sysLogs);

        // Check if AI ended combat
        if (checkCombatEnd(sysLogs)) return;

        // Advance turn after AI acts
        nextTurn(sysLogs);
    }
}

function nextTurn(sysLogs) {
    if (!state.rpg.combat || !state.rpg.combat.active) {
        sysLogs.push("Combat is not active.");
        return;
    }

    const c = state.rpg.combat;
    c.order[c.turn].acted = true;
    c.turn++;

    if (c.turn >= c.order.length) {
        c.turn = 0;
        c.round++;
        c.order.forEach(o => {
            o.acted = false;
            // Reset actions for new round
            o.actions = o.maxActions || 2;
        });
        sysLogs.push(`**Round ${c.round} Start**`);
    }

    // Reset actions for new turn (in case they didn't use all)
    const currentCombatant = c.order[c.turn];
    currentCombatant.actions = currentCombatant.maxActions || 2;

    let nextActor = c.order[c.turn];

    // Buff Cleanup (Start of Turn)
    const actorEntity = findEntity(nextActor.id);
    if (actorEntity && actorEntity.buffs) {
        const initialCount = actorEntity.buffs.length;
        actorEntity.buffs = actorEntity.buffs.filter(b => !b.expiresNextTurn);
        if (actorEntity.buffs.length < initialCount) {
            sysLogs.push(`*(Buffs expired for ${nextActor.name})*`);
        }
    }

    sysLogs.push(`It is now **${nextActor.name}**'s turn. (${nextActor.actions} action${nextActor.actions !== 1 ? 's' : ''} remaining)`);

    // AI LOOP
    // We execute AI turns synchronously until we hit a Player or Max Steps
    let safety = 0;
    while (safety < 10) {
        // SAFETY CHECK: If combat ended mid-loop, stop immediately
        if (!state.rpg.combat || !state.rpg.combat.active) break;

        // Use findEntity (queries state.rpg.entities)
        const entity = findEntity(nextActor.id) || findEntity(nextActor.name);

        if (!entity) {
            sysLogs.push(`⚠️ Entity not found: ${nextActor.name}`);
            break;
        }

        // CHECK: Is Entity Alive?
        if ((entity.hp || 0) <= 0) {
            sysLogs.push(`Turn skipped: **${nextActor.name}** is 💀 Unconscious.`);
            // Auto-End Turn
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

        // CHECK: Is this a monster (AI-controlled)?
        if (entity.type === 'monster') {
            const mob = c.order[c.turn];

            // Loop until actions exhausted
            while (mob.actions > 0) {
                runAI(entity, sysLogs);
                mob.actions--;

                // Check if AI ended combat
                if (checkCombatEnd(sysLogs)) return;
            }

            // End Turn
            mob.acted = true;
            c.turn++;
            if (c.turn >= c.order.length) {
                c.turn = 0;
                c.round++;
                c.order.forEach(o => {
                    o.acted = false;
                    // Reset actions for new round
                    o.actions = o.maxActions;
                });
                sysLogs.push(`**Round ${c.round} Start**`);
            }

            // Ensure actions are fresh for the next actor (since we skipped the top-level reset)
            c.order[c.turn].actions = c.order[c.turn].maxActions;

            nextActor = c.order[c.turn]; // Update for next iteration

            // Buff Cleanup (AI Loop)
            const nextEntity = findEntity(nextActor.id);
            if (nextEntity && nextEntity.buffs) {
                nextEntity.buffs = nextEntity.buffs.filter(b => !b.expiresNextTurn);
            }

            sysLogs.push(`It is now **${nextActor.name}**'s turn.`);
            safety++;
        } else {
            break; // Player Turn
        }
    }
}

function runAI(entity, sysLogs) {
    // Entity structure: entity.hp, entity.type, entity.stats, etc.
    if ((entity.hp || 0) <= 0) return; // Dead entities don't act
    sysLogs.push(`*${entity.name} is thinking...*`);

    // Simple AI: 1. Find Target (Random non-monster)
    const entities = Object.values(state.rpg?.entities || {});
    const heroes = entities.filter(e => e.type !== 'monster' && (e.hp || 0) > 0);

    if (heroes.length === 0) {
        sysLogs.push(`${entity.name} roars in triumph! (No targets found)`);
        return;
    }

    const target = heroes[Math.floor(Math.random() * heroes.length)];

    // Ensure atk_melee rule exists for AI
    let attackRule = rules.find(r => r.id === 'atk_melee');
    if (!attackRule) {
        attackRule = { id: 'atk_melee', name: 'Melee Attack', roll: '1d20', mod: 'STR', target: 'AC', tmod: '0', op: '>=' };
        rules.unshift(attackRule);
    }

    sysLogs.push(`**${entity.name}** attacks **${target.name}**!`);

    // ROLL
    const rollResult = rollDice(attackRule.roll);
    const modVal = getStat(entity, 'STR', 'mod');

    // TARGET AC
    const targetAC = getStat(target, 'AC');
    let effTarget = targetAC;
    let vsStr = `vs ${effTarget} (AC)`;

    // Equipment Modifier (AC)
    const targetEquipped = target.equipped || (target.data && target.data.rpg && target.data.rpg.equipped) || {};
    let armorAC = 0;
    const armory = state.rpg.items || [];
    if (targetEquipped.armor) {
        const arm = armory.find(i => i.id === targetEquipped.armor);
        if (arm && arm.ac) armorAC += parseInt(arm.ac);
    }
    if (targetEquipped.off_hand) {
        const off = armory.find(i => i.id === targetEquipped.off_hand);
        if (off && off.type === 'armor' && off.ac) armorAC += parseInt(off.ac);
    }

    // Buff AC Bonus
    let buffAC = 0;
    if (target.buffs) {
        target.buffs.forEach(b => {
            if (b.acBonus) {
                const bonus = parseInt(b.acBonus);
                buffAC += bonus;
                vsStr += ` + ${bonus} (${b.name})`;
            }
        });
    }

    effTarget += armorAC + buffAC;
    if (armorAC > 0) vsStr += ` + ${armorAC} (Armor)`;

    const finalRoll = rollResult.total + modVal;
    const success = finalRoll >= effTarget;

    const outcome = success ? "SUCCESS" : "FAILURE";
    let calcStr = `${rollResult.total}`;
    if (rollResult.str !== `${rollResult.total}`) calcStr += ` (${rollResult.str})`;
    if (modVal !== 0) calcStr += ` ${modVal >= 0 ? '+' : '-'} ${Math.abs(modVal)} (Mod)`;

    sysLogs.push(`🎲 **${outcome}**`);
    sysLogs.push(`Result: **${finalRoll}** (${calcStr}) >= **${effTarget}** (${vsStr})`);

    if (success) {
        // DAMAGE - Check entity inventory for weapon
        let dmgDice = "1d4"; // Unarmed default
        let weaponName = "Natural";
        if (entity.inventory && entity.inventory.length > 0) {
            const wpn = entity.inventory.find(i => i.type === 'weapon');
            if (wpn && wpn.dmg) {
                dmgDice = wpn.dmg;
                weaponName = wpn.name;
            }
        }

        const dmgResult = rollDice(dmgDice);
        const dmgMod = getStat(entity, 'STR', 'mod');
        const totalDmg = Math.max(1, dmgResult.total + dmgMod);

        // Update target HP (entity structure)
        target.hp = Math.max(0, (target.hp || 0) - totalDmg);

        sysLogs.push(`⚔️ **Damage**: ${totalDmg} (${dmgResult.total} + ${dmgMod}) [${weaponName}] -> ${target.name} (HP: ${target.hp})`);
        A.State.notify();

        // Check Win Condition
        if (checkCombatEnd(sysLogs)) return;
    }
}

function checkCombatEnd(sysLogs) {
    if (!state.rpg.combat || !state.rpg.combat.active) return false;

    // Use RPG entities
    const entities = Object.values(state.rpg?.entities || {});
    const heroes = entities.filter(e => e.type !== 'monster');
    const monsters = entities.filter(e => e.type === 'monster');

    if (heroes.length === 0 && monsters.length === 0) return false;

    const allHeroesDown = heroes.length > 0 && heroes.every(h => (h.hp || 0) <= 0);
    const allMonstersDown = monsters.length > 0 && monsters.every(m => (m.hp || 0) <= 0);

    if (allHeroesDown || allMonstersDown) {
        sysLogs.push("");
        sysLogs.push("🛑 **COMBAT ENDED**");

        if (allMonstersDown) {
            sysLogs.push("**Monsters Defeated**");
            monsters.forEach(m => sysLogs.push(`- ${m.name}`));
        }

        if (allHeroesDown) {
            sysLogs.push("**Party Members Unconscious**");
            heroes.forEach(h => sysLogs.push(`- ${h.name}`));
        }

        endCombat(sysLogs);
        return true;
    }
    return false;
}

function endCombat(sysLogs) {
    state.rpg.combat = null;
    sysLogs.push("**Combat Ended.**");
}


// --- HELPER: HUD Formatter ---
function renderCompactHUD(actor) {
    if (!actor || !actor.data || !actor.data.rpg) return "";
    const rpg = actor.data.rpg;

    // Core (HP/AC)
    // Calculate Effective AC for Display
    let effAC = rpg.ac || 10;
    if (rpg.equipped) {
        const armory = state.rpg.items || [];
        if (rpg.equipped.armor) {
            const arm = armory.find(i => i.id === rpg.equipped.armor);
            if (arm && arm.ac) effAC += parseInt(arm.ac);
        }
        if (rpg.equipped.off_hand) {
            const off = armory.find(i => i.id === rpg.equipped.off_hand);
            if (off && off.type === 'armor' && off.ac) effAC += parseInt(off.ac);
        }
    }

    let core = `HP: ${rpg.hp}/${rpg.maxHp} | AC: ${effAC}`;
    if (rpg.equipped) {
        if (rpg.equipped.main_hand) core += ` | Wpn: Main`;
        if (rpg.equipped.armor) core += ` | Arm: Worn`;
    }

    // Stats
    const statKeys = state.rpg.stats || ['STR', 'DEX', 'INT'];
    const statStr = statKeys.map(k => {
        const val = getStat(actor, k);
        const mod = Math.floor((val - 10) / 2);
        return `${k}:${val}(${mod >= 0 ? '+' : ''}${mod})`;
    }).join(' ');

    let prefix = "";
    // Combat Status
    if (state.rpg.combat && state.rpg.combat.active) {
        const c = state.rpg.combat;
        const entry = c.order.find(o => o.id === actor.id);
        if (entry) {
            if (c.order[c.turn].id === actor.id) prefix = "⚔️ >"; // Active Turn
            else if (entry.acted) prefix = "💤 "; // Acted
            else prefix = "⏳ "; // Waiting
        }
    }

    // Enemy Flag
    if (rpg.type === 'monster') {
        prefix = "💀 " + prefix;
    }

    return `${prefix}[${actor.name}: Lvl ${rpg.level || 1} ${rpg.class || 'Unknown'}] ${core} | ${statStr}`;
}

// --- MAIN INPUT LOOP ---
if (context.phase === 'input') {
    const input = (context.user_input || "").toLowerCase();
    const sysLogs = []; // User-facing system logs

    // HELPER: Flush logs to context (MUST be called before any early return)
    const flushLogs = () => {
        if (sysLogs.length > 0) {
            context.system_notes = (context.system_notes || "") + "\n\n[RPG System]\n" + sysLogs.join('\n');
        }
    };

    // 1. COMBAT COMMANDS
    if (input.includes('start combat')) {
        startCombat(sysLogs);
    } else if (input.includes('end combat') || input.includes('stop combat')) {
        // FORCE END
        if (state.rpg && state.rpg.combat) {
            state.rpg.combat.active = false;
            state.rpg.combat = null;
            A.State.notify();
        }
        endCombat(sysLogs);
    } else if (input.includes('end turn') || input.includes('pass turn')) {
        nextTurn(sysLogs);
    } else {
        // 2. RULES ENGINE
        try {
            // Core rule IDs that must exist for combat to function
            const CORE_RULES = [
                { id: 'atk_melee', name: 'Melee Attack', roll: '1d20', mod: 'STR', target: 'AC', tmod: '0', op: '>=', category: 'combat', isCore: true },
                { id: 'atk_ranged', name: 'Ranged Attack', roll: '1d20', mod: 'DEX', target: 'AC', tmod: '0', op: '>=', category: 'combat', isCore: true },
                { id: 'atk_spell', name: 'Spell Attack', roll: '1d20', mod: 'INT', target: 'AC', tmod: '0', op: '>=', category: 'combat', isCore: true },
                { id: 'act_defend', name: 'Defend', roll: '', mod: '', target: '', tmod: '', op: '', category: 'combat', isCore: true, special: 'defend' },
                { id: 'act_flee', name: 'Flee', roll: '1d20', mod: 'DEX', target: '10', tmod: '0', op: '>=', category: 'combat', isCore: true, special: 'flee' },
                { id: 'act_use_item', name: 'Use Item', roll: '', mod: '', target: '', tmod: '', op: '', category: 'combat', isCore: true, special: 'item' },
                { id: 'act_use_ability', name: 'Use Ability', roll: '', mod: '', target: '', tmod: '', op: '', category: 'combat', isCore: true, special: 'ability' },
                { id: 'save_fortitude', name: 'Fortitude Save', roll: '1d20', mod: 'CON', target: '15', tmod: '0', op: '>=', category: 'save', isCore: true },
                { id: 'save_reflex', name: 'Reflex Save', roll: '1d20', mod: 'DEX', target: '15', tmod: '0', op: '>=', category: 'save', isCore: true },
                { id: 'save_will', name: 'Will Save', roll: '1d20', mod: 'WIS', target: '15', tmod: '0', op: '>=', category: 'save', isCore: true },
                { id: 'chk_skill', name: 'Skill Check', roll: '1d20', mod: 'INT', target: '10', tmod: '0', op: '>=', category: 'skill' }
            ];

            // Ensure rules exist
            if (!rules || rules.length === 0) {
                if (!state.rpg.rulesets) state.rpg.rulesets = {};
                if (!state.rpg.rulesets[activeMech]) {
                    state.rpg.rulesets[activeMech] = JSON.parse(JSON.stringify(CORE_RULES));
                    sysLogs.push("Initialized Default Rules (D20)");
                }
                rules = state.rpg.rulesets[activeMech];
            }

            // Ensure core rules exist and are up-to-date
            CORE_RULES.filter(cr => cr.isCore).forEach(coreRule => {
                const existingIndex = rules.findIndex(r => r.id === coreRule.id);
                if (existingIndex === -1) {
                    rules.unshift(JSON.parse(JSON.stringify(coreRule)));
                } else {
                    // Force update core mechanic definitions to ensure system stability
                    rules[existingIndex] = JSON.parse(JSON.stringify(coreRule));
                }
            });

            const matchedRule = rules.find(r => r.name && input.includes(r.name.toLowerCase()));

            if (matchedRule) {
                // Identify Subject - use RPG entities only
                let subject = null;
                let allowed = true;

                // In COMBAT: Subject is ALWAYS the active combatant (strict turn order)
                if (state.rpg.combat && state.rpg.combat.active) {
                    const c = state.rpg.combat;
                    if (c.order && c.order[c.turn]) {
                        const activeId = c.order[c.turn].id;
                        subject = findEntity(activeId);

                        // DEBUG: If subject not found, log the issue
                        if (!subject) {
                            sysLogs.push(`⚠️ DEBUG: Active combatant ID "${activeId}" not found in entities.`);
                            sysLogs.push(`Available entity IDs: ${Object.keys(state.rpg?.entities || {}).join(', ')}`);
                        }
                    }
                }

                // Outside combat (or if combat subject not found): Use first party member
                if (!subject) {
                    const entities = Object.values(state.rpg?.entities || {});
                    subject = entities.find(e => e.type === 'party_member') || entities.find(e => e.type !== 'monster');
                    if (!subject && entities.length > 0) subject = entities[0];
                }

                // TURN ENFORCEMENT - Block if subject is a monster (AI-controlled)
                if (state.rpg.combat && state.rpg.combat.active && subject && subject.type === 'monster') {
                    sysLogs.push(`⚠️ **${subject.name}** is AI-controlled. Wait for their action.`);
                    allowed = false;
                }

                // VALIDATE: Subject is Alive
                if (allowed && subject && (subject.hp || 0) <= 0) {
                    sysLogs.push(`🚫 **${subject.name}** is unconscious and cannot act!`);
                    allowed = false;
                }

                if (allowed && subject) {
                    // Identify Target - use RPG entities only
                    let target = null;
                    const entities = Object.values(state.rpg?.entities || {});

                    // Priority 1: Named in Input
                    target = entities.find(e => input.includes(e.name.toLowerCase()) && e.id !== subject.id);

                    // Priority 2: Auto-Target in Combat (First Living Hostile)
                    if (!target && state.rpg.combat && state.rpg.combat.active) {
                        const isSubjectMonster = subject.type === 'monster';

                        if (isSubjectMonster) {
                            target = entities.find(e => e.type !== 'monster' && (e.hp || 0) > 0 && e.id !== subject.id);
                        } else {
                            target = entities.find(e => e.type === 'monster' && (e.hp || 0) > 0 && e.id !== subject.id);
                        }

                        if (target) {
                            sysLogs.push(`*(Auto-targeting **${target.name}**)*`);
                        }
                    }

                    if (subject) {
                        // === CHECK ACTION AVAILABILITY ===
                        // Consume action first - if none available, action is blocked
                        if (!consumeAction(sysLogs)) {
                            flushLogs(); return; // No actions remaining
                        }

                        sysLogs.push(`**${subject.name}** triggers **${matchedRule.name}**`);

                        // ===== SPECIAL ACTIONS (No Roll Required) =====
                        if (matchedRule.special === 'defend') {
                            // Defend: Grant AC bonus until next turn
                            if (!subject.buffs) subject.buffs = [];
                            subject.buffs.push({
                                type: 'defend',
                                name: 'Defending',
                                acBonus: 2,
                                expiresNextTurn: true
                            });
                            sysLogs.push(`🛡️ **${subject.name}** takes a defensive stance! (+2 AC until next turn)`);
                            A.State.notify();

                            // Auto-End Turn Check
                            if (state.rpg.combat && state.rpg.combat.active) {
                                const currentCombatant = state.rpg.combat.order[state.rpg.combat.turn];
                                if (currentCombatant && currentCombatant.actions <= 0) {
                                    sysLogs.push(`🔄 **${subject.name}** has used all actions. Turn ends automatically.`);
                                    nextTurn(sysLogs);
                                }
                            }
                            flushLogs(); return;
                        }

                        if (matchedRule.special === 'flee') {
                            // Flee: Roll DEX check to escape
                            const fleeRoll = rollDice(matchedRule.roll || '1d20');
                            const dexMod = getStat(subject, 'DEXMod');
                            const dc = parseInt(matchedRule.target) || 10;
                            const total = fleeRoll.total + dexMod;
                            const success = total >= dc;

                            sysLogs.push(`🎲 Flee attempt: **${total}** (${fleeRoll.total} + ${dexMod}) vs DC ${dc}`);

                            if (success) {
                                sysLogs.push(`🏃 **${subject.name}** successfully escapes!`);
                                endCombat(sysLogs);
                            } else {
                                sysLogs.push(`❌ **${subject.name}** failed to escape!`);
                            }

                            // Auto-End Turn Check
                            if (state.rpg.combat && state.rpg.combat.active) {
                                const currentCombatant = state.rpg.combat.order[state.rpg.combat.turn];
                                if (currentCombatant && currentCombatant.actions <= 0) {
                                    sysLogs.push(`🔄 **${subject.name}** has used all actions. Turn ends automatically.`);
                                    nextTurn(sysLogs);
                                }
                            }
                            flushLogs(); return;
                        }

                        if (matchedRule.special === 'item') {
                            // Use Item: Extract item name from input
                            const itemName = input.replace(/\[.*?\]/g, '').replace(/use item/i, '').trim();
                            sysLogs.push(`🎒 **${subject.name}** uses **${itemName}**`);

                            // Try to find the item and apply effects
                            const armory = state.rpg.items || [];
                            const item = armory.find(i => itemName.toLowerCase().includes(i.name.toLowerCase()));

                            if (item && item.effect) {
                                if (item.effect.includes('d')) {
                                    // Healing item
                                    const healRoll = rollDice(item.effect);
                                    const heal = healRoll.total;
                                    const maxHp = subject.maxHp || 20;
                                    subject.hp = Math.min(maxHp, (subject.hp || 0) + heal);
                                    sysLogs.push(`💚 Healed **${heal}** HP (${healRoll.str}) → HP: ${subject.hp}/${maxHp}`);
                                } else {
                                    sysLogs.push(`✨ Effect: ${item.effect}`);
                                }
                            } else {
                                sysLogs.push(`*(Item effect not defined - describe the result)*`);
                            }

                            A.State.notify();

                            // Auto-End Turn Check
                            if (state.rpg.combat && state.rpg.combat.active) {
                                const currentCombatant = state.rpg.combat.order[state.rpg.combat.turn];
                                if (currentCombatant && currentCombatant.actions <= 0) {
                                    sysLogs.push(`🔄 **${subject.name}** has used all actions. Turn ends automatically.`);
                                    nextTurn(sysLogs);
                                }
                            }
                            flushLogs(); return;
                        }

                        if (matchedRule.special === 'ability') {
                            // Use Ability: Extract ability name from input
                            const abilityText = input.replace(/\[.*?\]/g, '').replace(/use ability/i, '').trim();
                            sysLogs.push(`✨ **${subject.name}** uses **${abilityText}**`);

                            // Try to find the ability feat
                            const featDb = state.rpg.featDatabase || [];
                            const feat = featDb.find(f => abilityText.toLowerCase().includes(f.name.toLowerCase()));

                            if (feat) {
                                // Check MP cost
                                if (feat.activation?.cost) {
                                    const cost = parseInt(feat.activation.cost);
                                    const costType = feat.activation.costType || 'MP';
                                    const current = subject[costType.toLowerCase()] || subject.mp || 0;

                                    if (current < cost) {
                                        sysLogs.push(`❌ Not enough ${costType}! (Have: ${current}, Need: ${cost})`);
                                        flushLogs(); return;
                                    }

                                    subject[costType.toLowerCase()] = current - cost;
                                    sysLogs.push(`💨 Spent ${cost} ${costType}`);
                                }

                                // Apply effect
                                if (feat.effect && feat.effect.includes('d')) {
                                    const effectRoll = rollDice(feat.effect);
                                    sysLogs.push(`🎲 Effect: **${effectRoll.total}** (${effectRoll.str}) ${feat.effectType || ''}`);

                                    // If damaging, apply to target
                                    if (target && (feat.effectType?.includes('damage') || feat.target === 'enemy' || feat.target === 'all_enemies')) {
                                        target.hp = Math.max(0, (target.hp || 0) - effectRoll.total);
                                        sysLogs.push(`⚔️ **${target.name}** takes **${effectRoll.total}** damage! (HP: ${target.hp})`);
                                    }
                                    // If healing
                                    else if (feat.effectType?.includes('heal')) {
                                        const maxHp = subject.maxHp || 20;
                                        subject.hp = Math.min(maxHp, (subject.hp || 0) + effectRoll.total);
                                        sysLogs.push(`💚 **${subject.name}** heals **${effectRoll.total}** HP! (HP: ${subject.hp}/${maxHp})`);
                                    }
                                }

                                sysLogs.push(`*${feat.description || ''}*`);
                            } else {
                                sysLogs.push(`*(Ability not found in database - describe the result)*`);
                            }

                            A.State.notify();

                            // Auto-End Turn Check
                            if (state.rpg.combat && state.rpg.combat.active) {
                                const currentCombatant = state.rpg.combat.order[state.rpg.combat.turn];
                                if (currentCombatant && currentCombatant.actions <= 0) {
                                    sysLogs.push(`🔄 **${subject.name}** has used all actions. Turn ends automatically.`);
                                    nextTurn(sysLogs);
                                }
                            }
                            flushLogs(); return;
                        }

                        // ===== STANDARD ROLL LOGIC =====
                        // ROLL
                        const rollResult = rollDice(matchedRule.roll);
                        const modVal = getStat(subject, matchedRule.mod + 'Mod'); // e.g. STR -> STRMod for derived modifier

                        // TARGET
                        let targetVal = 0;
                        let tModVal = 0;
                        if (!isNaN(parseInt(matchedRule.target))) {
                            targetVal = parseInt(matchedRule.target);
                        } else if (target) {
                            targetVal = getStat(target, matchedRule.target);

                            // FIX: Check if tmod is numeric before calling getStat (which defaults to 10 for '0')
                            if (matchedRule.tmod && !isNaN(parseInt(matchedRule.tmod))) {
                                tModVal = parseInt(matchedRule.tmod);
                            } else {
                                tModVal = getStat(target, matchedRule.tmod);
                            }
                        }

                        // CALC
                        const finalTarget = targetVal + tModVal;

                        let vsStr = `vs ${finalTarget}`;
                        if (tModVal !== 0) vsStr += ` (${targetVal} ${tModVal >= 0 ? '+' : '-'} ${Math.abs(tModVal)})`;

                        // Equipment Modification (AC)
                        // Equipment Modification (AC)
                        let effTarget = finalTarget;
                        if (matchedRule.target === 'AC' && target) {
                            const targetEquipped = target.equipped || (target.data && target.data.rpg && target.data.rpg.equipped) || {};
                            let armorAC = 0;
                            const armory = state.rpg.items || [];
                            if (targetEquipped.armor) {
                                const arm = armory.find(i => i.id === targetEquipped.armor);
                                if (arm && arm.ac) armorAC += parseInt(arm.ac);
                            }
                            if (targetEquipped.off_hand) {
                                const off = armory.find(i => i.id === targetEquipped.off_hand);
                                if (off && off.type === 'armor' && off.ac) armorAC += parseInt(off.ac);
                            }

                            // Buff AC Bonus
                            let buffAC = 0;
                            if (target.buffs) {
                                target.buffs.forEach(b => {
                                    if (b.acBonus) {
                                        const bonus = parseInt(b.acBonus);
                                        buffAC += bonus;
                                        vsStr += ` + ${bonus} (${b.name})`;
                                    }
                                });
                            }

                            effTarget += armorAC + buffAC;
                            if (armorAC > 0) vsStr += ` + ${armorAC} (Armor)`;
                        }

                        const finalRoll = rollResult.total + modVal;

                        // CHECK SUCCESS
                        let success = false;
                        const op = matchedRule.op || '>=';
                        if (op === '>=') success = finalRoll >= effTarget;
                        else if (op === '>') success = finalRoll > effTarget;
                        else if (op === '<=') success = finalRoll <= effTarget;
                        else if (op === '<') success = finalRoll < effTarget;
                        else if (op === '==') success = finalRoll === effTarget;

                        // LOG
                        let calcStr = `${rollResult.total}`;
                        if (rollResult.str !== `${rollResult.total}`) calcStr += ` (${rollResult.str})`;
                        if (modVal !== 0) calcStr += ` ${modVal >= 0 ? '+' : '-'} ${Math.abs(modVal)} (Mod)`;

                        const outcome = success ? "SUCCESS" : "FAILURE";
                        sysLogs.push(`🎲 **${outcome}**`);
                        sysLogs.push(`Result: **${finalRoll}** (${calcStr}) ${op} **${effTarget}** (${vsStr})`);

                        // DAMAGE LOGIC
                        if (success && target && (matchedRule.id.includes('atk') || matchedRule.name.includes('Attack'))) {
                            let dmgDice = "1d4"; // Unarmed
                            let weaponName = "Unarmed";

                            // Equipment Shim
                            const getEquipped = (a) => {
                                if (a.data && a.data.rpg && a.data.rpg.equipped) return a.data.rpg.equipped;
                                if (a.equipped) return a.equipped;
                                // Fallback for monsters: Check first weapon in inventory
                                if (a.inventory && a.inventory.length > 0) {
                                    const wpn = a.inventory.find(i => i.type === 'weapon');
                                    if (wpn) return { main_hand: wpn.id || wpn.name, _obj: wpn };
                                }
                                return {};
                            };

                            const equipped = getEquipped(subject);
                            if (equipped.main_hand) {
                                const armory = state.rpg.items || [];
                                let wpn = armory.find(i => i.id === equipped.main_hand);

                                // Monster Shim: if wpn not in DB, check local obj (from getEquipped fallback)
                                if (!wpn && equipped._obj) wpn = equipped._obj;

                                if (wpn && (wpn.dmg || wpn.effect)) {
                                    dmgDice = wpn.dmg || wpn.effect;
                                    weaponName = wpn.name;
                                }
                            }

                            const dmgResult = rollDice(dmgDice);
                            const dmgMod = getStat(subject, 'STR', 'mod');
                            const totalDmg = Math.max(1, dmgResult.total + dmgMod);

                            // HP Update Shim
                            // Core: target.data.rpg.hp
                            // Entity: target.hp
                            let currentHp = 0;
                            if (target.data && target.data.rpg) {
                                currentHp = target.data.rpg.hp || 0;
                                target.data.rpg.hp = Math.max(0, currentHp - totalDmg);
                            } else {
                                currentHp = target.hp || 0;
                                target.hp = Math.max(0, currentHp - totalDmg);
                            }

                            // NOTIFY STATE UPDATE
                            A.State.notify();

                            const targetHp = (target.data && target.data.rpg) ? target.data.rpg.hp : target.hp;
                            sysLogs.push(`⚔️ **Damage**: ${totalDmg} (${dmgResult.total} + ${dmgMod}) [${weaponName}] -> ${target.name} (HP: ${targetHp})`);

                            // Check Win Condition
                            // Check Win Condition
                            checkCombatEnd(sysLogs);

                            // Auto-End Turn Check moved outside success block
                        }

                        // Auto-End Turn if actions exhausted AND combat still active
                        if (state.rpg.combat && state.rpg.combat.active) {
                            const currentCombatant = state.rpg.combat.order[state.rpg.combat.turn];
                            if (currentCombatant && currentCombatant.actions <= 0) {
                                sysLogs.push(`🔄 **${subject.name}** has used all actions. Turn ends automatically.`);
                                nextTurn(sysLogs);
                            }
                        }
                    }
                }
            }
        } catch (err) {
            sysLogs.push(`⚠️ **COMBAT ERROR**: ${err.message}`);
            console.error('[RPG Rules Engine]', err);
        }
    }

    // INJECTION: HUD
    // (Render AFTER logic to catch updates)
    // DISABLED: Preventing legacy injection into Roleplay Tab
    /*
    const hudLines = [];
    const actors = Object.values(state.nodes.actors.items || {});
    const party = actors.filter(a => a.data && a.data.rpg && a.data.rpg.enabled);
    if (state.rpg.combat && state.rpg.combat.active) {
        hudLines.push(`**COMBAT ROUND ${state.rpg.combat.round}**`);
    }
    party.forEach(a => hudLines.push(renderCompactHUD(a)));
    if (hudLines.length > 0) {
        context.system_notes = (context.system_notes || "") + "\n--- RPG STATE ---\n" + hudLines.join('\n') + "\n-----------------";
    }
    */

    // Flush to Context (RESTORED: We need to see rolls/results!)
    flushLogs();
}
