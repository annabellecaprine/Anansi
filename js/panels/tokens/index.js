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
      <div class="flex-col gap-lg">
        
        <!-- Summary Dashboard -->
        <div class="grid-auto-fill gap-md">
          <div class="card p-md text-center">
            <div class="text-xs text-muted text-uppercase mb-xs">Total Project Characters</div>
            <div class="text-xl font-bold text-accent" style="font-size:32px;" id="total-chars">0</div>
          </div>
          <div class="card p-md text-center">
            <div class="text-xs text-muted text-uppercase mb-xs">Estimated Tokens</div>
            <div class="text-xl font-bold text-success" style="font-size:32px;" id="total-tokens">0</div>
          </div>
          <div class="card p-md">
            <div class="text-xs text-muted text-uppercase mb-sm">Heuristic Configuration</div>
            <div class="flex-row items-center gap-sm">
              <span class="text-xs">1 Token ≈</span>
              <input type="number" class="input text-xs p-sm" style="width:60px;" id="inp-ratio" value="${ratio}">
              <span class="text-xs">chars</span>
            </div>
            <div class="text-xs text-muted mt-xs">Gemini/GPT averages ~4 chars/token.</div>
          </div>
        </div>

        <!-- Detailed Breakdown -->
        <div class="panel-grid gap-lg" style="grid-template-columns: 1fr 1.5fr;">
          
          <!-- Column 1: Actors & Seeds -->
          <div class="flex-col gap-md">
            <section>
              <h3 class="font-serif text-lg mb-sm">The Anchor (Seed)</h3>
              <div id="seed-breakdown" class="card p-sm flex-col gap-sm"></div>
            </section>
            
            <section>
              <h3 class="font-serif text-lg mb-sm">Actors & Personas</h3>
              <div id="actor-breakdown" class="card p-sm flex-col gap-sm"></div>
            </section>
          </div>

          <!-- Column 2: Lorebook Weights -->
          <section>
            <h3 class="font-serif text-lg mb-sm">Lorebook Density</h3>
            <div id="lore-breakdown" class="card overflow-hidden p-0">
              <table style="width:100%; border-collapse:collapse; font-size:12px;">
                <thead class="bg-surface">
                  <tr>
                    <th class="p-sm text-left border-b">Entry</th>
                    <th class="p-sm text-right border-b">Chars</th>
                    <th class="p-sm text-right border-b">Tokens</th>
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
        <div class="text-xs font-bold mb-sm text-accent">Permanent (Every Turn)</div>
        <div class="flex-row justify-between text-xs pl-sm">
          <span>Personality</span>
          <span class="text-secondary">${metrics.permanent.breakdown.personality.tokens} tkn</span>
        </div>
        <div class="flex-row justify-between text-xs pl-sm mb-sm">
          <span>Scenario</span>
          <span class="text-secondary">${metrics.permanent.breakdown.scenario.tokens} tkn</span>
        </div>
        
        <div class="text-xs font-bold mb-xs text-warning">Temporary (Initial Only)</div>
        <div class="flex-row justify-between text-xs pl-sm">
          <span>Example Dialogue</span>
          <span class="text-secondary">${metrics.temporary.breakdown.examples.tokens} tkn</span>
        </div>
      `;

      // Actor Breakdown - Show Injectable category
      const actorBox = container.querySelector('#actor-breakdown');
      const injBreakdown = metrics.injectable.breakdown;
      actorBox.innerHTML = `
        <div class="text-xs font-bold mb-sm text-success">Injectable (Conditional)</div>
        <div class="flex-row justify-between text-xs pl-sm border-b border-subtle pb-xs mb-xs">
          <span>Actors (Appearance + Cues)</span>
          <span class="text-secondary">${injBreakdown.actors.tokens} tkn</span>
        </div>
        <div class="flex-row justify-between text-xs pl-sm border-b border-subtle pb-xs mb-xs">
          <span>Lorebook Entries</span>
          <span class="text-secondary">${injBreakdown.lorebook.tokens} tkn</span>
        </div>
        <div class="flex-row justify-between text-xs pl-sm border-b border-subtle pb-xs mb-xs">
          <span>Relationships (Pairs)</span>
          <span class="text-secondary">${injBreakdown.pairs.tokens} tkn</span>
        </div>
        <div class="flex-row justify-between text-xs pl-sm border-b border-subtle pb-xs mb-xs">
          <span>Voices & Rails</span>
          <span class="text-secondary">${injBreakdown.voices.tokens} tkn</span>
        </div>
        <div class="flex-row justify-between text-xs pl-sm border-b border-subtle pb-xs mb-xs">
          <span>Events</span>
          <span class="text-secondary">${injBreakdown.events.tokens} tkn</span>
        </div>
        <div class="flex-row justify-between text-xs pl-sm border-b border-subtle pb-xs mb-xs">
          <span>Custom Rules (Advanced)</span>
          <span class="text-secondary">${injBreakdown.advanced.tokens} tkn</span>
        </div>
        <div class="flex-row justify-between text-xs pl-sm">
          <span>Scoring Context</span>
          <span class="text-secondary">${injBreakdown.scoring.tokens} tkn</span>
        </div>
      `;

      // Lorebook Breakdown Table (keep detailed view)
      const loreBody = container.querySelector('#lore-table-body');
      const loreEntries = Object.values(state.weaves.lorebook?.entries || {});
      const r = state.sim.tokenRatio || 4;

      if (loreEntries.length === 0) {
        loreBody.innerHTML = '<tr><td colspan="3" class="p-lg text-center text-muted">Lorebook is empty.</td></tr>';
      } else {
        loreBody.innerHTML = loreEntries.map(e => {
          const content = e.content || '';
          return `
            <tr>
              <td class="p-sm border-b">${e.title || 'Untitled'}</td>
              <td class="p-sm text-right border-b">${content.length}</td>
              <td class="p-sm text-right border-b text-accent">${Math.ceil(content.length / r)}</td>
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
