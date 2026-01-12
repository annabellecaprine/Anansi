/*
 * Anansi Panel: Immersion Settings
 * File: js/plugins/chronos/chronos_settings.js
 * Category: Immersion
 * Purpose: Configure time blocks, weather presets, intensity levels, and general settings.
 */

(function (A) {
    'use strict';

    function render(container, context) {
        const state = A.State.get();
        if (A.Chronos) A.Chronos.ensureState(state);

        container.innerHTML = '';
        container.style.cssText = 'display:flex; flex-direction:column; height:100%; overflow:hidden;';

        container.innerHTML = `
            <style>
                .immersion-settings {
                    flex: 1;
                    overflow-y: auto;
                    padding: 16px;
                }
                .settings-section {
                    background: var(--bg-surface);
                    border: 1px solid var(--border-subtle);
                    border-radius: 8px;
                    margin-bottom: 16px;
                    overflow: hidden;
                }
                .settings-section-header {
                    background: var(--bg-elevated);
                    padding: 12px 16px;
                    font-weight: bold;
                    font-size: 13px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    border-bottom: 1px solid var(--border-subtle);
                }
                .settings-section-body {
                    padding: 16px;
                }
                .settings-grid {
                    display: grid;
                    gap: 12px;
                }
                .settings-row {
                    display: grid;
                    grid-template-columns: 60px 120px 1fr 80px;
                    gap: 8px;
                    align-items: center;
                    padding: 8px;
                    background: var(--bg-base);
                    border-radius: 6px;
                }
                .settings-row.header {
                    background: transparent;
                    font-size: 10px;
                    text-transform: uppercase;
                    color: var(--text-muted);
                    font-weight: bold;
                    padding-bottom: 4px;
                }
                .settings-row input, .settings-row select {
                    font-size: 12px;
                }
                .weather-row {
                    grid-template-columns: 50px 100px 1fr 40px;
                }
                .intensity-row {
                    grid-template-columns: 80px 1fr;
                }
                .settings-description {
                    font-size: 11px;
                    color: var(--text-muted);
                    margin-bottom: 12px;
                    line-height: 1.4;
                }
                .settings-toggle {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 12px;
                    border-bottom: 1px solid var(--border-subtle);
                }
                .settings-toggle:last-child {
                    border-bottom: none;
                }
                .settings-toggle-label {
                    font-size: 13px;
                }
                .settings-toggle-desc {
                    font-size: 11px;
                    color: var(--text-muted);
                }
            </style>
            
            <div class="immersion-settings">
                <!-- Time Blocks -->
                <div class="settings-section">
                    <div class="settings-section-header">
                        <span>⏰</span>
                        <span>Time Blocks</span>
                    </div>
                    <div class="settings-section-body">
                        <div class="settings-description">
                            Define the periods of day and their hour ranges. These are used for actor schedules and affect the narrative tone.
                        </div>
                        <div class="settings-grid" id="time-slots-grid"></div>
                    </div>
                </div>

                <!-- Weather Presets -->
                <div class="settings-section">
                    <div class="settings-section-header">
                        <span>🌤️</span>
                        <span>Weather Presets</span>
                    </div>
                    <div class="settings-section-body">
                        <div class="settings-description">
                            Configure available weather conditions. The description is injected into the AI prompt when that weather is active.
                        </div>
                        <div class="settings-grid" id="weather-presets-grid"></div>
                        <button class="btn btn-ghost btn-sm" id="add-weather-btn" style="margin-top:12px;">+ Add Weather</button>
                    </div>
                </div>

                <!-- Intensity Levels -->
                <div class="settings-section">
                    <div class="settings-section-header">
                        <span>📊</span>
                        <span>Intensity Levels</span>
                    </div>
                    <div class="settings-section-body">
                        <div class="settings-description">
                            Intensity modifies how strongly the current weather affects the scene. The description is added to the weather prompt.
                        </div>
                        <div class="settings-grid" id="intensity-grid"></div>
                    </div>
                </div>

                <!-- General Settings -->
                <div class="settings-section">
                    <div class="settings-section-header">
                        <span>⚙️</span>
                        <span>General Settings</span>
                    </div>
                    <div class="settings-section-body" style="padding:0;">
                        <div class="settings-toggle">
                            <div>
                                <div class="settings-toggle-label">Show Nearby Actors</div>
                                <div class="settings-toggle-desc">Include actors in adjacent locations in the prompt</div>
                            </div>
                            <input type="checkbox" id="setting-nearby" />
                        </div>
                        <div class="settings-toggle">
                            <div>
                                <div class="settings-toggle-label">Auto-Advance Time</div>
                                <div class="settings-toggle-desc">Automatically progress time after each exchange (not yet implemented)</div>
                            </div>
                            <input type="checkbox" id="setting-auto-time" disabled />
                        </div>
                    </div>
                </div>

                <!-- Memory Cleanup -->
                <div class="settings-section">
                    <div class="settings-section-header">
                        <span>🧠</span>
                        <span>Memory & History</span>
                    </div>
                    <div class="settings-section-body">
                        <div class="settings-description">
                            Manage the AI's long-term memory and chat history.
                        </div>
                        <div style="display:grid; gap:8px;">
                            <button class="btn btn-ghost btn-sm" id="clear-memory-btn" style="border:1px solid var(--border-subtle);">Clear Global Context Memory (Summaries)</button>
                            <button class="btn btn-ghost btn-sm" id="purge-chat-btn" style="color:var(--status-error); border:1px solid var(--status-error);">🔥 Purge All History & State</button>
                        </div>
                        <div class="settings-description" style="margin-top:8px; font-size:10px;">
                            <strong>Purge All:</strong> Deletes all Chronos chat messages, clears Sim tags, actors, and memory. Use this to start a completely fresh scene.
                        </div>
                    </div>
                </div>

                <!-- Reset -->
                <div style="text-align:center; margin-top:8px;">
                    <button class="btn btn-ghost btn-sm" id="reset-defaults-btn" style="color:var(--status-warning);">Reset All to Defaults</button>
                </div>
            </div>
        `;

        const timeSlotsGrid = container.querySelector('#time-slots-grid');
        const weatherGrid = container.querySelector('#weather-presets-grid');
        const intensityGrid = container.querySelector('#intensity-grid');

        // ─────────────────────────────────────────────────────────────────────
        // TIME SLOTS
        // ─────────────────────────────────────────────────────────────────────
        function renderTimeSlots() {
            const chronos = state.chronos;
            const slots = chronos.timeSlots || {};

            let html = `
                <div class="settings-row header">
                    <span>Icon</span>
                    <span>Label</span>
                    <span>Hours</span>
                    <span></span>
                </div>
            `;

            Object.entries(slots)
                .sort((a, b) => (a[1].order || 0) - (b[1].order || 0))
                .forEach(([key, slot]) => {
                    html += `
                        <div class="settings-row" data-slot="${key}">
                            <input type="text" class="input slot-icon" value="${slot.icon || ''}" maxlength="2" style="text-align:center; font-size:16px;">
                            <input type="text" class="input slot-label" value="${slot.label || key}">
                            <input type="text" class="input slot-hours" value="${slot.hours || ''}" placeholder="e.g., 5:00 - 7:00">
                            <span style="font-size:10px; color:var(--text-muted);">${key}</span>
                        </div>
                    `;
                });

            timeSlotsGrid.innerHTML = html;

            // Bind changes
            timeSlotsGrid.querySelectorAll('.settings-row:not(.header)').forEach(row => {
                const key = row.dataset.slot;
                row.querySelectorAll('input').forEach(input => {
                    input.onchange = () => {
                        const slot = chronos.timeSlots[key];
                        if (input.classList.contains('slot-icon')) slot.icon = input.value;
                        if (input.classList.contains('slot-label')) slot.label = input.value;
                        if (input.classList.contains('slot-hours')) slot.hours = input.value;
                        A.State.notify();
                    };
                });
            });
        }

        // ─────────────────────────────────────────────────────────────────────
        // WEATHER PRESETS
        // ─────────────────────────────────────────────────────────────────────
        function renderWeatherPresets() {
            const chronos = state.chronos;
            const presets = chronos.weatherPresets || {};

            let html = `
                <div class="settings-row weather-row header">
                    <span>Icon</span>
                    <span>Label</span>
                    <span>Description</span>
                    <span></span>
                </div>
            `;

            Object.entries(presets).forEach(([key, preset]) => {
                html += `
                    <div class="settings-row weather-row" data-weather="${key}">
                        <input type="text" class="input weather-icon" value="${preset.icon || ''}" maxlength="2" style="text-align:center; font-size:16px;">
                        <input type="text" class="input weather-label" value="${preset.label || key}">
                        <input type="text" class="input weather-desc" value="${preset.description || ''}" placeholder="Description for AI prompt">
                        <button class="btn btn-ghost btn-sm weather-delete" style="color:var(--status-error); padding:4px;" title="Delete">🗑️</button>
                    </div>
                `;
            });

            weatherGrid.innerHTML = html;

            // Bind changes
            weatherGrid.querySelectorAll('.settings-row:not(.header)').forEach(row => {
                const key = row.dataset.weather;
                row.querySelectorAll('input').forEach(input => {
                    input.onchange = () => {
                        const preset = chronos.weatherPresets[key];
                        if (input.classList.contains('weather-icon')) preset.icon = input.value;
                        if (input.classList.contains('weather-label')) preset.label = input.value;
                        if (input.classList.contains('weather-desc')) preset.description = input.value;
                        A.State.notify();
                    };
                });
                row.querySelector('.weather-delete').onclick = () => {
                    if (confirm(`Delete weather preset "${presets[key].label}"?`)) {
                        delete chronos.weatherPresets[key];
                        A.State.notify();
                        renderWeatherPresets();
                    }
                };
            });
        }

        container.querySelector('#add-weather-btn').onclick = () => {
            const chronos = state.chronos;
            const key = 'custom_' + Date.now().toString(36);
            chronos.weatherPresets[key] = {
                label: 'New Weather',
                icon: '🌈',
                description: 'A new weather condition.'
            };
            A.State.notify();
            renderWeatherPresets();
        };

        // ─────────────────────────────────────────────────────────────────────
        // INTENSITY LEVELS
        // ─────────────────────────────────────────────────────────────────────
        function renderIntensityLevels() {
            const chronos = state.chronos;
            const levels = chronos.intensityLevels || {};

            let html = `
                <div class="settings-row intensity-row header">
                    <span>Level</span>
                    <span>Description (for AI prompt)</span>
                </div>
            `;

            Object.entries(levels).forEach(([key, level]) => {
                html += `
                    <div class="settings-row intensity-row" data-intensity="${key}">
                        <span style="font-weight:bold; text-transform:capitalize;">${level.label || key}</span>
                        <input type="text" class="input intensity-desc" value="${level.description || ''}" placeholder="Description">
                    </div>
                `;
            });

            intensityGrid.innerHTML = html;

            // Bind changes
            intensityGrid.querySelectorAll('.settings-row:not(.header)').forEach(row => {
                const key = row.dataset.intensity;
                row.querySelector('.intensity-desc').onchange = (e) => {
                    chronos.intensityLevels[key].description = e.target.value;
                    A.State.notify();
                };
            });
        }

        // ─────────────────────────────────────────────────────────────────────
        // GENERAL SETTINGS
        // ─────────────────────────────────────────────────────────────────────
        const nearbyToggle = container.querySelector('#setting-nearby');
        const autoTimeToggle = container.querySelector('#setting-auto-time');

        nearbyToggle.checked = state.chronos?.settings?.showNearbyActors ?? true;
        autoTimeToggle.checked = state.chronos?.settings?.autoAdvanceTime ?? false;

        nearbyToggle.onchange = () => {
            state.chronos.settings.showNearbyActors = nearbyToggle.checked;
            A.State.notify();
        };

        // ─────────────────────────────────────────────────────────────────────
        // MEMORY CLEANUP
        // ─────────────────────────────────────────────────────────────────────
        // ─────────────────────────────────────────────────────────────────────
        // MEMORY CLEANUP
        // ─────────────────────────────────────────────────────────────────────
        const clearMemBtn = container.querySelector('#clear-memory-btn');
        if (clearMemBtn) {
            clearMemBtn.onclick = () => {
                if (state.sim) {
                    if (confirm('Clear only the global context summary? Chat history will remain.')) {
                        state.sim.contextSummary = null;
                        A.State.notify();
                        if (A.UI.Toast) A.UI.Toast.show('Global memory cleared', 'success');
                    }
                }
            };
        }

        const purgeBtn = container.querySelector('#purge-chat-btn');
        if (purgeBtn) {
            purgeBtn.onclick = () => {
                if (confirm('⚠️ NUCLEAR OPTION: Clear EVERYTHING?\n\nThis will delete:\n- All Chronos Chat History\n- Global Context Memory\n- Active Tags & Sim State\n- Present Actors List\n\nThis cannot be undone.')) {
                    if (state.sim) {
                        state.sim.contextSummary = null;
                        state.sim.activeTags = [];
                        state.sim.actors = []; // Clear injected actors
                        // We do NOT clear sim.history because Chronos uses its own history, but we should verify.
                        // Actually, if we want to be safe, we clear Sim history too to prevent leakage.
                        state.sim.history = [];
                    }
                    if (state.chronos) {
                        state.chronos.history = [];
                        state.chronos.pendingChanges = null;
                        state.chronos.weather = { condition: 'clear', intensity: 'light' }; // Reset weather too? Maybe not.
                        // Let's keep settings but clear narrative state.
                    }

                    A.State.notify();
                    if (A.UI.Toast) A.UI.Toast.show('Full purge complete. The slate is clean.', 'success');
                }
            };
        }

        // ─────────────────────────────────────────────────────────────────────
        // RESET DEFAULTS
        // ─────────────────────────────────────────────────────────────────────
        container.querySelector('#reset-defaults-btn').onclick = () => {
            if (confirm('Reset all Immersion settings to defaults? This cannot be undone.')) {
                state.chronos.timeSlots = JSON.parse(JSON.stringify(A.Chronos.DEFAULT_TIME_SLOTS));
                state.chronos.weatherPresets = JSON.parse(JSON.stringify(A.Chronos.DEFAULT_WEATHER_PRESETS));
                state.chronos.intensityLevels = JSON.parse(JSON.stringify(A.Chronos.DEFAULT_INTENSITY_LEVELS));
                A.State.notify();
                renderTimeSlots();
                renderWeatherPresets();
                renderIntensityLevels();
                if (A.UI.Toast) A.UI.Toast.show('Settings reset to defaults', 'success');
            }
        };

        // Initial render
        renderTimeSlots();
        renderWeatherPresets();
        renderIntensityLevels();
    }

    A.registerPanel('chronos_settings', {
        label: 'Settings',
        subtitle: 'Immersion Config',
        category: 'Immersion',
        order: 3,
        icon: '⚙️',
        render: render
    });

    console.log('[Chronos] Settings panel registered');

})(window.Anansi);
