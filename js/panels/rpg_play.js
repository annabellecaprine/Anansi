/**
 * Anansi Panel: RPG Play
 * File: js/panels/rpg_play.js
 * Category: RPG Experiment
 * Purpose: Main RPG interface with two modes: MUD Game and Freeform RP.
 * 
 * MUD Game: Dynamic action buttons, deterministic mechanics, optional LLM narration
 * Freeform RP: Pure roleplay chat, simplified UI, narrative-focused LLM prompt
 */

(function (A) {
    'use strict';

    // Helper: Get Engine safely
    const getEngine = () => A.RPGEngine || (window.RPG && window.RPG.Engine) || null;

    // ===========================================
    // MODE DEFINITIONS
    // ===========================================
    const GAME_MODES = {
        mud: {
            id: 'mud',
            label: '🎮 MUD Game',
            description: 'Command-driven gameplay with dice mechanics'
        },
        freeform: {
            id: 'freeform',
            label: '📝 Freeform RP',
            description: 'Narrative roleplay with AI'
        }
    };

    // ===========================================
    // CONTEXT-BASED ACTION SETS
    // ===========================================
    const ACTION_SETS = {
        combat: [
            { id: 'attack', icon: '⚔️', label: 'Attack', cmd: 'melee attack' },
            { id: 'defend', icon: '🛡️', label: 'Defend', cmd: 'defend' },
            { id: 'abilities', icon: '✨', label: 'Ability', cmd: null },
            { id: 'items', icon: '🎒', label: 'Item', cmd: null },
            { id: 'flee', icon: '🏃', label: 'Flee', cmd: 'flee' },
            { id: 'pass', icon: '⏭️', label: 'End Turn', cmd: 'end turn' }
        ],
        exploration: [
            { id: 'search', icon: '🔍', label: 'Search', cmd: '[SEARCH]' },
            { id: 'examine', icon: '👁️', label: 'Examine', cmd: null },
            { id: 'move', icon: '🚶', label: 'Move', cmd: null },
            { id: 'rest', icon: '🏕️', label: 'Rest', cmd: '[REST] short' },
            { id: 'interact', icon: '🖐️', label: 'Interact', cmd: null },
            { id: 'talk', icon: '💬', label: 'Talk', cmd: null }
        ],
        social: [
            { id: 'say', icon: '💬', label: 'Say', cmd: null },
            { id: 'emote', icon: '🎭', label: 'Emote', cmd: null },
            { id: 'think', icon: '💭', label: 'Think', cmd: null },
            { id: 'describe', icon: '📝', label: 'Describe', cmd: null }
        ]
    };

    // Module state
    let containerEl = null;
    let chatLog = null;
    let inputField = null;
    let currentMode = 'mud';
    let pendingAction = null;
    let llmNarrationEnabled = true;

    // ===========================================
    // MAIN RENDER
    // ===========================================
    function render(container) {
        containerEl = container;
        container.style.cssText = 'height:100%; display:flex; flex-direction:column; background:var(--bg-base); padding:0; overflow:hidden;';

        // Restore state
        const state = A.State.get();
        A.RPGEngine?.ensureState();
        if (state.rpg?.playMode) currentMode = state.rpg.playMode;
        if (state.rpg?.narrationEnabled !== undefined) llmNarrationEnabled = state.rpg.narrationEnabled;

        // Build UI
        renderHeader(container);
        renderChatArea(container);
        renderActionBar(container);
        renderInputArea(container);

        // Initialize
        updateActionBar();
        updateLens();

        // Welcome message
        if (!chatLog.hasChildNodes()) {
            const welcomeMsg = currentMode === 'mud'
                ? "⚔️ **MUD Game Mode**\nUse the action buttons or type commands. Combat is deterministic with dice rolls."
                : "📝 **Freeform RP Mode**\nWrite freely - the AI will respond as your game world.";
            appendMessage('system', welcomeMsg);
        }

        // Subscribe to RPG Engine events
        if (getEngine()) {
            // Location change
            getEngine().on('location_enter', (data) => {
                if (data.image) {
                    appendMessage('system', `![${data.location.name}](${data.image})`);
                }
                updateStatusBar();
                updateLens();
            });

            // Combat state changes - refresh UI
            getEngine().on('combat_start', () => {
                updateActionBar();
                updateCombatStatus();
                updateLens();
            });

            getEngine().on('combat_end', () => {
                updateActionBar();
                updateCombatStatus();
                updateLens();
            });
        }

        // Subscribe to general state changes (for spawns etc)
        A.State.subscribe(() => {
            if (document.getElementById('rpg-lens-container') || document.querySelector('[data-panel="rpg_play"]')) {
                updateLens();
            }
        });
    }

    // ===========================================
    // HEADER
    // ===========================================
    function renderHeader(container) {
        const state = A.State.get();

        const header = document.createElement('div');
        header.style.cssText = 'display:flex; flex-direction:column; background:var(--bg-elevated); border-bottom:1px solid var(--border-subtle);';

        // Top row with mode toggle and controls
        const headerTop = document.createElement('div');
        headerTop.id = 'rpg-header-top';
        headerTop.style.cssText = 'display:flex; justify-content:space-between; align-items:center; padding:10px 16px;';

        // Mode Toggle (left)
        const modeToggle = document.createElement('div');
        modeToggle.style.cssText = 'display:flex; background:var(--bg-inset); border-radius:6px; padding:2px;';

        Object.values(GAME_MODES).forEach(mode => {
            const btn = document.createElement('button');
            btn.className = 'btn btn-sm';
            const isActive = currentMode === mode.id;
            btn.style.cssText = `
                padding:6px 12px; border-radius:4px; font-size:12px;
                background:${isActive ? 'var(--bg-surface)' : 'transparent'};
                color:${isActive ? 'var(--text-primary)' : 'var(--text-muted)'};
                font-weight:${isActive ? 'bold' : 'normal'};
                border:${isActive ? '1px solid var(--border-subtle)' : 'none'};
            `;
            btn.textContent = mode.label;
            btn.title = mode.description;
            btn.onclick = () => switchMode(mode.id);
            modeToggle.appendChild(btn);
        });

        // Controls (right)
        const controls = document.createElement('div');
        controls.style.cssText = 'display:flex; align-items:center; gap:8px;';

        // Combat status indicator
        const combatStatus = document.createElement('span');
        combatStatus.id = 'combat-status';
        combatStatus.style.cssText = 'font-size:11px; padding:3px 8px; border-radius:4px; display:none;';
        controls.appendChild(combatStatus);

        // LLM Narration Toggle
        const narrationToggle = document.createElement('button');
        narrationToggle.id = 'narration-toggle';
        narrationToggle.className = 'btn btn-sm btn-ghost';
        narrationToggle.style.cssText = 'font-size:11px;';
        narrationToggle.innerHTML = llmNarrationEnabled ? '✨ AI Narration ON' : '🔇 AI Narration OFF';
        narrationToggle.title = 'Toggle LLM-based narrative descriptions';
        narrationToggle.onclick = () => toggleNarration();
        controls.appendChild(narrationToggle);

        // Quick actions
        const quickBtns = document.createElement('div');
        quickBtns.style.cssText = 'display:flex; gap:4px; margin-left:8px;';
        quickBtns.innerHTML = `
            <button class="btn btn-sm btn-ghost" id="btn-start-combat" title="Start Combat">⚔️</button>
            <button class="btn btn-sm btn-ghost" id="btn-clear" title="Clear Chat">🗑️</button>
        `;
        controls.appendChild(quickBtns);

        headerTop.appendChild(modeToggle);
        headerTop.appendChild(controls);
        header.appendChild(headerTop);

        // Status bar (location, round, etc.)
        const statusBar = document.createElement('div');
        statusBar.id = 'rpg-status-bar';
        statusBar.style.cssText = 'padding:6px 16px; background:var(--bg-surface); border-top:1px solid var(--border-subtle); font-size:11px; color:var(--text-muted); display:flex; gap:16px;';
        header.appendChild(statusBar);

        container.appendChild(header);

        // Wire up quick buttons
        setTimeout(() => {
            document.getElementById('btn-start-combat')?.addEventListener('click', () => {
                executeCommand('start combat');
            });
            document.getElementById('btn-clear')?.addEventListener('click', () => {
                if (chatLog) chatLog.innerHTML = '';
                appendMessage('system', '🗑️ Chat cleared.');
            });
        }, 0);

        updateStatusBar();
    }

    // ===========================================
    // CHAT AREA
    // ===========================================
    function renderChatArea(container) {
        const chatArea = document.createElement('div');
        chatArea.id = 'rpg-chat-log';
        chatArea.style.cssText = 'flex:1; overflow-y:auto; padding:16px; display:flex; flex-direction:column; gap:12px; background:var(--bg-base);';
        container.appendChild(chatArea);
        chatLog = chatArea;
    }

    // ===========================================
    // ACTION BAR
    // ===========================================
    function renderActionBar(container) {
        const actionBar = document.createElement('div');
        actionBar.id = 'rpg-action-bar';
        actionBar.style.cssText = 'padding:12px 16px; background:var(--bg-elevated); border-top:1px solid var(--border-subtle);';
        container.appendChild(actionBar);
    }

    function updateActionBar() {
        const actionBar = document.getElementById('rpg-action-bar');
        if (!actionBar) return;

        // In Freeform mode, minimal action bar
        if (currentMode === 'freeform') {
            actionBar.style.display = 'none';
            return;
        }

        actionBar.style.display = 'block';
        actionBar.innerHTML = '';

        const state = A.State.get();
        const inCombat = state.rpg?.combat?.active;

        // Determine which action set to show
        const actionSet = inCombat ? ACTION_SETS.combat : ACTION_SETS.exploration;
        const contextLabel = inCombat ? '⚔️ Combat' : '🔍 Exploration';

        // Context indicator + actions
        const wrapper = document.createElement('div');
        wrapper.style.cssText = 'display:flex; align-items:center; gap:12px; flex-wrap:wrap;';

        const label = document.createElement('span');
        label.style.cssText = 'font-size:11px; color:var(--text-muted); font-weight:bold; text-transform:uppercase;';
        label.textContent = contextLabel;
        wrapper.appendChild(label);

        const actionsDiv = document.createElement('div');
        actionsDiv.style.cssText = 'display:flex; gap:6px; flex-wrap:wrap;';

        actionSet.forEach(action => {
            const btn = document.createElement('button');
            btn.className = 'btn btn-sm';
            btn.style.cssText = 'display:flex; align-items:center; gap:4px; padding:8px 12px;';
            btn.innerHTML = `<span>${action.icon}</span><span>${action.label}</span>`;
            btn.title = action.label;
            btn.onclick = () => handleAction(action);
            actionsDiv.appendChild(btn);
        });

        // Add social actions in exploration
        if (!inCombat) {
            const divider = document.createElement('span');
            divider.style.cssText = 'width:1px; height:24px; background:var(--border-subtle); margin:0 4px;';
            actionsDiv.appendChild(divider);

            ACTION_SETS.social.forEach(action => {
                const btn = document.createElement('button');
                btn.className = 'btn btn-sm btn-ghost';
                btn.style.cssText = 'display:flex; align-items:center; gap:4px; padding:6px 10px; font-size:11px;';
                btn.innerHTML = `<span>${action.icon}</span><span>${action.label}</span>`;
                btn.onclick = () => handleAction(action);
                actionsDiv.appendChild(btn);
            });
        }

        wrapper.appendChild(actionsDiv);
        actionBar.appendChild(wrapper);

        // Selector area (for targeting)
        let selectorArea = document.getElementById('rpg-selector');
        if (!selectorArea) {
            selectorArea = document.createElement('div');
            selectorArea.id = 'rpg-selector';
            selectorArea.style.cssText = 'padding:10px 16px; background:var(--bg-surface); border-top:1px solid var(--border-subtle); display:none; flex-wrap:wrap; gap:8px; align-items:center;';
            actionBar.parentElement.insertBefore(selectorArea, actionBar.nextSibling);
        }
    }

    // ===========================================
    // INPUT AREA
    // ===========================================
    function renderInputArea(container) {
        const inputArea = document.createElement('div');
        inputArea.style.cssText = 'padding:12px 16px; background:var(--bg-elevated); border-top:1px solid var(--border-subtle); display:flex; gap:8px;';
        inputArea.innerHTML = `
            <div style="flex:1; position:relative;">
                <textarea id="rpg-input" class="input" rows="1" placeholder="${getPlaceholder()}" 
                    style="width:100%; resize:none; font-family:var(--font-sans); padding-right:40px;"></textarea>
                <span id="input-hint" style="position:absolute; right:10px; top:50%; transform:translateY(-50%); font-size:10px; color:var(--text-muted); pointer-events:none;"></span>
            </div>
            <button class="btn btn-primary" id="rpg-send" style="height:auto;">Send</button>
        `;
        container.appendChild(inputArea);

        inputField = inputArea.querySelector('#rpg-input');
        const sendBtn = inputArea.querySelector('#rpg-send');

        inputField.onkeydown = (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        };

        sendBtn.onclick = () => sendMessage();
    }

    function getPlaceholder() {
        if (currentMode === 'freeform') {
            return 'Describe your action or write dialogue...';
        }
        const state = A.State.get();
        return state.rpg?.combat?.active
            ? 'Enter combat command or use action buttons...'
            : 'Type a command, describe an action, or use buttons...';
    }

    // ===========================================
    // MODE SWITCHING
    // ===========================================
    function switchMode(newMode) {
        currentMode = newMode;
        const state = A.State.get();
        if (!state.rpg) state.rpg = {};
        state.rpg.playMode = newMode;

        // Update UI
        render(containerEl);

        appendMessage('system', newMode === 'mud'
            ? "🎮 Switched to **MUD Game Mode** - Actions are processed by the game engine."
            : "📝 Switched to **Freeform RP Mode** - Write freely, AI responds narratively."
        );
    }

    function toggleNarration() {
        llmNarrationEnabled = !llmNarrationEnabled;
        const state = A.State.get();
        if (!state.rpg) state.rpg = {};
        state.rpg.narrationEnabled = llmNarrationEnabled;

        const toggle = document.getElementById('narration-toggle');
        if (toggle) {
            toggle.innerHTML = llmNarrationEnabled ? '✨ AI Narration ON' : '🔇 AI Narration OFF';
        }

        appendMessage('system', llmNarrationEnabled
            ? "✨ AI Narration enabled - Game events will be narrated by the AI."
            : "🔇 AI Narration disabled - Only game mechanics will be shown."
        );
    }

    // ===========================================
    // ACTION HANDLING
    // ===========================================
    function handleAction(action) {
        const selectorArea = document.getElementById('rpg-selector');
        const inputHint = document.getElementById('input-hint');

        // Direct command actions
        if (action.cmd) {
            executeCommand(action.cmd);
            return;
        }

        // Actions requiring input or selection
        switch (action.id) {
            case 'abilities':
                showAbilitySelector();
                break;
            case 'items':
                showItemSelector();
                break;
            case 'examine':
                setInputMode('examine', '👁️ EXAMINE', 'What do you want to examine?');
                break;
            case 'move':
                showMoveSelector();
                break;
            case 'interact':
                setInputMode('interact', '🖐️ INTERACT', 'What do you want to interact with?');
                break;
            case 'talk':
                showTalkSelector();
                break;
            case 'say':
                setInputMode('say', '💬 SAY', 'What does your character say?');
                break;
            case 'emote':
                showEmoteSelector();
                break;
            case 'think':
                setInputMode('think', '💭 THINK', 'What is your character thinking?');
                break;
            case 'describe':
                setInputMode('describe', '📝 DESCRIBE', 'Describe the scene or action...');
                break;
            default:
                inputField.focus();
        }
    }

    function setInputMode(mode, hintText, placeholder) {
        pendingAction = mode;
        const inputHint = document.getElementById('input-hint');
        if (inputHint) inputHint.textContent = hintText;
        inputField.placeholder = placeholder;
        inputField.focus();
    }

    function clearInputMode() {
        pendingAction = null;
        const inputHint = document.getElementById('input-hint');
        if (inputHint) inputHint.textContent = '';
        inputField.placeholder = getPlaceholder();
    }

    // ===========================================
    // SELECTORS
    // ===========================================
    function showSelector(label, options, onSelect, allowText = false) {
        const selectorArea = document.getElementById('rpg-selector');
        if (!selectorArea) return;

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

        // Cancel button
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'btn btn-xs';
        cancelBtn.style.marginLeft = '8px';
        cancelBtn.textContent = '✕';
        cancelBtn.onclick = () => { selectorArea.style.display = 'none'; };
        selectorArea.appendChild(cancelBtn);
    }

    function showAbilitySelector() {
        const state = A.State.get();
        const actor = getActiveActor();
        const feats = actor?.data?.rpg?.feats || [];
        const featDb = state.rpg?.featDatabase || [];

        const options = feats.map(fId => {
            const feat = featDb.find(f => f.id === fId);
            return { id: fId, label: feat?.name || fId };
        });

        if (options.length === 0) {
            appendMessage('system', '⚠️ No abilities available.');
            return;
        }

        showSelector('Ability', options, (opt) => {
            executeCommand(`[USE ABILITY] ${opt.label}`);
        });
    }

    function showItemSelector() {
        const actor = getActiveActor();
        const inventory = actor?.data?.rpg?.inventory || [];
        const state = A.State.get();
        const armory = state.rpg?.items || [];

        const options = inventory.map(itemId => {
            const item = armory.find(i => i.id === itemId);
            return { id: itemId, label: item?.name || itemId };
        }).filter(o => o.label);

        if (options.length === 0) {
            appendMessage('system', '⚠️ No items in inventory.');
            return;
        }

        showSelector('Item', options, (opt) => {
            executeCommand(`[USE ITEM] ${opt.label}`);
        });
    }

    function showMoveSelector() {
        const state = A.State.get();
        const currentLoc = state.rpg?.currentLocation;

        // Get all locations from multi-map structure
        let locations = [];
        if (state.weaves?.maps) {
            state.weaves.maps.forEach(map => {
                (map.locations || []).forEach(loc => locations.push(loc));
            });
        } else if (state.weaves?.locations) {
            locations = state.weaves.locations;
        }

        // Find connected locations using 'exits' property
        const current = locations.find(l => l.id === currentLoc);
        const connected = (current?.exits || []).map(exit => {
            const exitId = typeof exit === 'string' ? exit : exit.id;
            const loc = locations.find(l => l.id === exitId);
            return loc ? { id: loc.id, label: loc.name } : null;
        }).filter(Boolean);

        if (connected.length === 0) {
            appendMessage('system', '⚠️ No connected locations.');
            return;
        }

        showSelector('Move to', connected, (opt) => {
            executeCommand(`[MOVE] ${opt.label}`);
        });
    }

    function showTalkSelector() {
        const state = A.State.get();
        const actors = Object.values(state.nodes?.actors?.items || {});
        const npcs = actors.filter(a => a.data?.rpg?.enabled && a.data.rpg.type !== 'monster');

        const options = npcs.map(a => ({ id: a.id, label: a.name }));

        if (options.length === 0) {
            appendMessage('system', '⚠️ No one to talk to.');
            return;
        }

        showSelector('Talk to', options, (opt) => {
            setInputMode({ type: 'talk', target: opt.label }, `🗣️ TO ${opt.label.toUpperCase()}`, `What do you say to ${opt.label}?`);
        });
    }

    function showEmoteSelector() {
        const emotes = [
            { id: 'smile', label: '😊 smiles' },
            { id: 'nod', label: '👍 nods' },
            { id: 'frown', label: '😟 frowns' },
            { id: 'laugh', label: '😂 laughs' },
            { id: 'shrug', label: '🤷 shrugs' }
        ];

        showSelector('Emote', emotes, (opt) => {
            const actor = getActiveActor();
            appendMessage('user', `*${actor?.name || 'You'} ${opt.label}*`);
        }, true);
    }

    // ===========================================
    // COMMAND EXECUTION
    // ===========================================
    function executeCommand(command) {
        inputField.value = command;
        sendMessage();
    }

    async function sendMessage() {
        let text = inputField.value.trim();
        if (!text) return;

        // Apply pending action formatting
        if (pendingAction) {
            text = formatWithPendingAction(text);
            clearInputMode();
        }

        appendMessage('user', text);
        inputField.value = '';
        inputField.placeholder = getPlaceholder();

        const loadingId = appendMessage('system', '...');

        try {
            if (currentMode === 'mud') {
                await processMUDInput(text, loadingId);
            } else {
                await processFreeformInput(text, loadingId);
            }
        } catch (err) {
            console.error('[RPG Play]', err);
            const el = document.getElementById(loadingId);
            if (el) el.textContent = "❌ Error: " + err.message;
        }

        updateStatusBar();
        updateActionBar();
        updateCombatStatus();
    }

    function formatWithPendingAction(text) {
        if (pendingAction === 'say') return `"${text}"`;
        if (pendingAction === 'think') return `*${getActiveActor()?.name || 'You'} thinks: "${text}"*`;
        if (pendingAction === 'examine') return `[EXAMINE] ${text}`;
        if (pendingAction === 'interact') return `[INTERACT] ${text}`;
        if (pendingAction === 'describe') return `[NARRATION] ${text}`;
        if (typeof pendingAction === 'object' && pendingAction.type === 'talk') {
            return `[TALK TO ${pendingAction.target.toUpperCase()}] "${text}"`;
        }
        return text;
    }

    // ===========================================
    // MUD MODE PROCESSING
    // ===========================================
    async function processMUDInput(text, loadingId) {
        const engine = getEngine();
        if (!engine?.processRound) {
            document.getElementById(loadingId).textContent = "⚠️ RPG Engine not available.";
            return;
        }

        const state = A.State.get();
        const history = state.rpg?.history || [];
        const roundResult = engine.processRound(text, history, 'input', { source: 'rpg_session' });

        // Display system notes (dice rolls, combat results, etc.)
        if (roundResult.context.system_notes) {
            const sysEl = document.getElementById(loadingId);
            if (sysEl) {
                sysEl.innerHTML = formatSystemNotes(roundResult.context.system_notes);
                sysEl.style.cssText = 'font-style:normal; opacity:1; background:var(--bg-surface); border:1px solid var(--border-subtle); padding:12px; border-radius:8px; align-self:stretch; max-width:100%;';
            }
        } else {
            const loadingEl = document.getElementById(loadingId);
            if (loadingEl) loadingEl.remove();
        }

        // Optional LLM narration
        if (llmNarrationEnabled && roundResult.sysLogs?.length > 0) {
            const narrative = await generateNarration(roundResult);
            if (narrative) {
                appendMessage('model', narrative);
            }
        }
    }

    // ===========================================
    // FREEFORM MODE PROCESSING
    // ===========================================
    async function processFreeformInput(text, loadingId) {
        const config = A.UI?.getActiveLLMConfig?.();
        if (!config?.apiKey) {
            document.getElementById(loadingId).textContent = "⚠️ No LLM configured. Set up in Advanced panel.";
            return;
        }

        const state = A.State.get();
        const prompt = buildFreeformPrompt(state);
        const history = state.rpg?.history || [];

        // Add current message to history
        history.push({ role: 'user', content: text });

        try {
            const response = await A.API.chat(config, prompt, history.slice(-20));

            if (response) {
                const loadingEl = document.getElementById(loadingId);
                if (loadingEl) loadingEl.remove();

                appendMessage('model', response);
                history.push({ role: 'assistant', content: response });
                state.rpg.history = history;
            }
        } catch (err) {
            document.getElementById(loadingId).textContent = "❌ LLM Error: " + err.message;
        }
    }

    function buildFreeformPrompt(state) {
        const location = state.rpg?.currentLocation;
        const locations = state.weaves?.locations || [];
        const locData = locations.find(l => l.id === location);

        let prompt = "You are a Game Master in a collaborative roleplay. Respond in second person, describing the scene and character reactions naturally.\n\n";

        if (locData) {
            prompt += `**Current Location:** ${locData.name}\n${locData.description || ''}\n\n`;
        }

        // Add active actors as NPCs
        const actors = Object.values(state.nodes?.actors?.items || {});
        const npcs = actors.filter(a => a.data?.rpg?.enabled && a.data.rpg.type !== 'monster');
        if (npcs.length > 0) {
            prompt += "**Present Characters:**\n";
            npcs.forEach(npc => {
                prompt += `- ${npc.name}: ${npc.tagline || npc.data?.personality?.slice(0, 100) || 'A mysterious figure'}\n`;
            });
            prompt += "\n";
        }

        prompt += "Respond naturally to the player's actions. Keep responses concise (2-4 paragraphs max). Use *asterisks* for actions and \"quotes\" for dialogue.";

        return prompt;
    }

    // ===========================================
    // LLM NARRATION
    // ===========================================
    async function generateNarration(roundResult) {
        const config = A.UI?.getActiveLLMConfig?.();
        if (!config?.apiKey) return null;

        const logs = roundResult.sysLogs || [];
        if (logs.length === 0) return null;

        const prompt = `You are a game narrator. Briefly describe these game events in vivid prose (2-3 sentences max):\n\n${logs.join('\n')}`;

        try {
            // Updated to use A.LLM.generate (A.API.chat is deprecated/missing)
            // generate(system, history, config)
            const history = [{ role: 'user', content: prompt }];
            return await A.LLM.generate("You are a narrator.", history, config);
        } catch (e) {
            console.warn('[RPG Play] Narration failed:', e);
            return null;
        }
    }

    // ===========================================
    // HELPERS
    // ===========================================
    function getActiveActor() {
        const state = A.State.get();
        if (state.rpg?.combat?.active) {
            const c = state.rpg.combat;
            const activeEntry = c.order?.[c.turn];
            if (activeEntry) {
                return state.nodes?.actors?.items?.[activeEntry.id] || null;
            }
        }
        // Return first party member
        const actors = Object.values(state.nodes?.actors?.items || {});
        return actors.find(a => a.data?.rpg?.enabled && a.data.rpg.type !== 'monster') || null;
    }

    function formatSystemNotes(notes) {
        if (!notes) return '';
        return notes
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n/g, '<br>')
            .replace(/---.*?---/g, '<hr style="margin:8px 0; border-color:var(--border-subtle);">');
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

        // Support inline images with markdown syntax
        let html = text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" style="max-width:100%; border-radius:8px; margin:8px 0;">')
            .replace(/\n/g, '<br>');

        div.innerHTML = html;
        chatLog.appendChild(div);
        chatLog.scrollTop = chatLog.scrollHeight;
        return div.id;
    }

    function updateStatusBar() {
        const statusBar = document.getElementById('rpg-status-bar');
        if (!statusBar) return;

        const state = A.State.get();
        const parts = [];

        // Location
        const locId = state.rpg?.currentLocation;
        if (locId) {
            const locations = state.weaves?.locations || [];
            const loc = locations.find(l => l.id === locId);
            if (loc) parts.push(`📍 ${loc.name}`);
        }

        // Combat round
        if (state.rpg?.combat?.active) {
            const c = state.rpg.combat;
            parts.push(`⚔️ Round ${c.round}`);
            if (c.order?.[c.turn]) {
                parts.push(`Turn: ${c.order[c.turn].name}`);
            }
        }

        // Party HP summary
        const actors = Object.values(state.nodes?.actors?.items || {});
        const party = actors.filter(a => a.data?.rpg?.enabled && a.data.rpg.type !== 'monster');
        if (party.length > 0) {
            const hp = party.reduce((sum, a) => sum + (a.data.rpg.hp || 0), 0);
            const maxHp = party.reduce((sum, a) => sum + (a.data.rpg.maxHp || a.data.rpg.hp || 20), 0);
            parts.push(`❤️ Party: ${hp}/${maxHp}`);
        }

        statusBar.innerHTML = parts.join('<span style="opacity:0.3; margin:0 8px;">|</span>');
    }

    function updateCombatStatus() {
        const status = document.getElementById('combat-status');
        if (!status) return;

        const state = A.State.get();
        if (state.rpg?.combat?.active) {
            status.style.display = 'inline-block';
            status.style.background = 'var(--status-error)';
            status.style.color = 'white';
            status.textContent = `⚔️ Combat Round ${state.rpg.combat.round}`;
        } else {
            status.style.display = 'none';
        }
    }

    // ===========================================
    // LENS PANEL
    // ===========================================
    function updateLens() {
        if (A.UI && A.UI.setLens) {
            A.UI.setLens((lensContent) => {
                const state = A.State.get();
                let html = '';

                // Mode and status
                html += `<div style="padding:12px; border-bottom:1px solid var(--border-subtle);">
                <div style="font-weight:bold; margin-bottom:4px;">${GAME_MODES[currentMode].label}</div>
                <div style="font-size:11px; color:var(--text-muted);">${GAME_MODES[currentMode].description}</div>
            </div>`;

                // Party
                // Current Location
                const currentLocation = state.rpg?.currentLocation;

                // Filter Actors by Location
                const actors = Object.values(state.nodes?.actors?.items || {});

                console.log('[Lens Debug] Update:', {
                    currentLocation,
                    totalActors: actors.length,
                    actors: actors.map(a => ({ name: a.name, loc: a.data?.rpg?.locationId, enabled: a.data?.rpg?.enabled }))
                });

                const localActors = actors.filter(a => {
                    const rpg = a.data?.rpg;
                    if (!rpg?.enabled) return false;
                    // If no location set in state, maybe show everything? Or nothing?
                    // Debug matching
                    // If location is undefined, perhaps we are "traveling" or global. 
                    // Show Party always? 
                    // User requirement: "party and hostiles were shown separately WHEN they were in the same location".

                    // New Logic: 
                    // 1. If entity has the SAME location ID as current state -> KEEP
                    // 2. If entity is a PARTY MEMBER and current state location is null/undefined -> KEEP (Global view)

                    const isParty = rpg.type !== 'monster';

                    if (currentLocation) {
                        // Strict location matching when in a specific place
                        if (rpg.locationId !== currentLocation) return false;
                    } else {
                        // If no location defined yet (e.g. just started), only show party
                        if (!isParty) return false;
                    }

                    return true;
                });

                console.log('[Lens Debug] Filtered:', localActors.length);

                const party = localActors.filter(a => a.data.rpg.type !== 'monster');
                const enemies = localActors.filter(a => a.data.rpg.type === 'monster');

                if (party.length > 0) {
                    html += `<div style="padding:12px;">
                    <div style="font-weight:bold; font-size:11px; color:var(--accent-secondary); text-transform:uppercase; margin-bottom:8px;">Party</div>`;

                    party.forEach(a => {
                        const rpg = a.data.rpg;
                        const hp = rpg.hp || 0, maxHp = rpg.maxHp || rpg.hp || 20;
                        const hpPct = Math.round((hp / maxHp) * 100);
                        const isActive = state.rpg?.combat?.active && state.rpg.combat.order?.[state.rpg.combat.turn]?.id === a.id;

                        html += `<div style="background:var(--bg-elevated); border:1px solid ${isActive ? 'var(--accent-primary)' : 'var(--border-subtle)'}; border-radius:6px; padding:10px; margin-bottom:8px;">
                        <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:6px;">
                            <strong>${isActive ? '▶ ' : ''}${a.name}</strong>
                            <span style="color:var(--status-success);">${hp}/${maxHp}</span>
                        </div>
                        <div style="height:4px; background:var(--bg-inset); border-radius:2px;">
                            <div style="height:100%; width:${hpPct}%; background:var(--status-success); border-radius:2px;"></div>
                        </div>
                    </div>`;
                    });

                    html += `</div>`;
                }

                // Enemies
                if (enemies.length > 0) {
                    html += `<div style="padding:12px; border-top:1px solid var(--border-subtle);">
                    <div style="font-weight:bold; font-size:11px; color:var(--status-error); text-transform:uppercase; margin-bottom:8px;">Hostiles</div>`;

                    enemies.forEach(a => {
                        const rpg = a.data.rpg;
                        const hp = rpg.hp || 0, maxHp = rpg.maxHp || rpg.hp || 20;
                        const dead = hp <= 0;

                        html += `<div style="background:var(--bg-elevated); border:1px solid var(--status-error); border-radius:6px; padding:10px; margin-bottom:8px; opacity:${dead ? '0.5' : '1'};">
                        <div style="display:flex; justify-content:space-between; font-size:12px;">
                            <strong>${dead ? '💀 ' : ''}${a.name}</strong>
                            <span style="color:var(--status-error);">${hp}/${maxHp}</span>
                        </div>
                    </div>`;
                    });

                    html += `</div>`;
                }

                lensContent.innerHTML = html;
            });
        }
    }

    // ===========================================
    // REGISTER PANEL
    // ===========================================
    A.registerPanel('rpg_play', {
        label: 'Play',
        subtitle: 'Game Session',
        category: 'RPG Experiment',
        icon: '🎮',
        render: render
    });

})(window.Anansi);
