/*
 * TriageDesk — clinical content layer
 * Symptom taxonomy + triage rules (EN / বাংলা).
 * Rules encode widely published red-flag consensus lists (e.g. FAST stroke signs,
 * classic cardiac chest-pain features, meningitis triad, anaphylaxis signs).
 * This is an informational triage aid — NOT a diagnostic device.
 */

// ---------- Symptom taxonomy ----------
// id: stable key. en/bn: display labels. syn: extra match phrases (both languages).
const SYMPTOMS = [
  // General
  { id: "fever",          sys: "general", en: "Fever",                     bn: "জ্বর",                    syn: ["temperature", "high temperature", "জ্বর", "তাপ"] },
  { id: "chills",         sys: "general", en: "Chills / shivering",        bn: "কাঁপুনি",                 syn: ["shivering", "rigor", "কাঁপুনি"] },
  { id: "fatigue",        sys: "general", en: "Tiredness / weakness",      bn: "দুর্বলতা / ক্লান্তি",      syn: ["weakness", "tired", "exhausted", "দুর্বল", "ক্লান্ত"] },
  { id: "body_ache",      sys: "general", en: "Body ache",                 bn: "গা ব্যথা",                syn: ["body pain", "গা ব্যথা", "সারা শরীর ব্যথা"] },
  { id: "night_sweats",   sys: "general", en: "Night sweats",              bn: "রাতে ঘাম",               syn: ["sweating at night", "রাতে ঘাম"] },
  { id: "weight_loss",    sys: "general", en: "Unexplained weight loss",   bn: "ওজন কমে যাওয়া",          syn: ["losing weight", "ওজন কমা"] },
  { id: "poor_appetite",  sys: "general", en: "Loss of appetite",          bn: "ক্ষুধামন্দা",             syn: ["no appetite", "খিদে নেই"] },

  // Head & neuro
  { id: "headache",           sys: "neuro", en: "Headache",                  bn: "মাথাব্যথা",             syn: ["head pain", "মাথা ব্যথা"] },
  { id: "thunderclap_head",   sys: "neuro", en: "Sudden worst-ever headache",bn: "হঠাৎ প্রচণ্ড মাথাব্যথা",  syn: ["worst headache of my life", "thunderclap headache", "হঠাৎ ভয়ানক মাথাব্যথা"] },
  { id: "dizziness",          sys: "neuro", en: "Dizziness",                 bn: "মাথা ঘোরা",             syn: ["light-headed", "vertigo", "dizzy", "feeling dizzy", "মাথা ঘোরে", "মাথা ঝিলিক"] },
  { id: "confusion",          sys: "neuro", en: "Confusion / disorientation",bn: "বিভ্রান্তি",            syn: ["disoriented", "acting strange", "এলোমেলো কথা", "বিভ্রান্ত"] },
  { id: "fainting",           sys: "neuro", en: "Fainting / passed out",     bn: "অজ্ঞান হওয়া",          syn: ["passed out", "collapsed", "অচেতন"] },
  { id: "seizure",            sys: "neuro", en: "Seizure / convulsion",      bn: "খিঁচুনি",               syn: ["convulsion", "fits", "খিঁচুনি"] },
  { id: "vision_change",      sys: "neuro", en: "Vision changes",            bn: "দৃষ্টির সমস্যা",         syn: ["blurred vision", "double vision", "চোখে ঝাপসা"] },
  { id: "slurred_speech",     sys: "neuro", en: "Slurred speech",            bn: "কথা লড়িয়ে যাওয়া",      syn: ["speech difficulty", "can't speak properly", "কথা বলতে কষ্ট"] },
  { id: "face_droop",         sys: "neuro", en: "Face drooping (one side)",  bn: "মুখ একপাশে ঝুলে যাওয়া", syn: ["face droop", "মুখ বাঁকা"] },
  { id: "arm_weakness",       sys: "neuro", en: "Arm / leg weakness (one side)", bn: "একপাশের হাত-পা দুর্বল", syn: ["arm weakness", "hand weakness", "হাতে জোর নেই"] },

  // Chest & breathing
  { id: "chest_pain",     sys: "chest", en: "Chest pain / pressure",        bn: "বুকে ব্যথা / চাপ",       syn: ["chest pressure", "chest tightness", "বুকে চাপ", "বুক ব্যথা"] },
  { id: "radiating_pain", sys: "chest", en: "Pain spreading to arm / jaw / back", bn: "হাত / চোয়াল / পিঠে ছড়ানো ব্যথা", syn: ["pain radiating", "pain going to left arm", "going to my left arm", "spreading to my arm", "spread to my jaw", "spreading to my back", "ব্যথা বাঁয়ে হাতে যাচ্ছে", "ব্যথা হাতে ছড়াচ্ছে"] },
  { id: "cold_sweat",     sys: "chest", en: "Cold sweat with chest pain",   bn: "বুকে ব্যথার সঙ্গে ঘাম",  syn: ["clammy", "cold sweat"] },
  { id: "palpitations",   sys: "chest", en: "Heart racing / palpitations",  bn: "বুক ধড়ফড়",             syn: ["heart racing", "fluttering heart"] },
  { id: "breathless",     sys: "chest", en: "Breathing difficulty",         bn: "শ্বাসকষ্ট",             syn: ["short of breath", "can't breathe", "cannot breathe", "trouble breathing", "shortness of breath", "dyspnea", "শ্বাস নিতে কষ্ট"] },
  { id: "severe_breathless", sys: "chest", en: "Cannot speak full sentences (breathless)", bn: "এক নিঃশ্বাসে কথা বলতে পারছি না", syn: ["gasping", "can't finish a sentence"] },
  { id: "blue_lips",      sys: "chest", en: "Blue / grey lips",             bn: "ঠোঁট নীলচে",           syn: ["cyanosis", "blue lips"] },
  { id: "cough",          sys: "chest", en: "Cough",                        bn: "কাশি",                 syn: ["coughing"] },
  { id: "cough_blood",    sys: "chest", en: "Coughing up blood",            bn: "রক্ত কাশি",            syn: ["blood in sputum", "hemoptysis", "কফে রক্ত"] },
  { id: "wheezing",       sys: "chest", en: "Wheezing",                     bn: "শ্বাসে বাঁশির শব্দ",     syn: ["whistling breath"] },

  // Abdomen & digestive
  { id: "abdo_pain",      sys: "gi", en: "Abdominal pain",             bn: "পেটব্যথা",            syn: ["stomach pain", "belly pain", "পেট ব্যথা"] },
  { id: "rigid_abdo",     sys: "gi", en: "Stiff, board-like abdomen",  bn: "পেট শক্ত হয়ে যাওয়া",   syn: ["rigid abdomen", "board-like belly"] },
  { id: "nausea",         sys: "gi", en: "Nausea",                     bn: "বমিভাব",              syn: ["feel like vomiting", "বমি বমি লাগা"] },
  { id: "vomiting",       sys: "gi", en: "Vomiting",                   bn: "বমি",                 syn: ["throwing up", "puking"] },
  { id: "vomit_blood",    sys: "gi", en: "Vomiting blood",             bn: "রক্ত বমি",            syn: ["blood in vomit", "hematemesis"] },
  { id: "diarrhea",       sys: "gi", en: "Diarrhoea / loose motion",   bn: "পাতলা পায়খানা",       syn: ["loose stool", "diarrhoea"] },
  { id: "black_stool",    sys: "gi", en: "Black / tarry stool",        bn: "কালো পায়খানা",        syn: ["tarry stool", "melena"] },
  { id: "bloating",       sys: "gi", en: "Bloating",                   bn: "পেট ফাঁপা",           syn: ["swollen belly"] },
  { id: "heartburn",      sys: "gi", en: "Heartburn / acid reflux",    bn: "বুক জ্বালাপোড়া",       syn: ["acid reflux", "acidity", "খিঁট"] },
  { id: "swallow_diff",   sys: "gi", en: "Difficulty swallowing",      bn: "গিলতে কষ্ট",          syn: ["can't swallow", "পানি গিলতে কষ্ট"] },
  { id: "jaundice",       sys: "gi", en: "Yellow eyes / skin",         bn: "চোখ হলদে হওয়া",       syn: ["jaundice", "জন্ডিস"] },

  // Urinary
  { id: "painful_urine",  sys: "gu", en: "Burning / pain when passing urine", bn: "প্রস্রাবে জ্বালাপোড়া", syn: ["burning urination", "dysuria"] },
  { id: "urine_blood",    sys: "gu", en: "Blood in urine",             bn: "প্রস্রাবে রক্ত",        syn: ["haematuria", "red urine"] },
  { id: "low_urine",      sys: "gu", en: "Very little urine",          bn: "প্রস্রাব কমে যাওয়া",    syn: ["not passing urine", "dehydration"] },

  // Skin & injury
  { id: "rash",           sys: "skin", en: "Rash",                      bn: "র‍্যাশ",               syn: ["skin spots", "চামড়ায় র‍্যাশ"] },
  { id: "rash_fever",     sys: "skin", en: "Rash that does not fade when pressed", bn: "চাপ দিলে না-যাওয়া র‍্যাশ", syn: ["non-blanching rash", "petechiae"] },
  { id: "hives",          sys: "skin", en: "Hives / raised welts",      bn: "আমবাত",               syn: ["urticaria", "welts"] },
  { id: "itching",        sys: "skin", en: "Itching",                   bn: "চুলকানি",             syn: ["itchy skin"] },
  { id: "face_swelling",  sys: "skin", en: "Swollen lips / tongue / face", bn: "ঠোঁট / মুখ ফুলে যাওয়া", syn: ["lip swelling", "tongue swelling", "angioedema", "ঠোঁট ফুলে", "ঠোঁট ফুলে গেছে", "মুখ ফুলে", "জিভ ফুলে"] },
  { id: "bleeding_bad",   sys: "skin", en: "Heavy bleeding that won't stop", bn: "থামছে না এমন রক্তপাত", syn: ["severe bleeding", "blood won't stop"] },
  { id: "burn_bad",       sys: "skin", en: "Large / deep burn",         bn: "বড় / গভীর পোড়া ক্ষত",  syn: ["severe burn", "scald"] },
  { id: "poisoning",      sys: "skin", en: "Swallowed poison / overdose", bn: "বিষক্রিয়া / অতিরিক্ত ওষুধ", syn: ["overdose", "swallowed chemical"] },

  // ENT
  { id: "sore_throat",    sys: "ent", en: "Sore throat",               bn: "গলা ব্যথা",           syn: ["throat pain"] },
  { id: "runny_nose",     sys: "ent", en: "Runny nose",                bn: "সর্দি",               syn: ["nose running"] },
  { id: "blocked_nose",   sys: "ent", en: "Blocked nose",              bn: "নাক বন্ধ",            syn: ["stuffy nose"] },
  { id: "ear_pain",       sys: "ent", en: "Ear pain",                  bn: "কান ব্যথা",           syn: ["earache"] },
  { id: "stiff_neck",     sys: "ent", en: "Stiff neck (can't touch chin to chest)", bn: "ঘাড় শক্ত (চিবুক বুকে লাগানো যাচ্ছে না)", syn: ["neck stiffness", "photophobia"] },

  // Muscle & joint
  { id: "joint_pain",     sys: "msk", en: "Joint pain",                bn: "জোড়ায় ব্যথা",         syn: ["arthritis pain", "knee pain"] },
  { id: "joint_swelling", sys: "msk", en: "Swollen joint",             bn: "জোড়া ফুলে যাওয়া",     syn: ["swollen knee"] },
  { id: "back_pain",      sys: "msk", en: "Back pain",                 bn: "কোমর / পিঠে ব্যথা",    syn: ["lower back pain"] },
  { id: "muscle_pain",    sys: "msk", en: "Muscle pain",               bn: "পেশি ব্যথা",          syn: ["myalgia"] },

  // Mental health
  { id: "low_mood",       sys: "psy", en: "Low mood / hopelessness",   bn: "মন খারাপ / আশাহীনতা",  syn: ["depressed", "sad all the time"] },
  { id: "anxiety",        sys: "psy", en: "Anxiety / panic",           bn: "দুশ্চিন্তা / আতঙ্ক",    syn: ["panic attacks", "উদ্বেগ"] },
  { id: "self_harm",      sys: "psy", en: "Thoughts of harming myself", bn: "নিজেকে আঘাত করার চিন্তা", syn: ["suicidal thoughts", "want to end my life", "আত্মহত্যার চিন্তা"] },
  { id: "sleep_problem",  sys: "psy", en: "Sleep problems",            bn: "ঘুমের সমস্যা",         syn: ["insomnia", "can't sleep"] },

  // Obstetric (shown when pregnancy = yes)
  { id: "preg_bleeding",  sys: "obs", en: "Bleeding during pregnancy", bn: "গর্ভকালীন রক্তপাত",    syn: ["bleeding while pregnant"] },
  { id: "preg_pain",      sys: "obs", en: "Severe abdominal pain in pregnancy", bn: "গর্ভকালীন তীব্র পেটব্যথা", syn: ["severe pain while pregnant"] },
  { id: "baby_reduced_movement", sys: "obs", en: "Baby moving less than usual", bn: "শিশুর চলাফের কমে যাওয়া", syn: ["reduced fetal movement"] },
];

// ---------- Patient context options ----------
const AGE_BANDS = [
  { id: "infant", en: "0–3 months", bn: "০–৩ মাস" },
  { id: "child",  en: "3 months–12 years", bn: "৩ মাস–১২ বছর" },
  { id: "teen",   en: "13–17 years", bn: "১৩–১৭ বছর" },
  { id: "adult",  en: "18–64 years", bn: "১৮–৬৪ বছর" },
  { id: "older",  en: "65+ years", bn: "৬৫+ বছর" },
];

const CHRONIC = [
  { id: "diabetes",   en: "Diabetes",        bn: "ডায়াবেটিস" },
  { id: "hypertension", en: "High blood pressure", bn: "উচ্চ রক্তচাপ" },
  { id: "heart_disease", en: "Heart disease", bn: "হৃদরোগ" },
  { id: "asthma",     en: "Asthma / COPD",   bn: "শ্বাসকষ্ট (হাঁপানি)" },
  { id: "kidney",     en: "Kidney disease",  bn: "কিডনি রোগ" },
  { id: "immune",     en: "Weak immunity (steroids / cancer treatment)", bn: "রোগ প্রতিরোধ ক্ষমতা কম (স্টেরয়েড / ক্যান্সার চিকিৎসা)" },
];

const SEVERITIES = [
  { id: "mild",    en: "Mild",    bn: "হালকা" },
  { id: "moderate", en: "Moderate", bn: "মাঝারি" },
  { id: "severe",  en: "Severe",  bn: "তীব্র" },
];

const DURATIONS = [
  { id: "today",  en: "Started today", bn: "আজ শুরু" },
  { id: "d1_3",   en: "1–3 days", bn: "১–৩ দিন" },
  { id: "d3_7",   en: "3–7 days", bn: "৩–৭ দিন" },
  { id: "gt_week", en: "More than a week", bn: "এক সপ্তাহের বেশি" },
];

// ---------- Triage bands ----------
const BANDS = {
  emergency: { en: "EMERGENCY", bn: "ইমার্জেন্সি", color: "#dc2626", action_en: "Go to the nearest emergency department or call 999 (Bangladesh) / your local emergency number now.", action_bn: "এখনই নিকটতম হাসপাতালের ইমার্জেন্সিতে যান অথবা ৯৯৯ (বাংলাদেশ) / আপনার দেশের ইমার্জেন্সি নম্বরে কল করুন।" },
  same_day:  { en: "SEE A DOCTOR TODAY", bn: "আজই ডাক্তার দেখান", color: "#ea580c", action_en: "Arrange to be seen by a doctor within hours — do not wait days.", action_bn: "কয়েক ঘণ্টার মধ্যেই ডাক্তার দেখান — দিন নয়, আজই।" },
  routine:   { en: "SEE A DOCTOR WITHIN DAYS", bn: "কয়েক দিনের মধ্যে ডাক্তার দেখান", color: "#d97706", action_en: "Book a clinic visit within 2–3 days. Monitor for changes.", action_bn: "২–৩ দিনের মধ্যে ডাক্তার দেখান। পরিবর্তন হলে দ্রুত যোগাযোগ করুন।" },
  self_care: { en: "HOME CARE IS REASONABLE", bn: "বাড়িতে যত্ন নেওয়া যাবে", color: "#059669", action_en: "Rest, fluids, and over-the-counter relief are reasonable. Re-check if things worsen.", action_bn: "বিশ্রাম, পর্যাপ্ত পানি ও সাধারণ ওষুধে ভালো হতে পারে। অবস্থার অবনতি হলে ডাক্তার দেখান।" },
};

const BAND_ORDER = ["emergency", "same_day", "routine", "self_care"];

// ---------- Triage rules ----------
// Each rule: symptoms it watches (all/any), context modifiers, resulting band,
// department, and a plain-language reason. Highest band wins; all fired reasons shown.
const RULES = [
  // ===== EMERGENCY =====
  { id: "R-stroke", band: "emergency", dept: "emergency",
    any: ["face_droop", "slurred_speech", "arm_weakness"],
    reason_en: "Sudden one-sided weakness, face drooping or speech difficulty can signal a stroke — minutes matter.",
    reason_bn: "হঠাৎ একপাশের দুর্বলতা, মুখ ঝুলে যাওয়া বা কথা লড়িয়ে যাওয়া স্ট্রোকের সংকেত হতে পারে — প্রতিটি মিনিট গুরুত্বপূর্ণ।" },

  { id: "R-cardiac", band: "emergency", dept: "emergency",
    all: ["chest_pain"], any: ["radiating_pain", "cold_sweat", "breathless"], min_age: "teen",
    reason_en: "Chest pain with sweating, breathlessness or pain spreading to arm/jaw can indicate a heart attack.",
    reason_bn: "ঘাম, শ্বাসকষ্ট বা হাত/চোয়ালে ছড়ানো ব্যথা সহ বুকে ব্যথা হার্ট অ্যাটাকের লক্ষণ হতে পারে।" },

  { id: "R-cardiac-severe", band: "emergency", dept: "emergency",
    all: ["chest_pain"], severity_min: "severe", min_age: "teen",
    reason_en: "Severe chest pain needs emergency assessment for cardiac causes.",
    reason_bn: "তীব্র বুকে ব্যথায় হৃদরোগ বাদ দিতে ইমার্জেন্সি মূল্যায়ন দরকার।" },

  { id: "R-cardiac-mild", band: "same_day", dept: "cardiology",
    all: ["chest_pain"], min_age: "teen",
    reason_en: "Any new chest pain needs same-day medical assessment to rule out cardiac causes.",
    reason_bn: "নতুন বুকে ব্যথা হলে হৃদরোগ বাদ দিতে একই দিনে ডাক্তার দেখা জরুরি।" },

  { id: "R-thunderclap", band: "emergency", dept: "emergency",
    any: ["thunderclap_head"],
    reason_en: "A sudden, worst-ever headache can indicate bleeding around the brain.",
    reason_bn: "হঠাৎ প্রচণ্ড মাথাব্যথা মস্তিষ্কে রক্তক্ষরণের লক্ষণ হতে পারে।" },

  { id: "R-airway", band: "emergency", dept: "emergency",
    any: ["severe_breathless", "blue_lips"],
    reason_en: "Struggling to breathe or blue lips is a respiratory emergency.",
    reason_bn: "শ্বাস নিতে প্রচণ্ড কষ্ট বা নীলচে ঠোঁট শ্বাসতন্ত্রের ইমার্জেন্সি।" },

  { id: "R-anaphylaxis", band: "emergency", dept: "emergency",
    all: ["face_swelling"], boost_if_any: ["breathless", "hives"],
    reason_en: "Swelling of lips/tongue with breathing trouble or hives suggests a severe allergic reaction (anaphylaxis).",
    reason_bn: "ঠোঁট/জিভ ফুলে যাওয়ার সঙ্গে শ্বাসকষ্ট বা আমবাত মারাত্মক অ্যালার্জি (অ্যানাফাইল্যাক্সিস) নির্দেশ করে।" },

  { id: "R-bleeding", band: "emergency", dept: "emergency",
    any: ["bleeding_bad"],
    reason_en: "Heavy uncontrolled bleeding needs immediate emergency care.",
    reason_bn: "নিয়ন্ত্রণহীন রক্তপাতে তৎক্ষণাৎ ইমার্জেন্সি সেবা প্রয়োজন।" },

  { id: "R-seizure", band: "emergency", dept: "emergency",
    any: ["seizure"],
    reason_en: "A seizure (especially first-time or repeated) requires emergency assessment.",
    reason_bn: "খিঁচুনি (বিশেষত প্রথমবার বা বারবার হলে) ইমার্জেন্সি মূল্যায়ন চায়।" },

  { id: "R-unresponsive", band: "emergency", dept: "emergency",
    any: ["fainting", "poisoning"],
    reason_en: "Passing out, unresponsiveness or possible poisoning is an immediate emergency.",
    reason_bn: "অজ্ঞান হওয়া বা বিষক্রিয়ার সন্দেহ তৎক্ষণাৎ ইমার্জেন্সি।" },

  { id: "R-meningitis", band: "emergency", dept: "emergency",
    all: ["fever", "stiff_neck"],
    reason_en: "Fever with a stiff neck can indicate meningitis — urgent assessment is critical.",
    reason_bn: "জ্বরের সঙ্গে ঘাড় শক্ত হওয়া মেনিনজাইটিসের লক্ষণ হতে পারে — দ্রুত পরীক্ষা জরুরি।" },

  { id: "R-meningitis-rash", band: "emergency", dept: "emergency",
    all: ["fever", "rash_fever"],
    reason_en: "Fever with a rash that does not fade under pressure is a meningococcal red flag.",
    reason_bn: "জ্বরের সঙ্গে চাপে না-উঠে যাওয়া র‍্যাশ মেনিনজোকক্কাল সংক্রমণের বিপদচিহ্ন।" },

  { id: "R-gi-perforation", band: "emergency", dept: "emergency",
    all: ["abdo_pain", "rigid_abdo"],
    reason_en: "A rigid, board-like abdomen with pain can indicate a perforation or peritonitis.",
    reason_bn: "শক্ত হয়ে যাওয়া পেট ও তীব্র ব্যথা ছিদ্র বা পেরিটোনাইটিসের লক্ষণ হতে পারে।" },

  { id: "R-gi-blood", band: "emergency", dept: "emergency",
    any: ["vomit_blood", "black_stool", "cough_blood"],
    reason_en: "Vomiting blood, black stools or coughing blood indicates internal bleeding.",
    reason_bn: "রক্ত বমি, কালো পায়খানা বা রক্ত কাশি অন্তঃস্রাবী (অভ্যন্তরীণ) রক্তক্ষরণ নির্দেশ করে।" },

  { id: "R-burn", band: "emergency", dept: "emergency",
    any: ["burn_bad"],
    reason_en: "Large or deep burns need emergency wound care.",
    reason_bn: "বড় বা গভীর পোড়া ক্ষতে ইমার্জেন্সি চিকিৎসা দরকার।" },

  { id: "R-selfharm", band: "emergency", dept: "psychiatry",
    any: ["self_harm"],
    reason_en: "Thoughts of self-harm are taken seriously — emergency help protects you. You are not alone.",
    reason_bn: "নিজেকে আঘাত করার চিন্তা গুরুত্বপূর্ণ — এখনই সাহায্য নিন। আপনি একা নন।" },

  { id: "R-infant-fever", band: "emergency", dept: "pediatrics",
    all: ["fever"], age_equals: "infant",
    reason_en: "Any fever in a baby under 3 months is an emergency — young infants can deteriorate fast.",
    reason_bn: "৩ মাসের কম বয়সী শিশুর যেকোনো জ্বরই ইমার্জেন্সি — এই বয়সে অবস্থা দ্রুত খারাপ হয়।" },

  { id: "R-older-confusion", band: "emergency", dept: "emergency",
    all: ["confusion"], boost_if_any: ["fever"], age_equals: "older",
    reason_en: "New confusion in an older adult, especially with fever, needs urgent assessment.",
    reason_bn: "বয়স্ক ব্যক্তির হঠাৎ বিভ্রান্তি (বিশেষত জ্বরের সঙ্গে) দ্রুত মূল্যায়ন চায়।" },

  { id: "R-preg-bleed", band: "emergency", dept: "gynaecology",
    any: ["preg_bleeding", "preg_pain", "baby_reduced_movement"],
    reason_en: "Bleeding, severe pain or reduced baby movement in pregnancy is an obstetric emergency.",
    reason_bn: "গর্ভকালীন রক্তপাত, তীব্র ব্যথা বা শিশুর নড়াচড়া কমা অবস্টেট্রিক ইমার্জেন্সি।" },

  // ===== SAME DAY =====
  { id: "R-fever-persistent", band: "same_day", dept: "medicine",
    all: ["fever"], duration_min: "d3_7",
    reason_en: "Fever lasting more than 3 days should be assessed today.",
    reason_bn: "৩ দিনের বেশি জ্বর হলে আজই ডাক্তার দেখান।" },

  { id: "R-dehydration", band: "same_day", dept: "medicine",
    all: ["vomiting"], boost_if_any: ["diarrhea", "low_urine", "dizziness"],
    reason_en: "Persistent vomiting with reduced urine or dizziness risks dehydration needing same-day care.",
    reason_bn: "বারবার বমির সঙ্গে প্রস্রাব কমা বা মাথা ঘোরা হলে পানিশূন্যতা হতে পারে — আজই চিকিৎসা দরকার।" },

  { id: "R-uti", band: "same_day", dept: "medicine",
    all: ["painful_urine"], boost_if_any: ["fever", "urine_blood"],
    reason_en: "Painful urination, especially with fever or blood, suggests a urine infection needing treatment.",
    reason_bn: "প্রস্রাবে জ্বালাপোড়া (জ্বর বা রক্তের সঙ্গে হলে আরও) মূত্রনালীর সংক্রমণ নির্দেশ করে।" },

  { id: "R-breathless-moderate", band: "same_day", dept: "pulmonology",
    any: ["breathless"], boost_if_any: ["asthma"],
    reason_en: "New breathing difficulty needs same-day assessment; with asthma, do not wait.",
    reason_bn: "নতুন শ্বাসকষ্টে আজই ডাক্তার দেখান; হাঁপানি থাকলে দেরি করবেন না।" },

  { id: "R-swallow", band: "same_day", dept: "ent",
    all: ["sore_throat", "swallow_diff"],
    reason_en: "A sore throat with trouble swallowing needs same-day review.",
    reason_bn: "গলা ব্যথার সঙ্গে গিলতে কষ্ট হলে আজই পরীক্ষা দরকার।" },

  { id: "R-eye", band: "same_day", dept: "ophthalmology",
    all: ["vision_change"],
    reason_en: "Vision changes should be checked the same day.",
    reason_bn: "দৃষ্টির সমস্যা একই দিনে পরীক্ষা করান।" },

  { id: "R-jaundice", band: "same_day", dept: "gastroenterology",
    any: ["jaundice"],
    reason_en: "New yellowing of eyes/skin needs blood tests within a day.",
    reason_bn: "নতুন হলদে চোখ/ত্বক হলে এক দিনের মধ্যে রক্ত পরীক্ষা দরকার।" },

  { id: "R-chronic-fever", band: "same_day", dept: "medicine",
    all: ["fever"], requires_chronic_any: ["diabetes", "immune", "kidney", "heart_disease"],
    reason_en: "With diabetes, kidney disease or weak immunity, even a short fever deserves same-day review.",
    reason_bn: "ডায়াবেটিস, কিডনি রোগ বা রোগপ্রতিরোধ ক্ষমতা কম থাকলে অল্প জ্বরেও আজই ডাক্তার দেখান।" },

  // ===== ROUTINE =====
  { id: "R-cough-week", band: "routine", dept: "pulmonology",
    all: ["cough"], duration_min: "d3_7",
    reason_en: "A cough lasting beyond a few days should be reviewed within days.",
    reason_bn: "কয়েক দিনের বেশি কাশি হলে ২–৩ দিনের মধ্যে ডাক্তার দেখান।" },

  { id: "R-abdo-mild", band: "routine", dept: "gastroenterology",
    all: ["abdo_pain"], severity_max: "moderate",
    reason_en: "Ongoing abdominal pain without emergency signs should be assessed soon.",
    reason_bn: "ইমার্জেন্সির লক্ষণ ছাড়া চলমান পেটব্যথা দ্রুত পরীক্ষা করান।" },

  { id: "R-joint", band: "routine", dept: "orthopedics",
    any: ["joint_pain", "back_pain"],
    reason_en: "Joint or back pain without red flags can be reviewed in the coming days.",
    reason_bn: "বিপদচিহ্ন ছাড়া জোড়া বা কোমরব্যথা কয়েক দিনের মধ্যে দেখানো যায়।" },

  { id: "R-headache", band: "routine", dept: "medicine",
    all: ["headache"], severity_max: "moderate",
    reason_en: "Recurring mild-to-moderate headaches deserve a review if they persist.",
    reason_bn: "বারবার হালকা-মাঝারি মাথাব্যথা চলতে থাকলে ডাক্তার দেখান।" },

  { id: "R-mental", band: "routine", dept: "psychiatry",
    any: ["low_mood", "anxiety", "sleep_problem"],
    reason_en: "Low mood, anxiety or sleep trouble lasting a while benefits from professional support.",
    reason_bn: "দীর্ঘদিনের মন খারাপ, দুশ্চিন্তা বা ঘুমের সমস্যায় পেশাদার সহায়তা কাজে লাগে।" },

  { id: "R-skin", band: "routine", dept: "dermatology",
    any: ["rash", "itching"],
    reason_en: "A stable rash or itching can be reviewed at a routine visit.",
    reason_bn: "স্থির র‍্যাশ বা চুলকানি নিয়মিত ভিজিটে দেখানো যায়।" },
];

// ---------- Department names ----------
const DEPARTMENTS = {
  emergency:        { en: "Emergency Department", bn: "ইমার্জেন্সি বিভাগ" },
  medicine:         { en: "General Medicine", bn: "মেডিসিন" },
  cardiology:       { en: "Cardiology (heart)", bn: "কার্ডিওলজি (হৃদরোগ)" },
  pulmonology:      { en: "Pulmonology (lungs)", bn: "ফুসফুস বিভাগ" },
  neurology:        { en: "Neurology", bn: "নিউরোলজি" },
  pediatrics:       { en: "Paediatrics (children)", bn: "শিশু বিভাগ" },
  gynaecology:      { en: "Obstetrics & Gynaecology", bn: "গাইনি ও প্রসূতি বিভাগ" },
  gastroenterology: { en: "Gastroenterology (stomach)", bn: "গ্যাস্ট্রোএন্টারোলজি (পেট)" },
  ent:              { en: "ENT", bn: "নাক-কান-গলা" },
  ophthalmology:    { en: "Ophthalmology (eyes)", bn: "চক্ষু বিভাগ" },
  dermatology:      { en: "Dermatology (skin)", bn: "চর্মরোগ বিভাগ" },
  orthopedics:      { en: "Orthopaedics (bones)", bn: "অর্থোপেডিকস (হাড়)" },
  psychiatry:       { en: "Mental health / Psychiatry", bn: "মানসিক স্বাস্থ্য বিভাগ" },
};
