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
                version: '1.0.0',
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
            State.notify();
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

})(window.Anansi);
