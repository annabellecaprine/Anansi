/*
 * Anansi Plugin: Actors Tabs
 * File: js/plugins/actors/actors-tabs.js
 * Purpose: Handles rendering of Profile, Appearance, and Cues tabs for Actors
 */

(function (A) {
    'use strict';

    A.Actors = A.Actors || {};
    A.Actors.Tabs = {};

    // --- Constants ---
    const PARTS = ['ears', 'tail', 'wings', 'horns'];
    const PULSE_TAGS = ['joy', 'sadness', 'anger', 'fear', 'romance', 'neutral', 'confusion', 'positive', 'negative'];
    const EROS_TAGS = ['platonic', 'tension', 'romance', 'physical', 'passion', 'explicit', 'conflict', 'aftercare'];
    const INTENT_TAGS = ['question', 'disclosure', 'command', 'promise', 'conflict', 'smalltalk', 'meta', 'narrative'];
    const AURA_TAGS = [
        'JOY', 'SADNESS', 'ANGER', 'FEAR', 'DISGUST', 'SURPRISE',
        'TRUST', 'ANTICIPATION', 'LOVE', 'AWE', 'CONTEMPT', 'OPTIMISM',
        'QUESTION', 'COMMAND', 'STATEMENT', 'GREETING', 'FAREWELL',
        'ROMANCE', 'TENSION', 'CONFLICT', 'NARRATIVE', 'DISCLOSURE'
    ];

    function escapeForTextarea(str) {
        if (!str) return '';
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    // ==========================================
    // MAIN RENDER ENTRY
    // ==========================================
    A.Actors.Tabs.render = function (container, actor, activeTab) {
        if (!container || !actor) return;
        container.innerHTML = '';

        // Add common styles
        const style = document.createElement('style');
        style.textContent = `
            .form-row { display: flex; gap: 12px; margin-bottom: 12px; }
            .form-col { flex: 1; display: flex; flex-direction: column; }
            .field-label { font-size: 11px; font-weight: bold; color: var(--text-muted); margin-bottom: 4px; text-transform: uppercase; }
            .cue-grid { display: grid; grid-template-columns: 80px repeat(5, 1fr); gap: 8px; align-items: center; }
            .cue-header { font-weight: bold; font-size: 11px; text-align: center; color: var(--text-muted); }
        `;
        container.appendChild(style);

        if (activeTab === 'profile') {
            renderProfile(container, actor);
        } else if (activeTab === 'appearance') {
            renderAppearance(container, actor);
        } else if (activeTab === 'cues') {
            renderCues(container, actor);
        }
    };

    // ==========================================
    // PROFILE TAB
    // ==========================================
    function renderProfile(container, actor) {
        // Init traits if missing
        actor.traits = actor.traits || {};
        const T = actor.traits;

        // Migrate legacy portrait to gallery
        if (actor.portrait && !actor.gallery) {
            actor.gallery = {
                primary: 'migrated_0',
                showNsfw: false,
                images: [{
                    id: 'migrated_0',
                    folder: 'sfw',
                    data: actor.portrait.data,
                    mimeType: actor.portrait.mimeType || 'image/png',
                    caption: '',
                    timestamp: Date.now()
                }]
            };
            actor.portrait = null; // Clear legacy
            A.State.notify();
        }

        // ID display
        const idRow = `<div style="font-size:11px; color:gray; margin-bottom:12px;">ID: ${actor.id}</div>`;
        const idDiv = document.createElement('div');
        idDiv.innerHTML = idRow;
        container.appendChild(idDiv);

        // Render Gallery (Delegate to Plugin)
        const galleryCard = document.createElement('div');
        galleryCard.style.cssText = 'margin-bottom: 16px; padding: 12px; background: var(--bg-inset); border-radius: var(--radius-md);';
        container.appendChild(galleryCard);

        if (A.Actors.Gallery && A.Actors.Gallery.renderCard) {
            A.Actors.Gallery.renderCard(galleryCard, actor);
        } else {
            galleryCard.innerHTML = '<div style="color:red">Gallery Plugin missing</div>';
        }

        // Container for Smart Inputs
        const smartContainer = document.createElement('div');

        // Gender & Pronouns (Split)
        actor.gender = actor.gender || 'N';
        actor.pronouns = actor.pronouns || '';

        const isCustomGender = !['M', 'F', 'N'].includes(actor.gender);
        const standardPronouns = ['he/him', 'she/her', 'they/them'];
        const isCustomPronouns = actor.pronouns && !standardPronouns.includes(actor.pronouns);

        const identityWrap = document.createElement('div');
        identityWrap.className = 'form-col';
        identityWrap.style.marginBottom = '12px';
        identityWrap.innerHTML = `
            <label class="field-label">Gender & Pronouns</label>
            <div style="display:flex; gap:12px; align-items:center;">
                <select class="input" id="sel-gender" style="width:120px;">
                    <option value="M" ${actor.gender === 'M' ? 'selected' : ''}>Male</option>
                    <option value="F" ${actor.gender === 'F' ? 'selected' : ''}>Female</option>
                    <option value="N" ${actor.gender === 'N' ? 'selected' : ''}>Neutral</option>
                    <option value="C" ${isCustomGender ? 'selected' : ''}>Custom...</option>
                </select>
                <input class="input" id="inp-gender-custom" placeholder="Custom gender..." 
                       style="width:120px; display:${isCustomGender ? 'block' : 'none'};" 
                       value="${isCustomGender ? actor.gender : ''}">
                <select class="input" id="sel-pronouns" style="width:120px;">
                    <option value="he/him" ${actor.pronouns === 'he/him' ? 'selected' : ''}>he/him</option>
                    <option value="she/her" ${actor.pronouns === 'she/her' ? 'selected' : ''}>she/her</option>
                    <option value="they/them" ${!actor.pronouns || actor.pronouns === 'they/them' ? 'selected' : ''}>they/them</option>
                    <option value="C" ${isCustomPronouns ? 'selected' : ''}>Custom...</option>
                </select>
                <input class="input" id="inp-pronouns-custom" placeholder="Pronouns..."
                       style="flex: 1; display:${isCustomPronouns ? 'block' : 'none'};"
                       value="${isCustomPronouns ? actor.pronouns : ''}">
            </div>
        `;
        smartContainer.appendChild(identityWrap);

        // Aliases
        actor.aliases = actor.aliases || [];
        const aliasesWrap = document.createElement('div');
        aliasesWrap.className = 'form-col';
        aliasesWrap.style.marginBottom = '12px';
        if (A.UI.Components.TagInput) {
            new A.UI.Components.TagInput(aliasesWrap, actor.aliases, {
                label: 'Aliases (Nicknames, Titles)',
                placeholder: '+ alias',
                bg: 'var(--accent-secondary)',
                color: 'var(--text-primary)',
                onChange: (aliases) => { actor.aliases = aliases; A.State.notify(); }
            });
        }
        smartContainer.appendChild(aliasesWrap);

        // AURA Tags
        const tagsWrap = document.createElement('div');
        tagsWrap.className = 'form-col';
        if (A.UI.Components.TagInput) {
            new A.UI.Components.TagInput(tagsWrap, actor.tags || [], {
                label: 'AURA Tags (Logic Triggers)',
                placeholder: '+ aura tag (e.g. demon, noble)',
                onChange: (tags) => { actor.tags = tags; A.State.notify(); }
            });
        }
        smartContainer.appendChild(tagsWrap);

        // Quirks System
        renderQuirks(smartContainer, actor);

        // Card Export Fields
        renderCardFields(smartContainer, actor);

        // Notes
        actor.notes = actor.notes || '';
        const notesSection = document.createElement('div');
        notesSection.innerHTML = `
            <h3 style="margin-top:20px; font-size:13px; color:var(--text-primary);">Notes</h3>
            <div class="form-col">
            <textarea class="input" id="inp-notes" style="height:150px; resize:vertical;" placeholder="Internal notes (not exported). E.g., 'Main love interest' or 'Acts differently when angry'">${actor.notes}</textarea>
            </div>
        `;
        smartContainer.appendChild(notesSection);

        container.appendChild(smartContainer);

        // Bindings
        smartContainer.querySelector('#inp-notes').onchange = (e) => {
            actor.notes = e.target.value;
            A.State.notify();
            if (A.UI.Toast) A.UI.Toast.show('Notes saved', 'info');
        };

        // Gender Handlers
        smartContainer.querySelector('#sel-gender').onchange = (e) => {
            const val = e.target.value;
            const customInp = smartContainer.querySelector('#inp-gender-custom');
            if (val === 'C') {
                customInp.style.display = 'block';
                customInp.focus();
            } else {
                customInp.style.display = 'none';
                actor.gender = val;
                A.State.notify();
                if (A.UI.Toast) A.UI.Toast.show('Gender updated', 'info');
            }
        };

        smartContainer.querySelector('#inp-gender-custom').onchange = (e) => {
            actor.gender = e.target.value;
            A.State.notify();
            if (A.UI.Toast) A.UI.Toast.show('Gender updated', 'info');
        };

        // Pronouns Handlers
        smartContainer.querySelector('#sel-pronouns').onchange = (e) => {
            const val = e.target.value;
            const customInp = smartContainer.querySelector('#inp-pronouns-custom');
            if (val === 'C') {
                customInp.style.display = 'block';
                customInp.focus();
            } else {
                customInp.style.display = 'none';
                actor.pronouns = val;
                A.State.notify();
                if (A.UI.Toast) A.UI.Toast.show('Pronouns updated', 'info');
            }
        };

        smartContainer.querySelector('#inp-pronouns-custom').onchange = (e) => {
            actor.pronouns = e.target.value;
            A.State.notify();
            if (A.UI.Toast) A.UI.Toast.show('Pronouns updated', 'info');
        };
    }

    function renderQuirks(container, actor) {
        const T = actor.traits;
        // Migrate old format if needed
        if (A.QuirkEngine?.needsMigration?.(T.quirks)) {
            actor.quirks = A.QuirkEngine.migrateQuirks(T.quirks);
            delete T.quirks; // Remove old location
            A.State.notify();
        }

        // Ensure new format exists on actor root
        actor.quirks = actor.quirks || { activationChance: 20, physical: [], mental: [], emotional: [] };
        const quirks = actor.quirks;

        const quirksSection = document.createElement('div');
        quirksSection.style.marginTop = '20px';

        quirksSection.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                <h3 style="margin:0; font-size:13px; color:var(--text-primary);">Quirks</h3>
                <div style="display:flex; align-items:center; gap:8px;">
                    <label style="font-size:10px; color:var(--text-muted);">Activation:</label>
                    <input type="range" id="quirk-activation" min="0" max="100" value="${quirks.activationChance || 20}" style="width:80px;">
                    <span id="quirk-activation-val" style="font-size:10px; color:var(--text-secondary); width:30px;">${quirks.activationChance || 20}%</span>
                </div>
            </div>
            <div style="font-size:10px; color:var(--text-muted); margin-bottom:12px;">
                RNG-triggered behaviors tied to AURA scene tags. Use <code>{{name}}</code> and <code>{{pos}}</code> for pronouns.
            </div>
        `;

        const QUIRK_CATEGORIES = ['physical', 'mental', 'emotional'];

        QUIRK_CATEGORIES.forEach(cat => {
            const catDiv = document.createElement('div');
            catDiv.style.marginBottom = '16px';
            catDiv.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                    <label style="font-size:11px; font-weight:600; text-transform:capitalize; color:var(--text-secondary);">${cat}</label>
                    <button class="btn btn-ghost btn-sm quirk-add" data-cat="${cat}" style="font-size:10px; padding:2px 6px;">+ Add</button>
                </div>
                <div class="quirk-list" data-cat="${cat}" style="display:flex; flex-direction:column; gap:8px; margin-left:12px;"></div>
            `;
            quirksSection.appendChild(catDiv);

            const listEl = catDiv.querySelector('.quirk-list');

            const renderQuirkList = () => {
                listEl.innerHTML = '';
                const items = quirks[cat] || [];

                if (items.length === 0) {
                    listEl.innerHTML = `<div style="font-size:10px; color:var(--text-muted); font-style:italic; padding:8px; border:1px dashed var(--border-subtle); border-radius:4px;">No ${cat} quirks defined</div>`;
                    return;
                }

                items.forEach((q, idx) => {
                    const row = document.createElement('div');
                    row.style.cssText = 'border:1px solid var(--border-subtle); border-radius:6px; overflow:hidden; background:var(--bg-inset);';

                    const needsTagsFlag = q.needsTags ? `<span title="Add AURA tags to enable triggering" style="color:var(--status-warning); cursor:help; margin-right:4px;">⚠️</span>` : '';

                    row.innerHTML = `
                        <div style="display:flex; align-items:center; padding:6px 8px; gap:8px; border-bottom:1px solid var(--border-subtle);">
                            <input class="input quirk-text" data-idx="${idx}" value="${(q.text || '').replace(/"/g, '&quot;')}" 
                                    style="flex:1; font-size:11px; font-family:var(--font-mono); border:none; background:transparent;" placeholder="{{name}} does something...">
                            <button class="btn btn-ghost btn-sm quirk-remove" data-idx="${idx}" style="color:var(--status-error); padding:2px 6px; font-size:12px;">×</button>
                        </div>
                        <div style="display:flex; align-items:center; gap:4px; padding:4px 8px; background:var(--bg-elevated);">
                            ${needsTagsFlag}
                            ${(q.tags || []).map((t, ti) => `
                                <span class="tag-pill" style="font-size:9px; padding:2px 8px; background:var(--accent-primary); color:white; border-radius:10px; display:inline-flex; align-items:center; gap:4px; text-transform:uppercase; font-weight:600;">
                                    ${t}
                                    <span class="tag-remove" data-idx="${idx}" data-tidx="${ti}" style="cursor:pointer; opacity:0.7; font-size:10px;">×</span>
                                </span>
                            `).join('')}
                            ${(q.tags || []).length < 2 ? `
                                <select class="input quirk-tag-select" data-idx="${idx}" style="font-size:9px; padding:2px 4px; border:1px dashed var(--border-subtle); background:var(--bg-surface); min-width:80px;">
                                    <option value="">+ TAG</option>
                                    ${AURA_TAGS.filter(t => !(q.tags || []).includes(t)).map(t => `<option value="${t}">${t}</option>`).join('')}
                                </select>
                            ` : ''}
                        </div>
                    `;
                    listEl.appendChild(row);

                    // Text change
                    row.querySelector('.quirk-text').onchange = (e) => {
                        quirks[cat][idx].text = e.target.value;
                        if (quirks[cat][idx].needsTags) delete quirks[cat][idx].needsTags;
                        A.State.notify();
                    };

                    // Remove quirk
                    row.querySelector('.quirk-remove').onclick = () => {
                        quirks[cat].splice(idx, 1);
                        A.State.notify();
                        renderQuirkList();
                    };

                    // Remove tag
                    row.querySelectorAll('.tag-remove').forEach(btn => {
                        btn.onclick = (e) => {
                            e.stopPropagation();
                            const qIdx = parseInt(btn.dataset.idx);
                            const tIdx = parseInt(btn.dataset.tidx);
                            quirks[cat][qIdx].tags.splice(tIdx, 1);
                            A.State.notify();
                            renderQuirkList();
                        };
                    });

                    // Add tag via dropdown
                    const tagSelect = row.querySelector('.quirk-tag-select');
                    if (tagSelect) {
                        tagSelect.onchange = (e) => {
                            const val = e.target.value;
                            if (!val) return;
                            const qIdx = parseInt(tagSelect.dataset.idx);
                            if (!quirks[cat][qIdx].tags) quirks[cat][qIdx].tags = [];
                            if (quirks[cat][qIdx].tags.length < 2) {
                                quirks[cat][qIdx].tags.push(val);
                                if (quirks[cat][qIdx].needsTags) delete quirks[cat][qIdx].needsTags;
                                A.State.notify();
                                renderQuirkList();
                            }
                        };
                    }
                });
            };

            renderQuirkList();

            catDiv.querySelector('.quirk-add').onclick = () => {
                if (!quirks[cat]) quirks[cat] = [];
                quirks[cat].push({ text: `{{name}} `, tags: [] });
                A.State.notify();
                renderQuirkList();
                setTimeout(() => {
                    const inputs = listEl.querySelectorAll('.quirk-text');
                    if (inputs.length) inputs[inputs.length - 1].focus();
                }, 50);
            };
        });

        container.appendChild(quirksSection);

        const activationSlider = quirksSection.querySelector('#quirk-activation');
        const activationVal = quirksSection.querySelector('#quirk-activation-val');
        activationSlider.oninput = (e) => {
            const val = parseInt(e.target.value);
            activationVal.textContent = val + '%';
            quirks.activationChance = val;
            A.State.notify();
        };
    }

    function renderCardFields(container, actor) {
        actor.cardFields = actor.cardFields || {};
        const cf = actor.cardFields;

        const cardSection = document.createElement('div');
        cardSection.innerHTML = `
            <details style="margin-top:16px;">
                <summary style="font-size:13px; color:var(--text-primary); cursor:pointer; display:flex; align-items:center; gap:8px; padding:8px 0;">
                    📋 Character Card Fields
                </summary>
                <div style="padding-top:12px;">
                    <div class="form-col" style="margin-bottom:12px;">
                        <label class="field-label">Personality</label>
                        <textarea class="input" id="cf-personality" style="height:80px; resize:vertical;" placeholder="Brief personality summary (traits, demeanor, quirks)...">${escapeForTextarea(cf.personality || '')}</textarea>
                    </div>
                    <div class="form-col" style="margin-bottom:12px;">
                        <label class="field-label">Description</label>
                        <textarea class="input" id="cf-description" style="height:100px; resize:vertical;" placeholder="Full character description (background, appearance, motivations)...">${escapeForTextarea(cf.description || '')}</textarea>
                    </div>
                    <div class="form-col" style="margin-bottom:12px;">
                        <label class="field-label">Scenario</label>
                        <textarea class="input" id="cf-scenario" style="height:60px; resize:vertical;" placeholder="Context for this character (setting, current situation)...">${escapeForTextarea(cf.scenario || '')}</textarea>
                    </div>
                    <div class="form-col" style="margin-bottom:12px;">
                        <label class="field-label">First Message</label>
                        <textarea class="input" id="cf-firstmessage" style="height:80px; resize:vertical;" placeholder="Opening message when someone starts a chat with this character...">${escapeForTextarea(cf.firstMessage || '')}</textarea>
                    </div>
                    <div class="form-col" style="margin-bottom:12px;">
                        <label class="field-label">Example Dialogue</label>
                        <textarea class="input" id="cf-mes_example" style="height:120px; resize:vertical; font-family:var(--font-mono); font-size:11px;" placeholder="<START>\n{{char}}: Hello!\n{{user}}: Hi there.">${escapeForTextarea(cf.mes_example || '')}</textarea>
                    </div>
                </div>
            </details>
        `;
        container.appendChild(cardSection);

        function bindCardField(id, field) {
            const el = cardSection.querySelector('#' + id);
            if (el) {
                el.onchange = (e) => {
                    cf[field] = e.target.value;
                    A.State.notify();
                };
            }
        }
        bindCardField('cf-personality', 'personality');
        bindCardField('cf-description', 'description');
        bindCardField('cf-scenario', 'scenario');
        bindCardField('cf-firstmessage', 'firstMessage');
        bindCardField('cf-mes_example', 'mes_example'); // Restore missing field

        if (A.UI.Assistant) {
            A.UI.Assistant.attach(cardSection.querySelector('#cf-personality'), {
                label: 'Actor Personality',
                system: 'You are an expert character designer. Improve this personality summary.'
            });
            A.UI.Assistant.attach(cardSection.querySelector('#cf-description'), {
                label: 'Actor Description',
                system: 'You are an expert character designer. Improve this character description.'
            });
            A.UI.Assistant.attach(cardSection.querySelector('#cf-scenario'), {
                label: 'Actor Scenario',
                system: 'You are an expert scenario writer. Improve this character scenario.'
            });
            A.UI.Assistant.attach(cardSection.querySelector('#cf-firstmessage'), {
                label: 'Actor First Message',
                system: 'You are a roleplay character. Improve this first message.'
            });
        }
    }


    // ==========================================
    // APPEARANCE TAB
    // ==========================================
    function renderAppearance(container, actor) {
        actor.traits.appearance = actor.traits.appearance || {};
        const app = actor.traits.appearance;

        const basicFields = `
        <div class="form-row">
            <div class="form-col"><label class="field-label">Hair</label><input class="input" id="app-hair" value="${app.hair || ''}"></div>
            <div class="form-col"><label class="field-label">Eyes</label><input class="input" id="app-eyes" value="${app.eyes || ''}"></div>
        </div>
        <div class="form-row">
            <div class="form-col"><label class="field-label">Build</label><input class="input" id="app-build" value="${app.build || ''}"></div>
        </div>
        `;

        app.description = app.description || '';
        const descField = `
        <div class="form-col" style="margin-top:12px; margin-bottom:16px;">
            <label class="field-label">Description (open notes)</label>
            <textarea class="input" id="app-desc" style="height:80px; resize:vertical;" placeholder="Additional appearance details...">${app.description}</textarea>
        </div>
        `;

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

        const wrapper = document.createElement('div');
        wrapper.innerHTML = `<h3>Basic</h3>${basicFields}${descField}<h3>Appendages</h3>${parts}`;
        container.appendChild(wrapper);

        // Bindings
        wrapper.querySelector('#app-hair').onchange = e => { app.hair = e.target.value; A.State.notify(); if (A.UI.Toast) A.UI.Toast.show('Saved', 'info'); };
        wrapper.querySelector('#app-eyes').onchange = e => { app.eyes = e.target.value; A.State.notify(); if (A.UI.Toast) A.UI.Toast.show('Saved', 'info'); };
        wrapper.querySelector('#app-build').onchange = e => { app.build = e.target.value; A.State.notify(); if (A.UI.Toast) A.UI.Toast.show('Saved', 'info'); };
        wrapper.querySelector('#app-desc').onchange = e => { app.description = e.target.value; A.State.notify(); if (A.UI.Toast) A.UI.Toast.show('Saved', 'info'); };

        if (A.UI.Assistant) {
            A.UI.Assistant.attach(wrapper.querySelector('#app-desc'), {
                label: 'Appearance Description',
                system: 'You are a visual design expert. Describe this character\'s appearance in vivid detail.'
            });
        }

        PARTS.forEach(p => {
            wrapper.querySelector(`#app-${p}-present`).onchange = e => {
                app.appendages[p] = app.appendages[p] || {};
                app.appendages[p].present = e.target.checked;
                A.State.notify();
                // We re-render to toggle disabled state correctly
                A.Actors.Tabs.render(container, actor, 'appearance');
            };
            wrapper.querySelector(`#app-${p}-style`).onchange = e => {
                app.appendages[p] = app.appendages[p] || {};
                app.appendages[p].style = e.target.value;
                A.State.notify();
            };
        });
    }


    // ==========================================
    // CUES TAB
    // ==========================================
    function renderCues(container, actor) {
        const T = actor.traits;
        T.pulseCues = T.pulseCues || {};
        T.erosCues = T.erosCues || {};
        T.intentCues = T.intentCues || {};

        const buildCueSection = (sectionId, title, subtitle, tags, cueData, colorAccent, presetListFn) => {
            const presets = (A.Presets && presetListFn) ? presetListFn() : [];
            const presetOptions = presets.map(p => `<option value="${p.id}">${p.label}</option>`).join('');

            let html = `
            <div class="cue-section" data-section="${sectionId}" style="margin-bottom:16px; border:1px solid var(--border-subtle); border-radius:6px; overflow:hidden;">
                <div class="cue-section-header" style="display:flex; justify-content:space-between; align-items:center; padding:10px 12px; background:var(--bg-elevated); cursor:pointer; border-bottom:1px solid var(--border-subtle);">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <strong style="color:${colorAccent};">${title}</strong>
                        <span style="font-size:11px; color:var(--text-muted);">${subtitle}</span>
                    </div>
                    <div style="display:flex; align-items:center; gap:6px;" onclick="event.stopPropagation();">
                        <select class="input preset-select" data-section="${sectionId}" style="font-size:10px; padding:2px 6px; width:auto; min-width:80px;">
                            <option value="">Preset...</option>
                            ${presetOptions}
                        </select>
                        <select class="input tense-select" data-section="${sectionId}" style="font-size:10px; padding:2px 6px; width:auto; min-width:60px;">
                            <option value="present">Present</option>
                            <option value="past">Past</option>
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

            const appConfig = T.appearance?.appendages || {};
            const getDisabledAttr = (part) => {
                if (part === 'basic') return '';
                if (!appConfig[part] || !appConfig[part].present) {
                    return 'disabled style="font-size:11px; padding:4px 6px; opacity:0.3; background:var(--bg-base); cursor:not-allowed;" title="Appendage not present"';
                }
                return 'style="font-size:11px; padding:4px 6px;"';
            };

            tags.forEach(tag => {
                const cue = cueData[tag] || {};
                html += `
                    <div class="cue-grid" style="display:grid; grid-template-columns:90px repeat(5, 1fr); gap:6px; align-items:center; margin-bottom:4px;">
                        <div style="font-size:11px; font-weight:600; text-transform:uppercase; color:${colorAccent};">${tag}</div>
                        <input class="input cue-input" data-section="${sectionId}" data-tag="${tag}" data-part="basic" value="${cue.basic || ''}" ${getDisabledAttr('basic')}>
                        <input class="input cue-input" data-section="${sectionId}" data-tag="${tag}" data-part="ears" value="${cue.ears || ''}" ${getDisabledAttr('ears')}>
                        <input class="input cue-input" data-section="${sectionId}" data-tag="${tag}" data-part="tail" value="${cue.tail || ''}" ${getDisabledAttr('tail')}>
                        <input class="input cue-input" data-section="${sectionId}" data-tag="${tag}" data-part="wings" value="${cue.wings || ''}" ${getDisabledAttr('wings')}>
                        <input class="input cue-input" data-section="${sectionId}" data-tag="${tag}" data-part="horns" value="${cue.horns || ''}" ${getDisabledAttr('horns')}>
                    </div>`;
            });

            html += `</div></div>`;
            return html;
        };

        let cuesHTML = `
        <div style="background:var(--accent-soft); padding:12px 16px; border-radius:8px; margin-bottom:16px; font-size:12px; line-height:1.5; border-left:3px solid var(--accent-primary);">
            <strong style="color:var(--accent-primary);">💡 What are Cues?</strong><br>
            Cues are short behavioral snippets triggered by emotional states. 
            <strong>PULSE</strong> = emotions, <strong>EROS</strong> = intimacy, <strong>INTENT</strong> = user actions.
        </div>
        `;

        cuesHTML += buildCueSection('pulse', 'PULSE Cues', 'Emotional Expression', PULSE_TAGS, T.pulseCues, 'var(--status-info)', A.Presets?.getPulsePresetList);
        cuesHTML += buildCueSection('eros', 'EROS Cues', 'Intimacy Response', EROS_TAGS, T.erosCues, 'var(--status-error)', A.Presets?.getErosPresetList);
        cuesHTML += buildCueSection('intent', 'INTENT Cues', 'Behavioral Response', INTENT_TAGS, T.intentCues, 'var(--status-success)', A.Presets?.getIntentPresetList);

        const wrapper = document.createElement('div');
        wrapper.innerHTML = cuesHTML;
        container.appendChild(wrapper);

        // Events
        wrapper.querySelectorAll('.cue-toggle').forEach(toggle => {
            toggle.onclick = (e) => {
                e.stopPropagation();
                const section = toggle.closest('.cue-section');
                const body = section.querySelector('.cue-section-body');
                const isCollapsed = body.style.display === 'none';
                body.style.display = isCollapsed ? 'block' : 'none';
                toggle.textContent = isCollapsed ? '▼' : '▶';
            };
        });

        wrapper.querySelectorAll('.cue-input').forEach(input => {
            input.onchange = (e) => {
                const sectionId = input.dataset.section;
                const tag = input.dataset.tag;
                const part = input.dataset.part;

                let targetCues;
                if (sectionId === 'pulse') targetCues = T.pulseCues;
                else if (sectionId === 'eros') targetCues = T.erosCues;
                else if (sectionId === 'intent') targetCues = T.intentCues;

                if (targetCues) {
                    if (!targetCues[tag]) targetCues[tag] = {};
                    targetCues[tag][part] = e.target.value;
                    A.State.notify();
                }
            };
        });

        wrapper.querySelectorAll('.preset-apply').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const sectionId = btn.dataset.section;
                const select = wrapper.querySelector(`.preset-select[data-section="${sectionId}"]`);
                const tenseSelect = wrapper.querySelector(`.tense-select[data-section="${sectionId}"]`);
                const presetId = select?.value;
                const tense = tenseSelect?.value || 'present';

                if (!presetId) {
                    if (A.UI.Toast) A.UI.Toast.show('Select a preset first', 'warning');
                    return;
                }

                let preset, targetCues;
                if (sectionId === 'pulse' && A.Presets?.Pulse?.[presetId]) {
                    preset = A.Presets.Pulse[presetId];
                    targetCues = T.pulseCues;
                } else if (sectionId === 'eros' && A.Presets?.Eros?.[presetId]) {
                    preset = A.Presets.Eros[presetId];
                    targetCues = T.erosCues;
                } else if (sectionId === 'intent' && A.Presets?.Intent?.[presetId]) {
                    preset = A.Presets.Intent[presetId];
                    targetCues = T.intentCues;
                }

                if (!preset) return;

                const presetData = preset[tense] || preset.cues || {};
                const actorName = actor?.name || 'Actor';
                const appConfig = T.appearance?.appendages || {};

                Object.keys(presetData).forEach(tag => {
                    const src = presetData[tag];
                    const dest = { basic: (src.basic || '').replace(/\{\{name\}\}/g, actorName) };
                    PARTS.forEach(p => {
                        if (appConfig[p]?.present) {
                            dest[p] = (src[p] || '').replace(/\{\{name\}\}/g, actorName);
                        }
                    });
                    targetCues[tag] = dest;
                });

                A.State.notify();
                A.Actors.Tabs.render(container, actor, 'cues'); // Re-render to show new values
                if (A.UI.Toast) A.UI.Toast.show('Preset applied', 'success');
            };
        });

        wrapper.querySelectorAll('.preset-clear').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const sectionId = btn.dataset.section;
                if (confirm('Clear all cues in this section?')) {
                    if (sectionId === 'pulse') T.pulseCues = {};
                    else if (sectionId === 'eros') T.erosCues = {};
                    else if (sectionId === 'intent') T.intentCues = {};

                    A.State.notify();
                    A.Actors.Tabs.render(container, actor, 'cues');
                }
            };
        });
    }

})(window.Anansi);
