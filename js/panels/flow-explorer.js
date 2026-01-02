/*
 * Anansi Panel: Flow Explorer
 * File: js/panels/flow-explorer.js
 * Category: Magic
 * Purpose: Visual display of rule execution log from Simulator
 */

(function (A) {
    'use strict';

    let selectedTurn = null;

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
                    padding: 12px; 
                    border-bottom: 1px solid var(--border-subtle);
                    transition: background 0.15s;
                }
                .flow-entry:hover { background: var(--bg-elevated); }
                .flow-pass { border-left: 3px solid var(--status-success); }
                .flow-fail { border-left: 3px solid var(--status-error); }
                .flow-icon { font-size: 14px; margin-right: 8px; }
                .flow-name { font-weight: bold; font-size: 13px; }
                .flow-type { 
                    font-size: 10px; 
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
                    margin-top: 4px;
                    padding-left: 22px;
                }
            </style>

            <div class="card-header" style="flex-shrink:0;">
                <div style="display:flex; align-items:center; gap:12px; flex:1;">
                    <strong>Flow Explorer</strong>
                    <select class="input" id="turn-selector" style="width:auto; flex:1; max-width:300px;">
                        ${turnOptions}
                    </select>
                </div>
                <div style="display:flex; gap:8px;">
                    <button class="btn btn-ghost btn-sm" id="btn-clear">Clear Log</button>
                    <button class="btn btn-secondary btn-sm" id="btn-simulator">← Simulator</button>
                </div>
            </div>

            <div class="card-body" style="flex:1; overflow-y:auto; padding:0;">
                <div style="padding:12px; background:var(--bg-base); border-bottom:1px solid var(--border-subtle);">
                    <div style="font-size:12px; color:var(--text-muted);">Message:</div>
                    <div style="font-size:13px; font-style:italic;">"${currentLog.message || '(empty)'}"</div>
                </div>
                
                <div id="flow-entries">
                    ${renderEntries(currentLog.entries)}
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

    function renderEntries(entries) {
        if (!entries || entries.length === 0) {
            return '<div style="padding:20px; text-align:center; color:var(--text-muted);">No rules evaluated this turn.</div>';
        }

        return entries.map(entry => {
            const icon = entry.passed ? '✓' : '✗';
            const iconColor = entry.passed ? 'var(--status-success)' : 'var(--status-error)';
            const entryClass = entry.passed ? 'flow-pass' : 'flow-fail';

            return `
                <div class="flow-entry ${entryClass}">
                    <div style="display:flex; align-items:center;">
                        <span class="flow-icon" style="color:${iconColor};">${icon}</span>
                        <span class="flow-name">${entry.name}</span>
                        <span class="flow-type">${entry.type}</span>
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
