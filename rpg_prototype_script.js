// RPG Combat Prototype Script
// Copy this into a new Script in the Scripts Panel to test the flow.

// 1. INPUT PHASE: Handle Mechanics
if (context.phase === 'input') {
    // Simple command detection
    const input = (context.user_input || "").toLowerCase();

    if (input.includes('attack') || input.includes('fight') || input.includes('strike')) {

        // Initialize Persistent Source if not present
        // Ensure you add a Source named 'orc_hp' in the Sources panel for true persistence!
        let hp = parseInt(context.sources['orc_hp']);
        if (isNaN(hp)) hp = 20; // Default start value

        // Mechanic: Roll D20
        const roll = Math.floor(Math.random() * 20) + 1;
        const ac = 12; // Armor Class

        let result = "";

        if (roll >= ac) {
            const dmg = Math.floor(Math.random() * 8) + 1;
            hp -= dmg;
            // Cap at 0
            if (hp < 0) hp = 0;

            result = `HIT! (Rolled ${roll} vs AC ${ac}). Dealt ${dmg} damage.`;

            // Update Persistence (write back to context.sources)
            context.sources['orc_hp'] = hp;
        } else {
            result = `MISS. (Rolled ${roll} vs AC ${ac}).`;
        }

        // Inject System Note for LLM
        // This tells the LLM what happened so it can describe it.
        context.system_notes = `[SYSTEM MECHANICS: Player attacked. Result: ${result} Orc HP Remaining: ${hp}/20.]`;

        // Log for debugging
        console.log("Combat Logic:", result);
    }
}

// 2. OUTPUT PHASE: Append Stat Block (Header/Footer)
if (context.phase === 'output') {
    // Read the current HP (potentially modified in input phase)
    let hp = parseInt(context.sources['orc_hp']);
    if (isNaN(hp)) hp = 20;

    // Create a visual health bar
    const max = 20;
    const filled = Math.ceil((hp / max) * 10);
    const bar = "█".repeat(filled) + "░".repeat(10 - filled);

    // Append to the LLM's response
    // We modify 'responseText' which simulator.js uses for the final message
    context.responseText += `\n\n> **ENEMY STATUS**\n> **Orc**: [${bar}] ${hp}/${max} HP`;
}
