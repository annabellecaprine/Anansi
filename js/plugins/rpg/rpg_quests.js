/**
 * Anansi Plugin: RPG Quests
 * File: js/plugins/rpg/rpg_quests.js
 * 
 * Purpose: Manages Quest state, tracks objectives, and listens to Engine events
 * to automatically update progress.
 */

(function (A) {
    'use strict';

    const LOG_PREFIX = '[RPG Quests]';

    const Quests = {

        /**
         * Ensure Quest state exists
         */
        ensureState: function () {
            const state = A.State.get();
            if (!state.rpg) state.rpg = {};
            if (!state.rpg.quests) {
                state.rpg.quests = {
                    active: [],     // List of active quest state objects
                    completed: []   // List of completed quest IDs
                };
            }
            return state.rpg.quests;
        },

        /**
         * Initialize and Attach Listeners
         */
        init: function () {
            console.log(LOG_PREFIX, 'Initializing...');
            const engine = A.RPGEngine || (window.RPG && window.RPG.Engine);
            if (!engine) return;

            // Combat Victory (Kill Objectives)
            engine.on('combat_victory', (data) => {
                const monsters = data.monsters || []; // Array of defeated monster actors
                monsters.forEach(m => {
                    const monsterId = m.data?.rpg?.id || m.name; // Use ID from template if avail, else Name
                    this.checkProgress('KILL', { target: monsterId, count: 1 });
                    // Also check generic 'monster' kill?
                    this.checkProgress('KILL', { target: 'any', count: 1 });
                });
            });

            // Location Enter (Visit Objectives)
            engine.on('location_enter', (data) => {
                const locId = data.location.id;
                this.checkProgress('VISIT', { target: locId });
            });

            // Item Acquired (Fetch Objectives)
            engine.on('item_acquired', (data) => {
                const itemId = data.item.id;
                const itemName = data.item.name;
                const qty = data.qty || 1;
                this.checkProgress('FETCH', { target: itemId, count: qty });
                this.checkProgress('FETCH', { target: itemName, count: qty });
            });

            // Interaction (Interact/Talk Objectives)
            engine.on('interaction', (data) => {
                const targetId = data.target.id;
                const targetName = data.target.name;
                this.checkProgress('TALK', { target: targetId });
                this.checkProgress('TALK', { target: targetName });
            });
        },

        /**
         * Offer a Quest (UI Modal)
         */
        offer: function (questId) {
            const state = A.State.get();
            const db = state.rpg?.questDB || [];
            const template = db.find(q => q.id === questId);

            if (!template) {
                this.notify("⚠️ Quest not found in database.");
                return;
            }

            // Check if already active/completed
            const isTaken = state.rpg.quests.active.find(q => q.id.startsWith(questId));
            const isDone = state.rpg.quests.completed.includes(questId);

            if (isTaken || isDone) {
                this.notify("You have already taken or completed this quest.");
                return;
            }

            // Show Modal
            const content = `
                <div style="padding:20px; max-width:400px;">
                    <h2 style="margin-top:0; color:var(--accent-primary);">📜 ${template.title}</h2>
                    <p>${template.description}</p>
                    <div style="margin:20px 0; font-size:12px;">
                        <strong>Objectives:</strong>
                        <ul style="padding-left:20px;">
                            ${template.objectives.map(o => `<li>${o.type} ${o.target} (x${o.total || 1})</li>`).join('')}
                        </ul>
                        <strong>Rewards:</strong>
                        <ul style="padding-left:20px;">
                            ${(template.rewards || []).map(r => `<li>${r.type}: ${r.value}</li>`).join('') || '<li>None</li>'}
                        </ul>
                    </div>
                    <div style="display:flex; gap:10px; justify-content:flex-end;">
                        <button id="btn-decline" class="btn btn-ghost">Decline</button>
                        <button id="btn-accept" class="btn btn-primary">Accept Quest</button>
                    </div>
                </div>
            `;

            const modal = A.UI.Modal.show({
                content: content,
                onOpen: (el) => {
                    el.querySelector('#btn-decline').onclick = () => A.UI.Modal.close();
                    el.querySelector('#btn-accept').onclick = () => {
                        this.accept({
                            ...template,
                            id: template.id // Use template ID or unique instance? stick to template ID for tracking unique completion
                        });
                        A.UI.Modal.close();
                    };
                }
            });
        },

        /**
         * Accept a new Quest
         * @param {Object} questTemplate - { id, title, description, objectives, rewards }
         */
        accept: function (questTemplate) {
            const state = this.ensureState();

            // Check if already active or completed
            if (state.active.find(q => q.id === questTemplate.id)) return;
            if (state.completed.includes(questTemplate.id)) return;

            // Create instance state
            const instance = {
                id: questTemplate.id,
                title: questTemplate.title,
                description: questTemplate.description,
                objectives: questTemplate.objectives.map(obj => ({
                    ...obj,
                    current: 0,
                    completed: false
                })),
                rewards: questTemplate.rewards || [],
                acceptedAt: Date.now()
            };

            state.active.push(instance);

            this.notify(`📜 **Quest Accepted**: ${instance.title}`);
            A.State.notify();
        },

        /**
         * Update progress based on event
         */
        checkProgress: function (type, data) {
            const state = this.ensureState();
            let changed = false;

            state.active.forEach(quest => {
                let questUpdated = false;

                quest.objectives.forEach(obj => {
                    if (obj.completed) return;
                    if (obj.type !== type) return;

                    // Match Target (Loose match for flexibility)
                    // e.g. Kill "Goblin" matches "Goblin Scout"
                    const targetMatch = (obj.target === data.target) ||
                        (typeof data.target === 'string' && data.target.toLowerCase().includes(obj.target.toLowerCase()));

                    if (targetMatch) {
                        // VISIT and TALK are usually boolean/single completion
                        if (type === 'VISIT' || type === 'TALK') {
                            obj.current = 1;
                            obj.completed = true;
                            questUpdated = true;
                        } else {
                            // Incremental (KILL, FETCH)
                            obj.current += (data.count || 1);
                            if (obj.current >= obj.total) {
                                obj.current = obj.total;
                                obj.completed = true;
                            }
                            questUpdated = true;
                        }
                    }
                });

                if (questUpdated) {
                    changed = true;
                    // Check completion
                    const allComplete = quest.objectives.every(o => o.completed);
                    if (allComplete) {
                        this.complete(quest);
                    } else {
                        // Notify update? "Quest Updated: [Title]"
                        // this.notify(`Quest Updated: ${quest.title}`);
                    }
                }
            });

            if (changed) A.State.notify();
        },

        /**
         * Complete a quest
         */
        complete: function (quest) {
            const state = this.ensureState();

            // Move to completed
            state.active = state.active.filter(q => q.id !== quest.id);
            state.completed.push(quest.id);

            this.notify(`🎉 **Quest Completed**: ${quest.title}`);

            // Award Rewards
            // TODO: Implement actual reward logic (XP, Gold, Items)
            if (quest.rewards) {
                const rewardsStr = quest.rewards.map(r => `${r.type}: ${r.value}`).join(', ');
                this.notify(`Rewards: ${rewardsStr}`);
            }
        },

        /**
         * Send notification to chat
         */
        notify: function (msg) {
            const engine = A.RPGEngine || (window.RPG && window.RPG.Engine);
            if (engine && engine.emit) {
                // Determine how to pipe this to the log. 
                // We'll emit a 'system_message' event that the UI can pick up, 
                // or just modify the chat history directly if running in a certain context.
                // For now, let's look for the standard chat log element or use Engine's sysLogs logic if possible.
                // Actually, the simplest is to append to the log if available.
                const chatLog = document.getElementById('rpg-chat-log');
                if (chatLog) {
                    const div = document.createElement('div');
                    div.className = 'msg-system';
                    div.style.cssText = 'padding:6px; background:var(--bg-inset); border:1px solid var(--accent-primary); border-radius:4px; margin:4px 0; font-size:12px;';
                    div.innerHTML = msg;
                    chatLog.appendChild(div);
                    chatLog.scrollTop = chatLog.scrollHeight;
                }
            } else {
                console.log(LOG_PREFIX, msg);
            }
        }
    };

    // Export
    if (!window.RPG) window.RPG = {};
    window.RPG.Quests = Quests;
    A.RPGQuests = Quests; // Alias

    // Auto-init if Engine ready
    if (A.RPGEngine) Quests.init();
    else {
        // Wait for Engine? Or user must init.
        // Usually Engine loads first.
        setTimeout(() => Quests.init(), 1000);
    }

})(window.Anansi);
