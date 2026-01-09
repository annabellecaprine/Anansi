/*
 * Anansi Panel: RPG Monsters
 * File: js/panels/rpg_monsters.js
 * Category: RPG Experiment
 * Purpose: Bestiary and Spawn Manager. Lists predefined monsters and NPCs, allows spawning, manual creation/editing, and LLM-based generation.
 */

(function (A) {
    'use strict';

    // Default Bestiary for Prototype - with full stat blocks
    const DEFAULT_BESTIARY = [
        {
            id: 'orc_grunt',
            name: 'Orc Grunt',
            creatureType: 'monster',
            hp: 20,
            ac: 12,
            stats: { STR: 14, DEX: 10, CON: 14, INT: 7, WIS: 11, CHA: 10 },
            xp: 50,
            description: 'A brutish orc warrior wielding a battered axe.',
            inventory: [{ name: 'Rusty Axe', type: 'weapon', dmg: '1d8' }],
            isDefault: true
        },
        {
            id: 'goblin_sapper',
            name: 'Goblin Sapper',
            creatureType: 'monster',
            hp: 12,
            ac: 14,
            stats: { STR: 8, DEX: 14, CON: 10, INT: 10, WIS: 8, CHA: 8 },
            xp: 25,
            description: 'A sneaky goblin with a penchant for explosives.',
            inventory: [{ name: 'Dagger', type: 'weapon', dmg: '1d4' }],
            isDefault: true
        },
        {
            id: 'skeleton_warrior',
            name: 'Skeleton Warrior',
            creatureType: 'monster',
            hp: 15,
            ac: 13,
            stats: { STR: 12, DEX: 12, CON: 10, INT: 6, WIS: 8, CHA: 5 },
            xp: 35,
            description: 'An undead warrior animated by dark magic.',
            inventory: [{ name: 'Shortsword', type: 'weapon', dmg: '1d6' }],
            isDefault: true
        },
        {
            id: 'gelatinous_cube',
            name: 'Gelatinous Cube',
            creatureType: 'monster',
            hp: 45,
            ac: 6,
            stats: { STR: 14, DEX: 3, CON: 20, INT: 1, WIS: 6, CHA: 1 },
            xp: 200,
            description: 'A transparent ooze that digests everything in its path.',
            inventory: [],
            isDefault: true
        },
        {
            id: 'dragon_hatchling',
            name: 'Red Dragon Hatchling',
            creatureType: 'monster',
            hp: 60,
            ac: 16,
            stats: { STR: 16, DEX: 12, CON: 15, INT: 10, WIS: 11, CHA: 14 },
            xp: 500,
            description: 'A young dragon with fiery breath and fierce ambition.',
            inventory: [{ name: 'Fire Breath', type: 'weapon', dmg: '2d6' }],
            isDefault: true
        },
        {
            id: 'innkeeper_martha',
            name: 'Martha the Innkeeper',
            creatureType: 'npc',
            hp: 8,
            ac: 10,
            stats: { STR: 10, DEX: 10, CON: 10, INT: 12, WIS: 14, CHA: 14 },
            xp: 0,
            description: 'A kindly middle-aged woman who runs the Prancing Pony tavern.',
            inventory: [],
            isDefault: true
        },
        {
            id: 'blacksmith_gorn',
            name: 'Gorn the Blacksmith',
            creatureType: 'npc',
            hp: 18,
            ac: 11,
            stats: { STR: 16, DEX: 10, CON: 14, INT: 11, WIS: 10, CHA: 10 },
            xp: 0,
            description: 'A burly dwarf who crafts the finest weapons in the region.',
            inventory: [{ name: 'Smithing Hammer', type: 'tool', dmg: '1d6' }],
            isDefault: true
        }
    ];

    // System prompt for generating creatures
    const GENERATION_PROMPT = `You are an RPG game master assistant. Generate a creature or NPC for a fantasy RPG based on the user's description.

Return ONLY valid JSON in this exact format (no markdown, no extra text):
{
    "name": "Creature Name",
    "creatureType": "monster" or "npc",
    "hp": <number 1-200>,
    "ac": <number 5-20>,
    "stats": {
        "STR": <number 1-20>,
        "DEX": <number 1-20>,
        "CON": <number 1-20>,
        "INT": <number 1-20>,
        "WIS": <number 1-20>,
        "CHA": <number 1-20>
    },
    "xp": <number 0-1000>,
    "description": "A brief 1-2 sentence description of appearance and personality.",
    "inventory": [
        {"name": "Item Name", "type": "weapon|armor|tool|misc", "dmg": "dice notation like 1d6 or empty string"}
    ]
}

Guidelines:
- For MONSTERS: Focus on combat stats, threatening descriptions, XP rewards
- For NPCs: Lower combat stats (unless warriors), focus on personality, XP is usually 0
- HP ranges: Weak (5-15), Average (20-40), Strong (50-80), Boss (100+)
- AC ranges: Unarmored (10), Light (12-14), Medium (15-16), Heavy (17-20)
- Stats are on a 1-20 scale (10 is average human)
- Give appropriate items based on the creature's role`;

    function render(container) {
        container.style.height = '100%';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.background = 'var(--bg-base)';
        container.style.padding = '0';

        // Ensure state
        const state = A.State.get();
        if (!state.rpg) state.rpg = { enabled: true };
        if (!state.rpg.bestiary) state.rpg.bestiary = JSON.parse(JSON.stringify(DEFAULT_BESTIARY));

        // Migrate existing entries to have creatureType and stats
        state.rpg.bestiary.forEach(entry => {
            if (!entry.creatureType) {
                entry.creatureType = 'monster';
            }
            if (!entry.stats) {
                entry.stats = { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 };
            }
        });

        // Header
        const header = document.createElement('div');
        header.className = 'panel-toolbar';
        header.style.padding = '12px 16px';
        header.style.background = 'var(--bg-elevated)';
        header.style.borderBottom = '1px solid var(--border-subtle)';
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        header.style.flexWrap = 'wrap';
        header.style.gap = '8px';

        header.innerHTML = `
            <div style="font-weight:bold; font-size:14px; display:flex; align-items:center; gap:8px;">
                <span>🐉</span> Bestiary
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
                <button id="btn-create-creature" class="btn btn-primary btn-sm" style="display:flex; align-items:center; gap:4px;">
                    + New Creature
                </button>
                <button id="btn-generate-creature" class="btn btn-secondary btn-sm" style="display:flex; align-items:center; gap:4px;">
                    ✨ AI Generate
                </button>
                <div style="font-size:11px; color:var(--text-muted); text-transform:uppercase; margin-left:8px;">
                    Active: <span id="active-enemy" style="color:var(--status-error); font-weight:bold;">None</span>
                </div>
            </div>
        `;
        container.appendChild(header);

        // Wire up buttons
        header.querySelector('#btn-create-creature').onclick = () => showCreatureEditor(null);
        header.querySelector('#btn-generate-creature').onclick = () => showGenerateModal();

        // Content
        const content = document.createElement('div');
        content.style.flex = '1';
        content.style.overflowY = 'auto';
        content.style.padding = '16px';
        container.appendChild(content);

        // Helper: Calculate Modifier
        const calcMod = (val) => {
            const mod = Math.floor((val - 10) / 2);
            return mod >= 0 ? `+${mod}` : `${mod}`;
        };

        // Helper: Show Creature Editor Modal
        const showCreatureEditor = (existingCreature) => {
            const isEdit = existingCreature !== null;
            const creature = isEdit ? { ...existingCreature, stats: { ...existingCreature.stats }, inventory: [...(existingCreature.inventory || [])] } : {
                id: 'creature_' + Math.random().toString(36).substr(2, 9),
                name: '',
                creatureType: 'monster',
                hp: 20,
                ac: 10,
                stats: { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 },
                xp: 50,
                description: '',
                inventory: [],
                isCustom: true
            };

            const modalContent = document.createElement('div');
            modalContent.innerHTML = `
                <div style="display:flex; flex-direction:column; gap:16px;">
                    <!-- Type Toggle -->
                    <div>
                        <label class="label" style="display:block; margin-bottom:8px;">Creature Type</label>
                        <div style="display:flex; gap:8px;">
                            <button id="type-monster" class="btn btn-sm ${creature.creatureType === 'monster' ? '' : 'btn-ghost'}" style="flex:1; ${creature.creatureType === 'monster' ? 'background:var(--status-error-bg); border:2px solid var(--status-error); color:var(--status-error);' : 'border:2px solid var(--border-subtle);'}">
                                🐉 Monster
                            </button>
                            <button id="type-npc" class="btn btn-sm ${creature.creatureType === 'npc' ? '' : 'btn-ghost'}" style="flex:1; ${creature.creatureType === 'npc' ? 'background:var(--accent-soft); border:2px solid var(--accent-primary); color:var(--accent-primary);' : 'border:2px solid var(--border-subtle);'}">
                                👤 NPC
                            </button>
                        </div>
                    </div>

                    <!-- Name -->
                    <div>
                        <label class="label">Name</label>
                        <input type="text" id="creature-name" class="input" style="width:100%;" value="${creature.name}" placeholder="e.g. Goblin Shaman">
                    </div>

                    <!-- Description -->
                    <div>
                        <label class="label">Description</label>
                        <textarea id="creature-desc" class="input" style="width:100%; height:60px; resize:vertical;" placeholder="Brief description of appearance and behavior...">${creature.description || ''}</textarea>
                    </div>

                    <!-- Core Stats Row -->
                    <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:12px;">
                        <div>
                            <label class="label">HP</label>
                            <input type="number" id="stat-hp" class="input" style="width:100%;" value="${creature.hp}" min="1">
                        </div>
                        <div>
                            <label class="label">AC</label>
                            <input type="number" id="stat-ac" class="input" style="width:100%;" value="${creature.ac}" min="1" max="30">
                        </div>
                        <div>
                            <label class="label">XP Reward</label>
                            <input type="number" id="stat-xp" class="input" style="width:100%;" value="${creature.xp}" min="0">
                        </div>
                        <div>
                            <label class="label">Main Actions</label>
                            <input type="number" id="stat-maxactions" class="input" style="width:100%;" value="${creature.maxActions || 1}" min="0" max="10">
                        </div>
                        <div>
                            <label class="label">Bonus Actions</label>
                            <input type="number" id="stat-maxbonusactions" class="input" style="width:100%;" value="${creature.maxBonusActions || 1}" min="0" max="10">
                        </div>
                    </div>

                    <!-- Ability Scores -->
                    <div>
                        <label class="label" style="margin-bottom:8px; display:block;">Ability Scores</label>
                        <div style="display:grid; grid-template-columns:repeat(6, 1fr); gap:8px;">
                            ${['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'].map(stat => `
                                <div style="text-align:center;">
                                    <div style="font-size:10px; font-weight:bold; color:var(--text-muted); margin-bottom:4px;">${stat}</div>
                                    <input type="number" class="input stat-input" data-stat="${stat}" style="width:100%; text-align:center;" value="${creature.stats[stat] || 10}" min="1" max="30">
                                    <div class="stat-mod" style="font-size:11px; color:var(--accent-primary); margin-top:2px;">${calcMod(creature.stats[stat] || 10)}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Inventory Section -->
                    <div>
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                            <label class="label" style="margin:0;">Inventory / Attacks</label>
                            <button id="btn-add-item" class="btn btn-xs btn-ghost">+ Add Item</button>
                        </div>
                        <div id="inventory-list" style="display:flex; flex-direction:column; gap:6px; max-height:150px; overflow-y:auto;">
                            ${creature.inventory.length === 0 ? '<div style="color:var(--text-muted); font-size:11px; font-style:italic;">No items (unarmed)</div>' : ''}
                        </div>
                    </div>
                </div>
            `;

            // Type toggle logic
            const typeMonsterBtn = modalContent.querySelector('#type-monster');
            const typeNpcBtn = modalContent.querySelector('#type-npc');

            const setType = (type) => {
                creature.creatureType = type;
                if (type === 'monster') {
                    typeMonsterBtn.style.background = 'var(--status-error-bg)';
                    typeMonsterBtn.style.borderColor = 'var(--status-error)';
                    typeMonsterBtn.style.color = 'var(--status-error)';
                    typeMonsterBtn.classList.remove('btn-ghost');
                    typeNpcBtn.style.background = '';
                    typeNpcBtn.style.borderColor = 'var(--border-subtle)';
                    typeNpcBtn.style.color = '';
                    typeNpcBtn.classList.add('btn-ghost');
                } else {
                    typeNpcBtn.style.background = 'var(--accent-soft)';
                    typeNpcBtn.style.borderColor = 'var(--accent-primary)';
                    typeNpcBtn.style.color = 'var(--accent-primary)';
                    typeNpcBtn.classList.remove('btn-ghost');
                    typeMonsterBtn.style.background = '';
                    typeMonsterBtn.style.borderColor = 'var(--border-subtle)';
                    typeMonsterBtn.style.color = '';
                    typeMonsterBtn.classList.add('btn-ghost');
                }
            };

            typeMonsterBtn.onclick = () => setType('monster');
            typeNpcBtn.onclick = () => setType('npc');

            // Stat input live mod updates
            modalContent.querySelectorAll('.stat-input').forEach(input => {
                input.oninput = (e) => {
                    const modDiv = e.target.parentElement.querySelector('.stat-mod');
                    modDiv.textContent = calcMod(parseInt(e.target.value) || 10);
                };
            });

            // Inventory management
            const inventoryList = modalContent.querySelector('#inventory-list');
            const renderInventory = () => {
                if (creature.inventory.length === 0) {
                    inventoryList.innerHTML = '<div style="color:var(--text-muted); font-size:11px; font-style:italic;">No items (unarmed)</div>';
                    return;
                }
                inventoryList.innerHTML = creature.inventory.map((item, idx) => `
                    <div style="display:flex; gap:8px; align-items:center; background:var(--bg-surface); padding:6px 8px; border-radius:4px;">
                        <input type="text" class="input item-name" data-idx="${idx}" style="flex:2;" value="${item.name}" placeholder="Item name">
                        <select class="input item-type" data-idx="${idx}" style="flex:1; font-size:11px;">
                            <option value="weapon" ${item.type === 'weapon' ? 'selected' : ''}>Weapon</option>
                            <option value="armor" ${item.type === 'armor' ? 'selected' : ''}>Armor</option>
                            <option value="tool" ${item.type === 'tool' ? 'selected' : ''}>Tool</option>
                            <option value="misc" ${item.type === 'misc' ? 'selected' : ''}>Misc</option>
                        </select>
                        <input type="text" class="input item-dmg" data-idx="${idx}" style="flex:1;" value="${item.dmg || ''}" placeholder="1d6">
                        <button class="btn btn-xs btn-ghost item-remove" data-idx="${idx}" style="color:var(--status-error);">✕</button>
                    </div>
                `).join('');

                // Wire up inventory events
                inventoryList.querySelectorAll('.item-name').forEach(el => {
                    el.oninput = (e) => {
                        creature.inventory[parseInt(e.target.dataset.idx)].name = e.target.value;
                    };
                });
                inventoryList.querySelectorAll('.item-type').forEach(el => {
                    el.onchange = (e) => {
                        creature.inventory[parseInt(e.target.dataset.idx)].type = e.target.value;
                    };
                });
                inventoryList.querySelectorAll('.item-dmg').forEach(el => {
                    el.oninput = (e) => {
                        creature.inventory[parseInt(e.target.dataset.idx)].dmg = e.target.value;
                    };
                });
                inventoryList.querySelectorAll('.item-remove').forEach(el => {
                    el.onclick = (e) => {
                        creature.inventory.splice(parseInt(e.target.dataset.idx), 1);
                        renderInventory();
                    };
                });
            };

            renderInventory();

            modalContent.querySelector('#btn-add-item').onclick = () => {
                creature.inventory.push({ name: '', type: 'weapon', dmg: '' });
                renderInventory();
            };

            A.UI.Modal.show({
                title: isEdit ? '✏️ Edit Creature' : '➕ New Creature',
                content: modalContent,
                width: 550,
                actions: [
                    {
                        label: 'Cancel',
                        class: 'btn-secondary',
                        onclick: () => true
                    },
                    {
                        label: isEdit ? '💾 Save Changes' : '✓ Create',
                        class: 'btn-primary',
                        onclick: (modal) => {
                            // Gather values
                            creature.name = modal.querySelector('#creature-name').value.trim();
                            creature.description = modal.querySelector('#creature-desc').value.trim();
                            creature.hp = parseInt(modal.querySelector('#stat-hp').value) || 20;
                            creature.ac = parseInt(modal.querySelector('#stat-ac').value) || 10;
                            creature.xp = parseInt(modal.querySelector('#stat-xp').value) || 0;
                            creature.maxActions = parseInt(modal.querySelector('#stat-maxactions').value) || 1;
                            creature.maxBonusActions = parseInt(modal.querySelector('#stat-maxbonusactions').value) || 1;

                            modal.querySelectorAll('.stat-input').forEach(el => {
                                creature.stats[el.dataset.stat] = parseInt(el.value) || 10;
                            });

                            // Filter empty inventory items
                            creature.inventory = creature.inventory.filter(i => i.name.trim() !== '');

                            if (!creature.name) {
                                if (A.UI.Toast) A.UI.Toast.show('Please enter a name for the creature.', 'warning');
                                return false;
                            }

                            const state = A.State.get();

                            if (isEdit) {
                                // Update existing
                                const idx = state.rpg.bestiary.findIndex(c => c.id === creature.id);
                                if (idx !== -1) {
                                    state.rpg.bestiary[idx] = creature;
                                }
                            } else {
                                // Add new
                                creature.isCustom = true;
                                state.rpg.bestiary.push(creature);
                            }

                            A.State.notify();
                            if (A.UI.Toast) A.UI.Toast.show(`${creature.name} ${isEdit ? 'updated' : 'added to bestiary'}!`, 'success');
                            A.UI.switchPanel('rpg_monsters');
                            return true;
                        }
                    }
                ]
            });
        };

        // Helper: Show AI Generate Modal
        const showGenerateModal = () => {
            const modalContent = document.createElement('div');
            modalContent.innerHTML = `
                <div style="display:flex; flex-direction:column; gap:16px;">
                    <div>
                        <label class="label" style="display:block; margin-bottom:8px;">Creature Type</label>
                        <div style="display:flex; gap:8px;">
                            <button id="type-monster" class="btn btn-sm" style="flex:1; background:var(--status-error-bg); border:2px solid var(--status-error); color:var(--status-error);">
                                🐉 Monster
                            </button>
                            <button id="type-npc" class="btn btn-sm btn-ghost" style="flex:1; border:2px solid var(--border-subtle);">
                                👤 NPC
                            </button>
                        </div>
                    </div>
                    
                    <div>
                        <label class="label" style="display:block; margin-bottom:8px;">Describe Your Creature</label>
                        <textarea id="creature-prompt" class="input" style="width:100%; height:120px; resize:vertical;" 
                            placeholder="Example: A cunning goblin shaman who commands fire magic and leads a tribe of raiders..."></textarea>
                    </div>
                    
                    <div id="generation-status" style="display:none; padding:12px; background:var(--bg-inset); border-radius:var(--radius-md); text-align:center;">
                        <div style="font-size:13px; color:var(--text-muted);">
                            ✨ Weaving creature from the threads of imagination...
                        </div>
                    </div>
                </div>
            `;

            let selectedType = 'monster';
            const typeMonsterBtn = modalContent.querySelector('#type-monster');
            const typeNpcBtn = modalContent.querySelector('#type-npc');
            const promptInput = modalContent.querySelector('#creature-prompt');

            const setType = (type) => {
                selectedType = type;
                if (type === 'monster') {
                    typeMonsterBtn.style.background = 'var(--status-error-bg)';
                    typeMonsterBtn.style.borderColor = 'var(--status-error)';
                    typeMonsterBtn.style.color = 'var(--status-error)';
                    typeMonsterBtn.classList.remove('btn-ghost');
                    typeNpcBtn.style.background = '';
                    typeNpcBtn.style.borderColor = 'var(--border-subtle)';
                    typeNpcBtn.style.color = '';
                    typeNpcBtn.classList.add('btn-ghost');
                } else {
                    typeNpcBtn.style.background = 'var(--accent-soft)';
                    typeNpcBtn.style.borderColor = 'var(--accent-primary)';
                    typeNpcBtn.style.color = 'var(--accent-primary)';
                    typeNpcBtn.classList.remove('btn-ghost');
                    typeMonsterBtn.style.background = '';
                    typeMonsterBtn.style.borderColor = 'var(--border-subtle)';
                    typeMonsterBtn.style.color = '';
                    typeMonsterBtn.classList.add('btn-ghost');
                }
            };

            typeMonsterBtn.onclick = () => setType('monster');
            typeNpcBtn.onclick = () => setType('npc');

            A.UI.Modal.show({
                title: '✨ AI Generate Creature',
                content: modalContent,
                width: 500,
                actions: [
                    {
                        label: 'Cancel',
                        class: 'btn-secondary',
                        onclick: () => true
                    },
                    {
                        label: '🎲 Generate',
                        class: 'btn-primary',
                        onclick: async (modal) => {
                            const prompt = promptInput.value.trim();
                            if (!prompt) {
                                if (A.UI.Toast) A.UI.Toast.show('Please describe the creature you want to create.', 'warning');
                                return false;
                            }

                            const llmConfig = A.UI.getActiveLLMConfig ? A.UI.getActiveLLMConfig() : null;
                            if (!llmConfig || !llmConfig.apiKey) {
                                if (A.UI.Toast) A.UI.Toast.show('No API Key configured. Open API Configuration first.', 'error');
                                return false;
                            }

                            const statusDiv = modalContent.querySelector('#generation-status');
                            statusDiv.style.display = 'block';

                            try {
                                const userPrompt = `Create a ${selectedType.toUpperCase()} based on this description: ${prompt}`;
                                const response = await A.LLM.generate(GENERATION_PROMPT, [
                                    { role: 'user', content: userPrompt }
                                ]);

                                const jsonMatch = response.match(/\{[\s\S]*\}/);
                                if (!jsonMatch) {
                                    throw new Error('Invalid response format');
                                }

                                const creature = JSON.parse(jsonMatch[0]);
                                creature.creatureType = selectedType;
                                creature.id = 'gen_' + Math.random().toString(36).substr(2, 9);
                                creature.isCustom = true;

                                // Ensure stats object exists
                                if (!creature.stats) {
                                    creature.stats = { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 };
                                }

                                if (!creature.name || typeof creature.hp !== 'number') {
                                    throw new Error('Missing required fields in response');
                                }

                                const state = A.State.get();
                                state.rpg.bestiary.push(creature);
                                A.State.notify();

                                if (A.UI.Toast) A.UI.Toast.show(`${creature.name} has been added to the bestiary!`, 'success');
                                A.UI.switchPanel('rpg_monsters');
                                return true;
                            } catch (err) {
                                statusDiv.style.display = 'none';
                                console.error('[RPG Monsters] Generation error:', err);
                                if (A.UI.Toast) A.UI.Toast.show(`Generation failed: ${err.message}`, 'error');
                                return false;
                            }
                        }
                    }
                ]
            });
        };

        // Helper: Spawn Monster
        const spawnMonster = (monsterTemplate) => {
            const data = {
                type: monsterTemplate.creatureType || 'monster',
                name: monsterTemplate.name,
                hp: monsterTemplate.hp,
                maxHp: monsterTemplate.hp,
                ac: monsterTemplate.ac,
                xp: monsterTemplate.xp || 0,
                stats: monsterTemplate.stats || { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 },
                inventory: monsterTemplate.inventory || [],
                description: monsterTemplate.description || '',
                actions: monsterTemplate.maxActions || 1,
                bonusActions: monsterTemplate.maxBonusActions || 1,
                // Ensure stats matrix is created by Entity logic or defaulted here if needed
                // RPG.Entities.create handles most defaults
            };

            const id = RPG.Entities.create(data);

            if (id) {
                if (A.UI.Toast) A.UI.Toast.show(`Spawned ${monsterTemplate.name}!`, 'success');
                updateActiveDisplay();
            } else {
                if (A.UI.Toast) A.UI.Toast.show(`Failed to spawn ${monsterTemplate.name}`, 'error');
            }
        };

        // Helper: Delete from Bestiary
        const deleteFromBestiary = (creatureId, e) => {
            e.stopPropagation();
            const state = A.State.get();
            const index = state.rpg.bestiary.findIndex(c => c.id === creatureId);
            if (index !== -1) {
                const name = state.rpg.bestiary[index].name;
                state.rpg.bestiary.splice(index, 1);
                A.State.notify();
                if (A.UI.Toast) A.UI.Toast.show(`Removed ${name} from bestiary.`, 'info');
                A.UI.switchPanel('rpg_monsters');
            }
        };

        // Update Display to show Active Creatures
        const updateActiveDisplay = () => {
            const activeContainer = header.querySelector('#active-enemy');
            activeContainer.innerHTML = '';

            const entities = RPG.Entities.getAll();
            const activeCreatures = entities.filter(e => e.type === 'monster' || e.type === 'npc');

            if (activeCreatures.length === 0) {
                activeContainer.textContent = "None";
                return;
            }

            activeCreatures.forEach(m => {
                const isNpc = m.type === 'npc';
                const badge = document.createElement('span');
                badge.style.display = 'inline-flex';
                badge.style.alignItems = 'center';
                badge.style.gap = '4px';
                badge.style.background = isNpc ? 'rgba(100, 150, 255, 0.1)' : 'rgba(255, 50, 50, 0.1)';
                badge.style.color = isNpc ? 'var(--accent-primary)' : 'var(--status-error)';
                badge.style.padding = '2px 6px';
                badge.style.borderRadius = '4px';
                badge.style.fontSize = '10px';
                badge.style.marginRight = '4px';

                const icon = isNpc ? '👤' : '💀';
                badge.innerHTML = `
                    <span>${icon} ${m.name} (${m.hp})</span>
                    <span class="remove-btn" style="cursor:pointer; font-weight:bold; opacity:0.6;">✕</span>
                 `;

                badge.querySelector('.remove-btn').onclick = (e) => {
                    e.stopPropagation();
                    RPG.Entities.remove(m.id);
                    // updateActiveDisplay will be called via subscriber if state changes, but for responsiveness:
                    updateActiveDisplay();
                    if (A.UI.Toast) A.UI.Toast.show(`Refreshed realm (Removed ${m.name})`);
                };

                activeContainer.appendChild(badge);
            });
        };

        // Render List
        const list = document.createElement('div');
        list.style.display = 'grid';
        list.style.gridTemplateColumns = 'repeat(auto-fill, minmax(320px, 1fr))';
        list.style.gap = '12px';

        state.rpg.bestiary.forEach(mon => {
            const isNpc = mon.creatureType === 'npc';
            const card = document.createElement('div');
            card.className = 'card interactive';
            card.style.background = 'var(--bg-surface)';
            card.style.border = '1px solid var(--border-subtle)';
            card.style.borderRadius = '6px';
            card.style.padding = '12px';
            card.style.cursor = 'pointer';
            card.style.transition = 'all 0.2s';
            card.style.position = 'relative';

            card.onmouseenter = () => card.style.borderColor = isNpc ? 'var(--accent-primary)' : 'var(--status-error)';
            card.onmouseleave = () => card.style.borderColor = 'var(--border-subtle)';
            card.onclick = () => spawnMonster(mon);

            const typeColor = isNpc ? 'var(--accent-primary)' : 'var(--status-error)';
            const typeBg = isNpc ? 'var(--accent-soft)' : 'rgba(255, 50, 50, 0.1)';
            const typeIcon = isNpc ? '👤' : '🐉';
            const typeLabel = isNpc ? 'NPC' : 'Monster';

            // Build stat line
            const stats = mon.stats || { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 };
            const statLine = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA']
                .map(s => `<span title="${s}">${s[0]}:${stats[s]}</span>`)
                .join(' ');

            card.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
                    <div style="font-weight:bold; color:${typeColor}; font-size:14px;">${mon.name}</div>
                    <div style="display:flex; align-items:center; gap:4px;">
                        <span style="font-size:9px; padding:2px 6px; background:${typeBg}; color:${typeColor}; border-radius:4px; text-transform:uppercase; font-weight:600;">
                            ${typeIcon} ${typeLabel}
                        </span>
                        ${!mon.isDefault ? `<button class="btn-edit-creature" style="background:none; border:none; cursor:pointer; font-size:11px; opacity:0.6; padding:2px;" title="Edit">✏️</button>` : ''}
                        ${mon.isCustom ? `<button class="btn-delete-creature" style="background:none; border:none; cursor:pointer; font-size:11px; opacity:0.5; padding:2px;" title="Delete">🗑️</button>` : ''}
                    </div>
                </div>
                <!-- Combat Stats -->
                <div style="display:flex; gap:12px; font-size:12px; margin-bottom:6px;">
                    <span style="background:var(--status-error-bg); color:var(--status-error); padding:2px 6px; border-radius:4px;">❤️ ${mon.hp}</span>
                    <span style="background:var(--bg-elevated); padding:2px 6px; border-radius:4px;">🛡️ ${mon.ac}</span>
                    ${mon.xp > 0 ? `<span style="background:var(--status-warning-bg); color:var(--status-warning); padding:2px 6px; border-radius:4px;">⭐ ${mon.xp} XP</span>` : ''}
                </div>
                <!-- Ability Scores -->
                <div style="font-size:10px; color:var(--text-muted); display:flex; gap:6px; margin-bottom:6px; font-family:monospace;">
                    ${statLine}
                </div>
                ${mon.description ? `<div style="font-size:11px; color:var(--text-secondary); font-style:italic; margin-bottom:4px; line-height:1.4;">${mon.description}</div>` : ''}
                <div style="font-size:10px; color:var(--text-muted); margin-top:4px;">
                    ${mon.inventory && mon.inventory.length ? '⚔️ ' + mon.inventory.map(i => i.name + (i.dmg ? ` (${i.dmg})` : '')).join(', ') : '🤜 Unarmed'}
                </div>
            `;

            // Wire up edit button
            if (!mon.isDefault) {
                const editBtn = card.querySelector('.btn-edit-creature');
                if (editBtn) {
                    editBtn.onclick = (e) => {
                        e.stopPropagation();
                        showCreatureEditor(mon);
                    };
                    editBtn.onmouseenter = () => editBtn.style.opacity = '1';
                    editBtn.onmouseleave = () => editBtn.style.opacity = '0.6';
                }
            }

            // Wire up delete button
            if (mon.isCustom) {
                const deleteBtn = card.querySelector('.btn-delete-creature');
                if (deleteBtn) {
                    deleteBtn.onclick = (e) => deleteFromBestiary(mon.id, e);
                    deleteBtn.onmouseenter = () => deleteBtn.style.opacity = '1';
                    deleteBtn.onmouseleave = () => deleteBtn.style.opacity = '0.5';
                }
            }

            list.appendChild(card);
        });

        content.appendChild(list);
        updateActiveDisplay();

        A.State.subscribe(() => {
            if (header.isConnected) updateActiveDisplay();
        });
    }

    A.registerPanel('rpg_monsters', {
        label: 'Monsters',
        subtitle: 'Bestiary & Spawn',
        category: 'RPG Experiment',
        icon: '🐉',
        render: render
    });

})(window.Anansi);
