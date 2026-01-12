/*
 * Anansi Panel: Chronos Scheduler
 * File: js/plugins/chronos/chronos_scheduler.js
 * Category: Immersion
 * Purpose: Visual schedule editor for assigning actor routines across time slots.
 */

(function (A) {
    'use strict';

    let selectedActorId = null;

    function render(container, context) {
        const state = A.State.get();
        if (A.Chronos) A.Chronos.ensureState(state);

        container.innerHTML = '';
        container.style.display = 'flex';
        container.style.height = '100%';
        container.style.overflow = 'hidden';

        container.innerHTML = `
            <style>
                .sched-sidebar {
                    width: 220px;
                    background: var(--bg-surface);
                    border-right: 1px solid var(--border-subtle);
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }
                .sched-sidebar-header {
                    padding: 12px;
                    font-weight: bold;
                    font-size: 12px;
                    border-bottom: 1px solid var(--border-subtle);
                    background: var(--bg-elevated);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .sched-actor-list {
                    flex: 1;
                    overflow-y: auto;
                }
                .sched-actor-item {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 10px 12px;
                    border-bottom: 1px solid var(--border-subtle);
                    cursor: pointer;
                    transition: background 0.2s;
                }
                .sched-actor-item:hover {
                    background: var(--bg-elevated);
                }
                .sched-actor-item.active {
                    background: var(--accent-primary);
                    color: white;
                }
                .sched-actor-avatar {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    overflow: hidden;
                    background: var(--bg-base);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 14px;
                    flex-shrink: 0;
                }
                .sched-actor-avatar img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                .sched-actor-name {
                    flex: 1;
                    font-weight: 500;
                    font-size: 12px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .sched-actor-badge {
                    font-size: 9px;
                    padding: 2px 6px;
                    border-radius: 10px;
                    background: var(--status-success);
                    color: white;
                }
                
                .sched-main {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }
                .sched-header {
                    padding: 16px;
                    background: var(--bg-elevated);
                    border-bottom: 1px solid var(--border-subtle);
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }
                .sched-header-avatar {
                    width: 48px;
                    height: 48px;
                    border-radius: 50%;
                    overflow: hidden;
                    background: var(--bg-base);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 24px;
                }
                .sched-header-avatar img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                .sched-header-info h2 {
                    margin: 0 0 4px 0;
                    font-size: 18px;
                }
                .sched-header-info p {
                    margin: 0;
                    font-size: 12px;
                    color: var(--text-muted);
                }
                
                .sched-grid {
                    flex: 1;
                    overflow-y: auto;
                    padding: 16px;
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                    gap: 16px;
                    align-content: start;
                }
                .sched-slot-card {
                    background: var(--bg-surface);
                    border: 1px solid var(--border-subtle);
                    border-radius: 8px;
                    overflow: hidden;
                }
                .sched-slot-header {
                    background: var(--bg-elevated);
                    padding: 10px 12px;
                    font-weight: bold;
                    font-size: 12px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    border-bottom: 1px solid var(--border-subtle);
                }
                .sched-slot-icon {
                    font-size: 16px;
                }
                .sched-slot-body {
                    padding: 12px;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }
                .sched-field {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }
                .sched-field label {
                    font-size: 10px;
                    text-transform: uppercase;
                    color: var(--text-muted);
                    font-weight: bold;
                }
                .sched-field select, .sched-field input {
                    font-size: 12px;
                }
                .sched-available {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 11px;
                }
                
                .sched-empty {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    color: var(--text-muted);
                    text-align: center;
                    padding: 32px;
                }
                .sched-empty-icon {
                    font-size: 64px;
                    margin-bottom: 16px;
                    opacity: 0.5;
                }
            </style>
            
            <!-- Sidebar: Actor List -->
            <div class="sched-sidebar">
                <div class="sched-sidebar-header">
                    <span>Actors</span>
                </div>
                <div class="sched-actor-list" id="actor-list"></div>
            </div>
            
            <!-- Main: Schedule Editor -->
            <div class="sched-main" id="sched-main"></div>
        `;

        const actorList = container.querySelector('#actor-list');
        const schedMain = container.querySelector('#sched-main');

        function refreshActorList() {
            const state = A.State.get();
            const actors = A.Chronos ? A.Chronos.getActors(state) : {};
            const chronos = state.chronos || {};
            const entries = Object.entries(actors);

            if (entries.length === 0) {
                actorList.innerHTML = `
                    <div style="padding:16px; color:var(--text-muted); font-size:11px; text-align:center;">
                        No actors defined.<br>Create actors in the Actors panel first.
                    </div>
                `;
                return;
            }

            actorList.innerHTML = entries.map(([id, actor]) => {
                const hasSchedule = chronos.schedules && chronos.schedules[id];
                const imgParams = (actor.gallery?.primary && actor.gallery?.images)
                    ? actor.gallery.images.find(i => i.id === actor.gallery.primary)
                    : null;
                const imgHtml = imgParams ? `<img src="${imgParams.data}">` : '👤';

                return `
                    <div class="sched-actor-item ${selectedActorId === id ? 'active' : ''}" data-id="${id}">
                        <div class="sched-actor-avatar">${imgHtml}</div>
                        <span class="sched-actor-name">${actor.name || id}</span>
                        ${hasSchedule ? '<span class="sched-actor-badge">Scheduled</span>' : ''}
                    </div>
                `;
            }).join('');

            actorList.querySelectorAll('.sched-actor-item').forEach(item => {
                item.onclick = () => {
                    selectedActorId = item.dataset.id;
                    refreshActorList();
                    refreshMain();
                };
            });
        }

        function refreshMain() {
            const state = A.State.get();

            if (!selectedActorId) {
                schedMain.innerHTML = `
                    <div class="sched-empty">
                        <div class="sched-empty-icon">📅</div>
                        <div style="font-size:16px; font-weight:bold; margin-bottom:8px;">Actor Scheduler</div>
                        <div style="font-size:12px; opacity:0.7; max-width:300px;">
                            Select an actor from the sidebar to define their daily schedule.
                            Schedules determine where actors are at different times of day.
                        </div>
                    </div>
                `;
                return;
            }

            const actors = A.Chronos ? A.Chronos.getActors(state) : {};
            const actor = actors[selectedActorId];
            if (!actor) {
                schedMain.innerHTML = '<div class="sched-empty">Actor not found</div>';
                return;
            }

            const chronos = state.chronos || {};
            const schedule = chronos.schedules?.[selectedActorId] || {};
            const timeSlots = chronos.timeSlots || (A.Chronos ? A.Chronos.DEFAULT_TIME_SLOTS : {});
            const locations = A.Chronos ? A.Chronos.getLocations(state) : {};
            const locOptions = Object.entries(locations)
                .map(([id, loc]) => `<option value="${id}">${loc.name || id}</option>`)
                .join('');

            const imgParams = (actor.gallery?.primary && actor.gallery?.images)
                ? actor.gallery.images.find(i => i.id === actor.gallery.primary)
                : null;
            const imgHtml = imgParams ? `<img src="${imgParams.data}">` : '👤';

            let html = `
                <div class="sched-header">
                    <div class="sched-header-avatar">${imgHtml}</div>
                    <div class="sched-header-info">
                        <h2>${actor.name || selectedActorId}</h2>
                        <p>Define where this actor is at each time of day</p>
                    </div>
                    <div style="flex:1;"></div>
                    <button class="btn btn-ghost" id="btn-clear-schedule" style="color:var(--status-error);">Clear All</button>
                </div>
                <div class="sched-grid">
            `;

            Object.entries(timeSlots)
                .sort((a, b) => (a[1].order || 0) - (b[1].order || 0))
                .forEach(([slotKey, slot]) => {
                    const slotData = schedule[slotKey] || {};
                    html += `
                        <div class="sched-slot-card" data-slot="${slotKey}">
                            <div class="sched-slot-header">
                                <span class="sched-slot-icon">${slot.icon || '⏰'}</span>
                                <span>${slot.label}</span>
                                <span style="flex:1;"></span>
                                <span style="font-size:10px; color:var(--text-muted); font-weight:normal;">${slot.hours || ''}</span>
                            </div>
                            <div class="sched-slot-body">
                                <div class="sched-field">
                                    <label>Location</label>
                                    <select class="input slot-location" data-slot="${slotKey}">
                                        <option value="">-- Not Set --</option>
                                        ${locOptions.replace(`value="${slotData.location}"`, `value="${slotData.location}" selected`)}
                                    </select>
                                </div>
                                <div class="sched-field">
                                    <label>Activity</label>
                                    <input type="text" class="input slot-activity" data-slot="${slotKey}" 
                                           value="${slotData.activity || ''}" placeholder="e.g., cooking dinner">
                                </div>
                                <div class="sched-available">
                                    <input type="checkbox" id="avail-${slotKey}" class="slot-available" data-slot="${slotKey}"
                                           ${slotData.available !== false ? 'checked' : ''}>
                                    <label for="avail-${slotKey}">Available for interaction</label>
                                </div>
                            </div>
                        </div>
                    `;
                });

            html += '</div>';
            schedMain.innerHTML = html;

            // Bind inputs
            const saveSlot = (slotKey) => {
                const card = schedMain.querySelector(`.sched-slot-card[data-slot="${slotKey}"]`);
                if (!card) return;

                const location = card.querySelector('.slot-location').value;
                const activity = card.querySelector('.slot-activity').value;
                const available = card.querySelector('.slot-available').checked;

                if (!location) {
                    // Remove slot if no location
                    if (chronos.schedules?.[selectedActorId]) {
                        delete chronos.schedules[selectedActorId][slotKey];
                    }
                } else {
                    A.Chronos.setActorSlot(state, selectedActorId, slotKey, {
                        location,
                        activity: activity || 'present',
                        available
                    });
                }

                A.State.notify();
                refreshActorList(); // Update badge
            };

            schedMain.querySelectorAll('.slot-location, .slot-activity, .slot-available').forEach(input => {
                input.onchange = () => saveSlot(input.dataset.slot);
            });

            schedMain.querySelector('#btn-clear-schedule').onclick = () => {
                if (confirm(`Clear all schedule data for ${actor.name}?`)) {
                    A.Chronos.removeActorSchedule(state, selectedActorId);
                    A.State.notify();
                    refreshActorList();
                    refreshMain();
                }
            };
        }

        refreshActorList();
        refreshMain();

        // Subscribe
        A.State.subscribe(() => {
            if (container.isConnected) {
                refreshActorList();
            }
        });
    }

    A.registerPanel('chronos_scheduler', {
        label: 'Scheduler',
        subtitle: 'Actor Routines',
        category: 'Immersion',
        order: 2,
        icon: '📅',
        render: render
    });

    console.log('[Chronos] Scheduler panel registered');

})(window.Anansi);
