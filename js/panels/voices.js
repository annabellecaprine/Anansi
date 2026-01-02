/*
 * Anansi Panel: Voices (Runtime Audio/Text Injection)
 * File: js/panels/voices.js
 * Category: Weave
 * Origin: Ported from RuleForge/ScriptBuilder 3000
 */

(function (A) {
  'use strict';

  // --- Logic & Script Generation ---

  function toLines(s) {
    return String(s || '').split(/\r?\n/).map(l => l.trim().toLowerCase()).filter(l => l);
  }

  function jsStr(s) {
    return '"' + (s || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\r/g, '\\r').replace(/\n/g, '\\n') + '"';
  }

  function emitArray(arr) {
    return '[' + arr.map(jsStr).join(',') + ']';
  }

  function emitSubtones(subtones) {
    if (!subtones || !subtones.length) return '[]';
    return '[' + subtones.map((st, i) =>
      `{label:${jsStr(st.label || ('Subtone ' + (i + 1)))},weight:${(+st.weight || 0)},rail:${jsStr(st.rail || '')}}`
    ).join(',') + ']';
  }

  function generateScript(data) {
    const voices = (data && data.voices) ? data.voices : [];
    const activeVoices = voices.filter(v => v.enabled);

    if (!activeVoices.length) return '/* No enabled voices. */';

    let s = '/* === VOICE RAILS (Generated) =========================================== */\n\n';
    s += 'var VOICES_CFG = {\n';
    s += '  enabled: true,\n';
    s += `  debug: ${data.debug ? 'true' : 'false'},\n`;
    s += '  voices: [\n';

    s += activeVoices.map(v => {
      const ctx = v.ctx || {};
      const att = v.attempt || {};

      return `    {
      enabled: ${v.enabled},
      tag: ${jsStr(v.tag || 'V')},
      characterName: ${jsStr(v.characterName)},
      chatName: ${jsStr(v.chatName)},
      handle: ${jsStr(v.handle)},
      attempt: {
        baseChance: ${att.baseChance || 0.6},
        contentBoost: ${att.contentBoost || 0.15},
        softPenalty: ${att.softPenalty || 0.20}
      },
      ctx: {
        softPhrases: ${emitArray(toLines(ctx.softPhrases))},
        teachingPhrases: ${emitArray(toLines(ctx.teachingPhrases))},
        complimentPhrases: ${emitArray(toLines(ctx.complimentPhrases))},
        contentWords: ${emitArray(toLines(ctx.contentWords))}
      },
      baselineMarker: ${jsStr(v.baselineMarker || '[VOICE]')},
      baselineRail: ${jsStr(v.baselineRail)},
      cadenceRail: ${jsStr(v.cadenceRail)},
      subtones: ${emitSubtones(v.subtones)}
    }`;
    }).join(',\n');

    s += '\n  ]\n};\n\n';

    // Engine Logic (Client Script using AURA Library)
    s += `(function(){
  // Dependencies: AURA (Global)
  if (typeof AURA === 'undefined') { console.warn('VOICES: AURA lib missing'); return; }
  if (!VOICES_CFG || !VOICES_CFG.enabled) return;
  if (!context || !context.chat) return;

  var utils = AURA.utils;
  
  // 1. Prepare Inputs
  var msg = (typeof SBX_R !== 'undefined') ? SBX_R.msgLower(context) : (context.chat.length ? context.chat[context.chat.length-1].mes : '').toLowerCase();
  
  // Shim context
  if (!context.character) context.character = {};
  if (typeof context.character.personality !== "string") context.character.personality = "";
  if (typeof context.character.scenario !== "string") context.character.scenario = "";

  function debugCrumb(vcfg, crumb){
    if (!VOICES_CFG.debug) return;
    context.character.scenario += " [" + (vcfg.tag||"VR") + ":" + crumb + "]";
  }

  function pickSubtone(subtones){
    if (!subtones || !subtones.length) return null;
    var sum = subtones.reduce((acc,s) => acc + (s.weight||0), 0);
    if (sum <= 0) return subtones[0];
    var r = Math.random() * sum;
    var acc = 0;
    for (var i=0;i<subtones.length;i++){
      var w = subtones[i].weight||0;
      if (w<=0) continue;
      acc += w;
      if (r <= acc) return subtones[i];
    }
    return subtones[subtones.length-1];
  }

  function runVoice(vcfg){
    if (!vcfg || !vcfg.enabled) return;

    // A. Check Context Gates (using AURA.gates if implemented, or simple text check for now)
    // The original logic didn't have heavy gating, just simple chance.
    // Future expansion: if (vcfg.block && !AURA.gates.checkWords(vcfg, msg)) return;

    // 1. One-time Baseline Injection
    if (vcfg.baselineMarker && vcfg.baselineRail && context.character.personality.indexOf(vcfg.baselineMarker) === -1){
      context.character.personality += " " + vcfg.baselineRail;
      debugCrumb(vcfg, "BASE");
    }

    // 2. Cadence Rail (Always)
    if (vcfg.cadenceRail) context.character.personality += " " + vcfg.cadenceRail;

    // 3. Attempt Logic
    // Use AURA.utils.hasTerm for any keyword checks if added later
    var chance = vcfg.attempt.baseChance;
    
    // Example usage of AURA utils for content boost (if configured)
    // if (vcfg.ctx.contentWords.some(w => utils.hasTerm(msg, w))) chance += vcfg.attempt.contentBoost;
    // (We keep original logic for now but this demonstrates integration)

    if (Math.random() < chance) {
       debugCrumb(vcfg, "ATT:Y");
       var st = pickSubtone(vcfg.subtones);
       if (st && st.rail) {
         debugCrumb(vcfg, "ST:" + (st.label||"?"));
         context.character.personality += " " + st.rail;
       }
    } else {
       debugCrumb(vcfg, "ATT:N");
       // Example soft penalty logic would go here
    }
  }

  VOICES_CFG.voices.forEach(runVoice);
})();`;

    return s;
  }

  // --- UI ---

  let currentVoiceIndex = 0;
  let searchTerm = ''; // Search Filter

  function render(container) {
    const state = A.State.get();
    if (!state.weaves) state.weaves = {};
    if (!state.weaves.voices) state.weaves.voices = { voices: [], debug: false, enabled: true };
    const data = state.weaves.voices;

    // Layout
    container.style.height = '100%';
    container.style.display = 'grid';
    container.style.gridTemplateColumns = '220px 1fr';
    container.style.gap = 'var(--space-4)';
    container.style.overflow = 'hidden';

    // List Col
    const listCol = document.createElement('div');
    listCol.className = 'card';
    listCol.style.display = 'flex';
    listCol.style.flexDirection = 'column';
    listCol.style.marginBottom = '0';
    listCol.innerHTML = `
      <div class="card-header" style="flex-direction:column; align-items:stretch; gap:8px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <strong>Voices</strong>
          <button class="btn btn-secondary btn-sm" id="btn-add-voice">+ New</button>
        </div>
        <input class="input" id="search-voices" placeholder="Filter voices..." style="width:100%; font-size:12px; height:28px;" value="${searchTerm}">
      </div>
      <div class="card-body" id="voice-list" style="padding:0; flex:1; overflow-y:auto;"></div>
      <div class="card-footer" style="display:flex; justify-content:space-between; align-items:center;">
        <label style="font-size:11px; cursor:pointer;"><input type="checkbox" id="chk-debug" ${data.debug ? 'checked' : ''}> Debug Crumbs</label>
        <button class="btn btn-ghost btn-sm" id="btn-view-script" style="font-size:10px;">View Script →</button>
      </div>
    `;

    // Editor Col
    const editorCol = document.createElement('div');
    editorCol.className = 'card';
    editorCol.style.display = 'flex';
    editorCol.style.flexDirection = 'column';
    editorCol.style.marginBottom = '0';
    editorCol.style.padding = '0';
    editorCol.id = 'voice-editor';

    // Simplified layout (no preview pane - scripts go to Scripts panel)
    container.appendChild(listCol);
    container.appendChild(editorCol);

    // --- Logic ---
    const listBody = listCol.querySelector('#voice-list');

    // Bind Search
    listCol.querySelector('#search-voices').oninput = (e) => {
      searchTerm = e.target.value.toLowerCase();
      refreshList();
    };

    // Sync generated script to Scripts panel
    function syncScript() {
      const code = generateScript(data);
      A.Scripts.syncManaged('gen_voices', 'GENERATED: Voices', code);
    }

    function refreshList() {
      listBody.innerHTML = '';

      let voices = data.voices;
      if (searchTerm) {
        voices = voices.map((v, i) => ({ ...v, originalIndex: i })) // Keep track of original index
          .filter(v => (v.characterName || '').toLowerCase().includes(searchTerm) || (v.chatName || '').toLowerCase().includes(searchTerm));
      } else {
        voices = voices.map((v, i) => ({ ...v, originalIndex: i }));
      }

      if (!voices.length) {
        listBody.innerHTML = `<div style="padding:16px; color:gray;">${searchTerm ? 'No matches.' : 'No voices defined.'}</div>`;
        return;
      }

      voices.forEach((v) => {
        const row = document.createElement('div');
        row.style.padding = '8px 12px';
        row.style.borderBottom = '1px solid var(--border-subtle)';
        row.style.cursor = 'pointer';
        row.style.fontSize = '12px';
        if (v.originalIndex === currentVoiceIndex) {
          row.style.backgroundColor = 'var(--bg-surface)';
          row.style.borderLeft = '3px solid var(--accent-primary)';
        }

        row.innerHTML = `
           <div style="font-weight:bold;">${v.characterName || 'Unnamed Voice'}</div>
           <div style="font-size:10px; color:var(--text-muted);">${v.chatName ? 'Chat: ' + v.chatName : ''} • ${v.subtones ? v.subtones.length : 0} subtones</div>
        `;
        row.onclick = () => { currentVoiceIndex = v.originalIndex; refreshList(); renderEditor(); };
        listBody.appendChild(row);
      });
      syncScript(); // Auto-sync to Scripts panel
    }

    function renderEditor() {
      editorCol.innerHTML = '';
      const v = data.voices[currentVoiceIndex];
      if (!v) {
        editorCol.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; color:var(--text-muted); opacity:0.7;">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom:16px;">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line>
                </svg>
                <div style="margin-bottom:16px;">Select a Voice to edit</div>
                <button class="btn btn-secondary" id="btn-empty-create">Create New Voice</button>
            </div>
        `;
        editorCol.querySelector('#btn-empty-create').onclick = () => listCol.querySelector('#btn-add-voice').click();
        return;
      }

      // Styles
      const style = `<style>
        .v-row { display: flex; gap: 8px; margin-bottom: 8px; }
        .v-col { flex: 1; display:flex; flex-direction:column; }
        .v-lab { font-size: 10px; font-weight:bold; color:var(--text-muted); margin-bottom:2px; text-transform:uppercase; }
        .v-sec { border-top: 1px solid var(--border-subtle); padding-top: 12px; margin-top: 12px; }
      </style>`;
      editorCol.innerHTML = style;

      // Header
      const header = document.createElement('div');
      header.className = 'card-header';
      header.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:4px; flex:1;">
          <input class="input" id="inp-charname" value="${v.characterName || ''}" placeholder="Character Name" style="font-weight:bold;">
          <input class="input" id="inp-chatname" value="${v.chatName || ''}" placeholder="Chat Name (in messages)" style="font-size:12px;">
        </div>
        <label style="display:flex; align-items:center; gap:4px; font-size:12px;"><input type="checkbox" id="chk-en" ${v.enabled ? 'checked' : ''}> Enabled</label>
        <button class="btn btn-ghost btn-sm" id="btn-del" style="color:var(--status-error);">Delete</button>
      `;
      editorCol.appendChild(header);

      // Body (Scrollable)
      const body = document.createElement('div');
      body.className = 'card-body';
      body.style.overflowY = 'auto'; // ensure scroll
      body.style.flex = '1';

      body.innerHTML = `
        <div class="v-row">
           <div class="v-col"><label class="v-lab">Tag</label><input class="input" id="inp-tag" value="${v.tag || 'V'}"></div>
           <div class="v-col"><label class="v-lab">Handle</label><input class="input" id="inp-handle" value="${v.handle || ''}"></div>
        </div>

        <div class="v-sec">
          <div class="v-lab">Baseline & Cadence</div>
          <div class="v-row">
            <div class="v-col"><label class="v-lab">Baseline Marker</label><input class="input" id="inp-mark" value="${v.baselineMarker || '[VOICE]'}"></div>
          </div>
          <div class="v-col"><label class="v-lab">Baseline Rail (Injected once if missing)</label><textarea class="input" rows="2" id="inp-base">${v.baselineRail || ''}</textarea></div>
          <div class="v-col" style="margin-top:8px;"><label class="v-lab">Cadence Rail (Injected always)</label><textarea class="input" rows="2" id="inp-cad">${v.cadenceRail || ''}</textarea></div>
        </div>
        
        <div class="v-sec">
          <div class="v-lab">Probability</div>
          <div class="v-row">
            <div class="v-col"><label class="v-lab">Chance (0-1)</label><input type="number" step="0.1" class="input" id="inp-chance" value="${v.attempt?.baseChance || 0.6}"></div>
            <div class="v-col"><label class="v-lab">Boost (+)</label><input type="number" step="0.1" class="input" id="inp-boost" value="${v.attempt?.contentBoost || 0.15}"></div>
          </div>
        </div>

        <div class="v-sec">
          <div class="v-lab">Subtones</div>
          <div id="subtone-list"></div>
          <button class="btn btn-secondary btn-sm" id="btn-add-subtone" style="margin-top:8px;">+ Add Subtone</button>
        </div>
      `;
      editorCol.appendChild(body);

      // --- Bindings ---
      const upd = () => { A.State.notify(); syncScript(); };

      header.querySelector('#inp-charname').oninput = e => { v.characterName = e.target.value; upd(); refreshList(); };
      header.querySelector('#inp-chatname').oninput = e => { v.chatName = e.target.value; upd(); refreshList(); };
      header.querySelector('#inp-charname').onchange = e => { if (A.UI.Toast) A.UI.Toast.show('Name saved', 'info'); };
      header.querySelector('#chk-en').onchange = e => { v.enabled = e.target.checked; upd(); if (A.UI.Toast) A.UI.Toast.show(v.enabled ? 'Voice enabled' : 'Voice disabled', 'info'); };
      header.querySelector('#btn-del').onclick = () => {
        if (confirm('Delete voice?')) {
          data.voices.splice(currentVoiceIndex, 1);
          currentVoiceIndex = 0;
          upd();
          refreshList();
          renderEditor();
          if (A.UI.Toast) A.UI.Toast.show('Voice deleted', 'info');
        }
      };

      body.querySelector('#inp-tag').oninput = e => { v.tag = e.target.value; upd(); };
      body.querySelector('#inp-handle').oninput = e => { v.handle = e.target.value; upd(); };

      body.querySelector('#inp-mark').oninput = e => { v.baselineMarker = e.target.value; upd(); };
      body.querySelector('#inp-base').oninput = e => { v.baselineRail = e.target.value; upd(); };
      body.querySelector('#inp-cad').oninput = e => { v.cadenceRail = e.target.value; upd(); };

      v.attempt = v.attempt || {};
      body.querySelector('#inp-chance').oninput = e => { v.attempt.baseChance = parseFloat(e.target.value); upd(); };
      body.querySelector('#inp-boost').oninput = e => { v.attempt.contentBoost = parseFloat(e.target.value); upd(); };

      // Subtones
      const stList = body.querySelector('#subtone-list');
      function renderST() {
        stList.innerHTML = '';
        (v.subtones || []).forEach((st, idx) => {
          const div = document.createElement('div');
          div.style.border = '1px solid var(--border-subtle)';
          div.style.padding = '8px';
          div.style.marginBottom = '8px';
          div.style.borderRadius = '4px';
          div.innerHTML = `
             <div class="v-row">
               <div class="v-col"><input class="input" placeholder="Label" value="${st.label || ''}" oninput="this.getRootNode().host_edit(${idx}, 'label', this.value)"></div>
               <div style="width:60px;"><input type="number" class="input" placeholder="W" value="${st.weight || 0}" oninput="this.getRootNode().host_edit(${idx}, 'weight', this.value)"></div>
               <button class="btn btn-ghost btn-sm" onclick="this.getRootNode().host_del(${idx})">×</button>
             </div>
             <textarea class="input" rows="2" placeholder="Rail content..." oninput="this.getRootNode().host_edit(${idx}, 'rail', this.value)">${st.rail || ''}</textarea>
           `;

          // Hacky bindings via DOM properties for cleaner code
          div.host_edit = (i, k, val) => { v.subtones[i][k] = (k === 'weight' ? parseFloat(val) : val); upd(); };
          div.host_del = (i) => { v.subtones.splice(i, 1); renderST(); upd(); };

          stList.appendChild(div);
        });
      }
      renderST();
      body.querySelector('#btn-add-subtone').onclick = () => {
        v.subtones = v.subtones || [];
        v.subtones.push({ label: 'New Subtone', weight: 1, rail: '' });
        renderST();
        addSubtoneTokenCounters(); // Update counters after adding
        upd();
        if (A.UI.Toast) A.UI.Toast.show('Subtone added', 'success');
      };

      // Add token counters to baseline and cadence rails
      const baseTextarea = body.querySelector('#inp-base');
      const cadTextarea = body.querySelector('#inp-cad');
      if (baseTextarea) {
        const baseLabel = baseTextarea.previousElementSibling;
        if (baseLabel) A.Utils.addTokenCounter(baseTextarea, baseLabel);
      }
      if (cadTextarea) {
        const cadLabel = cadTextarea.previousElementSibling;
        if (cadLabel) A.Utils.addTokenCounter(cadTextarea, cadLabel);
      }

      // Add token counters to subtone rails
      const addSubtoneTokenCounters = () => {
        stList.querySelectorAll('textarea').forEach(textarea => {
          // Check if already has counter
          if (!textarea.nextElementSibling || !textarea.nextElementSibling.classList.contains('token-badge')) {
            A.Utils.addTokenCounter(textarea, null);
          }
        });
      };
      addSubtoneTokenCounters();
    }

    // Global Bindings
    listCol.querySelector('#btn-add-voice').onclick = () => {
      data.voices.push({
        enabled: true,
        characterName: 'New Voice',
        chatName: '',
        tag: 'V',
        attempt: { baseChance: 0.6 },
        subtones: []
      });
      currentVoiceIndex = data.voices.length - 1;
      refreshList();
      renderEditor();
      A.State.notify();
    };

    listCol.querySelector('#chk-debug').onchange = (e) => {
      data.debug = e.target.checked;
      A.State.notify();
      syncScript();
    };

    // View Script button - navigates to Scripts panel and selects the generated script
    listCol.querySelector('#btn-view-script').onclick = () => {
      syncScript(); // Ensure script is up-to-date
      A.State.notify();
      if (A.UI && A.UI.switchPanel) {
        A.UI.switchPanel('scripts', { selectScript: 'gen_voices' });
      }
    };

    refreshList();
    renderEditor();
  }

  A.registerPanel('voices', {
    label: 'Voices',
    subtitle: 'Runtime Injection',
    category: 'Weave',
    render: render
  });

})(window.Anansi);
