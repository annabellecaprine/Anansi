/*
 * Anansi Core: LLM Service
 * File: js/core/llm.js
 */

(function (A) {
    'use strict';

    const LLM = {};

    /**
     * Generate a response from the LLM
     * @param {string} system System instruction
     * @param {Array} history Array of {role, content} messages
     * @param {Object} overrideConfig Optional config overrides (provider, model, apiKey, baseUrl)
     */
    LLM.generate = async function (system, history, overrideConfig = {}) {
        const storedConfig = JSON.parse(localStorage.getItem('anansi_sim_config') || '{}');
        const config = { ...storedConfig, ...overrideConfig };

        // Resolve API Key
        let key = config.apiKey || ''; // First check overrides/config

        if (!key) {
            // Try Key Manager storage
            const storedKeys = JSON.parse(localStorage.getItem('anansi_api_keys') || '{}');
            const activeKeyName = localStorage.getItem('anansi_active_key_name') || 'Default';
            if (storedKeys[activeKeyName]) {
                key = storedKeys[activeKeyName];
            } else if (storedKeys['Default']) { // Fallback
                key = storedKeys['Default'];
            }
        }

        const provider = config.provider || 'gemini'; // Default
        const model = config.model || 'gemini-1.5-flash';

        // Check for key (except local providers)
        if (!key && provider !== 'kobold') {
            throw new Error(`Missing API Key for ${provider}. Please configure in Simulator > Web Lens > Config.`);
        }

        // --- Providers ---

        if (provider === 'gemini') {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

            // Format history for Gemini
            const contents = history.map(m => ({
                role: m.role === 'user' ? 'user' : 'model',
                parts: [{ text: m.content }]
            }));

            // Add system instruction if supported (Gemini 1.5+)
            const body = {
                contents: contents,
                generationConfig: {
                    temperature: 0.9,
                    maxOutputTokens: 1024
                }
            };

            // System prompt
            if (system) {
                body.systemInstruction = { parts: [{ text: system }] };
            }

            const resp = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (!resp.ok) {
                const err = await resp.json();
                throw new Error(err.error?.message || resp.statusText);
            }

            const data = await resp.json();
            return data.candidates?.[0]?.content?.parts?.[0]?.text || "(No response)";
        }

        if (provider === 'openai' || provider === 'openrouter' || provider === 'chutes' || provider === 'custom') {
            // OpenAI-Compatible Endpoints
            let url = 'https://api.openai.com/v1/chat/completions';
            if (provider === 'openrouter') url = 'https://openrouter.ai/api/v1/chat/completions';
            if (provider === 'chutes') url = 'https://llm.chutes.ai/v1/chat/completions';
            if (provider === 'custom') {
                const baseUrl = (config.baseUrl || 'https://api.example.com/v1').replace(/\/$/, '');
                url = `${baseUrl}/chat/completions`;
            }

            const messages = [
                { role: 'system', content: system },
                ...history.map(m => ({ role: m.role === 'model' ? 'assistant' : m.role, content: m.content }))
            ];

            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${key}`
            };

            if (provider === 'openrouter') {
                headers['HTTP-Referer'] = 'https://anansi.app';
                headers['X-Title'] = 'Anansi';
            }

            const resp = await fetch(url, {
                method: 'POST',
                headers: headers,
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

        if (provider === 'anthropic') {
            const url = 'https://api.anthropic.com/v1/messages';

            const messages = history.map(m => ({
                role: m.role === 'model' ? 'assistant' : 'user',
                content: m.content
            }));

            const resp = await fetch(url, {
                method: 'POST',
                headers: {
                    'x-api-key': key,
                    'anthropic-version': '2023-06-01',
                    'content-type': 'application/json',
                    'anthropic-dangerous-direct-browser-access': 'true'
                },
                body: JSON.stringify({
                    model: model,
                    max_tokens: 1024,
                    system: system,
                    messages: messages,
                    temperature: 0.9
                })
            });

            if (!resp.ok) {
                const err = await resp.json();
                throw new Error(err.error?.message || resp.statusText);
            }

            const data = await resp.json();
            return data.content?.[0]?.text || "(No response)";
        }

        if (provider === 'kobold') {
            // Kobold AI - Local Server
            const baseUrl = (config.baseUrl || 'http://localhost:5001').replace(/\/$/, '');
            const url = `${baseUrl}/api/v1/generate`;

            // Kobold uses a single prompt string
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
    };

    A.LLM = LLM;

})(window.Anansi);
