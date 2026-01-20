/*
 * Anansi UI - API Configuration Manager
 * File: js/core/ui-api-config.js
 * Purpose: LLM provider configuration modal and API key management.
 * Extracted from ui.js for better maintainability.
 */

(function (A) {
    'use strict';

    // Ensure UI namespace exists
    if (!A.UI) A.UI = {};

    // --- Provider Presets ---
    const PROVIDER_PRESETS = {
        openai: { name: 'OpenAI', baseUrl: 'https://api.openai.com/v1', defaultModel: 'gpt-4o-mini', needsKey: true },
        anthropic: { name: 'Anthropic', baseUrl: 'https://api.anthropic.com/v1', defaultModel: 'claude-3-haiku-20240307', needsKey: true },
        gemini: { name: 'Google Gemini', baseUrl: 'https://generativelanguage.googleapis.com/v1beta', defaultModel: 'gemini-2.0-flash', needsKey: true },
        kobold: { name: 'Kobold (Local)', baseUrl: 'http://localhost:5001/api/v1', defaultModel: 'local', needsKey: false },
        chutes: { name: 'Chutes AI', baseUrl: 'https://llm.chutes.ai/v1', defaultModel: 'deepseek-ai/DeepSeek-V3', needsKey: true },
        custom: { name: 'Custom', baseUrl: '', defaultModel: '', needsKey: true }
    };

    // Expose presets for other modules
    A.UI.PROVIDER_PRESETS = PROVIDER_PRESETS;

    A.UI.showApiKeyManager = function () {
        // Load saved configs from localStorage
        let configs = JSON.parse(localStorage.getItem('anansi_llm_configs') || '[]');
        let activeId = localStorage.getItem('anansi_active_config_id') || '';

        // Migration: If old keys exist, migrate them
        const oldKeys = JSON.parse(localStorage.getItem('anansi_api_keys') || 'null');
        if (oldKeys && configs.length === 0) {
            Object.keys(oldKeys).forEach((name, idx) => {
                configs.push({
                    id: 'migrated_' + idx,
                    name: name,
                    provider: 'custom',
                    model: '',
                    baseUrl: '',
                    apiKey: oldKeys[name]
                });
            });
            localStorage.setItem('anansi_llm_configs', JSON.stringify(configs));
            localStorage.removeItem('anansi_api_keys');
        }

        // Ensure at least one config exists
        if (configs.length === 0) {
            configs.push({ id: 'default', name: 'Default (Gemini)', provider: 'gemini', model: 'gemini-2.0-flash', baseUrl: '', apiKey: '' });
            localStorage.setItem('anansi_llm_configs', JSON.stringify(configs));
            activeId = 'default';
            localStorage.setItem('anansi_active_config_id', activeId);
        }

        const saveConfigs = () => localStorage.setItem('anansi_llm_configs', JSON.stringify(configs));

        // Create modal overlay
        const overlay = document.createElement('div');
        overlay.id = 'api-config-overlay';
        overlay.style.cssText = `position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:9999;display:flex;align-items:center;justify-content:center;`;

        const modal = document.createElement('div');
        modal.style.cssText = `background:var(--bg-panel);border-radius:var(--radius-lg);border:1px solid var(--border-default);width:550px;max-height:85vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 20px 50px rgba(0,0,0,0.5);`;

        let currentView = 'list'; // 'list' or 'add'
        let editingConfig = null;

        const render = () => {
            modal.innerHTML = '';

            // Header
            const header = document.createElement('div');
            header.style.cssText = 'padding:16px;border-bottom:1px solid var(--border-subtle);display:flex;justify-content:space-between;align-items:center;';
            header.innerHTML = `
                <h3 style="margin:0;font-size:16px;color:var(--text-primary);">API Configuration</h3>
                <button id="modal-close" style="background:none;border:none;color:var(--text-muted);font-size:20px;cursor:pointer;">×</button>
            `;
            modal.appendChild(header);

            // Body
            const body = document.createElement('div');
            body.style.cssText = 'flex:1;overflow-y:auto;padding:16px;';

            if (currentView === 'list') {
                // Load generation settings
                const defaultGenSettings = { temperature: 0.7, maxTokens: 0, topP: 1.0, topK: 0, contextSize: 16384, repetitionPenalty: 1.0, frequencyPenalty: 0, presencePenalty: 0 };
                const genSettings = { ...defaultGenSettings, ...JSON.parse(localStorage.getItem('anansi_gen_settings') || '{}') };

                // --- LIST VIEW ---
                body.innerHTML = `
                    <details open style="margin-bottom:16px;padding:12px;background:var(--bg-surface);border-radius:var(--radius-md);border:1px solid var(--border-subtle);">
                        <summary style="cursor:pointer;font-size:11px;color:var(--text-muted);text-transform:uppercase;font-weight:bold;">Generation Settings</summary>
                        <div style="margin-top:12px;display:flex;flex-direction:column;gap:16px;">
                            
                            <div class="form-group">
                                <div style="display:flex;justify-content:space-between;align-items:center;">
                                    <label class="label" style="font-size:10px;margin:0;">Temperature</label>
                                    <span id="temp-val" style="font-size:11px;color:var(--accent-primary);font-weight:bold;">${genSettings.temperature}</span>
                                </div>
                                <input type="range" id="gen-temp" min="0" max="2" step="0.1" value="${genSettings.temperature}" style="width:100%;">
                                <div style="display:flex;justify-content:space-between;font-size:9px;color:var(--text-muted);"><span>0</span><span>1</span><span>2</span></div>
                                <div style="font-size:9px;color:var(--text-muted);margin-top:2px;">Controls randomness. Lower = focused, higher = creative.</div>
                            </div>
                            
                            <div class="form-group">
                                <div style="display:flex;justify-content:space-between;align-items:center;">
                                    <label class="label" style="font-size:10px;margin:0;">Max Tokens</label>
                                    <span id="maxtok-val" style="font-size:11px;color:var(--accent-primary);font-weight:bold;">${genSettings.maxTokens === 0 ? 'Unlimited' : genSettings.maxTokens}</span>
                                </div>
                                <input type="range" id="gen-max-tokens" min="0" max="8192" step="256" value="${genSettings.maxTokens}" style="width:100%;">
                                <div style="display:flex;justify-content:space-between;font-size:9px;color:var(--text-muted);"><span>0</span><span>4K</span><span>8K</span></div>
                                <div style="font-size:9px;color:var(--text-muted);margin-top:2px;">Response length limit. 0 = unlimited.</div>
                            </div>
                            
                            <div class="form-group">
                                <div style="display:flex;justify-content:space-between;align-items:center;">
                                    <label class="label" style="font-size:10px;margin:0;">Context Size</label>
                                    <span id="ctx-val" style="font-size:11px;color:var(--accent-primary);font-weight:bold;">${genSettings.contextSize}</span>
                                </div>
                                <input type="range" id="gen-ctx" min="1024" max="131072" step="1024" value="${genSettings.contextSize}" style="width:100%;">
                                <div style="display:flex;justify-content:space-between;font-size:9px;color:var(--text-muted);"><span>1K</span><span>64K</span><span>128K</span></div>
                                <div style="font-size:9px;color:var(--text-muted);margin-top:2px;">Memory window. Lower if you get errors.</div>
                            </div>
                            
                            <details style="padding:8px;background:var(--bg-elevated);border-radius:var(--radius-sm);border:1px solid var(--border-subtle);">
                                <summary style="cursor:pointer;font-size:10px;color:var(--text-muted);text-transform:uppercase;">Advanced Settings</summary>
                                <div style="margin-top:12px;display:flex;flex-direction:column;gap:12px;">
                                    
                                    <div class="form-group">
                                        <div style="display:flex;justify-content:space-between;align-items:center;">
                                            <label class="label" style="font-size:10px;margin:0;">Top P</label>
                                            <span id="topp-val" style="font-size:11px;color:var(--accent-primary);">${genSettings.topP}</span>
                                        </div>
                                        <input type="range" id="gen-top-p" min="0" max="1" step="0.05" value="${genSettings.topP}" style="width:100%;">
                                    </div>
                                    
                                    <div class="form-group">
                                        <div style="display:flex;justify-content:space-between;align-items:center;">
                                            <label class="label" style="font-size:10px;margin:0;">Top K</label>
                                            <span id="topk-val" style="font-size:11px;color:var(--accent-primary);">${genSettings.topK === 0 ? 'Off' : genSettings.topK}</span>
                                        </div>
                                        <input type="range" id="gen-top-k" min="0" max="100" step="1" value="${genSettings.topK}" style="width:100%;">
                                    </div>
                                    
                                    <div class="form-group">
                                        <div style="display:flex;justify-content:space-between;align-items:center;">
                                            <label class="label" style="font-size:10px;margin:0;">Repetition Penalty</label>
                                            <span id="rep-val" style="font-size:11px;color:var(--accent-primary);">${genSettings.repetitionPenalty}</span>
                                        </div>
                                        <input type="range" id="gen-rep" min="1" max="2" step="0.05" value="${genSettings.repetitionPenalty}" style="width:100%;">
                                    </div>
                                    
                                    <div class="form-group">
                                        <div style="display:flex;justify-content:space-between;align-items:center;">
                                            <label class="label" style="font-size:10px;margin:0;">Frequency Penalty</label>
                                            <span id="freq-val" style="font-size:11px;color:var(--accent-primary);">${genSettings.frequencyPenalty}</span>
                                        </div>
                                        <input type="range" id="gen-freq" min="0" max="2" step="0.1" value="${genSettings.frequencyPenalty}" style="width:100%;">
                                    </div>
                                    
                                    <div class="form-group">
                                        <div style="display:flex;justify-content:space-between;align-items:center;">
                                            <label class="label" style="font-size:10px;margin:0;">Presence Penalty</label>
                                            <span id="pres-val" style="font-size:11px;color:var(--accent-primary);">${genSettings.presencePenalty}</span>
                                        </div>
                                        <input type="range" id="gen-pres" min="0" max="2" step="0.1" value="${genSettings.presencePenalty}" style="width:100%;">
                                    </div>
                                </div>
                            </details>
                            
                        </div>
                    </details>

                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                        <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;">Saved Configurations (${configs.length})</div>
                        <button id="btn-add-config" class="btn btn-primary btn-sm">+ Add Configuration</button>
                    </div>
                    <div id="configs-list" style="display:flex;flex-direction:column;gap:8px;"></div>
                    <div style="margin-top:16px;padding:12px;background:var(--bg-surface);border-radius:var(--radius-md);border:1px solid var(--border-subtle);">
                        <div style="font-size:10px;color:var(--status-warning);margin-bottom:4px;">⚠️ Note</div>
                        <div style="font-size:11px;color:var(--text-muted);">API keys are stored in your browser's localStorage. They are never sent to any server except the configured provider.</div>
                    </div>
                `;

                // Bind generation settings
                const saveGenSettings = () => {
                    const tempInput = /** @type {HTMLInputElement} */ (body.querySelector('#gen-temp'));
                    const maxInput = /** @type {HTMLInputElement} */ (body.querySelector('#gen-max-tokens'));
                    const toppInput = /** @type {HTMLInputElement} */ (body.querySelector('#gen-top-p'));
                    const topkInput = /** @type {HTMLInputElement} */ (body.querySelector('#gen-top-k'));
                    const ctxInput = /** @type {HTMLInputElement} */ (body.querySelector('#gen-ctx'));
                    const repInput = /** @type {HTMLInputElement} */ (body.querySelector('#gen-rep'));
                    const freqInput = /** @type {HTMLInputElement} */ (body.querySelector('#gen-freq'));
                    const presInput = /** @type {HTMLInputElement} */ (body.querySelector('#gen-pres'));

                    const settings = {
                        temperature: parseFloat(tempInput.value),
                        maxTokens: parseInt(maxInput.value) || 0,
                        topP: parseFloat(toppInput.value),
                        topK: parseInt(topkInput.value) || 0,
                        contextSize: parseInt(ctxInput.value) || 16384,
                        repetitionPenalty: parseFloat(repInput.value),
                        frequencyPenalty: parseFloat(freqInput.value),
                        presencePenalty: parseFloat(presInput.value)
                    };
                    localStorage.setItem('anansi_gen_settings', JSON.stringify(settings));
                };

                // Slider bindings with live value display
                const bindSlider = (id, valId, formatter = v => v) => {
                    const slider = body.querySelector(id);
                    const valSpan = body.querySelector(valId);
                    if (slider && valSpan) {
                        slider.oninput = (e) => {
                            const target = /** @type {HTMLInputElement} */ (e.target);
                            valSpan.textContent = formatter(target.value);
                            saveGenSettings();
                        };
                    }
                };
                bindSlider('#gen-temp', '#temp-val');
                bindSlider('#gen-max-tokens', '#maxtok-val', v => v === '0' ? 'Unlimited' : v);
                bindSlider('#gen-ctx', '#ctx-val');
                bindSlider('#gen-top-p', '#topp-val');
                bindSlider('#gen-top-k', '#topk-val', v => v === '0' ? 'Off' : v);
                bindSlider('#gen-rep', '#rep-val');
                bindSlider('#gen-freq', '#freq-val');
                bindSlider('#gen-pres', '#pres-val');

                const list = body.querySelector('#configs-list');
                configs.forEach(cfg => {
                    const isActive = cfg.id === activeId;
                    const preset = PROVIDER_PRESETS[cfg.provider] || PROVIDER_PRESETS.custom;
                    const row = document.createElement('div');
                    row.style.cssText = `display:flex;align-items:center;gap:12px;padding:12px;background:var(--bg-elevated);border:1px solid ${isActive ? 'var(--accent-primary)' : 'var(--border-subtle)'};border-radius:var(--radius-md);`;
                    row.innerHTML = `
                        <div style="flex:1;">
                            <div style="font-size:13px;font-weight:bold;color:var(--text-primary);display:flex;align-items:center;gap:8px;">
                                ${cfg.name}
                                ${isActive ? '<span style="font-size:9px;padding:2px 6px;background:var(--accent-primary);color:white;border-radius:4px;">ACTIVE</span>' : ''}
                            </div>
                            <div style="font-size:10px;color:var(--text-muted);margin-top:2px;">${preset.name} • ${cfg.model || preset.defaultModel}</div>
                        </div>
                        <div style="display:flex;gap:4px;">
                            ${!isActive ? `<button class="btn btn-ghost btn-sm btn-activate" data-id="${cfg.id}" style="font-size:10px;">Activate</button>` : ''}
                            <button class="btn btn-ghost btn-sm btn-edit" data-id="${cfg.id}" style="font-size:10px;">Edit</button>
                            <button class="btn btn-ghost btn-sm btn-delete" data-id="${cfg.id}" style="font-size:10px;color:var(--status-error);">Delete</button>
                            <button class="btn btn-ghost btn-sm btn-copy" data-id="${cfg.id}" style="font-size:10px;">Copy</button>
                            <button class="btn btn-ghost btn-sm btn-test" data-id="${cfg.id}" style="font-size:10px;">Test</button>
                        </div>
                    `;
                    list.appendChild(row);
                });

                modal.appendChild(body);

                // Bind list events
                const btnAdd = /** @type {HTMLButtonElement} */ (body.querySelector('#btn-add-config'));
                btnAdd.onclick = () => { editingConfig = null; currentView = 'add'; render(); };
                body.querySelectorAll('.btn-activate').forEach(el => {
                    const btn = /** @type {HTMLButtonElement} */ (el);
                    btn.onclick = () => {
                        activeId = btn.dataset.id;
                        localStorage.setItem('anansi_active_config_id', activeId);
                        render();
                        if (A.State && A.State.notify) A.State.notify(); // Refresh CFG lens
                        if (A.UI.Toast) A.UI.Toast.show('Configuration activated', 'success');
                    };
                });
                body.querySelectorAll('.btn-edit').forEach(el => {
                    const btn = /** @type {HTMLButtonElement} */ (el);
                    btn.onclick = () => {
                        editingConfig = configs.find(c => c.id === btn.dataset.id);
                        currentView = 'add';
                        render();
                    };
                });
                body.querySelectorAll('.btn-delete').forEach(el => {
                    const btn = /** @type {HTMLButtonElement} */ (el);
                    btn.onclick = () => {
                        if (confirm('Delete this configuration?')) {
                            configs = configs.filter(c => c.id !== btn.dataset.id);
                            if (activeId === btn.dataset.id && configs.length > 0) activeId = configs[0].id;
                            saveConfigs();
                            localStorage.setItem('anansi_active_config_id', activeId);
                            render();
                        }
                    };
                });
                // Copy button
                body.querySelectorAll('.btn-copy').forEach(el => {
                    const btn = /** @type {HTMLButtonElement} */ (el);
                    btn.onclick = () => {
                        const original = configs.find(c => c.id === btn.dataset.id);
                        if (original) {
                            const copy = { ...original, id: 'cfg_' + Date.now(), name: original.name + ' (Copy)' };
                            configs.push(copy);
                            saveConfigs();
                            render();
                            if (A.UI.Toast) A.UI.Toast.show('Configuration copied', 'success');
                        }
                    };
                });
                // Test button
                body.querySelectorAll('.btn-test').forEach(el => {
                    const btn = /** @type {HTMLButtonElement} */ (el);
                    btn.onclick = async () => {
                        const cfg = configs.find(c => c.id === btn.dataset.id);
                        if (!cfg) return;
                        const preset = PROVIDER_PRESETS[cfg.provider] || PROVIDER_PRESETS.custom;
                        const baseUrl = cfg.baseUrl || preset.baseUrl;
                        const model = cfg.model || preset.defaultModel;
                        const apiKey = cfg.apiKey;

                        btn.textContent = '...';
                        btn.disabled = true;

                        try {
                            let success = false;
                            if (cfg.provider === 'gemini') {
                                // Gemini uses different endpoint
                                const url = `${baseUrl}/models/${model}?key=${apiKey}`;
                                const res = await fetch(url);
                                success = res.ok;
                            } else {
                                // OpenAI-compatible
                                const url = `${baseUrl}/chat/completions`;
                                const res = await fetch(url, {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'Authorization': `Bearer ${apiKey}`
                                    },
                                    body: JSON.stringify({
                                        model: model,
                                        messages: [{ role: 'user', content: 'Hi' }],
                                        max_tokens: 1
                                    })
                                });
                                success = res.ok || res.status === 400; // 400 can mean "bad request but connection works"
                            }
                            if (success) {
                                if (A.UI.Toast) A.UI.Toast.show('Connection successful!', 'success');
                            } else {
                                if (A.UI.Toast) A.UI.Toast.show('Connection failed. Check your settings.', 'error');
                            }
                        } catch (e) {
                            if (A.UI.Toast) A.UI.Toast.show('Connection error: ' + e.message, 'error');
                        }
                        btn.textContent = 'Test';
                        btn.disabled = false;
                    };
                });

            } else {
                // --- ADD/EDIT VIEW ---
                const isEdit = !!editingConfig;
                const cfg = editingConfig || { id: '', name: '', provider: 'openai', model: '', baseUrl: '', apiKey: '' };

                body.innerHTML = `
                    <button id="btn-back" class="btn btn-ghost btn-sm" style="margin-bottom:12px;">← Back to List</button>
                    <h4 style="margin:0 0 16px 0;font-size:14px;">${isEdit ? 'Edit Configuration' : 'Add New Configuration'}</h4>
                    
                    <div style="margin-bottom:16px;">
                        <div style="font-size:10px;color:var(--text-muted);margin-bottom:8px;text-transform:uppercase;">Provider</div>
                        <div id="provider-tabs" style="display:flex;flex-wrap:wrap;gap:4px;"></div>
                    </div>

                    <div class="form-group" style="margin-bottom:12px;">
                        <label class="label" style="font-size:11px;">Configuration Name</label>
                        <input id="cfg-name" class="input" value="${cfg.name}" placeholder="My OpenAI Key">
                    </div>
                    <div class="form-group" style="margin-bottom:12px;">
                        <label class="label" style="font-size:11px;">Model</label>
                        <input id="cfg-model" class="input" value="${cfg.model}" placeholder="e.g., gpt-4o-mini">
                    </div>
                    <div class="form-group" id="url-group" style="margin-bottom:12px;display:none;">
                        <label class="label" style="font-size:11px;">Base URL</label>
                        <input id="cfg-url" class="input" value="${cfg.baseUrl}" placeholder="https://api.example.com/v1">
                    </div>
                    <div class="form-group" id="key-group" style="margin-bottom:12px;">
                        <label class="label" style="font-size:11px;">API Key</label>
                        <input id="cfg-key" class="input" type="password" value="${cfg.apiKey}" placeholder="sk-...">
                    </div>

                    <button id="btn-save-config" class="btn btn-primary" style="width:100%;margin-top:8px;">${isEdit ? 'Save Changes' : 'Add Configuration'}</button>
                `;

                modal.appendChild(body);

                // Provider tabs
                const tabsContainer = body.querySelector('#provider-tabs');
                let selectedProvider = cfg.provider || 'openai';

                const renderProviderTabs = () => {
                    tabsContainer.innerHTML = Object.keys(PROVIDER_PRESETS).map(key => {
                        const p = PROVIDER_PRESETS[key];
                        const isSelected = key === selectedProvider;
                        return `<button class="btn btn-sm provider-tab" data-provider="${key}" style="font-size:10px;${isSelected ? 'background:var(--accent-primary);color:white;' : ''}">${p.name}</button>`;
                    }).join('');

                    // Update field visibility
                    const preset = PROVIDER_PRESETS[selectedProvider];
                    const urlGroup = /** @type {HTMLElement} */ (body.querySelector('#url-group'));
                    const keyGroup = /** @type {HTMLElement} */ (body.querySelector('#key-group'));

                    urlGroup.style.display = selectedProvider === 'custom' ? 'block' : 'none';
                    keyGroup.style.display = preset.needsKey ? 'block' : 'none';
                    if (!isEdit) {
                        const modelInput = /** @type {HTMLInputElement} */ (body.querySelector('#cfg-model'));
                        modelInput.placeholder = preset.defaultModel || 'Model ID';
                    }

                    // Bind tab clicks
                    tabsContainer.querySelectorAll('.provider-tab').forEach(el => {
                        const tab = /** @type {HTMLButtonElement} */ (el);
                        tab.onclick = () => {
                            selectedProvider = tab.dataset.provider;
                            renderProviderTabs();
                        };
                    });
                };
                renderProviderTabs();

                // Back button
                const btnBack = /** @type {HTMLButtonElement} */ (body.querySelector('#btn-back'));
                btnBack.onclick = () => { currentView = 'list'; editingConfig = null; render(); };

                // Save button
                /** @type {HTMLElement} */ (body.querySelector('#btn-save-config')).onclick = () => {
                    const nameInput = /** @type {HTMLInputElement} */ (body.querySelector('#cfg-name'));
                    const modelInput = /** @type {HTMLInputElement} */ (body.querySelector('#cfg-model'));
                    const keyInput = /** @type {HTMLInputElement} */ (body.querySelector('#cfg-key'));
                    const urlInput = /** @type {HTMLInputElement} */ (body.querySelector('#cfg-url'));

                    const name = nameInput.value.trim();
                    const model = modelInput.value.trim() || PROVIDER_PRESETS[selectedProvider].defaultModel;
                    const apiKey = keyInput.value.trim();
                    const baseUrl = urlInput.value.trim() || PROVIDER_PRESETS[selectedProvider].baseUrl;

                    if (!name) { alert('Please enter a configuration name.'); return; }

                    if (isEdit) {
                        editingConfig.name = name;
                        editingConfig.provider = selectedProvider;
                        editingConfig.model = model;
                        editingConfig.baseUrl = baseUrl;
                        editingConfig.apiKey = apiKey;
                    } else {
                        configs.push({
                            id: 'cfg_' + Date.now(),
                            name, provider: selectedProvider, model, baseUrl, apiKey
                        });
                    }
                    saveConfigs();
                    if (A.UI.Toast) A.UI.Toast.show(isEdit ? 'Configuration updated' : 'Configuration added', 'success');
                    currentView = 'list';
                    editingConfig = null;
                    render();
                };
            }

            // Close button
            const btnClose = /** @type {HTMLButtonElement} */ (modal.querySelector('#modal-close'));
            btnClose.onclick = () => overlay.remove();
        };

        render();
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
    };

    // Helper to get active LLM config
    A.UI.getActiveLLMConfig = function () {
        const configs = JSON.parse(localStorage.getItem('anansi_llm_configs') || '[]');
        const activeId = localStorage.getItem('anansi_active_config_id') || '';
        const cfg = configs.find(c => c.id === activeId) || configs[0] || null;
        if (!cfg) return null;
        const preset = PROVIDER_PRESETS[cfg.provider] || PROVIDER_PRESETS.custom;
        return {
            provider: cfg.provider,
            model: cfg.model || preset.defaultModel,
            baseUrl: cfg.baseUrl || preset.baseUrl,
            apiKey: cfg.apiKey
        };
    };

    // Helper to get generation settings
    A.UI.getGenerationSettings = function () {
        const defaults = { temperature: 0.7, maxTokens: 0, topP: 1.0, topK: 0, contextSize: 16384, repetitionPenalty: 1.0, frequencyPenalty: 0, presencePenalty: 0 };
        return { ...defaults, ...JSON.parse(localStorage.getItem('anansi_gen_settings') || '{}') };
    };

})(window.Anansi);
