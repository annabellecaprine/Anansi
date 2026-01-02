/*
 * Anansi Core: Tester
 * File: js/core/tester.js
 * Purpose: Logic Simulation and Trace Logging.
 */

(function (A) {
    'use strict';

    let traceLog = [];
    const listeners = [];

    const Tester = {
        // --- Trace Management ---

        // Add a log entry
        log: function (type, message, context) {
            const entry = {
                id: Math.random().toString(36).substr(2, 9),
                timestamp: new Date().toISOString(),
                type: type, // 'info' | 'warn' | 'error' | 'system'
                message: message,
                context: context
            };
            traceLog.push(entry);
            Tester._notify();
        },

        clear: function () {
            traceLog = [];
            Tester._notify();
        },

        getTrace: function () {
            return traceLog;
        },

        subscribe: function (cb) {
            listeners.push(cb);
        },

        _notify: function () {
            listeners.forEach(cb => cb(traceLog));
        },

        // --- Simulation Engine ---

        // Run the full project simulation
        run: function () {
            Tester.clear();
            Tester.log('system', 'Simulation Started');

            const state = A.State.get();
            if (!state) {
                Tester.log('error', 'No state loaded.');
                return;
            }

            // 1. Prepare Sandbox
            // We will mock the 'window' and 'console' for the scripts
            const sandboxConsole = {
                log: (...args) => Tester.log('info', args.join(' ')),
                warn: (...args) => Tester.log('warn', args.join(' ')),
                error: (...args) => Tester.log('error', args.join(' '))
            };

            // 2. Build context object that AURA scripts expect
            const char = state.character?.char || {};
            const context = {
                character: {
                    name: char.name || 'Character',
                    personality: char.personality || '',
                    scenario: char.scenario || '',
                    example_dialogue: char.example_dialogue || ''
                },
                chat: state.sim?.history?.map(m => ({
                    is_user: m.role === 'user',
                    mes: m.content || ''
                })) || [],
                tags: state.sim?.activeTags || []
            };

            // 3. Load Scripts
            const scripts = A.Scripts.getAll();
            if (scripts.length === 0) {
                Tester.log('warn', 'No enabled scripts found.');
            }

            // 4. Execute Scripts
            scripts.forEach(script => {
                if (!script.enabled) return;

                Tester.log('system', `Executing: ${script.name}`);

                try {
                    // Construct the function with context available
                    const fn = new Function('console', 'state', 'context', `
            try {
              ${script.source.code}
            } catch(e) {
              console.error(e.message);
              throw e;
            }
          `);

                    // Run it with context
                    fn(sandboxConsole, state, context);

                } catch (e) {
                    Tester.log('error', `Script Crash (${script.name}): ${e.message}`, e);
                }
            });

            Tester.log('system', 'Simulation Ended');
        }
    };

    A.Tester = Tester;

})(window.Anansi);
