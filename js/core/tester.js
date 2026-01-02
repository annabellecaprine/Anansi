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

            // 2. Load Scripts
            const scripts = A.Scripts.getAll();
            if (scripts.length === 0) {
                Tester.log('warn', 'No enabled scripts found.');
            }

            // 3. Execute Scripts
            scripts.forEach(script => {
                if (!script.enabled) return;

                Tester.log('system', `Executing: ${script.name}`);

                try {
                    // Construct the function
                    // We wrap in a function that takes 'console' as argument to shadow the global console
                    const fn = new Function('console', 'state', `
            try {
              ${script.source.code}
            } catch(e) {
              console.error(e.message);
              throw e;
            }
          `);

                    // Run it
                    fn(sandboxConsole, state);

                } catch (e) {
                    Tester.log('error', `Script Crash (${script.name}): ${e.message}`, e);
                }
            });

            Tester.log('system', 'Simulation Ended');
        }
    };

    A.Tester = Tester;

})(window.Anansi);
