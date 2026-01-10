/**
 * Anansi Panel: RPG Classes
 * File: js/panels/rpg_classes.js
 * Category: Game Master Tools
 * Purpose: Define character classes, starting stats, equipment, feats, and level progression.
 */

(function (A) {
    'use strict';

    // ===========================================
    // DEFAULT CLASSES (Example Templates)
    // ===========================================
    const DEFAULT_CLASSES = [
        {
            id: 'fighter',
            name: 'Fighter',
            description: 'A master of martial combat, skilled with weapons and armor.',
            icon: '⚔️',
            ruleSystem: 'd20',
            startingStats: { STR: 15, DEX: 13, CON: 14, INT: 10, WIS: 12, CHA: 8 },
            hpFormula: '10 + CON',
            mpFormula: '0',
            startingEquipment: [],
            startingFeats: [],
            progression: [
                { level: 2, feats: [], statBonus: null, description: 'Extra Attack' },
                { level: 3, feats: [], statBonus: { STR: 1 }, description: 'Fighting Style' },
                { level: 5, feats: [], statBonus: null, description: 'Second Wind' }
            ],
            isDefault: true
        },
        {
            id: 'wizard',
            name: 'Wizard',
            description: 'A scholarly mage who studies arcane lore and casts powerful spells.',
            icon: '🧙',
            ruleSystem: 'd20',
            startingStats: { STR: 8, DEX: 12, CON: 10, INT: 16, WIS: 14, CHA: 10 },
            hpFormula: '6 + CON',
            mpFormula: '4 + INT',
            startingEquipment: [],
            startingFeats: [],
            progression: [
                { level: 2, feats: [], statBonus: null, description: 'Arcane Recovery' },
                { level: 3, feats: [], statBonus: { INT: 1 }, description: 'Arcane Tradition' },
                { level: 5, feats: [], statBonus: null, description: 'Spellbook Expansion' }
            ],
            isDefault: true
        },
        {
            id: 'rogue',
            name: 'Rogue',
            description: 'A skilled infiltrator who excels at stealth and cunning.',
            icon: '🗡️',
            ruleSystem: 'd20',
            startingStats: { STR: 10, DEX: 16, CON: 12, INT: 13, WIS: 10, CHA: 14 },
            hpFormula: '8 + CON',
            mpFormula: '0',
            startingEquipment: [],
            startingFeats: [],
            progression: [
                { level: 2, feats: [], statBonus: null, description: 'Cunning Action' },
                { level: 3, feats: [], statBonus: { DEX: 1 }, description: 'Roguish Archetype' },
                { level: 5, feats: [], statBonus: null, description: 'Uncanny Dodge' }
            ],
            isDefault: true
        }
    ];

    // ===========================================
    // STATE
    // ===========================================
    let selectedClassId = null;

    // ===========================================
    // HELPERS
    // ===========================================
    function getClasses(state) {
        if (!state.rpg) state.rpg = {};
        if (!state.rpg.classes) state.rpg.classes = [...DEFAULT_CLASSES];
        return state.rpg.classes;
    }

    function generateId(name) {
        return name.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Math.random().toString(36).substr(2, 6);
    }

    // ===========================================
    // MAIN RENDER
    // ===========================================
    function render(container) {
        container.style.cssText = 'height:100%; display:flex; flex-direction:column; overflow:hidden; background:var(--bg-base);';

        const state = A.State.get();
        const classes = getClasses(state);

        // Header
        const header = document.createElement('div');
        header.style.cssText = 'padding:16px 20px; background:var(--bg-elevated); border-bottom:1px solid var(--border-subtle);';
        header.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <h2 style="margin:0; font-size:18px; display:flex; align-items:center; gap:8px;">
                        📜 Character Classes
                    </h2>
                    <p style="margin:4px 0 0; font-size:12px; color:var(--text-muted);">Define class templates for character creation</p>
                </div>
                <div style="display:flex; gap:8px;">
                    <button id="btn-new-class" class="btn btn-primary btn-sm">+ New Class</button>
                </div>
            </div>
        `;
        container.appendChild(header);

        // Main content area
        const content = document.createElement('div');
        content.style.cssText = 'flex:1; display:flex; overflow:hidden;';
        container.appendChild(content);

        // Left panel - Class list
        const listPanel = document.createElement('div');
        listPanel.id = 'class-list-panel';
        listPanel.style.cssText = 'width:280px; border-right:1px solid var(--border-subtle); overflow-y:auto; background:var(--bg-surface);';
        content.appendChild(listPanel);

        // Right panel - Class editor
        const editorPanel = document.createElement('div');
        editorPanel.id = 'class-editor-panel';
        editorPanel.style.cssText = 'flex:1; overflow-y:auto; padding:20px;';
        content.appendChild(editorPanel);

        // Render list
        renderClassList(listPanel, classes);

        // Select first class or show empty state
        if (classes.length > 0) {
            selectedClassId = selectedClassId || classes[0].id;
            renderClassEditor(editorPanel, classes.find(c => c.id === selectedClassId));
        } else {
            editorPanel.innerHTML = `
                <div style="text-align:center; padding:60px 20px; color:var(--text-muted);">
                    <div style="font-size:48px; margin-bottom:16px;">📜</div>
                    <h3 style="margin:0 0 8px;">No Classes</h3>
                    <p>Create your first character class to get started.</p>
                </div>
            `;
        }

        // Wire new class button
        header.querySelector('#btn-new-class').onclick = () => createNewClass(container);
    }

    // ===========================================
    // CLASS LIST
    // ===========================================
    function renderClassList(container, classes) {
        container.innerHTML = '';

        classes.forEach(cls => {
            const item = document.createElement('div');
            const isSelected = cls.id === selectedClassId;
            item.style.cssText = `
                padding:14px 16px; cursor:pointer; display:flex; align-items:center; gap:12px;
                border-bottom:1px solid var(--border-subtle);
                background:${isSelected ? 'var(--bg-elevated)' : 'transparent'};
                border-left:3px solid ${isSelected ? 'var(--accent-primary)' : 'transparent'};
            `;
            item.innerHTML = `
                <span style="font-size:20px;">${cls.icon || '📜'}</span>
                <div style="flex:1;">
                    <div style="font-weight:${isSelected ? 'bold' : 'normal'}; font-size:13px;">${cls.name}</div>
                    <div style="font-size:11px; color:var(--text-muted);">${cls.ruleSystem || 'd20'} • ${cls.progression?.length || 0} levels</div>
                </div>
                ${cls.isDefault ? '<span style="font-size:10px; color:var(--text-muted);">📋</span>' : ''}
            `;
            item.onclick = () => {
                selectedClassId = cls.id;
                render(document.getElementById('class-list-panel').parentElement.parentElement);
            };
            container.appendChild(item);
        });
    }

    // ===========================================
    // CLASS EDITOR
    // ===========================================
    function renderClassEditor(container, cls) {
        if (!cls) {
            container.innerHTML = '<p style="color:var(--text-muted);">Select a class to edit.</p>';
            return;
        }

        const state = A.State.get();
        const items = state.rpg?.items || [];
        const featsDb = state.rpg?.featDatabase || [];
        const stats = state.rpg?.stats || ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];

        container.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:20px;">
                <div style="display:flex; align-items:center; gap:12px;">
                    <span style="font-size:32px;">${cls.icon || '📜'}</span>
                    <div>
                        <h2 style="margin:0; font-size:20px;">${cls.name}</h2>
                        <p style="margin:4px 0 0; font-size:12px; color:var(--text-muted);">${cls.description || 'No description'}</p>
                    </div>
                </div>
                <div style="display:flex; gap:8px;">
                    ${!cls.isDefault ? '<button id="btn-delete-class" class="btn btn-sm btn-ghost" style="color:var(--status-error);">🗑️ Delete</button>' : ''}
                    <button id="btn-duplicate-class" class="btn btn-sm btn-ghost">📋 Duplicate</button>
                </div>
            </div>

            <!-- Basic Info -->
            <div class="card" style="padding:16px; margin-bottom:16px;">
                <h4 style="margin:0 0 12px; font-size:13px;">Basic Information</h4>
                <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px;">
                    <div>
                        <label class="label">Name</label>
                        <input type="text" id="class-name" class="input" value="${cls.name}" style="width:100%;">
                    </div>
                    <div>
                        <label class="label">Icon (emoji)</label>
                        <input type="text" id="class-icon" class="input" value="${cls.icon || ''}" style="width:100%;" maxlength="4">
                    </div>
                    <div>
                        <label class="label">Rule System</label>
                        <select id="class-rule-system" class="input" style="width:100%;">
                            <option value="d20" ${cls.ruleSystem === 'd20' ? 'selected' : ''}>D20</option>
                            <option value="d6" ${cls.ruleSystem === 'd6' ? 'selected' : ''}>D6</option>
                            <option value="d100" ${cls.ruleSystem === 'd100' ? 'selected' : ''}>D100</option>
                            <option value="narrative" ${cls.ruleSystem === 'narrative' ? 'selected' : ''}>Narrative</option>
                        </select>
                    </div>
                </div>
                <div style="margin-top:12px;">
                    <label class="label">Description</label>
                    <textarea id="class-description" class="input" style="width:100%; height:60px;">${cls.description || ''}</textarea>
                </div>
            </div>

            <!-- Starting Stats -->
            <div class="card" style="padding:16px; margin-bottom:16px;">
                <h4 style="margin:0 0 12px; font-size:13px;">Starting Stats</h4>
                <div id="stats-grid" style="display:grid; grid-template-columns:repeat(${stats.length}, 1fr); gap:8px;">
                    ${stats.map(stat => `
                        <div style="text-align:center;">
                            <label class="label" style="display:block; margin-bottom:4px;">${stat}</label>
                            <input type="number" class="input stat-input" data-stat="${stat}" 
                                value="${cls.startingStats?.[stat] || 10}" 
                                style="width:100%; text-align:center;">
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- HP/MP Formulas -->
            <div class="card" style="padding:16px; margin-bottom:16px;">
                <h4 style="margin:0 0 12px; font-size:13px;">Resource Formulas</h4>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                    <div>
                        <label class="label">HP Formula</label>
                        <input type="text" id="class-hp-formula" class="input" value="${cls.hpFormula || '10 + CON'}" style="width:100%;" placeholder="e.g., 10 + CON">
                    </div>
                    <div>
                        <label class="label">MP Formula</label>
                        <input type="text" id="class-mp-formula" class="input" value="${cls.mpFormula || '0'}" style="width:100%;" placeholder="e.g., 4 + INT">
                    </div>
                </div>
                <p style="font-size:11px; color:var(--text-muted); margin:8px 0 0;">Use stat abbreviations (STR, DEX, etc.) or flat numbers. Formula is calculated at character creation.</p>
            </div>

            <!-- Starting Equipment -->
            <div class="card" style="padding:16px; margin-bottom:16px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                    <h4 style="margin:0; font-size:13px;">Starting Equipment</h4>
                    <button id="btn-add-equipment" class="btn btn-xs btn-ghost">+ Add</button>
                </div>
                <div id="equipment-list" style="display:flex; flex-wrap:wrap; gap:8px;">
                    ${(cls.startingEquipment || []).map(itemId => {
            const item = items.find(i => i.id === itemId);
            return `<span class="tag" data-item-id="${itemId}" style="display:flex; align-items:center; gap:4px; padding:6px 10px; background:var(--bg-surface); border-radius:4px; font-size:12px;">
                            ${item?.name || itemId}
                            <button class="remove-equipment" data-item-id="${itemId}" style="background:none; border:none; cursor:pointer; padding:0; margin-left:4px;">✕</button>
                        </span>`;
        }).join('') || '<span style="color:var(--text-muted); font-size:12px;">No starting equipment</span>'}
                </div>
            </div>

            <!-- Starting Feats -->
            <div class="card" style="padding:16px; margin-bottom:16px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                    <h4 style="margin:0; font-size:13px;">Starting Feats/Abilities</h4>
                    <button id="btn-add-feat" class="btn btn-xs btn-ghost">+ Add</button>
                </div>
                <div id="feats-list" style="display:flex; flex-wrap:wrap; gap:8px;">
                    ${(cls.startingFeats || []).map(featId => {
            const feat = featsDb.find(f => f.id === featId);
            return `<span class="tag" data-feat-id="${featId}" style="display:flex; align-items:center; gap:4px; padding:6px 10px; background:var(--bg-surface); border-radius:4px; font-size:12px;">
                            ✨ ${feat?.name || featId}
                            <button class="remove-feat" data-feat-id="${featId}" style="background:none; border:none; cursor:pointer; padding:0; margin-left:4px;">✕</button>
                        </span>`;
        }).join('') || '<span style="color:var(--text-muted); font-size:12px;">No starting feats</span>'}
                </div>
            </div>

            <!-- Level Progression -->
            <div class="card" style="padding:16px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                    <h4 style="margin:0; font-size:13px;">Level Progression</h4>
                    <button id="btn-add-level" class="btn btn-xs btn-ghost">+ Add Level</button>
                </div>
                <div id="progression-table">
                    ${renderProgressionTable(cls.progression || [])}
                </div>
            </div>
        `;

        // Wire all the handlers
        wireClassEditor(container, cls);
    }

    // ===========================================
    // PROGRESSION TABLE
    // ===========================================
    function renderProgressionTable(progression) {
        if (!progression || progression.length === 0) {
            return '<p style="color:var(--text-muted); font-size:12px;">No progression levels defined. Add levels to grant feats and bonuses as characters level up.</p>';
        }

        let html = `
            <table style="width:100%; font-size:12px; border-collapse:collapse;">
                <thead>
                    <tr style="border-bottom:1px solid var(--border-subtle);">
                        <th style="text-align:left; padding:8px 4px; width:60px;">Level</th>
                        <th style="text-align:left; padding:8px 4px;">Description</th>
                        <th style="text-align:left; padding:8px 4px;">Stat Bonus</th>
                        <th style="text-align:left; padding:8px 4px;">Feats</th>
                        <th style="width:40px;"></th>
                    </tr>
                </thead>
                <tbody>
        `;

        progression.sort((a, b) => a.level - b.level).forEach(p => {
            const statBonusStr = p.statBonus
                ? Object.entries(p.statBonus).map(([k, v]) => `${k}+${v}`).join(', ')
                : '-';
            const featsStr = p.feats?.length > 0 ? p.feats.join(', ') : '-';

            html += `
                <tr style="border-bottom:1px solid var(--border-subtle);" data-level="${p.level}">
                    <td style="padding:8px 4px; font-weight:bold;">${p.level}</td>
                    <td style="padding:8px 4px;">${p.description || '-'}</td>
                    <td style="padding:8px 4px; color:var(--accent-secondary);">${statBonusStr}</td>
                    <td style="padding:8px 4px; color:var(--accent-primary);">${featsStr}</td>
                    <td style="padding:8px 4px;">
                        <button class="btn-remove-level btn btn-xs btn-ghost" data-level="${p.level}" style="padding:2px 6px;">✕</button>
                    </td>
                </tr>
            `;
        });

        html += '</tbody></table>';
        return html;
    }

    // ===========================================
    // WIRE CLASS EDITOR
    // ===========================================
    function wireClassEditor(container, cls) {
        const state = A.State.get();
        const classes = getClasses(state);
        const items = state.rpg?.items || [];
        const featsDb = state.rpg?.featDatabase || [];

        // Basic info handlers
        const saveChanges = () => {
            cls.name = container.querySelector('#class-name').value;
            cls.icon = container.querySelector('#class-icon').value;
            cls.ruleSystem = container.querySelector('#class-rule-system').value;
            cls.description = container.querySelector('#class-description').value;
            cls.hpFormula = container.querySelector('#class-hp-formula').value;
            cls.mpFormula = container.querySelector('#class-mp-formula').value;

            // Stats
            const statInputs = container.querySelectorAll('.stat-input');
            if (!cls.startingStats) cls.startingStats = {};
            statInputs.forEach(input => {
                cls.startingStats[input.dataset.stat] = parseInt(input.value) || 10;
            });

            A.State.notify();
        };

        container.querySelectorAll('.input').forEach(input => {
            input.onchange = saveChanges;
        });

        // Delete button
        const deleteBtn = container.querySelector('#btn-delete-class');
        if (deleteBtn) {
            deleteBtn.onclick = () => {
                if (confirm(`Delete class "${cls.name}"? This cannot be undone.`)) {
                    const idx = classes.findIndex(c => c.id === cls.id);
                    if (idx >= 0) {
                        classes.splice(idx, 1);
                        selectedClassId = classes.length > 0 ? classes[0].id : null;
                        A.State.notify();
                        render(container.parentElement.parentElement);
                    }
                }
            };
        }

        // Duplicate button
        container.querySelector('#btn-duplicate-class').onclick = () => {
            const newCls = JSON.parse(JSON.stringify(cls));
            newCls.id = generateId(cls.name + '_copy');
            newCls.name = cls.name + ' (Copy)';
            newCls.isDefault = false;
            classes.push(newCls);
            selectedClassId = newCls.id;
            A.State.notify();
            render(container.parentElement.parentElement);
        };

        // Add Equipment
        container.querySelector('#btn-add-equipment').onclick = () => {
            if (items.length === 0) {
                A.UI?.Toast?.show('No items in Armory. Add items first.', 'warning');
                return;
            }
            showPickerModal('Select Starting Equipment', items.map(i => ({ id: i.id, label: i.name, icon: i.type === 'weapon' ? '⚔️' : i.type === 'armor' ? '🛡️' : '📦' })), (selected) => {
                if (!cls.startingEquipment) cls.startingEquipment = [];
                if (!cls.startingEquipment.includes(selected.id)) {
                    cls.startingEquipment.push(selected.id);
                    A.State.notify();
                    renderClassEditor(container, cls);
                }
            });
        };

        // Remove Equipment
        container.querySelectorAll('.remove-equipment').forEach(btn => {
            btn.onclick = () => {
                cls.startingEquipment = cls.startingEquipment.filter(id => id !== btn.dataset.itemId);
                A.State.notify();
                renderClassEditor(container, cls);
            };
        });

        // Add Feat
        container.querySelector('#btn-add-feat').onclick = () => {
            if (featsDb.length === 0) {
                A.UI?.Toast?.show('No feats in database. Add feats first.', 'warning');
                return;
            }
            showPickerModal('Select Starting Feat', featsDb.map(f => ({ id: f.id, label: f.name, icon: '✨' })), (selected) => {
                if (!cls.startingFeats) cls.startingFeats = [];
                if (!cls.startingFeats.includes(selected.id)) {
                    cls.startingFeats.push(selected.id);
                    A.State.notify();
                    renderClassEditor(container, cls);
                }
            });
        };

        // Remove Feat
        container.querySelectorAll('.remove-feat').forEach(btn => {
            btn.onclick = () => {
                cls.startingFeats = cls.startingFeats.filter(id => id !== btn.dataset.featId);
                A.State.notify();
                renderClassEditor(container, cls);
            };
        });

        // Add Level
        container.querySelector('#btn-add-level').onclick = () => {
            const nextLevel = (cls.progression?.length || 0) + 2; // Start at 2 since level 1 is assumed
            showLevelEditor(null, nextLevel, (levelData) => {
                if (!cls.progression) cls.progression = [];
                cls.progression.push(levelData);
                A.State.notify();
                renderClassEditor(container, cls);
            });
        };

        // Remove Level
        container.querySelectorAll('.btn-remove-level').forEach(btn => {
            btn.onclick = () => {
                const level = parseInt(btn.dataset.level);
                cls.progression = cls.progression.filter(p => p.level !== level);
                A.State.notify();
                renderClassEditor(container, cls);
            };
        });
    }

    // ===========================================
    // CREATE NEW CLASS
    // ===========================================
    function createNewClass(container) {
        const state = A.State.get();
        const classes = getClasses(state);

        const newCls = {
            id: generateId('new_class'),
            name: 'New Class',
            description: '',
            icon: '📜',
            ruleSystem: state.rpg?.campaign?.mechanics || 'd20',
            startingStats: {},
            hpFormula: '8 + CON',
            mpFormula: '0',
            startingEquipment: [],
            startingFeats: [],
            progression: [],
            isDefault: false
        };

        classes.push(newCls);
        selectedClassId = newCls.id;
        A.State.notify();
        render(container);
    }

    // ===========================================
    // PICKER MODAL
    // ===========================================
    function showPickerModal(title, options, onSelect) {
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.6); display:flex; align-items:center; justify-content:center; z-index:1000;';

        const modal = document.createElement('div');
        modal.style.cssText = 'background:var(--bg-surface); border-radius:12px; padding:20px; max-width:400px; width:90%; max-height:70vh; overflow-y:auto;';
        modal.innerHTML = `
            <h3 style="margin:0 0 16px;">${title}</h3>
            <div id="picker-options" style="display:flex; flex-direction:column; gap:4px;"></div>
            <div style="margin-top:16px; text-align:right;">
                <button id="btn-cancel" class="btn btn-ghost">Cancel</button>
            </div>
        `;

        const optionsContainer = modal.querySelector('#picker-options');
        options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'btn btn-ghost';
            btn.style.cssText = 'text-align:left; display:flex; align-items:center; gap:8px; padding:10px 12px;';
            btn.innerHTML = `<span>${opt.icon || '📦'}</span><span>${opt.label}</span>`;
            btn.onclick = () => {
                overlay.remove();
                onSelect(opt);
            };
            optionsContainer.appendChild(btn);
        });

        modal.querySelector('#btn-cancel').onclick = () => overlay.remove();
        overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

        overlay.appendChild(modal);
        document.body.appendChild(overlay);
    }

    // ===========================================
    // LEVEL EDITOR MODAL
    // ===========================================
    function showLevelEditor(existingData, defaultLevel, onSave) {
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.6); display:flex; align-items:center; justify-content:center; z-index:1000;';

        const state = A.State.get();
        const stats = state.rpg?.stats || ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];

        const modal = document.createElement('div');
        modal.style.cssText = 'background:var(--bg-surface); border-radius:12px; padding:20px; max-width:400px; width:90%;';
        modal.innerHTML = `
            <h3 style="margin:0 0 16px;">${existingData ? 'Edit' : 'Add'} Level Progression</h3>
            <div style="display:flex; flex-direction:column; gap:12px;">
                <div>
                    <label class="label">Level</label>
                    <input type="number" id="level-number" class="input" value="${existingData?.level || defaultLevel}" min="2" style="width:100%;">
                </div>
                <div>
                    <label class="label">Description (what's gained)</label>
                    <input type="text" id="level-description" class="input" value="${existingData?.description || ''}" placeholder="e.g., Extra Attack" style="width:100%;">
                </div>
                <div>
                    <label class="label">Stat Bonus (optional)</label>
                    <div style="display:flex; gap:8px;">
                        <select id="level-stat" class="input" style="flex:1;">
                            <option value="">None</option>
                            ${stats.map(s => `<option value="${s}">${s}</option>`).join('')}
                        </select>
                        <input type="number" id="level-bonus" class="input" value="1" min="1" max="5" style="width:60px;">
                    </div>
                </div>
            </div>
            <div style="margin-top:16px; display:flex; gap:8px; justify-content:flex-end;">
                <button id="btn-cancel" class="btn btn-ghost">Cancel</button>
                <button id="btn-save" class="btn btn-primary">Save</button>
            </div>
        `;

        modal.querySelector('#btn-cancel').onclick = () => overlay.remove();
        modal.querySelector('#btn-save').onclick = () => {
            const level = parseInt(modal.querySelector('#level-number').value);
            const description = modal.querySelector('#level-description').value;
            const stat = modal.querySelector('#level-stat').value;
            const bonus = parseInt(modal.querySelector('#level-bonus').value);

            const data = {
                level,
                description,
                feats: existingData?.feats || [],
                statBonus: stat ? { [stat]: bonus } : null
            };

            overlay.remove();
            onSave(data);
        };

        overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
    }

    // ===========================================
    // REGISTER PANEL
    // ===========================================
    A.registerPanel('rpg_classes', {
        label: 'Classes',
        subtitle: 'Character Templates',
        category: 'Game Master Tools',
        icon: '📜',
        render: render
    });

})(window.Anansi);
