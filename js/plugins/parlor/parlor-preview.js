/*
 * Anansi Plugin: Parlor Preview & Actor Creation
 * File: js/plugins/parlor/parlor-preview.js
 * Purpose: Handles the review, editing, and final creation of characters/ensembles.
 */

(function (A) {
    'use strict';

    // Ensure Parlor namespace exists
    A.Parlor = A.Parlor || {};

    // ============================================
    // UTILITIES
    // ============================================
    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function safeJsonParse(str) {
        try {
            return JSON.parse(str);
        } catch (e) {
            console.warn('[Parlor Preview] JSON parse failed, attempting auto-fix...');
            // Heuristic fix for unescaped quotes within strings
            const fixed2 = str.replace(/(?<=\w)\s*"\s*(?=\w)/g, '\\"').replace(/(?<=\w)\s*"\s*(?=\w)/g, '\\"');
            try {
                return JSON.parse(fixed2);
            } catch (e2) {
                throw e;
            }
        }
    }

    // ============================================
    // ACTOR CREATION HELPER
    // ============================================
    function createActorFromParlor(name, _personality, appearance, gender, extraNotes, portrait = null) {
        const state = A.State.get();
        if (!state.nodes) state.nodes = {};
        if (!state.nodes.actors) state.nodes.actors = { items: {} };

        const actorId = 'actor_' + crypto.randomUUID().split('-')[0];

        // Determine gender code
        const genderMap = { male: 'M', female: 'F', nonbinary: 'NB', any: 'A' };
        const genderCode = genderMap[gender] || 'A';

        // Create actor object
        const actor = {
            id: actorId,
            name: name || 'Unnamed',
            gender: genderCode,
            aliases: [],
            tags: ['parlor-generated'],
            notes: extraNotes || '',
            portrait: portrait,
            traits: {
                appearance: {
                    description: appearance || '',
                    hair: '',
                    eyes: '',
                    build: '',
                    appendages: {}
                },
                quirks: {
                    physical: [],
                    mental: [],
                    emotional: []
                },
                pulseCues: [],
                erosCues: [],
                intentCues: []
            },
            appendages: { ears: false, tail: false, wings: false, horns: false }
        };

        // Add to state
        state.nodes.actors.items[actorId] = actor;

        // Sync to voices panel
        if (state.weaves && state.weaves.voices) {
            if (!state.weaves.voices.voices) state.weaves.voices.voices = [];
            state.weaves.voices.voices.push({
                actorId: actorId,
                enabled: true,
                characterName: name,
                chatName: '',
                tag: 'V',
                attempt: { baseChance: 0.6 },
                subtones: []
            });
        }

        return actorId;
    }

    // ============================================
    // PAIR CREATION HELPER
    // ============================================
    function createPairFromParlor(id1, id2, type) {
        if (!id1 || !id2) return;
        const state = A.State.get();
        if (!state.nodes) state.nodes = {};
        if (!state.nodes.pairs) state.nodes.pairs = { items: {} };

        const pairId = 'pair_' + crypto.randomUUID().split('-')[0];
        state.nodes.pairs.items[pairId] = {
            id: pairId,
            actor1: id1,
            actor2: id2,
            type: type || 'Companion',
            target: 'personality',
            content: '',
            shifts: []
        };
        return pairId;
    }

    // ============================================
    // SINGLE PREVIEW MODAL
    // ============================================
    A.Parlor.showPreviewModal = function (cardData, answers) {
        const { name, personality, scenario, appearance } = cardData;

        // Use first message if generated, otherwise empty
        const firstMessage = cardData.firstMessage || '';

        let selectedPortrait = null;

        const content = document.createElement('div');
        content.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: var(--space-3);">
        <div style="display: flex; gap: var(--space-3);">
          <!-- Portrait Section -->
          <div style="width: 120px; flex-shrink: 0; display: flex; flex-direction: column; align-items: center; gap: 8px;">
            <div id="preview-portrait" style="
              width: 100px; height: 100px; 
              background: var(--bg-surface); 
              border: 2px dashed var(--border-subtle);
              border-radius: var(--radius-md);
              display: flex; alignItems: center; justifyContent: center;
              overflow: hidden; cursor: pointer; position: relative;
            ">
              <span style="font-size: 24px; opacity: 0.5;">📸</span>
              <img id="preview-img" style="width: 100%; height: 100%; object-fit: cover; display: none;">
            </div>
            <button class="btn btn-xs btn-ghost" id="upload-btn">Upload Portrait</button>
            <input type="file" id="portrait-file" accept="image/*" style="display: none;">
          </div>

          <!-- Main Fields -->
          <div style="flex-grow: 1; display: flex; flex-direction: column; gap: var(--space-2);">
            <div class="form-group">
              <label class="label">Name</label>
              <input type="text" id="preview-name" class="input" value="${escapeHtml(name)}">
            </div>
            <div class="form-group" style="flex-grow: 1;">
              <label class="label">Personality</label>
              <textarea id="preview-personality" class="input" style="height: 100%; resize: vertical;">${escapeHtml(personality)}</textarea>
            </div>
          </div>
        </div>

        <div class="form-group">
          <label class="label">Scenario (How {{user}} meets them)</label>
          <textarea id="preview-scenario" class="input" style="height: 80px; resize: vertical;">${escapeHtml(scenario)}</textarea>
        </div>
        
        <input type="hidden" id="preview-appearance" value="${escapeHtml(appearance || '')}">

        <!-- Opening Message Generator -->
        <div style="
          padding: 12px;
          background: var(--bg-surface);
          border-radius: var(--radius-md);
          border: 1px solid var(--border-subtle);
        ">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <label class="label" style="margin: 0; color: var(--text-main);">First Message</label>
            <button id="gen-opening-btn" class="btn btn-xs btn-primary">✨ Generate Opening</button>
          </div>
          <textarea id="preview-first-msg" class="input" style="height: 60px; resize: vertical;" placeholder="Anansi fills this automatically...">${escapeHtml(firstMessage)}</textarea>
          <div style="display: flex; justify-content: flex-end; margin-top: 4px;">
             <button id="copy-opening-btn" class="btn btn-xs btn-ghost" style="display: none;">📋 Copy</button>
          </div>
        </div>
      </div>
    `;

        // Portrait Handling
        const fileInput = content.querySelector('#portrait-file');
        const uploadBtn = content.querySelector('#upload-btn');
        const previewEl = content.querySelector('#preview-portrait');
        const imgEl = content.querySelector('#preview-img');

        const triggerUpload = () => fileInput.click();
        uploadBtn.onclick = triggerUpload;
        previewEl.onclick = triggerUpload;

        fileInput.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (evt) => {
                selectedPortrait = evt.target.result;
                imgEl.src = selectedPortrait;
                imgEl.style.display = 'block';
                previewEl.querySelector('span').style.display = 'none';
                previewEl.style.border = '2px solid var(--accent-primary)';
            };
            reader.readAsDataURL(file);
        };

        // Generate Opening Handler
        const generateBtn = content.querySelector('#gen-opening-btn');
        const firstMessageField = content.querySelector('#preview-first-msg');
        const copyBtn = content.querySelector('#copy-opening-btn');

        generateBtn.onclick = async () => {
            const currentName = content.querySelector('#preview-name').value.trim();
            const currentPersona = content.querySelector('#preview-personality').value.trim();

            if (!currentName || !currentPersona) {
                if (A.UI.Toast) A.UI.Toast.show('Need name and personality first!', 'warning');
                return;
            }

            const llmConfig = A.UI.getActiveLLMConfig ? A.UI.getActiveLLMConfig() : null;
            if (!llmConfig || !llmConfig.apiKey) {
                firstMessageField.placeholder = 'No API Key configured!';
                if (A.UI.Toast) A.UI.Toast.show('No API Key configured', 'error');
                return;
            }

            generateBtn.disabled = true;
            generateBtn.textContent = '✧ Generating...';
            firstMessageField.value = '';
            firstMessageField.placeholder = 'Weaving an opening...';

            try {
                // Use new prompt builder
                const prompt = A.Parlor.buildOpeningPrompt(currentName, currentPersona);
                const response = await A.LLM.generate(
                    prompt,
                    [{ role: 'user', content: "Write the opening message now." }]
                );

                firstMessageField.value = response.trim();
                copyBtn.style.display = 'block';
                if (A.UI.Toast) A.UI.Toast.show('Opening message woven!', 'success');
            } catch (err) {
                firstMessageField.value = '';
                firstMessageField.placeholder = 'Failed: ' + err.message;
            }

            generateBtn.disabled = false;
            generateBtn.textContent = '✨ Generate Opening';
        };

        copyBtn.onclick = () => {
            navigator.clipboard.writeText(firstMessageField.value);
            if (A.UI.Toast) A.UI.Toast.show('Copied!', 'success');
        };


        A.UI.Modal.show({
            title: '✨ A New Soul is Woven',
            content: content,
            width: 600,
            actions: [
                {
                    label: 'Discard',
                    class: 'btn-secondary',
                    onclick: () => true // Close modal
                },
                {
                    label: '✓ Create Project',
                    class: 'btn-primary',
                    onclick: async (modal) => {
                        const name = modal.querySelector('#preview-name').value.trim();
                        const personality = modal.querySelector('#preview-personality').value.trim();
                        const scenario = modal.querySelector('#preview-scenario').value.trim();
                        const appearance = modal.querySelector('#preview-appearance')?.value.trim() || '';

                        if (!name || !personality) {
                            if (A.UI.Toast) A.UI.Toast.show('Name and Personality are required.', 'warning');
                            return false;
                        }

                        const isFull = await A.ProjectDB.isFull();
                        if (isFull) {
                            if (A.UI.Toast) A.UI.Toast.show('The web is full. Delete a project to make room.', 'error');
                            return false;
                        }

                        await A.IO.saveNow();
                        A.State.reset();
                        const state = A.State.get();

                        state.meta.id = A.ProjectDB.generateId();
                        state.meta.name = name;
                        state.meta.description = `Woven by Anansi (${answers.genre || 'Story'}, ${answers.tone || 'Custom'})`;

                        // 1. Populate Legacy Seed
                        state.seed = {
                            characterName: name,
                            chatName: name,
                            persona: personality,
                            scenario: scenario,
                            portrait: selectedPortrait
                        };

                        // 2. Create V2 Actor
                        const gender = answers.gender || answers.quick_gender || 'any';
                        const actorId = createActorFromParlor(name, personality, appearance, gender, 'Protagonist', selectedPortrait);

                        // 3. Setup V2 Character State
                        if (!state.character) state.character = {};
                        state.character.activeMode = 'solo';
                        state.character.solo = {
                            selectedActorId: actorId,
                            characterName: name,
                            chatName: name,
                            portrait: selectedPortrait,
                            overrides: {
                                personality: { content: null, dirty: false },
                                scenario: { content: null, dirty: false },
                                exampleDialogue: { content: null, dirty: false },
                                firstMessage: { content: null, dirty: false }
                            },
                            firstMessageIndex: 0
                        };

                        // Also init ensemble for safety
                        state.character.ensemble = {
                            selectedActorIds: [],
                            portrait: null,
                            characterName: '',
                            chatName: '',
                            options: { includeNarrator: false, includeMoodTags: false },
                            overrides: {
                                personality: { content: null, dirty: false },
                                scenario: { content: null, dirty: false },
                                exampleDialogue: { content: null, dirty: false },
                                firstMessage: { content: null, dirty: false }
                            },
                            firstMessageIndex: 0
                        };

                        // Compile immediate state
                        state.character.compiled = {
                            name: name,
                            personality: personality,
                            scenario: scenario,
                            firstMessage: '',
                            exampleDialogue: '',
                            portrait: selectedPortrait
                        };

                        await A.ProjectDB.save(state);
                        A.ProjectDB.setCurrentId(state.meta.id);

                        A.State.notify();
                        A.UI.refresh();

                        if (A.UI.Toast) A.UI.Toast.show(`"${name}" has been woven into existence!`, 'success');

                        // Switch to Character panel (now V2)
                        A.UI.switchPanel('character');

                        return true;
                    }
                },
                {
                    label: '👤 Import to Actors',
                    class: 'btn-ghost',
                    onclick: (modal) => {
                        const name = modal.querySelector('#preview-name').value.trim();
                        const personality = modal.querySelector('#preview-personality').value.trim();
                        const scenario = modal.querySelector('#preview-scenario').value.trim();
                        const appearance = modal.querySelector('#preview-appearance')?.value.trim() || '';

                        // Check for Companion
                        const companionEl = modal.querySelector('#companion-personality');
                        const companionName = modal.querySelector('#companion-selector-container')?.querySelector('div[style*="font-weight: 600"]')?.textContent?.replace('👥 Companion: ', '').trim() || null;
                        const companionPersonality = companionEl?.value.trim() || null;
                        const companionAppearance = modal.querySelector('#companion-appearance')?.value.trim() || '';
                        const companionRelType = modal.querySelector('#companion-selector-container')?.dataset.selectedRelation || 'companion';


                        if (!name) {
                            if (A.UI.Toast) A.UI.Toast.show('Character needs a name!', 'warning');
                            return false;
                        }

                        // Prompt for Project
                        const dialogContent = document.createElement('div');
                        dialogContent.innerText = `You are about to import "${name}"${companionName ? ` and "${companionName}"` : ''}. Where should they go?`;

                        A.UI.Modal.show({
                            title: 'Import Options',
                            content: dialogContent,
                            width: 400,
                            actions: [
                                { label: 'Cancel', class: 'btn-secondary', onclick: () => true },
                                {
                                    label: 'Add to Current Project',
                                    class: 'btn-ghost',
                                    onclick: () => {
                                        const gender = answers.gender || answers.quick_gender || 'any';
                                        const mainId = createActorFromParlor(name, personality, appearance, gender, 'Generated by The Spider\'s Parlor', selectedPortrait);
                                        if (companionName) {
                                            const compId = createActorFromParlor(companionName, companionPersonality, companionAppearance, 'any', `Companion of ${name}`);
                                            createPairFromParlor(mainId, compId, companionRelType);
                                        }
                                        A.State.notify();
                                        if (A.UI.Toast) A.UI.Toast.show('Actors added to current project!', 'success');
                                        A.UI.switchPanel('actors');
                                        return true;
                                    }
                                },
                                {
                                    label: 'Start New Project',
                                    class: 'btn-primary',
                                    onclick: async () => {
                                        const isFull = await A.ProjectDB.isFull();
                                        if (isFull) {
                                            if (A.UI.Toast) A.UI.Toast.show('Cannot create new project: Storage full', 'error');
                                            return false;
                                        }
                                        await A.IO.saveNow();
                                        A.State.reset();
                                        const state = A.State.get();

                                        state.meta.id = A.ProjectDB.generateId();
                                        state.meta.name = name;
                                        state.meta.description = `Woven by Anansi (${answers.genre || 'Story'})`;

                                        state.seed = {
                                            characterName: name, chatName: name, persona: personality, scenario: scenario, examples: '', portrait: selectedPortrait
                                        };

                                        const gender = answers.gender || answers.quick_gender || 'any';
                                        const mainId = createActorFromParlor(name, personality, appearance, gender, 'Protagonist', selectedPortrait);
                                        if (companionName) {
                                            const compId = createActorFromParlor(companionName, companionPersonality, companionAppearance, 'any', `Companion of ${name}`);
                                            createPairFromParlor(mainId, compId, companionRelType);
                                        }

                                        if (!state.character) state.character = {};
                                        state.character.activeMode = 'solo';
                                        state.character.solo = {
                                            selectedActorId: mainId,
                                            characterName: name, chatName: name, portrait: selectedPortrait,
                                            overrides: { personality: { content: null, dirty: false }, scenario: { content: null, dirty: false }, exampleDialogue: { content: null, dirty: false }, firstMessage: { content: null, dirty: false } },
                                            firstMessageIndex: 0
                                        };
                                        state.character.ensemble = { selectedActorIds: [], portrait: null, characterName: '', chatName: '', options: { includeNarrator: false, includeMoodTags: false }, overrides: { personality: { content: null, dirty: false }, scenario: { content: null, dirty: false }, exampleDialogue: { content: null, dirty: false }, firstMessage: { content: null, dirty: false } }, firstMessageIndex: 0 };
                                        state.character.compiled = { name: name, personality: personality, scenario: scenario, firstMessage: '', exampleDialogue: '', portrait: selectedPortrait };

                                        await A.ProjectDB.save(state);
                                        A.ProjectDB.setCurrentId(state.meta.id);
                                        A.State.notify();
                                        A.UI.refresh();
                                        if (A.UI.Toast) A.UI.Toast.show(`New project "${name}" created!`, 'success');
                                        A.UI.switchPanel('character');
                                        return true;
                                    }
                                }
                            ]
                        });
                        return true;
                    }
                },
                {
                    label: '🔄 Spin Scenario',
                    class: 'btn-ghost',
                    onclick: async (modal) => {
                        const name = modal.querySelector('#preview-name').value.trim();
                        const personality = modal.querySelector('#preview-personality').value.trim();
                        const scenarioField = modal.querySelector('#preview-scenario');

                        if (!name || !personality) {
                            if (A.UI.Toast) A.UI.Toast.show('Need name and personality to spin a new scenario!', 'warning');
                            return false;
                        }

                        const llmConfig = A.UI.getActiveLLMConfig ? A.UI.getActiveLLMConfig() : null;
                        if (!llmConfig || !llmConfig.apiKey) {
                            scenarioField.value = 'No API Key configured!';
                            return false;
                        }

                        scenarioField.value = '✧ Spinning a new scenario...';
                        scenarioField.disabled = true;

                        try {
                            // Use new prompt builder
                            const prompt = A.Parlor.buildSpinPrompt(name, personality);
                            const response = await A.LLM.generate(
                                prompt,
                                [{ role: 'user', content: "Generate the new scenario now." }]
                            );

                            scenarioField.value = response.trim();
                            scenarioField.disabled = false;
                            if (A.UI.Toast) A.UI.Toast.show('New scenario woven!', 'success');
                        } catch (err) {
                            scenarioField.value = 'Failed to spin scenario: ' + err.message;
                            scenarioField.disabled = false;
                        }

                        return false;
                    }
                },
                {
                    label: '👥 Add Companion',
                    class: 'btn-ghost',
                    onclick: async (modal) => {
                        const mainName = modal.querySelector('#preview-name').value.trim();
                        const mainPersonality = modal.querySelector('#preview-personality').value.trim();
                        const scenario = modal.querySelector('#preview-scenario').value.trim();

                        if (!mainName || !mainPersonality) {
                            if (A.UI.Toast) A.UI.Toast.show('Need main character first!', 'warning');
                            return false;
                        }

                        const relationshipTypes = [
                            { label: '💕 Love Interest', value: 'love_interest', desc: 'Romantic tension or attraction' },
                            { label: '⚔️ Rival', value: 'rival', desc: 'Competition, conflict' },
                            { label: '🎓 Mentor', value: 'mentor', desc: 'Teacher, guide' },
                            { label: '🌱 Protégé', value: 'protege', desc: 'Student, ward' },
                            { label: '👨‍👩‍👧 Sibling', value: 'sibling', desc: 'Family bond' },
                            { label: '🎲 Surprise Me', value: 'surprise', desc: 'Let Anansi decide' }
                        ];

                        let selectedRelation = null;
                        const selectorHtml = `
              <div style="margin-bottom: 16px;">
                <div style="font-weight: 600; margin-bottom: 8px; color: var(--text-main);">What binds these two souls together?</div>
                <div id="relation-selector" style="display: flex; flex-wrap: wrap; gap: 8px;">
                  ${relationshipTypes.map(r => `
                    <button class="btn btn-ghost btn-sm relation-btn" data-value="${r.value}" title="${r.desc}" style="border: 1px solid var(--border-subtle);">
                      ${r.label}
                    </button>
                  `).join('')}
                </div>
              </div>
              <div id="companion-status" style="text-align: center; padding: 20px; color: var(--text-muted); display: none;">
                ✧ Weaving a companion...
              </div>
            `;

                        const scenarioGroup = modal.querySelector('#preview-scenario').parentElement;
                        const selectorDiv = document.createElement('div');
                        selectorDiv.id = 'companion-selector-container';
                        selectorDiv.innerHTML = selectorHtml;
                        scenarioGroup.parentElement.insertBefore(selectorDiv, scenarioGroup);

                        const relationBtns = selectorDiv.querySelectorAll('.relation-btn');
                        const statusDiv = selectorDiv.querySelector('#companion-status');

                        relationBtns.forEach(btn => {
                            btn.onclick = async () => {
                                selectedRelation = btn.dataset.value;
                                selectorDiv.dataset.selectedRelation = selectedRelation;

                                relationBtns.forEach(b => b.style.background = '');
                                btn.style.background = 'var(--accent-soft)';

                                selectorDiv.querySelector('#relation-selector').style.display = 'none';
                                statusDiv.style.display = 'block';

                                const llmConfig = A.UI.getActiveLLMConfig ? A.UI.getActiveLLMConfig() : null;
                                if (!llmConfig || !llmConfig.apiKey) {
                                    statusDiv.textContent = 'No API Key configured!';
                                    return;
                                }

                                try {
                                    // Use new prompt builder
                                    const prompt = A.Parlor.buildCompanionPrompt(mainName, mainPersonality, scenario, selectedRelation);
                                    const response = await A.LLM.generate(
                                        prompt,
                                        [{ role: 'user', content: "Generate the companion now." }]
                                    );

                                    let companionData;
                                    try {
                                        const jsonMatch = response.match(/\{[\s\S]*\}/);
                                        if (jsonMatch) {
                                            companionData = safeJsonParse(jsonMatch[0]);
                                        }
                                    } catch (parseErr) {
                                        throw new Error('Failed to parse companion data');
                                    }

                                    // Fallback if structure varies
                                    const compObj = companionData.companion || companionData;

                                    if (!compObj || !compObj.name) {
                                        throw new Error('Invalid companion data received');
                                    }

                                    selectorDiv.innerHTML = `
                    <div style="background: var(--accent-soft); border-radius: var(--radius-md); padding: 12px; margin-bottom: 16px;">
                      <div style="font-weight: 600; color: var(--accent-primary); margin-bottom: 8px;">
                        👥 Companion: ${escapeHtml(compObj.name)}
                      </div>
                      <div style="font-size: 12px; margin-bottom: 8px; font-style: italic; color: var(--text-muted);">
                        ${escapeHtml(companionData.relationship || compObj.role || 'Companion')}
                      </div>
                      <textarea id="companion-appearance" class="input" style="height: 50px; resize: vertical; font-size: 12px; margin-bottom: 4px;" placeholder="Appearance...">${escapeHtml(compObj.appearance || '')}</textarea>
                      <textarea id="companion-personality" class="input" style="height: 100px; resize: vertical; font-size: 12px;">${escapeHtml(compObj.personality || '')}</textarea>
                    </div>
                  `;

                                    if (companionData.scenario) {
                                        modal.querySelector('#preview-scenario').value = companionData.scenario;
                                    }

                                    if (A.UI.Toast) A.UI.Toast.show(`${compObj.name} joins the story!`, 'success');

                                } catch (err) {
                                    statusDiv.textContent = 'Failed: ' + err.message;
                                    selectorDiv.querySelector('#relation-selector').style.display = 'flex';
                                    statusDiv.style.display = 'none';
                                }
                            };
                        });

                        return false;
                    }
                }
            ]
        });
    };

    // ============================================
    // ENSEMBLE PREVIEW MODAL
    // ============================================
    A.Parlor.showEnsemblePreview = function (ensembleData, answers) {
        const characters = ensembleData.characters || [];
        const relationships = ensembleData.relationships || [];
        const scenario = ensembleData.scenario || '';

        const content = document.createElement('div');
        content.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: var(--space-3);">
        <!-- Web of Connections -->
        ${relationships.length > 0 ? `
          <div class="card" style="margin: 0; padding: 12px; background: var(--accent-soft); flex-shrink: 0;">
            <div style="font-weight: 600; margin-bottom: 8px; color: var(--accent-primary);">🕸️ Web of Connections</div>
            ${relationships.map(r => `
              <div style="font-size: 12px; margin-bottom: 4px;">
                <strong>${escapeHtml(Array.isArray(r.between) ? r.between.join(' ↔ ') : 'Connection')}</strong>: 
                ${escapeHtml(r.dynamic || '')}
              </div>
            `).join('')}
          </div>
        ` : ''}

        <!-- Character Cards -->
        <div style="max-height: 250px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; padding-right: 4px;">
          ${characters.map((char, i) => `
            <div class="card" style="margin: 0; padding: 10px; border-left: 3px solid var(--accent-primary); flex-shrink: 0;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <input type="text" class="input char-name" data-idx="${i}" value="${escapeHtml(char.name || '')}" 
                  style="font-weight: 600; font-size: 13px; width: 65%; padding: 4px 8px;">
                <span style="font-size: 10px; color: var(--text-muted); text-transform: uppercase;">${escapeHtml(char.role || 'character')}</span>
              </div>
              <textarea class="input char-appearance" data-idx="${i}" style="height: 40px; resize: vertical; font-size: 11px; padding: 6px; margin-bottom: 4px;" placeholder="Appearance...">${escapeHtml(char.appearance || '')}</textarea>
              <textarea class="input char-personality" data-idx="${i}" style="height: 60px; resize: vertical; font-size: 11px; padding: 6px;">${escapeHtml(char.personality || '')}</textarea>
            </div>
          `).join('')}
        </div>

        <!-- Shared Scenario -->
        <div class="form-group">
          <label class="label">Shared Scenario</label>
          <textarea id="ensemble-scenario" class="input" style="height: 120px; resize: vertical;">${escapeHtml(scenario)}</textarea>
        </div>

        <div style="padding: 12px; background: var(--bg-surface); border-radius: var(--radius-md); font-size: 11px; color: var(--text-muted);">
          <strong>Woven with:</strong> ${answers.genre || 'fantasy'} / ${answers.tone || 'dramatic'} / ${answers.rating || 'mature'}
        </div>
      </div>
    `;

        A.UI.Modal.show({
            title: '🕸️ Your Ensemble Awaits',
            content: content,
            width: 650,
            actions: [
                {
                    label: 'Discard',
                    class: 'btn-secondary',
                    onclick: () => true
                },
                {
                    label: '✓ Create Project',
                    class: 'btn-primary',
                    onclick: async (modal) => {
                        const charNames = modal.querySelectorAll('.char-name');
                        const charPersonalities = modal.querySelectorAll('.char-personality');
                        const scenarioText = modal.querySelector('#ensemble-scenario').value.trim();

                        const isFull = await A.ProjectDB.isFull();
                        if (isFull) {
                            if (A.UI.Toast) A.UI.Toast.show('The web is full.', 'error');
                            return false;
                        }

                        await A.IO.saveNow();
                        A.State.reset();
                        const state = A.State.get();

                        const mainName = charNames[0]?.value.trim() || 'Ensemble';
                        const mainPersonality = charPersonalities[0]?.value.trim() || '';

                        state.meta.id = A.ProjectDB.generateId();
                        state.meta.name = mainName;
                        state.meta.description = `Ensemble woven by Anansi (${characters.length} chars)`;

                        state.seed = {
                            characterName: mainName, chatName: mainName, persona: mainPersonality, scenario: scenarioText
                        };

                        if (characters.length > 1) {
                            let ensembleNotes = '=== ENSEMBLE CAST ===\n\n';
                            for (let i = 0; i < charNames.length; i++) {
                                const name = charNames[i]?.value.trim() || `Character ${i + 1}`;
                                const personality = charPersonalities[i]?.value.trim() || '';
                                ensembleNotes += `## ${name}\n${personality}\n\n`;
                            }
                            if (relationships.length > 0) {
                                ensembleNotes += '=== RELATIONSHIPS ===\n\n';
                                relationships.forEach(r => {
                                    const between = Array.isArray(r.between) ? r.between.join(' ↔ ') : 'Connection';
                                    ensembleNotes += `${between}: ${r.dynamic || ''}\n`;
                                });
                            }
                            state.seed.characterNotes = ensembleNotes;
                        }

                        await A.ProjectDB.save(state);
                        A.ProjectDB.setCurrentId(state.meta.id);

                        if (!state.character) state.character = {};
                        state.character.activeMode = 'ensemble';
                        state.character.solo = { selectedActorId: null, characterName: '', chatName: '', overrides: {}, firstMessageIndex: 0 };
                        state.character.ensemble = {
                            selectedActorIds: [], portrait: null, characterName: mainName, chatName: mainName,
                            options: { includeNarrator: false, includeMoodTags: false },
                            overrides: { personality: { content: null, dirty: false }, scenario: { content: null, dirty: false }, exampleDialogue: { content: null, dirty: false }, firstMessage: { content: null, dirty: false } },
                            firstMessageIndex: 0
                        };

                        const gender = answers.gender || 'any';
                        let createdCount = 0;
                        const actorIds = [];

                        for (let i = 0; i < charNames.length; i++) {
                            const name = charNames[i]?.value.trim() || `Character ${i + 1}`;
                            const personality = charPersonalities[i]?.value.trim() || '';
                            const appearance = modal.querySelectorAll('.char-appearance')[i]?.value.trim() || '';

                            if (name) {
                                const role = i === 0 ? 'Ensemble Protagonist' : 'Ensemble Member';
                                const actorId = createActorFromParlor(name, personality, appearance, i === 0 ? gender : 'any', role);
                                actorIds.push(actorId);
                                createdCount++;
                            }
                        }

                        state.character.ensemble.selectedActorIds = actorIds;
                        state.character.compiled = { name: mainName, personality: '', scenario: scenarioText, firstMessage: '', exampleDialogue: '', portrait: null };

                        await A.ProjectDB.save(state);
                        A.State.notify();
                        A.UI.refresh();

                        if (A.UI.Toast) A.UI.Toast.show(`Ensemble "${mainName}" has been woven!`, 'success');
                        A.UI.switchPanel('character');

                        return true;
                    }
                },
                {
                    label: '👥 Import All to Actors',
                    class: 'btn-ghost',
                    onclick: (modal) => {
                        const charNames = modal.querySelectorAll('.char-name');
                        if (charNames.length === 0) {
                            if (A.UI.Toast) A.UI.Toast.show('No characters to import!', 'warning');
                            return false;
                        }
                        const charPersonalities = modal.querySelectorAll('.char-personality');
                        const charAppearances = modal.querySelectorAll('.char-appearance');

                        const dialogContent = document.createElement('div');
                        dialogContent.innerText = `You are about to import ${charNames.length} actors. Where should they go?`;

                        A.UI.Modal.show({
                            title: 'Import Ensemble',
                            content: dialogContent,
                            width: 400,
                            actions: [
                                { label: 'Cancel', class: 'btn-secondary', onclick: () => true },
                                {
                                    label: 'Add to Current Project',
                                    class: 'btn-ghost',
                                    onclick: () => {
                                        const gender = answers.gender || 'any';
                                        let createdCount = 0;
                                        for (let i = 0; i < charNames.length; i++) {
                                            const name = charNames[i]?.value.trim() || `Character ${i + 1}`;
                                            const personality = charPersonalities[i]?.value.trim() || '';
                                            const appearance = charAppearances[i]?.value.trim() || '';
                                            if (name) {
                                                createActorFromParlor(name, personality, appearance, i === 0 ? gender : 'any', 'Generated by The Spider\'s Parlor (Ensemble)');
                                                createdCount++;
                                            }
                                        }
                                        A.State.notify();
                                        if (A.UI.Toast) A.UI.Toast.show(`${createdCount} actors added to current project!`, 'success');
                                        A.UI.switchPanel('actors');
                                        return true;
                                    }
                                },
                                {
                                    label: 'Start New Project',
                                    class: 'btn-primary',
                                    onclick: async () => {
                                        const isFull = await A.ProjectDB.isFull();
                                        if (isFull) {
                                            if (A.UI.Toast) A.UI.Toast.show('Cannot create new project: Storage full', 'error');
                                            return false;
                                        }
                                        await A.IO.saveNow();
                                        A.State.reset();
                                        const state = A.State.get();

                                        const mainName = charNames[0]?.value.trim() || 'Ensemble';
                                        const mainPersonality = charPersonalities[0]?.value.trim() || '';
                                        const scenario = modal.querySelector('#ensemble-scenario')?.value.trim() || '';

                                        state.meta.id = A.ProjectDB.generateId();
                                        state.meta.name = mainName;
                                        state.meta.description = `Ensemble woven by Anansi (${charNames.length} chars)`;

                                        state.seed = {
                                            characterName: mainName, chatName: mainName, persona: mainPersonality, scenario: scenario, examples: ''
                                        };

                                        // Add actors
                                        const gender = answers.gender || 'any';
                                        let createdCount = 0;
                                        const actorIds = [];

                                        for (let i = 0; i < charNames.length; i++) {
                                            const name = charNames[i]?.value.trim() || `Character ${i + 1}`;
                                            const personality = charPersonalities[i]?.value.trim() || '';
                                            const appearance = charAppearances[i]?.value.trim() || '';
                                            if (name) {
                                                const role = i === 0 ? 'Ensemble Protagonist' : 'Ensemble Member';
                                                const actorId = createActorFromParlor(name, personality, appearance, i === 0 ? gender : 'any', role);
                                                actorIds.push(actorId);
                                                createdCount++;
                                            }
                                        }

                                        if (!state.character) state.character = {};
                                        state.character.activeMode = 'ensemble';
                                        state.character.solo = { selectedActorId: null, characterName: '', chatName: '', overrides: {}, firstMessageIndex: 0 };
                                        state.character.ensemble = {
                                            selectedActorIds: actorIds, portrait: null, characterName: mainName, chatName: mainName, options: { includeNarrator: false, includeMoodTags: false }, overrides: { personality: { content: null, dirty: false }, scenario: { content: null, dirty: false }, exampleDialogue: { content: null, dirty: false }, firstMessage: { content: null, dirty: false } }, firstMessageIndex: 0
                                        };
                                        state.character.compiled = { name: mainName, personality: '', scenario: scenario, firstMessage: '', exampleDialogue: '', portrait: null };

                                        await A.ProjectDB.save(state);
                                        A.ProjectDB.setCurrentId(state.meta.id);
                                        A.State.notify();
                                        A.UI.refresh();
                                        if (A.UI.Toast) A.UI.Toast.show(`New project "${mainName}" created with ${createdCount} actors!`, 'success');
                                        A.UI.switchPanel('character');
                                        return true;
                                    }
                                }
                            ]
                        });
                        return true;
                    }
                }
            ]
        });
    };

})(window.Anansi);
