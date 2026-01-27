/*
 * Anansi Panel: Character (V2)
 * File: js/panels/character.js
 * Category: Seeds
 * Purpose: Character card synthesis from Actor data with one-way data flow.
 * Refactored: Logic moved to js/plugins/character/
 */

(function (A) {
  'use strict';

  // Ensure namespace
  A.Character = A.Character || {};
  A.Character.UI = {};

  // --- State Schema Extension ---
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

  // --- Compilation (Snapshot for Simulator) ---
  function compileCharacter(state) {
    if (!state.character) return;

    // Ensure structure
    ensureCharacterState(state);

    const charState = state.character;
    const mode = charState.activeMode || 'solo';

    // Helpers from Synth plugin (must be loaded)
    // If plugins not loaded yet, skip compilation (safe fallback)
    if (!A.Character.Synth) return;
    const Synth = A.Character.Synth;

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
      personality = getSynthOrOverride('personality', () => Synth.synthesizePersonality([solo.selectedActorId], state));
      scenario = getSynthOrOverride('scenario', () => selectedActor?.scenario || selectedActor?.cardFields?.scenario || '');
      examples = getSynthOrOverride('exampleDialogue', () => selectedActor?.exampleDialogue || selectedActor?.examples || selectedActor?.cardFields?.mes_example || '');

      const fmOptions = solo.selectedActorId ? Synth.getFirstMessageOptions([solo.selectedActorId], state) : [];
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
      personality = getSynthOrOverride('personality', () => Synth.synthesizePersonality(selectedIds, state));
      scenario = getSynthOrOverride('scenario', () => Synth.synthesizeScenario(selectedIds, state, ens.options));
      examples = getSynthOrOverride('exampleDialogue', () => Synth.synthesizeExamples(selectedIds, state));

      const fmOptions = Synth.getFirstMessageOptions(selectedIds, state);
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
      examples,
      firstMessage,
      mode,
      compiledAt: new Date().toISOString()
    };
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

    /** @type {HTMLElement} */ (modal.querySelector('#modal-cancel')).onclick = () => modal.remove();
    /** @type {HTMLElement} */ (modal.querySelector('#modal-confirm')).onclick = () => {
      modal.remove();
      onConfirm();
    };
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
  }

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

          <div style="display:flex;gap:12px;justify-content:flex-end;">
            <button class="btn btn-ghost" id="modal-cancel">Cancel</button>
            <button class="btn btn-primary" id="modal-upload">Upload Image</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      /** @type {HTMLElement} */ (modal.querySelector('#modal-cancel')).onclick = () => modal.remove();
      /** @type {HTMLElement} */ (modal.querySelector('#modal-upload')).onclick = async () => {
        try {
          const { content } = await A.IO.open({ accept: 'image/png,image/jpeg,image/webp', as: 'dataUrl' });
          if (content) {
            modal.remove();
            onSelect(content);
          }
        } catch (e) { /* ignore */ }
      };
      modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
      return;
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

        <div style="display:flex;gap:12px;justify-content:flex-end;margin-top:16px;">
          <button class="btn btn-ghost" id="modal-cancel">Cancel</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);


    /** @type {HTMLElement} */ (modal.querySelector('#modal-cancel')).onclick = () => modal.remove();
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };

    // Actor portrait selection
    modal.querySelectorAll('.portrait-option:not(.upload-new)').forEach(o => {
      const opt = /** @type {HTMLElement} */ (o);
      opt.onclick = (e) => {
        e.stopPropagation();
        const idx = parseInt(opt.dataset.index);
        modal.remove();
        onSelect(imageOptions[idx].imageData);
      };

      opt.onmouseenter = () => {
        const div = /** @type {HTMLElement} */ (opt.querySelector('div'));
        if (div) div.style.borderColor = 'var(--accent-primary)';
      };
      opt.onmouseleave = () => {
        const div = /** @type {HTMLElement} */ (opt.querySelector('div'));
        if (div) div.style.borderColor = 'var(--border-subtle)';
      };
    });

    // Upload new option
    /** @type {HTMLElement} */ (modal.querySelector('.upload-new')).onclick = async (e) => {
      e.stopPropagation();
      try {
        const { content } = await A.IO.open({ accept: 'image/png,image/jpeg,image/webp', as: 'dataUrl' });
        if (content) {
          modal.remove();
          onSelect(content);
        }
      } catch (err) { /* ignore */ }
    };
  }

  // Expose Helpers for Plugins
  A.Character.UI.escapeHtml = escapeHtml;
  A.Character.UI.showConfirmDialog = showConfirmDialog;
  A.Character.UI.showPortraitSelector = showPortraitSelector;
  A.Character.compile = compileCharacter;

  // --- Main Render Function ---

  function render(container) {
    try {
      const state = A.State.get();
      if (!state) {
        container.innerHTML = '<div class="empty-state" style="padding:2em;text-align:center;color:var(--text-muted);">No project loaded.</div>';
        return;
      }

      const charState = ensureCharacterState(state);

      // Always compile on render to ensure Simulator has latest data
      compileCharacter(state);

      container.style.height = '100%';
      container.style.overflowY = 'auto';

      // Build actor list for selector
      const actors = state.nodes?.actors?.items ? Object.values(state.nodes.actors.items) : [];
      const enabledActors = actors.filter(a => a.enabled !== false);

      // Dispatch to appropriate Plugin
      if (charState.activeMode === 'solo') {
        if (A.Character.Solo?.render) {
          A.Character.Solo.render(container, state, charState, enabledActors, render);
        } else {
          container.innerHTML = '<div style="padding:20px;color:red;">Error: Character.Solo plugin missing. Check js/plugins/character/character-solo.js</div>';
        }
      } else {
        if (A.Character.Ensemble?.render) {
          A.Character.Ensemble.render(container, state, charState, enabledActors, render);
        } else {
          container.innerHTML = '<div style="padding:20px;color:red;">Error: Character.Ensemble plugin missing. Check js/plugins/character/character-ensemble.js</div>';
        }
      }
    } catch (err) {
      console.error('[Character Panel] Render Error:', err);
      container.innerHTML = `<div style="padding:20px;color:red;background:rgba(255,0,0,0.1);border-radius:8px;">
                <h3>⚠️ Panel Error</h3>
                <pre style="white-space:pre-wrap;font-size:12px;">${escapeHtml(err.stack || err.message)}</pre>
            </div>`;
    }
  }

  // Register Panel
  A.registerPanel('character', {
    title: 'Character',
    label: 'Character', // label is used by UI, title might be internal/page title
    category: 'Seeds',
    order: 2,
    icon: 'character',
    render: render
  });

  console.log('[Character Panel] Loaded and registered.');

})(window.Anansi);
