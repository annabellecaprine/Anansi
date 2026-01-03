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
      id: 'cast',
      text: "Do you seek to craft a single soul, or shall we weave an ensemble of characters?",
      type: 'buttons',
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
      condition: (answers) => answers.cast === 'ensemble'
    },
    {
      id: 'gender',
      text: "And the protagonist of this tale... what form do they take?",
      type: 'buttons',
      options: [
        { label: 'Male', value: 'male' },
        { label: 'Female', value: 'female' },
        { label: 'Non-binary', value: 'nonbinary' },
        { label: 'You Decide', value: 'any' }
      ],
      // Adjust text for ensemble
      getText: (answers) => answers.cast === 'ensemble'
        ? "And the lead character of this ensemble... what form do they take?"
        : "And the protagonist of this tale... what form do they take?"
    },
    {
      id: 'archetype',
      text: "What archetype calls to your soul? What essence shall define them?",
      type: 'buttons',
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
      options: [
        { label: '☀️ Keep it Wholesome', value: 'sfw' },
        { label: '🌙 Mature Themes', value: 'mature' },
        { label: '🔥 Explicit', value: 'explicit' }
      ]
    },
    {
      id: 'user_role',
      text: "And YOU, dear storyteller... what role shall you play in this tale?",
      type: 'buttons',
      options: [
        { label: '🎭 A Stranger They Meet', value: 'stranger' },
        { label: '💫 Someone From Their Past', value: 'past' },
        { label: '🤝 A Close Companion', value: 'companion' },
        { label: '⚔️ A Rival or Adversary', value: 'rival' },
        { label: '❓ Surprise Me', value: 'surprise' }
      ]
    },
    {
      id: 'concept',
      text: "Now then... whisper to me the seed of your story. What vision burns in your mind?",
      type: 'textarea',
      placeholder: "Describe the character, their world, and how your paths might cross..."
    },
    {
      id: 'extras',
      text: "Is there anything else the weave should contain? Special elements, themes, or flavors you desire?",
      type: 'textarea',
      placeholder: "(Optional) Any additional details...",
      optional: true,
      skipLabel: 'Skip this step'
    },
    {
      id: 'confirm',
      text: "The threads are gathered. The pattern is clear in my mind. Shall I begin the weave?",
      type: 'buttons',
      options: [
        { label: '🕸️ Weave My Story', value: 'weave', primary: true }
      ]
    }
  ];

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

${answers.extras ? `SPECIAL ELEMENTS REQUESTED:\n${answers.extras}\n` : ''}
THEIR STORY CONCEPT:
${answers.concept}

IMPORTANT: The scenario should directly address {{user}} or set up an encounter with {{user}}. Do NOT write a scenario where the user has no entry point into the story.

CRITICAL: Respond ONLY with valid JSON in this exact format, no markdown, no explanation:
{"name": "character name", "personality": "personality text", "scenario": "scenario text that hooks {{user}} into the story"}`;
  }

  // ============================================
  // RENDER FUNCTION
  // ============================================
  function render(container) {
    container.style.height = '100%';
    container.style.overflowY = 'hidden';
    container.style.background = 'linear-gradient(135deg, var(--bg-base) 0%, rgba(139, 69, 19, 0.05) 100%)';

    // State
    let currentStep = 0;
    let answers = {};
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
      currentStep = 0;
      answers = {};
      conversationLog.innerHTML = '';
      inputArea.style.display = 'none';
      inputArea.innerHTML = '';
      btnRestart.style.display = 'none';
      // Clear runes after runeContainer is initialized (called lazily)
      if (typeof clearRunes === 'function') clearRunes();
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
      cast: '☿',        // Mercury - transformation
      ensemble_details: '⚶', // Additional symbol
      gender: '⚥',      // Gender symbol
      archetype: '⚹',   // Sextile - essence/archetype
      genre: '✧',       // Star
      tone: '☽',        // Crescent moon
      rating: '⚗',      // Alembic
      user_role: '⚔',   // Crossed swords
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
      while (currentStep < QUESTIONS.length) {
        const question = QUESTIONS[currentStep];
        // Check condition
        if (question.condition && !question.condition(answers)) {
          currentStep++;
          continue;
        }
        return question;
      }
      return null;
    }

    async function advanceConversation() {
      const question = getNextQuestion();
      if (!question) return;

      // Show restart after first question
      if (currentStep > 0) {
        btnRestart.style.display = 'block';
      }

      // Get dynamic text if available
      const questionText = question.getText ? question.getText(answers) : question.text;

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
        currentStep++;
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

      question.options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'response-btn' + (opt.primary ? ' primary' : '');
        btn.textContent = opt.label;
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
      answers[question.id] = option.value;

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
        'user_role:rival': "*Conflict breeds the finest tales.* I approve."
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
      }

      // Special handling for 'weave' confirmation
      if (option.value === 'weave') {
        startWeaving();
        return;
      }

      // Advance
      currentStep++;
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

      currentStep++;
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
        const systemPrompt = buildSystemPrompt(answers);
        const response = await callParlorLLM(
          config.provider,
          config.model,
          apiKey,
          systemPrompt,
          "Please weave the character now.",
          config.baseUrl
        );

        setSparkle(false);

        // Parse response
        let cardData;
        try {
          const jsonMatch = response.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            cardData = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error('No JSON found');
          }
        } catch (parseErr) {
          showError("The weave unraveled... I could not form the pattern. Shall we try again?");
          console.error('[Parlor] Parse error:', response);
          return;
        }

        // Show success
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

        // Show preview modal
        setTimeout(() => showPreviewModal(cardData, answers), 1000);

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

    // Start the conversation
    setTimeout(() => advanceConversation(), 500);
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
          <label class="label">Personality</label>
          <textarea id="preview-personality" class="input" style="height: 150px; resize: vertical;">${escapeHtml(cardData.personality || '')}</textarea>
        </div>
        
        <div class="form-group">
          <label class="label">Scenario</label>
          <textarea id="preview-scenario" class="input" style="height: 100px; resize: vertical;">${escapeHtml(cardData.scenario || '')}</textarea>
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
${answers.concept ? `- Story Concept: ${answers.concept}` : ''}

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
        }
      ]
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
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
