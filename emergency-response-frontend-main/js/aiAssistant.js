/* =========================================================
   SmartEMS AI Emergency Assistant
   Voice + Natural Language + Follow-up Questions
   ========================================================= */

(function () {
    "use strict";

    console.log("SmartEMS AI Assistant: loading...");

    /* =========================================================
       1. STATE
       ========================================================= */

    const state = {
        active: false,
        emergencyType: "",
        questionIndex: 0,
        answers: {},
        transcript: [],
        recognition: null,
        listening: false
    };


    /* =========================================================
       2. 34 ML FEATURES
       ========================================================= */

    const DEFAULT_FEATURES = {
        age: 30,
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
        visible_injury: "No"
    };


    /* =========================================================
       3. QUESTION SETS
       These are used immediately so the assistant works even
       if the JSON files have a loading/path problem.
       ========================================================= */

    const QUESTION_SETS = {

        "Accident": [
            {
                feature: "age",
                question: "What is the patient's age?"
            },
            {
                feature: "incident_location",
                question: "Where did the accident happen?"
            },
            {
                feature: "bleeding",
                question: "Is the patient bleeding?"
            },
            {
                feature: "conscious",
                question: "Is the patient conscious?"
            },
            {
                feature: "breathing",
                question: "Is the patient breathing normally?"
            },
            {
                feature: "accident_level",
                question: "How serious does the accident appear: minor, moderate, or severe?"
            },
            {
                feature: "visible_fracture",
                question: "Is there any visible fracture?"
            },
            {
                feature: "trapped",
                question: "Is the patient trapped inside a vehicle or under something?"
            },
            {
                feature: "injury_type",
                question: "What type of injury is present?"
            },
            {
                feature: "pain_level",
                question: "How severe is the pain: mild, moderate, or severe?"
            },
            {
                feature: "head_injury",
                question: "Is there any head injury?"
            },
            {
                feature: "visible_injury",
                question: "Is there any visible injury?"
            }
        ],


        "Chest Pain": [
            {
                feature: "age",
                question: "What is the patient's age?"
            },
            {
                feature: "chest_pain",
                question: "Is the patient experiencing chest pain?"
            },
            {
                feature: "shortness_of_breath",
                question: "Is the patient having difficulty breathing?"
            },
            {
                feature: "sweating",
                question: "Is the patient sweating unusually?"
            },
            {
                feature: "pain_level",
                question: "How severe is the chest pain: mild, moderate, or severe?"
            },
            {
                feature: "conscious",
                question: "Is the patient conscious?"
            },
            {
                feature: "breathing",
                question: "Is the patient breathing normally?"
            }
        ],


        "Breathing Problem": [
            {
                feature: "age",
                question: "What is the patient's age?"
            },
            {
                feature: "shortness_of_breath",
                question: "Is the patient experiencing shortness of breath?"
            },
            {
                feature: "breathing",
                question: "Is the patient breathing normally?"
            },
            {
                feature: "conscious",
                question: "Is the patient conscious?"
            },
            {
                feature: "chest_pain",
                question: "Is the patient also having chest pain?"
            },
            {
                feature: "sweating",
                question: "Is the patient sweating unusually?"
            }
        ],


        "Stroke": [
            {
                feature: "age",
                question: "What is the patient's age?"
            },
            {
                feature: "face_drooping",
                question: "Is one side of the patient's face drooping?"
            },
            {
                feature: "arm_weakness",
                question: "Does the patient have weakness in one arm?"
            },
            {
                feature: "speech_difficulty",
                question: "Is the patient having difficulty speaking?"
            },
            {
                feature: "conscious",
                question: "Is the patient conscious?"
            },
            {
                feature: "breathing",
                question: "Is the patient breathing normally?"
            }
        ],


        "Burn": [
            {
                feature: "age",
                question: "What is the patient's age?"
            },
            {
                feature: "entry_exit_burn",
                question: "Is the burn caused by electricity or does it have an entry or exit wound?"
            },
            {
                feature: "muscle_spasm",
                question: "Are there any muscle spasms?"
            },
            {
                feature: "pain_level",
                question: "How severe is the pain?"
            },
            {
                feature: "visible_injury",
                question: "Is there visible injury to the skin?"
            },
            {
                feature: "conscious",
                question: "Is the patient conscious?"
            },
            {
                feature: "breathing",
                question: "Is the patient breathing normally?"
            }
        ],


        "Poisoning": [
            {
                feature: "age",
                question: "What is the patient's age?"
            },
            {
                feature: "poison_type",
                question: "What type of poison or substance was involved?"
            },
            {
                feature: "vomiting",
                question: "Is the patient vomiting?"
            },
            {
                feature: "seizures",
                question: "Is the patient having seizures?"
            },
            {
                feature: "conscious",
                question: "Is the patient conscious?"
            },
            {
                feature: "breathing",
                question: "Is the patient breathing normally?"
            }
        ],


        "Drowning": [
            {
                feature: "age",
                question: "What is the patient's age?"
            },
            {
                feature: "water_type",
                question: "What type of water incident occurred: pool, river, sea, or other?"
            },
            {
                feature: "water_inhalation",
                question: "Did the patient inhale water?"
            },
            {
                feature: "cpr_required",
                question: "Was CPR required?"
            },
            {
                feature: "conscious",
                question: "Is the patient conscious?"
            },
            {
                feature: "breathing",
                question: "Is the patient breathing normally?"
            }
        ],


        "Animal Bite": [
            {
                feature: "age",
                question: "What is the patient's age?"
            },
            {
                feature: "animal_type",
                question: "What animal caused the bite?"
            },
            {
                feature: "bite_location",
                question: "Where on the body is the bite?"
            },
            {
                feature: "venomous",
                question: "Is the animal known or suspected to be venomous?"
            },
            {
                feature: "bleeding",
                question: "Is the bite bleeding?"
            },
            {
                feature: "visible_injury",
                question: "Is there visible injury?"
            }
        ],


        "Fall": [
            {
                feature: "age",
                question: "What is the patient's age?"
            },
            {
                feature: "fall_height",
                question: "Approximately how high did the patient fall, in feet?"
            },
            {
                feature: "head_injury",
                question: "Did the patient hit their head?"
            },
            {
                feature: "visible_fracture",
                question: "Is there any visible fracture?"
            },
            {
                feature: "pain_level",
                question: "How severe is the pain?"
            },
            {
                feature: "conscious",
                question: "Is the patient conscious?"
            },
            {
                feature: "breathing",
                question: "Is the patient breathing normally?"
            },
            {
                feature: "visible_injury",
                question: "Is there any visible injury?"
            }
        ],


        "General Emergency": [
            {
                feature: "age",
                question: "What is the patient's age?"
            },
            {
                feature: "incident_location",
                question: "Where is the emergency happening?"
            },
            {
                feature: "conscious",
                question: "Is the patient conscious?"
            },
            {
                feature: "breathing",
                question: "Is the patient breathing normally?"
            },
            {
                feature: "bleeding",
                question: "Is the patient bleeding?"
            },
            {
                feature: "pain_level",
                question: "How severe is the pain?"
            },
            {
                feature: "visible_injury",
                question: "Is there any visible injury?"
            }
        ]
    };


    /* =========================================================
       4. NORMALIZE USER ANSWERS
       ========================================================= */

    function normalizeAnswer(feature, answer) {

        const text = String(answer || "")
            .trim()
            .toLowerCase();

        if (!text) {
            return "";
        }


        /* AGE */

        if (feature === "age") {

            const match = text.match(/\d+/);

            if (match) {
                return Number(match[0]);
            }

            return "";
        }


        /* FALL HEIGHT */

        if (feature === "fall_height") {

            const match = text.match(/\d+(\.\d+)?/);

            if (match) {
                return Number(match[0]);
            }

            return 0;
        }


        /* YES / NO */

        const negativeWords = [
            "no",
            "not",
            "none",
            "never",
            "without",
            "don't",
            "doesn't",
            "isn't",
            "is not",
            "nope",
            "negative"
        ];

        const positiveWords = [
            "yes",
            "yeah",
            "yep",
            "true",
            "present",
            "having",
            "there is",
            "there are",
            "positive"
        ];


        if (
            [
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
                "visible_injury"
            ].includes(feature)
        ) {

            for (const word of negativeWords) {

                if (text.includes(word)) {
                    return "No";
                }

            }

            for (const word of positiveWords) {

                if (text.includes(word)) {
                    return "Yes";
                }

            }

            return text;
        }


        /* BREATHING */

        if (feature === "breathing") {

            if (
                text.includes("not breathing") ||
                text.includes("can't breathe") ||
                text.includes("cannot breathe") ||
                text.includes("unable to breathe")
            ) {
                return "Abnormal";
            }

            if (
                text.includes("normal") ||
                text.includes("normally") ||
                text.includes("fine") ||
                text.includes("okay") ||
                text.includes("ok")
            ) {
                return "Normal";
            }

            if (
                text.includes("difficulty") ||
                text.includes("difficult") ||
                text.includes("short") ||
                text.includes("struggling")
            ) {
                return "Abnormal";
            }

            return text;
        }


        /* PAIN */

        if (feature === "pain_level") {

            if (
                text.includes("severe") ||
                text.includes("very bad") ||
                text.includes("extreme") ||
                text.includes("unbearable")
            ) {
                return "Severe";
            }

            if (
                text.includes("moderate") ||
                text.includes("medium")
            ) {
                return "Moderate";
            }

            if (
                text.includes("mild") ||
                text.includes("little") ||
                text.includes("slight")
            ) {
                return "Mild";
            }

            return text;
        }


        /* ACCIDENT LEVEL */

        if (feature === "accident_level") {

            if (
                text.includes("severe") ||
                text.includes("major") ||
                text.includes("serious")
            ) {
                return "Severe";
            }

            if (
                text.includes("moderate") ||
                text.includes("medium")
            ) {
                return "Moderate";
            }

            if (
                text.includes("minor") ||
                text.includes("small") ||
                text.includes("mild")
            ) {
                return "Minor";
            }

            return text;
        }


        return answer.trim();
    }


    /* =========================================================
       5. CREATE AI UI
       ========================================================= */

    function createAssistantUI() {

        if (document.getElementById("smartEMSAssistant")) {
            return;
        }


        const container = document.createElement("section");

        container.id = "smartEMSAssistant";


        container.innerHTML = `

            <style>

                #smartEMSAssistant {
                    width: 100%;
                    max-width: 805px;
                    margin: 30px auto;
                    padding: 28px;
                    background: #ffffff;
                    border: 1px solid #e5e7eb;
                    border-radius: 22px;
                    box-shadow: 0 10px 35px rgba(0,0,0,0.08);
                    box-sizing: border-box;
                    font-family: Inter, Arial, sans-serif;
                }

                #smartEMSAssistant * {
                    box-sizing: border-box;
                }

                .ai-header {
                    display: flex;
                    align-items: center;
                    gap: 14px;
                    margin-bottom: 20px;
                }

                .ai-icon {
                    width: 48px;
                    height: 48px;
                    border-radius: 14px;
                    background: #eef2ff;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 25px;
                }

                .ai-title h2 {
                    margin: 0;
                    font-size: 21px;
                    color: #172033;
                }

                .ai-title p {
                    margin: 4px 0 0;
                    color: #6b7280;
                    font-size: 13px;
                }

                .ai-conversation {
                    min-height: 100px;
                    max-height: 300px;
                    overflow-y: auto;
                    padding: 15px;
                    border-radius: 15px;
                    background: #f8fafc;
                    margin-bottom: 18px;
                }

                .ai-message {
                    margin-bottom: 12px;
                    padding: 12px 15px;
                    border-radius: 13px;
                    line-height: 1.5;
                    font-size: 14px;
                }

                .ai-message.bot {
                    background: #eef2ff;
                    color: #1e293b;
                }

                .ai-message.user {
                    background: #172033;
                    color: white;
                    margin-left: 20%;
                }

                .ai-question {
                    font-size: 17px;
                    font-weight: 700;
                    color: #172033;
                    margin: 15px 0;
                }

                .ai-input-row {
                    display: flex;
                    gap: 10px;
                    margin-top: 10px;
                }

                .ai-input {
                    flex: 1;
                    min-width: 0;
                    padding: 14px;
                    border: 1px solid #d1d5db;
                    border-radius: 12px;
                    font-size: 15px;
                    outline: none;
                }

                .ai-input:focus {
                    border-color: #ef3340;
                }

                .ai-btn {
                    border: none;
                    border-radius: 12px;
                    padding: 13px 17px;
                    cursor: pointer;
                    font-weight: 700;
                    font-size: 14px;
                }

                .ai-start {
                    width: 100%;
                    background: #ef3340;
                    color: white;
                    margin-bottom: 15px;
                }

                .ai-submit {
                    background: #172033;
                    color: white;
                }

                .ai-voice {
                    background: #eef2ff;
                    color: #172033;
                    min-width: 52px;
                }

                .ai-voice.listening {
                    background: #ef3340;
                    color: white;
                }

                .ai-status {
                    text-align: center;
                    margin-top: 12px;
                    font-size: 13px;
                    color: #64748b;
                }

                .ai-progress {
                    height: 6px;
                    background: #e5e7eb;
                    border-radius: 20px;
                    overflow: hidden;
                    margin-bottom: 15px;
                }

                .ai-progress-bar {
                    height: 100%;
                    width: 0%;
                    background: #ef3340;
                    transition: width 0.3s ease;
                }

                .ai-complete {
                    padding: 18px;
                    border-radius: 15px;
                    background: #ecfdf5;
                    color: #065f46;
                    font-weight: 600;
                    line-height: 1.6;
                }

                .ai-hidden {
                    display: none !important;
                }

                @media(max-width:600px) {

                    #smartEMSAssistant {
                        margin: 20px 10px;
                        padding: 18px;
                    }

                    .ai-input-row {
                        flex-wrap: wrap;
                    }

                    .ai-input {
                        width: 100%;
                        flex-basis: 100%;
                    }

                    .ai-submit {
                        flex: 1;
                    }

                }

            </style>


            <div class="ai-header">

                <div class="ai-icon">
                    🤖
                </div>

                <div class="ai-title">

                    <h2>
                        SmartEMS AI Assistant
                    </h2>

                    <p>
                        Voice-enabled emergency information assistant
                    </p>

                </div>

            </div>


            <button
                id="aiStartButton"
                class="ai-btn ai-start"
                type="button"
            >
                🚑 Start AI Emergency Assistant
            </button>


            <div
                id="aiProgress"
                class="ai-progress ai-hidden"
            >
                <div
                    id="aiProgressBar"
                    class="ai-progress-bar"
                ></div>
            </div>


            <div
                id="aiConversation"
                class="ai-conversation ai-hidden"
            ></div>


            <div
                id="aiQuestion"
                class="ai-question ai-hidden"
            ></div>


            <div
                id="aiInputRow"
                class="ai-input-row ai-hidden"
            >

                <input
                    type="text"
                    id="aiAnswerInput"
                    class="ai-input"
                    placeholder="Type your answer..."
                    autocomplete="off"
                >


                <button
                    type="button"
                    id="aiVoiceButton"
                    class="ai-btn ai-voice"
                    title="Speak"
                >
                    🎤
                </button>


                <button
                    type="button"
                    id="aiSubmitButton"
                    class="ai-btn ai-submit"
                >
                    Submit
                </button>

            </div>


            <div
                id="aiStatus"
                class="ai-status"
            >
                AI assistant ready
            </div>

        `;


        /*
         * Put the assistant before the response section.
         */

        const responseSection =
            document.querySelector(".response-section");


        if (responseSection) {

            responseSection.parentNode.insertBefore(
                container,
                responseSection
            );

        } else {

            const main =
                document.querySelector("main");

            if (main) {
                main.appendChild(container);
            } else {
                document.body.appendChild(container);
            }

        }


        console.log("SmartEMS AI Assistant: UI created");

        setupEvents();
    }


    /* =========================================================
       6. UI HELPERS
       ========================================================= */

    function addMessage(message, type = "bot") {

        const conversation =
            document.getElementById("aiConversation");

        if (!conversation) return;


        const div =
            document.createElement("div");

        div.className =
            "ai-message " + type;

        div.textContent = message;

        conversation.appendChild(div);

        conversation.scrollTop =
            conversation.scrollHeight;
    }


    function show(id) {

        const element =
            document.getElementById(id);

        if (element) {
            element.classList.remove("ai-hidden");
        }

    }


    function hide(id) {

        const element =
            document.getElementById(id);

        if (element) {
            element.classList.add("ai-hidden");
        }

    }


    function updateProgress() {

        const questions =
            QUESTION_SETS[state.emergencyType] ||
            QUESTION_SETS["General Emergency"];


        const percent =
            Math.round(
                (state.questionIndex / questions.length) * 100
            );


        const bar =
            document.getElementById("aiProgressBar");


        if (bar) {
            bar.style.width =
                Math.min(percent, 100) + "%";
        }

    }


    function showQuestion() {

        const questions =
            QUESTION_SETS[state.emergencyType] ||
            QUESTION_SETS["General Emergency"];


        if (
            state.questionIndex >= questions.length
        ) {

            finishAssistant();

            return;
        }


        const current =
            questions[state.questionIndex];


        const question =
            document.getElementById("aiQuestion");


        if (question) {

            question.textContent =
                current.question;

        }


        show("aiQuestion");
        show("aiInputRow");


        const input =
            document.getElementById("aiAnswerInput");


        if (input) {

            input.value = "";

            input.focus();

        }


        updateProgress();


        const status =
            document.getElementById("aiStatus");


        if (status) {

            status.textContent =
                `Question ${state.questionIndex + 1} of ${questions.length}`;

        }

    }


    /* =========================================================
       7. START ASSISTANT
       ========================================================= */

    function startAssistant() {

        state.active = true;
        state.questionIndex = 0;
        state.answers = {};
        state.transcript = [];


        const emergencySelect =
            document.getElementById("emergencyType");


        state.emergencyType =
            emergencySelect?.value ||
            "General Emergency";


        if (!QUESTION_SETS[state.emergencyType]) {

            state.emergencyType =
                "General Emergency";

        }


        show("aiProgress");
        show("aiConversation");


        hide("aiStartButton");


        const emergencyName =
            document.getElementById("patientName")?.value;


        addMessage(
            "Hello! I am the SmartEMS AI emergency assistant."
        );


        addMessage(
            `I will collect the important information for this ${state.emergencyType} case.`
        );


        if (emergencyName) {

            addMessage(
                `I have the patient name as ${emergencyName}.`
            );

        }


        showQuestion();

    }


    /* =========================================================
       8. SUBMIT ANSWER
       ========================================================= */

    function submitAnswer() {

        if (!state.active) {
            return;
        }


        const input =
            document.getElementById("aiAnswerInput");


        if (!input) return;


        const rawAnswer =
            input.value.trim();


        if (!rawAnswer) {

            input.focus();

            return;

        }


        const questions =
            QUESTION_SETS[state.emergencyType] ||
            QUESTION_SETS["General Emergency"];


        const current =
            questions[state.questionIndex];


        const normalized =
            normalizeAnswer(
                current.feature,
                rawAnswer
            );


        if (
            normalized === "" ||
            normalized === undefined
        ) {

            addMessage(
                "I didn't understand that answer. Please provide the information again.",
                "bot"
            );

            input.focus();

            return;
        }


        state.answers[current.feature] =
            normalized;


        state.transcript.push({
            question: current.question,
            answer: rawAnswer,
            feature: current.feature,
            value: normalized
        });


        addMessage(
            rawAnswer,
            "user"
        );


        state.questionIndex++;


        showQuestion();

    }


    /* =========================================================
       9. FINISH ASSISTANT
       ========================================================= */

    function finishAssistant() {

        state.active = false;


        const features = {
            ...DEFAULT_FEATURES,
            ...state.answers
        };


        features.emergency_type =
            state.emergencyType;


        /*
         * Get age from normal emergency form if AI did not collect it.
         */

        const ageInput =
            document.getElementById("patientAge");


        if (
            ageInput &&
            ageInput.value &&
            !state.answers.age
        ) {

            features.age =
                Number(ageInput.value);

        }


        /*
         * Store for existing SmartEMS script.
         */

        window.smartEMSFeatures =
            features;


        /*
         * Also expose complete AI data.
         */

        window.smartEMSAIData = {
            emergencyType: state.emergencyType,
            answers: state.answers,
            features: features,
            transcript: state.transcript
        };


        /*
         * Try to populate the normal form.
         */

        populateEmergencyForm(features);


        hide("aiQuestion");
        hide("aiInputRow");


        const progress =
            document.getElementById("aiProgressBar");


        if (progress) {
            progress.style.width = "100%";
        }


        const conversation =
            document.getElementById("aiConversation");


        if (conversation) {

            const complete =
                document.createElement("div");

            complete.className =
                "ai-complete";

            complete.innerHTML = `
                ✅ Emergency information collected successfully.<br><br>
                The completed 34-feature emergency data is ready for ML triage.
                <br><br>
                You can now press the <strong>SOS</strong> button below.
            `;

            conversation.appendChild(complete);

            conversation.scrollTop =
                conversation.scrollHeight;
        }


        const status =
            document.getElementById("aiStatus");


        if (status) {

            status.textContent =
                "AI information collection completed";

        }


        console.log(
            "SmartEMS AI completed features:",
            features
        );

    }


    /* =========================================================
       10. POPULATE NORMAL FORM
       ========================================================= */

    function populateEmergencyForm(features) {

        const type =
            document.getElementById("emergencyType");


        if (
            type &&
            features.emergency_type
        ) {

            type.value =
                features.emergency_type;

        }


        const symptoms =
            document.getElementById("symptoms");


        if (symptoms) {

            const importantAnswers =
                state.transcript
                    .map(
                        item =>
                            `${item.question} ${item.answer}`
                    )
                    .join("\n");


            if (importantAnswers) {

                symptoms.value =
                    importantAnswers;

            }

        }

    }


    /* =========================================================
       11. VOICE RECOGNITION
       ========================================================= */

    function setupVoiceRecognition() {

        const SpeechRecognition =
            window.SpeechRecognition ||
            window.webkitSpeechRecognition;


        const voiceButton =
            document.getElementById("aiVoiceButton");


        if (!voiceButton) {
            return;
        }


        if (!SpeechRecognition) {

            voiceButton.title =
                "Voice recognition is not supported in this browser";


            voiceButton.addEventListener(
                "click",
                function () {

                    alert(
                        "Voice input is not supported by this browser. Please use Google Chrome or type your answer."
                    );

                }
            );

            return;
        }


        state.recognition =
            new SpeechRecognition();


        state.recognition.lang =
            "en-IN";


        state.recognition.continuous =
            false;


        state.recognition.interimResults =
            false;


        state.recognition.maxAlternatives =
            1;


        state.recognition.onstart =
            function () {

                state.listening = true;

                voiceButton.classList.add(
                    "listening"
                );

                voiceButton.textContent =
                    "🔴";


                const status =
                    document.getElementById("aiStatus");


                if (status) {

                    status.textContent =
                        "Listening... Speak now";

                }

            };


        state.recognition.onresult =
            function (event) {

                const text =
                    event.results[0][0].transcript;


                const input =
                    document.getElementById(
                        "aiAnswerInput"
                    );


                if (input) {

                    input.value =
                        text;

                }


                const status =
                    document.getElementById("aiStatus");


                if (status) {

                    status.textContent =
                        "Voice answer received";

                }

            };


        state.recognition.onerror =
            function (event) {

                console.error(
                    "Speech recognition error:",
                    event.error
                );


                const status =
                    document.getElementById("aiStatus");


                if (status) {

                    status.textContent =
                        "Voice input failed. You can type the answer.";

                }

            };


        state.recognition.onend =
            function () {

                state.listening = false;

                voiceButton.classList.remove(
                    "listening"
                );

                voiceButton.textContent =
                    "🎤";

            };


        voiceButton.addEventListener(
            "click",
            function () {

                if (state.listening) {

                    state.recognition.stop();

                    return;

                }


                try {

                    state.recognition.start();

                } catch (error) {

                    console.error(error);

                }

            }
        );

    }


    /* =========================================================
       12. EVENTS
       ========================================================= */

    function setupEvents() {

        const startButton =
            document.getElementById(
                "aiStartButton"
            );


        const submitButton =
            document.getElementById(
                "aiSubmitButton"
            );


        const input =
            document.getElementById(
                "aiAnswerInput"
            );


        if (startButton) {

            startButton.addEventListener(
                "click",
                startAssistant
            );

        }


        if (submitButton) {

            submitButton.addEventListener(
                "click",
                submitAnswer
            );

        }


        if (input) {

            input.addEventListener(
                "keydown",
                function (event) {

                    if (
                        event.key === "Enter"
                    ) {

                        event.preventDefault();

                        submitAnswer();

                    }

                }
            );

        }


        setupVoiceRecognition();

    }


    /* =========================================================
       13. OPTIONAL JSON LOADING
       ========================================================= */

    async function loadTrainingQuestionFiles() {

        try {

            const base =
                "../data/";


            const response =
                await fetch(
                    base + "QUESTION_SETS.json"
                );


            if (!response.ok) {

                console.warn(
                    "QUESTION_SETS.json not found. Using built-in question set."
                );

                return;

            }


            const data =
                await response.json();


            /*
             * Only replace our fallback questions when the
             * uploaded training question structure is usable.
             */

            if (
                data &&
                typeof data === "object"
            ) {

                let imported = false;


                /*
                 * Direct emergency-type object:
                 *
                 * {
                 *   "Accident": [...]
                 * }
                 */

                for (
                    const type of Object.keys(QUESTION_SETS)
                ) {

                    if (
                        Array.isArray(data[type]) &&
                        data[type].length > 0
                    ) {

                        QUESTION_SETS[type] =
                            normalizeImportedQuestions(
                                data[type]
                            );

                        imported = true;

                    }

                }


                /*
                 * Sometimes JSON may contain:
                 * {
                 *   question_sets: {
                 *      Accident: [...]
                 *   }
                 * }
                 */

                if (
                    data.question_sets &&
                    typeof data.question_sets === "object"
                ) {

                    for (
                        const type of Object.keys(QUESTION_SETS)
                    ) {

                        if (
                            Array.isArray(
                                data.question_sets[type]
                            )
                        ) {

                            QUESTION_SETS[type] =
                                normalizeImportedQuestions(
                                    data.question_sets[type]
                                );

                            imported = true;

                        }

                    }

                }


                console.log(
                    imported
                        ? "SmartEMS trained question file loaded."
                        : "SmartEMS fallback questions active."
                );

            }

        } catch (error) {

            console.warn(
                "Question file loading failed. Built-in questions will be used.",
                error
            );

        }

    }


    function normalizeImportedQuestions(list) {

        return list
            .map(item => {

                if (typeof item === "string") {

                    return {
                        feature: guessFeature(item),
                        question: item
                    };

                }


                return {
                    feature:
                        item.feature ||
                        item.field ||
                        item.variable ||
                        item.name ||
                        guessFeature(
                            item.question ||
                            item.text ||
                            ""
                        ),

                    question:
                        item.question ||
                        item.text ||
                        item.prompt ||
                        "Please provide the emergency information."
                };

            })
            .filter(
                item =>
                    item.feature &&
                    item.question
            );

    }


    function guessFeature(text) {

        const value =
            String(text)
                .toLowerCase();


        const map = [
            ["age", "age"],
            ["location", "incident_location"],
            ["bleed", "bleeding"],
            ["conscious", "conscious"],
            ["breath", "breathing"],
            ["fracture", "visible_fracture"],
            ["trapped", "trapped"],
            ["pain", "pain_level"],
            ["chest", "chest_pain"],
            ["sweat", "sweating"],
            ["shortness", "shortness_of_breath"],
            ["face", "face_drooping"],
            ["arm", "arm_weakness"],
            ["speech", "speech_difficulty"],
            ["poison", "poison_type"],
            ["vomit", "vomiting"],
            ["seizure", "seizures"],
            ["burn", "entry_exit_burn"],
            ["spasm", "muscle_spasm"],
            ["water", "water_type"],
            ["cpr", "cpr_required"],
            ["height", "fall_height"],
            ["head", "head_injury"],
            ["animal", "animal_type"],
            ["bite", "bite_location"],
            ["venom", "venomous"],
            ["weapon", "weapon_involved"],
            ["injury location", "injury_location"],
            ["visible injury", "visible_injury"]
        ];


        for (const [keyword, feature] of map) {

            if (value.includes(keyword)) {
                return feature;
            }

        }


        return "incident_location";

    }


    /* =========================================================
       14. EXPOSE TO EXISTING SMARTEMS SCRIPT
       ========================================================= */

    window.smartEMSAI =
        {
            state,
            start: startAssistant,
            submit: submitAnswer,
            getFeatures: function () {

                return {
                    ...DEFAULT_FEATURES,
                    ...state.answers,
                    emergency_type:
                        state.emergencyType ||
                        "General Emergency"
                };

            }
        };


    /* =========================================================
       15. INITIALIZE
       ========================================================= */

    function initialize() {

        createAssistantUI();

        loadTrainingQuestionFiles();

        console.log(
            "SmartEMS AI Assistant: ready"
        );

    }


    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initialize
        );

    } else {

        initialize();

    }

})();