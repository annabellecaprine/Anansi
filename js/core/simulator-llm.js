/*
 * Anansi Simulator - LLM Client & Logic Engine
 * File: js/core/simulator-llm.js
 * Purpose: Core simulation logic (processRound), LLM API client, and diff calculation.
 * Extracted from simulator.js for better maintainability.
 */

(function (A) {
    'use strict';

    // --- CORE LOGIC: THE ROUND ---
    function processRound(userText, history, phase = 'input', params = {}) {
        try {
            const state = A.State.get();
            const logs = [];

            // 1. ACTION 2: RESET WRITABLE FIELDS (Build Context from Source of Truth)
            // Resolve Sources
            const definedSources = (state.strands && state.strands.sources && state.strands.sources.items) ? state.strands.sources.items : {};
            const rawSources = {};

            // Merge keys
            const allSourceKeys = new Set([
                ...Object.keys(definedSources),
                ...Object.keys(state.sim.simSources || {}),
                'character.name', 'character.personality', 'character.scenario', 'user.name'
            ]);

            allSourceKeys.forEach(key => {
                const src = definedSources[key] || { id: key, defaultValue: '' };
                let val = state.sim?.simSources?.[key]; // Priority 1: Sim

                if (!val) { // Priority 2: Compiled V2 > Seed V1
                    const compiled = state.character?.compiled;

                    if (compiled) {
                        if (key === 'character.name' || key === 'name') val = compiled.name;
                        else if (key === 'character.personality' || key === 'personality') val = compiled.personality;
                        else if (key === 'character.scenario' || key === 'scenario') val = compiled.scenario;
                        else if (key === 'character.exampleDialogs' || key === 'example') val = compiled.examples;
                    }

                    if (!val) { // Fallback to Legacy Seed
                        if (!state.seed) state.seed = {}; // Safeguard
                        if (key === 'character.name' || key === 'name') val = state.seed.name || state.seed.characterName;
                        else if (key === 'character.personality' || key === 'personality') val = state.seed.persona;
                        else if (key === 'character.scenario' || key === 'scenario') val = state.seed.scenario;
                        else if (key === 'character.examples' || key === 'example') val = state.seed.examples;
                    }

                    // User Name override
                    if (key === 'user.name' && !val) val = state.meta?.author || 'User';
                }
                if (!val && val !== '') val = src.defaultValue; // Priority 3: Default
                rawSources[key] = val || '';
            });

            // Construct Chat History with Legacy Support
            const chatHistory = history.map(m => {
                const txt = m.content || '';
                return {
                    role: m.role,
                    content: txt,
                    mes: txt,      // Lorebook Legacy
                    message: txt,  // SBX Legacy
                    name: m.role === 'user' ? (rawSources['user.name'] || 'User') : (rawSources['character.name'] || 'Char')
                };
            });

            // 3. Final Context Construction
            const hybridChat = [...chatHistory];
            hybridChat.last_messages = chatHistory;

            const context = {
                // Standard Aliases
                chat: hybridChat,
                messages: chatHistory,

                // Phase Info
                phase: phase || 'input',

                // INPUT: The raw text from the user (Essential for command parsing)
                user_input: userText,

                // For Output Phase: default responseText to input (which is invoked with LLM response)
                responseText: phase === 'output' ? userText : undefined,

                // Flatten Sources
                ...rawSources,

                // Merged Params (e.g. source: 'rpg_session')
                ...params,
                sources: rawSources,

                // Shim for Character Object (Writable targets)
                character: {
                    name: rawSources['character.name'] || rawSources.name || 'Unknown',
                    personality: rawSources['character.personality'] || rawSources.personality || '',
                    description: rawSources['character.description'] || rawSources.description || '',
                    scenario: rawSources['character.scenario'] || rawSources.scenario || '',
                    example: rawSources['character.exampleDialogs'] || rawSources.example || ''
                },

                tags: [...(state.sim?.activeTags || [])],
                // Inject Stats
                stats: state.weaves?.stats?.values || {},
                // Inject Locations
                locations: state.weaves?.locations || [],
                // Inject Actors (Allow Override from Plugins)
                actors: [...(params.actors || state.sim?.actors || [])],
                // Inject Chronos Context (Enhanced RP)
                chronos: A.Chronos ? A.Chronos.buildContext(state) : null
            };

            // Snapshot for Diffing
            const snapshot = JSON.parse(JSON.stringify(context));

            // NOTE: All rule evaluation (lorebook, microcues, voices, events, etc.)
            // now happens inside the instrumented AURA script built by AuraSimBuilder.
            // This ensures correct execution order (e.g., emotion signals available for lorebook).

            // 2. ACTION 4: RUN SCRIPTS SEQUENTIALLY
            let scripts = (A.Scripts && A.Scripts.getAll) ? A.Scripts.getAll() : [];
            const executionOrder = ['sys_pulse', 'sys_intent', 'sys_eros', 'sys_aura', 'sys_rpg'];

            scripts.sort((a, b) => {
                const aIdx = executionOrder.indexOf(a.id);
                const bIdx = executionOrder.indexOf(b.id);
                if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
                if (aIdx !== -1) return -1;
                if (bIdx !== -1) return 1;
                return (a.order || 0) - (b.order || 0);
            });

            // Dynamic Stack Injection (sys_aura) - Use INSTRUMENTED SimBuilder for accurate logging
            if (A.AuraSimBuilder) {
                const auraScript = scripts.find(s => s.id === 'sys_aura');
                if (auraScript && auraScript.enabled) {
                    try {
                        const dynamicCode = A.AuraSimBuilder.build(state);
                        scripts = scripts.map(s => s.id === 'sys_aura' ? { ...s, source: { code: dynamicCode } } : s);
                        logs.push("AURA Stack Compiled (Instrumented)");
                    } catch (e) { logs.push("AURA SimBuild Failed: " + e.message); }
                }
            } else if (A.AuraBuilder) {
                // Fallback to regular builder if SimBuilder not available
                const auraScript = scripts.find(s => s.id === 'sys_aura');
                if (auraScript && auraScript.enabled) {
                    try {
                        const dynamicCode = A.AuraBuilder.build(state);
                        scripts = scripts.map(s => s.id === 'sys_aura' ? { ...s, source: { code: dynamicCode } } : s);
                        logs.push("AURA Stack Compiled");
                    } catch (e) { logs.push("AURA Build Failed: " + e.message); }
                }
            }

            // Execute
            const scriptLogs = [];

            scripts.forEach(script => {
                if (!script.enabled) return;
                const logger = {
                    log: (...args) => scriptLogs.push(`[${script.name}] ${args.join(' ')}`),
                    warn: (...args) => scriptLogs.push(`[${script.name}] WARN: ${args.join(' ')}`),
                    error: (...args) => scriptLogs.push(`[${script.name}] ERROR: ${args.join(' ')}`),
                    info: (...args) => scriptLogs.push(`[${script.name}] INFO: ${args.join(' ')}`)
                };
                try {
                    // SAFE EXECUTION: Do not use template literals to build the body, as user code containing backticks will break it.
                    const checkPhase = 'if (!context.phase) context.phase = "' + phase + '";\n';
                    const body = '"use strict";\n' +
                        'try {\n' +
                        checkPhase +
                        script.source.code + '\n' +
                        '} catch (e) { console.error("[Script Error] " + e.message); }';

                    const runFn = new Function('context', 'console', 'A', body);
                    runFn(context, logger, A);
                } catch (err) {
                    scriptLogs.push(`[${script.name}] CRITICAL: ${err.message}`);
                }
            });

            // Log script execution results
            if (A.FlowLogger) {
                scripts.forEach(script => {
                    A.FlowLogger.log({
                        name: script.name,
                        type: 'script',
                        passed: script.enabled,
                        reason: script.enabled ? 'Script executed' : 'Script disabled'
                    });
                });
                A.FlowLogger.endTurn();
            }

            // 3. ACTION 5: FINAL STATE ACHIEVED
            return {
                context: context,
                logs: scriptLogs,
                snapshot: snapshot,
                diff: calculateDiff(snapshot, context)
            };

        } catch (err) {
            console.error("[LogicEngine] Critical Error in processRound:", err);
            if (A.UI && A.UI.Toast) A.UI.Toast.show("Logic Engine Crash: " + err.message, 'error');
            // Return a safe fallback to prevent infinite loops or UI freeze
            return {
                context: {},
                logs: ["CRITICAL EXECUTION FAILURE: " + err.message],
                snapshot: {},
                diff: { fields: [], tags: [] }
            };
        }
    }

    function calculateDiff(snapshot, context) {
        const diff = { fields: [], tags: [] };
        ['personality', 'scenario', 'example', 'description'].forEach(k => {
            const oldVal = snapshot.character[k] || '';
            const newVal = context.character[k] || '';
            if (oldVal !== newVal) {
                if (newVal.startsWith(oldVal)) {
                    diff.fields.push({ type: 'append', key: k, val: newVal.substring(oldVal.length), addedLength: newVal.length - oldVal.length });
                } else {
                    diff.fields.push({ type: 'modify', key: k });
                }
            }
        });
        return diff;
    }

    // --- API CLIENT ---
    async function callLLM(provider, model, key, system, history) {
        console.log(`[LLM] Calling ${provider} (${model})...`);

        if (provider === 'gemini') {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

            const contents = history.map(m => ({
                role: m.role === 'user' ? 'user' : 'model',
                parts: [{ text: m.content }]
            }));

            const payload = {
                contents: contents,
                system_instruction: { parts: [{ text: system }] },
                generationConfig: {
                    temperature: 0.9,
                    maxOutputTokens: 1024
                }
            };

            const resp = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!resp.ok) {
                const err = await resp.json();
                throw new Error(err.error?.message || resp.statusText);
            }

            const data = await resp.json();
            return data.candidates?.[0]?.content?.parts?.[0]?.text || "(No response)";
        }

        if (provider === 'openai') {
            const url = 'https://api.openai.com/v1/chat/completions';
            const messages = [
                { role: 'system', content: system },
                ...history.map(m => ({ role: m.role === 'model' ? 'assistant' : m.role, content: m.content }))
            ];

            const resp = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${key}`
                },
                body: JSON.stringify({
                    model: model,
                    messages: messages,
                    temperature: 0.9
                })
            });

            if (!resp.ok) {
                const err = await resp.json();
                throw new Error(err.error?.message || resp.statusText);
            }

            const data = await resp.json();
            return data.choices?.[0]?.message?.content || "(No response)";
        }

        if (provider === 'chutes') {
            // Chutes AI - OpenAI-compatible API
            const url = 'https://llm.chutes.ai/v1/chat/completions';
            const messages = [
                { role: 'system', content: system },
                ...history.map(m => ({ role: m.role === 'model' ? 'assistant' : m.role, content: m.content }))
            ];

            const resp = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${key}`
                },
                body: JSON.stringify({
                    model: model,
                    messages: messages,
                    temperature: 0.9
                })
            });

            if (!resp.ok) {
                const err = await resp.json();
                throw new Error(err.error?.message || resp.statusText);
            }

            const data = await resp.json();
            return data.choices?.[0]?.message?.content || "(No response)";
        }

        if (provider === 'custom') {
            // Custom OpenAI-compatible endpoint
            const config = JSON.parse(localStorage.getItem('anansi_sim_config') || '{}');
            const baseUrl = (config.baseUrl || 'https://api.example.com/v1').replace(/\/$/, ''); // Remove trailing slash
            const url = `${baseUrl}/chat/completions`;

            const messages = [
                { role: 'system', content: system },
                ...history.map(m => ({ role: m.role === 'model' ? 'assistant' : m.role, content: m.content }))
            ];

            const resp = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${key}`
                },
                body: JSON.stringify({
                    model: model,
                    messages: messages,
                    temperature: 0.9
                })
            });

            if (!resp.ok) {
                const err = await resp.json();
                throw new Error(err.error?.message || resp.statusText);
            }

            const data = await resp.json();
            return data.choices?.[0]?.message?.content || "(No response)";
        }

        if (provider === 'kobold') {
            // Kobold AI - Local Server
            const config = JSON.parse(localStorage.getItem('anansi_sim_config') || '{}');
            const baseUrl = (config.baseUrl || 'http://localhost:5001').replace(/\/$/, '');
            const url = `${baseUrl}/api/v1/generate`;

            // Kobold uses a different format - single prompt string
            const fullPrompt = `${system}\n\n${history.map(m => `${m.role === 'user' ? 'User' : 'Character'}: ${m.content}`).join('\n')}`;

            const resp = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: fullPrompt,
                    max_context_length: 4096,
                    max_length: 512,
                    temperature: 0.9
                })
            });

            if (!resp.ok) {
                const errText = await resp.text();
                throw new Error(`Kobold Error: ${errText || resp.statusText}`);
            }

            const data = await resp.json();
            return data.results?.[0]?.text || "(No response)";
        }

        throw new Error(`Unknown provider: ${provider}`);
    }

    // --- API EXPORTS ---
    A.Simulator = {
        processRound: processRound,
        callLLM: callLLM,
        calculateDiff: calculateDiff
    };

})(window.Anansi);
