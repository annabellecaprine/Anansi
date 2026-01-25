/*
 * World Weaver: Step 2 (Mode)
 * File: js/panels/world_weaver/steps/step2_mode.js
 */

(function (A) {
    'use strict';

    A.WorldWeaver = A.WorldWeaver || {};
    A.WorldWeaver.Steps = A.WorldWeaver.Steps || {};

    A.WorldWeaver.Steps.renderStep2 = function (container, setupState, onNext, onBack) {
        const T = A.WorldWeaver.Templates;

        container.innerHTML += `<div style="text-align:center; margin-bottom:20px; font-size:16px; font-weight:600;">Choose a Story Focus</div>`;

        const grid = document.createElement('div');
        grid.style.cssText = 'display:grid; grid-template-columns:repeat(2, 1fr); gap:12px; margin-bottom:24px;';

        T.STORY_MODES.forEach(mode => {
            const card = document.createElement('button');
            const isSelected = setupState.modeId === mode.id;
            card.style.cssText = `
                display:flex; flex-direction:column; align-items:center; text-align:center; padding:20px; 
                background:${isSelected ? 'var(--bg-elevated)' : 'var(--bg-panel)'}; 
                border:2px solid ${isSelected ? 'var(--accent)' : 'var(--border-subtle)'}; 
                border-radius:12px; cursor:pointer; transition: all 0.2s ease;
            `;
            card.innerHTML = `
                <div style="font-size:32px; margin-bottom:8px;">${mode.icon}</div>
                <div style="font-weight:700; font-size:14px; color:var(--text-primary); margin-bottom:4px;">${mode.label}</div>
                <div style="font-size:11px; color:var(--text-secondary); line-height:1.4;">${mode.description}</div>
            `;
            card.onmouseover = () => { if (!isSelected) card.style.borderColor = 'var(--text-muted)'; };
            card.onmouseout = () => { if (!isSelected) card.style.borderColor = 'var(--border-subtle)'; };
            card.onclick = () => {
                setupState.modeId = mode.id;
                onNext(3); // Go to Step 3
            };
            grid.appendChild(card);
        });
        container.appendChild(grid);

        // Back Button
        const backBtn = document.createElement('button');
        backBtn.innerHTML = '← Back to World Selection';
        backBtn.style.cssText = 'width:100%; padding:12px; background:transparent; border:none; color:var(--text-muted); cursor:pointer;';
        backBtn.onclick = () => onBack(1);
        container.appendChild(backBtn);
    };

}(window.Anansi));
