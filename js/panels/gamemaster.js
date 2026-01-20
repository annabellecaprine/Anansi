
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

        // Initialize Ruleset Data
        if (!state.rpg.rulesets) state.rpg.rulesets = {};

        // DEFAULTS
        const DEFAULTS = {
            'd20': [
                { name: 'Melee Attack', roll: '1d20', mod: '+StrMod', op: '>=', target: 'AC', tmod: '' },
                { name: 'Ranged Attack', roll: '1d20', mod: '+DexMod', op: '>=', target: 'AC', tmod: '' },
                { name: 'Skill Check', roll: '1d20', mod: '+Stat', op: '>=', target: 'DC', tmod: '' }
            ],
            'd6': [
                { name: 'Pool Test', roll: 'Stat+Skill d6', mod: '', op: 'count >', target: '5', tmod: '' }
            ],
            'narrative': [
                { name: 'Move', roll: '2d6', mod: '+Stat', op: '>=', target: '7/10', tmod: '' }
            ]
        };

        container.style.padding = '0';
        container.style.height = '100%';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.overflow = 'hidden';

        // HEADER
        const header = document.createElement('div');
        header.style.padding = '16px 16px 0 16px';
        header.innerHTML = `
            <div style="margin-bottom:16px; text-align:center;">
                <div style="font-size:24px; margin-bottom:4px;">🎲</div>
                <h2 style="margin:0; color:var(--accent-primary); font-size:18px;">Game Master</h2>
                <div style="font-size:11px; opacity:0.6;">Mechanics & Rules Engine</div>
            </div>
        `;
        container.appendChild(header);

        // TABS
        const tabsContainer = document.createElement('div');
        tabsContainer.style.display = 'flex';
        tabsContainer.style.borderBottom = '1px solid var(--border-subtle)';
        tabsContainer.style.background = 'var(--bg-elevated)';
        tabsContainer.style.padding = '0 16px';
        tabsContainer.style.gap = '16px';

        const createTabBtn = (id, label, active = false) => {
            const btn = document.createElement('div');
            btn.textContent = label;
            btn.style.padding = '10px 4px';
            btn.style.fontSize = '12px';
            btn.style.fontWeight = 'bold';
            btn.style.cursor = 'pointer';
            btn.style.borderBottom = active ? '2px solid var(--accent-primary)' : '2px solid transparent';
            btn.style.color = active ? 'var(--accent-primary)' : 'var(--text-muted)';
            btn.dataset.tab = id;
            btn.onclick = () => switchTab(id);
            return btn;
        };

        const tabSetup = createTabBtn('setup', 'Setup', true);
        const tabRules = createTabBtn('rules', 'Rules');

        tabsContainer.appendChild(tabSetup);
        tabsContainer.appendChild(tabRules); // Always visible for now, or hide if !enabled? User likely wants to configure rules before enabling.

        container.appendChild(tabsContainer);

        // CONTENT AREA
        const content = document.createElement('div');
        content.style.flex = '1';
        content.style.overflowY = 'auto';
        content.style.padding = '16px';
        container.appendChild(content);

        // STATE MANAGER
        let currentTab = 'setup';

        function switchTab(tabId) {
            currentTab = tabId;
            // Update Buttons
            [tabSetup, tabRules].forEach(btn => {
                const active = btn.dataset.tab === tabId;
                btn.style.borderBottom = active ? '2px solid var(--accent-primary)' : '2px solid transparent';
                btn.style.color = active ? 'var(--accent-primary)' : 'var(--text-muted)';
            });
            renderContent();
        }

        function renderContent() {
            content.innerHTML = '';

            if (currentTab === 'setup') {
                renderSetup(content);
            } else if (currentTab === 'rules') {
                renderRules(content);
            }
        }

        // --- RENDERERS ---

        function renderSetup(target) {
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
            target.appendChild(toggleCard);

            const toggle = /** @type {HTMLInputElement} */ (toggleCard.querySelector('#gm-rpg-toggle'));
            toggle.onchange = (e) => {
                state.rpg.enabled = /** @type {HTMLInputElement} */ (e.target).checked;
                A.State.notify();
                // Script update logic
                const sysScript = A.Scripts.getAll().find(s => s.id === 'sys_rpg');
                if (sysScript) {
                    sysScript.enabled = state.rpg.enabled;
                    A.Scripts.update('sys_rpg', { enabled: state.rpg.enabled });
                } else if (state.rpg.enabled && A.UI.Toast) {
                    A.UI.Toast.show('RPG Mode Active', 'info');
                }
            };

            // CONFIG
            if (state.rpg.enabled) {
                const configCard = document.createElement('div');
                configCard.className = 'card';
                configCard.style.marginTop = '16px';
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
                target.appendChild(configCard);

                // Stats Logic
                const statsDiv = configCard.querySelector('#gm-stats-list');
                const addStat = configCard.querySelector('#gm-add-stat');
                const renderStats = () => {
                    statsDiv.innerHTML = (state.rpg.stats || []).map((s, idx) => `
                        <span class="stat-tag" data-idx="${idx}" style="background:var(--bg-elevated); border:1px solid var(--border-subtle); padding:2px 8px; border-radius:12px; font-size:10px; cursor:pointer;">
                            ${s} ✕
                        </span>
                    `).join('');
                    statsDiv.querySelectorAll('.stat-tag').forEach(el => {
                        el.onclick = () => {
                            state.rpg.stats.splice(parseInt(el.dataset.idx), 1);
                            A.State.notify();
                            renderStats();
                        };
                    });
                };
                renderStats();

                addStat.onkeydown = (e) => {
                    if (/** @type {KeyboardEvent} */ (e).key === 'Enter') {
                        const val = /** @type {HTMLInputElement} */ (e.target).value.trim().toUpperCase();
                        if (val && !state.rpg.stats.includes(val)) {
                            state.rpg.stats.push(val);
                            A.State.notify();
                            renderStats();
                        }
                        e.target.value = '';
                    }
                };

                /** @type {HTMLSelectElement} */ (configCard.querySelector('#gm-mech-select')).onchange = (e) => {
                    state.rpg.mechanics = /** @type {HTMLSelectElement} */ (e.target).value;
                    A.State.notify();
                };
            }

            // LOCK
            const footer = document.createElement('div');
            footer.style.marginTop = '24px';
            footer.style.textAlign = 'center';
            footer.innerHTML = `<button class="btn btn-ghost btn-sm" id="gm-lock">🔒 Lock Panel</button>`;
            target.appendChild(footer);
            footer.querySelector('#gm-lock').addEventListener('click', () => {
                if (confirm('Lock the Game Master panel?')) {
                    localStorage.setItem('anansi_gm_unlocked', 'false');
                    A.UI.switchPanel('project');
                    setTimeout(() => A.UI.buildSidebar(), 100);
                }
            });
        }

        function renderRules(target) {
            const mech = state.rpg.mechanics || 'd20';

            // Ensure rules array exists for this mech
            if (!state.rpg.rulesets[mech] || state.rpg.rulesets[mech].length === 0) {
                // Clone defaults if available
                state.rpg.rulesets[mech] = JSON.parse(JSON.stringify(DEFAULTS[mech] || []));
            }
            const rules = state.rpg.rulesets[mech];

            const container = document.createElement('div');
            container.innerHTML = `
                <div style="background:var(--bg-surface); border-radius:8px; padding:12px; margin-bottom:16px; border:1px solid var(--border-subtle);">
                     <div style="font-size:12px; font-weight:bold; color:var(--accent-primary); margin-bottom:4px; text-transform:uppercase;">${mech} System Rules</div>
                     <div style="font-size:11px; opacity:0.7;">Define the mathematical logic for actions in this system.</div>
                </div>
            `;

            const list = document.createElement('div');
            list.style.display = 'flex';
            list.style.flexDirection = 'column';
            list.style.gap = '12px';

            rules.forEach((rule, idx) => {
                const item = document.createElement('div');
                item.className = 'card';
                item.style.padding = '12px';
                item.innerHTML = `
                    <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                        <input class="input rule-name" value="${rule.name}" placeholder="Action Name" style="font-weight:bold; width:60%; border:none; padding:0; background:transparent;">
                        <button class="btn btn-xs btn-ghost btn-del-rule" style="color:var(--status-error);">✕</button>
                    </div>
                    <div style="display:flex; align-items:center; gap:6px; flex-wrap:nowrap; font-family:monospace; font-size:12px;">
                        <input class="input rule-roll" value="${rule.roll}" placeholder="Roll (1d20)" style="flex:2; min-width:50px; text-align:center;" title="Roll Formula">
                        <span>+</span>
                        <input class="input rule-mod" value="${rule.mod}" placeholder="Mod (Str)" style="flex:1; min-width:50px; text-align:center;" title="Modifier">
                        <input class="input rule-op" value="${rule.op || 'vs'}" placeholder="vs" style="width:34px; text-align:center; flex-shrink:0;" title="Operator">
                        <input class="input rule-target" value="${rule.target}" placeholder="Target (AC)" style="flex:1; min-width:50px; text-align:center;" title="Target Stat">
                        <span>+</span>
                        <input class="input rule-tmod" value="${rule.tmod || ''}" placeholder="T.Mod" style="flex:1; min-width:40px; text-align:center;" title="Target Modifier">
                    </div>
                `;

                // Bindings
                const updateRule = () => {
                    rule.name = /** @type {HTMLInputElement} */ (item.querySelector('.rule-name')).value;
                    rule.roll = /** @type {HTMLInputElement} */ (item.querySelector('.rule-roll')).value;
                    rule.mod = /** @type {HTMLInputElement} */ (item.querySelector('.rule-mod')).value;
                    rule.op = /** @type {HTMLInputElement} */ (item.querySelector('.rule-op')).value;
                    rule.target = /** @type {HTMLInputElement} */ (item.querySelector('.rule-target')).value;
                    rule.tmod = /** @type {HTMLInputElement} */ (item.querySelector('.rule-tmod')).value;
                    A.State.notify();
                };

                item.querySelectorAll('input').forEach(inp => inp.onchange = updateRule);
                /** @type {HTMLElement} */ (item.querySelector('.btn-del-rule')).onclick = () => {
                    if (confirm('Delete rule?')) {
                        rules.splice(idx, 1);
                        A.State.notify();
                        renderRules(target); // Re-render this tab
                    }
                };

                list.appendChild(item);
            });

            container.appendChild(list);

            const addBtn = document.createElement('button');
            addBtn.className = 'btn btn-sm btn-secondary';
            addBtn.style.width = '100%';
            addBtn.style.marginTop = '16px';
            addBtn.innerHTML = '+ Add Rule';
            addBtn.onclick = () => {
                rules.push({ name: 'New Action', roll: '1d20', mod: '', op: 'vs', target: '', tmod: '' });
                A.State.notify();
                renderRules(target);
            };
            container.appendChild(addBtn);

            target.innerHTML = '';
            target.appendChild(container);
        }

        // Init
        renderContent();
    }

    A.registerPanel('gamemaster', {
        label: 'Game Master',
        subtitle: 'RPG Engine',
        category: 'RPG Experiment',
        icon: '🎲',
        render: render
    });

})(window.Anansi);
