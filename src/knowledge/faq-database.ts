/**
 * EU AI Act - FAQ Database
 *
 * 20 frequently asked questions based on top ICP queries.
 * Each answer references specific articles from Regulation (EU) 2024/1689.
 *
 * URLs point to lexbeam.com/de/wissen/[slug] for German-language knowledge base.
 */

export interface FAQEntry {
  id: string;
  question: string;
  answer: string;
  articleReferences: string[];
  keywords: string[];
  lexbeamUrl: string;
  category: string;
}

export const faqDatabase: FAQEntry[] = [
  {
    id: "faq-01-classification",
    question: "How do I classify my AI system under the EU AI Act?",
    answer:
      "Classification follows a risk-based approach across four tiers: prohibited (Art. 5), high-risk (Art. 6 + Annex III and Annex I), limited risk requiring transparency (Art. 50), and minimal risk with no specific obligations. Start by checking Art. 5 for prohibited practices, then Art. 6(1) for safety components in regulated products (Annex I), then Art. 6(2) for the eight Annex III use-case categories. If your system falls into Annex III, check whether the Art. 6(3) exception applies.",
    articleReferences: ["Art. 5", "Art. 6", "Annex I", "Annex III"],
    keywords: ["classification", "risk level", "categorisation", "risk tier", "high-risk", "prohibited", "limited risk"],
    lexbeamUrl: "https://lexbeam.com/de/wissen/ki-system-klassifizierung-eu-ai-act",
    category: "classification",
  },
  {
    id: "faq-02-august-2026",
    question: "What does my company need to do before August 2026?",
    answer:
      "By 2 August 2026, providers and deployers of high-risk AI systems under Annex III must fully comply. Providers need risk management systems (Art. 9), technical documentation (Art. 11), conformity assessments (Art. 43), and EU database registration (Art. 49). Deployers need human oversight processes (Art. 26), and public-sector deployers need Fundamental Rights Impact Assessments (Art. 27). Note: Art. 5 prohibited practices and Art. 4 AI literacy are already enforceable since February 2025.",
    articleReferences: ["Art. 4", "Art. 5", "Art. 9", "Art. 11", "Art. 26", "Art. 27", "Art. 43", "Art. 49", "Art. 113"],
    keywords: ["deadline", "2026", "compliance", "preparation", "timeline", "roadmap"],
    lexbeamUrl: "https://lexbeam.com/de/wissen/eu-ai-act-august-2026-vorbereitung",
    category: "deadlines",
  },
  {
    id: "faq-03-provider-deployer",
    question: "What's the difference between provider and deployer under the EU AI Act?",
    answer:
      "A provider (Art. 3(3)) develops or commissions an AI system and places it on the market or puts it into service under their own name or trademark. A deployer (Art. 3(4)) uses an AI system under their authority, except where used for personal non-professional activity. The distinction matters because providers carry heavier obligations (design, documentation, conformity) while deployers focus on proper use, oversight, and monitoring. A deployer becomes a provider if they substantially modify the system or put it on the market under their own name (Art. 25).",
    articleReferences: ["Art. 3(3)", "Art. 3(4)", "Art. 25", "Art. 16", "Art. 26"],
    keywords: ["provider", "deployer", "operator", "developer", "user", "role", "definition"],
    lexbeamUrl: "https://lexbeam.com/de/wissen/anbieter-betreiber-unterschied-eu-ai-act",
    category: "roles",
  },
  {
    id: "faq-04-governance-framework",
    question: "Do I need an AI governance framework?",
    answer:
      "Yes. While the AI Act does not prescribe a specific governance framework by name, providers of high-risk AI systems must implement a quality management system (Art. 17) covering regulatory compliance strategy, design procedures, testing protocols, data management, risk management, and post-market monitoring. Deployers must ensure competent human oversight (Art. 26). In practice, this means establishing an internal AI governance framework with clear roles, processes, and accountability structures.",
    articleReferences: ["Art. 17", "Art. 9", "Art. 26", "Art. 4"],
    keywords: ["governance", "framework", "quality management", "compliance structure", "AI policy", "organisation"],
    lexbeamUrl: "https://lexbeam.com/de/wissen/ki-governance-framework-eu-ai-act",
    category: "governance",
  },
  {
    id: "faq-05-documentation",
    question: "What documentation do I need for high-risk AI?",
    answer:
      "Providers must create technical documentation (Art. 11) covering all elements in Annex IV: general system description, detailed development process information, monitoring and testing data, risk management documentation, and a description of changes throughout the lifecycle. Additionally, you need instructions for use (Art. 13), an EU Declaration of Conformity (Art. 47), automatic logging capabilities (Art. 12), and a post-market monitoring plan (Art. 72).",
    articleReferences: ["Art. 11", "Art. 12", "Art. 13", "Art. 47", "Art. 72", "Annex IV"],
    keywords: ["documentation", "technical documentation", "Annex IV", "instructions", "conformity declaration", "records"],
    lexbeamUrl: "https://lexbeam.com/de/wissen/dokumentationspflichten-hochrisiko-ki",
    category: "documentation",
  },
  {
    id: "faq-06-risk-assessment",
    question: "How do I run an AI risk assessment?",
    answer:
      "Art. 9 requires a continuous, iterative risk management system identifying known and reasonably foreseeable risks to health, safety, and fundamental rights. The process involves: (1) identifying and analysing risks, (2) estimating and evaluating risks arising from intended use and reasonably foreseeable misuse, (3) adopting suitable risk management measures, and (4) testing against defined metrics before market placement. The risk management system must be documented and maintained throughout the AI system's lifecycle.",
    articleReferences: ["Art. 9", "Art. 27"],
    keywords: ["risk assessment", "risk management", "risk analysis", "risk identification", "risk mitigation"],
    lexbeamUrl: "https://lexbeam.com/de/wissen/ki-risikobewertung-durchfuehren",
    category: "risk_management",
  },
  {
    id: "faq-07-dora-nis2-overlap",
    question: "What's the overlap between DORA, NIS2, and the AI Act?",
    answer:
      "The three regulations overlap in cybersecurity, risk management, and incident reporting. DORA (financial sector) and NIS2 (essential/important entities) both require ICT risk management that feeds into the AI Act's Art. 15 (cybersecurity) and Art. 9 (risk management) requirements. Incident reporting under Art. 73 of the AI Act may overlap with NIS2 and DORA incident reporting. The Digital Omnibus proposal (December 2025) aims to align these reporting obligations, but is not yet adopted. Organisations should map their obligations across all three and avoid duplicating efforts.",
    articleReferences: ["Art. 9", "Art. 15", "Art. 73"],
    keywords: ["DORA", "NIS2", "cybersecurity", "overlap", "financial regulation", "incident reporting", "interplay"],
    lexbeamUrl: "https://lexbeam.com/de/wissen/dora-nis2-ai-act-zusammenspiel",
    category: "regulatory_overlap",
  },
  {
    id: "faq-08-ai-literacy",
    question: "How do I implement AI literacy training (Art. 4)?",
    answer:
      "Art. 4 requires providers and deployers to ensure sufficient AI literacy of staff and other persons operating AI systems on their behalf. This has been enforceable since 2 February 2025. Implementation should cover: understanding of basic AI concepts and limitations, awareness of AI Act obligations relevant to the person's role, practical skills for the specific AI systems they operate, and knowledge of risks and potential harms. Training must account for technical knowledge, experience, and the context of AI system use.",
    articleReferences: ["Art. 4"],
    keywords: ["AI literacy", "training", "staff education", "awareness", "competence", "Art. 4"],
    lexbeamUrl: "https://lexbeam.com/de/wissen/ki-kompetenz-art-4-umsetzung",
    category: "ai_literacy",
  },
  {
    id: "faq-09-chatgpt-copilot",
    question: "What does the AI Act mean for ChatGPT/Copilot usage in my company?",
    answer:
      "As a deployer of general-purpose AI tools like ChatGPT or Copilot, you must ensure AI literacy of users (Art. 4, enforceable since February 2025). If you use these tools for high-risk purposes listed in Annex III (e.g. HR screening, credit decisions), the high-risk deployer obligations apply to you (Art. 26). The providers of these models (OpenAI, Microsoft) carry GPAI obligations under Art. 51-56. If you fine-tune or substantially modify a model, you may become a provider yourself (Art. 25).",
    articleReferences: ["Art. 4", "Art. 25", "Art. 26", "Art. 51", "Art. 53"],
    keywords: ["ChatGPT", "Copilot", "GPT", "general purpose", "LLM", "foundation model", "enterprise AI"],
    lexbeamUrl: "https://lexbeam.com/de/wissen/chatgpt-copilot-eu-ai-act",
    category: "gpai",
  },
  {
    id: "faq-10-hr-ai-high-risk",
    question: "Is my HR AI tool high-risk?",
    answer:
      "Very likely yes. Annex III(4) covers AI systems used in employment, workers management, and access to self-employment. This includes recruitment and CV screening, candidate evaluation and interview analysis, promotion and termination decisions, task allocation based on behaviour or traits, and monitoring/evaluation of work performance. The Art. 6(3) exception may apply if the tool performs only narrow procedural tasks (e.g. formatting CVs) without materially influencing decisions. Document your assessment either way.",
    articleReferences: ["Art. 6(2)", "Art. 6(3)", "Annex III(4)"],
    keywords: ["HR", "human resources", "recruitment", "hiring", "CV screening", "employee monitoring", "workforce"],
    lexbeamUrl: "https://lexbeam.com/de/wissen/hr-ki-hochrisiko-einstufung",
    category: "classification",
  },
  {
    id: "faq-11-fria",
    question: "How do I conduct a Fundamental Rights Impact Assessment (FRIA)?",
    answer:
      "Art. 27 requires a FRIA before putting a high-risk AI system into use if you are a public-law body, provide public services, or deploy systems for creditworthiness assessment (Annex III(5)(a)) or essential services (Annex III(5)(b)). The FRIA must describe your processes using the AI system, the period and frequency of use, categories of affected persons, specific risks of harm, human oversight measures, and measures taken if risks materialise. Results must be notified to the market surveillance authority and submitted via the EU database.",
    articleReferences: ["Art. 27", "Art. 26(9)"],
    keywords: ["FRIA", "fundamental rights", "impact assessment", "public sector", "Art. 27"],
    lexbeamUrl: "https://lexbeam.com/de/wissen/grundrechte-folgenabschaetzung-fria",
    category: "fundamental_rights",
  },
  {
    id: "faq-12-chatbot-transparency",
    question: "What are transparency obligations for chatbots?",
    answer:
      "Under Art. 50(1), providers must ensure that persons interacting with an AI system are informed they are interacting with AI, unless this is obvious from the circumstances. For deep fakes and synthetic content, Art. 50(4) requires disclosure that content was artificially generated or manipulated. Art. 50(5) requires machine-readable marking of AI-generated content. These are limited-risk obligations that apply regardless of whether the system is classified as high-risk.",
    articleReferences: ["Art. 50(1)", "Art. 50(4)", "Art. 50(5)"],
    keywords: ["chatbot", "transparency", "disclosure", "AI interaction", "synthetic content", "deep fake", "labelling"],
    lexbeamUrl: "https://lexbeam.com/de/wissen/transparenzpflichten-chatbots-ki",
    category: "transparency",
  },
  {
    id: "faq-13-human-oversight",
    question: "What does 'human oversight' actually mean under the AI Act?",
    answer:
      "Art. 14 requires high-risk AI systems to be designed for effective human oversight. Concretely, the oversight person must be able to: fully understand the system's capacities and limitations, properly monitor operation, correctly interpret outputs (especially considering the system's characteristics and available tools), decide not to use or override/reverse the system's output, and intervene or stop the system via a 'stop' mechanism. Deployers must assign oversight to competent, trained, and authorised persons (Art. 26(2)).",
    articleReferences: ["Art. 14", "Art. 26(2)"],
    keywords: ["human oversight", "human-in-the-loop", "human control", "override", "intervention", "stop button"],
    lexbeamUrl: "https://lexbeam.com/de/wissen/menschliche-aufsicht-ki-art-14",
    category: "human_oversight",
  },
  {
    id: "faq-14-financial-services",
    question: "How does the EU AI Act apply to financial services?",
    answer:
      "Financial services are directly affected through Annex III(5) (credit scoring, insurance risk assessment, benefit eligibility) and through overlap with DORA. AI-based creditworthiness and credit scoring systems are explicitly high-risk. Deployers in financial services using such systems must comply with Art. 26 (use, oversight, monitoring) and potentially Art. 27 (FRIA for essential services). GPAI models used in financial decision-making inherit obligations from both the AI Act and DORA's ICT risk management framework.",
    articleReferences: ["Art. 6(2)", "Art. 26", "Art. 27", "Annex III(5)"],
    keywords: ["financial services", "banking", "insurance", "credit scoring", "DORA", "fintech", "financial AI"],
    lexbeamUrl: "https://lexbeam.com/de/wissen/eu-ai-act-finanzdienstleistungen",
    category: "sector_specific",
  },
  {
    id: "faq-15-healthcare",
    question: "How does the EU AI Act apply to healthcare?",
    answer:
      "Healthcare AI is affected in two ways. First, AI systems that are safety components of medical devices (Annex I, referencing MDR and IVDR) become high-risk under Art. 6(1), with full obligations from August 2027. Second, AI systems evaluating healthcare access or emergency dispatch fall under Annex III(5), with obligations from August 2026. AI-assisted diagnostic tools, triage systems, and treatment recommendation engines are likely high-risk. Conformity assessment may require notified body involvement depending on the medical device classification.",
    articleReferences: ["Art. 6(1)", "Art. 6(2)", "Annex I", "Annex III(5)"],
    keywords: ["healthcare", "medical", "medical device", "MDR", "diagnostic", "clinical", "health AI", "patient"],
    lexbeamUrl: "https://lexbeam.com/de/wissen/eu-ai-act-gesundheitswesen",
    category: "sector_specific",
  },
  {
    id: "faq-16-penalties",
    question: "What are the penalties for non-compliance with the EU AI Act?",
    answer:
      "Penalties are tiered by severity. Prohibited practice violations (Art. 5): up to EUR 35 million or 7% of global annual turnover, whichever is higher. High-risk and other obligation violations: up to EUR 15 million or 3%. Providing false information to authorities: up to EUR 7.5 million or 1%. For SMEs and startups, the applicable fine is whichever amount is lower (not higher), providing proportionate protection. Member States enforce via national market surveillance authorities.",
    articleReferences: ["Art. 99(3)", "Art. 99(4)", "Art. 99(5)", "Art. 99(6)"],
    keywords: ["penalties", "fines", "sanctions", "enforcement", "non-compliance", "punishment", "EUR 35 million"],
    lexbeamUrl: "https://lexbeam.com/de/wissen/strafen-bussgeld-eu-ai-act",
    category: "enforcement",
  },
  {
    id: "faq-17-deployer-becomes-provider",
    question: "When does a deployer become a provider under the AI Act?",
    answer:
      "Under Art. 25, a deployer becomes a provider when they: (a) put their name or trademark on a high-risk AI system already on the market, (b) make a substantial modification to a high-risk AI system already on the market, or (c) modify the intended purpose of an AI system (including GPAI) in a way that makes it high-risk. This carries significant implications because the full provider obligations then apply, including conformity assessment, technical documentation, and EU database registration.",
    articleReferences: ["Art. 25"],
    keywords: ["deployer to provider", "substantial modification", "role change", "rebranding", "intended purpose change"],
    lexbeamUrl: "https://lexbeam.com/de/wissen/betreiber-wird-anbieter-art-25",
    category: "roles",
  },
  {
    id: "faq-18-digital-omnibus",
    question: "What is the Digital Omnibus proposal and how does it affect the AI Act?",
    answer:
      "The Digital Omnibus Simplification Package is a European Commission proposal from December 2025 aiming to reduce compliance burden across the AI Act, GDPR, NIS2, DORA, and other digital regulations. Key proposed changes include narrowing Annex III high-risk categories, extending SME deadlines, and aligning incident reporting. However, this is only a legislative proposal going through ordinary legislative procedure. It is NOT adopted law. Organisations should continue preparing against the current regulation text and treat any Omnibus changes as potential future relief, not a reason to delay compliance.",
    articleReferences: [],
    keywords: ["Digital Omnibus", "simplification", "proposal", "reform", "compliance reduction", "Omnibus"],
    lexbeamUrl: "https://lexbeam.com/de/wissen/digital-omnibus-ai-act-auswirkungen",
    category: "legislative_updates",
  },
  {
    id: "faq-19-registration",
    question: "Do I need to register my AI system in the EU database?",
    answer:
      "Yes, if you are a provider of a high-risk AI system. Art. 49(1) requires providers (or their authorised representatives) to register themselves and the system in the EU database before placing it on the market or putting it into service. Deployers who are public-law bodies or act on behalf of public authorities must also register (Art. 49(3)). Providers relying on the Art. 6(3) exception must still register and document their exception assessment (Art. 49(2)). The EU database is publicly accessible for transparency purposes (Art. 71).",
    articleReferences: ["Art. 49", "Art. 71"],
    keywords: ["registration", "EU database", "database", "register", "Art. 49", "public database"],
    lexbeamUrl: "https://lexbeam.com/de/wissen/eu-datenbank-registrierung-ki-systeme",
    category: "registration",
  },
  {
    id: "faq-20-art6-3-exception",
    question: "What is the Art. 6(3) exception and how do I use it?",
    answer:
      "Art. 6(3) allows providers to determine that an AI system listed in Annex III is NOT high-risk if it does not pose a significant risk to health, safety, or fundamental rights. Specifically, the system must meet at least one condition: it performs a narrow procedural task, improves the result of a previously completed human activity, detects decision-making patterns without replacing human assessment, or performs a preparatory task. Critically, the exception does NOT apply if the system performs profiling of natural persons (Art. 6(3) second subparagraph). The provider must document this assessment before market placement (Art. 6(4)) and register in the EU database (Art. 49(2)). National authorities can challenge this determination.",
    articleReferences: ["Art. 6(3)", "Art. 6(4)", "Art. 49(2)"],
    keywords: ["Art. 6(3)", "exception", "not high-risk", "narrow procedural", "exemption", "derogation", "profiling"],
    lexbeamUrl: "https://lexbeam.com/de/wissen/art-6-3-ausnahme-hochrisiko",
    category: "classification",
  },
  {
    id: "faq-21-gpai-flops-threshold",
    question: "What is the FLOPs threshold for systemic risk GPAI models?",
    answer:
      "Art. 51(2) presumes that a general-purpose AI model has high-impact capabilities — and therefore qualifies as a GPAI model with systemic risk — when the cumulative amount of compute used for its training measured in floating point operations (FLOPs) is greater than 10^25. Providers that reach or will reach this threshold must notify the Commission without delay and in any event within two weeks (Art. 52(1)). The Commission may also designate models with equivalent capabilities or impact as GPAI with systemic risk under Art. 51(1)(b) based on criteria set out in Annex XIII.",
    articleReferences: ["Art. 51", "Art. 51(2)", "Art. 52", "Art. 55", "Annex XIII"],
    keywords: ["FLOPs", "floating point operations", "systemic risk", "GPAI", "general purpose AI", "10^25", "training compute", "threshold", "Art. 51"],
    lexbeamUrl: "https://lexbeam.com/de/wissen/gpai-systemic-risk-flops",
    category: "gpai",
  },
  {
    id: "faq-22-fria-credit-scoring",
    question: "Do I need a FRIA for credit scoring?",
    answer:
      "Yes — if you are a deployer of an AI system used for creditworthiness evaluation or credit scoring of natural persons (Annex III(5)(b)), you must perform a Fundamental Rights Impact Assessment before putting the system into use (Art. 27). The obligation applies to bodies governed by public law, private entities providing public services, and explicitly to deployers of credit scoring and insurance risk/pricing systems under Annex III(5)(a)-(b). The FRIA must describe the processes using the system, the period and frequency of use, the categories of affected natural persons, the specific risks of harm, the human oversight measures, and the measures to be taken if risks materialise. Results must be notified to the market surveillance authority and submitted via the template provided by the AI Office. An existing GDPR Art. 35 DPIA may be reused where relevant but does not replace the FRIA.",
    articleReferences: ["Art. 27", "Art. 26(9)", "Annex III(5)(b)"],
    keywords: ["FRIA", "fundamental rights", "credit scoring", "creditworthiness", "Art. 27", "credit", "loan", "essential services", "Annex III(5)"],
    lexbeamUrl: "https://lexbeam.com/de/wissen/fria-kreditwuerdigkeit",
    category: "fria",
  },
  {
    id: "faq-23-chatbot-disclosure",
    question: "Do AI chatbots need special disclosure or labelling?",
    answer:
      "Yes. Under Art. 50(1), providers must ensure that AI systems intended to interact directly with natural persons are designed and developed so that persons are informed they are interacting with an AI system, unless this is obvious from the circumstances and context of use. This means most customer service chatbots, virtual assistants, and conversational voice bots must tell users — clearly and at the start of the interaction — that they are talking to AI rather than a human. This is a limited-risk transparency obligation, not a high-risk classification. Chatbots that also generate synthetic content (e.g. AI-generated images or deep fakes) additionally trigger Art. 50(2) (machine-readable marking) and Art. 50(4) (deep fake disclosure).",
    articleReferences: ["Art. 50(1)", "Art. 50(2)", "Art. 50(4)"],
    keywords: ["chatbot", "chatbot disclosure", "virtual assistant", "conversational AI", "labelling", "transparency", "Art. 50", "customer service"],
    lexbeamUrl: "https://lexbeam.com/de/wissen/chatbot-kennzeichnung-art-50",
    category: "transparency",
  },
  {
    id: "faq-24-minimal-risk-examples",
    question: "Is my spellchecker, spam filter, or recommender system subject to the EU AI Act?",
    answer:
      "For most minimal-risk AI systems — spell checkers, spam filters, product recommenders, inventory forecasting tools, dynamic pricing models, and similar — the EU AI Act imposes no specific obligations beyond the universal AI literacy requirement under Art. 4 (enforceable since 2 February 2025). Providers and deployers are encouraged to voluntarily adhere to codes of conduct under Art. 95 but are not legally required to. General product safety, consumer protection, and data protection laws still apply. The main exception is if the tool falls into Annex III (e.g. a 'recommender' that is actually used for employment screening is high-risk under Annex III(4) regardless of the label).",
    articleReferences: ["Art. 4", "Art. 6(1)", "Art. 95"],
    keywords: ["minimal risk", "spellchecker", "spell check", "spam filter", "recommender", "recommendation", "not high risk", "exempt", "AI literacy"],
    lexbeamUrl: "https://lexbeam.com/de/wissen/minimal-risk-ki-systeme",
    category: "classification",
  },
];
