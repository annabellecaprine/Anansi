/*
 * Anansi Panel: RPG Feats Database
 * File: js/panels/rpg_feats.js
 * Category: RPG Experiment
 * Purpose: CRUD interface for managing Feats, Spells, and Abilities with structured fields for script reference.
 */

(function (A) {
    'use strict';

    // =============================================
    // FEAT SCHEMA DEFINITION
    // =============================================
    // This defines the structure that other scripts can rely on
    const FEAT_SCHEMA = {
        // Core Identity
        id: 'string',           // Unique identifier (feat_xxxx)
        name: 'string',         // Display name
        type: 'enum',           // spell | ability | passive | reaction
        tags: 'array',          // For filtering: ['fire', 'aoe', 'healing', etc.]

        // Requirements
        requirements: {
            level: 'number',        // Minimum character level
            class: 'string',        // Required class (or empty for any)
            stat: 'string',         // Required stat (e.g., 'INT')
            statMin: 'number',      // Minimum stat value
            featPrereq: 'string'    // Required feat ID to unlock this
        },

        // Activation
        activation: {
            actionType: 'enum',     // action | bonus_action | reaction | free | passive
            cost: 'number',         // Resource cost (MP/SP/etc.)
            costType: 'enum',       // mp | sp | hp | uses
            uses: 'number',         // Max uses per rest (0 = unlimited)
            cooldown: 'number',     // Turns until usable again
            concentration: 'boolean' // Requires concentration
        },

        // Targeting
        targeting: {
            type: 'enum',           // self | ally | enemy | all_allies | all_enemies | area
            range: 'number',        // Range in feet (0 = touch/self)
            areaSize: 'number',     // Area radius in feet (for AoE)
            areaShape: 'enum'       // sphere | cone | line | cube
        },

        // Effects
        effects: [{
            effectType: 'enum',     // damage | heal | buff | debuff | summon | utility
            damageType: 'enum',     // physical | fire | cold | lightning | poison | psychic | radiant | necrotic
            dice: 'string',         // e.g., '2d6+3' or '+1d4'
            stat: 'string',         // Stat modifier to add (STR, DEX, etc.)
            duration: 'number',     // Duration in turns (0 = instant)
            saveStat: 'string',     // Save type: DEX, CON, WIS, etc.
            saveDC: 'number',       // Save DC (or 0 to use caster's DC)
            condition: 'string'     // Status condition applied: stunned, poisoned, etc.
        }],

        // Description
        description: 'string',      // Full text description
        shortDesc: 'string'         // One-line summary for tooltips
    };

    // Default Feats (seeded on first run)
    const DEFAULT_FEATS = [
        {
            id: 'feat_fireball',
            name: 'Fireball',
            type: 'spell',
            tags: ['fire', 'aoe', 'evocation'],
            requirements: { level: 5, class: '', stat: 'INT', statMin: 13, featPrereq: '' },
            activation: { actionType: 'action', cost: 3, costType: 'mp', uses: 0, cooldown: 0, concentration: false },
            targeting: { type: 'area', range: 150, areaSize: 20, areaShape: 'sphere' },
            effects: [
                { effectType: 'damage', damageType: 'fire', dice: '8d6', stat: '', duration: 0, saveStat: 'DEX', saveDC: 0, condition: '' }
            ],
            description: 'A bright streak flashes from your pointing finger to a point you choose within range and then blossoms with a low roar into an explosion of flame.',
            shortDesc: '8d6 fire damage in 20ft radius, DEX save for half'
        },
        {
            id: 'feat_cure_wounds',
            name: 'Cure Wounds',
            type: 'spell',
            tags: ['healing', 'evocation'],
            requirements: { level: 1, class: '', stat: 'WIS', statMin: 10, featPrereq: '' },
            activation: { actionType: 'action', cost: 1, costType: 'mp', uses: 0, cooldown: 0, concentration: false },
            targeting: { type: 'ally', range: 0, areaSize: 0, areaShape: '' },
            effects: [
                { effectType: 'heal', damageType: '', dice: '1d8', stat: 'WIS', duration: 0, saveStat: '', saveDC: 0, condition: '' }
            ],
            description: 'A creature you touch regains a number of hit points equal to 1d8 + your spellcasting ability modifier.',
            shortDesc: 'Heal 1d8 + WIS mod HP on touch'
        },
        {
            id: 'feat_sneak_attack',
            name: 'Sneak Attack',
            type: 'passive',
            tags: ['damage', 'rogue', 'conditional'],
            requirements: { level: 1, class: 'Rogue', stat: '', statMin: 0, featPrereq: '' },
            activation: { actionType: 'passive', cost: 0, costType: '', uses: 1, cooldown: 0, concentration: false },
            targeting: { type: 'enemy', range: 0, areaSize: 0, areaShape: '' },
            effects: [
                { effectType: 'damage', damageType: 'physical', dice: '+1d6', stat: '', duration: 0, saveStat: '', saveDC: 0, condition: '' }
            ],
            description: 'Once per turn, you can deal extra damage to one creature you hit with an attack if you have advantage on the attack roll.',
            shortDesc: '+1d6 damage with advantage (1/turn)'
        },
        {
            id: 'feat_rage',
            name: 'Rage',
            type: 'ability',
            tags: ['buff', 'barbarian', 'combat'],
            requirements: { level: 1, class: 'Barbarian', stat: '', statMin: 0, featPrereq: '' },
            activation: { actionType: 'bonus_action', cost: 0, costType: '', uses: 2, cooldown: 0, concentration: false },
            targeting: { type: 'self', range: 0, areaSize: 0, areaShape: '' },
            effects: [
                { effectType: 'buff', damageType: '', dice: '+2', stat: 'damage', duration: 10, saveStat: '', saveDC: 0, condition: 'raging' }
            ],
            description: 'In battle, you fight with primal ferocity. On your turn, you can enter a rage as a bonus action.',
            shortDesc: '+2 damage, resistance to physical (10 turns)'
        },
        {
            id: 'feat_second_wind',
            name: 'Second Wind',
            type: 'ability',
            tags: ['healing', 'fighter', 'self'],
            requirements: { level: 1, class: 'Fighter', stat: '', statMin: 0, featPrereq: '' },
            activation: { actionType: 'bonus_action', cost: 0, costType: '', uses: 1, cooldown: 0, concentration: false },
            targeting: { type: 'self', range: 0, areaSize: 0, areaShape: '' },
            effects: [
                { effectType: 'heal', damageType: '', dice: '1d10', stat: 'level', duration: 0, saveStat: '', saveDC: 0, condition: '' }
            ],
            description: 'You have a limited well of stamina that you can draw on to protect yourself from harm.',
            shortDesc: 'Heal 1d10 + level HP (1/rest)'
        },
        {
            id: 'feat_shield_bash',
            name: 'Shield Bash',
            type: 'reaction',
            tags: ['combat', 'defensive', 'control'],
            requirements: { level: 1, class: '', stat: 'STR', statMin: 13, featPrereq: '' },
            activation: { actionType: 'reaction', cost: 0, costType: '', uses: 0, cooldown: 1, concentration: false },
            targeting: { type: 'enemy', range: 5, areaSize: 0, areaShape: '' },
            effects: [
                { effectType: 'damage', damageType: 'physical', dice: '1d4', stat: 'STR', duration: 0, saveStat: '', saveDC: 0, condition: '' },
                { effectType: 'debuff', damageType: '', dice: '', stat: '', duration: 1, saveStat: 'STR', saveDC: 0, condition: 'prone' }
            ],
            description: 'When an enemy misses you with a melee attack, you can use your reaction to bash them with your shield.',
            shortDesc: '1d4+STR damage, target prone on failed STR save'
        }
    ];

    // Enum Options for UI
    const TYPE_OPTIONS = [
        { value: 'spell', label: '✨ Spell', desc: 'Requires mana/spell slots' },
        { value: 'ability', label: '⚡ Ability', desc: 'Class feature, limited uses' },
        { value: 'passive', label: '📜 Passive', desc: 'Always active when conditions met' },
        { value: 'reaction', label: '🛡️ Reaction', desc: 'Triggered by specific events' }
    ];

    const ACTION_TYPE_OPTIONS = [
        { value: 'action', label: 'Action' },
        { value: 'bonus_action', label: 'Bonus Action' },
        { value: 'reaction', label: 'Reaction' },
        { value: 'free', label: 'Free Action' },
        { value: 'passive', label: 'Passive (Always On)' }
    ];

    const COST_TYPE_OPTIONS = [
        { value: 'mp', label: 'Mana (MP)' },
        { value: 'sp', label: 'Stamina (SP)' },
        { value: 'hp', label: 'Health (HP)' },
        { value: 'uses', label: 'Uses per Rest' },
        { value: '', label: 'None' }
    ];

    const TARGET_TYPE_OPTIONS = [
        { value: 'self', label: 'Self' },
        { value: 'ally', label: 'Single Ally' },
        { value: 'enemy', label: 'Single Enemy' },
        { value: 'all_allies', label: 'All Allies' },
        { value: 'all_enemies', label: 'All Enemies' },
        { value: 'area', label: 'Area Effect' }
    ];

    const AREA_SHAPE_OPTIONS = [
        { value: '', label: 'None' },
        { value: 'sphere', label: 'Sphere' },
        { value: 'cone', label: 'Cone' },
        { value: 'line', label: 'Line' },
        { value: 'cube', label: 'Cube' }
    ];

    const EFFECT_TYPE_OPTIONS = [
        { value: 'damage', label: '⚔️ Damage' },
        { value: 'heal', label: '💚 Heal' },
        { value: 'buff', label: '⬆️ Buff' },
        { value: 'debuff', label: '⬇️ Debuff' },
        { value: 'summon', label: '👻 Summon' },
        { value: 'utility', label: '🔧 Utility' }
    ];

    const DAMAGE_TYPE_OPTIONS = [
        { value: '', label: 'None' },
        { value: 'physical', label: 'Physical' },
        { value: 'fire', label: 'Fire' },
        { value: 'cold', label: 'Cold' },
        { value: 'lightning', label: 'Lightning' },
        { value: 'poison', label: 'Poison' },
        { value: 'psychic', label: 'Psychic' },
        { value: 'radiant', label: 'Radiant' },
        { value: 'necrotic', label: 'Necrotic' }
    ];

    const STAT_OPTIONS = [
        { value: '', label: 'None' },
        { value: 'STR', label: 'Strength' },
        { value: 'DEX', label: 'Dexterity' },
        { value: 'CON', label: 'Constitution' },
        { value: 'INT', label: 'Intelligence' },
        { value: 'WIS', label: 'Wisdom' },
        { value: 'CHA', label: 'Charisma' },
        { value: 'level', label: 'Level' },
        { value: 'damage', label: 'Damage Rolls' }
    ];

    const CONDITION_OPTIONS = [
        { value: '', label: 'None' },
        { value: 'stunned', label: 'Stunned' },
        { value: 'prone', label: 'Prone' },
        { value: 'poisoned', label: 'Poisoned' },
        { value: 'frightened', label: 'Frightened' },
        { value: 'blinded', label: 'Blinded' },
        { value: 'charmed', label: 'Charmed' },
        { value: 'paralyzed', label: 'Paralyzed' },
        { value: 'restrained', label: 'Restrained' },
        { value: 'raging', label: 'Raging' },
        { value: 'concentrating', label: 'Concentrating' }
    ];

    const TAG_SUGGESTIONS = [
        'fire', 'cold', 'lightning', 'poison', 'radiant', 'necrotic', 'psychic',
        'healing', 'damage', 'aoe', 'single-target', 'buff', 'debuff', 'control',
        'evocation', 'conjuration', 'necromancy', 'illusion', 'divination',
        'fighter', 'rogue', 'wizard', 'cleric', 'barbarian', 'paladin',
        'combat', 'utility', 'movement', 'defensive', 'offensive', 'support'
    ];

    // Helper: Create select element with options
    function createSelect(options, selectedValue, id, style = '') {
        let html = `<select id="${id}" class="input" style="width:100%; ${style}">`;
        options.forEach(opt => {
            html += `<option value="${opt.value}" ${opt.value === selectedValue ? 'selected' : ''}>${opt.label}</option>`;
        });
        html += '</select>';
        return html;
    }

    function render(container) {
        container.style.height = '100%';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.overflow = 'hidden';

        // Header
        const header = document.createElement('div');
        header.style.cssText = 'display:flex; justify-content:space-between; align-items:center; padding:16px; border-bottom:1px solid var(--border-subtle); flex-wrap:wrap; gap:8px;';
        header.innerHTML = `
            <div>
                <h2 style="margin:0; font-size:18px;">✨ Feats & Abilities</h2>
                <p style="margin:4px 0 0; font-size:12px; color:var(--text-muted);">Define spells, abilities, and passives with structured fields for script integration.</p>
            </div>
            <div style="display:flex; gap:8px;">
                <button id="add-feat-btn" class="btn btn-primary">+ New Feat</button>
                <button id="export-schema-btn" class="btn btn-ghost btn-sm" title="Copy schema to clipboard">📋 Schema</button>
            </div>
        `;
        container.appendChild(header);

        // Content (Split: List | Editor)
        const content = document.createElement('div');
        content.style.cssText = 'flex:1; display:grid; grid-template-columns:320px 1fr; overflow:hidden;';
        container.appendChild(content);

        // Left: List
        const listPane = document.createElement('div');
        listPane.style.cssText = 'border-right:1px solid var(--border-subtle); overflow-y:auto; padding:12px; display:flex; flex-direction:column; gap:8px;';
        listPane.id = 'feats-list-pane';
        content.appendChild(listPane);

        // Right: Editor
        const editorPane = document.createElement('div');
        editorPane.style.cssText = 'overflow-y:auto; padding:20px;';
        editorPane.id = 'feat-editor-pane';
        editorPane.innerHTML = '<div style="color:var(--text-muted); text-align:center; padding-top:60px;">Select a feat to edit or create a new one.</div>';
        content.appendChild(editorPane);

        let selectedFeatId = null;
        let filterType = 'all';

        // Initialize Database
        const state = A.State.get();
        if (!state.rpg) state.rpg = {};
        if (!state.rpg.featDatabase || state.rpg.featDatabase.length === 0) {
            state.rpg.featDatabase = JSON.parse(JSON.stringify(DEFAULT_FEATS));
            A.State.notify();
        }

        // Migrate old feats to new schema
        state.rpg.featDatabase.forEach((feat, idx) => {
            if (!feat.requirements) {
                state.rpg.featDatabase[idx] = migrateOldFeat(feat);
            }
        });

        function migrateOldFeat(oldFeat) {
            return {
                id: oldFeat.id,
                name: oldFeat.name || 'Unknown',
                type: oldFeat.type || 'ability',
                tags: [],
                requirements: { level: 1, class: '', stat: '', statMin: 0, featPrereq: '' },
                activation: {
                    actionType: oldFeat.type === 'passive' ? 'passive' : 'action',
                    cost: oldFeat.cost || 0,
                    costType: oldFeat.cost ? 'mp' : '',
                    uses: 0,
                    cooldown: 0,
                    concentration: false
                },
                targeting: {
                    type: oldFeat.target || 'enemy',
                    range: 0,
                    areaSize: 0,
                    areaShape: ''
                },
                effects: [{
                    effectType: oldFeat.effectType?.includes('damage') ? 'damage' :
                        oldFeat.effectType === 'heal' ? 'heal' :
                            oldFeat.effectType?.includes('buff') ? 'buff' : 'damage',
                    damageType: oldFeat.effectType?.replace('_damage', '') || '',
                    dice: oldFeat.effect || '',
                    stat: '',
                    duration: 0,
                    saveStat: '',
                    saveDC: 0,
                    condition: ''
                }],
                description: oldFeat.description || '',
                shortDesc: ''
            };
        }

        // Render Filter Tabs
        function renderFilters() {
            const filterDiv = document.createElement('div');
            filterDiv.style.cssText = 'display:flex; gap:4px; flex-wrap:wrap; margin-bottom:12px; padding-bottom:12px; border-bottom:1px solid var(--border-subtle);';

            const filters = [
                { value: 'all', label: 'All' },
                { value: 'spell', label: '✨ Spells' },
                { value: 'ability', label: '⚡ Abilities' },
                { value: 'passive', label: '📜 Passives' },
                { value: 'reaction', label: '🛡️ Reactions' }
            ];

            filters.forEach(f => {
                const btn = document.createElement('button');
                btn.className = `btn btn-xs ${filterType === f.value ? 'btn-primary' : 'btn-ghost'}`;
                btn.textContent = f.label;
                btn.onclick = () => {
                    filterType = f.value;
                    renderList();
                };
                filterDiv.appendChild(btn);
            });

            return filterDiv;
        }

        // Render List
        function renderList() {
            const feats = A.State.get().rpg.featDatabase || [];
            listPane.innerHTML = '';

            listPane.appendChild(renderFilters());

            const filteredFeats = filterType === 'all' ? feats : feats.filter(f => f.type === filterType);

            if (filteredFeats.length === 0) {
                const empty = document.createElement('div');
                empty.style.cssText = 'color:var(--text-muted); font-style:italic; text-align:center; padding:20px;';
                empty.textContent = 'No feats found.';
                listPane.appendChild(empty);
                return;
            }

            filteredFeats.forEach(feat => {
                const card = document.createElement('div');
                card.style.cssText = `
                    padding:12px; background:var(--bg-surface);
                    border-radius:var(--radius-sm); cursor:pointer; transition:all 0.15s;
                    border:2px solid ${feat.id === selectedFeatId ? 'var(--accent-primary)' : 'transparent'};
                `;

                const icon = feat.type === 'spell' ? '✨' : feat.type === 'ability' ? '⚡' : feat.type === 'reaction' ? '🛡️' : '📜';
                const actIcon = feat.activation?.actionType === 'bonus_action' ? '⚡' :
                    feat.activation?.actionType === 'reaction' ? '↩️' :
                        feat.activation?.actionType === 'passive' ? '∞' : '▶️';

                const costStr = feat.activation?.cost ? `${feat.activation.cost} ${feat.activation.costType?.toUpperCase() || ''}` : 'Free';
                const effectStr = feat.effects?.[0]?.dice || '-';
                const effectType = feat.effects?.[0]?.effectType || '';

                card.innerHTML = `
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:6px;">
                        <div style="font-weight:bold; font-size:14px;">${icon} ${feat.name}</div>
                        <span style="font-size:10px; padding:2px 6px; background:var(--bg-elevated); border-radius:4px;">${actIcon}</span>
                    </div>
                    <div style="font-size:11px; color:var(--text-muted); display:flex; gap:8px; flex-wrap:wrap;">
                        <span title="Effect">${effectStr} ${effectType}</span>
                        <span title="Cost">💎 ${costStr}</span>
                        ${feat.targeting?.type ? `<span title="Target">🎯 ${feat.targeting.type}</span>` : ''}
                    </div>
                    ${feat.shortDesc ? `<div style="font-size:10px; color:var(--text-secondary); margin-top:6px; font-style:italic;">${feat.shortDesc}</div>` : ''}
                `;

                card.onclick = () => {
                    selectedFeatId = feat.id;
                    renderList();
                    renderEditor(feat);
                };

                card.onmouseenter = () => { if (feat.id !== selectedFeatId) card.style.borderColor = 'var(--border-default)'; };
                card.onmouseleave = () => { if (feat.id !== selectedFeatId) card.style.borderColor = 'transparent'; };

                listPane.appendChild(card);
            });
        }

        // Render Editor
        function renderEditor(feat) {
            // Ensure all nested objects exist
            feat.requirements = feat.requirements || { level: 1, class: '', stat: '', statMin: 0, featPrereq: '' };
            feat.activation = feat.activation || { actionType: 'action', cost: 0, costType: '', uses: 0, cooldown: 0, concentration: false };
            feat.targeting = feat.targeting || { type: 'enemy', range: 0, areaSize: 0, areaShape: '' };
            feat.effects = feat.effects || [{ effectType: 'damage', damageType: '', dice: '', stat: '', duration: 0, saveStat: '', saveDC: 0, condition: '' }];
            feat.tags = feat.tags || [];

            editorPane.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; padding-bottom:12px; border-bottom:1px solid var(--border-subtle);">
                    <h3 style="margin:0;">Edit Feat</h3>
                    <button id="delete-feat-btn" class="btn btn-sm" style="background:var(--status-error); color:white;">🗑️ Delete</button>
                </div>

                <!-- SECTION: Identity -->
                <div class="editor-section" style="margin-bottom:24px;">
                    <h4 style="margin:0 0 12px; font-size:12px; text-transform:uppercase; color:var(--text-muted); letter-spacing:1px;">Identity</h4>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                        <div>
                            <label class="l-lab">Name *</label>
                            <input type="text" id="feat-name" class="input" style="width:100%;" value="${feat.name || ''}">
                        </div>
                        <div>
                            <label class="l-lab">Type</label>
                            ${createSelect(TYPE_OPTIONS, feat.type, 'feat-type')}
                        </div>
                        <div style="grid-column:span 2;">
                            <label class="l-lab">Tags (comma separated)</label>
                            <input type="text" id="feat-tags" class="input" style="width:100%;" value="${(feat.tags || []).join(', ')}" placeholder="fire, aoe, evocation">
                            <div style="font-size:10px; color:var(--text-muted); margin-top:4px;">Suggestions: ${TAG_SUGGESTIONS.slice(0, 10).join(', ')}...</div>
                        </div>
                    </div>
                </div>

                <!-- SECTION: Requirements -->
                <div class="editor-section" style="margin-bottom:24px;">
                    <h4 style="margin:0 0 12px; font-size:12px; text-transform:uppercase; color:var(--text-muted); letter-spacing:1px;">Requirements</h4>
                    <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:12px;">
                        <div>
                            <label class="l-lab">Min Level</label>
                            <input type="number" id="req-level" class="input" style="width:100%;" value="${feat.requirements.level || 1}" min="1" max="20">
                        </div>
                        <div>
                            <label class="l-lab">Class</label>
                            <input type="text" id="req-class" class="input" style="width:100%;" value="${feat.requirements.class || ''}" placeholder="Any">
                        </div>
                        <div>
                            <label class="l-lab">Required Stat</label>
                            ${createSelect(STAT_OPTIONS, feat.requirements.stat, 'req-stat')}
                        </div>
                        <div>
                            <label class="l-lab">Min Stat Value</label>
                            <input type="number" id="req-stat-min" class="input" style="width:100%;" value="${feat.requirements.statMin || 0}" min="0" max="30">
                        </div>
                    </div>
                </div>

                <!-- SECTION: Activation -->
                <div class="editor-section" style="margin-bottom:24px;">
                    <h4 style="margin:0 0 12px; font-size:12px; text-transform:uppercase; color:var(--text-muted); letter-spacing:1px;">Activation</h4>
                    <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:12px;">
                        <div>
                            <label class="l-lab">Action Type</label>
                            ${createSelect(ACTION_TYPE_OPTIONS, feat.activation.actionType, 'act-action-type')}
                        </div>
                        <div>
                            <label class="l-lab">Cost</label>
                            <input type="number" id="act-cost" class="input" style="width:100%;" value="${feat.activation.cost || 0}" min="0">
                        </div>
                        <div>
                            <label class="l-lab">Cost Type</label>
                            ${createSelect(COST_TYPE_OPTIONS, feat.activation.costType, 'act-cost-type')}
                        </div>
                        <div>
                            <label class="l-lab">Uses/Rest</label>
                            <input type="number" id="act-uses" class="input" style="width:100%;" value="${feat.activation.uses || 0}" min="0" title="0 = unlimited">
                        </div>
                        <div>
                            <label class="l-lab">Cooldown (turns)</label>
                            <input type="number" id="act-cooldown" class="input" style="width:100%;" value="${feat.activation.cooldown || 0}" min="0">
                        </div>
                        <div style="display:flex; align-items:center; gap:8px; padding-top:20px;">
                            <input type="checkbox" id="act-concentration" ${feat.activation.concentration ? 'checked' : ''}>
                            <label for="act-concentration" style="font-size:12px;">Concentration</label>
                        </div>
                    </div>
                </div>

                <!-- SECTION: Targeting -->
                <div class="editor-section" style="margin-bottom:24px;">
                    <h4 style="margin:0 0 12px; font-size:12px; text-transform:uppercase; color:var(--text-muted); letter-spacing:1px;">Targeting</h4>
                    <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:12px;">
                        <div>
                            <label class="l-lab">Target Type</label>
                            ${createSelect(TARGET_TYPE_OPTIONS, feat.targeting.type, 'target-type')}
                        </div>
                        <div>
                            <label class="l-lab">Range (ft)</label>
                            <input type="number" id="target-range" class="input" style="width:100%;" value="${feat.targeting.range || 0}" min="0">
                        </div>
                        <div>
                            <label class="l-lab">Area Size (ft)</label>
                            <input type="number" id="target-area-size" class="input" style="width:100%;" value="${feat.targeting.areaSize || 0}" min="0">
                        </div>
                        <div>
                            <label class="l-lab">Area Shape</label>
                            ${createSelect(AREA_SHAPE_OPTIONS, feat.targeting.areaShape, 'target-area-shape')}
                        </div>
                    </div>
                </div>

                <!-- SECTION: Effects -->
                <div class="editor-section" style="margin-bottom:24px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                        <h4 style="margin:0; font-size:12px; text-transform:uppercase; color:var(--text-muted); letter-spacing:1px;">Effects</h4>
                        <button id="add-effect-btn" class="btn btn-xs btn-ghost">+ Add Effect</button>
                    </div>
                    <div id="effects-container"></div>
                </div>

                <!-- SECTION: Description -->
                <div class="editor-section" style="margin-bottom:24px;">
                    <h4 style="margin:0 0 12px; font-size:12px; text-transform:uppercase; color:var(--text-muted); letter-spacing:1px;">Description</h4>
                    <div style="display:flex; flex-direction:column; gap:12px;">
                        <div>
                            <label class="l-lab">Short Description (for tooltips)</label>
                            <input type="text" id="feat-short-desc" class="input" style="width:100%;" value="${feat.shortDesc || ''}" placeholder="One line summary">
                        </div>
                        <div>
                            <label class="l-lab">Full Description</label>
                            <textarea id="feat-desc" class="input" style="width:100%; min-height:80px;">${feat.description || ''}</textarea>
                        </div>
                    </div>
                </div>

                <!-- Save Button -->
                <button id="save-feat-btn" class="btn btn-primary" style="width:100%;">💾 Save Changes</button>
            `;

            // Render Effects
            const effectsContainer = editorPane.querySelector('#effects-container');
            function renderEffects() {
                effectsContainer.innerHTML = '';
                feat.effects.forEach((effect, idx) => {
                    const effectDiv = document.createElement('div');
                    effectDiv.style.cssText = 'background:var(--bg-surface); padding:12px; border-radius:var(--radius-sm); margin-bottom:8px;';
                    effectDiv.innerHTML = `
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                            <span style="font-weight:bold; font-size:12px;">Effect ${idx + 1}</span>
                            ${feat.effects.length > 1 ? `<button class="btn btn-xs btn-ghost remove-effect" data-idx="${idx}" style="color:var(--status-error);">✕</button>` : ''}
                        </div>
                        <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:8px;">
                            <div>
                                <label class="l-lab" style="font-size:10px;">Effect Type</label>
                                ${createSelect(EFFECT_TYPE_OPTIONS, effect.effectType, `eff-type-${idx}`, 'font-size:11px;')}
                            </div>
                            <div>
                                <label class="l-lab" style="font-size:10px;">Damage Type</label>
                                ${createSelect(DAMAGE_TYPE_OPTIONS, effect.damageType, `eff-dmg-type-${idx}`, 'font-size:11px;')}
                            </div>
                            <div>
                                <label class="l-lab" style="font-size:10px;">Dice</label>
                                <input type="text" id="eff-dice-${idx}" class="input" style="width:100%; font-size:11px;" value="${effect.dice || ''}" placeholder="2d6+3">
                            </div>
                            <div>
                                <label class="l-lab" style="font-size:10px;">+ Stat Mod</label>
                                ${createSelect(STAT_OPTIONS, effect.stat, `eff-stat-${idx}`, 'font-size:11px;')}
                            </div>
                            <div>
                                <label class="l-lab" style="font-size:10px;">Duration (turns)</label>
                                <input type="number" id="eff-duration-${idx}" class="input" style="width:100%; font-size:11px;" value="${effect.duration || 0}" min="0">
                            </div>
                            <div>
                                <label class="l-lab" style="font-size:10px;">Save Stat</label>
                                ${createSelect(STAT_OPTIONS, effect.saveStat, `eff-save-${idx}`, 'font-size:11px;')}
                            </div>
                            <div>
                                <label class="l-lab" style="font-size:10px;">Save DC</label>
                                <input type="number" id="eff-dc-${idx}" class="input" style="width:100%; font-size:11px;" value="${effect.saveDC || 0}" min="0" title="0 = use caster DC">
                            </div>
                            <div>
                                <label class="l-lab" style="font-size:10px;">Condition</label>
                                ${createSelect(CONDITION_OPTIONS, effect.condition, `eff-condition-${idx}`, 'font-size:11px;')}
                            </div>
                        </div>
                    `;
                    effectsContainer.appendChild(effectDiv);
                });

                // Wire remove buttons
                effectsContainer.querySelectorAll('.remove-effect').forEach(btn => {
                    btn.onclick = () => {
                        feat.effects.splice(parseInt(btn.dataset.idx), 1);
                        renderEffects();
                    };
                });
            }
            renderEffects();

            // Add Effect
            editorPane.querySelector('#add-effect-btn').onclick = () => {
                feat.effects.push({ effectType: 'damage', damageType: '', dice: '', stat: '', duration: 0, saveStat: '', saveDC: 0, condition: '' });
                renderEffects();
            };

            // Save
            editorPane.querySelector('#save-feat-btn').onclick = () => {
                const feats = A.State.get().rpg.featDatabase;
                const idx = feats.findIndex(f => f.id === feat.id);

                if (idx > -1) {
                    // Gather all values
                    const updatedFeat = {
                        id: feat.id,
                        name: editorPane.querySelector('#feat-name').value,
                        type: editorPane.querySelector('#feat-type').value,
                        tags: editorPane.querySelector('#feat-tags').value.split(',').map(t => t.trim().toLowerCase()).filter(t => t),
                        requirements: {
                            level: parseInt(editorPane.querySelector('#req-level').value) || 1,
                            class: editorPane.querySelector('#req-class').value,
                            stat: editorPane.querySelector('#req-stat').value,
                            statMin: parseInt(editorPane.querySelector('#req-stat-min').value) || 0,
                            featPrereq: feat.requirements.featPrereq || ''
                        },
                        activation: {
                            actionType: editorPane.querySelector('#act-action-type').value,
                            cost: parseInt(editorPane.querySelector('#act-cost').value) || 0,
                            costType: editorPane.querySelector('#act-cost-type').value,
                            uses: parseInt(editorPane.querySelector('#act-uses').value) || 0,
                            cooldown: parseInt(editorPane.querySelector('#act-cooldown').value) || 0,
                            concentration: editorPane.querySelector('#act-concentration').checked
                        },
                        targeting: {
                            type: editorPane.querySelector('#target-type').value,
                            range: parseInt(editorPane.querySelector('#target-range').value) || 0,
                            areaSize: parseInt(editorPane.querySelector('#target-area-size').value) || 0,
                            areaShape: editorPane.querySelector('#target-area-shape').value
                        },
                        effects: [],
                        shortDesc: editorPane.querySelector('#feat-short-desc').value,
                        description: editorPane.querySelector('#feat-desc').value
                    };

                    // Gather effects
                    feat.effects.forEach((_, effIdx) => {
                        updatedFeat.effects.push({
                            effectType: editorPane.querySelector(`#eff-type-${effIdx}`).value,
                            damageType: editorPane.querySelector(`#eff-dmg-type-${effIdx}`).value,
                            dice: editorPane.querySelector(`#eff-dice-${effIdx}`).value,
                            stat: editorPane.querySelector(`#eff-stat-${effIdx}`).value,
                            duration: parseInt(editorPane.querySelector(`#eff-duration-${effIdx}`).value) || 0,
                            saveStat: editorPane.querySelector(`#eff-save-${effIdx}`).value,
                            saveDC: parseInt(editorPane.querySelector(`#eff-dc-${effIdx}`).value) || 0,
                            condition: editorPane.querySelector(`#eff-condition-${effIdx}`).value
                        });
                    });

                    feats[idx] = updatedFeat;
                    A.State.notify();
                    renderList();
                    if (A.UI.Toast) A.UI.Toast.show('Feat saved!', 'success');
                }
            };

            // Delete
            editorPane.querySelector('#delete-feat-btn').onclick = () => {
                if (!confirm(`Delete "${feat.name}"?`)) return;
                const feats = A.State.get().rpg.featDatabase;
                const idx = feats.findIndex(f => f.id === feat.id);
                if (idx > -1) {
                    feats.splice(idx, 1);
                    A.State.notify();
                    selectedFeatId = null;
                    renderList();
                    editorPane.innerHTML = '<div style="color:var(--text-muted); text-align:center; padding-top:60px;">Select a feat to edit.</div>';
                    if (A.UI.Toast) A.UI.Toast.show('Feat deleted.', 'info');
                }
            };
        }

        // Add New Feat
        header.querySelector('#add-feat-btn').onclick = () => {
            const feats = A.State.get().rpg.featDatabase;
            const newId = 'feat_' + Math.random().toString(36).substr(2, 9);
            const newFeat = {
                id: newId,
                name: 'New Feat',
                type: 'ability',
                tags: [],
                requirements: { level: 1, class: '', stat: '', statMin: 0, featPrereq: '' },
                activation: { actionType: 'action', cost: 0, costType: '', uses: 0, cooldown: 0, concentration: false },
                targeting: { type: 'enemy', range: 0, areaSize: 0, areaShape: '' },
                effects: [{ effectType: 'damage', damageType: 'physical', dice: '1d6', stat: '', duration: 0, saveStat: '', saveDC: 0, condition: '' }],
                shortDesc: '',
                description: ''
            };
            feats.push(newFeat);
            A.State.notify();
            selectedFeatId = newId;
            renderList();
            renderEditor(newFeat);
        };

        // Export Schema
        header.querySelector('#export-schema-btn').onclick = () => {
            const schemaText = JSON.stringify(FEAT_SCHEMA, null, 2);
            navigator.clipboard.writeText(schemaText);
            if (A.UI.Toast) A.UI.Toast.show('Feat schema copied to clipboard!', 'success');
        };

        renderList();
    }

    // Export schema for other scripts to reference
    if (!window.Anansi.RPG) window.Anansi.RPG = {};
    window.Anansi.RPG.FEAT_SCHEMA = FEAT_SCHEMA;
    window.Anansi.RPG.getFeat = function (featId) {
        const state = A.State.get();
        return state.rpg?.featDatabase?.find(f => f.id === featId) || null;
    };
    window.Anansi.RPG.getFeatsByTag = function (tag) {
        const state = A.State.get();
        return (state.rpg?.featDatabase || []).filter(f => f.tags?.includes(tag));
    };
    window.Anansi.RPG.getFeatsByType = function (type) {
        const state = A.State.get();
        return (state.rpg?.featDatabase || []).filter(f => f.type === type);
    };

    if (A && A.registerPanel) {
        A.registerPanel('rpg_feats', {
            label: 'Feats',
            subtitle: 'Spells & Abilities',
            category: 'RPG Experiment',
            subcategory: 'Game Master',
            order: 40,
            icon: '✨',
            render: render
        });
    }

})(window.Anansi);
