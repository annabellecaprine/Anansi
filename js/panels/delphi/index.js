/*
 * Anansi Panel: Temple of Delphi
 * File: js/panels/delphi/index.js
 * Category: Sacred Tools
 * Purpose: Persona diagnostic module - analyzes how LLMs interpret character definitions.
 */

(function (A) {
    'use strict';

    function render(container) {
        const state = A.State.get();

        container.innerHTML = '';
        container.className = 'delphi-layout flex-col gap-md h-full overflow-hidden';

        // === HEADER BAR ===
        const header = document.createElement('div');
        header.className = 'card p-md';
        header.innerHTML = `
            <div class="flex-row items-center justify-between gap-md flex-wrap">
                <div class="flex-row items-center gap-sm">
                    <span style="font-size:24px;">🏛️</span>
                    <div>
                        <strong style="font-size:16px;">Temple of Delphi</strong>
                        <div class="text-muted text-xs">Know Thyself — Persona Diagnostic Engine</div>
                    </div>
                </div>
                <div class="flex-row gap-sm items-center flex-wrap">
                    <button class="btn btn-ghost btn-sm" id="delphi-btn-spindle" title="Open in Spindle">🧶 Spindle</button>
                    <button class="btn btn-ghost btn-sm" id="delphi-btn-actor" title="Open Actor Editor">👥 Actors</button>
                </div>
            </div>
        `;
        container.appendChild(header);

        // === CONFIG BAR ===
        const configBar = document.createElement('div');
        configBar.className = 'card p-md';

        // Check for character data
        const hasCharacter = !!(state.character?.compiled?.personality || state.character?.compiled?.scenario || state.seed?.persona || state.seed?.scenario);

        configBar.innerHTML = `
            <div class="flex-row gap-md items-end flex-wrap">
                <div class="flex-col gap-xs flex-1" style="min-width:120px;">
                    <label class="label text-tiny">MODE</label>
                    <select class="input text-sm" id="delphi-mode">
                        <option value="standalone" selected>🔍 Standalone</option>
                        <option value="midchat">💬 Mid-Chat</option>
                    </select>
                </div>
                <div class="flex-col gap-xs" style="min-width:180px;">
                    <label class="label text-tiny">DEPTH</label>
                    <div class="delphi-depth-selector flex-row gap-xs" id="delphi-depth">
                        <button class="delphi-depth-btn" data-depth="surface">☀️ Surface</button>
                        <button class="delphi-depth-btn active" data-depth="casual">🔮 Casual</button>
                        <button class="delphi-depth-btn" data-depth="deep">🌊 Deep</button>
                    </div>
                </div>
                <div class="flex-row gap-sm">
                    <button class="btn btn-primary" id="delphi-evaluate" ${!hasCharacter ? 'disabled title="Load a project with character data first"' : ''}>
                        🏛️ Evaluate
                    </button>
                    <button class="btn btn-ghost" id="delphi-multi" ${!hasCharacter ? 'disabled' : ''} title="Test against all configured LLMs">
                        🔀 Multi-Model
                    </button>
                </div>
            </div>
            ${!hasCharacter ? '<div class="text-warning text-xs mt-sm">⚠️ No character data found. Load a project with a Character or Seed defined.</div>' : ''}
        `;
        container.appendChild(configBar);

        // === MAIN CONTENT (Report + History) ===
        const mainContent = document.createElement('div');
        mainContent.className = 'flex-row gap-md flex-1 min-h-0';

        // Report Area
        const reportArea = document.createElement('div');
        reportArea.className = 'card flex-1 flex-col min-h-0 overflow-hidden';
        reportArea.innerHTML = `
            <div class="card-header flex-row items-center justify-between">
                <strong>Diagnostic Report</strong>
                <span class="text-muted text-xs" id="delphi-report-meta"></span>
            </div>
            <div class="card-body flex-1 scroll-y p-lg" id="delphi-report">
                <div class="delphi-empty-state">
                    <div style="font-size:48px; margin-bottom:12px;">🏛️</div>
                    <div class="text-muted" style="font-size:14px; max-width:400px; margin:0 auto; line-height:1.6;">
                        <strong>Welcome to the Temple of Delphi</strong><br><br>
                        The Oracle will analyze your character definition and reveal how the LLM interprets your persona — 
                        exposing trait dominance, trigger phrases, and hidden contradictions.<br><br>
                        <span class="text-xs">Select a depth tier and click <strong>Evaluate</strong> to begin.</span>
                    </div>
                </div>
            </div>
        `;
        mainContent.appendChild(reportArea);

        // History Sidebar
        const historySidebar = document.createElement('div');
        historySidebar.className = 'card flex-col overflow-hidden';
        historySidebar.style.cssText = 'width:220px; flex-shrink:0;';
        historySidebar.innerHTML = `
            <div class="card-header flex-row items-center justify-between">
                <strong class="text-xs">History</strong>
                <button class="btn btn-ghost btn-sm text-xs text-error" id="delphi-clear-history" title="Clear all history">Clear</button>
            </div>
            <div class="card-body scroll-y p-sm flex-1" id="delphi-history-list" style="font-size:11px;"></div>
        `;
        mainContent.appendChild(historySidebar);

        container.appendChild(mainContent);

        // === STATE ===
        let currentDepth = 'casual';
        let currentMode = 'standalone';
        let currentResult = null;
        let multiResults = null;

        // Check if arriving from Spindle mid-chat
        if (state.sim?.delphiContext?.mode === 'midchat') {
            currentMode = 'midchat';
            const modeSelect = configBar.querySelector('#delphi-mode');
            if (modeSelect) modeSelect.value = 'midchat';
            // Clear the flag
            delete state.sim.delphiContext;
        }

        // === DEPTH SELECTOR ===
        const depthBtns = configBar.querySelectorAll('.delphi-depth-btn');
        depthBtns.forEach(btn => {
            btn.onclick = () => {
                depthBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentDepth = btn.dataset.depth;
            };
        });

        // === MODE SELECTOR ===
        const modeSelect = configBar.querySelector('#delphi-mode');
        modeSelect.onchange = () => {
            currentMode = modeSelect.value;
        };

        // === NAVIGATION ===
        header.querySelector('#delphi-btn-spindle').onclick = () => {
            if (A.UI?.switchPanel) A.UI.switchPanel('simulator');
        };
        header.querySelector('#delphi-btn-actor').onclick = () => {
            if (A.UI?.switchPanel) A.UI.switchPanel('actors');
        };

        // === HISTORY ===
        function refreshHistory() {
            const historyList = container.querySelector('#delphi-history-list');
            if (!historyList) return;

            const history = A.Delphi?.getHistory() || [];

            if (history.length === 0) {
                historyList.innerHTML = '<div class="text-muted text-center p-md">No evaluations yet</div>';
                return;
            }

            historyList.innerHTML = history.map((entry, idx) => {
                const date = new Date(entry.timestamp);
                const timeStr = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' ' +
                    date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
                const depthIcon = { surface: '☀️', casual: '🔮', deep: '🌊' }[entry.depth] || '🔮';
                const modeIcon = entry.mode === 'midchat' ? '💬' : '🔍';

                return `
                    <div class="delphi-history-item" data-index="${idx}">
                        <div class="flex-row items-center gap-xs">
                            <span>${depthIcon}${modeIcon}</span>
                            <span class="text-truncate" style="flex:1;">${entry.personaData?.characterName || 'Unknown'}</span>
                        </div>
                        <div class="text-muted" style="font-size:9px;">${timeStr} • ${entry.provider || '?'}/${(entry.model || '?').split('/').pop()}</div>
                    </div>
                `;
            }).join('');

            historyList.querySelectorAll('.delphi-history-item').forEach(item => {
                item.onclick = () => {
                    const idx = parseInt(item.dataset.index);
                    const entry = history[idx];
                    if (entry) {
                        currentResult = entry;
                        multiResults = null;
                        renderReport(entry);
                    }
                };
            });
        }

        container.querySelector('#delphi-clear-history').onclick = () => {
            if (confirm('Clear all evaluation history?')) {
                A.Delphi?.clearHistory();
                refreshHistory();
                if (A.UI?.Toast) A.UI.Toast.show('History cleared', 'info');
            }
        };

        // === REPORT RENDERING ===
        function renderReport(result) {
            const reportDiv = container.querySelector('#delphi-report');
            const metaSpan = container.querySelector('#delphi-report-meta');
            if (!reportDiv) return;

            const depthLabel = { surface: 'Surface', casual: 'Casual', deep: 'Deep' }[result.depth] || result.depth;
            const modeLabel = result.mode === 'midchat' ? 'Mid-Chat' : 'Standalone';

            if (metaSpan) {
                metaSpan.textContent = `${depthLabel} • ${modeLabel} • ${result.provider}/${(result.model || '').split('/').pop()}`;
            }

            // Parse and render the markdown report
            const formatted = formatReport(result.report);
            reportDiv.innerHTML = `
                <div class="delphi-report-content">
                    <div class="flex-row items-center gap-sm mb-md">
                        <span style="font-size:20px;">📜</span>
                        <div>
                            <strong>${result.personaData?.characterName || 'Unknown'}</strong>
                            <div class="text-muted text-xs">${new Date(result.timestamp).toLocaleString()}</div>
                        </div>
                    </div>
                    ${formatted}
                </div>
            `;
        }

        function renderMultiReport(multiData) {
            const reportDiv = container.querySelector('#delphi-report');
            const metaSpan = container.querySelector('#delphi-report-meta');
            if (!reportDiv) return;

            if (metaSpan) {
                metaSpan.textContent = `Cross-Model Comparison • ${multiData.results.length} models`;
            }

            let html = '<div class="delphi-report-content">';

            // Errors
            if (multiData.errors.length > 0) {
                html += `<div class="delphi-section delphi-trigger-warning mb-md">
                    <strong>⚠️ Errors</strong>
                    ${multiData.errors.map(e => `<div class="text-xs mt-xs">${e.name || e.provider}: ${e.error}</div>`).join('')}
                </div>`;
            }

            // Side-by-side results
            if (multiData.results.length > 0) {
                html += '<div class="delphi-compare-grid" style="grid-template-columns: repeat(' + Math.min(multiData.results.length, 3) + ', 1fr);">';
                multiData.results.forEach(result => {
                    const modelName = (result.model || '').split('/').pop() || result.provider;
                    html += `
                        <div class="delphi-compare-col">
                            <div class="delphi-compare-header">
                                <strong>${result.configName || modelName}</strong>
                                <div class="text-muted text-xs">${result.provider} / ${modelName}</div>
                            </div>
                            <div class="delphi-compare-body">
                                ${formatReport(result.report)}
                            </div>
                        </div>
                    `;
                });
                html += '</div>';
            }

            html += '</div>';
            reportDiv.innerHTML = html;
        }

        function formatReport(reportText) {
            if (!reportText) return '<div class="text-muted">No report data</div>';

            // Light markdown parsing for the report
            let html = reportText;

            // Escape HTML
            html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

            // Headers → collapsible sections
            html = html.replace(/^### (.+)$/gm, '<h4 class="delphi-section-h4">$1</h4>');
            html = html.replace(/^## (.+)$/gm, '</div><details class="delphi-section" open><summary class="delphi-section-header">$1</summary><div class="delphi-section-body">');
            html = html.replace(/^# (.+)$/gm, '<h3 class="delphi-section-h3">$1</h3>');

            // Bold
            html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

            // Italic
            html = html.replace(/\*([^*\n]+?)\*/g, '<em>$1</em>');

            // Inline code
            html = html.replace(/`([^`\n]+)`/g, '<code class="delphi-code">$1</code>');

            // Bullet lists
            html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
            html = html.replace(/(<li>.*<\/li>\n?)+/gs, match => '<ul class="delphi-list">' + match + '</ul>');

            // Numbered lists
            html = html.replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>');

            // Score highlights (X/10)
            html = html.replace(/(\d+)\/10/g, (match, num) => {
                const n = parseInt(num);
                let cls = 'delphi-score-high';
                if (n <= 3) cls = 'delphi-score-low';
                else if (n <= 6) cls = 'delphi-score-mid';
                return `<span class="${cls}">${match}</span>`;
            });

            // Paragraphs
            html = html.replace(/\n\n/g, '</p><p>');
            html = html.replace(/\n/g, '<br>');

            // Close any open details
            html += '</div>';

            // Wrap
            return '<div class="delphi-formatted">' + html + '</div>';
        }

        // === EVALUATE BUTTON ===
        const evalBtn = container.querySelector('#delphi-evaluate');
        evalBtn.onclick = async () => {
            evalBtn.disabled = true;
            evalBtn.innerHTML = '<span class="delphi-loading-dots">Consulting the Oracle</span>';

            try {
                const result = await A.Delphi.evaluate({
                    mode: currentMode,
                    depth: currentDepth
                });

                currentResult = result;
                multiResults = null;
                renderReport(result);
                refreshHistory();

                if (A.UI?.Toast) A.UI.Toast.show('Oracle has spoken', 'success');

            } catch (e) {
                console.error('[Delphi]', e);
                if (A.UI?.Toast) A.UI.Toast.show(e.message, 'error');
            } finally {
                evalBtn.disabled = false;
                evalBtn.innerHTML = '🏛️ Evaluate';
            }
        };

        // === MULTI-MODEL BUTTON ===
        const multiBtn = container.querySelector('#delphi-multi');
        multiBtn.onclick = async () => {
            const configs = JSON.parse(localStorage.getItem('anansi_llm_configs') || '[]');
            if (configs.length < 2) {
                if (A.UI?.Toast) A.UI.Toast.show('Need at least 2 LLM configs for comparison. Open API Configuration.', 'warning');
                return;
            }

            multiBtn.disabled = true;
            evalBtn.disabled = true;
            multiBtn.innerHTML = '<span class="delphi-loading-dots">Testing models</span>';

            // Show progress in report area
            const reportDiv = container.querySelector('#delphi-report');
            reportDiv.innerHTML = `
                <div class="delphi-empty-state">
                    <div class="delphi-oracle-pulse" style="font-size:48px; margin-bottom:12px;">🏛️</div>
                    <div class="text-muted">Running evaluation against ${configs.length} models...<br>
                    <span class="text-xs">This may take a moment.</span></div>
                </div>
            `;

            try {
                const multi = await A.Delphi.evaluateMulti({
                    mode: currentMode,
                    depth: currentDepth
                });

                multiResults = multi;
                currentResult = null;
                renderMultiReport(multi);
                refreshHistory();

                const successCount = multi.results.length;
                const errorCount = multi.errors.length;
                if (A.UI?.Toast) A.UI.Toast.show(`Compared ${successCount} model(s)${errorCount ? `, ${errorCount} failed` : ''}`, successCount > 0 ? 'success' : 'warning');

            } catch (e) {
                console.error('[Delphi Multi]', e);
                if (A.UI?.Toast) A.UI.Toast.show(e.message, 'error');
            } finally {
                multiBtn.disabled = false;
                evalBtn.disabled = false;
                multiBtn.innerHTML = '🔀 Multi-Model';
            }
        };

        // Initial render
        refreshHistory();
    }

    // Register panel
    A.registerPanel('delphi', {
        label: 'Temple of Delphi',
        subtitle: 'Persona Diagnostic',
        category: 'Sacred Tools',
        order: 25,
        render: render
    });

})(window.Anansi);
