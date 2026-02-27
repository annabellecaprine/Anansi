
const actorName = "Freya";
const presetText = `{{name}} "beams" with delight`; // hypothetical dangerous text
const resolvedText = presetText.replace(/\{\{name\}\}/g, actorName);

console.log(`Resolved: ${resolvedText}`);

const html = `<input value="${resolvedText}">`;
console.log(`HTML: ${html}`);

if (html.includes(`value="Freya "`)) {
    console.log("FAIL: Attribute broken by quotes");
} else {
    console.log("PASS: Attribute intact");
}

// Check the actual presets for quotes
const presets = {
    joy: `{{name}}'s ears perk`, // Single quote
};
const resolvedJoy = presets.joy.replace(/\{\{name\}\}/g, actorName);
const htmlJoy = `<input value="${resolvedJoy}">`;
console.log(`Actual Preset HTML: ${htmlJoy}`);
