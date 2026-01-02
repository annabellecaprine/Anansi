/*
 * Anansi Panel: Flow Explorer
 * File: js/panels/flow-explorer.js
 * Category: Magic
 * Purpose: Visual display of rule execution log from Simulator
 */

(function (A) {
    'use strict';

    let selectedTurn = null;
    let viewMode = 'grouped'; // 'list' | 'grouped'

    function render(container) {
        const state = A.State.get();
        const log = state?.sim?.executionLog || [];

        container.style.height = '100%';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.overflow = 'hidden';

        // If no logs, show empty state
        if (log.length === 0) {
            container.innerHTML = `
                <div class="empty-state-card" style="margin:auto; max-width:400px;">
                    <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                    <div class="empty-title">No Execution Log</div>
                    <div class="empty-description">
                        Run a simulation in Spindle to capture rule execution data.
                        The Flow Explorer will show which rules passed or failed and why.
                    </div>
                    <button class="btn btn-primary" style="margin-top:16px;" onclick="Anansi.UI.switchPanel('simulator')">
                        Go to Simulator →
                    </button>
                </div>
            `;
            return;
        }

        // Default to latest turn
        if (selectedTurn === null || selectedTurn >= log.length) {
            selectedTurn = log.length - 1;
        }

        const currentLog = log[selectedTurn];

        // Build turn options
        const turnOptions = log.map((l, i) => {
            const preview = (l.message || '').substring(0, 30) + (l.message?.length > 30 ? '...' : '');
            return `<option value="${i}" ${i === selectedTurn ? 'selected' : ''}>Turn ${l.turn}: ${preview}</option>`;
        }).join('');

        container.innerHTML = `
            <style>
                .flow-entry { 
                    padding: 8px 12px; 
                    border-bottom: 1px solid var(--border-subtle);
                    transition: background 0.15s;
                    font-size: 12px;
                }
                .flow-entry:hover { background: var(--bg-elevated); }
                .flow-pass { border-left: 3px solid var(--status-success); }
                .flow-fail { border-left: 3px solid var(--status-error); }
                .flow-icon { font-size: 14px; margin-right: 8px; }
                .flow-name { font-weight: bold; font-size: 12px; }
                .flow-type { 
                    font-size: 9px; 
                    text-transform: uppercase; 
                    padding: 2px 6px; 
                    border-radius: 4px; 
                    background: var(--bg-base); 
                    color: var(--text-muted);
                    margin-left: 8px;
                }
                .flow-reason { 
                    font-size: 11px; 
                    color: var(--text-muted); 
                    margin-top: 2px;
                    padding-left: 22px;
                }
                .flow-group-summary {
                    padding: 8px 12px;
                    background: var(--bg-base);
                    border-bottom: 1px solid var(--border-subtle);
                    font-weight: bold;
                    font-size: 11px;
                    cursor: pointer;
                    user-select: none;
                    display: flex;
                    align-items: center;
                    color: var(--text-secondary);
                }
                .flow-group-summary:hover { background: var(--bg-elevated); }
            </style>

            <div class="card-header" style="flex-shrink:0;">
                <div style="display:flex; flex-direction:column; gap:8px; width:100%;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <strong>Flow Explorer</strong>
                        <div style="display:flex; gap:8px;">
                            <button class="btn btn-ghost btn-sm" id="btn-clear">Clear Log</button>
                            <button class="btn btn-secondary btn-sm" id="btn-simulator">← Simulator</button>
                        </div>
                    </div>
                    
                    <div style="display:flex; gap:8px; align-items:center;">
                        <select class="input" id="turn-selector" style="flex:1;">${turnOptions}</select>
                        
            <div class="btn-group" style="display:flex;">
                            <button class="btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-ghost'}" id="view-list">List</button>
                            <button class="btn btn-sm ${viewMode === 'grouped' ? 'btn-primary' : 'btn-ghost'}" id="view-grouped">Type</button>
                            <button class="btn btn-sm ${viewMode === 'actor' ? 'btn-primary' : 'btn-ghost'}" id="view-actor">Actor</button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card-body" style="flex:1; overflow-y:auto; padding:0;">
                <div style="padding:12px; background:var(--bg-base); border-bottom:1px solid var(--border-subtle);">
                    <div style="font-size:12px; color:var(--text-muted);">Message:</div>
                    <div style="font-size:13px; font-style:italic;">"${currentLog.message || '(empty)'}"</div>
                </div>
                
                <div id="flow-entries">
                    ${renderContent(viewMode, currentLog.entries)}
                </div>
            </div>

            <div class="card-footer" style="flex-shrink:0; display:flex; justify-content:space-between; align-items:center;">
                <div style="font-size:11px; color:var(--text-muted);">
                    ${currentLog.entries.filter(e => e.passed).length} passed, 
                    ${currentLog.entries.filter(e => !e.passed).length} failed
                </div>
                <div style="font-size:10px; color:var(--text-muted);">
                    ${new Date(currentLog.timestamp).toLocaleTimeString()}
                </div>
            </div>
        `;

        // Event bindings
        container.querySelector('#turn-selector').onchange = (e) => {
            selectedTurn = parseInt(e.target.value);
            render(container);
        };

        container.querySelector('#view-list').onclick = () => { viewMode = 'list'; render(container); };
        container.querySelector('#view-grouped').onclick = () => { viewMode = 'grouped'; render(container); };
        container.querySelector('#view-actor').onclick = () => { viewMode = 'actor'; render(container); };

        container.querySelector('#btn-clear').onclick = () => {
            if (confirm('Clear all execution logs?')) {
                A.FlowLogger.clearLog();
                selectedTurn = null;
                render(container);
                if (A.UI.Toast) A.UI.Toast.show('Log cleared', 'info');
            }
        };

        container.querySelector('#btn-simulator').onclick = () => {
            A.UI.switchPanel('simulator');
        };
    }

    function renderContent(mode, entries) {
        if (mode === 'grouped') return renderGroupedEntries(entries);
        if (mode === 'actor') return renderActorGroupedEntries(entries);
        return renderEntries(entries);
    }

    function getActorsForEntry(item) {
        const type = (item.type || '').toLowerCase();
        let names = [];

        if (type === 'microcue') {
            // "ActorName [TYPE]"
            names.push(item.name.split('[')[0].trim());
        } else if (type === 'voice') {
            // "Voice N: ActorName"
            const parts = item.name.split(':');
            if (parts.length > 1) names.push(parts.slice(1).join(':').trim());
            else names.push(item.name.trim());
        } else if (type === 'actor-cue') {
            // "ActorName - TYPE"
            names.push(item.name.split('-')[0].trim());
        } else if (item.metadata?.associatedActors) {
            // Metadata association (Lorebook)
            const actors = A.State.get().nodes?.actors?.items || {};
            item.metadata.associatedActors.forEach(id => {
                if (actors[id]) names.push(actors[id].name);
            });
        }

        // Deduplicate
        return [...new Set(names)];
    }

    function renderActorGroupedEntries(entries) {
        if (!entries || entries.length === 0) return renderEntries(entries);

        const byActor = {};
        const globalItems = [];
        const unassociatedItems = [];

        entries.forEach(e => {
            const actors = getActorsForEntry(e);
            if (actors.length > 0) {
                actors.forEach(name => {
                    if (!byActor[name]) byActor[name] = [];
                    byActor[name].push(e);
                });
            } else {
                const type = (e.type || '').toLowerCase();
                // Strict Global: Only System Scripts are Global. Everything else without an actor is Unassociated.
                if (type === 'script') {
                    globalItems.push(e);
                } else {
                    unassociatedItems.push(e);
                }
            }
        });

        const actorHtml = Object.keys(byActor).sort().map(actorName => {
            const items = byActor[actorName];
            const passedCount = items.filter(i => i.passed).length;
            const statusColor = passedCount > 0 ? 'var(--status-success)' : 'var(--text-muted)';

            // Sub-group items by type (Voices, Microcues, etc.)
            const byType = {};
            items.forEach(e => {
                const t = (e.type || 'other').toLowerCase();
                if (!byType[t]) byType[t] = [];
                byType[t].push(e);
            });

            const typeLabels = {
                'lorebook': '📖 Lorebook',
                'microcue': '🎭 Microcues',
                'voice': '🗣️ Voices',
                'actor-cue': '👤 Actor Cues',
                'event': '⚡ Events',
                'scoring': '🎲 Scoring',
                'advanced': '⚙️ Custom Rules',
                'pair': '👥 Pairs',
                'other': '📦 Other'
            };

            let subHtml = Object.keys(byType).sort().map(type => {
                const subItems = byType[type];
                return `<details open style="margin-top:4px; margin-left:8px; border-left:2px solid var(--border-subtle);">
                    <summary style="font-size:11px; padding:4px 8px; color:var(--text-secondary); cursor:pointer; list-style:none; opacity:0.9;">
                        ${typeLabels[type] || typeLabels['other']} (${subItems.length})
                    </summary>
                    <div style="padding-left:8px;">
                        ${renderEntries(subItems)}
                    </div>
                </details>`;
            }).join('');

            return `<details open style="margin-bottom:8px; border:1px solid var(--border-subtle); border-radius:4px; background:var(--bg-group);">
                <summary class="flow-group-summary" style="padding:8px 12px; font-weight:bold; cursor:pointer; list-style:none; display:flex; align-items:center;">
                    <span style="color:${statusColor}; margin-right:6px;">${passedCount > 0 ? '●' : '○'}</span>
                    ${actorName} <span style="opacity:0.6; margin-left:4px;">(${items.length})</span>
                </summary>
                <div style="padding:4px 0 8px 12px;">
                    ${subHtml}
                </div>
            </details>`;
        }).join('');

        let otherHtml = '';

        // Render Global items
        if (globalItems.length > 0) {
            otherHtml += `<details open style="border-bottom:1px solid var(--border-subtle); margin-top:12px;">
                <summary class="flow-group-summary" style="padding:8px; font-weight:normal; color:var(--text-secondary); cursor:pointer;">
                    <span style="margin-right:6px;">🌐</span> Global <span style="opacity:0.6; margin-left:4px;">(${globalItems.length})</span>
                </summary>
                <div style="padding-left:16px;">
                    ${renderEntries(globalItems)}
                </div>
            </details>`;
        }

        // Render Unassociated items
        if (unassociatedItems.length > 0) {
            otherHtml += `<details open style="border-bottom:1px solid var(--border-subtle); margin-top:8px;">
                <summary class="flow-group-summary" style="padding:8px; font-weight:normal; color:var(--status-warning); cursor:pointer;">
                    <span style="margin-right:6px;">⚠️</span> Unassociated <span style="opacity:0.6; margin-left:4px;">(${unassociatedItems.length})</span>
                </summary>
                <div style="padding-left:16px;">
                    ${renderEntries(unassociatedItems)}
                </div>
            </details>`;
        }

        return actorHtml + otherHtml;
    }

    function renderGroupedEntries(entries) {
        if (!entries || entries.length === 0) return renderEntries(entries);

        // Group by Type
        const byType = {
            'lorebook': [],
            'microcue': [],
            'voice': [],
            'actor-cue': [],
            'event': [],
            'scoring': [],
            'advanced': [],
            'pair': [], // Ensure pair bucket exists
            'other': []
        };

        entries.forEach(e => {
            let t = (e.type || 'other').toLowerCase();

            // Correction: Move 'Rivals' to 'pair'
            if (e.name && e.name.toLowerCase().includes('rivals')) {
                t = 'pair';
            }

            if (byType[t]) byType[t].push(e);
            else byType['other'].push(e);
        });

        // Terminology Update: Others -> Global
        const typeLabels = {
            'lorebook': '📖 Lorebook',
            'microcue': '🎭 Microcues',
            'voice': '🗣️ Voices',
            'actor-cue': '👤 Actor Cues',
            'event': '⚡ Events',
            'scoring': '🎲 Scoring',
            'advanced': '⚙️ Custom Rules',
            'pair': '👥 Pairs',
            'other': '🌐 Global' // Was '📦 Other'
        };

        let html = '';

        Object.keys(byType).forEach(type => {
            const items = byType[type];
            if (items.length === 0) return;

            // For actor-centric types, we group by Actor. Now extending to ALL types that support association.
            if (['microcue', 'voice', 'actor-cue', 'lorebook', 'pair', 'event', 'scoring', 'advanced'].includes(type)) {

                // Group by Actor Name using helper
                const byActor = {};
                const globalItems = [];       // True Global items (Lorebook, Scoring, Events without actors)
                const unassociatedItems = []; // Items that SHOULD have actors but don't (Microcues, Voices, Pairs)

                items.forEach(item => {
                    const actors = getActorsForEntry(item);
                    if (actors.length > 0) {
                        actors.forEach(name => {
                            if (!byActor[name]) byActor[name] = [];
                            byActor[name].push(item);
                        });
                    } else {
                        // Split logic
                        if (['microcue', 'voice', 'actor-cue', 'pair'].includes(type)) {
                            unassociatedItems.push(item);
                        } else {
                            // Terminology: User wants these called "Unassociated" too if they are sub-items under a type?
                            // "You call Unassociated sub items Global. This is misleading. Call them Unassociated."
                            // Previously: globalItems.
                            // I will merge them into unassociatedItems logic or rename the label.
                            // Let's treat them all as unassociated if they are inside a Type grouping but have no actor.
                            unassociatedItems.push(item);
                        }
                    }
                });

                // Render Type Header (Expanded)
                html += `<details open style="margin-bottom:1px;">
                    <summary class="flow-group-summary" style="color:var(--text-primary);">
                        ${typeLabels[type]} (${items.length})
                    </summary>
                    <div style="background:var(--bg-base);">`;

                // Render Actor Groups
                Object.keys(byActor).sort().forEach(actorName => {
                    const actorItems = byActor[actorName];
                    const passedCount = actorItems.filter(i => i.passed).length;
                    const statusColor = passedCount > 0 ? 'var(--status-success)' : 'var(--text-muted)';

                    html += `<details style="border-bottom:1px solid var(--border-subtle);">
                        <summary class="flow-group-summary" style="padding-left:24px; font-weight:normal;">
                            <span style="color:${statusColor}; margin-right:6px;">${passedCount > 0 ? '●' : '○'}</span>
                            ${actorName} <span style="opacity:0.6; margin-left:4px;">(${actorItems.length})</span>
                        </summary>
                        <div style="padding-left:16px;">
                            ${renderEntries(actorItems)}
                        </div>
                    </details>`;
                });

                // Render Unassociated Items (Merged Global + Unassociated)
                // Label as "Unassociated" per user request
                if (unassociatedItems.length > 0) {
                    html += `<details style="border-bottom:1px solid var(--border-subtle);">
                        <summary class="flow-group-summary" style="padding-left:24px; font-weight:normal; color:var(--text-secondary);">
                            <span style="margin-right:6px;">⚠️</span> Unassociated <span style="opacity:0.6; margin-left:4px;">(${unassociatedItems.length})</span>
                        </summary>
                        <div style="padding-left:16px;">
                            ${renderEntries(unassociatedItems)}
                        </div>
                    </details>`;
                }

                html += `</div></details>`;

            } else {
                // Standard Rendering for other types (Global/Other)
                html += `<details open style="margin-bottom:1px;">
                    <summary class="flow-group-summary" style="color:var(--text-primary);">
                        ${typeLabels[type]} (${items.length})
                    </summary>
                    <div>
                        ${renderEntries(items)}
                    </div>
                </details>`;
            }
        });

        return html;
    }

    // Expose helper for click handlers
    A.FlowExplorer = A.FlowExplorer || {};
    A.FlowExplorer.showContent = function (encodedContent, name, encodedTarget) {
        if (!encodedContent) return;
        try {
            const content = decodeURIComponent(encodedContent);
            const target = encodedTarget ? decodeURIComponent(encodedTarget) : '';
            const contentDiv = document.createElement('div');

            // Header for Target
            if (target && target !== 'undefined' && target !== 'Unknown Target') {
                const header = document.createElement('div');
                header.style.cssText = 'font-size:10px; color:var(--text-muted); margin-bottom:8px; border-bottom:1px solid var(--border-subtle); padding-bottom:8px;';
                header.innerHTML = `INSERT INTO: <strong style="color:var(--text-primary); font-family:monospace;">${target}</strong>`;
                contentDiv.appendChild(header);
            }

            // Format content Body
            const bodyDiv = document.createElement('div');
            if (content.trim().startsWith('{') || content.trim().startsWith('[')) {
                try {
                    const obj = JSON.parse(content);
                    bodyDiv.innerHTML = `<pre style="font-size:11px; white-space:pre-wrap; color:var(--text-primary); margin:0;">${JSON.stringify(obj, null, 2).replace(/</g, '&lt;')}</pre>`;
                } catch (e) {
                    bodyDiv.innerHTML = `<div style="font-size:12px; white-space:pre-wrap; font-family:monospace; color:var(--text-primary);">${content.replace(/</g, '&lt;')}</div>`;
                }
            } else {
                bodyDiv.innerHTML = `<div style="font-size:12px; white-space:pre-wrap; font-family:monospace; color:var(--text-primary);">${content.replace(/</g, '&lt;')}</div>`;
            }
            contentDiv.appendChild(bodyDiv);

            // Use the centralized UI Modal
            if (A.UI && A.UI.Modal) {
                A.UI.Modal.show({
                    title: name,
                    content: contentDiv,
                    width: 600,
                    actions: [
                        { label: 'Close', onclick: () => true }
                    ]
                });
            } else {
                // Fallback if UI.Modal missing (unlikely)
                console.error('Anansi UI Modal system not found.');
            }
        } catch (e) { console.error(e); }
    };

    function renderEntries(entries) {
        if (!entries || entries.length === 0) {
            return '<div style="padding:20px; text-align:center; color:var(--text-muted);">No rules evaluated this turn.</div>';
        }

        return entries.map(entry => {
            const icon = entry.passed ? '✓' : '✗';
            const iconColor = entry.passed ? 'var(--status-success)' : 'var(--status-error)';
            const entryClass = entry.passed ? 'flow-pass' : 'flow-fail';

            let clickAttr = '';
            let cursorStyle = '';
            let hint = '';

            // If passed and has content, make clickable
            if (entry.passed && entry.metadata && entry.metadata.content) {
                const safeContent = encodeURIComponent(entry.metadata.content);
                const safeTarget = encodeURIComponent(entry.metadata.target || '');
                const safeName = (entry.name || 'Rule').replace(/'/g, "\\'");
                clickAttr = `onclick="Anansi.FlowExplorer.showContent('${safeContent}', '${safeName}', '${safeTarget}')"`;
                cursorStyle = 'cursor:pointer;';
                hint = 'title="Click to view content"';
            }

            return `
                <div class="flow-entry ${entryClass}" ${clickAttr} ${hint} style="${cursorStyle}">
                    <div style="display:flex; align-items:center;">
                        <span class="flow-icon" style="color:${iconColor};">${icon}</span>
                        <span class="flow-name">${entry.name}</span>
                        ${(entry.passed && entry.metadata?.content) ? '<span style="margin-left:auto;font-size:10px;opacity:0.5;">👁️</span>' : ''}
                    </div>
                    <div class="flow-reason">${entry.reason || 'No reason provided'}</div>
                </div>
            `;
        }).join('');
    }

    A.registerPanel('flow-explorer', {
        label: 'Flow Explorer',
        subtitle: 'Execution Log',
        category: 'Magic',
        render: render
    });

})(window.Anansi);
