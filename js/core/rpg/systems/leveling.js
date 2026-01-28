/**
 * Anansi Plugin: RPG Leveling System
 * File: js/plugins/rpg/rpg_leveling.js
 * 
 * Purpose: Manages XP thresholds, level-up detection, and automatic
 * class progression application with Toast notifications.
 */

(function (A) {
    'use strict';

    const LOG_PREFIX = '[RPG Leveling]';

    if (!window.RPG) window.RPG = {};

    // ===========================================
    // XP THRESHOLD PRESETS
    // ===========================================

    const XP_PRESETS = {
        linear: {
            name: 'Linear (100 × Level)',
            description: 'Simple progression: 100, 200, 300...',
            calculate: (level) => level * 100
        },
        exponential: {
            name: 'Exponential (1.5× per level)',
            description: 'Faster scaling: 100, 150, 225...',
            calculate: (level) => Math.floor(100 * Math.pow(1.5, level - 1))
        },
        dnd5e: {
            name: 'D&D 5e',
            description: 'Official D&D 5th Edition XP table',
            table: [0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000,
                85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000],
            calculate: function (level) {
                return this.table[Math.min(level - 1, this.table.length - 1)] || 0;
            }
        },
        slow: {
            name: 'Slow (200 × Level²)',
            description: 'Grindy progression for longer campaigns',
            calculate: (level) => 200 * level * level
        },
        custom: {
            name: 'Custom',
            description: 'Define your own XP thresholds',
            calculate: null // Uses custom table
        }
    };

    const Leveling = {

        /**
         * Get current leveling configuration
         * @returns {Object} Leveling config from state
         */
        getConfig: function () {
            const state = A.State.get();
            if (!state.rpg) state.rpg = {};
            if (!state.rpg.levelingConfig) {
                state.rpg.levelingConfig = {
                    preset: 'dnd5e',
                    maxLevel: 20,
                    customThresholds: {} // level -> xp required
                };
            }
            return state.rpg.levelingConfig;
        },

        /**
         * Set leveling preset
         * @param {string} presetId - Preset ID
         */
        setPreset: function (presetId) {
            const config = this.getConfig();
            config.preset = presetId;
            A.State.notify();
            console.log(LOG_PREFIX, `Preset set to: ${presetId}`);
        },

        /**
         * Set custom XP threshold for a level
         * @param {number} level - Level number
         * @param {number} xp - XP required for this level
         */
        setCustomThreshold: function (level, xp) {
            const config = this.getConfig();
            config.customThresholds[level] = xp;
            A.State.notify();
        },

        /**
         * Get XP required for a specific level
         * @param {number} level - Target level
         * @returns {number} XP required
         */
        getXPForLevel: function (level) {
            const config = this.getConfig();
            const preset = XP_PRESETS[config.preset] || XP_PRESETS.dnd5e;

            if (config.preset === 'custom' && config.customThresholds[level] !== undefined) {
                return config.customThresholds[level];
            }

            if (preset.calculate) {
                return preset.calculate(level);
            }

            return level * 100; // Fallback
        },

        /**
         * Calculate what level a character should be based on XP
         * @param {number} xp - Current XP
         * @returns {number} Level the character should be
         */
        getLevelForXP: function (xp) {
            const config = this.getConfig();
            const maxLevel = config.maxLevel || 20;

            for (let level = maxLevel; level >= 1; level--) {
                if (xp >= this.getXPForLevel(level)) {
                    return level;
                }
            }
            return 1;
        },

        /**
         * Check if an actor should level up and process it
         * @param {Object} actor - Actor to check
         * @returns {boolean} True if leveled up
         */
        checkLevelUp: function (actor) {
            if (!actor?.data?.rpg) return false;

            const rpg = actor.data.rpg;
            const currentLevel = rpg.level || 1;
            const currentXP = rpg.xp || 0;
            const expectedLevel = this.getLevelForXP(currentXP);

            if (expectedLevel > currentLevel) {
                // Level up!
                for (let level = currentLevel + 1; level <= expectedLevel; level++) {
                    this.applyLevelUp(actor, level);
                }
                return true;
            }
            return false;
        },

        /**
         * Check all party members for level ups
         */
        checkPartyLevelUps: function () {
            const state = A.State.get();
            const actors = state.nodes?.actors?.items || {};

            for (const id in actors) {
                const actor = actors[id];
                if (actor.data?.rpg?.enabled && actor.data.rpg.type !== 'monster') {
                    this.checkLevelUp(actor);
                }
            }
        },

        /**
         * Apply level-up bonuses from class progression
         * @param {Object} actor - Actor leveling up
         * @param {number} newLevel - New level reached
         */
        applyLevelUp: function (actor, newLevel) {
            const rpg = actor.data.rpg;
            const oldLevel = rpg.level || 1;
            rpg.level = newLevel;

            console.log(LOG_PREFIX, `${actor.name} leveled up from ${oldLevel} to ${newLevel}!`);

            // Get class progression
            const classId = rpg.classId;
            if (classId) {
                const state = A.State.get();
                const classes = state.rpg?.classes || [];
                const cls = classes.find(c => c.id === classId);

                if (cls?.progression) {
                    // Find progression entry for this level
                    const progression = cls.progression.find(p => p.level === newLevel);

                    if (progression) {
                        // Apply stat bonuses
                        if (progression.statBonus) {
                            if (!rpg.stats) rpg.stats = {};
                            for (const [stat, bonus] of Object.entries(progression.statBonus)) {
                                rpg.stats[stat] = (rpg.stats[stat] || 10) + bonus;
                                console.log(LOG_PREFIX, `  +${bonus} ${stat}`);
                            }
                        }

                        // Apply HP increase (CON modifier + base)
                        const hitDie = cls.hitDie || 8;
                        const conMod = Math.floor(((rpg.stats?.CON || 10) - 10) / 2);
                        const hpGain = Math.floor(hitDie / 2) + 1 + conMod;
                        rpg.maxHp = (rpg.maxHp || 10) + hpGain;
                        rpg.hp = (rpg.hp || 10) + hpGain; // Also heal the amount gained
                        console.log(LOG_PREFIX, `  +${hpGain} Max HP`);

                        // Apply feats
                        if (progression.feats && progression.feats.length > 0) {
                            if (!rpg.feats) rpg.feats = [];
                            progression.feats.forEach(featId => {
                                if (!rpg.feats.includes(featId)) {
                                    rpg.feats.push(featId);
                                    console.log(LOG_PREFIX, `  Gained feat: ${featId}`);
                                }
                            });
                        }

                        // Toast with progression description
                        const desc = progression.description || `Level ${newLevel} reached!`;
                        this.showLevelUpToast(actor.name, newLevel, desc, cls.icon || '⬆️');
                    } else {
                        // No specific progression entry, just basic level up
                        const hitDie = cls.hitDie || 8;
                        const conMod = Math.floor(((rpg.stats?.CON || 10) - 10) / 2);
                        const hpGain = Math.floor(hitDie / 2) + 1 + conMod;
                        rpg.maxHp = (rpg.maxHp || 10) + hpGain;
                        rpg.hp = (rpg.hp || 10) + hpGain;

                        this.showLevelUpToast(actor.name, newLevel, 'Level Up!', cls.icon || '⬆️');
                    }
                } else {
                    // No class, just basic level up
                    const hpGain = 5;
                    rpg.maxHp = (rpg.maxHp || 10) + hpGain;
                    rpg.hp = (rpg.hp || 10) + hpGain;
                    this.showLevelUpToast(actor.name, newLevel, 'Level Up!', '⬆️');
                }
            } else {
                // No class assigned
                const hpGain = 5;
                rpg.maxHp = (rpg.maxHp || 10) + hpGain;
                rpg.hp = (rpg.hp || 10) + hpGain;
                this.showLevelUpToast(actor.name, newLevel, 'Level Up!', '⬆️');
            }

            // Emit event
            const engine = A.RPGEngine || (window.RPG && window.RPG.Engine);
            if (engine && engine.emit) {
                engine.emit('level_up', { actor, newLevel, oldLevel });
            }

            A.State.notify();
        },

        /**
         * Show level-up Toast notification
         * @param {string} actorName 
         * @param {number} level 
         * @param {string} description 
         * @param {string} icon 
         */
        showLevelUpToast: function (actorName, level, description, icon) {
            if (A.UI?.Toast) {
                A.UI.Toast.show(
                    `${icon} **${actorName}** reached Level ${level}! ${description}`,
                    'success',
                    5000 // Show for 5 seconds
                );
            }

            // Also log to chat
            const chatLog = document.getElementById('rpg-chat-log');
            if (chatLog) {
                const div = document.createElement('div');
                div.className = 'msg-system';
                div.style.cssText = 'padding:8px; background:linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%); border-radius:6px; margin:8px 0; font-size:13px; color:white; text-align:center;';
                div.innerHTML = `${icon} <strong>${actorName}</strong> reached <strong>Level ${level}</strong>!<br><span style="font-size:11px; opacity:0.9;">${description}</span>`;
                chatLog.appendChild(div);
                chatLog.scrollTop = chatLog.scrollHeight;
            }
        },

        /**
         * Award XP to party and check for level ups
         * @param {number} amount - XP to award
         */
        awardXP: function (amount) {
            const state = A.State.get();
            const actors = state.nodes?.actors?.items || {};

            // Award to all party members
            for (const id in actors) {
                const actor = actors[id];
                if (actor.data?.rpg?.enabled && actor.data.rpg.type !== 'monster') {
                    actor.data.rpg.xp = (actor.data.rpg.xp || 0) + amount;
                    this.checkLevelUp(actor);
                }
            }

            A.State.notify();
        },

        /**
         * Get available presets
         * @returns {Object} Presets map
         */
        getPresets: function () {
            return XP_PRESETS;
        },

        /**
         * Get XP table for display (levels 1-20)
         * @returns {Array} Array of {level, xp} objects
         */
        getXPTable: function () {
            const config = this.getConfig();
            const table = [];

            for (let level = 1; level <= (config.maxLevel || 20); level++) {
                table.push({
                    level: level,
                    xp: this.getXPForLevel(level)
                });
            }

            return table;
        }
    };

    // Export
    window.RPG.Leveling = Leveling;
    A.RPGLeveling = Leveling;

    console.log(LOG_PREFIX, 'Initialized');

})(window.Anansi);
