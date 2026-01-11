/*
 * Anansi Panel: DM Atlas (Dungeon Master's Atlas)
 * File: js/panels/rpg_dm_map.js
 * Category: RPG Experiment
 * Purpose: Overlay RPG data (encounters, loot, traps, secrets) onto locations.
 * Pairs with: Locations panel (geometry/description), Roleplay session (navigation).
 */

(function (A) {
    'use strict';

    // Trap types (setting-agnostic)
    const TRAP_TYPES = [
        { id: 'none', label: 'No Trap', icon: '✓' },
        { id: 'physical', label: 'Physical Trap', icon: '⚙️', examples: 'Pit, spike, crusher, alarm' },
        { id: 'explosive', label: 'Explosive', icon: '💥', examples: 'Mine, bomb, gas' },
        { id: 'magical', label: 'Magical/Energy', icon: '✨', examples: 'Curse, force field, lightning' },
        { id: 'environmental', label: 'Environmental', icon: '🌡️', examples: 'Poison gas, fire, cold' },
        { id: 'security', label: 'Security System', icon: '🔒', examples: 'Laser grid, turret, camera' }
    ];

    // Difficulty presets
    const DIFFICULTY_PRESETS = [
        { label: 'Trivial', dc: 5, dmg: '1d4', color: 'var(--text-muted)' },
        { label: 'Easy', dc: 10, dmg: '1d6', color: 'var(--status-success)' },
        { label: 'Medium', dc: 13, dmg: '2d6', color: 'var(--status-warning)' },
        { label: 'Hard', dc: 15, dmg: '3d6', color: 'var(--status-error)' },
        { label: 'Deadly', dc: 18, dmg: '4d6+4', color: 'var(--accent-secondary)' }
    ];

    // Helper to get all locations across all maps
    function getAllLocations(state) {
        if (!state.weaves?.maps) return [];
        let all = [];
        state.weaves.maps.forEach(map => {
            (map.locations || []).forEach(loc => {
                all.push({ ...loc, _mapId: map.id, _mapName: map.name });
            });
        });
        return all;
    }

    // Helper to get active map's locations
    function getActiveMapLocations(state) {
        if (A.Locations?.getActiveMap) {
            const map = A.Locations.getActiveMap(state);
            return (map?.locations || []).map(loc => ({ ...loc, _mapId: map.id, _mapName: map.name }));
        }
        // Fallback for old structure
        return state.weaves?.locations || [];
    }

    function render(container) {
        container.style.display = 'grid';
        container.style.gridTemplateColumns = '280px 1fr';
        container.style.height = '100%';
        container.style.gap = '0';
        container.style.background = 'var(--bg-base)';

        const state = A.State.get();

        // Ensure map structure exists
        if (A.Locations?.ensureMapStructure) {
            A.Locations.ensureMapStructure(state);
        } else {
            if (!state.weaves) state.weaves = {};
            if (!state.weaves.locations) state.weaves.locations = [];
        }

        if (!state.rpg) state.rpg = {};
        if (!state.rpg.bestiary) state.rpg.bestiary = [];

        let selectedId = null;
        let viewMode = 'active'; // 'active' or 'all'

        // --- Left: Location List ---
        const leftCol = document.createElement('div');
        leftCol.style.cssText = 'background:var(--bg-surface); display:flex; flex-direction:column; overflow:hidden; border-right:1px solid var(--border-subtle);';

        leftCol.innerHTML = `
            <div style="padding:16px; border-bottom:1px solid var(--border-subtle);">
                <h2 style="margin:0 0 4px; font-size:16px; display:flex; align-items:center; gap:8px;">
                    🗺️ DM Atlas
                </h2>
                <p style="margin:0; font-size:11px; color:var(--text-muted);">Add encounters, loot & secrets to locations</p>
            </div>
            <div style="padding:8px; border-bottom:1px solid var(--border-subtle); display:flex; gap:4px;">
                <button class="btn btn-sm view-toggle" data-view="active" style="flex:1;">Active Map</button>
                <button class="btn btn-sm btn-ghost view-toggle" data-view="all" style="flex:1;">All Maps</button>
            </div>
            <div style="padding:8px; border-bottom:1px solid var(--border-subtle);">
                <input class="input" id="search-locs" placeholder="Search locations..." style="width:100%;">
            </div>
            <div id="dm-loc-list" style="flex:1; overflow-y:auto; padding:8px;"></div>
            <div style="padding:12px; border-top:1px solid var(--border-subtle); font-size:10px; color:var(--text-muted);">
                <strong>Legend:</strong><br>
                💀 Has encounters • 💎 Has loot • ⚠️ Has trap • 🤫 Has secrets
            </div>
        `;
        container.appendChild(leftCol);

        // --- Right: Editor ---
        const rightCol = document.createElement('div');
        rightCol.style.cssText = 'background:var(--bg-base); display:flex; flex-direction:column; overflow:hidden; min-height:0;';
        rightCol.innerHTML = `
            <div id="editor-empty" style="flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; color:var(--text-muted);">
                <span style="font-size:48px; margin-bottom:12px;">🗺️</span>
                <div style="font-size:14px;">Select a location to add RPG data</div>
                <div style="font-size:11px; margin-top:8px;">Create locations in the <strong>Locations</strong> panel first</div>
            </div>
            <div id="editor-main" style="display:none; flex-direction:column; flex:1; min-height:0; overflow:hidden;"></div>
        `;
        container.appendChild(rightCol);

        const locList = leftCol.querySelector('#dm-loc-list');
        const searchInput = leftCol.querySelector('#search-locs');

        // View toggle buttons
        leftCol.querySelectorAll('.view-toggle').forEach(btn => {
            btn.onclick = () => {
                viewMode = btn.dataset.view;
                leftCol.querySelectorAll('.view-toggle').forEach(b => {
                    b.classList.toggle('btn-ghost', b.dataset.view !== viewMode);
                });
                renderList();
            };
        });

        // --- Render Location List ---
        const renderList = () => {
            const search = searchInput.value.toLowerCase();
            locList.innerHTML = '';

            const allLocs = viewMode === 'all' ? getAllLocations(state) : getActiveMapLocations(state);
            const locations = allLocs.filter(loc =>
                !search || loc.name?.toLowerCase().includes(search)
            );

            if (locations.length === 0) {
                locList.innerHTML = `
                    <div style="text-align:center; padding:20px; color:var(--text-muted);">
                        ${allLocs.length === 0
                        ? '<div style="font-size:11px;">No locations defined.<br>Create some in the <strong>Locations</strong> panel.</div>'
                        : '<div style="font-size:11px;">No matches found.</div>'
                    }
                    </div>
                `;
                return;
            }

            locations.forEach(loc => {
                const rpg = loc.rpg || {};
                const hasEncounters = rpg.encounters && rpg.encounters.length > 0;
                const hasLoot = rpg.loot && rpg.loot.length > 0;
                const hasTrap = rpg.trap && rpg.trap.type && rpg.trap.type !== 'none';
                const hasSecrets = rpg.secrets && rpg.secrets.trim().length > 0;
                const isSelected = loc.id === selectedId;

                const badges = [];
                if (hasEncounters) badges.push('💀');
                if (hasLoot) badges.push('💎');
                if (hasTrap) badges.push('⚠️');
                if (hasSecrets) badges.push('🤫');

                // Visibility indicator for fog of war
                const vis = A.RPGEngine?.getLocationVisibility?.(loc.id) || 'unknown';
                const visIcon = vis === 'visited' || vis === 'revealed' ? '👁️' : vis === 'neighboring' ? '👁‍🗨' : '⚫';

                const el = document.createElement('div');
                el.style.cssText = `
                    padding:12px; cursor:pointer; border-radius:6px; margin-bottom:6px;
                    background:${isSelected ? 'var(--bg-elevated)' : 'transparent'};
                    border:2px solid ${isSelected ? 'var(--accent-primary)' : 'transparent'};
                    transition:all 0.15s;
                `;

                el.innerHTML = `
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span style="font-weight:bold; font-size:13px; color:${isSelected ? 'var(--accent-primary)' : 'var(--text-primary)'};">
                            ${visIcon} ${loc.name || 'Unnamed'}
                        </span>
                        <span style="font-size:12px;">${badges.join(' ') || '<span style="color:var(--text-muted);">—</span>'}</span>
                    </div>
                    ${viewMode === 'all' && loc._mapName ? `<div style="font-size:9px; color:var(--accent-primary); margin-top:2px;">📍 ${loc._mapName}</div>` : ''}
                    ${loc.description ? `<div style="font-size:10px; color:var(--text-muted); margin-top:4px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${loc.description.substring(0, 50)}${loc.description.length > 50 ? '...' : ''}</div>` : ''}
                `;

                if (!isSelected) {
                    el.onmouseenter = () => el.style.background = 'var(--bg-hover)';
                    el.onmouseleave = () => el.style.background = 'transparent';
                }

                el.onclick = () => {
                    selectedId = loc.id;
                    renderList();
                    renderEditor(loc);
                };

                locList.appendChild(el);
            });
        };

        searchInput.oninput = () => renderList();

        // --- Render Editor ---
        const renderEditor = (loc) => {
            rightCol.querySelector('#editor-empty').style.display = 'none';
            const editorMain = rightCol.querySelector('#editor-main');
            editorMain.style.display = 'flex';

            // Ensure RPG data structure
            if (!loc.rpg) loc.rpg = { encounters: [], loot: [], secrets: '', trap: null };
            const rpg = loc.rpg;

            editorMain.innerHTML = `
                <!-- Header -->
                <div style="padding:16px 20px; border-bottom:1px solid var(--border-subtle); background:var(--bg-elevated);">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                        <div>
                            <h3 style="margin:0; font-size:18px;">${loc.name}</h3>
                            <div style="font-size:11px; color:var(--text-muted); margin-top:4px;">
                                ${loc.description ? loc.description.substring(0, 100) + (loc.description.length > 100 ? '...' : '') : '<em>No description</em>'}
                            </div>
                        </div>
                        <span style="font-size:10px; font-family:var(--font-mono); color:var(--text-muted);">${loc.id}</span>
                    </div>
                    <!-- Visibility Controls -->
                    <div style="margin-top:12px; padding-top:12px; border-top:1px solid var(--border-subtle); display:flex; align-items:center; gap:8px;">
                        <span style="font-size:11px; color:var(--text-muted);">👁️ Visibility:</span>
                        <span id="vis-status" style="font-size:11px; font-weight:bold; padding:2px 8px; border-radius:4px; background:var(--bg-surface);">
                            ${A.RPGEngine?.getLocationVisibility?.(loc.id) || 'unknown'}
                        </span>
                        <button id="btn-reveal" class="btn btn-xs btn-primary" title="Reveal this location to players">Reveal</button>
                        <button id="btn-hide" class="btn btn-xs btn-ghost" title="Hide from players">Hide</button>
                    </div>
                </div>

                <!-- Content -->
                <div style="flex:1; overflow-y:auto; min-height:0; padding:20px; display:flex; flex-direction:column; gap:24px;">
                    
                    <!-- ENTITIES PRESENT -->
                    <div class="section card" style="padding:16px; height:auto; min-height:0; overflow:visible; flex-shrink:0;">
                        <div class="accordion-toggle" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                            <h4 style="margin:0; font-size:14px;"><span class="acc-icon">▼</span> 👥 Entities Present</h4>
                            <button class="btn btn-sm btn-ghost" id="btn-spawn-here">+ Spawn Here</button>
                        </div>
                        <div style="display:block;">
                            <div id="entities-list" style="display:flex; flex-direction:column; gap:6px; overflow-y:visible;"></div>
                            <div style="font-size:10px; color:var(--text-muted); margin-top:8px;">
                                NPCs and monsters currently at this location.
                            </div>
                        </div>
                    </div>

                    <!-- NEW: Respawn & Population Settings -->
                    <div style="background:var(--bg-inset); padding:10px; border-radius:6px; margin-bottom:12px;">
                        <div style="font-weight:600; font-size:12px; margin-bottom:8px;">⚙️ Lifecycle</div>
                        <div style="display:flex; gap:12px;">
                            <div style="flex:1;">
                                <label style="font-size:11px;">Respawn Rate</label>
                                <select id="loc-respawn" class="input" style="width:100%;">
                                    <option value="never" ${rpg.respawnRate === 'never' ? 'selected' : ''}>Never</option>
                                    <option value="hourly" ${rpg.respawnRate === 'hourly' ? 'selected' : ''}>Hourly</option>
                                    <option value="daily" ${rpg.respawnRate === 'daily' ? 'selected' : ''}>Daily</option>
                                    <option value="weekly" ${rpg.respawnRate === 'weekly' ? 'selected' : ''}>Weekly</option>
                                </select>
                            </div>
                            <div style="flex:1; display:flex; align-items:flex-end;">
                                <button id="btn-repopulate" class="btn btn-sm btn-ghost" style="width:100%; border:1px solid var(--border-subtle);">
                                    🔄 Repopulate w/ New Table
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- ENCOUNTERS -->
                    <div class="section card" style="padding:16px; height:auto; min-height:0; overflow:visible; flex-shrink:0;">
                        <div class="accordion-toggle" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                            <h4 style="margin:0; font-size:14px;"><span class="acc-icon">▼</span> 💀 Encounters</h4>
                            <button class="btn btn-sm btn-ghost" id="btn-add-encounter">+ Add</button>
                        </div>
                        <div style="display:block;">
                            <div id="encounters-list" style="display:flex; flex-direction:column; gap:8px;"></div>
                            <div style="font-size:10px; color:var(--text-muted); margin-top:8px;">
                                Creatures from the Bestiary that can be found here.
                            </div>
                        </div>
                    </div>

                    <!-- LOOT -->
                    <div class="section card" style="padding:16px; height:auto; min-height:0; overflow:visible; flex-shrink:0;">
                         <div class="accordion-toggle" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                            <h4 style="margin:0; font-size:14px;"><span class="acc-icon">▼</span> 💎 Loot</h4>
                            <div style="display:flex; gap:8px;">
                                <button class="btn btn-sm btn-ghost" id="btn-add-loot-armory">From Armory</button>
                                <button class="btn btn-sm btn-ghost" id="btn-add-loot-custom">+ Custom</button>
                            </div>
                        </div>
                        <div style="display:block;">
                            <div id="loot-list" style="display:flex; flex-direction:column; gap:8px;"></div>
                            <div style="font-size:10px; color:var(--text-muted); margin-top:8px;">
                                Items that can be found or looted here.
                            </div>
                        </div>
                    </div>

                    <!-- TRAP -->
                    <div class="section card" style="padding:16px; height:auto; min-height:0; overflow:visible; flex-shrink:0;">
                        <div class="accordion-toggle" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                            <h4 style="margin:0; font-size:14px;"><span class="acc-icon">▼</span> ⚠️ Trap / Hazard</h4>
                        </div>
                        <div style="display:block;">
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:12px;">
                            <div>
                                <label class="label">Type</label>
                                <select class="input" id="trap-type" style="width:100%;"></select>
                            </div>
                            <div>
                                <label class="label">Difficulty</label>
                                <select class="input" id="trap-difficulty" style="width:100%;"></select>
                            </div>
                        </div>
                        <div id="trap-details" style="display:${rpg.trap?.type && rpg.trap.type !== 'none' ? 'grid' : 'none'}; grid-template-columns:1fr 1fr 1fr; gap:12px; margin-bottom:12px;">
                            <div>
                                <label class="label">DC to Detect</label>
                                <input type="number" class="input" id="trap-dc" style="width:100%;" value="${rpg.trap?.dc || 10}">
                            </div>
                            <div>
                                <label class="label">Damage</label>
                                <input type="text" class="input" id="trap-dmg" style="width:100%;" value="${rpg.trap?.dmg || '1d6'}" placeholder="1d6">
                            </div>
                            <div>
                                <label class="label">Save Type</label>
                                <select class="input" id="trap-save" style="width:100%;">
                                    <option value="DEX" ${rpg.trap?.save === 'DEX' ? 'selected' : ''}>DEX (Reflex)</option>
                                    <option value="CON" ${rpg.trap?.save === 'CON' ? 'selected' : ''}>CON (Fortitude)</option>
                                    <option value="WIS" ${rpg.trap?.save === 'WIS' ? 'selected' : ''}>WIS (Will)</option>
                                    <option value="STR" ${rpg.trap?.save === 'STR' ? 'selected' : ''}>STR (Strength)</option>
                                    <option value="INT" ${rpg.trap?.save === 'INT' ? 'selected' : ''}>INT (Tech)</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label class="label">Trap Description (GM notes)</label>
                            <textarea class="input" id="trap-desc" rows="2" style="width:100%;" placeholder="How the trap works, what triggers it...">${rpg.trap?.description || ''}</textarea>
                        </div>
                        </div>
                    </div>

                    <!-- SECRETS -->
                    <div class="section card" style="padding:16px; height:auto; min-height:0; overflow:visible; flex-shrink:0;">
                        <div class="accordion-toggle" style="margin-bottom:12px;">
                            <h4 style="margin:0; font-size:14px;"><span class="acc-icon">▼</span> 🤫 DM Secrets</h4>
                        </div>
                        <div style="display:block;">
                            <textarea class="input" id="dm-secrets" rows="5" style="width:100%;" placeholder="Hidden information, plot hooks, NPC motivations, secret passages...">${rpg.secrets || ''}</textarea>
                            <div style="font-size:10px; color:var(--text-muted); margin-top:8px;">
                                Only visible to the GM. Never shared with players.
                            </div>
                        </div>
                    </div>

                </div>
            `;


            // Wire Accordions
            editorMain.querySelectorAll('.accordion-toggle').forEach(header => {
                header.style.cursor = 'pointer';
                header.onclick = (e) => {
                    if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
                    const content = header.nextElementSibling;
                    const isCollapsed = content.style.display === 'none';
                    content.style.display = isCollapsed ? 'block' : 'none';
                    const icon = header.querySelector('.acc-icon');
                    if (icon) icon.textContent = isCollapsed ? '▼' : '▶';
                };
            });

            // === ENTITIES PRESENT ===
            const entitiesList = editorMain.querySelector('#entities-list');
            const renderEntities = () => {
                entitiesList.innerHTML = '';

                // Get all entities at this location
                const allEntities = RPG?.Entities?.getAll?.() || [];
                const localEntities = allEntities.filter(e => e.locationId === loc.id);

                if (localEntities.length === 0) {
                    entitiesList.innerHTML = '<div style="color:var(--text-muted); font-style:italic; font-size:11px; text-align:center; padding:12px;">No entities at this location.</div>';
                    return;
                }

                localEntities.forEach(entity => {
                    const isNpc = entity.type === 'npc';
                    const isMonster = entity.type === 'monster';
                    const isParty = entity.type === 'party_member';

                    const typeColor = isNpc ? 'var(--accent-primary)' : isMonster ? 'var(--status-error)' : 'var(--status-success)';
                    const typeIcon = isNpc ? '👤' : isMonster ? '💀' : '⚔️';
                    const typeLabel = isNpc ? 'NPC' : isMonster ? 'Monster' : 'Party';

                    const row = document.createElement('div');
                    row.style.cssText = 'display:flex; justify-content:space-between; align-items:center; padding:8px 10px; background:var(--bg-surface); border-radius:6px; border-left:3px solid ' + typeColor + ';';
                    row.innerHTML = `
                        <div style="display:flex; align-items:center; gap:8px;">
                            <span style="font-size:14px;">${typeIcon}</span>
                            <div>
                                <div style="font-weight:bold; font-size:12px; color:${typeColor};">${entity.name}</div>
                                <div style="font-size:10px; color:var(--text-muted);">HP:${entity.hp}/${entity.maxHp} • AC:${entity.ac} • ${typeLabel}</div>
                            </div>
                        </div>
                        <div style="display:flex; gap:4px;">
                            ${!isParty ? `<button class="btn btn-xs btn-ghost entity-remove" data-id="${entity.id}" title="Remove from location">✕</button>` : ''}
                        </div>
                    `;

                    const removeBtn = row.querySelector('.entity-remove');
                    if (removeBtn) {
                        removeBtn.onclick = () => {
                            if (confirm(`Remove ${entity.name} from this location?`)) {
                                RPG.Entities.remove(entity.id);
                                renderEntities();
                                if (A.UI.Toast) A.UI.Toast.show(`Removed ${entity.name}`, 'info');
                            }
                        };
                    }

                    entitiesList.appendChild(row);
                });
            };
            renderEntities();

            // Wire spawn button
            editorMain.querySelector('#btn-spawn-here').onclick = () => {
                const bestiary = state.rpg?.bestiary || [];
                if (bestiary.length === 0) {
                    if (A.UI.Toast) A.UI.Toast.show('Bestiary is empty. Create creatures first.', 'warning');
                    return;
                }

                const modalContent = document.createElement('div');
                modalContent.innerHTML = `
                    <input class="input" id="spawn-search" placeholder="Search creatures..." style="width:100%; margin-bottom:12px;">
                    <div id="spawn-list" style="max-height:300px; overflow-y:auto; display:flex; flex-direction:column; gap:4px;"></div>
                `;

                const renderSpawnList = (filter = '') => {
                    const list = modalContent.querySelector('#spawn-list');
                    list.innerHTML = '';

                    bestiary.filter(m => m.name.toLowerCase().includes(filter.toLowerCase())).forEach(mob => {
                        const isNpc = mob.creatureType === 'npc';
                        const btn = document.createElement('button');
                        btn.className = 'btn btn-ghost';
                        btn.style.cssText = 'text-align:left; padding:10px;';
                        btn.innerHTML = `
                            <div style="display:flex; justify-content:space-between; align-items:center;">
                                <div>
                                    <div style="font-weight:bold; color:${isNpc ? 'var(--accent-primary)' : 'var(--status-error)'};">${mob.name}</div>
                                    <div style="font-size:10px; opacity:0.7;">HP:${mob.hp} AC:${mob.ac} ${mob.creatureType === 'npc' ? '[NPC]' : '[Monster]'}</div>
                                </div>
                            </div>
                        `;
                        btn.onclick = () => {
                            // Spawn at this location
                            const entityId = RPG.Entities.create({
                                type: mob.creatureType || 'monster',
                                name: mob.name,
                                hp: mob.hp,
                                maxHp: mob.hp,
                                ac: mob.ac,
                                xp: mob.xp || 0,
                                stats: mob.stats || { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 },
                                inventory: mob.inventory || [],
                                description: mob.description || '',
                                locationId: loc.id
                            });

                            if (entityId) {
                                if (A.UI.Toast) A.UI.Toast.show(`Spawned ${mob.name} at ${loc.name}!`, 'success');
                                renderEntities();
                                A.UI.Modal.hide();
                            }
                        };
                        list.appendChild(btn);
                    });
                };

                A.UI.Modal.show({
                    title: `🎯 Spawn at ${loc.name}`,
                    content: modalContent,
                    width: 400
                });

                modalContent.querySelector('#spawn-search').oninput = (e) => renderSpawnList(e.target.value);
                renderSpawnList();
            };

            // === ENCOUNTERS ===
            const encountersList = editorMain.querySelector('#encounters-list');
            const renderEncounters = () => {
                encountersList.innerHTML = '';
                if (!rpg.encounters || rpg.encounters.length === 0) {
                    encountersList.innerHTML = '<div style="color:var(--text-muted); font-style:italic; font-size:11px; text-align:center; padding:12px;">No encounters. This area is safe.</div>';
                    return;
                }

                rpg.encounters.forEach((entry, idx) => {
                    const mobId = typeof entry === 'string' ? entry : entry.id;
                    const count = typeof entry === 'object' ? entry.count : 1;
                    const mob = state.rpg.bestiary?.find(m => m.id === mobId);

                    const row = document.createElement('div');
                    row.style.cssText = 'display:flex; justify-content:space-between; align-items:center; padding:10px; background:var(--bg-surface); border-radius:6px;';
                    row.innerHTML = `
                        <div style="display:flex; align-items:center; gap:8px;">
                            <span style="font-size:16px;">💀</span>
                            <div>
                                <div style="font-weight:bold; color:var(--status-error);">${mob?.name || mobId}</div>
                                ${mob ? `<div style="font-size:10px; color:var(--text-muted);">HP:${mob.hp} AC:${mob.ac} XP:${mob.xp || 0}</div>` : ''}
                            </div>
                        </div>
                        <div style="display:flex; align-items:center; gap:8px;">
                            <div style="display:flex; align-items:center; gap:4px;">
                                <label style="font-size:10px; color:var(--text-muted);">×</label>
                                <input type="number" class="input encounter-count" data-idx="${idx}" style="width:50px; text-align:center;" value="${count}" min="1">
                            </div>
                            <button class="btn btn-xs btn-ghost encounter-remove" data-idx="${idx}" style="color:var(--status-error);">✕</button>
                        </div>
                    `;
                    encountersList.appendChild(row);
                });

                // Wire encounter inputs
                encountersList.querySelectorAll('.encounter-count').forEach(inp => {
                    inp.onchange = (e) => {
                        const idx = parseInt(e.target.dataset.idx);
                        const entry = rpg.encounters[idx];
                        if (typeof entry === 'string') {
                            rpg.encounters[idx] = { id: entry, count: parseInt(e.target.value) || 1 };
                        } else {
                            entry.count = parseInt(e.target.value) || 1;
                        }
                        A.State.notify();
                        if (A.Project?.save) A.Project.save();
                    };
                });

                encountersList.querySelectorAll('.encounter-remove').forEach(btn => {
                    btn.onclick = () => {
                        rpg.encounters.splice(parseInt(btn.dataset.idx), 1);
                        A.State.notify();
                        if (A.Project?.save) A.Project.save();
                        renderEncounters();
                        renderList();
                    };
                });
            };
            renderEncounters();

            // Wire visibility controls
            editorMain.querySelector('#btn-reveal').onclick = () => {
                if (A.RPGEngine?.revealLocation) {
                    A.RPGEngine.revealLocation(loc.id);
                    const visStatus = editorMain.querySelector('#vis-status');
                    if (visStatus) visStatus.textContent = 'revealed';
                    if (A.UI?.Toast) A.UI.Toast.show(`Location "${loc.name}" revealed to players`, 'success');
                    renderList();
                }
            };

            editorMain.querySelector('#btn-hide').onclick = () => {
                const state = A.State.get();
                if (state?.rpg?.locationVisibility) {
                    state.rpg.locationVisibility[loc.id] = 'unknown';
                    A.State.notify();
                    const visStatus = editorMain.querySelector('#vis-status');
                    if (visStatus) visStatus.textContent = 'unknown';
                    if (A.UI?.Toast) A.UI.Toast.show(`Location "${loc.name}" hidden from players`, 'info');
                    renderList();
                }
            };

            editorMain.querySelector('#btn-add-encounter').onclick = () => {
                const bestiary = state.rpg.bestiary || [];
                if (bestiary.length === 0) {
                    if (A.UI.Toast) A.UI.Toast.show('No creatures in Bestiary. Create some first.', 'warning');
                    return;
                }

                const modalContent = document.createElement('div');
                modalContent.style.cssText = 'display:flex; flex-direction:column; gap:8px; max-height:400px; overflow-y:auto;';

                bestiary.forEach(mob => {
                    const btn = document.createElement('button');
                    btn.className = 'btn btn-ghost';
                    btn.style.cssText = 'text-align:left; padding:10px;';
                    btn.innerHTML = `
                        <div style="font-weight:bold; color:var(--status-error);">💀 ${mob.name}</div>
                        <div style="font-size:10px; opacity:0.7;">HP:${mob.hp} AC:${mob.ac} ${mob.creatureType === 'npc' ? '[NPC]' : '[Monster]'}</div>
                    `;
                    btn.onclick = () => {
                        if (!rpg.encounters) rpg.encounters = [];
                        rpg.encounters.push({ id: mob.id, count: 1 });
                        A.State.notify();
                        if (A.Project?.save) A.Project.save();
                        renderEncounters();
                        renderList();
                        A.UI.Modal.hide();
                    };
                    modalContent.appendChild(btn);
                });

                A.UI.Modal.show({ title: '💀 Add Encounter', content: modalContent, width: 350 });
            };

            // === LOOT ===
            const lootList = editorMain.querySelector('#loot-list');
            const renderLoot = () => {
                lootList.innerHTML = '';
                if (!rpg.loot || rpg.loot.length === 0) {
                    lootList.innerHTML = '<div style="color:var(--text-muted); font-style:italic; font-size:11px; text-align:center; padding:12px;">No loot here.</div>';
                    return;
                }

                rpg.loot.forEach((item, idx) => {
                    const itemName = typeof item === 'string' ? item : item.name;
                    const itemId = typeof item === 'object' ? item.id : null;
                    const qty = typeof item === 'object' ? item.qty : 1;

                    // Look up from armory if it's an ID reference
                    const armoryItem = itemId ? state.rpg.items?.find(i => i.id === itemId) : null;
                    const displayName = armoryItem?.name || itemName;
                    const isArmoryItem = !!armoryItem;

                    const row = document.createElement('div');
                    row.style.cssText = 'display:flex; justify-content:space-between; align-items:center; padding:10px; background:var(--bg-surface); border-radius:6px;';
                    row.innerHTML = `
                        <div style="display:flex; align-items:center; gap:8px;">
                            <span style="font-size:16px;">${isArmoryItem ? (armoryItem.type === 'weapon' ? '⚔️' : armoryItem.type === 'armor' ? '🛡️' : '💎') : '📦'}</span>
                            <div>
                                <div style="font-weight:bold; color:var(--accent-secondary);">${displayName}</div>
                                ${isArmoryItem ? `<div style="font-size:10px; color:var(--text-muted);">${armoryItem.type} • ${armoryItem.cost || 0} currency</div>` : ''}
                            </div>
                        </div>
                        <div style="display:flex; align-items:center; gap:8px;">
                            <div style="display:flex; align-items:center; gap:4px;">
                                <label style="font-size:10px; color:var(--text-muted);">×</label>
                                <input type="number" class="input loot-qty" data-idx="${idx}" style="width:50px; text-align:center;" value="${qty}" min="1">
                            </div>
                            <button class="btn btn-xs btn-ghost loot-remove" data-idx="${idx}" style="color:var(--status-error);">✕</button>
                        </div>
                    `;
                    lootList.appendChild(row);
                });

                // Wire loot inputs
                lootList.querySelectorAll('.loot-qty').forEach(inp => {
                    inp.onchange = (e) => {
                        const idx = parseInt(e.target.dataset.idx);
                        const item = rpg.loot[idx];
                        if (typeof item === 'string') {
                            rpg.loot[idx] = { name: item, qty: parseInt(e.target.value) || 1 };
                        } else {
                            item.qty = parseInt(e.target.value) || 1;
                        }
                        A.State.notify();
                        if (A.Project?.save) A.Project.save();
                    };
                });

                lootList.querySelectorAll('.loot-remove').forEach(btn => {
                    btn.onclick = () => {
                        rpg.loot.splice(parseInt(btn.dataset.idx), 1);
                        A.State.notify();
                        if (A.Project?.save) A.Project.save();
                        renderLoot();
                        renderList();
                    };
                });
            };
            renderLoot();

            editorMain.querySelector('#btn-add-loot-armory').onclick = () => {
                const armory = state.rpg.items || [];
                if (armory.length === 0) {
                    if (A.UI.Toast) A.UI.Toast.show('Armory is empty. Add items first.', 'warning');
                    return;
                }

                const modalContent = document.createElement('div');
                modalContent.innerHTML = '<input class="input" id="armory-search" placeholder="Search..." style="width:100%; margin-bottom:12px;"><div id="armory-results" style="display:flex; flex-direction:column; gap:4px; max-height:300px; overflow-y:auto;"></div>';

                const renderResults = (filter = '') => {
                    const results = modalContent.querySelector('#armory-results');
                    results.innerHTML = '';
                    armory.filter(i => i.name.toLowerCase().includes(filter.toLowerCase())).forEach(item => {
                        const btn = document.createElement('button');
                        btn.className = 'btn btn-ghost';
                        btn.style.cssText = 'text-align:left; padding:8px;';
                        const icon = item.type === 'weapon' ? '⚔️' : item.type === 'armor' ? '🛡️' : item.type === 'consumable' ? '🧪' : '📦';
                        btn.innerHTML = `<strong>${icon} ${item.name}</strong> <span style="opacity:0.6;">(${item.type})</span>`;
                        btn.onclick = () => {
                            if (!rpg.loot) rpg.loot = [];
                            rpg.loot.push({ id: item.id, name: item.name, qty: 1 });
                            A.State.notify();
                            if (A.Project?.save) A.Project.save();
                            renderLoot();
                            renderList();
                            A.UI.Modal.hide();
                        };
                        results.appendChild(btn);
                    });
                };

                A.UI.Modal.show({ title: '💎 Add from Armory', content: modalContent, width: 350 });
                modalContent.querySelector('#armory-search').oninput = (e) => renderResults(e.target.value);
                renderResults();
            };

            editorMain.querySelector('#btn-add-loot-custom').onclick = () => {
                const name = prompt('Enter item name:');
                if (name && name.trim()) {
                    if (!rpg.loot) rpg.loot = [];
                    rpg.loot.push({ name: name.trim(), qty: 1 });
                    A.State.notify();
                    if (A.Project?.save) A.Project.save();
                    renderLoot();
                    renderList();
                }
            };

            // === TRAP ===
            const trapTypeSelect = editorMain.querySelector('#trap-type');
            const trapDifficultySelect = editorMain.querySelector('#trap-difficulty');
            const trapDetails = editorMain.querySelector('#trap-details');

            // Populate trap type dropdown
            TRAP_TYPES.forEach(t => {
                const opt = document.createElement('option');
                opt.value = t.id;
                opt.textContent = `${t.icon} ${t.label}`;
                if (rpg.trap?.type === t.id) opt.selected = true;
                trapTypeSelect.appendChild(opt);
            });

            // Populate difficulty dropdown
            DIFFICULTY_PRESETS.forEach((d, i) => {
                const opt = document.createElement('option');
                opt.value = i;
                opt.textContent = `${d.label} (DC ${d.dc}, ${d.dmg})`;
                trapDifficultySelect.appendChild(opt);
            });

            trapTypeSelect.onchange = (e) => {
                if (!rpg.trap) rpg.trap = {};
                rpg.trap.type = e.target.value;
                trapDetails.style.display = e.target.value !== 'none' ? 'grid' : 'none';
                A.State.notify();
                if (A.Project?.save) A.Project.save();
                renderList();
            };

            trapDifficultySelect.onchange = (e) => {
                const preset = DIFFICULTY_PRESETS[parseInt(e.target.value)];
                if (preset && rpg.trap) {
                    rpg.trap.dc = preset.dc;
                    rpg.trap.dmg = preset.dmg;
                    editorMain.querySelector('#trap-dc').value = preset.dc;
                    editorMain.querySelector('#trap-dmg').value = preset.dmg;
                    A.State.notify();
                    if (A.Project?.save) A.Project.save();
                }
            };

            editorMain.querySelector('#trap-dc').onchange = (e) => {
                if (!rpg.trap) rpg.trap = {};
                rpg.trap.dc = parseInt(e.target.value) || 10;
                A.State.notify();
                if (A.Project?.save) A.Project.save();
            };

            editorMain.querySelector('#trap-dmg').onchange = (e) => {
                if (!rpg.trap) rpg.trap = {};
                rpg.trap.dmg = e.target.value;
                A.State.notify();
                if (A.Project?.save) A.Project.save();
            };

            editorMain.querySelector('#trap-save').onchange = (e) => {
                if (!rpg.trap) rpg.trap = {};
                rpg.trap.save = e.target.value;
                A.State.notify();
                if (A.Project?.save) A.Project.save();
            };

            editorMain.querySelector('#trap-desc').onchange = (e) => {
                if (!rpg.trap) rpg.trap = {};
                rpg.trap.description = e.target.value;
                A.State.notify();
                if (A.Project?.save) A.Project.save();
            };

            // === SECRETS ===
            editorMain.querySelector('#dm-secrets').onchange = (e) => {
                rpg.secrets = e.target.value;
                A.State.notify();
                if (A.Project?.save) A.Project.save();
                renderList();
            };
        };

        // Initial render
        renderList();
    }

    A.registerPanel('rpg_dm_map', {
        label: 'GM Atlas',
        subtitle: 'Loot, Traps & Secrets',
        category: 'RPG Experiment',
        subcategory: 'Game Master',
        order: 20,
        icon: '🗺️',
        render: render
    });

})(window.Anansi);
