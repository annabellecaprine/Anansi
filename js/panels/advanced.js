/*
 * Anansi Panel: Advanced Editor (SBX Parity)
 * File: js/panels/advanced.js
 * Category: Advanced
 * Port: ScriptBuilder 3000 (sbx.module.page.js)
 */

(function (A) {
    'use strict';

    // --- Helpers ---
    function uid(pre) { return (pre || 'u') + '_' + Math.random().toString(36).substr(2, 6); }
    function clone(o) { try { return JSON.parse(JSON.stringify(o)); } catch (e) { return {}; } }

    // --- CONSTANTS ---
    const CONDITION_TYPES = [
        { id: 'anyInList', label: 'Any in List (History)' },
        { id: 'noneInList', label: 'None in List (History)' },
        { id: 'countInHistory', label: 'Count in History' },
        { id: 'messageCountComparison', label: 'Message Count Check' },
        { id: 'memoryNumberComparison', label: 'Memory (Number)' },
        { id: 'memoryStringContains', label: 'Memory (String)' },
        { id: 'derivedNumberComparison', label: 'Derived Value Check' },
        { id: 'lastUserMessageLength', label: 'Last Message Length' }
    ];

    // --- UI RENDER SYSTEM ---
    function render(container, context) { // context: { boundTo: 'uuid', boundName: 'Name' }
        container.innerHTML = ''; // PERF: Clear container first to prevent duplication on re-render

        const state = A.State.get();
        if (!state.sbx) state.sbx = { lists: [], derived: [], rules: [] }; // Global SBX state

        // Filter Mode?
        const isBound = context && context.boundTo;

        // Layout
        container.style.height = '100%';
        container.style.display = 'grid';
        container.style.gridTemplateColumns = '240px 1fr';
        container.style.gap = 'var(--space-4)';
        container.style.overflow = 'hidden';

        // 1. Sidebar (Tabs + Navigation)
        const sideCol = document.createElement('div');
        sideCol.className = 'card';
        sideCol.style.marginBottom = '0';
        sideCol.style.display = 'flex';
        sideCol.style.flexDirection = 'column';
        sideCol.style.padding = '0';

        // If Bound, hide tabs (only show Rules for this item)
        if (isBound) {
            sideCol.innerHTML = `
        <div style="padding:12px; background:var(--bg-elevated); border-bottom:1px solid var(--border-subtle);">
           <div style="font-size:10px; text-transform:uppercase; color:var(--accent-primary); font-weight:bold;">Logic For</div>
           <div style="font-weight:bold; font-size:14px;">${context.boundName || 'Entry'}</div>
           <button class="btn btn-ghost btn-xs" id="btn-back-adv" style="margin-top:4px;">&larr; Show All</button>
        </div>
        <div id="side-list" style="flex:1; overflow-y:auto; padding:0;"></div>
        <div class="card-footer" id="side-footer">
          <button class="btn btn-primary btn-sm" id="btn-add-side" style="width:100%;">+ Add Logic Chain</button>
        </div>
       `;
            sideCol.querySelector('#btn-back-adv').onclick = () => {
                // Clear binding
                render(container, null);
            };
        } else {
            sideCol.innerHTML = `
        <div style="display:flex; border-bottom:1px solid var(--border-subtle); background:var(--bg-elevated);">
           <div class="tab-btn active" id="tab-lists" style="flex:1; text-align:center; padding:12px; cursor:pointer; font-weight:bold; border-bottom:2px solid var(--accent-primary);">Lists</div>
           <div class="tab-btn" id="tab-deriv" style="flex:1; text-align:center; padding:12px; cursor:pointer; font-weight:bold; color:var(--text-muted);">Derived</div>
           <div class="tab-btn" id="tab-rules" style="flex:1; text-align:center; padding:12px; cursor:pointer; font-weight:bold; color:var(--text-muted);">Rules</div>
        </div>
        <div id="side-list" style="flex:1; overflow-y:auto; padding:0;"></div>
        <div class="card-footer" id="side-footer">
          <button class="btn btn-primary btn-sm" id="btn-add-side" style="width:100%;">+ Add Item</button>
        </div>
      `;
        }

        // 2. Main Content
        const mainCol = document.createElement('div');
        mainCol.className = 'card';
        mainCol.id = 'sbx-main';
        mainCol.style.marginBottom = '0';
        mainCol.style.padding = '0'; // We'll manage padding in sub-views
        mainCol.style.display = 'flex';
        mainCol.style.flexDirection = 'column';
        mainCol.style.overflow = 'hidden';

        container.appendChild(sideCol);
        container.appendChild(mainCol);

        // --- State & Routing ---
        let activeTab = (isBound ? 'rules' : 'lists'); // lists, derived, rules
        let activeId = null;

        const tabs = isBound ? {} : {
            lists: sideCol.querySelector('#tab-lists'),
            deriv: sideCol.querySelector('#tab-deriv'),
            rules: sideCol.querySelector('#tab-rules')
        };

        function switchTab(t) {
            if (isBound) return; // No tabs in bound mode
            activeTab = t;
            activeId = null;
            // UI update
            Object.keys(tabs).forEach(k => {
                tabs[k].style.color = (k === t.substr(0, 1) || k === t) ? 'var(--text-primary)' : 'var(--text-muted)';
                tabs[k].style.borderBottomColor = (k === t.substr(0, 1) || k === t) ? 'var(--accent-primary)' : 'transparent';
            });
            // Specific highlighting
            tabs.lists.style.color = (t === 'lists' ? 'var(--text-primary)' : 'var(--text-muted)');
            tabs.lists.style.borderBottomColor = (t === 'lists' ? 'var(--accent-primary)' : 'transparent');
            tabs.deriv.style.color = (t === 'derived' ? 'var(--text-primary)' : 'var(--text-muted)');
            tabs.deriv.style.borderBottomColor = (t === 'derived' ? 'var(--accent-primary)' : 'transparent');
            tabs.rules.style.color = (t === 'rules' ? 'var(--text-primary)' : 'var(--text-muted)');
            tabs.rules.style.borderBottomColor = (t === 'rules' ? 'var(--accent-primary)' : 'transparent');

            refreshSidebar();
            renderMain();
        }

        if (!isBound) {
            tabs.lists.onclick = () => switchTab('lists');
            tabs.deriv.onclick = () => switchTab('derived');
            tabs.rules.onclick = () => switchTab('rules');
        }

        sideCol.querySelector('#btn-add-side').onclick = () => {
            if (activeTab === 'lists') {
                const id = uid('lst');
                state.sbx.lists.push({ id: id, name: 'New List', itemsText: '' });
                activeId = id;
            } else if (activeTab === 'derived') {
                const id = uid('der');
                state.sbx.derived.push({
                    id: id, name: 'New Metric',
                    sourceType: 'listCount', listId: '', window: 10
                });
                activeId = id;
            } else {
                const id = uid('rule');
                state.sbx.rules.push({
                    id: id,
                    name: isBound ? (context.boundName + ' Logic') : 'New Rule Chain',
                    enabled: true,
                    boundTo: isBound ? context.boundTo : null,
                    chain: [makeBlock('if')]
                });
                activeId = id;
            }
            A.State.notify();
            refreshSidebar();
            renderMain();
        };

        function refreshSidebar() {
            const listEl = sideCol.querySelector('#side-list');
            listEl.innerHTML = '';

            let items = [];
            if (activeTab === 'lists') items = state.sbx.lists;
            else if (activeTab === 'derived') items = state.sbx.derived;
            else {
                items = state.sbx.rules;
                if (isBound) items = items.filter(r => r.boundTo === context.boundTo);
                else items = items.filter(r => !r.boundTo); // Show global rules by default if not bound
            }

            if (!items.length) {
                listEl.innerHTML = '<div class="muted" style="padding:12px; text-align:center;">No items.</div>';
                return;
            }

            items.forEach(item => {
                const row = document.createElement('div');
                row.className = 'list-item';
                row.style.padding = '10px';
                row.style.borderBottom = '1px solid var(--border-subtle)';
                row.style.cursor = 'pointer';
                if (item.id === activeId) { row.style.background = 'var(--bg-surface)'; row.style.borderLeft = '3px solid var(--accent-primary)'; }

                row.innerHTML = `<div style="font-weight:bold; font-size:13px;">${item.name || item.key || 'Unnamed'}</div>`;
                row.onclick = () => { activeId = item.id; refreshSidebar(); renderMain(); };
                listEl.appendChild(row);
            });
        }

        function renderMain() {
            mainCol.innerHTML = '';
            if (!activeId) {
                mainCol.innerHTML = '<div class="muted" style="padding:20px; text-align:center;">Select or Create an item</div>';
                return;
            }

            let item = null;
            if (activeTab === 'lists') item = state.sbx.lists.find(i => i.id === activeId);
            else if (activeTab === 'derived') item = state.sbx.derived.find(i => i.id === activeId);
            else item = state.sbx.rules.find(i => i.id === activeId);

            if (!item) { activeId = null; renderMain(); return; }

            // Container
            const container = document.createElement('div');
            container.style.flex = '1';
            container.style.padding = '0';
            container.style.display = 'flex';
            container.style.flexDirection = 'column';
            container.style.overflow = 'hidden';

            // Common Header
            const header = document.createElement('div');
            header.className = 'card-header';
            header.innerHTML = `
          <input class="input" id="main-name" value="${item.name || ''}" placeholder="Name/Label" style="font-weight:bold; font-size:14px; flex:1;">
          <button class="btn btn-ghost btn-sm" id="main-del" style="color:var(--status-error); margin-left:8px;">Delete</button>
       `;

            // Delete Logic
            header.querySelector('#main-del').onclick = () => {
                if (confirm('Delete this item?')) {
                    if (activeTab === 'lists') state.sbx.lists = state.sbx.lists.filter(x => x.id !== activeId);
                    else if (activeTab === 'derived') state.sbx.derived = state.sbx.derived.filter(x => x.id !== activeId);
                    else state.sbx.rules = state.sbx.rules.filter(x => x.id !== activeId);
                    activeId = null;
                    A.State.notify(); refreshSidebar(); renderMain();
                }
            };
            header.querySelector('#main-name').oninput = (e) => { item.name = e.target.value; A.State.notify(); refreshSidebar(); }; // Sync sidebar name

            container.appendChild(header);

            // Body
            const body = document.createElement('div');
            body.className = 'card-body';
            body.style.flex = '1';
            body.style.overflowY = 'auto';
            body.style.paddingBottom = '60px';

            if (activeTab === 'lists') renderListEditor(body, item);
            else if (activeTab === 'derived') renderDerivedEditor(body, item, state);
            else {
                renderRuleChainEditor(body, item, state);

                // Actor Association (Flow Explorer) for Rules
                const actorSec = document.createElement('div');
                actorSec.style.marginTop = '16px';
                actorSec.style.borderTop = '1px solid var(--border-subtle)';
                actorSec.style.paddingTop = '12px';
                actorSec.innerHTML = `<div style="font-size:10px; text-transform:uppercase; font-weight:bold; color:var(--text-muted); margin-bottom:8px;">Associate with Actors (Flow Explorer Only)</div><div id="actor-associations" style="display:flex; flex-wrap:wrap; gap:8px;"></div>`;
                body.appendChild(actorSec);

                const assocActors = Object.values(state.nodes?.actors?.items || {});
                const actorAssocList = actorSec.querySelector('#actor-associations');
                if (assocActors.length === 0) {
                    actorAssocList.innerHTML = '<div style="font-size:11px; color:var(--text-muted); padding:4px;">No actors found.</div>';
                } else {
                    if (!item.associatedActors) item.associatedActors = [];
                    assocActors.forEach(actor => {
                        const isChecked = item.associatedActors.includes(actor.id);
                        const lbl = document.createElement('label');
                        lbl.style.cssText = 'display:flex; align-items:center; gap:4px; font-size:11px; padding:2px 6px; background:var(--bg-elevated); border-radius:4px; border:1px solid var(--border-subtle); cursor:pointer; user-select:none;';
                        if (isChecked) lbl.style.borderColor = 'var(--accent-primary)';
                        lbl.innerHTML = `<input type="checkbox" style="margin:0;" ${isChecked ? 'checked' : ''}> ${actor.name || 'Unknown'}`;
                        lbl.querySelector('input').onchange = (e) => {
                            if (e.target.checked) {
                                item.associatedActors.push(actor.id);
                                lbl.style.borderColor = 'var(--accent-primary)';
                            } else {
                                item.associatedActors = item.associatedActors.filter(id => id !== actor.id);
                                lbl.style.borderColor = 'var(--border-subtle)';
                            }
                            A.State.notify();
                        };
                        actorAssocList.appendChild(lbl);
                    });
                }
            }

            container.appendChild(body);
            mainCol.appendChild(container);
        }

        // --- Sub-Editors ---

        function renderListEditor(container, item) {
            container.innerHTML = `
         <div style="font-size:12px; font-weight:bold; margin-bottom:6px; color:var(--text-muted);">List Items (One per line)</div>
         <textarea class="input" id="inp-items" style="width:100%; height:300px; resize:vertical; font-family:monospace;">${item.itemsText || ''}</textarea>
         <div class="muted" style="margin-top:8px; font-size:11px;">These normalized keywords can be referenced by 'Any In List' conditions.</div>
       `;
            container.querySelector('#inp-items').oninput = e => { item.itemsText = e.target.value; A.State.notify(); };
        }

        function renderDerivedEditor(container, item, state) {
            // List Options
            let listOpts = '<option value="">(Select List)</option>';
            state.sbx.lists.forEach(l => {
                listOpts += `<option value="${l.id}" ${l.id === item.listId ? 'selected' : ''}>${l.name}</option>`;
            });

            container.innerHTML = `
         <div style="margin-bottom:12px;">
            <label class="sc-lab">Metric Type</label>
            <select class="input" id="sel-type">
               <option value="listCount">Keyword Count in History</option>
            </select>
         </div>
         <div style="margin-bottom:12px;">
            <label class="sc-lab">Source List</label>
            <select class="input" id="sel-list">${listOpts}</select>
         </div>
         <div style="margin-bottom:12px;">
            <label class="sc-lab">Scan Window (Last N Messages)</label>
            <input type="number" class="input" id="inp-win" value="${item.window || 10}">
         </div>
         <div class="muted" style="font-size:11px;">Calculates the frequency of keywords from the selected list in the text history.</div>
       `;

            container.querySelector('#sel-list').onchange = e => { item.listId = e.target.value; A.State.notify(); };
            container.querySelector('#inp-win').oninput = e => { item.window = parseInt(e.target.value); A.State.notify(); };
        }

        // --- Rule Chain Logic ---

        function makeBlock(type) {
            return {
                id: uid('blk'),
                type: type, // if, elseif, else
                join: 'and', // and, or (for top level conditions)
                conditions: [],
                actions: [{ target: 'character.personality', mode: 'append', text: '' }]
            };
        }

        function renderRuleChainEditor(container, item, state) {
            // Chain visualization
            container.innerHTML = `<div id="chain-root" style="display:flex; flex-direction:column; gap:16px;"></div>
                              <div style="margin-top:20px; border-top:1px dashed var(--border-subtle); padding-top:10px;">
                                <button class="btn btn-ghost btn-sm" id="btn-add-elseif">+ Add ELSE IF</button>
                                <button class="btn btn-ghost btn-sm" id="btn-add-else">+ Add ELSE</button>
                              </div>`;

            const rootEl = container.querySelector('#chain-root');

            function renderChain() {
                rootEl.innerHTML = '';
                item.chain.forEach((block, idx) => {
                    const card = document.createElement('div');
                    card.className = 'sc-box'; // Recycled style from scoring
                    card.style.borderLeft = block.type === 'if' ? '3px solid var(--accent-primary)' : '3px solid var(--border-subtle)';

                    // Block Header
                    let headHtml = `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                   <strong style="text-transform:uppercase; color:${block.type === 'if' ? 'var(--accent-primary)' : 'var(--text-muted)'};">${block.type}</strong>
                   ${idx > 0 ? `<button class="btn btn-ghost btn-xs del-blk" data-idx="${idx}" style="color:var(--status-error);">X</button>` : ''}
                </div>
             `;

                    // Conditions (Unless ELSE)
                    if (block.type !== 'else') {
                        headHtml += `
                 <div style="margin-bottom:8px; padding:8px; background:var(--bg-base); border-radius:4px;">
                   <div style="font-size:11px; font-weight:bold; margin-bottom:4px;">CONDITIONS</div>
                   <div class="cond-list" id="conds-${block.id}"></div>
                   <button class="btn btn-ghost btn-xs add-cond" data-idx="${idx}" style="margin-top:4px;">+ Add Condition</button>
                 </div>
                `;
                    }

                    // Actions
                    headHtml += `
               <div style="margin-top:8px;">
                 <div style="font-size:11px; font-weight:bold; margin-bottom:4px;">ACTIONS (Then...)</div>
                 <div class="act-list" id="acts-${block.id}"></div>
               </div>
             `;

                    card.innerHTML = headHtml;
                    rootEl.appendChild(card);

                    // Render Conditions
                    if (block.type !== 'else') {
                        const condRoot = card.querySelector('#conds-' + block.id);
                        block.conditions.forEach((c, cIdx) => {
                            const cRow = document.createElement('div');
                            cRow.style.display = 'flex';
                            cRow.style.gap = '8px';
                            cRow.style.marginBottom = '4px';
                            cRow.style.alignItems = 'center';

                            // Type Selector
                            let typeOpts = '';
                            CONDITION_TYPES.forEach(t => typeOpts += `<option value="${t.id}" ${t.id === c.type ? 'selected' : ''}>${t.label}</option>`);

                            cRow.innerHTML = `
                     <select class="input btn-xs c-type" style="width:140px;">${typeOpts}</select>
                     <div class="c-detail" style="flex:1;"></div>
                     <button class="btn btn-ghost btn-xs c-del" style="color:var(--status-error);">x</button>
                   `;

                            // Detail View
                            const detail = cRow.querySelector('.c-detail');
                            renderConditionDetail(detail, c, state); // Helper

                            // Bindings
                            cRow.querySelector('.c-type').onchange = e => { c.type = e.target.value; renderChain(); A.State.notify(); };
                            cRow.querySelector('.c-del').onclick = () => { block.conditions.splice(cIdx, 1); renderChain(); A.State.notify(); };

                            condRoot.appendChild(cRow);
                        });
                    }

                    // Render Actions
                    const actRoot = card.querySelector('#acts-' + block.id);
                    block.actions.forEach((a, aIdx) => {
                        const aRow = document.createElement('div');
                        aRow.innerHTML = `
                  <textarea class="input" style="width:100%; height:60px; resize:vertical;" placeholder="Text to inject...">${a.text || ''}</textarea>
                  <div style="display:flex; justify-content:flex-end; margin-top:2px;">
                    <select class="input btn-xs" style="width:auto;">
                      <option value="character.personality" ${a.target === 'character.personality' ? 'selected' : ''}>Personality</option>
                      <option value="character.scenario" ${a.target === 'character.scenario' ? 'selected' : ''}>Scenario</option>
                    </select>
                  </div>
                `;
                        aRow.querySelector('textarea').oninput = e => { a.text = e.target.value; A.State.notify(); };
                        aRow.querySelector('select').onchange = e => { a.target = e.target.value; A.State.notify(); };
                        actRoot.appendChild(aRow);
                    });

                    // Event Delegation for Add Buttons
                    if (card.querySelector('.add-cond')) {
                        card.querySelector('.add-cond').onclick = () => {
                            block.conditions.push({ type: 'anyInList', listId: '', op: '>=', threshold: 1 });
                            renderChain(); A.State.notify();
                        };
                    }
                    if (card.querySelector('.del-blk')) {
                        card.querySelector('.del-blk').onclick = () => {
                            item.chain.splice(idx, 1);
                            renderChain(); A.State.notify();
                        };
                    }

                });
            }
            renderChain();

            // Add Blocks
            container.querySelector('#btn-add-elseif').onclick = () => { item.chain.push(makeBlock('elseif')); renderChain(); addActionTokenCounters(); A.State.notify(); };
            container.querySelector('#btn-add-else').onclick = () => { item.chain.push(makeBlock('else')); renderChain(); addActionTokenCounters(); A.State.notify(); };

            // Add token counters to action textareas
            const addActionTokenCounters = () => {
                rootEl.querySelectorAll('textarea').forEach(textarea => {
                    if (!textarea.nextElementSibling || (!textarea.nextElementSibling.classList.contains('token-badge') && textarea.nextElementSibling.tagName !== 'DIV')) {
                        A.Utils.addTokenCounter(textarea, null);
                    }
                });
            };
            addActionTokenCounters();
        }

        function renderConditionDetail(el, c, state) {
            // Dynamic fields based on type
            let html = '';
            if (c.type.includes('List')) {
                let listOpts = `<option value="">(Select List)</option>`;
                state.sbx.lists.forEach(l => listOpts += `<option value="${l.id}" ${l.id === c.listId ? 'selected' : ''}>${l.name}</option>`);
                html = `<select class="input btn-xs" id="c-lst">${listOpts}</select>`;
            }
            else if (c.type === 'messageCountComparison') {
                html = `
            <select class="input btn-xs" id="c-op" style="width:40px;">
              <option value=">=" ${c.op === '>=' ? 'selected' : ''}>≥</option>
              <option value="<=" ${c.op === '<=' ? 'selected' : ''}>≤</option>
            </select>
            <input type="number" class="input btn-xs" id="c-val" value="${c.threshold}" style="width:60px;">
          `;
            }

            el.innerHTML = `<div style="display:flex; gap:4px;">${html}</div>`;

            // Wire
            if (el.querySelector('#c-lst')) el.querySelector('#c-lst').onchange = e => { c.listId = e.target.value; A.State.notify(); };
            if (el.querySelector('#c-op')) el.querySelector('#c-op').onchange = e => { c.op = e.target.value; A.State.notify(); };
            if (el.querySelector('#c-val')) el.querySelector('#c-val').oninput = e => { c.threshold = parseInt(e.target.value); A.State.notify(); };
        }


    }

    A.registerPanel('advanced', {
        label: 'Custom Rules',
        subtitle: 'Logic Chains',
        category: 'Weave',
        render: render
    });

})(window.Anansi);
