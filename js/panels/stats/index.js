/*
 * Anansi Panel: Stats & Axis
 * File: js/panels/stats.js
 * Category: Forbidden Secrets
 */

(function (A) {
    'use strict';

    // --- Radar Renderer (Ported) ---
    const AxisRadar = {};
    AxisRadar.renderRadar = function (w, h, labels, values, min, max) {
        const n = labels.length, cx = w / 2, cy = h / 2, r = Math.min(w, h) * 0.44;
        if (!n) return '<svg width="' + w + '" height="' + h + '"></svg>';
        const rng = (max - min) || 1;

        function norm(vals) {
            const out = [];
            for (let j = 0; j < n; j++) {
                let v = (parseFloat(vals[j]) - min) / rng;
                if (isNaN(v)) v = 0;
                if (v < 0) v = 0;
                if (v > 1) v = 1;
                out.push(v);
            }
            return out;
        }
        const base = norm(values);

        const rings = 4, ringPaths = [];
        for (let k = 1; k <= rings; k++) {
            const rr = r * k / rings, path = [];
            for (let j = 0; j < n; j++) {
                const ang = (Math.PI * 2 * j / n) - Math.PI / 2;
                const x = cx + rr * Math.cos(ang), y = cy + rr * Math.sin(ang);
                path.push((j === 0 ? 'M' : 'L') + x.toFixed(1) + ' ' + y.toFixed(1));
            }
            path.push('Z');
            ringPaths.push('<path d="' + path.join(' ') + '" fill="none" stroke="currentColor" opacity="0.12" stroke-width="1"/>');
        }

        const spokes = [], lbls = [];
        for (let i = 0; i < n; i++) {
            const ang2 = (Math.PI * 2 * i / n) - Math.PI / 2;
            const x2 = cx + r * Math.cos(ang2), y2 = cy + r * Math.sin(ang2);
            spokes.push('<line x1="' + cx + '" y1="' + cy + '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) + '" stroke="currentColor" opacity="0.18" stroke-width="1"/>');

            const lx = cx + (r + 20) * Math.cos(ang2), ly = cy + (r + 20) * Math.sin(ang2);
            // Anchor logic (unused but kept for layout reference or future tweaks)
            /*
            let anchor = 'middle';
            if (i === 0) anchor = 'middle';
            else if (i < n / 2) anchor = 'start';
            else if (i === n / 2) anchor = 'middle';
            else anchor = 'end';
            */

            lbls.push('<text x="' + lx.toFixed(1) + '" y="' + ly.toFixed(1) + '" font-size="11" fill="var(--text-secondary)" text-anchor="middle" dominant-baseline="middle" opacity="0.9">' + labels[i] + '</text>');
        }

        function poly(norm) {
            const pts = [], path = [];
            for (let m = 0; m < n; m++) {
                const ang3 = (Math.PI * 2 * m / n) - Math.PI / 2, rr2 = r * norm[m];
                const px = cx + rr2 * Math.cos(ang3), py = cy + rr2 * Math.sin(ang3);
                pts.push(px.toFixed(1) + ',' + py.toFixed(1));
                path.push((m === 0 ? 'M' : 'L') + px.toFixed(1) + ' ' + py.toFixed(1));
            }
            path.push('Z');
            return { pts: pts.join(' '), d: path.join(' ') };
        }

        const basePoly = poly(base);

        return ''
            + '<svg width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-hidden="false">'
            + '<g fill="none" stroke="currentColor">' + ringPaths.join('') + spokes.join('') + '</g>'
            + '<polygon points="' + basePoly.pts + '" fill="var(--accent-primary)" opacity="0.15"></polygon>'
            + '<path d="' + basePoly.d + '" fill="none" stroke="var(--accent-primary)" stroke-width="2" opacity="0.8"></path>'
            + '<g fill="currentColor" stroke="none">' + lbls.join('') + '</g>'
            + '</svg>';
    };

    // --- Panel Logic ---
    const TEMPLATES = {
        'dnd': {
            label: 'D&D Stats',
            defs: [
                { key: 'STR', label: 'Strength', min: 1, max: 20 },
                { key: 'DEX', label: 'Dexterity', min: 1, max: 20 },
                { key: 'CON', label: 'Constitution', min: 1, max: 20 },
                { key: 'INT', label: 'Intelligence', min: 1, max: 20 },
                { key: 'WIS', label: 'Wisdom', min: 1, max: 20 },
                { key: 'CHA', label: 'Charisma', min: 1, max: 20 }
            ],
            defaults: { 'STR': 10, 'DEX': 10, 'CON': 10, 'INT': 10, 'WIS': 10, 'CHA': 10 }
        },
        'big5': {
            label: 'Big 5 (OCEAN)',
            defs: [
                { key: 'O', label: 'Openness', min: 0, max: 100 },
                { key: 'C', label: 'Conscientiousness', min: 0, max: 100 },
                { key: 'E', label: 'Extraversion', min: 0, max: 100 },
                { key: 'A', label: 'Agreeableness', min: 0, max: 100 },
                { key: 'N', label: 'Neuroticism', min: 0, max: 100 }
            ],
            defaults: { 'O': 50, 'C': 50, 'E': 50, 'A': 50, 'N': 50 }
        },
        'vadf': {
            label: 'Core (VADF)',
            defs: [
                { key: 'V', label: 'Valence', min: 0, max: 10 },
                { key: 'A', label: 'Arousal', min: 0, max: 10 },
                { key: 'D', label: 'Dominance', min: 0, max: 10 },
                { key: 'F', label: 'Faith', min: 0, max: 10 }
            ],
            defaults: { 'V': 5, 'A': 5, 'D': 5, 'F': 5 }
        }
    };

    function render(container) {
        const state = A.State.get();
        if (!state.weaves) state.weaves = {};

        // Ensure New Structure
        if (!state.weaves.stats || !state.weaves.stats.blocks) {
            state.weaves.stats = {
                blocks: [], // { id, label, defs: [] }
                values: {}  // { targetId: { blockId: { key: val } } }
            };
        }
        const data = state.weaves.stats;

        // Ensure user Values exist
        if (!data.values['user']) data.values['user'] = {};

        let currentTarget = 'user';
        let vizBlockIndex = 0; // Index of block to visualize

        // Layout
        container.classList.add('panel-sidebar-layout');

        // --- Sidebar ---
        const sidebar = document.createElement('div');
        sidebar.className = 'card p-sm flex-col gap-md';

        sidebar.innerHTML = `
            <div>
                <label class="l-lab">Target</label>
                <select class="input" id="sel-target" style="width:100%; font-weight:bold;">
                    <option value="user">{ User }</option>
                </select>
            </div>
            
            <hr style="border-top:1px solid var(--border-subtle);">
            
            <div>
                <label class="l-lab">Add Stat Field</label>
                <div style="display:grid; gap:8px;">
                    <button class="btn btn-secondary btn-sm" id="btn-add-dnd">D&D Stats</button>
                    <button class="btn btn-secondary btn-sm" id="btn-add-big5">Big 5 (OCEAN)</button>
                    <button class="btn btn-secondary btn-sm" id="btn-add-vadf">Core (VADF)</button>
                </div>
            </div>
        `;

        // Bind Target Selector
        const actors = (state.nodes && state.nodes.actors && state.nodes.actors.items) ? Object.values(state.nodes.actors.items) : [];
        const selTarget = sidebar.querySelector('#sel-target');
        actors.forEach(a => {
            const opt = document.createElement('option');
            opt.value = a.id;
            opt.textContent = a.name || a.id;
            selTarget.appendChild(opt);
        });
        selTarget.onchange = (e) => {
            currentTarget = e.target.value;
            refreshMain();
        };

        // Bind Add Blocks
        const addBlock = (tplId) => {
            const tpl = TEMPLATES[tplId];

            // Duplicate Check (Strict ID check)
            if (data.blocks.find(b => b.id === tplId)) {
                if (A.UI.Toast) A.UI.Toast.show(`A "${tpl.label}" block already exists.`, 'warning');
                return;
            }

            // Clean ID for Presets
            const blockId = tplId;

            data.blocks.push({
                id: blockId,
                label: tpl.label,
                defs: JSON.parse(JSON.stringify(tpl.defs))
            });

            // Init values
            const allTargets = ['user', ...actors.map(a => a.id)];
            allTargets.forEach(tid => {
                if (!data.values[tid]) data.values[tid] = {};
                if (!data.values[tid][blockId]) data.values[tid][blockId] = { ...tpl.defaults };
            });

            A.State.notify();
            refreshMain();
        };

        const addCustomBlock = () => {
            const name = prompt("Enter Name for this Stat Block (e.g. 'Battle Stats'):");
            if (!name) return;

            // Clean ID from Name
            let blockId = name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
            if (!blockId) blockId = 'custom';

            // Ensure Unique
            let originalId = blockId;
            let suffix = 1;
            while (data.blocks.find(b => b.id === blockId)) {
                blockId = originalId + '_' + suffix++;
            }

            const countStr = prompt("How many stat fields? (e.g. 3)");
            const count = parseInt(countStr);
            if (isNaN(count) || count < 1) return;

            const defs = [];
            const defaults = {};

            for (let i = 0; i < count; i++) {
                const label = prompt(`Label for Field #${i + 1} (e.g. 'Agility'):`);
                if (!label) { i--; continue; } // Retry
                let key = label.substring(0, 4).toUpperCase().replace(/[^A-Z]/g, '') || `S${i}`;

                // Check uniqueness in this block
                let finalKey = key;
                let kSuffix = 1;
                while (defs.find(d => d.key === finalKey)) { finalKey = key + kSuffix++; }

                defs.push({ key: finalKey, label: label, min: 0, max: 100 });
                defaults[finalKey] = 50;
            }

            data.blocks.push({
                id: blockId,
                label: name,
                defs: defs
            });

            // Init
            const allTargets = ['user', ...actors.map(a => a.id)];
            allTargets.forEach(tid => {
                if (!data.values[tid]) data.values[tid] = {};
                if (!data.values[tid][blockId]) data.values[tid][blockId] = { ...defaults };
            });

            A.State.notify();
            refreshMain();
        };

        sidebar.querySelector('#btn-add-dnd').onclick = () => addBlock('dnd');
        sidebar.querySelector('#btn-add-big5').onclick = () => addBlock('big5');
        sidebar.querySelector('#btn-add-vadf').onclick = () => addBlock('vadf');

        // Custom Button
        const custBtn = document.createElement('button');
        custBtn.className = 'btn btn-primary btn-sm';
        custBtn.textContent = '+ Custom Block';
        custBtn.style.marginTop = '8px';
        custBtn.onclick = addCustomBlock;
        sidebar.querySelector('#btn-add-vadf').parentNode.appendChild(custBtn);

        container.appendChild(sidebar);

        // --- Main Content ---
        const main = document.createElement('div');
        main.className = 'card p-0 flex-col scroll-list min-h-0';
        container.appendChild(main);

        function refreshMain() {
            main.innerHTML = '';

            // Header
            const header = document.createElement('div');
            header.className = 'card-header justify-between';
            header.innerHTML = `<strong>Active Stats for: <span class="text-accent">${currentTarget === 'user' ? 'User' : (actors.find(a => a.id === currentTarget) || {}).name || currentTarget}</span></strong>`;
            main.appendChild(header);

            if (data.blocks.length === 0) {
                main.innerHTML += `
                    <div class="flex-col items-center justify-center h-full text-muted opacity-70">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="mb-md">
                            <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline>
                        </svg>
                        <div class="mb-sm">No stat fields active</div>
                        <div class="text-xs">Select a template from the sidebar to begin</div>
                    </div>
                `;
                return;
            }

            const body = document.createElement('div');
            body.className = 'card-body flex-col gap-lg';
            body.style.flex = '1';

            // 1. Render Blocks
            data.blocks.forEach((block, bIdx) => {
                let tVals = data.values[currentTarget][block.id];
                if (!tVals) { tVals = {}; data.values[currentTarget][block.id] = tVals; }

                const blockDiv = document.createElement('div');
                blockDiv.innerHTML = `
                    <div class="flex-row justify-between items-center border-b border-subtle pb-sm mb-md">
                        <h3 class="m-0 text-sm font-bold">${block.label}</h3>
                        <button class="btn btn-ghost btn-sm btn-del-blk text-error" data-idx="${bIdx}">Remove</button>
                    </div>
                 `;

                const grid = document.createElement('div');
                grid.className = 'panel-grid grid-auto-fill gap-sm';

                block.defs.forEach(def => {
                    const val = tVals[def.key] !== undefined ? tVals[def.key] : (def.min || 0);

                    const item = document.createElement('div');
                    item.className = 'card'; // nested card
                    item.style.background = 'var(--bg-base)';
                    item.style.padding = '8px 12px';
                    item.style.display = 'flex';
                    item.style.flexDirection = 'column';
                    item.style.gap = '6px';

                    item.innerHTML = `
                        <div class="flex-row justify-between text-xs">
                            <span class="font-bold">${def.label}</span>
                            <span class="val-disp font-mono">${val}</span>
                        </div>
                        <input type="range" min="${def.min}" max="${def.max}" value="${val}" class="w-full">
                        <div class="text-xs text-muted mt-xs text-right opacity-70 font-mono cursor-pointer select-all" title="Click to copy path" onclick="navigator.clipboard.writeText(this.innerText.trim()); Anansi.UI.Toast.show('Path copied', 'info');">
                            {{stats.${currentTarget === 'user' ? 'user' : (actors.find(a => a.id === currentTarget)?.name?.replace(/\s+/g, '_') || currentTarget)}.${block.id}.${def.key}}}
                        </div>
                     `;

                    item.querySelector('input').oninput = (e) => {
                        const v = parseFloat(e.target.value);
                        tVals[def.key] = v;
                        item.querySelector('.val-disp').textContent = v;
                        A.State.notify();
                        updateRadar();
                    };

                    grid.appendChild(item);
                });

                blockDiv.appendChild(grid);
                body.appendChild(blockDiv);
            });

            // Delete Handlers
            body.querySelectorAll('.btn-del-blk').forEach(b => {
                b.onclick = (e) => {
                    if (confirm('Remove this stat block?')) {
                        const idx = parseInt(e.target.dataset.idx);
                        data.blocks.splice(idx, 1);
                        A.State.notify();
                        refreshMain();
                        if (A.UI.Toast) A.UI.Toast.show('Stat block removed', 'info');
                    }
                };
            });

            // 2. Radar Section
            const radarSection = document.createElement('div');
            radarSection.className = 'card mt-lg p-lg flex-col items-center bg-surface';

            radarSection.innerHTML = `
                <div class="flex-row gap-md items-center mb-md">
                    <strong class="text-sm">Axis Visualization</strong>
                    <select id="sel-radar-src" class="input min-w-[150px]">
                        ${data.blocks.map((b, i) => `<option value="${i}">${b.label}</option>`).join('')}
                    </select>
                </div>
                <div id="radar-stage" class="flex items-center justify-center w-[400px] h-[400px]"></div>
            `;

            body.appendChild(radarSection);
            main.appendChild(body);

            // Radar Logic
            const selSrc = body.querySelector('#sel-radar-src');
            const stage = body.querySelector('#radar-stage');

            // Init Selector
            if (vizBlockIndex >= data.blocks.length) vizBlockIndex = 0;
            selSrc.selectedIndex = vizBlockIndex;

            selSrc.onchange = (e) => {
                vizBlockIndex = parseInt(e.target.value);
                updateRadar();
            };

            function updateRadar() {
                if (data.blocks.length === 0) {
                    stage.innerHTML = ''; return;
                }
                const blk = data.blocks[vizBlockIndex];
                if (!blk) return; // Should not happen

                // Gather Data
                const defs = blk.defs;
                const vals = data.values[currentTarget][blk.id] || {};

                const labels = defs.map(d => d.label);
                const values = defs.map(d => (vals[d.key] !== undefined ? vals[d.key] : (d.min || 0)));
                const min = defs[0].min || 0;
                const max = defs[0].max || 100;

                stage.innerHTML = AxisRadar.renderRadar(400, 400, labels, values, min, max);
            }

            updateRadar();
            updateLens();
        }

        // --- Lens Logic ---
        function updateLens() {
            A.UI.setLens((lensRoot) => {
                const stats = data;
                lensRoot.innerHTML = '<div style="padding:12px; font-family:var(--font-mono); font-size:11px;">';

                if (!stats.blocks?.length) {
                    lensRoot.innerHTML += '<div style="color:var(--text-muted); font-style:italic;">No stats defined.</div>';
                } else {
                    lensRoot.innerHTML += '<div style="margin-bottom:12px; font-weight:bold; color:var(--accent-primary); border-bottom:1px solid var(--border-subtle); padding-bottom:8px;">Stat References</div>';

                    // Helper
                    const renderGroup = (targetId, targetLabel) => {
                        let html = `<div style="margin-top:12px; margin-bottom:8px; font-weight:bold; font-size:10px; color:var(--text-muted); text-transform:uppercase;">${targetLabel}</div>`;

                        stats.blocks.forEach(blk => {
                            html += `<div style="margin-left:8px; margin-bottom:8px;">`;
                            html += `<div style="color:var(--text-secondary); font-size:10px; margin-bottom:4px; font-weight:bold;">${blk.label} <span style="opacity:0.5;">(${blk.id})</span></div>`;

                            const vals = (stats.values[targetId] && stats.values[targetId][blk.id]) || {};

                            // Limit to first 3 examples to avoid clutter in sidebar if many
                            const showDefs = blk.defs.slice(0, 50);

                            showDefs.forEach(def => {
                                const val = vals[def.key] ?? def.min;
                                html += `
                                       <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px; background:var(--bg-elevated); padding:2px 6px; border-radius:4px;">
                                           <code style="color:var(--text-main); font-size:9px; cursor:pointer;" title="Click to copy path" onclick="navigator.clipboard.writeText('${blockIdToRef(targetId, blk.id, def.key)}'); Anansi.UI.Toast.show('Path copied', 'info');">${blockIdToRef(targetId, blk.id, def.key)}</code>
                                           <span style="color:var(--text-muted); font-size:9px;">${val}</span>
                                       </div>
                                   `;
                            });
                            html += `</div>`;
                        });
                        return html;
                    };

                    // Helper to get display name for a target (slugified for template syntax)
                    const getTargetDisplayName = (tid) => {
                        if (tid === 'user') return 'user';
                        const actor = actors.find(a => a.id === tid);
                        // Replace spaces with underscores for valid template syntax
                        return actor?.name?.replace(/\s+/g, '_') || tid;
                    };

                    function blockIdToRef(tid, bid, k) { return `{{stats.${getTargetDisplayName(tid)}.${bid}.${k}}}`; }

                    // Just show Current Target + User (if diff)
                    lensRoot.innerHTML += renderGroup('user', 'User Identity');

                    if (currentTarget !== 'user') {
                        const targetName = getTargetDisplayName(currentTarget);
                        lensRoot.innerHTML += renderGroup(currentTarget, `Current Target (${targetName.toUpperCase()})`);
                    }
                }
                lensRoot.innerHTML += '</div>';
            });
        }

        refreshMain();
        updateLens(); // Init
    }

    A.registerPanel('stats', {
        label: 'Stats',
        subtitle: 'Matrix',
        category: 'Forbidden Secrets',
        render: render
    });

})(window.Anansi);

// Tour Registration
if (window.Anansi.UI && window.Anansi.UI.Tour) {
    window.Anansi.UI.Tour.register('stats', [
        {
            target: '#sel-target',
            title: 'The Matrix',
            content: 'View and edit statistical models for the User or any Actor. Select the target identity here.'
        },
        {
            target: '#btn-add-dnd',
            title: 'Templates',
            content: 'Quickly add common stat blocks like D&D Attributes, OCEAN, or VADF. You can also create custom blocks.'
        },
        {
            target: '#radar-stage',
            title: 'Axis Visualization',
            content: 'A radar chart visualizes the balance of the currently selected stat block. Useful for quick character profiling.'
        }
    ]);
}
