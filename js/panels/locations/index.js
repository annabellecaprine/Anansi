/*
 * Anansi Panel: Locations (Forbidden Secrets)
 * File: js/panels/locations.js
 * Description: Multi-Map Location Manager with Node Map Visualization
 */

(function (A) {
    'use strict';

    // --- Graph State ---
    const G = {
        svg: null, vport: null, gGrid: null, gEdges: null, gNodes: null,
        width: 0, height: 0, zoom: 1, tx: 0, ty: 0, gridSize: 40,
        dragging: null, opts: { snap: true, showIds: false },
        selection: null
    };

    // Multi-Select State
    let selectionMode = false;
    let selectedIds = new Set();

    // Map types
    const MAP_TYPES = [
        { id: 'region', label: '🌍 Region', desc: 'Continent, kingdom, country' },
        { id: 'city', label: '🏙️ City', desc: 'Town, city, settlement' },
        { id: 'district', label: '🏘️ District', desc: 'Neighborhood, quarter, sector' },
        { id: 'building', label: '🏠 Building', desc: 'House, shop, tavern' },
        { id: 'dungeon', label: '⚔️ Dungeon', desc: 'Cave, crypt, complex' },
        { id: 'ship', label: '🚀 Vehicle', desc: 'Ship, station, aircraft' },
        { id: 'other', label: '📍 Other', desc: 'Custom map type' }
    ];

    function elNS(tag) { return document.createElementNS('http://www.w3.org/2000/svg', tag); }
    function clientToSVGPoint(x, y) {
        if (!G.svg) return { x: 0, y: 0 };
        const pt = G.svg.createSVGPoint();
        pt.x = x; pt.y = y;
        return pt.matrixTransform(G.svg.getScreenCTM().inverse());
    }
    function clientToWorld(x, y) {
        const p = clientToSVGPoint(x, y);
        return { x: (p.x - G.tx) / G.zoom, y: (p.y - G.ty) / G.zoom };
    }

    // --- Helper: Ensure map structure and migrate old data ---
    function ensureMapStructure(state) {
        if (!state.weaves) state.weaves = {};

        // Migration: convert old flat locations to multi-map structure
        if (!state.weaves.maps) {
            const defaultMap = {
                id: 'map_default',
                name: 'Main Map',
                type: 'region',
                locations: state.weaves.locations || []
            };
            state.weaves.maps = [defaultMap];
            state.weaves.activeMap = 'map_default';
            delete state.weaves.locations; // Remove old flat array
        }

        if (!state.weaves.activeMap && state.weaves.maps.length > 0) {
            state.weaves.activeMap = state.weaves.maps[0].id;
        }

        return state.weaves;
    }

    function getActiveMap(state) {
        ensureMapStructure(state);
        return state.weaves.maps.find(m => m.id === state.weaves.activeMap) || state.weaves.maps[0];
    }

    function getMapById(state, mapId) {
        ensureMapStructure(state);
        return state.weaves.maps.find(m => m.id === mapId);
    }

    // --- Render Helpers ---
    function renderVport() {
        if (G.vport) G.vport.setAttribute('transform', `translate(${G.tx},${G.ty}) scale(${G.zoom})`);
    }

    function renderGrid() {
        const g = G.gGrid;
        if (!g) return;
        while (g.firstChild) g.removeChild(g.firstChild);
        const origin = elNS('path');
        origin.setAttribute('d', 'M-50,0 L50,0 M0,-50 L0,50');
        origin.setAttribute('stroke', 'var(--border-subtle)');
        origin.setAttribute('vector-effect', 'non-scaling-stroke');
        G.vport.appendChild(origin);
    }

    function renderEdges(activeMap) {
        const g = G.gEdges;
        if (!g) return;
        while (g.firstChild) g.removeChild(g.firstChild);

        const locs = activeMap?.locations || [];

        locs.forEach(a => {
            const p1 = a.pos || { x: 0, y: 0 };
            (a.exits || []).forEach(exit => {
                // Handle both old format (string ID) and new format (object with type)
                const exitId = typeof exit === 'string' ? exit : exit.id;
                const exitType = typeof exit === 'object' ? exit.type : 'path';

                const b = locs.find(l => l.id === exitId);
                if (!b) return; // Different map or invalid

                const p2 = b.pos || { x: 0, y: 0 };

                const ln = elNS('line');
                ln.setAttribute('x1', p1.x); ln.setAttribute('y1', p1.y);
                ln.setAttribute('x2', p2.x); ln.setAttribute('y2', p2.y);
                ln.setAttribute('stroke', exitType === 'portal' ? 'var(--accent-primary)' : 'var(--text-muted)');
                ln.setAttribute('stroke-width', exitType === 'portal' ? '2' : '1');
                ln.setAttribute('opacity', '0.5');
                if (exitType === 'portal') {
                    ln.setAttribute('stroke-dasharray', '5,5');
                }
                g.appendChild(ln);
            });
        });
    }

    function renderNodes(state, activeMap) {
        const g = G.gNodes;
        if (!g) return;
        while (g.firstChild) g.removeChild(g.firstChild);

        const locs = activeMap?.locations || [];

        locs.forEach(n => {
            const p = n.pos || { x: 0, y: 0 };
            const grp = elNS('g');
            grp.setAttribute('data-id', n.id);
            grp.setAttribute('transform', `translate(${p.x},${p.y})`);
            grp.style.cursor = 'grab';

            const isSel = (G.selection === n.id);
            const hasMapLink = n.mapLink;

            // Circle
            const c = elNS('circle');
            c.setAttribute('r', hasMapLink ? '18' : '15');
            c.setAttribute('fill', hasMapLink ? 'var(--accent-primary)' : 'var(--bg-elevated)');
            c.setAttribute('stroke', isSel ? 'var(--accent-secondary)' : 'var(--border-default)');
            c.setAttribute('stroke-width', isSel ? '3' : '1');
            grp.appendChild(c);

            // Map link icon
            if (hasMapLink) {
                const icon = elNS('text');
                icon.setAttribute('text-anchor', 'middle');
                icon.setAttribute('dominant-baseline', 'middle');
                icon.setAttribute('font-size', '12');
                icon.setAttribute('fill', 'white');
                icon.textContent = '🚪';
                grp.appendChild(icon);
            }

            // Label
            const t = elNS('text');
            t.setAttribute('y', hasMapLink ? '30' : '26');
            t.setAttribute('text-anchor', 'middle');
            t.setAttribute('font-size', '10');
            t.setAttribute('fill', 'var(--text-secondary)');
            t.textContent = n.name || n.id;
            grp.appendChild(t);

            // Interactions
            grp.onmousedown = (e) => {
                e.preventDefault(); e.stopPropagation();
                G.selection = n.id;
                G.dragging = { id: n.id, start: { ...p }, mouse: clientToWorld(e.clientX, e.clientY) };
                renderAll(state);
                A.State.notify();
            };

            // Double-click to enter linked map
            grp.ondblclick = (e) => {
                if (n.mapLink) {
                    state.weaves.activeMap = n.mapLink;
                    G.selection = null;
                    A.State.notify();
                    // Trigger re-render
                    if (typeof window.renderLocationPanel === 'function') {
                        window.renderLocationPanel();
                    }
                }
            };

            g.appendChild(grp);
        });
    }

    function renderAll(state) {
        if (!G.svg) return;
        const activeMap = getActiveMap(state);
        renderVport();
        renderEdges(activeMap);
        renderNodes(state, activeMap);
    }

    // --- Panel Render ---
    function render(container) {
        const state = A.State.get();
        ensureMapStructure(state);

        container.className = 'panel-grid h-full overflow-hidden gap-0';
        container.style.gridTemplateColumns = '320px 1fr';

        // --- Left Column ---
        const leftCol = document.createElement('div');
        leftCol.className = 'flex-col h-full overflow-hidden border-r border-subtle bg-surface';

        leftCol.innerHTML = `
            <!-- Map Selector -->
            <div class="p-sm border-b border-subtle bg-elevated">
                <div class="flex-row gap-sm items-center mb-sm">
                    <select id="map-selector" class="input font-bold flex-1"></select>
                    <button class="btn btn-sm btn-primary" id="btn-new-map" title="Create new map">+</button>
                    <button class="btn btn-sm btn-ghost" id="btn-edit-map" title="Edit map properties">⚙️</button>
                </div>
                <div id="map-breadcrumb" class="text-xs text-muted"></div>
            </div>
            
            <!-- Location Creator -->
            <div class="p-sm border-b border-subtle">
                <div class="flex-row gap-sm">
                    <input class="input flex-1" id="new-loc-name" placeholder="New Location Name">
                    <button class="btn btn-primary btn-sm" id="btn-add-loc">+</button>
                </div>
            </div>
            
            <!-- Location List -->
            <div id="loc-list" class="flex-1 scroll-y p-sm"></div>
            
            <!-- Footer Actions -->
            <div class="p-sm border-t border-subtle bg-elevated">
                <div id="footer-std-act">
                    <button class="btn btn-ghost btn-sm w-full" id="btn-select-mode">☑️ Multi-Select...</button>
                </div>
                <div id="footer-sel-act" class="flex-col gap-sm" style="display:none;">
                    <button class="btn btn-sm w-full bg-status-error text-white" id="btn-del-multi">Delete Selected (0)</button>
                    <button class="btn btn-ghost btn-sm w-full" id="btn-cancel-select">Cancel</button>
                </div>
            </div>
        `;
        container.appendChild(leftCol);

        // --- Right: Map ---
        const mapCard = document.createElement('div');
        mapCard.className = 'flex-col overflow-hidden relative bg-base';

        mapCard.innerHTML = `
            <div style="border-bottom:1px solid var(--border-subtle); padding:8px 12px; display:flex; justify-content:space-between; background:var(--bg-elevated);">
                <strong id="map-title">Node Map</strong>
                <div style="display:flex; gap:8px; align-items:center;">
                    <button class="btn btn-ghost btn-sm" id="btn-reset-view">⌖ Center</button>
                    <label style="font-size:11px; display:flex; align-items:center; gap:4px;">
                        <input type="checkbox" id="chk-snap" checked> Snap
                    </label>
                </div>
            </div>
            <div id="svg-container" style="flex:1; position:relative; overflow:hidden;">
                <svg width="100%" height="100%" style="display:block;">
                    <g id="vport">
                        <g id="edges"></g>
                        <g id="nodes"></g>
                    </g>
                </svg>
            </div>
        `;
        container.appendChild(mapCard);

        // --- Wire DOM ---
        G.svg = mapCard.querySelector('svg');
        G.vport = mapCard.querySelector('#vport');
        G.gEdges = mapCard.querySelector('#edges');
        G.gNodes = mapCard.querySelector('#nodes');
        G.opts.snap = true;

        const r = G.svg.getBoundingClientRect();
        G.width = r.width; G.height = r.height;
        if (G.tx === 0 && G.ty === 0) {
            G.tx = G.width / 2; G.ty = G.height / 2;
        }

        // --- Map Selector ---
        const mapSelector = leftCol.querySelector('#map-selector');
        const mapTitle = mapCard.querySelector('#map-title');
        const mapBreadcrumb = leftCol.querySelector('#map-breadcrumb');

        const renderMapSelector = () => {
            mapSelector.innerHTML = '';
            state.weaves.maps.forEach(map => {
                const opt = document.createElement('option');
                opt.value = map.id;
                opt.textContent = `${MAP_TYPES.find(t => t.id === map.type)?.label?.split(' ')[0] || '📍'} ${map.name}`;
                if (map.id === state.weaves.activeMap) opt.selected = true;
                mapSelector.appendChild(opt);
            });

            const activeMap = getActiveMap(state);
            mapTitle.textContent = activeMap?.name || 'Node Map';

            // Build breadcrumb
            let crumbs = [];
            let current = activeMap;
            while (current) {
                crumbs.unshift(current.name);
                current = current.parentMap ? getMapById(state, current.parentMap) : null;
            }
            mapBreadcrumb.innerHTML = crumbs.length > 1
                ? crumbs.map((c, i) => `<span style="${i === crumbs.length - 1 ? 'color:var(--accent-primary);' : ''}">${c}</span>`).join(' → ')
                : '';
        };

        mapSelector.onchange = (e) => {
            state.weaves.activeMap = /** @type {HTMLSelectElement} */ (e.target).value;
            G.selection = null;
            A.State.notify();
            renderMapSelector();
            renderList();
            renderAll(state);
        };

        // Create new map
        /** @type {HTMLElement} */ (leftCol.querySelector('#btn-new-map')).onclick = () => {
            const modalContent = document.createElement('div');
            modalContent.innerHTML = `
                <div class="flex-col gap-md">
                    <div>
                        <label class="label">Map Name</label>
                        <input type="text" class="input w-full" id="new-map-name" placeholder="e.g. Riverside Village">
                    </div>
                    <div>
                        <label class="label">Type</label>
                        <select class="input w-full" id="new-map-type">
                            ${MAP_TYPES.map(t => `<option value="${t.id}">${t.label} - ${t.desc}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label class="label">Parent Map (optional)</label>
                        <select class="input w-full" id="new-map-parent">
                            <option value="">— None —</option>
                            ${state.weaves.maps.map(m => `<option value="${m.id}">${m.name}</option>`).join('')}
                        </select>
                    </div>
                    <button class="btn btn-primary mt-sm" id="btn-create-map">Create Map</button>
                </div>
            `;

            A.UI.Modal.show({ title: '🗺️ Create New Map', content: modalContent, width: 350 });

            modalContent.querySelector('#btn-create-map').onclick = () => {
                const name = /** @type {HTMLInputElement} */ (modalContent.querySelector('#new-map-name')).value.trim();
                if (!name) return;

                const newMap = {
                    id: 'map_' + Math.random().toString(36).substr(2, 6),
                    name: name,
                    type: /** @type {HTMLSelectElement} */ (modalContent.querySelector('#new-map-type')).value,
                    parentMap: /** @type {HTMLSelectElement} */ (modalContent.querySelector('#new-map-parent')).value || null,
                    locations: []
                };

                state.weaves.maps.push(newMap);
                state.weaves.activeMap = newMap.id;
                A.State.notify();
                A.UI.Modal.hide();

                renderMapSelector();
                renderList();
                renderAll(state);
                if (A.UI.Toast) A.UI.Toast.show(`Map "${name}" created`, 'success');
            };
        };

        // Edit map properties
        /** @type {HTMLElement} */ (leftCol.querySelector('#btn-edit-map')).onclick = () => {
            const activeMap = getActiveMap(state);
            if (!activeMap) return;

            const modalContent = document.createElement('div');
            modalContent.innerHTML = `
                <div class="flex-col gap-md">
                    <div>
                        <label class="label">Map Name</label>
                        <input type="text" class="input w-full" id="edit-map-name" value="${activeMap.name}">
                    </div>
                    <div>
                        <label class="label">Type</label>
                        <select class="input w-full" id="edit-map-type">
                            ${MAP_TYPES.map(t => `<option value="${t.id}" ${activeMap.type === t.id ? 'selected' : ''}>${t.label}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label class="label">Parent Map</label>
                        <select class="input w-full" id="edit-map-parent">
                            <option value="">— None —</option>
                            ${state.weaves.maps.filter(m => m.id !== activeMap.id).map(m => `<option value="${m.id}" ${activeMap.parentMap === m.id ? 'selected' : ''}>${m.name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="flex-row gap-sm mt-md">
                        <button class="btn btn-primary flex-1" id="btn-save-map">Save</button>
                        ${state.weaves.maps.length > 1 ? `<button class="btn bg-status-error text-white" id="btn-delete-map">Delete Map</button>` : ''}
                    </div>
                </div>
            `;

            A.UI.Modal.show({ title: '⚙️ Map Properties', content: modalContent, width: 350 });

            /** @type {HTMLElement} */(modalContent.querySelector('#btn-save-map')).onclick = () => {
                activeMap.name = /** @type {HTMLInputElement} */ (modalContent.querySelector('#edit-map-name')).value.trim() || activeMap.name;
                activeMap.type = /** @type {HTMLSelectElement} */ (modalContent.querySelector('#edit-map-type')).value;
                activeMap.parentMap = /** @type {HTMLSelectElement} */ (modalContent.querySelector('#edit-map-parent')).value || null;
                A.State.notify();
                A.UI.Modal.hide();
                renderMapSelector();
                if (A.UI.Toast) A.UI.Toast.show('Map updated', 'success');
            };

            const delBtn = /** @type {HTMLElement} */ (modalContent.querySelector('#btn-delete-map'));
            if (delBtn) {
                delBtn.onclick = () => {
                    if (confirm(`Delete map "${activeMap.name}"? This will also delete all locations in it.`)) {
                        state.weaves.maps = state.weaves.maps.filter(m => m.id !== activeMap.id);
                        state.weaves.activeMap = state.weaves.maps[0]?.id;
                        A.State.notify();
                        A.UI.Modal.hide();
                        renderMapSelector();
                        renderList();
                        renderAll(state);
                        if (A.UI.Toast) A.UI.Toast.show('Map deleted', 'info');
                    }
                };
            }
        };

        // --- Pan/Zoom ---
        G.svg.onwheel = (e) => {
            e.preventDefault();
            const factor = e.deltaY > 0 ? 0.9 : 1.1;
            const before = clientToWorld(e.clientX, e.clientY);
            G.zoom = Math.max(0.1, Math.min(5, G.zoom * factor));
            const after = clientToWorld(e.clientX, e.clientY);
            G.tx += (after.x - before.x) * G.zoom;
            G.ty += (after.y - before.y) * G.zoom;
            renderAll(state);
        };

        let panning = false;
        let panStart = { x: 0, y: 0 };

        G.svg.onmousedown = (e) => {
            if (e.target.closest('g[data-id]')) return;
            panning = true;
            panStart = { x: e.clientX, y: e.clientY, tx: G.tx, ty: G.ty };
        };

        window.onmousemove = (e) => {
            if (panning) {
                G.tx = panStart.tx + (e.clientX - panStart.x);
                G.ty = panStart.ty + (e.clientY - panStart.y);
                renderAll(state);
            } else if (G.dragging) {
                const activeMap = getActiveMap(state);
                const pt = clientToWorld(e.clientX, e.clientY);
                let nx = G.dragging.start.x + (pt.x - G.dragging.mouse.x);
                let ny = G.dragging.start.y + (pt.y - G.dragging.mouse.y);

                if (G.opts.snap) {
                    const s = G.gridSize;
                    nx = Math.round(nx / s) * s;
                    ny = Math.round(ny / s) * s;
                }

                const node = activeMap?.locations?.find(l => l.id === G.dragging.id);
                if (node) {
                    node.pos = { x: nx, y: ny };
                    renderAll(state);
                }
            }
        };

        window.onmouseup = () => {
            panning = false;
            if (G.dragging) {
                A.State.notify();
                G.dragging = null;
            }
        };

            /** @type {HTMLElement} */ (mapCard.querySelector('#btn-reset-view')).onclick = () => {
            const r = G.svg.getBoundingClientRect();
            G.tx = r.width / 2; G.ty = r.height / 2;
            G.zoom = 1;
            renderAll(state);
        };
            /** @type {HTMLInputElement} */ (mapCard.querySelector('#chk-snap')).onchange = (e) => { G.opts.snap = /** @type {HTMLInputElement} */ (e.target).checked; };

        // --- Multi-Select ---
        const updateFooterState = () => {
            const fStd = /** @type {HTMLElement} */ (leftCol.querySelector('#footer-std-act'));
            const fSel = /** @type {HTMLElement} */ (leftCol.querySelector('#footer-sel-act'));

            if (selectionMode) {
                fStd.style.display = 'none';
                fSel.style.display = 'flex';
                fSel.querySelector('#btn-del-multi').textContent = `Delete Selected (${selectedIds.size})`;
                /** @type {HTMLButtonElement} */ (fSel.querySelector('#btn-del-multi')).disabled = selectedIds.size === 0;
                /** @type {HTMLInputElement} */ (leftCol.querySelector('#new-loc-name')).disabled = true;
                /** @type {HTMLButtonElement} */ (leftCol.querySelector('#btn-add-loc')).disabled = true;
            } else {
                fStd.style.display = 'block';
                fSel.style.display = 'none';
                /** @type {HTMLInputElement} */ (leftCol.querySelector('#new-loc-name')).disabled = false;
                /** @type {HTMLButtonElement} */ (leftCol.querySelector('#btn-add-loc')).disabled = false;
            }
        };

        /** @type {HTMLElement} */ (leftCol.querySelector('#btn-select-mode')).onclick = () => {
            selectionMode = true;
            selectedIds.clear();
            updateFooterState();
            renderList();
        };
        /** @type {HTMLElement} */ (leftCol.querySelector('#btn-cancel-select')).onclick = () => {
            selectionMode = false;
            selectedIds.clear();
            updateFooterState();
            renderList();
        };
        /** @type {HTMLElement} */ (leftCol.querySelector('#btn-del-multi')).onclick = () => {
            if (selectedIds.size === 0) return;
            if (confirm(`Delete ${selectedIds.size} locations?`)) {
                const activeMap = getActiveMap(state);
                activeMap.locations = activeMap.locations.filter(l => !selectedIds.has(l.id));
                activeMap.locations.forEach(l => {
                    if (l.exits) l.exits = l.exits.filter(e => !selectedIds.has(typeof e === 'string' ? e : e.id));
                });
                selectionMode = false;
                selectedIds.clear();
                G.selection = null;
                A.State.notify();
                updateFooterState();
                renderList();
                renderAll(state);
                if (A.UI.Toast) A.UI.Toast.show('Locations deleted', 'success');
            }
        };

        // --- Location List ---
        const listEl = leftCol.querySelector('#loc-list');
        const renderList = () => {
            const activeMap = getActiveMap(state);
            listEl.innerHTML = '';

            if (!activeMap?.locations?.length) {
                listEl.innerHTML = '<div style="text-align:center; color:var(--text-muted); padding:20px; font-style:italic;">No locations on this map yet.</div>';
                return;
            }

            activeMap.locations.forEach((loc, idx) => {
                const isSel = (G.selection === loc.id);
                const el = document.createElement('div');
                el.className = 'card p-sm mb-sm transition-all';
                if (isSel && !selectionMode) el.classList.add('border-accent');
                if (selectionMode && selectedIds.has(loc.id)) el.classList.add('bg-elevated', 'border-accent');

                const hasMapLink = loc.mapLink;
                const linkedMap = hasMapLink ? getMapById(state, loc.mapLink) : null;

                el.innerHTML = `
                    <div class="flex-row justify-between items-center mb-sm">
                        ${selectionMode ? `<input type="checkbox" class="mr-sm" ${selectedIds.has(loc.id) ? 'checked' : ''}>` : ''}
                        <input class="input loc-name font-bold flex-1" value="${loc.name || ''}" ${selectionMode ? 'disabled' : ''}>
                        <div class="text-xs text-muted ml-sm font-mono cursor-pointer" title="Copy ID" onclick="navigator.clipboard.writeText('${loc.id}'); Anansi.UI.Toast.show('ID copied', 'info');">ID</div>
                    </div>
                    
                    <textarea class="input loc-desc w-full text-xs mb-sm" placeholder="Description..." rows="2" ${selectionMode ? 'disabled' : ''}>${loc.description || ''}</textarea>
                    
                    <!-- Exits -->
                    <div class="mb-sm">
                        <div class="text-xs text-muted mb-xs">EXITS</div>
                        <div class="exits-list flex-wrap gap-xs mb-xs flex-row"></div>
                        <select class="input loc-add-exit w-full text-xs" ${selectionMode ? 'disabled' : ''}>
                            <option value="">+ Add Exit</option>
                            ${activeMap.locations.filter(l => l.id !== loc.id).map(l => `<option value="${l.id}">${l.name}</option>`).join('')}
                        </select>
                    </div>
                    
                    <!-- Map Link -->
                    <div class="mb-sm p-sm bg-surface rounded">
                        <div class="text-xs text-muted mb-xs">🚪 MAP TRANSITION</div>
                        <select class="input loc-map-link w-full text-xs" ${selectionMode ? 'disabled' : ''}>
                            <option value="">— No link —</option>
                            ${state.weaves.maps.filter(m => m.id !== activeMap.id).map(m => `<option value="${m.id}" ${loc.mapLink === m.id ? 'selected' : ''}>${m.name}</option>`).join('')}
                        </select>
                        ${linkedMap ? `<div class="text-xs text-accent mt-xs">Double-click node to enter</div>` : ''}
                    </div>
                    
                    <!-- Actions -->
                    <div class="flex-row justify-between items-center">
                        <button class="btn btn-xs btn-ghost loc-create-submap text-xs" ${selectionMode ? 'disabled' : ''} title="Create a new map linked from this location">🗺️ Create Sub-Map</button>
                        <button class="btn btn-ghost btn-xs loc-del text-error" ${selectionMode ? 'disabled' : ''}>Delete</button>
                    </div>
                `;

                // Exits rendering
                const exList = el.querySelector('.exits-list');
                (loc.exits || []).forEach((exit, exIdx) => {
                    const exitId = typeof exit === 'string' ? exit : exit.id;
                    const targetLoc = activeMap.locations.find(l => l.id === exitId);
                    const tag = document.createElement('span');
                    tag.style.cssText = "background:var(--bg-elevated); border:1px solid var(--border-subtle); font-size:10px; padding:2px 6px; border-radius:4px; cursor:pointer;";
                    tag.textContent = `${targetLoc?.name || exitId} ×`;
                    tag.onclick = () => {
                        loc.exits.splice(exIdx, 1);
                        renderList();
                        renderAll(state);
                        A.State.notify();
                    };
                    exList.appendChild(tag);
                });

                // Event bindings
                /** @type {HTMLElement} */ (el).onclick = (e) => {
                    const target = /** @type {HTMLElement} */ (e.target);
                    if (selectionMode && !target.closest('input, textarea, select, button')) {
                        if (selectedIds.has(loc.id)) selectedIds.delete(loc.id);
                        else selectedIds.add(loc.id);
                        updateFooterState();
                        renderList();
                        return;
                    }
                    if (!target.closest('input, textarea, select, button')) {
                        G.selection = loc.id;
                        renderList();
                        renderAll(state);
                    }
                };

                /** @type {HTMLInputElement} */ (el.querySelector('.loc-name')).oninput = (e) => { loc.name = /** @type {HTMLInputElement} */ (e.target).value; renderAll(state); };
                /** @type {HTMLInputElement} */ (el.querySelector('.loc-name')).onchange = () => A.State.notify();
                /** @type {HTMLTextAreaElement} */ (el.querySelector('.loc-desc')).onchange = (e) => { loc.description = /** @type {HTMLTextAreaElement} */ (e.target).value; A.State.notify(); };

                /** @type {HTMLSelectElement} */ (el.querySelector('.loc-add-exit')).onchange = (e) => {
                    if (/** @type {HTMLSelectElement} */(e.target).value) {
                        const targetId = /** @type {HTMLSelectElement} */ (e.target).value;
                        if (!loc.exits) loc.exits = [];
                        if (!loc.exits.some(ex => (typeof ex === 'string' ? ex : ex.id) === targetId)) {
                            loc.exits.push(targetId);
                            // Bi-directional
                            const targetLoc = activeMap.locations.find(l => l.id === targetId);
                            if (targetLoc) {
                                if (!targetLoc.exits) targetLoc.exits = [];
                                if (!targetLoc.exits.some(ex => (typeof ex === 'string' ? ex : ex.id) === loc.id)) {
                                    targetLoc.exits.push(loc.id);
                                }
                            }
                        }
                        /** @type {HTMLSelectElement} */ (e.target).value = '';
                        renderList();
                        renderAll(state);
                        A.State.notify();
                    }
                };

                /** @type {HTMLSelectElement} */ (el.querySelector('.loc-map-link')).onchange = (e) => {
                    loc.mapLink = /** @type {HTMLSelectElement} */ (e.target).value || null;
                    renderList();
                    renderAll(state);
                    A.State.notify();
                };

                /** @type {HTMLElement} */ (el.querySelector('.loc-create-submap')).onclick = () => {
                    const newMapName = prompt(`Create sub-map from "${loc.name}"?\nEnter map name:`, loc.name);
                    if (newMapName) {
                        const newMap = {
                            id: 'map_' + Math.random().toString(36).substr(2, 6),
                            name: newMapName,
                            type: 'building',
                            parentMap: activeMap.id,
                            locations: []
                        };
                        state.weaves.maps.push(newMap);
                        loc.mapLink = newMap.id;
                        A.State.notify();
                        renderMapSelector();
                        renderList();
                        renderAll(state);
                        if (A.UI.Toast) A.UI.Toast.show(`Sub-map "${newMapName}" created and linked`, 'success');
                    }
                };

                /** @type {HTMLElement} */ (el.querySelector('.loc-del')).onclick = () => {
                    if (confirm('Delete this location?')) {
                        activeMap.locations.splice(idx, 1);
                        renderList();
                        renderAll(state);
                        A.State.notify();
                    }
                };

                listEl.appendChild(el);
            });
        };

        // Add Location
        /** @type {HTMLElement} */ (leftCol.querySelector('#btn-add-loc')).onclick = () => {
            const inp = /** @type {HTMLInputElement} */ (leftCol.querySelector('#new-loc-name'));
            const name = inp.value.trim();
            if (!name) return;

            const activeMap = getActiveMap(state);
            const baseCx = (G.width / 2 - G.tx) / G.zoom;
            const baseCy = (G.height / 2 - G.ty) / G.zoom;

            // Calculate cascade offset to prevent overlap
            const baseGridX = Math.round(baseCx / G.gridSize) * G.gridSize;
            const baseGridY = Math.round(baseCy / G.gridSize) * G.gridSize;

            // Count existing locations to determine offset
            const existingCount = activeMap.locations?.length || 0;
            const offsetIndex = existingCount % 10; // Cycle through 10 positions
            const offsetX = (offsetIndex % 5) * G.gridSize;  // 0, 40, 80, 120, 160
            const offsetY = Math.floor(offsetIndex / 5) * G.gridSize; // 0 or 40

            const newLoc = {
                id: 'LOC_' + Math.random().toString(36).substr(2, 5).toUpperCase(),
                name: name,
                description: '',
                exits: [],
                pos: { x: baseGridX + offsetX, y: baseGridY + offsetY }
            };

            activeMap.locations.push(newLoc);
            inp.value = '';
            G.selection = newLoc.id;
            renderList();
            renderAll(state);
            A.State.notify();
            if (A.UI.Toast) A.UI.Toast.show(`Location "${name}" created`, 'success');
        };

        // Initial render
        renderMapSelector();
        renderList();
        renderAll(state);

        // Expose for external navigation
        window.renderLocationPanel = () => {
            renderMapSelector();
            renderList();
            renderAll(state);
        };
    }

    // Expose helpers for other panels/scripts
    if (!A.Locations) A.Locations = {};
    A.Locations.getActiveMap = (state) => getActiveMap(state || A.State.get());
    A.Locations.getMapById = (state, id) => getMapById(state || A.State.get(), id);
    A.Locations.ensureMapStructure = (state) => ensureMapStructure(state || A.State.get());

    A.registerPanel('locations', {
        label: 'Locations',
        subtitle: 'Multi-Map',
        category: 'Forbidden Secrets',
        render: render
    });

})(window.Anansi);
