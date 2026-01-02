/*
 * Anansi Panel: Token Estimator
 * File: js/panels/tokens.js
 */

(function (A) {
  'use strict';

  function render(container) {
    const state = A.State.get();
    const ratio = state.sim.tokenRatio || 4; // Default heuristic

    container.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:24px;">
        
        <!-- Summary Dashboard -->
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:16px;">
          <div class="card" style="padding:16px; text-align:center;">
            <div style="font-size:10px; color:var(--text-muted); text-transform:uppercase; margin-bottom:4px;">Total Project Characters</div>
            <div style="font-size:32px; font-weight:bold; color:var(--accent-primary);" id="total-chars">0</div>
          </div>
          <div class="card" style="padding:16px; text-align:center;">
            <div style="font-size:10px; color:var(--text-muted); text-transform:uppercase; margin-bottom:4px;">Estimated Tokens</div>
            <div style="font-size:32px; font-weight:bold; color:var(--status-success);" id="total-tokens">0</div>
          </div>
          <div class="card" style="padding:16px;">
            <div style="font-size:10px; color:var(--text-muted); text-transform:uppercase; margin-bottom:8px;">Heuristic Configuration</div>
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-size:11px;">1 Token ≈</span>
              <input type="number" class="input" id="inp-ratio" value="${ratio}" style="width:60px; font-size:11px; padding:4px;">
              <span style="font-size:11px;">chars</span>
            </div>
            <div style="font-size:9px; color:var(--text-muted); margin-top:4px;">Gemini/GPT averages ~4 chars/token.</div>
          </div>
        </div>

        <!-- Detailed Breakdown -->
        <div style="display:grid; grid-template-columns: 1fr 1.5fr; gap:24px;">
          
          <!-- Column 1: Actors & Seeds -->
          <div style="display:flex; flex-direction:column; gap:16px;">
            <section>
              <h3 style="font-family:var(--font-serif); font-size:18px; margin-bottom:12px;">The Anchor (Seed)</h3>
              <div id="seed-breakdown" class="card" style="padding:12px; display:flex; flex-direction:column; gap:8px;"></div>
            </section>
            
            <section>
              <h3 style="font-family:var(--font-serif); font-size:18px; margin-bottom:12px;">Actors & Personas</h3>
              <div id="actor-breakdown" class="card" style="padding:12px; display:flex; flex-direction:column; gap:8px;"></div>
            </section>
          </div>

          <!-- Column 2: Lorebook Weights -->
          <section>
            <h3 style="font-family:var(--font-serif); font-size:18px; margin-bottom:12px;">Lorebook Density</h3>
            <div id="lore-breakdown" class="card" style="padding:0; overflow:hidden;">
              <table style="width:100%; border-collapse:collapse; font-size:12px;">
                <thead style="background:var(--bg-surface);">
                  <tr>
                    <th style="padding:8px; text-align:left; border-bottom:1px solid var(--border-subtle);">Entry</th>
                    <th style="padding:8px; text-align:right; border-bottom:1px solid var(--border-subtle);">Chars</th>
                    <th style="padding:8px; text-align:right; border-bottom:1px solid var(--border-subtle);">Tokens</th>
                  </tr>
                </thead>
                <tbody id="lore-table-body"></tbody>
              </table>
            </div>
          </section>

        </div>
      </div>
    `;

    const ratioInp = container.querySelector('#inp-ratio');
    ratioInp.onchange = (e) => {
      state.sim.tokenRatio = parseFloat(e.target.value) || 4;
      A.State.notify();
    };

    updateCounts();

    function updateCounts() {
      const r = state.sim.tokenRatio || 4;
      let totalChars = 0;

      // Seed Breakdown
      const seedBox = container.querySelector('#seed-breakdown');
      const seedContent = (state.seed.persona || '') + (state.seed.scenario || '') + (state.seed.examples || '');
      const seedChars = seedContent.length;
      totalChars += seedChars;
      seedBox.innerHTML = `
        <div style="display:flex; justify-content:space-between; font-size:12px;">
          <span>Persona/Scenario Seed</span>
          <span style="color:var(--text-secondary);">${seedChars} chars (${Math.ceil(seedChars / r)} tkn)</span>
        </div>
      `;

      // Actor Breakdown
      const actorBox = container.querySelector('#actor-breakdown');
      const actors = Object.values(state.nodes.actors?.items || {});
      if (actors.length === 0) {
        actorBox.innerHTML = '<div style="color:var(--text-muted); font-size:11px; font-style:italic;">No custom actors defined.</div>';
      } else {
        actorBox.innerHTML = actors.map(a => {
          const content = (a.description || '') + (a.scenario || '');
          totalChars += content.length;
          return `
            <div style="display:flex; justify-content:space-between; font-size:12px; border-bottom:1px solid var(--divider); padding-bottom:4px;">
              <span>${a.name || 'Unnamed Actor'}</span>
              <span style="color:var(--text-secondary);">${content.length} chars (${Math.ceil(content.length / r)} tkn)</span>
            </div>
          `;
        }).join('');
      }

      // Lorebook Breakdown
      const loreBody = container.querySelector('#lore-table-body');
      const loreEntries = Object.values(state.weaves.lorebook?.entries || {});
      if (loreEntries.length === 0) {
        loreBody.innerHTML = '<tr><td colspan="3" style="padding:16px; text-align:center; color:var(--text-muted);">Lorebook is empty.</td></tr>';
      } else {
        loreBody.innerHTML = loreEntries.map(e => {
          const content = e.content || '';
          totalChars += content.length;
          return `
            <tr>
              <td style="padding:8px; border-bottom:1px solid var(--divider);">${e.title || 'Untitled'}</td>
              <td style="padding:8px; text-align:right; border-bottom:1px solid var(--divider);">${content.length}</td>
              <td style="padding:8px; text-align:right; border-bottom:1px solid var(--divider); color:var(--accent-primary);">${Math.ceil(content.length / r)}</td>
            </tr>
          `;
        }).join('');
      }

      // Final Tally
      container.querySelector('#total-chars').textContent = totalChars.toLocaleString();
      container.querySelector('#total-tokens').textContent = Math.ceil(totalChars / r).toLocaleString();
    }
  }

  A.registerPanel('tokens', {
    label: 'Tokens',
    subtitle: 'Project Weight',
    category: 'Deep',
    render: render
  });

})(window.Anansi);
