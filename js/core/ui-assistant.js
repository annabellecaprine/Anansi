/*
 * Anansi Core: UI Assistant (The Magic Wand)
 * File: js/core/ui-assistant.js
 */

(function (A) {
    'use strict';

    const Assistant = {};

    /**
     * Attach the AI Assistant to a textarea or input
     * @param {HTMLElement} element The target input element
     * @param {Object} options Configuration ({ system, context, label })
     */
    Assistant.attach = function (element, options = {}) {
        if (!element || element.dataset.hasAssistant) return;

        // Mark as attached
        element.dataset.hasAssistant = 'true';

        // 1. Create the Wand Button
        const wandBtn = document.createElement('button');
        wandBtn.className = 'btn-assistant-wand'; // We'll add dynamic styles or use inline
        wandBtn.innerHTML = '🪄';
        wandBtn.title = 'AI Assist (Polishing & Generation)';

        // Style: Absolute position top-right of the input
        // We need the parent to be relative
        const wrapper = document.createElement('div');
        wrapper.style.position = 'relative';
        wrapper.style.display = 'block';
        wrapper.style.flex = getComputedStyle(element).flex; // Preserve flex behavior
        wrapper.style.width = getComputedStyle(element).width;

        // Swap element with wrapper
        element.parentNode.insertBefore(wrapper, element);
        wrapper.appendChild(element);
        wrapper.appendChild(wandBtn);

        // Position button
        wandBtn.style.position = 'absolute';
        wandBtn.style.top = '4px';
        wandBtn.style.right = '4px';
        wandBtn.style.background = 'transparent';
        wandBtn.style.border = 'none';
        wandBtn.style.cursor = 'pointer';
        wandBtn.style.opacity = '0.5';
        wandBtn.style.fontSize = '14px';
        wandBtn.style.transition = 'opacity 0.2s';
        wandBtn.onmouseenter = () => wandBtn.style.opacity = '1';
        wandBtn.onmouseleave = () => wandBtn.style.opacity = '0.5';

        // 2. Click Handler
        wandBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            showAssistantModal(element, options);
        };
    };

    /**
     * Show the Assistant Modal
     */
    function showAssistantModal(targetInput, options) {
        // Helper to escape HTML for display in textarea
        const escapeHtml = (text) => {
            const map = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#039;'
            };
            return text.replace(/[&<>"']/g, function (m) { return map[m]; });
        };

        // Remove existing modal
        const existing = document.getElementById('assistant-modal-backdrop');
        if (existing) existing.remove();

        // Determine value accessors
        const getValue = options.getValue || (() => targetInput.value);
        const setValue = options.setValue || ((val) => { targetInput.value = val; });

        const currentText = getValue();
        const systemPrompt = options.system || "You are a helpful creative writing assistant. Improve the text or generate new content based on the user's request.";
        const contextLabel = options.label || "Text Field";

        // Create Modal
        const backdrop = document.createElement('div');
        backdrop.id = 'assistant-modal-backdrop';
        backdrop.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.7); z-index: 10000;
            display: flex; align-items: center; justify-content: center;
        `;

        const modal = document.createElement('div');
        modal.className = 'card';
        modal.style.cssText = `
            width: 500px; max-width: 90%; max-height: 80vh; overflow-y: auto;
            background: var(--bg-surface); padding: 16px; 
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            display: flex; flex-direction: column; gap: 12px;
        `;

        modal.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <h3 style="margin:0; font-size:16px;">🪄 AI Assistant</h3>
                <button id="btn-assist-close" class="btn btn-ghost btn-sm">✕</button>
            </div>
            
            <div style="font-size:11px; color:var(--text-muted);">
                Target: <strong style="color:var(--text-primary);">${contextLabel}</strong>
            </div>

            <!-- Guidance Input -->
            <div>
                <label class="label">Guidance (Optional)</label>
                <input class="input" id="inp-assist-guidance" placeholder="e.g. 'Make it darker', 'Fix grammar', 'Summarize'...">
            </div>

            <!-- Current/Preview Comparison -->
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px; display:none;" id="preview-area">
                <div>
                   <label class="label">Original</label>
                   <textarea class="input" style="height:150px; opacity:0.7;" disabled>${escapeHtml(currentText)}</textarea>
                </div>
                <div>
                   <label class="label">Preview</label>
                   <textarea class="input" id="inp-assist-preview" style="height:150px; border-color:var(--accent-primary);"></textarea>
                </div>
            </div>

            <!-- Loading State -->
            <div id="assist-loading" style="display:none; text-align:center; padding:20px; color:var(--accent-primary);">
                ✨ Weaving magic...
            </div>

            <!-- Actions -->
            <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:8px;">
                <span style="flex:1; font-size:10px; color:var(--text-muted); align-self:center;">Requires API Key (Simulator Config)</span>
                <button class="btn btn-primary" id="btn-assist-go">Generate</button>
                <button class="btn btn-success" id="btn-assist-apply" style="display:none;">Apply Change</button>
            </div>
        `;

        backdrop.appendChild(modal);
        document.body.appendChild(backdrop);

        // Elements
        const closeBtn = modal.querySelector('#btn-assist-close');
        const goBtn = modal.querySelector('#btn-assist-go');
        const applyBtn = modal.querySelector('#btn-assist-apply');
        const guidanceInp = modal.querySelector('#inp-assist-guidance');
        const previewArea = modal.querySelector('#preview-area');
        const previewInp = modal.querySelector('#inp-assist-preview');
        const loading = modal.querySelector('#assist-loading');

        // Logic
        const close = () => backdrop.remove();
        closeBtn.onclick = close;
        backdrop.onclick = (e) => { if (e.target === backdrop) close(); };

        const generate = async () => {
            const guidance = guidanceInp.value.trim();
            const prompt = guidance ? `Instruction: ${guidance}` : "Improve this text.";

            // UI State
            loading.style.display = 'block';
            previewArea.style.display = 'none';
            goBtn.disabled = true;
            applyBtn.style.display = 'none';

            try {
                // Construct prompt
                // We pass a single user message with the context
                const history = [{
                    role: 'user',
                    content: `${prompt}\n\n[Current Content]:\n${currentText || "(Empty)"}`
                }];

                const result = await A.LLM.generate(systemPrompt, history);

                // Show result
                previewInp.value = result;
                previewArea.style.display = 'grid';
                applyBtn.style.display = 'block';
                goBtn.textContent = "Retry";
            } catch (err) {
                if (A.UI.Toast) A.UI.Toast.show(err.message, 'error');
            } finally {
                loading.style.display = 'none';
                goBtn.disabled = false;
            }
        };

        goBtn.onclick = generate;
        guidanceInp.onkeydown = (e) => { if (e.key === 'Enter') generate(); };

        applyBtn.onclick = () => {
            // Apply to target
            setValue(previewInp.value);

            // Trigger change event if standard input (not custom setter)
            if (!options.setValue) {
                targetInput.dispatchEvent(new Event('change', { bubbles: true }));
                targetInput.dispatchEvent(new Event('input', { bubbles: true })); // For auto-resize
            }

            if (A.UI.Toast) A.UI.Toast.show('Text updated', 'success');
            close();
        };

        // Focus guidance
        setTimeout(() => guidanceInp.focus(), 50);
    }

    // Expose
    A.UI.Assistant = Assistant;

})(window.Anansi);
