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
            settings: { customBoundaries: '' }
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
        wizard.style.cssText = 'position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; overflow-y:auto; padding:20px; background:var(--bg-base);';

        const header = `
            <div style="text-align:center; margin-bottom:24px; animation: fadeIn 0.5s ease;">
                <div style="font-size:48px; margin-bottom:12px;">🕸️</div>
                <div style="font-size:24px; font-weight:700; color:var(--text-primary);">World Weaver</div>
                <div style="font-size:14px; color:var(--text-muted);">Step ${setupState.step} of 3</div>
                <div style="display:flex; justify-content:center; gap:8px; margin-top:12px;">
                    <div style="height:4px; width:30px; border-radius:2px; background:${setupState.step >= 1 ? 'var(--accent)' : 'var(--bg-elevated)'}"></div>
                    <div style="height:4px; width:30px; border-radius:2px; background:${setupState.step >= 2 ? 'var(--accent)' : 'var(--bg-elevated)'}"></div>
                    <div style="height:4px; width:30px; border-radius:2px; background:${setupState.step >= 3 ? 'var(--accent)' : 'var(--bg-elevated)'}"></div>
                </div>
            </div>
        `;

        const contentBox = document.createElement('div');
        contentBox.style.cssText = 'width:100%; max-width:600px; animation: slideUp 0.3s ease;';
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
                alert("Failed to create world: " + e.message);
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
                sessionSection.style.cssText = 'width:100%; max-width:600px; margin-top:40px; border-top:1px solid var(--border-subtle); padding-top:20px;';
                sessionSection.innerHTML = `<div style="font-size:14px; font-weight:600; color:var(--text-secondary); margin-bottom:12px; text-transform:uppercase;">Continue Session</div>`;

                sessionsList.sort((a, b) => b.lastModified - a.lastModified).forEach(s => {
                    const row = document.createElement('div');
                    row.style.cssText = 'display:flex; align-items:center; padding:12px; background:var(--bg-panel); border:1px solid var(--border-subtle); border-radius:8px; margin-bottom:8px; cursor:pointer; transition:all 0.2s;';
                    row.innerHTML = `
                       <div style="font-size:24px; margin-right:12px;">${(A.WorldWeaver.Templates.WORLD_ARCHETYPES.find(a => a.id === s.worldArchetype) || {}).icon || '📄'}</div>
                       <div style="flex:1;">
                           <div style="font-weight:600; color:var(--text-primary);">${s.name}</div>
                           <div style="font-size:11px; color:var(--text-muted);">Last played: ${s.lastModified ? new Date(s.lastModified).toLocaleDateString() : 'Just now'}</div>
                       </div>
                       <div class="delete-btn" style="padding:8px; margin-right:8px; opacity:0.6; cursor:pointer; color:var(--status-error);" title="Delete Session">🗑️</div>
                       <div style="color:var(--text-secondary);">→</div>
                    `;
                    row.onmouseover = () => row.style.borderColor = 'var(--text-primary)';
                    row.onmouseout = () => row.style.borderColor = 'var(--border-subtle)';
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
            <div class="ww-interface" style="display:flex; height:100%; width:100%;">
                <div class="ww-sidebar" style="width:300px; background:var(--bg-panel); border-right:1px solid var(--border-subtle); display:flex; flex-direction:column; flex-shrink:0;"></div>
                <div class="ww-content" style="flex:1; display:flex; flex-direction:column; background:var(--bg-base); min-width:0;"></div>
            </div>
        `;

        const sidebar = container.querySelector('.ww-sidebar');
        const content = container.querySelector('.ww-content');

        renderSidebar(sidebar, session, sessions, state, container);
        renderChat(content, session, sessions);
    }

    function renderSidebar(sidebar, session, sessions, state, container) {
        const T = A.WorldWeaver.Templates;
        // Fix: Use correct V2 property names
        const currentGenre = T.WORLD_ARCHETYPES.find(t => t.id === session.worldArchetype);
        const isProtagonistMode = session.storyFocus === 'protagonist';

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
            ? `<div style="margin-top:8px; padding:8px 12px; background:var(--bg-elevated); border-radius:6px; display:flex; align-items:center; gap:8px;">
                   <span style="font-size:16px;">🎭</span>
                   <span style="font-size:13px; color:var(--text-primary); font-weight:500;">${protagonistName}</span>
               </div>`
            : isProtagonistMode ? `<div style="margin-top:8px; padding:8px 12px; background:var(--bg-elevated); border-radius:6px; font-size:12px; color:var(--text-muted); font-style:italic;">🎭 Protagonist not yet named</div>` : '';

        sidebar.innerHTML = `
            <div style="padding:16px; border-bottom:1px solid var(--border-subtle);">
                <div style="font-weight:700; font-size:16px; margin-bottom:4px;">${session.name}</div>
                <div style="font-size:12px; color:var(--text-muted);">
                    ${currentGenre?.icon || '🕸️'} ${session.contentRating.toUpperCase()} · ${isProtagonistMode ? 'Protagonist' : 'Ensemble'}
                </div>
                ${protagonistIndicator}
            </div>

            <div style="flex:1; overflow-y:auto; padding:16px;">
                 <div id="ww-categories-list"></div>
            </div>

            <div style="padding:16px; border-top:1px solid var(--border-subtle); display:flex; flex-direction:column; gap:8px;">
                <button id="ww-view-context" style="padding:8px; background:var(--bg-surface); border:1px solid var(--border-subtle); border-radius:6px; cursor:pointer; font-size:12px; color:var(--text-secondary);">👁️ View Active Context</button>
                <button id="ww-generate" style="padding:12px; background:var(--accent); border:none; border-radius:6px; cursor:pointer; color:white; font-weight:600;">✨ Generate Output</button>
                <button id="ww-back" style="padding:8px; background:transparent; border:none; cursor:pointer; font-size:12px; color:var(--text-muted);">↩️ Back to Sessions</button>
            </div>
        `;

        const catList = sidebar.querySelector('#ww-categories-list');
        Object.entries(T.CATEGORIES).forEach(([key, conf]) => {
            const catState = session.categories[key] || { confidence: 0 };
            const confidence = Number(catState.confidence || 0);

            let color = '#4f46e5';
            if (confidence >= 100) color = '#10b981';
            if (confidence === 0) color = 'rgba(128,128,128,0.2)';

            let displayLabel = conf.label;
            if (key === 'cast') displayLabel = isProtagonistMode ? 'Protagonist' : 'Cast & Characters';

            const row = document.createElement('div');
            row.style.cssText = `display:flex; align-items:center; gap:8px; padding:8px; border-radius:6px; cursor:pointer; margin-bottom:2px; ${session.currentFocus === key ? 'background:var(--bg-elevated);' : ''}`;
            row.innerHTML = `<span style="width:20px;">${conf.icon}</span><span style="flex:1; font-size:13px; color:${session.currentFocus === key ? 'var(--text-primary)' : 'var(--text-secondary)'}">${displayLabel}</span>`;
            row.onclick = () => {
                session.currentFocus = key;
                saveSessions(sessions);
                showCategoryDetails(session, key, sessions, container.closest('.ww-interface') ? container.closest('.ww-interface').parentNode : container);
                // Simple re-render of sidebar
                renderSidebar(sidebar, session, sessions, state);
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
    }

    function showCategoryDetails(session, key, sessions, container) {
        const T = A.WorldWeaver.Templates;
        const conf = T.CATEGORIES[key];
        const data = session.categories[key] || { notes: '' };

        const modal = document.createElement('div');
        modal.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.8); display:flex; align-items:center; justify-content:center; z-index:10000;';

        modal.innerHTML = `
            <div style="background:var(--bg-surface); padding:24px; border-radius:12px; width:600px; max-width:90vw; height:80vh; display:flex; flex-direction:column;">
                <h3>${conf.label}</h3>
                <textarea id="cat-notes" style="flex:1; padding:12px; background:var(--bg-base); border:1px solid var(--border-subtle); border-radius:8px; resize:none; color:var(--text-primary); white-space: pre-wrap;">${data.notes || ''}</textarea>
                <div style="margin-top:16px; display:flex; justify-content:flex-end;">
                     <button id="save-notes" style="padding:10px 20px; background:var(--accent); color:white; border:none; border-radius:6px;">Save & Close</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        modal.querySelector('#save-notes').onclick = () => {
            session.categories[key].notes = modal.querySelector('#cat-notes').value;
            saveSessions(sessions);
            modal.remove();
            if (container) render(container);
        };
        modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    }

    function renderChat(container, session, sessions) {
        container.innerHTML = `
            <div id="ww-chat-messages" style="flex:1; overflow-y:auto; padding:24px; display:flex; flex-direction:column; gap:16px;"></div>
            <div id="ww-chat-status" style="padding:0 24px; font-size:12px; color:var(--text-muted); font-style:italic; height:20px;"></div>
            <!-- Chat Styles for Formatting -->
            <style>
                #ww-chat-messages strong { color: #facc15; font-weight: 700; } /* Yellow/Gold for emphasis */
                #ww-chat-messages em { color: #e5e5e5; font-style: italic; }
                #ww-chat-messages .chat-code-inline { background: rgba(255,255,255,0.1); padding: 2px 4px; border-radius: 4px; font-family: monospace; }
                #ww-chat-messages ul { margin-left: 20px; }
            </style>
            <div style="padding:16px; background:var(--bg-elevated); border-top:1px solid var(--border-subtle);">
                <div style="display:flex; gap:8px;">
                    <textarea id="ww-chat-input" placeholder="Type your answer..." style="flex:1; min-height:44px; padding:12px; border-radius:8px; border:1px solid var(--border-subtle); background:var(--bg-surface); color:var(--text-primary); resize:none;"></textarea>
                    <button id="ww-send-btn" style="padding:0 20px; background:var(--accent); color:white; border:none; border-radius:8px; font-weight:600; cursor:pointer;">Send</button>
                </div>
            </div>
        `;
        const chatList = container.querySelector('#ww-chat-messages');

        session.chatHistory.forEach(msg => {
            const el = document.createElement('div');
            el.style.cssText = `max-width:80%; padding:12px 16px; border-radius: 12px; line-height: 1.5; white-space: pre-wrap; ${msg.role === 'user' ? 'align-self:flex-end; background:var(--accent); color:white;' : 'align-self:flex-start; background:var(--bg-elevated); color:var(--text-primary); border:1px solid var(--border-subtle);'}`;
            // Use ChatFormatter if available, otherwise raw text
            el.innerHTML = A.ChatFormatter ? A.ChatFormatter.format(msg.content) : msg.content;
            chatList.appendChild(el);
        });
        chatList.scrollTop = chatList.scrollHeight;

        const send = async () => {
            const input = container.querySelector('#ww-chat-input');
            const text = input.value.trim();
            if (!text) return;

            session.chatHistory.push({ role: 'user', content: text });
            saveSessions(sessions);
            renderChat(container, session, sessions);

            try {
                const statusEl = container.querySelector('#ww-chat-status');
                await A.WorldWeaver.LLM.evaluateAndRespond(session, sessions, (status) => {
                    if (statusEl) statusEl.textContent = status;
                });
                renderChat(container, session, sessions);
                // Trigger sidebar refresh via full render if needed, or better, keep sidebar static
            } catch (e) {
                console.error(e);
                if (container.querySelector('#ww-chat-status')) {
                    container.querySelector('#ww-chat-status').textContent = "Error: " + e.message;
                }
                alert("Thinking failed: " + e.message);
            }
        };

        container.querySelector('#ww-send-btn').onclick = send;
        container.querySelector('#ww-chat-input').onkeydown = (e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
        };
    }

    function showGenerationOptions(session, sessions) {
        // (Simplified for brevity, restoring minimal viable)
        alert("Generation Options (Restored Context)");
    }
    function showMultiCastSelection(session, sessions) { }
    function showContextModal(session) { }

    // Main Public API (Attached cleanly)
    A.WorldWeaver.render = render;

    // Expose Utility
    A.WorldWeaver.UI = {
        render,
        loadSessions,
        saveSessions
    };

})(window.Anansi);
