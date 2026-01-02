/*
 * Anansi Flow Logger
 * File: js/core/flow-logger.js
 * Purpose: Simple execution logging for rule evaluation debugging
 */

(function (A) {
    'use strict';

    A.FlowLogger = {
        currentTurn: null,

        /**
         * Start logging for a new turn
         */
        startTurn(turnNumber, message) {
            this.currentTurn = {
                turn: turnNumber,
                message: message,
                timestamp: new Date().toISOString(),
                entries: []
            };
        },

        /**
         * Log a rule evaluation result
         * @param {Object} entry - { name, type, passed, reason }
         */
        log(entry) {
            if (!this.currentTurn) return;
            this.currentTurn.entries.push({
                name: entry.name || 'Unknown',
                type: entry.type || 'unknown', // lorebook, scoring, advanced, voice, event
                passed: !!entry.passed,
                reason: entry.reason || ''
            });
        },

        /**
         * End current turn and save to state
         */
        endTurn() {
            if (!this.currentTurn) return;

            const state = A.State.get();
            if (!state.sim) state.sim = {};
            if (!state.sim.executionLog) state.sim.executionLog = [];

            state.sim.executionLog.push(this.currentTurn);

            // Limit to last 20 turns
            if (state.sim.executionLog.length > 20) {
                state.sim.executionLog = state.sim.executionLog.slice(-20);
            }

            this.currentTurn = null;
        },

        /**
         * Clear all logged turns
         */
        clearLog() {
            const state = A.State.get();
            if (state.sim) {
                state.sim.executionLog = [];
            }
        },

        /**
         * Get the execution log
         */
        getLog() {
            const state = A.State.get();
            return state.sim?.executionLog || [];
        }
    };

})(window.Anansi);
