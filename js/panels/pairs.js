/*
 * Anansi Panel: Pairs (Relationships)
 * File: js/panels/pairs.js
 * Category: Weave
 */

(function (A) {
    'use strict';

    let currentId = null;
    let searchTerm = '';

    // --- Helpers ---
    function uuidv4() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    // --- Render ---
    function render(container, context) {
        const state = A.State.get();
        if (!state) return;

        // Ensure Data Structure
        if (!state.nodes) state.nodes = {};
        if (!state.nodes.pairs) state.nodes.pairs = { items: {} };

        // Layout
        container.style.height = '100%';
        container.style.display = 'grid';
        container.style.gridTemplateColumns = '250px 1fr';
        container.style.gap = 'var(--space-4)';
        container.style.overflow = 'hidden';

        // 1. List Column
        const listCol = document.createElement('div');
        listCol.className = 'card';
        Object.assign(listCol.style, { display: 'flex', flexDirection: 'column', minHeight: '0', marginBottom: '0' });

        listCol.innerHTML = `
            <div class="card-header">
                <strong>Pairs</strong>
                <button class="btn btn-secondary btn-sm" id="btn-add-pair">+ New</button>
            </div>
            <div class="card-body" id="pair-list" style="padding:0; flex:1; overflow-y:auto;"></div>
        `;

        // 2. Editor Column
        const editorCol = document.createElement('div');
        editorCol.className = 'card';
        Object.assign(editorCol.style, { display: 'flex', flexDirection: 'column', minHeight: '0', marginBottom: '0', padding: '0' });
        editorCol.id = 'pair-editor';

        container.appendChild(listCol);
        container.appendChild(editorCol);

        // --- Logic ---
        const listBody = listCol.querySelector('#pair-list');
        const addBtn = listCol.querySelector('#btn-add-pair');

        // Functions
        const renderList = () => {
            listBody.innerHTML = '';
            const pairs = Object.values(state.nodes.pairs.items);
            const actors = state.nodes.actors?.items || {};

            if (pairs.length === 0) {
                listBody.innerHTML = '<div style="padding:16px; color:gray; text-align:center;">No pairs defined.</div>';
                return;
            }

            pairs.forEach(pair => {
                const item = document.createElement('div');
                item.style.padding = '8px 12px';
                item.style.borderBottom = '1px solid var(--border-subtle)';
                item.style.cursor = 'pointer';
                if (pair.id === currentId) {
                    item.style.backgroundColor = 'var(--bg-surface)';
                    item.style.borderLeft = '3px solid var(--accent-primary)';
                }

                // Resolve names
                const n1 = actors[pair.actor1]?.name || 'Unknown';
                const n2 = actors[pair.actor2]?.name || 'Unknown';

                item.innerHTML = `
                    <div style="font-weight:bold; font-size:12px;">${n1} & ${n2}</div>
                    <div style="font-size:10px; color:var(--text-muted);">${pair.type || 'Unspecified'}</div>
                `;
                item.onclick = () => {
                    currentId = pair.id;
                    renderList();
                    renderEditor();
                };
                listBody.appendChild(item);
            });
        };

        const renderEditor = () => {
            editorCol.innerHTML = '';
            if (!currentId || !state.nodes.pairs.items[currentId]) {
                editorCol.innerHTML = `
                    <div class="empty-state-card" style="margin:auto;">
                        <div class="empty-title">Select Relations</div>
                        <div class="empty-description">Define how actors interact with each other.</div>
                    </div>
                `;
                return;
            }

            const pair = state.nodes.pairs.items[currentId];
            const actors = Object.values(state.nodes.actors?.items || {});

            // Defaults
            if (!pair.shifts) pair.shifts = [];

            // Actor Options
            const actorOpts = actors.map(a => `<option value="${a.id}">${a.name}</option>`).join('');

            // Editor UI
            editorCol.innerHTML = `
                <div class="card-header">
                     <strong style="flex:1;">Edit Relationship</strong>
                     <button class="btn btn-ghost btn-sm" id="btn-del" style="color:var(--status-error);">Delete</button>
                </div>
                <div class="card-body" style="overflow-y:auto; flex:1;">
                    <style>
                        .p-row { display:flex; gap:12px; margin-bottom:12px; }
                        .p-col { flex:1; display:flex; flexDirection:column; }
                        .p-lab { font-size:10px; font-weight:bold; color:var(--text-muted); margin-bottom:4px; text-transform:uppercase; }
                    </style>

                    <div class="p-row">
                        <div class="p-col">
                            <label class="p-lab">Actor 1</label>
                            <select class="input" id="sel-a1">
                                <option value="">Select...</option>
                                ${actorOpts}
                            </select>
                        </div>
                        <div class="p-col" style="flex:0 0 20px; align-items:center; justify-content:center; padding-top:16px;">&</div>
                        <div class="p-col">
                             <label class="p-lab">Actor 2</label>
                            <select class="input" id="sel-a2">
                                <option value="">Select...</option>
                                ${actorOpts}
                            </select>
                        </div>
                    </div>

                    <div class="p-row">
                         <div class="p-col">
                             <label class="p-lab">Relationship Type</label>
                             <input class="input" id="inp-type" value="${pair.type || ''}" placeholder="e.g. Rivals, Lovers, Siblings">
                         </div>
                         <div class="p-col">
                             <label class="p-lab">Injection Target</label>
                             <select class="input" id="sel-target">
                                 <option value="personality" ${pair.target === 'personality' ? 'selected' : ''}>Personality</option>
                                 <option value="scenario" ${pair.target === 'scenario' ? 'selected' : ''}>Scenario</option>
                                 <option value="context" ${pair.target === 'context' ? 'selected' : ''}>Context</option>
                             </select>
                         </div>
                    </div>

                     <div class="p-row">
                         <div class="p-col">
                             <label class="p-lab">Grouping ID (Optional)</label>
                             <input class="input" id="inp-group" value="${pair.groupId || ''}" placeholder="e.g. main_cast">
                         </div>
                    </div>

                    <div style="margin-top:20px; border-top:1px solid var(--border-subtle); padding-top:12px;">
                        <div class="p-lab">Content (Base)</div>
                        <textarea class="input" id="inp-content" style="height:100px; resize:vertical;" placeholder="Base relationship description...">${pair.content || ''}</textarea>
                        <div style="font-size:10px; color:var(--text-muted); margin-top:4px;">Injected when <strong>both</strong> actors are present in the scene.</div>
                    </div>

                    <div style="margin-top:20px; border-top:1px solid var(--border-subtle); padding-top:12px;">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                            <div class="p-lab" style="margin:0;">Emotional Shifts</div>
                            <button class="btn btn-secondary btn-sm" id="btn-add-shift">+ Add Shift</button>
                        </div>
                        <div id="shifts-container"></div>
                    </div>
                </div>
            `;

            // Bindings
            const bind = (sel, field) => {
                const el = editorCol.querySelector(sel);
                if (el) el.onchange = (e) => {
                    pair[field] = e.target.value;
                    A.State.notify();
                    if (field === 'actor1' || field === 'actor2' || field === 'type') renderList();
                };
            };

            bind('#sel-a1', 'actor1');
            bind('#sel-a2', 'actor2');
            bind('#inp-type', 'type');
            bind('#sel-target', 'target');
            bind('#inp-group', 'groupId');
            bind('#inp-content', 'content');

            // Initial Values
            editorCol.querySelector('#sel-a1').value = pair.actor1 || '';
            editorCol.querySelector('#sel-a2').value = pair.actor2 || '';

            // Delete
            editorCol.querySelector('#btn-del').onclick = () => {
                if (confirm('Delete this relationship?')) {
                    delete state.nodes.pairs.items[currentId];
                    currentId = null;
                    A.State.notify();
                    renderList();
                    renderEditor();
                }
            };

            // Shifts
            const shiftsContainer = editorCol.querySelector('#shifts-container');
            const renderShifts = () => {
                shiftsContainer.innerHTML = '';
                pair.shifts.forEach((shift, idx) => {
                    const sDiv = document.createElement('div');
                    sDiv.style.background = 'var(--bg-base)';
                    sDiv.style.border = '1px solid var(--border-subtle)';
                    sDiv.style.borderRadius = '4px';
                    sDiv.style.padding = '8px';
                    sDiv.style.marginBottom = '8px';

                    sDiv.innerHTML = `
                        <div style="display:flex; gap:8px; margin-bottom:8px;">
                            <div style="flex:1;">
                                <div class="p-lab">Trigger Emotion (Tag)</div>
                                <input class="input shift-tag" data-idx="${idx}" value="${shift.emotion || ''}" placeholder="e.g. ANGER">
                            </div>
                           <button class="btn btn-ghost btn-sm btn-del-shift" data-idx="${idx}" style="align-self:flex-end; color:var(--status-error);">&times;</button>
                        </div>
                        <div>
                             <textarea class="input shift-content" data-idx="${idx}" style="height:50px; resize:vertical; font-size:11px;" placeholder="Content override/append...">${shift.content || ''}</textarea>
                        </div>
                    `;
                    shiftsContainer.appendChild(sDiv);
                });

                // Bind Shift Inputs
                shiftsContainer.querySelectorAll('.shift-tag').forEach(el => {
                    el.onchange = (e) => {
                        pair.shifts[el.dataset.idx].emotion = e.target.value;
                        A.State.notify();
                    };
                });
                shiftsContainer.querySelectorAll('.shift-content').forEach(el => {
                    el.onchange = (e) => {
                        pair.shifts[el.dataset.idx].content = e.target.value;
                        A.State.notify();
                    };
                });
                shiftsContainer.querySelectorAll('.btn-del-shift').forEach(el => {
                    el.onclick = () => {
                        pair.shifts.splice(el.dataset.idx, 1);
                        A.State.notify();
                        renderShifts();
                    };
                });
            };
            renderShifts();

            editorCol.querySelector('#btn-add-shift').onclick = () => {
                pair.shifts.push({ emotion: '', content: '' });
                A.State.notify();
                renderShifts();
            };
        };

        // Add Hook
        addBtn.onclick = () => {
            const id = 'pair_' + uuidv4();
            state.nodes.pairs.items[id] = {
                id: id,
                actor1: '',
                actor2: '',
                type: '',
                target: 'personality',
                content: '',
                shifts: []
            };
            currentId = id;
            A.State.notify();
            renderList();
            renderEditor();
        };

        // Initial Render
        renderList();
    }

    A.registerPanel('pairs', {
        label: 'Pairs',
        subtitle: 'Relationships',
        category: 'Weave',
        render: render
    });

})(window.Anansi);
