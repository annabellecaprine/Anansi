/*
 * Anansi Panel: RPG Roleplay
 * File: js/panels/rpg_roleplay.js
 * Category: RPG Experiment
 * Purpose: Single-player MUD with JRPG command overlay. Three modes: Combat, Explore, Roleplay.
 */

(function (A) {
    'use strict';

    // ===========================================
    // MODE DEFINITIONS
    // ===========================================
    const MODES = {
        combat: {
            id: 'combat',
            label: '⚔️ Combat',
            color: 'var(--status-error)',
            description: 'Turn-based tactical combat',
            actions: [
                { id: 'attack', icon: '⚔️', label: 'Attack', desc: 'Strike an enemy' },
                { id: 'defend', icon: '🛡️', label: 'Defend', desc: 'Raise your guard' },
                { id: 'abilities', icon: '✨', label: 'Abilities', desc: 'Use spells/skills' },
                { id: 'items', icon: '🎒', label: 'Items', desc: 'Use consumables' },
                { id: 'flee', icon: '🏃', label: 'Flee', desc: 'Attempt to escape' },
                { id: 'pass', icon: '⏭️', label: 'End Turn', desc: 'Pass your turn' }
            ]
        },
        explore: {
            id: 'explore',
            label: '🔍 Explore',
            color: 'var(--status-warning)',
            description: 'Environmental interaction',
            actions: [
                { id: 'search', icon: '🔍', label: 'Search', desc: 'Look for hidden things' },
                { id: 'examine', icon: '👁️', label: 'Examine', desc: 'Inspect something closely' },
                { id: 'loot', icon: '💰', label: 'Loot', desc: 'Collect items' },
                { id: 'move', icon: '🚶', label: 'Move', desc: 'Go somewhere' },
                { id: 'rest', icon: '🏕️', label: 'Rest', desc: 'Recover HP/MP' },
                { id: 'interact', icon: '🖐️', label: 'Interact', desc: 'Use something' }
            ]
        },
        roleplay: {
            id: 'roleplay',
            label: '💬 Roleplay',
            color: 'var(--accent-primary)',
            description: 'Free-form narrative',
            actions: [
                { id: 'say', icon: '💬', label: 'Say', desc: 'Speak as your character' },
                { id: 'talk', icon: '🗣️', label: 'Talk To', desc: 'Converse with NPC' },
                { id: 'emote', icon: '🎭', label: 'Emote', desc: 'Express an action' },
                { id: 'think', icon: '💭', label: 'Think', desc: 'Internal monologue' },
                { id: 'describe', icon: '📝', label: 'Describe', desc: 'Narrate the scene' },
                { id: 'freeform', icon: '✍️', label: 'Free', desc: 'Write anything' }
            ]
        }
    };

    let containerEl = null;
    let chatLog = null;
    let inputField = null;
    let currentMode = 'roleplay';

    function render(container) {
        containerEl = container;
        container.style.height = '100%';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.background = 'var(--bg-base)';
        container.style.padding = '0';
        container.style.overflow = 'hidden';

        // Restore mode from state if available
        const state = A.State.get();
        if (state.rpg?.sessionMode) currentMode = state.rpg.sessionMode;

        // 1. Header with Mode Tabs
        const header = document.createElement('div');
        header.style.cssText = 'display:flex; flex-direction:column; background:var(--bg-elevated); border-bottom:1px solid var(--border-subtle);';

        // Top row
        const headerTop = document.createElement('div');
        headerTop.style.cssText = 'display:flex; justify-content:space-between; align-items:center; padding:8px 16px;';
        headerTop.innerHTML = `
            <div style="display:flex; align-items:center; gap:8px;">
                <span style="font-size:16px;">🎮</span>
                <strong>Session</strong>
                <span id="combat-status" style="font-size:11px; padding:2px 8px; border-radius:4px; background:var(--bg-surface); display:none;"></span>
            </div>
            <div style="display:flex; gap:8px;">
                <button class="btn btn-sm btn-ghost" id="btn-start-combat" title="Start Combat">⚔️ Combat</button>
                <button class="btn btn-sm btn-ghost" id="rpg-clear">🗑️ Clear</button>
            </div>
        `;
        header.appendChild(headerTop);

        // Mode Tabs
        const modeTabs = document.createElement('div');
        modeTabs.id = 'mode-tabs';
        modeTabs.style.cssText = 'display:flex; border-top:1px solid var(--border-subtle);';
        header.appendChild(modeTabs);

        container.appendChild(header);

        // Render mode tabs
        function renderModeTabs() {
            modeTabs.innerHTML = '';
            Object.values(MODES).forEach(mode => {
                const isActive = currentMode === mode.id;
                const tab = document.createElement('button');
                tab.className = 'btn btn-ghost';
                tab.style.cssText = `
                    flex:1; padding:10px; border-radius:0; font-size:12px; font-weight:${isActive ? 'bold' : 'normal'};
                    border-bottom:3px solid ${isActive ? mode.color : 'transparent'};
                    color:${isActive ? mode.color : 'var(--text-muted)'};
                    background:${isActive ? 'var(--bg-surface)' : 'transparent'};
                `;
                tab.innerHTML = `${mode.label}`;
                tab.onclick = () => {
                    currentMode = mode.id;
                    if (!state.rpg) state.rpg = {};
                    state.rpg.sessionMode = mode.id;
                    renderModeTabs();
                    renderActionBar();
                    updateActionBarVisibility();
                };
                modeTabs.appendChild(tab);
            });
        }
        renderModeTabs();

        // 2. Chat Area
        const chatArea = document.createElement('div');
        chatArea.id = 'rpg-chat-log';
        chatArea.style.cssText = 'flex:1; overflow-y:auto; padding:16px; display:flex; flex-direction:column; gap:12px; background:var(--bg-base);';
        container.appendChild(chatArea);
        chatLog = chatArea;

        // 3. Action Bar (Mode-specific)
        const actionBar = document.createElement('div');
        actionBar.id = 'rpg-action-bar';
        actionBar.style.cssText = 'padding:12px 16px; background:var(--bg-elevated); border-top:1px solid var(--border-subtle);';
        container.appendChild(actionBar);

        // 4. Selector Area (for targeting, etc.)
        const selectorArea = document.createElement('div');
        selectorArea.id = 'rpg-selector';
        selectorArea.style.cssText = 'padding:10px 16px; background:var(--bg-surface); border-top:1px solid var(--border-subtle); display:none; flex-wrap:wrap; gap:8px; align-items:center;';
        container.appendChild(selectorArea);

        // 5. Input Area
        const inputArea = document.createElement('div');
        inputArea.style.cssText = 'padding:12px 16px; background:var(--bg-elevated); border-top:1px solid var(--border-subtle); display:flex; gap:8px;';
        inputArea.innerHTML = `
            <div style="flex:1; position:relative;">
                <textarea id="rpg-input" class="input" rows="1" placeholder="Type your action or dialogue..." 
                    style="width:100%; resize:none; font-family:var(--font-sans); padding-right:40px;"></textarea>
                <span id="input-hint" style="position:absolute; right:10px; top:50%; transform:translateY(-50%); font-size:10px; color:var(--text-muted); pointer-events:none;"></span>
            </div>
            <button class="btn btn-primary" id="rpg-send" style="height:auto;">Send</button>
        `;
        container.appendChild(inputArea);

        inputField = inputArea.querySelector('#rpg-input');
        const sendBtn = inputArea.querySelector('#rpg-send');
        const inputHint = inputArea.querySelector('#input-hint');

        // ============================================
        // ACTION BAR RENDERING
        // ============================================
        function renderActionBar() {
            const mode = MODES[currentMode];
            actionBar.innerHTML = '';

            // Mode indicator
            const modeIndicator = document.createElement('div');
            modeIndicator.style.cssText = 'display:flex; align-items:center; gap:12px; flex-wrap:wrap;';

            // Action buttons
            const actionsDiv = document.createElement('div');
            actionsDiv.style.cssText = 'display:flex; gap:6px; flex-wrap:wrap;';

            mode.actions.forEach(action => {
                const btn = document.createElement('button');
                btn.className = 'btn btn-sm';
                btn.style.cssText = `display:flex; align-items:center; gap:4px; padding:8px 12px;`;
                btn.innerHTML = `<span>${action.icon}</span><span>${action.label}</span>`;
                btn.title = action.desc;
                btn.dataset.action = action.id;
                btn.onclick = () => handleAction(action.id);
                actionsDiv.appendChild(btn);
            });

            modeIndicator.appendChild(actionsDiv);
            actionBar.appendChild(modeIndicator);
        }

        // ============================================
        // ACTION HANDLERS
        // ============================================
        let pendingAction = null;

        const getActiveActor = () => {
            const state = A.State.get();
            if (!state.rpg?.combat?.active) {
                // Not in combat - return first party member
                const actors = Object.values(state.nodes?.actors?.items || {});
                return actors.find(a => a.data?.rpg?.enabled && a.data.rpg.type !== 'monster') || null;
            }
            const c = state.rpg.combat;
            const activeEntry = c.order[c.turn];
            if (!activeEntry) return null;
            return state.nodes.actors.items[activeEntry.id] || null;
        };

        const getTargets = (type) => {
            const state = A.State.get();
            const actors = Object.values(state.nodes?.actors?.items || {}).filter(a => a.data?.rpg?.enabled && (a.data.rpg.hp || 0) > 0);
            if (type === 'enemy') return actors.filter(a => a.data.rpg.type === 'monster');
            if (type === 'ally') return actors.filter(a => a.data.rpg.type !== 'monster');
            if (type === 'npc') return actors.filter(a => a.data.rpg.type === 'npc');
            return actors;
        };

        const showSelector = (label, options, onSelect, allowText = false) => {
            selectorArea.style.display = 'flex';
            selectorArea.innerHTML = `<span style="font-size:11px; color:var(--text-muted); margin-right:8px; font-weight:bold;">${label}:</span>`;

            const optionsWrap = document.createElement('div');
            optionsWrap.style.cssText = 'display:flex; gap:4px; flex-wrap:wrap; flex:1;';

            options.forEach(opt => {
                const btn = document.createElement('button');
                btn.className = 'btn btn-sm btn-ghost';
                btn.style.padding = '6px 10px';
                btn.textContent = opt.label;
                btn.onclick = () => {
                    selectorArea.style.display = 'none';
                    onSelect(opt);
                };
                optionsWrap.appendChild(btn);
            });

            selectorArea.appendChild(optionsWrap);

            // Text input option
            if (allowText) {
                const textInput = document.createElement('input');
                textInput.className = 'input';
                textInput.placeholder = 'Or type...';
                textInput.style.cssText = 'width:120px; font-size:11px;';
                textInput.onkeydown = (e) => {
                    if (e.key === 'Enter' && textInput.value.trim()) {
                        selectorArea.style.display = 'none';
                        onSelect({ id: 'custom', label: textInput.value.trim() });
                    }
                };
                selectorArea.appendChild(textInput);
            }

            const cancelBtn = document.createElement('button');
            cancelBtn.className = 'btn btn-xs';
            cancelBtn.style.marginLeft = '8px';
            cancelBtn.textContent = '✕';
            cancelBtn.onclick = () => { selectorArea.style.display = 'none'; pendingAction = null; };
            selectorArea.appendChild(cancelBtn);
        };

        const executeCommand = (command, prefix = '') => {
            selectorArea.style.display = 'none';
            pendingAction = null;
            const fullCommand = prefix ? `[${prefix}] ${command}` : command;
            inputField.value = fullCommand;
            sendMessage();
        };

        function handleAction(actionId) {
            const state = A.State.get();
            const actor = getActiveActor();
            const mode = MODES[currentMode];

            // ============ COMBAT MODE ============
            if (currentMode === 'combat') {
                if (actionId === 'attack') {
                    const armory = state.rpg?.items || [];
                    const equipped = actor?.data?.rpg?.equipped || {};
                    const weapons = [];
                    if (equipped.main_hand) {
                        const wpn = armory.find(i => i.id === equipped.main_hand);
                        if (wpn) weapons.push({ id: wpn.id, label: `${wpn.name} (${wpn.dmg || 'melee'})` });
                    }
                    weapons.push({ id: 'unarmed', label: 'Unarmed (1d4)' });

                    showSelector('Weapon', weapons, (weapon) => {
                        const enemies = getTargets('enemy').map(e => ({ id: e.id, label: `${e.name} (HP:${e.data.rpg.hp})` }));
                        if (enemies.length === 0) {
                            appendMessage('system', '⚠️ No enemies to attack.');
                            selectorArea.style.display = 'none';
                            return;
                        }
                        showSelector('Target', enemies, (target) => {
                            const targetName = target.label.split(' (')[0];
                            executeCommand(`Melee Attack ${targetName}`, 'COMBAT');
                        });
                    });
                } else if (actionId === 'defend') {
                    executeCommand('Defend', 'COMBAT');
                } else if (actionId === 'abilities') {
                    const feats = actor?.data?.rpg?.feats || [];
                    const featDb = state.rpg?.featDatabase || [];
                    const options = feats.map(fid => {
                        const f = featDb.find(x => x.id === fid) || { name: fid };
                        const cost = f.activation?.cost ? ` (${f.activation.cost} ${f.activation.costType || 'MP'})` : '';
                        return { id: fid, label: f.name + cost, feat: f };
                    });
                    if (options.length === 0) {
                        appendMessage('system', '⚠️ No abilities available. Add feats in the Party panel.');
                        return;
                    }
                    showSelector('Ability', options, (ability) => {
                        const feat = ability.feat;
                        const targeting = feat.targeting?.type || feat.target;
                        if (targeting === 'self') {
                            executeCommand(`Use Ability ${ability.feat.name}`, 'ABILITY');
                        } else if (targeting === 'enemy' || targeting === 'all_enemies') {
                            const enemies = getTargets('enemy').map(e => ({ id: e.id, label: e.name }));
                            showSelector('Target', enemies, (target) => {
                                executeCommand(`Use Ability ${ability.feat.name} on ${target.label}`, 'ABILITY');
                            });
                        } else if (targeting === 'ally' || targeting === 'all_allies') {
                            const allies = getTargets('ally').map(e => ({ id: e.id, label: e.name }));
                            showSelector('Target', allies, (target) => {
                                executeCommand(`Use Ability ${ability.feat.name} on ${target.label}`, 'ABILITY');
                            });
                        } else {
                            executeCommand(`Use Ability ${ability.feat.name}`, 'ABILITY');
                        }
                    });
                } else if (actionId === 'items') {
                    const inventory = actor?.data?.rpg?.inventory || [];
                    const armory = state.rpg?.items || [];
                    const consumables = inventory.map(itemId => {
                        const item = armory.find(i => i.id === itemId);
                        return item ? { id: itemId, label: item.name, item } : null;
                    }).filter(i => i && i.item.type !== 'weapon' && i.item.type !== 'armor');
                    if (consumables.length === 0) {
                        appendMessage('system', '⚠️ No usable items in inventory.');
                        return;
                    }
                    showSelector('Item', consumables, (item) => {
                        executeCommand(`Use Item ${item.label}`, 'ITEM');
                    });
                } else if (actionId === 'flee') {
                    executeCommand('Flee', 'COMBAT');
                } else if (actionId === 'pass') {
                    executeCommand('End Turn', 'COMBAT');
                }
            }
            // ============ EXPLORE MODE ============
            else if (currentMode === 'explore') {
                if (actionId === 'search') {
                    showSelector('Search', [
                        { id: 'area', label: 'Search the area' },
                        { id: 'hidden', label: 'Look for hidden doors' },
                        { id: 'traps', label: 'Check for traps' }
                    ], (opt) => {
                        executeCommand(opt.label, 'EXPLORE');
                    }, true);
                } else if (actionId === 'examine') {
                    inputField.placeholder = 'What do you want to examine?';
                    inputField.focus();
                    pendingAction = 'examine';
                    inputHint.textContent = '👁️ EXAMINE';
                } else if (actionId === 'loot') {
                    const deadEnemies = Object.values(state.nodes?.actors?.items || {})
                        .filter(a => a.data?.rpg?.type === 'monster' && (a.data.rpg.hp || 0) <= 0)
                        .map(e => ({ id: e.id, label: e.name }));
                    if (deadEnemies.length === 0) {
                        showSelector('Loot', [
                            { id: 'ground', label: 'Search the ground' },
                            { id: 'container', label: 'Open container' }
                        ], (opt) => executeCommand(opt.label, 'LOOT'), true);
                    } else {
                        showSelector('Loot', deadEnemies, (target) => {
                            executeCommand(`Loot ${target.label}`, 'LOOT');
                        });
                    }
                } else if (actionId === 'move') {
                    showSelector('Direction', [
                        { id: 'north', label: '⬆️ North' },
                        { id: 'south', label: '⬇️ South' },
                        { id: 'east', label: '➡️ East' },
                        { id: 'west', label: '⬅️ West' },
                        { id: 'up', label: '🔼 Up' },
                        { id: 'down', label: '🔽 Down' }
                    ], (dir) => {
                        executeCommand(`Move ${dir.label.split(' ')[1]}`, 'MOVE');
                    }, true);
                } else if (actionId === 'rest') {
                    showSelector('Rest', [
                        { id: 'short', label: '☕ Short Rest (recover HP)' },
                        { id: 'long', label: '🏕️ Long Rest (full recovery)' }
                    ], (opt) => {
                        executeCommand(opt.label, 'REST');
                    });
                } else if (actionId === 'interact') {
                    inputField.placeholder = 'What do you want to interact with?';
                    inputField.focus();
                    pendingAction = 'interact';
                    inputHint.textContent = '🖐️ INTERACT';
                }
            }
            // ============ ROLEPLAY MODE ============
            else if (currentMode === 'roleplay') {
                if (actionId === 'say') {
                    inputField.placeholder = 'What does your character say?';
                    inputField.focus();
                    pendingAction = 'say';
                    inputHint.textContent = '💬 SAY';
                } else if (actionId === 'talk') {
                    const npcs = getTargets('npc').map(n => ({ id: n.id, label: n.name }));
                    const allies = getTargets('ally').map(n => ({ id: n.id, label: n.name }));
                    const targets = [...npcs, ...allies];
                    if (targets.length === 0) {
                        appendMessage('system', '⚠️ No one to talk to.');
                        return;
                    }
                    showSelector('Talk to', targets, (target) => {
                        inputField.placeholder = `What do you say to ${target.label}?`;
                        inputField.focus();
                        pendingAction = { type: 'talk', target: target.label };
                        inputHint.textContent = `🗣️ TO ${target.label.toUpperCase()}`;
                    });
                } else if (actionId === 'emote') {
                    showSelector('Emote', [
                        { id: 'smile', label: '😊 smiles' },
                        { id: 'nod', label: '👍 nods' },
                        { id: 'frown', label: '😟 frowns' },
                        { id: 'laugh', label: '😂 laughs' },
                        { id: 'shrug', label: '🤷 shrugs' }
                    ], (emote) => {
                        const actor = getActiveActor();
                        executeCommand(`*${actor?.name || 'You'} ${emote.label}*`, 'EMOTE');
                    }, true);
                } else if (actionId === 'think') {
                    inputField.placeholder = 'What is your character thinking?';
                    inputField.focus();
                    pendingAction = 'think';
                    inputHint.textContent = '💭 THINK';
                } else if (actionId === 'describe') {
                    inputField.placeholder = 'Describe the scene or action...';
                    inputField.focus();
                    pendingAction = 'describe';
                    inputHint.textContent = '📝 DESCRIBE';
                } else if (actionId === 'freeform') {
                    inputField.placeholder = 'Write anything...';
                    inputField.focus();
                    pendingAction = null;
                    inputHint.textContent = '';
                }
            }
        }

        // ============================================
        // MESSAGE HANDLING
        // ============================================
        const sendMessage = async () => {
            let text = inputField.value.trim();
            if (!text) return;

            // Apply pending action formatting
            if (pendingAction) {
                if (pendingAction === 'say') {
                    text = `"${text}"`;
                } else if (pendingAction === 'think') {
                    text = `*${getActiveActor()?.name || 'You'} thinks: "${text}"*`;
                } else if (pendingAction === 'examine') {
                    text = `[EXAMINE] ${text}`;
                } else if (pendingAction === 'interact') {
                    text = `[INTERACT] ${text}`;
                } else if (pendingAction === 'describe') {
                    text = `[NARRATION] ${text}`;
                } else if (typeof pendingAction === 'object' && pendingAction.type === 'talk') {
                    text = `[TALK TO ${pendingAction.target.toUpperCase()}] "${text}"`;
                }
                pendingAction = null;
                inputHint.textContent = '';
            }

            appendMessage('user', text);
            inputField.value = '';
            inputField.placeholder = 'Type your action or dialogue...';

            const loadingId = appendMessage('system', '...');

            try {
                if (A.Simulator && A.Simulator.processRound) {
                    const state = A.State.get();
                    const history = state.sim ? state.sim.history : [];
                    const roundResult = A.Simulator.processRound(text, history, 'input', { source: 'rpg_session' });

                    if (roundResult.context.system_notes) {
                        const sysEl = document.getElementById(loadingId);
                        if (sysEl) {
                            sysEl.innerHTML = formatSystemNotes(roundResult.context.system_notes);
                            sysEl.style.fontStyle = 'normal';
                            sysEl.style.opacity = '1';
                            sysEl.style.background = 'var(--bg-surface)';
                            sysEl.style.border = '1px solid var(--border-subtle)';
                            sysEl.style.padding = '12px';
                            sysEl.style.borderRadius = '8px';
                            sysEl.style.alignSelf = 'stretch';
                            sysEl.style.maxWidth = '100%';
                        }
                    } else {
                        const loadingEl = document.getElementById(loadingId);
                        if (loadingEl) loadingEl.remove();
                    }

                    // TODO: Integrate LLM response for narrative
                    // For now, we show the system processing result
                    updateCombatStatus();

                } else {
                    document.getElementById(loadingId).textContent = "⚠️ Simulator engine not available.";
                }
            } catch (err) {
                console.error(err);
                const el = document.getElementById(loadingId);
                if (el) el.textContent = "❌ Error: " + err.message;
            }
        };

        // Format system notes with styling
        function formatSystemNotes(notes) {
            return notes
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\n/g, '<br>')
                .replace(/🎲/g, '<span style="font-size:16px;">🎲</span>')
                .replace(/⚔️/g, '<span style="font-size:16px;">⚔️</span>')
                .replace(/💀/g, '<span style="font-size:16px;">💀</span>');
        }

        // Update combat status indicator
        function updateCombatStatus() {
            const state = A.State.get();
            const statusEl = header.querySelector('#combat-status');
            if (state.rpg?.combat?.active) {
                const c = state.rpg.combat;
                const activeActor = c.order[c.turn];
                statusEl.style.display = 'inline';
                statusEl.style.background = 'var(--status-error-bg)';
                statusEl.style.color = 'var(--status-error)';
                statusEl.innerHTML = `⚔️ Round ${c.round} - ${activeActor?.name || 'Unknown'}'s Turn`;

                // Auto-switch to combat mode
                if (currentMode !== 'combat') {
                    currentMode = 'combat';
                    renderModeTabs();
                    renderActionBar();
                }
            } else {
                statusEl.style.display = 'none';
            }
        }

        // Update action bar visibility based on combat state
        function updateActionBarVisibility() {
            const state = A.State.get();

            // In combat mode, check if it's player's turn
            if (currentMode === 'combat' && state.rpg?.combat?.active) {
                const c = state.rpg.combat;
                const activeActor = c.order[c.turn];
                const actor = state.nodes?.actors?.items?.[activeActor?.id];

                if (actor?.data?.rpg?.type === 'monster') {
                    actionBar.style.opacity = '0.5';
                    actionBar.style.pointerEvents = 'none';
                } else {
                    actionBar.style.opacity = '1';
                    actionBar.style.pointerEvents = 'auto';
                }
            } else {
                actionBar.style.opacity = '1';
                actionBar.style.pointerEvents = 'auto';
            }
        }

        // Event handlers
        sendBtn.onclick = sendMessage;
        inputField.onkeydown = (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
            if (e.key === 'Escape') {
                pendingAction = null;
                inputHint.textContent = '';
                inputField.placeholder = 'Type your action or dialogue...';
            }
        };

        header.querySelector('#rpg-clear').onclick = () => {
            chatLog.innerHTML = '';
        };

        header.querySelector('#btn-start-combat').onclick = () => {
            executeCommand('Start Combat', 'SYSTEM');
        };

        // Initialize
        renderActionBar();
        updateLens();
        updateCombatStatus();

        A.State.subscribe(() => {
            if (container.isConnected) {
                updateLens();
                updateCombatStatus();
                updateActionBarVisibility();
            }
        });
    }

    function updateLens() {
        if (!A.UI.setLens) return;

        A.UI.setLens((lensContent) => {
            const state = A.State.get();
            const actors = state.nodes && state.nodes.actors ? Object.values(state.nodes.actors.items) : [];
            const party = actors.filter(a => a.data?.rpg?.enabled && a.data.rpg.type !== 'monster');
            const enemies = actors.filter(a => a.data?.rpg?.enabled && a.data.rpg.type === 'monster');

            let html = '<div style="padding:16px; height:100%; overflow-y:auto;">';

            // Combat Status
            if (state.rpg?.combat?.active) {
                const c = state.rpg.combat;
                html += `
                    <div style="background:var(--status-error-bg); border:1px solid var(--status-error); border-radius:8px; padding:12px; margin-bottom:16px;">
                        <div style="font-weight:bold; color:var(--status-error); margin-bottom:8px;">⚔️ COMBAT - Round ${c.round}</div>
                        <div style="font-size:11px;">Turn: <strong>${c.order[c.turn]?.name || 'Unknown'}</strong></div>
                    </div>
                `;
            }

            // Party
            html += `<div style="font-weight:bold; font-size:11px; color:var(--text-muted); text-transform:uppercase; margin-bottom:8px; letter-spacing:1px;">Party (${party.length})</div>`;

            if (party.length === 0) {
                html += '<div style="color:var(--text-muted); font-style:italic; margin-bottom:16px;">No party members</div>';
            } else {
                party.forEach(a => {
                    const rpg = a.data.rpg;
                    const hp = rpg.hp || 0, maxHp = rpg.maxHp || 20;
                    const hpPct = Math.round((hp / maxHp) * 100);
                    const hpColor = hpPct > 50 ? 'var(--status-success)' : hpPct > 25 ? 'var(--status-warning)' : 'var(--status-error)';

                    html += `
                        <div style="background:var(--bg-elevated); border-radius:6px; padding:10px; margin-bottom:8px;">
                            <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:6px;">
                                <strong>${a.name}</strong>
                                <span style="color:${hpColor};">${hp}/${maxHp}</span>
                            </div>
                            <div style="height:4px; background:var(--bg-inset); border-radius:2px;">
                                <div style="height:100%; width:${hpPct}%; background:${hpColor}; border-radius:2px;"></div>
                            </div>
                        </div>
                    `;
                });
            }

            // Enemies
            if (enemies.length > 0) {
                html += `<div style="font-weight:bold; font-size:11px; color:var(--status-error); text-transform:uppercase; margin:16px 0 8px; letter-spacing:1px;">⚠️ Hostiles (${enemies.length})</div>`;
                enemies.forEach(a => {
                    const rpg = a.data.rpg;
                    const hp = rpg.hp || 0, maxHp = rpg.maxHp || rpg.hp || 20;
                    const hpPct = Math.round((hp / maxHp) * 100);
                    const dead = hp <= 0;

                    html += `
                        <div style="background:var(--bg-elevated); border:1px solid ${dead ? 'var(--border-subtle)' : 'var(--status-error)'}; border-radius:6px; padding:10px; margin-bottom:8px; opacity:${dead ? '0.5' : '1'};">
                            <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:6px;">
                                <strong>${dead ? '💀 ' : ''}${a.name}</strong>
                                <span style="color:var(--status-error);">${hp}/${maxHp}</span>
                            </div>
                            <div style="height:4px; background:var(--bg-inset); border-radius:2px;">
                                <div style="height:100%; width:${hpPct}%; background:var(--status-error); border-radius:2px;"></div>
                            </div>
                        </div>
                    `;
                });
            }

            html += '</div>';
            lensContent.innerHTML = html;
        });
    }

    function appendMessage(role, text) {
        const div = document.createElement('div');
        div.id = 'msg-' + Date.now();
        div.className = `message message-${role}`;
        div.style.cssText = 'max-width:85%; padding:12px 16px; border-radius:12px; line-height:1.5;';

        if (role === 'user') {
            div.style.alignSelf = 'flex-end';
            div.style.background = 'var(--accent-primary)';
            div.style.color = 'white';
            div.style.borderBottomRightRadius = '4px';
        } else if (role === 'model') {
            div.style.alignSelf = 'flex-start';
            div.style.background = 'var(--bg-surface)';
            div.style.border = '1px solid var(--border-subtle)';
            div.style.borderBottomLeftRadius = '4px';
        } else {
            div.style.alignSelf = 'center';
            div.style.fontSize = '12px';
            div.style.opacity = '0.7';
            div.style.fontStyle = 'italic';
            div.style.background = 'transparent';
        }

        div.innerHTML = text.replace(/\n/g, '<br>');
        chatLog.appendChild(div);
        chatLog.scrollTop = chatLog.scrollHeight;
        return div.id;
    }

    A.registerPanel('rpg_roleplay', {
        label: 'Roleplay',
        subtitle: 'Session & Chat',
        category: 'RPG Experiment',
        icon: '🎭',
        render: render
    });

})(window.Anansi);
