/**
 * Anansi Panel: RPG Dialogue Editor
 * File: js/panels/rpg_dialogue_panel.js
 * Category: RPG Experiment
 * Purpose: Create and edit NPC dialogue trees for the RPG system.
 */

(function (A) {
    'use strict';

    function render(container) {
        const state = A.State.get();
        if (!state.rpg) state.rpg = {};
        if (!state.rpg.dialogues) state.rpg.dialogues = [];

        container.style.cssText = 'height:100%; display:flex; flex-direction:column; gap:16px; padding:16px;';

        // Get NPCs for linking
        const actors = Object.values(state.nodes?.actors?.items || {});
        const npcs = actors.filter(a => a.data?.rpg?.type !== 'monster' && a.data?.rpg?.type !== 'party_member');

        // Header with create button
        const header = document.createElement('div');
        header.className = 'card';
        header.style.cssText = 'padding:16px; flex-shrink:0;';
        header.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <h3 style="margin:0; font-size:16px;">📜 Dialogue Trees</h3>
                    <p style="margin:4px 0 0; font-size:11px; color:var(--text-muted);">
                        Create branching conversations for NPCs
                    </p>
                </div>
                <div style="display:flex; gap:8px;">
                    <button id="btn-import" class="btn btn-secondary btn-sm">📋 Import JSON</button>
                    <button id="btn-create" class="btn btn-primary btn-sm">+ New Dialogue</button>
                </div>
            </div>
        `;
        container.appendChild(header);

        // Dialogues list
        const listSection = document.createElement('div');
        listSection.className = 'card';
        listSection.style.cssText = 'padding:16px; flex:1; overflow-y:auto;';
        container.appendChild(listSection);

        const renderList = () => {
            const dialogues = state.rpg.dialogues || [];

            if (dialogues.length === 0) {
                listSection.innerHTML = `
                    <div style="text-align:center; padding:60px 20px; color:var(--text-muted);">
                        <div style="font-size:48px; margin-bottom:16px;">💬</div>
                        <div style="font-size:14px; margin-bottom:8px;">No dialogues yet</div>
                        <div style="font-size:12px;">Create dialogue trees to give your NPCs conversations</div>
                    </div>
                `;
                return;
            }

            listSection.innerHTML = `
                <div style="display:grid; gap:12px;">
                    ${dialogues.map((dlg, idx) => {
                const npc = npcs.find(n => n.id === dlg.npcId);
                const nodeCount = (dlg.nodes || []).length;
                return `
                            <div class="card" style="padding:12px; background:var(--bg-base); display:flex; gap:12px; align-items:center;">
                                <div style="font-size:32px;">💬</div>
                                <div style="flex:1;">
                                    <div style="font-weight:600; font-size:13px;">${dlg.name || dlg.id}</div>
                                    <div style="font-size:11px; color:var(--text-muted); margin-top:2px;">
                                        👤 ${npc?.name || '(Unassigned)'} • ${nodeCount} nodes
                                    </div>
                                </div>
                                <div style="display:flex; gap:4px;">
                                    <button class="btn btn-ghost btn-sm dlg-edit" data-idx="${idx}" title="Edit">✏️</button>
                                    <button class="btn btn-ghost btn-sm dlg-export" data-idx="${idx}" title="Export JSON">📤</button>
                                    <button class="btn btn-ghost btn-sm dlg-delete" data-idx="${idx}" title="Delete" style="color:var(--status-error);">×</button>
                                </div>
                            </div>
                        `;
            }).join('')}
                </div>
            `;

            // Wire edit buttons
            listSection.querySelectorAll('.dlg-edit').forEach(btnNode => {
                const btn = /** @type {HTMLElement} */ (btnNode);
                btn.onclick = () => {
                    const idx = parseInt(btn.dataset.idx);
                    showDialogueEditor(state.rpg.dialogues[idx]);
                };
            });

            // Wire export buttons
            listSection.querySelectorAll('.dlg-export').forEach(btnNode => {
                const btn = /** @type {HTMLElement} */ (btnNode);
                btn.onclick = () => {
                    const idx = parseInt(btn.dataset.idx);
                    const dlg = state.rpg.dialogues[idx];
                    const json = JSON.stringify(dlg, null, 2);
                    navigator.clipboard.writeText(json);
                    if (A.UI?.Toast) A.UI.Toast.show('Dialogue JSON copied to clipboard', 'success');
                };
            });

            // Wire delete buttons
            listSection.querySelectorAll('.dlg-delete').forEach(btnNode => {
                const btn = /** @type {HTMLElement} */ (btnNode);
                btn.onclick = () => {
                    const idx = parseInt(btn.dataset.idx);
                    const dlg = state.rpg.dialogues[idx];
                    if (confirm(`Delete dialogue "${dlg.name || dlg.id}"?`)) {
                        state.rpg.dialogues.splice(idx, 1);
                        A.State.notify();
                        renderList();
                    }
                };
            });
        };

        // Create new dialogue
        header.querySelector('#btn-create').onclick = () => {
            const newDlg = {
                id: 'dlg_' + Date.now(),
                name: 'New Dialogue',
                npcId: null,
                nodes: [
                    {
                        id: 'start',
                        text: 'Hello, traveler.',
                        choices: [
                            { label: 'Goodbye', next: null }
                        ]
                    }
                ]
            };
            state.rpg.dialogues.push(newDlg);
            A.State.notify();
            renderList();
            showDialogueEditor(newDlg);
        };

        // Import JSON
        /** @type {HTMLElement} */ (header.querySelector('#btn-import')).onclick = () => {
            const jsonText = prompt('Paste dialogue JSON:');
            if (!jsonText) return;

            try {
                const data = JSON.parse(jsonText);
                if (!data.nodes || !Array.isArray(data.nodes)) {
                    throw new Error('Invalid format: missing nodes array');
                }
                data.id = data.id || 'dlg_' + Date.now();
                data.name = data.name || 'Imported Dialogue';
                state.rpg.dialogues.push(data);
                A.State.notify();
                renderList();
                if (A.UI?.Toast) A.UI.Toast.show('Dialogue imported!', 'success');
            } catch (e) {
                A.UI.Toast.show('Import failed: ' + e.message, 'error');
            }
        };

        // Dialogue Editor Modal
        const showDialogueEditor = (dlg) => {
            const modal = document.createElement('div');
            modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;z-index:10000;';

            let selectedNodeIdx = 0;

            const renderEditor = () => {
                const node = dlg.nodes[selectedNodeIdx] || dlg.nodes[0];

                modal.innerHTML = `
                    <div style="background:var(--bg-elevated); width:900px; max-width:95vw; height:80vh; border-radius:12px; display:flex; flex-direction:column; overflow:hidden; box-shadow:0 20px 50px rgba(0,0,0,0.5); border:1px solid var(--border-default);">
                        <!-- Header -->
                        <div style="padding:16px; border-bottom:1px solid var(--border-subtle); display:flex; justify-content:space-between; align-items:center;">
                            <div style="display:flex; gap:16px; align-items:center;">
                                <input type="text" id="dlg-name" class="input" value="${dlg.name || ''}" placeholder="Dialogue Name" style="font-size:14px; font-weight:600; width:200px;">
                                <select id="dlg-npc" class="input" style="width:150px;">
                                    <option value="">(No NPC)</option>
                                    ${npcs.map(n => `<option value="${n.id}" ${dlg.npcId === n.id ? 'selected' : ''}>${n.name}</option>`).join('')}
                                </select>
                            </div>
                            <button class="btn btn-ghost" id="modal-close">×</button>
                        </div>
                        
                        <!-- Main Content -->
                        <div style="flex:1; display:flex; overflow:hidden;">
                            <!-- Node List -->
                            <div style="width:200px; border-right:1px solid var(--border-subtle); overflow-y:auto; padding:12px;">
                                <div style="font-size:11px; color:var(--text-muted); margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
                                    <span>NODES</span>
                                    <button id="btn-add-node" class="btn btn-ghost btn-sm" style="padding:2px 6px;">+</button>
                                </div>
                                <div id="node-list" style="display:flex; flex-direction:column; gap:4px;">
                                    ${dlg.nodes.map((n, i) => `
                                        <div class="node-item ${i === selectedNodeIdx ? 'selected' : ''}" data-idx="${i}" style="
                                            padding:8px;
                                            background:${i === selectedNodeIdx ? 'var(--accent-primary)' : 'var(--bg-base)'};
                                            color:${i === selectedNodeIdx ? 'white' : 'inherit'};
                                            border-radius:6px;
                                            cursor:pointer;
                                            font-size:11px;
                                            display:flex;
                                            justify-content:space-between;
                                            align-items:center;
                                        ">
                                            <span>${n.id}</span>
                                            ${i > 0 ? `<button class="btn-del-node btn btn-ghost" data-idx="${i}" style="padding:0 4px; font-size:10px; color:${i === selectedNodeIdx ? 'white' : 'var(--status-error)'};">×</button>` : ''}
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                            
                            <!-- Node Editor -->
                            <div style="flex:1; padding:16px; overflow-y:auto; display:flex; flex-direction:column; gap:16px;">
                                ${node ? `
                                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                                        <div>
                                            <label class="label">Node ID</label>
                                            <input type="text" id="node-id" class="input" value="${node.id}" style="width:100%;">
                                        </div>
                                        <div>
                                            <label class="label">Condition (optional)</label>
                                            <input type="text" id="node-condition" class="input" value="${node.condition || ''}" placeholder="e.g. quest:sword:completed" style="width:100%;">
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label class="label">NPC Text</label>
                                        <textarea id="node-text" class="input" rows="4" style="width:100%; resize:vertical;">${node.text || ''}</textarea>
                                    </div>
                                    
                                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                                        <div>
                                            <label class="label">Auto-Next Node (if no choices)</label>
                                            <select id="node-next" class="input" style="width:100%;">
                                                <option value="">(End conversation)</option>
                                                ${dlg.nodes.filter(n2 => n2.id !== node.id).map(n2 => `<option value="${n2.id}" ${node.next === n2.id ? 'selected' : ''}>${n2.id}</option>`).join('')}
                                            </select>
                                        </div>
                                        <div>
                                            <label class="label">Fallback Node (if condition fails)</label>
                                            <select id="node-fallback" class="input" style="width:100%;">
                                                <option value="">(None)</option>
                                                ${dlg.nodes.filter(n2 => n2.id !== node.id).map(n2 => `<option value="${n2.id}" ${node.fallback === n2.id ? 'selected' : ''}>${n2.id}</option>`).join('')}
                                            </select>
                                        </div>
                                    </div>
                                    
                                    <div style="border-top:1px solid var(--border-subtle); padding-top:16px;">
                                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                                            <label class="label" style="margin:0;">Player Choices</label>
                                            <button id="btn-add-choice" class="btn btn-sm btn-secondary">+ Add Choice</button>
                                        </div>
                                        <div id="choices-list" style="display:flex; flex-direction:column; gap:8px;">
                                            ${(!node.choices || node.choices.length === 0) ? `
                                                <div style="text-align:center; padding:16px; color:var(--text-muted); font-size:11px; background:var(--bg-base); border-radius:6px;">
                                                    No choices - will auto-continue or end
                                                </div>
                                            ` : node.choices.map((choice, ci) => `
                                                <div class="card" style="padding:8px; background:var(--bg-base); display:flex; gap:8px; align-items:center;">
                                                    <input type="text" class="input choice-label" data-idx="${ci}" value="${choice.label || ''}" placeholder="Choice text" style="flex:2;">
                                                    <select class="input choice-next" data-idx="${ci}" style="flex:1;">
                                                        <option value="">(End)</option>
                                                        ${dlg.nodes.filter(n2 => n2.id !== node.id).map(n2 => `<option value="${n2.id}" ${choice.next === n2.id ? 'selected' : ''}>${n2.id}</option>`).join('')}
                                                    </select>
                                                    <select class="input choice-action" data-idx="${ci}" style="width:100px;">
                                                        <option value="">No action</option>
                                                        <option value="openShop" ${choice.action === 'openShop' ? 'selected' : ''}>Open Shop</option>
                                                        <option value="offerQuest" ${choice.action === 'offerQuest' ? 'selected' : ''}>Offer Quest</option>
                                                        <option value="turnInQuest" ${choice.action === 'turnInQuest' ? 'selected' : ''}>Turn In Quest</option>
                                                        <option value="setFlag" ${choice.action === 'setFlag' ? 'selected' : ''}>Set Flag</option>
                                                        <option value="giveItem" ${choice.action === 'giveItem' ? 'selected' : ''}>Give Item</option>
                                                        <option value="giveGold" ${choice.action === 'giveGold' ? 'selected' : ''}>Give Gold</option>
                                                    </select>
                                                    <input type="text" class="input choice-data" data-idx="${ci}" value="${choice.actionData || ''}" placeholder="Action data" style="width:80px;" ${choice.action ? '' : 'disabled'}>
                                                    <button class="btn btn-ghost choice-del" data-idx="${ci}" style="color:var(--status-error);">×</button>
                                                </div>
                                            `).join('')}
                                        </div>
                                    </div>
                                ` : '<div>No node selected</div>'}
                            </div>
                        </div>
                        
                        <!-- Footer -->
                        <div style="padding:12px 16px; border-top:1px solid var(--border-subtle); display:flex; justify-content:flex-end; gap:8px;">
                            <button class="btn btn-ghost" id="modal-cancel">Cancel</button>
                            <button class="btn btn-primary" id="modal-save">Save</button>
                        </div>
                    </div>
                `;

                // Wire events
                /** @type {HTMLElement} */ (modal.querySelector('#modal-close')).onclick = () => modal.remove();
                /** @type {HTMLElement} */ (modal.querySelector('#modal-cancel')).onclick = () => modal.remove();
                modal.onclick = (e) => { if (e.target === modal) modal.remove(); };

                // Header inputs
                modal.querySelector('#dlg-name').onchange = (e) => { dlg.name = e.target.value; };
                modal.querySelector('#dlg-npc').onchange = (e) => { dlg.npcId = e.target.value || null; };

                // Node list navigation
                modal.querySelectorAll('.node-item').forEach(itemNode => {
                    const item = /** @type {HTMLElement} */ (itemNode);
                    item.onclick = (e) => {
                        if (/** @type {HTMLElement} */ (e.target).classList.contains('btn-del-node')) return;
                        selectedNodeIdx = parseInt(item.dataset.idx);
                        renderEditor();
                    };
                });

                // Delete node
                modal.querySelectorAll('.btn-del-node').forEach(btn => {
                    btn.onclick = (e) => {
                        e.stopPropagation();
                        const idx = parseInt(btn.dataset.idx);
                        if (idx > 0) {
                            dlg.nodes.splice(idx, 1);
                            if (selectedNodeIdx >= dlg.nodes.length) selectedNodeIdx = dlg.nodes.length - 1;
                            renderEditor();
                        }
                    };
                });

                // Add node
                modal.querySelector('#btn-add-node').onclick = () => {
                    const newId = 'node_' + (dlg.nodes.length + 1);
                    dlg.nodes.push({
                        id: newId,
                        text: 'New dialogue text...',
                        choices: []
                    });
                    selectedNodeIdx = dlg.nodes.length - 1;
                    renderEditor();
                };

                // Node editor inputs
                const currentNode = dlg.nodes[selectedNodeIdx];
                if (currentNode) {
                    modal.querySelector('#node-id').onchange = (e) => { currentNode.id = e.target.value; renderEditor(); };
                    modal.querySelector('#node-condition').onchange = (e) => { currentNode.condition = e.target.value || null; };
                    modal.querySelector('#node-text').onchange = (e) => { currentNode.text = e.target.value; };
                    modal.querySelector('#node-next').onchange = (e) => { currentNode.next = e.target.value || null; };
                    modal.querySelector('#node-fallback').onchange = (e) => { currentNode.fallback = e.target.value || null; };

                    // Add choice
                    modal.querySelector('#btn-add-choice').onclick = () => {
                        if (!currentNode.choices) currentNode.choices = [];
                        currentNode.choices.push({ label: 'New choice', next: null });
                        renderEditor();
                    };

                    // Choice inputs
                    modal.querySelectorAll('.choice-label').forEach(input => {
                        input.onchange = (e) => {
                            const ci = parseInt(e.target.dataset.idx);
                            currentNode.choices[ci].label = e.target.value;
                        };
                    });
                    modal.querySelectorAll('.choice-next').forEach(select => {
                        select.onchange = (e) => {
                            const ci = parseInt(e.target.dataset.idx);
                            currentNode.choices[ci].next = e.target.value || null;
                        };
                    });
                    modal.querySelectorAll('.choice-action').forEach(select => {
                        select.onchange = (e) => {
                            const ci = parseInt(e.target.dataset.idx);
                            currentNode.choices[ci].action = e.target.value || null;
                            renderEditor();
                        };
                    });
                    modal.querySelectorAll('.choice-data').forEach(input => {
                        input.onchange = (e) => {
                            const ci = parseInt(e.target.dataset.idx);
                            currentNode.choices[ci].actionData = e.target.value || null;
                        };
                    });
                    modal.querySelectorAll('.choice-del').forEach(btn => {
                        btn.onclick = () => {
                            const ci = parseInt(btn.dataset.idx);
                            currentNode.choices.splice(ci, 1);
                            renderEditor();
                        };
                    });
                }

                // Save
                modal.querySelector('#modal-save').onclick = () => {
                    A.State.notify();
                    modal.remove();
                    renderList();
                    if (A.UI?.Toast) A.UI.Toast.show('Dialogue saved', 'success');
                };
            };

            document.body.appendChild(modal);
            renderEditor();
        };

        renderList();
    }

    A.registerPanel('rpg_dialogues', {
        label: 'Dialogues',
        subtitle: 'NPC Conversations',
        category: 'RPG Experiment',
        subcategory: 'Game Master',
        order: 15,
        gmOnly: true,
        icon: '💬',
        render: render
    });

})(window.Anansi);
