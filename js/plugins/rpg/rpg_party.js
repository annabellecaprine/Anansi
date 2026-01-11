/*
 * Anansi Panel: RPG Party
 * File: js/panels/rpg_party.js
 * Category: RPG Experiment
 * Purpose: Character sheet management with stats, equipment, feats, and visual stat display.
 */

(function (A) {
    'use strict';

    // --- Radar Renderer ---
    const AxisRadar = {};
    AxisRadar.renderRadar = function (w, h, labels, values, min, max) {
        var i, n = labels.length, cx = w / 2, cy = h / 2, r = Math.min(w, h) * 0.35;
        if (!n) return '<svg width="' + w + '" height="' + h + '"></svg>';
        var rng = (max - min) || 1;

        function norm(vals) {
            var out = [], j;
            for (j = 0; j < n; j++) {
                var v = (parseFloat(vals[j]) - min) / rng; if (isNaN(v)) v = 0; if (v < 0) v = 0; if (v > 1) v = 1; out.push(v);
            }
            return out;
        }
        var base = norm(values);

        var rings = 4, ringPaths = [], k, j;
        for (k = 1; k <= rings; k++) {
            var rr = r * k / rings, path = [];
            for (j = 0; j < n; j++) {
                var ang = (Math.PI * 2 * j / n) - Math.PI / 2;
                var x = cx + rr * Math.cos(ang), y = cy + rr * Math.sin(ang);
                path.push((j === 0 ? 'M' : 'L') + x.toFixed(1) + ' ' + y.toFixed(1));
            }
            path.push('Z');
            ringPaths.push('<path d="' + path.join(' ') + '" fill="none" stroke="currentColor" opacity="0.12" stroke-width="1"/>');
        }
        var spokes = [], lbls = [];
        for (i = 0; i < n; i++) {
            var ang2 = (Math.PI * 2 * i / n) - Math.PI / 2;
            var x2 = cx + r * Math.cos(ang2), y2 = cy + r * Math.sin(ang2);
            spokes.push('<line x1="' + cx + '" y1="' + cy + '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) + '" stroke="currentColor" opacity="0.18" stroke-width="1"/>');
            var lx = cx + (r + 20) * Math.cos(ang2), ly = cy + (r + 20) * Math.sin(ang2);
            lbls.push('<text x="' + lx.toFixed(1) + '" y="' + ly.toFixed(1) + '" font-size="11" fill="var(--text-secondary)" text-anchor="middle" dominant-baseline="middle" opacity="0.9">' + labels[i] + '</text>');
        }

        function poly(norm) {
            var pts = [], path = [], m;
            for (m = 0; m < n; m++) {
                var ang3 = (Math.PI * 2 * m / n) - Math.PI / 2, rr2 = r * norm[m];
                var px = cx + rr2 * Math.cos(ang3), py = cy + rr2 * Math.sin(ang3);
                pts.push(px.toFixed(1) + ',' + py.toFixed(1));
                path.push((m === 0 ? 'M' : 'L') + px.toFixed(1) + ' ' + py.toFixed(1));
            }
            path.push('Z');
            return { pts: pts.join(' '), d: path.join(' ') };
        }

        var basePoly = poly(base);

        return ''
            + '<svg viewBox="0 0 ' + w + ' ' + h + '" style="width:100%; height:auto; max-width:280px;" role="img">'
            + '<g fill="none" stroke="currentColor">' + ringPaths.join('') + spokes.join('') + '</g>'
            + '<polygon points="' + basePoly.pts + '" fill="var(--accent-primary)" opacity="0.15"></polygon>'
            + '<path d="' + basePoly.d + '" fill="none" stroke="var(--accent-primary)" stroke-width="2" opacity="0.8"></path>'
            + '<g fill="currentColor" stroke="none">' + lbls.join('') + '</g>'
            + '</svg>';
    };

    // --- Template Definitions ---
    const TEMPLATES = {
        'dnd': {
            label: 'D20 Stats',
            defs: [
                { key: 'STR', label: 'Strength', min: 1, max: 20 },
                { key: 'DEX', label: 'Dexterity', min: 1, max: 20 },
                { key: 'CON', label: 'Constitution', min: 1, max: 20 },
                { key: 'INT', label: 'Intelligence', min: 1, max: 20 },
                { key: 'WIS', label: 'Wisdom', min: 1, max: 20 },
                { key: 'CHA', label: 'Charisma', min: 1, max: 20 }
            ],
            defaults: { 'STR': 10, 'DEX': 10, 'CON': 10, 'INT': 10, 'WIS': 10, 'CHA': 10 }
        }
    };

    // Helper: Create progress bar
    function createResourceBar(current, max, color, label) {
        const pct = max > 0 ? Math.min(100, Math.max(0, (current / max) * 100)) : 0;
        return `
            <div style="margin-bottom:4px;">
                <div style="display:flex; justify-content:space-between; font-size:10px; margin-bottom:2px;">
                    <span style="opacity:0.7;">${label}</span>
                    <span style="font-weight:600;">${current}/${max}</span>
                </div>
                <div style="height:6px; background:var(--bg-inset); border-radius:3px; overflow:hidden;">
                    <div style="height:100%; width:${pct}%; background:${color}; border-radius:3px; transition:width 0.3s;"></div>
                </div>
            </div>
        `;
    }

    // Helper: Calculate modifier
    function calcMod(val) {
        const mod = Math.floor((val - 10) / 2);
        return mod >= 0 ? `+${mod}` : `${mod}`;
    }

    function render(container) {
        container.style.height = '100%';
        container.style.display = 'grid';
        container.style.gridTemplateColumns = '280px 1fr';
        container.style.gap = '0';
        container.style.overflow = 'hidden';
        container.style.background = 'var(--bg-base)';

        let currentActorId = null;

        // --- Sidebar ---
        const sidebar = document.createElement('div');
        sidebar.style.cssText = 'display:flex; flex-direction:column; background:var(--bg-surface); border-right:1px solid var(--border-subtle); overflow:hidden;';

        // Sidebar Header
        const sidebarHeader = document.createElement('div');
        sidebarHeader.style.cssText = 'display:flex; justify-content:space-between; align-items:center; padding:16px; border-bottom:1px solid var(--border-subtle);';
        sidebarHeader.innerHTML = `
            <span style="font-size:14px; font-weight:bold; text-transform:uppercase; letter-spacing:1px; color:var(--text-muted);">Party</span>
            <button id="btn-add-member" class="btn btn-xs btn-primary">+ Add</button>
        `;
        sidebar.appendChild(sidebarHeader);

        const actorsList = document.createElement('div');
        actorsList.style.cssText = 'flex:1; overflow-y:auto; padding:8px;';
        sidebar.appendChild(actorsList);

        container.appendChild(sidebar);

        // --- Main Content ---
        const main = document.createElement('div');
        main.style.cssText = 'display:flex; flex-direction:column; overflow:hidden;';
        container.appendChild(main);

        // --- Functions ---

        // --- Functions ---

        function getPartyMembers() {
            // New: Get from isolated entities
            return RPG.Entities.getAll().filter(e => e.type === 'party_member');
        }

        function refreshSidebar() {
            actorsList.innerHTML = '';
            const state = A.State.get();
            const members = getPartyMembers();

            if (members.length === 0) {
                actorsList.innerHTML = `
                    <div style="padding:20px; text-align:center; color:var(--text-muted); font-size:12px;">
                        <div style="font-size:32px; margin-bottom:8px; opacity:0.5;">🛡️</div>
                        No party members yet.<br>Add actors from your project.
                    </div>
                `;
                return;
            }

            if (!currentActorId && members.length > 0) {
                currentActorId = members[0].id; // internal ID
            }

            members.forEach(entity => {
                // Compatibility: entity IS the rpg data now
                const isSelected = entity.id === currentActorId;
                const isLeader = state.rpg?.partyLeader === entity.id;
                const hpPct = entity.maxHp > 0 ? Math.round((entity.hp / entity.maxHp) * 100) : 0;
                const mpPct = entity.maxMp > 0 ? Math.round((entity.mp / entity.maxMp) * 100) : 0;

                const item = document.createElement('div');
                item.style.cssText = `
                    padding:12px; border-radius:8px; cursor:pointer; margin-bottom:6px; transition:all 0.15s;
                    background:${isSelected ? 'var(--bg-elevated)' : 'transparent'};
                    border:2px solid ${isSelected ? 'var(--accent-primary)' : (isLeader ? 'gold' : 'transparent')};
                `;

                item.innerHTML = `
                    <div style="display:flex; align-items:center; gap:10px; margin-bottom:8px;">
                        <div style="width:40px; height:40px; border-radius:50%; background:var(--bg-inset); display:flex; align-items:center; justify-content:center; font-size:18px; flex-shrink:0; position:relative;">
                            ${entity.type === 'npc' ? '👤' : '⚔️'}
                            ${isLeader ? '<span style="position:absolute; top:-6px; right:-6px; font-size:14px;">👑</span>' : ''}
                        </div>
                        <div style="flex:1; min-width:0;">
                            <div style="font-weight:bold; font-size:13px; color:${isSelected ? 'var(--accent-primary)' : 'var(--text-primary)'}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                                ${entity.name}${isLeader ? ' <span style="font-size:10px; color:gold;">(Leader)</span>' : ''}
                            </div>
                            <div style="font-size:10px; color:var(--text-muted);">
                                Lvl ${entity.stats?.level || 1} ${entity.stats?.class || entity.class || 'Adventurer'}
                                <span style="margin-left:6px; color:var(--accent-warning);">💰 ${entity.currency || 0}</span>
                            </div>
                        </div>
                        ${!isLeader && isSelected ? `<button class="btn btn-sm btn-ghost" style="font-size:10px; padding:4px 8px;" data-set-leader="${entity.id}" title="Set as Party Leader">👑</button>` : ''}
                    </div>
                    <div style="display:flex; gap:8px;">
                        <div style="flex:1;">
                            <div style="height:4px; background:var(--bg-inset); border-radius:2px; overflow:hidden;">
                                <div style="height:100%; width:${hpPct}%; background:var(--status-error); border-radius:2px;"></div>
                            </div>
                        </div>
                        <div style="flex:1;">
                            <div style="height:4px; background:var(--bg-inset); border-radius:2px; overflow:hidden;">
                                <div style="height:100%; width:${mpPct}%; background:var(--accent-primary); border-radius:2px;"></div>
                            </div>
                        </div>
                    </div>
                `;

                if (!isSelected) {
                    item.onmouseenter = () => { item.style.background = 'var(--bg-hover)'; };
                    item.onmouseleave = () => { item.style.background = 'transparent'; };
                }

                item.onclick = (e) => {
                    // Check if Set Leader button was clicked
                    if (e.target.dataset?.setLeader) {
                        if (!state.rpg) state.rpg = {};
                        state.rpg.partyLeader = e.target.dataset.setLeader;
                        A.State.notify();
                        A.UI?.Toast?.show(`${entity.name} is now the Party Leader!`, 'success');
                        refreshSidebar();
                        return;
                    }
                    currentActorId = entity.id;
                    refreshSidebar();
                    refreshMain();
                };

                actorsList.appendChild(item);
            });
        }

        function refreshMain() {
            main.innerHTML = '';
            const state = A.State.get();

            const members = getPartyMembers();
            const entity = members.find(a => a.id === currentActorId);

            if (!entity) {
                main.innerHTML = `
                    <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; color:var(--text-muted); opacity:0.7;">
                        <span style="font-size:48px; margin-bottom:16px;">🛡️</span>
                        <div style="font-size:14px;">Select a character to view their sheet</div>
                    </div>
                `;
                return;
            }

            // MAPPING: entity is the root now
            const rpg = entity; // Alias for minimal code change
            if (!rpg.stats) rpg.stats = {};
            if (!rpg.stats_matrix) rpg.stats_matrix = { blocks: [], values: {} };
            if (!rpg.inventory) rpg.inventory = [];
            if (!rpg.equipped) rpg.equipped = { main_hand: null, off_hand: null, armor: null };
            if (typeof rpg.currency === 'undefined') rpg.currency = 0;
            if (!rpg.feats) rpg.feats = [];
            const matrix = rpg.stats_matrix;

            // --- Character Header ---
            const header = document.createElement('div');
            header.style.cssText = 'padding:20px 24px; border-bottom:1px solid var(--border-subtle); background:var(--bg-elevated);';
            header.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <div style="display:flex; gap:16px; align-items:center;">
                        <div style="width:64px; height:64px; border-radius:12px; background:var(--bg-surface); display:flex; align-items:center; justify-content:center; font-size:32px; border:2px solid var(--border-subtle);">
                            ${rpg.type === 'npc' ? '👤' : '⚔️'}
                        </div>
                        <div>
                            <h2 style="margin:0; font-size:20px; font-weight:bold;">${entity.name}</h2>
                            <div style="display:flex; gap:12px; margin-top:4px; font-size:12px; color:var(--text-muted);">
                                <span>Level <strong style="color:var(--text-primary);">${rpg.stats.level || 1}</strong></span>
                                <span>${rpg.stats.class || rpg.class || 'Adventurer'}</span>
                                <span>XP: ${rpg.stats.xp || 0}/${rpg.stats.xp_next || 1000}</span>
                            </div>
                        </div>
                    </div>
                    <div style="display:flex; gap:8px;">
                        ${state.rpg.partyLeader === entity.id ? `<button id="btn-pool-gold" class="btn btn-sm btn-primary" title="Collect all gold from other party members">💰 Pool Gold</button>` : ''}
                        <button id="btn-add-stats" class="btn btn-sm btn-secondary">+ D20 Stats</button>
                        <button id="btn-remove" class="btn btn-sm btn-ghost" style="color:var(--status-error);">Remove</button>
                    </div>
                </div>
            `;
            main.appendChild(header);

            // Wire Pool Gold
            const btnPoolGold = header.querySelector('#btn-pool-gold');
            if (btnPoolGold) {
                btnPoolGold.onclick = () => {
                    if (!confirm('Collect all gold from other party members to the leader?')) return;
                    let total = 0;
                    getPartyMembers().forEach(m => {
                        if (m.id !== entity.id) {
                            total += (m.currency || 0);
                            m.currency = 0;
                        }
                    });
                    if (total > 0) {
                        entity.currency = (entity.currency || 0) + total;
                        A.State.notify();
                        refreshSidebar();
                        refreshMain();
                        if (A.UI?.Toast) A.UI.Toast.show(`Collected ${total} gold!`, 'success');
                    } else {
                        if (A.UI?.Toast) A.UI.Toast.show('No gold to collect.', 'neutral');
                    }
                };
            }


            // --- Content ---
            const content = document.createElement('div');
            content.style.cssText = 'flex:1; overflow-y:auto; padding:24px; display:flex; flex-direction:column; gap:24px;';
            main.appendChild(content);

            // === ROW 1: Resources & Core Stats ===
            const row1 = document.createElement('div');
            row1.style.cssText = 'display:grid; grid-template-columns:1fr 1fr; gap:16px;';

            // Left: Resource Bars
            const resourcesCard = document.createElement('div');
            resourcesCard.className = 'card';
            resourcesCard.style.padding = '16px';
            resourcesCard.innerHTML = `
                <h4 style="margin:0 0 12px; font-size:12px; text-transform:uppercase; color:var(--text-muted); letter-spacing:1px;">Resources</h4>
                ${createResourceBar(rpg.hp || 0, rpg.maxHp || 20, 'var(--status-error)', '❤️ Health')}
                ${createResourceBar(rpg.mp || 0, rpg.maxMp || 10, 'var(--accent-primary)', '💎 Mana')}
                <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:8px; margin-top:12px;">
                    <div style="text-align:center; padding:8px; background:var(--bg-surface); border-radius:6px;">
                        <div style="font-size:18px; font-weight:bold; color:var(--status-error);">${rpg.hp || 0}/${rpg.maxHp || 20}</div>
                        <div style="font-size:10px; color:var(--text-muted);">HP</div>
                    </div>
                    <div style="text-align:center; padding:8px; background:var(--bg-surface); border-radius:6px;">
                        <div style="font-size:18px; font-weight:bold; color:var(--accent-primary);">${rpg.mp || 0}/${rpg.maxMp || 10}</div>
                        <div style="font-size:10px; color:var(--text-muted);">MP</div>
                    </div>
                    <div style="text-align:center; padding:8px; background:var(--bg-surface); border-radius:6px;">
                        <div style="font-size:18px; font-weight:bold; color:var(--text-primary);">${rpg.ac || 10}</div>
                        <div style="font-size:10px; color:var(--text-muted);">AC</div>
                    </div>
                </div>
            `;
            row1.appendChild(resourcesCard);

            // Right: Quick Edit
            const editCard = document.createElement('div');
            editCard.className = 'card';
            editCard.style.padding = '16px';
            editCard.innerHTML = `
                <h4 style="margin:0 0 12px; font-size:12px; text-transform:uppercase; color:var(--text-muted); letter-spacing:1px;">Quick Edit</h4>
                <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:8px;">
                    <div>
                        <label style="font-size:10px; color:var(--text-muted);">HP</label>
                        <input type="number" id="edit-hp" class="input" style="width:100%;" value="${rpg.hp || 0}">
                    </div>
                    <div>
                        <label style="font-size:10px; color:var(--text-muted);">Max HP</label>
                        <input type="number" id="edit-maxhp" class="input" style="width:100%;" value="${rpg.maxHp || 20}">
                    </div>
                    <div>
                        <label style="font-size:10px; color:var(--text-muted);">AC</label>
                        <input type="number" id="edit-ac" class="input" style="width:100%;" value="${rpg.ac || 10}">
                    </div>
                    <div>
                        <label style="font-size:10px; color:var(--text-muted);">MP</label>
                        <input type="number" id="edit-mp" class="input" style="width:100%;" value="${rpg.mp || 0}">
                    </div>
                    <div>
                        <label style="font-size:10px; color:var(--text-muted);">Max MP</label>
                        <input type="number" id="edit-maxmp" class="input" style="width:100%;" value="${rpg.maxMp || 10}">
                    </div>
                    <div>
                        <label style="font-size:10px; color:var(--text-muted);">Level</label>
                        <input type="number" id="edit-level" class="input" style="width:100%;" value="${rpg.stats.level || 1}">
                    </div>
                    <div>
                        <label style="font-size:10px; color:var(--text-muted);">Main Actions</label>
                        <input type="number" id="edit-maxactions" class="input" style="width:100%;" value="${rpg.maxActions || 1}" min="0" max="10">
                    </div>
                    <div>
                        <input type="number" id="edit-maxbonusactions" class="input" style="width:100%;" value="${rpg.maxBonusActions || 1}" min="0" max="10">
                    </div>
                    <div>
                        <label style="font-size:10px; color:var(--text-muted);">Currency (gp)</label>
                        <input type="number" id="edit-currency" class="input" style="width:100%;" value="${rpg.currency || 0}" min="0">
                    </div>
                </div>
                <div style="margin-top:12px;">
                    <label style="font-size:10px; color:var(--text-muted);">Class</label>
                    <input type="text" id="edit-class" class="input" style="width:100%;" value="${rpg.stats.class || rpg.class || ''}" placeholder="e.g. Fighter, Wizard">
                </div>
            `;
            row1.appendChild(editCard);
            content.appendChild(row1);

            // Wire quick edit
            const wireInput = (id, key, isStats = false, transform = parseInt) => {
                const el = editCard.querySelector(`#${id}`);
                if (el) {
                    el.onchange = (e) => {
                        const val = transform(e.target.value);
                        if (isStats) {
                            if (!rpg.stats) rpg.stats = {};
                            rpg.stats[key] = val;
                        } else {
                            rpg[key] = val;
                        }
                        A.State.notify();
                        refreshSidebar();
                        refreshMain();
                    };
                }
            };
            wireInput('edit-hp', 'hp');
            wireInput('edit-maxhp', 'maxHp');
            wireInput('edit-ac', 'ac');
            wireInput('edit-mp', 'mp');
            wireInput('edit-maxmp', 'maxMp');
            wireInput('edit-level', 'level', true);
            wireInput('edit-maxactions', 'maxActions');
            wireInput('edit-maxbonusactions', 'maxBonusActions');
            wireInput('edit-currency', 'currency');
            wireInput('edit-class', 'class', true, v => v);

            // === ROW 2: Ability Scores & Radar ===
            if (matrix.blocks.length > 0) {
                const row2 = document.createElement('div');
                row2.style.cssText = 'display:grid; grid-template-columns:1fr 300px; gap:16px;';

                // Stats Grid
                const statsCard = document.createElement('div');
                statsCard.className = 'card';
                statsCard.style.padding = '16px';

                matrix.blocks.forEach((block, bIdx) => {
                    if (!matrix.values[block.id]) matrix.values[block.id] = {};
                    const vals = matrix.values[block.id];

                    const blockDiv = document.createElement('div');
                    blockDiv.innerHTML = `
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                            <h4 style="margin:0; font-size:12px; text-transform:uppercase; color:var(--text-muted); letter-spacing:1px;">${block.label}</h4>
                            <button class="btn btn-xs btn-ghost btn-remove-block" data-idx="${bIdx}" style="color:var(--status-error); font-size:10px;">Remove</button>
                        </div>
                    `;

                    const grid = document.createElement('div');
                    grid.style.cssText = 'display:grid; grid-template-columns:repeat(6, 1fr); gap:8px;';

                    block.defs.forEach(def => {
                        const val = vals[def.key] !== undefined ? vals[def.key] : 10;
                        const statBox = document.createElement('div');
                        statBox.style.cssText = 'text-align:center; padding:12px 8px; background:var(--bg-surface); border-radius:8px;';
                        statBox.innerHTML = `
                            <div style="font-size:10px; font-weight:bold; color:var(--text-muted); margin-bottom:4px;">${def.key}</div>
                            <input type="number" class="stat-input" data-block="${block.id}" data-key="${def.key}" 
                                style="width:100%; text-align:center; font-size:18px; font-weight:bold; background:transparent; border:none; color:var(--text-primary);" 
                                value="${val}" min="${def.min}" max="${def.max}">
                            <div class="stat-mod" style="font-size:11px; color:var(--accent-primary); margin-top:2px;">${calcMod(val)}</div>
                        `;
                        grid.appendChild(statBox);
                    });

                    blockDiv.appendChild(grid);
                    statsCard.appendChild(blockDiv);
                });

                row2.appendChild(statsCard);

                // Radar Chart
                const radarCard = document.createElement('div');
                radarCard.className = 'card';
                radarCard.style.cssText = 'padding:16px; display:flex; align-items:center; justify-content:center;';
                radarCard.id = 'radar-container';
                row2.appendChild(radarCard);

                content.appendChild(row2);

                // Wire stat inputs
                statsCard.querySelectorAll('.stat-input').forEach(input => {
                    input.oninput = (e) => {
                        const blockId = e.target.dataset.block;
                        const key = e.target.dataset.key;
                        const val = parseInt(e.target.value) || 10;
                        matrix.values[blockId][key] = val;
                        e.target.parentElement.querySelector('.stat-mod').textContent = calcMod(val);
                        A.State.notify();
                        updateRadar(radarCard);
                    };
                });

                // Wire remove block
                statsCard.querySelectorAll('.btn-remove-block').forEach(btn => {
                    btn.onclick = () => {
                        if (confirm('Remove this stat block?')) {
                            matrix.blocks.splice(parseInt(btn.dataset.idx), 1);
                            A.State.notify();
                            refreshMain();
                        }
                    };
                });

                updateRadar(radarCard);
            }

            // === ROW 3: Equipment & Feats ===
            const row3 = document.createElement('div');
            row3.style.cssText = 'display:grid; grid-template-columns:1fr 1fr; gap:16px;';

            // Equipment
            const equipCard = document.createElement('div');
            equipCard.className = 'card';
            equipCard.style.padding = '16px';
            equipCard.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                    <h4 style="margin:0; font-size:12px; text-transform:uppercase; color:var(--text-muted); letter-spacing:1px;">🎒 Equipment</h4>
                    <button id="btn-add-item" class="btn btn-xs btn-ghost">+ Add</button>
                </div>
                <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:8px; margin-bottom:12px;">
                    <div style="text-align:center; padding:8px; background:var(--bg-surface); border-radius:6px; border:1px dashed var(--border-subtle);">
                        <div style="font-size:16px;">⚔️</div>
                        <div id="slot-main" style="font-size:11px; font-weight:bold; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">-</div>
                        <div style="font-size:9px; color:var(--text-muted);">Main Hand</div>
                    </div>
                    <div style="text-align:center; padding:8px; background:var(--bg-surface); border-radius:6px; border:1px dashed var(--border-subtle);">
                        <div style="font-size:16px;">🛡️</div>
                        <div id="slot-off" style="font-size:11px; font-weight:bold; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">-</div>
                        <div style="font-size:9px; color:var(--text-muted);">Off Hand</div>
                    </div>
                    <div style="text-align:center; padding:8px; background:var(--bg-surface); border-radius:6px; border:1px dashed var(--border-subtle);">
                        <div style="font-size:16px;">🥋</div>
                        <div id="slot-armor" style="font-size:11px; font-weight:bold; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">-</div>
                        <div style="font-size:9px; color:var(--text-muted);">Armor</div>
                    </div>
                </div>
                <div id="inv-list" style="display:flex; flex-direction:column; gap:4px; max-height:150px; overflow-y:auto;"></div>
            `;
            row3.appendChild(equipCard);

            // Feats
            const featsCard = document.createElement('div');
            featsCard.className = 'card';
            featsCard.style.padding = '16px';
            featsCard.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                    <h4 style="margin:0; font-size:12px; text-transform:uppercase; color:var(--text-muted); letter-spacing:1px;">✨ Feats & Abilities</h4>
                    <button id="btn-add-feat" class="btn btn-xs btn-ghost">+ Add</button>
                </div>
                <div id="feats-list" style="display:flex; flex-direction:column; gap:4px; max-height:200px; overflow-y:auto;"></div>
            `;
            row3.appendChild(featsCard);
            content.appendChild(row3);

            // --- Equipment Logic ---
            const updateInventoryUI = () => {
                const invList = equipCard.querySelector('#inv-list');
                const slotMain = equipCard.querySelector('#slot-main');
                const slotOff = equipCard.querySelector('#slot-off');
                const slotArmor = equipCard.querySelector('#slot-armor');

                const getItemName = (id) => {
                    if (!id) return '-';
                    const armory = A.State.get().rpg?.items || [];
                    const itm = armory.find(i => i.id === id);
                    return itm ? itm.name : id;
                };

                slotMain.textContent = getItemName(rpg.equipped.main_hand);
                slotOff.textContent = getItemName(rpg.equipped.off_hand);
                slotArmor.textContent = getItemName(rpg.equipped.armor);

                invList.innerHTML = '';
                if (rpg.inventory.length === 0) {
                    invList.innerHTML = '<div style="color:var(--text-muted); font-size:11px; font-style:italic; text-align:center; padding:12px;">Inventory empty</div>';
                    return;
                }

                rpg.inventory.forEach((itemId, idx) => {
                    const armory = A.State.get().rpg?.items || [];
                    const itemData = armory.find(i => i.id === itemId) || { name: 'Unknown', type: 'misc', id: itemId };

                    const isMain = rpg.equipped.main_hand === itemId;
                    const isOff = rpg.equipped.off_hand === itemId;
                    const isArmor = rpg.equipped.armor === itemId;
                    const isEquipped = isMain || isOff || isArmor;

                    const row = document.createElement('div');
                    row.style.cssText = 'display:flex; justify-content:space-between; align-items:center; padding:6px 8px; background:var(--bg-surface); border-radius:4px; font-size:11px;';

                    const icon = itemData.type === 'weapon' ? '⚔️' : itemData.type === 'armor' ? '🛡️' : '📦';
                    const equipped = isMain ? '(Main)' : isOff ? '(Off)' : isArmor ? '(Worn)' : '';

                    row.innerHTML = `
                        <span>${icon} ${itemData.name} <span style="color:var(--accent-primary);">${equipped}</span></span>
                        <div style="display:flex; gap:4px;">
                            ${(itemData.type === 'weapon' || itemData.type === 'armor') ? `<button class="btn-eq btn btn-xs btn-ghost">${isEquipped ? 'Unequip' : 'Equip'}</button>` : ''}
                            <button class="btn-drop btn btn-xs btn-ghost" style="color:var(--status-error);">✕</button>
                        </div>
                    `;

                    const eqBtn = row.querySelector('.btn-eq');
                    if (eqBtn) {
                        eqBtn.onclick = () => {
                            if (isEquipped) {
                                if (isMain) rpg.equipped.main_hand = null;
                                if (isOff) rpg.equipped.off_hand = null;
                                if (isArmor) rpg.equipped.armor = null;
                            } else {
                                if (itemData.type === 'weapon') {
                                    if (!rpg.equipped.main_hand) rpg.equipped.main_hand = itemId;
                                    else if (!rpg.equipped.off_hand) rpg.equipped.off_hand = itemId;
                                    else rpg.equipped.main_hand = itemId;
                                } else if (itemData.type === 'armor') {
                                    rpg.equipped.armor = itemId;
                                }
                            }
                            A.State.notify();
                            updateInventoryUI();
                        };
                    }

                    row.querySelector('.btn-drop').onclick = () => {
                        if (isMain) rpg.equipped.main_hand = null;
                        if (isOff) rpg.equipped.off_hand = null;
                        if (isArmor) rpg.equipped.armor = null;
                        rpg.inventory.splice(idx, 1);
                        A.State.notify();
                        updateInventoryUI();
                    };

                    invList.appendChild(row);
                });
            };
            updateInventoryUI();

            // Add Item
            equipCard.querySelector('#btn-add-item').onclick = () => {
                const armory = A.State.get().rpg?.items || [];
                if (armory.length === 0) {
                    if (A.UI.Toast) A.UI.Toast.show('Armory is empty. Define items first.', 'warning');
                    return;
                }

                const modalContent = document.createElement('div');
                modalContent.innerHTML = `
                    <input class="input" placeholder="Search..." id="item-search" style="width:100%; margin-bottom:12px;">
                    <div id="item-list" style="max-height:300px; overflow-y:auto; display:flex; flex-direction:column; gap:4px;"></div>
                `;

                const renderItems = (filter = '') => {
                    const list = modalContent.querySelector('#item-list');
                    list.innerHTML = '';
                    armory.filter(i => i.name.toLowerCase().includes(filter.toLowerCase())).forEach(item => {
                        const btn = document.createElement('button');
                        btn.className = 'btn btn-ghost';
                        btn.style.cssText = 'text-align:left; padding:8px;';
                        btn.innerHTML = `<strong>${item.name}</strong> <span style="opacity:0.6;">(${item.type})</span>`;
                        btn.onclick = () => {
                            rpg.inventory.push(item.id);
                            A.State.notify();
                            updateInventoryUI();
                            A.UI.Modal.hide();
                        };
                        list.appendChild(btn);
                    });
                };

                A.UI.Modal.show({
                    title: '🎒 Add to Inventory',
                    content: modalContent,
                    width: 350
                });

                modalContent.querySelector('#item-search').oninput = (e) => renderItems(e.target.value);
                renderItems();
            };

            // --- Feats Logic ---
            const updateFeatsUI = () => {
                const state = A.State.get();
                const featDb = state.rpg?.featDatabase || [];
                const featsList = featsCard.querySelector('#feats-list');
                featsList.innerHTML = '';

                if (rpg.feats.length === 0) {
                    featsList.innerHTML = '<div style="color:var(--text-muted); font-size:11px; font-style:italic; text-align:center; padding:12px;">No feats assigned</div>';
                    return;
                }

                rpg.feats.forEach((featId, idx) => {
                    const feat = featDb.find(f => f.id === featId) || { id: featId, name: featId, type: 'unknown' };
                    const icon = feat.type === 'spell' ? '✨' : feat.type === 'ability' ? '⚡' : feat.type === 'reaction' ? '🛡️' : '📜';

                    const row = document.createElement('div');
                    row.style.cssText = 'display:flex; justify-content:space-between; align-items:center; padding:8px 10px; background:var(--bg-surface); border-radius:4px;';
                    row.innerHTML = `
                        <div>
                            <div style="font-size:12px; font-weight:bold;">${icon} ${feat.name}</div>
                            ${feat.shortDesc ? `<div style="font-size:10px; color:var(--text-muted);">${feat.shortDesc}</div>` : ''}
                        </div>
                        <button class="btn btn-xs btn-ghost" style="color:var(--status-error);">✕</button>
                    `;
                    row.querySelector('button').onclick = () => {
                        rpg.feats.splice(idx, 1);
                        A.State.notify();
                        updateFeatsUI();
                    };
                    featsList.appendChild(row);
                });
            };
            updateFeatsUI();

            // Add Feat
            featsCard.querySelector('#btn-add-feat').onclick = () => {
                const state = A.State.get();
                const featDb = state.rpg?.featDatabase || [];

                if (featDb.length === 0) {
                    if (A.UI.Toast) A.UI.Toast.show('No feats defined. Create some in the Feats panel.', 'warning');
                    return;
                }

                const modalContent = document.createElement('div');
                modalContent.style.cssText = 'display:flex; flex-direction:column; gap:8px; max-height:400px; overflow-y:auto;';

                featDb.forEach(feat => {
                    const has = rpg.feats.includes(feat.id);
                    const icon = feat.type === 'spell' ? '✨' : feat.type === 'ability' ? '⚡' : feat.type === 'reaction' ? '🛡️' : '📜';
                    const btn = document.createElement('button');
                    btn.className = 'btn btn-ghost';
                    btn.disabled = has;
                    btn.style.cssText = `text-align:left; padding:10px; ${has ? 'opacity:0.5;' : ''}`;
                    btn.innerHTML = `
                        <div style="font-weight:bold;">${icon} ${feat.name}</div>
                        <div style="font-size:11px; opacity:0.7;">${feat.shortDesc || feat.description?.substring(0, 50) || ''}</div>
                    `;
                    btn.onclick = () => {
                        rpg.feats.push(feat.id);
                        A.State.notify();
                        updateFeatsUI();
                        A.UI.Modal.hide();
                    };
                    modalContent.appendChild(btn);
                });

                A.UI.Modal.show({
                    title: '✨ Add Feat',
                    content: modalContent,
                    width: 400
                });
            };

            // --- Header Actions ---
            header.querySelector('#btn-add-stats').onclick = () => {
                if (matrix.blocks.find(b => b.id === 'dnd')) {
                    if (A.UI.Toast) A.UI.Toast.show('D20 Stats block already exists.', 'info');
                    return;
                }
                const tpl = TEMPLATES['dnd'];
                matrix.blocks.push({ id: 'dnd', label: tpl.label, defs: JSON.parse(JSON.stringify(tpl.defs)) });
                matrix.values['dnd'] = { ...tpl.defaults };
                A.State.notify();
                refreshMain();
            };

            header.querySelector('#btn-remove').onclick = () => {
                if (confirm(`Remove ${entity.name} from the party? (Data is preserved)`)) {
                    RPG.Entities.remove(entity.id);
                    currentActorId = null;
                    refreshSidebar();
                    refreshMain();
                }
            };
        }

        function updateRadar(container) {
            const members = getPartyMembers();
            const entity = members.find(a => a.id === currentActorId);
            if (!entity || !entity.stats_matrix || entity.stats_matrix.blocks.length === 0) {
                container.innerHTML = '<div style="color:var(--text-muted); font-size:11px;">Add stats to view chart</div>';
                return;
            }

            const matrix = entity.stats_matrix;
            const block = matrix.blocks[0];
            if (!block) return;

            const vals = matrix.values[block.id] || {};
            const labels = block.defs.map(d => d.key);
            const values = block.defs.map(d => vals[d.key] !== undefined ? vals[d.key] : 10);
            const min = block.defs[0].min || 1;
            const max = block.defs[0].max || 20;

            container.innerHTML = AxisRadar.renderRadar(280, 280, labels, values, min, max);
        }

        // --- Add Member ---
        sidebarHeader.querySelector('#btn-add-member').onclick = () => {
            const allActors = RPG.Hooks.getActors(); // Returns object
            const entities = RPG.Entities.getAll();

            // Filter actors that are NOT already linked to an entity
            const nonParty = Object.values(allActors).filter(a =>
                !entities.some(e => e.sourceActorId === a.id)
            );

            if (nonParty.length === 0) {
                if (A.UI.Toast) A.UI.Toast.show('All actors are already in the party.', 'info');
                return;
            }

            const modalContent = document.createElement('div');
            modalContent.style.cssText = 'display:flex; flex-direction:column; gap:6px;';

            nonParty.forEach(a => {
                const btn = document.createElement('button');
                btn.className = 'btn btn-ghost';
                btn.style.cssText = 'text-align:left; padding:10px;';
                btn.textContent = a.name;
                btn.onclick = () => {
                    // Create new entity linked to this actor
                    const newId = RPG.Entities.create({
                        type: 'party_member',
                        name: a.name,
                        hp: 20, maxHp: 20,
                        mp: 10, maxMp: 10,
                        ac: 10,
                        stats: { level: 1, class: '' }
                    }, a.id);

                    if (newId) {
                        currentActorId = newId;
                        refreshSidebar();
                        refreshMain();
                        A.UI.Modal.hide();
                    }
                };
                modalContent.appendChild(btn);
            });

            A.UI.Modal.show({
                title: '➕ Add to Party',
                content: modalContent,
                width: 300
            });
        };

        // Init
        refreshSidebar();
        if (getPartyMembers().length > 0) {
            refreshMain();
        }
    }

    A.registerPanel('rpg_party', {
        label: 'Party',
        subtitle: 'Character Sheets',
        category: 'RPG Experiment',
        order: 2,
        icon: '🛡️',
        render: render
    });

})(window.Anansi);
