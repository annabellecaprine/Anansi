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
        openrouter: { name: 'OpenRouter', baseUrl: 'https://openrouter.ai/api/v1', defaultModel: 'anthropic/claude-3-haiku', needsKey: true },
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
                const defaultGenSettings = {
                    temperature: 0.7, maxTokens: 0, topP: 1.0, topK: 0, contextSize: 16384,
                    repetitionPenalty: 1.0, frequencyPenalty: 0, presencePenalty: 0,
                    // Context-specific token limits
                    simulatorMaxTokens: 4096,
                    nabuMaxTokens: 2048,
                    nabuAdvancedMaxTokens: 8192,
                    worldWeaverMaxTokens: 4096
                };
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
                            
                            <details style="padding:8px;background:var(--bg-elevated);border-radius:var(--radius-sm);border:1px solid var(--border-subtle);">
                                <summary style="cursor:pointer;font-size:10px;color:var(--text-muted);text-transform:uppercase;">Token Limits by Context</summary>
                                <div style="margin-top:12px;display:flex;flex-direction:column;gap:12px;">
                                    <div style="font-size:9px;color:var(--text-muted);margin-bottom:4px;">Global default applies to all tools. Check "Override" to set a custom limit for specific tools. DeepSeek supports 128K+.</div>
                                    
                                    <!-- Global Default -->
                                    <div class="form-group" style="padding:8px;background:var(--bg-surface);border-radius:var(--radius-sm);border:1px solid var(--accent-primary);">
                                        <div style="display:flex;justify-content:space-between;align-items:center;">
                                            <label class="label" style="font-size:10px;margin:0;font-weight:bold;color:var(--accent-primary);">🌐 Global Default</label>
                                            <span id="global-tok-val" style="font-size:11px;color:var(--accent-primary);font-weight:bold;">${genSettings.globalMaxTokens || 4096}</span>
                                        </div>
                                        <input type="range" id="gen-global-tok" min="512" max="131072" step="512" value="${genSettings.globalMaxTokens || 4096}" style="width:100%;">
                                        <div style="display:flex;justify-content:space-between;font-size:9px;color:var(--text-muted);"><span>512</span><span>32K</span><span>128K</span></div>
                                    </div>
                                    
                                    <div style="font-size:9px;color:var(--text-muted);border-top:1px solid var(--border-subtle);padding-top:8px;margin-top:4px;">Per-Tool Overrides</div>
                                    
                                    <!-- Simulator -->
                                    <div class="form-group token-override-row">
                                        <div style="display:flex;align-items:center;gap:8px;">
                                            <input type="checkbox" id="override-sim" ${genSettings.overrideSimulator ? 'checked' : ''} style="margin:0;">
                                            <label class="label" style="font-size:10px;margin:0;flex:1;">Simulator</label>
                                            <span id="sim-tok-val" style="font-size:11px;color:var(--accent-primary);">${genSettings.simulatorMaxTokens || 4096}</span>
                                        </div>
                                        <input type="range" id="gen-sim-tok" min="512" max="131072" step="512" value="${genSettings.simulatorMaxTokens || 4096}" style="width:100%;" ${genSettings.overrideSimulator ? '' : 'disabled'}>
                                    </div>
                                    
                                    <!-- Nabu Standard -->
                                    <div class="form-group token-override-row">
                                        <div style="display:flex;align-items:center;gap:8px;">
                                            <input type="checkbox" id="override-nabu" ${genSettings.overrideNabu ? 'checked' : ''} style="margin:0;">
                                            <label class="label" style="font-size:10px;margin:0;flex:1;">Nabu (Standard)</label>
                                            <span id="nabu-tok-val" style="font-size:11px;color:var(--accent-primary);">${genSettings.nabuMaxTokens || 2048}</span>
                                        </div>
                                        <input type="range" id="gen-nabu-tok" min="512" max="65536" step="512" value="${genSettings.nabuMaxTokens || 2048}" style="width:100%;" ${genSettings.overrideNabu ? '' : 'disabled'}>
                                    </div>
                                    
                                    <!-- Nabu Advanced -->
                                    <div class="form-group token-override-row">
                                        <div style="display:flex;align-items:center;gap:8px;">
                                            <input type="checkbox" id="override-nabu-adv" ${genSettings.overrideNabuAdvanced ? 'checked' : ''} style="margin:0;">
                                            <label class="label" style="font-size:10px;margin:0;flex:1;">Nabu (Advanced Workshop)</label>
                                            <span id="nabu-adv-tok-val" style="font-size:11px;color:var(--accent-primary);">${genSettings.nabuAdvancedMaxTokens || 8192}</span>
                                        </div>
                                        <input type="range" id="gen-nabu-adv-tok" min="2048" max="131072" step="1024" value="${genSettings.nabuAdvancedMaxTokens || 8192}" style="width:100%;" ${genSettings.overrideNabuAdvanced ? '' : 'disabled'}>
                                    </div>
                                    
                                    <!-- Magic Wand -->
                                    <div class="form-group token-override-row">
                                        <div style="display:flex;align-items:center;gap:8px;">
                                            <input type="checkbox" id="override-wand" ${genSettings.overrideMagicWand ? 'checked' : ''} style="margin:0;">
                                            <label class="label" style="font-size:10px;margin:0;flex:1;">Magic Wand (Text Helper)</label>
                                            <span id="wand-tok-val" style="font-size:11px;color:var(--accent-primary);">${genSettings.magicWandMaxTokens || 4096}</span>
                                        </div>
                                        <input type="range" id="gen-wand-tok" min="256" max="32768" step="256" value="${genSettings.magicWandMaxTokens || 4096}" style="width:100%;" ${genSettings.overrideMagicWand ? '' : 'disabled'}>
                                    </div>
                                    
                                    <!-- Writer's Block -->
                                    <div class="form-group token-override-row">
                                        <div style="display:flex;align-items:center;gap:8px;">
                                            <input type="checkbox" id="override-writer" ${genSettings.overrideWritersBlock ? 'checked' : ''} style="margin:0;">
                                            <label class="label" style="font-size:10px;margin:0;flex:1;">Writer's Block</label>
                                            <span id="writer-tok-val" style="font-size:11px;color:var(--accent-primary);">${genSettings.writersBlockMaxTokens || 4096}</span>
                                        </div>
                                        <input type="range" id="gen-writer-tok" min="512" max="65536" step="512" value="${genSettings.writersBlockMaxTokens || 4096}" style="width:100%;" ${genSettings.overrideWritersBlock ? '' : 'disabled'}>
                                    </div>
                                    
                                    <!-- Hina's Guide -->
                                    <div class="form-group token-override-row">
                                        <div style="display:flex;align-items:center;gap:8px;">
                                            <input type="checkbox" id="override-hina" ${genSettings.overrideHina ? 'checked' : ''} style="margin:0;">
                                            <label class="label" style="font-size:10px;margin:0;flex:1;">Hina's Guide</label>
                                            <span id="hina-tok-val" style="font-size:11px;color:var(--accent-primary);">${genSettings.hinaMaxTokens || 4096}</span>
                                        </div>
                                        <input type="range" id="gen-hina-tok" min="512" max="32768" step="512" value="${genSettings.hinaMaxTokens || 4096}" style="width:100%;" ${genSettings.overrideHina ? '' : 'disabled'}>
                                    </div>
                                    
                                    <!-- Chronos Chat -->
                                    <div class="form-group token-override-row">
                                        <div style="display:flex;align-items:center;gap:8px;">
                                            <input type="checkbox" id="override-chronos" ${genSettings.overrideChronos ? 'checked' : ''} style="margin:0;">
                                            <label class="label" style="font-size:10px;margin:0;flex:1;">Chronos Chat</label>
                                            <span id="chronos-tok-val" style="font-size:11px;color:var(--accent-primary);">${genSettings.chronosMaxTokens || 4096}</span>
                                        </div>
                                        <input type="range" id="gen-chronos-tok" min="512" max="65536" step="512" value="${genSettings.chronosMaxTokens || 4096}" style="width:100%;" ${genSettings.overrideChronos ? '' : 'disabled'}>
                                    </div>
                                    
                                    <!-- Spider's Parlor -->
                                    <div class="form-group token-override-row">
                                        <div style="display:flex;align-items:center;gap:8px;">
                                            <input type="checkbox" id="override-parlor" ${genSettings.overrideParlor ? 'checked' : ''} style="margin:0;">
                                            <label class="label" style="font-size:10px;margin:0;flex:1;">Spider's Parlor</label>
                                            <span id="parlor-tok-val" style="font-size:11px;color:var(--accent-primary);">${genSettings.parlorMaxTokens || 4096}</span>
                                        </div>
                                        <input type="range" id="gen-parlor-tok" min="512" max="65536" step="512" value="${genSettings.parlorMaxTokens || 4096}" style="width:100%;" ${genSettings.overrideParlor ? '' : 'disabled'}>
                                    </div>

                                    <!-- World Weaver -->
                                    <div class="form-group token-override-row">
                                        <div style="display:flex;align-items:center;gap:8px;">
                                            <input type="checkbox" id="override-weaver" ${genSettings.overrideWorldWeaver ? 'checked' : ''} style="margin:0;">
                                            <label class="label" style="font-size:10px;margin:0;flex:1;">World Weaver</label>
                                            <span id="weaver-tok-val" style="font-size:11px;color:var(--accent-primary);">${genSettings.worldWeaverMaxTokens || 4096}</span>
                                        </div>
                                        <input type="range" id="gen-weaver-tok" min="512" max="32768" step="512" value="${genSettings.worldWeaverMaxTokens || 4096}" style="width:100%;" ${genSettings.overrideWorldWeaver ? '' : 'disabled'}>
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

                    // Token limit inputs
                    const globalTokInput = /** @type {HTMLInputElement} */ (body.querySelector('#gen-global-tok'));
                    const simTokInput = /** @type {HTMLInputElement} */ (body.querySelector('#gen-sim-tok'));
                    const nabuTokInput = /** @type {HTMLInputElement} */ (body.querySelector('#gen-nabu-tok'));
                    const nabuAdvTokInput = /** @type {HTMLInputElement} */ (body.querySelector('#gen-nabu-adv-tok'));
                    const wandTokInput = /** @type {HTMLInputElement} */ (body.querySelector('#gen-wand-tok'));
                    const writerTokInput = /** @type {HTMLInputElement} */ (body.querySelector('#gen-writer-tok'));
                    const hinaTokInput = /** @type {HTMLInputElement} */ (body.querySelector('#gen-hina-tok'));
                    const chronosTokInput = /** @type {HTMLInputElement} */ (body.querySelector('#gen-chronos-tok'));
                    const parlorTokInput = /** @type {HTMLInputElement} */ (body.querySelector('#gen-parlor-tok'));
                    const weaverTokInput = /** @type {HTMLInputElement} */ (body.querySelector('#gen-weaver-tok'));

                    // Override checkboxes
                    const overrideSim = /** @type {HTMLInputElement} */ (body.querySelector('#override-sim'));
                    const overrideNabu = /** @type {HTMLInputElement} */ (body.querySelector('#override-nabu'));
                    const overrideNabuAdv = /** @type {HTMLInputElement} */ (body.querySelector('#override-nabu-adv'));
                    const overrideWand = /** @type {HTMLInputElement} */ (body.querySelector('#override-wand'));
                    const overrideWriter = /** @type {HTMLInputElement} */ (body.querySelector('#override-writer'));
                    const overrideHina = /** @type {HTMLInputElement} */ (body.querySelector('#override-hina'));
                    const overrideChronos = /** @type {HTMLInputElement} */ (body.querySelector('#override-chronos'));
                    const overrideParlor = /** @type {HTMLInputElement} */ (body.querySelector('#override-parlor'));
                    const overrideWeaver = /** @type {HTMLInputElement} */ (body.querySelector('#override-weaver'));

                    const settings = {
                        temperature: parseFloat(tempInput.value),
                        maxTokens: parseInt(maxInput.value) || 0,
                        topP: parseFloat(toppInput.value),
                        topK: parseInt(topkInput.value) || 0,
                        contextSize: parseInt(ctxInput.value) || 16384,
                        repetitionPenalty: parseFloat(repInput.value),
                        frequencyPenalty: parseFloat(freqInput.value),
                        presencePenalty: parseFloat(presInput.value),
                        // Global default
                        globalMaxTokens: parseInt(globalTokInput?.value) || 4096,
                        // Per-tool override flags
                        overrideSimulator: overrideSim?.checked || false,
                        overrideNabu: overrideNabu?.checked || false,
                        overrideNabuAdvanced: overrideNabuAdv?.checked || false,
                        overrideMagicWand: overrideWand?.checked || false,
                        overrideWritersBlock: overrideWriter?.checked || false,
                        overrideHina: overrideHina?.checked || false,
                        overrideChronos: overrideChronos?.checked || false,
                        overrideParlor: overrideParlor?.checked || false,
                        overrideWorldWeaver: overrideWeaver?.checked || false,
                        // Per-tool values
                        simulatorMaxTokens: parseInt(simTokInput?.value) || 4096,
                        nabuMaxTokens: parseInt(nabuTokInput?.value) || 2048,
                        nabuAdvancedMaxTokens: parseInt(nabuAdvTokInput?.value) || 8192,
                        magicWandMaxTokens: parseInt(wandTokInput?.value) || 4096,
                        writersBlockMaxTokens: parseInt(writerTokInput?.value) || 4096,
                        hinaMaxTokens: parseInt(hinaTokInput?.value) || 4096,
                        chronosMaxTokens: parseInt(chronosTokInput?.value) || 4096,
                        parlorMaxTokens: parseInt(parlorTokInput?.value) || 4096,
                        worldWeaverMaxTokens: parseInt(weaverTokInput?.value) || 4096
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

                // Checkbox bindings to enable/disable sliders
                const bindOverrideCheckbox = (checkboxId, sliderId) => {
                    const checkbox = /** @type {HTMLInputElement} */ (body.querySelector(checkboxId));
                    const slider = /** @type {HTMLInputElement} */ (body.querySelector(sliderId));
                    if (checkbox && slider) {
                        checkbox.onchange = () => {
                            slider.disabled = !checkbox.checked;
                            saveGenSettings();
                        };
                    }
                };

                const formatK = v => v >= 1000 ? `${Math.round(v / 1000)}K` : v;
                bindSlider('#gen-temp', '#temp-val');
                bindSlider('#gen-max-tokens', '#maxtok-val', v => v === '0' ? 'Unlimited' : v);
                bindSlider('#gen-ctx', '#ctx-val', formatK);
                bindSlider('#gen-top-p', '#topp-val');
                bindSlider('#gen-top-k', '#topk-val', v => v === '0' ? 'Off' : v);
                bindSlider('#gen-rep', '#rep-val');
                bindSlider('#gen-freq', '#freq-val');
                bindSlider('#gen-pres', '#pres-val');

                // Token limit sliders
                bindSlider('#gen-global-tok', '#global-tok-val', formatK);
                bindSlider('#gen-sim-tok', '#sim-tok-val', formatK);
                bindSlider('#gen-nabu-tok', '#nabu-tok-val', formatK);
                bindSlider('#gen-nabu-adv-tok', '#nabu-adv-tok-val', formatK);
                bindSlider('#gen-wand-tok', '#wand-tok-val', formatK);
                bindSlider('#gen-writer-tok', '#writer-tok-val', formatK);
                bindSlider('#gen-hina-tok', '#hina-tok-val', formatK);
                bindSlider('#gen-chronos-tok', '#chronos-tok-val', formatK);
                bindSlider('#gen-parlor-tok', '#parlor-tok-val', formatK);
                bindSlider('#gen-weaver-tok', '#weaver-tok-val', formatK);

                // Override checkbox bindings
                bindOverrideCheckbox('#override-sim', '#gen-sim-tok');
                bindOverrideCheckbox('#override-nabu', '#gen-nabu-tok');
                bindOverrideCheckbox('#override-nabu-adv', '#gen-nabu-adv-tok');
                bindOverrideCheckbox('#override-wand', '#gen-wand-tok');
                bindOverrideCheckbox('#override-writer', '#gen-writer-tok');
                bindOverrideCheckbox('#override-hina', '#gen-hina-tok');
                bindOverrideCheckbox('#override-chronos', '#gen-chronos-tok');
                bindOverrideCheckbox('#override-parlor', '#gen-parlor-tok');
                bindOverrideCheckbox('#override-weaver', '#gen-weaver-tok');


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
                        <input id="cfg-name" class="input" value="${cfg.name}" placeholder="My OpenAI Key" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">
                    </div>
                    <div class="form-group" style="margin-bottom:12px;">
                        <label class="label" style="font-size:11px;">Model</label>
                        <input id="cfg-model" class="input" value="${cfg.model}" placeholder="e.g., gpt-4o-mini" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">
                    </div>
                    <div class="form-group" id="url-group" style="margin-bottom:12px;display:none;">
                        <label class="label" style="font-size:11px;">Base URL</label>
                        <input id="cfg-url" class="input" value="${cfg.baseUrl}" placeholder="https://api.example.com/v1" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">
                    </div>
                    <div class="form-group" id="key-group" style="margin-bottom:12px;">
                        <label class="label" style="font-size:11px;">API Key</label>
                        <input id="cfg-key" class="input" type="password" value="${cfg.apiKey}" placeholder="sk-..." autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">
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

                    if (!name) { A.UI.Toast.show('Please enter a configuration name.', 'warning'); return; }

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
        const defaults = {
            temperature: 0.7, maxTokens: 0, topP: 1.0, topK: 0, contextSize: 16384,
            repetitionPenalty: 1.0, frequencyPenalty: 0, presencePenalty: 0,
            // Global default
            globalMaxTokens: 4096,
            // Override flags
            overrideSimulator: false, overrideNabu: false, overrideNabuAdvanced: false,
            overrideMagicWand: false, overrideWritersBlock: false, overrideHina: false,
            overrideChronos: false, overrideParlor: false, overrideWorldWeaver: true,
            // Per-tool defaults (used when override is enabled)
            simulatorMaxTokens: 4096, nabuMaxTokens: 2048, nabuAdvancedMaxTokens: 8192,
            magicWandMaxTokens: 4096, writersBlockMaxTokens: 4096, hinaMaxTokens: 4096,
            chronosMaxTokens: 4096, parlorMaxTokens: 4096, worldWeaverMaxTokens: 4096
        };
        return { ...defaults, ...JSON.parse(localStorage.getItem('anansi_gen_settings') || '{}') };
    };

    /**
     * Get the effective max tokens for a specific tool.
     * Returns the tool's override value if enabled, otherwise the global default.
     * @param {'simulator'|'nabu'|'nabuAdvanced'|'magicWand'|'writersBlock'|'hina'|'chronos'|'parlor'} tool
     * @returns {number}
     */
    A.UI.getMaxTokensFor = function (tool) {
        const s = A.UI.getGenerationSettings();
        const toolMap = {
            simulator: { override: 'overrideSimulator', value: 'simulatorMaxTokens' },
            nabu: { override: 'overrideNabu', value: 'nabuMaxTokens' },
            nabuAdvanced: { override: 'overrideNabuAdvanced', value: 'nabuAdvancedMaxTokens' },
            magicWand: { override: 'overrideMagicWand', value: 'magicWandMaxTokens' },
            writersBlock: { override: 'overrideWritersBlock', value: 'writersBlockMaxTokens' },
            hina: { override: 'overrideHina', value: 'hinaMaxTokens' },
            chronos: { override: 'overrideChronos', value: 'chronosMaxTokens' },
            parlor: { override: 'overrideParlor', value: 'parlorMaxTokens' },
            worldWeaver: { override: 'overrideWorldWeaver', value: 'worldWeaverMaxTokens' }
        };
        const config = toolMap[tool];
        if (config && s[config.override]) {
            return s[config.value] || s.globalMaxTokens || 4096;
        }
        return s.globalMaxTokens || 4096;
    };

})(window.Anansi);
