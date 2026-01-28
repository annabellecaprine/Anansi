/*
 * World Weaver: UI & Rendering (Coordinator)
 * File: js/panels/world_weaver/ui.js
 * (Refactored to use modular Steps)
 */

(function (A) {
    'use strict';

    A.WorldWeaver = A.WorldWeaver || {};

    // Helper to save sessions
    const SESSIONS_KEY = 'anansi_world_weaver_sessions';
    function loadSessions() {
        try {
            return JSON.parse(localStorage.getItem(SESSIONS_KEY)) || {};
        } catch (e) { return {}; }
    }
    function saveSessions(sessions) {
        localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
    }

    // Function Declaration (Hoisted) to fix ReferenceError
    // Function Declaration (Hoisted) to fix ReferenceError
    // ACTIVE SESSION PERSISTENCE (Survives Reloads)
    const ACTIVE_SESSION_KEY = 'anansi_active_ww_session';

    function render(container) {
        const sessions = loadSessions();
        const state = A.State.get();

        // 1. Check State (Session Memory)
        // 2. Check LocalStorage (Persisted Memory)
        const activeId = state?.worldWeaver?.currentSessionId || localStorage.getItem(ACTIVE_SESSION_KEY);

        // Restore active session if present and valid
        if (activeId && sessions[activeId]) {
            // Sync state if needed
            if (!state.worldWeaver) state.worldWeaver = {};
            state.worldWeaver.currentSessionId = activeId;

            A.WorldWeaver.renderMainInterface(container, sessions[activeId], sessions, state);
        } else {
            // Clean up invalid ID
            if (activeId) localStorage.removeItem(ACTIVE_SESSION_KEY);
            A.WorldWeaver.renderSetupWizard(container, sessions);
        }
    }

    function createNewSession(name, worldId, modeId, contentRating, storyFocus, importedActor = null, customTags = '') {
        const T = A.WorldWeaver.Templates;
        // console.log("[WorldWeaver] CreateSession Debug:", {
        //     T_Keys: T ? Object.keys(T) : 'Templates Undefined',
        //     worldId,
        //     modeId,
        //     ArchArray: T?.WORLD_ARCHETYPES
        // });

        if (!T) throw new Error("Templates object is missing!");
        if (!T.WORLD_ARCHETYPES) throw new Error("WORLD_ARCHETYPES array is missing from Templates!");

        const arch = T.WORLD_ARCHETYPES.find(x => x.id === worldId);
        const mode = T.STORY_MODES.find(x => x.id === modeId);

        const timestamp = Date.now();
        const sessionId = 'session_' + timestamp;

        const categories = {};
        const baseFacets = A.WorldWeaver.Templates.combineFacets(arch, mode);

        Object.keys(baseFacets).forEach(cat => {
            categories[cat] = {
                id: cat,
                label: cat.charAt(0).toUpperCase() + cat.slice(1),
                items: [],
                subFacets: baseFacets[cat] || []
            };
        });

        return {
            id: sessionId,
            name: name || `New World (${new Date().toLocaleDateString()})`,
            created: timestamp,
            lastModified: timestamp,
            worldArchetype: worldId,
            storyMode: modeId,
            contentRating: contentRating || 'sfw',
            storyFocus: storyFocus || 'protagonist',
            flavorTags: customTags,
            importedActor: importedActor,
            categories: categories,
            chatHistory: [
                { role: 'system', content: `You are the World Weaver...` },
                { role: 'assistant', content: A.WorldWeaver.Templates.getIntroMessage(arch, mode) }
            ],
            overallProgress: 0,
            currentFocus: null,
            settings: { customBoundaries: '' },
            mode: 'build' // 'build' | 'brainstorm'
        };
    }

    // Expose for Steps to trigger updates
    A.WorldWeaver.renderSetupWizard = function (container, sessions, forceStep = 1) {
        const T = A.WorldWeaver.Templates;
        const state = A.State.get();

        if (!state.worldWeaver) state.worldWeaver = {};
        if (!state.worldWeaver.setupState) {
            state.worldWeaver.setupState = {
                step: forceStep,
                name: '',
                worldId: null,
                modeId: null,
                contentRating: 'sfw',
                storyFocus: 'protagonist',
                customTags: '',
                actor: null
            };
        } else if (forceStep) {
            state.worldWeaver.setupState.step = forceStep;
        }

        const setupState = state.worldWeaver.setupState;

        container.innerHTML = '';
        const wizard = document.createElement('div');
        wizard.className = 'absolute inset-0 flex-col items-center scroll-y p-lg bg-base';

        const header = `
            <div class="text-center mb-lg animate-fade-in">
                <div style="font-size:48px;" class="mb-md opacity-90">🕸️</div>
                <div class="text-2xl font-bold text-primary mb-xs">World Weaver</div>
                <div class="text-sm text-muted">Step ${setupState.step} of 3</div>
                <div class="flex-row justify-center gap-sm mt-md">
                    <div class="h-1 rounded-full ${setupState.step >= 1 ? 'bg-accent' : 'bg-elevated'}" style="width:30px;"></div>
                    <div class="h-1 rounded-full ${setupState.step >= 2 ? 'bg-accent' : 'bg-elevated'}" style="width:30px;"></div>
                    <div class="h-1 rounded-full ${setupState.step >= 3 ? 'bg-accent' : 'bg-elevated'}" style="width:30px;"></div>
                </div>
            </div>
        `;

        const contentBox = document.createElement('div');
        contentBox.className = 'w-full animate-slide-up';
        contentBox.style.maxWidth = '600px';
        contentBox.innerHTML = header;

        const onNext = (nextStep) => A.WorldWeaver.renderSetupWizard(container, sessions, nextStep);
        const onBack = (prevStep) => A.WorldWeaver.renderSetupWizard(container, sessions, prevStep);

        const onFinish = () => {
            console.log("[WorldWeaver] Finish clicked");
            try {
                if (!setupState.worldId || !setupState.modeId) {
                    throw new Error("Missing World Archetype or Story Mode selected.");
                }
                const newSession = createNewSession(
                    setupState.name, setupState.worldId, setupState.modeId,
                    setupState.contentRating, setupState.storyFocus,
                    setupState.actor, setupState.customTags
                );
                sessions[newSession.id] = newSession;
                saveSessions(sessions);
                delete state.worldWeaver.setupState;
                state.worldWeaver.currentSessionId = newSession.id;
                localStorage.setItem(ACTIVE_SESSION_KEY, newSession.id);
                A.WorldWeaver.renderMainInterface(container, newSession, sessions, state);
            } catch (e) {
                console.error("[WorldWeaver] Finish Error:", e);
                A.UI.Toast.show("Failed to create world: " + e.message, 'error');
            }
        };

        if (setupState.step === 1 && A.WorldWeaver.Steps.renderStep1) {
            A.WorldWeaver.Steps.renderStep1(contentBox, setupState, onNext);
        }
        else if (setupState.step === 2 && A.WorldWeaver.Steps.renderStep2) {
            A.WorldWeaver.Steps.renderStep2(contentBox, setupState, onNext, onBack);
        }
        else if (setupState.step === 3 && A.WorldWeaver.Steps.renderStep3) {
            // Callback for Step 3 to trigger re-render
            const refresh = () => A.WorldWeaver.renderSetupWizard(container, sessions, 3);

            // Pass refresh to module
            A.WorldWeaver.Steps.renderStep3(contentBox, setupState, sessions, onFinish, onBack, refresh);
        }

        wizard.appendChild(contentBox);

        if (setupState.step === 1) {
            const sessionsList = Object.values(sessions);
            if (sessionsList.length > 0) {
                const sessionSection = document.createElement('div');
                sessionSection.className = 'w-full mt-xl border-t border-subtle pt-lg';
                sessionSection.style.maxWidth = '600px';
                sessionSection.innerHTML = `<div class="text-sm font-bold text-secondary mb-sm uppercase">Continue Session</div>`;

                sessionsList.sort((a, b) => b.lastModified - a.lastModified).forEach(s => {
                    const row = document.createElement('div');
                    row.className = 'flex-row p-md bg-panel border-subtle border rounded-md mb-sm cursor-pointer transition-all hover:border-primary';
                    row.innerHTML = `
                       <div class="text-2xl mr-md">${(A.WorldWeaver.Templates.WORLD_ARCHETYPES.find(a => a.id === s.worldArchetype) || {}).icon || '📄'}</div>
                       <div class="flex-1">
                           <div class="font-bold text-primary">${s.name}</div>
                           <div class="text-xs text-muted">Last played: ${s.lastModified ? new Date(s.lastModified).toLocaleDateString() : 'Just now'}</div>
                       </div>
                       <div class="delete-btn p-sm mr-sm opacity-60 cursor-pointer text-error hover:opacity-100" title="Delete Session">🗑️</div>
                       <div class="text-secondary">→</div>
                    `;
                    // row.onmouseover handled by CSS hover class
                    // row.onmouseout handled by CSS hover class
                    row.onclick = () => {
                        delete state.worldWeaver.setupState;
                        state.worldWeaver.currentSessionId = s.id;
                        localStorage.setItem(ACTIVE_SESSION_KEY, s.id);
                        A.WorldWeaver.renderMainInterface(container, s, sessions, state);
                    };

                    row.querySelector('.delete-btn').onclick = (e) => {
                        e.stopPropagation();
                        if (confirm(`Delete session "${s.name}"? This cannot be undone.`)) {
                            delete sessions[s.id];
                            saveSessions(sessions);
                            // Refresh wizard
                            A.WorldWeaver.renderSetupWizard(container, sessions, 1);
                        }
                    };
                    sessionSection.appendChild(row);
                });
                wizard.appendChild(sessionSection);
            }
        }

        container.appendChild(wizard);
    };

    A.WorldWeaver.renderMainInterface = function (container, session, sessions, state) {
        container.innerHTML = `
            <div class="ww-interface w-full h-full flex-row items-stretch overflow-hidden">
                <div class="ww-sidebar w-300 bg-panel border-r border-subtle flex-col flex-shrink-0"></div>
                <div class="ww-content flex-1 flex-col bg-base min-w-0"></div>
            </div>
        `;

        const sidebar = container.querySelector('.ww-sidebar');
        const content = container.querySelector('.ww-content');

        renderSidebar(sidebar, session, sessions, state, container);
        renderChat(content, session, sessions, state);
    }

    function renderSidebar(sidebar, session, sessions, state, container) {
        // Ensure session.mode is initialized
        if (!session.mode) session.mode = 'build';

        const T = A.WorldWeaver.Templates;
        const currentGenre = T.WORLD_ARCHETYPES.find(t => t.id === session.worldArchetype);
        const isProtagonistMode = session.storyFocus === 'protagonist';

        // Inject Styles for Animations & Progress
        if (!document.getElementById('ww-ui-styles')) {
            const style = document.createElement('style');
            style.id = 'ww-ui-styles';
            style.textContent = `
                @keyframes ww-pulse {
                    0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.7); border-color: var(--accent-primary); }
                    50% { transform: scale(1.03); box-shadow: 0 0 12px 2px rgba(99, 102, 241, 0.4); border-color: var(--accent-primary); }
                    100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(99, 102, 241, 0); border-color: transparent; }
                }
                .ww-category-row {
                    padding: 10px;
                    border-radius: 8px;
                    cursor: pointer;
                    margin-bottom: 6px;
                    border: 1px solid transparent;
                    transition: all 0.2s ease;
                    background: transparent;
                }
                .ww-category-row:hover {
                    background: var(--bg-elevated);
                }
                .ww-category-row.active {
                    background: var(--bg-elevated);
                    border-color: var(--border-subtle);
                }
                .ww-pulse {
                    animation: ww-pulse 1.2s ease-out;
                    z-index: 10;
                    position: relative;
                }
                .ww-progress-bg {
                    height: 4px;
                    width: 100%;
                    background: var(--bg-base);
                    border-radius: 2px;
                    margin-top: 8px;
                    overflow: hidden;
                }
                .ww-progress-fill {
                    height: 100%;
                    border-radius: 2px;
                    transition: width 0.5s ease, background-color 0.5s ease;
                }
            `;
            document.head.appendChild(style);
        }

        let protagonistName = null;
        if (isProtagonistMode) {
            if (session.importedActor?.name) {
                protagonistName = session.importedActor.name;
            } else if (session.cast?.length > 0) {
                const mainChar = session.cast.find(c => c.role?.toLowerCase().includes('main') || c.role?.toLowerCase().includes('protagonist')) || session.cast[0];
                protagonistName = mainChar?.name;
            }
        }

        const protagonistIndicator = isProtagonistMode && protagonistName
            ? `<div class="mt-sm p-sm bg-elevated rounded-md flex-row gap-sm">
                   <span class="text-base">🎭</span>
                   <span class="text-xs font-bold text-primary">${protagonistName}</span>
               </div>`
            : isProtagonistMode ? `<div class="mt-sm p-sm bg-elevated rounded-md text-xs text-muted italic">🎭 Protagonist not yet named</div>` : '';

        sidebar.innerHTML = `
            <div class="p-lg border-b border-subtle">
                <div class="text-xl font-bold font-serif mb-xs" style="margin-left:-4px;">${session.name}</div>
                <div class="flex-row items-center gap-sm opacity-60">
                    <div class="status-dot ${session.contentRating === 'ADULT' ? 'error' : 'busy'}"></div>
                    <div class="text-tiny text-uppercase font-bold tracking-wider">${session.contentRating} - ${session.storyFocus}</div>
                </div>
                ${protagonistIndicator}
            </div>

            <div class="flex-1 scroll-y p-sm">
                 <div id="ww-categories-list"></div>
                 
                 <div id="ww-entity-suggestions" class="mt-md px-sm">
                    <!-- Detected Entities will appear here -->
                 </div>
            </div>

            <div class="p-md border-t border-subtle flex-col gap-sm">
                <button id="ww-view-context" class="btn btn-secondary btn-sm w-full">👁️ View Active Context</button>
                <button id="ww-generate" class="btn btn-primary w-full py-sm">✨ Generate Output</button>
                <button id="ww-back" class="btn btn-ghost btn-sm w-full">↩️ Back to Sessions</button>
            </div>
        `;

        const catList = sidebar.querySelector('#ww-categories-list');
        Object.entries(T.CATEGORIES).forEach(([key, conf]) => {
            const catState = session.categories[key] || { confidence: 0 };
            const confidence = Number(catState.confidence || 0);

            // Color Logic (Gray -> Yellow -> Blue -> Green)
            let color = 'var(--text-muted)'; // 0%
            if (confidence > 0) color = 'var(--warning)'; // 1-49%
            if (confidence >= 50) color = 'var(--accent-primary)'; // 50-79%
            if (confidence >= 80) color = 'var(--success)'; // 80-100%

            let displayLabel = conf.label;
            if (key === 'cast') displayLabel = isProtagonistMode ? 'Protagonist' : 'Cast & Characters';

            const row = document.createElement('div');
            row.className = `ww-category-row ${session.currentFocus === key ? 'active' : ''} mb-xs p-sm rounded-md cursor-pointer relative`;
            // Tight styling to remove scrollbar (CSS)
            row.dataset.key = key; // For pulse targeting

            row.innerHTML = `
                <div class="flex-row gap-sm items-center">
                    <span class="text-base">${conf.icon}</span>
                    <span class="flex-1 text-xs font-bold ${session.currentFocus === key ? 'text-primary' : 'text-secondary'}">${displayLabel}</span>
                    <span class="text-[11px] font-bold" style="color:${color};">${confidence}%</span>
                </div>
                <div class="ww-progress-bg">
                    <div class="ww-progress-fill" style="width:${confidence}%; background-color:${color};"></div>
                </div>
            `;

            row.onclick = () => {
                const targetContainer = container.closest('.ww-interface') ? container.closest('.ww-interface').parentNode : container;

                // If Thinking: specific safe behavior (View/Edit but no Focus Switch/Re-render)
                if (state.worldWeaver?.isThinking) {
                    showCategoryDetails(session, key, sessions, targetContainer, state);
                    return;
                }

                session.currentFocus = key;
                saveSessions(sessions);
                showCategoryDetails(session, key, sessions, targetContainer, state);
                // Simple re-render of sidebar
                renderSidebar(sidebar, session, sessions, state, container);
            };
            catList.appendChild(row);
        });

        sidebar.querySelector('#ww-back').onclick = () => {
            state.worldWeaver.currentSessionId = null;
            localStorage.removeItem(ACTIVE_SESSION_KEY);
            state.worldWeaver.showSetup = true;
            A.State.notify();
            render(container.closest('.ww-interface') ? container.closest('.ww-interface').parentNode : container);
        };
        sidebar.querySelector('#ww-generate').onclick = () => showGenerationOptions(session, sessions);
        sidebar.querySelector('#ww-view-context').onclick = () => showContextModal(session);

        // Render existing suggestions if any
        if (session.entitySuggestions && session.entitySuggestions.length > 0) {
            renderEntitySuggestions(sidebar.querySelector('#ww-entity-suggestions'), session, sessions);
        }
    }

    function showCategoryDetails(session, key, sessions, container, state) {
        const T = A.WorldWeaver.Templates;
        const conf = T.CATEGORIES[key];
        const data = session.categories[key] || { notes: '' };

        const modal = document.createElement('div');
        modal.className = 'modal';

        modal.innerHTML = `
            <div class="modal-backdrop"></div>
            <div class="modal-content flex-col w-full p-lg" style="max-width:600px; height:80vh;">
                <div class="font-bold text-lg mb-md">${conf.label}</div>
                <textarea id="cat-notes" class="input flex-1 p-md resize-none font-mono text-sm leading-relaxed">${data.notes || ''}</textarea>
                <div class="mt-lg flex-row justify-end">
                     <button id="save-notes" class="btn btn-primary">Save & Close</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        modal.querySelector('#save-notes').onclick = () => {
            session.categories[key].notes = modal.querySelector('#cat-notes').value;
            saveSessions(sessions);
            modal.remove();

            // If thinking, avoid destructively re-rendering the whole interface
            if (state && state.worldWeaver && state.worldWeaver.isThinking) {
                // Just refresh sidebar if possible, but safe to do nothing as session is Ref
                // Maybe pulse?
                if (A.UI?.Toast?.show) A.UI.Toast.show('Notes saved.', 'success');
            } else {
                if (container) render(container);
            }
        };
        modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    }

    function renderChat(container, session, sessions, state) {
        const T = A.WorldWeaver.Templates;

        container.innerHTML = `
            <div id="ww-chat-messages" class="flex-1 scroll-y p-lg flex-col gap-md"></div>
            <div id="ww-chat-status" class="px-lg h-5 text-xs text-muted italic"></div>
            <!-- Chat Styles for Formatting -->
            <style>
                #ww-chat-messages strong { color: #facc15; font-weight: 700; } /* Yellow/Gold for emphasis */
                #ww-chat-messages em { color: #e5e5e5; font-style: italic; }
                #ww-chat-messages .chat-code-inline { background: rgba(255,255,255,0.1); padding: 2px 4px; border-radius: 4px; font-family: monospace; }
                #ww-chat-messages ul { margin-left: 20px; }
            </style>
            <div class="p-md bg-elevated border-t border-subtle">
                <!-- Header: Mode Switch -->
                <div class="flex-row justify-end items-center mb-md gap-md">
                     <div class="text-[10px] text-muted font-bold text-uppercase tracking-wider">Mode:</div>
                     <div id="ww-mode-switch" class="flex-row bg-inset rounded-full border border-subtle cursor-pointer relative" style="width:200px; height:32px; padding:2px;">
                        <div id="ww-mode-highlight" class="absolute bg-accent rounded-full transition-all duration-300 shadow-sm" style="top:2px; left:2px; width:calc(50% - 2px); height:calc(100% - 4px);"></div>
                        
                        <div class="ww-mode-opt flex-1 flex-row items-center justify-center text-tiny font-bold text-white relative z-10 transition-colors select-none" data-mode="build">BUILD</div>
                        <div class="ww-mode-opt flex-1 flex-row items-center justify-center text-tiny font-bold text-muted relative z-10 transition-colors select-none" data-mode="brainstorm">BRAINSTORM</div>
                     </div>
                </div>

                <div class="flex-row gap-sm items-stretch">
                    <textarea id="ww-chat-input" placeholder="${session.mode === 'brainstorm' ? 'Ask me anything to spark ideas...' : 'Type your answer...'}" class="flex-1 p-md rounded-md bg-surface text-primary resize-none transition-all input" style="height:48px; min-height:48px;"></textarea>
                    <button id="ww-send-btn" class="px-lg bg-accent text-white rounded-md font-bold cursor-pointer transition-all btn shadow-sm hover:brightness-110 active:scale-95" style="min-width:100px;">
                        ${session.mode === 'brainstorm' ? 'Spark ✨' : 'Send'}
                    </button>
                </div>
            </div>
        `;
        const chatList = container.querySelector('#ww-chat-messages');

        // Mode Switch Logic
        const modeSwitch = container.querySelector('#ww-mode-switch');
        const highlight = container.querySelector('#ww-mode-highlight');
        const opts = container.querySelectorAll('.ww-mode-opt');
        const input = container.querySelector('#ww-chat-input');
        const sendBtn = container.querySelector('#ww-send-btn');

        const updateModeUI = (mode) => {
            session.mode = mode;
            // Save immediately
            saveSessions(sessions);

            if (mode === 'build') {
                highlight.style.left = '2px';
                highlight.style.background = 'var(--accent-primary)';
                opts[0].style.color = 'white';
                opts[1].style.color = 'var(--text-muted)';
                input.placeholder = 'Type your answer...';
                input.style.borderColor = 'var(--border-subtle)';
                input.style.boxShadow = 'none';
                sendBtn.style.background = 'var(--accent-primary)';
                sendBtn.textContent = 'Send';
            } else {
                highlight.style.left = '50%';
                highlight.style.background = '#d946ef'; // Magenta for brainstorming
                opts[0].style.color = 'var(--text-muted)';
                opts[1].style.color = 'white';
                input.placeholder = 'Ask me anything to spark ideas...';
                input.style.borderColor = '#d946ef';
                input.style.boxShadow = '0 0 0 1px #d946ef';
                sendBtn.style.background = '#d946ef';
                sendBtn.textContent = 'Spark ✨';
            }
        };

        // Initialize UI State
        if (session.mode === 'brainstorm') {
            updateModeUI('brainstorm');
        }

        modeSwitch.onclick = () => {
            const newMode = session.mode === 'build' ? 'brainstorm' : 'build';
            updateModeUI(newMode);
        };

        session.chatHistory.forEach(msg => {
            const el = document.createElement('div');
            el.style.cssText = `max-width: 80%; padding: 12px 16px; border-radius: 12px; line-height: 1.5; white-space: pre-wrap; ${msg.role === 'user' ? 'align-self:flex-end; background:var(--accent-primary); color:white;' : 'align-self:flex-start; background:var(--bg-elevated); color:var(--text-primary); border:1px solid var(--border-subtle);'}`;

            let finalHtml = '';

            // 1. Analysis / Content
            if (msg.content) {
                finalHtml += `<div>${A.ChatFormatter ? A.ChatFormatter.format(msg.content) : msg.content}</div>`;
            }

            // Assistant-specific formatting (Badge + Question)
            if (msg.role === 'assistant') {
                let questionCat = msg.questions?.[0]?.category || msg.category;

                // NORMALIZE KEY (Fix for missing badges)
                if (questionCat && !T.CATEGORIES[questionCat]) {
                    const normalized = questionCat.toLowerCase().replace(/[^a-z]/g, '');
                    const found = Object.keys(T.CATEGORIES).find(k => k.toLowerCase() === normalized);
                    if (found) questionCat = found;
                }

                // 2. Badge (Separator)
                if (questionCat && T.CATEGORIES[questionCat]) {
                    const conf = T.CATEGORIES[questionCat];
                    const badgeHtml = `<div style="margin: 12px 0 6px 0; display:inline-flex; align-items:center; gap:6px; padding:4px 8px; background:rgba(255,255,255,0.05); border-radius:4px; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; border:1px solid rgba(255,255,255,0.1); color:var(--text-secondary);"><span>${conf.icon}</span> <span>${conf.label}</span></div>`;
                    finalHtml += badgeHtml;
                }

                // 3. Question
                if (msg.question) {
                    finalHtml += `<div style="font-weight:600; font-size:1.05em; margin-top:4px; color:var(--text-primary);">${msg.question}</div>`;
                }

                // 4. Suggestion Chips
                if (msg.questions && msg.questions.length > 0) {
                    msg.questions.forEach(q => {
                        if (q.suggestion) {
                            const chipId = `sugg-${Math.random().toString(36).substr(2, 9)}`;
                            finalHtml += `
                                <div class="ww-suggestion-chip" id="${chipId}" style="margin-top: 8px; display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; background: var(--bg-surface); border: 1px solid var(--accent-primary); border-radius: 16px; font-size: 12px; color: var(--text-primary); cursor: pointer; transition: all 0.2s; opacity: 0.9;">
                                    <span style="color:var(--accent-primary);">✨</span>
                                    <span>${q.suggestion}</span>
                                </div>
                            `;

                            // Defer click handler attachment until after append
                            setTimeout(() => {
                                const chip = document.getElementById(chipId);
                                if (chip) {
                                    chip.onmouseover = () => { chip.style.background = 'var(--bg-elevated)'; chip.style.transform = 'translateY(-1px)'; };
                                    chip.onmouseout = () => { chip.style.background = 'var(--bg-surface)'; chip.style.transform = 'none'; };
                                    chip.onclick = () => {
                                        const input = container.querySelector('#ww-chat-input');
                                        if (input) {
                                            input.value = q.suggestion;
                                            input.focus();
                                            chip.style.background = 'var(--accent-primary)';
                                            chip.style.color = 'white';
                                            setTimeout(() => {
                                                chip.style.background = 'var(--bg-surface)';
                                                chip.style.color = 'var(--text-primary)';
                                            }, 200);
                                        }
                                    };
                                }
                            }, 0);
                        }
                    });
                }
            }

            el.innerHTML = finalHtml || msg.content;
            chatList.appendChild(el);
        });
        chatList.scrollTop = chatList.scrollHeight;

        const send = async () => {
            if (state.worldWeaver?.isThinking) return;

            const input = container.querySelector('#ww-chat-input');
            const text = input.value.trim();
            if (!text) return;

            // Set Thinking State
            if (state.worldWeaver) state.worldWeaver.isThinking = true;

            session.chatHistory.push({ role: 'user', content: text });
            saveSessions(sessions);
            // Re-render chat (which will now show Thinking state if we wanted, or just updates history)
            // But we must PASS state
            renderChat(container, session, sessions, state);

            // Disable input
            if (input) input.disabled = true;
            const btn = container.querySelector('#ww-send-btn');
            if (btn) { btn.disabled = true; btn.textContent = '...'; }

            try {
                const statusEl = container.querySelector('#ww-chat-status');
                await A.WorldWeaver.LLM.evaluateAndRespond(session, sessions, (status) => {
                    if (statusEl) statusEl.textContent = status;
                });
            } catch (e) {
                console.error(e);
                if (container.querySelector('#ww-chat-status')) {
                    container.querySelector('#ww-chat-status').textContent = "Error: " + e.message;
                }
                A.UI.Toast.show("Thinking failed: " + e.message, 'error');
            } finally {
                // Clear Thinking State
                if (state.worldWeaver) state.worldWeaver.isThinking = false;

                // Final Render
                renderChat(container, session, sessions, state);

                // Refresh Sidebar (to update Progress Bars/Pulses)
                // We need to find the sidebar element. It's a sibling of container's parent.
                // container is .ww-content. Parent is .ww-interface. Sibling is .ww-sidebar.
                const sidebar = container.closest('.ww-interface')?.querySelector('.ww-sidebar');
                // Pass container (which is .ww-content) so closest logic works for Sidebar clicks
                if (sidebar) renderSidebar(sidebar, session, sessions, state, container);
            }
        };

        container.querySelector('#ww-send-btn').onclick = send;
        container.querySelector('#ww-chat-input').onkeydown = (e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
        };
    }




    function showGenerationOptions(session, sessions) {
        const isProtagonistMode = session.storyFocus === 'protagonist';

        const modal = document.createElement('div');
        modal.className = 'modal';

        modal.innerHTML = `
            <div class="modal-backdrop"></div>
            <div class="modal-content w-full p-lg" style="max-width:500px;">
                <h3 class="mt-0 mb-sm">🕸️ Generate World Output</h3>
                <p class="text-muted mb-lg">Your world is ${session.overallProgress || 0}% complete. Choose an output format:</p>

                <!--SETTINGS UI-- >
                <div style="margin-bottom:24px; padding:16px; background:var(--bg-elevated); border-radius:8px; border:1px solid var(--border-subtle);">
                     <div style="font-size:12px; font-weight:700; color:var(--text-muted); text-transform:uppercase; margin-bottom:12px;">Generation Settings</div>
                     
                     <!-- Dossier Detail Slider -->
                     <label style="display:block; margin-bottom:12px;">
                        <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                            <span style="font-size:13px; font-weight:600;">Information Density</span>
                            <span id="label-dossier" style="font-size:11px; color:var(--accent-primary);">High (Comprehensive)</span>
                        </div>
                        <input type="range" id="set-dossier" min="0" max="1" step="1" value="1" style="width:100%; cursor:pointer;">
                     </label>

                     <!-- Card Verbosity Slider -->
                     <label style="display:block;">
                        <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                            <span style="font-size:13px; font-weight:600;">Writing Verbosity</span>
                            <span id="label-verbosity" style="font-size:11px; color:var(--accent-primary);">Standard (Chat Optimized)</span>
                        </div>
                        <input type="range" id="set-verbosity" min="0" max="1" step="1" value="0" style="width:100%; cursor:pointer;">
                     </label>
                </div>

                <div style="display: flex; flex-direction: column; gap: 12px;">
                    <button class="ww-gen-option" data-type="character" style="display:flex; align-items:center; gap:16px; padding:16px; background:var(--bg-elevated); border:1px solid var(--border-subtle); border-radius:8px; cursor:pointer; text-align:left; color:var(--text-primary);">
                        <span style="font-size: 24px;">👤</span>
                        <div>
                            <strong>${isProtagonistMode ? 'Generate Character Card' : 'Generate Main Character'}</strong>
                            <div style="font-size: 12px; color: var(--text-muted);">Multi-step AI-powered character generation</div>
                        </div>
                    </button>
                    ${!isProtagonistMode ? `
                    <button class="ww-gen-option" data-type="multicast" style="display:flex; align-items:center; gap:16px; padding:16px; background:var(--bg-elevated); border:1px solid var(--border-subtle); border-radius:8px; cursor:pointer; text-align:left; color:var(--text-primary);">
                        <span style="font-size: 24px;">👥</span>
                        <div>
                            <strong>Generate Ensemble Cast</strong>
                            <div style="font-size: 12px; color: var(--text-muted);">Generate cards for multiple characters</div>
                        </div>
                    </button>
                    ` : ''}
                    <button class="ww-gen-option" data-type="world" style="display:flex; align-items:center; gap:16px; padding:16px; background:var(--bg-elevated); border:1px solid var(--border-subtle); border-radius:8px; cursor:pointer; text-align:left; color:var(--text-primary);">
                        <span style="font-size: 24px;">🌍</span>
                        <div>
                            <strong>Generate World Lorebook</strong>
                            <div style="font-size: 12px; color: var(--text-muted);">Create comprehensive lore entries</div>
                        </div>
                    </button>
                    <button class="ww-gen-option" data-type="export" style="display:flex; align-items:center; gap:16px; padding:16px; background:var(--bg-elevated); border:1px solid var(--border-subtle); border-radius:8px; cursor:pointer; text-align:left; color:var(--text-primary);">
                        <span style="font-size: 24px;">📄</span>
                        <div>
                            <strong>Export World Bible</strong>
                            <div style="font-size: 12px; color: var(--text-muted);">Download as markdown document</div>
                        </div>
                    </button>
                </div>

                <button id="gen-modal-cancel" style="margin-top: 24px; width: 100%; padding: 12px; background: transparent; border: 1px solid var(--border-subtle); color: var(--text-primary); border-radius: 6px; cursor: pointer;">Cancel</button>
            </div>
            `;
        document.body.appendChild(modal);

        // Slider Logic
        const sliderDossier = modal.querySelector('#set-dossier');
        const sliderVerbosity = modal.querySelector('#set-verbosity');
        const labelDossier = modal.querySelector('#label-dossier');
        const labelVerbosity = modal.querySelector('#label-verbosity');

        sliderDossier.oninput = () => {
            labelDossier.textContent = sliderDossier.value === '1' ? 'High (Comprehensive)' : 'Low (Efficient)';
        };
        sliderVerbosity.oninput = () => {
            labelVerbosity.textContent = sliderVerbosity.value === '1' ? 'Literate (Novel Style)' : 'Standard (Chat Optimized)';
        };

        const getSettings = () => ({
            dossierDetail: sliderDossier.value === '1' ? 'high' : 'low',
            cardVerbosity: sliderVerbosity.value === '1' ? 'literate' : 'standard'
        });

        modal.querySelectorAll('.ww-gen-option').forEach(btn => {
            btn.onmouseover = () => { btn.style.borderColor = 'var(--accent-primary)'; btn.style.transform = 'translateY(-2px)'; };
            btn.onmouseout = () => { btn.style.borderColor = 'var(--border-subtle)'; btn.style.transform = 'none'; };
            btn.onclick = () => {
                const type = btn.dataset.type;
                const settings = getSettings();
                modal.remove();

                if (type === 'multicast') {
                    showMultiCastSelection(session, sessions, settings);
                } else if (type === 'character') {
                    // Use multi-step generation with settings
                    if (A.WorldWeaver.Generation?.generateCharacterMultiStep) {
                        A.WorldWeaver.Generation.generateCharacterMultiStep(session, sessions, ["Protagonist"], settings);
                    } else if (A.WorldWeaver.Generation?.handleGeneration) {
                        A.WorldWeaver.Generation.handleGeneration(session, sessions, 'character', settings);
                    }
                } else {
                    if (A.WorldWeaver.Generation?.handleGeneration) {
                        A.WorldWeaver.Generation.handleGeneration(session, sessions, type, settings);
                    }
                }
            };
        });

        modal.querySelector('#gen-modal-cancel').onclick = () => modal.remove();
        modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    }

    function showMultiCastSelection(session, sessions, settings) {
        const cast = session.cast || [];
        if (cast.length === 0) {
            A.UI.Toast.show('No cast members identified yet. Continue the interview to build your ensemble.', 'warning');
            return;
        }

        const modal = document.createElement('div');
        modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(0, 0, 0, 0.75); display: flex; align-items: center; justify-content: center;
        z-index: 9999; backdrop-filter: blur(4px);
        `;

        modal.innerHTML = `
            < div style = "max-width: 500px; background: var(--bg-surface); padding: 24px; border-radius: 12px; border: 1px solid var(--border-subtle); box-shadow: 0 10px 40px rgba(0,0,0,0.5);" >
                <h3 style="margin-top: 0;">👥 Select Characters to Generate</h3>
                <p style="color: var(--text-muted); margin-bottom: 16px;">Choose which cast members to generate cards for:</p>

                <div id="cast-list" style="display: flex; flex-direction: column; gap: 8px; max-height: 300px; overflow-y: auto; margin-bottom: 16px;">
                    ${cast.map((c, i) => `
                        <label style="display: flex; align-items: center; gap: 12px; padding: 12px; background: var(--bg-elevated); border-radius: 8px; cursor: pointer;">
                            <input type="checkbox" class="cast-check" data-idx="${i}" ${c.significance === 'major' ? 'checked' : ''}>
                            <div style="flex:1;">
                                <div style="font-weight: 600; color: var(--text-primary);">${c.name}</div>
                                <div style="font-size: 11px; color: var(--text-muted);">${c.role || 'Unknown Role'} · ${c.significance || 'minor'}</div>
                            </div>
                        </label>
                    `).join('')}
                </div>

                <div style="display: flex; gap: 8px;">
                    <button id="cast-cancel" style="flex:1; padding: 12px; background: transparent; border: 1px solid var(--border-subtle); color: var(--text-primary); border-radius: 6px; cursor: pointer;">Cancel</button>
                    <button id="cast-generate" style="flex:1; padding: 12px; background: var(--accent-primary); border: none; color: white; border-radius: 6px; cursor: pointer; font-weight: 600;">Generate Selected</button>
                </div>
            </div >
            `;
        document.body.appendChild(modal);

        modal.querySelector('#cast-cancel').onclick = () => modal.remove();
        modal.querySelector('#cast-generate').onclick = () => {
            const selected = [];
            modal.querySelectorAll('.cast-check:checked').forEach(cb => {
                const idx = parseInt(cb.dataset.idx);
                if (cast[idx]) selected.push(cast[idx].name);
            });

            if (selected.length === 0) {
                A.UI.Toast.show('Please select at least one character.', 'warning');
                return;
            }

            modal.remove();
            if (A.WorldWeaver.Generation?.generateCharacterMultiStep) {
                A.WorldWeaver.Generation.generateCharacterMultiStep(session, sessions, selected, settings);
            }
        };
        modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    }

    function showContextModal(session) {
        const T = A.WorldWeaver.Templates;
        const world = T.WORLD_ARCHETYPES.find(t => t.id === session.worldArchetype);
        const mode = T.STORY_MODES.find(t => t.id === session.storyMode);

        // Build actor context
        let actorContext = "None imported";
        if (session.importedActor) {
            const a = session.importedActor;
            actorContext = `IMPORTED ACTOR PROFILE: \n`;
            actorContext += `Name: ${a.name} \n`;
            if (a.gender) actorContext += `Gender: ${a.gender} \n`;
            if (a.pronouns) actorContext += `Pronouns: ${a.pronouns} \n`;
            if (a.description) actorContext += `Description: ${a.description} \n`;
            if (a.summary) actorContext += `Summary: ${a.summary} \n`;
            if (a.notes) actorContext += `Notes: ${a.notes} \n`;
        }

        // Build notes context
        let notesContext = "";
        Object.entries(session.categories).forEach(([key, data]) => {
            const label = T.CATEGORIES[key]?.label || key;
            if (data.notes && data.notes.trim()) {
                notesContext += `## ${label} \n${data.notes} \n\n`;
            } else if (data.summary) {
                notesContext += `## ${label} \n${data.summary} \n\n`;
            }
        });

        // Build tags context
        let tagsContext = "";
        if (session.flavorTags && typeof session.flavorTags === 'string' && session.flavorTags.trim().length > 0) {
            tagsContext = "=== CUSTOM TAGS ===\n" + session.flavorTags + "\n\n";
        }

        const fullContext = `=== SESSION INFO ===
            World: ${world?.label || session.worldArchetype}
        Mode: ${mode?.label || session.storyMode}
        Focus: ${session.storyFocus}
        Rating: ${session.contentRating}

${tagsContext}=== ACTOR DATA ===
            ${actorContext}

=== WORLD NOTES ===
            ${notesContext || '(No notes yet)'} `;

        const modal = document.createElement('div');
        modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(0, 0, 0, 0.75); display: flex; align - items: center; justify - content: center;
        z - index: 10001; backdrop - filter: blur(4px);
        `;

        modal.innerHTML = `
            < div style = "width: 800px; max-width: 90vw; height: 80vh; background: var(--bg-surface); display: flex; flex-direction: column; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.5); overflow: hidden;" >
                <div style="padding: 16px; border-bottom: 1px solid var(--border-subtle); display: flex; justify-content: space-between;">
                    <h3 style="margin:0">🧠 Active LLM Context</h3>
                    <button class="btn-close" style="background:none; border:none; color:var(--text-muted); cursor:pointer; font-size: 20px;">✕</button>
                </div>
                <div style="flex: 1; padding: 0; overflow: hidden;">
                    <textarea style="width: 100%; height: 100%; background: var(--bg-base); color: var(--text-primary); border: none; padding: 16px; font-family: monospace; font-size: 13px; resize: none; white-space: pre-wrap;" readonly>${fullContext}</textarea>
                </div>
            </div >
            `;

        document.body.appendChild(modal);
        modal.querySelector('.btn-close').onclick = () => modal.remove();
        modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    }

    function showEntitySuggestions(entities) {
        // 1. Get Active Session
        const state = A.State.get();
        const sessionId = state.worldWeaver?.currentSessionId;
        if (!sessionId) return;

        const sessions = loadSessions();
        const session = sessions[sessionId];
        if (!session) return;

        // 2. Add to session (Dedup against current suggestions AND current context)
        if (!session.entitySuggestions) session.entitySuggestions = [];
        let added = false;

        entities.forEach(ent => {
            const name = ent.name;
            // Check if already suggested
            if (session.entitySuggestions.find(e => e.name === name)) return;

            // Check if already in Cast (rough check)
            if (session.cast && session.cast.find(c => c.name.includes(name))) return;

            // Add
            session.entitySuggestions.push(ent);
            added = true;
        });

        if (added) {
            saveSessions(sessions);
            // 3. Trigger Sidebar Update (Targeting the specific container)
            const sidebar = document.querySelector('.ww-sidebar');
            const container = sidebar?.querySelector('#ww-entity-suggestions');
            if (container) {
                renderEntitySuggestions(container, session, sessions);
                // Flash attention
                container.style.animation = 'none';
                void container.offsetWidth;
                container.style.animation = 'ww-pulse 1s ease';
            }
        }
    }

    function renderEntitySuggestions(container, session, sessions) {
        if (!container) return;
        container.innerHTML = '';
        if (!session.entitySuggestions || session.entitySuggestions.length === 0) return;

        const header = document.createElement('div');
        header.style.cssText = "font-size:11px; font-weight:700; color:var(--text-muted); text-transform:uppercase; margin-bottom:8px; padding-left:4px;";
        header.textContent = "Detected Entities";
        container.appendChild(header);

        session.entitySuggestions.forEach((ent, idx) => {
            const el = document.createElement('div');
            el.style.cssText = "background:var(--bg-elevated); padding:8px; border-radius:6px; margin-bottom:4px; border:1px solid var(--border-subtle); display:flex; flex-direction:column; gap:4px; font-size:12px;";
            el.innerHTML = `
            < div style = "font-weight:600; color:var(--text-primary); display:flex; justify-content:space-between; align-items:center;" >
                    <span>${ent.name}</span>
                    <span style="font-size:10px; padding:2px 4px; background:rgba(255,255,255,0.1); border-radius:4px;">${ent.type}</span>
                </div >
                <div style="color:var(--text-secondary); font-size:11px; line-height:1.2;">
                    ${ent.context || 'Mentioned in chat'}
                </div>
                <div style="display:flex; gap:6px; margin-top:4px;">
                    <button class="es-btn-add" style="flex:1; padding:4px; cursor:pointer; background:var(--accent-primary); color:white; border:none; border-radius:4px; font-size:10px;">Add</button>
                    <button class="es-btn-dismiss" style="padding:4px 8px; cursor:pointer; background:transparent; border:1px solid var(--border-subtle); color:var(--text-muted); border-radius:4px; font-size:10px;">✕</button>
                </div>
        `;

            // Add Logic
            el.querySelector('.es-btn-add').onclick = () => {
                // Add to appropriate category notes
                const catMap = {
                    'Person': 'cast',
                    'Faction': 'setting',
                    'Place': 'setting',
                    'Object': 'setting'
                };
                const targetCat = catMap[ent.type] || 'worldRules';

                // Append to Notes
                if (!session.categories[targetCat].notes) session.categories[targetCat].notes = '';
                session.categories[targetCat].notes += `\n• ${ent.name} (${ent.type}): ${ent.context} `;

                // Remove from suggestions
                session.entitySuggestions.splice(idx, 1);
                saveSessions(sessions);
                renderEntitySuggestions(container, session, sessions);

                // Toast
                if (A.UI?.Toast?.show) A.UI.Toast.show(`Added ${ent.name} to ${targetCat} `, 'success');
            };

            // Dismiss Logic
            el.querySelector('.es-btn-dismiss').onclick = () => {
                session.entitySuggestions.splice(idx, 1);
                saveSessions(sessions);
                renderEntitySuggestions(container, session, sessions);
            };

            container.appendChild(el);
        });
    }

    // Main Public API (Attached cleanly)
    A.WorldWeaver.render = render;

    function pulseCategories(keys) {
        const list = document.getElementById('ww-categories-list');
        if (!list || !keys || keys.length === 0) return;

        console.log('[WorldWeaver] Pulsing categories:', keys);

        keys.forEach(key => {
            // Find row by dataset
            const row = list.querySelector(`.ww - category - row[data - key="${key}"]`);
            if (row) {
                // Remove class to reset animation if already playing
                row.classList.remove('ww-pulse');

                // Force reflow
                void row.offsetWidth;

                // Add class
                row.classList.add('ww-pulse');
            }
        });
    }



    // Expose Utility
    A.WorldWeaver.UI = {
        render,
        loadSessions,
        saveSessions,
        pulseCategories,
        showEntitySuggestions
    };

})(window.Anansi);
