/**
 * EU AI Act - Annex III High-Risk Categories, Art. 5 Prohibited Practices,
 * Art. 6(3) Exceptions, and Art. 50 Limited Risk Triggers
 *
 * Source: Regulation (EU) 2024/1689
 */

export interface HighRiskCategory {
  number: number;
  name: string;
  description: string;
  examples: string[];
  keywords: string[];
  relevantArticles: string[];
}

export interface ProhibitedPractice {
  id: string;
  name: string;
  description: string;
  examples: string[];
  keywords: string[];
  article: string;
}

export interface ExceptionCondition {
  id: string;
  condition: string;
  description: string;
  article: string;
}

export interface TransparencyTrigger {
  id: string;
  name: string;
  description: string;
  examples: string[];
  keywords: string[];
  article: string;
}

// ---------------------------------------------------------------------------
// Annex III - High-Risk AI System Categories
// ---------------------------------------------------------------------------

/**
 * Single-word keywords that classify on their own. Each one is a term of art that, in a
 * description of an AI system, names the regulated function by itself, or in the case of
 * "judicial" the user whose involvement defines Annex III(8)(a). Every other
 * single-word keyword in the lists below is weak evidence: it counts only beside a
 * second hit in the same category, and never on its own towards a prohibited practice.
 *
 * Keep this list short and add to it deliberately. Everyday and sector words ("minor",
 * "children", "court", "visa", "exam", "migration", "promotion", "termination") are
 * exactly what 1.5.0 treated as decisive, which returned a prohibited practice for
 * "fix minor layout bugs" and high-risk employment for "determination of the VAT rate".
 * The behavior suite pins this set, so a new entry is a reviewed decision.
 */
export const decisiveSingleWordKeywords: ReadonlySet<string> = new Set([
  "proctoring",
  "recruitment",
  "hiring",
  "creditworthiness",
  "polygraph",
  "judicial",
  "sentencing",
  "subliminal",
  "nudification",
  "nudify",
  "undress",
  "csam",
  "chatbot",
  "deepfake",
]);

export const annexIIICategories: HighRiskCategory[] = [
  {
    number: 1,
    name: "Biometrics",
    description:
      "AI systems intended for remote biometric identification, biometric categorisation according to sensitive or protected attributes, or emotion recognition of natural persons, in so far as their use is permitted under Union or national law. Sole-purpose biometric verification to confirm that a specific natural person is who they claim to be is excluded from Annex III(1)(a).",
    examples: [
      "Remote biometric identification systems where legally permitted",
      "Biometric categorisation systems inferring race, political opinions, or sexual orientation",
      "Emotion recognition systems outside the Art. 5(1)(f) workplace and education prohibition",
      "Fingerprint or iris-based remote biometric identification systems",
    ],
    keywords: [
      "remote biometric identification", "facial recognition", "emotion recognition",
      "biometric identification", "biometric categorisation", "iris scan",
      "fingerprint recognition", "gait recognition", "voice biometric", "face recognition",
    ],
    relevantArticles: ["Annex III(1)", "Art. 6(2)", "Art. 5(1)(f)", "Art. 5(1)(g)", "Art. 5(1)(h)", "Art. 26(10)"],
  },
  {
    number: 2,
    name: "Critical infrastructure",
    description:
      "AI systems intended as safety components in the management and operation of critical digital infrastructure, road traffic, or the supply of water, gas, heating, and electricity.",
    examples: [
      "AI controlling traffic management systems on highways",
      "AI managing electricity grid load balancing",
      "AI systems monitoring and controlling water treatment plants",
      "AI safety components in gas pipeline pressure management",
      "AI monitoring digital infrastructure uptime and failover",
    ],
    keywords: [
      "critical infrastructure", "traffic management", "electricity grid", "power grid",
      "water supply", "gas supply", "heating supply", "road traffic", "safety component",
      "digital infrastructure", "energy management",
      "traffic signal control", "district heating control", "gas network control", "water treatment control",
    ],
    relevantArticles: ["Annex III(2)", "Art. 6(2)"],
  },
  {
    number: 3,
    name: "Education and vocational training",
    description:
      "AI systems intended to determine access to or admission to educational and vocational training institutions, to evaluate learning outcomes, to assess the appropriate level of education, or to monitor and detect prohibited behaviour during tests.",
    examples: [
      "AI-powered university admissions screening tools",
      "Automated essay grading and exam scoring systems",
      "AI proctoring systems detecting cheating during online exams",
      "AI systems determining student placement into educational tracks",
      "Automated tools assessing vocational training readiness",
    ],
    keywords: [
      "education", "admissions", "grading", "exam", "proctoring", "student assessment",
      "learning outcome", "vocational training", "school placement", "test monitoring",
      "academic evaluation",
      "student admission", "university admission", "school admission", "exam grading", "exam marking",
      "essay grading", "essay marking", "student grading", "exam monitoring",
    ],
    relevantArticles: ["Annex III(3)", "Art. 6(2)"],
  },
  {
    number: 4,
    name: "Employment, workers management, and access to self-employment",
    description:
      "AI systems intended for recruitment, selection, job advertising targeting, application filtering, candidate evaluation, promotion and termination decisions, task allocation, and monitoring or evaluation of work performance and behaviour.",
    examples: [
      "AI-powered CV screening and candidate ranking tools",
      "Automated interview analysis systems evaluating tone and content",
      "AI systems deciding employee promotions or terminations",
      "Workforce monitoring tools tracking productivity and behaviour",
      "AI tools targeting job advertisements to specific demographic groups",
    ],
    keywords: [
      "recruitment", "hiring", "CV screening", "resume screening", "candidate evaluation",
      "job application", "employee monitoring", "workforce management", "promotion",
      "termination", "task allocation", "performance evaluation", "HR AI", "talent acquisition",
      "job applicant", "screen CVs", "screen resumes", "applicant tracking", "candidate interview",
      "employee promotion", "employee termination", "employee dismissal",
    ],
    relevantArticles: ["Annex III(4)", "Art. 6(2)", "Art. 26(7)", "Art. 27"],
  },
  {
    number: 5,
    name: "Access to essential private and public services and benefits",
    description:
      "AI systems intended for the specific essential-service use cases listed in Annex III(5): public-authority eligibility decisions for essential public assistance benefits and services, creditworthiness or credit scoring of natural persons (with the exception of AI systems used for the purpose of detecting financial fraud, Annex III(5)(b)), risk assessment and pricing for life and health insurance, and emergency-call classification, dispatch, prioritisation, or emergency healthcare triage.",
    examples: [
      "AI credit scoring systems determining loan eligibility",
      "AI systems assessing eligibility for social benefits or public assistance",
      "Life or health insurance premium calculation and risk assessment AI",
      "AI-based triage systems in emergency dispatch centres",
      "AI evaluating creditworthiness for mortgage applications",
    ],
    keywords: [
      "credit scoring", "creditworthiness", "life insurance", "health insurance", "life and health insurance", "social benefits", "public assistance",
      "healthcare access", "emergency dispatch", "loan approval", "life insurance risk assessment", "health insurance pricing",
      "essential public assistance", "benefit eligibility",
      "credit score", "emergency call", "housing benefit", "welfare benefit", "unemployment benefit",
    ],
    relevantArticles: ["Annex III(5)", "Art. 6(2)"],
  },
  {
    number: 6,
    name: "Law enforcement",
    description:
      "AI systems intended for use by or on behalf of law enforcement authorities for victim risk assessment, polygraphs and similar tools, evaluation of evidence reliability, assessing the risk of a natural person offending or re-offending, assessment of personality traits or past criminal behaviour of natural persons or groups, or profiling natural persons in criminal detection, investigation, or prosecution.",
    examples: [
      "AI systems assessing the risk of a natural person becoming a victim of crime",
      "AI-based lie detection or polygraph analysis tools",
      "AI profiling systems assessing individual criminal risk",
      "Automated evidence reliability assessment tools",
      "AI systems profiling natural persons during criminal investigations",
    ],
    keywords: [
      "victim risk assessment", "criminal offence risk assessment", "polygraph",
      "lie detection", "criminal profiling", "evidence assessment",
      "recidivism prediction", "risk assessment law enforcement", "profiling natural persons criminal",
      "evidence reliability", "reoffending risk", "re-offending risk", "parole board", "suspect profiling",
    ],
    relevantArticles: ["Annex III(6)", "Art. 5(1)(d)", "Art. 6(2)"],
  },
  {
    number: 7,
    name: "Migration, asylum, and border control management",
    description:
      "AI systems intended for use by competent public authorities in migration, asylum, and border control as polygraphs or similar tools, for assessing risks posed by natural persons entering a Member State, for examining applications for asylum, visa, and residence permits, and for detecting, recognising, or identifying natural persons in border control. Verification of travel documents is excluded from Annex III(7)(d).",
    examples: [
      "AI systems screening visa and asylum applications",
      "Automated border control systems identifying natural persons",
      "AI risk assessment tools for irregular migration detection",
      "AI systems assessing security or health risks posed by a person entering a Member State",
    ],
    keywords: [
      "migration", "asylum", "border control", "visa", "residence permit",
      "immigration", "border security", "refugee",
      "irregular migration",
      "asylum application", "asylum claim", "visa application risk", "visa application assessment",
      "visa application examination", "examine visa application", "residence permit application",
      "asylum seeker", "asylum applicant", "visa applicant", "visa overstay",
    ],
    relevantArticles: ["Annex III(7)", "Art. 6(2)"],
  },
  {
    number: 8,
    name: "Administration of justice and democratic processes",
    description:
      "AI systems intended to assist judicial authorities in researching and interpreting facts and law and in applying the law to concrete facts, or to be used to influence the outcome of elections or referendums or the voting behaviour of natural persons. Campaign administration or logistics tools are excluded where natural persons are not directly exposed to the output.",
    examples: [
      "AI systems assisting judges in sentencing recommendations",
      "AI legal research tools used by courts for case law analysis",
      "AI systems generating personalised political messaging to influence voters",
      "Automated tools analysing legal arguments for judicial decisions",
      "AI chatbots deployed to influence referendum outcomes",
    ],
    keywords: [
      "judicial", "court", "sentencing", "election", "referendum",
      "voting", "political messaging", "administration of justice", "judicial decision",
      "democratic process",
      "judicial authority", "assist judges", "influence voters", "influence election outcome",
      "voter targeting", "persuade voters",
      "judge", "magistrate", "appellate",
    ],
    relevantArticles: ["Annex III(8)", "Art. 6(2)"],
  },
];

// ---------------------------------------------------------------------------
// Art. 5 - Prohibited AI Practices
// ---------------------------------------------------------------------------

export const prohibitedPractices: ProhibitedPractice[] = [
  {
    id: "art5-1a",
    name: "Subliminal, manipulative, or deceptive techniques",
    description:
      "AI systems that deploy subliminal techniques beyond a person's consciousness, or purposefully manipulative or deceptive techniques, to materially distort behaviour causing or likely to cause significant harm.",
    examples: [
      "AI generating subliminal audio/visual cues to manipulate purchasing decisions",
      "Deceptive dark patterns powered by AI that trick users into harmful choices",
      "AI systems exploiting cognitive biases to distort decision-making causing financial harm",
    ],
    keywords: ["subliminal", "manipulative", "deceptive", "dark pattern", "behaviour distortion"],
    article: "Art. 5(1)(a)",
  },
  {
    id: "art5-1b",
    name: "Exploitation of vulnerabilities",
    description:
      "AI systems that exploit vulnerabilities of a person or group due to age, disability, or specific social or economic situation, to materially distort behaviour causing or likely to cause significant harm.",
    examples: [
      "AI targeting elderly individuals with scam-like product recommendations",
      "AI systems exploiting children's cognitive development to push addictive content",
      "AI preying on financially distressed persons to push predatory lending",
    ],
    keywords: ["vulnerable", "elderly", "children", "disability", "exploitation", "predatory"],
    article: "Art. 5(1)(b)",
  },
  {
    id: "art5-1ba",
    name: "Non-consensual intimate or sexually explicit material",
    description:
      "AI systems that generate or manipulate realistic images, videos, audio or similar material depicting an identifiable natural person's intimate parts, or that person engaged in sexually explicit activities, without their freely-given, specific, informed, unambiguous and explicit consent. Added by the Digital Omnibus on AI (Regulation (EU) 2026/1744); applies from 2 December 2026. Art. 5(1a) limits the market-placement prohibition to systems whose intended purpose is such generation, or where it is a reasonably foreseeable and reproducible outcome absent adequate safeguards; Art. 5(1b) excludes manipulations that neither increase exposure nor alter the nature of the depicted acts.",
    examples: [
      "So-called nudification apps that undress an identifiable person in a supplied photograph",
      "Face-swap tools marketed for placing identifiable people into sexually explicit video",
      "Voice-cloning services generating sexual audio attributed to an identifiable person",
    ],
    // Phrases rather than bare words: single-word keywords match loosely by stem
    // and previously made "deepfake" reclassify an ordinary Art. 50 text generator
    // as prohibited. Multi-word phrases require every word to be present.
    keywords: ["nudification", "nudify", "intimate image", "sexually explicit", "non-consensual intimate", "undress", "sexual deepfake", "intimate parts", "nude image", "nude photo", "nude picture", "naked image", "naked photo"],
    article: "Art. 5(1)(ba)",
  },
  {
    id: "art5-1bb",
    name: "Child sexual abuse material",
    description:
      "AI systems that generate or manipulate material or performance within the meaning of Article 2, points (c) and (e), of Directive 2011/93/EU, except where a 'without right' defence applies under national law. Added by the Digital Omnibus on AI (Regulation (EU) 2026/1744); applies from 2 December 2026. Art. 5(1a) applies. Art. 5(1b) does not apply to point (bb); it qualifies point (ba) only.",
    examples: [
      "Generative systems whose intended purpose is producing child sexual abuse material",
      "Image models offered with the reasonably foreseeable and reproducible capability to produce such material absent adequate safeguards",
    ],
    keywords: ["csam", "child sexual abuse", "minor", "directive 2011/93"],
    article: "Art. 5(1)(bb)",
  },
  {
    id: "art5-1c",
    name: "Social scoring",
    description:
      "AI systems used for social scoring - evaluating or classifying natural persons or groups over a certain period based on social behaviour or known, inferred, or predicted personal or personality characteristics, where the social score leads to detrimental or unfavourable treatment in unrelated contexts or treatment that is unjustified or disproportionate.",
    examples: [
      "Government AI assigning citizen trustworthiness scores affecting access to services",
      "Municipal AI ranking residents' social behaviour to determine housing priority",
      "Private platform scoring people across unrelated contexts and restricting access to services based on inferred personality traits",
    ],
    keywords: ["social scoring", "social credit", "citizen score", "trustworthiness score", "public authority scoring", "private social scoring", "social behaviour score"],
    article: "Art. 5(1)(c)",
  },
  {
    id: "art5-1d",
    name: "Individual criminal offence risk assessment based solely on profiling",
    description:
      "AI systems making risk assessments of natural persons to predict the likelihood of committing a criminal offence, based solely on profiling or personality traits. Does not apply to AI augmenting human assessments based on objective, verifiable facts directly linked to criminal activity.",
    examples: [
      "AI predicting a person will commit a crime based solely on demographics and social media",
      "Pre-crime systems profiling individuals without any link to verified criminal activity",
      "AI generating criminal propensity scores from personality analysis alone",
    ],
    keywords: ["criminal prediction", "pre-crime", "based solely on profiling", "criminal risk", "predictive crime individual", "criminal propensity score", "personality traits criminal"],
    article: "Art. 5(1)(d)",
  },
  {
    id: "art5-1e",
    name: "Untargeted scraping for facial recognition databases",
    description:
      "AI systems creating or expanding facial recognition databases through untargeted scraping of facial images from the internet or CCTV footage.",
    examples: [
      "Scraping social media platforms to build a facial recognition database (Clearview AI-style)",
      "Mass collection of CCTV footage to create biometric identity databases",
      "Crawling public photo repositories to train facial recognition models without consent",
    ],
    keywords: ["facial scraping", "face database", "untargeted scraping", "CCTV scraping", "biometric database"],
    article: "Art. 5(1)(e)",
  },
  {
    id: "art5-1f",
    name: "Emotion recognition in workplace and education",
    description:
      "AI systems inferring emotions of natural persons in the workplace or educational institutions, except where the system is intended for medical or safety reasons.",
    examples: [
      "AI monitoring employee facial expressions during meetings to gauge engagement",
      "Classroom AI detecting student emotions to rate teacher performance",
      "Workplace AI analysing voice tone during calls to evaluate worker mood",
    ],
    keywords: ["emotion recognition workplace", "emotion detection school", "affect recognition employee", "sentiment workplace"],
    article: "Art. 5(1)(f)",
  },
  {
    id: "art5-1g",
    name: "Biometric categorisation inferring sensitive attributes",
    description:
      "AI systems categorising natural persons based on biometric data to deduce or infer race, political opinions, trade union membership, religious or philosophical beliefs, sex life, or sexual orientation. Labelling or filtering of lawfully acquired biometric datasets based on biometric data in law enforcement is excluded.",
    examples: [
      "AI inferring a person's religion from facial features or clothing via biometric analysis",
      "Systems deducing sexual orientation from biometric gait or voice patterns",
      "AI classifying political opinions from facial biometric data",
    ],
    keywords: ["biometric categorisation", "race inference", "religion inference", "sexual orientation inference", "sensitive attribute"],
    article: "Art. 5(1)(g)",
  },
  {
    id: "art5-1h",
    name: "Real-time remote biometric identification in public spaces for law enforcement",
    description:
      "Use of real-time remote biometric identification systems in publicly accessible spaces for law enforcement, except in strictly defined cases: targeted search for victims of abduction/trafficking/sexual exploitation, prevention of specific imminent threat to life or terrorist attack, and identification of suspects of serious crimes listed in Annex II.",
    examples: [
      "Live facial recognition cameras in city centres for general surveillance",
      "Real-time biometric scanning at public events without specific threat justification",
      "Blanket deployment of facial recognition on public transport for law enforcement",
    ],
    keywords: [
      "real-time biometric",
      "real time facial recognition",
      "real time remote biometric",
      "public space surveillance",
      "live facial recognition",
      "remote biometric identification",
      "facial recognition public spaces",
      "facial recognition publicly accessible",
      "law enforcement biometric identification",
      "law enforcement real time biometric",
    ],
    article: "Art. 5(1)(h)",
  },
];

// ---------------------------------------------------------------------------
// Art. 6(3) - Exception Conditions for Annex III High-Risk Classification
// ---------------------------------------------------------------------------

export const article6_3_exceptions: ExceptionCondition[] = [
  {
    id: "exception-no-significant-risk",
    condition: "No significant risk to health, safety, or fundamental rights",
    description:
      "An AI system listed in Annex III is NOT high-risk if it does not pose a significant risk of harm to the health, safety, or fundamental rights of natural persons, including by not materially influencing the outcome of decision-making.",
    article: "Art. 6(3)",
  },
  {
    id: "exception-narrow-procedural",
    condition: "Performs a narrow procedural task",
    description:
      "The AI system is intended to perform a narrow procedural task, such as transforming unstructured data into structured data, classifying incoming documents by category, or detecting duplicates among documents.",
    article: "Art. 6(3)(a)",
  },
  {
    id: "exception-improve-prior-activity",
    condition: "Improves the result of a previously completed human activity",
    description:
      "The AI system is intended to improve the result of a previously completed human activity, for example a tool that improves the language of a document drafted by a human.",
    article: "Art. 6(3)(b)",
  },
  {
    id: "exception-detect-patterns",
    condition: "Detects decision-making patterns without replacing human assessment",
    description:
      "The AI system is intended to detect decision-making patterns or deviations from prior decision-making patterns and is not meant to replace or influence the previously completed human assessment without proper human review.",
    article: "Art. 6(3)(c)",
  },
  {
    id: "exception-preparatory-task",
    condition: "Performs a preparatory task to an assessment",
    description:
      "The AI system is intended to perform a preparatory task to an assessment relevant for the purposes of the use cases listed in Annex III.",
    article: "Art. 6(3)(d)",
  },
  {
    id: "exception-documentation-required",
    condition: "Provider must document the exception assessment",
    description:
      "Providers relying on Art. 6(3) must document the assessment before placing the system on the market or putting it into service, and must register in the EU database under Art. 49(2).",
    article: "Art. 6(3), Art. 49(2)",
  },
];

// ---------------------------------------------------------------------------
// Art. 50 - Limited Risk Transparency Triggers
// ---------------------------------------------------------------------------

export const transparencyTriggers: TransparencyTrigger[] = [
  {
    id: "art50-1",
    name: "AI system interaction (chatbots)",
    description:
      "Providers must ensure that AI systems intended to interact directly with natural persons are designed and developed so that the persons are informed they are interacting with an AI system, unless obvious from the circumstances and context of use. This applies to chatbots, virtual assistants, and voice-based AI interfaces.",
    examples: [
      "Customer service chatbots on websites",
      "AI virtual assistants answering phone calls",
      "AI-powered voice bots in call centres",
      "Conversational AI in messaging apps",
    ],
    keywords: ["chatbot", "virtual assistant", "conversational AI", "voice bot", "customer service AI", "voice assistant", "conversational assistant"],
    article: "Art. 50(1)",
  },
  {
    id: "art50-3",
    name: "Emotion recognition or biometric categorisation",
    description:
      "Deployers of AI systems that perform emotion recognition or biometric categorisation must inform natural persons exposed to such systems of their operation and process personal data in accordance with applicable EU law.",
    examples: [
      "Retail analytics systems detecting customer emotions",
      "Access control systems categorising persons by biometric attributes",
      "Medical AI recognising patient emotional states (where permitted)",
    ],
    keywords: ["emotion recognition", "biometric categorisation", "sentiment analysis biometric", "affect detection"],
    article: "Art. 50(3)",
  },
  {
    id: "art50-4",
    name: "Deep fakes and synthetic content",
    description:
      "Deployers of AI systems that generate or manipulate image, audio, or video content constituting a deep fake must disclose that the content has been artificially generated or manipulated. Deployers of AI systems generating or manipulating text published to inform the public on matters of public interest must disclose that the text is artificially generated or manipulated, unless a specific exception applies.",
    examples: [
      "AI-generated video showing a public figure saying something they never said",
      "AI voice cloning used in audio content",
      "AI-generated news articles or social media posts on public interest topics",
      "Synthetic media for marketing or entertainment",
    ],
    keywords: ["deepfake", "deep fake", "synthetic content", "AI-generated", "synthetic media", "voice cloning", "generated text", "voice clone"],
    article: "Art. 50(4)",
  },
  {
    id: "art50-2",
    name: "AI-generated or manipulated content marking",
    description:
      "Providers of AI systems generating synthetic audio, image, video, or text content must ensure outputs are marked in a machine-readable format and detectable as artificially generated or manipulated. Technical solutions must be effective, interoperable, robust, and reliable.",
    examples: [
      "Watermarking AI-generated images with metadata",
      "Embedding provenance data in AI-generated audio files",
      "Content authenticity metadata in AI-produced videos",
    ],
    keywords: [
      "watermark", "content marking", "provenance", "machine-readable", "content authenticity",
      "image generation", "text generation", "video generation", "audio generation",
      "generate images", "generate text", "generate video",
    ],
    article: "Art. 50(2)",
  },
];
