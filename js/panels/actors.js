/*
 * Anansi Panel: Actors (Rich Editor)
 * File: js/panels/actors.js
 * Category: Weave
 */

(function (A) {
    'use strict';

    let currentId = null;
    let activeTab = 'profile'; // profile, appearance, cues
    let searchTerm = ''; // Search Filter

    // --- Constants ---
    // AURA Tag Systems (aligned with AURA Black Magic Edition)
    const PULSE_TAGS = ['joy', 'sadness', 'anger', 'fear', 'romance', 'neutral', 'confusion', 'positive', 'negative'];
    const EROS_TAGS = ['platonic', 'tension', 'romance', 'physical', 'passion', 'explicit', 'conflict', 'aftercare'];
    const INTENT_TAGS = ['question', 'disclosure', 'command', 'promise', 'conflict', 'smalltalk', 'meta', 'narrative'];
    const PARTS = ['ears', 'tail', 'wings', 'horns'];

    // --- Voice Sync Helpers ---
    function syncActorToVoices(actorId, actorName) {
        const state = A.State.get();
        if (!state.weaves) state.weaves = {};
        if (!state.weaves.voices) state.weaves.voices = { voices: [], debug: false, enabled: true };

        // Check if voice already exists for this actor
        const existingIndex = state.weaves.voices.voices.findIndex(v => v.actorId === actorId);

        if (existingIndex === -1) {
            // Create new voice entry
            state.weaves.voices.voices.push({
                actorId: actorId,
                enabled: true,
                characterName: actorName || 'New Actor',
                chatName: '', // User fills this in
                tag: 'V',
                attempt: { baseChance: 0.6 },
                subtones: []
            });
        } else {
            // Update existing voice name
            state.weaves.voices.voices[existingIndex].characterName = actorName;
        }
    }

    function removeActorFromVoices(actorId) {
        const state = A.State.get();
        if (!state.weaves?.voices?.voices) return;

        const idx = state.weaves.voices.voices.findIndex(v => v.actorId === actorId);
        if (idx !== -1) {
            state.weaves.voices.voices.splice(idx, 1);
        }
    }

    function render(container, context) {
        const state = A.State.get();
        container.style.height = '100%';
        container.style.display = 'grid';
        container.style.gridTemplateColumns = '250px 1fr';
        container.style.gap = 'var(--space-4)';
        container.style.overflow = 'hidden';

        // 1. List Col
        const listCol = document.createElement('div');
        listCol.className = 'card';
        listCol.style.display = 'flex';
        listCol.style.flexDirection = 'column';
        listCol.style.height = '100%';
        listCol.style.marginBottom = '0';

        listCol.innerHTML = `
      <div class="card-header" style="flex-wrap:wrap; gap:8px;">
        <strong style="flex:1;">Actors</strong>
        <button class="btn btn-secondary btn-sm" id="btn-add-actor">+ New</button>
        <input class="input" id="search-actors" placeholder="Search..." style="width:100%; font-size:12px; height:28px;" value="${searchTerm}">
      </div>
      <div class="card-body" id="actor-list" style="padding:0; flex:1; overflow-y:auto;"></div>
    `;

        // ... [Rest of layout identical] ...

        // 2. Editor Col
        const editorCol = document.createElement('div');
        editorCol.className = 'card';
        editorCol.style.display = 'flex';
        editorCol.style.flexDirection = 'column';
        editorCol.style.height = '100%';
        editorCol.style.marginBottom = '0';
        editorCol.style.padding = '0'; // Custom padding management

        // Editor Header
        const header = document.createElement('div');
        header.className = 'card-header';
        header.innerHTML = `
      <input type="text" id="actor-name" class="input" style="width:200px; font-weight:bold;" placeholder="Actor Name" disabled>
      <div style="flex:1;"></div>
      <button class="btn btn-ghost btn-sm" id="btn-del-actor" style="color:var(--status-error);" disabled>Delete</button>
    `;

        // Tabs (removed Voice tab)
        const tabs = document.createElement('div');
        tabs.style.display = 'flex';
        tabs.style.borderBottom = '1px solid var(--border-subtle)';
        tabs.style.background = 'var(--bg-elevated)';
        tabs.innerHTML = `
      <div class="tab-btn active" data-tab="profile">Profile</div>
      <div class="tab-btn" data-tab="appearance">Appearance</div>
      <div class="tab-btn" data-tab="cues">Cues</div>
    `;

        // Tab Styles (apply immediately so tabs look styled before any actor is selected)
        const tabStyle = document.createElement('style');
        tabStyle.textContent = `
          .tab-btn { padding: 8px 16px; cursor: pointer; font-size: 12px; font-weight: 500; color: var(--text-secondary); border-bottom: 2px solid transparent; transition: color 0.1s, border-color 0.1s; }
          .tab-btn:hover { color: var(--text-primary); }
          .tab-btn.active { color: var(--accent-primary); border-bottom-color: var(--accent-primary); }
        `;
        tabs.appendChild(tabStyle);

        // Tab Content Area
        const content = document.createElement('div');
        content.className = 'card-body';
        content.style.flex = '1';
        content.style.overflowY = 'auto';
        content.id = 'actor-content';

        editorCol.appendChild(header);
        editorCol.appendChild(tabs);
        editorCol.appendChild(content);

        container.appendChild(listCol);
        container.appendChild(editorCol);

        // --- Logic ---
        const listBody = listCol.querySelector('#actor-list');
        const nameInput = header.querySelector('#actor-name');
        const delBtn = header.querySelector('#btn-del-actor');
        const searchInput = listCol.querySelector('#search-actors');
        const addBtn = listCol.querySelector('#btn-add-actor');

        // Handle Context
        if (context && context.createNew) {
            // Defer slightly to ensure DOM is ready if needed, though usually sync is fine
            setTimeout(() => addBtn.click(), 50);
        }

        searchInput.oninput = (e) => {
            searchTerm = e.target.value.toLowerCase();
            refreshList();
        };

        function refreshList() {
            const state = A.State.get();
            if (!state) return;

            // Ensure actors node exists
            if (!state.nodes) state.nodes = {};
            if (!state.nodes.actors) state.nodes.actors = { items: {} };
            if (!state.nodes.actors.items) state.nodes.actors.items = {};

            let actors = Object.values(state.nodes.actors.items);

            // Filter
            if (searchTerm) {
                actors = actors.filter(a => (a.name || '').toLowerCase().includes(searchTerm));
            }

            listBody.innerHTML = '';

            if (actors.length === 0) {
                listBody.innerHTML = `<div style="padding:16px; text-align:center; color:gray;">${searchTerm ? 'No matches.' : 'No actors.'}</div>`;
                return;
            }

            actors.forEach(actor => {
                const item = document.createElement('div');
                item.style.padding = '8px 12px';
                item.style.borderBottom = '1px solid var(--border-subtle)';
                item.style.cursor = 'pointer';
                item.style.fontSize = '13px';

                if (actor.id === currentId) {
                    item.style.backgroundColor = 'var(--bg-surface)';
                    item.style.borderLeft = '3px solid var(--accent-primary)';
                }

                item.innerHTML = `<strong>${actor.name || 'Unnamed'}</strong>`;
                item.onclick = () => selectActor(actor.id);
                listBody.appendChild(item);
            });
        }

        function selectActor(id) {
            currentId = id;
            refreshList();

            const state = A.State.get();
            const actor = state.nodes.actors.items[id];

            if (actor) {
                nameInput.disabled = false;
                delBtn.disabled = false;
                nameInput.value = actor.name || '';
                renderTab();
            } else {
                nameInput.disabled = true;
                nameInput.value = '';
                delBtn.disabled = true;
                content.innerHTML = '<div style="padding:40px; text-align:center; color:gray; font-size:14px;">Select or Create an Actor</div>';
            }
        }

        // --- Tab Rendering ---
        function renderTab() {
            const state = A.State.get();
            const actor = state.nodes.actors.items[currentId];
            if (!actor) return;

            // Init traits if missing
            actor.traits = actor.traits || {};
            const T = actor.traits;

            content.innerHTML = '';

            // Update Tab Buttons
            tabs.querySelectorAll('.tab-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.tab === activeTab);
                btn.onclick = () => {
                    activeTab = btn.dataset.tab;
                    renderTab();
                };
            });

            // Styles
            const style = document.createElement('style');
            style.textContent = `
        .tab-btn { padding: 8px 16px; cursor: pointer; font-size: 12px; font-weight: 500; color: var(--text-secondary); border-bottom: 2px solid transparent; }
        .tab-btn:hover { color: var(--text-primary); }
        .tab-btn.active { color: var(--accent-primary); border-bottom-color: var(--accent-primary); }
        .form-row { display: flex; gap: 12px; margin-bottom: 12px; }
        .form-col { flex: 1; display: flex; flex-direction: column; }
        .field-label { font-size: 11px; font-weight: bold; color: var(--text-muted); margin-bottom: 4px; text-transform: uppercase; }
        .cue-grid { display: grid; grid-template-columns: 80px repeat(5, 1fr); gap: 8px; align-items: center; }
        .cue-header { font-weight: bold; font-size: 11px; text-align: center; color: var(--text-muted); }
      `;
            content.appendChild(style);

            if (activeTab === 'profile') {
                // ID display
                const idRow = `<div style="font-size:11px; color:gray; margin-bottom:12px;">ID: ${actor.id}</div>`;

                // Container for Smart Inputs
                const smartContainer = document.createElement('div');

                // Gender (for AURA pronoun resolution)
                actor.gender = actor.gender || 'N';
                const genderWrap = document.createElement('div');
                genderWrap.className = 'form-col';
                genderWrap.style.marginBottom = '12px';
                genderWrap.innerHTML = `
                    <label class="field-label">Gender & Pronouns</label>
                    <select class="input" id="sel-gender" style="width:150px;">
                        <option value="M" ${actor.gender === 'M' ? 'selected' : ''}>Male (he/him)</option>
                        <option value="F" ${actor.gender === 'F' ? 'selected' : ''}>Female (she/her)</option>
                        <option value="N" ${actor.gender === 'N' ? 'selected' : ''}>Neutral (they/them)</option>
                    </select>
                `;
                smartContainer.appendChild(genderWrap);

                // Aliases (for AURA entity detection)
                actor.aliases = actor.aliases || [];
                const aliasesWrap = document.createElement('div');
                aliasesWrap.className = 'form-col';
                aliasesWrap.style.marginBottom = '12px';
                new A.UI.Components.TagInput(aliasesWrap, actor.aliases, {
                    label: 'Aliases (Nicknames, Titles)',
                    placeholder: '+ alias',
                    bg: 'var(--accent-secondary)',
                    color: 'var(--text-primary)',
                    onChange: (aliases) => { actor.aliases = aliases; A.State.notify(); }
                });
                smartContainer.appendChild(aliasesWrap);

                // Tags
                const tagsWrap = document.createElement('div');
                tagsWrap.className = 'form-col';
                new A.UI.Components.TagInput(tagsWrap, actor.tags || [], {
                    label: 'Tags',
                    onChange: (tags) => { actor.tags = tags; A.State.notify(); }
                });

                smartContainer.appendChild(tagsWrap);


                // Quirks (moved from Voice tab)
                T.quirks = T.quirks || { physical: [], mental: [], emotional: [] };

                const quirksHeader = document.createElement('h3');
                quirksHeader.style.marginTop = '20px';
                quirksHeader.style.fontSize = '13px';
                quirksHeader.style.color = 'var(--text-primary)';
                quirksHeader.textContent = 'Quirks';
                smartContainer.appendChild(quirksHeader);

                ['physical', 'mental', 'emotional'].forEach(kind => {
                    const qWrap = document.createElement('div');
                    qWrap.className = 'form-col';
                    qWrap.style.marginBottom = '12px';
                    new A.UI.Components.TagInput(qWrap, T.quirks[kind] || [], {
                        label: `${kind} Quirks`,
                        placeholder: '+ quirk',
                        bg: 'var(--bg-surface)',
                        color: 'var(--text-secondary)',
                        onChange: (tags) => { T.quirks[kind] = tags; A.State.notify(); }
                    });
                    smartContainer.appendChild(qWrap);
                });

                // Notes (replaced JSON preview)
                actor.notes = actor.notes || '';
                const notesSection = document.createElement('div');
                notesSection.innerHTML = `
                  <h3 style="margin-top:20px; font-size:13px; color:var(--text-primary);">Notes</h3>
                  <div class="form-col">
                    <textarea class="input" id="inp-notes" style="height:150px; resize:vertical;" placeholder="Personal notes about this actor...">${actor.notes}</textarea>
                  </div>
                `;
                smartContainer.appendChild(notesSection);

                content.innerHTML = idRow;
                content.appendChild(smartContainer);

                // Notes Binding
                content.querySelector('#inp-notes').onchange = (e) => {
                    actor.notes = e.target.value;
                    A.State.notify();
                    if (A.UI.Toast) A.UI.Toast.show('Notes saved', 'info');
                };

                // Gender Binding
                content.querySelector('#sel-gender').onchange = (e) => {
                    actor.gender = e.target.value;
                    A.State.notify();
                    if (A.UI.Toast) A.UI.Toast.show('Gender updated', 'info');
                };

            } else if (activeTab === 'appearance') {
                T.appearance = T.appearance || {};
                const app = T.appearance;

                const basicFields = `
          <div class="form-row">
            <div class="form-col"><label class="field-label">Hair</label><input class="input" id="app-hair" value="${app.hair || ''}"></div>
            <div class="form-col"><label class="field-label">Eyes</label><input class="input" id="app-eyes" value="${app.eyes || ''}"></div>
          </div>
          <div class="form-row">
            <div class="form-col"><label class="field-label">Build</label><input class="input" id="app-build" value="${app.build || ''}"></div>
          </div>
        `;

                // Description field (new)
                app.description = app.description || '';
                const descField = `
          <div class="form-col" style="margin-top:12px; margin-bottom:16px;">
            <label class="field-label">Description (open notes)</label>
            <textarea class="input" id="app-desc" style="height:80px; resize:vertical;" placeholder="Additional appearance details...">${app.description}</textarea>
          </div>
        `;

                // Appendages
                app.appendages = app.appendages || {};
                const parts = PARTS.map(p => {
                    const dat = app.appendages[p] || {};
                    return `
            <div class="form-row" style="align-items:center; border:1px solid var(--border-subtle); padding:8px; border-radius:4px;">
               <div style="width:80px; font-weight:bold; text-transform:capitalize;">${p}</div>
               <label style="font-size:12px; display:flex; align-items:center; gap:4px; margin-right:12px;">
                 <input type="checkbox" id="app-${p}-present" ${dat.present ? 'checked' : ''}> Present
               </label>
               <input class="input" style="flex:1;" id="app-${p}-style" placeholder="Style/Description" value="${dat.style || ''}" ${!dat.present ? 'disabled' : ''}>
            </div>
          `;
                }).join('');

                content.innerHTML += `<h3>Basic</h3>${basicFields}${descField}<h3>Appendages</h3>${parts}`;

                // Bindings
                content.querySelector('#app-hair').onchange = e => { app.hair = e.target.value; A.State.notify(); if (A.UI.Toast) A.UI.Toast.show('Saved', 'info'); };
                content.querySelector('#app-eyes').onchange = e => { app.eyes = e.target.value; A.State.notify(); if (A.UI.Toast) A.UI.Toast.show('Saved', 'info'); };
                content.querySelector('#app-build').onchange = e => { app.build = e.target.value; A.State.notify(); if (A.UI.Toast) A.UI.Toast.show('Saved', 'info'); };
                content.querySelector('#app-desc').onchange = e => { app.description = e.target.value; A.State.notify(); if (A.UI.Toast) A.UI.Toast.show('Saved', 'info'); };

                PARTS.forEach(p => {
                    content.querySelector(`#app-${p}-present`).onchange = e => {
                        app.appendages[p] = app.appendages[p] || {};
                        app.appendages[p].present = e.target.checked;
                        A.State.notify();
                        renderTab(); // Re-render to toggle disable state
                    };
                    content.querySelector(`#app-${p}-style`).onchange = e => {
                        app.appendages[p] = app.appendages[p] || {};
                        app.appendages[p].style = e.target.value;
                        A.State.notify(); // No toast for style tweaks to avoid spam, or add one if desired.
                    };
                });


            } else if (activeTab === 'cues') {
                // Initialize new cue structures
                T.pulseCues = T.pulseCues || {};
                T.erosCues = T.erosCues || {};
                T.intentCues = T.intentCues || {};

                // Helper to build a cue grid section
                const buildCueSection = (sectionId, title, subtitle, tags, cueData, colorAccent, presetListFn) => {
                    // Get preset options
                    const presets = (A.Presets && presetListFn) ? presetListFn() : [];
                    const presetOptions = presets.map(p => `<option value="${p.id}">${p.label}</option>`).join('');

                    let html = `
                    <div class="cue-section" data-section="${sectionId}" style="margin-bottom:16px; border:1px solid var(--border-subtle); border-radius:6px; overflow:hidden;">
                        <div class="cue-section-header" style="display:flex; justify-content:space-between; align-items:center; padding:10px 12px; background:var(--bg-elevated); cursor:pointer; border-bottom:1px solid var(--border-subtle);">
                            <div style="display:flex; align-items:center; gap:8px;">
                                <strong style="color:${colorAccent};">${title}</strong>
                                <span style="font-size:11px; color:var(--text-muted);">${subtitle}</span>
                            </div>
                            <div style="display:flex; align-items:center; gap:8px;" onclick="event.stopPropagation();">
                                <select class="input preset-select" data-section="${sectionId}" style="font-size:10px; padding:2px 6px; width:auto; min-width:80px;">
                                    <option value="">Preset...</option>
                                    ${presetOptions}
                                </select>
                                <button class="btn btn-ghost btn-sm preset-apply" data-section="${sectionId}" style="font-size:10px; padding:2px 8px;">Apply</button>
                                <button class="btn btn-ghost btn-sm preset-clear" data-section="${sectionId}" style="font-size:10px; padding:2px 8px; color:var(--text-muted);">Clear</button>
                                <span class="cue-toggle" style="font-size:14px; color:var(--text-muted); margin-left:4px;">▼</span>
                            </div>
                        </div>
                        <div class="cue-section-body" style="padding:12px;">
                            <div class="cue-grid" style="display:grid; grid-template-columns:90px repeat(5, 1fr); gap:6px; align-items:center; margin-bottom:8px;">
                                <div></div>
                                <div class="cue-header" style="font-weight:bold; font-size:10px; text-align:center; color:var(--text-muted);">BASIC</div>
                                <div class="cue-header" style="font-weight:bold; font-size:10px; text-align:center; color:var(--text-muted);">EARS</div>
                                <div class="cue-header" style="font-weight:bold; font-size:10px; text-align:center; color:var(--text-muted);">TAIL</div>
                                <div class="cue-header" style="font-weight:bold; font-size:10px; text-align:center; color:var(--text-muted);">WINGS</div>
                                <div class="cue-header" style="font-weight:bold; font-size:10px; text-align:center; color:var(--text-muted);">HORNS</div>
                            </div>`;

                    tags.forEach(tag => {
                        const cue = cueData[tag] || {};
                        html += `
                            <div class="cue-grid" style="display:grid; grid-template-columns:90px repeat(5, 1fr); gap:6px; align-items:center; margin-bottom:4px;">
                                <div style="font-size:11px; font-weight:600; text-transform:uppercase; color:${colorAccent};">${tag}</div>
                                <input class="input cue-input" data-section="${sectionId}" data-tag="${tag}" data-part="basic" value="${cue.basic || ''}" style="font-size:11px; padding:4px 6px;">
                                <input class="input cue-input" data-section="${sectionId}" data-tag="${tag}" data-part="ears" value="${cue.ears || ''}" style="font-size:11px; padding:4px 6px;">
                                <input class="input cue-input" data-section="${sectionId}" data-tag="${tag}" data-part="tail" value="${cue.tail || ''}" style="font-size:11px; padding:4px 6px;">
                                <input class="input cue-input" data-section="${sectionId}" data-tag="${tag}" data-part="wings" value="${cue.wings || ''}" style="font-size:11px; padding:4px 6px;">
                                <input class="input cue-input" data-section="${sectionId}" data-tag="${tag}" data-part="horns" value="${cue.horns || ''}" style="font-size:11px; padding:4px 6px;">
                            </div>`;
                    });

                    html += `</div></div>`;
                    return html;
                };

                // Build all three sections with their respective preset lists
                let cuesHTML = '';
                cuesHTML += buildCueSection('pulse', 'PULSE Cues', 'Emotional Expression', PULSE_TAGS, T.pulseCues, 'var(--status-info)', A.Presets?.getPulsePresetList);
                cuesHTML += buildCueSection('eros', 'EROS Cues', 'Intimacy Response', EROS_TAGS, T.erosCues, 'var(--status-error)', A.Presets?.getErosPresetList);
                cuesHTML += buildCueSection('intent', 'INTENT Cues', 'Behavioral Response', INTENT_TAGS, T.intentCues, 'var(--status-success)', A.Presets?.getIntentPresetList);

                content.innerHTML = cuesHTML;

                // Accordion toggle behavior (only on the toggle icon, not the whole header now)
                content.querySelectorAll('.cue-toggle').forEach(toggle => {
                    toggle.onclick = (e) => {
                        e.stopPropagation();
                        const section = toggle.closest('.cue-section');
                        const body = section.querySelector('.cue-section-body');
                        const isCollapsed = body.style.display === 'none';
                        body.style.display = isCollapsed ? 'block' : 'none';
                        toggle.textContent = isCollapsed ? '▼' : '▶';
                    };
                });

                // Preset Apply buttons
                content.querySelectorAll('.preset-apply').forEach(btn => {
                    btn.onclick = (e) => {
                        e.stopPropagation();
                        const sectionId = btn.dataset.section;
                        const select = content.querySelector(`.preset-select[data-section="${sectionId}"]`);
                        const presetId = select?.value;

                        if (!presetId) {
                            if (A.UI.Toast) A.UI.Toast.show('Select a preset first', 'warning');
                            return;
                        }

                        // Get the preset data
                        let presetData, targetCues;
                        if (sectionId === 'pulse' && A.Presets?.Pulse?.[presetId]) {
                            presetData = A.Presets.Pulse[presetId].cues;
                            targetCues = T.pulseCues;
                        } else if (sectionId === 'eros' && A.Presets?.Eros?.[presetId]) {
                            presetData = A.Presets.Eros[presetId].cues;
                            targetCues = T.erosCues;
                        } else if (sectionId === 'intent' && A.Presets?.Intent?.[presetId]) {
                            presetData = A.Presets.Intent[presetId].cues;
                            targetCues = T.intentCues;
                        }

                        if (!presetData) {
                            if (A.UI.Toast) A.UI.Toast.show('Preset not found', 'error');
                            return;
                        }

                        // Apply preset data to cues
                        Object.keys(presetData).forEach(tag => {
                            targetCues[tag] = { ...presetData[tag] };
                        });

                        A.State.notify();
                        renderTab(); // Re-render to show new values
                        if (A.UI.Toast) A.UI.Toast.show(`Applied "${presetId}" preset`, 'success');
                    };
                });

                // Clear buttons
                content.querySelectorAll('.preset-clear').forEach(btn => {
                    btn.onclick = (e) => {
                        e.stopPropagation();
                        const sectionId = btn.dataset.section;

                        // Clear the appropriate cue object
                        if (sectionId === 'pulse') {
                            T.pulseCues = {};
                        } else if (sectionId === 'eros') {
                            T.erosCues = {};
                        } else if (sectionId === 'intent') {
                            T.intentCues = {};
                        }

                        A.State.notify();
                        renderTab();
                        if (A.UI.Toast) A.UI.Toast.show(`Cleared ${sectionId.toUpperCase()} cues`, 'info');
                    };
                });

                // Input bindings
                content.querySelectorAll('.cue-input').forEach(el => {
                    el.oninput = e => {
                        const section = el.dataset.section;
                        const tag = el.dataset.tag;
                        const part = el.dataset.part;
                        const val = e.target.value;

                        // Get the right cue object
                        let cueObj;
                        if (section === 'pulse') cueObj = T.pulseCues;
                        else if (section === 'eros') cueObj = T.erosCues;
                        else cueObj = T.intentCues;

                        if (!cueObj[tag]) cueObj[tag] = {};
                        cueObj[tag][part] = val;
                        A.State.notify();

                        // Update token counters for this section
                        updateCueTokenCounter(section);
                    };
                });

                // Helper to calculate and display total tokens for a cue section
                const updateCueTokenCounter = (sectionId) => {
                    let cueObj;
                    if (sectionId === 'pulse') cueObj = T.pulseCues;
                    else if (sectionId === 'eros') cueObj = T.erosCues;
                    else cueObj = T.intentCues;

                    // Calculate total tokens from all cue inputs
                    let totalText = '';
                    Object.values(cueObj || {}).forEach(cue => {
                        ['basic', 'ears', 'tail', 'wings', 'horns'].forEach(part => {
                            if (cue[part]) totalText += cue[part] + ' ';
                        });
                    });

                    const tokens = A.Utils.estimateTokens(totalText);
                    const section = content.querySelector(`.cue-section[data-section="${sectionId}"]`);
                    if (section) {
                        let badge = section.querySelector('.cue-token-badge');
                        if (!badge) {
                            badge = document.createElement('span');
                            badge.className = 'cue-token-badge token-badge';
                            badge.style.marginLeft = '8px';
                            const header = section.querySelector('.cue-section-header strong');
                            if (header) header.parentNode.appendChild(badge);
                        }
                        badge.textContent = `${tokens} tkn`;
                        if (tokens > 500) badge.style.color = 'var(--status-warning)';
                        else if (tokens > 1000) badge.style.color = 'var(--status-error)';
                        else badge.style.color = 'var(--text-muted)';
                    }
                };

                // Initial token count display for all sections
                updateCueTokenCounter('pulse');
                updateCueTokenCounter('eros');
                updateCueTokenCounter('intent');
            }

            // Add token counter for appearance description
            if (currentTab === 'appearance') {
                const appDesc = content.querySelector('#app-desc');
                if (appDesc) {
                    const label = appDesc.previousElementSibling;
                    if (label) {
                        A.Utils.addTokenCounter(appDesc, label);
                    }
                }
            }
        }


        // Events
        listCol.querySelector('#btn-add-actor').onclick = () => {
            const state = A.State.get();
            // Ensure node
            if (!state.nodes) state.nodes = {};
            if (!state.nodes.actors) state.nodes.actors = { items: {} };
            if (!state.nodes.actors.items) state.nodes.actors.items = {};

            const id = 'actor_' + Math.random().toString(36).substr(2, 9);
            const actorName = 'New Actor';
            state.nodes.actors.items[id] = {
                id: id,
                name: actorName,
                traits: {},
                tags: [],
                notes: ''
            };

            // Auto-create voice entry
            syncActorToVoices(id, actorName);

            A.State.notify();
            if (A.UI.Toast) A.UI.Toast.show('New Actor created', 'success');
            selectActor(id);
        };

        delBtn.onclick = () => {
            if (confirm('Delete actor?')) {
                const state = A.State.get();

                // Remove actor from items
                delete state.nodes.actors.items[currentId];

                // Remove from Voices panel
                removeActorFromVoices(currentId);

                currentId = null;
                A.State.notify();
                if (A.UI.Toast) A.UI.Toast.show('Actor deleted', 'info');
                refreshList();
                selectActor(null);
            }
        };

        nameInput.oninput = (e) => {
            const state = A.State.get();
            if (state.nodes.actors.items[currentId]) {
                const newName = e.target.value;
                state.nodes.actors.items[currentId].name = newName;

                // Sync name to Voices panel
                syncActorToVoices(currentId, newName);

                A.State.notify();
                refreshList(); // Update sidebar name
                // Keep focus
                nameInput.focus();
            }
        };

        // Auto-save feedback not typically needed on input, but let's add a "Saved" toast on implicit or explicit save if we had a button.
        // For now, let's just ensure manual actions feel good.
        // Actually, let's add a 'Flash' effect to the sidebar item on change? No, toast is for discrete actions.
        // Actors is auto-save.


        refreshList();
        // Show empty state initially
        // Show empty state initially if list is empty, otherwise standard select prompt
        if (!currentId) {
            const hasActors = Object.keys(state.nodes?.actors?.items || {}).length > 0;
            if (!hasActors) {
                content.innerHTML = A.UI.getEmptyStateHTML(
                    'No Actors Found',
                    'Create your first actor to begin building your cast.',
                    'Create New Actor',
                    "document.getElementById('btn-add-actor').click()"
                );
            } else {
                // Select prompt
                content.innerHTML = `
                    <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; color:var(--text-muted); opacity:0.7;">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom:16px;">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                        <div style="margin-bottom:16px;">Select an Actor to edit</div>
                        <button class="btn btn-secondary" onclick="document.getElementById('btn-add-actor').click()">Create New Actor</button>
                    </div>
                `;
            }
        }
    }

    A.registerPanel('actors', {
        label: 'Actors',
        subtitle: 'Nodes',
        category: 'Seeds',
        render: render
    });

})(window.Anansi);

