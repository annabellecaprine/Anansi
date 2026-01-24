/*
 * World Weaver: UI & Rendering
 * File: js/panels/world_weaver/ui.js
 */

(function (A) {
    'use strict';

    A.WorldWeaver = A.WorldWeaver || {};

    // Helper to save sessions
    const SESSIONS_KEY = 'anansi_world_weaver_sessions';
    function loadSessions() {
        try { return JSON.parse(localStorage.getItem(SESSIONS_KEY) || '{}'); } catch { return {}; }
    }
    function saveSessions(sessions) {
        localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
    }

    function createNewSession(name, genre, contentRating, storyFocus, importedActor = null) {
        // Dependencies
        const T = A.WorldWeaver.Templates;
        if (!T) return console.error("Templates not loaded");

        const template = T.GENRE_TEMPLATES.find(t => t.id === genre) || T.GENRE_TEMPLATES[5]; // freeform

        return {
            id: `ww_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            name: name || 'Untitled World',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            genre: genre,
            contentRating: contentRating || 'sfw',
            storyFocus: storyFocus || 'protagonist',
            importedActor: importedActor,
            cast: [], // Registry of identified characters
            categories: {
                coreExperience: { status: 'empty', confidence: 0, summary: '', facts: [], gaps: [] },
                worldRules: { status: 'empty', confidence: 0, summary: '', facts: [], gaps: [] },
                setting: { status: 'empty', confidence: 0, summary: '', facts: [], gaps: [] },
                cast: { status: 'empty', confidence: 0, summary: '', facts: [], gaps: [] }, // Renamed from mainCharacter
                storyArc: { status: 'empty', confidence: 0, summary: '', facts: [], gaps: [] },
                mechanics: { status: 'empty', confidence: 0, summary: '', facts: [], gaps: [] },
                guardrails: { status: 'empty', confidence: 0, summary: '', facts: [], gaps: [] }
            },
            preSeeds: { ...template.preSeeds },
            questionFocus: [...template.questionFocus],
            chatHistory: [],
            accumulatedContext: '',
            overallProgress: 0,
            currentFocus: 'coreExperience',
            settings: {
                questionsPerRound: 3,
                tokenBudget: 4096,
                customBoundaries: ''
            }
        };
    }

    function render(container) {
        // 'A' is available via closure
        const state = A.State.get();

        if (!state.worldWeaver) {
            state.worldWeaver = { currentSessionId: null, showSetup: true };
            A.State.notify();
        }

        container.innerHTML = '';
        container.style.cssText = 'display:flex; flex-direction:column; height:100%; overflow:hidden;';

        const sessions = loadSessions();
        const currentSession = state.worldWeaver.currentSessionId ? sessions[state.worldWeaver.currentSessionId] : null;

        if (state.worldWeaver.showSetup || !currentSession) {
            renderSetupScreen(container, sessions, state);
        } else {
            renderMainInterface(container, currentSession, sessions, state);
        }
    }

    function renderSetupScreen(container, sessions, state) {
        const T = A.WorldWeaver.Templates;

        const setup = document.createElement('div');
        setup.className = 'ww-setup';
        setup.innerHTML = `
            <div style="height:100%; overflow-y:auto; background:linear-gradient(135deg, var(--bg-panel) 0%, var(--bg-elevated) 100%);">
                <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:100%; padding:24px;">
                    <div style="text-align:center; margin-bottom:32px;">
                        <div style="font-size:28px; font-weight:700; color:var(--text-primary); margin-bottom:8px;">🕸️ World Weaver</div>
                        <div style="font-size:14px; color:var(--text-muted);">Guided world-building for immersive storytelling</div>
                    </div>
                
                <div style="background:var(--bg-surface); border:1px solid var(--border-subtle); border-radius:12px; padding:24px; width:100%; max-width:500px; box-shadow:0 4px 20px rgba(0,0,0,0.2);">
                    <div style="margin-bottom:20px;">
                        <label style="display:block; font-size:12px; font-weight:600; color:var(--text-secondary); margin-bottom:8px; text-transform:uppercase;">Session Name</label>
                        <input type="text" id="ww-session-name" placeholder="My Adventure World" style="width:100%; padding:12px; background:var(--bg-panel); border:1px solid var(--border-subtle); border-radius:8px; color:var(--text-primary);">
                    </div>
                    
                    <div style="margin-bottom:20px;">
                        <label style="display:block; font-size:12px; font-weight:600; color:var(--text-secondary); margin-bottom:8px; text-transform:uppercase;">Genre Template</label>
                        <div id="ww-genre-grid" style="display:grid; grid-template-columns:repeat(3, 1fr); gap:8px;"></div>
                    </div>
                    
                    <div style="margin-bottom:20px;">
                        <label style="display:block; font-size:12px; font-weight:600; color:var(--text-secondary); margin-bottom:8px; text-transform:uppercase;">Story Focus</label>
                        <div style="display:flex; background:var(--bg-panel); border:1px solid var(--border-subtle); border-radius:8px; padding:4px;">
                            <button id="ww-focus-protagonist" class="focus-opt" style="flex:1; padding:8px; border:none; border-radius:6px; cursor:pointer; font-weight:600; font-size:13px; background:var(--accent); color:white;">Protagonist</button>
                            <button id="ww-focus-ensemble" class="focus-opt" style="flex:1; padding:8px; border:none; border-radius:6px; cursor:pointer; font-weight:600; font-size:13px; background:transparent; color:var(--text-muted);">Ensemble (Cast)</button>
                        </div>
                    </div>

                    <div style="margin-bottom:20px;">
                        <label style="display:block; font-size:12px; font-weight:600; color:var(--text-secondary); margin-bottom:8px; text-transform:uppercase;">Content Rating</label>
                        <div id="ww-rating-options" style="display:flex; gap:8px;"></div>
                    </div>

                    <div style="margin-bottom:20px;">
                        <label style="display:block; font-size:12px; font-weight:600; color:var(--text-secondary); margin-bottom:8px; text-transform:uppercase;">Import Actor (Optional)</label>
                        <div id="ww-actor-import" style="padding:12px; background:var(--bg-panel); border:2px dashed var(--border-subtle); border-radius:8px; text-align:center; cursor:pointer;">
                            <span>📥 Click to select an Actor</span>
                        </div>
                    </div>

                    <button id="ww-start-btn" style="width:100%; padding:14px; background:var(--accent); border:none; border-radius:8px; color:white; font-weight:600; cursor:pointer;">✨ Begin World Weaving</button>
                </div>
                
                <div id="ww-sessions-section" style="margin-top:24px; width:100%; max-width:500px;"></div>
            </div>
        </div>
        `;

        container.appendChild(setup);

        // Initialize ephemeral setup state if needed
        if (!state.worldWeaver.setupState) {
            state.worldWeaver.setupState = {
                genre: 'freeform',
                rating: 'sfw',
                storyFocus: 'protagonist',
                actor: null
            };
        }
        const setupState = state.worldWeaver.setupState;

        // Focus Toggle Logic
        const updateFocusUI = () => {
            const isProtag = setupState.storyFocus === 'protagonist';
            const btnP = setup.querySelector('#ww-focus-protagonist');
            const btnE = setup.querySelector('#ww-focus-ensemble');

            btnP.style.background = isProtag ? 'var(--accent)' : 'transparent';
            btnP.style.color = isProtag ? 'white' : 'var(--text-muted)';

            btnE.style.background = !isProtag ? 'var(--accent)' : 'transparent';
            btnE.style.color = !isProtag ? 'white' : 'var(--text-muted)';
        };

        setup.querySelector('#ww-focus-protagonist').onclick = () => {
            setupState.storyFocus = 'protagonist';
            updateFocusUI();
        };
        setup.querySelector('#ww-focus-ensemble').onclick = () => {
            setupState.storyFocus = 'ensemble';
            updateFocusUI();
        };
        // Initial state
        updateFocusUI();

        // Genres
        const genreGrid = setup.querySelector('#ww-genre-grid');
        T.GENRE_TEMPLATES.forEach(genre => {
            const btn = document.createElement('button');
            btn.style.cssText = `display:flex; flex-direction:column; align-items:center; padding:16px 12px; background:var(--bg-panel); border:2px solid var(--border-subtle); border-radius:8px; cursor:pointer; color:var(--text-primary);`;
            if (genre.id === setupState.genre) btn.style.borderColor = 'var(--accent)';

            btn.innerHTML = `<span style="font-size:24px;">${genre.icon}</span><span style="font-size:11px; margin-top:4px;">${genre.label}</span>`;
            btn.onclick = () => {
                setupState.genre = genre.id;
                render(container);
            };
            genreGrid.appendChild(btn);
        });

        // Ratings
        const ratingOptions = setup.querySelector('#ww-rating-options');
        T.CONTENT_RATINGS.forEach(rating => {
            const btn = document.createElement('button');
            btn.style.cssText = `flex:1; padding:10px; background:var(--bg-panel); border:2px solid var(--border-subtle); border-radius:8px; cursor:pointer; color:var(--text-primary);`;
            if (rating.id === setupState.rating) btn.style.borderColor = 'var(--accent)';

            btn.innerHTML = `<div style="font-weight:600; font-size:12px;">${rating.label}</div>`;
            btn.onclick = () => {
                setupState.rating = rating.id;
                render(container);
            };
            ratingOptions.appendChild(btn);
        });

        // Start
        setup.querySelector('#ww-start-btn').onclick = () => {
            const name = setup.querySelector('#ww-session-name').value.trim();
            const session = createNewSession(name, setupState.genre, setupState.rating, setupState.storyFocus, setupState.actor);
            const allSessions = loadSessions();
            allSessions[session.id] = session;
            saveSessions(allSessions);

            state.worldWeaver.currentSessionId = session.id;
            state.worldWeaver.showSetup = false;
            // Clear setup state for next time
            delete state.worldWeaver.setupState;

            A.State.notify();
            render(container);
        };

        // Resume Sessions List
        const sessionsList = Object.values(sessions);
        if (sessionsList.length > 0) {
            setup.querySelector('#ww-sessions-section').innerHTML = `<div style="font-weight:600; color:var(--text-secondary); margin-bottom:8px;">Resume Session</div>`;
            sessionsList.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).forEach(s => {
                const row = document.createElement('div');
                row.style.cssText = "display:flex; align-items:center; justify-content:space-between; padding:12px; background:var(--bg-surface); border:1px solid var(--border-subtle); margin-bottom:8px; border-radius:8px; cursor:pointer;";

                row.innerHTML = `<span style="flex:1; font-weight:500; color:var(--text-primary);">${s.name}</span>`;

                const deleteBtn = document.createElement('button');
                deleteBtn.innerHTML = '🗑️';
                deleteBtn.style.cssText = "padding:8px; background:transparent; border:none; cursor:pointer; font-size:14px; opacity:0.6; transition:opacity 0.2s;";
                deleteBtn.onmouseover = () => deleteBtn.style.opacity = '1';
                deleteBtn.onmouseout = () => deleteBtn.style.opacity = '0.6';

                deleteBtn.onclick = (e) => {
                    e.stopPropagation();
                    if (confirm(`Delete session "${s.name}"? This cannot be undone.`)) {
                        const currentSessions = loadSessions();
                        delete currentSessions[s.id];
                        saveSessions(currentSessions);

                        // If deleted active session, clear current ID
                        if (state.worldWeaver.currentSessionId === s.id) {
                            state.worldWeaver.currentSessionId = null;
                        }

                        render(container); // Re-render to update list
                    }
                };

                row.onclick = () => {
                    state.worldWeaver.currentSessionId = s.id;
                    state.worldWeaver.showSetup = false;
                    A.State.notify();
                    render(container);
                };

                row.prepend(document.createElement('span')); // Spacer or just rely on flex
                row.querySelector('span').onclick = row.onclick; // Ensure text click works

                // Re-assemble
                row.innerHTML = '';
                const title = document.createElement('span');
                title.style.cssText = "flex:1; font-weight:500; color:var(--text-primary);";
                title.textContent = s.name;

                row.appendChild(title);
                row.appendChild(deleteBtn);

                setup.querySelector('#ww-sessions-section').appendChild(row);
            });
        }

        // Actor Import Logic
        if (setupState.actor) {
            setup.querySelector('#ww-actor-import').innerHTML = `✅ ${setupState.actor.name}`;
        }

        setup.querySelector('#ww-actor-import').onclick = () => {
            const actors = Object.values(A.State.get().nodes?.actors?.items || {});
            if (actors.length === 0) return A.UI.Toast.show('No actors found', 'warning');

            // Show Actor Selection Modal
            const modal = document.createElement('div');
            modal.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.8); display:flex; align-items:center; justify-content:center; z-index:10000;';

            modal.innerHTML = `
                 <div style="background:var(--bg-surface); padding:24px; border-radius:12px; width:400px; max-width:90vw; max-height:80vh; display:flex; flex-direction:column;">
                     <h3 style="margin-top:0;">Select an Actor</h3>
                     <div style="flex:1; overflow-y:auto; display:flex; flex-direction:column; gap:8px;">
                        ${actors.map(actor => `
                            <button class="actor-btn" data-id="${actor.id}" style="
                                padding:12px; text-align:left; background:var(--bg-elevated); border:1px solid var(--border-subtle); 
                                border-radius:8px; cursor:pointer; color:var(--text-primary); display:flex; align-items:center; gap:12px;
                            ">
                                <div style="width:32px; height:32px; border-radius:50%; background:var(--bg-dark); overflow:hidden; display:flex; align-items:center; justify-content:center;">
                                    ${actor.avatar ? `<img src="${actor.avatar}" style="width:100%; height:100%; object-fit:cover;">` : '👤'}
                                </div>
                                <div style="font-weight:600;">${actor.name}</div>
                            </button>
                        `).join('')}
                     </div>
                     <button id="modal-cancel" style="margin-top:16px; width:100%; padding:12px; background:transparent; border:1px solid var(--border-subtle); color:var(--text-primary); cursor:pointer;">Cancel</button>
                 </div>
             `;
            document.body.appendChild(modal);

            modal.querySelectorAll('.actor-btn').forEach(btn => {
                btn.onclick = () => {
                    const actorId = btn.dataset.id;
                    const found = actors.find(a => a.id === actorId);
                    if (found) {
                        setupState.actor = found;
                        render(container);
                    }
                    modal.remove();
                };
            });
            modal.querySelector('#modal-cancel').onclick = () => modal.remove();
        };
    }

    function showCategoryDetails(session, key, sessions, container) {
        const T = A.WorldWeaver.Templates;
        const conf = T.CATEGORIES[key];
        const data = session.categories[key];

        // Create Modal
        const modal = document.createElement('div');
        modal.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.8); display:flex; align-items:center; justify-content:center; z-index:10000;';

        // Prepare Inner Content (Cast List vs. Notes)
        let mainContent = '';

        if (key === 'cast') {
            const castListHtml = (session.cast || []).map(c => `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:8px; background:var(--bg-base); margin-bottom:6px; border-radius:6px; font-size:12px; border:1px solid var(--border-subtle);">
                    <div>
                        <span style="font-weight:600; color:var(--text-primary);">${c.name}</span>
                        <span style="color:var(--text-muted); margin-left:6px;">(${c.role})</span>
                    </div>
                    <span style="font-size:10px; color:var(--accent); text-transform:uppercase;">${c.significance}</span>
                </div>
            `).join('');

            mainContent = `
                <div style="margin-bottom:16px; padding-bottom:16px; border-bottom:1px solid var(--border-subtle);">
                    <div style="font-size:11px; font-weight:600; color:var(--text-secondary); margin-bottom:8px; letter-spacing:0.5px;">IDENTIFIED CAST</div>
                    <div style="max-height:150px; overflow-y:auto; margin-bottom:8px;">
                        ${castListHtml || '<div style="font-style:italic; color:var(--text-muted); font-size:12px;">No cast members yet. (Chat to find them)</div>'}
                    </div>
                    <button id="ww-add-cast-btn" style="width:100%; padding:8px; background:var(--bg-elevated); border:1px dashed var(--border-subtle); border-radius:6px; color:var(--text-secondary); font-size:11px; cursor:pointer;">+ Add Character Manually</button>
                </div>
                
                <div style="display:flex; flex-direction:column; flex:1;">
                    <div style="font-size:11px; font-weight:600; color:var(--text-secondary); margin-bottom:4px; letter-spacing:0.5px;">NOTES</div>
                     <div style="font-size:12px; color:var(--text-muted); margin-bottom:8px;">
                        The AI uses this space to track facts, rules, and decisions. You can edit this directly to correct or guide it.
                    </div>
                    <textarea id="cat-notes" style="flex:1; padding:12px; background:var(--bg-base); border:1px solid var(--border-subtle); border-radius:8px; resize:none; font-family:monospace; line-height:1.5; color:var(--text-primary); white-space: pre-wrap;">${data.notes || ''}</textarea>
                </div>
            `;
        } else {
            mainContent = `
                <div style="display:flex; flex-direction:column; flex:1;">
                    <div style="font-size:12px; color:var(--text-muted); margin-bottom:8px;">
                        The AI uses this space to track facts, rules, and decisions. You can edit this directly to correct or guide it.
                    </div>
                    <textarea id="cat-notes" style="flex:1; padding:12px; background:var(--bg-base); border:1px solid var(--border-subtle); border-radius:8px; resize:none; font-family:monospace; line-height:1.5; color:var(--text-primary); white-space: pre-wrap;">${data.notes || ''}</textarea>
                </div>
            `;
        }

        modal.innerHTML = `
            <div style="background:var(--bg-surface); padding:24px; border-radius:12px; width:600px; max-width:90vw; height:80vh; display:flex; flex-direction:column;">
                <div style="display:flex; align-items:center; gap:12px; margin-bottom:16px;">
                    <div style="font-size:24px;">${conf.icon}</div>
                    <div style="flex:1;">
                        <div style="font-weight:700; font-size:18px;">${conf.label} - ${key === 'cast' ? 'Management' : 'Notes'}</div>
                        <div style="font-size:12px; color:var(--text-secondary);">Confidence: ${data.confidence || 0}%</div>
                    </div>
                    <button id="close-notes" style="background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:20px;">×</button>
                </div>
                
                ${mainContent}
                
                <div style="margin-top:16px; display:flex; justify-content:flex-end;">
                     <button id="save-notes" style="padding:10px 20px; background:var(--accent); color:white; border:none; border-radius:6px; font-weight:600; cursor:pointer;">Save & Close</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const textarea = modal.querySelector('#cat-notes');
        const addBtn = modal.querySelector('#ww-add-cast-btn');

        // Auto-focus and cursor at end (if notes exist)
        if (textarea) {
            textarea.focus();
            textarea.setSelectionRange(textarea.value.length, textarea.value.length);
        }

        // Add Button Logic
        if (addBtn) {
            addBtn.onclick = () => {
                const name = prompt("Character Name:");
                if (name) {
                    if (!session.cast) session.cast = [];
                    session.cast.push({ name, role: 'Manual Entry', significance: 'minor' });
                    saveSessions(sessions);
                    modal.remove();
                    showCategoryDetails(session, key, sessions, container);
                    // Also trigger background update of sidebar if possible or wait for save/close
                }
            };
        }

        const saveAndClose = () => {
            if (textarea) {
                session.categories[key].notes = textarea.value;
            }
            saveSessions(sessions);
            modal.remove();

            // Re-render container to show latest state if needed (mainly for graph colors/stats)
            if (container) {
                // A bit heavy to re-render whole sidebar but safe
                // Finding sidebar again inside container logic is handled by renderSidebar caller usually
                // But here we can call render(container) if we have the ROOT container
                // We passed in the ROOT container hopefully.
                // Actually renderSidebar is passed a sidebar element usually? 
                // In renderSidebar below, we pass 'container' (root).

                // If container is the root, we call render(container).
                // Check if container has 'ww-interface' class or is the parent.
                // render() expects the parent of ww-interface usually.

                // Let's just rely on automatic update next time or re-call renderSidebar
                // Safest: A.WorldWeaver.UI.render(container)
                A.WorldWeaver.UI.render(container);
            }
        };

        modal.querySelector('#close-notes').onclick = () => modal.remove();
        modal.querySelector('#save-notes').onclick = saveAndClose;

        // Close on click outside
        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };
    }

    function renderMainInterface(container, session, sessions, state) {
        container.innerHTML = `
            <div class="ww-interface" style="display:flex; height:100%; width:100%;">
                <div class="ww-sidebar" style="width:300px; background:var(--bg-panel); border-right:1px solid var(--border-subtle); display:flex; flex-direction:column; flex-shrink:0;"></div>
                <div class="ww-content" style="flex:1; display:flex; flex-direction:column; background:var(--bg-base); min-width:0;"></div>
            </div>
        `;

        const sidebar = container.querySelector('.ww-sidebar');
        const content = container.querySelector('.ww-content');

        renderSidebar(sidebar, session, sessions, state);
        renderChat(content, session, sessions);
    }

    function renderSidebar(sidebar, session, sessions, state) {
        const T = A.WorldWeaver.Templates;
        // Derive container (root) from sidebar
        const container = sidebar.closest('.ww-interface').parentNode;

        const currentGenre = T.GENRE_TEMPLATES.find(t => t.id === session.genre);

        sidebar.innerHTML = `
            <div style="padding:16px; border-bottom:1px solid var(--border-subtle);">
                <div style="font-weight:700; font-size:16px; margin-bottom:4px;">${session.name}</div>
                <div style="font-size:12px; color:var(--text-muted);">
                    ${currentGenre?.icon} 
                    ${session.contentRating.toUpperCase()}
                </div>
            </div>

            <div style="flex:1; overflow-y:auto; padding:16px;">
                <div style="margin-bottom:24px;">
                    <div style="display:flex; justify-content:space-between; font-size:12px; font-weight:600; margin-bottom:8px;">
                        <span>Overall Progress</span>
                        <span>${session.overallProgress}%</span>
                    </div>
                    <div style="height:6px; background:var(--bg-surface); border-radius:3px; overflow:hidden;">
                        <div style="height:100%; background:var(--accent); width:${session.overallProgress}%"></div>
                    </div>
                </div>

                <div id="ww-categories-list"></div>
            </div>

            <div style="padding:16px; border-top:1px solid var(--border-subtle); display:flex; flex-direction:column; gap:8px;">
                <button id="ww-view-context" style="padding:8px; background:var(--bg-surface); border:1px solid var(--border-subtle); border-radius:6px; cursor:pointer; font-size:12px; color:var(--text-secondary);">👁️ View Active Context</button>
                <button id="ww-generate" style="padding:12px; background:var(--accent); border:none; border-radius:6px; cursor:pointer; color:white; font-weight:600;">✨ Generate Output</button>
                <button id="ww-back" style="padding:8px; background:transparent; border:none; cursor:pointer; font-size:12px; color:var(--text-muted);">↩️ Back to Sessions</button>
            </div>
        `;

        // Category List
        const catList = sidebar.querySelector('#ww-categories-list');
        Object.entries(T.CATEGORIES).forEach(([key, conf]) => {
            const catState = session.categories[key];
            const confidence = Number(catState.confidence || 0);
            const radius = 6;
            const circumference = 2 * Math.PI * radius;
            const offset = circumference - (confidence / 100) * circumference;

            // Determine color based on completion
            let color = '#4f46e5'; // Indigo/Blue accent
            if (confidence >= 100) color = '#10b981'; // Emerald Green
            if (confidence === 0) color = 'rgba(128,128,128,0.2)';

            const row = document.createElement('div');
            row.style.cssText = `display:flex; align-items:center; gap:8px; padding:8px; border-radius:6px; cursor:pointer; margin-bottom:2px; ${session.currentFocus === key ? 'background:var(--bg-elevated);' : ''}`;

            // Pie Chart (SVG for better reliability)
            const pieChart = `
                <svg width="14" height="14" viewBox="0 0 16 16" style="transform: rotate(-90deg); flex-shrink:0;">
                    <circle cx="8" cy="8" r="${radius}" fill="none" stroke="rgba(128,128,128,0.15)" stroke-width="2" />
                    <circle cx="8" cy="8" r="${radius}" fill="none" stroke="${color}" stroke-width="2.5" 
                        stroke-dasharray="${circumference}" stroke-dashoffset="${offset}" 
                        style="transition: stroke-dashoffset 0.3s ease;" />
                </svg>
            `;

            row.innerHTML = `
                <span style="display:flex; align-items:center; justify-content:center; width:20px;">${conf.icon}</span>
                <span style="flex:1; font-size:13px; color:${session.currentFocus === key ? 'var(--text-primary)' : 'var(--text-secondary)'}">${conf.label}</span>
                ${pieChart}
            `;

            row.onclick = () => {
                session.currentFocus = key;
                saveSessions(sessions);

                // Update Row Styles
                const allRows = catList.children;
                for (let item of allRows) {
                    item.style.background = 'transparent';
                    if (item.querySelector('span:nth-child(2)')) item.querySelector('span:nth-child(2)').style.color = 'var(--text-secondary)';
                }
                row.style.background = 'var(--bg-elevated)';
                row.querySelector('span:nth-child(2)').style.color = 'var(--text-primary)';

                // Open Pop-out Modal
                showCategoryDetails(session, key, sessions, container);
            };

            catList.appendChild(row);
        });

        // Event Listeners
        sidebar.querySelector('#ww-back').onclick = () => {
            state.worldWeaver.currentSessionId = null;
            state.worldWeaver.showSetup = true;
            A.State.notify();
            render(container);
        };

        sidebar.querySelector('#ww-generate').onclick = () => {
            showGenerationOptions(session, sessions);
        };

        sidebar.querySelector('#ww-view-context').onclick = () => {
            showContextModal(session);
        };
    }

    function renderChat(container, session, sessions) {
        container.innerHTML = `
            <div id="ww-chat-messages" style="flex:1; overflow-y:auto; padding:24px; display:flex; flex-direction:column; gap:16px;"></div>
            <div style="padding:16px; background:var(--bg-elevated); border-top:1px solid var(--border-subtle);">
                <div style="display:flex; gap:8px;">
                    <textarea id="ww-chat-input" placeholder="Type your answer..." style="flex:1; min-height:44px; padding:12px; border-radius:8px; border:1px solid var(--border-subtle); background:var(--bg-surface); color:var(--text-primary); resize:none;"></textarea>
                    <button id="ww-send-btn" style="padding:0 20px; background:var(--accent); color:white; border:none; border-radius:8px; font-weight:600; cursor:pointer;">Send</button>
                </div>
            </div>
        `;

        const chatList = container.querySelector('#ww-chat-messages');

        // Render History
        if (session.chatHistory.length === 0) {
            chatList.innerHTML = `<div style="text-align:center; margin-top:40px; color:var(--text-muted);">
                <div style="font-size:48px; margin-bottom:16px;">🕸️</div>
                Start by saying "Hello" or describing your world idea.
            </div>`;
        } else {
            session.chatHistory.forEach(msg => {
                const el = document.createElement('div');
                el.style.cssText = `max-width:80%; padding:12px 16px; border-radius: 12px; line-height: 1.5; white-space: pre-wrap; ${msg.role === 'user'
                    ? 'align-self:flex-end; background:var(--accent); color:white;'
                    : 'align-self:flex-start; background:var(--bg-elevated); color:var(--text-primary); border:1px solid var(--border-subtle);'
                    }`;

                if (msg.role === 'assistant') {
                    let html = `<div>${msg.content}</div>`;
                    if (msg.questions && msg.questions.length > 0) {
                        html += `<div style="margin-top:12px; padding-top:12px; border-top:1px solid var(--border-subtle);">`;
                        msg.questions.forEach(q => {
                            html += `<div style="font-weight:600; color:var(--accent); margin-top:8px;">❓ ${q.text}</div>`;
                            if (q.suggestion) html += `<div style="font-size:12px; color:var(--text-muted); margin-left:16px;">💡 ${q.suggestion}</div>`;
                        });
                        html += `</div>`;
                    }
                    el.innerHTML = html;
                } else {
                    el.textContent = msg.content;
                }
                chatList.appendChild(el);
            });
        }
        chatList.scrollTop = chatList.scrollHeight;

        // Send Logic
        const send = async () => {
            const input = container.querySelector('#ww-chat-input');
            const text = input.value.trim();
            if (!text) return;

            // Optimistic UI
            const userEl = document.createElement('div');
            userEl.style.cssText = 'align-self:flex-end; background:var(--accent); color:white; max-width:80%; padding:12px 16px; border-radius:12px; margin-top:16px; white-space: pre-wrap;';
            userEl.textContent = text;
            chatList.appendChild(userEl);

            const thinkingEl = document.createElement('div');
            thinkingEl.style.cssText = 'align-self:flex-start; color:var(--text-muted); font-style:italic; margin-top:16px; padding:12px;';
            thinkingEl.textContent = 'Thinking.';
            chatList.appendChild(thinkingEl);
            chatList.scrollTop = chatList.scrollHeight;

            let dots = 1;
            const thinkInterval = setInterval(() => {
                dots = (dots % 3) + 1;
                thinkingEl.textContent = 'Thinking' + '.'.repeat(dots);
            }, 500);

            input.value = '';

            session.chatHistory.push({ role: 'user', content: text });
            saveSessions(sessions);

            try {
                // Call LLM Module
                await A.WorldWeaver.LLM.evaluateAndRespond(session, sessions);
                clearInterval(thinkInterval);
                renderChat(container, session, sessions);

                // Refresh Sidebar (Stats)
                const sidebar = container.parentNode.querySelector('.ww-sidebar');
                if (sidebar) renderSidebar(sidebar, session, sessions, A.State.get());
            } catch (e) {
                clearInterval(thinkInterval);
                thinkingEl.textContent = 'Error: ' + e.message;
                thinkingEl.style.color = 'var(--danger)';
            }
        };

        container.querySelector('#ww-send-btn').onclick = send;
        container.querySelector('#ww-chat-input').onkeydown = (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
            }
        };
    }

    function showGenerationOptions(session, sessions) {
        const modal = document.createElement('div');
        modal.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.8); display:flex; align-items:center; justify-content:center; z-index:10000;';

        modal.innerHTML = `
            <div style="background:var(--bg-surface); padding:24px; border-radius:12px; width:400px; max-width:90vw;">
                <h3 style="margin-top:0;">Generate Output</h3>
                <div style="display:flex; flex-direction:column; gap:12px;">
                    <button class="gen-opt" data-type="character" style="padding:16px; text-align:left; cursor:pointer; background:var(--bg-elevated); border:1px solid var(--border-subtle); border-radius:8px;">
                        <div>👤 Character Card</div>
                        <div style="font-size:12px; color:var(--text-muted);">Create a full Actor profile</div>
                    </button>
                    <button class="gen-opt" data-type="world" style="padding:16px; text-align:left; cursor:pointer; background:var(--bg-elevated); border:1px solid var(--border-subtle); border-radius:8px;">
                        <div>🌍 World Lorebook</div>
                        <div style="font-size:12px; color:var(--text-muted);">Generate Lorebook entries</div>
                    </button>
                    <button class="gen-opt" data-type="export" style="padding:16px; text-align:left; cursor:pointer; background:var(--bg-elevated); border:1px solid var(--border-subtle); border-radius:8px;">
                        <div>📄 Markdown Export</div>
                        <div style="font-size:12px; color:var(--text-muted);">Download text file</div>
                    </button>
                </div>
                <button id="modal-close" style="margin-top:16px; width:100%; padding:12px; background:transparent; border:1px solid var(--border-subtle); color:var(--text-primary); cursor:pointer;">Cancel</button>
            </div>
        `;
        document.body.appendChild(modal);

        modal.querySelectorAll('.gen-opt').forEach(btn => {
            btn.onclick = () => {
                const type = btn.dataset.type;
                // Use multi-step pipeline for character generation
                if (type === 'character') {
                    showMultiCastSelection(session, sessions);
                } else {
                    // Legacy single-step for world/export
                    A.WorldWeaver.Generation.handleGeneration(session, sessions, type);
                }
                modal.remove();
            };
        });
        modal.querySelector('#modal-close').onclick = () => modal.remove();
    }

    function showMultiCastSelection(session, sessions) {
        const modal = document.createElement('div');
        modal.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.8); display:flex; align-items:center; justify-content:center; z-index:10002;';

        const cast = session.cast || [];
        const isEnsemble = session.storyFocus === 'ensemble';

        const castListHtml = cast.map((c, i) => `
            <label style="display:flex; align-items:center; padding:12px; background:var(--bg-elevated); border:1px solid var(--border-subtle); border-radius:8px; cursor:pointer; margin-bottom:8px;">
                <input type="checkbox" value="${c.name}" checked style="width:18px; height:18px; margin-right:12px;">
                <div style="flex:1;">
                    <div style="font-weight:600;">${c.name}</div>
                    <div style="font-size:12px; color:var(--text-muted);">${c.role} (${c.significance})</div>
                </div>
            </label>
        `).join('');

        modal.innerHTML = `
            <div style="background:var(--bg-surface); padding:24px; border-radius:12px; width:450px; max-width:90vw;">
                <h3 style="margin-top:0;">Select Characters</h3>
                <div style="font-size:13px; color:var(--text-muted); margin-bottom:16px;">
                    Select which characters to generate profiles for.
                </div>
                
                <div style="max-height:50vh; overflow-y:auto; margin-bottom:16px;">
                    <label style="display:flex; align-items:center; padding:12px; background:var(--bg-elevated); border:1px solid var(--border-subtle); border-radius:8px; cursor:pointer; margin-bottom:8px; border-left:4px solid var(--accent);">
                        <input type="checkbox" value="Protagonist" ${!isEnsemble ? 'checked' : ''} style="width:18px; height:18px; margin-right:12px;">
                        <div style="flex:1;">
                            <div style="font-weight:600;">The Protagonist / Main Character</div>
                            <div style="font-size:12px; color:var(--text-muted);">Defined by 'Main Character' prompts</div>
                        </div>
                    </label>
                    <div style="height:1px; background:var(--border-subtle); margin:12px 0;"></div>
                    ${castListHtml || '<div style="font-style:italic; color:var(--text-muted); padding:12px;">No other characters identified yet.</div>'}
                </div>

                <div style="display:flex; justify-content:flex-end; gap:12px;">
                    <button id="sel-close" style="padding:10px; background:transparent; border:1px solid var(--border-subtle); border-radius:6px; cursor:pointer; color:var(--text-secondary);">Cancel</button>
                    <button id="sel-go" style="padding:10px 20px; background:var(--accent); border:none; border-radius:6px; cursor:pointer; color:white; font-weight:600;">Generate Selected</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        modal.querySelector('#sel-close').onclick = () => modal.remove();
        modal.querySelector('#sel-go').onclick = () => {
            // Gather selected
            const selected = [];
            modal.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => {
                if (cb.value === 'Protagonist') {
                    selected.push("Protagonist");
                } else {
                    selected.push(cb.value);
                }
            });

            if (selected.length === 0) return alert("Please select at least one character.");

            modal.remove();
            A.WorldWeaver.Generation.generateCharacterMultiStep(session, sessions, selected);
        };
    }

    function showContextModal(session) {
        const T = A.WorldWeaver.Templates;
        const template = T.GENRE_TEMPLATES.find(t => t.id === session.genre);
        const context = `
                === GENRE ===
                ${template?.label}

=== CATEGORIES STATE ===
                ${Object.entries(session.categories).map(([k, v]) => `${k}: ${v.status} (${v.confidence}%)`).join('\n')}

=== IMPORTED ACTOR ===
                ${session.importedActor ? session.importedActor.name : 'None'}

=== CUSTOM BOUNDARIES ===
                ${session.settings.customBoundaries || 'None'}

=== ACCUMULATED CONTEXT ===
                ${session.accumulatedContext || '(Dynamic)'}
            `;

        const modal = document.createElement('div');
        modal.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.8); z-index:10001; display:flex; align-items:center; justify-content:center;';
        modal.innerHTML = `
            <div style="width:800px; height:80vh; background:var(--bg-surface); padding:24px; border-radius:12px; display:flex; flex-direction:column;">
                <h3>Active Context</h3>
                <textarea style="flex:1; background:var(--bg-base); color:var(--text-primary); font-family:monospace; padding:16px; border:none; resize:none;" readonly>${context}</textarea>
                <button onclick="this.parentElement.parentElement.remove()" style="margin-top:16px; padding:12px;">Close</button>
            </div>
        `;
        document.body.appendChild(modal);
    }

    // Expose
    A.WorldWeaver.UI = {
        render,
        loadSessions,
        saveSessions
    };

})(window.Anansi);
