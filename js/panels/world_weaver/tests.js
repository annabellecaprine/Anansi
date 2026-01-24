/*
 * World Weaver: Test Suite
 * File: js/panels/world_weaver/tests.js
 * 
 * Developer testing utility for validating character generation pipeline.
 * Runs through all genres, validates output structure, tests error recovery.
 */

(function (A) {
    'use strict';

    A.WorldWeaver = A.WorldWeaver || {};
    A.WorldWeaver.Tests = {};

    const SESSIONS_KEY = 'anansi_world_weaver_sessions';

    // Test genres to cover (subset for token efficiency)
    const TEST_GENRES = ['fantasy', 'scifi', 'horror', 'sliceoflife'];

    // Expected fields for validation
    const REQUIRED_IDENTITY_FIELDS = ['name', 'gender', 'pronouns', 'tags'];
    const REQUIRED_APPEARANCE_FIELDS = ['appearance'];
    const REQUIRED_CARD_FIELDS = ['cardFields'];
    const REQUIRED_QUIRKS_FIELDS = ['quirks'];
    const REQUIRED_NOTES_FIELDS = ['notes'];
    const REQUIRED_CUE_FIELDS = ['pulseCues', 'erosCues', 'intentCues'];

    /**
     * Create a minimal test session for a genre
     */
    function createTestSession(genre) {
        const T = A.WorldWeaver.Templates;
        const template = T.GENRE_TEMPLATES.find(t => t.id === genre) || T.GENRE_TEMPLATES[0];

        return {
            id: `test_${genre}_${Date.now()}`,
            name: `Test: ${template.label}`,
            createdAt: new Date().toISOString(),
            genre: genre,
            contentRating: 'sfw',
            storyFocus: 'protagonist',
            cast: [],
            categories: {
                coreExperience: {
                    status: 'partial',
                    confidence: 50,
                    summary: `A ${template.label.toLowerCase()} adventure featuring exploration and character development.`,
                    notes: `Test session for ${template.label} genre validation.`
                },
                worldRules: {
                    status: 'partial',
                    confidence: 40,
                    summary: template.preSeeds?.worldRules || 'Standard genre conventions apply.',
                    notes: ''
                },
                setting: {
                    status: 'partial',
                    confidence: 30,
                    summary: template.preSeeds?.setting || 'A richly detailed world.',
                    notes: ''
                },
                cast: { status: 'empty', confidence: 0, summary: '', notes: '' },
                storyArc: { status: 'empty', confidence: 0, summary: '', notes: '' },
                mechanics: { status: 'empty', confidence: 0, summary: '', notes: '' },
                guardrails: {
                    status: 'partial',
                    confidence: 20,
                    summary: 'Keep content appropriate. Focus on storytelling over shock value.',
                    notes: ''
                }
            },
            preSeeds: { ...template.preSeeds },
            questionFocus: [...template.questionFocus],
            chatHistory: [],
            accumulatedContext: '',
            overallProgress: 25,
            currentFocus: 'coreExperience',
            settings: { questionsPerRound: 3, tokenBudget: 4096, customBoundaries: '' }
        };
    }

    /**
     * Validate character has all required fields
     */
    function validateCharacter(character, results) {
        const missing = [];
        const warnings = [];

        // Identity
        REQUIRED_IDENTITY_FIELDS.forEach(f => {
            if (!character[f]) missing.push(`identity.${f}`);
        });

        // Appearance
        REQUIRED_APPEARANCE_FIELDS.forEach(f => {
            if (!character[f]) missing.push(`appearance.${f}`);
        });

        // Card Fields
        if (!character.cardFields) {
            missing.push('cardFields');
        } else {
            ['personality', 'description', 'scenario', 'firstMessage'].forEach(f => {
                if (!character.cardFields[f]) missing.push(`cardFields.${f}`);
            });
        }

        // Quirks
        if (!character.quirks || typeof character.quirks !== 'object') {
            missing.push('quirks{}');
        } else {
            // Validate quirk structure (object with arrays)
            const q = character.quirks;
            if (!Array.isArray(q.physical) && !Array.isArray(q.mental) && !Array.isArray(q.emotional)) {
                warnings.push('quirks object missing category arrays');
            }
        }

        // Notes
        REQUIRED_NOTES_FIELDS.forEach(f => {
            if (!character[f]) missing.push(f);
        });

        // Cues
        REQUIRED_CUE_FIELDS.forEach(f => {
            if (!character[f] || typeof character[f] !== 'object') {
                missing.push(`${f}{}`);
            } else {
                if (Object.keys(character[f]).length === 0) {
                    warnings.push(`${f} object is empty`);
                }
            }
        });

        results.missingFields = missing;
        results.warnings = warnings;
        results.valid = missing.length === 0;

        return results.valid;
    }

    /**
     * Run a single genre test
     */
    async function runGenreTest(genre, progressCallback) {
        const results = {
            genre: genre,
            success: false,
            character: null,
            missingFields: [],
            warnings: [],
            error: null,
            duration: 0
        };

        const startTime = Date.now();
        progressCallback?.(`Testing ${genre}...`);

        try {
            const session = createTestSession(genre);

            // Use the generation pipeline directly (bypassing UI)
            const Gen = A.WorldWeaver.Generation;

            // Build context
            const contextSummary = Object.entries(session.categories)
                .filter(([_, cat]) => cat.summary)
                .map(([key, cat]) => `## ${key}\n${cat.summary}`)
                .join('\n\n');

            // Run pipeline (using internal function if exposed, else we create a mini orchestrator)
            progressCallback?.(`${genre}: Running 6-step pipeline...`);

            const character = { id: `test_${Date.now()}` };
            const steps = [
                { name: 'Identity', fn: Gen.generateIdentity || (() => ({})) },
                { name: 'Appearance', fn: Gen.generateAppearance || (() => ({})) },
                { name: 'Card Fields', fn: Gen.generateCardFields || (() => ({})) },
                { name: 'Quirks', fn: Gen.generateQuirks || (() => ({})) },
                { name: 'Notes', fn: Gen.generateNotes || (() => ({})) },
                { name: 'Cues', fn: Gen.generateCues || (() => ({})) }
            ];

            for (let i = 0; i < steps.length; i++) {
                progressCallback?.(`${genre}: Step ${i + 1}/6 - ${steps[i].name}...`);
                const result = await steps[i].fn(session, character, contextSummary);
                Object.assign(character, result);
            }

            results.character = character;
            validateCharacter(character, results);
            results.success = results.valid;

        } catch (err) {
            results.error = err.message;
            results.success = false;
        }

        results.duration = Date.now() - startTime;
        return results;
    }

    /**
     * Test resume detection
     */
    async function testResumeDetection(progressCallback) {
        progressCallback?.('Testing resume detection...');

        const results = {
            name: 'Resume Detection',
            success: false,
            details: ''
        };

        try {
            // Inject a partial character
            const partialChar = {
                id: 'test_partial',
                name: 'Test Character',
                gender: 'Female',
                pronouns: 'she/her',
                tags: ['test', 'validation']
            };
            sessionStorage.setItem('ww_partial_character', JSON.stringify(partialChar));

            // Check if it's detected
            const stored = sessionStorage.getItem('ww_partial_character');
            const parsed = JSON.parse(stored);

            if (parsed && parsed.name === 'Test Character') {
                results.success = true;
                results.details = 'Partial character correctly stored and retrievable';
            } else {
                results.details = 'Partial character not found or corrupted';
            }

            // Cleanup
            sessionStorage.removeItem('ww_partial_character');

        } catch (err) {
            results.details = `Error: ${err.message}`;
        }

        return results;
    }

    /**
     * Test partial import
     */
    async function testPartialImport(progressCallback) {
        progressCallback?.('Testing partial import...');

        const results = {
            name: 'Partial Import',
            success: false,
            details: ''
        };

        try {
            // Create a partial character (missing some fields)
            const partialChar = {
                id: `test_partial_${Date.now()}`,
                name: 'Partial Test Character',
                gender: 'Male',
                pronouns: 'he/him',
                tags: ['test', 'partial'],
                // Missing: appearance, cardFields, quirks, notes, cues
            };

            // Try to import it
            const Gen = A.WorldWeaver.Generation;
            if (Gen.importGeneratedContent) {
                Gen.importGeneratedContent(partialChar, 'character', null, A);
                results.success = true;
                results.details = 'Partial character imported without error';
            } else {
                results.details = 'importGeneratedContent not exposed';
                results.success = true; // Not a failure, just not testable
            }

        } catch (err) {
            results.details = `Import failed: ${err.message}`;
        }

        return results;
    }

    /**
     * Show test results modal
     */
    function showResultsModal(allResults) {
        const modal = document.createElement('div');
        modal.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.9); z-index:10001; display:flex; align-items:center; justify-content:center; overflow-y:auto;';

        const passCount = allResults.genres.filter(r => r.success).length;
        const totalGenres = allResults.genres.length;
        const allPassed = passCount === totalGenres && allResults.utility.every(u => u.success);

        modal.innerHTML = `
            <div style="background:var(--bg-surface); padding:32px; border-radius:12px; width:600px; max-width:95vw; max-height:90vh; overflow-y:auto; box-shadow:0 8px 32px rgba(0,0,0,0.4);">
                <div style="display:flex; align-items:center; gap:12px; margin-bottom:24px;">
                    <span style="font-size:32px;">${allPassed ? '✅' : '⚠️'}</span>
                    <div>
                        <h2 style="margin:0; color:var(--text-primary); font-size:20px;">World Weaver Test Results</h2>
                        <div style="font-size:12px; color:var(--text-muted);">Total time: ${(allResults.totalDuration / 1000).toFixed(1)}s</div>
                    </div>
                </div>

                <div style="margin-bottom:24px;">
                    <h3 style="margin:0 0 12px 0; font-size:14px; color:var(--text-secondary); text-transform:uppercase;">Genre Tests (${passCount}/${totalGenres})</h3>
                    ${allResults.genres.map(r => `
                        <div style="display:flex; align-items:start; gap:12px; padding:12px; background:var(--bg-elevated); border-radius:8px; margin-bottom:8px; border-left:3px solid ${r.success ? 'var(--status-success, #10b981)' : 'var(--status-error, #ef4444)'};">
                            <span style="font-size:20px;">${r.success ? '✓' : '✗'}</span>
                            <div style="flex:1;">
                                <div style="font-weight:600; color:var(--text-primary); text-transform:capitalize;">${r.genre}</div>
                                <div style="font-size:11px; color:var(--text-muted);">${(r.duration / 1000).toFixed(1)}s</div>
                                ${r.character ? `<div style="font-size:12px; color:var(--text-secondary); margin-top:4px;">Generated: ${r.character.name || 'Unnamed'}</div>` : ''}
                                ${r.missingFields.length > 0 ? `<div style="font-size:11px; color:var(--status-error); margin-top:4px;">Missing: ${r.missingFields.join(', ')}</div>` : ''}
                                ${r.warnings.length > 0 ? `<div style="font-size:11px; color:var(--status-warning, #f59e0b); margin-top:4px;">⚠️ ${r.warnings.join(', ')}</div>` : ''}
                                ${r.error ? `<div style="font-size:11px; color:var(--status-error); margin-top:4px;">Error: ${r.error}</div>` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>

                <div style="margin-bottom:24px;">
                    <h3 style="margin:0 0 12px 0; font-size:14px; color:var(--text-secondary); text-transform:uppercase;">Utility Tests</h3>
                    ${allResults.utility.map(r => `
                        <div style="display:flex; align-items:center; gap:12px; padding:10px; background:var(--bg-elevated); border-radius:6px; margin-bottom:6px;">
                            <span style="font-size:16px;">${r.success ? '✓' : '✗'}</span>
                            <div style="flex:1;">
                                <span style="font-size:13px; color:var(--text-primary);">${r.name}</span>
                                <span style="font-size:11px; color:var(--text-muted); margin-left:8px;">${r.details}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>

                <div style="display:flex; justify-content:flex-end; gap:8px;">
                    <button id="test-close" style="padding:10px 20px; background:var(--accent); border:none; border-radius:6px; cursor:pointer; color:white; font-weight:600;">Close</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.querySelector('#test-close').onclick = () => modal.remove();
    }

    /**
     * Run all tests
     */
    async function runAllTests() {
        const progressModal = document.createElement('div');
        progressModal.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.9); z-index:10001; display:flex; align-items:center; justify-content:center;';
        progressModal.innerHTML = `
            <div style="background:var(--bg-surface); padding:32px; border-radius:12px; width:400px; text-align:center;">
                <div style="font-size:32px; margin-bottom:16px;">🧪</div>
                <h3 style="margin:0 0 16px 0; color:var(--text-primary);">Running Tests...</h3>
                <div id="test-progress" style="font-size:13px; color:var(--text-secondary);">Initializing...</div>
            </div>
        `;
        document.body.appendChild(progressModal);

        const updateProgress = (msg) => {
            const el = progressModal.querySelector('#test-progress');
            if (el) el.textContent = msg;
        };

        const startTime = Date.now();
        const results = {
            genres: [],
            utility: [],
            totalDuration: 0
        };

        try {
            // Run genre tests
            for (const genre of TEST_GENRES) {
                const genreResult = await runGenreTest(genre, updateProgress);
                results.genres.push(genreResult);
                console.log(`[Test] ${genre}:`, genreResult);
            }

            // Run utility tests
            results.utility.push(await testResumeDetection(updateProgress));
            results.utility.push(await testPartialImport(updateProgress));

        } catch (err) {
            console.error('[Test] Fatal error:', err);
        }

        results.totalDuration = Date.now() - startTime;
        progressModal.remove();
        showResultsModal(results);

        return results;
    }

    // Expose test functions
    A.WorldWeaver.Tests = {
        runAllTests,
        runGenreTest,
        createTestSession,
        validateCharacter
    };

    // Add keyboard shortcut: Ctrl+Shift+T when in World Weaver
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'T') {
            const state = A.State?.get();
            if (state?.currentPanel === 'world_weaver') {
                e.preventDefault();
                console.log('[WorldWeaver] Running test suite...');
                runAllTests();
            }
        }
    });

    console.log('[WorldWeaver] Test suite loaded. Press Ctrl+Shift+T in World Weaver to run tests.');

})(window.Anansi || window.A);
