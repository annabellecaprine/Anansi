
(function () {
    console.log("--- TEST START: Chronos Pending Changes ---");

    // 1. Mock State
    const state = {
        chronos: {
            weather: { condition: 'clear', intensity: 'light' },
            pendingChanges: null
        }
    };

    // 2. Mock Anansi
    window.Anansi = window.Anansi || {};
    const A = window.Anansi;

    if (!A.Chronos) {
        console.error("A.Chronos not found!");
        return;
    }

    // 3. Stage Change
    console.log("Staging change: Weather -> storm, Intensity -> extreme");
    A.Chronos.stagePendingChange(state, 'weather', 'storm');
    A.Chronos.stagePendingChange(state, 'intensity', 'extreme');

    console.log("Pending after stage:", JSON.stringify(state.chronos.pendingChanges));

    // 4. Check description
    const desc = A.Chronos.getPendingDescription(state);
    console.log("Pending Description:", desc);

    // 5. Apply Change
    console.log("Applying changes...");
    const changed = A.Chronos.applyPendingChanges(state);

    console.log("Has Changes:", changed);
    console.log("New Weather:", JSON.stringify(state.chronos.weather));
    console.log("Pending cleared?", state.chronos.pendingChanges === null);

    if (state.chronos.weather.condition === 'storm' && state.chronos.weather.intensity === 'extreme') {
        console.log("SUCCESS: State updated correctly.");
    } else {
        console.error("FAILURE: State did not update.");
    }
})();
