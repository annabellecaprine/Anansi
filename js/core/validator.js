/*
 * Anansi Validator
 * File: js/core/validator.js
 * Purpose: Validation pipeline and issue tracking.
 */

(function (A) {
    'use strict';

    const rules = [];

    const Validator = {
        // Register a validation rule
        // fn(state) -> { id, severity: 'error'|'warn'|'info', message, location? } | null | []
        registerRule: function (fn) {
            rules.push(fn);
            console.log('[Validator] Rule registered.');
        },

        // Run all rules against the state
        run: function (state) {
            if (!state) return [];

            console.log('[Validator] Running pipeline...');
            const issues = [];

            rules.forEach(rule => {
                try {
                    const result = rule(state);
                    if (Array.isArray(result)) {
                        issues.push(...result);
                    } else if (result) {
                        issues.push(result);
                    }
                } catch (e) {
                    console.error('[Validator] Rule crashed:', e);
                    issues.push({
                        id: 'validator.crash',
                        severity: 'error',
                        message: 'A validation rule crashed: ' + e.message
                    });
                }
            });

            return issues;
        },

        // Standard Rules
        initStandardRules: function () {
            // Rule: Check Project Name
            Validator.registerRule(state => {
                if (!state.meta.name || state.meta.name.trim() === '') {
                    return {
                        id: 'meta.name.missing',
                        severity: 'error',
                        message: 'Project name is required.',
                        location: 'Project Panel'
                    };
                }
                if (state.meta.name === 'Untitled Project') {
                    return {
                        id: 'meta.name.default',
                        severity: 'info',
                        message: 'Project is still named "Untitled Project".',
                        location: 'Project Panel'
                    };
                }
            });

            // Rule: Check Environment
            Validator.registerRule(state => {
                if (!state.environment.id) {
                    return {
                        id: 'env.missing',
                        severity: 'error',
                        message: 'No environment selected.',
                        location: 'Project Panel'
                    };
                }
            });
        }
    };

    A.Validator = Validator;

    // Initialize standard rules immediately
    Validator.initStandardRules();

})(window.Anansi);
