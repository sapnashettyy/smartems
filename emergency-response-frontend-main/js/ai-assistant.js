/* =========================================================
   SmartEMS AI Emergency Assistant
   Ollama AI + Natural Language + Follow-up Questions + Voice
   ========================================================= */

(function () {
  "use strict";

  console.log("SmartEMS AI Assistant: loading...");

  const API_URL = "http://localhost:5000/api/ai/extract";

  const state = {
    active: false,
    emergencyType: "General Emergency",
    questionIndex: 0,
    answers: {},
    transcript: [],
    initialFeatures: {},
    knownFeatures: new Set(),
    initialStatement: "",
    recognition: null,
  };

  /*
   * Keep unknown facts unknown during collection.
   * Defaults below are for compatibility with the existing
   * frontend only. Verify model preprocessing before using
   * these values for real ML predictions.
   */
  const DEFAULT_FEATURES = {
    age: null,
    emergency_type: "General Emergency",
    incident_location: "Unknown",
    bleeding: "No",
    conscious: "Yes",
    breathing: "Normal",
    accident_level: "None",
    visible_fracture: "No",
    trapped: "No",
    injury_type: "None",
    pain_level: "Mild",
    chest_pain: "No",
    sweating: "No",
    shortness_of_breath: "No",
    face_drooping: "No",
    arm_weakness: "No",
    speech_difficulty: "No",
    poison_type: "None",
    vomiting: "No",
    seizures: "No",
    entry_exit_burn: "No",
    muscle_spasm: "No",
    fall_after_shock: "No",
    water_type: "None",
    water_inhalation: "No",
    cpr_required: "No",
    fall_height: 0,
    head_injury: "No",
    animal_type: "None",
    bite_location: "None",
    venomous: "No",
    weapon_involved: "No",
    injury_location: "None",
    visible_injury: "No",
  };

  const QUESTION_SETS = {
    Accident: [
      ["bleeding", "Is the patient bleeding?"],
      ["conscious", "Is the patient conscious and responding?"],
      ["breathing", "Is the patient breathing normally?"],
      [
        "accident_level",
        "How serious does the accident appear: Minor, Moderate, or Severe?",
      ],
      ["visible_fracture", "Is there a visible or suspected broken bone?"],
      [
        "trapped",
        "Is the patient trapped inside a vehicle or under something?",
      ],
      ["injury_type", "What type of injury is present?"],
      [
        "pain_level",
        "How severe is the pain: None, Mild, Moderate, or Severe?",
      ],
      ["head_injury", "Does the patient have a head injury?"],
      ["visible_injury", "Are there any visible injuries?"],
      ["injury_location", "Where on the body is the injury?"],
    ],

    "Chest Pain": [
      ["chest_pain", "Is the patient experiencing chest pain or pressure?"],
      [
        "sweating",
        "Is the patient sweating unusually or experiencing cold sweats?",
      ],
      [
        "shortness_of_breath",
        "Is the patient experiencing shortness of breath?",
      ],
      ["conscious", "Is the patient conscious and responding?"],
      ["breathing", "Is the patient breathing normally?"],
      [
        "pain_level",
        "How severe is the pain: None, Mild, Moderate, or Severe?",
      ],
    ],

    "Breathing Problem": [
      [
        "breathing",
        "Is the patient breathing normally, struggling to breathe, or not breathing?",
      ],
      ["conscious", "Is the patient conscious and responding?"],
      ["chest_pain", "Is the patient also experiencing chest pain?"],
      ["sweating", "Is the patient sweating unusually?"],
    ],

    Stroke: [
      ["face_drooping", "Is one side of the patient's face drooping?"],
      ["arm_weakness", "Does the patient have weakness in one arm?"],
      ["speech_difficulty", "Is the patient having difficulty speaking?"],
      ["conscious", "Is the patient conscious and responding?"],
      ["breathing", "Is the patient breathing normally?"],
    ],

    Burn: [
      ["entry_exit_burn", "Does the patient have a burn injury?"],
      ["injury_location", "Where is the burn located?"],
      ["pain_level", "How severe is the pain: Mild, Moderate, or Severe?"],
      ["breathing", "Is the patient breathing normally?"],
      ["conscious", "Is the patient conscious and responding?"],
    ],

    Poisoning: [
      [
        "poison_type",
        "What substance may have caused the poisoning, if known?",
      ],
      ["vomiting", "Is the patient vomiting?"],
      ["seizures", "Is the patient experiencing seizures?"],
      ["conscious", "Is the patient conscious and responding?"],
      ["breathing", "Is the patient breathing normally?"],
    ],

    Drowning: [
      [
        "water_type",
        "Where did the incident happen: pool, river, sea, or another water source?",
      ],
      ["water_inhalation", "Did the patient inhale or swallow water?"],
      ["conscious", "Is the patient conscious and responding?"],
      ["breathing", "Is the patient breathing normally?"],
      [
        "cpr_required",
        "Is CPR being performed or has a qualified responder indicated it is needed?",
      ],
    ],

    "Animal Bite": [
      ["animal_type", "What animal caused the bite?"],
      ["bite_location", "Where on the body is the bite?"],
      ["venomous", "Is the animal known or suspected to be venomous?"],
      ["bleeding", "Is the bite bleeding?"],
      ["pain_level", "How severe is the pain: Mild, Moderate, or Severe?"],
    ],

    Fall: [
      [
        "fall_height",
        "Approximately how high did the patient fall, in feet? Enter 0 if unknown.",
      ],
      [
        "head_injury",
        "Did the patient hit their head or sustain a head injury?",
      ],
      ["conscious", "Is the patient conscious and responding?"],
      ["bleeding", "Is the patient bleeding?"],
      ["visible_fracture", "Is there a visible or suspected broken bone?"],
      [
        "pain_level",
        "How severe is the pain: None, Mild, Moderate, or Severe?",
      ],
    ],

    "General Emergency": [
      ["conscious", "Is the patient conscious and responding?"],
      ["breathing", "Is the patient breathing normally?"],
      ["bleeding", "Is the patient bleeding?"],
      [
        "pain_level",
        "How severe is the pain: None, Mild, Moderate, or Severe?",
      ],
      ["visible_injury", "Are there any visible injuries?"],
    ],
  };

  function getElement(id) {
    return document.getElementById(id);
  }

  function addMessage(message, sender = "bot") {
    const conversation = getElement("aiConversation");
    if (!conversation) return;

    conversation.hidden = false;

    const bubble = document.createElement("div");
    bubble.className = `ai-message ai-${sender}`;
    bubble.textContent = message;

    conversation.appendChild(bubble);
    conversation.scrollTop = conversation.scrollHeight;
  }

  function canonicalEmergencyType(value) {
    const type = String(value || "")
      .trim()
      .toLowerCase();

    const aliases = {
      accident: "Accident",
      "road accident": "Accident",
      "traffic accident": "Accident",
      "chest pain": "Chest Pain",
      "heart pain": "Chest Pain",
      "heart attack": "Chest Pain",
      "breathing problem": "Breathing Problem",
      "difficulty breathing": "Breathing Problem",
      breathlessness: "Breathing Problem",
      stroke: "Stroke",
      burn: "Burn",
      burns: "Burn",
      poisoning: "Poisoning",
      poison: "Poisoning",
      drowning: "Drowning",
      "animal bite": "Animal Bite",
      bite: "Animal Bite",
      fall: "Fall",
      "fall injury": "Fall",
      emergency: "General Emergency",
      "general emergency": "General Emergency",
    };

    return aliases[type] || "General Emergency";
  }

  function extractInitialFacts(description) {
    const text = String(description || "").toLowerCase();
    const features = {};
    const knownFeatures = new Set();

    // Age is extracted only if it is explicitly stated.
    const ageMatch = text.match(
      /\b(?:aged?\s*)?(\d{1,3})\s*(?:-?\s*years?\s*old|y\/o|years?\s*of\s*age)\b/i,
    );

    if (ageMatch) {
      const age = Number(ageMatch[1]);

      if (Number.isInteger(age) && age >= 1 && age <= 120) {
        features.age = age;
        knownFeatures.add("age");
      }
    }

    function setYesNo(feature, positive, negative) {
      const hasPositive = positive.test(text);
      const hasNegative = negative.test(text);

      // Conflicting information stays unknown.
      if (hasPositive === hasNegative) return;

      features[feature] = hasPositive ? "Yes" : "No";
      knownFeatures.add(feature);
    }

    setYesNo(
      "bleeding",
      /\b(bleeding|bleed|blood loss|heavy blood loss)\b/i,
      /\b(no bleeding|not bleeding|without bleeding|no blood loss)\b/i,
    );

    setYesNo(
      "chest_pain",
      /\b(chest pain|chest pressure|chest tightness|chest discomfort)\b/i,
      /\b(no chest pain|no chest pressure|no chest tightness)\b/i,
    );

    setYesNo(
      "sweating",
      /\b(sweating|sweaty|cold sweat|excessive sweating)\b/i,
      /\b(no sweating|not sweating|no cold sweat)\b/i,
    );

    setYesNo(
      "face_drooping",
      /\b(face drooping|drooping face|facial droop)\b/i,
      /\b(no face drooping|no facial droop|face is not drooping)\b/i,
    );

    setYesNo(
      "arm_weakness",
      /\b(arm weakness|weak arm|weakness in (the )?arm)\b/i,
      /\b(no arm weakness|no weakness in (the )?arm)\b/i,
    );

    setYesNo(
      "speech_difficulty",
      /\b(slurred speech|difficulty speaking|unable to speak)\b/i,
      /\b(no speech difficulty|speaking normally|speech is normal)\b/i,
    );

    setYesNo(
      "vomiting",
      /\b(vomiting|vomit|throwing up)\b/i,
      /\b(no vomiting|not vomiting|has not vomited)\b/i,
    );

    setYesNo(
      "seizures",
      /\b(seizure|seizures|convulsion|convulsions)\b/i,
      /\b(no seizures|no seizure|no convulsions)\b/i,
    );
    setYesNo(
      "visible_fracture",
      /\b(fracture|broken bone|broken arm|broken leg)\b/i,
      /\b(no fracture|no broken bone|no broken arm|no broken leg|no fracture has been confirmed|no broken bone has been confirmed|fracture has not been confirmed)\b/i,
    );
    setYesNo(
      "trapped",
      /\b(trapped|pinned under|stuck and cannot get out)\b/i,
      /\b(not trapped|not pinned|not stuck|isn't trapped|is not trapped|isn't pinned|not stuck under anything)\b/i,
    );

    setYesNo(
      "head_injury",
      /\b(head injury|head trauma|hit (my|his|her|their) head)\b/i,
      /\b(no known head injury|no head injury|no head trauma|did not hit (my|his|her|their) head)\b/i,
    );
    setYesNo(
      "visible_injury",
      /\b(open wound|deep cut|visible injur(?:y|ies)|visible wound|visible injuries)\b/i,
      /\b(no visible injury|no visible injuries|no wound|no injuries)\b/i,
    );

    setYesNo(
      "entry_exit_burn",
      /\b(burn|burned|burnt|burn injury)\b/i,
      /\b(no burn|not burned|not burnt|no burn injury)\b/i,
    );

    if (
      /\b(unconscious|unresponsive|passed out|not responding)\b/i.test(text) &&
      !/\b(not unconscious|not unresponsive)\b/i.test(text)
    ) {
      features.conscious = "No";
      knownFeatures.add("conscious");
    } else if (/\b(conscious|awake|alert|responding)\b/i.test(text)) {
      features.conscious = "Yes";
      knownFeatures.add("conscious");
    }

    if (
      /\b(not breathing|cannot breathe|can't breathe|struggling to breathe|difficulty breathing|shortness of breath)\b/i.test(
        text,
      ) &&
      !/\b(no difficulty breathing|no shortness of breath)\b/i.test(text)
    ) {
      features.breathing =
        /\b(not breathing|cannot breathe|can't breathe)\b/i.test(text)
          ? "Not Breathing"
          : "Difficulty";
      features.shortness_of_breath = "Yes";
      knownFeatures.add("breathing");
      knownFeatures.add("shortness_of_breath");
    } else if (
      /\b(normal breathing|breathing normally|breathing fine|no breathing problem|no shortness of breath)\b/i.test(
        text,
      )
    ) {
      features.breathing = "Normal";
      features.shortness_of_breath = "No";
      knownFeatures.add("breathing");
      knownFeatures.add("shortness_of_breath");
    }

    if (
      /\b(severe|extreme|unbearable|excruciating)\b/i.test(text) &&
      /\b(pain|ache|hurts|hurt)\b/i.test(text)
    ) {
      features.pain_level = "Severe";
      knownFeatures.add("pain_level");
    } else if (/\b(moderate|medium) pain\b/i.test(text)) {
      features.pain_level = "Moderate";
      knownFeatures.add("pain_level");
    } else if (/\b(mild|slight|minor) pain\b/i.test(text)) {
      features.pain_level = "Mild";
      knownFeatures.add("pain_level");
    } else if (
      /\b(no pain|without pain|does not hurt|doesn't hurt)\b/i.test(text)
    ) {
      features.pain_level = "None";
      knownFeatures.add("pain_level");
    }

    const heightMatch = text.match(
      /\b(\d+(?:\.\d+)?)\s*(feet|foot|ft|meters|meter|m)\b/i,
    );

    if (heightMatch && /\b(fall|fell|fallen|slipped|tripped)\b/i.test(text)) {
      let height = Number(heightMatch[1]);

      if (/^(meters|meter|m)$/i.test(heightMatch[2])) {
        height *= 3.28084;
      }

      features.fall_height = Math.round(height);
      knownFeatures.add("fall_height");
    }
    // Detect injury location from the original description.
    const injuryLocations = [
      "head",
      "neck",
      "chest",
      "back",
      "stomach",
      "arm",
      "hand",
      "leg",
      "knee",
      "foot",
      "ankle",
    ];

    const foundLocations = injuryLocations.filter((location) =>
      new RegExp(`\\b${location}\\b`, "i").test(text),
    );
    if (foundLocations.length > 0) {
      features.injury_location = foundLocations.join(", ");
      knownFeatures.add("injury_location");
    }

    if (
      /\b(severe|major|serious)\b/i.test(text) &&
      /\b(accident|crash|collision)\b/i.test(text)
    ) {
      features.accident_level = "Severe";
      knownFeatures.add("accident_level");
    }
    return { features, knownFeatures };
  }

  async function extractEmergencyDetails(description) {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ description }),
    });

    if (!response.ok) {
      throw new Error(`AI extraction failed: HTTP ${response.status}`);
    }

    const result = await response.json();

    if (result.status && result.status !== "success") {
      throw new Error(result.message || "AI extraction failed");
    }

    return result;
  }

  function normalizeYesNo(value) {
    if (typeof value === "boolean") {
      return value ? "Yes" : "No";
    }

    if (typeof value === "string") {
      const text = value.trim().toLowerCase();

      if (["yes", "true", "present"].includes(text)) return "Yes";
      if (["no", "false", "absent"].includes(text)) return "No";
    }

    return null;
  }

  function applyExtractedFacts(result) {
    const data = result?.data || result || {};
    const facts = Array.isArray(data.facts)
      ? Object.assign(
          {},
          data,
          ...data.facts.filter(
            (item) => item && typeof item === "object" && !Array.isArray(item),
          ),
        )
      : { ...data, ...(data.facts || {}) };
    const features = {};
    const knownFeatures = new Set();

    const age = Number(data.age);

    if (
      data.age !== null &&
      data.age !== undefined &&
      data.age !== "" &&
      Number.isInteger(age) &&
      age >= 1 &&
      age <= 120
    ) {
      features.age = age;
      knownFeatures.add("age");
    }

    const type = canonicalEmergencyType(data.emergency_type);

    if (data.emergency_type) {
      features.emergency_type = type;
    }

    const mappings = {
      bleeding: ["bleeding"],
      conscious: ["conscious", "consciousness"],
      breathing: ["breathing"],
      chest_pain: ["chest_pain", "chest pain"],
      sweating: ["sweating"],
      shortness_of_breath: ["shortness_of_breath", "shortness of breath"],
      face_drooping: ["face_drooping", "facial drooping"],
      arm_weakness: ["arm_weakness", "arm weakness"],
      speech_difficulty: ["speech_difficulty", "difficulty speaking"],
      vomiting: ["vomiting"],
      seizures: ["seizures", "seizure"],
      visible_fracture: ["visible_fracture"],
      trapped: ["trapped"],
      head_injury: ["head_injury", "head injury"],
      visible_injury: ["visible_injury", "visible injury"],
      water_inhalation: ["water_inhalation", "water inhalation"],
      cpr_required: ["cpr_required", "cpr required"],
      entry_exit_burn: ["entry_exit_burn", "burn"],
      muscle_spasm: ["muscle_spasm", "muscle spasm"],
      weapon_involved: ["weapon_involved", "weapon involved"],
      venomous: ["venomous"],
      injury_location: ["injury_location", "injury location"],
      injury_type: ["injury_type", "injury type"],
      pain_level: ["pain_level", "pain level"],
    };

    for (const [feature, keys] of Object.entries(mappings)) {
      let found = false;
      let candidate;

      for (const key of keys) {
        if (Object.prototype.hasOwnProperty.call(facts, key)) {
          candidate = facts[key];
          found = true;
          break;
        }
      }

      if (!found) continue;

      if (candidate && typeof candidate === "object") {
        if ("present" in candidate) {
          candidate = candidate.present;
        } else if ("value" in candidate) {
          candidate = candidate.value;
        } else if ("status" in candidate) {
          candidate = candidate.status;
        } else {
          continue;
        }
      }

      if (feature === "breathing") {
        if (typeof candidate !== "string") continue;

        const value = candidate.toLowerCase();

        if (value.includes("not breathing") || value === "absent") {
          features.breathing = "Not Breathing";
          features.shortness_of_breath = "Yes";
          knownFeatures.add("breathing");
          knownFeatures.add("shortness_of_breath");
        } else if (
          value.includes("difficulty") ||
          value.includes("abnormal") ||
          value.includes("struggling")
        ) {
          features.breathing = "Difficulty";
          features.shortness_of_breath = "Yes";
          knownFeatures.add("breathing");
          knownFeatures.add("shortness_of_breath");
        } else if (value.includes("normal") || value.includes("regular")) {
          features.breathing = "Normal";
          features.shortness_of_breath = "No";
          knownFeatures.add("breathing");
          knownFeatures.add("shortness_of_breath");
        }

        continue;
      }
      if (["injury_location", "injury_type", "pain_level"].includes(feature)) {
        if (typeof candidate === "string" && candidate.trim()) {
          features[feature] = candidate.trim();
          knownFeatures.add(feature);
        }
        continue;
      }
      const yesNo = normalizeYesNo(candidate);

      if (yesNo !== null) {
        features[feature] = yesNo;
        knownFeatures.add(feature);

        if (feature === "shortness_of_breath") {
          features.breathing = yesNo === "Yes" ? "Difficulty" : "Normal";
          knownFeatures.add("breathing");
        }
      }
    }

    return {
      emergencyType: type,
      features,
      knownFeatures,
    };
  }

  function normalizeAnswer(feature, rawAnswer) {
    const answer = String(rawAnswer || "")
      .trim()
      .toLowerCase();

    if (!answer) return "";

    const yesNoFeatures = [
      "bleeding",
      "conscious",
      "visible_fracture",
      "trapped",
      "chest_pain",
      "sweating",
      "shortness_of_breath",
      "face_drooping",
      "arm_weakness",
      "speech_difficulty",
      "vomiting",
      "seizures",
      "entry_exit_burn",
      "muscle_spasm",
      "fall_after_shock",
      "water_inhalation",
      "cpr_required",
      "head_injury",
      "venomous",
      "weapon_involved",
      "visible_injury",
    ];

    if (yesNoFeatures.includes(feature)) {
      if (/^(yes|yeah|yep|true|present)$/i.test(answer)) return "Yes";
      if (/^(no|nope|false|absent)$/i.test(answer)) return "No";
      return rawAnswer.trim();
    }

    if (feature === "age") {
      const value = Number(answer);
      return Number.isInteger(value) && value >= 1 && value <= 120 ? value : "";
    }

    if (feature === "fall_height") {
      const value = Number(answer);
      return Number.isFinite(value) && value >= 0 ? value : "";
    }

    if (feature === "breathing") {
      if (answer.includes("not breathing") || answer === "no breathing") {
        return "Not Breathing";
      }

      if (
        answer.includes("difficulty") ||
        answer.includes("struggling") ||
        answer.includes("shortness") ||
        answer.includes("breathless") ||
        answer.includes("hard to breathe")
      ) {
        return "Difficulty";
      }

      if (
        answer.includes("normal") ||
        answer.includes("fine") ||
        answer.includes("normally") ||
        answer === "okay" ||
        answer === "ok"
      ) {
        return "Normal";
      }

      return rawAnswer.trim();
    }

    if (feature === "pain_level") {
      if (
        answer.includes("severe") ||
        answer.includes("extreme") ||
        answer.includes("unbearable")
      )
        return "Severe";

      if (answer.includes("moderate") || answer.includes("medium")) {
        return "Moderate";
      }

      if (answer.includes("mild") || answer.includes("slight")) {
        return "Mild";
      }

      if (answer === "none" || answer === "no pain") return "None";

      return rawAnswer.trim();
    }

    if (feature === "accident_level") {
      if (answer.includes("severe") || answer.includes("major"))
        return "Severe";
      if (answer.includes("moderate") || answer.includes("medium"))
        return "Moderate";
      if (answer.includes("minor") || answer.includes("mild")) return "Minor";
      return rawAnswer.trim();
    }

    return rawAnswer.trim();
  }

  function showQuestion() {
    const questions =
      QUESTION_SETS[state.emergencyType] || QUESTION_SETS["General Emergency"];

    while (state.questionIndex < questions.length) {
      const feature = questions[state.questionIndex][0];

      if (!state.knownFeatures.has(feature)) break;

      state.questionIndex++;
    }

    if (state.questionIndex >= questions.length) {
      finishAssistant();
      return;
    }

    const [feature, question] = questions[state.questionIndex];

    const questionElement = getElement("aiQuestion");
    const input = getElement("aiAnswerInput");
    const inputRow = getElement("aiInputRow");
    const progress = getElement("aiProgressBar");
    const status = getElement("aiStatus");

    if (questionElement) {
      questionElement.textContent = question;
      questionElement.hidden = false;
    }

    if (inputRow) inputRow.hidden = false;

    if (input) {
      input.value = "";
      input.placeholder = "Type your answer...";
      input.focus();
    }

    if (progress) {
      progress.style.width = `${Math.round((state.questionIndex / questions.length) * 100)}%`;
    }

    if (status) {
      status.textContent = `Question ${state.questionIndex + 1} of ${questions.length}`;
    }
  }

  async function startAssistant() {
    if (state.active) return;

    const statementInput = getElement("symptoms");
    const statement = statementInput?.value?.trim() || "";
    const startButton = getElement("aiStartButton");
    const conversation = getElement("aiConversation");
    const progressContainer = getElement("aiProgress");

    if (!statement) {
      alert("Please describe the emergency first.");
      return;
    }

    state.active = true;
    state.questionIndex = 0;
    state.answers = {};
    state.transcript = [];
    state.initialFeatures = {};
    state.knownFeatures = new Set();
    state.initialStatement = statement;

    if (conversation) {
      conversation.replaceChildren();
      conversation.hidden = false;
    }

    if (progressContainer) progressContainer.hidden = false;

    if (startButton) {
      startButton.disabled = true;
      startButton.textContent = "Analyzing...";
    }

    addMessage("Hello! I am the SmartEMS AI emergency assistant.");
    addMessage("I'm analyzing the description. Please wait.");

    try {
      const aiResult = await extractEmergencyDetails(statement);
      console.log("AI extraction result:", aiResult);

      const extractedByAI = applyExtractedFacts(aiResult);
      const extractedFromText = extractInitialFacts(statement);

      state.emergencyType = extractedByAI.emergencyType;

      state.initialFeatures = {
        ...extractedByAI.features,
        ...extractedFromText.features,
        emergency_type: state.emergencyType,
      };

      state.knownFeatures = new Set([
        ...extractedByAI.knownFeatures,
        ...extractedFromText.knownFeatures,
      ]);

      console.log("Known features:", [...state.knownFeatures]);

      state.answers = { ...state.initialFeatures };

      addMessage(`The description appears to concern: ${state.emergencyType}.`);

      if (state.initialFeatures.age != null) {
        addMessage(
          `Age extracted from the description: ${state.initialFeatures.age}.`,
        );
      } else {
        addMessage("Age was not clearly stated, so I have not assigned one.");
      }

      addMessage(
        "I'll ask follow-up questions about details that are still unclear.",
      );
    } catch (error) {
      console.error("AI extraction failed:", error);

      const extracted = extractInitialFacts(statement);

      state.emergencyType = "General Emergency";
      state.initialFeatures = {
        ...extracted.features,
        emergency_type: state.emergencyType,
      };

      state.knownFeatures = new Set(extracted.knownFeatures);
      state.answers = { ...state.initialFeatures };

      addMessage(
        "I couldn't reach the AI backend. Basic text matching will be used instead. Please verify every detail.",
      );
    } finally {
      if (startButton) {
        startButton.hidden = true;
        startButton.disabled = false;
        startButton.textContent = "Start AI Assistant";
      }
    }

    showQuestion();
  }

  function submitAnswer() {
    if (!state.active) return;

    const input = getElement("aiAnswerInput");
    if (!input) return;

    const rawAnswer = input.value.trim();

    if (!rawAnswer) {
      input.focus();
      return;
    }

    const questions =
      QUESTION_SETS[state.emergencyType] || QUESTION_SETS["General Emergency"];

    const current = questions[state.questionIndex];

    if (!current) {
      finishAssistant();
      return;
    }

    const [feature, question] = current;
    const normalized = normalizeAnswer(feature, rawAnswer);

    if (normalized === "" || normalized === undefined) {
      addMessage("I couldn't understand that answer. Please try again.");
      input.focus();
      return;
    }

    state.answers[feature] = normalized;
    state.knownFeatures.add(feature);

    state.transcript.push({
      question,
      answer: rawAnswer,
      feature,
      value: normalized,
    });

    addMessage(`${question}`, "bot");
    addMessage(`Your answer: ${rawAnswer}`, "user");

    state.questionIndex++;
    showQuestion();
  }

  function finishAssistant() {
    state.active = false;

    const features = {
      ...DEFAULT_FEATURES,
      ...state.initialFeatures,
      ...state.answers,
    };

    features.emergency_type = state.emergencyType || "General Emergency";

    if (!state.knownFeatures.has("age")) {
      features.age = null;
    }

    window.smartEMSFeatures = features;

    window.smartEMSAIData = {
      emergencyType: state.emergencyType,
      initialStatement: state.initialStatement,
      knownFeatures: Array.from(state.knownFeatures),
      answers: { ...state.answers },
      features: { ...features },
      transcript: [...state.transcript],
    };

    const progress = getElement("aiProgressBar");
    if (progress) progress.style.width = "100%";

    const question = getElement("aiQuestion");
    if (question) question.hidden = true;

    const inputRow = getElement("aiInputRow");
    if (inputRow) inputRow.hidden = true;

    const status = getElement("aiStatus");
    if (status) status.textContent = "Information collection complete";

    addMessage(
      "The question sequence is complete. Review the collected information before continuing with the SOS workflow.",
    );

    console.log("SmartEMS assistant collected features:", features);
  }

  function startVoiceInput() {
    if (!state.active) {
      addMessage("Please start the assistant before using voice input.");
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      addMessage(
        "Voice input is not supported in this browser. Please type your answer.",
      );
      return;
    }

    if (state.recognition) {
      try {
        state.recognition.abort();
      } catch (error) {
        console.warn("Could not stop previous recognition.", error);
      }
    }

    const recognition = new SpeechRecognition();

    recognition.lang = "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    state.recognition = recognition;

    const voiceButton = getElement("aiVoiceButton");

    if (voiceButton) {
      voiceButton.disabled = true;
      voiceButton.textContent = "Listening...";
    }

    addMessage("Listening. Please speak your answer.");

    recognition.onresult = function (event) {
      const transcript = event.results?.[0]?.[0]?.transcript || "";

      const input = getElement("aiAnswerInput");

      if (input && transcript) {
        input.value = transcript;
        input.focus();
      }
    };

    recognition.onerror = function (event) {
      console.warn("Voice recognition error:", event.error);

      if (event.error === "not-allowed") {
        addMessage(
          "Microphone permission was denied. Allow microphone access or type your answer.",
        );
      } else if (event.error !== "aborted") {
        addMessage(
          "Voice recognition could not complete. Please type your answer.",
        );
      }
    };

    recognition.onend = function () {
      if (voiceButton) {
        voiceButton.disabled = false;
        voiceButton.textContent = "🎤 Speak";
      }
    };

    try {
      recognition.start();
    } catch (error) {
      if (voiceButton) {
        voiceButton.disabled = false;
        voiceButton.textContent = "🎤 Speak";
      }

      console.error("Unable to start voice recognition:", error);
      addMessage("Unable to start voice input. Please type your answer.");
    }
  }

  function createAssistantUI() {
    if (getElement("aiAssistantCard")) return;

    const sosButton = getElement("sosButton");

    if (!sosButton || !sosButton.parentNode) {
      console.error("SmartEMS assistant: SOS button was not found.");
      return;
    }

    const card = document.createElement("section");

    card.id = "aiAssistantCard";
    card.className = "ai-assistant-card";

    card.innerHTML = `
      <div class="ai-assistant-header">
        <div>
          <h2>AI Emergency Assistant</h2>
          <p>Describe the emergency and answer the follow-up questions.</p>
        </div>
        <span aria-hidden="true">🤖</span>
      </div>

      <div class="ai-progress" id="aiProgress" hidden>
        <div class="ai-progress-track">
          <div class="ai-progress-bar" id="aiProgressBar" style="width:0%"></div>
        </div>
        <p id="aiStatus" aria-live="polite">Ready to begin</p>
      </div>

      <div id="aiConversation" class="ai-conversation" aria-live="polite" hidden></div>

      <div id="aiQuestion" class="ai-question" hidden></div>

      <div id="aiInputRow" class="ai-input-row" hidden>
        <input
          type="text"
          id="aiAnswerInput"
          placeholder="Type your answer..."
          autocomplete="off"
          aria-label="Your answer"
        >

        <button type="button" id="aiSubmitButton">Send</button>
        <button type="button" id="aiVoiceButton">🎤 Speak</button>
      </div>

      <button
        type="button"
        id="aiStartButton"
        class="ai-start-button"
      >
        Start AI Assistant
      </button>

      <p class="ai-disclaimer">
        This assistant is an academic prototype, not a medical diagnosis
        system. In a real emergency, contact emergency services immediately.
        Do not wait for this questionnaire to finish.
      </p>
    `;

    sosButton.parentNode.insertBefore(card, sosButton);

    getElement("aiStartButton").addEventListener("click", startAssistant);
    getElement("aiSubmitButton").addEventListener("click", submitAnswer);

    getElement("aiAnswerInput").addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        event.preventDefault();
        submitAnswer();
      }
    });

    getElement("aiVoiceButton").addEventListener("click", startVoiceInput);
  }

  function initialize() {
    createAssistantUI();

    console.log("SmartEMS AI Assistant: initialized.");

    if (
      getElement("aiStartButton") &&
      getElement("aiConversation") &&
      getElement("aiAnswerInput")
    ) {
      console.log("SmartEMS AI Assistant: UI ready.");
    } else {
      console.error("SmartEMS AI Assistant: some UI elements are missing.");
    }
  }

  window.smartEMSAI = {
    start: startAssistant,
    submit: submitAnswer,
    startVoice: startVoiceInput,

    getFeatures: function () {
      return window.smartEMSFeatures ? { ...window.smartEMSFeatures } : null;
    },

    getState: function () {
      return {
        active: state.active,
        emergencyType: state.emergencyType,
        questionIndex: state.questionIndex,
        transcript: [...state.transcript],
      };
    },
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize);
  } else {
    initialize();
  }
})();
