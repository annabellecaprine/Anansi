/*
 * World Weaver: Step 1 (Archetype)
 * File: js/panels/world_weaver/steps/step1_archetype.js
 */

(function (A) {
    'use strict';

    A.WorldWeaver = A.WorldWeaver || {};
    A.WorldWeaver.Steps = A.WorldWeaver.Steps || {};

    A.WorldWeaver.Steps.renderStep1 = function (container, setupState, onNext) {
        const T = A.WorldWeaver.Templates;

        container.innerHTML += `<div style="text-align:center; margin-bottom:20px; font-size:16px; font-weight:600;">Choose a World Archetype</div>`;

        const grid = document.createElement('div');
        grid.style.cssText = 'display:grid; grid-template-columns:repeat(2, 1fr); gap:12px; margin-bottom:24px;';

        T.WORLD_ARCHETYPES.forEach(arch => {
            const card = document.createElement('button');
            const isSelected = setupState.worldId === arch.id;
            card.style.cssText = `
                display:flex; flex-direction:column; align-items:center; text-align:center; padding:20px; 
                background:${isSelected ? 'var(--bg-elevated)' : 'var(--bg-panel)'}; 
                border:2px solid ${isSelected ? 'var(--accent)' : 'var(--border-subtle)'}; 
                border-radius:12px; cursor:pointer; transition: all 0.2s ease;
            `;
            card.innerHTML = `
                <div style="font-size:32px; margin-bottom:8px;">${arch.icon}</div>
                <div style="font-weight:700; font-size:14px; color:var(--text-primary); margin-bottom:4px;">${arch.label}</div>
                <div style="font-size:11px; color:var(--text-secondary); line-height:1.4;">${arch.description}</div>
            `;
            card.onmouseover = () => { if (!isSelected) card.style.borderColor = 'var(--text-muted)'; };
            card.onmouseout = () => { if (!isSelected) card.style.borderColor = 'var(--border-subtle)'; };
            card.onclick = () => {
                setupState.worldId = arch.id;
                onNext(2); // Go to Step 2
            };
            grid.appendChild(card);
        });
        container.appendChild(grid);
    };

}(window.Anansi));
