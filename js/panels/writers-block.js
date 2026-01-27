/*
 * Anansi Panel: The Writer's Block
 * File: js/panels/writers-block.js
 * Category: Forbidden Secrets
 * Description: AI-powered writing assistant for brainstorming and editing
 */

(function (A) {
    'use strict';

    // Constants
    const GENRES = [
        'Fantasy', 'Sci-Fi', 'Romance', 'Horror', 'Mystery', 'Thriller',
        'Literary Fiction', 'Historical', 'Urban Fantasy', 'Dystopian',
        'Comedy', 'Drama', 'Adventure', 'Slice of Life', 'Erotica'
    ];

    const EMPHASIS_OPTIONS = [
        'Prose Style', 'World-building', 'Dialogue', 'Pacing',
        'Character Voice', 'Sensory Detail', 'Tension/Conflict',
        'Romance', 'Action', 'Mystery', 'Humor', 'Emotional Depth'
    ];

    const TEMPLATES = {
        brainstorm: [
            { label: 'Scene brainstorm', prompt: 'Help me brainstorm a scene where [CHARACTER] has to...' },
            { label: 'Character dynamic', prompt: 'How can I improve the dynamic between [CHARACTER A] and [CHARACTER B]?' },
            { label: 'Unique introduction', prompt: 'What would be a unique introduction for a scenario involving these elements where...' },
            { label: 'Subvert expectations', prompt: 'How could I subvert the expectation that...' }
        ],
        edit: [
            { label: 'Critique pacing', prompt: 'Critique this passage for pacing and flow:\n\n' },
            { label: 'Show don\'t tell', prompt: 'How can I show instead of tell here?\n\n' },
            { label: 'Stronger verbs', prompt: 'Suggest stronger verbs for this action sequence:\n\n' },
            { label: 'Character intro', prompt: 'What\'s missing from this character introduction?\n\n' }
        ]
    };

    function render(container) {
        const state = A.State.get();

        // Ensure writersBlock state exists
        if (!state.writersBlock) {
            state.writersBlock = {
                mode: 'brainstorm',
                genres: [],
                emphasis: [],
                selectedActors: [],
                selectedLocations: [],
                history: [],
                pinnedIds: [],
                activeBranch: 'main',
                branches: { main: { history: [] } },
                sessions: {}
            };
        }
        const wb = state.writersBlock;

        // Migrate from single genre to array
        if (wb.genre && !wb.genres) {
            wb.genres = [wb.genre];
            delete wb.genre;
        }
        if (!wb.genres) wb.genres = [];
        if (!wb.selectedActors) wb.selectedActors = [];
        if (!wb.selectedLocations) wb.selectedLocations = [];
        if (!wb.contextWindow) wb.contextWindow = 20; // Default: last 20 messages
        if (!wb.contextSummary) wb.contextSummary = ''; // Summary of older context

        // Ensure branches exist
        if (!wb.branches) wb.branches = { main: { history: [] } };
        if (!wb.activeBranch) wb.activeBranch = 'main';
        if (!wb.branches[wb.activeBranch]) wb.branches[wb.activeBranch] = { history: [] };

        // Sync history with active branch
        if (!wb.history) wb.history = wb.branches[wb.activeBranch].history || [];

        // Get project data
        const actors = Object.values(state.nodes?.actors?.items || {});
        const locations = state.weaves?.locations || [];

        // Layout - 2 column
        container.style.display = 'grid';
        container.style.gridTemplateColumns = '280px 1fr';
        container.style.gap = 'var(--space-4)';
        container.style.height = '100%';
        container.style.overflow = 'hidden';

        container.innerHTML = `
            <!-- Left: Control Panel -->
            <div class="card" style="display:flex; flex-direction:column; height:100%; overflow:hidden; padding:0;">
                <div class="card-header" style="flex-shrink:0; border-bottom:1px solid var(--border-subtle); padding:12px;">
                    <strong>✍️ Writer's Block</strong>
                </div>
                <div style="flex:1; overflow-y:auto; padding:12px; display:flex; flex-direction:column; gap:12px;">
                    <!-- Mode -->
                    <div>
                        <div style="font-size:10px; color:var(--text-muted); margin-bottom:4px; text-transform:uppercase; font-weight:bold;">Mode</div>
                        <div style="display:flex; gap:4px; background:var(--bg-base); border-radius:var(--radius-md); padding:2px;">
                            <button class="btn btn-sm mode-btn" data-mode="brainstorm" style="border-radius:var(--radius-sm); flex:1;">💡 Brainstorm</button>
                            <button class="btn btn-sm mode-btn" data-mode="edit" style="border-radius:var(--radius-sm); flex:1;">✏️ Edit</button>
                        </div>
                    </div>
                    <!-- Genre Chips -->
                    <div>
                        <div style="font-size:10px; color:var(--text-muted); margin-bottom:4px; text-transform:uppercase; font-weight:bold;">Genre</div>
                        <div id="genre-chips" style="display:flex; flex-wrap:wrap; gap:4px;"></div>
                    </div>
                    <!-- Emphasis Chips -->
                    <div>
                        <div style="font-size:10px; color:var(--text-muted); margin-bottom:4px; text-transform:uppercase; font-weight:bold;">Emphasis</div>
                        <div id="emphasis-chips" style="display:flex; flex-wrap:wrap; gap:4px;"></div>
                    </div>
                    <!-- Actor Chips -->
                    <div>
                        <div style="font-size:10px; color:var(--text-muted); margin-bottom:4px; text-transform:uppercase; font-weight:bold;">Actors</div>
                        <div id="actor-chips" style="display:flex; flex-wrap:wrap; gap:4px;"></div>
                    </div>
                    <!-- Location Chips -->
                    <div>
                        <div style="font-size:10px; color:var(--text-muted); margin-bottom:4px; text-transform:uppercase; font-weight:bold;">Locations</div>
                        <div id="location-chips" style="display:flex; flex-wrap:wrap; gap:4px;"></div>
                    </div>
                    <!-- Context Management -->
                    <div style="border-top:1px solid var(--border-subtle); padding-top:12px; margin-top:4px;">
                        <div style="font-size:10px; color:var(--text-muted); margin-bottom:6px; text-transform:uppercase; font-weight:bold;">Context</div>
                        <div style="display:flex; gap:8px; align-items:center; margin-bottom:8px;">
                            <label style="font-size:10px; color:var(--text-secondary);">Window:</label>
                            <select class="input" id="sel-context-window" style="flex:1; font-size:10px;">
                                <option value="10">Last 10</option>
                                <option value="20">Last 20</option>
                                <option value="40">Last 40</option>
                                <option value="0">All</option>
                            </select>
                        </div>
                        <button class="btn btn-secondary btn-sm" id="btn-summarize" style="width:100%; font-size:10px;">📝 Summarize Older Context</button>
                        <div id="context-summary-preview" style="margin-top:8px; font-size:9px; color:var(--text-muted); font-style:italic; max-height:60px; overflow-y:auto;"></div>
                    </div>
                </div>
                <!-- Sessions/Branches Footer -->
                <div style="flex-shrink:0; border-top:1px solid var(--border-subtle); padding:12px; display:flex; flex-direction:column; gap:8px;">
                    <div style="display:flex; gap:4px; align-items:center;">
                        <select class="input" id="branch-select" style="flex:1; font-size:10px;"></select>
                        <button class="btn btn-ghost btn-sm" id="btn-new-branch" title="New Branch">+</button>
                    </div>
                    <div style="display:flex; gap:4px; align-items:center;">
                        <select class="input" id="session-select" style="flex:1; font-size:10px;"></select>
                        <button class="btn btn-ghost btn-sm" id="btn-save-session" title="Save Session">💾</button>
                        <button class="btn btn-ghost btn-sm" id="btn-load-session" title="Load Session">📂</button>
                    </div>
                </div>
            </div>

            <!-- Right: Chat Panel -->
            <div class="card" style="display:flex; flex-direction:column; height:100%; overflow:hidden; padding:0;">
                <!-- Chat Log -->
                <div id="chat-log" style="flex:1; overflow-y:auto; padding:12px; display:flex; flex-direction:column; gap:8px; background:var(--bg-base);"></div>
                <!-- Footer -->
                <div style="flex-shrink:0; border-top:1px solid var(--border-subtle); padding:12px; display:flex; flex-direction:column; gap:8px;">
                    <div style="display:flex; gap:8px;">
                        <select class="input" id="sel-template" style="min-width:160px; font-size:11px;">
                            <option value="">📝 Templates...</option>
                        </select>
                        <div style="flex:1;"></div>
                        <button class="btn btn-ghost btn-sm" id="btn-export" title="Export as Markdown">📤 Export</button>
                        <button class="btn btn-ghost btn-sm" id="btn-clear">🗑️ Clear</button>
                    </div>
                    <div style="display:flex; gap:8px;">
                        <textarea class="input" id="chat-input" rows="3" placeholder="Ask for help with your writing..." style="flex:1; resize:none;"></textarea>
                        <button class="btn btn-primary" id="btn-send" style="align-self:flex-end;">Send</button>
                    </div>
                </div>
            </div>
        `;

        // --- Element References ---
        const chatLog = container.querySelector('#chat-log');
        const input = container.querySelector('#chat-input');
        const sendBtn = container.querySelector('#btn-send');
        const genreContainer = container.querySelector('#genre-chips');
        const emphasisContainer = container.querySelector('#emphasis-chips');
        const actorContainer = container.querySelector('#actor-chips');
        const locationContainer = container.querySelector('#location-chips');
        const branchSelect = container.querySelector('#branch-select');
        const sessionSelect = container.querySelector('#session-select');

        // --- Chip Renderer Helper ---
        const renderChips = (containerEl, options, selectedArray, onToggle) => {
            containerEl.innerHTML = '';
            if (options.length === 0) {
                containerEl.innerHTML = '<span style="font-size:10px; color:var(--text-muted); font-style:italic;">None available</span>';
                return;
            }
            options.forEach(opt => {
                const value = typeof opt === 'string' ? opt : opt.id;
                const label = typeof opt === 'string' ? opt : (opt.name || opt.id);
                const isActive = selectedArray.includes(value);
                const chip = document.createElement('button');
                chip.className = 'btn btn-sm';
                chip.style.cssText = `
                    background: ${isActive ? 'var(--accent-primary)' : 'var(--bg-elevated)'};
                    color: ${isActive ? 'var(--bg-base)' : 'var(--text-secondary)'};
                    border: 1px solid ${isActive ? 'var(--accent-primary)' : 'var(--border-subtle)'};
                    font-size: 10px;
                    padding: 4px 8px;
                `;
                chip.textContent = label;
                chip.onclick = () => onToggle(value, isActive);
                containerEl.appendChild(chip);
            });
        };

        // --- Mode Toggle ---
        const updateModeButtons = () => {
            container.querySelectorAll('.mode-btn').forEach(btn => {
                const isActive = btn.dataset.mode === wb.mode;
                btn.style.background = isActive ? 'var(--accent-primary)' : 'transparent';
                btn.style.color = isActive ? 'var(--bg-base)' : 'var(--text-secondary)';
            });
        };
        updateModeButtons();

        // --- Template Dropdown ---
        const templateSelect = container.querySelector('#sel-template');

        const refreshTemplates = () => {
            const templates = TEMPLATES[wb.mode] || [];
            templateSelect.innerHTML = '<option value="">📝 Templates...</option>' +
                templates.map((t, i) => `<option value="${i}">${t.label}</option>`).join('');
        };
        refreshTemplates();

        templateSelect.onchange = () => {
            const idx = parseInt(templateSelect.value);
            if (isNaN(idx)) return;

            const templates = TEMPLATES[wb.mode] || [];
            const selected = templates[idx];
            if (selected) {
                input.value = selected.prompt;
                input.focus();
            }
            templateSelect.value = ''; // Reset to placeholder
        };

        container.querySelectorAll('.mode-btn').forEach(btn => {
            btn.onclick = () => {
                wb.mode = btn.dataset.mode;
                updateModeButtons();
                refreshTemplates(); // Update templates for new mode
                A.State.notify();
            };
        });

        // --- Genre Chips ---
        const renderGenreChips = () => {
            renderChips(genreContainer, GENRES, wb.genres, (value, wasActive) => {
                if (wasActive) {
                    wb.genres = wb.genres.filter(g => g !== value);
                } else {
                    wb.genres.push(value);
                }
                A.State.notify();
                renderGenreChips();
            });
        };
        renderGenreChips();

        // --- Emphasis Chips ---
        const renderEmphasisChips = () => {
            renderChips(emphasisContainer, EMPHASIS_OPTIONS, wb.emphasis, (value, wasActive) => {
                if (wasActive) {
                    wb.emphasis = wb.emphasis.filter(e => e !== value);
                } else {
                    wb.emphasis.push(value);
                }
                A.State.notify();
                renderEmphasisChips();
            });
        };
        renderEmphasisChips();

        // --- Actor Chips ---
        const renderActorChips = () => {
            renderChips(actorContainer, actors, wb.selectedActors, (value, wasActive) => {
                if (wasActive) {
                    wb.selectedActors = wb.selectedActors.filter(a => a !== value);
                } else {
                    wb.selectedActors.push(value);
                }
                A.State.notify();
                renderActorChips();
            });
        };
        renderActorChips();

        // --- Location Chips ---
        const renderLocationChips = () => {
            renderChips(locationContainer, locations, wb.selectedLocations, (value, wasActive) => {
                if (wasActive) {
                    wb.selectedLocations = wb.selectedLocations.filter(l => l !== value);
                } else {
                    wb.selectedLocations.push(value);
                }
                A.State.notify();
                renderLocationChips();
            });
        };
        renderLocationChips();

        // --- Context Management ---
        const contextWindowSelect = container.querySelector('#sel-context-window');
        const summaryPreview = container.querySelector('#context-summary-preview');

        // Set initial value
        contextWindowSelect.value = wb.contextWindow.toString();

        // Update summary preview
        const updateSummaryPreview = () => {
            if (wb.contextSummary) {
                summaryPreview.textContent = wb.contextSummary.substring(0, 150) + (wb.contextSummary.length > 150 ? '...' : '');
            } else {
                summaryPreview.textContent = 'No summary yet.';
            }
        };
        updateSummaryPreview();

        contextWindowSelect.onchange = () => {
            wb.contextWindow = parseInt(contextWindowSelect.value);
            A.State.notify();
        };

        container.querySelector('#btn-summarize').onclick = async () => {
            const windowSize = parseInt(wb.contextWindow) || 20;
            if (wb.history.length <= windowSize) {
                if (A.UI.Toast) A.UI.Toast.show('Not enough history to summarize', 'info');
                return;
            }

            const olderMessages = wb.history.slice(0, -windowSize);
            if (olderMessages.length === 0) return;

            const btn = container.querySelector('#btn-summarize');
            btn.disabled = true;
            btn.textContent = 'Summarizing...';

            try {
                const llmConfig = A.UI.getActiveLLMConfig ? A.UI.getActiveLLMConfig() : null;
                if (!llmConfig || !llmConfig.apiKey) {
                    throw new Error('No API Key configured.');
                }

                const messagesText = olderMessages.map(m =>
                    `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`
                ).join('\n\n');

                const summaryPrompt = 'You are a summarization assistant. Summarize the following conversation into a concise paragraph capturing the key topics, decisions, and ideas discussed. Keep it under 200 words.';

                const maxTokens = A.UI?.getMaxTokensFor?.('writersBlock') || 4096;
                const summary = await A.LLM.generate(summaryPrompt, [{
                    role: 'user',
                    content: messagesText
                }], { maxTokens });

                wb.contextSummary = summary;
                A.State.notify();
                updateSummaryPreview();
                if (A.UI.Toast) A.UI.Toast.show('Context summarized!', 'success');

            } catch (err) {
                console.error('[WritersBlock] Summarize error:', err);
                if (A.UI.Toast) A.UI.Toast.show(err.message, 'error');
            } finally {
                btn.disabled = false;
                btn.textContent = '📝 Summarize Older Context';
            }
        };

        // --- Branch Management ---
        const refreshBranchSelect = () => {
            const branches = Object.keys(wb.branches);
            branchSelect.innerHTML = branches.map(b =>
                `<option value="${b}" ${b === wb.activeBranch ? 'selected' : ''}>🌿 ${b} (${wb.branches[b].history?.length || 0})</option>`
            ).join('');
        };
        refreshBranchSelect();

        branchSelect.onchange = () => {
            const targetBranch = branchSelect.value;
            if (targetBranch === wb.activeBranch) return;

            // Save current
            wb.branches[wb.activeBranch].history = JSON.parse(JSON.stringify(wb.history));

            // Load target
            wb.activeBranch = targetBranch;
            wb.history = JSON.parse(JSON.stringify(wb.branches[targetBranch].history || []));
            A.State.notify();
            refreshChat();
            if (A.UI.Toast) A.UI.Toast.show(`Switched to "${targetBranch}"`, 'info');
        };

        container.querySelector('#btn-new-branch').onclick = () => {
            const name = prompt('Branch name:', `branch_${Object.keys(wb.branches).length + 1}`);
            if (!name) return;

            // Save current
            wb.branches[wb.activeBranch].history = JSON.parse(JSON.stringify(wb.history));

            // Create new from current
            wb.branches[name] = { history: JSON.parse(JSON.stringify(wb.history)) };
            wb.activeBranch = name;
            A.State.notify();
            refreshBranchSelect();
            if (A.UI.Toast) A.UI.Toast.show(`Created branch "${name}"`, 'success');
        };

        // --- Session Management ---
        const refreshSessionSelect = () => {
            const sessions = Object.keys(wb.sessions);
            sessionSelect.innerHTML = `<option value="">-- Sessions (${sessions.length}) --</option>` +
                sessions.map(s => `<option value="${s}">${s}</option>`).join('');
        };
        refreshSessionSelect();

        container.querySelector('#btn-save-session').onclick = () => {
            const name = prompt('Session label:', `Notes ${Object.keys(wb.sessions).length + 1}`);
            if (!name) return;

            wb.sessions[name] = {
                history: JSON.parse(JSON.stringify(wb.history)),
                branches: JSON.parse(JSON.stringify(wb.branches)),
                activeBranch: wb.activeBranch,
                genres: [...wb.genres],
                emphasis: [...wb.emphasis],
                selectedActors: [...wb.selectedActors],
                selectedLocations: [...wb.selectedLocations],
                mode: wb.mode,
                savedAt: new Date().toISOString()
            };
            A.State.notify();
            refreshSessionSelect();
            if (A.UI.Toast) A.UI.Toast.show(`Session "${name}" saved`, 'success');
        };

        container.querySelector('#btn-load-session').onclick = () => {
            const name = sessionSelect.value;
            if (!name) {
                if (A.UI.Toast) A.UI.Toast.show('Select a session first', 'warning');
                return;
            }

            const session = wb.sessions[name];
            if (!session) return;

            wb.history = JSON.parse(JSON.stringify(session.history || []));
            wb.branches = JSON.parse(JSON.stringify(session.branches || { main: { history: [] } }));
            wb.activeBranch = session.activeBranch || 'main';
            wb.genres = session.genres || [];
            wb.emphasis = session.emphasis || [];
            wb.selectedActors = session.selectedActors || [];
            wb.selectedLocations = session.selectedLocations || [];
            wb.mode = session.mode || 'brainstorm';

            A.State.notify();
            refreshChat();
            refreshBranchSelect();
            updateModeButtons();
            renderGenreChips();
            renderEmphasisChips();
            renderActorChips();
            renderLocationChips();
            if (A.UI.Toast) A.UI.Toast.show(`Loaded "${name}"`, 'success');
        };

        // --- Chat Rendering ---
        const refreshChat = () => {
            chatLog.innerHTML = '';

            if (!wb.history.length) {
                chatLog.innerHTML = `
                    <div style="text-align:center; color:var(--text-muted); padding:40px; opacity:0.7;">
                        <div style="font-size:48px; margin-bottom:16px;">✍️</div>
                        <div style="font-size:14px; margin-bottom:8px;">The Writer's Block</div>
                        <div style="font-size:11px;">Your AI writing partner. Ask for help with ideas, prose, or feedback.</div>
                    </div>
                `;
                return;
            }

            wb.history.forEach((msg, idx) => {
                const isPinned = wb.pinnedIds.includes(msg.id);
                const isUser = msg.role === 'user';

                const msgEl = document.createElement('div');
                msgEl.style.cssText = `
                    padding: 10px 14px;
                    border-radius: var(--radius-md);
                    background: ${isUser ? 'var(--accent-soft)' : 'var(--bg-elevated)'};
                    border: 1px solid ${isPinned ? 'var(--accent-primary)' : 'var(--border-subtle)'};
                    max-width: 85%;
                    align-self: ${isUser ? 'flex-end' : 'flex-start'};
                    position: relative;
                `;

                msgEl.innerHTML = `
                    <div style="font-size:12px; white-space:pre-wrap; line-height:1.5;">${msg.content}</div>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px; font-size:9px; color:var(--text-muted);">
                        <span>${isUser ? 'You' : '✍️ Assistant'}</span>
                        <div style="display:flex; gap:8px;">
                            <span class="btn-pin" style="cursor:pointer; opacity:0.7;" title="${isPinned ? 'Unpin' : 'Pin'}">${isPinned ? '📌' : '📍'}</span>
                            <span class="btn-copy" style="cursor:pointer; opacity:0.7;" title="Copy">📋</span>
                        </div>
                    </div>
                `;

                msgEl.querySelector('.btn-pin').onclick = () => {
                    if (isPinned) {
                        wb.pinnedIds = wb.pinnedIds.filter(id => id !== msg.id);
                    } else {
                        wb.pinnedIds.push(msg.id);
                    }
                    A.State.notify();
                    refreshChat();
                    updateLens();
                };

                msgEl.querySelector('.btn-copy').onclick = () => {
                    navigator.clipboard.writeText(msg.content);
                    if (A.UI.Toast) A.UI.Toast.show('Copied to clipboard', 'info');
                };

                chatLog.appendChild(msgEl);
            });

            chatLog.scrollTop = chatLog.scrollHeight;
        };
        refreshChat();

        // --- System Prompt Generation ---
        const generateSystemPrompt = () => {
            let prompt = '';

            const genreText = wb.genres.length > 0 ? wb.genres.join(', ') : 'general fiction';

            if (wb.mode === 'brainstorm') {
                prompt = `You are a professional writing partner and creative consultant specializing in ${genreText}. Help the user brainstorm ideas, develop concepts, and explore creative directions. Be encouraging, offer alternatives, and ask clarifying questions when helpful.`;
            } else {
                prompt = `You are a professional editor and writing coach specializing in ${genreText}. Provide constructive feedback, suggest improvements, and help refine the user's prose. Be specific, actionable, and supportive.`;
            }

            if (wb.emphasis.length > 0) {
                prompt += `\n\nPut special emphasis on: ${wb.emphasis.join(', ')}.`;
            }

            // Selected Actors
            if (wb.selectedActors.length > 0) {
                const selectedActorData = actors.filter(a => wb.selectedActors.includes(a.id));
                if (selectedActorData.length > 0) {
                    const actorSummary = selectedActorData.map(a => {
                        let desc = a.name;
                        if (a.gender) desc += ` (${a.gender})`;
                        if (a.traits?.personality) desc += ` - ${a.traits.personality.substring(0, 80)}`;
                        return desc;
                    }).join('; ');
                    prompt += `\n\n[Selected Actors: ${actorSummary}]`;
                }
            }

            // Selected Locations
            if (wb.selectedLocations.length > 0) {
                const selectedLocData = locations.filter(l => wb.selectedLocations.includes(l.id));
                if (selectedLocData.length > 0) {
                    const locSummary = selectedLocData.map(l => {
                        let desc = l.name;
                        if (l.description) desc += ` - ${l.description.substring(0, 60)}`;
                        return desc;
                    }).join('; ');
                    prompt += `\n[Selected Locations: ${locSummary}]`;
                }
            }

            return prompt;
        };

        // --- Send Message ---
        const sendMessage = async () => {
            const text = input.value.trim();
            if (!text) return;

            const userMsg = {
                id: 'msg_' + crypto.randomUUID().split('-')[0],
                role: 'user',
                content: text,
                timestamp: new Date().toISOString()
            };

            wb.history.push(userMsg);
            input.value = '';
            refreshChat();

            sendBtn.disabled = true;
            sendBtn.textContent = 'Thinking...';

            try {
                const llmConfig = A.UI.getActiveLLMConfig ? A.UI.getActiveLLMConfig() : null;
                if (!llmConfig || !llmConfig.apiKey) {
                    throw new Error('No API Key configured. Open API Configuration from the toolbar.');
                }

                const systemPrompt = generateSystemPrompt();

                // Apply sliding window
                let historyToSend = wb.history.map(m => ({
                    role: m.role === 'user' ? 'user' : 'model',
                    content: m.content
                }));

                const windowSize = parseInt(wb.contextWindow) || 0;
                if (windowSize > 0 && historyToSend.length > windowSize) {
                    historyToSend = historyToSend.slice(-windowSize);

                    // Prepend summary if available
                    if (wb.contextSummary) {
                        historyToSend.unshift({
                            role: 'user',
                            content: `[Previous context summary: ${wb.contextSummary}]`
                        });
                    }
                }

                const maxTokens = A.UI?.getMaxTokensFor?.('writersBlock') || 4096;
                const response = await A.LLM.generate(systemPrompt, historyToSend, { maxTokens });

                const aiMsg = {
                    id: 'msg_' + crypto.randomUUID().split('-')[0],
                    role: 'model',
                    content: response,
                    timestamp: new Date().toISOString()
                };

                wb.history.push(aiMsg);
                A.State.notify();
                refreshChat();

            } catch (err) {
                console.error('[WritersBlock]', err);
                if (A.UI.Toast) A.UI.Toast.show(err.message, 'error');

                wb.history.push({
                    id: 'msg_' + crypto.randomUUID().split('-')[0],
                    role: 'model',
                    content: `[Error: ${err.message}]`,
                    timestamp: new Date().toISOString()
                });
                refreshChat();
            } finally {
                sendBtn.disabled = false;
                sendBtn.textContent = 'Send';
            }
        };

        sendBtn.onclick = sendMessage;
        input.onkeydown = (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        };

        // --- Export to Markdown ---
        container.querySelector('#btn-export').onclick = async () => {
            if (wb.history.length === 0) {
                if (A.UI.Toast) A.UI.Toast.show('Nothing to export', 'info');
                return;
            }

            const lines = [];
            lines.push(`# Writer's Block Session`);
            lines.push(`**Branch:** ${wb.activeBranch}`);
            lines.push(`**Genres:** ${wb.genres.length > 0 ? wb.genres.join(', ') : 'None'}`);
            lines.push(`**Emphasis:** ${wb.emphasis.length > 0 ? wb.emphasis.join(', ') : 'None'}`);
            lines.push(`**Mode:** ${wb.mode}`);
            lines.push(`**Exported:** ${new Date().toLocaleString()}`);
            lines.push('');
            lines.push('---');
            lines.push('');

            wb.history.forEach(msg => {
                const isPinned = wb.pinnedIds.includes(msg.id);
                const prefix = msg.role === 'user' ? '**You:**' : '**Assistant:**';
                const pin = isPinned ? ' 📌' : '';
                lines.push(`${prefix}${pin}`);
                lines.push(msg.content);
                lines.push('');
            });

            const markdown = lines.join('\n');
            const filename = `writers-block-${wb.activeBranch}-${Date.now()}.md`;

            await A.IO.save(markdown, filename, 'text/markdown');

            if (A.UI.Toast) A.UI.Toast.show('Session exported!', 'success');
        };

        // --- Clear Chat ---
        container.querySelector('#btn-clear').onclick = () => {
            if (confirm('Clear all messages in this branch?')) {
                wb.history = [];
                A.State.notify();
                refreshChat();
            }
        };

        // --- Lens (Pinned Messages) ---
        const updateLens = () => {
            A.UI.setLens((lensRoot) => {
                lensRoot.innerHTML = '<div style="padding:12px; font-family:var(--font-mono); font-size:11px;">';
                lensRoot.innerHTML += '<div style="margin-bottom:12px; font-weight:bold; color:var(--accent-primary); border-bottom:1px solid var(--border-subtle); padding-bottom:8px;">📌 Pinned Ideas</div>';

                const pinned = wb.history.filter(m => wb.pinnedIds.includes(m.id));

                if (pinned.length === 0) {
                    lensRoot.innerHTML += '<div style="color:var(--text-muted); font-style:italic;">No pinned messages yet. Click 📍 on a message to pin it.</div>';
                } else {
                    pinned.forEach(msg => {
                        lensRoot.innerHTML += `
                            <div style="margin-bottom:12px; background:var(--bg-elevated); padding:8px; border-radius:4px; border-left:3px solid var(--accent-primary);">
                                <div style="font-size:10px; white-space:pre-wrap; line-height:1.4;">${msg.content.substring(0, 200)}${msg.content.length > 200 ? '...' : ''}</div>
                            </div>
                        `;
                    });
                }

                lensRoot.innerHTML += '</div>';
            });
        };
        updateLens();
    }

    A.registerPanel('writers-block', {
        label: "Writer's Block",
        subtitle: 'AI Assistant',
        category: 'Sacred Tools',
        render: render
    });

})(window.Anansi);

// Tour Registration
if (window.Anansi.UI && window.Anansi.UI.Tour) {
    window.Anansi.UI.Tour.register('writers-block', [
        {
            target: '.mode-btn',
            title: "The Writer's Block",
            content: 'Toggle between Brainstorm mode (open ideation) and Edit mode (focused critique).'
        },
        {
            target: '#genre-chips',
            title: 'Genre Context',
            content: 'Select one or more genres to tune the AI assistant to relevant tropes and conventions.'
        },
        {
            target: '#emphasis-chips',
            title: 'Emphasis',
            content: 'Toggle multiple emphasis areas to focus the AI on specific aspects of your writing.'
        },
        {
            target: '#actor-chips',
            title: 'Actors',
            content: 'Select specific actors from your project to include in the brainstorming context.'
        },
        {
            target: '#location-chips',
            title: 'Locations',
            content: 'Select specific locations from your project to include in the brainstorming context.'
        },
        {
            target: '#btn-save-session',
            title: 'Session Management',
            content: 'Save your conversation with a label for later reference. Load previous sessions to continue where you left off.'
        }
    ]);
}
