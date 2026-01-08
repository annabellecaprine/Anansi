/*
 * Anansi Panel: Armory
 * File: js/panels/rpg_armory.js
 * Category: RPG Experiment
 * Purpose: Global Item Database (Weapons, Armor, Consumables).
 * Future: Drag-and-drop to Actor Inventories.
 */

(function (A) {
    'use strict';

    // Default Items
    const DEFAULT_ARMORY = [
        { id: 'wpn_longsword', name: 'Longsword', type: 'weapon', dmg: '1d8', cost: 15, desc: 'Versatile martial blade.' },
        { id: 'wpn_dagger', name: 'Dagger', type: 'weapon', dmg: '1d4', cost: 2, desc: 'Simple finesse weapon.' },
        { id: 'arm_plate', name: 'Plate Armor', type: 'armor', ac: 8, cost: 1500, desc: 'Heavy protection.' },
        { id: 'itm_potion', name: 'Healing Potion', type: 'consumable', effect: '1d4+2', cost: 50, desc: 'Red liquid.' }
    ];

    function render(container) {
        // Layout
        container.style.display = 'grid';
        container.style.gridTemplateColumns = '250px 1fr';
        container.style.height = '100%';
        container.style.gap = '1px';
        container.style.background = 'var(--border-subtle)';

        // Ensure State
        const state = A.State.get();
        if (!state.rpg) state.rpg = { enabled: true };
        if (!state.rpg.items) state.rpg.items = JSON.parse(JSON.stringify(DEFAULT_ARMORY));

        // --- Left: Item List ---
        const leftCol = document.createElement('div');
        leftCol.style.background = 'var(--bg-base)';
        leftCol.style.display = 'flex';
        leftCol.style.flexDirection = 'column';
        leftCol.style.overflow = 'hidden';

        leftCol.innerHTML = `
            <div class="panel-toolbar" style="padding:12px; border-bottom:1px solid var(--border-subtle); display:flex; justify-content:space-between; align-items:center;">
                <span style="font-weight:bold;">⚔️ Armory</span>
                <button class="btn btn-xs btn-primary" id="btn-create-item">+</button>
            </div>
            <div style="padding:8px; border-bottom:1px solid var(--border-subtle);">
                <input class="input" id="search-armory" placeholder="Search..." style="width:100%;">
            </div>
            <div id="armory-list" style="flex:1; overflow-y:auto; padding:8px;"></div>
        `;
        container.appendChild(leftCol);

        // --- Right: Details Editor ---
        const rightCol = document.createElement('div');
        rightCol.style.background = 'var(--bg-base)';
        rightCol.style.display = 'flex';
        rightCol.style.flexDirection = 'column';
        rightCol.style.overflow = 'hidden';

        rightCol.innerHTML = `
            <div id="item-editor-empty" style="flex:1; display:flex; align-items:center; justify-content:center; color:var(--text-muted); font-style:italic;">
                Select an item to edit details.
            </div>
            <div id="item-editor" style="display:none; flex-direction:column; height:100%;">
                <!-- Toolbar -->
                <div class="panel-toolbar" style="padding:12px 16px; border-bottom:1px solid var(--border-subtle); display:flex; justify-content:space-between;">
                    <strong id="editor-title">Edit Item</strong>
                    <button class="btn btn-xs btn-ghost" style="color:var(--status-error);" id="btn-del-item">Delete</button>
                </div>
                
                <!-- Form -->
                <div style="flex:1; overflow-y:auto; padding:24px;">
                    <div class="form-row">
                        <div class="form-col">
                            <label class="field-label">Name</label>
                            <input class="input" id="edit-name">
                        </div>
                        <div class="form-col">
                            <label class="field-label">Type</label>
                            <select class="input" id="edit-type">
                                <option value="weapon">Weapon</option>
                                <option value="armor">Armor</option>
                                <option value="consumable">Consumable</option>
                                <option value="misc">Misc</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-row" style="margin-top:12px;">
                         <!-- Dynamic fields based on type? For now, just show common ones -->
                         <div class="form-col">
                            <label class="field-label">Damage / Effect</label>
                            <input class="input" id="edit-effect" placeholder="e.g. 1d8">
                         </div>
                         <div class="form-col">
                            <label class="field-label">AC Bonus</label>
                            <input class="input" type="number" id="edit-ac" placeholder="0">
                         </div>
                    </div>

                    <div class="form-row" style="margin-top:12px;">
                         <div class="form-col">
                            <label class="field-label">Cost (gp)</label>
                            <input class="input" type="number" id="edit-cost" placeholder="0">
                         </div>
                         <div class="form-col">
                            <label class="field-label">Weight</label>
                            <input class="input" type="number" id="edit-weight" placeholder="0">
                         </div>
                    </div>

                    <div style="margin-top:16px;">
                        <label class="field-label">Description</label>
                        <textarea class="input" id="edit-desc" rows="4"></textarea>
                    </div>

                    <div style="margin-top:16px; font-size:10px; color:var(--text-muted);">
                        ID: <span id="edit-id" style="font-family:var(--font-mono);"></span>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(rightCol);

        // --- Logic ---
        let selectedId = null;

        const renderList = () => {
            const listEl = leftCol.querySelector('#armory-list');
            const search = leftCol.querySelector('#search-armory').value.toLowerCase();
            listEl.innerHTML = '';

            state.rpg.items
                .filter(i => !search || i.name.toLowerCase().includes(search))
                .forEach(item => {
                    const el = document.createElement('div');
                    el.className = 'nav-item';
                    el.style.padding = '8px 12px';
                    el.style.cursor = 'pointer';
                    el.style.borderRadius = '4px';
                    el.style.marginBottom = '4px';
                    if (item.id === selectedId) {
                        el.style.background = 'var(--accent-primary)';
                        el.style.color = 'white';
                    }

                    // Icon based on type
                    let icon = '📦';
                    if (item.type === 'weapon') icon = '⚔️';
                    if (item.type === 'armor') icon = '🛡️';
                    if (item.type === 'consumable') icon = '🧪';

                    el.innerHTML = `
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <span style="font-weight:bold; font-size:12px;">${icon} ${item.name}</span>
                        </div>
                        <div style="font-size:10px; opacity:0.7;">${item.type}</div>
                    `;

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

            // Populate
            const q = (sel) => editorEnv.querySelector(sel); // helper
            q('#editor-title').textContent = item.name;
            q('#edit-id').textContent = item.id;

            q('#edit-name').value = item.name || '';
            q('#edit-type').value = item.type || 'misc';
            q('#edit-effect').value = item.dmg || item.effect || '';
            q('#edit-ac').value = item.ac || 0;
            q('#edit-cost').value = item.cost || 0;
            q('#edit-weight').value = item.weight || 0;
            q('#edit-desc').value = item.desc || '';

            // Bind Events (Unbind old ones? Crude re-bind is fine for simple panel)
            // Ideally we should use a single handler, but closures are easiest here.

            q('#edit-name').oninput = (e) => { item.name = e.target.value; q('#editor-title').textContent = e.target.value; renderList(); }; // Updates list name live
            q('#edit-name').onchange = () => A.State.notify();

            q('#edit-type').onchange = (e) => { item.type = e.target.value; A.State.notify(); renderList(); };

            q('#edit-effect').onchange = (e) => {
                if (item.type === 'weapon') item.dmg = e.target.value;
                else if (item.type === 'consumable') item.effect = e.target.value;
                else item.effect = e.target.value;
                A.State.notify();
            };

            q('#edit-ac').onchange = (e) => { item.ac = parseInt(e.target.value); A.State.notify(); };
            q('#edit-cost').onchange = (e) => { item.cost = parseInt(e.target.value); A.State.notify(); };
            q('#edit-weight').onchange = (e) => { item.weight = parseFloat(e.target.value); A.State.notify(); };
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
        };

        // Create Button
        leftCol.querySelector('#btn-create-item').onclick = () => {
            const newId = 'itm_' + Math.random().toString(36).substr(2, 6);
            const newItem = {
                id: newId,
                name: 'New Item',
                type: 'misc',
                cost: 0,
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

        // Initial
        renderList();
    }

    A.registerPanel('rpg_armory', {
        label: 'Armory',
        subtitle: 'Item Database',
        category: 'RPG Experiment',
        icon: '⚔️',
        render: render
    });

})(window.Anansi);
