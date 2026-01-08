/*
 * Anansi Panel: RPG Party
 * File: js/panels/rpg_party.js
 * Category: RPG Experiment
 * Purpose: Management interface for Character Stats, Equipment, Class, and Abilities.
 */

(function (A) {
    'use strict';

    // --- Radar Renderer (Adapted from stats.js) ---
    const AxisRadar = {};
    AxisRadar.renderRadar = function (w, h, labels, values, min, max) {
        // Use 35% margin (r=0.35) instead of 44% to prevent label clipping
        var i, n = labels.length, cx = w / 2, cy = h / 2, r = Math.min(w, h) * 0.35;
        if (!n) return '<svg width="' + w + '" height="' + h + '"></svg>';
        var rng = (max - min) || 1;

        function norm(vals) {
            var out = [], j;
            for (j = 0; j < n; j++) {
                var v = (parseFloat(vals[j]) - min) / rng; if (isNaN(v)) v = 0; if (v < 0) v = 0; if (v > 1) v = 1; out.push(v);
            }
            return out;
        }
        var base = norm(values);

        var rings = 4, ringPaths = [], k, j;
        for (k = 1; k <= rings; k++) {
            var rr = r * k / rings, path = [];
            for (j = 0; j < n; j++) {
                var ang = (Math.PI * 2 * j / n) - Math.PI / 2;
                var x = cx + rr * Math.cos(ang), y = cy + rr * Math.sin(ang);
                path.push((j === 0 ? 'M' : 'L') + x.toFixed(1) + ' ' + y.toFixed(1));
            }
            path.push('Z');
            ringPaths.push('<path d="' + path.join(' ') + '" fill="none" stroke="currentColor" opacity="0.12" stroke-width="1"/>');
        }
        var spokes = [], lbls = [];
        for (i = 0; i < n; i++) {
            var ang2 = (Math.PI * 2 * i / n) - Math.PI / 2;
            var x2 = cx + r * Math.cos(ang2), y2 = cy + r * Math.sin(ang2);
            spokes.push('<line x1="' + cx + '" y1="' + cy + '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) + '" stroke="currentColor" opacity="0.18" stroke-width="1"/>');
            var lx = cx + (r + 20) * Math.cos(ang2), ly = cy + (r + 20) * Math.sin(ang2);
            lbls.push('<text x="' + lx.toFixed(1) + '" y="' + ly.toFixed(1) + '" font-size="11" fill="var(--text-secondary)" text-anchor="middle" dominant-baseline="middle" opacity="0.9">' + labels[i] + '</text>');
        }

        function poly(norm) {
            var pts = [], path = [], m;
            for (m = 0; m < n; m++) {
                var ang3 = (Math.PI * 2 * m / n) - Math.PI / 2, rr2 = r * norm[m];
                var px = cx + rr2 * Math.cos(ang3), py = cy + rr2 * Math.sin(ang3);
                pts.push(px.toFixed(1) + ',' + py.toFixed(1));
                path.push((m === 0 ? 'M' : 'L') + px.toFixed(1) + ' ' + py.toFixed(1));
            }
            path.push('Z');
            return { pts: pts.join(' '), d: path.join(' ') };
        }

        var basePoly = poly(base);

        return ''
            + '<svg viewBox="0 0 ' + w + ' ' + h + '" style="width:100%; height:auto; max-width:350px;" role="img">'
            + '<g fill="none" stroke="currentColor">' + ringPaths.join('') + spokes.join('') + '</g>'
            + '<polygon points="' + basePoly.pts + '" fill="var(--accent-primary)" opacity="0.15"></polygon>'
            + '<path d="' + basePoly.d + '" fill="none" stroke="var(--accent-primary)" stroke-width="2" opacity="0.8"></path>'
            + '<g fill="currentColor" stroke="none">' + lbls.join('') + '</g>'
            + '</svg>';
    };

    // --- Template Definitions ---
    const TEMPLATES = {
        'dnd': {
            label: 'D20 Stats',
            defs: [
                { key: 'STR', label: 'Strength', min: 1, max: 20 },
                { key: 'DEX', label: 'Dexterity', min: 1, max: 20 },
                { key: 'CON', label: 'Constitution', min: 1, max: 20 },
                { key: 'INT', label: 'Intelligence', min: 1, max: 20 },
                { key: 'WIS', label: 'Wisdom', min: 1, max: 20 },
                { key: 'CHA', label: 'Charisma', min: 1, max: 20 }
            ],
            defaults: { 'STR': 10, 'DEX': 10, 'CON': 10, 'INT': 10, 'WIS': 10, 'CHA': 10 }
        }
    };

    function render(container) {
        // Layout
        container.style.height = '100%';
        container.style.display = 'grid';
        container.style.gridTemplateColumns = '250px 1fr';
        container.style.gap = 'var(--space-4)';
        container.style.overflow = 'hidden';

        let currentActorId = null;

        // --- Sidebar ---
        const sidebar = document.createElement('div');
        sidebar.className = 'card';
        sidebar.style.display = 'flex';
        sidebar.style.flexDirection = 'column';
        sidebar.style.padding = '12px';
        sidebar.style.gap = '8px';
        sidebar.style.overflowY = 'auto';

        const sidebarHeader = document.createElement('div');
        sidebarHeader.style.display = 'flex';
        sidebarHeader.style.justifyContent = 'space-between';
        sidebarHeader.style.alignItems = 'center';
        sidebarHeader.style.marginBottom = '8px';

        const headerTitle = document.createElement('span');
        headerTitle.style.fontSize = '12px';
        headerTitle.style.fontWeight = 'bold';
        headerTitle.style.color = 'var(--text-muted)';
        headerTitle.style.textTransform = 'uppercase';
        headerTitle.textContent = 'Party Members';
        sidebarHeader.appendChild(headerTitle);

        const addMemberBtn = document.createElement('button');
        addMemberBtn.className = 'btn btn-xs btn-ghost';
        addMemberBtn.textContent = '+ Add';
        addMemberBtn.title = 'Add character to party';
        addMemberBtn.onclick = () => {
            const state = A.State.get();
            const allActors = (state.nodes && state.nodes.actors && state.nodes.actors.items) ? Object.values(state.nodes.actors.items) : [];
            const nonParty = allActors.filter(a => !a.data || !a.data.rpg || !a.data.rpg.enabled);

            if (nonParty.length === 0) {
                alert('All actors are already in the party.');
                return;
            }

            // Simple selector for now
            // Create a temporary overlay or just use a prompt loop/custom UI if simple
            // Let's use a simple dropdown injection into the list temporarily or a prompt if names are unique enough? 
            // Better: A small modal or overlay using A.UI if available, else simple list injection.
            // I'll inject a selection list into the actorsList area temporarily.

            actorsList.innerHTML = '';
            const selHeader = document.createElement('div');
            selHeader.textContent = 'Select to Add:';
            selHeader.style.fontSize = '11px';
            selHeader.style.padding = '4px';
            actorsList.appendChild(selHeader);

            nonParty.forEach(a => {
                const opt = document.createElement('div');
                opt.className = 'list-item';
                opt.style.padding = '6px 8px';
                opt.style.cursor = 'pointer';
                opt.textContent = a.name;
                opt.onmouseenter = () => opt.style.background = 'var(--bg-hover)';
                opt.onmouseleave = () => opt.style.background = 'transparent';
                opt.onclick = () => {
                    if (!a.data) a.data = {};
                    if (!a.data.rpg) a.data.rpg = { hp: 20, maxHp: 20, mp: 3, maxMp: 3, ac: 10, enabled: true };
                    else a.data.rpg.enabled = true;

                    A.State.notify();
                    refreshSidebar();
                    // Select the new member
                    currentActorId = a.id;
                    refreshMain();
                };
                actorsList.appendChild(opt);
            });

            const cancelBtn = document.createElement('button');
            cancelBtn.textContent = 'Cancel';
            cancelBtn.className = 'btn btn-xs btn-ghost';
            cancelBtn.style.width = '100%';
            cancelBtn.style.marginTop = '8px';
            cancelBtn.onclick = () => refreshSidebar();
            actorsList.appendChild(cancelBtn);
        };
        sidebarHeader.appendChild(addMemberBtn);

        sidebar.appendChild(sidebarHeader);

        const actorsList = document.createElement('div');
        actorsList.style.display = 'flex';
        actorsList.style.flexDirection = 'column';
        actorsList.style.gap = '4px';
        sidebar.appendChild(actorsList);

        container.appendChild(sidebar);

        // --- Main Content ---
        const main = document.createElement('div');
        main.className = 'card';
        main.style.display = 'flex';
        main.style.flexDirection = 'column';
        main.style.overflow = 'hidden'; // Inner scroll
        main.style.padding = '0';
        container.appendChild(main);

        // --- Render Functions ---

        function getPartyMembers() {
            const state = A.State.get();
            const actors = (state.nodes && state.nodes.actors && state.nodes.actors.items) ? Object.values(state.nodes.actors.items) : [];
            // Exclude Monsters from this specific UI panel
            return actors.filter(a => a.data && a.data.rpg && a.data.rpg.enabled && a.data.rpg.type !== 'monster');
        }

        function refreshSidebar() {
            actorsList.innerHTML = '';
            const members = getPartyMembers();

            if (members.length === 0) {
                actorsList.innerHTML = `<div style="padding:10px; text-align:center; color:var(--text-muted); font-size:12px;">No RPG characters found.<br>Enable RPG mode in Actors panel.</div>`;
                return;
            }

            // Auto-select first if none selected
            if (!currentActorId && members.length > 0) {
                currentActorId = members[0].id;
            }

            members.forEach(actor => {
                const item = document.createElement('div');
                item.className = 'list-item'; // Generic clickable item
                item.style.padding = '8px 12px';
                item.style.borderRadius = '6px';
                item.style.cursor = 'pointer';
                item.style.fontSize = '14px';
                item.style.display = 'flex';
                item.style.alignItems = 'center';
                item.style.gap = '8px';

                if (actor.id === currentActorId) {
                    item.style.background = 'var(--bg-elevated)';
                    item.style.color = 'var(--accent-primary)';
                    item.style.fontWeight = 'bold';
                } else {
                    item.style.color = 'var(--text-primary)';
                    item.onmouseenter = () => item.style.background = 'var(--bg-hover)';
                    item.onmouseleave = () => item.style.background = 'transparent';
                }

                item.innerHTML = `<span>${actor.name}</span>`;
                item.onclick = () => {
                    currentActorId = actor.id;
                    refreshSidebar();
                    refreshMain();
                };
                actorsList.appendChild(item);
            });
        }

        function refreshMain() {
            main.innerHTML = '';

            const members = getPartyMembers();
            const actor = members.find(a => a.id === currentActorId);

            if (!actor) {
                main.innerHTML = `
                    <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; color:var(--text-muted); opacity:0.7;">
                        <span style="font-size:32px; margin-bottom:12px;">🛡️</span>
                        <div>Select a character to manage details</div>
                    </div>
                `;
                return;
            }

            // Ensure data structures
            if (!actor.data.rpg.stats_matrix) actor.data.rpg.stats_matrix = { blocks: [], values: {} };
            const matrix = actor.data.rpg.stats_matrix;

            // -- Header --
            const header = document.createElement('div');
            header.className = 'panel-toolbar';
            header.style.padding = '12px 16px';
            header.style.borderBottom = '1px solid var(--border-subtle)';
            header.style.display = 'flex';
            header.style.justifyContent = 'space-between';
            header.style.alignItems = 'center';

            header.innerHTML = `
                <div style="font-size:16px; font-weight:bold; display:flex; align-items:center; gap:8px;">
                    ${actor.name}
                    <span class="lvl-badge" style="font-size:11px; font-weight:normal; color:var(--text-muted); opacity:0.8;">Lvl ${actor.data.rpg.stats?.level || 1}</span>
                </div>
                <div style="display:flex; gap:6px;">
                     <button class="btn btn-sm btn-ghost" id="act-remove" style="color:var(--status-error);" title="Remove from Party">Remove</button>
                     <div style="width:1px; background:var(--border-subtle); margin:0 4px;"></div>
                     <button class="btn btn-sm btn-secondary" id="act-add-dnd">+ D20 Stats</button>
                     <button class="btn btn-sm btn-ghost" id="act-add-custom">+ Custom</button>
                </div>
            `;
            header.querySelector('#act-remove').onclick = () => {
                if (confirm(`Remove ${actor.name} from the party? (Data is preserved)`)) {
                    actor.data.rpg.enabled = false;
                    A.State.notify();
                    currentActorId = null;
                    refreshSidebar();
                    refreshMain();
                }
            };
            main.appendChild(header);

            // -- Content Scroll Area --
            const content = document.createElement('div');
            content.style.flex = '1';
            content.style.overflowY = 'auto';
            content.style.padding = '20px';
            content.style.display = 'flex';
            content.style.flexDirection = 'column';
            content.style.gap = '24px';
            main.appendChild(content);

            // 1. Details Section (Class, Abilities, Equipment)
            const detailsSection = document.createElement('div');
            detailsSection.style.display = 'grid';
            detailsSection.style.gridTemplateColumns = '1fr 1fr';
            detailsSection.style.gap = '16px';

            // Class & Abilities
            const leftCol = document.createElement('div');
            leftCol.style.display = 'flex';
            leftCol.style.flexDirection = 'column';
            leftCol.style.gap = '16px';

            // Level & XP Row
            const lvlRow = document.createElement('div');
            lvlRow.style.display = 'grid';
            lvlRow.style.gridTemplateColumns = '1fr 1fr 1fr';
            lvlRow.style.gap = '12px';

            // Level
            const lvlDiv = document.createElement('div');
            lvlDiv.innerHTML = `<label class="l-lab">Level</label>`;
            const lvlInput = document.createElement('input');
            lvlInput.className = 'input';
            lvlInput.type = 'number';
            lvlInput.style.width = '100%';
            lvlInput.value = actor.data.rpg.stats?.level || 1;
            lvlInput.onchange = (e) => {
                if (!actor.data.rpg.stats) actor.data.rpg.stats = {};
                actor.data.rpg.stats.level = parseInt(e.target.value);
                // Also update header display if present
                const hLvl = header.querySelector('.lvl-badge');
                if (hLvl) hLvl.textContent = `Lvl ${actor.data.rpg.stats.level}`;
                A.State.notify();
            };
            lvlDiv.appendChild(lvlInput);
            lvlRow.appendChild(lvlDiv);

            // XP
            const xpDiv = document.createElement('div');
            xpDiv.innerHTML = `<label class="l-lab">Current XP</label>`;
            const xpInput = document.createElement('input');
            xpInput.className = 'input';
            xpInput.style.width = '100%';
            xpInput.value = actor.data.rpg.stats?.xp || 0;
            xpInput.onchange = (e) => {
                if (!actor.data.rpg.stats) actor.data.rpg.stats = {};
                actor.data.rpg.stats.xp = e.target.value;
                A.State.notify();
            };
            xpDiv.appendChild(xpInput);
            lvlRow.appendChild(xpDiv);

            // Next XP
            const nextXpDiv = document.createElement('div');
            nextXpDiv.innerHTML = `<label class="l-lab">Next Level</label>`;
            const nextXpInput = document.createElement('input');
            nextXpInput.className = 'input';
            nextXpInput.style.width = '100%';
            nextXpInput.value = actor.data.rpg.stats?.xp_next || 1000;
            nextXpInput.onchange = (e) => {
                if (!actor.data.rpg.stats) actor.data.rpg.stats = {};
                actor.data.rpg.stats.xp_next = e.target.value;
                A.State.notify();
            };
            nextXpDiv.appendChild(nextXpInput);
            lvlRow.appendChild(nextXpDiv);

            leftCol.appendChild(lvlRow);

            // Combat Stats (HP, MP, AC, Str)
            const combatRow = document.createElement('div');
            combatRow.style.display = 'grid';
            combatRow.style.gridTemplateColumns = 'repeat(6, 1fr)';
            combatRow.style.gap = '8px';
            combatRow.style.padding = '8px';
            combatRow.style.background = 'var(--bg-elevated)';
            combatRow.style.borderRadius = '6px';
            combatRow.style.marginBottom = '8px';

            const createStatInput = (label, key, defaultVal = 0) => {
                const div = document.createElement('div');
                div.innerHTML = `<label class="l-lab" style="font-size:10px;">${label}</label>`;
                const inp = document.createElement('input');
                inp.className = 'input';
                inp.type = 'number';
                inp.style.width = '100%';
                // Check if value exists, allow 0
                const val = actor.data.rpg[key];
                inp.value = val !== undefined ? val : defaultVal;
                inp.onchange = (e) => {
                    actor.data.rpg[key] = parseInt(e.target.value);
                    A.State.notify();
                };
                div.appendChild(inp);
                return div;
            };

            combatRow.appendChild(createStatInput('HP', 'hp', 20));
            combatRow.appendChild(createStatInput('Max HP', 'maxHp', 20));
            combatRow.appendChild(createStatInput('MP', 'mp', 3));
            combatRow.appendChild(createStatInput('Max MP', 'maxMp', 3));
            combatRow.appendChild(createStatInput('AC', 'ac', 10));
            combatRow.appendChild(createStatInput('Str Mod', 'str', 0));

            leftCol.appendChild(combatRow);

            // -- GEAR & INVENTORY --
            const gearSection = document.createElement('div');
            gearSection.style.padding = '16px';
            gearSection.style.borderTop = '1px solid var(--border-subtle)';

            // Data Init
            if (!actor.data.rpg.inventory) actor.data.rpg.inventory = [];
            if (!actor.data.rpg.equipped) actor.data.rpg.equipped = { main_hand: null, off_hand: null, armor: null };

            gearSection.innerHTML = `
                <div class="panel-toolbar" style="margin-bottom:12px; display:flex; justify-content:space-between; align-items:center;">
                    <h3 style="margin:0; font-size:14px; font-weight:bold;">🎒 Gear & Inventory</h3>
                    <button class="btn btn-sm btn-secondary" id="btn-add-item">+ Add Item</button>
                </div>
                <!-- Equipped Slots -->
                <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:8px; margin-bottom:16px;">
                    <div class="stat-box" style="text-align:center; padding:8px; background:var(--bg-elevated); border-radius:6px;">
                        <div style="font-size:10px; color:var(--text-muted); text-transform:uppercase;">Main Hand</div>
                        <div id="slot-main" style="font-weight:bold; font-size:12px;">-</div>
                    </div>
                    <div class="stat-box" style="text-align:center; padding:8px; background:var(--bg-elevated); border-radius:6px;">
                        <div style="font-size:10px; color:var(--text-muted); text-transform:uppercase;">Off Hand</div>
                        <div id="slot-off" style="font-weight:bold; font-size:12px;">-</div>
                    </div>
                    <div class="stat-box" style="text-align:center; padding:8px; background:var(--bg-elevated); border-radius:6px;">
                        <div style="font-size:10px; color:var(--text-muted); text-transform:uppercase;">Armor</div>
                        <div id="slot-armor" style="font-weight:bold; font-size:12px;">-</div>
                    </div>
                </div>

                <!-- Inventory List -->
                <div id="inv-list" style="display:flex; flex-direction:column; gap:6px;"></div>
            `;

            content.appendChild(gearSection);

            // -- Logic: Render Items --
            const updateInventoryUI = () => {
                const invList = gearSection.querySelector('#inv-list');
                const slotMain = gearSection.querySelector('#slot-main');
                const slotOff = gearSection.querySelector('#slot-off');
                const slotArmor = gearSection.querySelector('#slot-armor');

                // Update Slots Display
                const getItemName = (id) => {
                    if (!id) return '-';
                    const armory = A.State.get().rpg?.items || [];
                    const itm = armory.find(i => i.id === id);
                    return itm ? itm.name : id; // Fallback to ID
                };
                slotMain.textContent = getItemName(actor.data.rpg.equipped.main_hand);
                slotOff.textContent = getItemName(actor.data.rpg.equipped.off_hand);
                slotArmor.textContent = getItemName(actor.data.rpg.equipped.armor);

                // Render List
                invList.innerHTML = '';
                if (actor.data.rpg.inventory.length === 0) {
                    invList.innerHTML = '<div style="color:var(--text-muted); font-size:11px; font-style:italic;">Backpack is empty.</div>';
                }

                actor.data.rpg.inventory.forEach(itemId => {
                    const armory = A.State.get().rpg?.items || [];
                    const itemData = armory.find(i => i.id === itemId) || { name: 'Unknown Item', type: 'misc', id: itemId };

                    const row = document.createElement('div');
                    row.className = 'list-item';
                    row.style.display = 'flex';
                    row.style.justifyContent = 'space-between';
                    row.style.alignItems = 'center';
                    row.style.padding = '8px';
                    row.style.background = 'var(--bg-base)';
                    row.style.borderRadius = '4px';

                    // Determine State
                    const isMain = actor.data.rpg.equipped.main_hand === itemId;
                    const isOff = actor.data.rpg.equipped.off_hand === itemId;
                    const isArmor = actor.data.rpg.equipped.armor === itemId;
                    const isEquipped = isMain || isOff || isArmor;

                    let stateLabel = '';
                    if (isMain) stateLabel = '<span style="color:var(--accent-primary); font-size:10px; font-weight:bold; border:1px solid currentColor; padding:1px 4px; border-radius:4px;">Main</span>';
                    if (isOff) stateLabel = '<span style="color:var(--accent-secondary); font-size:10px; font-weight:bold; border:1px solid currentColor; padding:1px 4px; border-radius:4px;">Off</span>';
                    if (isArmor) stateLabel = '<span style="color:var(--status-success); font-size:10px; font-weight:bold; border:1px solid currentColor; padding:1px 4px; border-radius:4px;">Worn</span>';

                    row.innerHTML = `
                        <div style="display:flex; align-items:center; gap:8px;">
                            <span style="font-size:14px;">${itemData.type === 'weapon' ? '⚔️' : (itemData.type === 'armor' ? '🛡️' : '📦')}</span>
                            <span style="font-size:12px; font-weight:bold;">${itemData.name}</span>
                            ${stateLabel}
                        </div>
                        <div style="display:flex; gap:6px;">
                            ${itemData.type === 'weapon' || itemData.type === 'armor' ?
                            `<button class="btn btn-xs btn-ghost btn-equip" style="font-size:10px;">${isEquipped ? 'Unequip' : 'Equip'}</button>` : ''}
                            <button class="btn btn-xs btn-ghost btn-drop" style="color:var(--status-error); font-size:10px;">Drop</button>
                        </div>
                    `;

                    // Actions
                    const btnEquip = row.querySelector('.btn-equip');
                    if (btnEquip) {
                        btnEquip.onclick = () => {
                            if (isEquipped) {
                                // Unequip Logic
                                if (isMain) actor.data.rpg.equipped.main_hand = null;
                                if (isOff) actor.data.rpg.equipped.off_hand = null;
                                if (isArmor) actor.data.rpg.equipped.armor = null;
                                A.State.notify();
                                updateInventoryUI();
                            } else {
                                // Equip Logic
                                if (itemData.type === 'weapon') {
                                    // Cycle: Main -> Off -> Full
                                    if (!actor.data.rpg.equipped.main_hand) {
                                        actor.data.rpg.equipped.main_hand = itemId;
                                    } else if (!actor.data.rpg.equipped.off_hand) {
                                        actor.data.rpg.equipped.off_hand = itemId;
                                    } else {
                                        // Swap Main
                                        actor.data.rpg.equipped.main_hand = itemId;
                                    }
                                } else if (itemData.type === 'armor') {
                                    // Swap Armor
                                    actor.data.rpg.equipped.armor = itemId;
                                }
                                A.State.notify();
                                updateInventoryUI();
                            }
                        };
                    }

                    row.querySelector('.btn-drop').onclick = () => {
                        if (confirm(`Drop ${itemData.name}?`)) {
                            // Unequip first if needed
                            if (isMain) actor.data.rpg.equipped.main_hand = null;
                            if (isOff) actor.data.rpg.equipped.off_hand = null;
                            if (isArmor) actor.data.rpg.equipped.armor = null;

                            // Remove from inventory array (find first instance if duplicates exist, though basic ID array removes all if filtered. Let's splice index)
                            const idx = actor.data.rpg.inventory.indexOf(itemId);
                            if (idx > -1) actor.data.rpg.inventory.splice(idx, 1);

                            A.State.notify();
                            updateInventoryUI();
                        }
                    };

                    invList.appendChild(row);
                });
            };

            // Initial UI Update
            updateInventoryUI();

            // Add Item Handler
            gearSection.querySelector('#btn-add-item').onclick = () => {
                const armory = A.State.get().rpg?.items || [];
                if (armory.length === 0) {
                    alert("Armory is empty. Define items in the Game Master panel first.");
                    return;
                }

                // Simple Prompt for MVP (Better: Modal Picker)
                // Let's create a temporary overlay picker
                const picker = document.createElement('div');
                picker.style.position = 'absolute';
                picker.style.top = '0'; picker.style.left = '0'; picker.style.right = '0'; picker.style.bottom = '0';
                picker.style.background = 'rgba(0,0,0,0.8)';
                picker.style.display = 'flex';
                picker.style.alignItems = 'center';
                picker.style.justifyContent = 'center';
                picker.style.zIndex = '100';

                const card = document.createElement('div');
                card.className = 'card';
                card.style.width = '300px';
                card.style.maxHeight = '400px';
                card.style.display = 'flex';
                card.style.flexDirection = 'column';
                card.style.padding = '12px';
                card.style.gap = '8px';

                card.innerHTML = `
                    <div style="font-weight:bold; border-bottom:1px solid var(--border-subtle); padding-bottom:8px;">Add to Inventory</div>
                    <input class="input" placeholder="Search Armory..." id="picker-search">
                    <div id="picker-list" style="flex:1; overflow-y:auto; min-height:100px;"></div>
                    <button class="btn btn-sm btn-ghost" id="picker-close" style="margin-top:8px;">Cancel</button>
                `;

                const renderPicker = (filter = "") => {
                    const list = card.querySelector('#picker-list');
                    list.innerHTML = '';
                    armory.filter(i => i.name.toLowerCase().includes(filter.toLowerCase())).forEach(item => {
                        const row = document.createElement('div');
                        row.className = 'list-item';
                        row.style.padding = '6px';
                        row.style.cursor = 'pointer';
                        row.style.fontSize = '12px';
                        row.innerHTML = `<b>${item.name}</b> <span style="opacity:0.7">(${item.type})</span>`;
                        row.onclick = () => {
                            actor.data.rpg.inventory.push(item.id);
                            A.State.notify();
                            updateInventoryUI();
                            document.body.removeChild(picker);
                        };
                        list.appendChild(row);
                    });
                };

                card.querySelector('#picker-search').oninput = (e) => renderPicker(e.target.value);
                card.querySelector('#picker-close').onclick = () => document.body.removeChild(picker);

                renderPicker();
                picker.appendChild(card);
                document.body.appendChild(picker);
            };

            // Class Input
            const classDiv = document.createElement('div');
            classDiv.innerHTML = `<label class="l-lab">Class / Profession</label>`;
            const classInput = document.createElement('input');
            classInput.className = 'input';
            classInput.style.width = '100%';
            classInput.value = actor.data.rpg.stats?.class || '';
            classInput.placeholder = 'e.g. Wizard';
            classInput.onchange = (e) => {
                if (!actor.data.rpg.stats) actor.data.rpg.stats = {};
                actor.data.rpg.stats.class = e.target.value;
                A.State.notify();
            };
            classDiv.appendChild(classInput);
            leftCol.appendChild(classDiv);

            // Starting Equipment
            const equipDiv = document.createElement('div');
            equipDiv.innerHTML = `<label class="l-lab">Starting Equipment</label>`;
            const equipArea = document.createElement('textarea');
            equipArea.className = 'input';
            equipArea.style.width = '100%';
            equipArea.style.minHeight = '80px';
            equipArea.style.resize = 'vertical';
            equipArea.value = actor.data.rpg.equipment_text || ''; // Use a text field for now
            equipArea.placeholder = 'e.g. Iron Sword, Leather Armor, 5 Potions...';
            equipArea.onchange = (e) => {
                actor.data.rpg.equipment_text = e.target.value;
                A.State.notify();
            };
            equipDiv.appendChild(equipArea);
            leftCol.appendChild(equipDiv);

            // Abilities
            const abilDiv = document.createElement('div');
            abilDiv.innerHTML = `<label class="l-lab">Abilities / Feats</label>`;
            const abilArea = document.createElement('textarea');
            abilArea.className = 'input';
            abilArea.style.width = '100%';
            abilArea.style.minHeight = '80px';
            abilArea.style.resize = 'vertical';
            abilArea.value = actor.data.rpg.abilities_text || '';
            abilArea.placeholder = 'e.g. Fireball, Sneak Attack...';
            abilArea.onchange = (e) => {
                actor.data.rpg.abilities_text = e.target.value;
                A.State.notify();
            };
            abilDiv.appendChild(abilArea);
            leftCol.appendChild(abilDiv);

            detailsSection.appendChild(leftCol);

            // Radar & Stats Overview
            const rightCol = document.createElement('div');
            rightCol.style.display = 'flex';
            rightCol.style.alignItems = 'center';
            rightCol.style.justifyContent = 'center';
            rightCol.style.background = 'var(--bg-surface)';
            rightCol.style.borderRadius = 'var(--radius-lg)';
            rightCol.style.padding = '16px';
            rightCol.id = 'radar-container';
            detailsSection.appendChild(rightCol);

            content.appendChild(detailsSection);

            // 2. Stats Matrix Blocks
            const statsSection = document.createElement('div');
            statsSection.style.marginTop = '16px';

            if (matrix.blocks.length > 0) {
                matrix.blocks.forEach((block, bIdx) => {
                    // Ensure values
                    if (!matrix.values[block.id]) matrix.values[block.id] = {};
                    const vals = matrix.values[block.id];

                    const blockDiv = document.createElement('div');
                    blockDiv.className = 'card';
                    blockDiv.style.padding = '16px';
                    blockDiv.style.marginBottom = '16px';
                    blockDiv.innerHTML = `
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; border-bottom:1px solid var(--border-subtle); padding-bottom:8px;">
                            <h3 style="margin:0; font-size:14px; font-weight:bold;">${block.label}</h3>
                            <button class="btn btn-sm btn-ghost btn-del-blk" data-idx="${bIdx}" style="color:var(--status-error);">Remove</button>
                        </div>
                     `;

                    const grid = document.createElement('div');
                    grid.style.display = 'grid';
                    grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(140px, 1fr))';
                    grid.style.gap = '12px';

                    block.defs.forEach(def => {
                        const val = vals[def.key] !== undefined ? vals[def.key] : (def.min || 10);
                        const item = document.createElement('div');
                        item.style.background = 'var(--bg-base)';
                        item.style.padding = '8px';
                        item.style.borderRadius = '4px';

                        item.innerHTML = `
                            <div style="display:flex; justify-content:space-between; font-size:11px; margin-bottom:4px;">
                                <span style="font-weight:600;">${def.label}</span>
                                <span class="val-disp">${val}</span>
                            </div>
                            <input type="range" class="rpg-stat-slider" min="${def.min}" max="${def.max}" value="${val}" style="width:100%;">
                        `;
                        const inp = item.querySelector('input');
                        inp.oninput = (e) => {
                            vals[def.key] = parseFloat(e.target.value);
                            item.querySelector('.val-disp').textContent = vals[def.key];
                            // Debounce notify? For now direct
                            A.State.notify();
                            updateRadar(rightCol);
                        };
                        grid.appendChild(item);
                    });

                    blockDiv.appendChild(grid);
                    statsSection.appendChild(blockDiv);
                });
            } else {
                statsSection.innerHTML = `<div style="text-align:center; padding:20px; color:var(--text-muted); font-style:italic;">No custom stats defined. Add a stats block above to customize.</div>`;
            }

            content.appendChild(statsSection);

            // -- Handlers --

            // Add D&D
            header.querySelector('#act-add-dnd').onclick = () => {
                if (matrix.blocks.find(b => b.id === 'dnd')) {
                    alert('D20 Stats block already exists.'); return;
                }
                const tpl = TEMPLATES['dnd'];
                matrix.blocks.push({ id: 'dnd', label: tpl.label, defs: JSON.parse(JSON.stringify(tpl.defs)) });
                matrix.values['dnd'] = { ...tpl.defaults };
                A.State.notify();
                refreshMain();
            };

            // Add Custom
            header.querySelector('#act-add-custom').onclick = () => {
                const name = prompt("Stat Block Name (e.g. 'Social Skills'):");
                if (!name) return;
                let blockId = name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
                if (!blockId) blockId = 'custom';
                // Unique check
                let oid = blockId, s = 1;
                while (matrix.blocks.find(b => b.id === blockId)) blockId = oid + '_' + s++;

                const countStr = prompt("How many stats?");
                const count = parseInt(countStr);
                if (isNaN(count) || count < 1) return;

                const defs = [];
                const dvals = {};

                for (let i = 0; i < count; i++) {
                    const l = prompt(`Label for Stat #${i + 1}`);
                    if (!l) continue;
                    const k = l.substring(0, 4).toUpperCase().replace(/[^A-Z]/g, '') || `S${i}`;
                    defs.push({ key: k, label: l, min: 0, max: 20 });
                    dvals[k] = 10;
                }

                matrix.blocks.push({ id: blockId, label: name, defs: defs });
                matrix.values[blockId] = dvals;
                A.State.notify();
                refreshMain();
            };

            // Remove Block
            content.querySelectorAll('.btn-del-blk').forEach(btn => {
                btn.onclick = (e) => {
                    if (confirm('Remove this stat block?')) {
                        const idx = parseInt(e.target.dataset.idx);
                        matrix.blocks.splice(idx, 1);
                        A.State.notify();
                        refreshMain();
                    }
                };
            });

            // Initial Radar Render
            updateRadar(rightCol);
        }

        function updateRadar(container) {
            const members = getPartyMembers();
            const actor = members.find(a => a.id === currentActorId);
            if (!actor || !actor.data.rpg.stats_matrix || actor.data.rpg.stats_matrix.blocks.length === 0) {
                container.innerHTML = '<div style="color:var(--text-muted); font-size:11px;">Add Stats to view Chart</div>';
                return;
            }

            // Visualize the first block for now
            const matrix = actor.data.rpg.stats_matrix;
            const block = matrix.blocks[0]; // Default to first
            if (!block) return;

            const vals = matrix.values[block.id] || {};
            const labels = block.defs.map(d => d.label);
            const values = block.defs.map(d => (vals[d.key] !== undefined ? vals[d.key] : (d.min || 0)));
            const min = block.defs[0].min || 0;
            const max = block.defs[0].max || 20;

            container.innerHTML = AxisRadar.renderRadar(300, 300, labels, values, min, max);
        }

        // Init
        refreshSidebar();

    }

    A.registerPanel('rpg_party', {
        label: 'Party',
        subtitle: 'Setup & Equipment',
        category: 'RPG Experiment',
        icon: '🛡️',
        render: render
    });

})(window.Anansi);
