/*
 * Anansi Panel: RPG Feats Database
 * File: js/panels/rpg_feats.js
 * Category: RPG Experiment
 * Purpose: CRUD interface for managing Feats, Spells, and Abilities.
 */

(function (A) {
    'use strict';

    // Default Feats (seeded on first run)
    const DEFAULT_FEATS = [
        {
            id: 'feat_fireball',
            name: 'Fireball',
            type: 'spell',
            target: 'all_enemies',
            effect: '8d6',
            effectType: 'fire_damage',
            cost: 5,
            description: 'Hurls a ball of fire dealing 8d6 fire damage to all enemies.'
        },
        {
            id: 'feat_heal',
            name: 'Cure Wounds',
            type: 'spell',
            target: 'ally',
            effect: '2d8+3',
            effectType: 'heal',
            cost: 2,
            description: 'Restore 2d8+3 HP to one ally.'
        },
        {
            id: 'feat_sneak_attack',
            name: 'Sneak Attack',
            type: 'ability',
            target: 'enemy',
            effect: '+2d6',
            effectType: 'bonus_damage',
            cost: 0,
            description: 'Deal +2d6 damage when attacking with advantage.'
        },
        {
            id: 'feat_rage',
            name: 'Rage',
            type: 'ability',
            target: 'self',
            effect: '+2',
            effectType: 'buff_damage',
            cost: 0,
            description: 'Gain +2 damage and resistance to physical for 1 minute.'
        },
        {
            id: 'feat_second_wind',
            name: 'Second Wind',
            type: 'ability',
            target: 'self',
            effect: '1d10+5',
            effectType: 'heal',
            cost: 0,
            description: 'Heal 1d10 + level HP as a bonus action. Once per rest.'
        }
    ];

    // Target Options
    const TARGET_OPTIONS = [
        { value: 'self', label: 'Self' },
        { value: 'ally', label: 'Single Ally' },
        { value: 'enemy', label: 'Single Enemy' },
        { value: 'all_allies', label: 'All Allies' },
        { value: 'all_enemies', label: 'All Enemies' },
        { value: 'area', label: 'Area (All)' }
    ];

    // Effect Type Options
    const EFFECT_TYPE_OPTIONS = [
        { value: 'physical_damage', label: 'Physical Damage' },
        { value: 'fire_damage', label: 'Fire Damage' },
        { value: 'cold_damage', label: 'Cold Damage' },
        { value: 'lightning_damage', label: 'Lightning Damage' },
        { value: 'heal', label: 'Healing' },
        { value: 'bonus_damage', label: 'Bonus Damage (Added to Attack)' },
        { value: 'buff_damage', label: 'Buff: Damage Increase' },
        { value: 'buff_ac', label: 'Buff: AC Increase' },
        { value: 'buff_stat', label: 'Buff: Stat Increase' },
        { value: 'debuff', label: 'Debuff' }
    ];

    // Type Options
    const TYPE_OPTIONS = [
        { value: 'spell', label: '✨ Spell' },
        { value: 'ability', label: '⚡ Ability' },
        { value: 'passive', label: '📜 Passive' }
    ];

    function render(container) {
        container.style.height = '100%';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.overflow = 'hidden';

        // Header
        const header = document.createElement('div');
        header.style.cssText = 'display:flex; justify-content:space-between; align-items:center; padding:16px; border-bottom:1px solid var(--border-subtle);';
        header.innerHTML = `
            <div>
                <h2 style="margin:0; font-size:18px;">✨ Feats & Abilities</h2>
                <p style="margin:4px 0 0; font-size:12px; color:var(--text-muted);">Define spells, abilities, and passives for your characters.</p>
            </div>
            <button id="add-feat-btn" class="btn btn-primary">+ New Feat</button>
        `;
        container.appendChild(header);

        // Content (Split: List | Editor)
        const content = document.createElement('div');
        content.style.cssText = 'flex:1; display:grid; grid-template-columns:280px 1fr; overflow:hidden;';
        container.appendChild(content);

        // Left: List
        const listPane = document.createElement('div');
        listPane.style.cssText = 'border-right:1px solid var(--border-subtle); overflow-y:auto; padding:12px;';
        listPane.id = 'feats-list-pane';
        content.appendChild(listPane);

        // Right: Editor
        const editorPane = document.createElement('div');
        editorPane.style.cssText = 'overflow-y:auto; padding:20px;';
        editorPane.id = 'feat-editor-pane';
        editorPane.innerHTML = '<div style="color:var(--text-muted); text-align:center; padding-top:60px;">Select a feat to edit or create a new one.</div>';
        content.appendChild(editorPane);

        let selectedFeatId = null;

        // Initialize Database
        const state = A.State.get();
        if (!state.rpg) state.rpg = {};
        if (!state.rpg.featDatabase || state.rpg.featDatabase.length === 0) {
            state.rpg.featDatabase = JSON.parse(JSON.stringify(DEFAULT_FEATS));
            A.State.notify();
        }

        // Render List
        function renderList() {
            const feats = A.State.get().rpg.featDatabase || [];
            listPane.innerHTML = '';

            if (feats.length === 0) {
                listPane.innerHTML = '<div style="color:var(--text-muted); font-style:italic; text-align:center; padding:20px;">No feats defined.</div>';
                return;
            }

            feats.forEach(feat => {
                const card = document.createElement('div');
                card.style.cssText = `
                    padding:10px 12px; margin-bottom:8px; background:var(--bg-surface);
                    border-radius:var(--radius-sm); cursor:pointer; transition:all 0.15s;
                    border:2px solid ${feat.id === selectedFeatId ? 'var(--accent-primary)' : 'transparent'};
                `;
                const icon = feat.type === 'spell' ? '✨' : feat.type === 'ability' ? '⚡' : '📜';
                card.innerHTML = `
                    <div style="font-weight:bold; font-size:14px;">${icon} ${feat.name}</div>
                    <div style="font-size:11px; color:var(--text-muted); margin-top:2px;">
                        ${feat.effect || '-'} ${feat.effectType || ''} | Cost: ${feat.cost || 0} MP
                    </div>
                `;
                card.onclick = () => {
                    selectedFeatId = feat.id;
                    renderList();
                    renderEditor(feat);
                };
                listPane.appendChild(card);
            });
        }

        // Render Editor
        function renderEditor(feat) {
            editorPane.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
                    <h3 style="margin:0;">Edit Feat</h3>
                    <button id="delete-feat-btn" class="btn btn-sm" style="background:var(--danger); color:white;">Delete</button>
                </div>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                    <div>
                        <label class="l-lab">Name</label>
                        <input type="text" id="feat-name" class="input" style="width:100%;" value="${feat.name || ''}">
                    </div>
                    <div>
                        <label class="l-lab">Type</label>
                        <select id="feat-type" class="input" style="width:100%;"></select>
                    </div>
                    <div>
                        <label class="l-lab">Target</label>
                        <select id="feat-target" class="input" style="width:100%;"></select>
                    </div>
                    <div>
                        <label class="l-lab">Mana Cost</label>
                        <input type="number" id="feat-cost" class="input" style="width:100%;" value="${feat.cost || 0}" min="0">
                    </div>
                    <div>
                        <label class="l-lab">Effect (Dice)</label>
                        <input type="text" id="feat-effect" class="input" style="width:100%;" value="${feat.effect || ''}" placeholder="e.g. 2d6+3">
                    </div>
                    <div>
                        <label class="l-lab">Effect Type</label>
                        <select id="feat-effect-type" class="input" style="width:100%;"></select>
                    </div>
                    <div style="grid-column:span 2;">
                        <label class="l-lab">Description</label>
                        <textarea id="feat-desc" class="input" style="width:100%; min-height:60px;">${feat.description || ''}</textarea>
                    </div>
                </div>
                <button id="save-feat-btn" class="btn btn-primary" style="margin-top:16px;">Save Changes</button>
            `;

            // Populate Selects
            const typeSelect = editorPane.querySelector('#feat-type');
            TYPE_OPTIONS.forEach(opt => {
                const o = document.createElement('option');
                o.value = opt.value;
                o.textContent = opt.label;
                if (feat.type === opt.value) o.selected = true;
                typeSelect.appendChild(o);
            });

            const targetSelect = editorPane.querySelector('#feat-target');
            TARGET_OPTIONS.forEach(opt => {
                const o = document.createElement('option');
                o.value = opt.value;
                o.textContent = opt.label;
                if (feat.target === opt.value) o.selected = true;
                targetSelect.appendChild(o);
            });

            const effectTypeSelect = editorPane.querySelector('#feat-effect-type');
            EFFECT_TYPE_OPTIONS.forEach(opt => {
                const o = document.createElement('option');
                o.value = opt.value;
                o.textContent = opt.label;
                if (feat.effectType === opt.value) o.selected = true;
                effectTypeSelect.appendChild(o);
            });

            // Save
            editorPane.querySelector('#save-feat-btn').onclick = () => {
                const feats = A.State.get().rpg.featDatabase;
                const idx = feats.findIndex(f => f.id === feat.id);
                if (idx > -1) {
                    feats[idx] = {
                        ...feats[idx],
                        name: editorPane.querySelector('#feat-name').value,
                        type: editorPane.querySelector('#feat-type').value,
                        target: editorPane.querySelector('#feat-target').value,
                        cost: parseInt(editorPane.querySelector('#feat-cost').value) || 0,
                        effect: editorPane.querySelector('#feat-effect').value,
                        effectType: editorPane.querySelector('#feat-effect-type').value,
                        description: editorPane.querySelector('#feat-desc').value
                    };
                    A.State.notify();
                    renderList();
                    if (A.UI.Toast) A.UI.Toast.show('Feat saved!', 'success');
                }
            };

            // Delete
            editorPane.querySelector('#delete-feat-btn').onclick = () => {
                if (!confirm(`Delete "${feat.name}"?`)) return;
                const feats = A.State.get().rpg.featDatabase;
                const idx = feats.findIndex(f => f.id === feat.id);
                if (idx > -1) {
                    feats.splice(idx, 1);
                    A.State.notify();
                    selectedFeatId = null;
                    renderList();
                    editorPane.innerHTML = '<div style="color:var(--text-muted); text-align:center; padding-top:60px;">Select a feat to edit.</div>';
                    if (A.UI.Toast) A.UI.Toast.show('Feat deleted.', 'info');
                }
            };
        }

        // Add New Feat
        header.querySelector('#add-feat-btn').onclick = () => {
            const feats = A.State.get().rpg.featDatabase;
            const newId = 'feat_' + Math.random().toString(36).substr(2, 9);
            const newFeat = {
                id: newId,
                name: 'New Feat',
                type: 'ability',
                target: 'enemy',
                effect: '1d6',
                effectType: 'physical_damage',
                cost: 0,
                description: ''
            };
            feats.push(newFeat);
            A.State.notify();
            selectedFeatId = newId;
            renderList();
            renderEditor(newFeat);
        };

        renderList();
    }

    if (A && A.registerPanel) {
        A.registerPanel('rpg_feats', {
            label: 'Feats',
            subtitle: 'Spells & Abilities',
            category: 'RPG Experiment',
            icon: '✨',
            render: render
        });
    }

})(window.Anansi);
