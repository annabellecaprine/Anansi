
(function (A) {
    if (!A.UI) return;

    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed; top:20px; right:20px; width:400px; height:500px; background:var(--bg-card); border:1px solid var(--border-default); z-index:9999; display:flex; flex-direction:column; box-shadow:0 10px 30px rgba(0,0,0,0.5); border-radius:8px;';

    overlay.innerHTML = `
        <div style="padding:10px; background:var(--bg-deep); border-bottom:1px solid var(--border-subtle); display:flex; justify-content:space-between; align-items:center;">
            <strong>Chronos Prompt Inspector</strong>
            <button id="dbg-close" style="background:none; border:none; color:var(--text-muted); cursor:pointer;">X</button>
        </div>
        <div style="flex:1; overflow:hidden; display:flex; flexDirection:column;">
            <textarea id="dbg-output" style="width:100%; height:100%; background:var(--bg-base); color:var(--text-code); font-family:monospace; font-size:11px; border:none; padding:10px; resize:none;" readonly placeholder="Waiting for next message..."></textarea>
        </div>
        <div style="padding:8px; display:flex; gap:8px;">
            <button id="dbg-refresh" class="btn btn-sm btn-ghost">Refresh State</button>
        </div>
    `;

    document.body.appendChild(overlay);

    overlay.querySelector('#dbg-close').onclick = () => document.body.removeChild(overlay);
    overlay.querySelector('#dbg-refresh').onclick = () => {
        const state = A.State.get();
        const pending = state.chronos?.pendingChanges;
        const output = [];
        output.push("=== PENDING CHANGES STATE ===");
        output.push(JSON.stringify(pending, null, 2));
        output.push("\n=== CHRONOS HISTORY (LAST 3) ===");
        const hist = state.chronos?.history || [];
        output.push(JSON.stringify(hist.slice(-3), null, 2));

        document.getElementById('dbg-output').value = output.join('\n');
    };

    // Hook into A.LLM.generate to capture the raw prompt
    const originalGenerate = A.LLM.generate;
    A.LLM.generate = async function (system, history, config) {
        const output = [];
        output.push("=== SYSTEM PROMPT ===");
        output.push(system);
        output.push("\n=== HISTORY (API) ===");
        output.push(JSON.stringify(history, null, 2));

        const ta = document.getElementById('dbg-output');
        if (ta) ta.value = output.join('\n');

        return originalGenerate.call(this, system, history, config);
    };

    console.log("Chronos Debug Panel Injected");

})(window.Anansi);
