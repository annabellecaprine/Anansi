/*
 * Anansi Panel: RPG Roleplay
 * File: js/panels/rpg_roleplay.js
 * Category: RPG Experiment
 * Purpose: Dedicated chat interface for RPG sessions, focusing on narrative and mechanics.
 */

(function (A) {
    'use strict';

    let containerEl = null;
    let chatLog = null;
    let inputField = null;

    function render(container) {
        containerEl = container;
        container.style.height = '100%';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.background = 'var(--bg-base)';
        container.style.padding = '0';
        container.style.overflow = 'hidden';

        // 1. Toolbar / Header
        const header = document.createElement('div');
        header.className = 'panel-toolbar'; // Reusing standard toolbar class
        header.style.padding = '8px 16px';
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        header.style.background = 'var(--bg-elevated)';
        header.style.borderBottom = '1px solid var(--border-subtle)';

        header.innerHTML = `
            <div style="display:flex; align-items:center; gap:8px;">
                <span style="font-size:16px;">🎭</span>
                <strong>Roleplay Session</strong>
            </div>
            <div style="display:flex; gap:8px;">
                 <button class="btn btn-sm btn-ghost" id="rpg-clear">Clear Log</button>
            </div>
        `;
        container.appendChild(header);

        // 2. Chat Area
        const chatArea = document.createElement('div');
        chatArea.id = 'rpg-chat-log';
        chatArea.style.flex = '1';
        chatArea.style.overflowY = 'auto';
        chatArea.style.padding = '16px';
        chatArea.style.display = 'flex';
        chatArea.style.flexDirection = 'column';
        chatArea.style.gap = '12px';
        chatArea.style.background = 'var(--bg-base)';
        container.appendChild(chatArea);
        chatLog = chatArea;

        // 3. Input Area
        const inputArea = document.createElement('div');
        inputArea.style.padding = '16px';
        inputArea.style.background = 'var(--bg-elevated)';
        inputArea.style.borderTop = '1px solid var(--border-subtle)';
        inputArea.style.display = 'flex';
        inputArea.style.gap = '8px';

        inputArea.innerHTML = `
            <textarea id="rpg-input" class="input" rows="2" placeholder="What do you do? (e.g. 'I attack the orc', 'I search the room')" style="flex:1; resize:none; font-family:var(--font-sans);"></textarea>
            <button class="btn btn-primary" id="rpg-send" style="height:auto;">Send</button>
        `;
        container.appendChild(inputArea);

        inputField = inputArea.querySelector('#rpg-input');
        const sendBtn = inputArea.querySelector('#rpg-send');

        // Event Listeners
        const sendMessage = async () => {
            const text = inputField.value.trim();
            if (!text) return;

            // User Message
            appendMessage('user', text);
            inputField.value = '';

            // AI Loading State
            const loadingId = appendMessage('system', 'Thinking...');

            try {
                // Reuse the Simulator's mechanics if available, or call LLM directly
                // Ideally, we tap into A.Simulator.processRound logic without the full simulator UI overhead
                // For now, we'll mock the connection to the core Simulator engine logic

                if (A.Simulator && A.Simulator.processRound) {
                    const state = A.State.get();
                    const history = state.sim ? state.sim.history : [];

                    // 1. Process Input Phase (Scripts)
                    const roundResult = A.Simulator.processRound(text, history, 'input', { source: 'rpg_session' });

                    // 2. Call LLM (Mock for now or real if possible)
                    // We need to construct the prompt from history + roundResult.context
                    // This duplicates logic from simulator.js. 
                    // TODO: Refactor simulator.js to expose a clean 'turn(text)' API.

                    // For this prototype step, we might just inject the script result directly 
                    // if it's a command, or warn that we need the full engine.

                    if (roundResult.context.system_notes) {
                        appendMessage('system', `[System Notes]: ${roundResult.context.system_notes}`);
                    }

                    // Clean up loading
                    const loadingEl = document.getElementById(loadingId);
                    if (loadingEl) loadingEl.remove();

                    // MOCK RESPONSE for initial UI test
                    // In real implementation, this would call A.LLM.generate(prompt)
                    setTimeout(() => {
                        appendMessage('model', "The dungeon is dark and smells of ozone. (Engine integration pending...)");
                    }, 500);

                } else {
                    document.getElementById(loadingId).textContent = "Error: Simulator Engine not found.";
                }

            } catch (err) {
                console.error(err);
                if (document.getElementById(loadingId)) document.getElementById(loadingId).textContent = "Error: " + err.message;
            }
        };

        sendBtn.onclick = sendMessage;
        inputField.onkeydown = (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        };

        header.querySelector('#rpg-clear').onclick = () => {
            chatLog.innerHTML = '';
        };

        // Initialize Lens
        updateLens();

        // Subscribe to update lens when state changes (e.g. HP/MP changes)
        A.State.subscribe(() => {
            if (container.isConnected) updateLens();
        });
    }

    function updateLens() {
        if (!A.UI.setLens) return;

        A.UI.setLens((lensContent) => {
            const state = A.State.get();
            const actors = state.nodes && state.nodes.actors ? Object.values(state.nodes.actors.items) : [];

            // Separate Party vs Enemies
            const party = actors.filter(a => a.data && a.data.rpg && a.data.rpg.enabled && a.data.rpg.type !== 'monster');
            const enemies = actors.filter(a => a.data && a.data.rpg && a.data.rpg.enabled && a.data.rpg.type === 'monster');

            let html = '<div style="padding:16px; height:100%; overflow-y:auto;">';

            // --- PARTY SECTION ---
            html += `
                <div style="font-weight:bold; font-size:12px; color:var(--text-muted); text-transform:uppercase; margin-bottom:12px; border-bottom:1px solid var(--border-subtle); padding-bottom:8px;">
                    Active Party (${party.length})
                </div>
            `;

            const renderCard = (actor, isEnemy) => {
                const stats = actor.data.rpg.stats || actor.data.rpg || { hp: 10, maxHp: 10, mp: 3, maxMp: 3 };
                const hp = stats.hp || 0;
                const maxHp = stats.maxHp || stats.hp_max || 10;
                const mp = stats.mp || 0;
                const maxMp = stats.maxMp || stats.mp_max || 0;
                const hpPct = Math.min(100, Math.max(0, (hp / maxHp) * 100));

                const skull = isEnemy ? '💀 ' : '';
                const borderColor = isEnemy ? 'var(--status-error)' : 'var(--border-subtle)';
                const lvl = stats.level || 1;

                return `
                    <div style="background:var(--bg-elevated); border:1px solid ${borderColor}; border-radius:6px; padding:12px; margin-bottom:12px;">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                            <span style="font-weight:bold; color:var(--text-primary);">${skull}${actor.name}</span>
                            <span style="font-size:10px; background:var(--bg-base); padding:2px 6px; border-radius:4px;">Lvl ${lvl}</span>
                        </div>
                        
                        <!-- HP -->
                        <div style="margin-bottom:6px;">
                            <div style="display:flex; justify-content:space-between; font-size:10px; margin-bottom:2px;">
                                <span style="color:var(--status-error); font-weight:bold;">HP</span>
                                <span style="color:var(--text-muted);">${hp}/${maxHp}</span>
                            </div>
                            <div style="height:6px; background:rgba(255,0,0,0.1); border-radius:3px; overflow:hidden;">
                                <div style="width:${hpPct}%; height:100%; background:var(--status-error); transition:width 0.3s;"></div>
                            </div>
                        </div>

                        <!-- MP (Only if max > 0 and not enemy) -->
                        ${maxMp > 0 && !isEnemy ? `
                        <div>
                            <div style="display:flex; justify-content:space-between; font-size:10px; margin-bottom:2px;">
                                <span style="color:var(--accent-primary); font-weight:bold;">MP</span>
                                <span style="color:var(--text-muted);">${mp}/${maxMp}</span>
                            </div>
                            <div style="display:flex; gap:2px;">
                                ${Array(maxMp).fill(0).map((_, i) => `
                                    <div style="flex:1; height:6px; background:${i < mp ? 'var(--accent-primary)' : 'rgba(0,150,255,0.1)'}; border-radius:2px;"></div>
                                `).join('')}
                            </div>
                        </div>
                        ` : ''}

                        <!-- Quick Stats Row -->
                        <div style="margin-top:8px; padding-top:8px; border-top:1px dashed var(--border-subtle); display:flex; gap:12px; font-size:10px; opacity:0.8;">
                             <div>AC: <strong>${stats.ac || 10}</strong></div>
                             <div>STR: <strong>${stats.str || 0}</strong></div>
                        </div>
                    </div>
                `;
            };

            if (party.length === 0) {
                html += `<div style="color:var(--text-muted); font-style:italic; margin-bottom:20px;">No party members active.</div>`;
            } else {
                party.forEach(a => html += renderCard(a, false));
            }

            // --- ENEMIES SECTION ---
            if (enemies.length > 0) {
                html += `
                    <div style="font-weight:bold; font-size:12px; color:var(--status-error); text-transform:uppercase; margin-top:20px; margin-bottom:12px; border-bottom:1px solid var(--status-error); padding-bottom:8px;">
                        ⚠️ Hostiles (${enemies.length})
                    </div>
                `;
                enemies.forEach(a => html += renderCard(a, true));
            }

            html += '</div>';
            lensContent.innerHTML = html;
        });
    }

    function appendMessage(role, text) {
        const div = document.createElement('div');
        div.id = 'msg-' + Date.now();
        div.className = `message message-${role}`;
        div.style.maxWidth = '80%';
        div.style.padding = '12px';
        div.style.borderRadius = '8px';
        div.style.lineHeight = '1.5';

        if (role === 'user') {
            div.style.alignSelf = 'flex-end';
            div.style.background = 'var(--accent-primary)';
            div.style.color = 'white';
        } else if (role === 'model') {
            div.style.alignSelf = 'flex-start';
            div.style.background = 'var(--bg-surface)';
            div.style.border = '1px solid var(--border-subtle)';
        } else {
            div.style.alignSelf = 'center';
            div.style.fontSize = '12px';
            div.style.opacity = '0.7';
            div.style.fontStyle = 'italic';
        }

        // Markdown-ish parsing (very basic)
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
