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
         * Check if quest prerequisites are met
         * @param {Object} questTemplate - Quest template with optional requires, requiresFlags fields
         * @returns {boolean} True if all prerequisites are met
         */
        checkPrerequisites: function (questTemplate) {
            const state = A.State.get();
            const completed = state.rpg?.quests?.completed || [];
            const storyFlags = state.rpg?.storyFlags || {};

            // Check required completed quests
            if (questTemplate.requires && Array.isArray(questTemplate.requires)) {
                for (const reqQuestId of questTemplate.requires) {
                    if (!completed.includes(reqQuestId)) {
                        return false;
                    }
                }
            }

            // Check required story flags
            if (questTemplate.requiresFlags) {
                for (const flagKey in questTemplate.requiresFlags) {
                    const expectedValue = questTemplate.requiresFlags[flagKey];
                    const actualValue = storyFlags[flagKey];
                    if (String(actualValue) !== String(expectedValue)) {
                        return false;
                    }
                }
            }

            // Check required items
            if (questTemplate.requiresItems && Array.isArray(questTemplate.requiresItems)) {
                const leaderId = state.rpg?.partyLeader;
                const actors = state.nodes?.actors?.items || {};
                let hasAllItems = true;

                for (const itemId of questTemplate.requiresItems) {
                    let found = false;
                    for (const id in actors) {
                        const actor = actors[id];
                        if (actor.data?.rpg?.enabled && (!leaderId || id === leaderId)) {
                            const inv = actor.data.rpg.inventory || [];
                            if (inv.includes(itemId)) {
                                found = true;
                                break;
                            }
                        }
                    }
                    if (!found) {
                        hasAllItems = false;
                        break;
                    }
                }
                if (!hasAllItems) return false;
            }

            return true;
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

            // Check prerequisites
            if (!this.checkPrerequisites(template)) {
                this.notify("⚠️ You don't meet the requirements for this quest yet.");
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
         * @param {Object} questTemplate - { id, title, description, objectives, rewards, returnTo, autoComplete }
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
                returnTo: questTemplate.returnTo || null,      // NPC/location ID to return to
                autoComplete: questTemplate.autoComplete || false, // Storyline quests auto-complete
                readyForTurnIn: false,                          // True when objectives done but not turned in
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
                // Skip quests already ready for turn-in
                if (quest.readyForTurnIn) return;

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
                    // Check if all objectives complete
                    const allComplete = quest.objectives.every(o => o.completed);
                    if (allComplete) {
                        // If autoComplete or no returnTo specified, complete immediately
                        if (quest.autoComplete || !quest.returnTo) {
                            this.complete(quest);
                        } else {
                            // Mark as ready for turn-in
                            quest.readyForTurnIn = true;
                            this.notify(`✅ **Quest Ready**: Return to quest giver to complete "${quest.title}"`);
                        }
                    }
                }
            });

            if (changed) A.State.notify();
        },

        /**
         * Check if player is at the turn-in location for a quest
         * @param {Object} quest - The quest to check
         * @returns {boolean} True if at turn-in location
         */
        canTurnIn: function (quest) {
            if (!quest.readyForTurnIn) return false;
            if (!quest.returnTo) return true; // No location required

            const state = A.State.get();
            const currentLocation = state.rpg?.currentLocation;

            // Check if returnTo is an NPC - get their location
            const entities = RPG?.Entities?.getAll?.() || [];
            const npcEntity = entities.find(e =>
                e.id === quest.returnTo ||
                e.name?.toLowerCase() === quest.returnTo?.toLowerCase()
            );

            if (npcEntity) {
                return npcEntity.locationId === currentLocation;
            }

            // Check if returnTo is a location ID directly
            return currentLocation === quest.returnTo;
        },

        /**
         * Turn in a quest (manual turn-in when at quest giver)
         * @param {string} questId - ID of quest to turn in
         * @returns {boolean} Success
         */
        turnIn: function (questId) {
            const state = this.ensureState();
            const quest = state.active.find(q => q.id === questId);

            if (!quest) {
                this.notify('⚠️ Quest not found.');
                return false;
            }

            if (!quest.readyForTurnIn) {
                this.notify('⚠️ Quest objectives not yet complete.');
                return false;
            }

            if (!this.canTurnIn(quest)) {
                this.notify('⚠️ You must return to the quest giver to turn in this quest.');
                return false;
            }

            this.complete(quest);
            return true;
        },

        /**
         * Get quests ready for turn-in at current location
         * @returns {Array} Quests that can be turned in here
         */
        getAvailableTurnIns: function () {
            const state = this.ensureState();
            return state.active.filter(q => this.canTurnIn(q));
        },

        /**
         * Award rewards to the party
         * @param {Object} quest - The completed quest with rewards array
         */
        awardRewards: function (quest) {
            if (!quest.rewards || quest.rewards.length === 0) return;

            const state = A.State.get();
            const leaderId = state.rpg?.partyLeader;

            // Find party leader entity
            let leader = null;
            const actors = state.nodes?.actors?.items || {};
            for (const id in actors) {
                const actor = actors[id];
                if (actor.data?.rpg?.enabled) {
                    if (leaderId && id === leaderId) {
                        leader = actor;
                        break;
                    } else if (!leader) {
                        // Fallback to first enabled party member
                        leader = actor;
                    }
                }
            }

            if (!leader) {
                console.warn(LOG_PREFIX, 'No party leader found to receive rewards');
                return;
            }

            // Ensure RPG data structure
            if (!leader.data.rpg) leader.data.rpg = {};
            if (!leader.data.rpg.inventory) leader.data.rpg.inventory = [];
            if (typeof leader.data.rpg.currency === 'undefined') leader.data.rpg.currency = 0;
            if (typeof leader.data.rpg.xp === 'undefined') leader.data.rpg.xp = 0;

            const awarded = [];

            quest.rewards.forEach(reward => {
                const type = (reward.type || '').toLowerCase();
                const value = reward.value;

                switch (type) {
                    case 'gold':
                    case 'currency':
                    case 'money':
                        const amount = parseInt(value) || 0;
                        leader.data.rpg.currency += amount;
                        awarded.push(`💰 ${amount} gold`);
                        break;

                    case 'item':
                    case 'items':
                        // Value can be item ID string or array of IDs
                        const items = Array.isArray(value) ? value : [value];
                        items.forEach(itemId => {
                            leader.data.rpg.inventory.push(itemId);
                            // Try to get item name from armory
                            const armory = state.rpg?.armory || [];
                            const itemDef = armory.find(i => i.id === itemId);
                            const itemName = itemDef?.name || itemId;
                            awarded.push(`🎒 ${itemName}`);
                        });
                        break;

                    case 'xp':
                    case 'experience':
                        const xpAmount = parseInt(value) || 0;
                        leader.data.rpg.xp += xpAmount;
                        awarded.push(`✨ ${xpAmount} XP`);
                        // Check for level up
                        if (RPG?.Leveling?.checkLevelUp) {
                            RPG.Leveling.checkLevelUp(leader);
                        }
                        break;

                    default:
                        // Unknown reward type - just log it
                        awarded.push(`${reward.type}: ${reward.value}`);
                }
            });

            // Emit reward event for UI/other systems
            const engine = A.RPGEngine || (window.RPG && window.RPG.Engine);
            if (engine && engine.emit) {
                engine.emit('reward_granted', {
                    quest: quest,
                    recipient: leader,
                    rewards: quest.rewards
                });
            }

            if (awarded.length > 0) {
                this.notify(`🎁 Rewards: ${awarded.join(', ')}`);
            }
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
            this.awardRewards(quest);
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
