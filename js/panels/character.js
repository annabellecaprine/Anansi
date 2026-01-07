/*
 * Anansi Panel: Character (V2)
 * File: js/panels/character.js
 * Category: Seeds
 * Purpose: Character card synthesis from Actor data with one-way data flow.
 */

(function (A) {
  'use strict';





  // --- State Schema Extension ---
  // Ensures state.character exists with proper structure
  function ensureCharacterState(state) {
    if (!state.character) {
      state.character = {
        activeMode: 'solo',
        solo: {
          selectedActorId: null,
          portrait: null, // { data: base64, mimeType: string } or null
          characterName: '', // Full card name
          chatName: '', // Name in chat messages
          overrides: {
            personality: { content: null, dirty: false },
            scenario: { content: null, dirty: false },
            exampleDialogue: { content: null, dirty: false },
            firstMessage: { content: null, dirty: false }
          },
          firstMessageIndex: 0
        },
        ensemble: {
          selectedActorIds: [],
          portrait: null,
          characterName: '',
          chatName: '',
          options: {
            includeNarrator: false,
            includeMoodTags: false
          },
          overrides: {
            personality: { content: null, dirty: false },
            scenario: { content: null, dirty: false },
            exampleDialogue: { content: null, dirty: false },
            firstMessage: { content: null, dirty: false }
          },
          firstMessageIndex: 0
        }
      };
    }
    // Migration for existing state without new fields
    if (state.character.solo && state.character.solo.portrait === undefined) {
      state.character.solo.portrait = null;
      state.character.solo.characterName = '';
      state.character.solo.chatName = '';
    }
    if (state.character.ensemble && state.character.ensemble.portrait === undefined) {
      state.character.ensemble.portrait = null;
      state.character.ensemble.characterName = '';
      state.character.ensemble.chatName = '';
    }

    // --- Legacy Seed Migration ---
    // If we have legacy Seed data but no V2 data, migrate it to Solo overrides
    if (state.seed && (!state.character.solo.characterName && !state.character.solo.selectedActorId)) {
      const seed = state.seed;
      // Only migrate if there is meaningful data
      if (seed.name || seed.characterName || seed.persona || seed.scenario) {
        console.log('[Character] Migrating legacy seed to V2 state...');
        state.character.activeMode = 'solo';
        state.character.solo.characterName = seed.characterName || seed.name || '';
        state.character.solo.chatName = seed.chatName || seed.characterName || seed.name || '';

        // Copy content to overrides and mark as dirty (user-edited) so they persist
        if (seed.persona) {
          state.character.solo.overrides.personality = { content: seed.persona, dirty: true };
        }
        if (seed.scenario) {
          state.character.solo.overrides.scenario = { content: seed.scenario, dirty: true };
        }
        if (seed.examples) {
          state.character.solo.overrides.exampleDialogue = { content: seed.examples, dirty: true };
        }
        // Attempt to migrate portrait if it exists in a compatible format
        if (seed.portrait && seed.portrait.data) {
          state.character.solo.portrait = {
            data: seed.portrait.data,
            mimeType: seed.portrait.mimeType || 'image/png'
          };
        }
      }
    }

    return state.character;
  }

  // --- Synthesis Functions ---

  function synthesizePersonality(actorIds, state) {
    const actors = actorIds
      .map(id => state.nodes?.actors?.items?.[id])
      .filter(Boolean);

    if (!actors.length) return '';

    let output = '### CAST PROFILES\n';
    actors.forEach(actor => {
      output += `\n---\n**[${actor.name || 'Unnamed'}]**\n`;
      if (actor.role) output += `*Role:* ${actor.role}\n`;
      const description = actor.appearance || actor.description || actor.traits?.description || actor.cardFields?.description;
      if (description) {
        output += `*Appearance:* ${description}\n`;
      }

      const personality = actor.personality || actor.traits?.personality || actor.cardFields?.personality;
      if (personality) output += `*Personality:* ${personality}\n`;

      if (actor.quirks) output += `*Quirks:* ${actor.quirks}\n`;
      // Include traits if available as array
      if (actor.traits && Array.isArray(actor.traits) && actor.traits.length) {
        output += `*Traits:* ${actor.traits.join(', ')}\n`;
      }
    });

    return output.trim();
  }

  function synthesizeScenario(actorIds, state, options = {}) {
    const actors = actorIds
      .map(id => state.nodes?.actors?.items?.[id])
      .filter(Boolean);

    if (!actors.length) return '';

    // Get pairs involving any of the selected actors
    const pairs = [];
    if (state.nodes?.pairs?.items) {
      Object.values(state.nodes.pairs.items).forEach(pair => {
        const a1 = state.nodes?.actors?.items?.[pair.actor1];
        const a2 = state.nodes?.actors?.items?.[pair.actor2];
        if (a1 && a2 && actorIds.includes(pair.actor1) && actorIds.includes(pair.actor2)) {
          pairs.push({
            actor1: a1.name || 'Unknown',
            actor2: a2.name || 'Unknown',
            type: pair.type || '',
            summary: pair.content || pair.description || `${pair.type || 'Related'}`
          });
        }
      });
    }

    let output = `You are a character simulation engine portraying multiple distinct characters in one scene.

## GLOBAL RULES
- Only ONE character speaks per response unless explicitly requested.
- Always prefix dialogue/actions with the speaking character's name: "Name: ..."
- Never write as or control {{user}}.
- Keep each character's personality, voice, and knowledge separate.
- If multiple characters could respond, choose the most narratively relevant one.

## ACTOR REGISTRY
${actors.map(a => `[${a.name || 'Unknown'}]`).join(' ')}`;

    if (pairs.length) {
      output += '\n\n## CAST DYNAMICS';
      pairs.forEach(p => {
        output += `\n**${p.actor1} ↔ ${p.actor2}**: ${p.summary}`;
      });
    }

    if (options.includeMoodTags && state.meta?.moodTags?.length) {
      output += `\n\n## NARRATIVE TONE\n${state.meta.moodTags.join(', ')}`;
    }

    if (options.includeNarrator) {
      output += `\n\n## NARRATOR ROLE
The Narrator may provide scene descriptions, transitions, and environmental details. 
Use sparingly for pacing. Format: *Narrator: [description]*`;
    }

    return output;
  }

  function synthesizeExamples(actorIds, state) {
    const actors = actorIds
      .map(id => state.nodes?.actors?.items?.[id])
      .filter(Boolean);

    if (!actors.length) return '';

    let output = '### ACTOR VOICE SAMPLES\n';
    actors.forEach(actor => {
      const examples = actor.exampleDialogue || actor.examples || actor.cardFields?.mes_example || actor.imported?.examples;
      if (examples) {
        output += `\n[${actor.name || 'Unknown'} Example]\n`;
        output += examples.trim() + '\n';
      }
    });

    return output.trim();
  }

  function getFirstMessageOptions(actorIds, state) {
    const options = [];
    const actors = actorIds
      .map(id => state.nodes?.actors?.items?.[id])
      .filter(Boolean);

    actors.forEach(actor => {
      const sources = [];

      // 1. Primary Editor Field
      if (actor.cardFields?.firstMessage) sources.push(actor.cardFields.firstMessage);

      // 2. Base field (Legacy array or string)
      if (actor.firstMessage) {
        if (Array.isArray(actor.firstMessage)) {
          actor.firstMessage.forEach(m => sources.push(m));
        } else {
          sources.push(actor.firstMessage);
        }
      }

      // 3. Imported metadata
      if (actor.imported?.firstMessage) sources.push(actor.imported.firstMessage);

      // Unique, non-empty greetings
      const uniqueGreetings = [...new Set(sources)].filter(s => typeof s === 'string' && s.trim());

      uniqueGreetings.forEach((greeting, idx) => {
        options.push({
          label: actor.name || 'Actor',
          count: uniqueGreetings.length > 1 ? `(${idx + 1}/${uniqueGreetings.length})` : '',
          content: greeting,
          actorId: actor.id
        });
      });
    });

    // Always add Custom 
    options.push({
      label: 'Custom',
      count: '',
      content: '',
      actorId: null,
      isCustom: true
    });

    return options;
  }

  // --- UI Helpers ---

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function showConfirmDialog(title, message, onConfirm) {
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:9999;';
    modal.innerHTML = `
      <div class="modal-content" style="background:var(--bg-primary);border-radius:var(--radius-lg);padding:24px;max-width:400px;box-shadow:var(--shadow-lg);">
        <h3 style="margin:0 0 12px;color:var(--text-primary);">⚠️ ${escapeHtml(title)}</h3>
        <p style="margin:0 0 20px;color:var(--text-secondary);font-size:14px;">${escapeHtml(message)}</p>
        <div style="display:flex;gap:12px;justify-content:flex-end;">
          <button class="btn btn-ghost" id="modal-cancel">Cancel</button>
          <button class="btn btn-primary" id="modal-confirm">Continue</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector('#modal-cancel').onclick = () => modal.remove();
    modal.querySelector('#modal-confirm').onclick = () => {
      modal.remove();
      onConfirm();
    };
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
  }

  // --- Portrait Selection Modal ---
  function showPortraitSelector(state, selectedActorIds, onSelect) {
    const actors = selectedActorIds
      .map(id => state.nodes?.actors?.items?.[id])
      .filter(Boolean);

    // Collect all available images from selected actors
    const imageOptions = [];
    actors.forEach(actor => {
      const gallery = actor.gallery || {};
      const images = gallery.images || [];
      const primaryImg = images.find(i => i.id === gallery.primary) || images[0];

      if (primaryImg) {
        imageOptions.push({
          actorId: actor.id,
          actorName: actor.name || 'Unnamed',
          imageData: primaryImg.data,
          isPrimary: true
        });
      }
    });

    if (imageOptions.length === 0) {
      // No images available - require upload
      const modal = document.createElement('div');
      modal.className = 'modal-backdrop';
      modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:9999;';
      modal.innerHTML = `
        <div class="modal-content" style="background:var(--bg-primary);border-radius:var(--radius-lg);padding:24px;max-width:400px;box-shadow:var(--shadow-lg);">
          <h3 style="margin:0 0 12px;color:var(--text-primary);">📷 No Portrait Available</h3>
          <p style="margin:0 0 20px;color:var(--text-secondary);font-size:14px;">None of the selected Actors have images. Upload an image to use as the card portrait.</p>
          <input type="file" id="upload-portrait" accept="image/png,image/jpeg,image/webp" style="display:none;">
          <div style="display:flex;gap:12px;justify-content:flex-end;">
            <button class="btn btn-ghost" id="modal-cancel">Cancel</button>
            <button class="btn btn-primary" id="modal-upload">Upload Image</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      const fileInput = modal.querySelector('#upload-portrait');
      modal.querySelector('#modal-cancel').onclick = () => modal.remove();
      modal.querySelector('#modal-upload').onclick = () => fileInput.click();
      modal.onclick = (e) => { if (e.target === modal) modal.remove(); };

      fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          modal.remove();
          onSelect(ev.target.result);
        };
        reader.readAsDataURL(file);
      };
      return;
    }

    // Show selection modal
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:9999;';
    modal.innerHTML = `
      <div class="modal-content" style="background:var(--bg-primary);border-radius:var(--radius-lg);padding:24px;max-width:500px;box-shadow:var(--shadow-lg);">
        <h3 style="margin:0 0 12px;color:var(--text-primary);">📷 Select Card Portrait</h3>
        <p style="margin:0 0 16px;color:var(--text-secondary);font-size:13px;">Choose which image to use for the Character Card PNG:</p>
        <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(80px, 1fr));gap:12px;max-height:300px;overflow-y:auto;padding:4px;">
          ${imageOptions.map((opt, idx) => `
            <div class="portrait-option" data-index="${idx}" style="cursor:pointer;text-align:center;">
              <div style="width:80px;height:100px;border-radius:var(--radius-md);overflow:hidden;border:2px solid var(--border-subtle);margin:0 auto;">
                <img src="${opt.imageData}" style="width:100%;height:100%;object-fit:cover;">
              </div>
              <div style="font-size:10px;color:var(--text-muted);margin-top:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:80px;">${escapeHtml(opt.actorName)}</div>
            </div>
          `).join('')}
          <div class="portrait-option upload-new" style="cursor:pointer;text-align:center;">
            <div style="width:80px;height:100px;border-radius:var(--radius-md);border:2px dashed var(--border-subtle);display:flex;align-items:center;justify-content:center;margin:0 auto;">
              <span style="font-size:11px;color:var(--text-muted);">+ Upload</span>
            </div>
          </div>
        </div>
        <input type="file" id="upload-portrait" accept="image/png,image/jpeg,image/webp" style="display:none;">
        <div style="display:flex;gap:12px;justify-content:flex-end;margin-top:16px;">
          <button class="btn btn-ghost" id="modal-cancel">Cancel</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    const fileInput = modal.querySelector('#upload-portrait');
    modal.querySelector('#modal-cancel').onclick = () => modal.remove();
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };

    // Actor portrait selection
    modal.querySelectorAll('.portrait-option:not(.upload-new)').forEach(opt => {
      opt.onclick = (e) => {
        e.stopPropagation();
        const idx = parseInt(opt.dataset.index);
        modal.remove();
        onSelect(imageOptions[idx].imageData);
      };
      opt.onmouseenter = () => opt.querySelector('div').style.borderColor = 'var(--accent-primary)';
      opt.onmouseleave = () => opt.querySelector('div').style.borderColor = 'var(--border-subtle)';
    });

    // Upload new option
    modal.querySelector('.upload-new').onclick = (e) => {
      e.stopPropagation();
      fileInput.click();
    };

    fileInput.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        modal.remove();
        onSelect(ev.target.result);
      };
      reader.readAsDataURL(file);
    };
  }

  // --- Build Character Card Data Object ---
  function buildCardData(state, mode, personality, scenario, examples, firstMessage) {
    const charState = state.character;
    const isEnsemble = mode === 'ensemble';
    const modeState = isEnsemble ? charState.ensemble : charState.solo;

    // Determine character name (use override if set, otherwise synthesize from actors)
    let name = modeState.characterName || '';
    if (!name) {
      if (isEnsemble) {
        const actors = charState.ensemble.selectedActorIds
          .map(id => state.nodes?.actors?.items?.[id])
          .filter(Boolean);
        name = actors.length > 1
          ? actors.map(a => a.name || 'Unnamed').join(' & ')
          : (actors[0]?.name || 'Ensemble');
      } else {
        const actor = state.nodes?.actors?.items?.[charState.solo.selectedActorId];
        name = actor?.name || 'Character';
      }
    }

    // Build standard V2 card format
    return {
      spec: 'chara_card_v2',
      spec_version: '2.0',
      data: {
        name: name,
        description: personality,
        personality: '',
        scenario: scenario,
        first_mes: firstMessage,
        mes_example: examples,
        creator_notes: `Generated by Anansi (${isEnsemble ? 'Ensemble' : 'Solo'} Mode)`,
        system_prompt: '',
        post_history_instructions: '',
        alternate_greetings: [],
        tags: [],
        creator: state.meta?.author || 'Anansi',
        character_version: '1.0',
        extensions: {}
      }
    };
  }

  // --- Compilation (Snapshot for Simulator) ---
  function compileCharacter(state) {
    if (!state.character) return;

    // Ensure structure
    updateCharacterState(state); // Ensure extensions/overrides exist via ensureCharacterState alias or logic

    const charState = state.character;
    const mode = charState.activeMode || 'solo';
    const actors = state.nodes?.actors?.items ? Object.values(state.nodes.actors.items) : [];

    // Define helper to get data based on mode
    let name, personality, scenario, examples, firstMessage;

    if (mode === 'solo') {
      const solo = charState.solo;
      const selectedActor = solo.selectedActorId ? state.nodes?.actors?.items?.[solo.selectedActorId] : null;

      const getSynthOrOverride = (field, synthFn) => {
        if (solo.overrides[field].dirty && solo.overrides[field].content !== null) {
          return solo.overrides[field].content;
        }
        return selectedActor ? synthFn() : '';
      };

      name = solo.characterName || (selectedActor?.name) || 'Unknown';
      personality = getSynthOrOverride('personality', () => synthesizePersonality([solo.selectedActorId], state));
      scenario = getSynthOrOverride('scenario', () => selectedActor?.scenario || selectedActor?.cardFields?.scenario || '');
      examples = getSynthOrOverride('exampleDialogue', () => selectedActor?.exampleDialogue || selectedActor?.examples || selectedActor?.cardFields?.mes_example || '');

      const fmOptions = solo.selectedActorId ? getFirstMessageOptions([solo.selectedActorId], state) : [];
      const currentFmIndex = Math.min(solo.firstMessageIndex, fmOptions.length - 1);
      firstMessage = solo.overrides.firstMessage.dirty
        ? solo.overrides.firstMessage.content
        : (fmOptions[currentFmIndex]?.content || '');

    } else {
      // Ensemble
      const ens = charState.ensemble;
      const selectedIds = ens.selectedActorIds || [];

      const getSynthOrOverride = (field, synthFn) => {
        if (ens.overrides[field].dirty && ens.overrides[field].content !== null) {
          return ens.overrides[field].content;
        }
        return selectedIds.length ? synthFn() : '';
      };

      name = ens.characterName || 'Group';
      personality = getSynthOrOverride('personality', () => synthesizePersonality(selectedIds, state));
      scenario = getSynthOrOverride('scenario', () => synthesizeScenario(selectedIds, state, ens.options));
      examples = getSynthOrOverride('exampleDialogue', () => synthesizeExamples(selectedIds, state));

      const fmOptions = getFirstMessageOptions(selectedIds, state);
      const currentFmIndex = Math.min(ens.firstMessageIndex, fmOptions.length - 1);
      firstMessage = ens.overrides.firstMessage.dirty
        ? ens.overrides.firstMessage.content
        : (fmOptions[currentFmIndex]?.content || '');
    }

    // Write to compiled state
    state.character.compiled = {
      name,
      personality,
      scenario,
      examples, // mapped to example_dialogue usually?
      firstMessage,
      mode,
      compiledAt: new Date().toISOString()
    };
  }

  // Define update helper to use ensureCharacterState
  const updateCharacterState = ensureCharacterState;

  // Expose compile/sync for external use if needed?
  // Ideally, Simulator just reads state.character.compiled.
  // We should call compileCharacter whenever we modify character2 state.

  // --- Export Card as PNG ---
  async function exportCardAsPng(state, mode, personality, scenario, examples, firstMessage, portraitData) {
    try {
      const cardData = buildCardData(state, mode, personality, scenario, examples, firstMessage);

      // Convert data URL to blob
      const response = await fetch(portraitData);
      const blob = await response.blob();

      // Embed card data into PNG
      if (!A.CardEncoder?.embed) {
        throw new Error('Card encoder not available');
      }

      const cardPng = await A.CardEncoder.embed(blob, cardData);

      // Download
      const url = URL.createObjectURL(cardPng);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${cardData.data.name.replace(/[^a-z0-9]/gi, '_')}_card.png`;
      a.click();
      URL.revokeObjectURL(url);

      if (A.UI?.Toast) A.UI.Toast.show(`Exported: ${cardData.data.name}`, 'success');
    } catch (err) {
      console.error('[Character2] Export error:', err);
      if (A.UI?.Toast) A.UI.Toast.show('Export failed: ' + err.message, 'error');
    }
  }


  // --- Main Render Function ---

  function render(container) {
    const state = A.State.get();
    if (!state) {
      container.innerHTML = '<div class="empty-state" style="padding:2em;text-align:center;color:var(--text-muted);">No project loaded.</div>';
      return;
    }

    const charState = ensureCharacterState(state);

    // Always compile on render to ensure Simulator has latest data even if no edits made
    compileCharacter(state);

    container.style.height = '100%';
    container.style.overflowY = 'auto';

    // Build actor list for selector
    const actors = state.nodes?.actors?.items ? Object.values(state.nodes.actors.items) : [];
    const enabledActors = actors.filter(a => a.enabled !== false);

    // Render based on active mode
    if (charState.activeMode === 'solo') {
      renderSoloMode(container, state, charState, enabledActors);
    } else {
      renderEnsembleMode(container, state, charState, enabledActors);
    }

    // --- Keyboard Shortcuts ---
    const handleKeydown = (e) => {
      // Only handle if this panel is visible
      if (!container.isConnected || container.offsetParent === null) {
        document.removeEventListener('keydown', handleKeydown);
        return;
      }

      // Ctrl+S: Save project
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        if (A.State?.save) {
          A.State.save();
          if (A.UI?.Toast) A.UI.Toast.show('Project saved', 'success');
        }
      }

      // Ctrl+E: Export PNG
      if (e.ctrlKey && e.key === 'e') {
        e.preventDefault();
        const exportBtn = container.querySelector('#export-png');
        if (exportBtn) exportBtn.click();
      }
    };

    // Clean up old listener if re-rendering
    if (container._keydownHandler) {
      document.removeEventListener('keydown', container._keydownHandler);
    }
    container._keydownHandler = handleKeydown;
    document.addEventListener('keydown', handleKeydown);
  }

  // --- Solo Mode ---

  function renderSoloMode(container, state, charState, enabledActors) {
    const solo = charState.solo;
    const selectedActor = solo.selectedActorId
      ? state.nodes?.actors?.items?.[solo.selectedActorId]
      : null;

    // Get synthesized content (or use override if dirty)
    const getSynthOrOverride = (field, synthFn) => {
      if (solo.overrides[field].dirty && solo.overrides[field].content !== null) {
        return solo.overrides[field].content;
      }
      return selectedActor ? synthFn() : '';
    };

    const personalityContent = getSynthOrOverride('personality', () =>
      synthesizePersonality([solo.selectedActorId], state));
    const scenarioContent = getSynthOrOverride('scenario', () =>
      selectedActor?.scenario || selectedActor?.cardFields?.scenario || selectedActor?.imported?.scenario || '');
    const examplesContent = getSynthOrOverride('exampleDialogue', () =>
      selectedActor?.exampleDialogue || selectedActor?.examples || selectedActor?.cardFields?.mes_example || selectedActor?.imported?.examples || '');

    // First message options
    const fmOptions = solo.selectedActorId
      ? getFirstMessageOptions([solo.selectedActorId], state)
      : [{ label: 'Custom', content: '', isCustom: true }];

    const currentFmIndex = Math.min(solo.firstMessageIndex, fmOptions.length - 1);
    const currentFm = solo.overrides.firstMessage.dirty
      ? solo.overrides.firstMessage.content
      : fmOptions[currentFmIndex]?.content || '';

    container.innerHTML = `
      <div style="max-width:900px;margin:0 auto;padding-bottom:var(--space-6);">
        <div class="panel-header" style="margin-bottom:var(--space-4);">
          <div>
            <h2 class="panel-title">Character</h2>
            <div class="panel-subtitle">Synthesize data from Actors into Character Card format.</div>
          </div>
        </div>

        <!-- Mode Tabs -->
        <div class="card" style="margin-bottom:var(--space-4);">
          <div class="card-body" style="padding:8px;">
            <div style="display:flex;gap:8px;">
              <button class="btn btn-primary" id="tab-solo" style="flex:1;">Solo Mode</button>
              <button class="btn btn-ghost" id="tab-ensemble" style="flex:1;">Ensemble Mode</button>
            </div>
          </div>
        </div>

        <!-- Profile Image -->
        <div class="card" style="margin-bottom:var(--space-4);">
          <div class="card-header"><strong>Profile Image</strong></div>
          <div class="card-body" style="display:flex;gap:var(--space-4);align-items:flex-start;">
            <div id="portrait-preview" style="
              width:150px;
              height:200px;
              background:var(--bg-inset);
              border:2px dashed var(--border-subtle);
              border-radius:var(--radius-md);
              display:flex;
              align-items:center;
              justify-content:center;
              overflow:hidden;
              flex-shrink:0;
            ">
              ${solo.portrait?.data
        ? `<img src="${solo.portrait.data}" style="width:100%;height:100%;object-fit:cover;">`
        : `<span style="color:var(--text-muted);font-size:11px;text-align:center;padding:8px;">No image</span>`
      }
            </div>
            <div style="display:flex;flex-direction:column;gap:8px;">
              <input type="file" id="portrait-input" accept="image/png,image/jpeg,image/webp" style="display:none;">
              <button class="btn btn-sm" id="btn-upload-portrait">📷 Upload Portrait</button>
              <button class="btn btn-ghost btn-sm" id="btn-remove-portrait" ${!solo.portrait?.data ? 'disabled' : ''}>🗑️ Remove</button>
              <div style="font-size:10px;color:var(--text-muted);max-width:150px;">
                PNG, JPG, or WebP. Max 500KB recommended.
              </div>
            </div>
          </div>
        </div>

        <!-- Character Name & Chat Name -->
        <div class="card" style="margin-bottom:var(--space-4);">
          <div class="card-body">
            <div class="form-group" style="margin-bottom:16px;">
              <label class="label" style="font-size:11px;font-weight:bold;color:var(--text-muted);text-transform:uppercase;">Character Name</label>
              <input type="text" id="char-name" class="input" placeholder="The character's full name" value="${escapeHtml(solo.characterName || selectedActor?.name || '')}">
              <div style="font-size:11px;color:var(--text-muted);margin-top:4px;">The character's full name.</div>
            </div>
            <div class="form-group">
              <label class="label" style="font-size:11px;font-weight:bold;color:var(--text-muted);text-transform:uppercase;">Chat Name</label>
              <input type="text" id="chat-name" class="input" placeholder="Name used in chat messages" value="${escapeHtml(solo.chatName || '')}">
              <div style="font-size:11px;color:var(--text-muted);margin-top:4px;">The name that appears in chat (e.g. "Anansi:" in messages).</div>
            </div>
          </div>
        </div>

        <!-- Actor Selector -->
        <div class="card" style="margin-bottom:var(--space-4);">
          <div class="card-header"><strong>Select Actor</strong></div>
          <div class="card-body">
            ${enabledActors.length === 0 ? `
              <div style="text-align:center;padding:20px;color:var(--text-muted);">
                <p>No actors defined yet.</p>
                <button class="btn btn-secondary" id="btn-goto-actors">Create First Actor →</button>
              </div>
            ` : `
              <select class="input" id="actor-select" style="width:100%;">
                <option value="">-- Select an Actor --</option>
                ${enabledActors.map(a => `
                  <option value="${a.id}" ${solo.selectedActorId === a.id ? 'selected' : ''}>
                    ${escapeHtml(a.name || 'Unnamed Actor')}
                  </option>
                `).join('')}
              </select>
            `}
          </div>
        </div>

        ${solo.selectedActorId ? `
          <!-- Personality Field -->
          <div class="card" style="margin-bottom:var(--space-4);">
            <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;">
              <strong>Personality</strong>
              <div style="display:flex;gap:8px;align-items:center;">
                <button class="btn btn-ghost btn-sm" id="pub-personality" title="Publish to Vault">📤 Publish</button>
                <button class="btn btn-ghost btn-sm" id="reset-personality" title="Reset from Actor">↺ Reset</button>
                <span class="status-badge ${solo.overrides.personality.dirty ? 'edited' : 'synced'}" 
                      style="font-size:10px;padding:2px 8px;border-radius:10px;background:${solo.overrides.personality.dirty ? 'var(--status-warning)' : 'var(--status-success)'};color:white;">
                  ${solo.overrides.personality.dirty ? 'Edited' : 'Synced'}
                </span>
              </div>
            </div>
            <div class="card-body">
              <textarea class="input field-editor" id="field-personality" data-field="personality" 
                        style="height:200px;resize:vertical;font-family:var(--font-mono);font-size:13px;"
                        placeholder="Character personality description...">${escapeHtml(personalityContent)}</textarea>
            </div>
          </div>

          <!-- Scenario Field -->
          <div class="card" style="margin-bottom:var(--space-4);">
            <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;">
              <strong>Scenario</strong>
              <div style="display:flex;gap:8px;align-items:center;">
                <button class="btn btn-ghost btn-sm" id="pub-scenario" title="Publish to Vault">📤 Publish</button>
                <button class="btn btn-ghost btn-sm" id="reset-scenario" title="Reset from Actor">↺ Reset</button>
                <span class="status-badge ${solo.overrides.scenario.dirty ? 'edited' : 'synced'}"
                      style="font-size:10px;padding:2px 8px;border-radius:10px;background:${solo.overrides.scenario.dirty ? 'var(--status-warning)' : 'var(--status-success)'};color:white;">
                  ${solo.overrides.scenario.dirty ? 'Edited' : 'Synced'}
                </span>
              </div>
            </div>
            <div class="card-body">
              <textarea class="input field-editor" id="field-scenario" data-field="scenario" 
                        style="height:120px;resize:vertical;font-family:var(--font-mono);font-size:13px;"
                        placeholder="Scene context or setup...">${escapeHtml(scenarioContent)}</textarea>
            </div>
          </div>

          <!-- Example Dialogue Field -->
          <div class="card" style="margin-bottom:var(--space-4);">
            <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;">
              <strong>Example Dialogue</strong>
              <div style="display:flex;gap:8px;align-items:center;">
                <button class="btn btn-ghost btn-sm" id="pub-examples" title="Publish to Vault">📤 Publish</button>
                <button class="btn btn-ghost btn-sm" id="reset-exampleDialogue" title="Reset from Actor">↺ Reset</button>
                <span class="status-badge ${solo.overrides.exampleDialogue.dirty ? 'edited' : 'synced'}"
                      style="font-size:10px;padding:2px 8px;border-radius:10px;background:${solo.overrides.exampleDialogue.dirty ? 'var(--status-warning)' : 'var(--status-success)'};color:white;">
                  ${solo.overrides.exampleDialogue.dirty ? 'Edited' : 'Synced'}
                </span>
              </div>
            </div>
            <div class="card-body">
              <textarea class="input field-editor" id="field-exampleDialogue" data-field="exampleDialogue" 
                        style="height:150px;resize:vertical;font-family:var(--font-mono);font-size:13px;"
                        placeholder="<START>\\nUser: Hello.\\n{{char}}: Hi there!">${escapeHtml(examplesContent)}</textarea>
            </div>
          </div>

          <!-- First Message Carousel -->
          <div class="card" style="margin-bottom:var(--space-4);">
            <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;">
              <strong>First Message</strong>
              <div style="display:flex;gap:8px;align-items:center;">
                <button class="btn btn-ghost btn-sm" id="pub-firstmsg" title="Publish to Vault">📤 Publish</button>
                <button class="btn btn-ghost btn-sm" id="fm-prev" ${currentFmIndex === 0 ? 'disabled' : ''}>◀</button>
                <span style="font-size:12px;color:var(--text-secondary);">
                  <strong>${fmOptions[currentFmIndex]?.label || 'Custom'}</strong> 
                  ${fmOptions[currentFmIndex]?.count || ''} 
                  <span style="opacity:0.6;margin-left:4px;">[${currentFmIndex + 1}/${fmOptions.length}]</span>
                </span>
                <button class="btn btn-ghost btn-sm" id="fm-next" ${currentFmIndex >= fmOptions.length - 1 ? 'disabled' : ''}>▶</button>
                <span class="status-badge ${solo.overrides.firstMessage.dirty ? 'edited' : 'synced'}"
                      style="font-size:10px;padding:2px 8px;border-radius:10px;background:${solo.overrides.firstMessage.dirty ? 'var(--status-warning)' : 'var(--status-success)'};color:white;">
                  ${solo.overrides.firstMessage.dirty ? 'Edited' : 'Synced'}
                </span>
              </div>
            </div>
            <div class="card-body">
              <textarea class="input field-editor" id="field-firstMessage" data-field="firstMessage" 
                        style="height:120px;resize:vertical;font-family:var(--font-mono);font-size:13px;"
                        placeholder="The character's opening message...">${escapeHtml(currentFm)}</textarea>
              ${fmOptions[currentFmIndex]?.isCustom ? `
                <div style="margin-top:12px;padding:12px;background:var(--bg-inset);border-radius:var(--radius-md);">
                  <label style="font-size:11px;color:var(--text-muted);display:block;margin-bottom:4px;">Generate with AI (optional guidance):</label>
                  <div style="display:flex;gap:8px;">
                    <input type="text" class="input" id="fm-guidance" placeholder="e.g., Start with a question" style="flex:1;">
                    <button class="btn btn-secondary" id="btn-generate-fm">🪄 Generate</button>
                  </div>
                </div>
              ` : ''}
            </div>
          </div>

          <!-- Preview Pane (Collapsible) -->
          <div class="card" style="margin-bottom:var(--space-4);">
            <div class="card-header" style="cursor:pointer;" id="preview-toggle">
              <strong>▶ Preview as Card</strong>
              <span style="font-size:11px;color:var(--text-muted);margin-left:8px;">(click to expand)</span>
            </div>
            <div class="card-body" id="preview-content" style="display:none;max-height:300px;overflow-y:auto;background:var(--bg-inset);font-family:var(--font-mono);font-size:12px;white-space:pre-wrap;">
            </div>
          </div>

          <!-- Export Bar -->
          <div class="card">
            <div class="card-body" style="display:flex;gap:8px;flex-wrap:wrap;">
              <button class="btn btn-ghost" id="copy-personality">📋 Copy Personality</button>
              <button class="btn btn-ghost" id="copy-scenario">📋 Copy Scenario</button>
              <button class="btn btn-ghost" id="copy-all">📋 Copy All Fields</button>
              <button class="btn btn-primary" id="export-png">📤 Export PNG Card</button>
            </div>
          </div>
        ` : ''}
      </div>
    `;

    // --- Event Bindings ---

    // Mode tabs
    container.querySelector('#tab-solo')?.classList.add('btn-primary');
    container.querySelector('#tab-ensemble')?.addEventListener('click', () => {
      charState.activeMode = 'ensemble';
      A.State.notify();
      render(container);
    });

    // Go to Actors button
    container.querySelector('#btn-goto-actors')?.addEventListener('click', () => {
      if (A.UI?.switchPanel) A.UI.switchPanel('actors');
    });

    // Actor selector
    const actorSelect = container.querySelector('#actor-select');
    if (actorSelect) {
      actorSelect.onchange = (e) => {
        const newId = e.target.value || null;
        const anyDirty = Object.values(solo.overrides).some(o => o.dirty);

        if (anyDirty && solo.selectedActorId) {
          showConfirmDialog(
            'Unsaved Edits',
            'Switching Actors will replace all fields with the new Actor\'s data. Your current edits will be lost.',
            () => {
              // Reset all overrides
              Object.keys(solo.overrides).forEach(k => {
                solo.overrides[k] = { content: null, dirty: false };
              });
              solo.selectedActorId = newId;
              solo.firstMessageIndex = 0;
              A.State.notify();
              render(container);
            }
          );
        } else {
          solo.selectedActorId = newId;
          solo.firstMessageIndex = 0;
          A.State.notify();
          render(container);
        }
      };
    }

    // Portrait upload/remove
    const portraitInput = container.querySelector('#portrait-input');
    const btnUpload = container.querySelector('#btn-upload-portrait');
    const btnRemove = container.querySelector('#btn-remove-portrait');

    if (btnUpload && portraitInput) {
      btnUpload.onclick = () => portraitInput.click();
      portraitInput.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          solo.portrait = { data: ev.target.result, mimeType: file.type };
          A.State.notify();
          render(container);
        };
        reader.readAsDataURL(file);
      };
    }

    if (btnRemove) {
      btnRemove.onclick = () => {
        solo.portrait = null;
        A.State.notify();
        render(container);
      };
    }

    // Publish Handlers
    const bindPublish = (id, subtype, content, defaultName) => {
      const btn = container.querySelector(id);
      if (btn) {
        btn.onclick = () => {
          if (A.VaultUI?.showPublishDialog) {
            A.VaultUI.showPublishDialog({
              type: 'scenario-block',
              subtype: subtype,
              title: 'Publish ' + subtype,
              payload: { content: content },
              defaultName: defaultName || (solo.characterName || 'Character') + ' - ' + subtype,
              contentPreview: content,
              onSuccess: () => { if (A.UI.Toast) A.UI.Toast.show('Published ' + subtype, 'success'); }
            });
          }
        };
      }
    };

    bindPublish('#pub-personality', 'personality', personalityContent);
    bindPublish('#pub-scenario', 'scenario', scenarioContent);
    bindPublish('#pub-examples', 'examples', examplesContent);
    bindPublish('#pub-firstmsg', 'first_message', currentFm);

    // Character Name and Chat Name
    const charNameInput = container.querySelector('#char-name');
    const chatNameInput = container.querySelector('#chat-name');

    if (charNameInput) {
      charNameInput.oninput = (e) => {
        solo.characterName = e.target.value;
        compileCharacter(state); // Update compiled state
        A.State.notify();
      };
    }

    if (chatNameInput) {
      chatNameInput.oninput = (e) => {
        solo.chatName = e.target.value;
        compileCharacter(state); // Update compiled state
        A.State.notify();
      };
    }

    // Field editors
    container.querySelectorAll('.field-editor').forEach(textarea => {
      const field = textarea.dataset.field;

      textarea.oninput = () => {
        solo.overrides[field] = {
          content: textarea.value,
          dirty: true
        };
        // Update status badge
        const badge = textarea.closest('.card').querySelector('.status-badge');
        if (badge) {
          badge.textContent = 'Edited';
          badge.style.background = 'var(--status-warning)';
        }
        compileCharacter(state); // Update compiled state
        A.State.notify();
      };

      // Add token counter
      if (A.Utils?.addTokenCounter) {
        const label = textarea.closest('.card')?.querySelector('strong');
        if (label) A.Utils.addTokenCounter(textarea, label);
      }
    });

    // Reset buttons
    ['personality', 'scenario', 'exampleDialogue'].forEach(field => {
      const btn = container.querySelector(`#reset-${field}`);
      if (btn) {
        btn.onclick = () => {
          if (!solo.overrides[field].dirty) return;
          showConfirmDialog(
            `Reset ${field.charAt(0).toUpperCase() + field.slice(1)}?`,
            'This will replace your edits with the synthesized content from the selected Actor.',
            () => {
              solo.overrides[field] = { content: null, dirty: false };
              A.State.notify();
              render(container);
            }
          );
        };
      }
    });

    // First message carousel navigation
    const fmPrev = container.querySelector('#fm-prev');
    const fmNext = container.querySelector('#fm-next');

    if (fmPrev) {
      fmPrev.onclick = () => {
        if (solo.firstMessageIndex > 0) {
          solo.overrides.firstMessage = { content: null, dirty: false };
          solo.firstMessageIndex--;
          A.State.notify();
          render(container);
        }
      };
    }

    if (fmNext) {
      fmNext.onclick = () => {
        if (solo.firstMessageIndex < fmOptions.length - 1) {
          solo.overrides.firstMessage = { content: null, dirty: false };
          solo.firstMessageIndex++;
          A.State.notify();
          render(container);
        }
      };
    }

    // Generate first message with Magic Wand
    const btnGenerateFm = container.querySelector('#btn-generate-fm');
    const fmGuidance = container.querySelector('#fm-guidance');
    if (btnGenerateFm && fmGuidance) {
      btnGenerateFm.onclick = async () => {
        const guidance = fmGuidance.value.trim();
        const actor = state.nodes?.actors?.items?.[solo.selectedActorId];
        if (!actor) return;

        const systemPrompt = `You are writing an opening message for a roleplay character.
Character: ${actor.name || 'Unknown'}
Personality: ${actor.personality || 'Not specified'}
${guidance ? `User guidance: ${guidance}` : ''}

Write an engaging, in-character opening message. Use *actions* for physical descriptions and regular text for dialogue.`;

        if (A.LLM?.generate) {
          btnGenerateFm.disabled = true;
          btnGenerateFm.textContent = '⏳ Generating...';
          try {
            const result = await A.LLM.generate(systemPrompt, 'Write the opening message.');
            if (result) {
              const fmTextarea = container.querySelector('#field-firstMessage');
              if (fmTextarea) {
                fmTextarea.value = result;
                solo.overrides.firstMessage = { content: result, dirty: true };
                A.State.notify();
              }
            }
          } catch (err) {
            if (A.UI?.Toast) A.UI.Toast.show('Generation failed: ' + err.message, 'error');
          } finally {
            btnGenerateFm.disabled = false;
            btnGenerateFm.textContent = '🪄 Generate';
          }
        } else {
          if (A.UI?.Toast) A.UI.Toast.show('LLM not configured', 'warning');
        }
      };
    }

    // Preview Pane toggle
    const previewToggle = container.querySelector('#preview-toggle');
    const previewContent = container.querySelector('#preview-content');
    if (previewToggle && previewContent) {
      previewToggle.onclick = () => {
        const isHidden = previewContent.style.display === 'none';
        previewContent.style.display = isHidden ? 'block' : 'none';
        previewToggle.querySelector('strong').textContent = isHidden ? '▼ Preview as Card' : '▶ Preview as Card';
        previewToggle.querySelector('span').textContent = isHidden ? '(click to collapse)' : '(click to expand)';

        if (isHidden) {
          // Generate preview content
          const personality = container.querySelector('#field-personality')?.value || '';
          const scenario = container.querySelector('#field-scenario')?.value || '';
          const examples = container.querySelector('#field-exampleDialogue')?.value || '';
          const firstMsg = container.querySelector('#field-firstMessage')?.value || '';
          const actor = state.nodes?.actors?.items?.[solo.selectedActorId];

          previewContent.textContent = `═══════════════════════════════
CHARACTER CARD PREVIEW
═══════════════════════════════

Name: ${actor?.name || 'Character'}

═══ PERSONALITY ═══
${personality || '(empty)'}

═══ SCENARIO ═══
${scenario || '(empty)'}

═══ EXAMPLE DIALOGUE ═══
${examples || '(empty)'}

═══ FIRST MESSAGE ═══
${firstMsg || '(empty)'}
`;
        }
      };
    }

    // Copy buttons
    container.querySelector('#copy-personality')?.addEventListener('click', () => {
      const content = container.querySelector('#field-personality')?.value || '';
      navigator.clipboard.writeText(content);
      if (A.UI?.Toast) A.UI.Toast.show('Personality copied!', 'success');
    });

    container.querySelector('#copy-scenario')?.addEventListener('click', () => {
      const content = container.querySelector('#field-scenario')?.value || '';
      navigator.clipboard.writeText(content);
      if (A.UI?.Toast) A.UI.Toast.show('Scenario copied!', 'success');
    });

    container.querySelector('#copy-all')?.addEventListener('click', () => {
      const personality = container.querySelector('#field-personality')?.value || '';
      const scenario = container.querySelector('#field-scenario')?.value || '';
      const examples = container.querySelector('#field-exampleDialogue')?.value || '';
      const firstMsg = container.querySelector('#field-firstMessage')?.value || '';

      const combined = `## Personality\n${personality}\n\n## Scenario\n${scenario}\n\n## Example Dialogue\n${examples}\n\n## First Message\n${firstMsg}`;
      navigator.clipboard.writeText(combined);
      if (A.UI?.Toast) A.UI.Toast.show('All fields copied!', 'success');
    });

    // Export PNG with portrait selection
    container.querySelector('#export-png')?.addEventListener('click', () => {
      const personality = container.querySelector('#field-personality')?.value || '';
      const scenario = container.querySelector('#field-scenario')?.value || '';
      const examples = container.querySelector('#field-exampleDialogue')?.value || '';
      const firstMsg = container.querySelector('#field-firstMessage')?.value || '';

      // Use uploaded portrait if available, otherwise show selector
      if (solo.portrait?.data) {
        exportCardAsPng(state, 'solo', personality, scenario, examples, firstMsg, solo.portrait.data);
      } else {
        showPortraitSelector(state, [solo.selectedActorId], (portraitData) => {
          exportCardAsPng(state, 'solo', personality, scenario, examples, firstMsg, portraitData);
        });
      }
    });
  }

  // --- Ensemble Mode ---

  function renderEnsembleMode(container, state, charState, enabledActors) {
    const ensemble = charState.ensemble;

    // Track pending selection (before Apply)
    const pendingSelection = ensemble._pendingSelection || [...ensemble.selectedActorIds];

    // Get synthesized content (or use override if dirty)
    const getSynthOrOverride = (field, synthFn) => {
      if (ensemble.overrides[field].dirty && ensemble.overrides[field].content !== null) {
        return ensemble.overrides[field].content;
      }
      return ensemble.selectedActorIds.length ? synthFn() : '';
    };

    const personalityContent = getSynthOrOverride('personality', () =>
      synthesizePersonality(ensemble.selectedActorIds, state));
    const scenarioContent = getSynthOrOverride('scenario', () =>
      synthesizeScenario(ensemble.selectedActorIds, state, ensemble.options));
    const examplesContent = getSynthOrOverride('exampleDialogue', () =>
      synthesizeExamples(ensemble.selectedActorIds, state));

    // First message options
    const fmOptions = ensemble.selectedActorIds.length
      ? getFirstMessageOptions(ensemble.selectedActorIds, state)
      : [{ label: 'Custom', content: '', isCustom: true }];

    const currentFmIndex = Math.min(ensemble.firstMessageIndex, fmOptions.length - 1);
    const currentFm = ensemble.overrides.firstMessage.dirty
      ? ensemble.overrides.firstMessage.content
      : fmOptions[currentFmIndex]?.content || '';

    container.innerHTML = `
      <div style="max-width:900px;margin:0 auto;padding-bottom:var(--space-6);">
        <div class="panel-header" style="margin-bottom:var(--space-4);">
          <div>
            <h2 class="panel-title">Character</h2>
            <div class="panel-subtitle">Synthesize data from Actors into Character Card format.</div>
          </div>
        </div>

        <!-- Mode Tabs -->
        <div class="card" style="margin-bottom:var(--space-4);">
          <div class="card-body" style="padding:8px;">
            <div style="display:flex;gap:8px;">
              <button class="btn btn-ghost" id="tab-solo" style="flex:1;">Solo Mode</button>
              <button class="btn btn-primary" id="tab-ensemble" style="flex:1;">Ensemble Mode</button>
            </div>
          </div>
        </div>

        <!-- Profile Image -->
        <div class="card" style="margin-bottom:var(--space-4);">
          <div class="card-header"><strong>Profile Image</strong></div>
          <div class="card-body" style="display:flex;gap:var(--space-4);align-items:flex-start;">
            <div id="portrait-preview" style="
              width:150px;
              height:200px;
              background:var(--bg-inset);
              border:2px dashed var(--border-subtle);
              border-radius:var(--radius-md);
              display:flex;
              align-items:center;
              justify-content:center;
              overflow:hidden;
              flex-shrink:0;
            ">
              ${ensemble.portrait?.data
        ? `<img src="${ensemble.portrait.data}" style="width:100%;height:100%;object-fit:cover;">`
        : `<span style="color:var(--text-muted);font-size:11px;text-align:center;padding:8px;">No image</span>`
      }
            </div>
            <div style="display:flex;flex-direction:column;gap:8px;">
              <input type="file" id="portrait-input" accept="image/png,image/jpeg,image/webp" style="display:none;">
              <button class="btn btn-sm" id="btn-upload-portrait">📷 Upload Portrait</button>
              <button class="btn btn-ghost btn-sm" id="btn-remove-portrait" ${!ensemble.portrait?.data ? 'disabled' : ''}>🗑️ Remove</button>
              <div style="font-size:10px;color:var(--text-muted);max-width:150px;">
                PNG, JPG, or WebP. Max 500KB recommended.
              </div>
            </div>
          </div>
        </div>

        <!-- Character Name & Chat Name -->
        <div class="card" style="margin-bottom:var(--space-4);">
          <div class="card-body">
            <div class="form-group" style="margin-bottom:16px;">
              <label class="label" style="font-size:11px;font-weight:bold;color:var(--text-muted);text-transform:uppercase;">Character Name</label>
              <input type="text" id="char-name" class="input" placeholder="The card's name (e.g., 'The Dream Team')" value="${escapeHtml(ensemble.characterName || '')}">
              <div style="font-size:11px;color:var(--text-muted);margin-top:4px;">The displayed name for this ensemble card.</div>
            </div>
            <div class="form-group">
              <label class="label" style="font-size:11px;font-weight:bold;color:var(--text-muted);text-transform:uppercase;">Chat Name</label>
              <input type="text" id="chat-name" class="input" placeholder="Name used in chat messages" value="${escapeHtml(ensemble.chatName || '')}">
              <div style="font-size:11px;color:var(--text-muted);margin-top:4px;">The name that appears in chat (optional for ensembles).</div>
            </div>
          </div>
        </div>

        <!-- Actor Multi-Select -->
        <div class="card" style="margin-bottom:var(--space-4);">
          <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;">
            <strong>Select Actors</strong>
            <button class="btn btn-primary btn-sm" id="btn-apply-selection">Apply Selection</button>
          </div>
          <div class="card-body">
            ${enabledActors.length === 0 ? `
              <div style="text-align:center;padding:20px;color:var(--text-muted);">
                <p>No actors defined yet.</p>
                <button class="btn btn-secondary" id="btn-goto-actors">Create First Actor →</button>
              </div>
            ` : `
              <div style="display:flex;flex-wrap:wrap;gap:12px;">
                ${enabledActors.map(a => `
                  <label style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:var(--bg-inset);border-radius:var(--radius-md);cursor:pointer;border:1px solid ${pendingSelection.includes(a.id) ? 'var(--accent-primary)' : 'var(--border-subtle)'};">
                    <input type="checkbox" class="actor-checkbox" data-id="${a.id}" 
                           ${pendingSelection.includes(a.id) ? 'checked' : ''}>
                    <span style="font-size:13px;">${escapeHtml(a.name || 'Unnamed')}</span>
                  </label>
                `).join('')}
              </div>
              <div style="margin-top:12px;font-size:11px;color:var(--text-muted);">
                Selected: ${pendingSelection.length} actor(s)
              </div>
            `}
          </div>
        </div>

        <!-- Options -->
        <div class="card" style="margin-bottom:var(--space-4);">
          <div class="card-header"><strong>Synthesis Options</strong></div>
          <div class="card-body" style="display:flex;gap:16px;flex-wrap:wrap;">
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer;">
              <input type="checkbox" id="opt-narrator" ${ensemble.options.includeNarrator ? 'checked' : ''}>
              <span style="font-size:13px;">Include Narrator Instructions</span>
            </label>
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer;">
              <input type="checkbox" id="opt-mood" ${ensemble.options.includeMoodTags ? 'checked' : ''}>
              <span style="font-size:13px;">Include Mood Tags</span>
            </label>
          </div>
        </div>

        ${ensemble.selectedActorIds.length ? `
          <!-- Personality Field -->
          <div class="card" style="margin-bottom:var(--space-4);">
            <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;">
              <strong>Personality</strong>
              <div style="display:flex;gap:8px;align-items:center;">
                <button class="btn btn-ghost btn-sm btn-vault-publish" data-field="personality" title="Save to Vault" style="margin-right:4px;">📤</button>
                <button class="btn btn-ghost btn-sm btn-vault-import" data-field="personality" title="Import from Vault" style="margin-right:4px;">📥</button>
                <button class="btn btn-ghost btn-sm" id="reset-personality" title="Reset from Actors">↺ Reset</button>
                <span class="status-badge ${ensemble.overrides.personality.dirty ? 'edited' : 'synced'}" 
                      style="font-size:10px;padding:2px 8px;border-radius:10px;background:${ensemble.overrides.personality.dirty ? 'var(--status-warning)' : 'var(--status-success)'};color:white;">
                  ${ensemble.overrides.personality.dirty ? 'Edited' : 'Synced'}
                </span>
              </div>
            </div>
            <div class="card-body">
              <textarea class="input field-editor" id="field-personality" data-field="personality" 
                        style="height:250px;resize:vertical;font-family:var(--font-mono);font-size:13px;"
                        placeholder="Combined character profiles...">${escapeHtml(personalityContent)}</textarea>
            </div>
          </div>

          <!-- Scenario Field -->
          <div class="card" style="margin-bottom:var(--space-4);">
            <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;">
              <strong>Scenario</strong>
              <div style="display:flex;gap:8px;align-items:center;">
                <button class="btn btn-ghost btn-sm btn-vault-publish" data-field="scenario" title="Save to Vault" style="margin-right:4px;">📤</button>
                <button class="btn btn-ghost btn-sm btn-vault-import" data-field="scenario" title="Import from Vault" style="margin-right:4px;">📥</button>
                <button class="btn btn-ghost btn-sm" id="reset-scenario" title="Reset from Actors">↺ Reset</button>
                <span class="status-badge ${ensemble.overrides.scenario.dirty ? 'edited' : 'synced'}"
                      style="font-size:10px;padding:2px 8px;border-radius:10px;background:${ensemble.overrides.scenario.dirty ? 'var(--status-warning)' : 'var(--status-success)'};color:white;">
                  ${ensemble.overrides.scenario.dirty ? 'Edited' : 'Synced'}
                </span>
              </div>
            </div>
            <div class="card-body">
              <textarea class="input field-editor" id="field-scenario" data-field="scenario" 
                        style="height:200px;resize:vertical;font-family:var(--font-mono);font-size:13px;"
                        placeholder="Multi-character system prompt...">${escapeHtml(scenarioContent)}</textarea>
            </div>
          </div>

          <!-- Example Dialogue Field -->
          <div class="card" style="margin-bottom:var(--space-4);">
            <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;">
              <strong>Example Dialogue</strong>
              <div style="display:flex;gap:8px;align-items:center;">
                <button class="btn btn-ghost btn-sm btn-vault-publish" data-field="exampleDialogue" title="Save to Vault" style="margin-right:4px;">📤</button>
                <button class="btn btn-ghost btn-sm btn-vault-import" data-field="exampleDialogue" title="Import from Vault" style="margin-right:4px;">📥</button>
                <button class="btn btn-ghost btn-sm" id="reset-exampleDialogue" title="Reset from Actors">↺ Reset</button>
                <span class="status-badge ${ensemble.overrides.exampleDialogue.dirty ? 'edited' : 'synced'}"
                      style="font-size:10px;padding:2px 8px;border-radius:10px;background:${ensemble.overrides.exampleDialogue.dirty ? 'var(--status-warning)' : 'var(--status-success)'};color:white;">
                  ${ensemble.overrides.exampleDialogue.dirty ? 'Edited' : 'Synced'}
                </span>
              </div>
            </div>
            <div class="card-body">
              <textarea class="input field-editor" id="field-exampleDialogue" data-field="exampleDialogue" 
                        style="height:180px;resize:vertical;font-family:var(--font-mono);font-size:13px;"
                        placeholder="Voice samples from each actor...">${escapeHtml(examplesContent)}</textarea>
            </div>
          </div>

          <!-- First Message Carousel -->
          <div class="card" style="margin-bottom:var(--space-4);">
            <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;">
              <strong>First Message</strong>
              <div style="display:flex;gap:8px;align-items:center;">
                <button class="btn btn-ghost btn-sm" id="fm-prev" ${currentFmIndex === 0 ? 'disabled' : ''}>◀</button>
                <span style="font-size:12px;color:var(--text-secondary);">
                  <strong>${fmOptions[currentFmIndex]?.label || 'Custom'}</strong> 
                  ${fmOptions[currentFmIndex]?.count || ''} 
                  <span style="opacity:0.6;margin-left:4px;">[${currentFmIndex + 1}/${fmOptions.length}]</span>
                </span>
                <button class="btn btn-ghost btn-sm" id="fm-next" ${currentFmIndex >= fmOptions.length - 1 ? 'disabled' : ''}>▶</button>
                <span class="status-badge ${ensemble.overrides.firstMessage.dirty ? 'edited' : 'synced'}"
                      style="font-size:10px;padding:2px 8px;border-radius:10px;background:${ensemble.overrides.firstMessage.dirty ? 'var(--status-warning)' : 'var(--status-success)'};color:white;">
                  ${ensemble.overrides.firstMessage.dirty ? 'Edited' : 'Synced'}
                </span>
              </div>
            </div>
            <div class="card-body">
              <textarea class="input field-editor" id="field-firstMessage" data-field="firstMessage" 
                        style="height:150px;resize:vertical;font-family:var(--font-mono);font-size:13px;"
                        placeholder="Opening scene message...">${escapeHtml(currentFm)}</textarea>
              ${fmOptions[currentFmIndex]?.isCustom ? `
                <div style="margin-top:12px;padding:12px;background:var(--bg-inset);border-radius:var(--radius-md);">
                  <label style="font-size:11px;color:var(--text-muted);display:block;margin-bottom:4px;">Generate Combined Opening (optional guidance):</label>
                  <div style="display:flex;gap:8px;">
                    <input type="text" class="input" id="fm-guidance" placeholder="e.g., Start with tension, Elena speaks first" style="flex:1;">
                    <button class="btn btn-secondary" id="btn-generate-fm">🪄 Generate</button>
                  </div>
                </div>
              ` : ''}
            </div>
          </div>

          <!-- Preview Pane (Collapsible) -->
          <div class="card" style="margin-bottom:var(--space-4);">
            <div class="card-header" style="cursor:pointer;" id="preview-toggle">
              <strong>▶ Preview as Card</strong>
              <span style="font-size:11px;color:var(--text-muted);margin-left:8px;">(click to expand)</span>
            </div>
            <div class="card-body" id="preview-content" style="display:none;max-height:300px;overflow-y:auto;background:var(--bg-inset);font-family:var(--font-mono);font-size:12px;white-space:pre-wrap;">
            </div>
          </div>

          <!-- Export Bar -->
          <div class="card">
            <div class="card-body" style="display:flex;gap:8px;flex-wrap:wrap;">
              <button class="btn btn-ghost" id="copy-personality">📋 Copy Personality</button>
              <button class="btn btn-ghost" id="copy-scenario">📋 Copy Scenario</button>
              <button class="btn btn-ghost" id="copy-all">📋 Copy All Fields</button>
              <button class="btn btn-primary" id="export-png">📤 Export PNG Card</button>
            </div>
          </div>
        ` : `
          <div class="card">
            <div class="card-body" style="text-align:center;padding:40px;color:var(--text-muted);">
              <h3>🎭 Select Actors Above</h3>
              <p>Choose which actors to include in your ensemble, then click "Apply Selection" to generate the combined character card.</p>
            </div>
          </div>
        `}
      </div>
    `;

    // --- Event Bindings ---

    // Mode tab switching
    container.querySelector('#tab-solo')?.addEventListener('click', () => {
      charState.activeMode = 'solo';
      A.State.notify();
      render(container);
    });

    // Go to Actors button
    container.querySelector('#btn-goto-actors')?.addEventListener('click', () => {
      if (A.UI?.switchPanel) A.UI.switchPanel('actors');
    });

    // Actor checkboxes - update pending selection
    container.querySelectorAll('.actor-checkbox').forEach(cb => {
      cb.onchange = () => {
        const id = cb.dataset.id;
        if (!ensemble._pendingSelection) {
          ensemble._pendingSelection = [...ensemble.selectedActorIds];
        }
        if (cb.checked) {
          if (!ensemble._pendingSelection.includes(id)) {
            ensemble._pendingSelection.push(id);
          }
        } else {
          ensemble._pendingSelection = ensemble._pendingSelection.filter(x => x !== id);
        }
        // Update count display
        const countEl = container.querySelector('.card-body div[style*="margin-top:12px"]');
        if (countEl) {
          countEl.textContent = `Selected: ${ensemble._pendingSelection.length} actor(s)`;
        }
        // Update border styling
        cb.closest('label').style.borderColor = cb.checked ? 'var(--accent-primary)' : 'var(--border-subtle)';
      };
    });

    // Apply Selection button
    container.querySelector('#btn-apply-selection')?.addEventListener('click', () => {
      const newSelection = ensemble._pendingSelection || [...ensemble.selectedActorIds];
      const anyDirty = Object.values(ensemble.overrides).some(o => o.dirty);

      const doApply = () => {
        // Reset all overrides
        Object.keys(ensemble.overrides).forEach(k => {
          ensemble.overrides[k] = { content: null, dirty: false };
        });
        ensemble.selectedActorIds = newSelection;
        ensemble.firstMessageIndex = 0;
        delete ensemble._pendingSelection;
        A.State.notify();
        render(container);
      };

      if (anyDirty && ensemble.selectedActorIds.length) {
        showConfirmDialog(
          'Changing Actors',
          'Changing Actors will reset all fields. Any altered data will be lost.',
          doApply
        );
      } else {
        doApply();
      }
    });

    // Options toggles
    container.querySelector('#opt-narrator')?.addEventListener('change', (e) => {
      ensemble.options.includeNarrator = e.target.checked;
      if (!ensemble.overrides.scenario.dirty) {
        A.State.notify();
        render(container);
      } else {
        A.State.notify();
      }
    });

    container.querySelector('#opt-mood')?.addEventListener('change', (e) => {
      ensemble.options.includeMoodTags = e.target.checked;
      if (!ensemble.overrides.scenario.dirty) {
        A.State.notify();
        render(container);
      } else {
        A.State.notify();
      }
    });

    // Portrait upload/remove
    const portraitInput = container.querySelector('#portrait-input');
    const btnUpload = container.querySelector('#btn-upload-portrait');
    const btnRemove = container.querySelector('#btn-remove-portrait');

    if (btnUpload && portraitInput) {
      btnUpload.onclick = () => portraitInput.click();
      portraitInput.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          ensemble.portrait = { data: ev.target.result, mimeType: file.type };
          A.State.notify();
          render(container);
        };
        reader.readAsDataURL(file);
      };
    }

    if (btnRemove) {
      btnRemove.onclick = () => {
        ensemble.portrait = null;
        A.State.notify();
        render(container);
      };
    }

    // Character Name and Chat Name
    const charNameInput = container.querySelector('#char-name');
    const chatNameInput = container.querySelector('#chat-name');

    if (charNameInput) {
      charNameInput.oninput = (e) => {
        ensemble.characterName = e.target.value;
        A.State.notify();
      };
    }

    if (chatNameInput) {
      chatNameInput.oninput = (e) => {
        ensemble.chatName = e.target.value;
        A.State.notify();
      };
    }

    // Field editors
    container.querySelectorAll('.field-editor').forEach(textarea => {
      const field = textarea.dataset.field;

      textarea.oninput = () => {
        ensemble.overrides[field] = {
          content: textarea.value,
          dirty: true
        };
        const badge = textarea.closest('.card').querySelector('.status-badge');
        if (badge) {
          badge.textContent = 'Edited';
          badge.style.background = 'var(--status-warning)';
        }
        A.State.notify();
      };

      // Add token counter
      if (A.Utils?.addTokenCounter) {
        const label = textarea.closest('.card')?.querySelector('strong');
        if (label) A.Utils.addTokenCounter(textarea, label);
      }
    });

    // Reset buttons
    ['personality', 'scenario', 'exampleDialogue'].forEach(field => {
      const btn = container.querySelector(`#reset-${field}`);
      if (btn) {
        btn.onclick = () => {
          if (!ensemble.overrides[field].dirty) return;
          showConfirmDialog(
            `Reset ${field.charAt(0).toUpperCase() + field.slice(1)}?`,
            'This will replace your edits with the synthesized content from the selected Actors.',
            () => {
              ensemble.overrides[field] = { content: null, dirty: false };
              A.State.notify();
              render(container);
            }
          );
        };
      }
    });

    // First message carousel navigation
    const fmPrev = container.querySelector('#fm-prev');
    const fmNext = container.querySelector('#fm-next');

    if (fmPrev) {
      fmPrev.onclick = () => {
        if (ensemble.firstMessageIndex > 0) {
          ensemble.overrides.firstMessage = { content: null, dirty: false };
          ensemble.firstMessageIndex--;
          A.State.notify();
          render(container);
        }
      };
    }

    if (fmNext) {
      fmNext.onclick = () => {
        if (ensemble.firstMessageIndex < fmOptions.length - 1) {
          ensemble.overrides.firstMessage = { content: null, dirty: false };
          ensemble.firstMessageIndex++;
          A.State.notify();
          render(container);
        }
      };
    }

    // Generate combined first message with Magic Wand
    const btnGenerateFm = container.querySelector('#btn-generate-fm');
    const fmGuidance = container.querySelector('#fm-guidance');
    if (btnGenerateFm && fmGuidance) {
      btnGenerateFm.onclick = async () => {
        const guidance = fmGuidance.value.trim();
        const actors = ensemble.selectedActorIds
          .map(id => state.nodes?.actors?.items?.[id])
          .filter(Boolean);

        if (!actors.length) return;

        const actorSummary = actors.map(a => `${a.name}: ${a.personality || 'No personality defined'}`).join('\n');

        const systemPrompt = `You are writing a combined opening message for a multi-character roleplay scene.

ACTORS IN SCENE:
${actorSummary}

${guidance ? `USER GUIDANCE: ${guidance}` : ''}

Write an engaging opening that:
1. Sets the scene briefly
2. Has ONE character speak or act first (choose the most appropriate)
3. Uses the format: *scene description* then CharacterName: "dialogue" or *action*
4. Keeps it concise but atmospheric`;

        if (A.LLM?.generate) {
          btnGenerateFm.disabled = true;
          btnGenerateFm.textContent = '⏳ Generating...';
          try {
            const result = await A.LLM.generate(systemPrompt, 'Write the combined opening scene.');
            if (result) {
              const fmTextarea = container.querySelector('#field-firstMessage');
              if (fmTextarea) {
                fmTextarea.value = result;
                ensemble.overrides.firstMessage = { content: result, dirty: true };
                A.State.notify();
              }
            }
          } catch (err) {
            if (A.UI?.Toast) A.UI.Toast.show('Generation failed: ' + err.message, 'error');
          } finally {
            btnGenerateFm.disabled = false;
            btnGenerateFm.textContent = '🪄 Generate';
          }
        } else {
          if (A.UI?.Toast) A.UI.Toast.show('LLM not configured', 'warning');
        }
      };
    }

    // Preview Pane toggle
    const previewToggle = container.querySelector('#preview-toggle');
    const previewContent = container.querySelector('#preview-content');
    if (previewToggle && previewContent) {
      previewToggle.onclick = () => {
        const isHidden = previewContent.style.display === 'none';
        previewContent.style.display = isHidden ? 'block' : 'none';
        previewToggle.querySelector('strong').textContent = isHidden ? '▼ Preview as Card' : '▶ Preview as Card';
        previewToggle.querySelector('span').textContent = isHidden ? '(click to collapse)' : '(click to expand)';

        if (isHidden) {
          // Generate preview content
          const personality = container.querySelector('#field-personality')?.value || '';
          const scenario = container.querySelector('#field-scenario')?.value || '';
          const examples = container.querySelector('#field-exampleDialogue')?.value || '';
          const firstMsg = container.querySelector('#field-firstMessage')?.value || '';
          const actors = ensemble.selectedActorIds
            .map(id => state.nodes?.actors?.items?.[id])
            .filter(Boolean);
          const names = actors.map(a => a.name || 'Unnamed').join(' & ');

          previewContent.textContent = `═══════════════════════════════
ENSEMBLE CARD PREVIEW
═══════════════════════════════

Name: ${names}
Actors: ${actors.length}

═══ PERSONALITY ═══
${personality || '(empty)'}

═══ SCENARIO ═══
${scenario || '(empty)'}

═══ EXAMPLE DIALOGUE ═══
${examples || '(empty)'}

═══ FIRST MESSAGE ═══
${firstMsg || '(empty)'}
`;
        }
      };
    }

    // Copy buttons
    container.querySelector('#copy-personality')?.addEventListener('click', () => {
      const content = container.querySelector('#field-personality')?.value || '';
      navigator.clipboard.writeText(content);
      if (A.UI?.Toast) A.UI.Toast.show('Personality copied!', 'success');
    });

    container.querySelector('#copy-scenario')?.addEventListener('click', () => {
      const content = container.querySelector('#field-scenario')?.value || '';
      navigator.clipboard.writeText(content);
      if (A.UI?.Toast) A.UI.Toast.show('Scenario copied!', 'success');
    });

    container.querySelector('#copy-all')?.addEventListener('click', () => {
      const personality = container.querySelector('#field-personality')?.value || '';
      const scenario = container.querySelector('#field-scenario')?.value || '';
      const examples = container.querySelector('#field-exampleDialogue')?.value || '';
      const firstMsg = container.querySelector('#field-firstMessage')?.value || '';

      const combined = `## Personality\n${personality}\n\n## Scenario\n${scenario}\n\n## Example Dialogue\n${examples}\n\n## First Message\n${firstMsg}`;
      navigator.clipboard.writeText(combined);
      if (A.UI?.Toast) A.UI.Toast.show('All fields copied!', 'success');
    });

    // Export PNG with portrait selection
    container.querySelector('#export-png')?.addEventListener('click', () => {
      const personality = container.querySelector('#field-personality')?.value || '';
      const scenario = container.querySelector('#field-scenario')?.value || '';
      const examples = container.querySelector('#field-exampleDialogue')?.value || '';
      const firstMsg = container.querySelector('#field-firstMessage')?.value || '';

      // Use uploaded portrait if available, otherwise show selector
      if (ensemble.portrait?.data) {
        exportCardAsPng(state, 'ensemble', personality, scenario, examples, firstMsg, ensemble.portrait.data);
      } else {
        showPortraitSelector(state, ensemble.selectedActorIds, (portraitData) => {
          exportCardAsPng(state, 'ensemble', personality, scenario, examples, firstMsg, portraitData);
        });
      }
    });

    // Vault Publish/Import Handlers
    container.querySelectorAll('.btn-vault-publish').forEach(btn => {
      btn.onclick = () => {
        const field = btn.dataset.field;
        const textarea = container.querySelector('#field-' + field);
        if (textarea && A.VaultUI) {
          A.VaultUI.showPublishDialog({
            type: 'scenario-block',
            title: '📤 Publish to Vault',
            payload: { content: textarea.value, category: field },
            defaultName: textarea.value.slice(0, 30).split('\\n')[0],
            contentPreview: textarea.value.slice(0, 300)
          });
        }
      };
    });

    container.querySelectorAll('.btn-vault-import').forEach(btn => {
      btn.onclick = () => {
        const field = btn.dataset.field;
        if (A.VaultUI) {
          A.VaultUI.showBlockPickerDialog({
            type: 'scenario-block',
            onSelect: (data) => {
              const content = data.content || data.payload?.content || '';
              const textarea = container.querySelector('#field-' + field);
              if (textarea) {
                if (textarea.value.trim()) {
                  textarea.value = (textarea.value.trim() + '\\n\\n' + content).trim();
                } else {
                  textarea.value = content;
                }
                // Trigger input to update dirty state
                textarea.dispatchEvent(new Event('input'));
                if (A.UI.Toast) A.UI.Toast.show('Appended block from Vault', 'success');
              }
            }
          });
        }
      };
    });
  }

  // --- Panel Registration ---

  A.registerPanel('character', {
    label: 'Character',
    subtitle: 'Card Synthesis',
    category: 'Seeds',
    render: render
  });

})(window.Anansi);
