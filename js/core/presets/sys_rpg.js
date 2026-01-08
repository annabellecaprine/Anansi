
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
function getStat(actor, key) {
    if (!actor || !key) return 0;
    key = key.replace(/\+/g, '').replace('Mod', '').trim().toUpperCase();
    const isMod = arguments[1] && arguments[1].toLowerCase().includes('mod');

    const rpgData = actor.data.rpg || {};
    // 1. Core
    if (rpgData[key.toLowerCase()] !== undefined) return parseInt(rpgData[key.toLowerCase()] || 0);

    // 2. Matrix
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

    // 3. Mod Calc
    if (val !== null) {
        if (isMod) return Math.floor((val - 10) / 2);
        return val;
    }
    return 0;
}

// --- HELPER: Actor Discovery ---
function findActor(name) {
    if (!name) return null;
    const actors = Object.values(state.nodes.actors.items || {});
    let hit = actors.find(a => a.name.toLowerCase() === name.toLowerCase());
    if (!hit) hit = actors.find(a => a.name.toLowerCase().includes(name.toLowerCase()));
    return hit;
}

// --- COMBAT SYSTEM ---
function startCombat(sysLogs) {
    const actors = Object.values(state.nodes.actors.items || {});
    // Filter for Party + any other actors (e.g. Monsters)
    // For now, include everyone who has RPG data enabled
    const combatants = actors.filter(a => a.data && a.data.rpg && a.data.rpg.enabled);

    const order = combatants.map(a => {
        const roll = rollDice('1d20');
        const dex = getStat(a, 'DEX', 'mod');
        return {
            id: a.id,
            name: a.name,
            init: roll.total + dex,
            base: roll.total,
            mod: dex,
            acted: false
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
        sysLogs.push(`> ${c.name}: ${c.init} (${c.base} + ${c.mod})`);
    });
    sysLogs.push(`**Round 1 Start**. It is **${order[0].name}**'s turn.`);

    // Check Start AI
    const firstActor = findActor(order[0].name);
    if (firstActor && firstActor.data.rpg.type === 'monster') {
        const c = state.rpg.combat;

        // We need to execute the AI loop logic similar to nextTurn, but starting at index 0.
        // To avoid code duplication, nextTurn should be refactored, but for minimal diff:
        runAI(firstActor, sysLogs);

        // Check if AI ended combat
        if (checkCombatEnd(sysLogs)) return;

        // Auto-Advancement logic if AI acted
        // But wait, startCombat sets turn=0. 
        // If runAI success, we need to advance to turn 1.

        // If we wrapped immediately (1 monster combat?), loop logic ensures nextTurn handles it.
        // Calling nextTurn() now triggers the *next* guy.
        nextTurn(sysLogs);
    }
}

function nextTurn(sysLogs) {
    if (!state.rpg.combat || !state.rpg.combat.active) {
        sysLogs.push("Combats is not active.");
        return;
    }

    const c = state.rpg.combat;
    c.order[c.turn].acted = true;
    c.turn++;

    if (c.turn >= c.order.length) {
        c.turn = 0;
        c.round++;
        c.order.forEach(o => o.acted = false);
        sysLogs.push(`**Round ${c.round} Start**`);
    }

    let nextActor = c.order[c.turn];
    sysLogs.push(`It is now **${nextActor.name}**'s turn.`);

    // AI LOOP
    // We execute AI turns synchronously until we hit a Player or Max Steps
    let safety = 0;
    while (safety < 10) {

        const actorObj = findActor(nextActor.name);

        // CHECK: Is Actor Alive?
        if ((actorObj.data.rpg.hp || 0) <= 0) {
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

        if (actorObj && actorObj.data && actorObj.data.rpg && actorObj.data.rpg.type === 'monster') {
            runAI(actorObj, sysLogs);

            // Check if AI ended combat
            if (checkCombatEnd(sysLogs)) return;

            // Auto-End Turn
            c.order[c.turn].acted = true;
            c.turn++;
            if (c.turn >= c.order.length) {
                c.turn = 0;
                c.round++;
                c.order.forEach(o => o.acted = false);
                sysLogs.push(`**Round ${c.round} Start**`);
            }

            nextActor = c.order[c.turn]; // Update for next iteration
            sysLogs.push(`It is now **${nextActor.name}**'s turn.`);
            safety++;
        } else {
            break; // Player Turn
        }
    }
}

function runAI(actor, sysLogs) {
    if ((actor.data.rpg.hp || 0) <= 0) return; // Dead monsters don't act
    sysLogs.push(`*${actor.name} is thinking...*`);

    // Simple AI: 1. Find Target (Random Hero)
    const actors = Object.values(state.nodes.actors.items || {});
    const heroes = actors.filter(a => a.data && a.data.rpg && a.data.rpg.enabled && a.data.rpg.type !== 'monster');

    if (heroes.length === 0) {
        sysLogs.push(`${actor.name} roars in triumph! (No targets found)`);
        return;
    }

    const target = heroes[Math.floor(Math.random() * heroes.length)];

    // 2. Attack (Simulate Input)
    // We can't easily "simulate input" recursively safely, so we'll just execute the logic directly or 
    // construct a synthetic rule match.
    // For MVP, let's just use the logging and rolling helpers directly.

    const attackRule = rules.find(r => r.id === 'atk_melee') || rules[0];

    sysLogs.push(`**${actor.name}** attacks **${target.name}**!`);

    // ROLL
    const rollResult = rollDice(attackRule.roll);
    const modVal = getStat(actor, attackRule.mod);

    // TARGET
    const targetVal = getStat(target, attackRule.target); // AC
    const tModVal = getStat(target, attackRule.tmod);

    // Equipment AC Check (Target)
    let effTarget = targetVal + tModVal;
    // ... (Reuse equipment logic or refactor helper? For MVP, duplicate lightly or ignore advanced AC for now? 
    // No, let's copy the light logic for correctness)
    let vsStr = `vs ${effTarget}`;

    if (attackRule.target === 'AC' && target.data.rpg && target.data.rpg.equipped) {
        let armorAC = 0;
        const armory = state.rpg.items || [];
        if (target.data.rpg.equipped.armor) {
            const arm = armory.find(i => i.id === target.data.rpg.equipped.armor);
            if (arm && arm.ac) armorAC += parseInt(arm.ac);
        }
        if (target.data.rpg.equipped.off_hand) {
            const off = armory.find(i => i.id === target.data.rpg.equipped.off_hand);
            if (off && off.type === 'armor' && off.ac) armorAC += parseInt(off.ac);
        }
        effTarget += armorAC;
        if (armorAC !== 0) vsStr += ` + ${armorAC} (Armor)`;
    }

    const finalRoll = rollResult.total + modVal;
    const success = finalRoll >= effTarget;

    const outcome = success ? "SUCCESS" : "FAILURE";
    let calcStr = `${rollResult.total}`;
    if (rollResult.str !== `${rollResult.total}`) calcStr += ` (${rollResult.str})`;
    if (modVal !== 0) calcStr += ` ${modVal >= 0 ? '+' : '-'} ${Math.abs(modVal)} (Mod)`;

    sysLogs.push(`🎲 **${outcome}**`);
    sysLogs.push(`Result: **${finalRoll}** (${calcStr}) >= **${effTarget}** (${vsStr})`);

    if (success) {
        // DAMAGE
        // Monsters usually have fixed damage or "equipped" natural weapons.
        // For MVP: 1d6 + Str
        const dmgDice = "1d6";
        const dmgResult = rollDice(dmgDice);
        const dmgMod = getStat(actor, 'STR', 'mod');
        const totalDmg = Math.max(1, dmgResult.total + dmgMod);

        if (!target.data.rpg) target.data.rpg = { hp: 10, maxHp: 10 };
        target.data.rpg.hp = Math.max(0, (target.data.rpg.hp || 0) - totalDmg);

        sysLogs.push(`⚔️ **Damage**: ${totalDmg} (${dmgResult.total} + ${dmgMod}) [Natural] -> ${target.name} (HP: ${target.data.rpg.hp})`);
        A.State.notify();
        sysLogs.push(`⚔️ **Damage**: ${totalDmg} (${dmgResult.total} + ${dmgMod}) [Natural] -> ${target.name} (HP: ${target.data.rpg.hp})`);
        A.State.notify();

        // Check Win Condition
        if (checkCombatEnd(sysLogs)) return;
    }

    // 3. End Turn (Async to let user see log)
    // In a synchronous script, we can't really "wait". 
    // But we can just chain the logic.
    // However, to avoid stack overflow in auto-battles, ideally we'd setTimeout.
    // Since sys_rpg runs in the main thread (managed by Scripts), we can't easily setTimeout back into the engine context 
    // unless we expose a "callback" command.
    // For now, let's just End Turn immediately in the same tick.

    // RECURSION DANGER: If everyone is a monster, this loops forever until stack crash.
    // LIMIT: One AI move per trigger? 
    // User wants "Pass Turn should trigger NPC turns automatically".
    // So if I manually end turn, AI acts, then AI ends turn... 
    // IF next is also AI, it should trigger too.

    // Safe Approach: Use a global or state flag to prevent infinite instant loops?
    // Or just let it run for X iterations.

    // For V1 MVP: Just let it run *one* step. The User might have to click "Pass" if multiple monsters?
    // No, `nextTurn` calls `runAI` which calls `nextTurn`.
    // We need a break. 

    // HACK: We can't do async waits here easily without breaking the data flow (context.system_notes might get lost).
    // So we will just run the logic and say "Turn Ends".

    // Instead of calling nextTurn() recursively, we can just mutate state state to advance turn?
    // Let's rely on the user seeing the log.

    // ACTUALLY: The best way is to validly allow `state.rpg.combat.turn` to advance here.

    // Let's try forcing a recursion limit.
}

function checkCombatEnd(sysLogs) {
    if (!state.rpg.combat || !state.rpg.combat.active) return false;

    const actors = Object.values(state.nodes.actors.items || {}).filter(a => a.data && a.data.rpg && a.data.rpg.enabled);
    const heroes = actors.filter(a => a.data.rpg.type !== 'monster');
    const monsters = actors.filter(a => a.data.rpg.type === 'monster');

    if (heroes.length === 0 && monsters.length === 0) return false;

    const allHeroesDown = heroes.length > 0 && heroes.every(h => (h.data.rpg.hp || 0) <= 0);
    const allMonstersDown = monsters.length > 0 && monsters.every(m => (m.data.rpg.hp || 0) <= 0);

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

    // 1. COMBAT COMMANDS
    if (input.includes('start combat')) {
        startCombat(sysLogs);
    } else if (input.includes('end combat') || input.includes('stop combat')) {
        endCombat(sysLogs);
    } else if (input.includes('end turn') || input.includes('pass turn')) {
        nextTurn(sysLogs);
    } else {
        // 2. RULES ENGINE
        if (!rules || rules.length === 0) {
            if (!state.rpg.rulesets) state.rpg.rulesets = {};
            if (!state.rpg.rulesets[activeMech]) {
                state.rpg.rulesets[activeMech] = [
                    { id: 'atk_melee', name: 'Melee Attack', roll: '1d20', mod: 'STR', target: 'AC', tmod: '0', op: '>=' },
                    { id: 'atk_range', name: 'Ranged Attack', roll: '1d20', mod: 'DEX', target: 'AC', tmod: '0', op: '>=' },
                    { id: 'chk_skill', name: 'Skill Check', roll: '1d20', mod: 'INT', target: '10', tmod: '0', op: '>=' }
                ];
                rules = state.rpg.rulesets[activeMech];
                sysLogs.push("Initialized Default Rules (D20)");
            }
        }

        const matchedRule = rules.find(r => r.name && input.includes(r.name.toLowerCase()));

        if (matchedRule) {
            // Identify Subject
            let subject = null;

            // Priority 1: Named in Input
            const potentialSubjects = Object.values(state.nodes.actors.items || {}).filter(a => input.includes(a.name.toLowerCase()));
            if (potentialSubjects.length > 0) subject = potentialSubjects[0];

            // Priority 2: Active Combatant (Smart Context)
            if (!subject && state.rpg.combat && state.rpg.combat.active) {
                const c = state.rpg.combat;
                if (c.order && c.order[c.turn]) {
                    const activeId = c.order[c.turn].id;
                    subject = state.nodes.actors.items[activeId] || findActor(c.order[c.turn].name);
                }
            }

            // Priority 3: Default Hero
            if (!subject) {
                subject = findActor("Hero") || findActor("Player") || Object.values(state.nodes.actors.items || {})[0];
            }

            // TURN ENFORCEMENT
            let allowed = true;
            if (state.rpg.combat && state.rpg.combat.active) {
                const c = state.rpg.combat;
                const activeActor = c.order[c.turn];
                if (activeActor && subject.id !== activeActor.id) {
                    sysLogs.push(`⚠️ **Use Caution**: It is **${activeActor.name}**'s turn, not ${subject.name}'s.`);
                    // allowed = false; // SOFT Warning for now
                }
            }


            if (allowed) {
                // VALIDATE: Subject is Alive
                if ((subject.data.rpg.hp || 0) <= 0) {
                    sysLogs.push(`🚫 **${subject.name}** is unconscious and cannot act!`);
                    allowed = false;
                }
            }

            if (allowed) {
                // Identify Target
                let target = null;
                const potentialTargets = Object.values(state.nodes.actors.items || {});

                // Priority 1: Named in Input
                target = potentialTargets.find(a => input.includes(a.name.toLowerCase()) && a.id !== (subject ? subject.id : null));

                // Priority 2: Auto-Target in Combat (First Living Hostile)
                if (!target && state.rpg.combat && state.rpg.combat.active && subject) {
                    const isSubjectMonster = subject.data && subject.data.rpg && subject.data.rpg.type === 'monster';

                    if (isSubjectMonster) {
                        // Monster targets a living hero
                        target = potentialTargets.find(a =>
                            a.data && a.data.rpg && a.data.rpg.enabled &&
                            a.data.rpg.type !== 'monster' &&
                            (a.data.rpg.hp || 0) > 0 &&
                            a.id !== subject.id
                        );
                    } else {
                        // Hero targets a living monster
                        target = potentialTargets.find(a =>
                            a.data && a.data.rpg && a.data.rpg.enabled &&
                            a.data.rpg.type === 'monster' &&
                            (a.data.rpg.hp || 0) > 0 &&
                            a.id !== subject.id
                        );
                    }

                    if (target) {
                        sysLogs.push(`*(Auto-targeting **${target.name}**)*`);
                    }
                }

                if (subject) {
                    sysLogs.push(`**${subject.name}** triggers **${matchedRule.name}**`);

                    // ROLL
                    const rollResult = rollDice(matchedRule.roll);
                    const modVal = getStat(subject, matchedRule.mod); // e.g. STR mod

                    // TARGET
                    let targetVal = 0;
                    let tModVal = 0;
                    if (!isNaN(parseInt(matchedRule.target))) {
                        targetVal = parseInt(matchedRule.target);
                    } else if (target) {
                        targetVal = getStat(target, matchedRule.target);
                        tModVal = getStat(target, matchedRule.tmod);
                    }

                    // CALC
                    const finalTarget = targetVal + tModVal;

                    let vsStr = `vs ${finalTarget}`;
                    if (tModVal !== 0) vsStr += ` (${targetVal} ${tModVal >= 0 ? '+' : '-'} ${Math.abs(tModVal)})`;

                    // Equipment Modification (AC)
                    let effTarget = finalTarget;
                    if (matchedRule.target === 'AC' && target && target.data.rpg && target.data.rpg.equipped) {
                        let armorAC = 0;
                        const armory = state.rpg.items || [];
                        if (target.data.rpg.equipped.armor) {
                            const arm = armory.find(i => i.id === target.data.rpg.equipped.armor);
                            if (arm && arm.ac) armorAC += parseInt(arm.ac);
                        }
                        if (target.data.rpg.equipped.off_hand) {
                            const off = armory.find(i => i.id === target.data.rpg.equipped.off_hand);
                            if (off && off.type === 'armor' && off.ac) armorAC += parseInt(off.ac);
                        }
                        effTarget += armorAC;
                        if (armorAC !== 0) vsStr += ` + ${armorAC} (Armor)`;
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

                        if (subject.data.rpg && subject.data.rpg.equipped && subject.data.rpg.equipped.main_hand) {
                            const armory = state.rpg.items || [];
                            const wpn = armory.find(i => i.id === subject.data.rpg.equipped.main_hand);
                            if (wpn && (wpn.dmg || wpn.effect)) {
                                dmgDice = wpn.dmg || wpn.effect;
                                weaponName = wpn.name;
                            }
                        }

                        const dmgResult = rollDice(dmgDice);
                        const dmgMod = getStat(subject, 'STR', 'mod');
                        const totalDmg = Math.max(1, dmgResult.total + dmgMod);

                        if (!target.data.rpg) target.data.rpg = { hp: 10, maxHp: 10 };
                        target.data.rpg.hp = Math.max(0, (target.data.rpg.hp || 0) - totalDmg);

                        // NOTIFY STATE UPDATE
                        A.State.notify();

                        sysLogs.push(`⚔️ **Damage**: ${totalDmg} (${dmgResult.total} + ${dmgMod}) [${weaponName}] -> ${target.name} (HP: ${target.data.rpg.hp})`);

                        // Check Win Condition
                        checkCombatEnd(sysLogs);
                    }
                }
            }
        }
    }

    // INJECTION: HUD
    // (Render AFTER logic to catch updates)
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

    // Flush to Context
    if (sysLogs.length > 0) {
        context.system_notes = (context.system_notes || "") + "\n\n[RPG System]\n" + sysLogs.join('\n');
    }
}
