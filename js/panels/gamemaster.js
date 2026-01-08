
/*
 * Anansi Panel: Game Master (Secret)
 * File: js/panels/gamemaster.js
 * Purpose: RPG Mechanics Configuration and Management
 */

(function (A) {
    'use strict';

    function render(container) {
        // Security Check (Client-side obfuscation only, obviously)
        const isUnlocked = localStorage.getItem('anansi_gm_unlocked') === 'true';

        if (!isUnlocked) {
            container.innerHTML = `
                <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; opacity:0.3;">
                    <div style="font-size:48px;">🔒</div>
                    <div style="margin-top:16px;">Access Denied</div>
                    <div style="font-size:10px;">This panel is sealed by the High Council.</div>
                </div>
            `;
            return;
        }

        const state = A.State.get();
        // Initialize RPG State if missing
        if (!state.rpg) state.rpg = { enabled: false, stats: [], mechanics: 'd20' };

        container.style.padding = '16px';
        container.style.height = '100%';
        container.style.overflowY = 'auto';

        // HEADER
        const header = document.createElement('div');
        header.innerHTML = `
            <div style="margin-bottom:24px; text-align:center;">
                <div style="font-size:32px; margin-bottom:8px;">🎲</div>
                <h2 style="margin:0; color:var(--accent-primary);">Game Master</h2>
                <div style="font-size:11px; opacity:0.6;">Mechanics & Rules Engine</div>
            </div>
        `;
        container.appendChild(header);

        // MAIN TOGGLE
        const toggleCard = document.createElement('div');
        toggleCard.className = 'card';
        toggleCard.innerHTML = `
            <div class="card-body" style="display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <strong style="display:block;">RPG Mode</strong>
                    <span style="font-size:11px; opacity:0.7;">Inject mechanics into chat</span>
                </div>
                <div class="toggle-switch">
                    <input type="checkbox" id="gm-rpg-toggle" ${state.rpg.enabled ? 'checked' : ''}>
                    <label for="gm-rpg-toggle"></label>
                </div>
            </div>
        `;
        container.appendChild(toggleCard);

        const toggle = toggleCard.querySelector('#gm-rpg-toggle');
        toggle.onchange = (e) => {
            state.rpg.enabled = e.target.checked;
            A.State.notify();

            // Also enable/disable the system script
            const sysScript = A.Scripts.getAll().find(s => s.id === 'sys_rpg');
            if (sysScript) {
                sysScript.enabled = state.rpg.enabled;
                A.Scripts.update('sys_rpg', { enabled: state.rpg.enabled });
            } else if (state.rpg.enabled) {
                // If enabling and script doesn't exist, create it from template
                // We'll trust the migration step to handle creation, but we can hint here.
                if (A.UI.Toast) A.UI.Toast.show('RPG Mode Active - Ensure sys_rpg script exists', 'info');
            }
        };

        // MECHANICS CONFIG (Placeholder for now, but foundational)
        if (state.rpg.enabled) {
            const configCard = document.createElement('div');
            configCard.className = 'card';
            configCard.innerHTML = `
                <div class="card-header"><strong>Ruleset Configuration</strong></div>
                <div class="card-body" style="display:flex; flex-direction:column; gap:12px;">
                    <div>
                        <label class="l-lab">Base Mechanic</label>
                        <select class="input" id="gm-mech-select">
                            <option value="d20" ${state.rpg.mechanics === 'd20' ? 'selected' : ''}>D20 System (D&D-like)</option>
                            <option value="d6" ${state.rpg.mechanics === 'd6' ? 'selected' : ''}>D6 Pool (Shadowrun-like)</option>
                            <option value="narrative" ${state.rpg.mechanics === 'narrative' ? 'selected' : ''}>Narrative (PbtA)</option>
                        </select>
                    </div>
                    <div>
                        <label class="l-lab">Tracked Stats (Generic)</label>
                        <div style="font-size:10px; opacity:0.6; margin-bottom:4px;">Auto-creates persistent sources</div>
                        <div id="gm-stats-list" style="display:flex; flex-wrap:wrap; gap:4px; margin-bottom:8px;"></div>
                        <input class="input" id="gm-add-stat" placeholder="+ Add Stat (e.g. HP, MP)" style="font-size:11px;">
                    </div>
                </div>
            `;
            container.appendChild(configCard);

            // Stats Logic
            const statsDiv = configCard.querySelector('#gm-stats-list');
            const addStat = configCard.querySelector('#gm-add-stat');

            const renderStats = () => {
                statsDiv.innerHTML = (state.rpg.stats || []).map(s => `
                    <span style="background:var(--bg-elevated); border:1px solid var(--border-subtle); padding:2px 8px; border-radius:12px; font-size:10px; cursor:pointer;" title="Click to remove">
                        ${s} ✕
                    </span>
                `).join('');

                statsDiv.querySelectorAll('span').forEach((el, idx) => {
                    el.onclick = () => {
                        state.rpg.stats.splice(idx, 1);
                        A.State.notify();
                        renderStats();
                    };
                });
            };

            renderStats();

            addStat.onkeydown = (e) => {
                if (e.key === 'Enter') {
                    const val = e.target.value.trim().toUpperCase();
                    if (val && !state.rpg.stats.includes(val)) {
                        state.rpg.stats.push(val);
                        // Ensure source exists
                        if (state.strands && state.strands.sources) {
                            // Initialize if missing (mock logic for prototype)
                            // Ideally we call A.Sources.create() or similar if exposed
                            // For now we just track the list in RPG state
                        }
                        A.State.notify();
                        renderStats();
                    }
                    e.target.value = '';
                }
            };

            configCard.querySelector('#gm-mech-select').onchange = (e) => {
                state.rpg.mechanics = e.target.value;
                A.State.notify();
            };
        }

        // RESET BUTTON
        const footer = document.createElement('div');
        footer.style.marginTop = '24px';
        footer.style.textAlign = 'center';
        footer.innerHTML = `
            <button class="btn btn-ghost btn-sm" id="gm-lock" style="color:var(--text-muted); font-size:10px;">🔒 Lock Panel</button>
        `;
        container.appendChild(footer);

        footer.querySelector('#gm-lock').onclick = () => {
            if (confirm('Lock the Game Master panel? You will need the password to re-enter.')) {
                localStorage.setItem('anansi_gm_unlocked', 'false');
                A.UI.switchPanel('project'); // Kick out
                setTimeout(() => A.UI.buildSidebar(), 100); // Rebuild sidebar to hide icon
            }
        };
    }

    A.registerPanel('gamemaster', {
        label: 'Game Master',
        subtitle: 'RPG Engine',
        category: 'RPG Experiment',
        icon: '🎲',
        render: render
    });

})(window.Anansi);
