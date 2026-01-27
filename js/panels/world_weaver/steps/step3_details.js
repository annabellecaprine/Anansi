/*
 * World Weaver: Step 3 (Details)
 * File: js/panels/world_weaver/steps/step3_details.js
 */

(function (A) {
    'use strict';

    A.WorldWeaver = A.WorldWeaver || {};
    A.WorldWeaver.Steps = A.WorldWeaver.Steps || {};

    // Added: 'refresh' callback to rerender on state change
    A.WorldWeaver.Steps.renderStep3 = function (container, setupState, sessions, onFinish, onBack, refresh) {
        const T = A.WorldWeaver.Templates;

        container.innerHTML += `<div style="text-align:center; margin-bottom:20px; font-size:16px; font-weight:600;">Final Details</div>`;
        const form = document.createElement('div');
        form.style.cssText = 'padding:12px;';

        // --- NAME ---
        form.innerHTML += `
           <div style="margin-bottom:20px;">
                <label style="display:block; font-size:12px; font-weight:600; color:var(--text-secondary); margin-bottom:8px; text-transform:uppercase;">Session Name</label>
                <input type="text" id="ww-session-name" value="${setupState.name || ''}" placeholder="The Crystal Empire" style="width:100%; padding:12px; background:var(--bg-base); border:1px solid var(--border-subtle); border-radius:8px; color:var(--text-primary);">
            </div>
        `;

        // --- TAGS ---
        const currentTagString = setupState.customTags || '';
        const existingTags = currentTagString.split(',').map(t => t.trim()).filter(t => t);
        const tagsHtml = existingTags.map(tag => `
            <span style="display:inline-flex; align-items:center; background:var(--bg-elevated); border:1px solid var(--border-subtle); padding:4px 8px; border-radius:12px; font-size:12px; color:var(--text-primary); margin-right:4px; margin-bottom:4px;">
                ${tag}
                <button class="rm-tag-btn" data-tag="${tag}" style="margin-left:6px; background:transparent; border:none; color:var(--text-muted); cursor:pointer; font-weight:bold; padding:0 4px;">&times;</button>
            </span>
        `).join('');

        form.innerHTML += `
           <div style="margin-bottom:20px;">
                <label style="display:block; font-size:12px; font-weight:600; color:var(--text-secondary); margin-bottom:8px; text-transform:uppercase;">Flavor Tags</label>
                <div style="width:100%; padding:8px; background:var(--bg-base); border:1px solid var(--border-subtle); border-radius:8px; display:flex; flex-wrap:wrap; align-items:center; min-height:42px;">
                    ${tagsHtml}
                    <input type="text" id="ww-tag-input" placeholder="${existingTags.length === 0 ? 'School, Noir, Cyberpunk...' : 'Add tag...'}" style="flex:1; min-width:80px; background:transparent; border:none; color:var(--text-primary); padding:4px; outline:none;">
                </div>
                <div style="font-size:11px; color:var(--text-muted); margin-top:4px;">Press Enter or Comma to add tags.</div>
            </div>
        `;

        // --- STORY FOCUS ---
        const isProtag = setupState.storyFocus === 'protagonist';
        const isEnsemble = setupState.storyFocus === 'ensemble';

        form.innerHTML += `
            <div style="margin-bottom:20px;">
                <label style="display:block; font-size:12px; font-weight:600; color:var(--text-secondary); margin-bottom:8px; text-transform:uppercase;">Story Focus</label>
                <div style="display:flex; gap:12px;">
                    <button id="ww-focus-protagonist" class="focus-opt" style="flex:1; padding:12px; border:2px solid ${isProtag ? 'var(--accent)' : 'var(--border-subtle)'}; background:${isProtag ? 'var(--bg-elevated)' : 'var(--bg-panel)'}; border-radius:8px; cursor:pointer; text-align:left; transition:all 0.2s ease; position:relative;">
                        ${isProtag ? '<div style="position:absolute; top:8px; right:8px; color:var(--accent);">✓</div>' : ''}
                        <div style="font-size:20px; margin-bottom:4px;">🎭 <span style="font-size:13px; font-weight:600; color:var(--text-primary);">Protagonist</span></div>
                        <div style="font-size:10px; color:var(--text-secondary);">Single Character Focus</div>
                    </button>
                    <button id="ww-focus-ensemble" class="focus-opt" style="flex:1; padding:12px; border:2px solid ${isEnsemble ? 'var(--accent)' : 'var(--border-subtle)'}; background:${isEnsemble ? 'var(--bg-elevated)' : 'var(--bg-panel)'}; border-radius:8px; cursor:pointer; text-align:left; transition:all 0.2s ease; position:relative;">
                        ${isEnsemble ? '<div style="position:absolute; top:8px; right:8px; color:var(--accent);">✓</div>' : ''}
                         <div style="font-size:20px; margin-bottom:4px;">👥 <span style="font-size:13px; font-weight:600; color:var(--text-primary);">Ensemble</span></div>
                        <div style="font-size:10px; color:var(--text-secondary);">Multi-Cast Party</div>
                    </button>
                </div>
            </div>
        `;

        // --- CONTENT RATING ---
        form.innerHTML += `
            <div style="margin-bottom:20px;">
                <label style="display:block; font-size:12px; font-weight:600; color:var(--text-secondary); margin-bottom:8px; text-transform:uppercase;">Content Rating</label>
                <div style="display:flex; gap:8px;">
                    ${T.CONTENT_RATINGS.map(r => {
            const isSel = setupState.contentRating === r.id;
            return `
                        <button class="rating-btn" data-id="${r.id}" style="flex:1; padding:10px; border:2px solid ${isSel ? 'var(--accent)' : 'var(--border-subtle)'}; background:${isSel ? 'var(--bg-elevated)' : 'var(--bg-panel)'}; color:${isSel ? 'var(--text-primary)' : 'var(--text-secondary)'}; border-radius:6px; cursor:pointer; font-size:11px; font-weight:600; transition:all 0.2s ease;">${r.label}</button>
                        `;
        }).join('')}
                </div>
            </div>
        `;

        // --- IMPORT ACTOR ---
        form.innerHTML += `
             <div style="margin-bottom:24px;">
                <label style="display:block; font-size:12px; font-weight:600; color:var(--text-secondary); margin-bottom:8px; text-transform:uppercase;">Import Actor (Optional)</label>
                <div id="ww-actor-import" style="padding:12px; background:var(--bg-panel); border:2px dashed var(--border-subtle); border-radius:8px; text-align:center; cursor:pointer;">
                    <span>${setupState.actor ? '✅ ' + setupState.actor.name : '📥 Click to select an Actor'}</span>
                </div>
            </div>
        `;

        // --- FINISH BUTTON ---
        form.innerHTML += `<button id="ww-finish-btn" style="width:100%; padding:14px; background:var(--accent); border:none; border-radius:8px; color:white; font-weight:600; cursor:pointer; font-size:16px;">✨ Begin Weaving</button>`;

        container.appendChild(form);

        // --- BACK BUTTON ---
        const backBtn = document.createElement('button');
        backBtn.innerHTML = '← Back to Story Mode';
        backBtn.style.cssText = 'width:100%; padding:12px; background:transparent; border:none; color:var(--text-muted); cursor:pointer; margin-top:8px;';
        backBtn.onclick = () => onBack(2);
        container.appendChild(backBtn);

        // ============================================
        // EVENT WIRING (Now Internal!)
        // ============================================

        // 1. Name Input
        container.querySelector('#ww-session-name').oninput = (e) => setupState.name = e.target.value;

        // 2. Story Focus
        const protagBtn = container.querySelector('#ww-focus-protagonist');
        const ensembleBtn = container.querySelector('#ww-focus-ensemble');

        protagBtn.onclick = () => { setupState.storyFocus = 'protagonist'; refresh(); };
        ensembleBtn.onclick = () => { setupState.storyFocus = 'ensemble'; refresh(); };

        if (!isProtag) {
            protagBtn.onmouseover = () => protagBtn.style.borderColor = 'var(--text-muted)';
            protagBtn.onmouseout = () => protagBtn.style.borderColor = 'var(--border-subtle)';
        }
        if (!isEnsemble) {
            ensembleBtn.onmouseover = () => ensembleBtn.style.borderColor = 'var(--text-muted)';
            ensembleBtn.onmouseout = () => ensembleBtn.style.borderColor = 'var(--border-subtle)';
        }

        // 3. Content Rating
        container.querySelectorAll('.rating-btn').forEach(btn => {
            const rId = btn.dataset.id;
            btn.onclick = () => {
                setupState.contentRating = rId;
                refresh();
            };
            if (setupState.contentRating !== rId) {
                btn.onmouseover = () => btn.style.borderColor = 'var(--text-muted)';
                btn.onmouseout = () => btn.style.borderColor = 'var(--border-subtle)';
            }
        });

        // 4. Tags
        const tagInput = container.querySelector('#ww-tag-input');
        if (tagInput) {
            tagInput.onkeydown = (e) => {
                if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    const val = tagInput.value.trim().replace(',', '');
                    if (val) {
                        const currentTags = setupState.customTags ? setupState.customTags.split(',').map(t => t.trim()).filter(t => t) : [];
                        if (!currentTags.includes(val)) {
                            currentTags.push(val);
                            setupState.customTags = currentTags.join(', ');
                            refresh();
                            // Note: Post-refresh focus loss is tricky with simple refresh. 
                            // Ideal: Use state preservation or simpler DOM update. 
                            // For V2: Accept "refresh()" re-renders whole step.
                            // We can try to refocus after refresh if coordinator allows, but coordinator renders async? No, 'refresh()' calls renderSetupWizard which is synchronous.
                            // So we can setTimeout focus here? No, the ELEMENTS are destroyed and replaced.
                            // The ID remains same.
                            setTimeout(() => { const i = document.querySelector('#ww-tag-input'); if (i) i.focus(); }, 10);
                        }
                    }
                } else if (e.key === 'Backspace' && !tagInput.value) {
                    const currentTags = setupState.customTags ? setupState.customTags.split(',').map(t => t.trim()).filter(t => t) : [];
                    if (currentTags.length > 0) {
                        currentTags.pop();
                        setupState.customTags = currentTags.join(', ');
                        refresh();
                        setTimeout(() => { const i = document.querySelector('#ww-tag-input'); if (i) i.focus(); }, 10);
                    }
                }
            };
        }

        container.querySelectorAll('.rm-tag-btn').forEach(btn => {
            btn.onclick = () => {
                const tagToRemove = btn.dataset.tag;
                const currentTags = setupState.customTags.split(',').map(t => t.trim()).filter(t => t);
                const newTags = currentTags.filter(t => t !== tagToRemove);
                setupState.customTags = newTags.join(', ');
                refresh();
            };
        });

        // 5. Actor Import
        const actorBtn = container.querySelector('#ww-actor-import');
        if (actorBtn) {
            actorBtn.onclick = () => {
                // Simplified Actor Picker (Inline modal for speed)
                const actors = Object.values(A.State.get().nodes?.actors?.items || {});
                if (actors.length === 0) return A.UI.Toast.show('No actors found in project.', 'warning');

                const modal = document.createElement('div');
                modal.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.8); display:flex; align-items:center; justify-content:center; z-index:10005;';
                modal.innerHTML = `
                 <div style="background:var(--bg-surface); padding:24px; border-radius:12px; width:400px; max-width:90vw; max-height:80vh; display:flex; flex-direction:column;">
                     <h3 style="margin-top:0;">Select an Actor</h3>
                     <div style="flex:1; overflow-y:auto; display:flex; flex-direction:column; gap:8px;">
                        ${actors.map(actor => `
                            <button class="actor-btn" data-id="${actor.id}" style="
                                padding:12px; text-align:left; background:var(--bg-elevated); border:1px solid var(--border-subtle); 
                                border-radius:8px; cursor:pointer; color:var(--text-primary); display:flex; align-items:center; gap:12px;
                            ">
                                <div style="font-weight:600;">${actor.name}</div>
                            </button>
                        `).join('')}
                     </div>
                     <button id="modal-cancel" style="margin-top:16px; width:100%; padding:12px; background:transparent; border:1px solid var(--border-subtle); color:var(--text-primary); cursor:pointer;">Cancel</button>
                 </div>`;
                document.body.appendChild(modal);

                modal.querySelectorAll('.actor-btn').forEach(ab => {
                    ab.onclick = () => {
                        const actorId = ab.dataset.id;
                        setupState.actor = actors.find(a => a.id === actorId);
                        modal.remove();
                        refresh();
                    };
                });
                modal.querySelector('#modal-cancel').onclick = () => modal.remove();
            };
        }

        // 6. Finish
        container.querySelector('#ww-finish-btn').onclick = onFinish;

    };

}(window.Anansi));
