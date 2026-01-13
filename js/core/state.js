/*
 * Anansi State
 * File: js/core/state.js
 * Purpose: Single source of truth.
 */

(function (A) {
    'use strict';

    let _state = null;
    const listeners = [];

    // Default empty state factory
    function createDefault() {
        const now = new Date().toISOString();
        return {
            meta: {
                id: crypto.randomUUID(),
                name: 'Untitled Project',
                description: '',
                author: '',
                version: '1.11.0',
                createdAt: now,
                updatedAt: now
            },
            environment: {
                id: 'jai',
                adapterVersion: '1.0.0',
                config: {}
            },
            strands: {
                sources: { items: {} },
                scripts: { items: {}, order: [] }
            },
            seed: {
                name: '',
                persona: '',
                scenario: '',
                examples: ''
            },
            nodes: {
                actors: { items: {} },
                pairs: { items: {} }
            },
            weaves: {
                lorebook: { entries: {} },
                prompt: { template: '', variables: {} }
            },
            aura: {
                events: { items: {} },
                microcues: { items: {} },
                scoring: { items: {} }
            },
            traces: {
                sessions: [],
                activeSessionId: null
            },
            sim: {
                history: [],
                simMessages: [],
                chatSessions: {},  // Named sessions: { sessionName: { messages: [], savedAt: '...' } }
                activeTags: [],
                emotions: { current: 'NEUTRAL', all: [] },
                eros: { currentVibe: 0, longTerm: 0 },
                intent: 'STATEMENT',
                actors: [],
                presets: []
            },
            writersBlock: {
                mode: 'brainstorm', // 'brainstorm' | 'edit'
                genres: [],
                emphasis: [],
                selectedActors: [],
                selectedLocations: [],
                history: [],
                pinnedIds: [],
                activeBranch: 'main',
                branches: { main: { history: [] } },
                sessions: {}
            }
        };
    }

    const State = {
        get: function () {
            return _state;
        },

        set: function (newState) {
            _state = newState;
            State.notify();
        },

        // Initialize (called by IO)
        load: function (data) {
            const defaults = createDefault();
            // Simple deep merge for top-level keys
            _state = { ...defaults };
            if (data) {
                Object.keys(data).forEach(key => {
                    if (typeof data[key] === 'object' && data[key] !== null && !Array.isArray(data[key])) {
                        _state[key] = { ..._state[key], ...data[key] };
                    } else {
                        _state[key] = data[key];
                    }
                });
            }
            // Run migrations eagerly
            State.migrate();
            State.notify();
        },

        /**
         * Centralized migration runner - upgrades old data formats to current schema.
         * Called automatically on load/import.
         */
        migrate: function () {
            if (!_state) return;
            let migrated = false;

            // --- 1. Character V1 (seed) → V2 ---
            if (_state.seed && (!_state.character?.solo?.characterName && !_state.character?.solo?.selectedActorId)) {
                const seed = _state.seed;
                if (seed.name || seed.characterName || seed.persona || seed.scenario) {
                    console.log('[State.migrate] Migrating legacy seed to Character V2...');
                    _state.character = _state.character || {};
                    _state.character.activeMode = 'solo';
                    _state.character.solo = _state.character.solo || { selectedActorId: null, characterName: '', chatName: '', portrait: null, overrides: {} };
                    _state.character.solo.characterName = seed.characterName || seed.name || '';
                    _state.character.solo.chatName = seed.chatName || seed.characterName || seed.name || '';
                    if (seed.persona) {
                        _state.character.solo.overrides.personality = { content: seed.persona, dirty: true };
                    }
                    if (seed.scenario) {
                        _state.character.solo.overrides.scenario = { content: seed.scenario, dirty: true };
                    }
                    if (seed.examples) {
                        _state.character.solo.overrides.exampleDialogue = { content: seed.examples, dirty: true };
                    }
                    if (seed.portrait?.data) {
                        _state.character.solo.portrait = {
                            data: seed.portrait.data,
                            mimeType: seed.portrait.mimeType || 'image/png'
                        };
                    }
                    migrated = true;
                }
            }

            // --- 2. Actor portrait → gallery migration ---
            const actors = _state.nodes?.actors?.items;
            if (actors) {
                Object.values(actors).forEach(actor => {
                    if (actor.portrait && !actor.gallery) {
                        console.log(`[State.migrate] Migrating actor "${actor.name}" portrait to gallery...`);
                        actor.gallery = {
                            primary: 'migrated_0',
                            showNsfw: false,
                            images: [{
                                id: 'migrated_0',
                                folder: 'sfw',
                                data: actor.portrait.data,
                                mimeType: actor.portrait.mimeType || 'image/png',
                                caption: '',
                                timestamp: Date.now()
                            }]
                        };
                        actor.portrait = null;
                        migrated = true;
                    }
                });
            }

            // --- 3. WritersBlock genre → genres array ---
            const wb = _state.writersBlock;
            if (wb) {
                if (wb.genre && !wb.genres) {
                    console.log('[State.migrate] Migrating WritersBlock genre to genres array...');
                    wb.genres = [wb.genre];
                    delete wb.genre;
                    migrated = true;
                }
                if (!wb.genres) wb.genres = [];
                if (!wb.selectedActors) wb.selectedActors = [];
                if (!wb.selectedLocations) wb.selectedLocations = [];
                if (!wb.contextWindow) wb.contextWindow = 20;
                if (!wb.contextSummary) wb.contextSummary = '';
            }

            // --- 4. Ensure missing top-level structures ---
            if (!_state.character) {
                _state.character = createDefault().character;
                migrated = true;
            }
            if (!_state.writersBlock) {
                _state.writersBlock = createDefault().writersBlock;
                migrated = true;
            }

            if (migrated) {
                console.log('[State.migrate] Migrations complete.');
            }
        },

        // Reset to new project
        reset: function () {
            _state = createDefault();

            // Apply default sources from active environment
            const envId = _state.environment.id;
            if (A.Adapters && A.Adapters[envId]) {
                const defaults = A.Adapters[envId].getDefaultSources();
                defaults.forEach(src => {
                    _state.strands.sources.items[src.id] = src;
                });
            }

            State.notify();
        },

        // Subscribe to changes
        subscribe: function (callback) {
            listeners.push(callback);
            // Immediate callback
            if (_state) callback(_state);
        },

        notify: function () {
            listeners.forEach(cb => cb(_state));
        },

        // Actions
        updateMeta: function (updates) {
            if (!_state) return;
            Object.assign(_state.meta, updates, { updatedAt: new Date().toISOString() });
            State.notify();
        },

        setEnvironment: function (envId) {
            if (!_state) return;
            if (_state.environment.id !== envId) {
                _state.environment.id = envId;
                State.notify();
            }
        }
    };

    A.State = State;
    A.VERSION = '1.10.3';

})(window.Anansi);
