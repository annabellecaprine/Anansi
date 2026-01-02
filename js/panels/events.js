/*
 * Anansi Panel: Events (Extended: Logic + Probability)
 * File: js/panels/events.js
 * Category: Magic
 * Parity: Merges 'Events' (Logic) and 'Ambient/Random' (Probability) from Studio.
 */

(function (A) {
  'use strict';

  let currentTab = 'logic'; // logic, probability
  let currentId = null;

  function render(container) {
    const state = A.State.get();

    // Schema Check
    if (!state.aura) state.aura = {};
    if (!state.aura.events) state.aura.events = { items: {} }; // Logic events
    if (!state.aura.probability) state.aura.probability = { groups: [] }; // Random groups (array based)

    container.style.height = '100%';
    container.style.display = 'grid';
    container.style.gridTemplateColumns = '250px 1fr';
    container.style.gap = 'var(--space-4)';
    container.style.overflow = 'hidden';

    // 1. Sidebar (Tabs + List)
    const listCol = document.createElement('div');
    listCol.className = 'card';
    listCol.style.display = 'flex';
    listCol.style.flexDirection = 'column';
    listCol.style.marginBottom = '0';
    listCol.style.padding = '0';

    listCol.innerHTML = `
      <div style="display:flex; border-bottom:1px solid var(--border-subtle); background:var(--bg-elevated);">
         <div class="tab-btn active" id="tab-logic" style="flex:1; text-align:center; padding:10px; cursor:pointer; font-weight:bold; border-bottom:2px solid var(--accent-primary);">Logos (Logic)</div>
         <div class="tab-btn" id="tab-prob" style="flex:1; text-align:center; padding:10px; cursor:pointer; font-weight:bold; color:var(--text-muted);">Chaos</div>
      </div>
      <div class="card-body" id="event-list" style="padding:0; flex:1; overflow-y:auto;"></div>
      <div class="card-footer">
        <button class="btn btn-primary btn-sm" id="btn-add" style="width:100%;">+ New</button>
      </div>
    `;

    // 2. Editor Col
    const editorCol = document.createElement('div');
    editorCol.className = 'card';
    editorCol.id = 'event-editor';
    editorCol.style.marginBottom = '0';
    editorCol.style.padding = '0';
    editorCol.style.display = 'flex';
    editorCol.style.flexDirection = 'column';

    container.appendChild(listCol);
    container.appendChild(editorCol);

    // --- Logic ---
    const tabLogic = listCol.querySelector('#tab-logic');
    const tabProb = listCol.querySelector('#tab-prob');
    const listBody = listCol.querySelector('#event-list');
    const btnAdd = listCol.querySelector('#btn-add');

    function switchTab(tab) {
      currentTab = tab;
      currentId = null; // reset selection

      // Update Tab UI
      if (tab === 'logic') {
        tabLogic.style.color = 'var(--text-primary)';
        tabLogic.style.borderBottomColor = 'var(--accent-primary)';
        tabProb.style.color = 'var(--text-muted)';
        tabProb.style.borderBottomColor = 'transparent';
        btnAdd.textContent = '+ New Event';
      } else {
        tabProb.style.color = 'var(--text-primary)';
        tabProb.style.borderBottomColor = 'var(--accent-primary)';
        tabLogic.style.color = 'var(--text-muted)';
        tabLogic.style.borderBottomColor = 'transparent';
        btnAdd.textContent = '+ New Group';
      }
      refreshList();
      renderEditor();
    }

    tabLogic.onclick = () => switchTab('logic');
    tabProb.onclick = () => switchTab('probability');

    function refreshList() {
      listBody.innerHTML = '';

      if (currentTab === 'logic') {
        // Render Logic Events (Dict)
        const items = Object.values(state.aura.events.items);
        if (!items.length) { listBody.innerHTML = '<div class="muted" style="padding:16px; text-align:center;">No logic events.</div>'; return; }

        items.forEach(ev => {
          const row = document.createElement('div');
          row.className = 'list-item';
          row.style.padding = '8px 12px';
          row.style.borderBottom = '1px solid var(--border-subtle)';
          row.style.cursor = 'pointer';
          row.style.fontSize = '12px';
          if (ev.id === currentId) { row.style.background = 'var(--bg-surface)'; row.style.borderLeft = '3px solid var(--accent-primary)'; }

          row.innerHTML = `
             <div style="font-weight:bold; ${!ev.enabled ? 'text-decoration:line-through;color:var(--text-muted);' : ''}">${ev.label || 'Untitled'}</div>
             <div style="font-size:10px; color:var(--text-muted);">Prob: ${ev.probability || 100}%</div>
           `;
          row.onclick = () => { currentId = ev.id; refreshList(); renderEditor(); };
          listBody.appendChild(row);
        });

      } else {
        // Render Probability Groups (Array)
        const groups = state.aura.probability.groups || [];
        if (!groups.length) { listBody.innerHTML = '<div class="muted" style="padding:16px; text-align:center;">No random groups.</div>'; return; }

        groups.forEach((g, idx) => {
          const row = document.createElement('div');
          row.style.padding = '8px 12px';
          row.style.borderBottom = '1px solid var(--border-subtle)';
          row.style.cursor = 'pointer';
          row.style.fontSize = '12px';
          // Use index as ID for array items logic
          const thisId = 'g-' + idx;
          if (thisId === currentId) { row.style.background = 'var(--bg-surface)'; row.style.borderLeft = '3px solid var(--accent-primary)'; }

          row.innerHTML = `
             <div style="font-weight:bold; ${!g.enabled ? 'text-decoration:line-through;color:var(--text-muted);' : ''}">${g.name || 'Group'}</div>
             <div style="font-size:10px; color:var(--text-muted);">Chance: ${g.triggerChancePct || 15}% • ${g.items ? g.items.length : 0} items</div>
           `;
          row.onclick = () => { currentId = thisId; refreshList(); renderEditor(); };
          listBody.appendChild(row);
        });
      }
    }

    btnAdd.onclick = () => {
      if (currentTab === 'logic') {
        const id = 'ev_' + Math.random().toString(36).substr(2, 9);
        state.aura.events.items[id] = { id: id, label: 'New Event', enabled: true, probability: 100, condition: 'true', effect: '// code' };
        currentId = id;
        if (A.UI.Toast) A.UI.Toast.show('New Logic Event created', 'success');
      } else {
        const newG = {
          enabled: true,
          name: 'New Random Group',
          triggerChancePct: 15,
          target: 'character.personality', // or scenario
          items: []
        };
        state.aura.probability.groups.push(newG);
        currentId = 'g-' + (state.aura.probability.groups.length - 1);
        if (A.UI.Toast) A.UI.Toast.show('New Chaos Group created', 'success');
      }
      A.State.notify();
      refreshList();
      renderEditor();
    };

    function renderEditor() {
      editorCol.innerHTML = '';
      if (!currentId) {
        editorCol.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; color:var(--text-muted); opacity:0.7;">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom:16px;">
                    <circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                <div style="margin-bottom:16px;">Select an Event or Group to edit</div>
                <button class="btn btn-secondary" id="btn-empty-create">Create New</button>
            </div>
        `;
        editorCol.querySelector('#btn-empty-create').onclick = () => listCol.querySelector('#btn-add').click();
        return;
      }

      const style = `<style>
         .evt-row { display:flex; gap:8px; margin-bottom:8px; align-items:center; }
         .evt-col { flex:1; display:flex; flex-direction:column; }
         .evt-lab { font-size:10px; text-transform:uppercase; font-weight:bold; color:var(--text-muted); margin-bottom:2px; }
       </style>`;
      editorCol.innerHTML = style;

      const header = document.createElement('div');
      header.className = 'card-header';
      const body = document.createElement('div');
      body.className = 'card-body';
      body.style.overflowY = 'auto';
      body.style.flex = '1';

      editorCol.appendChild(header);
      editorCol.appendChild(body);

      if (currentTab === 'logic') {
        const ev = state.aura.events.items[currentId];
        if (!ev) return;

        // --- Helper Generators ---
        const generateCondition = (type, data) => {
          if (type === 'keyword') return `(text || '').toLowerCase().includes('${(data.key || '').toLowerCase()}')`;
          if (type === 'flag') return `!!state.flags['${data.flag}'] === ${data.val === 'true'}`;
          if (type === 'stat') return `(state.stats['${data.stat}'] || 0) ${data.op} ${data.val}`;
          return data.raw || 'true';
        };

        const generateEffect = (type, data) => {
          if (type === 'flag') return `state.flags['${data.flag}'] = ${data.val === 'true'};`;
          if (type === 'stat') return `state.stats['${data.stat}'] = (state.stats['${data.stat}'] || 0) ${data.op} ${data.val};`;
          if (type === 'msg') return `return "${(data.msg || '').replace(/"/g, '\\"')}";`;
          return data.raw || '';
        };

        // Infer current mode from existing code (basic heuristic)
        // Note: Logic is stored as strings. We default to 'raw' if we can't parse, or track 'meta' if we wanted perfect persistence.
        // For now, we'll start in 'raw' if it has content, or 'flag' if empty/default.
        // Actually, let's keep it simple: Default to 'raw' to show existing code. User selects builder to overwrite.

        // Initialize meta if missing for UI state persistence (optional, but good for UX)
        ev._ui = ev._ui || { condType: 'raw', effType: 'raw' };

        // Header
        header.innerHTML = `
            <div style="display:flex; flex-direction:column; gap:4px; flex:1;">
               <input class="input" id="inp-lbl" value="${ev.label || ''}" style="font-weight:bold;" placeholder="Event Label">
            </div>
            <label style="display:flex; align-items:center; gap:4px; font-size:12px; margin-left:12px;"><input type="checkbox" id="chk-en" ${ev.enabled ? 'checked' : ''}> Enabled</label>
            <button class="btn btn-ghost btn-sm" id="btn-del" style="color:var(--status-error); margin-left:8px;">Delete</button>
          `;

        // Body
        body.innerHTML = `
            <!-- TRIGGER SECTION -->
            <div style="margin-bottom:16px;">
               <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                  <label class="evt-lab">Trigger Condition</label>
                  <select class="input" id="sel-cond-type" style="padding:2px 4px; height:auto; width:auto; font-size:11px;">
                    <option value="raw" ${ev._ui.condType === 'raw' ? 'selected' : ''}>Advanced (JS)</option>
                    <option value="keyword" ${ev._ui.condType === 'keyword' ? 'selected' : ''}>Keyword Match</option>
                    <option value="flag" ${ev._ui.condType === 'flag' ? 'selected' : ''}>Check Flag</option>
                    <option value="stat" ${ev._ui.condType === 'stat' ? 'selected' : ''}>Check Stat</option>
                  </select>
               </div>
               
               <div class="card" style="padding:12px; border:1px solid var(--border-default); margin:0;">
                  <div class="evt-row" style="margin-bottom:8px;">
                     <div class="evt-col" style="flex:0 0 100px;">
                        <label class="evt-lab">Probability</label>
                        <input type="number" class="input" id="inp-prob" value="${ev.probability}" min="0" max="100" placeholder="100%">
                     </div>
                     <div class="evt-col" id="cond-builder-ui">
                        <!-- Dynamic Builder Content -->
                     </div>
                  </div>
                  <!-- Preview (Read Only in Builder Mode, Editable in Raw) -->
                  <div class="evt-col">
                      <label class="evt-lab">Generated Code</label>
                      <input class="input" id="inp-cond" value="${ev.condition || 'true'}" style="font-family:var(--font-mono); color:var(--text-muted); background:var(--bg-base);" ${ev._ui.condType !== 'raw' ? 'readonly' : ''}>
                  </div>
               </div>
            </div>

            <!-- EFFECT SECTION -->
            <div style="flex:1; display:flex; flex-direction:column;">
               <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                  <label class="evt-lab">Effect Action</label>
                  <select class="input" id="sel-eff-type" style="padding:2px 4px; height:auto; width:auto; font-size:11px;">
                    <option value="raw" ${ev._ui.effType === 'raw' ? 'selected' : ''}>Advanced (JS)</option>
                    <option value="msg" ${ev._ui.effType === 'msg' ? 'selected' : ''}>Output Message</option>
                    <option value="flag" ${ev._ui.effType === 'flag' ? 'selected' : ''}>Set Flag</option>
                    <option value="stat" ${ev._ui.effType === 'stat' ? 'selected' : ''}>Modify Stat</option>
                  </select>
               </div>
               
               <div class="card" style="flex:1; padding:0; border:1px solid var(--border-default); overflow:hidden; display:flex; flex-direction:column; margin:0;">
                  <div id="eff-builder-ui" style="padding:12px; border-bottom:1px solid var(--border-subtle); display:${ev._ui.effType === 'raw' ? 'none' : 'block'};">
                     <!-- Dynamic Effect Builder -->
                  </div>
                  <textarea class="input" id="inp-eff" style="flex:1; border:none; resize:none; padding:12px; font-family:var(--font-mono); line-height:1.4;" placeholder="// Code..." ${ev._ui.effType !== 'raw' ? 'readonly' : ''}>${ev.effect || ''}</textarea>
               </div>
            </div>
          `;

        // --- UI Renders ---
        const condUI = body.querySelector('#cond-builder-ui');
        const effUI = body.querySelector('#eff-builder-ui');
        const inpCond = body.querySelector('#inp-cond');
        const inpEff = body.querySelector('#inp-eff');

        // Render Condition Builder inputs
        const renderCondBuilder = () => {
          condUI.innerHTML = '';
          if (ev._ui.condType === 'raw') {
            condUI.innerHTML = '<div style="font-size:11px; color:var(--text-muted); padding-top:14px;">Edit logic directly below &darr;</div>';
          } else if (ev._ui.condType === 'keyword') {
            condUI.innerHTML = `<label class="evt-lab">Input Text Contains</label><input class="input" id="b-key" placeholder="Keyword..." value="${ev._ui.keyVal || ''}">`;
            condUI.querySelector('#b-key').oninput = e => { ev._ui.keyVal = e.target.value; updateCond(); };
          } else if (ev._ui.condType === 'flag') {
            condUI.innerHTML = `
                           <div style="display:flex; gap:8px;">
                             <div style="flex:1;"><label class="evt-lab">Flag Name</label><input class="input" id="b-flag" placeholder="e.g. met_gandalf" value="${ev._ui.flagName || ''}"></div>
                             <div style="width:80px;"><label class="evt-lab">Is Set?</label><select class="input" id="b-val"><option value="true">True</option><option value="false" ${ev._ui.flagVal === 'false' ? 'selected' : ''}>False</option></select></div>
                           </div>`;
            condUI.querySelector('#b-flag').oninput = e => { ev._ui.flagName = e.target.value; updateCond(); };
            condUI.querySelector('#b-val').onchange = e => { ev._ui.flagVal = e.target.value; updateCond(); };
          } else if (ev._ui.condType === 'stat') {
            condUI.innerHTML = `
                           <div style="display:flex; gap:8px;">
                             <div style="flex:1;"><label class="evt-lab">Stat Name</label><input class="input" id="b-stat" placeholder="e.g. hp" value="${ev._ui.statName || ''}"></div>
                             <div style="width:60px;"><label class="evt-lab">Op</label><select class="input" id="b-op"><option value=">">></option><option value="<"><</option><option value="==">==</option></select></div>
                             <div style="width:60px;"><label class="evt-lab">Value</label><input type="number" class="input" id="b-val" value="${ev._ui.statVal || 0}"></div>
                           </div>`;
            // Restore select
            if (ev._ui.statOp) condUI.querySelector('#b-op').value = ev._ui.statOp;
            condUI.querySelector('#b-stat').oninput = e => { ev._ui.statName = e.target.value; updateCond(); };
            condUI.querySelector('#b-op').onchange = e => { ev._ui.statOp = e.target.value; updateCond(); };
            condUI.querySelector('#b-val').oninput = e => { ev._ui.statVal = e.target.value; updateCond(); };
          }
        };

        const updateCond = () => {
          if (ev._ui.condType === 'raw') return; // Don't overwrite raw
          const code = generateCondition(ev._ui.condType, {
            key: ev._ui.keyVal,
            flag: ev._ui.flagName, val: ev._ui.flagVal || 'true',
            stat: ev._ui.statName, op: ev._ui.statOp || '>', val: ev._ui.statVal || 0
          });
          ev.condition = code;
          inpCond.value = code;
          A.State.notify();
        };

        // Render Effect Builder inputs
        const renderEffBuilder = () => {
          effUI.innerHTML = '';
          effUI.style.display = ev._ui.effType === 'raw' ? 'none' : 'block';

          if (ev._ui.effType === 'msg') {
            effUI.innerHTML = `<label class="evt-lab">Message Content</label><textarea class="input" id="e-msg" rows="3" placeholder="You hear a sound...">${ev._ui.msgVal || ''}</textarea>`;
            effUI.querySelector('#e-msg').oninput = e => { ev._ui.msgVal = e.target.value; updateEff(); };
          } else if (ev._ui.effType === 'flag') {
            effUI.innerHTML = `
                           <div style="display:flex; gap:8px;">
                             <div style="flex:1;"><label class="evt-lab">Flag Name</label><input class="input" id="e-flag" placeholder="e.g. quest_started" value="${ev._ui.flagName || ''}"></div>
                             <div style="width:80px;"><label class="evt-lab">Set To</label><select class="input" id="e-val"><option value="true">True</option><option value="false" ${ev._ui.flagVal === 'false' ? 'selected' : ''}>False</option></select></div>
                           </div>`;
            effUI.querySelector('#e-flag').oninput = e => { ev._ui.flagName = e.target.value; updateEff(); };
            effUI.querySelector('#e-val').onchange = e => { ev._ui.flagVal = e.target.value; updateEff(); };
          } else if (ev._ui.effType === 'stat') {
            effUI.innerHTML = `
                           <div style="display:flex; gap:8px;">
                             <div style="flex:1;"><label class="evt-lab">Stat Name</label><input class="input" id="e-stat" placeholder="e.g. gold" value="${ev._ui.statName || ''}"></div>
                             <div style="width:60px;"><label class="evt-lab">Op</label><select class="input" id="e-op"><option value="=">=</option><option value="+=">+=</option><option value="-=">-=</option></select></div>
                             <div style="width:60px;"><label class="evt-lab">Value</label><input type="number" class="input" id="e-val" value="${ev._ui.statVal || 0}"></div>
                           </div>`;
            if (ev._ui.statOp) effUI.querySelector('#e-op').value = ev._ui.statOp;
            effUI.querySelector('#e-stat').oninput = e => { ev._ui.statName = e.target.value; updateEff(); };
            effUI.querySelector('#e-op').onchange = e => { ev._ui.statOp = e.target.value; updateEff(); };
            effUI.querySelector('#e-val').oninput = e => { ev._ui.statVal = e.target.value; updateEff(); };
          }
        };

        const updateEff = () => {
          if (ev._ui.effType === 'raw') return;
          const code = generateEffect(ev._ui.effType, {
            msg: ev._ui.msgVal,
            flag: ev._ui.flagName, val: ev._ui.flagVal || 'true',
            stat: ev._ui.statName, op: ev._ui.statOp || '=', val: ev._ui.statVal || 0
          });
          ev.effect = code;
          inpEff.value = code;
          A.State.notify();
        };


        // Initial Render Call
        renderCondBuilder();
        renderEffBuilder();

        // Bindings for dropdowns
        body.querySelector('#sel-cond-type').onchange = e => {
          ev._ui.condType = e.target.value;
          renderCondBuilder();
          // Optional: Reset code if switching away from raw? No, keep it safer to not nuke user work.
          if (ev._ui.condType !== 'raw') updateCond();
          else { inpCond.readOnly = false; inpCond.focus(); }

          if (ev._ui.condType !== 'raw') inpCond.readOnly = true;
          // Note: If switching to Builder, we might overwrite existing Raw code with default Builder state. 
          // This is acceptable behavior for "switching mode" usually, or we parse. Parsing is hard. We overwrite.
          A.State.notify();
        };

        body.querySelector('#sel-eff-type').onchange = e => {
          ev._ui.effType = e.target.value;
          renderEffBuilder();
          if (ev._ui.effType !== 'raw') updateEff();
          else { inpEff.readOnly = false; inpEff.focus(); }

          if (ev._ui.effType !== 'raw') inpEff.readOnly = true;
          A.State.notify();
        };

        // Bindings for Raw inputs (when in Raw mode)
        inpCond.oninput = e => { if (ev._ui.condType === 'raw') { ev.condition = e.target.value; A.State.notify(); } };
        inpEff.oninput = e => { if (ev._ui.effType === 'raw') { ev.effect = e.target.value; A.State.notify(); } };

        // Common Bindings
        const upd = () => { A.State.notify(); refreshList(); };
        header.querySelector('#inp-lbl').oninput = e => { ev.label = e.target.value; upd(); };
        header.querySelector('#inp-lbl').onchange = e => { if (A.UI.Toast) A.UI.Toast.show('Label saved', 'info'); };

        header.querySelector('#chk-en').onchange = e => {
          ev.enabled = e.target.checked;
          upd();
          if (A.UI.Toast) A.UI.Toast.show(ev.enabled ? 'Event enabled' : 'Event disabled', 'info');
        };
        header.querySelector('#btn-del').onclick = () => {
          if (confirm('Delete event?')) {
            delete state.aura.events.items[currentId];
            currentId = null;
            upd();
            renderEditor();
            if (A.UI.Toast) A.UI.Toast.show('Event deleted', 'info');
          }
        };

        body.querySelector('#inp-prob').oninput = e => { ev.probability = parseInt(e.target.value); A.State.notify(); };

      } else {
        // Probability Group
        const idx = parseInt(currentId.split('-')[1]);
        const grp = state.aura.probability.groups[idx];
        if (!grp) return;

        header.innerHTML = `
            <input class="input" id="inp-name" value="${grp.name || ''}" style="font-weight:bold;">
            <label style="font-size:12px; display:flex; align-items:center; gap:4px;"><input type="checkbox" id="chk-en" ${grp.enabled ? 'checked' : ''}> Enabled</label>
            <button class="btn btn-ghost btn-sm" id="btn-del" style="color:var(--status-error);">Delete</button>
          `;

        body.innerHTML = `
             <div class="evt-row">
               <div class="evt-col"><label class="evt-lab">Trigger Chance %</label><input type="number" class="input" id="inp-ch" value="${grp.triggerChancePct || 15}"></div>
               <div class="evt-col">
                 <label class="evt-lab">Target</label>
                 <select class="input" id="sel-tgt">
                   <option value="character.personality" ${grp.target === 'character.personality' ? 'selected' : ''}>Personality</option>
                   <option value="character.scenario" ${grp.target === 'character.scenario' ? 'selected' : ''}>Scenario</option>
                 </select>
               </div>
             </div>
             <div class="evt-col" style="flex:1;">
               <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                  <label class="evt-lab">Weighted Items</label>
                  <button class="btn btn-secondary btn-sm" id="btn-add-item">+ Item</button>
               </div>
               <div id="prob-items" style="overflow-y:auto; flex:1; border:1px solid var(--border-subtle); padding:8px; border-radius:4px;"></div>
             </div>
          `;

        // Bindings
        const upd = () => { A.State.notify(); refreshList(); };
        header.querySelector('#inp-name').oninput = e => { grp.name = e.target.value; upd(); };
        header.querySelector('#chk-en').onchange = e => { grp.enabled = e.target.checked; upd(); };
        header.querySelector('#btn-del').onclick = () => { if (confirm('Delete group?')) { state.aura.probability.groups.splice(idx, 1); currentId = null; upd(); renderEditor(); } };

        body.querySelector('#inp-ch').oninput = e => { grp.triggerChancePct = parseInt(e.target.value); A.State.notify(); };
        body.querySelector('#sel-tgt').onchange = e => { grp.target = e.target.value; A.State.notify(); };

        // Render Items
        const itemsContainer = body.querySelector('#prob-items');
        function renderItems() {
          itemsContainer.innerHTML = '';
          (grp.items || []).forEach((it, iIdx) => {
            const div = document.createElement('div');
            div.style.marginBottom = '8px';
            div.style.borderBottom = '1px dashed var(--border-subtle)';
            div.style.paddingBottom = '8px';
            div.innerHTML = `
                  <div class="evt-row">
                    <div class="evt-col"><input class="input" placeholder="Name" value="${it.name || ''}" oninput="this.getRootNode().host_edit(${iIdx}, 'name', this.value)"></div>
                    <div style="width:60px;"><input type="number" class="input" placeholder="%" value="${it.weight || 0}" oninput="this.getRootNode().host_edit(${iIdx}, 'weight', this.value)"></div>
                    <button class="btn btn-ghost btn-sm" onclick="this.getRootNode().host_del(${iIdx})">×</button>
                  </div>
                  <textarea class="input" rows="2" placeholder="Text content..." oninput="this.getRootNode().host_edit(${iIdx}, 'text', this.value)">${it.text || ''}</textarea>
                `;

            div.host_edit = (i, k, val) => { grp.items[i][k] = (k === 'weight' ? parseInt(val) : val); A.State.notify(); };
            div.host_del = (i) => { grp.items.splice(i, 1); renderItems(); A.State.notify(); };
            itemsContainer.appendChild(div);
          });
        }
        renderItems();

        body.querySelector('#btn-add-item').onclick = () => {
          grp.items = grp.items || [];
          grp.items.push({ name: 'Item', weight: 100, text: '' });
          renderItems();
          A.State.notify();
        };
      }
    }

    // Initial Load
    switchTab('logic');
  }

  A.registerPanel('events', {
    label: 'Events & Logic',
    subtitle: 'Magic',
    category: 'Weave',
    render: render
  });

})(window.Anansi);
