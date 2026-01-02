/*
 * Anansi Panel: Scoring & Advanced Logic
 * File: js/panels/scoring.js
 * Category: Magic
 * Parity: ScriptBuilder 3000 (scoring.panel.js + conditionCombiner.panel.js)
 */

(function (A) {
    'use strict';

    // --- Logic Helpers ---
    function splitKeywords(text) {
        return (text || '').split(/[\n,]+/).map(s => s.trim()).filter(s => s);
    }

    // --- UI Render ---
    let currentTab = 'basic'; // 'basic', 'advanced'
    let currentId = null;

    function render(container) {
        const state = A.State.get();
        if (!state.scoring) state.scoring = { topics: [], advanced: [] };
        if (!state.scoring.topics) state.scoring.topics = [];
        if (!state.scoring.advanced) state.scoring.advanced = [];

        // Layout
        container.style.height = '100%';
        container.style.display = 'grid';
        container.style.gridTemplateColumns = '220px 1fr';
        container.style.gap = 'var(--space-4)';
        container.style.overflow = 'hidden';

        // 1. Sidebar
        const listCol = document.createElement('div');
        listCol.className = 'card';
        listCol.style.display = 'flex';
        listCol.style.flexDirection = 'column';
        listCol.style.marginBottom = '0';
        listCol.style.minHeight = '0';

        listCol.innerHTML = `
      <div style="display:flex; border-bottom:1px solid var(--border-subtle); background:var(--bg-elevated);">
         <div class="tab-btn active" id="tab-basic" style="flex:1; text-align:center; padding:10px; cursor:pointer; font-weight:bold; border-bottom:2px solid var(--accent-primary);">Basic</div>
         <div class="tab-btn" id="tab-adv" style="flex:1; text-align:center; padding:10px; cursor:pointer; font-weight:bold; color:var(--text-muted);">Advanced</div>
      </div>
      <div class="card-body" id="sc-list" style="padding:0; flex:1; overflow-y:auto;"></div>
      <div class="card-footer">
        <button class="btn btn-primary btn-sm" id="btn-add" style="width:100%;">+ Add Topic</button>
      </div>
    `;

        // 2. Editor
        const editorCol = document.createElement('div');
        editorCol.className = 'card';
        editorCol.id = 'sc-editor';
        editorCol.style.marginBottom = '0';
        editorCol.style.padding = '0';
        editorCol.style.display = 'flex';
        editorCol.style.flexDirection = 'column';
        editorCol.style.minHeight = '0';
        editorCol.style.overflow = 'hidden'; // Flex fix

        container.appendChild(listCol);
        container.appendChild(editorCol);

        const listBody = listCol.querySelector('#sc-list');
        const tabBasic = listCol.querySelector('#tab-basic');
        const tabAdv = listCol.querySelector('#tab-adv');
        const btnAdd = listCol.querySelector('#btn-add');

        // --- Tab Switching ---
        function switchTab(t) {
            currentTab = t;
            currentId = null;
            if (t === 'basic') {
                tabBasic.style.color = 'var(--text-primary)'; tabBasic.style.borderBottomColor = 'var(--accent-primary)';
                tabAdv.style.color = 'var(--text-muted)'; tabAdv.style.borderBottomColor = 'transparent';
                btnAdd.textContent = '+ Add Topic';
            } else {
                tabAdv.style.color = 'var(--text-primary)'; tabAdv.style.borderBottomColor = 'var(--accent-primary)';
                tabBasic.style.color = 'var(--text-muted)'; tabBasic.style.borderBottomColor = 'transparent';
                btnAdd.textContent = '+ Add Rule';
            }
            refreshList();
            renderEditor();
        }
        tabBasic.onclick = () => switchTab('basic');
        tabAdv.onclick = () => switchTab('advanced');

        // --- List Render ---
        function refreshList() {
            listBody.innerHTML = '';
            const items = ((currentTab === 'basic') ? state.scoring.topics : state.scoring.advanced) || [];

            if (!items.length) {
                listBody.innerHTML = '<div class="muted" style="padding:16px; text-align:center;">No items.</div>';
                return;
            }

            items.forEach((item) => {
                const row = document.createElement('div');
                row.className = 'list-item';
                row.style.padding = '10px';
                row.style.borderBottom = '1px solid var(--border-subtle)';
                row.style.cursor = 'pointer';
                if (item.id === currentId) { row.style.background = 'var(--bg-surface)'; row.style.borderLeft = '3px solid var(--accent-primary)'; }

                if (currentTab === 'basic') {
                    const kw = splitKeywords(item.keywordsText);
                    row.innerHTML = `
              <div style="font-weight:bold; font-size:13px; ${!item.enabled ? 'text-decoration:line-through;color:var(--text-muted);' : ''}">${item.name}</div>
              <div style="font-size:11px; color:var(--text-muted);">Depth ${item.depth} • ${kw.length} keys</div>
            `;
                } else {
                    // Advanced Summary
                    row.innerHTML = `
              <div style="font-weight:bold; font-size:13px; ${!item.enabled ? 'text-decoration:line-through;color:var(--text-muted);' : ''}">${item.name}</div>
              <div style="font-size:11px; color:var(--text-muted);">Combined Logic</div>
            `;
                }
                row.onclick = () => { currentId = item.id; refreshList(); renderEditor(); };
                listBody.appendChild(row);
            });
        }

        // --- Add Action ---
        btnAdd.onclick = () => {
            const id = (currentTab === 'basic' ? 'sc_' : 'adv_') + Math.random().toString(36).substr(2, 9);
            if (currentTab === 'basic') {
                state.scoring.topics.push({
                    id: id, name: 'New Topic', enabled: true,
                    min: 1, max: 5, useMax: false, depth: 10,
                    target: 'character.personality', keywordsText: '', contextField: '',
                    filters: { caseInsensitive: true, wholeWord: true, allowVariants: true, skipNegated: true }
                });
            } else {
                // Advanced Rule
                state.scoring.advanced.push({
                    id: id, name: 'New Combined Rule', enabled: true,
                    target: 'character.personality', contextField: '',
                    conditions: {
                        keywordsEnabled: true, keywordsText: '',
                        filters: { caseInsensitive: true, wholeWord: true, allowVariants: true, skipNegated: true },
                        windowEnabled: true, windowMin: 1, windowUseMax: false, windowMax: 100,
                        scoringEnabled: false, scoringTopicId: ''
                    }
                });
            }
            currentId = id;
            A.State.notify();
            refreshList();
            renderEditor();
        };

        // --- Editor Render ---
        function renderEditor() {
            editorCol.innerHTML = '';
            let item = null;
            if (currentTab === 'basic') item = state.scoring.topics.find(t => t.id === currentId);
            else item = state.scoring.advanced.find(t => t.id === currentId);

            if (!item) {
                editorCol.innerHTML = '<div class="muted" style="padding:20px; text-align:center;">Select an item</div>';
                return;
            }

            // Styles
            const style = `<style>
         .sc-row { display:flex; gap:12px; margin-bottom:12px; align-items:flex-start; }
         .sc-col { flex:1; display:flex; flex-direction:column; }
         .sc-lab { font-size:10px; text-transform:uppercase; font-weight:bold; color:var(--text-muted); margin-bottom:4px; }
         .sc-pill { font-size:11px; display:flex; align-items:center; gap:4px; cursor:pointer; user-select:none; }
         .sc-box { border:1px solid var(--border-subtle); border-radius:4px; padding:12px; margin-bottom:12px; background:var(--bg-base); }
         .sc-head { font-weight:bold; font-size:12px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center; }
       </style>`;
            editorCol.innerHTML = style;

            const header = document.createElement('div');
            header.className = 'card-header';
            header.innerHTML = `
          <input class="input" id="inp-name" value="${item.name}" style="font-weight:bold; font-size:14px; flex:1;">
          <label style="font-size:12px; display:flex; align-items:center; gap:4px;"><input type="checkbox" id="chk-en" ${item.enabled ? 'checked' : ''}> Enabled</label>
          <button class="btn btn-ghost btn-sm" id="btn-del" style="color:var(--status-error); margin-left:8px;">Delete</button>
       `;

            const body = document.createElement('div');
            body.className = 'card-body';
            body.style.flex = '1';
            body.style.overflowY = 'auto';
            body.style.minHeight = '0';
            body.style.paddingBottom = '60px';

            if (currentTab === 'basic') {
                // === BASIC EDITOR ===
                body.innerHTML = `
            <div class="sc-row">
              <div class="sc-col"><label class="sc-lab">Min Events (≥)</label><input type="number" class="input" id="inp-min" value="${item.min}"></div>
              <div class="sc-col">
                 <label class="sc-lab">Max Events (≤)</label>
                 <div style="display:flex; gap:4px;">
                   <input type="number" class="input" id="inp-max" value="${item.max}" ${!item.useMax ? 'disabled' : ''}>
                   <label style="font-size:10px; display:flex; align-items:center;"><input type="checkbox" id="chk-max" ${item.useMax ? 'checked' : ''}> Use</label>
                 </div>
              </div>
              <div class="sc-col"><label class="sc-lab">Scan Depth</label><input type="number" class="input" id="inp-depth" value="${item.depth}"></div>
            </div>

            <div class="sc-col" style="margin-bottom:12px;">
                <label class="sc-lab">Write Target</label>
                <select class="input" id="sel-tgt">
                   <option value="character.personality" ${item.target === 'character.personality' ? 'selected' : ''}>Personality</option>
                   <option value="character.scenario" ${item.target === 'character.scenario' ? 'selected' : ''}>Scenario</option>
                </select>
            </div>

            <div class="sc-box">
                <div class="sc-head">Keywords & Filters</div>
                <div style="display:flex; gap:12px; flex-wrap:wrap; margin-bottom:8px;">
                   <label class="sc-pill"><input type="checkbox" id="chk-case" ${item.filters.caseInsensitive ? 'checked' : ''}> Case-insensitive</label>
                   <label class="sc-pill"><input type="checkbox" id="chk-whole" ${item.filters.wholeWord ? 'checked' : ''}> Whole-word</label>
                   <label class="sc-pill"><input type="checkbox" id="chk-var" ${item.filters.allowVariants ? 'checked' : ''}> Variants</label>
                   <label class="sc-pill"><input type="checkbox" id="chk-neg" ${item.filters.skipNegated ? 'checked' : ''}> Skip Negated</label>
                </div>
                <textarea class="input" id="inp-keys" placeholder="One keyword per line..." style="height:100px; resize:vertical;">${item.keywordsText}</textarea>
            </div>

            <div class="sc-col" style="flex:1; min-height:100px;">
                <label class="sc-lab">Context Field (Injection)</label>
                <textarea class="input" id="inp-ctx" style="flex:1; resize:none;">${item.contextField}</textarea>
            </div>
          `;

                // Basic Bindings
                const upd = () => { A.State.notify(); refreshList(); };
                body.querySelector('#inp-min').oninput = e => { item.min = parseInt(e.target.value); upd(); };
                body.querySelector('#inp-max').oninput = e => { item.max = parseInt(e.target.value); upd(); };
                body.querySelector('#chk-max').onchange = e => { item.useMax = e.target.checked; renderEditor(); upd(); };
                body.querySelector('#inp-depth').oninput = e => { item.depth = parseInt(e.target.value); upd(); };
                body.querySelector('#sel-tgt').onchange = e => { item.target = e.target.value; upd(); };
                body.querySelector('#chk-case').onchange = e => { item.filters.caseInsensitive = e.target.checked; upd(); };
                body.querySelector('#chk-whole').onchange = e => { item.filters.wholeWord = e.target.checked; upd(); };
                body.querySelector('#chk-var').onchange = e => { item.filters.allowVariants = e.target.checked; upd(); };
                body.querySelector('#chk-neg').onchange = e => { item.filters.skipNegated = e.target.checked; upd(); };
                body.querySelector('#inp-keys').oninput = e => { item.keywordsText = e.target.value; upd(); };
                body.querySelector('#inp-ctx').oninput = e => { item.contextField = e.target.value; upd(); };

                // Add token counter to context field
                const ctxTextarea = body.querySelector('#inp-ctx');
                if (ctxTextarea) {
                    const label = ctxTextarea.previousElementSibling;
                    if (label) A.Utils.addTokenCounter(ctxTextarea, label);
                }

            } else {
                // === ADVANCED EDITOR (Combiner) ===
                const c = item.conditions;

                // Helper: Scoring Topics List
                let scoreOpts = '<option value="">(Select Topic)</option>';
                state.scoring.topics.forEach(t => {
                    scoreOpts += `<option value="${t.id}" ${t.id === c.scoringTopicId ? 'selected' : ''}>${t.name}</option>`;
                });

                body.innerHTML = `
             <div class="sc-col" style="margin-bottom:12px;">
                <label class="sc-lab">Write Target</label>
                <select class="input" id="adv-tgt">
                   <option value="character.personality" ${item.target === 'character.personality' ? 'selected' : ''}>Personality</option>
                   <option value="character.scenario" ${item.target === 'character.scenario' ? 'selected' : ''}>Scenario</option>
                </select>
             </div>
             <div class="sc-col" style="margin-bottom:12px;">
                 <label class="sc-lab">Context Field (Injection)</label>
                 <textarea class="input" id="adv-ctx" style="height:80px; resize:vertical;">${item.contextField}</textarea>
             </div>

             <!-- Block 1: Keywords -->
             <div class="sc-box" style="${!c.keywordsEnabled ? 'opacity:0.6;' : ''}">
               <div class="sc-head">
                  <span>Condition 1: Keywords</span>
                  <label class="sc-pill"><input type="checkbox" id="c1-en" ${c.keywordsEnabled ? 'checked' : ''}> Enabled</label>
               </div>
               <div style="display:flex; gap:12px; flex-wrap:wrap; margin-bottom:8px;">
                   <label class="sc-pill"><input type="checkbox" id="c1-case" ${c.filters.caseInsensitive ? 'checked' : ''}> Case-insensitive</label>
                   <label class="sc-pill"><input type="checkbox" id="c1-whole" ${c.filters.wholeWord ? 'checked' : ''}> Whole-word</label>
               </div>
               <textarea class="input" id="c1-keys" placeholder="Keywords..." style="height:60px;">${c.keywordsText}</textarea>
             </div>

             <!-- Block 2: Window -->
             <div class="sc-box" style="${!c.windowEnabled ? 'opacity:0.6;' : ''}">
               <div class="sc-head">
                  <span>Condition 2: Message Window</span>
                  <label class="sc-pill"><input type="checkbox" id="c2-en" ${c.windowEnabled ? 'checked' : ''}> Enabled</label>
               </div>
               <div style="display:flex; gap:12px; align-items:center;">
                  <label class="sc-lab">Min <input type="number" class="input" id="c2-min" value="${c.windowMin}" style="width:60px;"></label>
                  <label class="sc-lab">Max <input type="number" class="input" id="c2-max" value="${c.windowMax}" style="width:60px;" ${!c.windowUseMax ? 'disabled' : ''}></label>
                  <label class="sc-pill" style="margin-top:14px;"><input type="checkbox" id="c2-use" ${c.windowUseMax ? 'checked' : ''}> Use Max</label>
               </div>
             </div>

             <!-- Block 3: Scoring Ref -->
             <div class="sc-box" style="${!c.scoringEnabled ? 'opacity:0.6;' : ''}">
               <div class="sc-head">
                  <span>Condition 3: Scoring Dependency</span>
                  <label class="sc-pill"><input type="checkbox" id="c3-en" ${c.scoringEnabled ? 'checked' : ''}> Enabled</label>
               </div>
               <label class="sc-lab">Must Pass Topic</label>
               <select class="input" id="c3-topic">${scoreOpts}</select>
             </div>
          `;

                // Advanced Bindings
                const upd = () => { A.State.notify(); }; // Advanced list doesn't show detail so no need to refreshList constantly

                body.querySelector('#adv-tgt').onchange = e => { item.target = e.target.value; upd(); };
                body.querySelector('#adv-ctx').oninput = e => { item.contextField = e.target.value; upd(); };

                body.querySelector('#c1-en').onchange = e => { c.keywordsEnabled = e.target.checked; renderEditor(); upd(); };
                body.querySelector('#c1-case').onchange = e => { c.filters.caseInsensitive = e.target.checked; upd(); };
                body.querySelector('#c1-whole').onchange = e => { c.filters.wholeWord = e.target.checked; upd(); };
                body.querySelector('#c1-keys').oninput = e => { c.keywordsText = e.target.value; upd(); };

                body.querySelector('#c2-en').onchange = e => { c.windowEnabled = e.target.checked; renderEditor(); upd(); };
                body.querySelector('#c2-min').oninput = e => { c.windowMin = parseInt(e.target.value); upd(); };
                body.querySelector('#c2-max').oninput = e => { c.windowMax = parseInt(e.target.value); upd(); };
                body.querySelector('#c2-use').onchange = e => { c.windowUseMax = e.target.checked; renderEditor(); upd(); };

                body.querySelector('#c3-en').onchange = e => { c.scoringEnabled = e.target.checked; renderEditor(); upd(); };
                body.querySelector('#c3-topic').onchange = e => { c.scoringTopicId = e.target.value; upd(); };
            }

            // Actor Association (Flow Explorer)
            const actorSec = document.createElement('div');
            actorSec.style.marginTop = '16px';
            actorSec.style.borderTop = '1px solid var(--border-subtle)';
            actorSec.style.paddingTop = '12px';
            actorSec.style.marginBottom = '20px';
            actorSec.innerHTML = `<div class="sc-lab" style="margin-bottom:8px;">Associate with Actors (Flow Explorer Only)</div><div id="actor-associations" style="display:flex; flex-wrap:wrap; gap:8px;"></div>`;
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

            editorCol.appendChild(header);
            editorCol.appendChild(body);

            // Common Bindings
            header.querySelector('#inp-name').oninput = e => { item.name = e.target.value; A.State.notify(); refreshList(); };
            header.querySelector('#chk-en').onchange = e => { item.enabled = e.target.checked; A.State.notify(); refreshList(); };
            header.querySelector('#btn-del').onclick = () => {
                if (confirm('Delete rule?')) {
                    if (currentTab === 'basic') state.scoring.topics = state.scoring.topics.filter(t => t.id !== currentId);
                    else state.scoring.advanced = state.scoring.advanced.filter(t => t.id !== currentId);
                    currentId = null; A.State.notify(); refreshList(); renderEditor();
                }
            };
        }

        // Init
        switchTab('basic');
    }

    A.registerPanel('scoring', {
        label: 'Scoring',
        subtitle: 'Score Logic',
        category: 'Weave',
        render: render
    });

})(window.Anansi);
