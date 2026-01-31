/*
 * Anansi Plugin: Character Ensemble Mode
 * File: js/plugins/character/character-ensemble.js
 * 
 * UI for Multi-Character synthesis.
 */

(function (A) {
  'use strict';

  A.Character = A.Character || {};
  A.Character.Ensemble = {};

  function renderEnsembleMode(container, state, charState, enabledActors, renderFn) {
    const ensemble = charState.ensemble;

    // Helpers
    const Synth = A.Character.Synth;
    const UI = A.Character.UI;

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
      Synth.synthesizePersonality(ensemble.selectedActorIds, state));
    const scenarioContent = getSynthOrOverride('scenario', () =>
      Synth.synthesizeScenario(ensemble.selectedActorIds, state, ensemble.options));
    const examplesContent = getSynthOrOverride('exampleDialogue', () =>
      Synth.synthesizeExamples(ensemble.selectedActorIds, state));

    // First message options
    const fmOptions = ensemble.selectedActorIds.length
      ? Synth.getFirstMessageOptions(ensemble.selectedActorIds, state)
      : [{ label: 'Custom', content: '', isCustom: true }];

    const currentFmIndex = Math.min(ensemble.firstMessageIndex, fmOptions.length - 1);
    const currentFm = ensemble.overrides.firstMessage.dirty
      ? ensemble.overrides.firstMessage.content
      : fmOptions[currentFmIndex]?.content || '';

    // Use full height flex container with internal scroll
    container.innerHTML = `
      <div class="flex-col h-full overflow-hidden">
        <div class="scroll-y p-md pb-xl flex-1">
          <div class="panel-header mb-md">
          <div>
            <h2 class="panel-title">Character</h2>
            <div class="panel-subtitle">Synthesize data from Actors into Character Card format.</div>
          </div>
        </div>

        <!-- Mode Tabs -->
        <div class="card mb-md">
          <div class="card-body p-sm">
            <div class="flex-row gap-sm">
              <button class="btn btn-ghost flex-1" id="tab-solo">Solo Mode</button>
              <button class="btn btn-primary flex-1" id="tab-ensemble">Ensemble Mode</button>
            </div>
          </div>
        </div>

        <!-- Profile Image -->
        <div class="card mb-md">
          <div class="card-header"><strong>Profile Image</strong></div>
          <div class="card-body flex-row gap-md items-start">
            <div id="portrait-preview" class="portrait-preview">
              ${ensemble.portrait?.data
        ? `<img src="${ensemble.portrait.data}" class="portrait-img">`
        : `<span class="text-muted text-xs text-center p-sm">No image</span>`
      }
            </div>
            <div class="flex-col gap-sm">
              <input type="file" id="portrait-input" accept="image/png,image/jpeg,image/webp" style="display:none;">
              <button class="btn btn-sm" id="btn-upload-portrait">📷 Upload Portrait</button>
              <button class="btn btn-ghost btn-sm" id="btn-remove-portrait" ${!ensemble.portrait?.data ? 'disabled' : ''}>🗑️ Remove</button>
              <div class="text-xs text-muted" style="max-width:150px;">
                PNG, JPG, or WebP. Max 500KB recommended.
              </div>
            </div>
          </div>
        </div>

        <!-- Character Name & Chat Name -->
        <div class="card" style="margin-bottom:var(--space-4);">
          <div class="card-body">
            <div class="form-group mb-md">
              <label class="label v-lab">Character Name</label>
              <input type="text" id="char-name" class="input" placeholder="The card's name (e.g., 'The Dream Team')" value="${UI.escapeHtml(ensemble.characterName || '')}">
              <div class="text-xs text-muted mt-xs">The displayed name for this ensemble card.</div>
            </div>
            <div class="form-group">
              <label class="label v-lab">Chat Name</label>
              <input type="text" id="chat-name" class="input" placeholder="Name used in chat messages" value="${UI.escapeHtml(ensemble.chatName || '')}">
              <div class="text-xs text-muted mt-xs">The name that appears in chat (optional for ensembles).</div>
            </div>
          </div>
        </div>

        <!-- Actor Multi-Select -->
        <div class="card mb-md">
          <div class="card-header flex-row justify-between items-center">
            <strong>Select Actors</strong>
            <button class="btn btn-primary btn-sm" id="btn-apply-selection">Apply Selection</button>
          </div>
          <div class="card-body">
            ${enabledActors.length === 0 ? `
              <div class="text-center p-lg text-muted">
                <p>No actors defined yet.</p>
                <button class="btn btn-secondary" id="btn-goto-actors">Create First Actor →</button>
              </div>
            ` : `
              <div class="flex-row flex-wrap gap-sm">
                ${enabledActors.map(a => `
                  <label class="flex-row items-center gap-sm p-sm bg-inset rounded-md cursor-pointer border-subtle" style="border-width:1px; border-style:solid; ${pendingSelection.includes(a.id) ? 'border-color:var(--accent-primary);' : ''}">
                    <input type="checkbox" class="actor-checkbox" data-id="${a.id}" 
                           ${pendingSelection.includes(a.id) ? 'checked' : ''}>
                    <span class="text-sm">${UI.escapeHtml(a.name || 'Unnamed')}</span>
                  </label>
                `).join('')}
              </div>
              <div class="mt-sm text-xs text-muted">
                Selected: ${pendingSelection.length} actor(s)
              </div>
            `}
          </div>
        </div>

        <!-- Options -->
        <div class="card mb-md">
          <div class="card-header"><strong>Synthesis Options</strong></div>
          <div class="card-body flex-row gap-md flex-wrap">
            <label class="flex-row items-center gap-sm cursor-pointer">
              <input type="checkbox" id="opt-narrator" ${ensemble.options.includeNarrator ? 'checked' : ''}>
              <span class="text-sm">Include Narrator Instructions</span>
            </label>
            <label class="flex-row items-center gap-sm cursor-pointer">
              <input type="checkbox" id="opt-mood" ${ensemble.options.includeMoodTags ? 'checked' : ''}>
              <span class="text-sm">Include Mood Tags</span>
            </label>
          </div>
        </div>

        ${ensemble.selectedActorIds.length ? `
          <!-- Personality Field -->
          <div class="card mb-md">
            <div class="card-header flex-row justify-between items-center">
              <strong>Personality</strong>
              <div class="flex-row gap-sm items-center">
                <button class="btn btn-ghost btn-sm btn-vault-publish mr-xs" data-field="personality" title="Save to Vault">📤</button>
                <button class="btn btn-ghost btn-sm btn-vault-import mr-xs" data-field="personality" title="Import from Vault">📥</button>
                <button class="btn btn-ghost btn-sm" id="reset-personality" title="Reset from Actors">↺ Reset</button>
                <span class="status-badge ${ensemble.overrides.personality.dirty ? 'edited' : 'synced'} text-tiny px-sm py-xs rounded-full" 
                      style="background:${ensemble.overrides.personality.dirty ? 'var(--status-warning)' : 'var(--status-success)'};color:white;">
                  ${ensemble.overrides.personality.dirty ? 'Edited' : 'Synced'}
                </span>
              </div>
            </div>
            <div class="card-body">
              <textarea class="input field-editor field-editor-xl" id="field-personality" data-field="personality" 
                        placeholder="Combined character profiles...">${UI.escapeHtml(personalityContent)}</textarea>
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
              <textarea class="input field-editor field-editor-lg" id="field-scenario" data-field="scenario" 
                        placeholder="Multi-character system prompt...">${UI.escapeHtml(scenarioContent)}</textarea>
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
              <textarea class="input field-editor field-editor-lg" id="field-exampleDialogue" data-field="exampleDialogue" 
                        placeholder="Voice samples from each actor...">${UI.escapeHtml(examplesContent)}</textarea>
            </div>
          </div>

          <!-- First Message Carousel -->
          <div class="card mb-md">
            <div class="card-header flex-row justify-between items-center">
              <strong>First Message</strong>
              <div class="flex-row gap-sm items-center">
                <button class="btn btn-ghost btn-sm" id="fm-prev" ${currentFmIndex === 0 ? 'disabled' : ''}>◀</button>
                <span class="text-sm text-secondary">
                  <strong>${fmOptions[currentFmIndex]?.label || 'Custom'}</strong> 
                  ${fmOptions[currentFmIndex]?.count || ''} 
                  <span class="opacity-60 ml-sm">[${currentFmIndex + 1}/${fmOptions.length}]</span>
                </span>
                <button class="btn btn-ghost btn-sm" id="fm-next" ${currentFmIndex >= fmOptions.length - 1 ? 'disabled' : ''}>▶</button>
                <span class="status-badge ${ensemble.overrides.firstMessage.dirty ? 'edited' : 'synced'} text-tiny px-sm py-xs rounded-full"
                      style="background:${ensemble.overrides.firstMessage.dirty ? 'var(--status-warning)' : 'var(--status-success)'};color:white;">
                  ${ensemble.overrides.firstMessage.dirty ? 'Edited' : 'Synced'}
                </span>
              </div>
            </div>
            <div class="card-body">
              <textarea class="input field-editor" id="field-firstMessage" data-field="firstMessage" 
                        style="height:150px;resize:vertical;font-family:var(--font-mono);font-size:13px;"
                        placeholder="Opening scene message...">${UI.escapeHtml(currentFm)}</textarea>
              ${fmOptions[currentFmIndex]?.isCustom ? `
                <div class="mt-md p-md bg-inset rounded-md">
                  <label class="v-lab mb-xs block">Generate Combined Opening (optional guidance):</label>
                  <div class="flex-row gap-sm">
                    <input type="text" class="input" id="fm-guidance" placeholder="e.g., Start with tension, Elena speaks first" style="flex:1;">
                    <button class="btn btn-secondary" id="btn-generate-fm">🪄 Generate</button>
                  </div>
                </div>
              ` : ''}
            </div>
          </div>

          <!-- Preview Pane (Collapsible) -->
          <div class="card mb-md">
            <div class="card-header cursor-pointer" id="preview-toggle">
              <strong>▶ Preview as Card</strong>
              <span class="text-muted text-xs ml-sm">(click to expand)</span>
            </div>
            <div class="card-body bg-inset font-mono text-xs" id="preview-content" style="display:none;max-height:300px;overflow-y:auto;white-space:pre-wrap;">
            </div>
          </div>

          <!-- Export Bar -->
          <div class="card">
            <div class="card-body flex-row gap-sm flex-wrap">
              <button class="btn btn-ghost" id="copy-personality">📋 Copy Personality</button>
              <button class="btn btn-ghost" id="copy-scenario">📋 Copy Scenario</button>
              <button class="btn btn-ghost" id="copy-all">📋 Copy All Fields</button>
              <button class="btn btn-primary" id="export-png">📤 Export PNG Card</button>
            </div>
          </div>
        ` : `
          <div class="card">
            <div class="card-body text-center p-lg text-muted">
              <h3 class="mb-sm">🎭 Select Actors Above</h3>
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
      renderFn(container);
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
        if (A.Character.compile) A.Character.compile(state);
        A.State.notify();
        renderFn(container);
      };

      if (anyDirty && ensemble.selectedActorIds.length) {
        UI.showConfirmDialog(
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
        if (A.Character.compile) A.Character.compile(state);
        A.State.notify();
        renderFn(container);
      } else {
        A.State.notify();
      }
    });

    container.querySelector('#opt-mood')?.addEventListener('change', (e) => {
      ensemble.options.includeMoodTags = e.target.checked;
      if (!ensemble.overrides.scenario.dirty) {
        if (A.Character.compile) A.Character.compile(state);
        A.State.notify();
        renderFn(container);
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
          renderFn(container);
        };
        reader.readAsDataURL(file);
      };
    }

    if (btnRemove) {
      btnRemove.onclick = () => {
        ensemble.portrait = null;
        A.State.notify();
        renderFn(container);
      };
    }

    // Character Name and Chat Name
    const charNameInput = container.querySelector('#char-name');
    const chatNameInput = container.querySelector('#chat-name');

    if (charNameInput) {
      charNameInput.oninput = (e) => {
        ensemble.characterName = e.target.value;
        if (A.Character.compile) A.Character.compile(state);
        A.State.notify();
      };
    }

    if (chatNameInput) {
      chatNameInput.oninput = (e) => {
        ensemble.chatName = e.target.value;
        if (A.Character.compile) A.Character.compile(state);
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
        if (A.Character.compile) A.Character.compile(state);
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
          UI.showConfirmDialog(
            `Reset ${field.charAt(0).toUpperCase() + field.slice(1)}?`,
            'This will replace your edits with the synthesized content from the selected Actors.',
            () => {
              ensemble.overrides[field] = { content: null, dirty: false };
              if (A.Character.compile) A.Character.compile(state);
              A.State.notify();
              renderFn(container);
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
          renderFn(container);
        }
      };
    }

    if (fmNext) {
      fmNext.onclick = () => {
        if (ensemble.firstMessageIndex < fmOptions.length - 1) {
          ensemble.overrides.firstMessage = { content: null, dirty: false };
          ensemble.firstMessageIndex++;
          A.State.notify();
          renderFn(container);
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
                if (A.Character.compile) A.Character.compile(state);
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
        Synth.exportCardAsPng(state, 'ensemble', personality, scenario, examples, firstMsg, ensemble.portrait.data);
      } else {
        UI.showPortraitSelector(state, ensemble.selectedActorIds, (portraitData) => {
          Synth.exportCardAsPng(state, 'ensemble', personality, scenario, examples, firstMsg, portraitData);
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

  A.Character.Ensemble.render = renderEnsembleMode;

})(window.Anansi);
