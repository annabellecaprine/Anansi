/*
 * Anansi Panel: RPG Game Master
 * File: js/panels/rpg_gm.js
 * Category: RPG Experiment
 * Purpose: Central hub for campaign settings, rule systems, and GM controls. Setting-agnostic.
 */

(function (A) {
    'use strict';

    // ===========================================
    // CORE RULES - Fixed IDs required by combat engine
    // These IDs must not change as they are referenced by sys_rpg.js
    // ===========================================
    const CORE_RULE_IDS = {
        // Combat
        'atk_melee': { name: 'Melee Attack', category: 'combat', required: true },
        'atk_ranged': { name: 'Ranged Attack', category: 'combat', required: true },
        'atk_spell': { name: 'Spell Attack', category: 'combat', required: true },
        // Saves
        'save_fortitude': { name: 'Fortitude Save', category: 'save', required: true },
        'save_reflex': { name: 'Reflex Save', category: 'save', required: true },
        'save_will': { name: 'Will Save', category: 'save', required: true }
    };

    // ===========================================
    // SETTING PRESETS (Genre Templates)
    // ===========================================
    const SETTING_PRESETS = {
        fantasy: {
            id: 'fantasy',
            name: '⚔️ Fantasy',
            desc: 'Swords, sorcery, and mythical creatures',
            currency: 'Gold Pieces (gp)',
            healthName: 'HP',
            manaName: 'MP',
            defenseKey: 'AC',
            damageTypes: ['Physical', 'Fire', 'Cold', 'Lightning', 'Poison', 'Radiant', 'Necrotic', 'Psychic'],
            statBlock: 'dnd',
            exampleItems: ['Longsword', 'Healing Potion', 'Plate Armor', 'Spellbook']
        },
        scifi: {
            id: 'scifi',
            name: '🚀 Sci-Fi',
            desc: 'Space exploration and advanced technology',
            currency: 'Credits (cr)',
            healthName: 'HP',
            manaName: 'Energy',
            defenseKey: 'Armor',
            damageTypes: ['Kinetic', 'Energy', 'Plasma', 'Radiation', 'EMP', 'Cryo', 'Thermal'],
            statBlock: 'scifi',
            exampleItems: ['Laser Pistol', 'Med-Hypo', 'Combat Suit', 'Data Pad']
        },
        cyberpunk: {
            id: 'cyberpunk',
            name: '🌃 Cyberpunk',
            desc: 'Neon-lit streets and corporate warfare',
            currency: 'Eurodollars (€$)',
            healthName: 'HP',
            manaName: 'Edge',
            defenseKey: 'Defense',
            damageTypes: ['Bullet', 'Melee', 'Electric', 'EMP', 'Poison', 'Fire', 'Cyber'],
            statBlock: 'cyberpunk',
            exampleItems: ['Handgun', 'Stim Pack', 'Armored Jacket', 'Cyberdeck']
        },
        horror: {
            id: 'horror',
            name: '👻 Horror',
            desc: 'Survival against supernatural dread',
            currency: 'Dollars ($)',
            healthName: 'Health',
            manaName: 'Sanity',
            defenseKey: 'Defense',
            damageTypes: ['Physical', 'Psychic', 'Occult', 'Fire', 'Poison'],
            statBlock: 'horror',
            exampleItems: ['Flashlight', 'First Aid Kit', 'Revolver', 'Occult Tome']
        },
        modern: {
            id: 'modern',
            name: '🏙️ Modern',
            desc: 'Contemporary setting with realistic elements',
            currency: 'Dollars ($)',
            healthName: 'HP',
            manaName: 'Luck',
            defenseKey: 'Defense',
            damageTypes: ['Ballistic', 'Melee', 'Explosive', 'Fire', 'Electric'],
            statBlock: 'modern',
            exampleItems: ['Pistol', 'Medkit', 'Kevlar Vest', 'Smartphone']
        },
        custom: {
            id: 'custom',
            name: '✏️ Custom',
            desc: 'Define your own setting',
            currency: 'Currency',
            healthName: 'HP',
            manaName: 'MP',
            defenseKey: 'Defense',
            damageTypes: ['Physical', 'Energy', 'Special'],
            statBlock: 'custom',
            exampleItems: []
        }
    };

    // ===========================================
    // STAT BLOCK TEMPLATES
    // ===========================================
    const STAT_TEMPLATES = {
        dnd: {
            label: 'D&D / D20 System',
            stats: ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'],
            descriptions: {
                STR: 'Physical power, melee combat',
                DEX: 'Agility, reflexes, ranged combat',
                CON: 'Endurance, health, fortitude',
                INT: 'Knowledge, reasoning, magic',
                WIS: 'Perception, intuition, willpower',
                CHA: 'Personality, leadership, social'
            }
        },
        scifi: {
            label: 'Sci-Fi',
            stats: ['STR', 'AGI', 'END', 'INT', 'WIL', 'CHA'],
            descriptions: {
                STR: 'Physical strength, carrying capacity',
                AGI: 'Speed, coordination, reflexes',
                END: 'Stamina, resistance, durability',
                INT: 'Technical aptitude, problem solving',
                WIL: 'Mental fortitude, focus, psi resistance',
                CHA: 'Social influence, leadership'
            }
        },
        cyberpunk: {
            label: 'Cyberpunk',
            stats: ['BOD', 'REF', 'TECH', 'INT', 'COOL', 'EMP'],
            descriptions: {
                BOD: 'Body - physical strength and resilience',
                REF: 'Reflexes - speed and coordination',
                TECH: 'Technical ability - repair and crafting',
                INT: 'Intelligence - perception and knowledge',
                COOL: 'Cool - composure under pressure',
                EMP: 'Empathy - social awareness (affected by cyberware)'
            }
        },
        horror: {
            label: 'Horror Investigation',
            stats: ['STR', 'DEX', 'CON', 'INT', 'POW', 'APP'],
            descriptions: {
                STR: 'Physical strength',
                DEX: 'Agility and coordination',
                CON: 'Health and resistance',
                INT: 'Intelligence and education',
                POW: 'Willpower and sanity',
                APP: 'Appearance and charisma'
            }
        },
        modern: {
            label: 'Modern Action',
            stats: ['STR', 'AGI', 'VIT', 'INT', 'WIL', 'PRE'],
            descriptions: {
                STR: 'Strength - physical power',
                AGI: 'Agility - speed and reflexes',
                VIT: 'Vitality - health and endurance',
                INT: 'Intelligence - knowledge and reasoning',
                WIL: 'Willpower - mental fortitude',
                PRE: 'Presence - social influence'
            }
        },
        custom: {
            label: 'Custom',
            stats: ['STAT1', 'STAT2', 'STAT3', 'STAT4', 'STAT5', 'STAT6'],
            descriptions: {}
        }
    };

    // ===========================================
    // DEFAULT RULE PRESETS
    // Core rules use fixed IDs, additional rules can have any ID
    // ===========================================
    const DEFAULT_RULES = {
        d20: [
            // CORE COMBAT (Fixed IDs - Do not change)
            { id: 'atk_melee', name: 'Melee Attack', roll: '1d20', mod: 'STR', target: 'AC', tmod: '0', op: '>=', category: 'combat', isCore: true },
            { id: 'atk_ranged', name: 'Ranged Attack', roll: '1d20', mod: 'DEX', target: 'AC', tmod: '0', op: '>=', category: 'combat', isCore: true },
            { id: 'atk_spell', name: 'Spell Attack', roll: '1d20', mod: 'INT', target: 'AC', tmod: '0', op: '>=', category: 'combat', isCore: true },
            { id: 'act_defend', name: 'Defend', roll: '', mod: '', target: '', tmod: '', op: '', category: 'combat', isCore: true, special: 'defend' },
            { id: 'act_flee', name: 'Flee', roll: '1d20', mod: 'DEX', target: '10', tmod: '0', op: '>=', category: 'combat', isCore: true, special: 'flee' },
            { id: 'act_use_item', name: 'Use Item', roll: '', mod: '', target: '', tmod: '', op: '', category: 'combat', isCore: true, special: 'item' },
            { id: 'act_use_ability', name: 'Use Ability', roll: '', mod: '', target: '', tmod: '', op: '', category: 'combat', isCore: true, special: 'ability' },
            // CORE SAVES (Fixed IDs)
            { id: 'save_fortitude', name: 'Fortitude Save', roll: '1d20', mod: 'CON', target: '15', tmod: '0', op: '>=', category: 'save', isCore: true },
            { id: 'save_reflex', name: 'Reflex Save', roll: '1d20', mod: 'DEX', target: '15', tmod: '0', op: '>=', category: 'save', isCore: true },
            { id: 'save_will', name: 'Will Save', roll: '1d20', mod: 'WIS', target: '15', tmod: '0', op: '>=', category: 'save', isCore: true },
            // SKILL CHECKS (Editable IDs)
            { id: 'chk_str', name: 'Strength Check', roll: '1d20', mod: 'STR', target: '10', tmod: '0', op: '>=', category: 'skill' },
            { id: 'chk_dex', name: 'Dexterity Check', roll: '1d20', mod: 'DEX', target: '10', tmod: '0', op: '>=', category: 'skill' },
            { id: 'chk_con', name: 'Constitution Check', roll: '1d20', mod: 'CON', target: '10', tmod: '0', op: '>=', category: 'skill' },
            { id: 'chk_int', name: 'Intelligence Check', roll: '1d20', mod: 'INT', target: '10', tmod: '0', op: '>=', category: 'skill' },
            { id: 'chk_wis', name: 'Wisdom Check', roll: '1d20', mod: 'WIS', target: '10', tmod: '0', op: '>=', category: 'skill' },
            { id: 'chk_cha', name: 'Charisma Check', roll: '1d20', mod: 'CHA', target: '10', tmod: '0', op: '>=', category: 'skill' },
            { id: 'chk_stealth', name: 'Stealth Check', roll: '1d20', mod: 'DEX', target: '10', tmod: '0', op: '>=', category: 'skill' },
            { id: 'chk_perception', name: 'Perception Check', roll: '1d20', mod: 'WIS', target: '10', tmod: '0', op: '>=', category: 'skill' },
            { id: 'chk_persuasion', name: 'Persuasion Check', roll: '1d20', mod: 'CHA', target: '10', tmod: '0', op: '>=', category: 'skill' },
            { id: 'chk_intimidation', name: 'Intimidation Check', roll: '1d20', mod: 'CHA', target: '10', tmod: '0', op: '>=', category: 'skill' },
            { id: 'chk_investigation', name: 'Investigation Check', roll: '1d20', mod: 'INT', target: '10', tmod: '0', op: '>=', category: 'skill' },
            { id: 'chk_athletics', name: 'Athletics Check', roll: '1d20', mod: 'STR', target: '10', tmod: '0', op: '>=', category: 'skill' },
            { id: 'chk_acrobatics', name: 'Acrobatics Check', roll: '1d20', mod: 'DEX', target: '10', tmod: '0', op: '>=', category: 'skill' }
        ],
        d6: [
            { id: 'atk_melee', name: 'Melee Attack', roll: '2d6', mod: 'STR', target: 'Defense', tmod: '0', op: '>=', category: 'combat', isCore: true },
            { id: 'atk_ranged', name: 'Ranged Attack', roll: '2d6', mod: 'AGI', target: 'Defense', tmod: '0', op: '>=', category: 'combat', isCore: true },
            { id: 'atk_spell', name: 'Spell Attack', roll: '2d6', mod: 'INT', target: 'Defense', tmod: '0', op: '>=', category: 'combat', isCore: true },
            { id: 'save_fortitude', name: 'Fortitude Save', roll: '2d6', mod: 'END', target: '7', tmod: '0', op: '>=', category: 'save', isCore: true },
            { id: 'save_reflex', name: 'Reflex Save', roll: '2d6', mod: 'AGI', target: '7', tmod: '0', op: '>=', category: 'save', isCore: true },
            { id: 'save_will', name: 'Will Save', roll: '2d6', mod: 'WIL', target: '7', tmod: '0', op: '>=', category: 'save', isCore: true },
            { id: 'chk_skill', name: 'Skill Check', roll: '2d6', mod: 'INT', target: '7', tmod: '0', op: '>=', category: 'skill' }
        ],
        d100: [
            { id: 'atk_melee', name: 'Melee Attack', roll: '1d100', mod: '0', target: '50', tmod: '0', op: '<=', category: 'combat', isCore: true },
            { id: 'atk_ranged', name: 'Ranged Attack', roll: '1d100', mod: '0', target: '50', tmod: '0', op: '<=', category: 'combat', isCore: true },
            { id: 'atk_spell', name: 'Spell Attack', roll: '1d100', mod: '0', target: '50', tmod: '0', op: '<=', category: 'combat', isCore: true },
            { id: 'save_fortitude', name: 'Fortitude Save', roll: '1d100', mod: '0', target: '50', tmod: '0', op: '<=', category: 'save', isCore: true },
            { id: 'save_reflex', name: 'Reflex Save', roll: '1d100', mod: '0', target: '50', tmod: '0', op: '<=', category: 'save', isCore: true },
            { id: 'save_will', name: 'Sanity Check', roll: '1d100', mod: '0', target: 'SAN', tmod: '0', op: '<=', category: 'save', isCore: true },
            { id: 'chk_skill', name: 'Skill Check', roll: '1d100', mod: '0', target: '50', tmod: '0', op: '<=', category: 'skill' }
        ],
        narrative: [
            { id: 'atk_melee', name: 'Melee Attack', roll: '1d6', mod: '0', target: '4', tmod: '0', op: '>=', category: 'combat', isCore: true },
            { id: 'atk_ranged', name: 'Ranged Attack', roll: '1d6', mod: '0', target: '4', tmod: '0', op: '>=', category: 'combat', isCore: true },
            { id: 'atk_spell', name: 'Ability', roll: '1d6', mod: '0', target: '4', tmod: '0', op: '>=', category: 'combat', isCore: true },
            { id: 'save_fortitude', name: 'Endure', roll: '1d6', mod: '0', target: '4', tmod: '0', op: '>=', category: 'save', isCore: true },
            { id: 'save_reflex', name: 'Avoid', roll: '1d6', mod: '0', target: '4', tmod: '0', op: '>=', category: 'save', isCore: true },
            { id: 'save_will', name: 'Resist', roll: '1d6', mod: '0', target: '4', tmod: '0', op: '>=', category: 'save', isCore: true },
            { id: 'action', name: 'Action', roll: '1d6', mod: '0', target: '4', tmod: '0', op: '>=', category: 'general' }
        ]
    };

    // ===========================================
    // HELPER: Ensure core rules exist
    // ===========================================
    function ensureCoreRules(rules, mech) {
        const defaults = DEFAULT_RULES[mech] || DEFAULT_RULES.d20;
        const coreDefaults = defaults.filter(r => r.isCore);
        const added = [];

        coreDefaults.forEach(coreDef => {
            const existing = rules.find(r => r.id === coreDef.id);
            if (!existing) {
                // Add missing core rule
                rules.unshift({ ...coreDef });
                added.push(coreDef.name);
            } else {
                // Ensure isCore flag is set
                existing.isCore = true;
            }
        });

        return added;
    }

    // ===========================================
    // RENDER FUNCTION
    // ===========================================
    function render(container) {
        container.style.height = '100%';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.overflow = 'hidden';
        container.style.background = 'var(--bg-base)';

        // Initialize state
        const state = A.State.get();
        if (!state.rpg) state.rpg = { enabled: true };
        if (!state.rpg.campaign) {
            state.rpg.campaign = {
                name: 'New Campaign',
                setting: 'fantasy',
                mechanics: 'd20',
                currency: 'Gold Pieces (gp)',
                healthName: 'HP',
                manaName: 'MP',
                notes: ''
            };
        }
        if (!state.rpg.rulesets) state.rpg.rulesets = {};
        if (!state.rpg.stats) state.rpg.stats = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];

        const campaign = state.rpg.campaign;

        // Ensure core rules exist for current mechanics
        const mech = campaign.mechanics || 'd20';
        if (!state.rpg.rulesets[mech]) {
            state.rpg.rulesets[mech] = JSON.parse(JSON.stringify(DEFAULT_RULES[mech] || DEFAULT_RULES.d20));
        }
        const rulesAdded = ensureCoreRules(state.rpg.rulesets[mech], mech);

        // If core rules were missing, notify state to persist
        if (rulesAdded && rulesAdded.length > 0) {
            A.State.notify();
            if (A.UI.Toast) A.UI.Toast.show(`Added ${rulesAdded.length} missing core rule(s)`, 'info');
        }

        // Header
        const header = document.createElement('div');
        header.style.cssText = 'padding:16px 20px; background:var(--bg-elevated); border-bottom:1px solid var(--border-subtle);';
        header.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <h2 style="margin:0; font-size:18px; display:flex; align-items:center; gap:8px;">
                        🎲 Game Master
                    </h2>
                    <p style="margin:4px 0 0; font-size:12px; color:var(--text-muted);">Campaign settings, rules, and GM controls</p>
                </div>
                <div style="display:flex; gap:8px;">
                    <button id="btn-reset-rules" class="btn btn-ghost btn-sm" title="Reset rules to default">🔄 Reset Rules</button>
                    <button id="btn-export-player" class="btn btn-ghost btn-sm" title="Export locked player version" style="color:var(--accent-primary);">🔒 Export Player Mode</button>
                </div>
            </div>
        `;
        container.appendChild(header);

        // Bind Export Player Mode
        header.querySelector('#btn-export-player').onclick = () => {
            if (confirm('Create "Player Mode" export?\n\nThis will download a project file with GM panels hidden.\nUse this for distributing campaigns to players.')) {
                try {
                    const state = A.State.get();
                    const playerState = JSON.parse(JSON.stringify(state)); // Deep clone

                    if (!playerState.meta) playerState.meta = {};
                    playerState.meta.mode = 'player';
                    // Append suffix to name so specific project ID checks treat it as same or different? 
                    // Best to keep ID same for compatibility, but change name.
                    playerState.meta.name = (playerState.meta.name || 'Campaign') + ' (Player Mode)';

                    const blob = new Blob([JSON.stringify(playerState, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${(playerState.meta.name).replace(/[^a-z0-9]/gi, '_').toLowerCase()}.anansi.json`;
                    a.click();
                    URL.revokeObjectURL(url);

                    if (A.UI && A.UI.Toast) A.UI.Toast.show('Player Mode export successful', 'success');
                } catch (err) {
                    console.error('Export failed:', err);
                    alert('Export failed: ' + err.message);
                }
            };
        };

        // Content
        const content = document.createElement('div');
        content.style.cssText = 'flex:1; overflow-y:auto; padding:20px;';
        container.appendChild(content);

        // === SECTION: Campaign Settings ===
        const campaignSection = document.createElement('div');
        campaignSection.className = 'card';
        campaignSection.style.cssText = 'padding:20px; margin-bottom:20px;';
        campaignSection.innerHTML = `
            <h3 style="margin:0 0 16px; font-size:14px; display:flex; align-items:center; gap:8px;">
                📋 Campaign Settings
            </h3>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
                <div>
                    <label class="label">Campaign Name</label>
                    <input type="text" id="campaign-name" class="input" style="width:100%;" value="${campaign.name || ''}">
                </div>
                <div>
                    <label class="label">Setting / Genre</label>
                    <select id="campaign-setting" class="input" style="width:100%;"></select>
                </div>
                <div>
                    <label class="label">Dice System</label>
                    <select id="campaign-mechanics" class="input" style="width:100%;">
                        <option value="d20" ${campaign.mechanics === 'd20' ? 'selected' : ''}>D20 System</option>
                        <option value="d6" ${campaign.mechanics === 'd6' ? 'selected' : ''}>D6 System</option>
                        <option value="d100" ${campaign.mechanics === 'd100' ? 'selected' : ''}>D100 / Percentile</option>
                        <option value="narrative" ${campaign.mechanics === 'narrative' ? 'selected' : ''}>Narrative / Light</option>
                    </select>
                </div>
                <div>
                    <label class="label">Currency Name</label>
                    <input type="text" id="campaign-currency" class="input" style="width:100%;" value="${campaign.currency || 'Gold'}">
                </div>
                <div>
                    <label class="label">Health Label</label>
                    <input type="text" id="campaign-health" class="input" style="width:100%;" value="${campaign.healthName || 'HP'}">
                </div>
                <div>
                    <label class="label">Mana/Resource Label</label>
                    <input type="text" id="campaign-mana" class="input" style="width:100%;" value="${campaign.manaName || 'MP'}">
                </div>
                <div>
                    <label class="label">Starting Location</label>
                    <select id="campaign-start-location" class="input" style="width:100%;"></select>
                </div>
                <div>
                    <label class="label">Party Tools</label>
                    <button id="btn-recall-party" class="btn btn-sm btn-ghost" title="Move all party members to starting location" style="width:100%;">🏠 Recall Party</button>
                </div>
            </div>
            <div style="margin-top:16px;">
                <label class="label">Campaign Notes (GM only)</label>
                <textarea id="campaign-notes" class="input" style="width:100%; height:80px;" placeholder="Session notes, plot hooks, reminders...">${campaign.notes || ''}</textarea>
            </div>
        `;
        content.appendChild(campaignSection);

        // Populate setting dropdown
        const settingSelect = campaignSection.querySelector('#campaign-setting');
        Object.values(SETTING_PRESETS).forEach(preset => {
            const opt = document.createElement('option');
            opt.value = preset.id;
            opt.textContent = `${preset.name} - ${preset.desc}`;
            if (campaign.setting === preset.id) opt.selected = true;
            settingSelect.appendChild(opt);
        });

        // Wire campaign inputs
        const wireCampaign = () => {
            campaignSection.querySelector('#campaign-name').onchange = (e) => {
                campaign.name = e.target.value;
                A.State.notify();
            };
            settingSelect.onchange = (e) => {
                const preset = SETTING_PRESETS[e.target.value];
                campaign.setting = preset.id;
                campaign.currency = preset.currency;
                campaign.healthName = preset.healthName;
                campaign.manaName = preset.manaName;
                campaignSection.querySelector('#campaign-currency').value = preset.currency;
                campaignSection.querySelector('#campaign-health').value = preset.healthName;
                campaignSection.querySelector('#campaign-mana').value = preset.manaName;
                A.State.notify();
            };
            campaignSection.querySelector('#campaign-mechanics').onchange = (e) => {
                campaign.mechanics = e.target.value;
                // Auto-load default rules for this system if empty
                if (!state.rpg.rulesets[e.target.value]) {
                    state.rpg.rulesets[e.target.value] = JSON.parse(JSON.stringify(DEFAULT_RULES[e.target.value] || DEFAULT_RULES.d20));
                }
                ensureCoreRules(state.rpg.rulesets[e.target.value], e.target.value);
                A.State.notify();
                renderRules();
            };
            campaignSection.querySelector('#campaign-currency').onchange = (e) => {
                campaign.currency = e.target.value;
                A.State.notify();
            };
            campaignSection.querySelector('#campaign-health').onchange = (e) => {
                campaign.healthName = e.target.value;
                A.State.notify();
            };
            campaignSection.querySelector('#campaign-mana').onchange = (e) => {
                campaign.manaName = e.target.value;
                A.State.notify();
            };
            campaignSection.querySelector('#campaign-notes').onchange = (e) => {
                campaign.notes = e.target.value;
                A.State.notify();
            };

            // Starting Location dropdown
            const startLocSelect = campaignSection.querySelector('#campaign-start-location');

            // Get all locations from multi-map structure
            let locations = [];
            if (state.weaves?.maps) {
                state.weaves.maps.forEach(map => {
                    (map.locations || []).forEach(loc => {
                        locations.push({ ...loc, _mapName: map.name });
                    });
                });
            } else if (state.weaves?.locations) {
                // Fallback for old structure
                locations = state.weaves.locations;
            }

            startLocSelect.innerHTML = '<option value="">(No starting location)</option>';
            locations.forEach(loc => {
                const opt = document.createElement('option');
                opt.value = loc.id;
                opt.textContent = loc._mapName ? `${loc.name} (${loc._mapName})` : loc.name;
                if (state.rpg.startingLocation === loc.id) opt.selected = true;
                startLocSelect.appendChild(opt);
            });
            startLocSelect.onchange = (e) => {
                const locId = e.target.value || null;
                state.rpg.startingLocation = locId;

                // Also set current location if not already set
                if (!state.rpg.currentLocation && locId) {
                    state.rpg.currentLocation = locId;
                }

                // Mark starting location as visited so fog of war shows it
                if (locId && A.RPGEngine?.revealLocation) {
                    A.RPGEngine.revealLocation(locId);
                    // Also mark neighbors
                    const loc = locations.find(l => l.id === locId);
                    if (loc) {
                        A.RPGEngine.updateLocationVisibility(state, loc);
                    }
                }

                A.State.notify();
                if (A.UI?.Toast) A.UI.Toast.show('Starting location set to: ' + (locations.find(l => l.id === locId)?.name || 'None'), 'success');
            };

            // Recall Party button
            campaignSection.querySelector('#btn-recall-party').onclick = () => {
                const startLoc = state.rpg.startingLocation;
                if (!startLoc) {
                    if (A.UI?.Toast) A.UI.Toast.show('No starting location set!', 'warning');
                    return;
                }
                state.rpg.currentLocation = startLoc;
                const locName = locations.find(l => l.id === startLoc)?.name || 'Starting Location';
                if (A.UI?.Toast) A.UI.Toast.show(`🏠 Party recalled to ${locName}`, 'success');
                A.State.notify();
            };
        };
        wireCampaign();

        // === SECTION: Active Stats ===
        const statsSection = document.createElement('div');
        statsSection.className = 'card';
        statsSection.style.cssText = 'padding:20px; margin-bottom:20px;';
        statsSection.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
                <h3 style="margin:0; font-size:14px;">📊 Stat System</h3>
                <select id="stat-template" class="input" style="width:200px;"></select>
            </div>
            <div id="stat-list" style="display:flex; flex-wrap:wrap; gap:8px;"></div>
            <div style="margin-top:12px; font-size:11px; color:var(--text-muted);">
                These are the primary attributes used for characters in this campaign.
            </div>
        `;
        content.appendChild(statsSection);

        const statTemplateSelect = statsSection.querySelector('#stat-template');
        Object.entries(STAT_TEMPLATES).forEach(([key, tpl]) => {
            const opt = document.createElement('option');
            opt.value = key;
            opt.textContent = tpl.label;
            statTemplateSelect.appendChild(opt);
        });

        const renderStats = () => {
            const statList = statsSection.querySelector('#stat-list');
            statList.innerHTML = '';
            (state.rpg.stats || []).forEach(stat => {
                const badge = document.createElement('span');
                badge.style.cssText = 'padding:6px 12px; background:var(--bg-elevated); border-radius:4px; font-weight:bold; font-size:12px;';
                badge.textContent = stat;
                statList.appendChild(badge);
            });
        };

        statTemplateSelect.onchange = (e) => {
            const tpl = STAT_TEMPLATES[e.target.value];
            if (tpl) {
                state.rpg.stats = [...tpl.stats];
                A.State.notify();
                renderStats();
            }
        };
        renderStats();

        // === SECTION: Quick Links & Settings ===
        const linksSection = document.createElement('div');
        linksSection.className = 'card';
        linksSection.style.cssText = 'padding:20px; margin-bottom:20px;';
        linksSection.innerHTML = `
            <h3 style="margin:0 0 16px; font-size:14px;">🔗 GM Tools</h3>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                <div>
                    <button id="btn-goto-classes" class="btn btn-ghost" style="width:100%; text-align:left; display:flex; align-items:center; gap:8px; padding:12px;">
                        📜 <span>Character Classes</span>
                    </button>
                </div>
                <div>
                    <button id="btn-goto-armory" class="btn btn-ghost" style="width:100%; text-align:left; display:flex; align-items:center; gap:8px; padding:12px;">
                        ⚔️ <span>Armory / Items</span>
                    </button>
                </div>
                <div>
                    <button id="btn-goto-feats" class="btn btn-ghost" style="width:100%; text-align:left; display:flex; align-items:center; gap:8px; padding:12px;">
                        ✨ <span>Feats & Abilities</span>
                    </button>
                </div>
                <div>
                    <button id="btn-goto-bestiary" class="btn btn-ghost" style="width:100%; text-align:left; display:flex; align-items:center; gap:8px; padding:12px;">
                        👹 <span>Bestiary</span>
                    </button>
                </div>
            </div>
            <div style="margin-top:16px; padding-top:16px; border-top:1px solid var(--border-subtle);">
                <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
                    <input type="checkbox" id="default-narration" ${state.rpg?.defaultNarration !== false ? 'checked' : ''}>
                    <span style="font-size:13px;">🤖 Enable AI Narration by Default</span>
                </label>
                <p style="margin:8px 0 0 24px; font-size:11px; color:var(--text-muted);">When enabled, new sessions will start with LLM-powered narrative descriptions.</p>
            </div>
        `;
        content.appendChild(linksSection);

        // Wire quick links (use A.UI.switchPanel for proper navigation)
        linksSection.querySelector('#btn-goto-classes').onclick = () => A.UI.switchPanel('rpg_classes');
        linksSection.querySelector('#btn-goto-armory').onclick = () => A.UI.switchPanel('rpg_armory');
        linksSection.querySelector('#btn-goto-feats').onclick = () => A.UI.switchPanel('rpg_feats');
        linksSection.querySelector('#btn-goto-bestiary').onclick = () => A.UI.switchPanel('rpg_monsters');
        linksSection.querySelector('#default-narration').onchange = (e) => {
            if (!state.rpg) state.rpg = {};
            state.rpg.defaultNarration = e.target.checked;
            A.State.notify();
            if (A.UI?.Toast) A.UI.Toast.show(`Default narration ${e.target.checked ? 'enabled' : 'disabled'}`, 'info');
        };

        // === SECTION: Rules Engine ===
        const rulesSection = document.createElement('div');
        rulesSection.className = 'card';
        rulesSection.style.cssText = 'padding:20px;';
        rulesSection.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
                <h3 style="margin:0; font-size:14px;">⚙️ Rules Engine</h3>
                <button id="btn-add-rule" class="btn btn-sm btn-primary">+ Add Rule</button>
            </div>
            <div style="margin-bottom:8px; padding:8px; background:var(--bg-surface); border-radius:4px; font-size:10px; color:var(--text-muted);">
                🔒 <strong>Core Rules</strong> (locked ID) are required by the combat engine. You can edit their parameters but not delete them.
            </div>
            <div style="margin-bottom:12px; display:flex; gap:8px; flex-wrap:wrap;">
                <button class="rule-filter btn btn-xs" data-filter="all">All</button>
                <button class="rule-filter btn btn-xs btn-ghost" data-filter="combat">⚔️ Combat</button>
                <button class="rule-filter btn btn-xs btn-ghost" data-filter="skill">🎯 Skills</button>
                <button class="rule-filter btn btn-xs btn-ghost" data-filter="save">🛡️ Saves</button>
            </div>
            <div id="rules-list" style="display:flex; flex-direction:column; gap:8px; max-height:400px; overflow-y:auto;"></div>
        `;
        content.appendChild(rulesSection);

        let ruleFilter = 'all';

        const renderRules = () => {
            const rulesList = rulesSection.querySelector('#rules-list');
            const currentMech = campaign.mechanics || 'd20';

            // Ensure rules exist and core rules are present
            if (!state.rpg.rulesets[currentMech]) {
                state.rpg.rulesets[currentMech] = JSON.parse(JSON.stringify(DEFAULT_RULES[currentMech] || DEFAULT_RULES.d20));
            }
            ensureCoreRules(state.rpg.rulesets[currentMech], currentMech);

            const rules = state.rpg.rulesets[currentMech] || [];
            const filtered = ruleFilter === 'all' ? rules : rules.filter(r => r.category === ruleFilter);

            rulesList.innerHTML = '';

            if (filtered.length === 0) {
                rulesList.innerHTML = '<div style="color:var(--text-muted); font-style:italic; text-align:center; padding:20px;">No rules defined. Add one or reset to defaults.</div>';
                return;
            }

            filtered.forEach((rule, idx) => {
                const isCore = rule.isCore;
                const row = document.createElement('div');
                row.style.cssText = `display:grid; grid-template-columns:${isCore ? '24px ' : ''}180px 80px 60px 60px 40px 60px 80px ${isCore ? '' : '40px'}; gap:8px; align-items:center; padding:8px; background:${isCore ? 'var(--bg-elevated)' : 'var(--bg-surface)'}; border-radius:4px; font-size:11px; border-left:3px solid ${isCore ? 'var(--accent-primary)' : 'transparent'};`;

                const catIcon = rule.category === 'combat' ? '⚔️' : rule.category === 'save' ? '🛡️' : '🎯';

                row.innerHTML = `
                    ${isCore ? '<span title="Core rule (ID locked)" style="font-size:12px;">🔒</span>' : ''}
                    <input type="text" class="input rule-name" data-idx="${idx}" value="${rule.name}" style="font-size:11px;">
                    <input type="text" class="input rule-roll" data-idx="${idx}" value="${rule.roll}" style="font-size:11px; text-align:center;">
                    <input type="text" class="input rule-mod" data-idx="${idx}" value="${rule.mod}" style="font-size:11px; text-align:center;" title="Modifier stat">
                    <input type="text" class="input rule-target" data-idx="${idx}" value="${rule.target}" style="font-size:11px; text-align:center;" title="Target value or stat">
                    <select class="input rule-op" data-idx="${idx}" style="font-size:10px; padding:2px;">
                        <option value=">=" ${rule.op === '>=' ? 'selected' : ''}>≥</option>
                        <option value=">" ${rule.op === '>' ? 'selected' : ''}>&gt;</option>
                        <option value="<=" ${rule.op === '<=' ? 'selected' : ''}>≤</option>
                        <option value="<" ${rule.op === '<' ? 'selected' : ''}>&lt;</option>
                        <option value="==" ${rule.op === '==' ? 'selected' : ''}>=</option>
                    </select>
                    <select class="input rule-cat" data-idx="${idx}" style="font-size:10px;">
                        <option value="combat" ${rule.category === 'combat' ? 'selected' : ''}>Combat</option>
                        <option value="skill" ${rule.category === 'skill' ? 'selected' : ''}>Skill</option>
                        <option value="save" ${rule.category === 'save' ? 'selected' : ''}>Save</option>
                        <option value="general" ${rule.category === 'general' ? 'selected' : ''}>General</option>
                    </select>
                    <span style="color:var(--text-muted);">${catIcon}</span>
                    ${isCore ? '' : `<button class="btn btn-xs btn-ghost rule-delete" data-idx="${idx}" style="color:var(--status-error);">✕</button>`}
                `;

                rulesList.appendChild(row);
            });

            // Wire rule inputs
            rulesList.querySelectorAll('.rule-name').forEach(el => {
                el.onchange = (e) => {
                    rules[parseInt(e.target.dataset.idx)].name = e.target.value;
                    A.State.notify();
                };
            });
            rulesList.querySelectorAll('.rule-roll').forEach(el => {
                el.onchange = (e) => {
                    rules[parseInt(e.target.dataset.idx)].roll = e.target.value;
                    A.State.notify();
                };
            });
            rulesList.querySelectorAll('.rule-mod').forEach(el => {
                el.onchange = (e) => {
                    rules[parseInt(e.target.dataset.idx)].mod = e.target.value;
                    A.State.notify();
                };
            });
            rulesList.querySelectorAll('.rule-target').forEach(el => {
                el.onchange = (e) => {
                    rules[parseInt(e.target.dataset.idx)].target = e.target.value;
                    A.State.notify();
                };
            });
            rulesList.querySelectorAll('.rule-op').forEach(el => {
                el.onchange = (e) => {
                    rules[parseInt(e.target.dataset.idx)].op = e.target.value;
                    A.State.notify();
                };
            });
            rulesList.querySelectorAll('.rule-cat').forEach(el => {
                el.onchange = (e) => {
                    rules[parseInt(e.target.dataset.idx)].category = e.target.value;
                    A.State.notify();
                    renderRules();
                };
            });
            rulesList.querySelectorAll('.rule-delete').forEach(el => {
                el.onclick = (e) => {
                    const fullIdx = rules.findIndex(r => r === filtered[parseInt(e.target.dataset.idx)]);
                    const rule = rules[fullIdx];
                    if (rule && rule.isCore) {
                        if (A.UI.Toast) A.UI.Toast.show('Cannot delete core rules.', 'warning');
                        return;
                    }
                    if (fullIdx > -1) {
                        rules.splice(fullIdx, 1);
                        A.State.notify();
                        renderRules();
                    }
                };
            });
        };

        // Filter buttons
        rulesSection.querySelectorAll('.rule-filter').forEach(btn => {
            btn.onclick = () => {
                ruleFilter = btn.dataset.filter;
                rulesSection.querySelectorAll('.rule-filter').forEach(b => {
                    b.classList.toggle('btn-ghost', b !== btn);
                    b.classList.toggle('btn-primary', b === btn);
                });
                renderRules();
            };
        });

        // Add rule
        rulesSection.querySelector('#btn-add-rule').onclick = () => {
            const currentMech = campaign.mechanics || 'd20';
            if (!state.rpg.rulesets[currentMech]) state.rpg.rulesets[currentMech] = [];
            state.rpg.rulesets[currentMech].push({
                id: 'rule_' + Math.random().toString(36).substr(2, 6),
                name: 'New Rule',
                roll: '1d20',
                mod: 'STR',
                target: '10',
                tmod: '0',
                op: '>=',
                category: 'skill',
                isCore: false
            });
            A.State.notify();
            renderRules();
        };

        // Reset rules
        header.querySelector('#btn-reset-rules').onclick = () => {
            if (confirm('Reset all rules to default for the current dice system? Core rules will be restored.')) {
                const currentMech = campaign.mechanics || 'd20';
                state.rpg.rulesets[currentMech] = JSON.parse(JSON.stringify(DEFAULT_RULES[currentMech] || DEFAULT_RULES.d20));
                A.State.notify();
                renderRules();
                if (A.UI.Toast) A.UI.Toast.show('Rules reset to defaults.', 'success');
            }
        };

        renderRules();

        // === SECTION: Objects ===
        const objectsSection = document.createElement('div');
        objectsSection.className = 'card';
        objectsSection.style.cssText = 'padding:20px; margin-bottom:20px;';

        // Initialize objects array
        if (!state.rpg.objects) state.rpg.objects = [];

        // Get locations for dropdown
        let allLocations = [];
        if (state.weaves?.maps) {
            state.weaves.maps.forEach(map => {
                (map.locations || []).forEach(loc => {
                    allLocations.push({ ...loc, _mapName: map.name });
                });
            });
        } else if (state.weaves?.locations) {
            allLocations = state.weaves.locations;
        }

        let objectFilter = 'all';

        const renderObjects = () => {
            const objects = state.rpg.objects || [];
            const filtered = objectFilter === 'all'
                ? objects
                : objects.filter(o => o.type === objectFilter);

            objectsSection.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
                    <h3 style="margin:0; font-size:14px; display:flex; align-items:center; gap:8px;">
                        📦 Objects
                        <span style="font-size:11px; color:var(--text-muted); font-weight:normal;">(${objects.length} total)</span>
                    </h3>
                    <div style="display:flex; gap:8px;">
                        <select id="new-obj-type" class="input" style="font-size:12px; padding:2px 8px; height:26px;">
                            <option value="quest">🎯 Quest</option>
                            <option value="container">📦 Container</option>
                        </select>
                        <input type="text" id="new-obj-name" class="input" placeholder="New Object Name" style="font-size:12px; padding:2px 8px; width:150px; height:26px;">
                        <button id="btn-add-object" class="btn btn-primary btn-sm">+ Add Object</button>
                    </div>
                </div>
                
                <div style="display:flex; gap:8px; margin-bottom:16px;">
                    <button class="btn btn-sm obj-filter ${objectFilter === 'all' ? 'btn-primary' : 'btn-ghost'}" data-filter="all">All</button>
                    <button class="btn btn-sm obj-filter ${objectFilter === 'quest' ? 'btn-primary' : 'btn-ghost'}" data-filter="quest">🎯 Quest</button>
                    <button class="btn btn-sm obj-filter ${objectFilter === 'container' ? 'btn-primary' : 'btn-ghost'}" data-filter="container">📦 Container</button>
                </div>
                
                <div id="objects-list" style="display:grid; gap:12px; max-height:400px; overflow-y:auto;">
                    ${filtered.length === 0 ? `
                        <div style="text-align:center; padding:40px; color:var(--text-muted);">
                            <div style="font-size:32px; margin-bottom:8px;">📦</div>
                            <div>No objects defined</div>
                            <div style="font-size:11px; margin-top:4px;">Add quest items or containers</div>
                        </div>
                    ` : filtered.map((obj, idx) => `
                        <div class="card" style="padding:12px; background:var(--bg-base); display:flex; gap:12px; align-items:start;">
                            <div style="font-size:24px;">${obj.type === 'quest' ? '🎯' : '📦'}</div>
                            <div style="flex:1; min-width:0;">
                                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                                    <input type="text" class="input obj-name" data-idx="${idx}" value="${obj.name || ''}" 
                                           style="font-weight:600; font-size:13px; padding:4px 8px; flex:1; max-width:200px;">
                                    <div style="display:flex; gap:4px;">
                                        ${obj.type === 'quest' ? `
                                            <span class="badge" style="font-size:9px; padding:2px 6px; background:${obj.collected ? 'var(--status-success)' : obj.discovered ? 'var(--status-warning)' : 'var(--bg-inset)'}; border-radius:8px;">
                                                ${obj.collected ? '✓ Collected' : obj.discovered ? '👁 Discovered' : 'Hidden'}
                                            </span>
                                        ` : `
                                            ${obj.locked ? `<span class="badge" style="font-size:9px; padding:2px 6px; background:var(--status-error); border-radius:8px;">🔒 DC ${obj.lockDC || 15}</span>` : ''}
                                            ${obj.trapped ? `<span class="badge" style="font-size:9px; padding:2px 6px; background:var(--status-warning); border-radius:8px;">⚠️ Trap DC ${obj.trapDC || 12}</span>` : ''}
                                            <span class="badge" style="font-size:9px; padding:2px 6px; background:var(--bg-inset); border-radius:8px;">
                                                ${(obj.contents || []).length} items
                                            </span>
                                        `}
                                        <button class="btn btn-ghost btn-sm obj-edit" data-idx="${idx}" style="padding:2px 6px;">✏️</button>
                                        <button class="btn btn-ghost btn-sm obj-delete" data-idx="${idx}" style="padding:2px 6px; color:var(--status-error);">×</button>
                                    </div>
                                </div>
                                <div style="font-size:11px; color:var(--text-muted); margin-bottom:4px;">${obj.description || 'No description'}</div>
                                <div style="display:flex; gap:8px; align-items:center;">
                                    <label style="font-size:10px; color:var(--text-muted);">Location:</label>
                                    <select class="input obj-location" data-idx="${idx}" style="font-size:11px; padding:2px 6px; height:24px;">
                                        <option value="">(Not placed)</option>
                                        ${allLocations.map(loc => `
                                            <option value="${loc.id}" ${obj.locationId === loc.id ? 'selected' : ''}>
                                                ${loc._mapName ? `${loc.name} (${loc._mapName})` : loc.name}
                                            </option>
                                        `).join('')}
                                    </select>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;

            // Wire filter buttons
            objectsSection.querySelectorAll('.obj-filter').forEach(btn => {
                btn.onclick = () => {
                    objectFilter = btn.dataset.filter;
                    renderObjects();
                };
            });

            // Wire add button
            objectsSection.querySelector('#btn-add-object').onclick = () => {
                const typeSelect = objectsSection.querySelector('#new-obj-type');
                const nameInput = objectsSection.querySelector('#new-obj-name');

                const type = typeSelect.value;
                const name = nameInput.value.trim();

                if (!name) {
                    if (A.UI?.Toast) A.UI.Toast.show('Enter an object name', 'warning');
                    return;
                }

                const newObj = {
                    id: 'obj_' + Math.random().toString(36).substr(2, 8),
                    name: name,
                    type: type,
                    description: '',
                    locationId: null,
                    // Quest properties
                    questTag: type === 'quest' ? name.toLowerCase().replace(/\s+/g, '_') : null,
                    discovered: false,
                    collected: false,
                    // Container properties
                    contents: [],
                    locked: false,
                    lockDC: 15,
                    trapped: false,
                    trapDC: 12
                };

                state.rpg.objects.push(newObj);
                nameInput.value = ''; // Clear input
                A.State.notify();
                renderObjects();
                if (A.UI?.Toast) A.UI.Toast.show(`Created ${type}: ${name}`, 'success');
            };

            // Wire name inputs
            objectsSection.querySelectorAll('.obj-name').forEach(input => {
                input.onchange = (e) => {
                    const idx = parseInt(e.target.dataset.idx);
                    const filtered = objectFilter === 'all'
                        ? state.rpg.objects
                        : state.rpg.objects.filter(o => o.type === objectFilter);
                    if (filtered[idx]) {
                        filtered[idx].name = e.target.value;
                        A.State.notify();
                    }
                };
            });

            // Wire location selects
            objectsSection.querySelectorAll('.obj-location').forEach(select => {
                select.onchange = (e) => {
                    const idx = parseInt(e.target.dataset.idx);
                    const filtered = objectFilter === 'all'
                        ? state.rpg.objects
                        : state.rpg.objects.filter(o => o.type === objectFilter);
                    if (filtered[idx]) {
                        filtered[idx].locationId = e.target.value || null;
                        A.State.notify();
                    }
                };
            });

            // Wire edit buttons
            objectsSection.querySelectorAll('.obj-edit').forEach(btn => {
                btn.onclick = (e) => {
                    const idx = parseInt(e.target.dataset.idx);
                    const filtered = objectFilter === 'all'
                        ? state.rpg.objects
                        : state.rpg.objects.filter(o => o.type === objectFilter);
                    const obj = filtered[idx];
                    if (!obj) return;

                    showObjectEditor(obj, () => {
                        A.State.notify();
                        renderObjects();
                    });
                };
            });

            // Wire delete buttons
            objectsSection.querySelectorAll('.obj-delete').forEach(btn => {
                btn.onclick = (e) => {
                    const idx = parseInt(e.target.dataset.idx);
                    const filtered = objectFilter === 'all'
                        ? state.rpg.objects
                        : state.rpg.objects.filter(o => o.type === objectFilter);
                    const obj = filtered[idx];
                    if (!obj) return;

                    if (confirm(`Delete "${obj.name}"?`)) {
                        const realIdx = state.rpg.objects.findIndex(o => o.id === obj.id);
                        if (realIdx > -1) {
                            state.rpg.objects.splice(realIdx, 1);
                            A.State.notify();
                            renderObjects();
                            if (A.UI?.Toast) A.UI.Toast.show('Object deleted', 'info');
                        }
                    }
                };
            });
        };

        // Object Editor Modal
        const showObjectEditor = (obj, onSave) => {
            const state = A.State.get();
            const armoryItems = state.rpg?.armory?.items || [];

            const modal = document.createElement('div');
            modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:10000;';

            const isQuest = obj.type === 'quest';

            // Helper to preserve state before re-rendering
            const saveState = () => {
                const nameIn = modal.querySelector('#obj-ed-name');
                if (nameIn) obj.name = nameIn.value;
                const descIn = modal.querySelector('#obj-ed-desc');
                if (descIn) obj.description = descIn.value;

                if (isQuest) {
                    const tagIn = modal.querySelector('#obj-ed-tag');
                    if (tagIn) obj.questTag = tagIn.value;
                    const discCk = modal.querySelector('#obj-ed-discovered');
                    if (discCk) obj.discovered = discCk.checked;
                    const collCk = modal.querySelector('#obj-ed-collected');
                    if (collCk) obj.collected = collCk.checked;
                } else {
                    const lockCk = modal.querySelector('#obj-ed-locked');
                    if (lockCk) obj.locked = lockCk.checked;
                    const lockDc = modal.querySelector('#obj-ed-lockdc');
                    if (lockDc) obj.lockDC = parseInt(lockDc.value) || 15;
                    const trapCk = modal.querySelector('#obj-ed-trapped');
                    if (trapCk) obj.trapped = trapCk.checked;
                    const trapDc = modal.querySelector('#obj-ed-trapdc');
                    if (trapDc) obj.trapDC = parseInt(trapDc.value) || 12;
                }
            };

            modal.innerHTML = `
                <div style="background:var(--bg-elevated); width:500px; max-height:80vh; border-radius:12px; display:flex; flex-direction:column; overflow:hidden; box-shadow:0 20px 50px rgba(0,0,0,0.5); border:1px solid var(--border-default);">
                    <div style="padding:16px; border-bottom:1px solid var(--border-subtle); display:flex; justify-content:space-between; align-items:center;">
                        <h3 style="margin:0; font-size:16px;">${isQuest ? '🎯' : '📦'} Edit ${isQuest ? 'Quest Object' : 'Container'}</h3>
                        <button class="btn btn-ghost btn-sm" id="modal-close">×</button>
                    </div>
                    <div style="flex:1; overflow-y:auto; padding:16px; display:flex; flex-direction:column; gap:12px;">
                        <div>
                            <label class="label">Name</label>
                            <input type="text" class="input" id="obj-ed-name" value="${obj.name || ''}" style="width:100%;">
                        </div>
                        <div>
                            <label class="label">Description</label>
                            <textarea class="input" id="obj-ed-desc" rows="3" style="width:100%; resize:vertical;">${obj.description || ''}</textarea>
                        </div>
                        ${isQuest ? `
                            <div>
                                <label class="label">Quest Tag</label>
                                <input type="text" class="input" id="obj-ed-tag" value="${obj.questTag || ''}" style="width:100%;" placeholder="e.g. main_quest, side_quest">
                            </div>
                            <div style="display:flex; gap:16px;">
                                <label style="display:flex; align-items:center; gap:8px;">
                                    <input type="checkbox" id="obj-ed-discovered" ${obj.discovered ? 'checked' : ''}> Discovered
                                </label>
                                <label style="display:flex; align-items:center; gap:8px;">
                                    <input type="checkbox" id="obj-ed-collected" ${obj.collected ? 'checked' : ''}> Collected
                                </label>
                            </div>
                        ` : `
                            <div style="display:flex; gap:16px;">
                                <label style="display:flex; align-items:center; gap:8px;">
                                    <input type="checkbox" id="obj-ed-locked" ${obj.locked ? 'checked' : ''}> Locked
                                </label>
                                <div>
                                    <label class="label" style="font-size:10px;">Lock DC</label>
                                    <input type="number" class="input" id="obj-ed-lockdc" value="${obj.lockDC || 15}" style="width:60px;">
                                </div>
                            </div>
                            <div style="display:flex; gap:16px;">
                                <label style="display:flex; align-items:center; gap:8px;">
                                    <input type="checkbox" id="obj-ed-trapped" ${obj.trapped ? 'checked' : ''}> Trapped
                                </label>
                                <div>
                                    <label class="label" style="font-size:10px;">Trap DC</label>
                                    <input type="number" class="input" id="obj-ed-trapdc" value="${obj.trapDC || 12}" style="width:60px;">
                                </div>
                            </div>
                            <div style="border-top:1px solid var(--border-subtle); padding-top:12px;">
                                <label class="label" style="margin-bottom:8px;">Contents</label>
                                <div style="display:flex; gap:8px; margin-bottom:8px;">
                                    <select id="obj-add-item" class="input" style="flex:1; font-size:11px;">
                                        <option value="">-- Add Item --</option>
                                        ${armoryItems.map(a => `<option value="${a.id}">${a.name} (${a.type})</option>`).join('')}
                                    </select>
                                    <button class="btn btn-sm btn-secondary" id="btn-add-content">+</button>
                                </div>
                                <div style="display:flex; flex-direction:column; gap:4px; max-height:150px; overflow-y:auto; background:var(--bg-base); border-radius:6px; padding:8px;">
                                    ${(obj.contents || []).length === 0 ? `<div style="font-size:11px; color:var(--text-muted); text-align:center;">Empty</div>` : ''}
                                    ${(obj.contents || []).map((itemId, idx) => {
                const item = armoryItems.find(a => a.id === itemId) || { name: itemId };
                return `
                                            <div style="display:flex; justify-content:space-between; align-items:center; font-size:11px; padding:4px; background:var(--bg-surface); border-radius:4px;">
                                                <span>${item.name}</span>
                                                <button class="btn btn-ghost btn-sm remove-content" data-idx="${idx}" style="padding:0 6px; color:var(--status-error); height:18px; line-height:18px;">×</button>
                                            </div>
                                        `;
            }).join('')}
                                </div>
                            </div>
                        `}
                    </div>
                    <div style="padding:12px 16px; border-top:1px solid var(--border-subtle); display:flex; justify-content:flex-end; gap:8px;">
                        <button class="btn btn-ghost" id="modal-cancel">Done</button>
                        <button class="btn btn-primary" id="modal-save">Save & Close</button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            modal.querySelector('#modal-close').onclick = () => modal.remove();
            modal.querySelector('#modal-cancel').onclick = () => modal.remove(); // Acts as close without final confirm, but changes are live on 'obj'
            modal.onclick = (e) => { if (e.target === modal) modal.remove(); };

            // Content list wiring
            if (!isQuest) {
                // Add item
                modal.querySelector('#btn-add-content').onclick = () => {
                    const select = modal.querySelector('#obj-add-item');
                    if (select.value) {
                        saveState(); // Update existing fields first
                        if (!obj.contents) obj.contents = [];
                        obj.contents.push(select.value);
                        modal.remove();
                        showObjectEditor(obj, onSave);
                    }
                };

                // Remove item
                modal.querySelectorAll('.remove-content').forEach(btn => {
                    btn.onclick = (e) => {
                        const idx = parseInt(e.target.dataset.idx);
                        saveState();
                        obj.contents.splice(idx, 1);
                        modal.remove();
                        showObjectEditor(obj, onSave);
                    };
                });
            }

            modal.querySelector('#modal-save').onclick = () => {
                saveState(); // Ensure final inputs are captured
                modal.remove();
                if (onSave) onSave();
                if (A.UI?.Toast) A.UI.Toast.show('Object updated', 'success');
            };
        };

        content.appendChild(objectsSection);
        renderObjects();

        // === SECTION: Shops ===
        const shopsSection = document.createElement('div');
        shopsSection.className = 'card';
        shopsSection.style.cssText = 'padding:20px; margin-bottom:20px;';

        // Initialize shops array
        if (!state.rpg.shops) state.rpg.shops = [];

        // Get actors for shopkeeper dropdown
        const actors = Object.values(state.nodes?.actors?.items || {});
        const npcs = actors.filter(a => a.data?.rpg?.type !== 'monster');

        const renderShops = () => {
            const shops = state.rpg.shops || [];

            shopsSection.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
                    <h3 style="margin:0; font-size:14px; display:flex; align-items:center; gap:8px;">
                        🏪 Shops
                        <span style="font-size:11px; color:var(--text-muted); font-weight:normal;">(${shops.length} total)</span>
                    </h3>
                    <div style="display:flex; gap:8px;">
                        <input type="text" id="new-shop-name" class="input" placeholder="New Shop Name" style="font-size:12px; padding:2px 8px; width:150px;">
                        <button id="btn-add-shop" class="btn btn-primary btn-sm">+ Add Shop</button>
                    </div>
                </div>
                
                <div id="shops-list" style="display:grid; gap:12px; max-height:400px; overflow-y:auto;">
                    ${shops.length === 0 ? `
                        <div style="text-align:center; padding:40px; color:var(--text-muted);">
                            <div style="font-size:32px; margin-bottom:8px;">🏪</div>
                            <div>No shops defined</div>
                            <div style="font-size:11px; margin-top:4px;">Add merchant NPCs for trading</div>
                        </div>
                    ` : shops.map((shop, idx) => {
                const shopkeeper = npcs.find(a => a.id === shop.shopkeeperId);
                const location = allLocations.find(l => l.id === shop.locationId);
                return `
                        <div class="card" style="padding:12px; background:var(--bg-base); display:flex; gap:12px; align-items:start;">
                            <div style="font-size:24px;">🏪</div>
                            <div style="flex:1; min-width:0;">
                                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                                    <input type="text" class="input shop-name" data-idx="${idx}" value="${shop.name || ''}" 
                                           style="font-weight:600; font-size:13px; padding:4px 8px; flex:1; max-width:200px;">
                                    <div style="display:flex; gap:4px;">
                                        <span class="badge" style="font-size:9px; padding:2px 6px; background:var(--bg-inset); border-radius:8px;">
                                            ${(shop.stock || []).length} items
                                        </span>
                                        <span class="badge" style="font-size:9px; padding:2px 6px; background:var(--status-success); border-radius:8px;">
                                            💰 ${shop.currency || 0}
                                        </span>
                                        <button class="btn btn-ghost btn-sm shop-edit" data-idx="${idx}" style="padding:2px 6px;">✏️</button>
                                        <button class="btn btn-ghost btn-sm shop-delete" data-idx="${idx}" style="padding:2px 6px; color:var(--status-error);">×</button>
                                    </div>
                                </div>
                                <div style="display:flex; gap:16px; font-size:11px; color:var(--text-muted);">
                                    <span>👤 ${shopkeeper?.name || '(No shopkeeper)'}</span>
                                    <span>📍 ${location?.name || '(No location)'}</span>
                                    <span>💹 ${Math.round((shop.buybackRate || 0.5) * 100)}% buyback</span>
                                </div>
                            </div>
                        </div>
                    `;
            }).join('')}
                </div>
            `;

            // Wire add button
            shopsSection.querySelector('#btn-add-shop').onclick = () => {
                const nameInput = shopsSection.querySelector('#new-shop-name');
                const name = nameInput.value.trim();

                if (!name) {
                    if (A.UI?.Toast) A.UI.Toast.show('Enter a shop name', 'warning');
                    return;
                }

                const newShop = {
                    id: 'shop_' + Math.random().toString(36).substr(2, 8),
                    name: name,
                    shopkeeperId: null,
                    locationId: null,
                    type: 'general',
                    buybackRate: 0.5,
                    stock: [],
                    currency: 500
                };

                state.rpg.shops.push(newShop);
                nameInput.value = ''; // Clear input
                A.State.notify();
                renderShops();
                if (A.UI?.Toast) A.UI.Toast.show(`Created shop: ${name}`, 'success');
            };

            // Wire name inputs
            shopsSection.querySelectorAll('.shop-name').forEach(input => {
                input.onchange = (e) => {
                    const idx = parseInt(e.target.dataset.idx);
                    if (state.rpg.shops[idx]) {
                        state.rpg.shops[idx].name = e.target.value;
                        A.State.notify();
                    }
                };
            });

            // Wire edit buttons
            shopsSection.querySelectorAll('.shop-edit').forEach(btn => {
                btn.onclick = (e) => {
                    const idx = parseInt(e.target.dataset.idx);
                    const shop = state.rpg.shops[idx];
                    if (!shop) return;
                    showShopEditor(shop, () => {
                        A.State.notify();
                        renderShops();
                    });
                };
            });

            // Wire delete buttons
            shopsSection.querySelectorAll('.shop-delete').forEach(btn => {
                btn.onclick = (e) => {
                    const idx = parseInt(e.target.dataset.idx);
                    const shop = state.rpg.shops[idx];
                    if (!shop) return;

                    if (confirm(`Delete "${shop.name}"?`)) {
                        state.rpg.shops.splice(idx, 1);
                        A.State.notify();
                        renderShops();
                        if (A.UI?.Toast) A.UI.Toast.show('Shop deleted', 'info');
                    }
                };
            });
        };

        // Shop Editor Modal
        const showShopEditor = (shop, onSave) => {
            const modal = document.createElement('div');
            modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:10000;';

            // Get armory items for stock selection
            const armoryItems = Object.values(state.rpg?.armory?.items || {});

            modal.innerHTML = `
                <div style="background:var(--bg-elevated); width:600px; max-height:85vh; border-radius:12px; display:flex; flex-direction:column; overflow:hidden; box-shadow:0 20px 50px rgba(0,0,0,0.5); border:1px solid var(--border-default);">
                    <div style="padding:16px; border-bottom:1px solid var(--border-subtle); display:flex; justify-content:space-between; align-items:center;">
                        <h3 style="margin:0; font-size:16px;">🏪 Edit Shop: ${shop.name}</h3>
                        <button class="btn btn-ghost btn-sm" id="modal-close">×</button>
                    </div>
                    <div style="flex:1; overflow-y:auto; padding:16px; display:flex; flex-direction:column; gap:16px;">
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                            <div>
                                <label class="label">Shopkeeper</label>
                                <select class="input" id="shop-ed-keeper" style="width:100%;">
                                    <option value="">(None)</option>
                                    ${npcs.map(a => `<option value="${a.id}" ${shop.shopkeeperId === a.id ? 'selected' : ''}>${a.name}</option>`).join('')}
                                </select>
                            </div>
                            <div>
                                <label class="label">Location</label>
                                <select class="input" id="shop-ed-location" style="width:100%;">
                                    <option value="">(None)</option>
                                    ${allLocations.map(l => `<option value="${l.id}" ${shop.locationId === l.id ? 'selected' : ''}>${l._mapName ? `${l.name} (${l._mapName})` : l.name}</option>`).join('')}
                                </select>
                            </div>
                        </div>
                        <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px;">
                            <div>
                                <label class="label">Type</label>
                                <select class="input" id="shop-ed-type" style="width:100%;">
                                    <option value="general" ${shop.type === 'general' ? 'selected' : ''}>General</option>
                                    <option value="weapons" ${shop.type === 'weapons' ? 'selected' : ''}>Weapons</option>
                                    <option value="armor" ${shop.type === 'armor' ? 'selected' : ''}>Armor</option>
                                    <option value="magic" ${shop.type === 'magic' ? 'selected' : ''}>Magic</option>
                                    <option value="potions" ${shop.type === 'potions' ? 'selected' : ''}>Potions</option>
                                </select>
                            </div>
                            <div>
                                <label class="label">Buyback Rate</label>
                                <input type="number" class="input" id="shop-ed-buyback" value="${Math.round((shop.buybackRate || 0.5) * 100)}" min="0" max="100" style="width:100%;">
                                <span style="font-size:10px; color:var(--text-muted);">% of item value</span>
                            </div>
                            <div>
                                <label class="label">Shop Currency</label>
                                <input type="number" class="input" id="shop-ed-currency" value="${shop.currency || 0}" min="0" style="width:100%;">
                            </div>
                        </div>
                        
                        <div style="border-top:1px solid var(--border-subtle); padding-top:16px;">
                            <label class="label" style="margin-bottom:12px;">Stock (${(shop.stock || []).length} items)</label>
                            
                            <!-- Add Item Row -->
                            <div style="display:flex; gap:8px; align-items:center; margin-bottom:12px; padding:8px; background:var(--bg-surface); border-radius:6px; border:1px dashed var(--border-subtle);">
                                <select class="input" id="add-item-select" style="flex:1; height:28px; font-size:11px;">
                                    <option value="">-- Select item from Armory --</option>
                                    ${armoryItems.map(a => `<option value="${a.id}" data-value="${a.value || 100}">${a.name} (${a.type || 'item'})</option>`).join('')}
                                </select>
                                <input type="number" class="input" id="add-item-qty" value="5" min="1" style="width:50px; height:28px; font-size:11px;" placeholder="Qty">
                                <input type="number" class="input" id="add-item-price" value="100" min="0" style="width:70px; height:28px; font-size:11px;" placeholder="Price">
                                <button class="btn btn-primary btn-sm" id="btn-add-stock" style="height:28px;">Add</button>
                            </div>

                            <div id="stock-list" style="display:flex; flex-direction:column; gap:8px; max-height:180px; overflow-y:auto;">
                                ${(shop.stock || []).length === 0 ? `
                                    <div style="text-align:center; padding:16px; color:var(--text-muted); font-size:11px;">No items in stock yet</div>
                                ` : (shop.stock || []).map((item, i) => {
                const armoryItem = armoryItems.find(a => a.id === item.itemId);
                return `
                                    <div style="display:flex; gap:8px; align-items:center; background:var(--bg-base); padding:8px; border-radius:6px;">
                                        <span style="flex:1; font-size:12px;">${armoryItem?.name || item.itemId}</span>
                                        <input type="number" class="input stock-qty" data-idx="${i}" value="${item.quantity || 1}" min="1" style="width:50px; height:24px; font-size:11px;">
                                        <input type="number" class="input stock-price" data-idx="${i}" value="${item.price || 0}" min="0" style="width:70px; height:24px; font-size:11px;" placeholder="Price">
                                        <button class="btn btn-ghost btn-sm stock-remove" data-idx="${i}" style="padding:2px 6px; color:var(--status-error);">×</button>
                                    </div>
                                `;
            }).join('')}
                            </div>
                        </div>
                    </div>
                    <div style="padding:12px 16px; border-top:1px solid var(--border-subtle); display:flex; justify-content:flex-end; gap:8px;">
                        <button class="btn btn-ghost" id="modal-cancel">Cancel</button>
                        <button class="btn btn-primary" id="modal-save">Save</button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            modal.querySelector('#modal-close').onclick = () => modal.remove();
            modal.querySelector('#modal-cancel').onclick = () => modal.remove();
            modal.onclick = (e) => { if (e.target === modal) modal.remove(); };

            // Add stock item from inline controls
            modal.querySelector('#btn-add-stock').onclick = () => {
                const select = modal.querySelector('#add-item-select');
                const itemId = select.value;

                if (!itemId) {
                    if (A.UI?.Toast) A.UI.Toast.show('Select an item first', 'warning');
                    return;
                }

                const quantity = parseInt(modal.querySelector('#add-item-qty').value) || 5;
                const price = parseInt(modal.querySelector('#add-item-price').value) || 100;

                if (!shop.stock) shop.stock = [];
                shop.stock.push({ itemId, quantity, price });

                // Re-render modal content
                modal.remove();
                showShopEditor(shop, onSave);
            };

            // Auto-fill price when item is selected
            modal.querySelector('#add-item-select').onchange = (e) => {
                const option = e.target.options[e.target.selectedIndex];
                if (option && option.dataset.value) {
                    modal.querySelector('#add-item-price').value = option.dataset.value;
                }
            };

            // Wire stock quantity/price changes
            modal.querySelectorAll('.stock-qty').forEach(input => {
                input.onchange = (e) => {
                    const idx = parseInt(e.target.dataset.idx);
                    if (shop.stock[idx]) shop.stock[idx].quantity = parseInt(e.target.value) || 1;
                };
            });
            modal.querySelectorAll('.stock-price').forEach(input => {
                input.onchange = (e) => {
                    const idx = parseInt(e.target.dataset.idx);
                    if (shop.stock[idx]) shop.stock[idx].price = parseInt(e.target.value) || 0;
                };
            });
            modal.querySelectorAll('.stock-remove').forEach(btn => {
                btn.onclick = (e) => {
                    const idx = parseInt(e.target.dataset.idx);
                    shop.stock.splice(idx, 1);
                    modal.remove();
                    showShopEditor(shop, onSave);
                };
            });

            modal.querySelector('#modal-save').onclick = () => {
                shop.shopkeeperId = modal.querySelector('#shop-ed-keeper').value || null;
                shop.locationId = modal.querySelector('#shop-ed-location').value || null;
                shop.type = modal.querySelector('#shop-ed-type').value;
                shop.buybackRate = (parseInt(modal.querySelector('#shop-ed-buyback').value) || 50) / 100;
                shop.currency = parseInt(modal.querySelector('#shop-ed-currency').value) || 0;

                modal.remove();
                if (onSave) onSave();
                if (A.UI?.Toast) A.UI.Toast.show('Shop updated', 'success');
            };
        };

        content.appendChild(shopsSection);
        renderShops();
    }

    // Expose core rule IDs for other modules
    if (!A.RPG) A.RPG = {};
    A.RPG.CORE_RULE_IDS = Object.keys(CORE_RULE_IDS);

    A.registerPanel('rpg_gm', {
        label: 'Game Master',
        subtitle: 'Campaign & Rules',
        category: 'RPG Experiment',
        subcategory: 'Game Master',
        order: 10,
        gmOnly: true,
        icon: '🎲',
        render: render
    });

})(window.Anansi);
