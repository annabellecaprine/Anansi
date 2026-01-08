/*
 * Anansi Core: Scripts
 * File: js/core/scripts.js
 * Purpose: Manage script assets (CRUD + Ordering).
 */

(function (A) {
    'use strict';

    const systemScripts = [
        { id: 'sys_eros', name: 'SYSTEM: EROS', path: 'js/aura/EROS.js', order: -4, system: true, enabled: true, source: { code: '// Loading...' } },
        { id: 'sys_intent', name: 'SYSTEM: INTENT', path: 'js/aura/INTENT.js', order: -3, system: true, enabled: true, source: { code: '// Loading...' } },
        { id: 'sys_pulse', name: 'SYSTEM: PULSE', path: 'js/aura/PULSE.js', order: -2, system: true, enabled: true, source: { code: '// Loading...' } },
        { id: 'sys_aura', name: 'SYSTEM: AURA', path: 'js/aura/AURA.js', order: -1, system: true, enabled: true, source: { code: '// Loading...' } },
        {
            id: 'sys_rpg', origin: 'preset', name: 'SYSTEM: RPG STRATUM', path: 'js/core/presets/sys_rpg.js', order: 0, system: true, enabled: true,
            source: {
                code: `
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
            data: { rpg: { hp: 20, maxHp: 20, mp: 3, maxMp: 3, ac: 14, str: 2, inventory: [{name:'Sword', type:'weapon', dmg:'1d8'}] } } 
        };
    }
    // Ensure Stats
    if (!player.data) player.data = {};
    if (!player.data.rpg) player.data.rpg = { hp: 20, maxHp: 20, mp: 3, maxMp: 3, ac: 10, str: 0, inventory: [] };
    
    // Migration for v2.0 Actors (Add MP if missing)
    if (player.data.rpg.mp === undefined) { player.data.rpg.mp = 3; player.data.rpg.maxMp = 3; }

    const pStats = player.data.rpg;

    // --- 2. Action Parsing ---

    // A. REST (recover stats)
    if (input.includes('rest') || input.includes('sleep') || input.includes('camp')) {
        pStats.hp = Math.min(pStats.maxHp, pStats.hp + 10);
        pStats.mp = Math.min(pStats.maxMp, pStats.mp + 3);
        log.push(\`[RPG]: \${player.name} rests. Recovered HP and MP.\`);
    }
    
    // B. SEARCH (Loot)
    else if (input.includes('search') || input.includes('look around') || input.includes('loot')) {
        const roll = Math.floor(Math.random() * 6) + 1;
        if (roll >= 5) {
            log.push(\`[RPG]: searched the area... Found a **Healing Potion**!\`);
            pStats.inventory.push({ name: 'Healing Potion', type: 'consumable', effect: 'heal 1d8' });
        } else {
            log.push(\`[RPG]: searched the area... Found nothing of interest.\`);
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
                 data: { rpg: { hp: 20, maxHp: 20, mp: 0, maxMp: 0, ac: 12, str: 3, inventory: [{name:'Club', type:'weapon', dmg:'1d6'}] } }
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
                    log.push(\`[COMBAT]: \${player.name} casts HEAL (-1 MP). Restored \${heal} HP.\`);
                } else {
                    // Magic Attack
                    const dmg = Math.floor(Math.random() * 6) + 1;
                    tStats.hp = Math.max(0, tStats.hp - dmg);
                    log.push(\`[COMBAT]: \${player.name} casts ARCANE VELOCITY (-1 MP). Hits \${target.name} for \${dmg} Force damage!\`);
                }
            } else {
                log.push(\`[COMBAT]: \${player.name} tries to cast a spell but has **NO MANA**!\`);
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
                 log.push(\`[COMBAT]: \${player.name} attacks with \${weapon.name}. Rolled \${roll}+\${hitMod} (\${totalHit}) vs AC \${totalAc}. HIT! \${dmg} dmg.\`);
             } else {
                 log.push(\`[COMBAT]: \${player.name} attacks with \${weapon.name}. Rolled \${roll}+\${hitMod} (\${totalHit}) vs AC \${totalAc}. MISS.\`);
             }
        }

        // Active Combat Tracking
        rpg.activeCombat = { player: player.name, target: target.name };
        if (target.id === 'virtual_orc') state.rpg.virtualEnemy = target.data.rpg;
    }

    // --- 3. Inject Logs ---
    if (log.length > 0) {
        context.system_notes = (context.system_notes || "") + "\\n" + log.join(' ');
        console.log('[RPG v3] Log:', log.join(' '));
    }
}

// --- OUTPUT PHASE: HUD ---
if (context.phase === 'output') {
    if (rpg && rpg.activeCombat) {
        let hud = "\\n\\n> **COMBAT STATUS**\\n";
        
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
                     const mpPct = Math.max(0, (s.mp||0) / mpMax);
                     const mpFilled = Math.ceil(mpPct * 5); // 5 blocks for MP
                     const mpBar = "🟦".repeat(mpFilled) + "⬜".repeat(5 - mpFilled);
                     mpDisplay = \` | MP: [\${mpBar}] \${s.mp}/\${s.maxMp}\`;
                }

                hud += \`> **\${name}**: HP [\${hpBar}] \${s.hp}/\${s.maxHp}\${mpDisplay}\\n\`;
            }
        });
        
        context.responseText += hud;
    }
}
`
            }
        }
    ];

    const Scripts = {
        // Generate a simple ID
        _genId: function () {
            return 'script_' + Math.random().toString(36).substr(2, 9);
        },

        // Load system scripts from pre-loaded data (inlined)
        loadSystem: function () {
            if (!A.SystemData) {
                console.error("Anansi: System Data not found. Run build_system_data.py.");
                // Fallback for development if not built
                // return; 
            }

            for (const script of systemScripts) {
                if (A.SystemData && A.SystemData[script.id]) {
                    script.source.code = A.SystemData[script.id];
                } else if (!script.source.code || script.source.code === '// Loading...') {
                    // Check if we can find it in global scope (legacy fallback)
                    // or just leave as is
                }
            }
            A.State.notify();
        },

        // Create a new script
        create: function (name) {
            const state = A.State.get();
            if (!state) return;

            // Ensure scripts container exists
            if (!state.strands.scripts.items) state.strands.scripts.items = {};

            const id = Scripts._genId();
            const count = Object.keys(state.strands.scripts.items).length;

            const newScript = {
                id: id,
                name: name || 'New Script',
                enabled: true,
                order: count, // Append to end
                source: {
                    type: 'inline',
                    code: '// ' + (name || 'New Script') + '\n\n'
                },
                declared: { reads: [], writes: [] }
            };

            state.strands.scripts.items[id] = newScript;
            A.State.notify(); // Trigger update
            return id;
        },

        // Update script code or meta
        update: function (id, updates) {
            // Check System Scripts first
            const sysScript = systemScripts.find(s => s.id === id);
            if (sysScript) {
                Object.assign(sysScript, updates);
                A.State.notify();
                return;
            }

            const state = A.State.get();
            if (!state || !state.strands.scripts.items[id]) return;

            Object.assign(state.strands.scripts.items[id], updates);
            A.State.notify();
        },

        // Delete a script
        delete: function (id) {
            // Prevent deleting system scripts
            if (systemScripts.find(s => s.id === id)) return;

            const state = A.State.get();
            if (!state || !state.strands.scripts.items[id]) return;

            delete state.strands.scripts.items[id];
            A.State.notify();
        },

        // Move script up or down in order
        move: function (id, direction) {
            const state = A.State.get();
            if (!state) return;

            // Unified List Strategy
            // 1. Get ALL scripts (System + User)
            const allScripts = Scripts.getAll();

            // 2. Normalize Order (0 to N) to ensure continuity
            allScripts.forEach((s, i) => s.order = i);

            // 3. Find Target
            const currentIndex = allScripts.findIndex(s => s.id === id);
            if (currentIndex === -1) return;

            // 4. Determine Swap Target
            const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

            // 5. Bounds Check
            if (newIndex < 0 || newIndex >= allScripts.length) return;

            // 6. Swap 'order' values
            const scriptA = allScripts[currentIndex];
            const scriptB = allScripts[newIndex];

            const tempOrder = scriptA.order;
            scriptA.order = scriptB.order;
            scriptB.order = tempOrder;

            // 7. Persist
            // System scripts live in 'systemScripts' array (memory). 
            // User scripts live in 'state' (storage).
            // Since we modified the objects references directly, we just need to notify.
            A.State.notify();
        },

        // Get all scripts sorted by order (Unified)
        getAll: function () {
            const state = A.State.get();
            // Start with System Scripts
            let combined = [...systemScripts];

            // Add User Scripts
            if (state && state.strands && state.strands.scripts && state.strands.scripts.items) {
                combined = combined.concat(Object.values(state.strands.scripts.items));
            }

            // Sort by Order
            // System scripts start with negative order, User with positive.
            // But after a move, they might be mixed.
            combined.sort((a, b) => (a.order || 0) - (b.order || 0));

            // DYNAMIC PREVIEW: If AURA is requested, build it fresh
            // This ensures the Scripts panel sees the "Live" version with characters/lore
            const auraScript = combined.find(s => s.id === 'sys_aura');
            if (auraScript && A.AuraBuilder) {
                // Determine if we need to rebuild (simple check: always rebuild for real-time)
                try {
                    // Only rebuild if we have state (avoid crash during init)
                    if (state) {
                        const preview = A.AuraBuilder.preview(state);
                        // We modify the object in the array, but systemScripts[3] remains the template in memory
                        // effectively "overlaying" the preview on this result set.
                        auraScript.source.code = preview;
                    }
                } catch (e) {
                    console.warn('[Scripts] Aura Preview Gen Failed:', e);
                }
            }

            return combined;
        }
    };

    // Auto-load system scripts
    setTimeout(() => Scripts.loadSystem(), 100);

    A.Scripts = Scripts;

})(window.Anansi);
