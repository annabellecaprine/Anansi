/*
 * Anansi Simulator - Live Chat Mode
 * File: js/panels/simulator-live.js
 * Purpose: Live chat UI with LLM integration, message handling, branching, and session management.
 * Extracted from simulator.js for better maintainability.
 */

(function (A) {
    'use strict';

    // Helper: Escape HTML for safe display
    function escapeHtml(text) {
        if (!text) return '';
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    /**
     * Render Live Mode UI
     * @param {HTMLElement} target - Container to render into
     * @param {Object} options - Options including updateGlobalLens callback
     */
    function renderLiveMode(target, options = {}) {
        const { updateGlobalLens, activeLens } = options;

        target.className = 'flex-col gap-md h-full overflow-hidden';

        // Chat Area
        const chatCol = document.createElement('div');
        chatCol.className = 'card flex-col p-0 min-h-0 flex-1';

        chatCol.innerHTML = `
      <div class="card-header flex-wrap gap-sm">
        <strong>The Spindle (Live)</strong>
        <div class="flex-row gap-sm items-center">
          <select class="input text-xs py-0 px-sm w-auto min-w-[100px]" id="live-session-select">
            <option value="">-- Sessions --</option>
          </select>
          <button class="btn btn-ghost btn-sm" id="btn-live-load" title="Load session">Load</button>
          <button class="btn btn-ghost btn-sm" id="btn-live-save" title="Save session">Save</button>
          <div class="w-px h-4 bg-border-subtle"></div>
          <select class="input text-xs py-0 px-sm w-auto min-w-[80px] bg-elevated" id="branch-select">
            <option value="main">🌿 main</option>
          </select>
          <div class="w-px h-4 bg-border-subtle"></div>
          <button class="btn btn-ghost btn-sm" id="btn-run-all" title="Run Full Simulation Trace">Run Trace</button>
          <button class="btn btn-ghost btn-sm" id="btn-export-story" title="Export as Story">Export</button>
          <button class="btn btn-ghost btn-sm text-error" id="btn-clear-chat">Clear</button>
          <div class="w-px h-4 bg-border-subtle"></div>
          <label class="flex-row items-center gap-xs text-xs cursor-pointer select-none">
             <input type="checkbox" id="chk-show-thinking">
             <span class="text-muted">Thinking</span>
          </label>
        </div>
      </div>
      <div class="card-body chat-log flex-1 scroll-y p-lg flex-col gap-sm bg-surface" id="sim-chat-log"></div>
      
      <style>
          .chat-thinking {
              font-size: 0.85em;
              margin-bottom: 8px;
              background: var(--bg-deep);
              border: 1px solid var(--border-subtle);
              border-radius: 6px;
              overflow: hidden;
          }
          .chat-thinking summary {
              padding: 6px 10px;
              cursor: pointer;
              color: var(--text-muted);
              font-weight: 600;
              user-select: none;
              background: rgba(0,0,0,0.2);
          }
          .chat-thinking summary:hover { color: var(--text-primary); }
          .thinking-content {
              padding: 10px;
              white-space: pre-wrap;
              color: var(--text-secondary);
              font-family: var(--font-mono);
              border-top: 1px solid var(--border-subtle);
              max-height: 300px;
              overflow-y: auto;
              opacity: 0.9;
          }
          #sim-chat-log:not(.show-thoughts) .chat-thinking { display: none; }
      </style>
      <div class="card-footer p-sm">
        <!-- Director's Console -->
        <div class="director-toolbar collapsed" id="director-toolbar">
            <div class="cursor-pointer flex-row items-center gap-xs font-bold text-muted text-tiny" onclick="document.getElementById('director-toolbar').classList.toggle('collapsed')">
                <span>🎬 DIRECTOR</span>
                <span class="text-tiny">▼</span>
            </div>
            
            <div class="director-group flex-1">
                <span class="director-label">Guide</span>
                <input type="text" class="director-input" id="dir-guidance" placeholder="Inject instruction for LLM (appended to system prompt)...">
            </div>
        </div>

        <div class="flex-row gap-sm items-end">
          <textarea class="input flex-1" id="sim-input" placeholder="Weave a message... (Shift+Enter for new line)" style="resize:none; min-height:36px; max-height:120px; line-height:1.4;" rows="1"></textarea>
          <button class="btn btn-primary h-[36px]" id="sim-send">Send</button>
        </div>
      </div>
    `;
        target.appendChild(chatCol);

        // Trigger global lens update
        if (updateGlobalLens) updateGlobalLens();

        // --- Chat Logic ---
        const chatLog = chatCol.querySelector('#sim-chat-log');
        const input = chatCol.querySelector('#sim-input');
        const sendBtn = chatCol.querySelector('#sim-send');
        const dirGuidance = chatCol.querySelector('#dir-guidance');

        // --- Thinking Toggle Logic ---
        const chkThoughts = chatCol.querySelector('#chk-show-thinking');
        if (chkThoughts) {
            const showThoughts = localStorage.getItem('anansi_show_thoughts') === 'true';
            chkThoughts.checked = showThoughts;
            if (showThoughts) chatLog.classList.add('show-thoughts');

            chkThoughts.onchange = (e) => {
                localStorage.setItem('anansi_show_thoughts', e.target.checked);
                if (e.target.checked) chatLog.classList.add('show-thoughts');
                else chatLog.classList.remove('show-thoughts');
            };
        }

        // --- Chat Refresh ---
        const refreshChat = () => {
            const state = A.State.get();
            const history = state.sim.history || [];

            chatLog.innerHTML = '';
            chatLog.className = 'card-body chat-log';

            history.forEach((msg, idx) => {
                const wrapper = document.createElement('div');
                // Use built-in chat classes
                // The new .chat-bubble logic handles most of this, but we need a wrapper for alignment
                wrapper.className = `w-full flex ${msg.role === 'model' ? 'flex-row' : 'flex-row-reverse'} gap-md items-start`;
                wrapper.dataset.index = idx;

                const bubble = document.createElement('div');
                bubble.className = `chat-bubble ${msg.role === 'user' ? 'user' : 'model'} flex-1`;

                // Role label
                const roleLabel = document.createElement('div');
                roleLabel.className = 'chat-role';
                roleLabel.textContent = msg.role.toUpperCase();
                if (msg.edited) {
                    const editedTag = document.createElement('span');
                    editedTag.className = 'chat-edited';
                    editedTag.textContent = '(edited)';
                    roleLabel.appendChild(editedTag);
                }
                bubble.appendChild(roleLabel);

                // Message content
                const content = document.createElement('div');
                content.className = 'chat-content';
                content.innerHTML = A.ChatFormatter ? A.ChatFormatter.format(msg.content) : msg.content;
                bubble.appendChild(content);

                // Timestamp
                if (msg.timestamp) {
                    const ts = document.createElement('span');
                    ts.className = 'chat-timestamp';
                    ts.textContent = getRelativeTime(msg.timestamp);
                    bubble.appendChild(ts);
                }

                // Avatar logic for AI messages
                const isAI = msg.role === 'model';
                const avatarSize = 40;

                let avatarHtml = '';
                if (isAI) {
                    const charId = state.character?.char?.id;
                    const actor = (state.nodes && state.nodes.actors && state.nodes.actors.items && charId)
                        ? state.nodes.actors.items[charId]
                        : null;
                    const imgParams = (actor && actor.gallery && actor.gallery.primary && actor.gallery.images)
                        ? actor.gallery.images.find(i => i.id === actor.gallery.primary)
                        : null;
                    const imgSrc = imgParams ? imgParams.data : null;

                    if (imgSrc) {
                        const pulse = msg.emotionalSnapshot ? (msg.emotionalSnapshot.pulse || []) : [];
                        let pulseClass = '';
                        if (pulse.includes('ANGER') || pulse.includes('RAGE')) pulseClass = 'avatar-pulse-anger';
                        else if (pulse.includes('JOY') || pulse.includes('HAPPY')) pulseClass = 'avatar-pulse-joy';
                        else if (pulse.includes('SADNESS') || pulse.includes('GRIEF')) pulseClass = 'avatar-pulse-sad';
                        else if (pulse.includes('FEAR') || pulse.includes('TERROR')) pulseClass = 'avatar-pulse-fear';
                        else if (pulse.includes('LOVE') || pulse.includes('LUST')) pulseClass = 'avatar-pulse-love';

                        avatarHtml = `
               <div class="chat-avatar-frame ${pulseClass} rounded-full overflow-hidden flex-shrink-0 bg-base mt-xs" style="
                  width:${avatarSize}px; height:${avatarSize}px; 
                  border:2px solid ${pulseClass ? 'var(--accent-primary)' : 'var(--border-subtle)'};
               ">
                  <img src="${imgSrc}" class="w-full h-full" style="object-fit:cover;">
               </div>
             `;
                    }
                }

                // Removed custom styling block as it is now handled by classes
                if (isAI && avatarHtml) {
                    const avDiv = document.createElement('div');
                    avDiv.innerHTML = avatarHtml;
                    wrapper.appendChild(avDiv.firstElementChild);
                } else if (isAI) {
                    const spacer = document.createElement('div');
                    spacer.style.width = `${avatarSize}px`;
                    wrapper.appendChild(spacer);
                }

                const actions = document.createElement('div');
                actions.className = 'chat-actions';
                actions.innerHTML = `
          <button class="chat-action-btn" data-action="edit" title="Edit">✏️</button>
          <button class="chat-action-btn" data-action="copy" title="Copy">📋</button>
          <button class="chat-action-btn" data-action="fork" title="Fork from here">🌿</button>
          ${msg.injections ? '<button class="chat-action-btn" data-action="inspect" title="View Injections">ℹ️</button>' : ''}
          ${msg.role === 'model' ? '<button class="chat-action-btn" data-action="regenerate" title="Regenerate">🔄</button>' : ''}
          <button class="chat-action-btn danger" data-action="delete" title="Delete">🗑️</button>
        `;

                wrapper.appendChild(bubble);
                bubble.appendChild(actions);
                bubble.style.position = 'relative';

                // Greeting swipe arrows for first AI message
                if (idx === 0 && msg.role === 'model' && Array.isArray(state.seed?.firstMessage) && state.seed.firstMessage.length > 1) {
                    const greetings = state.seed.firstMessage;
                    if (state.sim.greetingIndex === undefined) state.sim.greetingIndex = 0;
                    const gIdx = state.sim.greetingIndex;

                    const swipeOverlay = document.createElement('div');
                    swipeOverlay.style.cssText = 'display:flex; justify-content:space-between; align-items:center; position:absolute; top:50%; left:0; right:0; transform:translateY(-50%); pointer-events:none;';
                    swipeOverlay.innerHTML = `
            <button class="btn btn-ghost btn-sm swipe-btn swipe-prev" style="pointer-events:auto; font-size:18px; opacity:0.7;">&lt;</button>
            <span style="font-size:10px; color:var(--text-muted); background:var(--bg-base); padding:2px 6px; border-radius:4px;">${gIdx + 1} / ${greetings.length}</span>
            <button class="btn btn-ghost btn-sm swipe-btn swipe-next" style="pointer-events:auto; font-size:18px; opacity:0.7;">&gt;</button>
          `;

                    wrapper.style.position = 'relative';
                    wrapper.appendChild(swipeOverlay);

                    setTimeout(() => {
                        const prevBtn = wrapper.querySelector('.swipe-prev');
                        const nextBtn = wrapper.querySelector('.swipe-next');
                        if (prevBtn) {
                            prevBtn.onclick = () => {
                                const newIdx = (gIdx - 1 + greetings.length) % greetings.length;
                                state.sim.greetingIndex = newIdx;
                                state.sim.history[0].content = greetings[newIdx];
                                A.State.notify();
                                refreshChat();
                            };
                        }
                        if (nextBtn) {
                            nextBtn.onclick = () => {
                                const newIdx = (gIdx + 1) % greetings.length;
                                state.sim.greetingIndex = newIdx;
                                state.sim.history[0].content = greetings[newIdx];
                                A.State.notify();
                                refreshChat();
                            };
                        }
                    }, 0);
                }

                chatLog.appendChild(wrapper);
            });

            // Bind action buttons
            chatLog.querySelectorAll('.chat-action-btn').forEach(btn => {
                btn.onclick = (e) => handleMessageAction(e.target.dataset.action, parseInt(e.target.closest('.chat-message').dataset.index));
            });

            chatLog.scrollTop = chatLog.scrollHeight;
        };

        // Relative time helper
        function getRelativeTime(timestamp) {
            const diff = Date.now() - new Date(timestamp).getTime();
            const mins = Math.floor(diff / 60000);
            if (mins < 1) return 'now';
            if (mins < 60) return `${mins}m ago`;
            const hrs = Math.floor(mins / 60);
            if (hrs < 24) return `${hrs}h ago`;
            return `${Math.floor(hrs / 24)}d ago`;
        }

        // Message action handler
        function handleMessageAction(action, index) {
            const state = A.State.get();
            const msg = state.sim.history[index];
            if (!msg) return;

            if (action === 'edit') {
                openEditModal(index, msg);
            } else if (action === 'copy') {
                const text = A.ChatFormatter ? A.ChatFormatter.toPlainText(msg.content) : msg.content;
                navigator.clipboard.writeText(text);
                if (A.UI.Toast) A.UI.Toast.show('Copied to clipboard', 'success');
            } else if (action === 'delete') {
                const msgCount = state.sim.history.length - index;
                const confirmMsg = msgCount > 1
                    ? `Delete this message and ${msgCount - 1} subsequent message(s)?`
                    : 'Delete this message?';
                if (confirm(confirmMsg)) {
                    state.sim.history = state.sim.history.slice(0, index);
                    A.State.notify();
                    refreshChat();
                }
            } else if (action === 'regenerate') {
                regenerateMessage(index);
            } else if (action === 'fork') {
                const branchName = prompt('Branch name:', `branch-${Date.now().toString(36)}`);
                if (!branchName) return;

                if (!state.sim.branches) {
                    state.sim.branches = { 'main': { history: JSON.parse(JSON.stringify(state.sim.history)), createdAt: new Date().toISOString() } };
                    state.sim.activeBranch = 'main';
                }

                state.sim.branches[state.sim.activeBranch].history = JSON.parse(JSON.stringify(state.sim.history));
                const branchHistory = state.sim.history.slice(0, index + 1);
                state.sim.branches[branchName] = { history: JSON.parse(JSON.stringify(branchHistory)), parentBranch: state.sim.activeBranch, forkIndex: index, createdAt: new Date().toISOString() };
                state.sim.activeBranch = branchName;
                state.sim.history = JSON.parse(JSON.stringify(branchHistory));

                A.State.notify();
                refreshChat();
                refreshBranchSelect();
                if (A.UI.Toast) A.UI.Toast.show(`Created branch "${branchName}"`, 'success');
            } else if (action === 'inspect') {
                showInjectionModal(index, msg);
            }
        }

        function showInjectionModal(index, msg) {
            const injections = msg.injections;
            if (!injections) {
                if (A.UI.Toast) A.UI.Toast.show('No injection data for this message', 'info');
                return;
            }

            const highlightDiff = (original, final) => {
                if (!final) return '<span style="color:var(--text-muted); font-style:italic;">Empty</span>';
                if (!original || original === final) return escapeHtml(final);
                if (final.startsWith(original)) {
                    const added = final.slice(original.length);
                    return escapeHtml(original) + '<span style="background:rgba(0,255,100,0.15); border-bottom:1px solid var(--status-success);">' + escapeHtml(added) + '</span>';
                }
                return '<span style="background:rgba(0,255,100,0.15); border-bottom:1px solid var(--status-success);">' + escapeHtml(final) + '</span>';
            };

            const logsHtml = injections.logs.length
                ? injections.logs.map(l => `<div style="font-size:10px; padding:2px 0; border-bottom:1px solid var(--border-subtle);">${escapeHtml(l)}</div>`).join('')
                : '<div style="color:var(--text-muted); font-style:italic;">No script logs</div>';

            const tagsHtml = injections.activeTags?.length
                ? injections.activeTags.map(t => `<span style="background:var(--bg-elevated); padding:2px 6px; border-radius:4px; font-size:10px; margin-right:4px;">${t}</span>`).join('')
                : '<span style="color:var(--text-muted); font-style:italic;">None</span>';

            let diffHtml = '';
            if (injections.original && injections.final) {
                diffHtml = `
          <div style="margin-bottom:12px;">
            <div style="font-weight:bold; color:var(--text-muted); margin-bottom:4px;">PERSONALITY</div>
            <div style="max-height:80px; overflow-y:auto; background:var(--bg-surface); padding:8px; border-radius:4px; font-size:10px; white-space:pre-wrap;">${highlightDiff(injections.original.personality, injections.final.personality)}</div>
          </div>
          <div style="margin-bottom:12px;">
            <div style="font-weight:bold; color:var(--text-muted); margin-bottom:4px;">SCENARIO</div>
            <div style="max-height:80px; overflow-y:auto; background:var(--bg-surface); padding:8px; border-radius:4px; font-size:10px; white-space:pre-wrap;">${highlightDiff(injections.original.scenario, injections.final.scenario)}</div>
          </div>
        `;
            }

            A.UI.Modal.show({
                title: `Message #${index + 1} - Injection Details`,
                content: `
          <div style="font-size:11px; font-family:var(--font-mono);">
            <div style="margin-bottom:12px;">
              <div style="font-weight:bold; color:var(--text-muted); margin-bottom:4px;">ACTIVE TAGS</div>
              <div>${tagsHtml}</div>
            </div>
            <div style="margin-bottom:12px;">
              <div style="font-weight:bold; color:var(--text-muted); margin-bottom:4px;">LOREBOOK ENTRIES</div>
              <div>${injections.loreEntries || 0} entries injected</div>
            </div>
            ${diffHtml}
            <div style="margin-bottom:12px;">
              <div style="font-weight:bold; color:var(--text-muted); margin-bottom:4px;">SCRIPT LOGS</div>
              <div style="max-height:100px; overflow-y:auto; background:var(--bg-surface); padding:8px; border-radius:4px;">${logsHtml}</div>
            </div>
            <div>
              <div style="font-weight:bold; color:var(--text-muted); margin-bottom:4px;">FULL SYSTEM PROMPT</div>
              <pre style="max-height:150px; overflow-y:auto; background:var(--ink-900); padding:8px; border-radius:4px; white-space:pre-wrap; word-break:break-word; font-size:10px;">${escapeHtml(injections.systemPrompt || 'N/A')}</pre>
            </div>
          </div>
        `,
                actions: [{ label: 'Close', class: 'btn-primary', onclick: () => true }]
            });
        }

        function openEditModal(index, msg) {
            const state = A.State.get();
            A.UI.Modal.show({
                title: `Edit ${msg.role.toUpperCase()} Message`,
                content: `<textarea id="edit-msg-content" class="input chat-edit-textarea" style="width:100%; min-height:120px;">${msg.content}</textarea>`,
                actions: [
                    { label: 'Cancel', class: 'btn-ghost', onclick: () => true },
                    {
                        label: 'Save', class: 'btn-primary', onclick: (modal) => {
                            const newContent = modal.querySelector('#edit-msg-content').value;
                            state.sim.history[index].content = newContent;
                            state.sim.history[index].edited = true;
                            A.State.notify();
                            refreshChat();
                            if (A.UI.Toast) A.UI.Toast.show('Message updated', 'success');
                            return true;
                        }
                    }
                ]
            });
        }

        // Shared AI Processing Logic
        const processAIResponse = async (txt) => {
            const state = A.State.get();

            sendBtn.disabled = true;
            sendBtn.textContent = 'Weaving...';

            try {
                const roundResult = A.Simulator.processRound(txt, state.sim.history);

                if (A.Tester) {
                    roundResult.logs.forEach(l => A.Tester.log('system', l));
                }
                if (activeLens === 'trace' && updateGlobalLens) updateGlobalLens();

                const finalContext = roundResult.context;

                // Persistence write-back
                const sourceDefs = state.strands && state.strands.sources ? state.strands.sources.items : {};
                Object.keys(sourceDefs).forEach(key => {
                    if (sourceDefs[key].persistent && finalContext.hasOwnProperty(key)) {
                        const oldVal = state.sim.simSources[key];
                        const newVal = finalContext[key];
                        if (oldVal !== newVal) {
                            state.sim.simSources[key] = newVal;
                            if (A.UI.Toast) A.UI.Toast.show(`Updated persistent source: ${sourceDefs[key].label || key}`, 'success');
                        }
                    }
                });

                // Build system prompt
                const stripAuraTags = (text) => {
                    if (!text) return '';
                    return text.replace(/\[\s*(?:LT_)?[A-Z_]+(?:\.[A-Z_]+)?\s*\]/gi, '').replace(/\s+/g, ' ').trim();
                };

                let systemPrompt = `You are playing the role of ${finalContext.character.name}.\n`;
                if (finalContext.character.personality) systemPrompt += `[Personality: ${stripAuraTags(finalContext.character.personality)}]\n`;
                if (finalContext.character.scenario) systemPrompt += `[Scenario: ${stripAuraTags(finalContext.character.scenario)}]\n`;
                if (finalContext.tags && finalContext.tags.length) systemPrompt += `[Active Tags: ${finalContext.tags.join(', ')}]\n`;
                if (finalContext.system_notes) systemPrompt += `\n[Context Notes]:\n${finalContext.system_notes}\n`;
                if (state.sim.lastLogicResult) {
                    const lore = state.sim.lastLogicResult.filter(r => r.type === 'entry').map(r => r.data.content).join('\n---\n');
                    if (lore && !finalContext.system_notes) systemPrompt += `\n[Context Notes]:\n${lore}\n`;
                }
                if (state.sim.contextSummary) systemPrompt += `\n[Earlier Context]:\n${state.sim.contextSummary}\n`;
                if (state.sim.directorGuidance) {
                    systemPrompt += `\n[SYSTEM INSTRUCTION]: ${state.sim.directorGuidance}\n`;
                    delete state.sim.directorGuidance;
                }

                sendBtn.textContent = 'Thinking...';
                state.sim.lastSystemPrompt = systemPrompt;

                const llmConfig = A.UI.getActiveLLMConfig ? A.UI.getActiveLLMConfig() : null;
                if (!llmConfig || !llmConfig.apiKey) throw new Error("No API Key configured. Open API Configuration from the CFG lens.");

                const responseText = await A.Simulator.callLLM(llmConfig.provider, llmConfig.model, llmConfig.apiKey, systemPrompt, state.sim.history, llmConfig.baseUrl);

                // Extract fired microcues
                const firedMicrocues = [];
                if (state.sim.executionLog && state.sim.executionLog.length > 0) {
                    const lastTurn = state.sim.executionLog[state.sim.executionLog.length - 1];
                    (lastTurn.entries || []).forEach(e => {
                        if (e.passed && (e.type === 'microcue' || e.type === 'actor-cue')) {
                            firedMicrocues.push(e.name);
                        }
                    });
                }

                // Post-processing
                let finalResponse = responseText;
                try {
                    const postResult = A.Simulator.processRound(responseText, state.sim.history, 'output');
                    if (postResult.context.responseText && postResult.context.responseText !== responseText) {
                        finalResponse = postResult.context.responseText;
                    } else if (postResult.context.output && postResult.context.output !== responseText) {
                        finalResponse = postResult.context.output;
                    }
                    if (postResult.logs && postResult.logs.length) {
                        roundResult.logs.push(...postResult.logs);
                    }
                } catch (e) {
                    console.warn("Post-processing failed", e);
                }

                state.sim.history.push({
                    role: 'model',
                    content: finalResponse,
                    timestamp: new Date().toISOString(),
                    emotionalSnapshot: {
                        pulse: [...(state.sim.emotions?.all || [])],
                        eros: state.sim.eros?.currentVibe || 0,
                        intent: state.sim.intent || 'unknown',
                        microcuesFired: firedMicrocues
                    },
                    injections: {
                        logs: roundResult.logs || [],
                        systemPrompt: systemPrompt,
                        activeTags: finalContext.tags || [],
                        loreEntries: state.sim.lastLogicResult ? state.sim.lastLogicResult.filter(r => r.type === 'entry').length : 0,
                        original: {
                            personality: state.character?.compiled?.personality || state.seed?.persona || '',
                            scenario: state.character?.compiled?.scenario || state.seed?.scenario || ''
                        },
                        final: {
                            personality: finalContext.character?.personality || '',
                            scenario: finalContext.character?.scenario || ''
                        }
                    }
                });

                refreshChat();

            } catch (e) {
                console.error(e);
                A.UI.Toast.show(e.message, 'error');
                state.sim.history.push({ role: 'system', content: `[Error: ${e.message}]`, timestamp: new Date().toISOString() });
                refreshChat();
            } finally {
                sendBtn.disabled = false;
                sendBtn.textContent = 'Send';
            }
        };

        async function regenerateMessage(index) {
            const state = A.State.get();
            state.sim.history = state.sim.history.slice(0, index);
            A.State.notify();
            refreshChat();

            if (state.sim.history.length > 0) {
                const lastMsg = state.sim.history[state.sim.history.length - 1];
                if (lastMsg.role === 'user') {
                    await processAIResponse(lastMsg.content);
                } else {
                    if (A.UI.Toast) A.UI.Toast.show('Cannot regenerate: Context does not end with a user message', 'warning');
                }
            }
        }

        // Initialize
        refreshChat();

        const sendMessage = async () => {
            const txt = input.value.trim();
            if (!txt) return;

            const state = A.State.get();
            if (dirGuidance && dirGuidance.value.trim()) {
                state.sim.directorGuidance = dirGuidance.value.trim();
                dirGuidance.value = '';
            }

            state.sim.history.push({
                role: 'user',
                content: txt,
                timestamp: new Date().toISOString(),
                emotionalSnapshot: {
                    pulse: [...(state.sim.emotions?.all || [])],
                    eros: state.sim.eros?.currentVibe || 0,
                    intent: state.sim.intent || 'unknown',
                    microcuesFired: []
                }
            });
            input.value = '';
            refreshChat();

            await processAIResponse(txt);
        };

        sendBtn.onclick = sendMessage;
        input.onkeydown = e => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        };

        chatCol.querySelector('#btn-clear-chat').onclick = () => {
            const state = A.State.get();
            state.sim.history = [];
            A.State.notify();
            refreshChat();
        };

        // --- Branch Management ---
        const branchSelect = chatCol.querySelector('#branch-select');

        function refreshBranchSelect() {
            const state = A.State.get();
            const branches = state.sim?.branches || {};
            const activeBranch = state.sim?.activeBranch || 'main';

            if (!branches.main) {
                branches.main = { history: state.sim.history || [], createdAt: new Date().toISOString() };
                state.sim.branches = branches;
                state.sim.activeBranch = 'main';
            }

            branchSelect.innerHTML = '';
            Object.keys(branches).forEach(name => {
                const opt = document.createElement('option');
                opt.value = name;
                const msgCount = branches[name].history?.length || 0;
                opt.textContent = `🌿 ${name} (${msgCount})`;
                if (name === activeBranch) opt.selected = true;
                branchSelect.appendChild(opt);
            });
        }

        branchSelect.onchange = () => {
            const state = A.State.get();
            const targetBranch = branchSelect.value;
            const currentBranch = state.sim.activeBranch || 'main';

            if (targetBranch === currentBranch) return;

            if (!state.sim.branches) state.sim.branches = {};
            state.sim.branches[currentBranch] = { ...state.sim.branches[currentBranch], history: JSON.parse(JSON.stringify(state.sim.history)) };

            const target = state.sim.branches[targetBranch];
            if (target) {
                state.sim.history = JSON.parse(JSON.stringify(target.history || []));
                state.sim.activeBranch = targetBranch;
                A.State.notify();
                refreshChat();
                if (A.UI.Toast) A.UI.Toast.show(`Switched to "${targetBranch}"`, 'info');
            }
        };

        refreshBranchSelect();

        branchSelect.ondblclick = () => {
            const state = A.State.get();
            const branchToDelete = branchSelect.value;

            if (branchToDelete === 'main') {
                if (A.UI.Toast) A.UI.Toast.show('Cannot delete main branch', 'warning');
                return;
            }

            if (!confirm(`Delete branch "${branchToDelete}"?`)) return;

            delete state.sim.branches[branchToDelete];
            state.sim.activeBranch = 'main';
            state.sim.history = JSON.parse(JSON.stringify(state.sim.branches.main?.history || []));

            A.State.notify();
            refreshChat();
            refreshBranchSelect();
            if (A.UI.Toast) A.UI.Toast.show(`Deleted branch "${branchToDelete}"`, 'info');
        };

        chatCol.querySelector('#btn-run-all').onclick = async () => {
            if (A.Tester) {
                A.Tester.clear();
                A.Tester.log('system', 'Running full simulation trace...');
                A.Tester.run();
                A.State.notify();
            }
        };

        // --- Story Export ---
        chatCol.querySelector('#btn-export-story').onclick = async () => {
            const state = A.State.get();
            const history = state.sim?.history || [];

            if (!history.length) {
                if (A.UI.Toast) A.UI.Toast.show('No messages to export', 'warning');
                return;
            }

            const characterName = state.character?.compiled?.name || state.seed?.name || 'Character';
            const storyLines = [`# Story Export`, `*Featuring: ${characterName}*`, '', '---', ''];

            history.forEach(msg => {
                if (msg.role === 'system') return;
                storyLines.push(msg.content || '');
                storyLines.push('');
            });

            const storyText = storyLines.join('\n');
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
            const filename = `story_${characterName.toLowerCase().replace(/\s+/g, '_')}_${timestamp}.md`;

            await A.IO.save(storyText, filename, 'text/markdown');

            if (A.UI.Toast) A.UI.Toast.show('Story exported successfully', 'success');
        };

        // --- Live Session Management ---
        const liveSessionSelect = chatCol.querySelector('#live-session-select');

        const refreshLiveSessionList = () => {
            const state = A.State.get();
            if (!state.sim.chatSessions) state.sim.chatSessions = {};
            const sessions = Object.entries(state.sim.chatSessions)
                .filter(([_, s]) => s.mode === 'live')
                .map(([name, s]) => ({ name, ...s }));

            liveSessionSelect.innerHTML = `<option value="">-- Sessions (${sessions.length}) --</option>`;
            sessions.forEach(s => {
                const msgCount = s.messages?.length || 0;
                const opt = document.createElement('option');
                opt.value = s.name;
                opt.textContent = `${s.name} (${msgCount} msgs)`;
                liveSessionSelect.appendChild(opt);
            });
        };

        refreshLiveSessionList();

        liveSessionSelect.ondblclick = () => {
            const state = A.State.get();
            const sessionToDelete = liveSessionSelect.value;

            if (!sessionToDelete) {
                if (A.UI.Toast) A.UI.Toast.show('Select a session to delete', 'warning');
                return;
            }

            if (!confirm(`Delete session "${sessionToDelete}"?`)) return;

            delete state.sim.chatSessions[sessionToDelete];
            A.State.notify();
            refreshLiveSessionList();
            if (A.UI.Toast) A.UI.Toast.show(`Deleted session "${sessionToDelete}"`, 'info');
        };

        chatCol.querySelector('#btn-live-save').onclick = () => {
            const state = A.State.get();
            if (!state.sim.chatSessions) state.sim.chatSessions = {};

            const name = prompt('Session name:', `Live ${Object.keys(state.sim.chatSessions).length + 1}`);
            if (!name) return;

            state.sim.chatSessions[name] = {
                messages: JSON.parse(JSON.stringify(state.sim.history || [])),
                savedAt: new Date().toISOString(),
                mode: 'live'
            };

            A.State.notify();
            refreshLiveSessionList();
            if (A.UI.Toast) A.UI.Toast.show(`Session "${name}" saved`, 'success');
        };

        chatCol.querySelector('#btn-live-load').onclick = () => {
            const name = liveSessionSelect.value;
            if (!name) {
                if (A.UI.Toast) A.UI.Toast.show('Select a session first', 'warning');
                return;
            }

            const state = A.State.get();
            const session = state.sim.chatSessions?.[name];
            if (!session) {
                if (A.UI.Toast) A.UI.Toast.show('Session not found', 'error');
                return;
            }

            state.sim.history = JSON.parse(JSON.stringify(session.messages || []));
            A.State.notify();
            refreshChat();
            if (A.UI.Toast) A.UI.Toast.show(`Loaded "${name}"`, 'success');
        };

        // Return refresh function for external access
        return { refreshChat };
    }

    // Export
    A.SimulatorLive = {
        renderLiveMode: renderLiveMode
    };

})(window.Anansi);
