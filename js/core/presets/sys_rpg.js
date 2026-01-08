
// SYSTEM SCRIPT: RPG Mechanics v3.0 (Sorcerer Edition)
// Managed by: Game Master Panel & Actors Panel

const state = A.State.get();

// Force Enable for Prototype
if (!state.rpg) state.rpg = { enabled: true, stats: [], mechanics: 'd20' };
state.rpg.enabled = true;
const rpg = state.rpg;

// --- Helper: Parse Dice (e.g. "1d8") ---
function rollDice(str) {
    if (!str) return 0;
    const [count, face] = str.toLowerCase().split('d').map(x => parseInt(x));
    if (isNaN(count) || isNaN(face)) return 0;
    let total = 0;
    for (let i = 0; i < count; i++) total += Math.floor(Math.random() * face) + 1;
    return total;
}

// --- Helper: Find Actor by Name ---
function findActor(name) {
    if (!name) return null;
    const actors = Object.values(state.nodes.actors.items || {});
    return actors.find(a => a.name.toLowerCase().includes(name.toLowerCase()));
}

// --- INPUT PHASE: Mechanics & Dice ---
if (context.phase === 'input') {
    const input = (context.user_input || "").toLowerCase();
    const log = [];

    // --- 1. Identify Combatants (Player) ---
    let player = findActor("Fechin") || findActor("Player") || findActor("Hero");
    if (!player) {
        player = {
            id: 'virtual_hero', name: 'Hero',
            data: { rpg: { hp: 20, maxHp: 20, mp: 3, maxMp: 3, ac: 14, str: 2, inventory: [{ name: 'Sword', type: 'weapon', dmg: '1d8' }] } }
        };
    }
    // Ensure Stats
    if (!player.data) player.data = {};
    if (!player.data.rpg) player.data.rpg = { hp: 20, maxHp: 20, mp: 3, maxMp: 3, ac: 10, str: 0, inventory: [] };
    const pStats = player.data.rpg;

    // --- 2. Action Parsing ---

    // A. REST (recover stats)
    if (input.includes('rest') || input.includes('sleep') || input.includes('camp')) {
        pStats.hp = Math.min(pStats.maxHp, pStats.hp + 10);
        pStats.mp = Math.min(pStats.maxMp, pStats.mp + 3);
        log.push(`[RPG]: ${player.name} rests. Recovered HP and MP.`);
    }

    // B. SEARCH (Loot)
    else if (input.includes('search') || input.includes('look around') || input.includes('loot')) {
        const roll = Math.floor(Math.random() * 6) + 1;
        if (roll >= 5) {
            log.push(`[RPG]: searched the area... Found a **Healing Potion**!`);
            pStats.inventory.push({ name: 'Healing Potion', type: 'consumable', effect: 'heal 1d8' });
        } else {
            log.push(`[RPG]: searched the area... Found nothing of interest.`);
        }
    }

    // C. COMBAT / MAGIC
    else if (input.includes('attack') || input.includes('cast') || input.includes('use')) {

        // Find Target
        let target = null;
        const actors = Object.values(state.nodes.actors.items || {});
        target = actors.find(a => input.includes(a.name.toLowerCase()) && a.id !== player.id);

        if (!target) target = findActor("Orc") || findActor("Gladiator") || findActor("Enemy");

        // Virtual Target Fallback
        if (!target) {
            target = {
                id: 'virtual_orc', name: 'Enemy',
                data: { rpg: { hp: 20, maxHp: 20, mp: 0, maxMp: 0, ac: 12, str: 3, inventory: [{ name: 'Club', type: 'weapon', dmg: '1d6' }] } }
            };
        }

        // Ensure Target Stats
        if (!target.data) target.data = {};
        if (!target.data.rpg) target.data.rpg = { hp: 20, maxHp: 20, mp: 0, maxMp: 0, ac: 10, str: 0, inventory: [] };
        const tStats = target.data.rpg;

        // MAGIC 
        if (input.includes('magic') || input.includes('cast')) {
            if (pStats.mp >= 1) {
                pStats.mp -= 1;

                if (input.includes('heal')) {
                    const heal = Math.floor(Math.random() * 6) + 1;
                    pStats.hp = Math.min(pStats.maxHp, pStats.hp + heal);
                    log.push(`[COMBAT]: ${player.name} casts HEAL (-1 MP). Restored ${heal} HP.`);
                } else {
                    // Magic Attack
                    const dmg = Math.floor(Math.random() * 6) + 1;
                    tStats.hp = Math.max(0, tStats.hp - dmg);
                    log.push(`[COMBAT]: ${player.name} casts ARCANE VELOCITY (-1 MP). Hits ${target.name} for ${dmg} Force damage!`);
                }
            } else {
                log.push(`[COMBAT]: ${player.name} tries to cast a spell but has **NO MANA**!`);
            }
        }
        // PHYSICAL
        else {
            const weapon = (pStats.inventory || []).find(i => i.type === 'weapon') || { name: 'Fists', dmg: '1d4' };
            const armor = (tStats.inventory || []).find(i => i.type === 'armor') || { name: 'Skin', ac: 0 };

            const roll = Math.floor(Math.random() * 20) + 1;
            const hitMod = pStats.str || 0;
            const totalHit = roll + hitMod;
            const totalAc = (tStats.ac || 10) + (armor.ac || 0);

            if (totalHit >= totalAc) {
                const dmg = rollDice(weapon.dmg) + hitMod;
                tStats.hp = Math.max(0, tStats.hp - dmg);
                log.push(`[COMBAT]: ${player.name} attacks with ${weapon.name}. Rolled ${roll}+${hitMod} (${totalHit}) vs AC ${totalAc}. HIT! ${dmg} dmg.`);
            } else {
                log.push(`[COMBAT]: ${player.name} attacks with ${weapon.name}. Rolled ${roll}+${hitMod} (${totalHit}) vs AC ${totalAc}. MISS.`);
            }
        }

        // Active Combat Tracking
        rpg.activeCombat = { player: player.name, target: target.name };
        if (target.id === 'virtual_orc') state.rpg.virtualEnemy = target.data.rpg;
    }

    // --- 3. Inject Logs ---
    if (log.length > 0) {
        context.system_notes = (context.system_notes || "") + "\n" + log.join(' ');
        console.log('[RPG v3] Log:', log.join(' '));
    }
}

// --- OUTPUT PHASE: HUD ---
if (context.phase === 'output') {
    if (rpg && rpg.activeCombat) {
        let hud = "\n\n> **COMBAT STATUS**\n";

        [rpg.activeCombat.player, rpg.activeCombat.target].forEach(name => {
            if (!name) return;
            let actor = findActor(name);

            // Fallbacks
            if (!actor && name === 'Hero') actor = { name: 'Hero', data: { rpg: { hp: 20, maxHp: 20, mp: 3, maxMp: 3 } } };
            if (!actor && name === 'Enemy') actor = { name: 'Enemy', data: { rpg: state.rpg.virtualEnemy || { hp: 20, maxHp: 20, mp: 0, maxMp: 0 } } };

            if (actor && actor.data && actor.data.rpg) {
                const s = actor.data.rpg;

                // HP Bar
                const hpPct = Math.max(0, s.hp / s.maxHp);
                const hpFilled = Math.ceil(hpPct * 10);
                const hpBar = "█".repeat(hpFilled) + "░".repeat(10 - hpFilled);

                // MP Bar (Small)
                const mpMax = s.maxMp || 0;
                let mpDisplay = "";
                if (mpMax > 0) {
                    const mpPct = Math.max(0, (s.mp || 0) / mpMax);
                    const mpFilled = Math.ceil(mpPct * 5); // 5 blocks for MP
                    const mpBar = "🟦".repeat(mpFilled) + "⬜".repeat(5 - mpFilled);
                    mpDisplay = ` | MP: [${mpBar}] ${s.mp}/${s.maxMp}`;
                }

                hud += `> **${name}**: HP [${hpBar}] ${s.hp}/${s.maxHp}${mpDisplay}\n`;
            }
        });

        context.responseText += hud;
    }
}
