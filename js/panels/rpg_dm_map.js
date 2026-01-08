/*
 * Anansi Panel: DM Map (Dungeon Master's Atlas)
 * File: js/panels/rpg_dm_map.js
 * Category: RPG Experiment
 * Purpose: Backend editor for World Nodes (Locations), managing Loot, Encounters, and Secrets.
 * Pairs with: Locations (Geometry/Desc) and Map (Player View).
 */

(function (A) {
    'use strict';

    function render(container) {
        // Layout
        container.style.display = 'grid';
        container.style.gridTemplateColumns = '250px 1fr';
        container.style.height = '100%';
        container.style.gap = '1px';
        container.style.background = 'var(--border-subtle)'; // Gap color

        // Ensure State
        const state = A.State.get();
        if (!state.weaves) state.weaves = {};
        if (!state.weaves.locations) state.weaves.locations = [];

        // --- Left: Location List ---
        const leftCol = document.createElement('div');
        leftCol.style.background = 'var(--bg-base)';
        leftCol.style.display = 'flex';
        leftCol.style.flexDirection = 'column';
        leftCol.style.overflow = 'hidden';

        leftCol.innerHTML = `
            <div class="panel-toolbar" style="padding:12px; font-weight:bold; border-bottom:1px solid var(--border-subtle);">
                🏛️ Locations
            </div>
            <div id="dm-loc-list" style="flex:1; overflow-y:auto; padding:8px;"></div>
        `;
        container.appendChild(leftCol);

        // --- Right: Editor ---
        const rightCol = document.createElement('div');
        rightCol.style.background = 'var(--bg-base)';
        rightCol.style.padding = '0';
        rightCol.style.display = 'flex';
        rightCol.style.flexDirection = 'column';
        rightCol.style.overflow = 'hidden';

        // Initial Empty State
        rightCol.innerHTML = `
            <div style="flex:1; display:flex; align-items:center; justify-content:center; color:var(--text-muted); font-style:italic;">
                Select a location to edit DM details.
            </div>
        `;
        container.appendChild(rightCol);

        // --- Logic ---
        const locList = leftCol.querySelector('#dm-loc-list');

        const renderList = (selectedId) => {
            locList.innerHTML = '';
            state.weaves.locations.forEach(loc => {
                const el = document.createElement('div');
                el.className = 'nav-item'; // repurpose nav style or generic
                el.style.padding = '8px 12px';
                el.style.cursor = 'pointer';
                el.style.borderRadius = '4px';
                el.style.fontSize = '12px';
                el.style.marginBottom = '4px';
                el.style.display = 'flex';
                el.style.justifyContent = 'space-between';
                el.style.alignItems = 'center';

                if (loc.id === selectedId) {
                    el.style.background = 'var(--accent-primary)';
                    el.style.color = 'white';
                } else {
                    el.style.color = 'var(--text-secondary)';
                }

                // Hover effect handled by css usually, manual here
                el.onmouseenter = () => { if (loc.id !== selectedId) el.style.background = 'var(--bg-elevated)'; };
                el.onmouseleave = () => { if (loc.id !== selectedId) el.style.background = 'transparent'; };

                el.innerHTML = `
                    <span>${loc.name || 'Unnamed'}</span>
                    ${(loc.rpg && (loc.rpg.encounters?.length || loc.rpg.loot?.length)) ? '<span style="font-size:10px; opacity:0.7;">⚙️</span>' : ''}
                `;

                el.onclick = () => {
                    renderEditor(loc);
                    renderList(loc.id);
                };

                locList.appendChild(el);
            });
        };

        const renderEditor = (loc) => {
            // Ensure RPG Data Structure
            if (!loc.rpg) loc.rpg = {
                encounters: [], // List of monster IDs
                loot: [],       // List of item objects or strings
                secrets: '',    // GM only notes
                trap: null      // { type, dc, dmg }
            };
            const d = loc.rpg;

            rightCol.innerHTML = `
                <div class="panel-toolbar" style="padding:12px 16px; border-bottom:1px solid var(--border-subtle); display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-weight:bold; font-size:14px;">Edit: ${loc.name}</span>
                    <span style="font-family:var(--font-mono); font-size:10px; color:var(--text-muted);">${loc.id}</span>
                </div>
                <div style="flex:1; overflow-y:auto; padding:24px;">
                    
                    <!-- ENCOUNTERS -->
                    <div style="margin-bottom:24px;">
                        <h3 style="border-bottom:1px solid var(--border-subtle); padding-bottom:8px; display:flex; justify-content:space-between;">
                            <span>⚔️ Encounters / Mobs</span>
                            <button class="btn btn-xs btn-ghost" id="btn-add-mob">+ Add</button>
                        </h3>
                        <div id="list-mobs" style="display:flex; flex-direction:column; gap:8px; margin-top:12px;"></div>
                        <div style="margin-top:8px; font-size:11px; color:var(--text-muted);">
                            Monsters that roam here. (Data from Monsters panel)
                        </div>
                    </div>

                    <!-- LOOT / ITEMS -->
                    <div style="margin-bottom:24px;">
                        <h3 style="border-bottom:1px solid var(--border-subtle); padding-bottom:8px; display:flex; justify-content:space-between;">
                            <span>💎 Loot Table</span>
                            <button class="btn btn-xs btn-ghost" id="btn-add-loot">+ Add</button>
                        </h3>
                        <div id="list-loot" style="display:flex; flex-direction:column; gap:8px; margin-top:12px;"></div>
                    </div>

                    <!-- SECRETS -->
                    <div style="margin-bottom:24px;">
                        <h3 style="border-bottom:1px solid var(--border-subtle); padding-bottom:8px;">🤫 DM Secrets (Hidden)</h3>
                        <textarea class="input" id="inp-secrets" rows="5" placeholder="Traps, hidden doors, DC checks, history..." style="width:100%; margin-top:12px;">${d.secrets || ''}</textarea>
                    </div>

                </div>
            `;

            // --- Handlers ---

            // Secrets
            rightCol.querySelector('#inp-secrets').onchange = (e) => {
                d.secrets = e.target.value;
                A.State.notify();
            };

            // Mobs Render & Logic
            const mobList = rightCol.querySelector('#list-mobs');
            const renderMobs = () => {
                mobList.innerHTML = '';
                if (!d.encounters || d.encounters.length === 0) {
                    mobList.innerHTML = '<div style="color:var(--text-muted); font-style:italic; font-size:11px;">Safe zone. No monsters.</div>';
                    return;
                }
                d.encounters.forEach((mobId, idx) => {
                    const row = document.createElement('div');
                    row.className = 'card';
                    row.style.padding = '8px';
                    row.style.display = 'flex';
                    row.style.justifyContent = 'space-between';
                    row.style.alignItems = 'center';

                    // Lookup name from Bestiary if possible
                    const bestiary = state.rpg?.bestiary || [];
                    const mobRef = bestiary.find(m => m.id === mobId);
                    const name = mobRef ? mobRef.name : mobId;

                    row.innerHTML = `
                        <span style="font-weight:bold; color:var(--status-error);">${name}</span>
                        <button class="btn btn-xs btn-ghost" style="color:var(--text-muted);">Remove</button>
                    `;
                    row.querySelector('button').onclick = () => {
                        d.encounters.splice(idx, 1);
                        A.State.notify();
                        renderMobs();
                    };
                    mobList.appendChild(row);
                });
            };

            rightCol.querySelector('#btn-add-mob').onclick = () => {
                // Determine available monsters
                const bestiary = state.rpg?.bestiary || [];
                if (bestiary.length === 0) {
                    if (A.UI.Toast) A.UI.Toast.show('No monsters in Bestiary!', 'warning');
                    return;
                }

                // Create a simple modal or prompt. Using prompt for prototype speed.
                // Ideally, a select modal.
                // Re-using specific prompt isn't easy without UI libs, let's use a quick picker if we can, 
                // or just standard prompt for ID. But IDs are hard to remember.
                // Let's cycle or provide a quick select.

                // Hack: Add the first one, or random one, then let user cycle? No.
                // Let's prompt with a list.
                const listStr = bestiary.map(m => `${m.id} (${m.name})`).join('\n');
                const val = prompt(`Enter Monster ID to add:\n\n${listStr}`);
                if (val) {
                    // Check if valid? Nah, loose coupling.
                    d.encounters.push(val.trim());
                    A.State.notify();
                    renderMobs();
                }
            };
            renderMobs();

            // Loot Render & Logic
            const lootList = rightCol.querySelector('#list-loot');
            const renderLoot = () => {
                lootList.innerHTML = '';
                if (!d.loot || d.loot.length === 0) {
                    lootList.innerHTML = '<div style="color:var(--text-muted); font-style:italic; font-size:11px;">Empty.</div>';
                    return;
                }
                d.loot.forEach((item, idx) => {
                    const row = document.createElement('div');
                    row.className = 'card';
                    row.style.padding = '8px';
                    row.style.display = 'flex';
                    row.style.justifyContent = 'space-between';
                    row.style.alignItems = 'center';

                    const itemName = typeof item === 'string' ? item : (item.name || 'Unknown Item');

                    row.innerHTML = `
                        <span style="color:var(--accent-secondary);">💎 ${itemName}</span>
                        <button class="btn btn-xs btn-ghost" style="color:var(--text-muted);">Remove</button>
                    `;
                    row.querySelector('button').onclick = () => {
                        d.loot.splice(idx, 1);
                        A.State.notify();
                        renderLoot();
                    };
                    lootList.appendChild(row);
                });
            };

            rightCol.querySelector('#btn-add-loot').onclick = () => {
                const val = prompt("Enter item name (e.g. 'Gold Key', 'Potion'):");
                if (val) {
                    d.loot.push({ name: val.trim() }); // store as object for future structure
                    A.State.notify();
                    renderLoot();
                }
            };
            renderLoot();

        };

        // Render List initially
        renderList();

        // Subscribe
        A.State.subscribe(() => {
            if (leftCol.isConnected) {
                // Refresh list only if needed? Nah, just simplistic refresh
                // Problem: Resets selection if full refresh.
                // For prototype, we just won't auto-refresh the full list on every keystroke. 
                // Only on navigation change.
            }
        });
    }

    A.registerPanel('rpg_dm_map', {
        label: 'DM Map',
        subtitle: 'Loot & Encounters',
        category: 'RPG Experiment',
        icon: '🤫',
        render: render
    });

})(window.Anansi);
