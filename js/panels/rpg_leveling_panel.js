/**
 * Anansi Panel: RPG Leveling Configuration
 * File: js/panels/rpg_leveling_panel.js
 * Category: RPG Experiment
 * Purpose: Configure XP thresholds and leveling progression.
 */

(function (A) {
    'use strict';

    function render(container) {
        const state = A.State.get();
        if (!state.rpg) state.rpg = {};

        const Leveling = window.RPG?.Leveling;
        if (!Leveling) {
            container.innerHTML = '<p style="padding:20px; color:var(--text-muted);">Leveling system not loaded.</p>';
            return;
        }

        const config = Leveling.getConfig();
        const presets = Leveling.getPresets();

        container.style.cssText = 'height:100%; display:flex; flex-direction:column; gap:16px; padding:16px;';

        // Header
        const header = document.createElement('div');
        header.className = 'card';
        header.style.cssText = 'padding:16px; flex-shrink:0;';
        header.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <h3 style="margin:0; font-size:16px;">📈 Leveling Configuration</h3>
                    <p style="margin:4px 0 0; font-size:11px; color:var(--text-muted);">
                        Configure XP requirements for level progression
                    </p>
                </div>
            </div>
        `;
        container.appendChild(header);

        // Settings Section
        const settingsSection = document.createElement('div');
        settingsSection.className = 'card';
        settingsSection.style.cssText = 'padding:16px; flex-shrink:0;';
        settingsSection.innerHTML = `
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px;">
                <div>
                    <label class="label">XP Progression Preset</label>
                    <select id="preset-select" class="input" style="width:100%;">
                        ${Object.entries(presets).map(([id, preset]) => `
                            <option value="${id}" ${config.preset === id ? 'selected' : ''}>${preset.name}</option>
                        `).join('')}
                    </select>
                    <p id="preset-desc" style="margin:8px 0 0; font-size:11px; color:var(--text-muted);">
                        ${presets[config.preset]?.description || ''}
                    </p>
                </div>
                <div>
                    <label class="label">Maximum Level</label>
                    <input type="number" id="max-level" class="input" value="${config.maxLevel || 20}" min="1" max="100" style="width:100%;">
                </div>
            </div>
        `;
        container.appendChild(settingsSection);

        // Wire preset change
        settingsSection.querySelector('#preset-select').onchange = (e) => {
            Leveling.setPreset(e.target.value);
            settingsSection.querySelector('#preset-desc').textContent = presets[e.target.value]?.description || '';
            renderTable();
        };

        settingsSection.querySelector('#max-level').onchange = (e) => {
            config.maxLevel = parseInt(e.target.value) || 20;
            A.State.notify();
            renderTable();
        };

        // XP Table Section
        const tableSection = document.createElement('div');
        tableSection.className = 'card';
        tableSection.style.cssText = 'padding:16px; flex:1; overflow-y:auto;';
        container.appendChild(tableSection);

        const renderTable = () => {
            const table = Leveling.getXPTable();

            tableSection.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                    <h4 style="margin:0; font-size:13px;">XP Requirements by Level</h4>
                    ${config.preset === 'custom' ? '<span style="font-size:10px; color:var(--accent-primary);">✏️ Click values to edit</span>' : ''}
                </div>
                <table style="width:100%; border-collapse:collapse; font-size:12px;">
                    <thead>
                        <tr style="border-bottom:2px solid var(--border-default);">
                            <th style="text-align:left; padding:8px 4px; width:80px;">Level</th>
                            <th style="text-align:right; padding:8px 4px;">XP Required</th>
                            <th style="text-align:right; padding:8px 4px; width:100px;">XP to Next</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${table.map((row, i) => {
                const nextXP = i < table.length - 1 ? table[i + 1].xp - row.xp : '—';
                return `
                                <tr style="border-bottom:1px solid var(--border-subtle);">
                                    <td style="padding:8px 4px; font-weight:bold;">
                                        <span style="display:inline-flex; align-items:center; gap:6px;">
                                            <span style="font-size:14px;">${row.level <= 5 ? '🟢' : row.level <= 10 ? '🟡' : row.level <= 15 ? '🟠' : '🔴'}</span>
                                            ${row.level}
                                        </span>
                                    </td>
                                    <td style="text-align:right; padding:8px 4px;">
                                        ${config.preset === 'custom' ? `
                                            <input type="number" class="input custom-xp" data-level="${row.level}" 
                                                value="${row.xp}" style="width:100px; text-align:right;">
                                        ` : `<span style="font-family:monospace;">${row.xp.toLocaleString()}</span>`}
                                    </td>
                                    <td style="text-align:right; padding:8px 4px; color:var(--text-muted); font-family:monospace;">
                                        ${typeof nextXP === 'number' ? '+' + nextXP.toLocaleString() : nextXP}
                                    </td>
                                </tr>
                            `;
            }).join('')}
                    </tbody>
                </table>
            `;

            // Wire custom XP inputs
            if (config.preset === 'custom') {
                tableSection.querySelectorAll('.custom-xp').forEach(input => {
                    input.onchange = (e) => {
                        const level = parseInt(e.target.dataset.level);
                        const xp = parseInt(e.target.value) || 0;
                        Leveling.setCustomThreshold(level, xp);
                        renderTable();
                    };
                });
            }
        };

        renderTable();

        // Party XP Overview Section
        const partySection = document.createElement('div');
        partySection.className = 'card';
        partySection.style.cssText = 'padding:16px; flex-shrink:0;';

        const renderParty = () => {
            const actors = Object.values(state.nodes?.actors?.items || {});
            const party = actors.filter(a => a.data?.rpg?.enabled && a.data.rpg.type !== 'monster');

            if (party.length === 0) {
                partySection.innerHTML = `
                    <h4 style="margin:0 0 8px; font-size:13px;">Party Progress</h4>
                    <p style="color:var(--text-muted); font-size:11px;">No party members found.</p>
                `;
                return;
            }

            partySection.innerHTML = `
                <h4 style="margin:0 0 12px; font-size:13px;">Party Progress</h4>
                <div style="display:flex; flex-direction:column; gap:8px;">
                    ${party.map(actor => {
                const rpg = actor.data.rpg;
                const currentXP = rpg.xp || 0;
                const currentLevel = rpg.level || 1;
                const nextLevelXP = Leveling.getXPForLevel(currentLevel + 1);
                const currentLevelXP = Leveling.getXPForLevel(currentLevel);
                const progress = Math.min(100, Math.max(0,
                    ((currentXP - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100
                ));

                return `
                            <div style="display:flex; gap:12px; align-items:center; padding:8px; background:var(--bg-base); border-radius:6px;">
                                <div style="width:80px; font-weight:600; font-size:12px;">${actor.name}</div>
                                <div style="flex:1;">
                                    <div style="height:8px; background:var(--bg-elevated); border-radius:4px; overflow:hidden;">
                                        <div style="height:100%; width:${progress}%; background:var(--accent-primary); transition:width 0.3s;"></div>
                                    </div>
                                </div>
                                <div style="text-align:right; font-size:11px; width:100px; color:var(--text-muted);">
                                    Lvl ${currentLevel} • ${currentXP.toLocaleString()} XP
                                </div>
                            </div>
                        `;
            }).join('')}
                </div>
            `;
        };

        container.appendChild(partySection);
        renderParty();
    }

    A.registerPanel('rpg_leveling', {
        label: 'Leveling',
        subtitle: 'XP & Progression',
        category: 'RPG Experiment',
        subcategory: 'Game Master',
        order: 16,
        icon: '📈',
        render: render
    });

})(window.Anansi);
