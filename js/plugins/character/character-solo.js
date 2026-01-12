/*
 * Anansi Plugin: Character Solo Mode
 * File: js/plugins/character/character-solo.js
 * 
 * UI for Single-Character synthesis.
 */

(function (A) {
    'use strict';

    A.Character = A.Character || {};
    A.Character.Solo = {};

    function renderSoloMode(container, state, charState, enabledActors, renderFn) {
        const solo = charState.solo;
        const selectedActor = solo.selectedActorId
            ? state.nodes?.actors?.items?.[solo.selectedActorId]
            : null;

        // Helpers from Main or Synth
        const Synth = A.Character.Synth;
        const UI = A.Character.UI;

        // Get synthesized content (or use override if dirty)
        const getSynthOrOverride = (field, synthFn) => {
            if (solo.overrides[field].dirty && solo.overrides[field].content !== null) {
                return solo.overrides[field].content;
            }
            return selectedActor ? synthFn() : '';
        };

        const personalityContent = getSynthOrOverride('personality', () =>
            Synth.synthesizePersonality([solo.selectedActorId], state));

        const scenarioContent = getSynthOrOverride('scenario', () =>
            selectedActor?.scenario || selectedActor?.cardFields?.scenario || selectedActor?.imported?.scenario || '');

        const examplesContent = getSynthOrOverride('exampleDialogue', () =>
            selectedActor?.exampleDialogue || selectedActor?.examples || selectedActor?.cardFields?.mes_example || selectedActor?.imported?.examples || '');

        // First message options
        const fmOptions = solo.selectedActorId
            ? Synth.getFirstMessageOptions([solo.selectedActorId], state)
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
              <input type="text" id="char-name" class="input" placeholder="The character's full name" value="${UI.escapeHtml(solo.characterName || selectedActor?.name || '')}">
              <div style="font-size:11px;color:var(--text-muted);margin-top:4px;">The character's full name.</div>
            </div>
            <div class="form-group">
              <label class="label" style="font-size:11px;font-weight:bold;color:var(--text-muted);text-transform:uppercase;">Chat Name</label>
              <input type="text" id="chat-name" class="input" placeholder="Name used in chat messages" value="${UI.escapeHtml(solo.chatName || '')}">
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
                    ${UI.escapeHtml(a.name || 'Unnamed Actor')}
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
                        placeholder="Character personality description...">${UI.escapeHtml(personalityContent)}</textarea>
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
                        placeholder="Scene context or setup...">${UI.escapeHtml(scenarioContent)}</textarea>
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
                        placeholder="<START>\\nUser: Hello.\\n{{char}}: Hi there!">${UI.escapeHtml(examplesContent)}</textarea>
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
                        placeholder="The character's opening message...">${UI.escapeHtml(currentFm)}</textarea>
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
            renderFn(container);
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
                    UI.showConfirmDialog(
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
                            renderFn(container);
                        }
                    );
                } else {
                    solo.selectedActorId = newId;
                    solo.firstMessageIndex = 0;
                    A.State.notify();
                    renderFn(container);
                }
            };
        }

        // Portrait upload/remove
        const portraitPreview = container.querySelector('#portrait-preview');
        const portraitInput = container.querySelector('#portrait-input');
        const btnUpload = container.querySelector('#btn-upload-portrait');
        const btnRemove = container.querySelector('#btn-remove-portrait');

        const handlePortraitFile = (file) => {
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                solo.portrait = { data: ev.target.result, mimeType: file.type };
                A.State.notify();
                renderFn(container);
            };
            reader.readAsDataURL(file);
        };

        if (btnUpload && portraitInput) {
            btnUpload.onclick = () => portraitInput.click();
            portraitInput.onchange = (e) => handlePortraitFile(e.target.files[0]);
        }

        if (portraitPreview && A.UI.makeDraggable) {
            A.UI.makeDraggable(portraitPreview, { onDrop: (files) => handlePortraitFile(files[0]) });
        }

        if (btnRemove) {
            btnRemove.onclick = () => {
                solo.portrait = null;
                A.State.notify();
                renderFn(container);
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
                if (A.Character.compile) A.Character.compile(state);
                A.State.notify();
            };
        }

        if (chatNameInput) {
            chatNameInput.oninput = (e) => {
                solo.chatName = e.target.value;
                if (A.Character.compile) A.Character.compile(state);
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
                    if (!solo.overrides[field].dirty) return;
                    UI.showConfirmDialog(
                        `Reset ${field.charAt(0).toUpperCase() + field.slice(1)}?`,
                        'This will replace your edits with the synthesized content from the selected Actor.',
                        () => {
                            solo.overrides[field] = { content: null, dirty: false };
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
                if (solo.firstMessageIndex > 0) {
                    solo.overrides.firstMessage = { content: null, dirty: false };
                    solo.firstMessageIndex--;
                    A.State.notify();
                    renderFn(container);
                }
            };
        }

        if (fmNext) {
            fmNext.onclick = () => {
                if (solo.firstMessageIndex < fmOptions.length - 1) {
                    solo.overrides.firstMessage = { content: null, dirty: false };
                    solo.firstMessageIndex++;
                    A.State.notify();
                    renderFn(container);
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
                Synth.exportCardAsPng(state, 'solo', personality, scenario, examples, firstMsg, solo.portrait.data);
            } else {
                UI.showPortraitSelector(state, [solo.selectedActorId], (portraitData) => {
                    Synth.exportCardAsPng(state, 'solo', personality, scenario, examples, firstMsg, portraitData);
                });
            }
        });
    }

    A.Character.Solo.render = renderSoloMode;

})(window.Anansi);
