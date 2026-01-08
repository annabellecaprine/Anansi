/*
 * Anansi Panel: RPG Monsters
 * File: js/panels/rpg_monsters.js
 * Category: RPG Experiment
 * Purpose: Bestiary and Spawn Manager. Lists predefined monsters and allows spawning them into the virtual combat slot.
 */

(function (A) {
    'use strict';

    // Default Bestiary for Prototype
    const DEFAULT_BESTIARY = [
        { id: 'orc_grunt', name: 'Orc Grunt', hp: 20, ac: 12, str: 3, xp: 50, inventory: [{ name: 'Rusty Axe', type: 'weapon', dmg: '1d8' }] },
        { id: 'goblin_sapper', name: 'Goblin Sapper', hp: 12, ac: 14, str: 1, xp: 25, inventory: [{ name: 'Dagger', type: 'weapon', dmg: '1d4' }] },
        { id: 'skeleton_warrior', name: 'Skeleton Warrior', hp: 15, ac: 13, str: 2, xp: 35, inventory: [{ name: 'Shortsword', type: 'weapon', dmg: '1d6' }] },
        { id: 'gelatinous_cube', name: 'Gelatinous Cube', hp: 45, ac: 6, str: 4, xp: 200, inventory: [] },
        { id: 'dragon_hatchling', name: 'Red Dragon Hatchling', hp: 60, ac: 16, str: 5, xp: 500, inventory: [{ name: 'Fire Breath', type: 'weapon', dmg: '2d6' }] }
    ];

    function render(container) {
        container.style.height = '100%';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.background = 'var(--bg-base)';
        container.style.padding = '0';

        // Ensure state
        const state = A.State.get();
        if (!state.rpg) state.rpg = { enabled: true };
        if (!state.rpg.bestiary) state.rpg.bestiary = JSON.parse(JSON.stringify(DEFAULT_BESTIARY));

        // Header
        const header = document.createElement('div');
        header.className = 'panel-toolbar';
        header.style.padding = '12px 16px';
        header.style.background = 'var(--bg-elevated)';
        header.style.borderBottom = '1px solid var(--border-subtle)';
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';

        header.innerHTML = `
            <div style="font-weight:bold; font-size:14px; display:flex; align-items:center; gap:8px;">
                <span>🐉</span> Bestiary
            </div>
            <div style="font-size:11px; color:var(--text-muted); text-transform:uppercase;">
                Active: <span id="active-enemy" style="color:var(--status-error); font-weight:bold;">None</span>
            </div>
        `;
        container.appendChild(header);

        // Content
        const content = document.createElement('div');
        content.style.flex = '1';
        content.style.overflowY = 'auto';
        content.style.padding = '16px';
        container.appendChild(content);

        // Helper: Spawn Monster
        // Helper: Spawn Monster
        const spawnMonster = (monsterTemplate) => {
            const state = A.State.get();
            if (!state.nodes || !state.nodes.actors) return;
            if (!state.nodes.actors.items) state.nodes.actors.items = {};

            // Generate ID
            const id = 'actor_' + Math.random().toString(36).substr(2, 9);

            // Create Actor Node
            const newActor = {
                id: id,
                name: monsterTemplate.name,
                type: 'actor',
                data: {
                    rpg: {
                        enabled: true,
                        type: 'monster', // Critical for AI
                        hp: monsterTemplate.hp,
                        maxHp: monsterTemplate.hp,
                        ac: monsterTemplate.ac,
                        str: monsterTemplate.str,
                        xp: monsterTemplate.xp,
                        level: 1,
                        class: 'Monster',
                        equipped: {}
                    }
                }
            };

            // Inject Inventory
            if (monsterTemplate.inventory && monsterTemplate.inventory.length > 0) {
                // For MVP, just give them the first item as 'equipped' text or logic
                // Ideally we'd add to armory, but for now let's just assume natural weapons
                // or simple parsing in sys_rpg
            }

            state.nodes.actors.items[id] = newActor;

            A.State.notify();
            if (A.UI.Toast) A.UI.Toast.show(`Spawned ${newActor.name}!`, 'success');
        };

        // Update Display to show Active Monster Nodes
        const updateActiveDisplay = () => {
            const activeContainer = header.querySelector('#active-enemy');
            // Clear previous text
            activeContainer.innerHTML = '';

            const state = A.State.get();
            if (!state.nodes || !state.nodes.actors || !state.nodes.actors.items) {
                activeContainer.textContent = "None";
                return;
            }

            const actors = Object.values(state.nodes.actors.items);
            const monsters = actors.filter(a => a.data && a.data.rpg && a.data.rpg.type === 'monster');

            if (monsters.length === 0) {
                activeContainer.textContent = "None";
                return;
            }

            // Render Mini List
            monsters.forEach(m => {
                const badge = document.createElement('span');
                badge.style.display = 'inline-flex';
                badge.style.alignItems = 'center';
                badge.style.gap = '4px';
                badge.style.background = 'rgba(255, 50, 50, 0.1)';
                badge.style.color = 'var(--status-error)';
                badge.style.padding = '2px 6px';
                badge.style.borderRadius = '4px';
                badge.style.fontSize = '10px';
                badge.style.marginRight = '4px';

                badge.innerHTML = `
                    <span>💀 ${m.name} (${m.data.rpg.hp})</span>
                    <span class="remove-btn" style="cursor:pointer; font-weight:bold; opacity:0.6;">✕</span>
                 `;

                badge.querySelector('.remove-btn').onclick = (e) => {
                    e.stopPropagation();
                    // DELETE ACTOR
                    delete state.nodes.actors.items[m.id];
                    A.State.notify();
                    if (A.UI.Toast) A.UI.Toast.show(`Refreshed realm (Removed ${m.name})`);
                };

                activeContainer.appendChild(badge);
            });
        };

        // Render List
        const list = document.createElement('div');
        list.style.display = 'grid';
        list.style.gridTemplateColumns = 'repeat(auto-fill, minmax(250px, 1fr))';
        list.style.gap = '12px';

        state.rpg.bestiary.forEach(mon => {
            const card = document.createElement('div');
            card.className = 'card interactive';
            card.style.background = 'var(--bg-surface)';
            card.style.border = '1px solid var(--border-subtle)';
            card.style.borderRadius = '6px';
            card.style.padding = '12px';
            card.style.cursor = 'pointer';
            card.style.transition = 'all 0.2s';

            card.onmouseenter = () => card.style.borderColor = 'var(--accent-primary)';
            card.onmouseleave = () => card.style.borderColor = 'var(--border-subtle)';
            card.onclick = () => spawnMonster(mon);

            card.innerHTML = `
                <div style="font-weight:bold; color:var(--status-error); margin-bottom:4px;">${mon.name}</div>
                <div style="font-size:11px; color:var(--text-muted); display:flex; gap:8px;">
                    <span>HP: ${mon.hp}</span>
                    <span>AC: ${mon.ac}</span>
                    <span>XP: ${mon.xp}</span>
                </div>
                <div style="font-size:10px; color:var(--text-secondary); margin-top:6px; font-style:italic;">
                    ${mon.inventory && mon.inventory.length ? 'Analysis: ' + mon.inventory[0].name : 'Unarmed'}
                </div>
            `;
            list.appendChild(card);
        });

        content.appendChild(list);
        updateActiveDisplay();

        // Subscribe for live HP updates of the active enemy
        A.State.subscribe(() => {
            if (header.isConnected) updateActiveDisplay();
        });
    }

    A.registerPanel('rpg_monsters', {
        label: 'Monsters',
        subtitle: 'Bestiary & Spawn',
        category: 'RPG Experiment',
        icon: '🐉',
        render: render
    });

})(window.Anansi);
