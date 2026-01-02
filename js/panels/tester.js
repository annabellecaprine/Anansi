/*
 * Anansi Panel: Tester
 * File: js/panels/tester.js
 */

(function (A) {
  'use strict';

  function render(container) {
    container.style.height = '100%';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--space-4)';

    // Header / Controls
    const controls = document.createElement('div');
    controls.className = 'card';
    controls.style.marginBottom = '0';
    controls.style.flexShrink = '0';
    controls.innerHTML = `
      <div class="card-header">
        <strong>Simulation Controls</strong>
      </div>
      <div class="card-body" style="display:flex; gap:12px; align-items:center;">
        <button class="btn btn-primary btn-sm" id="btn-run-sim">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none" style="margin-right:6px;"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
          Run Simulation
        </button>
        <button class="btn btn-secondary btn-sm" id="btn-clear-log">
          Clear Log
        </button>
        <div style="flex:1;"></div>
        <div style="font-size:11px; color:var(--text-muted);" id="sim-status">Ready</div>
      </div>
    `;

    // Console / Trace Output
    const consoleCard = document.createElement('div');
    consoleCard.className = 'card';
    consoleCard.style.flex = '1';
    consoleCard.style.marginBottom = '0';
    consoleCard.style.display = 'flex';
    consoleCard.style.flexDirection = 'column';
    consoleCard.style.overflow = 'hidden'; // For scroll inside body

    consoleCard.innerHTML = `
      <div class="card-header">
        <strong>Trace Log</strong>
      </div>
      <div class="card-body" id="trace-output" style="
        flex: 1;
        overflow-y: auto;
        padding: 0;
        background: #000;
        font-family: var(--font-mono);
        font-size: 12px;
        color: #ddd;
      "></div>
    `;

    container.appendChild(controls);
    container.appendChild(consoleCard);

    // --- Logic ---
    const outputDiv = consoleCard.querySelector('#trace-output');
    const statusDiv = controls.querySelector('#sim-status');

    function renderLog(log) {
      outputDiv.innerHTML = '';

      if (log.length === 0) {
        outputDiv.innerHTML = '<div style="padding:12px; color:#555;">No events recorded.</div>';
        return;
      }

      log.forEach(entry => {
        const row = document.createElement('div');
        row.style.padding = '4px 8px';
        row.style.borderBottom = '1px solid #222';
        row.style.display = 'flex';
        row.style.gap = '8px';

        let color = '#ccc';
        let icon = '•';

        switch (entry.type) {
          case 'system': color = '#7c4dff'; icon = '⚙'; break;
          case 'error': color = '#d32f2f'; icon = '✖'; break;
          case 'warn': color = '#ed6c02'; icon = '⚠'; break;
          case 'info': color = '#2e7d32'; icon = 'ℹ'; break;
        }

        const time = new Date(entry.timestamp).toLocaleTimeString();

        row.innerHTML = `
          <span style="color:#666; font-size:10px; width:70px; flex-shrink:0;">${time}</span>
          <span style="color:${color}; width:20px; text-align:center; flex-shrink:0;">${icon}</span>
          <span style="color:${entry.type === 'error' ? color : '#ddd'}; white-space:pre-wrap;">${entry.message}</span>
        `;
        outputDiv.appendChild(row);
      });

      // Auto-scroll
      outputDiv.scrollTop = outputDiv.scrollHeight;
      statusDiv.textContent = `${log.length} events`;
    }

    // Subscribe to new logs
    A.Tester.subscribe(renderLog);

    // Run action
    controls.querySelector('#btn-run-sim').onclick = () => {
      A.Tester.run();
    };

    controls.querySelector('#btn-clear-log').onclick = () => {
      A.Tester.clear();
    };

    // Initial render
    renderLog(A.Tester.getTrace());
  }

  A.registerPanel('tester', {
    label: 'Tester',
    subtitle: 'Tracing the Web',
    category: 'Deep',
    render: render
  });

})(window.Anansi);
