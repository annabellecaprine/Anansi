/*
 * Anansi Panel: RPG Map
 * File: js/panels/rpg_map.js
 * Category: RPG Experiment
 * Purpose: Visual World Map (Player View of Locations) with Multi-Map support.
 */

(function (A) {
    'use strict';

    const G = {
        svg: null, vport: null, gEdges: null, gNodes: null,
        width: 0, height: 0, zoom: 1, tx: 0, ty: 0, gridSize: 40,
        selection: null
    };

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

    // Helper to get active map
    function getActiveMap(state) {
        if (A.Locations?.getActiveMap) {
            return A.Locations.getActiveMap(state);
        }
        // Fallback for old structure
        return { locations: state.weaves?.locations || [] };
    }

    // Helper to get visibility state for a location
    function getVisibility(locId) {
        if (A.RPGEngine?.getLocationVisibility) {
            return A.RPGEngine.getLocationVisibility(locId);
        }
        return 'visited'; // Default to visible if no RPG engine
    }

    // Filter locations based on visibility (for player map)
    function filterVisibleLocations(locs) {
        // Check if any locations have visibility set
        const state = A.State?.get?.();
        const hasAnyVisibility = state?.rpg?.locationVisibility && Object.keys(state.rpg.locationVisibility).length > 0;

        // If fog of war hasn't been initialized yet, show all locations
        if (!hasAnyVisibility) {
            return locs;
        }

        return locs.filter(loc => {
            const vis = getVisibility(loc.id);
            return vis === 'visited' || vis === 'revealed' || vis === 'neighboring';
        });
    }

    function renderVport() {
        if (G.vport) G.vport.setAttribute('transform', `translate(${G.tx},${G.ty}) scale(${G.zoom})`);
    }

    function renderEdges(locs, allLocs) {
        const g = G.gEdges;
        if (!g) return;
        while (g.firstChild) g.removeChild(g.firstChild);

        locs.forEach(n => {
            const vis = getVisibility(n.id);
            // Only draw edges from visited/revealed locations
            if (vis !== 'visited' && vis !== 'revealed') return;

            const p = n.pos || { x: 0, y: 0 };
            (n.exits || []).forEach(exit => {
                const exitId = typeof exit === 'string' ? exit : exit.id;
                const target = allLocs.find(l => l.id === exitId);
                if (!target) return;

                const targetVis = getVisibility(exitId);
                // Draw edges to visited, revealed, OR neighboring locations
                if (targetVis === 'unknown') return;

                const tp = target.pos || { x: 0, y: 0 };
                const ln = elNS('line');
                ln.setAttribute('x1', p.x); ln.setAttribute('y1', p.y);
                ln.setAttribute('x2', tp.x); ln.setAttribute('y2', tp.y);
                ln.setAttribute('stroke', 'var(--text-muted)');
                ln.setAttribute('stroke-width', '2');
                ln.setAttribute('stroke-dasharray', targetVis === 'neighboring' ? '2,4' : '4,4');
                ln.setAttribute('opacity', targetVis === 'neighboring' ? '0.3' : '0.5');
                g.appendChild(ln);
            });
        });
    }

    function renderNodes(locs, infoPanel, state, allLocs) {
        const g = G.gNodes;
        if (!g) return;
        while (g.firstChild) g.removeChild(g.firstChild);

        // Filter to only visible locations
        const visibleLocs = filterVisibleLocations(locs);

        visibleLocs.forEach(n => {
            const vis = getVisibility(n.id);
            const isNeighboring = vis === 'neighboring';
            const p = n.pos || { x: 0, y: 0 };
            const grp = elNS('g');
            grp.setAttribute('data-id', n.id);
            grp.setAttribute('transform', `translate(${p.x},${p.y})`);
            grp.style.cursor = isNeighboring ? 'help' : 'pointer';
            grp.style.opacity = isNeighboring ? '0.5' : '1';

            const isSel = (G.selection === n.id);
            const hasMapLink = n.mapLink && !isNeighboring;

            // Circle - neighboring locations have different style
            const c = elNS('circle');
            c.setAttribute('r', hasMapLink ? '24' : isNeighboring ? '16' : '20');
            if (isNeighboring) {
                c.setAttribute('fill', 'var(--bg-surface)');
                c.setAttribute('stroke', 'var(--text-muted)');
                c.setAttribute('stroke-dasharray', '4,2');
            } else {
                c.setAttribute('fill', isSel ? 'var(--accent-primary)' : hasMapLink ? 'var(--accent-secondary)' : 'var(--bg-elevated)');
                c.setAttribute('stroke', isSel ? 'white' : 'var(--border-default)');
            }
            c.setAttribute('stroke-width', '2');
            grp.appendChild(c);

            // Icon or initials - neighboring shows "?"
            const txt = elNS('text');
            txt.setAttribute('dy', '5');
            txt.setAttribute('text-anchor', 'middle');
            txt.setAttribute('font-size', isNeighboring ? '14' : hasMapLink ? '14' : '10');
            txt.setAttribute('fill', isNeighboring ? 'var(--text-muted)' : isSel || hasMapLink ? 'white' : 'var(--text-primary)');
            txt.setAttribute('font-weight', 'bold');
            txt.textContent = isNeighboring ? '?' : hasMapLink ? '🚪' : (n.name || "?").substring(0, 2).toUpperCase();
            grp.appendChild(txt);

            // Label - hide for neighboring locations
            if (!isNeighboring) {
                const t = elNS('text');
                t.setAttribute('y', hasMapLink ? '40' : '35');
                t.setAttribute('text-anchor', 'middle');
                t.setAttribute('font-size', '12');
                t.setAttribute('fill', 'var(--text-primary)');
                t.setAttribute('font-weight', 'bold');
                t.style.textShadow = '0 1px 2px black';
                t.textContent = n.name || n.id;
                grp.appendChild(t);
            }

            // Click: select and show info
            grp.onclick = (e) => {
                e.stopPropagation();
                G.selection = n.id;
                renderAll(state, infoPanel);

                if (infoPanel) {
                    // Show different info for neighboring (unexplored) locations
                    if (isNeighboring) {
                        infoPanel.innerHTML = `
                            <div style="text-align:center; padding:20px; color:var(--text-muted);">
                                <div style="font-size:32px; margin-bottom:8px;">?</div>
                                <div style="font-size:14px; font-weight:bold;">Unexplored</div>
                                <div style="font-size:12px; margin-top:4px;">Travel here to reveal.</div>
                            </div>
                        `;
                    } else {
                        const linkedMap = hasMapLink ? (A.Locations?.getMapById?.(state, n.mapLink) || null) : null;
                        infoPanel.innerHTML = `
                            <div style="font-size:16px; font-weight:bold; margin-bottom:8px;">${n.name}</div>
                            <div style="font-size:12px; line-height:1.5; color:var(--text-secondary); margin-bottom:12px;">
                                ${n.description || "No description available."}
                            </div>
                            ${n.image ? `<img src="${n.image}" style="width:100%; border-radius:4px; margin-bottom:12px;">` : ''}
                            
                            ${linkedMap ? `
                                <div style="background:var(--accent-primary); color:white; padding:8px; border-radius:4px; margin-bottom:12px; font-size:12px;">
                                    🚪 <strong>Entrance to:</strong> ${linkedMap.name}
                                    <div style="font-size:10px; opacity:0.8; margin-top:4px;">Double-click to view this area</div>
                                </div>
                            ` : ''}
                            
                            <div style="font-size:10px; font-weight:bold; text-transform:uppercase; color:var(--text-muted); margin-bottom:4px;">Connections</div>
                            <div style="display:flex; flex-wrap:wrap; gap:4px;">
                                ${(n.exits || []).map(exit => {
                            const exitId = typeof exit === 'string' ? exit : exit.id;
                            const l = locs.find(x => x.id === exitId);
                            const exitVis = getVisibility(exitId);
                            const exitName = (exitVis === 'neighboring' || exitVis === 'unknown') ? '?' : (l ? l.name : exitId);
                            return `<span style="background:var(--bg-base); border:1px solid var(--border-subtle); padding:2px 6px; border-radius:4px; font-size:10px;">${exitName}</span>`;
                        }).join('')}
                            </div>
                        `;
                    }
                }
            };

            // Double-click: enter linked map
            grp.ondblclick = () => {
                if (hasMapLink) {
                    state.weaves.activeMap = n.mapLink;
                    G.selection = null;
                    A.State.notify();
                    renderAll(state, infoPanel);
                    if (infoPanel) {
                        const map = A.Locations?.getMapById?.(state, n.mapLink);
                        infoPanel.innerHTML = `<div style="color:var(--accent-primary); font-weight:bold;">Entered: ${map?.name || n.mapLink}</div>`;
                    }
                }
            };

            g.appendChild(grp);
        });
    }

    function renderAll(state, infoPanel) {
        if (!G.svg) return;
        const activeMap = getActiveMap(state);
        const locs = activeMap?.locations || [];
        renderVport();
        renderEdges(locs, locs);
        renderNodes(locs, infoPanel, state, locs);
    }

    function render(container) {
        const state = A.State.get();

        // Ensure map structure
        if (A.Locations?.ensureMapStructure) {
            A.Locations.ensureMapStructure(state);
        } else {
            if (!state.weaves) state.weaves = {};
            if (!state.weaves.locations) state.weaves.locations = [];
        }

        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.height = '100%';
        container.style.padding = '0';
        container.style.overflow = 'hidden';

        // Header with map selector
        const header = document.createElement('div');
        header.style.cssText = 'padding:12px 16px; background:var(--bg-elevated); border-bottom:1px solid var(--border-subtle); display:flex; justify-content:space-between; align-items:center;';

        header.innerHTML = `
            <div style="display:flex; align-items:center; gap:12px;">
                <span style="font-size:16px;">🗺️</span>
                <select id="map-selector" class="input" style="font-weight:bold; min-width:150px;"></select>
            </div>
            <div style="display:flex; gap:8px;">
                <button class="btn btn-sm btn-ghost" id="btn-up-level" title="Go to parent map" style="display:none;">⬆️ Up</button>
                <button class="btn btn-sm btn-ghost" id="map-recenter">⌖ Center</button>
            </div>
        `;
        container.appendChild(header);

        const mapSelector = header.querySelector('#map-selector');
        const btnUp = header.querySelector('#btn-up-level');

        const updateMapSelector = () => {
            mapSelector.innerHTML = '';
            (state.weaves.maps || []).forEach(map => {
                const opt = document.createElement('option');
                opt.value = map.id;
                opt.textContent = map.name;
                if (map.id === state.weaves.activeMap) opt.selected = true;
                mapSelector.appendChild(opt);
            });

            const activeMap = getActiveMap(state);
            btnUp.style.display = activeMap?.parentMap ? 'inline-flex' : 'none';
        };

        mapSelector.onchange = (e) => {
            state.weaves.activeMap = e.target.value;
            G.selection = null;
            A.State.notify();
            updateMapSelector();
            renderAll(state, infoPanel);
        };

        btnUp.onclick = () => {
            const activeMap = getActiveMap(state);
            if (activeMap?.parentMap) {
                state.weaves.activeMap = activeMap.parentMap;
                G.selection = null;
                A.State.notify();
                updateMapSelector();
                renderAll(state, infoPanel);
            }
        };

        // Body
        const bodyV = document.createElement('div');
        bodyV.style.cssText = 'flex:1; position:relative; overflow:hidden; background:var(--bg-base);';
        bodyV.style.backgroundImage = 'radial-gradient(var(--border-subtle) 1px, transparent 1px)';
        bodyV.style.backgroundSize = '20px 20px';

        // Info Panel
        const infoPanel = document.createElement('div');
        infoPanel.style.cssText = 'position:absolute; bottom:16px; left:16px; width:300px; background:var(--bg-elevated); border:1px solid var(--border-subtle); border-radius:8px; padding:16px; box-shadow:0 4px 12px rgba(0,0,0,0.3);';
        infoPanel.innerHTML = `<div style="color:var(--text-muted); font-style:italic;">Select a location...</div>`;

        // SVG
        const svgC = document.createElement('div');
        svgC.style.cssText = 'width:100%; height:100%;';
        svgC.innerHTML = `
            <svg width="100%" height="100%" style="display:block;">
                <g id="vport">
                    <g id="edges"></g>
                    <g id="nodes"></g>
                </g>
            </svg>
        `;

        bodyV.appendChild(svgC);
        bodyV.appendChild(infoPanel);
        container.appendChild(bodyV);

        // Wire SVG
        G.svg = svgC.querySelector('svg');
        G.vport = svgC.querySelector('#vport');
        G.gEdges = svgC.querySelector('#edges');
        G.gNodes = svgC.querySelector('#nodes');
        G.width = 800; G.height = 600;
        G.tx = G.width / 2; G.ty = G.height / 2;
        G.zoom = 1;

        // Pan/Zoom
        G.svg.onwheel = (e) => {
            e.preventDefault();
            const factor = e.deltaY > 0 ? 0.9 : 1.1;
            G.zoom = Math.max(0.1, Math.min(5, G.zoom * factor));
            renderAll(state, infoPanel);
        };

        let panning = false, panStart = { x: 0, y: 0 };
        G.svg.onmousedown = (e) => {
            panning = true;
            panStart = { x: e.clientX, y: e.clientY, tx: G.tx, ty: G.ty };
        };
        window.onmousemove = (e) => {
            if (panning) {
                G.tx = panStart.tx + (e.clientX - panStart.x);
                G.ty = panStart.ty + (e.clientY - panStart.y);
                renderAll(state, infoPanel);
            }
        };
        window.onmouseup = () => { panning = false; };

        header.querySelector('#map-recenter').onclick = () => {
            const rect = bodyV.getBoundingClientRect();
            G.tx = rect.width / 2; G.ty = rect.height / 2;
            G.zoom = 1;
            renderAll(state, infoPanel);
        };

        // Initial
        updateMapSelector();
        setTimeout(() => {
            const rect = bodyV.getBoundingClientRect();
            if (rect.width) {
                G.width = rect.width;
                G.height = rect.height;
                G.tx = G.width / 2;
                G.ty = G.height / 2;
            }
            renderAll(state, infoPanel);
        }, 100);
    }

    A.registerPanel('rpg_map', {
        label: 'Map',
        subtitle: 'World View',
        category: 'RPG Experiment',
        order: 3,
        icon: '🗺️',
        render: render
    });

})(window.Anansi);
