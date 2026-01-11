/*
 * Anansi Panel: Quest Board
 * File: js/plugins/rpg/rpg_quest_board.js
 * Category: RPG Experiment
 * Purpose: GM interface for creating, editing, and distributing Quests.
 */

(function (A) {
    'use strict';

    const QUEST_TYPES = {
        KILL: { label: 'Kill Target', icon: '⚔️' },
        FETCH: { label: 'Fetch Item', icon: '📦' },
        VISIT: { label: 'Visit Location', icon: '📍' },
        TALK: { label: 'Talk to NPC', icon: '💬' }
    };


    const DEFAULT_QUESTS = [
        {
            id: 'qst_rats',
            title: 'Cellar Cleanout',
            description: 'The innkeeper needs someone to clear the giant rats from his cellar.',
            objectives: [
                { type: 'KILL', target: 'Giant Rat', total: 5 }
            ],
            rewards: [{ type: 'XP', value: 50 }, { type: 'Gold', value: 10 }]
        },
        {
            id: 'qst_artifact',
            title: 'The Lost Artifact',
            description: 'Recover the ancient idol from the ruins.',
            objectives: [
                { type: 'VISIT', target: 'loc_ruins_center' },
                { type: 'FETCH', target: 'Golden Idol', total: 1 }
            ],
            rewards: [{ type: 'XP', value: 500 }]
        }
    ];

    function render(container) {
        container.style.display = 'grid';
        container.style.gridTemplateColumns = '300px 1fr';
        container.style.height = '100%';
        container.style.gap = '1px';
        container.style.background = 'var(--border-subtle)';

        const state = A.State.get();
        if (!state.rpg) state.rpg = { enabled: true };

        // Initialize Quest Database (Templates)
        if (!state.rpg.questDB) {
            state.rpg.questDB = JSON.parse(JSON.stringify(DEFAULT_QUESTS));
        }

        // --- Left: Quest List ---
        const leftCol = document.createElement('div');
        leftCol.style.cssText = 'background:var(--bg-base); display:flex; flex-direction:column; overflow:hidden;';

        leftCol.innerHTML = `
            <div class="panel-toolbar" style="padding:12px; border-bottom:1px solid var(--border-subtle); display:flex; justify-content:space-between; align-items:center;">
                <span style="font-weight:bold;">📜 Quest Board</span>
                <button class="btn btn-xs btn-primary" id="btn-create-quest">+ New</button>
            </div>
            <div style="padding:8px; border-bottom:1px solid var(--border-subtle);">
                <input class="input" id="search-quests" placeholder="Search quests..." style="width:100%;">
            </div>
            <div id="quest-list" style="flex:1; overflow-y:auto; padding:8px;"></div>
        `;
        container.appendChild(leftCol);

        // --- Right: Details Editor ---
        const rightCol = document.createElement('div');
        rightCol.style.cssText = 'background:var(--bg-base); display:flex; flex-direction:column; overflow:hidden;';

        // Editor Template
        rightCol.innerHTML = `
            <div id="quest-editor-empty" style="flex:1; display:flex; align-items:center; justify-content:center; color:var(--text-muted); font-style:italic;">
                Select a quest to edit details.
            </div>
            <div id="quest-editor" style="display:none; flex-direction:column; height:100%;"></div>
        `;
        container.appendChild(rightCol);

        let selectedId = null;

        // --- RENDER LIST ---
        const renderList = () => {
            const listEl = leftCol.querySelector('#quest-list');
            const search = leftCol.querySelector('#search-quests').value.toLowerCase();
            listEl.innerHTML = '';

            const quests = state.rpg.questDB.filter(q =>
                !search || q.title.toLowerCase().includes(search) || q.description.toLowerCase().includes(search)
            );

            if (quests.length === 0) {
                listEl.innerHTML = '<div style="color:var(--text-muted); text-align:center; padding:20px; font-style:italic;">No quests found.</div>';
                return;
            }

            quests.forEach(q => {
                const isSelected = q.id === selectedId;
                const el = document.createElement('div');
                el.style.cssText = `
                    padding:10px 12px; cursor:pointer; border-radius:6px; margin-bottom:4px;
                    background:${isSelected ? 'var(--bg-elevated)' : 'transparent'};
                    border:2px solid ${isSelected ? 'var(--accent-primary)' : 'transparent'};
                `;

                // Objective Summary
                const objCounts = { KILL: 0, FETCH: 0, VISIT: 0 };
                q.objectives.forEach(o => { if (objCounts[o.type] !== undefined) objCounts[o.type]++; });
                const icons = Object.entries(objCounts).filter(([k, v]) => v > 0).map(([k, v]) => QUEST_TYPES[k].icon).join(' ');

                el.innerHTML = `
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                        <span style="font-size:13px; font-weight:bold; color:${isSelected ? 'var(--accent-primary)' : 'var(--text-primary)'};">
                            ${q.title}
                        </span>
                    </div>
                    <div style="font-size:10px; color:var(--text-muted); margin-bottom:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                        ${q.description}
                    </div>
                    <div style="font-size:10px; color:var(--text-secondary);">
                        ${icons || 'No Objectives'}
                    </div>
                `;

                if (!isSelected) {
                    el.onmouseenter = () => el.style.background = 'var(--bg-hover)';
                    el.onmouseleave = () => el.style.background = 'transparent';
                }

                el.onclick = () => {
                    selectedId = q.id;
                    renderList();
                    loadEditor();
                };
                listEl.appendChild(el);
            });
        };

        // --- LOAD EDITOR ---
        const loadEditor = () => {
            const quest = state.rpg.questDB.find(q => q.id === selectedId);
            const emptyEnv = rightCol.querySelector('#quest-editor-empty');
            const editorEnv = rightCol.querySelector('#quest-editor');

            if (!quest) {
                emptyEnv.style.display = 'flex';
                editorEnv.style.display = 'none';
                return;
            }

            emptyEnv.style.display = 'none';
            editorEnv.style.display = 'flex';

            editorEnv.innerHTML = `
                <div class="panel-toolbar" style="padding:12px 16px; border-bottom:1px solid var(--border-subtle); display:flex; justify-content:space-between;">
                    <strong id="editor-title">${quest.title}</strong>
                    <div style="display:flex; gap:8px;">
                        <button class="btn btn-xs btn-success" id="btn-assign-quest" title="Start this quest for the party">▶️ Start Quest</button>
                        <button class="btn btn-xs btn-ghost" style="color:var(--status-error);" id="btn-del-quest">🗑️ Delete</button>
                    </div>
                </div>
                <div style="flex:1; overflow-y:auto; padding:20px;">
                    <!-- Basic Info -->
                    <div style="margin-bottom:20px;">
                        <label class="label">Title</label>
                        <input class="input" id="edit-title" value="${quest.title}" style="width:100%;">
                    </div>
                    <div style="margin-bottom:20px;">
                        <label class="label">Description</label>
                        <textarea class="input" id="edit-desc" rows="3" style="width:100%;">${quest.description}</textarea>
                    </div>

                    <!-- Objectives -->
                    <div style="margin-bottom:20px;">
                        <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                            <label class="label">Objectives</label>
                            <button class="btn btn-xs btn-ghost" id="btn-add-obj">+ Add</button>
                        </div>
                        <div id="obj-list" style="display:flex; flex-direction:column; gap:8px;"></div>
                    </div>
                    
                    <!-- Rewards (Simple) -->
                    <div style="margin-bottom:20px;">
                        <label class="label">Rewards (JSON)</label>
                        <input class="input" id="edit-rewards" value='${JSON.stringify(quest.rewards || [])}' style="width:100%; font-family:monospace; font-size:11px;">
                        <div style="font-size:10px; color:var(--text-muted); margin-top:4px;">Example: [{"type":"XP","value":100}]</div>
                    </div>

                    <div style="margin-top:20px; font-size:10px; color:var(--text-muted);">
                        ID: <span style="font-family:var(--font-mono);">${quest.id}</span>
                    </div>
                </div>
            `;

            const qSel = (sel) => editorEnv.querySelector(sel);

            // Bind Basics
            qSel('#edit-title').oninput = (e) => { quest.title = e.target.value; qSel('#editor-title').textContent = e.target.value; renderList(); };
            qSel('#edit-title').onchange = () => A.State.notify();
            qSel('#edit-desc').onchange = (e) => { quest.description = e.target.value; A.State.notify(); };
            qSel('#edit-rewards').onchange = (e) => {
                try { quest.rewards = JSON.parse(e.target.value); A.State.notify(); }
                catch (err) { alert('Invalid JSON'); }
            };

            // Render Objectives
            const renderObjList = () => {
                const list = qSel('#obj-list');
                list.innerHTML = '';
                quest.objectives.forEach((obj, idx) => {
                    const row = document.createElement('div');
                    row.style.cssText = 'background:var(--bg-inset); padding:8px; border-radius:4px; display:flex; gap:8px; align-items:center;';

                    row.innerHTML = `
                         <select class="input input-sm" style="width:80px;" id="obj-type-${idx}">
                             <option value="KILL" ${obj.type === 'KILL' ? 'selected' : ''}>KILL</option>
                             <option value="FETCH" ${obj.type === 'FETCH' ? 'selected' : ''}>FETCH</option>
                             <option value="VISIT" ${obj.type === 'VISIT' ? 'selected' : ''}>VISIT</option>
                             <option value="TALK" ${obj.type === 'TALK' ? 'selected' : ''}>TALK</option>
                         </select>
                         <input class="input input-sm" style="flex:1;" value="${obj.target}" placeholder="Target (ID/Name)" id="obj-target-${idx}">
                         <input class="input input-sm" type="number" style="width:60px;" value="${obj.total || 1}" placeholder="Qty" id="obj-total-${idx}">
                         <button class="btn btn-xs btn-ghost" style="color:var(--status-error);" id="btn-del-obj-${idx}">✖</button>
                    `;
                    list.appendChild(row);

                    // Bind Row
                    row.querySelector(`#obj-type-${idx}`).onchange = (e) => { obj.type = e.target.value; A.State.notify(); };
                    row.querySelector(`#obj-target-${idx}`).onchange = (e) => { obj.target = e.target.value; A.State.notify(); };
                    row.querySelector(`#obj-total-${idx}`).onchange = (e) => { obj.total = parseInt(e.target.value) || 1; A.State.notify(); };
                    row.querySelector(`#btn-del-obj-${idx}`).onclick = () => {
                        quest.objectives.splice(idx, 1);
                        renderObjList();
                        renderList(); // Update icons
                        A.State.notify();
                    };
                });
            };

            qSel('#btn-add-obj').onclick = () => {
                quest.objectives.push({ type: 'KILL', target: 'Rat', total: 1 });
                renderObjList();
                renderList();
                A.State.notify();
            };

            qSel('#btn-del-quest').onclick = () => {
                if (confirm('Delete this quest template?')) {
                    state.rpg.questDB = state.rpg.questDB.filter(q => q.id !== quest.id);
                    selectedId = null;
                    A.State.notify();
                    renderList();
                    loadEditor();
                }
            };

            qSel('#btn-assign-quest').onclick = () => {
                if (A.RPGQuests) {
                    // Clone to active
                    A.RPGQuests.accept({
                        ...quest,
                        id: quest.id + '_' + Date.now() // Unique instance ID
                    });
                    if (A.UI.Toast) A.UI.Toast.show('Quest started!', 'success');
                } else {
                    alert('Quest System not loaded');
                }
            };

            renderObjList();
        };

        // Create New
        leftCol.querySelector('#btn-create-quest').onclick = () => {
            const newId = 'qst_' + Math.random().toString(36).substr(2, 6);
            const newQuest = {
                id: newId,
                title: 'New Quest',
                description: '',
                objectives: [],
                rewards: []
            };
            state.rpg.questDB.push(newQuest);
            selectedId = newId;
            A.State.notify();
            renderList();
            loadEditor();
        };

        leftCol.querySelector('#search-quests').oninput = () => renderList();

        renderList();
    }

    A.registerPanel('rpg_quest_board', {
        label: 'Quest Board',
        subtitle: 'Quest Database',
        category: 'RPG Experiment',
        subcategory: 'Game Master',
        order: 51,
        gmOnly: true,
        icon: '📜',
        render: render
    });

})(window.Anansi);
