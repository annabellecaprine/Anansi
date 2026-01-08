/*
 * Anansi Panel: RPG Party
 * File: js/panels/rpg_party.js
 * Category: RPG Experiment
 * Purpose: Dashboard for managing player characters (Heroes), displaying HP, MP, and Status.
 */

(function (A) {
    'use strict';

    function render(container) {
        container.style.height = '100%';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.background = 'var(--bg-base)';
        container.style.overflowY = 'auto'; // scrollable
        container.style.padding = '0';

        // Header
        const header = document.createElement('div');
        header.className = 'panel-toolbar';
        header.style.padding = '12px 16px';
        header.style.background = 'var(--bg-elevated)';
        header.style.borderBottom = '1px solid var(--border-subtle)';
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';

        header.innerHTML = `
            <div style="font-weight:bold; font-size:14px; display:flex; align-items:center; gap:8px;">
                <span>🛡️</span> Party Setup
            </div>
            <div style="display:flex; gap:8px;">
                 <button class="btn btn-sm btn-ghost" id="party-equip-all">Auto-Equip</button>
                 <button class="btn btn-sm btn-ghost" id="party-refresh">Refresh</button>
            </div>
        `;
        container.appendChild(header);

        // Content Grid
        const grid = document.createElement('div');
        grid.style.padding = '16px';
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(280px, 1fr))';
        grid.style.gap = '16px';
        container.appendChild(grid);

        // Render Logic
        const refreshParty = () => {
            grid.innerHTML = '';
            const state = A.State.get();
            const actors = state.nodes && state.nodes.actors ? Object.values(state.nodes.actors.items) : [];

            // Filter for actors that have RPG data or we assume all actors are potential party members
            // For now, let's show all actors but highlight those with RPG stats enabled
            const partyMembers = actors.filter(a => a.data && a.data.rpg && a.data.rpg.enabled);

            if (partyMembers.length === 0) {
                grid.innerHTML = `
                    <div style="grid-column: 1 / -1; text-align:center; padding:40px; color:var(--text-muted);">
                        <div style="font-size:24px; margin-bottom:8px;">🤷‍♂️</div>
                        <div>No RPG-enabled actors found.</div>
                        <div style="font-size:11px; margin-top:4px;">Go to <strong>Actors</strong> panel and enable RPG Mode for your characters.</div>
                    </div>
                `;
                return;
            }

            partyMembers.forEach(actor => {
                const card = document.createElement('div');
                card.className = 'card'; // Assuming generic card class or style
                card.style.background = 'var(--bg-surface)';
                card.style.border = '1px solid var(--border-subtle)';
                card.style.borderRadius = '8px';
                card.style.overflow = 'hidden';
                card.style.display = 'flex';
                card.style.flexDirection = 'column';

                // Stats
                const stats = actor.data.rpg.stats || { hp: 10, hp_max: 10, mp: 3, mp_max: 3, str: 10, dex: 10, int: 10 };
                const hpPct = Math.min(100, Math.max(0, (stats.hp / stats.hp_max) * 100));
                const mpPct = Math.min(100, Math.max(0, (stats.mp / stats.mp_max) * 100));

                card.innerHTML = `
                    <div style="padding:12px; border-bottom:1px solid var(--border-subtle); display:flex; justify-content:space-between; align-items:center;">
                        <span style="font-weight:bold; color:var(--text-primary);">${actor.name}</span>
                        <span style="font-size:10px; color:var(--text-muted);">Lvl ${stats.level || 1} ${stats.class || 'Adventurer'}</span>
                    </div>
                    <div style="padding:16px; display:flex; flex-direction:column; gap:12px;">
                        
                        <!-- HP Bar -->
                        <div>
                            <div style="display:flex; justify-content:space-between; font-size:11px; margin-bottom:4px;">
                                <span style="font-weight:bold; color:var(--status-error);">HP</span>
                                <span>${stats.hp} / ${stats.hp_max}</span>
                            </div>
                            <div style="background:rgba(255,0,0,0.1); border-radius:4px; height:8px; overflow:hidden;">
                                <div style="width:${hpPct}%; background:var(--status-error); height:100%; transition:width 0.3s;"></div>
                            </div>
                        </div>

                        <!-- MP Bar -->
                        <div>
                            <div style="display:flex; justify-content:space-between; font-size:11px; margin-bottom:4px;">
                                <span style="font-weight:bold; color:var(--accent-primary);">MP</span>
                                <span>${stats.mp} / ${stats.mp_max}</span>
                            </div>
                            <div style="background:rgba(0,100,255,0.1); border-radius:4px; height:8px; overflow:hidden;">
                                <div style="width:${mpPct}%; background:var(--accent-primary); height:100%; transition:width 0.3s;"></div>
                            </div>
                        </div>

                        <!-- Attributes Grid -->
                        <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; margin-top:8px; padding-top:12px; border-top:1px solid var(--border-subtle); text-align:center;">
                           <div>
                                <div style="font-size:9px; color:var(--text-muted); text-transform:uppercase;">STR</div>
                                <div style="font-weight:bold;">${stats.str}</div>
                           </div>
                           <div>
                                <div style="font-size:9px; color:var(--text-muted); text-transform:uppercase;">DEX</div>
                                <div style="font-weight:bold;">${stats.dex}</div>
                           </div>
                           <div>
                                <div style="font-size:9px; color:var(--text-muted); text-transform:uppercase;">INT</div>
                                <div style="font-weight:bold;">${stats.int}</div>
                           </div>
                        </div>

                    </div>
                `;
                grid.appendChild(card);
            });
        };

        header.querySelector('#party-refresh').onclick = refreshParty;

        // Initial Load
        refreshParty();

        // Subscribe to state changes to auto-update
        const sub = A.State.subscribe((state) => {
            if (grid.isConnected) { // Only update if panel is visible
                // We could diff, but simple re-render is fine for prototype
                // To avoid jitter, maybe only refresh if stats changed?
                // For now, let's just rely on manual refresh + initial load to avoid aggressive re-renders
                // or maybe a debounced refresh.
            }
        });
    }

    A.registerPanel('rpg_party', {
        label: 'Party',
        subtitle: 'Setup & Equipment',
        category: 'RPG Experiment',
        icon: '🛡️',
        render: render
    });

})(window.Anansi);
