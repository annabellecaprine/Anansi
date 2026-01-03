/*
 * Anansi Panel: Lorebook (Advanced)
 * File: js/panels/lorebook.js
 * Category: Weave
 * Parity: MythOS/Studio
 * Description: Manages world knowledge entries with advanced logic (Aura Tags, Shifts, Emissions).
 */

(function (A) {
  'use strict';

  // --- Constants & Config ---
  const CATEGORIES = ['character', 'faction', 'item', 'theme', 'location', 'custom', 'uncategorized'];
  const ACTIVATION = ['standard', 'immediate', 'cooldown', 'conditional'];

  // Aura Tags (Emotions & Intents) - Extended for AURA parity
  const EMOTIONS = [
    'JOY', 'SADNESS', 'ANGER', 'FEAR', 'DISGUST', 'SURPRISE',
    'TRUST', 'ANTICIPATION', 'LOVE', 'SUBMISSION', 'AWE',
    'DISAPPROVAL', 'REMORSE', 'CONTEMPT', 'AGGRESSIVENESS', 'OPTIMISM'
  ];

  const INTENTS = [
    'QUESTION', 'COMMAND', 'STATEMENT', 'EXCLAMATION',
    'GREETING', 'FAREWELL', 'AFFIRMATION', 'NEGATION'
  ];

  const EROS_LEVELS = {
    0: 'NONE', 1: 'AWARENESS', 2: 'INTEREST', 3: 'ATTRACTION', 4: 'TENSION',
    5: 'FLIRTATION', 6: 'DESIRE', 7: 'INTIMACY', 8: 'PASSION', 9: 'INTENSITY', 10: 'TRANSCENDENCE'
  };

  // Combined for backwards compatibility
  const AURA_TAGS = [...EMOTIONS, ...INTENTS, 'ROMANCE', 'NEUTRAL', 'POSITIVE', 'NEGATIVE',
    'DISCLOSURE', 'PROMISE', 'CONFLICT', 'SMALLTALK', 'META', 'NARRATIVE'
  ];


  // --- Persistent State ---
  // These variables persist across re-renders of the panel.
  let currentId = null;
  let editingShiftIndex = null;
  let filter = '';

  // --- Helpers ---
  function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  function jsStr(s) {
    return JSON.stringify(s || '');
  }

  // --- Script Generation ---
  function generateScript(entries) {
    // Entries can be the raw object or enriched options.
    const state = A.State.get(); // Access state directly
    const globalDepth = (state.weaves && state.weaves.lorebook) ? (state.weaves.lorebook.scanDepth || 3) : 3;

    const entryList = Object.values(entries || {});
    const activeEntries = entryList.filter(e => e.enabled !== false);

    if (!activeEntries.length) return '/* No enabled lorebook entries. */';

    // Calculate Max Depth needed
    let maxDepth = globalDepth;
    activeEntries.forEach(e => {
      if (e.scanDepth && e.scanDepth > maxDepth) maxDepth = e.scanDepth;
    });

    let s = '/* === LOREBOOK (Generated) =========================================== */\n\n';
    s += 'var LOREBOOK_CFG = {\n';
    s += '  enabled: true,\n';
    s += '  entries: [\n';

    s += activeEntries.map(e => {
      const keywords = (e.keywords || []).map(k => jsStr(k)).join(',');
      const reqTags = (e.requireTags || []).map(t => jsStr(t)).join(',');
      const blkTags = (e.blocksTags || []).map(t => jsStr(t)).join(',');
      const emitTags = (e.tags || []).map(t => jsStr(t)).join(',');

      return `    {
      id: ${jsStr(e.id)},
      title: ${jsStr(e.title)},
      keywords: [${keywords}],
      content: ${jsStr(e.content)},
      priority: ${e.priority || 50},
      category: ${jsStr(e.category || 'uncategorized')},
      requireTags: [${reqTags}],
      blocksTags: [${blkTags}],
      emitTags: [${emitTags}],
      probability: ${e.probability !== undefined ? e.probability : 100},
      scanDepth: ${e.scanDepth || 'null'} 
    }`;
    }).join(',\n');

    s += '\n  ]\n};\n\n';

    // Simple engine logic
    s += `(function(){
  if (!LOREBOOK_CFG || !LOREBOOK_CFG.enabled) return;
  if (!context || !context.chat) return;
  
  var activeTags = context.activeTags || [];
  
  // Logic: Pre-fetch maximum required history
  var globalDepth = ${globalDepth};
  var maxDepth = ${maxDepth};
  var history = context.chat || [];
  
  // Create Master Window (Largest possible window needed)
  var masterWindow = [];
  for (var i = 0; i < maxDepth; i++) {
     if (history.length - 1 - i >= 0) {
        masterWindow.push(history[history.length - 1 - i].mes.toLowerCase());
     }
  }
  
  console.log("Lorebook: Pre-scanned " + masterWindow.length + " msgs (Max Depth: " + maxDepth + ") for " + LOREBOOK_CFG.entries.length + " entries.");
  
  LOREBOOK_CFG.entries.forEach(function(entry){
  
    // Determine effective window for this entry
    // If entry.scanDepth is set, use it. Otherwise use globalDepth.
    var effectiveDepth = entry.scanDepth || globalDepth;
    
    // Slice master window to get just what this entry needs
    // masterWindow is [newest, ..., oldest]
    // effectiveDepth 3 means take first 3 elements of masterWindow
    var scanWindow = masterWindow.slice(0, effectiveDepth);
    
    // Check keywords (against ANY message in its specific window)
    var triggered = entry.keywords.some(function(kw){
        var kwLower = kw.toLowerCase();
        return scanWindow.some(function(msg){ return msg.indexOf(kwLower) !== -1; });
    });

    if (!triggered) return;
    
    // Check required tags
    if (entry.requireTags.length > 0) {
      var hasRequired = entry.requireTags.some(function(t){ return activeTags.indexOf(t) !== -1; });
      if (!hasRequired) return;
    }
    
    // Check blocked tags
    if (entry.blocksTags.length > 0) {
      var isBlocked = entry.blocksTags.some(function(t){ return activeTags.indexOf(t) !== -1; });
      if (isBlocked) return;
    }
    
    // Probability check
    if (Math.random() * 100 > entry.probability) return;
    
    // Inject content
    if (context.character && typeof context.character.personality === 'string') {
      context.character.personality += ' ' + entry.content;
      console.info("Lorebook: Injected [" + entry.title + "] (Depth: " + effectiveDepth + ")");
    } else {
      console.warn("Lorebook: Targeted context.character.personality but it was missing.");
    }
    
    // Emit tags
    entry.emitTags.forEach(function(t){
      if (activeTags.indexOf(t) === -1) {
          activeTags.push(t);
          console.log("Lorebook: Emitted Tag [" + t + "]");
      }
    });
  });
})();`;

    return s;
  }

  // --- UI Components ---

  // --- UI Components ---

  // 1. Tag Picker Component (Now using A.UI.Components.TagInput)
  function renderTagPicker(parent, label, tags, onChange) {
    // Wrapper/Adapter for valid drop-in replacement if needed, 
    // or we can replace callsites. Let's redirect callsites to use A.UI.Components.TagInput directly
    // but for now, we can make this a wrapper to minimize code churn in render() functions.

    // Create a container div for the class to render into
    const container = document.createElement('div');
    container.className = 'l-col';
    parent.appendChild(container);

    if (A.UI && A.UI.Components && A.UI.Components.TagInput) {
      new A.UI.Components.TagInput(container, tags, {
        label: label,
        suggestions: AURA_TAGS,
        onChange: onChange
      });
    } else {
      container.innerHTML = '<div style="color:red; font-size:10px;">Error: TagInput missing</div>';
    }
  }

  // --- Main Panel Render ---
  function render(container, context) {
    container.innerHTML = ''; // Clear previous render
    const state = A.State.get();

    // Ensure Data Structure
    if (!state.weaves) state.weaves = {};
    if (!state.weaves.lorebook) state.weaves.lorebook = { entries: {} };

    // Layout Containers
    container.style.height = '100%';
    container.style.display = 'grid';
    container.style.gridTemplateColumns = '250px 1fr';
    container.style.gap = 'var(--space-4)';
    container.style.overflow = 'hidden';

    // Left: List
    const listCol = document.createElement('div');
    listCol.className = 'card';
    Object.assign(listCol.style, { display: 'flex', flexDirection: 'column', minHeight: '0', marginBottom: '0' });

    listCol.innerHTML = `
      <div class="card-header">
        <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
            <strong>Lorebook</strong>
            <div style="font-size:10px;">${Object.keys(state.weaves.lorebook.entries).length} entries</div>
        </div>
      </div>
      <div style="padding:8px; border-bottom:1px solid var(--border-subtle); display:flex; gap:8px;">
        <input type="text" class="input" id="search-lore" placeholder="Search..." style="font-size:12px; flex:1;" value="${filter}">
        <div style="display:flex; align-items:center; gap:4px; title='Scan Depth (Messages to check)'">
            <label style="font-size:10px; color:var(--text-muted); white-space:nowrap;">Depth:</label>
            <input type="number" class="input" id="scan-depth" style="width:40px; font-size:11px; padding:2px;" min="1" max="10" value="${state.weaves.lorebook.scanDepth || 3}">
        </div>
      </div>
      <div class="card-body" id="lore-list" style="padding:0; flex:1; overflow-y:auto;"></div>
      <div class="card-footer" style="display:flex; flex-direction:column; gap:8px;">
        <button class="btn btn-primary btn-sm" id="btn-add-lore" style="width:100%;">+ Add Entry</button>
        <button class="btn btn-ghost btn-sm" id="btn-view-script" style="font-size:10px;">View Script →</button>
      </div>
    `;

    // Right: Editor
    const editorCol = document.createElement('div');
    editorCol.className = 'card';
    Object.assign(editorCol.style, { display: 'flex', flexDirection: 'column', minHeight: '0', marginBottom: '0', padding: '0', overflow: 'hidden' });
    editorCol.id = 'lore-editor';

    container.appendChild(listCol);
    container.appendChild(editorCol);

    // Handle Context
    if (context && context.createNew) {
      setTimeout(() => {
        const addBtn = listCol.querySelector('#btn-add-lore');
        if (addBtn) addBtn.click();
      }, 50);
    }

    // --- Sub-Renderers ---

    const renderList = () => {
      const listBody = listCol.querySelector('#lore-list');
      listBody.innerHTML = '';

      const entries = Object.values(state.weaves.lorebook.entries);

      // Sort: Priority DESC, Title ASC
      entries.sort((a, b) => {
        const pA = a.priority !== undefined ? a.priority : 50;
        const pB = b.priority !== undefined ? b.priority : 50;
        if (pA !== pB) return pB - pA;
        return (a.title || '').localeCompare(b.title || '');
      });

      // Filter
      const filtered = entries.filter(e => {
        if (!filter) return true;
        const txt = (e.title + ' ' + (e.keywords || []).join(' ')).toLowerCase();
        return txt.includes(filter.toLowerCase());
      });

      if (!filtered.length) {
        listBody.innerHTML = '<div style="padding:16px; color:gray; text-align:center;">No entries found.</div>';
        return;
      }

      filtered.forEach(e => {
        const row = document.createElement('div');
        row.style.padding = '8px 12px';
        row.style.borderBottom = '1px solid var(--border-subtle)';
        row.style.cursor = 'pointer';

        if (e.id === currentId) {
          row.style.backgroundColor = 'var(--bg-surface)';
          row.style.borderLeft = '3px solid var(--accent-primary)';
        }

        const enabled = e.enabled !== false;

        // Logic Indicator
        let hasLogic = false;
        if (state.sbx && state.sbx.rules) {
          hasLogic = state.sbx.rules.some(r => r.boundTo === e.uuid);
        }

        row.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:center;">
             <span style="font-weight:bold; font-size:12px; display:flex; align-items:center; ${!enabled ? 'color:var(--text-muted); text-decoration:line-through;' : ''}">
                ${hasLogic ? '<span style="color:var(--accent-primary); margin-right:4px;">⚡</span>' : ''}${e.title || 'Untitled'}
             </span>
             <span style="font-size:10px; padding:2px 4px; border-radius:4px; background:var(--bg-base); color:var(--text-muted);">${e.category || 'uncategorized'}</span>
          </div>
          <div style="font-size:10px; color:var(--text-muted); overflow:hidden; white-space:nowrap; text-overflow:ellipsis;">
            ${(e.keywords || []).join(', ')}
          </div>
        `;

        row.onclick = () => {
          currentId = e.id;
          editingShiftIndex = null; // Reset sub-edit state on entry switch
          renderList();
          renderEditor();
        };
        listBody.appendChild(row);
      });
    };

    const renderEditor = () => {
      editorCol.innerHTML = '';
      if (!currentId || !state.weaves.lorebook.entries[currentId]) {
        const hasEntries = Object.keys(state.weaves.lorebook.entries).length > 0;
        if (!hasEntries) {
          editorCol.innerHTML = A.UI.getEmptyStateHTML(
            'Lorebook Empty',
            'The Lorebook stores all your world knowledge, factions, and story details.',
            '+ Create First Entry',
            "document.getElementById('btn-add-lore').click()"
          );
        } else {
          editorCol.innerHTML = `
                <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; color:var(--text-muted); opacity:0.5;">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom:16px;">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                    </svg>
                    <div>Select an entry to edit</div>
                </div>
            `;
        }
        return;
      }

      const entry = state.weaves.lorebook.entries[currentId];

      // Defaults
      if (!entry.uuid) entry.uuid = uuidv4();
      if (!entry.keywords) entry.keywords = [];
      if (!entry.shifts) entry.shifts = [];
      if (!entry.requireTags) entry.requireTags = [];
      if (!entry.blocksTags) entry.blocksTags = [];
      if (!entry.tags) entry.tags = [];

      // Logic Count
      let logicCount = 0;
      if (state.sbx && state.sbx.rules) {
        logicCount = state.sbx.rules.filter(r => r.boundTo === entry.uuid).length;
      }

      // Styles
      editorCol.innerHTML = `
        <style>
          .l-row { display: flex; gap: 8px; margin-bottom: 8px; align-items:center; }
          .l-col { flex: 1; display:flex; flex-direction:column; }
          .l-lab { font-size: 10px; font-weight:bold; color:var(--text-muted); margin-bottom:2px; text-transform:uppercase; }
          .l-sec { border-top: 1px solid var(--border-subtle); padding-top: 12px; margin-top: 12px; }
        </style>
      `;

      // Header
      const header = document.createElement('div');
      header.className = 'card-header';
      header.innerHTML = `
        <div style="flex:1;">
          <input class="input" id="inp-title" value="${entry.title || ''}" placeholder="e.g., The Crimson Order, Magic System" style="font-weight:bold; font-size:14px;">
        </div>
        <div style="display:flex; gap:8px;">
          <button class="btn btn-ghost btn-sm" id="btn-logic" style="color:var(--accent-primary); font-weight:bold; ${logicCount > 0 ? 'background:var(--accent-soft);' : ''}">⚡ Logic ${logicCount > 0 ? '(' + logicCount + ')' : ''}</button>
          <label style="display:flex; align-items:center; gap:4px; font-size:12px;"><input type="checkbox" id="chk-en" ${entry.enabled !== false ? 'checked' : ''}> Enabled</label>
          <button class="btn btn-ghost btn-sm" id="btn-del" style="color:var(--status-error);">Delete</button>
        </div>
      `;

      // Logic Hook
      header.querySelector('#btn-logic').onclick = () => {
        if (logicCount === 0) {
          if (!state.sbx) state.sbx = { lists: [], derived: [], rules: [] };
          if (!state.sbx.rules) state.sbx.rules = [];
          state.sbx.rules.push({
            id: 'rule_' + uuidv4().split('-')[0],
            name: (entry.title || 'Entry') + ' Logic',
            enabled: true,
            boundTo: entry.uuid,
            chain: [{
              id: 'blk_' + uuidv4().split('-')[0],
              type: 'if', join: 'and', conditions: [],
              actions: [{ target: 'context.entry.content', mode: 'replace', text: entry.content || '' }]
            }]
          });
          A.State.notify();
        }
        if (A.UI && A.UI.switchPanel) A.UI.switchPanel('advanced', { boundTo: entry.uuid, boundName: entry.title });
      };

      // Delete Hook
      header.querySelector('#btn-del').onclick = () => {
        if (confirm('Delete this entry?')) {
          delete state.weaves.lorebook.entries[currentId];
          currentId = null;
          A.State.notify();
          renderList();
          renderEditor();
        }
      };

      // Inputs Hook
      header.querySelector('#inp-title').onchange = (e) => {
        entry.title = e.target.value;
        A.State.notify();
        renderList();
        if (A.UI.Toast) A.UI.Toast.show('Title updated', 'info');
      };

      header.querySelector('#chk-en').onchange = (e) => {
        entry.enabled = e.target.checked;
        A.State.notify();
        renderList();
        if (A.UI.Toast) A.UI.Toast.show(entry.enabled ? 'Entry enabled' : 'Entry disabled', 'info');
      };

      editorCol.appendChild(header);

      // Body
      const body = document.createElement('div');
      body.className = 'card-body';
      Object.assign(body.style, { overflowY: 'auto', flex: '1', minHeight: '0', paddingBottom: '60px' });

      // Options
      const catOpts = CATEGORIES.map(c => `<option value="${c}" ${c === (entry.category || 'uncategorized') ? 'selected' : ''}>${c}</option>`).join('');
      const actOpts = ACTIVATION.map(a => `<option value="${a}" ${a === (entry.activationMode || 'standard') ? 'selected' : ''}>${a}</option>`).join('');

      // Target Options
      let startItems = (state.strands && state.strands.sources && state.strands.sources.items) ? Object.values(state.strands.sources.items) : [];
      let targets = startItems.filter(i => (i.access && i.access.toLowerCase().includes('write'))).map(i => i.id);
      if (targets.length === 0) targets.push('lore');
      const tgtOpts = targets.map(t => `<option value="${t}" ${t === (entry.injectionTarget || 'lore') ? 'selected' : ''}>${t}</option>`).join('');

      body.innerHTML = `
        <div class="l-row">
           <div class="l-col" style="flex:0 0 120px;">
             <label class="l-lab">Category</label>
             <select class="input" id="sel-cat">${catOpts}</select>
           </div>
           <div class="l-col" style="flex:0 0 120px;">
             <label class="l-lab">Target</label>
             <select class="input" id="sel-tgt">${tgtOpts}</select>
           </div>
           <div class="l-col">
             <label class="l-lab" title="Triggers this entry when these words appear in chat">Keywords <span style="opacity:0.5; cursor:help;">(?)</span></label>
             <input class="input" id="inp-keys" value="${(entry.keywords || []).join(', ')}" placeholder="e.g., magic, spell, crimson order">
           </div>
        </div>
        <div class="l-col" style="margin-bottom:12px;">
           <label class="l-lab">Content</label>
           <div id="quill-content" style="height:180px;"></div>
        </div>

        <!-- Actor Association (Flow Explorer Metadata) -->
        <div class="l-sec">
          <div class="l-lab" style="margin-bottom:8px;">Associate with Actors (Flow Explorer Only)</div>
          <div id="actor-associations" style="display:flex; flex-wrap:wrap; gap:8px; padding:4px; max-height:100px; overflow-y:auto; border:1px solid var(--border-subtle); border-radius:4px;">
            <!-- Populated by JS -->
          </div>
        </div>
        
        <!-- Logic & Prob -->
        <div class="l-sec">
          <div class="l-lab" style="margin-bottom:8px;">Logic & Probability</div>
          <div class="l-row">
            <div class="l-col"><label class="l-lab">Priority</label><input type="number" class="input" id="inp-prio" value="${entry.priority !== undefined ? entry.priority : 50}"></div>
            <div class="l-col"><label class="l-lab">Probability %</label><input type="number" class="input" id="inp-prob" value="${entry.probability !== undefined ? entry.probability : 100}" min="0" max="100"></div>
            <div class="l-col"><label class="l-lab">Ins. Order</label><input type="number" class="input" id="inp-ins" value="${entry.insertion_order || 100}"></div>
          </div>
          <div class="l-row">
            <div class="l-col"><label class="l-lab">Min Messages</label><input type="number" class="input" id="inp-minm" value="${entry.minMessages || 0}"></div>
            <div class="l-col"><label class="l-lab">Group ID</label><input class="input" id="inp-grp" value="${entry.inclusionGroup || ''}"></div>
            <div class="l-col"><label class="l-lab">Group Weight</label><input type="number" class="input" id="inp-grpw" value="${entry.groupWeight || 100}"></div>
          </div>
        </div>

        <!-- Matching -->
        <div class="l-sec">
          <div class="l-lab" style="margin-bottom:8px;">Keys & Matching</div>
          <div class="l-row">
             <div class="l-col" style="flex:2;"><label class="l-lab">Secondary Keys</label><input class="input" id="inp-keys2" value="${entry.secondaryKeys || ''}"></div>
             <div class="l-col" style="flex:1;"><label class="l-lab" title="Override Global Depth">Scan Depth</label><input type="number" class="input" id="inp-depth" value="${entry.scanDepth || ''}" placeholder="Default"></div>
          </div>
          <div class="l-row" style="gap:16px;">
             <label style="font-size:11px;"><input type="checkbox" id="chk-whole" ${entry.matchWholeWords ? 'checked' : ''}> Whole Words</label>
             <label style="font-size:11px;"><input type="checkbox" id="chk-case" ${entry.caseSensitive ? 'checked' : ''}> Case Sensitive</label>
             <label style="font-size:11px;"><input type="checkbox" id="chk-kpri" ${entry.keyMatchPriority ? 'checked' : ''}> Key Priority</label>
          </div>
        </div>

        <!-- Activation -->
        <div class="l-sec">
          <div class="l-lab">Activation Logic</div>
          <div class="l-row">
             <div class="l-col" style="flex:0 0 120px;">
                <label class="l-lab">Mode</label>
                <select class="input" id="sel-act">${actOpts}</select>
             </div>
             <div class="l-col">
                <label class="l-lab">Script (JS)</label>
                <input class="input" id="inp-script" value="${entry.activationScript || ''}" placeholder="Condition...">
             </div>
          </div>
        </div>
      `;

      // Bind Basic Fields
      const bind = (sel, field, parse) => {
        const el = body.querySelector(sel);
        if (el) el.onchange = (e) => {
          entry[field] = parse ? parse(e.target.value) : e.target.value;
          A.State.notify();
        };
      };

      bind('#sel-cat', 'category');
      bind('#sel-tgt', 'injectionTarget');
      bind('#inp-keys', 'keywords', (v) => v.split(',').map(s => s.trim()).filter(s => s));
      bind('#inp-prio', 'priority', parseInt);
      bind('#inp-prob', 'probability', parseInt);
      bind('#inp-ins', 'insertion_order', parseInt);
      bind('#inp-minm', 'minMessages', parseInt);
      bind('#inp-grp', 'inclusionGroup');
      bind('#inp-grpw', 'groupWeight', parseInt);

      bind('#inp-grpw', 'groupWeight', parseInt);
      bind('#inp-depth', 'scanDepth', (v) => v ? parseInt(v) : ''); // Use empty string for default

      bind('#inp-keys2', 'secondaryKeys');
      bind('#sel-act', 'activationMode');
      bind('#inp-script', 'activationScript');

      const bindChk = (sel, field) => {
        const el = body.querySelector(sel);
        if (el) el.onchange = (e) => { entry[field] = e.target.checked; A.State.notify(); };
      };
      bindChk('#chk-whole', 'matchWholeWords');
      bindChk('#chk-case', 'caseSensitive');
      bindChk('#chk-kpri', 'keyMatchPriority');

      // Populate Actor Associations
      const assocActors = Object.values(state.nodes?.actors?.items || {});
      const actorAssocList = body.querySelector('#actor-associations');
      if (assocActors.length === 0) {
        actorAssocList.innerHTML = '<div style="font-size:11px; color:var(--text-muted); padding:4px;">No actors found.</div>';
      } else {
        if (!entry.associatedActors) entry.associatedActors = [];

        assocActors.forEach(actor => {
          const isChecked = entry.associatedActors.includes(actor.id);
          const lbl = document.createElement('label');
          lbl.style.cssText = 'display:flex; align-items:center; gap:4px; font-size:11px; padding:2px 6px; background:var(--bg-elevated); border-radius:4px; border:1px solid var(--border-subtle); cursor:pointer; user-select:none;';
          if (isChecked) lbl.style.borderColor = 'var(--accent-primary)';

          lbl.innerHTML = `<input type="checkbox" style="margin:0;" ${isChecked ? 'checked' : ''}> ${actor.name || 'Unknown'}`;

          lbl.querySelector('input').onchange = (e) => {
            if (e.target.checked) {
              entry.associatedActors.push(actor.id);
              lbl.style.borderColor = 'var(--accent-primary)';
            } else {
              entry.associatedActors = entry.associatedActors.filter(id => id !== actor.id);
              lbl.style.borderColor = 'var(--border-subtle)';
            }
            A.State.notify();
          };
          actorAssocList.appendChild(lbl);
        });
      }

      // --- ADVANCED GATES SECTION ---
      // Initialize gate structures if missing
      if (!entry.emotionGates) entry.emotionGates = { andAny: [], andAll: [], notAny: [], notAll: [] };
      if (!entry.erosGates) entry.erosGates = { currentVibe: { min: null, max: null }, longTermMin: null };
      if (!entry.intentGates) entry.intentGates = { allowedIntents: [] };
      if (!entry.entityGates) entry.entityGates = { restrictToActors: [] };

      const gatesSec = document.createElement('div');
      gatesSec.className = 'l-sec';
      gatesSec.innerHTML = `<div class="l-lab" style="margin-bottom:8px;">Advanced Gates</div>`;

      // Helper: Collapsible Section
      const createCollapsible = (title, content, defaultOpen = false) => {
        const wrapper = document.createElement('div');
        wrapper.style.cssText = 'border:1px solid var(--border-subtle);border-radius:var(--radius-md);margin-bottom:8px;overflow:hidden;';

        const header = document.createElement('div');
        header.style.cssText = 'padding:8px 12px;background:var(--bg-elevated);cursor:pointer;display:flex;justify-content:space-between;align-items:center;font-size:11px;font-weight:bold;';
        header.innerHTML = `<span>${title}</span><span class="toggle-icon">${defaultOpen ? '▼' : '▶'}</span>`;

        const body = document.createElement('div');
        body.style.cssText = `padding:12px;display:${defaultOpen ? 'block' : 'none'};background:var(--bg-base);`;
        body.appendChild(content);

        header.onclick = () => {
          const isOpen = body.style.display !== 'none';
          body.style.display = isOpen ? 'none' : 'block';
          header.querySelector('.toggle-icon').textContent = isOpen ? '▶' : '▼';
        };

        wrapper.appendChild(header);
        wrapper.appendChild(body);
        return wrapper;
      };

      // === EMOTION GATES ===
      const emotionContent = document.createElement('div');
      const emotionRows = [
        { label: 'Require ANY', key: 'andAny', color: 'var(--accent-primary)' },
        { label: 'Require ALL', key: 'andAll', color: 'var(--status-warning)' },
        { label: 'Block if ANY', key: 'notAny', color: 'var(--status-error)' },
        { label: 'Block if ALL', key: 'notAll', color: 'var(--status-error)' }
      ];
      emotionRows.forEach(({ label, key, color }) => {
        const row = document.createElement('div');
        row.className = 'l-row';
        row.style.marginBottom = '8px';

        const labelSpan = document.createElement('span');
        labelSpan.style.cssText = `font-size:10px;color:${color};min-width:80px;`;
        labelSpan.textContent = label;
        row.appendChild(labelSpan);

        const pickerContainer = document.createElement('div');
        pickerContainer.style.flex = '1';
        renderTagPicker(pickerContainer, '', entry.emotionGates[key], () => A.State.notify());
        row.appendChild(pickerContainer);

        emotionContent.appendChild(row);
      });
      gatesSec.appendChild(createCollapsible('🎭 Emotion Gates', emotionContent, entry.emotionGates.andAny.length > 0 || entry.emotionGates.notAny.length > 0));

      // === EROS GATES ===
      const erosContent = document.createElement('div');
      erosContent.innerHTML = `
        <div class="l-row" style="gap:16px;margin-bottom:8px;">
          <div class="l-col">
            <label class="l-lab">Current Vibe Min</label>
            <div style="display:flex;align-items:center;gap:8px;">
              <input type="range" id="eros-vibe-min" min="0" max="10" value="${entry.erosGates.currentVibe.min ?? 0}" style="flex:1;">
              <span id="eros-vibe-min-label" style="font-size:10px;min-width:90px;">${entry.erosGates.currentVibe.min !== null ? EROS_LEVELS[entry.erosGates.currentVibe.min] || entry.erosGates.currentVibe.min : 'Any'}</span>
            </div>
          </div>
          <div class="l-col">
            <label class="l-lab">Current Vibe Max</label>
            <div style="display:flex;align-items:center;gap:8px;">
              <input type="range" id="eros-vibe-max" min="0" max="10" value="${entry.erosGates.currentVibe.max ?? 10}" style="flex:1;">
              <span id="eros-vibe-max-label" style="font-size:10px;min-width:90px;">${entry.erosGates.currentVibe.max !== null ? EROS_LEVELS[entry.erosGates.currentVibe.max] || entry.erosGates.currentVibe.max : 'Any'}</span>
            </div>
          </div>
        </div>
        <div class="l-row">
          <div class="l-col" style="max-width:200px;">
            <label class="l-lab">Long-Term Min</label>
            <div style="display:flex;align-items:center;gap:8px;">
              <input type="range" id="eros-lt-min" min="0" max="10" value="${entry.erosGates.longTermMin ?? 0}" style="flex:1;">
              <span id="eros-lt-label" style="font-size:10px;min-width:90px;">${entry.erosGates.longTermMin !== null ? EROS_LEVELS[entry.erosGates.longTermMin] || entry.erosGates.longTermMin : 'Any'}</span>
            </div>
          </div>
          <div class="l-col" style="font-size:10px;color:var(--text-muted);padding-top:16px;">
            EROS measures romantic/arousal levels from 0 (NONE) to 10 (TRANSCENDENCE)
          </div>
        </div>
      `;

      // Bind EROS sliders
      setTimeout(() => {
        const vibeMin = erosContent.querySelector('#eros-vibe-min');
        const vibeMax = erosContent.querySelector('#eros-vibe-max');
        const ltMin = erosContent.querySelector('#eros-lt-min');

        if (vibeMin) {
          vibeMin.oninput = (e) => {
            const val = parseInt(e.target.value);
            entry.erosGates.currentVibe.min = val === 0 ? null : val;
            erosContent.querySelector('#eros-vibe-min-label').textContent = val === 0 ? 'Any' : (EROS_LEVELS[val] || val);
          };
          vibeMin.onchange = () => A.State.notify();
        }
        if (vibeMax) {
          vibeMax.oninput = (e) => {
            const val = parseInt(e.target.value);
            entry.erosGates.currentVibe.max = val === 10 ? null : val;
            erosContent.querySelector('#eros-vibe-max-label').textContent = val === 10 ? 'Any' : (EROS_LEVELS[val] || val);
          };
          vibeMax.onchange = () => A.State.notify();
        }
        if (ltMin) {
          ltMin.oninput = (e) => {
            const val = parseInt(e.target.value);
            entry.erosGates.longTermMin = val === 0 ? null : val;
            erosContent.querySelector('#eros-lt-label').textContent = val === 0 ? 'Any' : (EROS_LEVELS[val] || val);
          };
          ltMin.onchange = () => A.State.notify();
        }
      }, 0);

      gatesSec.appendChild(createCollapsible('💕 EROS Gates', erosContent, entry.erosGates.currentVibe.min !== null || entry.erosGates.longTermMin !== null));

      // === INTENT GATES ===
      const intentContent = document.createElement('div');
      intentContent.innerHTML = `<div style="font-size:10px;color:var(--text-muted);margin-bottom:8px;">Select intents that will allow this entry to fire. Leave empty to allow all.</div>`;

      const intentCheckboxes = document.createElement('div');
      intentCheckboxes.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;';

      INTENTS.forEach(intent => {
        const label = document.createElement('label');
        label.style.cssText = 'display:flex;align-items:center;gap:4px;font-size:11px;cursor:pointer;';
        const checked = entry.intentGates.allowedIntents.includes(intent);
        label.innerHTML = `<input type="checkbox" data-intent="${intent}" ${checked ? 'checked' : ''}> ${intent}`;
        label.querySelector('input').onchange = (e) => {
          if (e.target.checked) {
            if (!entry.intentGates.allowedIntents.includes(intent)) {
              entry.intentGates.allowedIntents.push(intent);
            }
          } else {
            entry.intentGates.allowedIntents = entry.intentGates.allowedIntents.filter(i => i !== intent);
          }
          A.State.notify();
        };
        intentCheckboxes.appendChild(label);
      });
      intentContent.appendChild(intentCheckboxes);

      gatesSec.appendChild(createCollapsible('💬 Intent Gates', intentContent, entry.intentGates.allowedIntents.length > 0));

      // === ENTITY GATES ===
      const entityContent = document.createElement('div');
      entityContent.innerHTML = `<div style="font-size:10px;color:var(--text-muted);margin-bottom:8px;">Restrict this entry to fire only when specific actors are present.</div>`;

      // Get actors from state
      const actors = state.nodes?.actors?.items ? Object.values(state.nodes.actors.items) : [];

      if (actors.length === 0) {
        entityContent.innerHTML += `<div style="font-size:11px;color:var(--text-muted);font-style:italic;">No actors defined. Create actors in the Nodes panel.</div>`;
      } else {
        const actorCheckboxes = document.createElement('div');
        actorCheckboxes.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;';

        actors.forEach(actor => {
          const label = document.createElement('label');
          label.style.cssText = 'display:flex;align-items:center;gap:4px;font-size:11px;cursor:pointer;';
          const checked = entry.entityGates.restrictToActors.includes(actor.id);
          label.innerHTML = `<input type="checkbox" data-actor="${actor.id}" ${checked ? 'checked' : ''}> ${actor.name || actor.id}`;
          label.querySelector('input').onchange = (e) => {
            if (e.target.checked) {
              if (!entry.entityGates.restrictToActors.includes(actor.id)) {
                entry.entityGates.restrictToActors.push(actor.id);
              }
            } else {
              entry.entityGates.restrictToActors = entry.entityGates.restrictToActors.filter(id => id !== actor.id);
            }
            A.State.notify();
          };
          actorCheckboxes.appendChild(label);
        });
        entityContent.appendChild(actorCheckboxes);
      }

      gatesSec.appendChild(createCollapsible('👤 Entity Gates', entityContent, entry.entityGates.restrictToActors.length > 0));

      body.appendChild(gatesSec);

      // --- TAG GATES SECTION (Original Aura Logic) ---
      const auraSec = document.createElement('div');
      auraSec.className = 'l-sec';
      auraSec.innerHTML = `<div class="l-lab" style="margin-bottom:8px;">Tag Logic & Shifts</div>`;

      // Tag Pickers
      const rowTags = document.createElement('div');
      rowTags.className = 'l-row';
      renderTagPicker(rowTags, 'Requires Tags', entry.requireTags, () => A.State.notify());
      renderTagPicker(rowTags, 'Blocks Tags', entry.blocksTags, () => A.State.notify());
      auraSec.appendChild(rowTags);

      const rowEmit = document.createElement('div');
      rowEmit.className = 'l-row';
      renderTagPicker(rowEmit, 'Emits Tags', entry.tags, () => A.State.notify());
      auraSec.appendChild(rowEmit);

      // Shifts UI
      const shiftsDiv = document.createElement('div');
      shiftsDiv.className = 'l-col';
      shiftsDiv.style.marginTop = '8px';

      renderShifts(shiftsDiv, entry);
      auraSec.appendChild(shiftsDiv);

      body.appendChild(auraSec);
      editorCol.appendChild(body);

      // Initialize Quill for Content field (MUST happen after body is attached to DOM)
      if (A.QuillManager && typeof Quill !== 'undefined') {
        A.QuillManager.init('quill-content', {
          placeholder: 'Enter lorebook entry content...',
          onChange: (quill, html) => {
            entry.content = html;
            A.State.notify();
            // Debounce toast for content to avoid spam, or just rely on auto-save assurance. 
            // For rich text, a "Saved" indicator is often better than a toast. 
            // We'll skip toast here to avoid spamming while typing.
          }
        });
        // Set initial content
        A.QuillManager.setHTML('quill-content', entry.content || '');
      }

      // Attach AI Assistant to Entry Content
      if (A.UI.Assistant && A.QuillManager) {
        A.UI.Assistant.attach(document.getElementById('quill-content'), {
          label: 'Lore Entry',
          system: 'You are a world-building expert. Write or improve this lorebook entry. Focus on detail, history, and consistency.',
          getValue: () => A.QuillManager.getText('quill-content'),
          setValue: (val) => A.QuillManager.setText('quill-content', val)
        });
      }
    };

    // --- Sub-Helper: Shifts Render ---
    function renderShifts(container, entry) {
      container.innerHTML = '';
      const shifts = entry.shifts || []; // Safety

      // MODE: EDITING
      if (typeof editingShiftIndex === 'number' && shifts[editingShiftIndex]) {
        const shift = shifts[editingShiftIndex];

        // Ensure Data Structure (Fixing keys vs keywords consistency)
        if (!shift.keywords) shift.keywords = shift.keys || [];
        delete shift.keys; // Migrate if present
        if (!shift.requireTags) shift.requireTags = [];
        if (!shift.blocksTags) shift.blocksTags = [];
        if (!shift.tags) shift.tags = [];

        const form = document.createElement('div');
        Object.assign(form.style, { display: 'flex', flexDirection: 'column', gap: '8px' });

        // Form Header
        const head = document.createElement('div');
        Object.assign(head.style, { display: 'flex', justifyContent: 'space-between', marginBottom: '8px' });
        head.innerHTML = `
           <button class="btn btn-ghost btn-sm" id="btn-back">← Back</button>
           <button class="btn btn-ghost btn-sm" id="btn-del-shift" style="color:var(--status-error);">Delete</button>
        `;
        head.querySelector('#btn-back').onclick = (e) => {
          e.stopPropagation();
          editingShiftIndex = null;
          renderEditor(); // Re-render to show list view
        };
        head.querySelector('#btn-del-shift').onclick = (e) => {
          e.stopPropagation();
          if (confirm('Delete this shift?')) {
            entry.shifts.splice(editingShiftIndex, 1);
            editingShiftIndex = null;
            A.State.notify();
            renderEditor(); // Re-render to show list view
          }
        };
        form.appendChild(head);

        // Fields
        form.innerHTML += `
           <div class="l-col">
              <label class="l-lab">Trigger Keys (comma)</label>
              <input class="input" id="inp-sh-keys" value="${(shift.keywords || []).join(', ')}">
           </div>
           <div class="l-col">
              <label class="l-lab">Shifted Content</label>
              <textarea class="input" id="inp-sh-content" style="height:60px; font-family:var(--font-mono); resize:none;">${shift.content || ''}</textarea>
           </div>
        `;

        form.querySelector('#inp-sh-keys').onchange = (e) => {
          shift.keywords = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
          A.State.notify();
        };
        form.querySelector('#inp-sh-content').onchange = (e) => {
          shift.content = e.target.value;
          A.State.notify();
        };

        // Add token counter to shift content
        const shiftTextarea = form.querySelector('#inp-sh-content');
        if (shiftTextarea) {
          const label = shiftTextarea.previousElementSibling;
          if (label) A.Utils.addTokenCounter(shiftTextarea, label);

          if (A.UI.Assistant) {
            A.UI.Assistant.attach(shiftTextarea, {
              label: 'Shift Content',
              system: 'You are a world-building expert. Write or improve this lore shift content.'
            });
          }
        }

        container.appendChild(form);

        // Render Tag Pickers (append to form)
        renderTagPicker(form, 'Requires Tags', shift.requireTags, () => A.State.notify());
        renderTagPicker(form, 'Blocks Tags', shift.blocksTags, () => A.State.notify());
        renderTagPicker(form, 'Emits Tags', shift.tags, () => A.State.notify());

        return;
      }

      // MODE: LIST
      const head = document.createElement('div');
      Object.assign(head.style, { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' });
      head.innerHTML = `
        <label class="l-lab">Shifts (${shifts.length})</label>
        <button class="btn btn-ghost btn-sm" id="btn-add-shift" style="color:var(--accent-primary);">+ Add Shift</button>
      `;

      head.querySelector('#btn-add-shift').onclick = (e) => {
        e.stopPropagation();
        const newShift = { keywords: [], content: '', requireTags: [], blocksTags: [], tags: [] };
        entry.shifts.push(newShift);
        editingShiftIndex = entry.shifts.length - 1;
        A.State.notify();
        renderEditor(); // Re-render to show edit form
      };

      container.appendChild(head);

      if (shifts.length === 0) {
        const emptyMsg = document.createElement('div');
        emptyMsg.style.cssText = 'font-size:11px; color:var(--text-muted); padding:8px; border:1px dashed var(--border-subtle); border-radius:var(--radius-md); text-align:center;';
        emptyMsg.textContent = 'No shifts defined.';
        container.appendChild(emptyMsg);
        return;
      }

      const list = document.createElement('div');
      Object.assign(list.style, { display: 'flex', flexDirection: 'column', gap: '4px' });

      shifts.forEach((sh, idx) => {
        const row = document.createElement('div');
        Object.assign(row.style, {
          background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)', padding: '8px', cursor: 'pointer'
        });
        row.innerHTML = `
          <div style="font-size:11px; font-weight:bold; color:var(--text-primary); margin-bottom:2px;">Keys: ${(sh.keywords || sh.keys || []).join(', ') || '(No Keys)'}</div>
          <div style="font-size:10px; color:var(--text-secondary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${sh.content || '(No Content)'}</div>
          <div style="font-size:9px; color:var(--text-muted); margin-top:4px; display:flex; gap:4px;">
              ${(sh.requireTags || []).length ? `<span style="color:var(--accent-primary);">Req: ${sh.requireTags.length}</span>` : ''}
              ${(sh.blocksTags || []).length ? `<span style="color:var(--status-error);">Blk: ${sh.blocksTags.length}</span>` : ''}
              ${(sh.tags || []).length ? `<span style="color:var(--text-main);">Emit: ${sh.tags.length}</span>` : ''}
          </div>
        `;
        row.onclick = (e) => {
          e.stopPropagation();
          editingShiftIndex = idx;
          renderEditor(); // Re-render to show edit form
        };
        list.appendChild(row);
      });
      container.appendChild(list);
    }

    // --- Init ---
    // List Listeners
    listCol.querySelector('#btn-add-lore').onclick = () => {
      const id = 'lore_' + uuidv4().split('-')[0];
      state.weaves.lorebook.entries[id] = {
        id: id, title: 'New Entry', keywords: [], content: '', enabled: true,
        priority: 50, category: 'uncategorized',
        requireTags: [], blocksTags: [], tags: [], shifts: [], uuid: uuidv4()
      };
      currentId = id;
      A.State.notify();
      renderList();
      renderEditor();
    };

    listCol.querySelector('#search-lore').oninput = (e) => {
      filter = e.target.value;
      renderList();
    };

    listCol.querySelector('#scan-depth').onchange = (e) => {
      let val = parseInt(e.target.value) || 3;
      if (val < 1) val = 1;
      if (val > 20) val = 20;
      state.weaves.lorebook.scanDepth = val;
      // No immediate rerender needed, just state update
    };

    // View Script button - navigates to Scripts panel
    listCol.querySelector('#btn-view-script').onclick = () => {
      A.State.notify();
      if (A.UI && A.UI.switchPanel) {
        // Navigate to scripts panel (AuraBuilder will handle the merge)
        A.UI.switchPanel('scripts');
        if (A.UI.Toast) A.UI.Toast.show('Lorebook content merges into AURA.js on export', 'info');
      }
    };

    // Run Initial Renders
    renderList();
    renderEditor();
  }

  A.registerPanel('lorebook', {
    label: 'Lorebook',
    subtitle: 'World Knowledge',
    category: 'Weave',
    render: render
  });

})(window.Anansi);
