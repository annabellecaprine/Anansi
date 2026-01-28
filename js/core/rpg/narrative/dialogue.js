/**
 * Anansi Plugin: RPG Dialogue System
 * File: js/plugins/rpg/rpg_dialogue.js
 * 
 * Purpose: Manages NPC dialogue trees with branching conversations,
 * conditions, and special actions (quest offers, shop access, etc.)
 * 
 * JSON Schema for AI-assisted dialogue generation:
 * {
 *   "id": "npc_blacksmith_main",
 *   "npcId": "npc_blacksmith",
 *   "nodes": [
 *     {
 *       "id": "start",
 *       "text": "Welcome to my forge, traveler!",
 *       "choices": [
 *         { "label": "Show me your wares", "next": "shop", "action": "openShop" },
 *         { "label": "Any work for an adventurer?", "next": "quest_check" },
 *         { "label": "Goodbye", "next": null }
 *       ]
 *     },
 *     {
 *       "id": "quest_check",
 *       "condition": "quest:sword_reforging:not_started",
 *       "text": "Actually, yes. I need someone to retrieve a rare ore...",
 *       "next": "quest_offer"
 *     }
 *   ]
 * }
 */

(function (A) {
    'use strict';

    const LOG_PREFIX = '[RPG Dialogue]';

    if (!window.RPG) window.RPG = {};

    const Dialogue = {
        // Current dialogue state
        currentDialogue: null,    // Active dialogue tree
        currentNode: null,        // Current node in tree
        currentNpcId: null,       // NPC being talked to
        history: [],              // Conversation history for this session

        /**
         * Initialize dialogue system
         */
        init: function () {
            console.log(LOG_PREFIX, 'Initializing...');

            // Listen for interaction events that might trigger dialogue
            const engine = A.RPGEngine || (window.RPG && window.RPG.Engine);
            if (engine && engine.on) {
                engine.on('npc_interact', (data) => {
                    if (data.npc && this.hasDialogue(data.npc.id)) {
                        this.startDialogue(data.npc.id);
                    }
                });
            }
        },

        /**
         * Ensure dialogue database exists in state
         * @returns {Array} dialogues array
         */
        ensureState: function () {
            const state = A.State.get();
            if (!state.rpg) state.rpg = {};
            if (!state.rpg.dialogues) state.rpg.dialogues = [];
            return state.rpg.dialogues;
        },

        /**
         * Check if an NPC has dialogue
         * @param {string} npcId - NPC ID to check
         * @returns {boolean}
         */
        hasDialogue: function (npcId) {
            const dialogues = this.ensureState();
            return dialogues.some(d => d.npcId === npcId);
        },

        /**
         * Get dialogue tree for an NPC
         * @param {string} npcId - NPC ID
         * @returns {Object|null} Dialogue tree or null
         */
        getDialogue: function (npcId) {
            const dialogues = this.ensureState();
            return dialogues.find(d => d.npcId === npcId) || null;
        },

        /**
         * Start a dialogue with an NPC
         * @param {string} npcId - NPC to talk to
         * @returns {boolean} Success
         */
        startDialogue: function (npcId) {
            const dialogue = this.getDialogue(npcId);
            if (!dialogue) {
                console.warn(LOG_PREFIX, `No dialogue found for NPC: ${npcId}`);
                return false;
            }

            this.currentDialogue = dialogue;
            this.currentNpcId = npcId;
            this.history = [];

            // Find start node
            const startNode = dialogue.nodes.find(n => n.id === 'start') || dialogue.nodes[0];
            if (!startNode) {
                console.warn(LOG_PREFIX, 'No start node in dialogue');
                return false;
            }

            this.goToNode(startNode.id);
            this.showDialogueModal();

            // Emit event
            const engine = A.RPGEngine || (window.RPG && window.RPG.Engine);
            if (engine && engine.emit) {
                engine.emit('dialogue_start', { npcId, dialogue });
            }

            return true;
        },

        /**
         * Navigate to a specific node in the dialogue
         * @param {string} nodeId - Node ID to go to
         */
        goToNode: function (nodeId) {
            if (!nodeId) {
                this.endDialogue();
                return;
            }

            const node = this.currentDialogue.nodes.find(n => n.id === nodeId);
            if (!node) {
                console.warn(LOG_PREFIX, `Node not found: ${nodeId}`);
                this.endDialogue();
                return;
            }

            // Check condition
            if (node.condition && !this.checkCondition(node.condition)) {
                // Skip to fallback or next
                if (node.fallback) {
                    this.goToNode(node.fallback);
                } else if (node.next) {
                    this.goToNode(node.next);
                } else {
                    this.endDialogue();
                }
                return;
            }

            this.currentNode = node;
            this.history.push({ nodeId, text: node.text });

            // Update UI
            this.updateDialogueModal();
        },

        /**
         * Handle player choice selection
         * @param {number} choiceIndex - Index of chosen option
         */
        selectChoice: function (choiceIndex) {
            if (!this.currentNode || !this.currentNode.choices) return;

            const choice = this.currentNode.choices[choiceIndex];
            if (!choice) return;

            // Record choice in history
            this.history.push({ choice: choice.label });

            // Execute action if present
            if (choice.action) {
                this.executeAction(choice.action, choice.actionData);
            }

            // Record conversation in memory
            if (RPG.Memory && this.currentNpcId) {
                RPG.Memory.recordConversation(
                    this.currentNpcId,
                    'player',
                    choice.label
                );
            }

            // Navigate to next node
            this.goToNode(choice.next);
        },

        /**
         * Execute a special action from dialogue
         * @param {string} action - Action type
         * @param {*} data - Action data
         */
        executeAction: function (action, data) {
            const state = A.State.get();

            switch (action) {
                case 'openShop':
                    // Close dialogue, open shop
                    this.endDialogue();
                    // Find shop for this NPC
                    const shops = state.rpg?.shops || [];
                    const shop = shops.find(s => s.shopkeeperId === this.currentNpcId);
                    if (shop && RPG.Shops?.open) {
                        RPG.Shops.open(shop.id);
                    }
                    break;

                case 'offerQuest':
                    // Offer a quest
                    if (data && RPG.Quests?.offer) {
                        RPG.Quests.offer(data);
                    }
                    break;

                case 'turnInQuest':
                    // Turn in a quest
                    if (data && RPG.Quests?.turnIn) {
                        RPG.Quests.turnIn(data);
                    }
                    break;

                case 'setFlag':
                    // Set a story flag
                    if (data && RPG.Story?.setFlag) {
                        const [key, value] = data.split(':');
                        RPG.Story.setFlag(key, value || 'true');
                    }
                    break;

                case 'adjustSentiment':
                    // Adjust NPC sentiment toward player
                    if (RPG.Entities?.adjustSentiment) {
                        const delta = parseInt(data) || 1;
                        RPG.Entities.adjustSentiment(this.currentNpcId, 'player', delta);
                    }
                    break;

                case 'giveItem':
                    // Give an item to the player
                    if (data) {
                        const leaderId = state.rpg?.partyLeader;
                        const actors = state.nodes?.actors?.items || {};
                        for (const id in actors) {
                            if (leaderId && id === leaderId) {
                                const actor = actors[id];
                                if (!actor.data.rpg) actor.data.rpg = {};
                                if (!actor.data.rpg.inventory) actor.data.rpg.inventory = [];
                                actor.data.rpg.inventory.push(data);
                                this.notify(`Received: ${data}`);
                                break;
                            }
                        }
                    }
                    break;

                case 'giveGold':
                    // Give gold to the player
                    if (data) {
                        const amount = parseInt(data) || 0;
                        const leaderId = state.rpg?.partyLeader;
                        const actors = state.nodes?.actors?.items || {};
                        for (const id in actors) {
                            if (leaderId && id === leaderId) {
                                const actor = actors[id];
                                if (!actor.data.rpg) actor.data.rpg = {};
                                actor.data.rpg.currency = (actor.data.rpg.currency || 0) + amount;
                                this.notify(`Received: 💰 ${amount} gold`);
                                break;
                            }
                        }
                    }
                    break;

                default:
                    console.warn(LOG_PREFIX, `Unknown action: ${action}`);
            }
        },

        /**
         * Check if a condition is met
         * @param {string} condition - Condition string (e.g., "quest:sword:completed")
         * @returns {boolean}
         */
        checkCondition: function (condition) {
            if (!condition) return true;

            const state = A.State.get();
            const parts = condition.split(':');
            const type = parts[0];

            switch (type) {
                case 'quest':
                    // quest:questId:status (completed, active, not_started)
                    const questId = parts[1];
                    const status = parts[2] || 'completed';
                    const quests = state.rpg?.quests || { active: [], completed: [] };

                    if (status === 'completed') {
                        return quests.completed.includes(questId);
                    } else if (status === 'active') {
                        return quests.active.some(q => q.id === questId);
                    } else if (status === 'not_started') {
                        return !quests.completed.includes(questId) &&
                            !quests.active.some(q => q.id === questId);
                    } else if (status === 'ready') {
                        const quest = quests.active.find(q => q.id === questId);
                        return quest?.readyForTurnIn || false;
                    }
                    break;

                case 'flag':
                    // flag:flagName:value
                    const flagName = parts[1];
                    const expectedValue = parts[2] || 'true';
                    const flags = state.rpg?.storyFlags || {};
                    return String(flags[flagName]) === expectedValue;

                case 'sentiment':
                    // sentiment:level (friendly, hostile, etc.)
                    const requiredLevel = parts[1];
                    if (RPG.Entities?.getSentiment) {
                        const sentiment = RPG.Entities.getSentiment(this.currentNpcId, 'player');
                        const levels = ['hostile', 'suspicious', 'neutral', 'friendly', 'loyal'];
                        const currentIdx = levels.indexOf(sentiment);
                        const requiredIdx = levels.indexOf(requiredLevel);
                        return currentIdx >= requiredIdx;
                    }
                    break;

                case 'hasItem':
                    // hasItem:itemId
                    const itemId = parts[1];
                    const leaderId = state.rpg?.partyLeader;
                    const actors = state.nodes?.actors?.items || {};
                    for (const id in actors) {
                        const actor = actors[id];
                        if (actor.data?.rpg?.enabled && (!leaderId || id === leaderId)) {
                            const inv = actor.data.rpg.inventory || [];
                            if (inv.includes(itemId)) return true;
                        }
                    }
                    return false;

                case 'hasGold':
                    // hasGold:amount
                    const requiredGold = parseInt(parts[1]) || 0;
                    const leaderId2 = state.rpg?.partyLeader;
                    const actors2 = state.nodes?.actors?.items || {};
                    for (const id in actors2) {
                        const actor = actors2[id];
                        if (actor.data?.rpg?.enabled && (!leaderId2 || id === leaderId2)) {
                            if ((actor.data.rpg.currency || 0) >= requiredGold) return true;
                        }
                    }
                    return false;

                default:
                    console.warn(LOG_PREFIX, `Unknown condition type: ${type}`);
            }

            return false;
        },

        /**
         * End the current dialogue
         */
        endDialogue: function () {
            const npcId = this.currentNpcId;
            const dialogue = this.currentDialogue;

            this.currentDialogue = null;
            this.currentNode = null;
            this.currentNpcId = null;

            this.closeDialogueModal();

            // Emit event
            const engine = A.RPGEngine || (window.RPG && window.RPG.Engine);
            if (engine && engine.emit) {
                engine.emit('dialogue_end', { npcId, dialogue, history: this.history });
            }

            this.history = [];
        },

        /**
         * Show the dialogue modal
         */
        showDialogueModal: function () {
            this.updateDialogueModal();
        },

        /**
         * Update the dialogue modal content
         */
        updateDialogueModal: function () {
            const node = this.currentNode;
            if (!node) return;

            // Get NPC name
            const npcName = this.getNpcName(this.currentNpcId);

            // Build choices HTML
            let choicesHtml = '';
            if (node.choices && node.choices.length > 0) {
                choicesHtml = node.choices.map((choice, idx) => {
                    // Check if choice has condition
                    if (choice.condition && !this.checkCondition(choice.condition)) {
                        return ''; // Hide unavailable choices
                    }
                    return `<button class="btn btn-secondary dialogue-choice" data-idx="${idx}" style="width:100%; text-align:left; margin-bottom:8px;">${choice.label}</button>`;
                }).join('');
            } else if (node.next) {
                // Auto-continue node
                choicesHtml = `<button class="btn btn-primary dialogue-continue" style="width:100%;">Continue</button>`;
            } else {
                // End of conversation
                choicesHtml = `<button class="btn btn-ghost dialogue-end" style="width:100%;">End Conversation</button>`;
            }

            const content = `
                <div style="padding:20px; max-width:500px; min-width:350px;">
                    <div style="display:flex; align-items:center; gap:12px; margin-bottom:16px;">
                        <div style="width:48px; height:48px; border-radius:50%; background:var(--bg-hover); display:flex; align-items:center; justify-content:center; font-size:24px;">
                            👤
                        </div>
                        <div>
                            <div style="font-weight:600; font-size:16px;">${npcName}</div>
                            <div style="font-size:11px; color:var(--text-muted);">Speaking...</div>
                        </div>
                    </div>
                    
                    <div id="dialogue-text" style="background:var(--bg-inset); padding:16px; border-radius:8px; margin-bottom:16px; min-height:60px; line-height:1.6;">
                        ${node.text}
                    </div>
                    
                    <div id="dialogue-choices">
                        ${choicesHtml}
                    </div>
                </div>
            `;

            // Check if modal already exists
            let modal = document.getElementById('dialogue-modal-container');
            if (!modal) {
                A.UI.Modal.show({
                    content: content,
                    closable: false,
                    onOpen: (el) => {
                        el.id = 'dialogue-modal-container';
                        this.wireDialogueEvents(el);
                    }
                });
            } else {
                modal.innerHTML = content;
                this.wireDialogueEvents(modal);
            }
        },

        /**
         * Wire up dialogue button events
         * @param {HTMLElement} container 
         */
        wireDialogueEvents: function (container) {
            // Choice buttons
            container.querySelectorAll('.dialogue-choice').forEach(btn => {
                btn.onclick = () => {
                    const idx = parseInt(btn.dataset.idx);
                    this.selectChoice(idx);
                };
            });

            // Continue button
            const continueBtn = container.querySelector('.dialogue-continue');
            if (continueBtn) {
                continueBtn.onclick = () => {
                    this.goToNode(this.currentNode.next);
                };
            }

            // End button
            const endBtn = container.querySelector('.dialogue-end');
            if (endBtn) {
                endBtn.onclick = () => {
                    this.endDialogue();
                };
            }
        },

        /**
         * Close the dialogue modal
         */
        closeDialogueModal: function () {
            A.UI.Modal.close();
        },

        /**
         * Get NPC name by ID
         * @param {string} npcId 
         * @returns {string}
         */
        getNpcName: function (npcId) {
            // Try entities
            if (RPG.Entities?.get) {
                const entity = RPG.Entities.get(npcId);
                if (entity?.name) return entity.name;
            }

            // Try actors
            const state = A.State.get();
            const actors = state.nodes?.actors?.items || {};
            for (const id in actors) {
                if (id === npcId) {
                    return actors[id].name || npcId;
                }
            }

            return npcId;
        },

        /**
         * Send notification
         * @param {string} msg 
         */
        notify: function (msg) {
            const chatLog = document.getElementById('rpg-chat-log');
            if (chatLog) {
                const div = document.createElement('div');
                div.className = 'msg-system';
                div.style.cssText = 'padding:6px; background:var(--bg-inset); border:1px solid var(--accent-primary); border-radius:4px; margin:4px 0; font-size:12px;';
                div.innerHTML = msg;
                chatLog.appendChild(div);
                chatLog.scrollTop = chatLog.scrollHeight;
            }
        },

        // =============================================
        // DIALOGUE CRUD (for GM authoring)
        // =============================================

        /**
         * Create a new dialogue tree
         * @param {Object} dialogueData 
         * @returns {Object} Created dialogue
         */
        create: function (dialogueData) {
            const dialogues = this.ensureState();

            const dialogue = {
                id: dialogueData.id || `dlg_${Date.now()}`,
                npcId: dialogueData.npcId || null,
                name: dialogueData.name || 'New Dialogue',
                nodes: dialogueData.nodes || [
                    {
                        id: 'start',
                        text: 'Hello, traveler.',
                        choices: [
                            { label: 'Goodbye', next: null }
                        ]
                    }
                ]
            };

            dialogues.push(dialogue);
            A.State.notify();
            return dialogue;
        },

        /**
         * Update an existing dialogue
         * @param {string} dialogueId 
         * @param {Object} updates 
         */
        update: function (dialogueId, updates) {
            const dialogues = this.ensureState();
            const idx = dialogues.findIndex(d => d.id === dialogueId);
            if (idx >= 0) {
                Object.assign(dialogues[idx], updates);
                A.State.notify();
            }
        },

        /**
         * Delete a dialogue
         * @param {string} dialogueId 
         */
        delete: function (dialogueId) {
            const state = A.State.get();
            if (!state.rpg?.dialogues) return;
            state.rpg.dialogues = state.rpg.dialogues.filter(d => d.id !== dialogueId);
            A.State.notify();
        },

        /**
         * Get all dialogues
         * @returns {Array}
         */
        getAll: function () {
            return this.ensureState();
        },

        /**
         * Import dialogue from JSON text
         * @param {string} jsonText 
         * @returns {Object|null} Imported dialogue or null on error
         */
        importFromJSON: function (jsonText) {
            try {
                const data = JSON.parse(jsonText);

                // Validate structure
                if (!data.nodes || !Array.isArray(data.nodes)) {
                    throw new Error('Invalid dialogue format: missing nodes array');
                }

                // Ensure each node has an ID
                data.nodes.forEach((node, idx) => {
                    if (!node.id) node.id = `node_${idx}`;
                });

                return this.create(data);
            } catch (e) {
                console.error(LOG_PREFIX, 'Import failed:', e);
                return null;
            }
        },

        /**
         * Export dialogue to JSON
         * @param {string} dialogueId 
         * @returns {string} JSON string
         */
        exportToJSON: function (dialogueId) {
            const dialogues = this.ensureState();
            const dialogue = dialogues.find(d => d.id === dialogueId);
            if (!dialogue) return null;
            return JSON.stringify(dialogue, null, 2);
        }
    };

    // Export
    window.RPG.Dialogue = Dialogue;
    A.RPGDialogue = Dialogue;

    // Auto-init
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => Dialogue.init());
    } else {
        setTimeout(() => Dialogue.init(), 500);
    }

})(window.Anansi);
