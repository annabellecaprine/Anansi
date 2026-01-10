/*
 * Anansi Panel: Armory
 * File: js/panels/rpg_armory.js
 * Category: RPG Experiment
 * Purpose: Setting-agnostic item database (Weapons, Armor, Consumables, Gear).
 */

(function (A) {
    'use strict';

    // Item type definitions with icons
    const ITEM_TYPES = {
        weapon: { label: 'Weapon', icon: '⚔️', color: 'var(--status-error)' },
        armor: { label: 'Armor', icon: '🛡️', color: 'var(--accent-primary)' },
        consumable: { label: 'Consumable', icon: '🧪', color: 'var(--status-success)' },
        tool: { label: 'Tool', icon: '🔧', color: 'var(--status-warning)' },
        ammo: { label: 'Ammunition', icon: '🎯', color: 'var(--text-muted)' },
        implant: { label: 'Implant/Mod', icon: '⚙️', color: 'var(--accent-secondary)' },
        misc: { label: 'Misc', icon: '📦', color: 'var(--text-secondary)' }
    };

    // Weapon categories for different settings
    const WEAPON_CATEGORIES = {
        melee: { label: 'Melee', examples: 'Sword, Knife, Axe, Bat, Vibroblade' },
        ranged: { label: 'Ranged', examples: 'Bow, Crossbow, Thrown' },
        firearm: { label: 'Firearm', examples: 'Pistol, Rifle, SMG, Shotgun' },
        energy: { label: 'Energy', examples: 'Laser, Plasma, Particle Beam' },
        explosive: { label: 'Explosive', examples: 'Grenade, Rocket, Bomb' },
        magic: { label: 'Magic/Tech', examples: 'Wand, Staff, Tech Device' }
    };

    // Default items covering multiple genres
    const DEFAULT_ARMORY = [
        // Fantasy
        { id: 'wpn_longsword', name: 'Longsword', type: 'weapon', category: 'melee', dmg: '1d8', cost: 15, rarity: 'common', tags: ['slashing', 'versatile'], desc: 'A versatile martial blade.' },
        { id: 'wpn_dagger', name: 'Dagger', type: 'weapon', category: 'melee', dmg: '1d4', cost: 2, rarity: 'common', tags: ['piercing', 'finesse', 'light', 'thrown'], desc: 'Simple finesse weapon for close combat or throwing.' },
        { id: 'wpn_longbow', name: 'Longbow', type: 'weapon', category: 'ranged', dmg: '1d8', cost: 50, rarity: 'common', range: 150, tags: ['piercing', 'heavy', 'two-handed'], desc: 'A tall bow made of yew or ash.' },
        { id: 'arm_chainmail', name: 'Chainmail', type: 'armor', ac: 6, cost: 75, rarity: 'common', tags: ['medium'], desc: 'Interlocking metal rings offer decent protection.' },
        { id: 'arm_plate', name: 'Plate Armor', type: 'armor', ac: 8, cost: 1500, rarity: 'rare', tags: ['heavy', 'disadvantage-stealth'], desc: 'Full plate armor with maximum protection.' },
        { id: 'itm_potion_health', name: 'Health Potion', type: 'consumable', effect: '2d4+2', effectType: 'heal', cost: 50, rarity: 'common', desc: 'Red liquid that restores health when consumed.' },
        { id: 'itm_potion_mana', name: 'Mana Potion', type: 'consumable', effect: '1d4+1', effectType: 'restore_mp', cost: 75, rarity: 'common', desc: 'Blue liquid that restores magical energy.' },

        // Modern/Cyberpunk
        { id: 'wpn_pistol', name: 'Pistol', type: 'weapon', category: 'firearm', dmg: '2d6', cost: 200, rarity: 'common', range: 50, ammoType: '9mm', tags: ['ballistic', 'light'], desc: 'Standard semi-automatic handgun.' },
        { id: 'wpn_rifle', name: 'Assault Rifle', type: 'weapon', category: 'firearm', dmg: '2d8', cost: 800, rarity: 'uncommon', range: 300, ammoType: '5.56mm', tags: ['ballistic', 'two-handed', 'automatic'], desc: 'Military-grade automatic rifle.' },
        { id: 'wpn_shotgun', name: 'Shotgun', type: 'weapon', category: 'firearm', dmg: '2d10', cost: 400, rarity: 'common', range: 30, ammoType: '12-gauge', tags: ['ballistic', 'spread', 'two-handed'], desc: 'Devastating at close range.' },
        { id: 'wpn_smg', name: 'SMG', type: 'weapon', category: 'firearm', dmg: '2d4', cost: 600, rarity: 'uncommon', range: 40, ammoType: '9mm', tags: ['ballistic', 'automatic', 'burst'], desc: 'Compact submachine gun with high rate of fire.' },
        { id: 'arm_kevlar', name: 'Kevlar Vest', type: 'armor', ac: 3, cost: 300, rarity: 'common', tags: ['light', 'concealable'], desc: 'Ballistic vest providing basic protection against bullets.' },
        { id: 'arm_combat', name: 'Combat Armor', type: 'armor', ac: 5, cost: 1200, rarity: 'uncommon', tags: ['medium', 'tactical'], desc: 'Military-grade body armor with armor plates.' },
        { id: 'itm_medkit', name: 'Medkit', type: 'consumable', effect: '2d6+4', effectType: 'heal', cost: 100, rarity: 'common', desc: 'First aid supplies for treating injuries.' },
        { id: 'itm_stim', name: 'Stim Pack', type: 'consumable', effect: '1d8', effectType: 'heal', cost: 50, rarity: 'common', desc: 'Quick injection that provides immediate healing.' },

        // Sci-Fi
        { id: 'wpn_laser_pistol', name: 'Laser Pistol', type: 'weapon', category: 'energy', dmg: '2d6', cost: 500, rarity: 'uncommon', range: 100, tags: ['energy', 'light'], desc: 'Standard energy sidearm.' },
        { id: 'wpn_plasma_rifle', name: 'Plasma Rifle', type: 'weapon', category: 'energy', dmg: '3d8', cost: 2000, rarity: 'rare', range: 150, tags: ['energy', 'two-handed', 'heat'], desc: 'High-powered plasma weapon.' },
        { id: 'arm_power', name: 'Power Armor', type: 'armor', ac: 10, cost: 10000, rarity: 'legendary', tags: ['powered', 'heavy', 'strength-bonus'], desc: 'Powered exoskeleton providing superior protection and enhanced strength.' },

        // Tools and Misc
        { id: 'tool_lockpick', name: 'Lockpicks', type: 'tool', cost: 25, rarity: 'common', desc: 'Set of tools for picking locks.' },
        { id: 'tool_rope', name: 'Rope (50ft)', type: 'misc', cost: 1, rarity: 'common', desc: 'Hemp or synthetic rope, useful for climbing or binding.' },
        { id: 'ammo_9mm', name: '9mm Ammo (30)', type: 'ammo', cost: 15, rarity: 'common', ammoType: '9mm', quantity: 30, desc: 'Standard 9mm ammunition.' },
        { id: 'ammo_arrows', name: 'Arrows (20)', type: 'ammo', cost: 5, rarity: 'common', ammoType: 'arrow', quantity: 20, desc: 'Standard arrows for bows.' }
    ];

    const RARITY_COLORS = {
        common: 'var(--text-secondary)',
        uncommon: 'var(--status-success)',
        rare: 'var(--accent-primary)',
        epic: 'var(--accent-secondary)',
        legendary: 'var(--status-warning)'
    };

    function render(container) {
        container.style.display = 'grid';
        container.style.gridTemplateColumns = '300px 1fr';
        container.style.height = '100%';
        container.style.gap = '1px';
        container.style.background = 'var(--border-subtle)';

        const state = A.State.get();
        if (!state.rpg) state.rpg = { enabled: true };
        if (!state.rpg.items || state.rpg.items.length === 0) {
            state.rpg.items = JSON.parse(JSON.stringify(DEFAULT_ARMORY));
        }

        // --- Left: Item List ---
        const leftCol = document.createElement('div');
        leftCol.style.cssText = 'background:var(--bg-base); display:flex; flex-direction:column; overflow:hidden;';

        leftCol.innerHTML = `
            <div class="panel-toolbar" style="padding:12px; border-bottom:1px solid var(--border-subtle); display:flex; justify-content:space-between; align-items:center;">
                <span style="font-weight:bold;">⚔️ Armory</span>
                <button class="btn btn-xs btn-primary" id="btn-create-item">+ New</button>
            </div>
            <div style="padding:8px; border-bottom:1px solid var(--border-subtle);">
                <input class="input" id="search-armory" placeholder="Search items..." style="width:100%;">
            </div>
            <div style="padding:8px; border-bottom:1px solid var(--border-subtle); display:flex; gap:4px; flex-wrap:wrap;">
                <button class="filter-btn btn btn-xs" data-filter="all">All</button>
                ${Object.entries(ITEM_TYPES).map(([key, val]) =>
            `<button class="filter-btn btn btn-xs btn-ghost" data-filter="${key}">${val.icon}</button>`
        ).join('')}
            </div>
            <div id="armory-list" style="flex:1; overflow-y:auto; padding:8px;"></div>
        `;
        container.appendChild(leftCol);

        // --- Right: Details Editor ---
        const rightCol = document.createElement('div');
        rightCol.style.cssText = 'background:var(--bg-base); display:flex; flex-direction:column; overflow:hidden;';
        rightCol.innerHTML = `
            <div id="item-editor-empty" style="flex:1; display:flex; align-items:center; justify-content:center; color:var(--text-muted); font-style:italic;">
                Select an item to edit details.
            </div>
            <div id="item-editor" style="display:none; flex-direction:column; height:100%;"></div>
        `;
        container.appendChild(rightCol);

        let selectedId = null;
        let filterType = 'all';

        const renderList = () => {
            const listEl = leftCol.querySelector('#armory-list');
            const search = leftCol.querySelector('#search-armory').value.toLowerCase();
            listEl.innerHTML = '';

            const items = state.rpg.items
                .filter(i => filterType === 'all' || i.type === filterType)
                .filter(i => !search || i.name.toLowerCase().includes(search) || (i.tags || []).some(t => t.includes(search)));

            if (items.length === 0) {
                listEl.innerHTML = '<div style="color:var(--text-muted); text-align:center; padding:20px; font-style:italic;">No items found.</div>';
                return;
            }

            items.forEach(item => {
                const typeInfo = ITEM_TYPES[item.type] || ITEM_TYPES.misc;
                const rarityColor = RARITY_COLORS[item.rarity] || RARITY_COLORS.common;
                const isSelected = item.id === selectedId;

                const el = document.createElement('div');
                el.style.cssText = `
                    padding:10px 12px; cursor:pointer; border-radius:6px; margin-bottom:4px;
                    background:${isSelected ? 'var(--bg-elevated)' : 'transparent'};
                    border:2px solid ${isSelected ? 'var(--accent-primary)' : 'transparent'};
                `;

                const statLine = item.type === 'weapon' ? `DMG: ${item.dmg || '-'}` :
                    item.type === 'armor' ? `AC: +${item.ac || 0}` :
                        item.type === 'consumable' ? `Effect: ${item.effect || '-'}` : '';

                el.innerHTML = `
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                        <span style="font-size:13px; font-weight:bold; color:${isSelected ? 'var(--accent-primary)' : 'var(--text-primary)'};">
                            ${typeInfo.icon} ${item.name}
                        </span>
                        <span style="font-size:10px; color:${rarityColor}; text-transform:capitalize;">${item.rarity || 'common'}</span>
                    </div>
                    <div style="font-size:10px; color:var(--text-muted); display:flex; justify-content:space-between;">
                        <span>${item.category || item.type}</span>
                        <span>${statLine}</span>
                    </div>
                `;

                if (!isSelected) {
                    el.onmouseenter = () => el.style.background = 'var(--bg-hover)';
                    el.onmouseleave = () => el.style.background = 'transparent';
                }

                el.onclick = () => {
                    selectedId = item.id;
                    renderList();
                    loadEditor();
                };
                listEl.appendChild(el);
            });
        };

        const loadEditor = () => {
            const item = state.rpg.items.find(i => i.id === selectedId);
            const emptyEnv = rightCol.querySelector('#item-editor-empty');
            const editorEnv = rightCol.querySelector('#item-editor');

            if (!item) {
                emptyEnv.style.display = 'flex';
                editorEnv.style.display = 'none';
                return;
            }

            emptyEnv.style.display = 'none';
            editorEnv.style.display = 'flex';

            editorEnv.innerHTML = `
                <div class="panel-toolbar" style="padding:12px 16px; border-bottom:1px solid var(--border-subtle); display:flex; justify-content:space-between;">
                    <strong id="editor-title">${item.name}</strong>
                    <div style="display:flex; gap:8px;">
                        <button class="btn btn-xs btn-ghost" id="btn-duplicate" title="Duplicate item">📋</button>
                        <button class="btn btn-xs btn-ghost" style="color:var(--status-error);" id="btn-del-item">🗑️ Delete</button>
                    </div>
                </div>
                <div style="flex:1; overflow-y:auto; padding:20px;">
                    <!-- Basic Info -->
                    <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; margin-bottom:20px;">
                        <div>
                            <label class="label">Name</label>
                            <input class="input" id="edit-name" value="${item.name || ''}" style="width:100%;">
                        </div>
                        <div>
                            <label class="label">Type</label>
                            <select class="input" id="edit-type" style="width:100%;">
                                ${Object.entries(ITEM_TYPES).map(([key, val]) =>
                `<option value="${key}" ${item.type === key ? 'selected' : ''}>${val.icon} ${val.label}</option>`
            ).join('')}
                            </select>
                        </div>
                        <div>
                            <label class="label">Rarity</label>
                            <select class="input" id="edit-rarity" style="width:100%;">
                                <option value="common" ${item.rarity === 'common' ? 'selected' : ''}>Common</option>
                                <option value="uncommon" ${item.rarity === 'uncommon' ? 'selected' : ''}>Uncommon</option>
                                <option value="rare" ${item.rarity === 'rare' ? 'selected' : ''}>Rare</option>
                                <option value="epic" ${item.rarity === 'epic' ? 'selected' : ''}>Epic</option>
                                <option value="legendary" ${item.rarity === 'legendary' ? 'selected' : ''}>Legendary</option>
                            </select>
                        </div>
                    </div>

                    <!-- Weapon Fields -->
                    <div id="weapon-fields" style="display:${item.type === 'weapon' ? 'block' : 'none'}; margin-bottom:20px; padding:16px; background:var(--bg-surface); border-radius:8px;">
                        <h4 style="margin:0 0 12px; font-size:12px; text-transform:uppercase; color:var(--text-muted);">⚔️ Weapon Stats</h4>
                        <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px;">
                            <div>
                                <label class="label">Damage</label>
                                <input class="input" id="edit-dmg" value="${item.dmg || ''}" style="width:100%;" placeholder="1d8">
                            </div>
                            <div>
                                <label class="label">Category</label>
                                <select class="input" id="edit-category" style="width:100%;">
                                    ${Object.entries(WEAPON_CATEGORIES).map(([key, val]) =>
                `<option value="${key}" ${item.category === key ? 'selected' : ''}>${val.label}</option>`
            ).join('')}
                                </select>
                            </div>
                            <div>
                                <label class="label">Range (ft)</label>
                                <input class="input" type="number" id="edit-range" value="${item.range || 0}" style="width:100%;">
                            </div>
                            <div>
                                <label class="label">Ammo Type</label>
                                <input class="input" id="edit-ammo" value="${item.ammoType || ''}" style="width:100%;" placeholder="9mm, arrow...">
                            </div>
                        </div>
                    </div>

                    <!-- Armor Fields -->
                    <div id="armor-fields" style="display:${item.type === 'armor' ? 'block' : 'none'}; margin-bottom:20px; padding:16px; background:var(--bg-surface); border-radius:8px;">
                        <h4 style="margin:0 0 12px; font-size:12px; text-transform:uppercase; color:var(--text-muted);">🛡️ Armor Stats</h4>
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                            <div>
                                <label class="label">AC Bonus</label>
                                <input class="input" type="number" id="edit-ac" value="${item.ac || 0}" style="width:100%;">
                            </div>
                        </div>
                    </div>

                    <!-- Consumable Fields -->
                    <div id="consumable-fields" style="display:${item.type === 'consumable' ? 'block' : 'none'}; margin-bottom:20px; padding:16px; background:var(--bg-surface); border-radius:8px;">
                        <h4 style="margin:0 0 12px; font-size:12px; text-transform:uppercase; color:var(--text-muted);">🧪 Effect</h4>
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                            <div>
                                <label class="label">Effect Dice</label>
                                <input class="input" id="edit-effect" value="${item.effect || ''}" style="width:100%;" placeholder="2d4+2">
                            </div>
                            <div>
                                <label class="label">Effect Type</label>
                                <select class="input" id="edit-effect-type" style="width:100%;">
                                    <option value="heal" ${item.effectType === 'heal' ? 'selected' : ''}>Heal HP</option>
                                    <option value="restore_mp" ${item.effectType === 'restore_mp' ? 'selected' : ''}>Restore MP/Energy</option>
                                    <option value="buff" ${item.effectType === 'buff' ? 'selected' : ''}>Buff/Boost</option>
                                    <option value="damage" ${item.effectType === 'damage' ? 'selected' : ''}>Damage</option>
                                    <option value="utility" ${item.effectType === 'utility' ? 'selected' : ''}>Utility</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <!-- Common Fields -->
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:20px;">
                        <div>
                            <label class="label">Cost</label>
                            <input class="input" type="number" id="edit-cost" value="${item.cost || 0}" style="width:100%;">
                        </div>
                        <div>
                            <label class="label">Weight</label>
                            <input class="input" type="number" id="edit-weight" value="${item.weight || 0}" style="width:100%;" step="0.1">
                        </div>
                    </div>

                    <!-- Tags -->
                    <div style="margin-bottom:20px;">
                        <label class="label">Tags (comma-separated)</label>
                        <input class="input" id="edit-tags" value="${(item.tags || []).join(', ')}" style="width:100%;" placeholder="melee, versatile, finesse...">
                    </div>

                    <!-- Description -->
                    <div>
                        <label class="label">Description</label>
                        <textarea class="input" id="edit-desc" rows="3" style="width:100%;">${item.desc || ''}</textarea>
                    </div>

                    <!-- ID Display -->
                    <div style="margin-top:16px; font-size:10px; color:var(--text-muted);">
                        ID: <span style="font-family:var(--font-mono);">${item.id}</span>
                    </div>
                </div>
            `;

            const q = (sel) => editorEnv.querySelector(sel);

            // Show/hide type-specific fields
            q('#edit-type').onchange = (e) => {
                item.type = e.target.value;
                q('#weapon-fields').style.display = e.target.value === 'weapon' ? 'block' : 'none';
                q('#armor-fields').style.display = e.target.value === 'armor' ? 'block' : 'none';
                q('#consumable-fields').style.display = e.target.value === 'consumable' ? 'block' : 'none';
                A.State.notify();
                renderList();
            };

            // Wire inputs
            q('#edit-name').oninput = (e) => { item.name = e.target.value; q('#editor-title').textContent = e.target.value; renderList(); };
            q('#edit-name').onchange = () => A.State.notify();
            q('#edit-rarity').onchange = (e) => { item.rarity = e.target.value; A.State.notify(); renderList(); };
            q('#edit-dmg').onchange = (e) => { item.dmg = e.target.value; A.State.notify(); };
            q('#edit-category').onchange = (e) => { item.category = e.target.value; A.State.notify(); };
            q('#edit-range').onchange = (e) => { item.range = parseInt(e.target.value) || 0; A.State.notify(); };
            q('#edit-ammo').onchange = (e) => { item.ammoType = e.target.value; A.State.notify(); };
            q('#edit-ac').onchange = (e) => { item.ac = parseInt(e.target.value) || 0; A.State.notify(); };
            q('#edit-effect').onchange = (e) => { item.effect = e.target.value; A.State.notify(); };
            q('#edit-effect-type').onchange = (e) => { item.effectType = e.target.value; A.State.notify(); };
            q('#edit-cost').onchange = (e) => { item.cost = parseInt(e.target.value) || 0; A.State.notify(); };
            q('#edit-weight').onchange = (e) => { item.weight = parseFloat(e.target.value) || 0; A.State.notify(); };
            q('#edit-tags').onchange = (e) => { item.tags = e.target.value.split(',').map(t => t.trim().toLowerCase()).filter(t => t); A.State.notify(); };
            q('#edit-desc').onchange = (e) => { item.desc = e.target.value; A.State.notify(); };

            q('#btn-del-item').onclick = () => {
                if (confirm(`Delete ${item.name}?`)) {
                    state.rpg.items = state.rpg.items.filter(i => i.id !== item.id);
                    selectedId = null;
                    A.State.notify();
                    renderList();
                    loadEditor();
                }
            };

            q('#btn-duplicate').onclick = () => {
                const newId = 'itm_' + Math.random().toString(36).substr(2, 6);
                const clone = JSON.parse(JSON.stringify(item));
                clone.id = newId;
                clone.name = item.name + ' (Copy)';
                state.rpg.items.push(clone);
                selectedId = newId;
                A.State.notify();
                renderList();
                loadEditor();
                if (A.UI.Toast) A.UI.Toast.show('Item duplicated', 'success');
            };
        };

        // Filter buttons
        leftCol.querySelectorAll('.filter-btn').forEach(btn => {
            btn.onclick = () => {
                filterType = btn.dataset.filter;
                leftCol.querySelectorAll('.filter-btn').forEach(b => {
                    b.classList.toggle('btn-ghost', b !== btn);
                });
                renderList();
            };
        });

        // Create item
        leftCol.querySelector('#btn-create-item').onclick = () => {
            const newId = 'itm_' + Math.random().toString(36).substr(2, 6);
            const newItem = {
                id: newId,
                name: 'New Item',
                type: 'misc',
                rarity: 'common',
                cost: 0,
                tags: [],
                desc: ''
            };
            state.rpg.items.push(newItem);
            selectedId = newId;
            A.State.notify();
            renderList();
            loadEditor();
            if (A.UI.Toast) A.UI.Toast.show('Item created', 'success');
        };

        leftCol.querySelector('#search-armory').oninput = () => renderList();

        renderList();
    }

    A.registerPanel('rpg_armory', {
        label: 'Armory',
        subtitle: 'Item Database',
        category: 'RPG Experiment',
        subcategory: 'Game Master',
        order: 50,
        icon: '⚔️',
        render: render
    });

})(window.Anansi);
