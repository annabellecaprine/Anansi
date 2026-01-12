/*
 * Anansi Plugin: Parlor Prompts & Interview Logic
 * File: js/plugins/parlor/parlor-prompts.js
 * Purpose: Question sequence and LLM prompt builders for the Spider's Parlor.
 */

(function (A) {
    'use strict';

    // Ensure Parlor namespace exists
    A.Parlor = A.Parlor || {};

    // ============================================
    // QUESTION SEQUENCE
    // ============================================
    A.Parlor.QUESTIONS = [
        {
            id: 'greeting',
            text: "Ah, a storyteller approaches my web... Come closer, weary traveler. Tell me, what kind of tale draws you here today?",
            type: 'auto',
            delay: 2500
        },
        {
            id: 'mode',
            text: "How shall we begin? Do you wish to dive right in, or craft something tailored just for you?",
            type: 'buttons',
            options: [
                { label: '⚡ Quick Weave', value: 'quick' },
                { label: '🎨 Tailored Story', value: 'full' }
            ]
        },
        // ========== QUICK START PATH ==========
        {
            id: 'quick_theme',
            text: "What flavor of story calls to you?",
            type: 'buttons',
            condition: (answers) => answers.mode === 'quick',
            options: [
                { label: '💕 Romance', value: 'romance' },
                { label: '⚔️ Adventure', value: 'adventure' },
                { label: '🔍 Mystery', value: 'mystery' },
                { label: '👻 Horror', value: 'horror' },
                { label: '🎭 Drama', value: 'drama' }
            ]
        },
        {
            id: 'quick_setting',
            text: "And what world shall this story inhabit?",
            type: 'buttons',
            condition: (answers) => answers.mode === 'quick',
            options: [
                { label: '🗡️ Fantasy', value: 'fantasy' },
                { label: '🚀 Sci-Fi', value: 'scifi' },
                { label: '🏙️ Modern', value: 'modern' },
                { label: '📜 Historical', value: 'historical' }
            ]
        },
        {
            id: 'quick_gender',
            text: "What form shall your companion take?",
            type: 'buttons',
            condition: (answers) => answers.mode === 'quick',
            options: [
                { label: 'Male', value: 'male' },
                { label: 'Female', value: 'female' },
                { label: 'Non-binary', value: 'nonbinary' },
                { label: 'Any', value: 'any' }
            ]
        },
        {
            id: 'quick_template',
            text: "Choose a soul to weave...",
            type: 'buttons',
            condition: (answers) => answers.mode === 'quick',
            getOptions: (answers) => {
                const templates = {
                    romance: [
                        { label: '🌹 The Brooding Noble', value: 'brooding_noble', desc: 'Wealthy, mysterious, hiding pain behind cold walls' },
                        { label: '☀️ Childhood Friend', value: 'childhood_friend', desc: 'Sweet reunion, feelings never confessed' },
                        { label: '🔥 Forbidden Attraction', value: 'forbidden', desc: 'They shouldn\'t want each other, but they do' },
                        { label: '💔 Second Chance', value: 'second_chance', desc: 'Former lovers meeting again after years apart' }
                    ],
                    adventure: [
                        { label: '🗡️ Reluctant Hero', value: 'reluctant_hero', desc: 'Thrust into destiny, would rather be left alone' },
                        { label: '🏴‍☠️ Charming Rogue', value: 'charming_rogue', desc: 'Quick wit, quicker fingers, heart of gold' },
                        { label: '🛡️ Hardened Warrior', value: 'hardened_warrior', desc: 'Seen too much, fought too long' },
                        { label: '🔮 Mysterious Mentor', value: 'mysterious_mentor', desc: 'Knows more than they let on, guides with riddles' }
                    ],
                    mystery: [
                        { label: '🔎 The Detective', value: 'detective', desc: 'Brilliant mind, unconventional methods' },
                        { label: '🎭 Person of Interest', value: 'person_interest', desc: 'Suspect or witness? Hard to tell' },
                        { label: '📰 Investigative Reporter', value: 'reporter', desc: 'Chasing the story, whatever the cost' },
                        { label: '🕵️ The Insider', value: 'insider', desc: 'Knows the secrets, bound by silence' }
                    ],
                    horror: [
                        { label: '👤 The Survivor', value: 'survivor', desc: 'They\'ve seen things, won\'t talk about them' },
                        { label: '🩸 The Monster', value: 'monster', desc: 'Inhuman, but hauntingly beautiful' },
                        { label: '📿 The Believer', value: 'believer', desc: 'Knows the old ways, prepares for what\'s coming' },
                        { label: '🏚️ The Haunted', value: 'haunted', desc: 'Something follows them, always watching' }
                    ],
                    drama: [
                        { label: '👑 Fallen Royalty', value: 'fallen_royalty', desc: 'Lost everything, clinging to dignity' },
                        { label: '🎪 The Performer', value: 'performer', desc: 'All the world\'s a stage, they never stop acting' },
                        { label: '⚖️ Moral Crossroads', value: 'moral_crossroads', desc: 'Good person, impossible choice' },
                        { label: '🌙 The Outcast', value: 'outcast', desc: 'Society rejected them, they rejected society' }
                    ]
                };
                return templates[answers.quick_theme] || templates.romance;
            }
        },
        {
            id: 'quick_confirm',
            text: "The pattern is clear. Shall I weave this soul into being?",
            type: 'buttons',
            condition: (answers) => answers.mode === 'quick',
            options: [
                { label: '🕸️ Weave My Story', value: 'weave', primary: true }
            ]
        },
        // ========== FULL PATH ==========
        {
            id: 'cast',
            text: "Do you seek to craft a single soul, or shall we weave an ensemble of characters?",
            type: 'buttons',
            condition: (answers) => answers.mode === 'full',
            options: [
                { label: 'A Single Soul', value: 'solo' },
                { label: 'An Ensemble', value: 'ensemble' }
            ]
        },
        {
            id: 'ensemble_details',
            text: "An ensemble! How delightful. Tell me more about this cast... How many souls, and what binds them together?",
            type: 'textarea',
            placeholder: "Describe the group: how many characters, their relationships, the dynamic between them...",
            condition: (answers) => answers.mode === 'full' && answers.cast === 'ensemble'
        },
        {
            id: 'gender',
            text: "And the protagonist of this tale... what form do they take?",
            type: 'buttons',
            condition: (answers) => answers.mode === 'full',
            options: [
                { label: 'Male', value: 'male' },
                { label: 'Female', value: 'female' },
                { label: 'Non-binary', value: 'nonbinary' },
                { label: 'You Decide', value: 'any' }
            ],
            getText: (answers) => answers.cast === 'ensemble'
                ? "And the lead character of this ensemble... what form do they take?"
                : "And the protagonist of this tale... what form do they take?"
        },
        {
            id: 'archetype',
            text: "What archetype calls to your soul? What essence shall define them?",
            type: 'buttons',
            condition: (answers) => answers.mode === 'full',
            options: [
                { label: '🎭 The Trickster', value: 'trickster' },
                { label: '🛡️ The Guardian', value: 'guardian' },
                { label: '🌍 The Wanderer', value: 'wanderer' },
                { label: '💕 The Lover', value: 'lover' },
                { label: '🌑 The Shadow', value: 'shadow' },
                { label: '❓ Surprise Me', value: 'any' }
            ]
        },
        {
            id: 'genre',
            text: "Every tale needs its world. What realm calls to you?",
            type: 'buttons',
            condition: (answers) => answers.mode === 'full',
            options: [
                { label: '🗡️ Fantasy', value: 'fantasy' },
                { label: '🚀 Sci-Fi', value: 'scifi' },
                { label: '🏙️ Modern', value: 'modern' },
                { label: '👻 Horror', value: 'horror' },
                { label: '💕 Romance', value: 'romance' },
                { label: '📜 Historical', value: 'historical' }
            ]
        },
        {
            id: 'tone',
            text: "What mood shall hang in the air of your story?",
            type: 'buttons',
            condition: (answers) => answers.mode === 'full',
            options: [
                { label: 'Dark & Serious', value: 'dark' },
                { label: 'Light & Playful', value: 'light' },
                { label: 'Mysterious', value: 'mysterious' },
                { label: 'Dramatic', value: 'dramatic' },
                { label: 'Cozy & Warm', value: 'cozy' }
            ]
        },
        {
            id: 'rating',
            text: "How... intimate shall this story become?",
            type: 'buttons',
            condition: (answers) => answers.mode === 'full',
            options: [
                { label: '☀️ Keep it Wholesome', value: 'sfw' },
                { label: '🌙 Mature Themes', value: 'mature' },
                { label: '🔥 Explicit', value: 'explicit' }
            ]
        },
        {
            id: 'pov',
            text: "How shall the tale be told? What voice speaks the story?",
            type: 'buttons',
            condition: (answers) => answers.mode === 'full',
            options: [
                { label: '👁️ 2nd Person (you/your)', value: '2nd' },
                { label: '📖 3rd Person (he/she/they)', value: '3rd' },
                { label: '🗣️ 1st Person (I/me)', value: '1st' }
            ]
        },
        {
            id: 'tense',
            text: "And the flow of time... past or present?",
            type: 'buttons',
            condition: (answers) => answers.mode === 'full',
            options: [
                { label: '⏮️ Past Tense (walked, said)', value: 'past' },
                { label: '⏺️ Present Tense (walks, says)', value: 'present' }
            ]
        },
        {
            id: 'user_role',
            text: "And YOU, dear storyteller... what role shall you play in this tale?",
            type: 'buttons',
            condition: (answers) => answers.mode === 'full',
            options: [
                { label: '🎭 A Stranger They Meet', value: 'stranger' },
                { label: '💫 Someone From Their Past', value: 'past' },
                { label: '🤝 A Close Companion', value: 'companion' },
                { label: '⚔️ A Rival or Adversary', value: 'rival' },
                { label: '❓ Surprise Me', value: 'surprise' }
            ]
        },
        {
            id: 'challenge',
            text: "*The spider's eyes glint with mischief...* Why don't we make things a little more interesting?",
            type: 'buttons',
            condition: (answers) => answers.mode === 'full',
            options: [
                { label: '✨ Yes, spice it up!', value: 'yes' },
                { label: '🕊️ Keep it simple', value: 'no' }
            ]
        },
        {
            id: 'challenge_type',
            text: "Ohoho! Then tell me... what secret spice shall we add to this tale?",
            type: 'buttons',
            condition: (answers) => answers.mode === 'full' && answers.challenge === 'yes',
            options: [
                { label: '🔮 A Dark Secret', value: 'secret' },
                { label: '💔 Forbidden Connection', value: 'forbidden' },
                { label: '👤 Hidden Identity', value: 'identity' },
                { label: '⚡ Dangerous Power', value: 'power' },
                { label: '🎲 Surprise Me', value: 'surprise' }
            ]
        },
        {
            id: 'concept',
            text: "Now then... whisper to me the seed of your story. What vision burns in your mind?",
            type: 'textarea',
            condition: (answers) => answers.mode === 'full',
            placeholder: "Describe the character, their world, and how your paths might cross..."
        },
        {
            id: 'extras',
            text: "Is there anything else the weave should contain? Special elements, themes, or flavors you desire?",
            type: 'textarea',
            condition: (answers) => answers.mode === 'full',
            placeholder: "(Optional) Any additional details...",
            optional: true,
            skipLabel: 'Skip this step'
        },
        {
            id: 'confirm',
            text: "The threads are gathered. The pattern is clear in my mind. Shall I begin the weave?",
            type: 'buttons',
            condition: (answers) => answers.mode === 'full',
            options: [
                { label: '🕸️ Weave My Story', value: 'weave', primary: true }
            ]
        }
    ];

    // ============================================
    // QUICK START TEMPLATE DESCRIPTIONS
    // ============================================
    A.Parlor.TEMPLATE_PROMPTS = {
        // Romance
        brooding_noble: 'A wealthy noble with a cold exterior who hides deep pain and loneliness behind walls of ice. Reserved, intense, secretly yearning for genuine connection.',
        childhood_friend: 'A sweet reunion with someone from the past - feelings were never confessed, but now fate brings them together again. Warm, nostalgic, with unspoken tension.',
        forbidden: 'An attraction that shouldn\'t exist - different worlds, opposing sides, or social taboos stand between them. Intense, dangerous, irresistible.',
        second_chance: 'Former lovers meeting again after years apart. Old wounds, lingering feelings, and the question of what might have been.',
        // Adventure
        reluctant_hero: 'Thrust into destiny against their will, they\'d rather be left alone. Gruff exterior, hidden nobility, carrying burdens they don\'t discuss.',
        charming_rogue: 'Quick wit and quicker fingers, they survive on charm and cunning. Heart of gold beneath the devil-may-care attitude.',
        hardened_warrior: 'Seen too much, fought too long. Fights for those who can\'t, speaks little, observes everything. Haunted but unbroken.',
        mysterious_mentor: 'Knows far more than they reveal. Guides with cryptic wisdom, tests with strange challenges. Ancient secrets lurk behind kind eyes.',
        // Mystery
        detective: 'Brilliant deductive mind with unconventional methods. Obsessive about truth, socially awkward, sees patterns others miss.',
        person_interest: 'Are they suspect or witness? Victim or perpetrator? Everything about them is a puzzle wrapped in enigma.',
        reporter: 'Chasing the story at any cost. Tenacious, morally flexible when needed, driven by the need to expose truth.',
        insider: 'They know the secrets but are bound by silence. Every word is measured, every glance meaningful.',
        // Horror
        survivor: 'They\'ve seen things no one should see. Don\'t ask about the scars. Some experiences leave marks that never fade.',
        monster: 'Beautiful and terrifying. Not quite human, not quite other. Hunger wars with something almost like tenderness.',
        believer: 'They know the old ways, the old protections. When darkness comes, they alone understand what must be done.',
        haunted: 'Something follows them. Always watching. They\'ve learned to live with the presence, but it\'s getting stronger.',
        // Drama
        fallen_royalty: 'Once had everything, now clings to dignity alone. Pride battles with desperate need, nobility with survival.',
        performer: 'The mask never comes off. Every interaction is a performance, but what lies beneath the act?',
        moral_crossroads: 'A good person facing an impossible choice. No matter what they do, someone suffers.',
        outcast: 'Society rejected them first. Now they\'ve built walls and weapons from that rejection.'
    };

    // ============================================
    // QUICK START PROMPT BUILDER
    // ============================================
    A.Parlor.buildQuickStartPrompt = function (answers) {
        const templateDesc = A.Parlor.TEMPLATE_PROMPTS[answers.quick_template] || 'A compelling character with depth and mystery.';
        const genderHint = answers.quick_gender === 'any' ? 'any gender you find fitting' : `a ${answers.quick_gender} character`;

        return `You are Anansi, the Spider God and Master of Stories.
A storyteller seeks a quick tale. Weave them a character with these parameters:

CHARACTER TEMPLATE: ${templateDesc}

REQUIREMENTS:
- Setting: ${answers.quick_setting}
- Theme: ${answers.quick_theme}
- Gender: ${genderHint}
- Rating: Mature themes acceptable (violence, darker emotions, suggestive content)
- This is for interactive roleplay - the USER will participate

Create a character card with:
- **Name**: A fitting, memorable name
- **Personality**: 2-3 paragraphs describing who they are, their traits, motivations, and quirks
- **Scenario**: How {{user}} encounters them. Include:
  1. The setting and atmosphere
  2. What the character is doing
  3. A hook for {{user}} to enter the story
  4. An opening situation inviting interaction

NARRATIVE STYLE:
- POV: 2nd person (you/your) addressing {{user}}
- Tense: Present tense
- User Role: A stranger meeting them for the first time

FORMATTING:
- *Asterisks* for actions: *She turned slowly.*
- "Quotes" for dialogue: "Hello," she said.
- **Bold** for emphasis
- Paragraph breaks for pacing
- ESCAPE internal double quotes: "Lila \"Flick\" Kane" OR use single quotes: "Lila 'Flick' Kane"


CRITICAL: Respond ONLY with valid JSON:
{"name": "character name", "appearance": "physical description", "personality": "personality text", "scenario": "scenario text", "firstMessage": "optional opening message"}`;
    };

    // ============================================
    // STORY DESIGNER PROMPT (Enhanced with User Anchoring)
    // ============================================
    A.Parlor.buildSystemPrompt = function (answers) {
        const castType = answers.cast === 'solo' ? 'a single main character' : 'an ensemble cast with multiple characters';
        const genderHint = answers.gender === 'any' ? 'any gender you find fitting' : `a ${answers.gender} protagonist`;
        const ratingGuide = {
            sfw: 'Keep content family-friendly and wholesome.',
            mature: 'Mature themes are acceptable (violence, darker emotions, suggestive content).',
            explicit: 'Adult/explicit content is permitted if it serves the story.'
        };

        const userRoleDescriptions = {
            stranger: 'The user is a stranger the character is meeting for the first time.',
            past: 'The user is someone from the character\'s past - an old friend, former lover, or significant connection.',
            companion: 'The user is a close companion, trusted ally, or intimate confidant of the character.',
            rival: 'The user is a rival, adversary, or someone with conflicting goals.',
            surprise: 'Create an interesting dynamic between the user and character that fits the story.'
        };

        const archetypeDescriptions = {
            trickster: 'The Trickster - cunning, playful, loves mischief and bending rules. Clever and unpredictable.',
            guardian: 'The Guardian - protective, noble, devoted to those they care for. Strong moral compass.',
            wanderer: 'The Wanderer - restless, curious, driven by adventure and discovery. Free-spirited.',
            lover: 'The Lover - passionate, devoted, deeply emotional. Lives for connection and intimacy.',
            shadow: 'The Shadow - complex, morally gray, harboring secrets or darkness. Intriguing and layered.',
            any: 'Choose an archetype that best fits the story concept.'
        };

        const challengeTwists = {
            secret: 'The character harbors a DARK SECRET that could change everything if revealed. Hint at it subtly in the personality.',
            forbidden: 'There is a FORBIDDEN CONNECTION or attraction involved - something taboo, against the rules, or that society disapproves of.',
            identity: 'The character has a HIDDEN IDENTITY - they are not who they appear to be. Their true nature is concealed.',
            power: 'The character possesses a DANGEROUS POWER they must hide or struggle to control. It could be magical, political, or psychological.',
            surprise: 'Add an unexpected narrative twist that adds depth and intrigue to the character.'
        };

        const twistInstruction = answers.challenge === 'yes' && answers.challenge_type
            ? `\n\nNARRATIVE TWIST REQUESTED:\n${challengeTwists[answers.challenge_type] || challengeTwists.surprise}`
            : '';

        return `You are Anansi, the Spider God and Master of Stories.
A storyteller has approached your web seeking help crafting a character for an INTERACTIVE roleplay narrative.

CRITICAL: This is for interactive fiction where the USER will be a participant in the story, not just a reader.

Based on their vision, weave a character card with:
- **Name**: A fitting, memorable name for the character
- **Personality**: 2-3 rich paragraphs describing who they are, their traits, motivations, history, and quirks
- **Scenario**: The setting and current situation that establishes HOW THE USER ENTERS THIS STORY. The scenario MUST include:
  1. The setting and atmosphere
  2. What the character is doing when the story begins
  3. A clear hook for how {{user}} encounters or interacts with them
  4. An opening situation that invites dialogue or action from {{user}}

STORYTELLER'S REQUIREMENTS:
- Cast: ${castType}${answers.ensemble_details ? `\n- Ensemble Details: ${answers.ensemble_details}` : ''}
- Protagonist: ${genderHint}
- Archetype: ${archetypeDescriptions[answers.archetype] || archetypeDescriptions.any}
- Genre: ${answers.genre}
- Tone: ${answers.tone}
- Rating: ${ratingGuide[answers.rating] || ratingGuide.sfw}
- User's Role: ${userRoleDescriptions[answers.user_role] || userRoleDescriptions.surprise}

NARRATIVE STYLE (IMPORTANT):
- Point of View: ${answers.pov === '1st' ? '1st person (I/me) - character narrates their own thoughts' : answers.pov === '2nd' ? '2nd person (you/your) - addressing the reader directly' : '3rd person (he/she/they) - external narrator'}
- Tense: ${answers.tense === 'past' ? 'Past tense (walked, said, felt)' : 'Present tense (walks, says, feels)'}
- Write the scenario in the specified POV and tense!

FORMATTING GUIDE (for scenario text):
- *Single asterisks* for actions and narration: *She turned slowly, her eyes narrowing.*
- "Quotation marks" for dialogue: "Who are you?" she demanded.
- **Double asterisks** for emphasis or important terms: **The ancient artifact** gleamed.
- Use paragraph breaks for pacing and readability.
- ESCAPE internal double quotes: "Lila \"Flick\" Kane" OR use single quotes: "Lila 'Flick' Kane"

${twistInstruction}
${answers.extras ? `\nSPECIAL ELEMENTS REQUESTED:\n${answers.extras}` : ''}
THEIR STORY CONCEPT:
${answers.concept}

IMPORTANT: The scenario should directly address {{user}} or set up an encounter with {{user}}. Do NOT write a scenario where the user has no entry point into the story.

CRITICAL: Respond ONLY with valid JSON in this exact format, no markdown, no explanation:
{"name": "character name", "appearance": "physical description", "personality": "personality text", "scenario": "scenario text that hooks {{user}} into the story"}`;
    };

    // ============================================
    // ENSEMBLE PROMPT BUILDER (2-4 characters with relationships)
    // ============================================
    A.Parlor.buildEnsemblePrompt = function (answers) {
        const ratingGuide = {
            sfw: 'Keep content family-friendly and wholesome.',
            mature: 'Mature themes are acceptable (violence, darker emotions, suggestive content).',
            explicit: 'Adult/explicit content is permitted if it serves the story.'
        };

        return `You are Anansi, the Spider God and Master of Stories.
A storyteller has approached your web seeking an ENSEMBLE CAST for an interactive roleplay narrative.

CRITICAL: This is for interactive fiction where the USER will be a participant in the story.

ENSEMBLE DETAILS FROM THE STORYTELLER:
${answers.ensemble_details || 'Create 2-4 interesting characters with compelling dynamics.'}

STORYTELLER'S REQUIREMENTS:
- Genre: ${answers.genre}
- Tone: ${answers.tone}
- Rating: ${ratingGuide[answers.rating] || ratingGuide.sfw}
- Lead Character Gender: ${answers.gender === 'any' ? 'any' : answers.gender}

NARRATIVE STYLE:
- POV: ${answers.pov === '1st' ? '1st person' : answers.pov === '2nd' ? '2nd person' : '3rd person'}
- Tense: ${answers.tense === 'past' ? 'past tense' : 'present tense'}

${answers.extras ? `SPECIAL ELEMENTS: ${answers.extras}` : ''}
STORY CONCEPT: ${answers.concept}

Create an ensemble cast of 2-4 characters with:
1. Each character has a distinct name, personality, and role
2. Clear relationships and dynamics between characters
3. ONE shared scenario where {{user}} encounters the group

FORMATTING:
- *Asterisks* for actions: *She glanced at him.*
- "Quotes" for dialogue
- **Bold** for emphasis

CRITICAL: Respond ONLY with valid JSON:
{
  "characters": [
    { "name": "...", "appearance": "...", "personality": "2-3 paragraphs", "role": "protagonist/support" },
    { "name": "...", "appearance": "...", "personality": "2-3 paragraphs", "role": "..." }
  ],
  "relationships": [
    { "between": ["Name1", "Name2"], "dynamic": "description of their connection" }
  ],
  "scenario": "shared scenario where {{user}} meets the ensemble"
}`;
    };

    // ============================================
    // PREVIEW MODAL PROMPTS
    // ============================================
    A.Parlor.buildOpeningPrompt = function (name, personality) {
        return `You are "${name}", a character with this personality:
${personality}

Current Context:
Your story has just begun. The user is a stranger encountering you for the first time.

Task:
Write your opening message to {{user}}.
- Stay in character.
- Use the defined POV and Tense (usually 2nd person present).
- Provide a hook for conversation.
- Max 2-3 sentences.`;
    };

    A.Parlor.buildSpinPrompt = function (name, personality) {
        return `You are Anansi, the Spider God. A storyteller wants a NEW scenario for a character.

Character: ${name}
Personality:
${personality}

Task:
Spin a completely new, alternative scenario for how {{user}} meets this character.
- Different setting.
- Different situation.
- Same character personality.
- Max 3-4 sentences.`;
    };

    A.Parlor.buildCompanionPrompt = function (mainName, mainPersonality, scenario, relation) {
        return `You are Anansi, the Spider God. A storyteller has woven one soul and now seeks a companion for them.

Main Character: ${mainName}
Personality: ${mainPersonality}
Scenario: ${scenario}

Relationship to Main Character: ${relation || 'Unknown'}

Task:
Weave a second character who fits into this story.
- Name: Unique
- Role: Defined by relationship
- Personality: Complementary or conflicting

Response JSON:
{"name": "...", "personality": "...", "appearance": "...", "role": "..."}`;
    };

})(window.Anansi);
