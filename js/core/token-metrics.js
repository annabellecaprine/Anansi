/*
 * Anansi Token Metrics Service
 * File: js/core/token-metrics.js
 * Purpose: Centralized token calculation with categorization
 */

(function (A) {
    'use strict';

    A.TokenMetrics = {
        /**
         * Get comprehensive token breakdown for the entire project
         * @returns {Object} Token metrics by category
         */
        getBreakdown: function () {
            const state = A.State.get();
            const ratio = state.sim?.tokenRatio || 4;

            return {
                permanent: this.getPermanent(state, ratio),
                temporary: this.getTemporary(state, ratio),
                injectable: this.getInjectable(state, ratio),
                total: 0 // Calculated below
            };
        },

        /**
         * Calculate Permanent tokens (sent every turn)
         */
        getPermanent: function (state, ratio) {
            const content = {
                personality: state.seed?.persona || '',
                scenario: state.seed?.scenario || ''
            };

            const chars = content.personality.length + content.scenario.length;
            const tokens = Math.ceil(chars / ratio);

            return {
                chars,
                tokens,
                breakdown: {
                    personality: {
                        chars: content.personality.length,
                        tokens: Math.ceil(content.personality.length / ratio)
                    },
                    scenario: {
                        chars: content.scenario.length,
                        tokens: Math.ceil(content.scenario.length / ratio)
                    }
                }
            };
        },

        /**
         * Calculate Temporary tokens (sent initially only)
         */
        getTemporary: function (state, ratio) {
            const examples = state.seed?.examples || '';
            const chars = examples.length;
            const tokens = Math.ceil(chars / ratio);

            return {
                chars,
                tokens,
                breakdown: {
                    examples: {
                        chars: examples.length,
                        tokens: Math.ceil(examples.length / ratio)
                    }
                }
            };
        },

        /**
         * Calculate Injectable tokens (conditionally sent)
         */
        getInjectable: function (state, ratio) {
            let totalChars = 0;
            const breakdown = {};

            // Actors (appearance + cues)
            const actors = Object.values(state.nodes?.actors?.items || {});
            let actorChars = 0;
            actors.forEach(a => {
                // Appearance description
                if (a.appearance?.description) actorChars += a.appearance.description.length;

                // Pulse cues
                if (a.pulseCues) {
                    Object.values(a.pulseCues).forEach(cue => {
                        ['basic', 'ears', 'tail', 'wings', 'horns'].forEach(part => {
                            if (cue[part]) actorChars += cue[part].length;
                        });
                    });
                }

                // Eros cues
                if (a.erosCues) {
                    Object.values(a.erosCues).forEach(cue => {
                        ['basic', 'ears', 'tail', 'wings', 'horns'].forEach(part => {
                            if (cue[part]) actorChars += cue[part].length;
                        });
                    });
                }

                // Intent cues
                if (a.intentCues) {
                    Object.values(a.intentCues).forEach(cue => {
                        ['basic', 'ears', 'tail', 'wings', 'horns'].forEach(part => {
                            if (cue[part]) actorChars += cue[part].length;
                        });
                    });
                }
            });
            breakdown.actors = { chars: actorChars, tokens: Math.ceil(actorChars / ratio) };
            totalChars += actorChars;

            // Lorebook
            const loreEntries = Object.values(state.weaves?.lorebook?.entries || {});
            let loreChars = 0;
            loreEntries.forEach(e => {
                if (e.content) loreChars += e.content.length;
                // Shifts
                (e.shifts || []).forEach(s => {
                    if (s.content) loreChars += s.content.length;
                });
            });
            breakdown.lorebook = { chars: loreChars, tokens: Math.ceil(loreChars / ratio) };
            totalChars += loreChars;

            // Pairs (Relationships)
            const pairs = Object.values(state.nodes?.pairs?.items || {});
            let pairChars = 0;
            pairs.forEach(p => {
                if (p.content) pairChars += p.content.length;
                (p.shifts || []).forEach(s => {
                    if (s.content) pairChars += s.content.length;
                });
            });
            breakdown.pairs = { chars: pairChars, tokens: Math.ceil(pairChars / ratio) };
            totalChars += pairChars;

            // Voices
            const voices = state.weaves?.voices?.voices || [];
            let voiceChars = 0;
            voices.forEach(v => {
                if (v.baselineRail) voiceChars += v.baselineRail.length;
                if (v.cadenceRail) voiceChars += v.cadenceRail.length;
                (v.subtones || []).forEach(st => {
                    if (st.rail) voiceChars += st.rail.length;
                });
            });
            breakdown.voices = { chars: voiceChars, tokens: Math.ceil(voiceChars / ratio) };
            totalChars += voiceChars;

            // Events
            const events = Object.values(state.aura?.events?.items || {});
            const probGroups = state.aura?.probability?.groups || [];
            let eventChars = 0;
            events.forEach(e => {
                if (e.effect) eventChars += e.effect.length;
            });
            probGroups.forEach(g => {
                (g.items || []).forEach(i => {
                    if (i.text) eventChars += i.text.length;
                });
            });
            breakdown.events = { chars: eventChars, tokens: Math.ceil(eventChars / ratio) };
            totalChars += eventChars;

            // Advanced (Custom Rules)
            const rules = state.sbx?.rules || [];
            let advChars = 0;
            rules.forEach(r => {
                (r.chain || []).forEach(block => {
                    (block.actions || []).forEach(a => {
                        if (a.text) advChars += a.text.length;
                    });
                });
            });
            breakdown.advanced = { chars: advChars, tokens: Math.ceil(advChars / ratio) };
            totalChars += advChars;

            // Scoring
            const scoringTopics = state.scoring?.topics || [];
            const scoringAdv = state.scoring?.advanced || [];
            let scoringChars = 0;
            scoringTopics.forEach(t => {
                if (t.contextField) scoringChars += t.contextField.length;
            });
            scoringAdv.forEach(a => {
                if (a.contextField) scoringChars += a.contextField.length;
            });
            breakdown.scoring = { chars: scoringChars, tokens: Math.ceil(scoringChars / ratio) };
            totalChars += scoringChars;

            return {
                chars: totalChars,
                tokens: Math.ceil(totalChars / ratio),
                breakdown
            };
        }
    };

})(window.Anansi);
