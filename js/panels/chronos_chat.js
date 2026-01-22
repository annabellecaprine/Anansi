/*
 * Anansi Panel: Chronos Chat (Enhanced Roleplay)
 * File: js/panels/chronos_chat.js
 * Category: Immersion
 * Purpose: Enhanced RP interface with time, weather, location awareness and actor tracking.
 */

(function (A) {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════════════
    // RENDER FUNCTION
    // ═══════════════════════════════════════════════════════════════════════════

    function render(container, context) {
        const state = A.State.get();

        // Ensure Chronos state exists
        if (A.Chronos) A.Chronos.ensureState(state);

        container.innerHTML = '';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.height = '100%';
        container.style.overflow = 'hidden';

        // ─────────────────────────────────────────────────────────────────────
        // CONTROL BAR (Time, Weather, Location)
        // ─────────────────────────────────────────────────────────────────────

        const controlBar = document.createElement('div');
        controlBar.className = 'chronos-control-bar';
        controlBar.innerHTML = `
            <style>
                .chronos-control-bar {
                    display: flex;
                    gap: 8px;
                    padding: 12px;
                    background: var(--bg-elevated);
                    border-bottom: 1px solid var(--border-subtle);
                    align-items: center;
                    flex-wrap: wrap;
                }
                .chronos-control {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    background: var(--bg-surface);
                    border: 1px solid var(--border-subtle);
                    border-radius: 6px;
                    padding: 6px 10px;
                    font-size: 12px;
                }
                .chronos-control select {
                    background: var(--bg-surface);
                    border: 1px solid var(--border-subtle);
                    border-radius: 4px;
                    color: var(--text-primary);
                    font-size: 12px;
                    cursor: pointer;
                    padding: 4px 8px;
                }
                .chronos-control select option {
                    background: var(--bg-panel);
                    color: var(--text-primary);
                    padding: 8px;
                }
                .chronos-control-icon {
                    font-size: 16px;
                }
                .chronos-control-label {
                    font-size: 9px;
                    text-transform: uppercase;
                    color: var(--text-muted);
                    letter-spacing: 0.5px;
                    margin-bottom: 2px;
                }
                .chronos-control-group {
                    display: flex;
                    flex-direction: column;
                }
                .chronos-spacer {
                    flex: 1;
                }
                .chronos-actions {
                    display: flex;
                    gap: 4px;
                    align-items: flex-end;
                }
            </style>
            
            <div class="chronos-control-group">
                <span class="chronos-control-label">Time</span>
                <div class="chronos-control">
                    <span class="chronos-control-icon" id="time-icon">☀️</span>
                    <select id="time-select" class="input"></select>
                </div>
            </div>
            
            <div class="chronos-control-group">
                <span class="chronos-control-label">Weather</span>
                <div class="chronos-control">
                    <span class="chronos-control-icon" id="weather-icon">☀️</span>
                    <select id="weather-select" class="input"></select>
                    <select id="weather-intensity" class="input" style="width:80px;">
                        <option value="light">Light</option>
                        <option value="moderate" selected>Moderate</option>
                        <option value="heavy">Heavy</option>
                        <option value="extreme">Extreme</option>
                    </select>
                </div>
            </div>
            
            <div class="chronos-control-group">
                <span class="chronos-control-label">Location</span>
                <div class="chronos-control">
                    <span class="chronos-control-icon">📍</span>
                    <select id="location-select" class="input"></select>
                </div>
            </div>
            
            <div class="chronos-spacer"></div>
            
            <div class="chronos-actions">
                <button class="btn btn-ghost btn-sm" id="btn-advance-time" title="Advance Time">⏩</button>
                <button class="btn btn-ghost btn-sm" id="btn-refresh" title="Refresh">🔄</button>
            </div>
        `;
        container.appendChild(controlBar);

        // ─────────────────────────────────────────────────────────────────────
        // MAIN CONTENT AREA (Chat + Web Lens)
        // ─────────────────────────────────────────────────────────────────────

        const mainArea = document.createElement('div');
        mainArea.style.display = 'flex';
        mainArea.style.flex = '1';
        mainArea.style.minHeight = '0';
        mainArea.style.overflow = 'hidden';

        mainArea.innerHTML = `
            <style>
                .chronos-chat-col {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    min-width: 0;
                }
                .chronos-present-bar {
                    display: flex;
                    gap: 8px;
                    padding: 12px;
                    background: var(--bg-surface);
                    border-bottom: 1px solid var(--border-subtle);
                    align-items: center;
                    flex-wrap: wrap;
                }
                .chronos-present-label {
                    font-size: 11px;
                    color: var(--text-muted);
                    text-transform: uppercase;
                    font-weight: bold;
                }
                .chronos-present-avatars {
                    display: flex;
                    gap: 6px;
                }
                .chronos-avatar {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    border: 2px solid var(--border-subtle);
                    overflow: hidden;
                    cursor: pointer;
                    transition: border-color 0.2s, transform 0.2s;
                    background: var(--bg-elevated);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 18px;
                }
                .chronos-avatar:hover {
                    border-color: var(--accent-primary);
                    transform: scale(1.1);
                }
                .chronos-avatar img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                .chronos-chat-log {
                    flex: 1;
                    overflow-y: auto;
                    padding: 16px;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    background: var(--bg-base);
                }
                .chronos-chat-bubble {
                    max-width: 85%;
                    padding: 12px;
                    border-radius: 12px;
                    line-height: 1.5;
                    font-size: 14px;
                    overflow-x: auto; /* Handle tables/wide content */
                    overflow-wrap: break-word;
                }
                .chronos-chat-bubble table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 12px;
                    margin: 8px 0;
                }
                .chronos-chat-bubble th, .chronos-chat-bubble td {
                    border: 1px solid var(--border-subtle);
                    padding: 6px;
                    text-align: left;
                }
                .chronos-chat-bubble th {
                    background: var(--bg-elevated);
                }
                
                .chronos-chat-input-area {
                    padding: 12px;
                    background: var(--bg-elevated);
                    border-top: 1px solid var(--border-subtle);
                    display: flex;
                    gap: 8px;
                }
                .chronos-chat-input-area textarea {
                    flex: 1;
                    resize: none;
                    min-height: 40px;
                    max-height: 120px;
                }
                /* Empty State */
                .chronos-empty {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    color: var(--text-muted);
                    text-align: center;
                    padding: 32px;
                }
                .chronos-empty-icon {
                    font-size: 48px;
                    margin-bottom: 16px;
                    opacity: 0.5;
                }
                .chronos-empty-title {
                    font-size: 16px;
                    font-weight: bold;
                    margin-bottom: 8px;
                }
                .chronos-empty-desc {
                    font-size: 12px;
                    opacity: 0.7;
                    max-width: 300px;
                }
            </style>
            
            <!-- Chat Column -->
            <div class="chronos-chat-col">
                <!-- Present Bar -->
                <div class="chronos-present-bar">
                    <span class="chronos-present-label">Present:</span>
                    <div class="chronos-present-avatars" id="present-avatars"></div>
                </div>
                
                <!-- Chat Log -->
                <div class="chronos-chat-log" id="chronos-chat-log"></div>
                
                <!-- Input Area -->
                <div class="chronos-chat-input-area">
                    <button class="btn btn-icon" id="chronos-persona-btn" title="Edit Persona">👤</button>
                    <textarea class="input" id="chronos-input" placeholder="Type your message... (Shift+Enter for new line)" rows="1"></textarea>
                    <button class="btn btn-primary" id="chronos-send">Send</button>
                </div>
            </div>
        `;
        container.appendChild(mainArea);

        // ─────────────────────────────────────────────────────────────────────
        // UI REFRESH FUNCTIONS
        // ─────────────────────────────────────────────────────────────────────

        const timeSelect = controlBar.querySelector('#time-select');
        const timeIcon = controlBar.querySelector('#time-icon');
        const weatherSelect = controlBar.querySelector('#weather-select');
        const weatherIcon = controlBar.querySelector('#weather-icon');
        const weatherIntensity = controlBar.querySelector('#weather-intensity');
        const locationSelect = controlBar.querySelector('#location-select');
        const presentAvatars = mainArea.querySelector('#present-avatars');
        const chatLog = mainArea.querySelector('#chronos-chat-log');
        const inputArea = mainArea.querySelector('#chronos-input');
        const sendBtn = mainArea.querySelector('#chronos-send');

        function refreshControls() {
            const state = A.State.get();
            const chronos = state.chronos || {};
            const pending = chronos.pendingChanges || {};

            // Helper to style pending controls
            const stylePending = (el, isPending) => {
                if (isPending) {
                    el.style.borderColor = 'var(--status-warning)';
                    el.style.color = 'var(--status-warning)';
                    el.title = 'Change staged - sending message will apply transition';
                } else {
                    el.style.borderColor = 'var(--border-subtle)';
                    el.style.color = 'var(--text-primary)';
                    el.title = '';
                }
            };

            // Time Slots
            const displayTime = pending.time !== undefined ? pending.time : chronos.currentTime;
            const timeSlots = chronos.timeSlots || (A.Chronos ? A.Chronos.DEFAULT_TIME_SLOTS : {});

            timeSelect.innerHTML = Object.entries(timeSlots)
                .sort((a, b) => (a[1].order || 0) - (b[1].order || 0))
                .map(([key, slot]) => `<option value="${key}" ${displayTime === key ? 'selected' : ''}>${slot.icon || ''} ${slot.label}</option>`)
                .join('');

            stylePending(timeSelect, pending.time !== undefined);

            const currentSlot = timeSlots[displayTime] || {};
            timeIcon.textContent = currentSlot.icon || '☀️';

            // Weather
            const displayWeather = pending.weather !== undefined ? pending.weather : chronos.weather?.condition;
            const displayIntensity = pending.intensity !== undefined ? pending.intensity : chronos.weather?.intensity;

            const weatherPresets = chronos.weatherPresets || (A.Chronos ? A.Chronos.DEFAULT_WEATHER_PRESETS : {});
            weatherSelect.innerHTML = Object.entries(weatherPresets)
                .map(([key, preset]) => `<option value="${key}" ${displayWeather === key ? 'selected' : ''}>${preset.icon || ''} ${preset.label}</option>`)
                .join('');

            /** @type {HTMLSelectElement} */ (weatherIntensity).value = displayIntensity || 'moderate';

            stylePending(weatherSelect, pending.weather !== undefined);
            stylePending(weatherIntensity, pending.intensity !== undefined);

            const currentWeather = weatherPresets[displayWeather] || {};
            weatherIcon.textContent = currentWeather.icon || '☀️';

            // Locations
            const displayLocation = pending.location !== undefined ? pending.location : chronos.userLocation;
            const locations = A.Chronos ? A.Chronos.getLocations(state) : {};
            const locEntries = Object.entries(locations);

            if (locEntries.length === 0) {
                locationSelect.innerHTML = '<option value="">No locations defined</option>';
            } else {
                locationSelect.innerHTML = '<option value="">-- Select Location --</option>' +
                    locEntries.map(([id, loc]) =>
                        `<option value="${id}" ${displayLocation === id ? 'selected' : ''}>${loc.name || id}</option>`
                    ).join('');
            }

            stylePending(locationSelect, pending.location !== undefined);
        }

        function refreshPresent() {
            const state = A.State.get();
            if (!A.Chronos) {
                presentAvatars.innerHTML = '<span style="color:var(--text-muted); font-size:11px;">Chronos core not loaded</span>';
                return;
            }

            const ctx = A.Chronos.buildContext(state);

            if (!ctx.userLocation) {
                presentAvatars.innerHTML = '<span style="color:var(--text-muted); font-size:11px;">Select a location to see who is present</span>';
                return;
            }

            if (ctx.actorsPresent.length === 0) {
                presentAvatars.innerHTML = '<span style="color:var(--text-muted); font-size:11px;">No one else is here</span>';
                return;
            }

            presentAvatars.innerHTML = ctx.actorsPresent.map(a => {
                const imgHtml = a.image
                    ? `<img src="${a.image}" alt="${a.name}" title="${a.name}: ${a.activity}">`
                    : `<span title="${a.name}: ${a.activity}">👤</span>`;
                return `<div class="chronos-avatar" data-actor="${a.id}">${imgHtml}</div>`;
            }).join('');

            // Bind avatar clicks (could show actor details)
            presentAvatars.querySelectorAll('.chronos-avatar').forEach(avNode => {
                const av = /** @type {HTMLElement} */ (avNode);
                av.onclick = () => {
                    const actorId = av.dataset.actor;
                    if (A.UI?.Modal) {
                        const actor = ctx.actorsPresent.find(a => a.id === actorId);
                        if (actor) {
                            A.UI.Modal.show({
                                title: actor.name,
                                content: `
                                    <div style="text-align:center;">
                                        ${actor.image ? `<img src="${actor.image}" style="width:120px; height:120px; border-radius:50%; object-fit:cover; margin-bottom:12px;">` : ''}
                                        <div style="font-size:14px; margin-bottom:8px;"><strong>Activity:</strong> ${actor.activity}</div>
                                        <div style="font-size:12px; color:var(--text-muted);">Available: ${actor.available ? 'Yes' : 'No (occupied)'}</div>
                                    </div>
                                `,
                                actions: [{ label: 'Close', class: 'btn-primary', onclick: () => true }]
                            });
                        }
                    }
                };
            });
        }

        function refreshWebLens() {
            const state = A.State.get();
            if (!A.Chronos) {
                return;
            }

            const ctx = A.Chronos.buildContext(state);
            const allActors = [...ctx.actorsPresent, ...ctx.actorsNearby, ...ctx.actorsElsewhere];

            // Use A.UI.setLens to populate the actual Web Lens sidebar
            A.UI.setLens((lensRoot) => {
                // Inject styles for hover effects that can't be inlined easily
                const style = document.createElement('style');
                style.textContent = `
                    .chronos-lens-item:hover { background-color: var(--bg-elevated) !important; }
                `;
                lensRoot.appendChild(style);

                if (allActors.length === 0) {
                    const empty = document.createElement('div');
                    empty.innerHTML = `
                        <div style="padding:16px; text-align:center; color:var(--text-muted);">
                            <div style="font-size:32px; margin-bottom:8px;">📅</div>
                            <div style="font-size:12px;">No actor schedules configured.</div>
                            <div style="font-size:11px; margin-top:4px;">Open Scheduler to assign routines.</div>
                        </div>
                    `;
                    lensRoot.appendChild(empty);
                    return;
                }

                let html = '<div style="font-size:11px; font-weight:bold; text-transform:uppercase; color:var(--text-muted); padding:12px; border-bottom:1px solid var(--border-subtle);">Actor Locations</div>';

                const sectionStyle = 'padding:8px 12px; font-size:10px; text-transform:uppercase; color:var(--text-muted); background:var(--bg-deep); font-weight:bold;';

                // Present
                if (ctx.actorsPresent.length > 0) {
                    html += `<div style="${sectionStyle}">Present</div>`;
                    ctx.actorsPresent.forEach(a => {
                        html += renderLensItem(a, true);
                    });
                }

                // Nearby
                if (ctx.actorsNearby.length > 0) {
                    html += `<div style="${sectionStyle}">Nearby</div>`;
                    ctx.actorsNearby.forEach(a => {
                        html += renderLensItem(a, false);
                    });
                }

                // Elsewhere
                if (ctx.actorsElsewhere.length > 0) {
                    html += `<div style="${sectionStyle}">Elsewhere</div>`;
                    ctx.actorsElsewhere.forEach(a => {
                        html += renderLensItem(a, false);
                    });
                }

                const content = document.createElement('div');
                content.innerHTML = html;
                lensRoot.appendChild(content);

                // Bind lens item clicks (travel to location)
                lensRoot.querySelectorAll('.chronos-lens-item').forEach(itemNode => {
                    const item = /** @type {HTMLElement} */ (itemNode);
                    item.onclick = () => {
                        const locId = item.dataset.location;
                        if (locId && A.Chronos) {
                            A.Chronos.setUserLocation(state, locId);
                            A.State.notify();
                            refreshAll();
                            if (A.UI?.Toast) A.UI.Toast.show(`Moved to ${A.Chronos.getLocationById(state, locId)?.name || locId}`, 'info');
                        }
                    };
                });
            });
        }

        function renderLensItem(actor, isPresent) {
            const imgHtml = actor.image
                ? `<img src="${actor.image}" style="width:100%; height:100%; object-fit:cover;">`
                : '👤';

            return `
                <div class="chronos-lens-item" data-location="${actor.location}" title="Click to go to ${actor.locationName}" 
                     style="display:flex; align-items:center; gap:10px; padding:10px 12px; border-bottom:1px solid var(--border-subtle); cursor:pointer; transition:background 0.2s;">
                    <div style="width:36px; height:36px; border-radius:50%; overflow:hidden; background:var(--bg-base); display:flex; align-items:center; justify-content:center; font-size:16px; flex-shrink:0;">
                        ${imgHtml}
                    </div>
                    <div style="flex:1; min-width:0;">
                        <div style="font-weight:600; font-size:12px; color:var(--text-primary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${actor.name}</div>
                        <div style="font-size:10px; color:var(--text-muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                            ${isPresent ? actor.activity : `at ${actor.locationName}`}
                        </div>
                    </div>
                </div>
            `;
        }

        function refreshChat() {
            const state = A.State.get();
            // Use Chronos-specific history, separate from simulator
            const chronos = A.Chronos ? A.Chronos.ensureState(state) : {};
            const history = chronos.history || [];

            if (history.length === 0) {
                chatLog.innerHTML = `
                    <div class="chronos-empty">
                        <div class="chronos-empty-icon">💬</div>
                        <div class="chronos-empty-title">Start Your Story</div>
                        <div class="chronos-empty-desc">Set your location and time above, then send a message to begin.</div>
                    </div>
                `;
                return;
            }

            chatLog.innerHTML = '';
            history.forEach((msg, idx) => {
                // Wrapper for alignment
                const wrapper = document.createElement('div');
                wrapper.className = `chat-message chat-message-${msg.role}`;

                // Actual bubble for content
                const bubble = document.createElement('div');
                bubble.className = `chronos-chat-bubble chronos-chat-bubble-${msg.role}`;

                // Inline styles for bubble with improved contrast
                if (msg.role === 'user') {
                    bubble.style.cssText = 'background:var(--accent-primary); color:#fff; border-radius:12px 12px 4px 12px; position:relative; overflow:visible; padding:12px; box-shadow:0 2px 8px rgba(0,0,0,0.15);';
                } else {
                    bubble.style.cssText = 'background:var(--bg-panel); color:var(--text-primary); border-radius:12px 12px 12px 4px; border:1px solid var(--border-default); position:relative; overflow:visible; padding:12px; box-shadow:0 2px 8px rgba(0,0,0,0.1);';
                }

                // Inner content wrapper for overflow protection (tables)
                const contentDiv = document.createElement('div');
                contentDiv.style.cssText = 'overflow-x:auto; overflow-wrap:break-word; max-width:100%;';
                contentDiv.innerHTML = A.ChatFormatter ? A.ChatFormatter.format(msg.content) : msg.content;
                bubble.appendChild(contentDiv);

                // Add Actions
                const actions = document.createElement('div');
                actions.className = 'chat-actions';
                actions.innerHTML = `
                    <button class="chat-action-btn" data-action="edit" title="Edit">✏️</button>
                    <button class="chat-action-btn" data-action="copy" title="Copy">📋</button>
                    ${msg.role === 'model' ? '<button class="chat-action-btn" data-action="regenerate" title="Regenerate">🔄</button>' : ''}
                    <button class="chat-action-btn danger" data-action="delete" title="Delete">🗑️</button>
                `;
                bubble.appendChild(actions);

                wrapper.appendChild(bubble);
                wrapper.dataset.index = idx; // Store index for actions
                chatLog.appendChild(wrapper);
            });

            // Bind action buttons
            chatLog.querySelectorAll('.chat-action-btn').forEach(btnNode => {
                const btn = /** @type {HTMLElement} */ (btnNode);
                btn.onclick = (e) => {
                    const target = /** @type {HTMLElement} */ (e.target);
                    const wrapper = /** @type {HTMLElement} */ (target.closest('.chat-message'));
                    if (wrapper) {
                        handleMessageAction(target.dataset.action, parseInt(wrapper.dataset.index));
                    }
                };
            });

            chatLog.scrollTop = chatLog.scrollHeight;
        }

        // ─────────────────────────────────────────────────────────────────────
        // ACTION HANDLERS
        // ─────────────────────────────────────────────────────────────────────

        function handleMessageAction(action, index) {
            const state = A.State.get();
            const chronos = A.Chronos ? A.Chronos.ensureState(state) : null;
            if (!chronos || !chronos.history[index]) return;

            const msg = chronos.history[index];

            if (action === 'edit') {
                openEditModal(index, msg);
            } else if (action === 'copy') {
                const text = A.ChatFormatter ? A.ChatFormatter.toPlainText(msg.content) : msg.content;
                navigator.clipboard.writeText(text);
                if (A.UI.Toast) A.UI.Toast.show('Copied to clipboard', 'success');
            } else if (action === 'delete') {
                const msgCount = chronos.history.length - index;
                const confirmMsg = msgCount > 1
                    ? `Delete this message and ${msgCount - 1} subsequent message(s)?`
                    : 'Delete this message?';
                if (confirm(confirmMsg)) {
                    chronos.history = chronos.history.slice(0, index);
                    A.State.notify();
                    refreshAll();
                }
            } else if (action === 'regenerate') {
                regenerateMessage(index);
            }
        }

        function openEditModal(index, msg) {
            const state = A.State.get();
            A.UI.Modal.show({
                title: `Edit ${msg.role.toUpperCase()} Message`,
                content: `
                    <textarea id="chronos-edit-msg" class="input" style="width:100%; min-height:120px; font-family:inherit; padding:8px;">${msg.content}</textarea>
                `,
                actions: [
                    { label: 'Cancel', class: 'btn-ghost', onclick: () => true },
                    {
                        label: 'Save', class: 'btn-primary', onclick: (modal) => {
                            const newContent = modal.querySelector('#chronos-edit-msg').value;
                            const chronos = state.chronos;
                            if (chronos && chronos.history[index]) {
                                chronos.history[index].content = newContent;
                                chronos.history[index].edited = true;
                                A.State.notify();
                                refreshAll();
                                if (A.UI.Toast) A.UI.Toast.show('Message updated', 'success');
                            }
                            return true;
                        }
                    }
                ]
            });
        }

        async function regenerateMessage(index) {
            const state = A.State.get();
            const chronos = state.chronos;

            // Truncate history to just before this message
            chronos.history = chronos.history.slice(0, index);
            A.State.notify();
            refreshAll();

            // Check if we have a user message to respond to
            if (chronos.history.length > 0) {
                // Construct context
                const ctx = A.Chronos.buildContext(state);
                const systemPrompt = A.Chronos.buildPromptBlock(ctx);

                // UI Loading state
                const tempId = 'thinking-' + Date.now();
                chronos.history.push({
                    role: 'model',
                    content: '_(Thinking..._)',
                    id: tempId
                });
                A.State.notify();
                refreshAll();

                try {
                    const maxTokens = A.UI?.getMaxTokensFor?.('chronos') || 4096;
                    const response = await A.LLM.generate(
                        systemPrompt,
                        chronos.history.slice(0, -1), // Exclude the temp thinking message
                        {
                            stops: ['\nUser:', '\nSystem:'],
                            maxTokens
                        }
                    );

                    // Remove temp message
                    chronos.history = chronos.history.filter(m => m.id !== tempId);

                    // Add response
                    chronos.history.push({
                        role: 'model',
                        content: response,
                        timestamp: new Date().toISOString()
                    });

                } catch (err) {
                    console.error(err);
                    chronos.history = chronos.history.filter(m => m.id !== tempId);
                    if (A.UI.Toast) A.UI.Toast.show('Generation failed: ' + err.message, 'error');
                }

                A.State.notify();
                refreshAll();
            } else {
                if (A.UI.Toast) A.UI.Toast.show('Cannot regenerate: No history to respond to', 'warning');
            }
        }

        function refreshAll() {
            refreshControls();
            refreshPresent();
            refreshWebLens();
            refreshChat();
        }

        // ─────────────────────────────────────────────────────────────────────
        // EVENT BINDINGS
        // ─────────────────────────────────────────────────────────────────────
        // Event Bindings
        /** @type {HTMLSelectElement} */ (timeSelect).onchange = () => {
            if (A.Chronos) {
                const s = A.State.get();
                A.Chronos.stagePendingChange(s, 'time', /** @type {HTMLSelectElement} */(timeSelect).value);
                A.State.notify();
                refreshControls(); // Update UI to show pending state
            }
        };

        /** @type {HTMLSelectElement} */ (weatherSelect).onchange = () => {
            if (A.Chronos) {
                const s = A.State.get();
                A.Chronos.stagePendingChange(s, 'weather', /** @type {HTMLSelectElement} */(weatherSelect).value);
                A.State.notify();
                refreshControls();
            }
        };

        /** @type {HTMLSelectElement} */ (weatherIntensity).onchange = () => {
            if (A.Chronos) {
                const s = A.State.get();
                A.Chronos.stagePendingChange(s, 'intensity', /** @type {HTMLSelectElement} */(weatherIntensity).value);
                A.State.notify();
                refreshControls();
            }
        };

        /** @type {HTMLSelectElement} */ (locationSelect).onchange = () => {
            if (A.Chronos) {
                const s = A.State.get();
                A.Chronos.stagePendingChange(s, 'location', /** @type {HTMLSelectElement} */(locationSelect).value || null);
                A.State.notify();
                refreshControls();
            }
        };

        /** @type {HTMLElement} */ (controlBar.querySelector('#btn-advance-time')).onclick = () => {
            if (A.Chronos) {
                const s = A.State.get();
                // Determine next slot
                const slots = Object.values(s.chronos?.timeSlots || A.Chronos.DEFAULT_TIME_SLOTS).sort((a, b) => a.order - b.order);
                const currentKey = s.chronos?.currentTime;
                const keys = Object.keys(s.chronos?.timeSlots || A.Chronos.DEFAULT_TIME_SLOTS);
                // Sort keys by order
                keys.sort((a, b) => (s.chronos?.timeSlots?.[a]?.order || 0) - (s.chronos?.timeSlots?.[b]?.order || 0));
                const idx = keys.indexOf(currentKey);
                const nextKey = keys[(idx + 1) % keys.length];

                A.Chronos.stagePendingChange(s, 'time', nextKey);
                A.State.notify();
                refreshControls();
                if (A.UI?.Toast) A.UI.Toast.show(`Time advance staged: ${nextKey}`, 'info');
            }
        };

        /** @type {HTMLElement} */ (controlBar.querySelector('#btn-refresh')).onclick = refreshAll;
        /** @type {HTMLElement} */ (mainArea.querySelector('#chronos-persona-btn')).onclick = openPersonaModal;

        function openPersonaModal() {
            const state = A.State.get();
            // Ensure user object
            if (!state.chronos.user) {
                state.chronos.user = { name: state.meta?.author || 'Player', description: '' };
            }
            const user = state.chronos.user;

            // Create modal overlay
            const overlay = document.createElement('div');
            overlay.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); z-index:9000; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(2px);';

            const modal = document.createElement('div');
            modal.className = 'chronos-modal';
            modal.style.cssText = 'background:var(--bg-panel); padding:24px; border-radius:12px; width:400px; border:1px solid var(--border-default); box-shadow:0 10px 30px rgba(0,0,0,0.5); font-family:var(--font-main);';

            modal.innerHTML = `
                <div style="font-size:18px; font-weight:bold; margin-bottom:16px; color:var(--text-primary); border-bottom:1px solid var(--border-subtle); padding-bottom:12px;">User Persona</div>
                <div style="margin-bottom:16px;">
                    <label style="display:block; font-size:12px; font-weight:600; color:var(--text-muted); margin-bottom:6px; text-transform:uppercase;">DisplayName</label>
                    <input type="text" id="persona-name" value="${user.name}" style="width:100%; padding:10px; background:var(--bg-input); border:1px solid var(--border-subtle); color:var(--text-primary); border-radius:6px; font-size:14px;">
                </div>
                <div style="margin-bottom:24px;">
                    <label style="display:block; font-size:12px; font-weight:600; color:var(--text-muted); margin-bottom:6px; text-transform:uppercase;">Physical Description / Role</label>
                    <textarea id="persona-desc" rows="4" placeholder="How do others perceive you? (e.g., A tall figure in a hooded cloak...)" style="width:100%; padding:10px; background:var(--bg-input); border:1px solid var(--border-subtle); color:var(--text-primary); border-radius:6px; font-size:14px; resize:vertical;">${user.description}</textarea>
                    <div style="font-size:11px; color:var(--text-muted); margin-top:4px;">This description is visible to the AI Narrator.</div>
                </div>
                <div style="display:flex; justify-content:flex-end; gap:12px;">
                    <button id="p-cancel" class="btn" style="padding:8px 16px;">Cancel</button>
                    <button id="p-save" class="btn btn-primary" style="padding:8px 24px;">Save</button>
                </div>
             `;

            overlay.appendChild(modal);
            document.body.appendChild(overlay);

            // Event Handlers
    /** @type {HTMLElement} */ (modal.querySelector('#p-cancel')).onclick = () => document.body.removeChild(overlay);
    /** @type {HTMLElement} */ (modal.querySelector('#p-save')).onclick = () => {
                const name = /** @type {HTMLInputElement} */ (modal.querySelector('#persona-name')).value.trim() || 'Player';
                const desc = /** @type {HTMLTextAreaElement} */ (modal.querySelector('#persona-desc')).value.trim();

                // Save to state
                if (A.Chronos) A.Chronos.ensureState(state);
                state.chronos.user = { name, description: desc };
                A.State.notify();

                document.body.removeChild(overlay);
                if (A.UI?.Toast) A.UI.Toast.show('User persona saved', 'success');
            };
        }

        // Chat sending - Chronos has its own history and LLM integration
        const sendMessage = async () => {
            const txt = /** @type {HTMLTextAreaElement} */ (inputArea).value.trim();
            if (!txt) return;

            const state = A.State.get();
            const chronos = A.Chronos ? A.Chronos.ensureState(state) : state.chronos || {};
            if (!chronos.history) chronos.history = [];

            /** @type {HTMLTextAreaElement} */ (inputArea).value = '';
            sendBtn.disabled = true;
            sendBtn.textContent = 'Sending...';

            try {
                // Push user message to Chronos history
                chronos.history.push({
                    role: 'user',
                    content: txt,
                    timestamp: new Date().toISOString()
                });
                A.State.notify();
                refreshChat();

                // Build system prompt with Chronos context
                const chronosCtx = A.Chronos ? A.Chronos.buildContext(state) : null;

                // 1. RUN SIMULATOR LOGIC ENGINE (Parity with Live Chat)
                // This ensures tags, lorebook entries, and context summary are included.
                let finalContext = {};
                let logicLogs = [];
                let activeTags = [];
                let systemNotes = '';

                if (A.Simulator && A.Simulator.processRound) {
                    try {
                        // We use the Chronos history, but the Simulator's logic processor
                        const roundResult = A.Simulator.processRound(txt, chronos.history, 'input');
                        finalContext = roundResult.context || {};
                        logicLogs = roundResult.logs || [];
                        // Extract rich context features
                        activeTags = finalContext.tags || [];
                        systemNotes = finalContext.system_notes || '';
                    } catch (err) {
                        console.warn('Simulator Logic failed in Chronos:', err);
                        // Fallback to basic state if logic fails
                        finalContext = {
                            character: state.character?.compiled || state.seed || {}
                        };
                    }
                } else {
                    // Fallback if Simulator not loaded
                    finalContext = {
                        character: state.character?.compiled || state.seed || {}
                    };
                }

                // 2. BUILD SYSTEM PROMPT
                const charName = finalContext.character?.name || 'Character';
                const personality = finalContext.character?.personality || '';
                const scenario = finalContext.character?.scenario || '';

                let systemPrompt = `You are playing the role of ${charName}.\n`;
                if (personality) systemPrompt += `[Personality: ${personality}]\n`;
                if (scenario) systemPrompt += `[Scenario: ${scenario}]\n`;

                // Active Tags (from Logic Engine)
                if (activeTags.length > 0) {
                    systemPrompt += `[Active Tags: ${activeTags.join(', ')}]\n`;
                }

                // Context/Lore (from Logic Engine)
                if (systemNotes) {
                    systemPrompt += `\n[Context Notes]:\n${systemNotes}\n`;
                }

                // Context Summary (Global Memory)
                if (state.sim?.contextSummary) {
                    systemPrompt += `\n[Memory/Past Events]:\n${state.sim.contextSummary}\n`;
                }

                // 3. CHRONOS WORLD STATE (Immersion Injection)
                // Add Chronos world state (includes PENDING TRANSITIONS block)
                if (chronosCtx && chronosCtx.enabled) {
                    const level = state.chronos?.settings?.promptConstraintsLevel || 'standard';
                    systemPrompt += A.Chronos.buildPromptBlock(chronosCtx, level);
                }

                // 4. USER PERSONA & NARRATION RULES
                const user = state.chronos?.user || { name: 'Player', description: 'A silent observer.' };
                systemPrompt += `\n[User Identity: ${user.name}]\n`;
                if (user.description) systemPrompt += `[User Description: ${user.description}]\n`;

                systemPrompt += `\n═══════════════════════════════════════════════════════════\n`;
                systemPrompt += `NARRATION RULES (STRICT)\n`;
                systemPrompt += `═══════════════════════════════════════════════════════════\n`;
                systemPrompt += `1. PROSE ONLY: Do not use "Narrator:" prefix. Write in third-person limited (focusing on actors/environment).\n`;
                systemPrompt += `2. NO PLAYER ACTION: DO NOT write dialogue or actions for the User (${user.name}). You are the narrator, not the player.\n`;
                systemPrompt += `3. IMMERSION: Focus on sensory details (weather, sounds, light) and actor reactions to the User.\n`;
                systemPrompt += `4. SCENE TRUTH: Characters mentioned in [Memory] or [Context Notes] are NOT present unless listed in 【PRESENT IN SCENE】. Do not hallucinate them.\n\n`;

                sendBtn.textContent = 'Thinking...';

                // Call LLM using A.LLM.generate
                const llmConfig = A.UI.getActiveLLMConfig ? A.UI.getActiveLLMConfig() : null;

                // Convert history to API format (exclude the user message we just added, it's already there)
                const apiHistory = chronos.history.map(m => ({
                    role: m.role === 'model' ? 'assistant' : m.role,
                    content: m.content
                }));

                // INJECT PENDING TRANSITION (High Priority)
                if (A.Chronos && A.Chronos.hasPendingChanges(state)) {
                    const transDesc = A.Chronos.getPendingDescription(state);
                    if (transDesc) {
                        console.log('[Chronos] Injecting transition instruction:', transDesc);

                        // Force a user message to make it unavoidable? No, system is better.
                        // But let's make it ALL CAPS and imperatively styled.
                        apiHistory.push({
                            role: 'system',
                            content: `IMPORTANT: YOU MUST EXECUTE THE FOLLOWING TRANSITION IN YOUR NARRATIVE:\n${transDesc}\nIGNORE ANY PREVIOUS CONTEXT THAT CONTRADICTS THIS CHANGE.`
                        });
                    }
                }

                const chronosMaxTokens = A.UI?.getMaxTokensFor?.('chronos') || 4096;
                const responseText = await A.LLM.generate(
                    systemPrompt,
                    apiHistory,
                    { ...llmConfig, maxTokens: chronosMaxTokens }
                );

                // Push AI response to Chronos history
                chronos.history.push({
                    role: 'model',
                    content: responseText,
                    timestamp: new Date().toISOString()
                });

                // APPLY PENDING CHANGES NOW
                if (A.Chronos && A.Chronos.hasPendingChanges(state)) {
                    A.Chronos.applyPendingChanges(state);
                    // Toast notification for applied changes logic could go here
                }

                A.State.notify();
                refreshChat();
            } catch (e) {
                console.error(e);
                if (A.UI?.Toast) A.UI.Toast.show(e.message, 'error');
                // Add error to chat
                chronos.history.push({
                    role: 'system',
                    content: `[Error: ${e.message}]`,
                    timestamp: new Date().toISOString()
                });
                refreshChat();
            } finally {
                sendBtn.disabled = false;
                sendBtn.textContent = 'Send';
            }
        };

        /** @type {HTMLButtonElement} */ (sendBtn).onclick = sendMessage;
        /** @type {HTMLElement} */ (inputArea).onkeydown = (e) => {
            if (/** @type {KeyboardEvent} */ (e).key === 'Enter' && !/** @type {KeyboardEvent} */ (e).shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        };

        // Initial render
        refreshAll();

        // Subscribe to state changes
        const unsub = A.State.subscribe(() => {
            if (container.isConnected) {
                refreshAll();
            }
        });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // REGISTER PANEL
    // ═══════════════════════════════════════════════════════════════════════════

    A.registerPanel('chronos_chat', {
        label: 'Chronos',
        subtitle: 'Enhanced Roleplay',
        category: 'Forbidden Secrets',
        subcategory: 'Immersion',
        order: 1,
        icon: '⏳',
        render: render
    });

    console.log('[Chronos] Chat panel registered');

})(window.Anansi);
