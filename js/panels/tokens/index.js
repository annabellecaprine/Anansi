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
      updateCounts(); // Re-calculate with new ratio
    };

    updateCounts();

    function updateCounts() {
      if (!A.TokenMetrics) {
        container.querySelector('#total-chars').textContent = 'Service unavailable';
        container.querySelector('#total-tokens').textContent = 'N/A';
        return;
      }

      const metrics = A.TokenMetrics.getBreakdown();
      const total = metrics.permanent.tokens + metrics.temporary.tokens + metrics.injectable.tokens;

      // Update summary cards
      const totalChars = metrics.permanent.chars + metrics.temporary.chars + metrics.injectable.chars;
      container.querySelector('#total-chars').textContent = totalChars.toLocaleString();
      container.querySelector('#total-tokens').textContent = total.toLocaleString();

      // Seed Breakdown - Now show Permanent + Temporary
      const seedBox = container.querySelector('#seed-breakdown');
      seedBox.innerHTML = `
        <div style="font-size:13px; font-weight:bold; margin-bottom:8px; color:var(--accent-primary);">Permanent (Every Turn)</div>
        <div style="display:flex; justify-content:space-between; font-size:12px; padding-left:8px;">
          <span>Personality</span>
          <span style="color:var(--text-secondary);">${metrics.permanent.breakdown.personality.tokens} tkn</span>
        </div>
        <div style="display:flex; justify-content:space-between; font-size:12px; padding-left:8px; margin-bottom:12px;">
          <span>Scenario</span>
          <span style="color:var(--text-secondary);">${metrics.permanent.breakdown.scenario.tokens} tkn</span>
        </div>
        
        <div style="font-size:13px; font-weight:bold; margin-bottom:8px; color:var(--status-warning);">Temporary (Initial Only)</div>
        <div style="display:flex; justify-content:space-between; font-size:12px; padding-left:8px;">
          <span>Example Dialogue</span>
          <span style="color:var(--text-secondary);">${metrics.temporary.breakdown.examples.tokens} tkn</span>
        </div>
      `;

      // Actor Breakdown - Show Injectable category
      const actorBox = container.querySelector('#actor-breakdown');
      const injBreakdown = metrics.injectable.breakdown;
      actorBox.innerHTML = `
        <div style="font-size:13px; font-weight:bold; margin-bottom:8px; color:var(--status-success);">Injectable (Conditional)</div>
        <div style="display:flex; justify-content:space-between; font-size:12px; padding-left:8px; border-bottom:1px solid var(--divider); padding-bottom:4px;">
          <span>Actors (Appearance + Cues)</span>
          <span style="color:var(--text-secondary);">${injBreakdown.actors.tokens} tkn</span>
        </div>
        <div style="display:flex; justify-content:space-between; font-size:12px; padding-left:8px; border-bottom:1px solid var(--divider); padding-bottom:4px;">
          <span>Lorebook Entries</span>
          <span style="color:var(--text-secondary);">${injBreakdown.lorebook.tokens} tkn</span>
        </div>
        <div style="display:flex; justify-content:space-between; font-size:12px; padding-left:8px; border-bottom:1px solid var(--divider); padding-bottom:4px;">
          <span>Relationships (Pairs)</span>
          <span style="color:var(--text-secondary);">${injBreakdown.pairs.tokens} tkn</span>
        </div>
        <div style="display:flex; justify-content:space-between; font-size:12px; padding-left:8px; border-bottom:1px solid var(--divider); padding-bottom:4px;">
          <span>Voices & Rails</span>
          <span style="color:var(--text-secondary);">${injBreakdown.voices.tokens} tkn</span>
        </div>
        <div style="display:flex; justify-content:space-between; font-size:12px; padding-left:8px; border-bottom:1px solid var(--divider); padding-bottom:4px;">
          <span>Events</span>
          <span style="color:var(--text-secondary);">${injBreakdown.events.tokens} tkn</span>
        </div>
        <div style="display:flex; justify-content:space-between; font-size:12px; padding-left:8px; border-bottom:1px solid var(--divider); padding-bottom:4px;">
          <span>Custom Rules (Advanced)</span>
          <span style="color:var(--text-secondary);">${injBreakdown.advanced.tokens} tkn</span>
        </div>
        <div style="display:flex; justify-content:space-between; font-size:12px; padding-left:8px;">
          <span>Scoring Context</span>
          <span style="color:var(--text-secondary);">${injBreakdown.scoring.tokens} tkn</span>
        </div>
      `;

      // Lorebook Breakdown Table (keep detailed view)
      const loreBody = container.querySelector('#lore-table-body');
      const loreEntries = Object.values(state.weaves.lorebook?.entries || {});
      const r = state.sim.tokenRatio || 4;

      if (loreEntries.length === 0) {
        loreBody.innerHTML = '<tr><td colspan="3" style="padding:16px; text-align:center; color:var(--text-muted);">Lorebook is empty.</td></tr>';
      } else {
        loreBody.innerHTML = loreEntries.map(e => {
          const content = e.content || '';
          return `
            <tr>
              <td style="padding:8px; border-bottom:1px solid var(--divider);">${e.title || 'Untitled'}</td>
              <td style="padding:8px; text-align:right; border-bottom:1px solid var(--divider);">${content.length}</td>
              <td style="padding:8px; text-align:right; border-bottom:1px solid var(--divider); color:var(--accent-primary);">${Math.ceil(content.length / r)}</td>
            </tr>
          `;
        }).join('');
      }
    }
  }

  A.registerPanel('tokens', {
    label: 'Tokens',
    subtitle: 'Project Weight',
    category: 'Deep',
    render: render
  });

})(window.Anansi);
