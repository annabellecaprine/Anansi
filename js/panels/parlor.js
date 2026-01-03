/*
 * Anansi Panel: The Spider's Parlor - Phase 2.1: Refined Interview
 * File: js/panels/parlor.js
 * Purpose: AI-powered character card creator with interactive conversation experience.
 * Category: Forbidden Secrets
 */

(function (A) {
  'use strict';

  // ============================================
  // QUESTION SEQUENCE (with conditional ensemble follow-up)
  // ============================================
  const QUESTIONS = [
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
            { label: '🛡️ Hardened Warrior', value: 'hardened_warrior', desc: 'Seen too much, fights for those who can\'t' },
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
  const TEMPLATE_PROMPTS = {
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
  function buildQuickStartPrompt(answers) {
    const templateDesc = TEMPLATE_PROMPTS[answers.quick_template] || 'A compelling character with depth and mystery.';
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
  }

  // ============================================
  // STORY DESIGNER PROMPT (Enhanced with User Anchoring)
  // ============================================
  function buildSystemPrompt(answers) {
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
  }

  // ============================================
  // ENSEMBLE PROMPT BUILDER (2-4 characters with relationships)
  // ============================================
  function buildEnsemblePrompt(answers) {
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
  }

  // ============================================
  // ACTOR CREATION HELPER
  // ============================================
  function createActorFromParlor(name, _personality, appearance, gender, extraNotes) {
    const state = A.State.get();
    if (!state.nodes) state.nodes = {};
    if (!state.nodes.actors) state.nodes.actors = { items: {} };

    const actorId = 'actor_' + crypto.randomUUID().split('-')[0];

    // Determine gender code
    const genderMap = { male: 'M', female: 'F', nonbinary: 'NB', any: 'A' };
    const genderCode = genderMap[gender] || 'A';

    // Create actor object
    // Note: _personality is IGNORED here. It belongs in the Character Panel (Seed), not the Actor.
    // Appearance is stored as a description object.
    const actor = {
      id: actorId,
      name: name || 'Unnamed',
      gender: genderCode,
      aliases: [],
      tags: ['parlor-generated'],
      notes: extraNotes || '', // Only extra notes, NO personality
      traits: {
        appearance: {
          description: appearance || '',
          hair: '',
          eyes: '',
          build: '',
          appendages: {}
        },
        quirks: {
          physical: [],
          mental: [],
          emotional: []
        },
        pulseCues: [],
        erosCues: [],
        intentCues: []
      },
      appendages: { ears: false, tail: false, wings: false, horns: false }
    };

    // Add to state
    state.nodes.actors.items[actorId] = actor;

    // Sync to voices panel
    if (state.weaves && state.weaves.voices) {
      if (!state.weaves.voices.voices) state.weaves.voices.voices = [];
      state.weaves.voices.voices.push({
        actorId: actorId,
        enabled: true,
        characterName: name,
        chatName: '',
        tag: 'V',
        attempt: { baseChance: 0.6 },
        subtones: []
      });
    }

    return actorId;
  }

  // ============================================
  // PAIR CREATION HELPER
  // ============================================
  function createPairFromParlor(id1, id2, type) {
    if (!id1 || !id2) return;
    const state = A.State.get();
    if (!state.nodes) state.nodes = {};
    if (!state.nodes.pairs) state.nodes.pairs = { items: {} };

    const pairId = 'pair_' + crypto.randomUUID().split('-')[0];
    state.nodes.pairs.items[pairId] = {
      id: pairId,
      actor1: id1,
      actor2: id2,
      type: type || 'Companion',
      target: 'personality',
      content: '',
      shifts: []
    };
    return pairId;
  }

  // ============================================
  // RENDER FUNCTION
  // ============================================
  function render(container) {
    container.style.height = '100%';
    container.style.overflowY = 'hidden';
    container.style.background = 'linear-gradient(135deg, var(--bg-base) 0%, rgba(139, 69, 19, 0.05) 100%)';

    // State
    const globalState = A.State.get();
    let rs = { currentStep: 0, answers: {}, messages: [] };

    // Load from project if available
    if (globalState && globalState.meta?.id) {
      if (!globalState.parlor) globalState.parlor = { currentStep: 0, answers: {}, messages: [] };
      rs = globalState.parlor;
    }
    // Ensure schema
    if (!rs.messages) rs.messages = [];
    if (!rs.answers) rs.answers = {};
    if (typeof rs.currentStep !== 'number') rs.currentStep = 0;

    // Local refs for closure compatibility (where possible)
    let answers = rs.answers;
    let isTyping = false;
    let skipTyping = false;

    container.innerHTML = `
      <div class="parlor-layout" style="
        display: grid;
        grid-template-columns: 280px 1fr;
        gap: var(--space-4);
        height: 100%;
        padding: var(--space-4);
        max-width: 1100px;
        margin: 0 auto;
      ">
        <!-- Left: Spider Visual -->
        <div class="parlor-visual" style="
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          padding-top: var(--space-6);
          position: relative;
        ">
          <div class="spider-glow" style="
            position: absolute;
            width: 240px;
            height: 240px;
            background: radial-gradient(circle, rgba(218, 165, 32, 0.15) 0%, transparent 70%);
            border-radius: 50%;
            animation: pulse-glow 4s ease-in-out infinite;
            top: 20px;
          "></div>
          
          <!-- Sparkle particle container -->
          <div id="sparkle-container" class="sparkle-container" style="
            position: absolute;
            width: 220px;
            height: 220px;
            top: 24px;
            pointer-events: none;
            z-index: 10;
          "></div>
          
          <img 
            id="spider-image"
            src="assets/spider_parlor.png" 
            alt="Anansi, the Spider God" 
            class="spider-img"
            style="
              max-width: 220px;
              filter: drop-shadow(0 0 20px rgba(218, 165, 32, 0.3));
              position: relative;
              z-index: 1;
            "
            onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
          >
          <div class="spider-fallback" style="
            display: none;
            width: 150px;
            height: 150px;
            background: radial-gradient(circle, var(--accent-primary) 0%, transparent 70%);
            border-radius: 50%;
            align-items: center;
            justify-content: center;
            font-size: 48px;
          ">🕷️</div>
          
          <div style="
            text-align: center;
            margin-top: var(--space-4);
            position: relative;
            z-index: 1;
          ">
            <h2 style="
              font-size: 18px;
              font-weight: 300;
              color: var(--text-primary);
              margin: 0 0 8px 0;
              letter-spacing: 2px;
            ">THE SPIDER'S PARLOR</h2>
            <p style="
              font-size: 11px;
              color: var(--text-muted);
              font-style: italic;
              max-width: 200px;
              line-height: 1.4;
            ">"Every story begins with a single thread..."</p>
          </div>

          <!-- Magical Rune Display -->
          <div id="rune-container" class="rune-container" style="
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            align-items: center;
            gap: 12px;
            padding: var(--space-4);
            margin-top: var(--space-3);
            min-height: 80px;
            max-width: 240px;
          "></div>

          <!-- Restart Button (hidden initially) -->
          <button id="btn-restart" class="btn btn-ghost btn-sm" style="
            margin-top: auto;
            margin-bottom: var(--space-4);
            opacity: 0.6;
            display: none;
          ">↺ Start Over</button>
        </div>

        <!-- Right: Conversation Area -->
        <div class="parlor-conversation" style="
          display: flex;
          flex-direction: column;
          height: 100%;
          background: var(--bg-surface);
          border-radius: var(--radius-lg);
          border: 1px solid var(--border-subtle);
          overflow: hidden;
        ">
          <!-- Conversation Log -->
          <div id="conversation-log" style="
            flex: 1;
            overflow-y: auto;
            padding: var(--space-4);
            display: flex;
            flex-direction: column;
            gap: var(--space-4);
          "></div>

          <!-- Input Area (for textareas) -->
          <div id="input-area" style="
            padding: var(--space-3);
            border-top: 1px solid var(--border-subtle);
            display: none;
          "></div>
        </div>
      </div>

      <style>
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
        
        /* Individual sparkle particle */
        @keyframes twinkle {
          0%, 100% { 
            opacity: 0;
            transform: scale(0.3);
          }
          15%, 35% { 
            opacity: var(--intensity, 1);
            transform: scale(1);
          }
          50% {
            opacity: 0;
            transform: scale(0.3);
          }
        }
        
        .sparkle-container .sparkle {
          position: absolute;
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: radial-gradient(circle, #fff 0%, rgba(255, 215, 0, 0.8) 40%, transparent 70%);
          box-shadow: 0 0 6px 2px rgba(255, 215, 0, calc(0.6 * var(--intensity, 1))),
                      0 0 10px 4px rgba(218, 165, 32, calc(0.3 * var(--intensity, 1)));
          opacity: 0;
          pointer-events: none;
        }
        
        .sparkle-container.active .sparkle {
          animation: twinkle var(--duration) ease-in-out infinite;
          animation-delay: var(--delay);
        }
        
        /* Cross-shaped sparkle for gems */
        .sparkle-container .sparkle.gem::before,
        .sparkle-container .sparkle.gem::after {
          content: '';
          position: absolute;
          background: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.8), transparent);
        }
        .sparkle-container .sparkle.gem::before {
          width: 12px;
          height: 2px;
          top: 1px;
          left: -4px;
        }
        .sparkle-container .sparkle.gem::after {
          width: 2px;
          height: 12px;
          top: -4px;
          left: 1px;
        }
        
        .spider-glow.typing {
          animation: pulse-glow 1s ease-in-out infinite !important;
          opacity: 0.9 !important;
        }
        
        /* Magical Rune Styles */
        @keyframes rune-pulse {
          0%, 100% { 
            opacity: 0.7;
            text-shadow: 0 0 8px rgba(218, 165, 32, 0.6),
                         0 0 16px rgba(218, 165, 32, 0.3);
          }
          50% { 
            opacity: 1;
            text-shadow: 0 0 12px rgba(255, 215, 0, 0.8),
                         0 0 24px rgba(218, 165, 32, 0.5),
                         0 0 36px rgba(184, 134, 11, 0.3);
          }
        }
        
        @keyframes rune-appear {
          0% { 
            opacity: 0;
            transform: scale(0.3) rotate(-20deg);
          }
          60% {
            transform: scale(1.2) rotate(5deg);
          }
          100% { 
            opacity: 1;
            transform: scale(1) rotate(0deg);
          }
        }
        
        .rune-container .rune {
          font-size: 24px;
          color: #daa520;
          animation: rune-appear 0.5s ease-out forwards,
                     rune-pulse 3s ease-in-out infinite;
          animation-delay: 0s, 0.5s;
          position: relative;
          cursor: default;
          user-select: none;
        }
        
        .rune-container .rune::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 32px;
          height: 32px;
          background: radial-gradient(circle, rgba(218, 165, 32, 0.25) 0%, transparent 70%);
          border-radius: 50%;
          z-index: -1;
        }
        
        .parlor-message {
          max-width: 85%;
          animation: message-appear 0.3s ease-out;
        }
        
        @keyframes message-appear {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .parlor-message.anansi {
          align-self: flex-start;
        }
        
        .parlor-message.user {
          align-self: flex-end;
        }
        
        .anansi-text {
          background: linear-gradient(135deg, rgba(218, 165, 32, 0.1) 0%, rgba(139, 69, 19, 0.1) 100%);
          border-left: 3px solid var(--accent-primary);
          padding: var(--space-3);
          border-radius: 0 var(--radius-md) var(--radius-md) 0;
          font-size: 14px;
          line-height: 1.6;
          color: var(--text-primary);
        }
        
        .anansi-label {
          font-size: 10px;
          color: var(--accent-primary);
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 4px;
          font-weight: 600;
        }
        
        .user-response {
          background: var(--accent-soft);
          color: var(--accent-primary);
          padding: var(--space-2) var(--space-3);
          border-radius: var(--radius-md);
          font-size: 13px;
          font-weight: 500;
        }
        
        .response-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: var(--space-3);
        }
        
        .response-btn {
          background: var(--bg-elevated);
          border: 1px solid var(--border-default);
          color: var(--text-primary);
          padding: 10px 16px;
          border-radius: var(--radius-md);
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .response-btn:hover {
          background: var(--accent-soft);
          border-color: var(--accent-primary);
          color: var(--accent-primary);
        }
        
        .response-btn.primary {
          background: linear-gradient(135deg, var(--accent-primary) 0%, #b8860b 100%);
          border: none;
          color: white;
          font-weight: 600;
          padding: 12px 24px;
        }
        
        .response-btn.primary:hover {
          filter: brightness(1.1);
          transform: translateY(-1px);
        }
        
        .typing-cursor {
          display: inline-block;
          width: 2px;
          height: 1em;
          background: var(--accent-primary);
          margin-left: 2px;
          animation: blink 0.7s infinite;
          vertical-align: text-bottom;
        }
        
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        
        .skip-hint {
          font-size: 10px;
          color: var(--text-muted);
          text-align: center;
          margin-top: 8px;
          opacity: 0.7;
        }
      </style>
    `;

    const conversationLog = container.querySelector('#conversation-log');
    const inputArea = container.querySelector('#input-area');
    const btnRestart = container.querySelector('#btn-restart');
    const spiderGlow = container.querySelector('.spider-glow');
    const sparkleContainer = container.querySelector('#sparkle-container');

    // Restart handler
    btnRestart.onclick = () => {
      rs.currentStep = 0;
      rs.answers = {};
      rs.messages = [];
      answers = rs.answers; // Update ref
      conversationLog.innerHTML = '';
      inputArea.style.display = 'none';
      inputArea.innerHTML = '';
      btnRestart.style.display = 'none';
      // Clear runes after runeContainer is initialized (called lazily)
      if (typeof clearRunes === 'function') clearRunes();

      // Save
      A.State.notify();

      advanceConversation();
    };

    // ============================================
    // SPARKLE PARTICLE SYSTEM
    // ============================================
    let sparklesCreated = false;

    function createSparkles() {
      if (sparklesCreated || !sparkleContainer) return;
      sparklesCreated = true;

      // Create 12 sparkle particles at semi-random positions
      // Positions roughly correspond to where gems/runes might be on the spider
      const sparklePositions = [
        // Top gems (on spider body)
        { x: 45, y: 35 }, { x: 55, y: 38 },
        // Left web nodes
        { x: 15, y: 25 }, { x: 8, y: 50 }, { x: 20, y: 70 },
        // Right web nodes  
        { x: 85, y: 25 }, { x: 92, y: 50 }, { x: 80, y: 70 },
        // Center gems
        { x: 50, y: 50 }, { x: 50, y: 65 },
        // Bottom web
        { x: 30, y: 85 }, { x: 70, y: 85 }
      ];

      sparklePositions.forEach((pos, i) => {
        const sparkle = document.createElement('div');
        sparkle.className = 'sparkle' + (i < 4 ? ' gem' : ''); // First 4 are gem-style (cross)

        // Add slight randomization to positions
        const randomX = pos.x + (Math.random() - 0.5) * 8;
        const randomY = pos.y + (Math.random() - 0.5) * 8;

        // Random intensity between 0.4 and 1.0
        const intensity = 0.4 + Math.random() * 0.6;

        sparkle.style.cssText = `
          left: ${randomX}%;
          top: ${randomY}%;
          --delay: ${Math.random() * 3}s;
          --duration: ${1.2 + Math.random() * 1.2}s;
          --intensity: ${intensity.toFixed(2)};
        `;

        sparkleContainer.appendChild(sparkle);
      });
    }

    function setSparkle(enabled) {
      if (!sparkleContainer) return;

      // Ensure sparkles are created
      createSparkles();

      if (enabled) {
        sparkleContainer.classList.add('active');
      } else {
        sparkleContainer.classList.remove('active');
      }

      if (spiderGlow) {
        if (enabled) {
          spiderGlow.classList.add('typing');
        } else {
          spiderGlow.classList.remove('typing');
        }
      }
    }

    // ============================================
    // MAGICAL RUNE SYSTEM
    // ============================================
    const runeContainer = container.querySelector('#rune-container');

    // Arcane-looking symbols (not Norse, more mystical/magical)
    const RUNE_SYMBOLS = {
      // Quick Start
      mode: '⚜',         // Fleur-de-lis - choice
      quick_theme: '♠',  // Theme
      quick_setting: '⌂', // Setting/world
      quick_gender: '⚥', // Gender
      quick_template: '✧', // Template/soul
      // Full path
      cast: '☿',        // Mercury - transformation
      ensemble_details: '⚶', // Additional symbol
      gender: '⚥',      // Gender symbol
      archetype: '⚹',   // Sextile - essence/archetype
      genre: '✧',       // Star
      tone: '☽',        // Crescent moon
      rating: '⚗',      // Alembic
      pov: '◉',         // Point of view - eye
      tense: '⧗',       // Hourglass - time/tense
      user_role: '⚔',   // Crossed swords
      challenge: '⚡',   // Lightning - challenge
      challenge_type: '🜏', // Alchemical twist
      concept: '✴',     // Eight-pointed star
      extras: '❈',      // Decorative
    };

    function addRune(questionId) {
      if (!runeContainer || !RUNE_SYMBOLS[questionId]) return;

      const rune = document.createElement('span');
      rune.className = 'rune';
      rune.textContent = RUNE_SYMBOLS[questionId];
      rune.title = questionId.replace(/_/g, ' ');

      // Stagger the pulse animation slightly for each rune
      const runeCount = runeContainer.children.length;
      rune.style.animationDelay = `0s, ${0.5 + runeCount * 0.3}s`;

      runeContainer.appendChild(rune);
    }

    function clearRunes() {
      if (runeContainer) runeContainer.innerHTML = '';
    }

    // ============================================
    // TYPEWRITER EFFECT (with sparkle)
    // ============================================
    async function typeText(element, text, speed = 30) {
      isTyping = true;
      skipTyping = false;
      setSparkle(true);
      element.innerHTML = '<span class="typing-cursor"></span>';

      let displayed = '';
      for (let i = 0; i < text.length; i++) {
        if (skipTyping) {
          element.textContent = text;
          break;
        }
        displayed += text[i];
        element.innerHTML = displayed + '<span class="typing-cursor"></span>';
        await sleep(speed + Math.random() * 20);
      }

      element.textContent = text;
      isTyping = false;
      setSparkle(false);
    }

    function sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Skip typing on click
    conversationLog.onclick = () => {
      if (isTyping) skipTyping = true;
    };

    // ============================================
    // CONVERSATION ENGINE (with conditional questions)
    // ============================================
    function getNextQuestion() {
      while (rs.currentStep < QUESTIONS.length) {
        const question = QUESTIONS[rs.currentStep];
        // Check condition
        if (question.condition && !question.condition(rs.answers)) {
          rs.currentStep++;
          continue;
        }
        return question;
      }
      return null;
    }

    async function advanceConversation(restore = false) {
      const question = getNextQuestion();
      if (!question) return;

      // Show restart after first question
      if (rs.currentStep > 0) {
        btnRestart.style.display = 'block';
      }

      // If restoring, logic differs:
      if (restore) {
        // We assume the TEXT is already in history (replayed in initial render).
        // We just need to show the INPUTS.
        const lastMsgDiv = conversationLog.lastElementChild; // Should be the question
        if (!lastMsgDiv) {
          // Fallback if something weird happened
          advanceConversation(false);
          return;
        }

        if (question.type === 'buttons') {
          showButtons(question, lastMsgDiv);
        } else if (question.type === 'textarea') {
          showTextarea(question);
        }
        return;
      }

      // Get dynamic text if available
      const questionText = question.getText ? question.getText(rs.answers) : question.text;

      // Add to history
      rs.messages.push({ role: 'anansi', text: questionText });
      A.State.notify();

      // Create Anansi message
      const msgDiv = document.createElement('div');
      msgDiv.className = 'parlor-message anansi';
      msgDiv.innerHTML = `
        <div class="anansi-label">🕷️ Anansi</div>
        <div class="anansi-text"></div>
      `;
      conversationLog.appendChild(msgDiv);
      scrollToBottom();

      const textEl = msgDiv.querySelector('.anansi-text');
      await typeText(textEl, questionText);

      // Handle question type
      if (question.type === 'auto') {
        await sleep(question.delay || 2000);
        rs.currentStep++;
        A.State.notify();
        advanceConversation();
      } else if (question.type === 'buttons') {
        showButtons(question, msgDiv);
      } else if (question.type === 'textarea') {
        showTextarea(question);
      }
    }

    function showButtons(question, msgDiv) {
      const btnContainer = document.createElement('div');
      btnContainer.className = 'response-buttons';

      // Support dynamic options
      const options = question.getOptions ? question.getOptions(answers) : question.options;

      options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'response-btn' + (opt.primary ? ' primary' : '');
        btn.textContent = opt.label;
        if (opt.desc) btn.title = opt.desc; // Show description on hover
        btn.onclick = () => handleButtonResponse(question, opt, btnContainer);
        btnContainer.appendChild(btn);
      });

      // Add skip option if available
      if (question.optional && question.skipLabel) {
        const skipBtn = document.createElement('button');
        skipBtn.className = 'response-btn';
        skipBtn.textContent = question.skipLabel;
        skipBtn.style.opacity = '0.7';
        skipBtn.onclick = () => handleButtonResponse(question, { label: 'Skipped', value: '' }, btnContainer);
        btnContainer.appendChild(skipBtn);
      }

      msgDiv.appendChild(btnContainer);
      scrollToBottom();
    }

    function handleButtonResponse(question, option, btnContainer) {
      // Store answer
      rs.answers[question.id] = option.value;

      // Store in history
      rs.messages.push({ role: 'user', text: option.label, value: option.value });
      A.State.notify();

      // Add magical rune
      addRune(question.id);

      // Remove buttons
      btnContainer.remove();

      // Show user response
      const userMsg = document.createElement('div');
      userMsg.className = 'parlor-message user';
      userMsg.innerHTML = `<div class="user-response">${option.label}</div>`;
      conversationLog.appendChild(userMsg);
      scrollToBottom();

      // Anansi's Voice Flavor - playful reactions to certain choices
      const voiceFlavors = {
        'rating:explicit': "*My my, not shy are we?* The web trembles with possibilities...",
        'rating:mature': "*Ah, a taste for the shadows.* I understand.",
        'archetype:trickster': "*Hehehe...* A kindred spirit, perhaps?",
        'archetype:shadow': "*Yesss...* The most interesting souls dwell in gray.",
        'archetype:lover': "*Ah, the heart's path.* A beautiful choice.",
        'tone:dark': "*Delicious.* The darkness holds many secrets.",
        'genre:horror': "*Oh, you want to feel something.* Good.",
        'cast:ensemble': "*Multiple threads to weave!* This shall be... intricate.",
        'user_role:rival': "*Conflict breeds the finest tales.* I approve.",
        'challenge:yes': "*Ohohoho!* I knew you had spirit. Let us add some... spice."
      };

      const flavorKey = `${question.id}:${option.value}`;
      const flavor = voiceFlavors[flavorKey];

      if (flavor) {
        const flavorMsg = document.createElement('div');
        flavorMsg.className = 'parlor-message anansi';
        flavorMsg.innerHTML = `
          <div class="anansi-text" style="font-style: italic; opacity: 0.9; padding: 8px 12px; font-size: 13px;">
            ${flavor}
          </div>
        `;
        conversationLog.appendChild(flavorMsg);
        scrollToBottom();

        // Add flavor to history
        rs.messages.push({ role: 'anansi', text: flavor, flavor: true });
        A.State.notify();
      }

      // Special handling for 'weave' confirmation
      if (option.value === 'weave') {
        startWeaving();
        return;
      }

      // Advance
      // Don't advance if just showing flavor, wait for timeout

      rs.currentStep++;
      A.State.notify();
      setTimeout(() => advanceConversation(), flavor ? 800 : 500);
    }

    function showTextarea(question) {
      inputArea.style.display = 'block';
      inputArea.innerHTML = `
        <textarea 
          id="parlor-input" 
          class="input" 
          style="width: 100%; min-height: 80px; resize: vertical; font-size: 13px;"
          placeholder="${question.placeholder || ''}"
        ></textarea>
        <div style="display: flex; gap: 8px; margin-top: 8px; justify-content: flex-end;">
          ${question.optional ? `<button class="btn btn-ghost btn-sm" id="btn-skip">Skip</button>` : ''}
          <button class="btn btn-primary btn-sm" id="btn-submit">Continue</button>
        </div>
      `;

      const textarea = inputArea.querySelector('#parlor-input');
      const submitBtn = inputArea.querySelector('#btn-submit');
      const skipBtn = inputArea.querySelector('#btn-skip');

      textarea.focus();

      submitBtn.onclick = () => {
        const value = textarea.value.trim();
        if (!value && !question.optional) {
          if (A.UI.Toast) A.UI.Toast.show('Please share your vision with Anansi...', 'warning');
          textarea.focus();
          return;
        }
        submitTextResponse(question, value);
      };

      if (skipBtn) {
        skipBtn.onclick = () => submitTextResponse(question, '');
      }

      // Enter to submit (Shift+Enter for newline)
      textarea.onkeydown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          submitBtn.click();
        }
      };
    }

    function submitTextResponse(question, value) {
      answers[question.id] = value;

      // Persist in history
      rs.messages.push({ role: 'user', text: value, value: value });
      A.State.notify();

      // Add magical rune (only if value provided)
      if (value) addRune(question.id);

      inputArea.style.display = 'none';
      inputArea.innerHTML = '';

      // Show user response
      const displayText = value ? (value.length > 100 ? value.slice(0, 100) + '...' : value) : '(Skipped)';
      const userMsg = document.createElement('div');
      userMsg.className = 'parlor-message user';
      userMsg.innerHTML = `<div class="user-response" style="max-width: 300px; white-space: pre-wrap;">${escapeHtml(displayText)}</div>`;
      conversationLog.appendChild(userMsg);
      scrollToBottom();

      rs.currentStep++;
      A.State.notify();
      setTimeout(() => advanceConversation(), 500);
    }

    function scrollToBottom() {
      setTimeout(() => {
        conversationLog.scrollTop = conversationLog.scrollHeight;
      }, 50);
    }

    // ============================================
    // WEAVING (LLM CALL)
    // ============================================
    async function startWeaving() {
      // Enable sparkle during weaving
      setSparkle(true);

      // Show weaving message
      const msgDiv = document.createElement('div');
      msgDiv.className = 'parlor-message anansi';
      msgDiv.innerHTML = `
        <div class="anansi-label">🕷️ Anansi</div>
        <div class="anansi-text" style="font-style: italic; color: var(--text-muted);">
          *The spider's legs dance across invisible threads, weaving your story into being...*
        </div>
      `;
      conversationLog.appendChild(msgDiv);
      scrollToBottom();

      // Check API key
      const keys = JSON.parse(localStorage.getItem('anansi_api_keys') || '{}');
      const activeKeyName = localStorage.getItem('anansi_active_key_name') || 'Default';
      const apiKey = keys[activeKeyName];

      if (!apiKey) {
        setSparkle(false);
        showError("The threads are tangled... I cannot weave without an API key. Configure one in The Spindle → CFG tab.");
        return;
      }

      const config = JSON.parse(localStorage.getItem('anansi_sim_config') || '{"provider":"gemini","model":"gemini-2.0-flash"}');

      try {
        // Determine which prompt to use
        let systemPrompt;
        const isEnsemble = answers.mode === 'full' && answers.cast === 'ensemble';

        if (answers.mode === 'quick') {
          systemPrompt = buildQuickStartPrompt(answers);
        } else if (isEnsemble) {
          systemPrompt = buildEnsemblePrompt(answers);
        } else {
          systemPrompt = buildSystemPrompt(answers);
        }

        const response = await callParlorLLM(
          config.provider,
          config.model,
          apiKey,
          systemPrompt,
          "Please weave the character(s) now.",
          config.baseUrl
        );

        setSparkle(false);

        // Parse the response
        let cardData;
        try {
          const jsonMatch = response.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            cardData = safeJsonParse(jsonMatch[0]);
          } else {
            throw new Error('No JSON found');
          }
        } catch (parseErr) {
          showError("The weave unraveled... I could not form the pattern. Shall we try again?");
          console.error('[Parlor] Parse error:', response);
          return;
        }

        // Handle ensemble vs single character
        if (isEnsemble && cardData.characters) {
          // Ensemble success
          const names = cardData.characters.map(c => c.name).join(', ');
          const successMsg = document.createElement('div');
          successMsg.className = 'parlor-message anansi';
          successMsg.innerHTML = `
            <div class="anansi-label">🕷️ Anansi</div>
            <div class="anansi-text">
              The ensemble is woven. I present to you: <strong>${escapeHtml(names)}</strong>
            </div>
          `;
          conversationLog.appendChild(successMsg);
          scrollToBottom();

          setTimeout(() => showEnsemblePreview(cardData, answers), 1000);
        } else {
          // Single character success
          const successMsg = document.createElement('div');
          successMsg.className = 'parlor-message anansi';
          successMsg.innerHTML = `
            <div class="anansi-label">🕷️ Anansi</div>
            <div class="anansi-text">
              The weave is complete. I present to you: <strong>${escapeHtml(cardData.name)}</strong>
            </div>
          `;
          conversationLog.appendChild(successMsg);
          scrollToBottom();

          setTimeout(() => showPreviewModal(cardData, answers), 1000);
        }

      } catch (err) {
        setSparkle(false);
        showError(`The threads slipped through my legs: ${err.message}`);
        console.error('[Parlor] LLM error:', err);
      }
    }

    function showError(message) {
      const msgDiv = document.createElement('div');
      msgDiv.className = 'parlor-message anansi';
      msgDiv.innerHTML = `
        <div class="anansi-label">🕷️ Anansi</div>
        <div class="anansi-text" style="border-left-color: var(--status-error);">
          ${message}
        </div>
        <div class="response-buttons">
          <button class="response-btn" onclick="this.closest('.parlor-message').remove()">Dismiss</button>
        </div>
      `;
      conversationLog.appendChild(msgDiv);
      scrollToBottom();
    }

    // Start or Restore
    if (rs.messages && rs.messages.length > 0) {
      // Replay History
      rs.messages.forEach(msg => {
        const msgDiv = document.createElement('div');
        if (msg.role === 'anansi') {
          msgDiv.className = 'parlor-message anansi';
          if (msg.flavor) {
            msgDiv.innerHTML = `
              <div class="anansi-text" style="font-style: italic; opacity: 0.9; padding: 8px 12px; font-size: 13px;">
                ${escapeHtml(msg.text)}
              </div>
            `;
          } else {
            msgDiv.innerHTML = `
              <div class="anansi-label">🕷️ Anansi</div>
              <div class="anansi-text">${escapeHtml(msg.text)}</div>
            `;
          }
        } else {
          msgDiv.className = 'parlor-message user';
          const displayText = msg.value ? (msg.value.length > 100 ? msg.value.slice(0, 100) + '...' : msg.value) : (msg.text || '(Skipped)');
          msgDiv.innerHTML = `<div class="user-response" style="max-width: 300px; white-space: pre-wrap;">${escapeHtml(displayText)}</div>`;
        }
        conversationLog.appendChild(msgDiv);
      });
      scrollToBottom();

      // Restore Input UI or Continue
      const lastMsg = rs.messages[rs.messages.length - 1];
      if (lastMsg && lastMsg.role === 'user') {
        // User just answered, so we should move to next question (full render)
        setTimeout(() => advanceConversation(false), 500);
      } else {
        // Anansi spoke last (question), restore inputs only
        advanceConversation(true);
      }
    } else {
      // Start fresh
      setTimeout(() => advanceConversation(), 500);
    }
  }

  // ============================================
  // PREVIEW MODAL
  // ============================================
  function showPreviewModal(cardData, answers) {
    const content = document.createElement('div');
    content.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: var(--space-4);">
        <div class="form-group">
          <label class="label">Character Name</label>
          <input type="text" id="preview-name" class="input" value="${escapeHtml(cardData.name || '')}">
        </div>

        <div class="form-group">
          <label class="label">Appearance</label>
          <textarea id="preview-appearance" class="input" style="height: 60px; resize: vertical;" placeholder="Physical description...">${escapeHtml(cardData.appearance || '')}</textarea>
        </div>
        
        <div class="form-group">
          <label class="label">Personality</label>
          <textarea id="preview-personality" class="input" style="height: 150px; resize: vertical;">${escapeHtml(cardData.personality || '')}</textarea>
        </div>
        
        <div class="form-group">
          <label class="label">Scenario</label>
          <textarea id="preview-scenario" class="input" style="height: 100px; resize: vertical;">${escapeHtml(cardData.scenario || '')}</textarea>
        </div>
        
        <!-- First Message Section -->
        <div class="form-group">
          <label class="label" style="display: flex; justify-content: space-between; align-items: center;">
            <span>First Message (Optional)</span>
            <button id="btn-generate-opening" class="btn btn-ghost btn-sm" style="font-size: 11px;">
              ✨ Generate Opening
            </button>
          </label>
          <div id="first-message-container" style="
            min-height: 60px;
            background: linear-gradient(135deg, rgba(218, 165, 32, 0.05) 0%, rgba(139, 69, 19, 0.05) 100%);
            border: 1px solid var(--border-subtle);
            border-radius: var(--radius-md);
            padding: 12px;
            position: relative;
          ">
            <textarea id="preview-first-message" class="input" style="
              height: 80px; 
              resize: vertical; 
              background: transparent;
              border: none;
              padding: 0;
            " placeholder="Click 'Generate Opening' to create a first message as the character..."></textarea>
            <button id="btn-copy-first-message" class="btn btn-ghost btn-sm" style="
              position: absolute;
              top: 8px;
              right: 8px;
              font-size: 10px;
              opacity: 0.6;
              display: none;
            ">📋 Copy</button>
          </div>
        </div>
        
        <div style="
          padding: 12px;
          background: var(--bg-surface);
          border-radius: var(--radius-md);
          font-size: 11px;
          color: var(--text-muted);
        ">
          <strong>Woven with:</strong> ${answers.genre} / ${answers.tone} / ${answers.rating} / Your role: ${answers.user_role}
        </div>
      </div>
    `;

    // Wire up Generate Opening button
    const generateBtn = content.querySelector('#btn-generate-opening');
    const firstMessageField = content.querySelector('#preview-first-message');
    const copyBtn = content.querySelector('#btn-copy-first-message');

    generateBtn.onclick = async () => {
      const name = content.querySelector('#preview-name').value.trim();
      const personality = content.querySelector('#preview-personality').value.trim();
      const scenario = content.querySelector('#preview-scenario').value.trim();

      if (!name || !personality) {
        if (A.UI.Toast) A.UI.Toast.show('Need name and personality first!', 'warning');
        return;
      }

      generateBtn.disabled = true;
      generateBtn.textContent = '✧ Generating...';
      firstMessageField.value = '';
      firstMessageField.placeholder = 'Weaving an opening...';

      const keys = JSON.parse(localStorage.getItem('anansi_api_keys') || '{}');
      const activeKeyName = localStorage.getItem('anansi_active_key_name') || 'Default';
      const apiKey = keys[activeKeyName];

      if (!apiKey) {
        generateBtn.disabled = false;
        generateBtn.textContent = '✨ Generate Opening';
        firstMessageField.placeholder = 'No API key configured!';
        return;
      }

      const config = JSON.parse(localStorage.getItem('anansi_sim_config') || '{"provider":"gemini","model":"gemini-2.0-flash"}');

      const povInstruction = answers.pov === '1st' ? '1st person (I/me)' : answers.pov === '2nd' ? '2nd person (you/your)' : '3rd person (he/she/they)';
      const tenseInstruction = answers.tense === 'past' ? 'past tense' : 'present tense';

      const openingPrompt = `You are "${name}", a character with this personality:

${personality}

The scenario is:
${scenario}

Write the OPENING MESSAGE of a roleplay as this character. This is the first thing ${name} says or does when the story begins.

NARRATIVE STYLE REQUIRED:
- Point of View: ${povInstruction}
- Tense: ${tenseInstruction}
- Addressing: {{user}}

FORMATTING GUIDE:
- *Single asterisks* for actions and narration: *She turned slowly, her eyes narrowing.*
- "Quotation marks" for dialogue: "Who are you?" she demanded.
- **Double asterisks** for emphasis: **something important**
- Use paragraph breaks for pacing.

Guidelines:
- Stay completely in character
- Set the scene vividly
- Create intrigue or emotional hook
- End with something that invites {{user}} to respond
- Length: 2-4 paragraphs

CRITICAL: Respond ONLY with the opening message in character. No meta-commentary.`;

      try {
        const response = await callParlorLLM(
          config.provider,
          config.model,
          apiKey,
          openingPrompt,
          "Write the opening message now.",
          config.baseUrl
        );

        firstMessageField.value = response.trim();
        copyBtn.style.display = 'block';
        if (A.UI.Toast) A.UI.Toast.show('Opening message woven!', 'success');
      } catch (err) {
        firstMessageField.value = '';
        firstMessageField.placeholder = 'Failed: ' + err.message;
      }

      generateBtn.disabled = false;
      generateBtn.textContent = '✨ Generate Opening';
    };

    copyBtn.onclick = () => {
      navigator.clipboard.writeText(firstMessageField.value);
      if (A.UI.Toast) A.UI.Toast.show('Copied to clipboard!', 'info');
    };

    A.UI.Modal.show({
      title: '🕸️ Your Story Awaits',
      content: content,
      width: 600,
      actions: [
        {
          label: 'Discard',
          class: 'btn-secondary',
          onclick: () => true
        },
        {
          label: '✓ Create Project',
          class: 'btn-primary',
          onclick: async (modal) => {
            const name = modal.querySelector('#preview-name').value.trim();
            const personality = modal.querySelector('#preview-personality').value.trim();
            const scenario = modal.querySelector('#preview-scenario').value.trim();

            if (!name) {
              if (A.UI.Toast) A.UI.Toast.show('Your character needs a name!', 'warning');
              return false;
            }

            const isFull = await A.ProjectDB.isFull();
            if (isFull) {
              if (A.UI.Toast) A.UI.Toast.show('The web is full. Delete a project to make room.', 'error');
              return false;
            }

            await A.IO.saveNow();
            A.State.reset();
            const state = A.State.get();

            state.meta.id = A.ProjectDB.generateId();
            state.meta.name = name;
            state.meta.description = `Woven by Anansi (${answers.genre}, ${answers.tone})`;

            state.seed = state.seed || {};
            state.seed.characterName = name;
            state.seed.chatName = name;
            state.seed.persona = personality;
            state.seed.scenario = scenario;

            await A.ProjectDB.save(state);
            A.ProjectDB.setCurrentId(state.meta.id);

            A.State.notify();
            A.UI.refresh();

            if (A.UI.Toast) A.UI.Toast.show(`"${name}" has been woven into existence!`, 'success');
            A.UI.switchPanel('character');

            return true;
          }
        },
        {
          label: '👤 Import to Actors',
          class: 'btn-ghost',
          onclick: (modal) => {
            const name = modal.querySelector('#preview-name').value.trim();
            const personality = modal.querySelector('#preview-personality').value.trim();
            const scenario = modal.querySelector('#preview-scenario').value.trim();
            const appearance = modal.querySelector('#preview-appearance')?.value.trim() || '';

            console.log('[Parlor] Import Clicked. Captured:', { name, hasPersonality: !!personality, hasScenario: !!scenario });

            const companionEl = modal.querySelector('#companion-personality');
            const companionName = modal.querySelector('#companion-selector-container')?.querySelector('div[style*="font-weight: 600"]')?.textContent?.replace('👥 Companion: ', '').trim() || null;
            const companionPersonality = companionEl?.value.trim() || null;
            const companionAppearance = modal.querySelector('#companion-appearance')?.value.trim() || '';
            const companionRelType = modal.querySelector('#companion-selector-container')?.dataset.selectedRelation || 'companion';

            if (!name) {
              if (A.UI.Toast) A.UI.Toast.show('Character needs a name!', 'warning');
              return false;
            }

            // Prompt for Project
            const dialogContent = document.createElement('div');
            dialogContent.innerText = `You are about to import "${name}"${companionName ? ` and "${companionName}"` : ''}. Where should they go?`;

            A.UI.Modal.show({
              title: 'Import Options',
              content: dialogContent,
              width: 400,
              actions: [
                { label: 'Cancel', class: 'btn-secondary', onclick: () => true },
                {
                  label: 'Add to Current Project',
                  class: 'btn-ghost',
                  onclick: () => {
                    const gender = answers.gender || answers.quick_gender || 'any';
                    // Pass _personality as null/ignored to be safe, though function ignores it.
                    // Wait, createActorFromParlor signature is (name, _personality, appearance, ...)
                    const mainId = createActorFromParlor(name, personality, appearance, gender, 'Generated by The Spider\'s Parlor');
                    if (companionName) {
                      const compId = createActorFromParlor(companionName, companionPersonality, companionAppearance, 'any', `Companion of ${name}`);
                      createPairFromParlor(mainId, compId, companionRelType);
                    }
                    A.State.notify();
                    if (A.UI.Toast) A.UI.Toast.show('Actors added to current project!', 'success');
                    A.UI.switchPanel('actors');
                    return true;
                  }
                },
                {
                  label: 'Start New Project',
                  class: 'btn-primary',
                  onclick: async () => {
                    console.log('[Parlor] Start New Project clicked.');
                    const isFull = await A.ProjectDB.isFull();
                    if (isFull) {
                      if (A.UI.Toast) A.UI.Toast.show('Cannot create new project: Storage full', 'error');
                      return false;
                    }
                    await A.IO.saveNow(); // Save current before reset
                    A.State.reset();      // Reset to default state
                    const state = A.State.get();

                    state.meta.id = A.ProjectDB.generateId();
                    state.meta.name = name;
                    state.meta.description = `Woven by Anansi (${answers.genre || 'Story'})`;

                    // Populate Character Panel (Seed) explicitly
                    console.log('[Parlor] Populating State Seed:', { name, hasPersona: !!personality, hasScenario: !!scenario });
                    state.seed = {
                      characterName: name,
                      chatName: name,
                      persona: personality,
                      scenario: scenario,
                      examples: ''
                    };

                    // Add actors
                    const gender = answers.gender || answers.quick_gender || 'any';
                    const mainId = createActorFromParlor(name, personality, appearance, gender, 'Protagonist');
                    if (companionName) {
                      const compId = createActorFromParlor(companionName, companionPersonality, companionAppearance, 'any', `Companion of ${name}`);
                      createPairFromParlor(mainId, compId, companionRelType);
                    }

                    await A.ProjectDB.save(state);
                    A.ProjectDB.setCurrentId(state.meta.id);
                    A.State.notify();
                    A.UI.refresh();

                    if (A.UI.Toast) A.UI.Toast.show(`New project "${name}" created!`, 'success');

                    // Force switch to Character panel
                    setTimeout(() => A.UI.switchPanel('character'), 100);
                    return true;
                  }
                }
              ]
            });

            return true;
          }
        },
        {
          label: '🔄 Spin Scenario',
          class: 'btn-ghost',
          onclick: async (modal) => {
            const name = modal.querySelector('#preview-name').value.trim();
            const personality = modal.querySelector('#preview-personality').value.trim();
            const scenarioField = modal.querySelector('#preview-scenario');

            if (!name || !personality) {
              if (A.UI.Toast) A.UI.Toast.show('Need name and personality to spin a new scenario!', 'warning');
              return false;
            }

            // Show spinning state
            scenarioField.value = '✧ Spinning a new scenario...';
            scenarioField.disabled = true;

            // Get API config
            const keys = JSON.parse(localStorage.getItem('anansi_api_keys') || '{}');
            const activeKeyName = localStorage.getItem('anansi_active_key_name') || 'Default';
            const apiKey = keys[activeKeyName];

            if (!apiKey) {
              scenarioField.value = 'No API key configured!';
              scenarioField.disabled = false;
              return false;
            }

            const config = JSON.parse(localStorage.getItem('anansi_sim_config') || '{"provider":"gemini","model":"gemini-2.0-flash"}');

            const povStyle = answers.pov === '1st' ? '1st person (I/me)' : answers.pov === '2nd' ? '2nd person (you/your)' : '3rd person (he/she/they)';
            const tenseStyle = answers.tense === 'past' ? 'past tense' : 'present tense';

            const spinPrompt = `You are a creative story designer. The character "${name}" already exists with this personality:

${personality}

Generate a NEW and DIFFERENT scenario for this character that:
1. Has a unique setting and atmosphere
2. Shows what the character is doing when the story begins
3. Creates a clear hook for how {{user}} encounters them
4. Invites dialogue or action from {{user}}

Context from the original request:
- Genre: ${answers.genre}
- Tone: ${answers.tone}
- User's Role: ${answers.user_role}
- POV: ${povStyle}
- Tense: ${tenseStyle}
${answers.concept ? `- Story Concept: ${answers.concept}` : ''}

IMPORTANT: Write the scenario in ${povStyle} and ${tenseStyle}!

FORMATTING GUIDE:
- *Single asterisks* for actions/narration: *She turned slowly.*
- "Quotation marks" for dialogue: "Hello," she said.
- **Double asterisks** for emphasis: **The ancient door** creaked open.
- Use paragraph breaks for readability.

CRITICAL: Respond ONLY with the scenario text, no JSON, no explanation. Just the scenario paragraph(s).`;

            try {
              const response = await callParlorLLM(
                config.provider,
                config.model,
                apiKey,
                spinPrompt,
                "Generate the new scenario now.",
                config.baseUrl
              );

              scenarioField.value = response.trim();
              scenarioField.disabled = false;
              if (A.UI.Toast) A.UI.Toast.show('New scenario woven!', 'success');
            } catch (err) {
              scenarioField.value = 'Failed to spin scenario: ' + err.message;
              scenarioField.disabled = false;
            }

            return false; // Don't close modal
          }
        },
        {
          label: '👥 Add Companion',
          class: 'btn-ghost',
          onclick: async (modal) => {
            const mainName = modal.querySelector('#preview-name').value.trim();
            const mainPersonality = modal.querySelector('#preview-personality').value.trim();
            const scenario = modal.querySelector('#preview-scenario').value.trim();

            if (!mainName || !mainPersonality) {
              if (A.UI.Toast) A.UI.Toast.show('Need main character first!', 'warning');
              return false;
            }

            // Show relationship type selector
            const relationshipTypes = [
              { label: '💕 Love Interest', value: 'love_interest', desc: 'Romantic tension or attraction between them' },
              { label: '⚔️ Rival', value: 'rival', desc: 'Competition, conflict, or opposing goals' },
              { label: '🎓 Mentor', value: 'mentor', desc: 'Teacher, guide, or protective figure' },
              { label: '🌱 Protégé', value: 'protege', desc: 'Student, ward, or someone they protect' },
              { label: '👨‍👩‍👧 Sibling', value: 'sibling', desc: 'Family bond, shared history' },
              { label: '🎲 Surprise Me', value: 'surprise', desc: 'Let Anansi decide the connection' }
            ];

            // Create inline selector
            let selectedRelation = null;
            const selectorHtml = `
              <div style="margin-bottom: 16px;">
                <div style="font-weight: 600; margin-bottom: 8px; color: var(--text-main);">What binds these two souls together?</div>
                <div id="relation-selector" style="display: flex; flex-wrap: wrap; gap: 8px;">
                  ${relationshipTypes.map(r => `
                    <button class="btn btn-ghost btn-sm relation-btn" data-value="${r.value}" title="${r.desc}" style="border: 1px solid var(--border-subtle);">
                      ${r.label}
                    </button>
                  `).join('')}
                </div>
              </div>
              <div id="companion-status" style="text-align: center; padding: 20px; color: var(--text-muted); display: none;">
                ✧ Weaving a companion...
              </div>
            `;

            // Insert selector before scenario
            const scenarioGroup = modal.querySelector('#preview-scenario').parentElement;
            const selectorDiv = document.createElement('div');
            selectorDiv.id = 'companion-selector-container';
            selectorDiv.innerHTML = selectorHtml;
            scenarioGroup.parentElement.insertBefore(selectorDiv, scenarioGroup);

            // Wire up buttons
            const relationBtns = selectorDiv.querySelectorAll('.relation-btn');
            const statusDiv = selectorDiv.querySelector('#companion-status');

            relationBtns.forEach(btn => {
              btn.onclick = async () => {
                selectedRelation = btn.dataset.value;
                selectorDiv.dataset.selectedRelation = selectedRelation;

                // Highlight selected
                relationBtns.forEach(b => b.style.background = '');
                btn.style.background = 'var(--accent-soft)';

                // Show status
                selectorDiv.querySelector('#relation-selector').style.display = 'none';
                statusDiv.style.display = 'block';

                // Get API config
                const keys = JSON.parse(localStorage.getItem('anansi_api_keys') || '{}');
                const activeKeyName = localStorage.getItem('anansi_active_key_name') || 'Default';
                const apiKey = keys[activeKeyName];

                if (!apiKey) {
                  statusDiv.textContent = 'No API key configured!';
                  return;
                }

                const config = JSON.parse(localStorage.getItem('anansi_sim_config') || '{"provider":"gemini","model":"gemini-2.0-flash"}');

                const relationDescriptions = {
                  love_interest: 'a love interest - romantic tension, attraction, or deep emotional connection',
                  rival: 'a rival - competition, conflict, opposing goals, or professional tension',
                  mentor: 'a mentor - teacher, guide, protector, or wise figure who shapes their path',
                  protege: 'a protégé - student, ward, or someone they feel protective of',
                  sibling: 'a sibling - shared blood, family history, and all the complexity that brings',
                  surprise: 'a compelling connection that fits the story naturally'
                };

                const companionPrompt = `You are Anansi, the Spider God. A storyteller has woven one soul and now seeks a companion for them.

THE MAIN CHARACTER:
Name: ${mainName}
Personality: ${mainPersonality}

CURRENT SCENARIO:
${scenario}

Create a COMPANION CHARACTER who is ${relationDescriptions[selectedRelation]} for ${mainName}.

The companion must:
1. Complement or contrast the main character interestingly
2. Have their own distinct personality, not just exist for the main character
3. Fit naturally into the existing scenario
4. Create narrative tension or emotional depth

ALSO update the scenario to include BOTH characters and how {{user}} encounters them together.

FORMATTING:
- *Asterisks* for actions
- "Quotes" for dialogue
- **Bold** for emphasis
- ESCAPE internal double quotes: "Lila \"Flick\" Kane" OR use single quotes: "Lila 'Flick' Kane"


CRITICAL: Respond ONLY with valid JSON:
{
  "companion": {
    "name": "companion name",
    "appearance": "physical description",
    "personality": "2-3 paragraphs about who they are"
  },
  "relationship": "one paragraph describing the dynamic between ${mainName} and the companion",
  "scenario": "updated scenario featuring BOTH characters and how {{user}} meets them"
}`;

                try {
                  const response = await callParlorLLM(
                    config.provider,
                    config.model,
                    apiKey,
                    companionPrompt,
                    "Generate the companion now.",
                    config.baseUrl
                  );

                  // Parse response
                  let companionData;
                  try {
                    const jsonMatch = response.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                      companionData = safeJsonParse(jsonMatch[0]);
                    }
                  } catch (parseErr) {
                    throw new Error('Failed to parse companion data');
                  }

                  if (!companionData || !companionData.companion) {
                    throw new Error('Invalid companion data received');
                  }

                  // Update the modal to show both characters
                  selectorDiv.innerHTML = `
                    <div style="background: var(--accent-soft); border-radius: var(--radius-md); padding: 12px; margin-bottom: 16px;">
                      <div style="font-weight: 600; color: var(--accent-primary); margin-bottom: 8px;">
                        👥 Companion: ${escapeHtml(companionData.companion.name)}
                      </div>
                      <div style="font-size: 12px; margin-bottom: 8px; font-style: italic; color: var(--text-muted);">
                        ${escapeHtml(companionData.relationship || '')}
                      </div>
                      <textarea id="companion-appearance" class="input" style="height: 50px; resize: vertical; font-size: 12px; margin-bottom: 4px;" placeholder="Appearance...">${escapeHtml(companionData.companion.appearance || '')}</textarea>
                      <textarea id="companion-personality" class="input" style="height: 100px; resize: vertical; font-size: 12px;">${escapeHtml(companionData.companion.personality || '')}</textarea>
                    </div>
                  `;

                  // Update scenario
                  modal.querySelector('#preview-scenario').value = companionData.scenario || scenario;

                  if (A.UI.Toast) A.UI.Toast.show(`${companionData.companion.name} joins the story!`, 'success');

                } catch (err) {
                  statusDiv.textContent = 'Failed: ' + err.message;
                  selectorDiv.querySelector('#relation-selector').style.display = 'flex';
                  statusDiv.style.display = 'none';
                }
              };
            });

            return false; // Don't close modal
          }
        }
      ]
    });
  }

  // ============================================
  // ENSEMBLE PREVIEW MODAL
  // ============================================
  function showEnsemblePreview(ensembleData, answers) {
    const characters = ensembleData.characters || [];
    const relationships = ensembleData.relationships || [];
    const scenario = ensembleData.scenario || '';

    const content = document.createElement('div');
    content.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: var(--space-3);">
        <!-- Web of Connections (FIRST, always visible) -->
        ${relationships.length > 0 ? `
          <div class="card" style="margin: 0; padding: 12px; background: var(--accent-soft); flex-shrink: 0;">
            <div style="font-weight: 600; margin-bottom: 8px; color: var(--accent-primary);">🕸️ Web of Connections</div>
            ${relationships.map(r => `
              <div style="font-size: 12px; margin-bottom: 4px;">
                <strong>${escapeHtml(Array.isArray(r.between) ? r.between.join(' ↔ ') : 'Connection')}</strong>: 
                ${escapeHtml(r.dynamic || '')}
              </div>
            `).join('')}
          </div>
        ` : ''}

        <!-- Character Cards (scrollable) -->
        <div style="max-height: 250px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; padding-right: 4px;">
          ${characters.map((char, i) => `
            <div class="card" style="margin: 0; padding: 10px; border-left: 3px solid var(--accent-primary); flex-shrink: 0;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <input type="text" class="input char-name" data-idx="${i}" value="${escapeHtml(char.name || '')}" 
                  style="font-weight: 600; font-size: 13px; width: 65%; padding: 4px 8px;">
                <span style="font-size: 10px; color: var(--text-muted); text-transform: uppercase;">${escapeHtml(char.role || 'character')}</span>
              </div>
              <textarea class="input char-appearance" data-idx="${i}" style="height: 40px; resize: vertical; font-size: 11px; padding: 6px; margin-bottom: 4px;" placeholder="Appearance...">${escapeHtml(char.appearance || '')}</textarea>
              <textarea class="input char-personality" data-idx="${i}" style="height: 60px; resize: vertical; font-size: 11px; padding: 6px;">${escapeHtml(char.personality || '')}</textarea>
            </div>
          `).join('')}
        </div>



        <!-- Shared Scenario -->
        <div class="form-group">
          <label class="label">Shared Scenario</label>
          <textarea id="ensemble-scenario" class="input" style="height: 120px; resize: vertical;">${escapeHtml(scenario)}</textarea>
        </div>

        <div style="
          padding: 12px;
          background: var(--bg-surface);
          border-radius: var(--radius-md);
          font-size: 11px;
          color: var(--text-muted);
        ">
          <strong>Woven with:</strong> ${answers.genre || 'fantasy'} / ${answers.tone || 'dramatic'} / ${answers.rating || 'mature'}
        </div>
      </div>
    `;

    A.UI.Modal.show({
      title: '🕸️ Your Ensemble Awaits',
      content: content,
      width: 650,
      actions: [
        {
          label: 'Discard',
          class: 'btn-secondary',
          onclick: () => true
        },
        {
          label: '✓ Create Project',
          class: 'btn-primary',
          onclick: async (modal) => {
            // Gather all character data
            const charNames = modal.querySelectorAll('.char-name');
            const charPersonalities = modal.querySelectorAll('.char-personality');
            const scenarioText = modal.querySelector('#ensemble-scenario').value.trim();

            const isFull = await A.ProjectDB.isFull();
            if (isFull) {
              if (A.UI.Toast) A.UI.Toast.show('The web is full. Delete a project to make room.', 'error');
              return false;
            }

            await A.IO.saveNow();
            A.State.reset();
            const state = A.State.get();

            // Use first character as main
            const mainName = charNames[0]?.value.trim() || 'Ensemble';
            const mainPersonality = charPersonalities[0]?.value.trim() || '';

            state.meta.id = A.ProjectDB.generateId();
            state.meta.name = mainName;
            state.meta.description = `Ensemble woven by Anansi (${characters.length} chars)`;

            state.seed = state.seed || {};
            state.seed.characterName = mainName;
            state.seed.chatName = mainName;
            state.seed.persona = mainPersonality;
            state.seed.scenario = scenarioText;

            // Add additional characters to notes or as separate actors if we have the structure
            if (characters.length > 1) {
              let ensembleNotes = '=== ENSEMBLE CAST ===\n\n';
              for (let i = 0; i < charNames.length; i++) {
                const name = charNames[i]?.value.trim() || `Character ${i + 1}`;
                const personality = charPersonalities[i]?.value.trim() || '';
                ensembleNotes += `## ${name}\n${personality}\n\n`;
              }
              if (relationships.length > 0) {
                ensembleNotes += '=== RELATIONSHIPS ===\n\n';
                relationships.forEach(r => {
                  const between = Array.isArray(r.between) ? r.between.join(' ↔ ') : 'Connection';
                  ensembleNotes += `${between}: ${r.dynamic || ''}\n`;
                });
              }
              state.seed.characterNotes = ensembleNotes;
            }

            await A.ProjectDB.save(state);
            A.ProjectDB.setCurrentId(state.meta.id);

            A.State.notify();
            A.UI.refresh();

            if (A.UI.Toast) A.UI.Toast.show(`Ensemble "${mainName}" has been woven!`, 'success');
            A.UI.switchPanel('character');

            return true;
          }
        },
        {
          label: '👥 Import All to Actors',
          class: 'btn-ghost',
          onclick: (modal) => {
            const charNames = modal.querySelectorAll('.char-name');
            const charPersonalities = modal.querySelectorAll('.char-personality');
            const charAppearances = modal.querySelectorAll('.char-appearance');

            if (charNames.length === 0) {
              if (A.UI.Toast) A.UI.Toast.show('No characters to import!', 'warning');
              return false;
            }

            // Prompt for Project
            const dialogContent = document.createElement('div');
            dialogContent.innerText = `You are about to import ${charNames.length} actors. Where should they go?`;

            A.UI.Modal.show({
              title: 'Import Ensemble',
              content: dialogContent,
              width: 400,
              actions: [
                { label: 'Cancel', class: 'btn-secondary', onclick: () => true },
                {
                  label: 'Add to Current Project',
                  class: 'btn-ghost',
                  onclick: () => {
                    const gender = answers.gender || 'any';
                    let createdCount = 0;
                    for (let i = 0; i < charNames.length; i++) {
                      const name = charNames[i]?.value.trim() || `Character ${i + 1}`;
                      const personality = charPersonalities[i]?.value.trim() || '';
                      const appearance = charAppearances[i]?.value.trim() || '';
                      if (name) {
                        createActorFromParlor(name, personality, appearance, i === 0 ? gender : 'any', 'Generated by The Spider\'s Parlor (Ensemble)');
                        createdCount++;
                      }
                    }
                    A.State.notify();
                    if (A.UI.Toast) A.UI.Toast.show(`${createdCount} actors added to current project!`, 'success');
                    A.UI.switchPanel('actors');
                    return true;
                  }
                },
                {
                  label: 'Start New Project',
                  class: 'btn-primary',
                  onclick: async () => {
                    const isFull = await A.ProjectDB.isFull();
                    if (isFull) {
                      if (A.UI.Toast) A.UI.Toast.show('Cannot create new project: Storage full', 'error');
                      return false;
                    }
                    await A.IO.saveNow();
                    A.State.reset();
                    const state = A.State.get();

                    // Use first character as main project name
                    const mainName = charNames[0]?.value.trim() || 'Ensemble';
                    const mainPersonality = charPersonalities[0]?.value.trim() || '';
                    const scenario = modal.querySelector('#ensemble-scenario')?.value.trim() || '';

                    state.meta.id = A.ProjectDB.generateId();
                    state.meta.name = mainName;
                    state.meta.description = `Ensemble woven by Anansi (${charNames.length} chars)`;

                    // Populate Character Panel (Seed)
                    state.seed = {
                      characterName: mainName,
                      chatName: mainName,
                      persona: mainPersonality,
                      scenario: scenario,
                      examples: ''
                    };

                    // Add actors
                    const gender = answers.gender || 'any';
                    let createdCount = 0;
                    for (let i = 0; i < charNames.length; i++) {
                      const name = charNames[i]?.value.trim() || `Character ${i + 1}`;
                      const personality = charPersonalities[i]?.value.trim() || '';
                      const appearance = charAppearances[i]?.value.trim() || '';
                      if (name) {
                        createActorFromParlor(name, personality, appearance, i === 0 ? gender : 'any', i === 0 ? 'Ensemble Protagonist' : 'Ensemble Member');
                        createdCount++;
                      }
                    }

                    await A.ProjectDB.save(state);
                    A.ProjectDB.setCurrentId(state.meta.id);
                    A.State.notify();
                    A.UI.refresh();

                    if (A.UI.Toast) A.UI.Toast.show(`New project "${mainName}" created with ${createdCount} actors!`, 'success');
                    A.UI.switchPanel('character'); // Switch to Character panel
                    return true;
                  }
                }
              ]
            });

            return true;
          }
        }
      ]
    });
  }

  // Helper to safely parse JSON from LLM that might include unescaped quotes
  function safeJsonParse(str) {
    try {
      return JSON.parse(str);
    } catch (e) {
      console.warn('[Parlor] JSON parse failed, attempting auto-fix...');
      // Heuristic: identify unescaped double quotes inside strings and escape them.
      // This is risky but helps with "Lila "Flick" Kane" cases.
      // Only replace " if it's NOT a structural delimiter.
      // Structural delimiters are:
      // Start of value: : "
      // End of value: " , OR " }
      // Start of key: " (after { or ,)
      // End of key: " :

      // Regex approach:
      // Find " that are NOT preceded by (start of line/file OR { OR [ OR , OR : + optional space)
      // AND NOT followed by (optional space + } OR ] OR , OR :)

      const fixed = str.replace(/([^\s{\[\,:]\s*)"(\s*[^\s}\]\,:])/g, '$1\\"$2');

      // Also handle the "Nickname" case specifically where it might be surrounded by spaces inside a string
      // "Lila "Flick" Kane" -> "Lila \"Flick\" Kane"
      // The inner quotes are preceded by a char that is not \ and followed by a char that is not structure

      // Let's try a simpler specific fix for the user's case first:
      // "Name "Nickname" Surname"
      const fixed2 = str.replace(/(?<=\w)\s*"\s*(?=\w)/g, '\\"').replace(/(?<=\w)\s*"\s*(?=\w)/g, '\\"');

      try {
        return JSON.parse(fixed2);
      } catch (e2) {
        // Last ditch: replace ALL quotes that aren't structural
        // This is too hard to do perfectly with regex.
        // Let's rely on the prompt update primarily.
        throw e;
      }
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // ============================================
  // LLM CLIENT
  // ============================================
  async function callParlorLLM(provider, model, key, systemPrompt, userMessage, baseUrl) {
    console.log(`[Parlor] Calling ${provider} (${model})...`);

    if (provider === 'gemini') {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

      const payload = {
        contents: [{ role: 'user', parts: [{ text: userMessage }] }],
        system_instruction: { parts: [{ text: systemPrompt }] },
        generationConfig: {
          temperature: 0.9,
          maxOutputTokens: 2048
        }
      };

      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error?.message || resp.statusText);
      }

      const data = await resp.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || '(No response)';
    }

    if (provider === 'openai' || provider === 'chutes' || provider === 'custom') {
      let url;
      if (provider === 'openai') url = 'https://api.openai.com/v1/chat/completions';
      else if (provider === 'chutes') url = 'https://llm.chutes.ai/v1/chat/completions';
      else url = `${(baseUrl || 'https://api.example.com/v1').replace(/\/$/, '')}/chat/completions`;

      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ];

      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`
        },
        body: JSON.stringify({
          model: model,
          messages: messages,
          temperature: 0.9
        })
      });

      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error?.message || resp.statusText);
      }

      const data = await resp.json();
      return data.choices?.[0]?.message?.content || '(No response)';
    }

    throw new Error(`Unknown provider: ${provider}`);
  }

  // Register panel
  A.registerPanel('parlor', {
    label: "The Spider's Parlor",
    subtitle: 'AI Character Creator',
    category: 'Forbidden Secrets',
    render: render
  });

})(window.Anansi);
