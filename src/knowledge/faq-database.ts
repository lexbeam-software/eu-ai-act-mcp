/**
 * EU AI Act - FAQ Database
 *
 * 24 frequently asked questions based on top ICP queries.
 * Each answer references specific articles from Regulation (EU) 2024/1689.
 *
 * URLs point to the German-language knowledge base on lexbeam.com and come from the
 * WISSEN map below, which lists only pages that exist.
 *
 * faq-18 (Digital Omnibus) derives its answer from the `omnibusEnactment`
 * record in digital-omnibus.ts so it flips together with the rest of the
 * server on OJ publication (audit items M2/M3).
 */

import { isOmnibusEnacted, omnibusEnactment } from "./digital-omnibus.js";

const omnibusFaqAnswer = isOmnibusEnacted(omnibusEnactment)
  ? `The Digital Omnibus on AI (Commission proposal COM(2025) 836 of 19 November 2025, procedure 2025/0359(COD)) amends Regulation (EU) 2024/1689. It was politically agreed on 7 May 2026, formally adopted by the European Parliament (${omnibusEnactment.epEndorsement}) and the Council (${omnibusEnactment.councilAdoption}), published in the Official Journal on ${omnibusEnactment.ojPublicationDate} (CELEX ${omnibusEnactment.celex}), and entered into force on ${omnibusEnactment.entryIntoForce}. Operative dates now: Annex III high-risk obligations apply from 2 December 2027 and Annex I product-integrated high-risk obligations from 2 August 2028. NOT deferred: Art. 50 transparency obligations and the Commission's GPAI enforcement powers and fines apply since 2 August 2026; GPAI obligations have been in force since 2 August 2025; the legacy GPAI compliance date stays 2 August 2027. The Art. 5 prohibited-practices list was expanded (non-consensual intimate imagery / CSAM), not delayed. Use euaiact_check_deadlines for the operative timeline and verify article-level wording against the OJ text.`
  : "The Digital Omnibus on AI (Commission proposal COM(2025) 836 of 19 November 2025, procedure 2025/0359(COD)) amends Regulation (EU) 2024/1689. After the political agreement of 7 May 2026 it has been FORMALLY ADOPTED by both co-legislators: the European Parliament endorsed it on 16 June 2026 and the Council gave its final adoption on 29 June 2026. It is NOT yet published in the Official Journal and therefore not yet in force; it takes legal effect on OJ publication, entering into force on the third day after publication. Once in force, the headline changes are: Annex III high-risk obligations deferred from 2 August 2026 to 2 December 2027, and Annex I product-integrated high-risk obligations deferred from 2 August 2027 to 2 August 2028. NOT deferred: Art. 50 transparency obligations and the Commission's GPAI enforcement powers and fines still apply from 2 August 2026, GPAI obligations remain in force since 2 August 2025, and the legacy GPAI compliance date stays 2 August 2027. The Art. 5 prohibited-practices list is expanded (non-consensual intimate imagery / CSAM), not delayed. Until OJ publication, Regulation (EU) 2024/1689 as published remains authoritative for compliance planning; use euaiact_check_deadlines with include_pending_omnibus for the adopted changes with source-status labels.";

/**
 * Knowledge-base pages that exist on lexbeam.com. Every lexbeamUrl below comes from this
 * map. Each entry points at the article that covers its topic; a topic with no article of
 * its own points at the index rather than at a slug that might exist one day. 1.5.0
 * shipped 23 such slugs, all of them 404.
 *
 * Two gates keep this honest: the behavior suite rejects any lexbeam.com URL in src/ that
 * is missing from tests/fixtures/site/known-live-urls.json, and the release verification
 * requests every one of them.
 */
const WISSEN = {
  index: "https://lexbeam.com/de/wissen",
  classification: "https://lexbeam.com/de/wissen/ki-verordnung-klassifizierung",
  august2026: "https://lexbeam.com/de/wissen/ki-verordnung-august-2026",
  providerDeployer: "https://lexbeam.com/de/wissen/provider-deployer-pflichten",
  governance: "https://lexbeam.com/de/wissen/ki-governance-framework",
  documentation: "https://lexbeam.com/de/wissen/dokumentationspflichten-hochrisiko-ki",
  penalties: "https://lexbeam.com/de/wissen/ki-verordnung-bussgelder-sanktionen",
  gpai: "https://lexbeam.com/de/wissen/gpai-modelle-pflichten",
} as const;

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
    keywords: ["classification", "risk level", "categorisation", "risk tier", "which tier", "high-risk", "prohibited", "limited risk", "image generation model", "classify system"],
    lexbeamUrl: WISSEN.classification,
    category: "classification",
  },
  {
    id: "faq-02-august-2026",
    question: "What does my company need to do, and by when?",
    answer:
      "Providers and deployers of high-risk AI systems under Annex III must comply by 2 December 2027, as deferred by the Digital Omnibus on AI. Providers need risk management systems (Art. 9), technical documentation (Art. 11), conformity assessments (Art. 43), and EU database registration where Art. 49 applies (Annex III systems except point 2, plus Art. 6(3) registrations). Deployers need human oversight processes (Art. 26), and a FRIA where Art. 27 applies, including public-law/public-service deployers and deployers of Annex III(5)(b)/(c) credit and life/health-insurance systems. Note: Art. 5 prohibited practices and Art. 4 AI literacy are already enforceable since February 2025. This changed with the Digital Omnibus on AI (Regulation (EU) 2026/1744, OJ of 24 July 2026, in force 27 July 2026): the Annex III high-risk application date is deferred to 2 December 2027 and the Annex I date to 2 August 2028. Not deferred: Art. 50 transparency and the Commission's GPAI enforcement powers and fines still apply from 2 August 2026. Check euaiact_check_deadlines for the operative dates.",
    articleReferences: ["Art. 4", "Art. 5", "Art. 9", "Art. 11", "Art. 26", "Art. 27", "Art. 43", "Art. 49", "Art. 113"],
    keywords: ["deadline", "deadlines", "2026", "compliance", "preparation", "timeline", "roadmap", "high-risk annex iii apply", "when obligations apply", "december 2027", "dates"],
    lexbeamUrl: WISSEN.august2026,
    category: "deadlines",
  },
  {
    id: "faq-03-provider-deployer",
    question: "What's the difference between provider and deployer under the EU AI Act?",
    answer:
      "A provider (Art. 3(3)) develops or commissions an AI system and places it on the market or puts it into service under their own name or trademark. A deployer (Art. 3(4)) uses an AI system under their authority, except where used for personal non-professional activity. The distinction matters because providers carry heavier obligations (design, documentation, conformity) while deployers focus on proper use, oversight, and monitoring. A deployer becomes a provider if they substantially modify the system or put it on the market under their own name (Art. 25).",
    articleReferences: ["Art. 3(3)", "Art. 3(4)", "Art. 25", "Art. 16", "Art. 26"],
    keywords: ["provider", "deployer", "operator", "developer", "user", "role", "definition"],
    lexbeamUrl: WISSEN.providerDeployer,
    category: "roles",
  },
  {
    id: "faq-04-governance-framework",
    question: "Do I need an AI governance framework?",
    answer:
      "Yes. While the AI Act does not prescribe a specific governance framework by name, providers of high-risk AI systems must implement a quality management system (Art. 17) covering regulatory compliance strategy, design procedures, testing protocols, data management, risk management, and post-market monitoring. Deployers must ensure competent human oversight (Art. 26). In practice, this means establishing an internal AI governance framework with clear roles, processes, and accountability structures.",
    articleReferences: ["Art. 17", "Art. 9", "Art. 26", "Art. 4"],
    keywords: ["governance", "framework", "quality management", "compliance structure", "AI policy", "organisation"],
    lexbeamUrl: WISSEN.governance,
    category: "governance",
  },
  {
    id: "faq-05-documentation",
    question: "What documentation do I need for high-risk AI?",
    answer:
      "Providers must create technical documentation (Art. 11) covering all elements in Annex IV: general system description, detailed development process information, monitoring and testing data, risk management documentation, and a description of changes throughout the lifecycle. Additionally, you need instructions for use (Art. 13), an EU Declaration of Conformity (Art. 47), automatic logging capabilities (Art. 12), and a post-market monitoring plan (Art. 72).",
    articleReferences: ["Art. 11", "Art. 12", "Art. 13", "Art. 47", "Art. 72", "Annex IV"],
    keywords: ["documentation", "technical documentation", "Annex IV", "instructions", "conformity declaration", "records"],
    lexbeamUrl: WISSEN.documentation,
    category: "documentation",
  },
  {
    id: "faq-06-risk-assessment",
    question: "How do I run an AI risk assessment?",
    answer:
      "Art. 9 requires a continuous, iterative risk management system identifying known and reasonably foreseeable risks to health, safety, and fundamental rights. The process involves: (1) identifying and analysing risks, (2) estimating and evaluating risks arising from intended use and reasonably foreseeable misuse, (3) adopting suitable risk management measures, and (4) testing against defined metrics before market placement. The risk management system must be documented and maintained throughout the AI system's lifecycle.",
    articleReferences: ["Art. 9", "Art. 27"],
    keywords: ["risk assessment", "risk management", "risk analysis", "risk identification", "risk mitigation"],
    lexbeamUrl: WISSEN.documentation,
    category: "risk_management",
  },
  {
    id: "faq-07-dora-nis2-overlap",
    question: "What's the overlap between DORA, NIS2, and the AI Act?",
    answer:
      "The three regulations overlap in cybersecurity, risk management, and incident reporting. DORA (financial sector) and NIS2 (essential/important entities) both require ICT risk management that feeds into the AI Act's Art. 15 (cybersecurity) and Art. 9 (risk management) requirements. Incident reporting under Art. 73 of the AI Act may overlap with NIS2 and DORA incident reporting. The Digital Omnibus on AI (proposed 19 November 2025, now Regulation (EU) 2026/1744, in force 27 July 2026) aims to align these reporting obligations, and additionally routes serious-incident reporting for systems under AI Office exclusive competence to the AI Office by derogation from Art. 73 (new Art. 75(1a)). Organisations should map their obligations across all three and avoid duplicating efforts.",
    articleReferences: ["Art. 9", "Art. 15", "Art. 73"],
    keywords: ["DORA", "NIS2", "cybersecurity", "overlap", "financial regulation", "incident reporting", "interplay"],
    lexbeamUrl: WISSEN.index,
    category: "regulatory_overlap",
  },
  {
    id: "faq-08-ai-literacy",
    question: "How do I implement AI literacy training (Art. 4)?",
    answer:
      "Art. 4 requires providers and deployers to take measures to SUPPORT THE DEVELOPMENT of AI literacy of staff and other persons operating AI systems on their behalf. It has been applicable since 2 February 2025 and was REPLACED with effect from 27 July 2026 by Regulation (EU) 2026/1744: the text now states expressly that the obligation does not require guaranteeing any specific level of AI literacy in any individual, so this is a duty of demonstrable effort, not of measured competence. New Art. 4(2) puts a supporting duty on the Commission and Member States, including practical compliance examples on the single information platform. Implementation should cover: understanding of basic AI concepts and limitations, awareness of AI Act obligations relevant to the person's role, practical skills for the specific AI systems they operate, and knowledge of risks and potential harms. Training must account for technical knowledge, experience, and the context of AI system use.",
    articleReferences: ["Art. 4"],
    keywords: ["AI literacy", "training", "staff education", "awareness", "competence", "Art. 4"],
    lexbeamUrl: WISSEN.governance,
    category: "ai_literacy",
  },
  {
    id: "faq-09-chatgpt-copilot",
    question: "What does the AI Act mean for ChatGPT/Copilot usage in my company?",
    answer:
      "As a deployer of general-purpose AI tools like ChatGPT or Copilot, you must take measures to support the development of AI literacy of users (Art. 4, applicable since February 2025 and replaced from 27 July 2026; you are not required to guarantee any specific level of literacy). If you use these tools for high-risk purposes listed in Annex III (e.g. HR screening, credit decisions), the high-risk deployer obligations apply to you (Art. 26). The providers of these models (OpenAI, Microsoft) carry GPAI obligations under Chapter V, especially Art. 53-55. If you fine-tune or substantially modify a model, you may become a provider yourself (Art. 25).",
    articleReferences: ["Art. 4", "Art. 25", "Art. 26", "Art. 51", "Art. 53"],
    keywords: ["ChatGPT", "Copilot", "GPT", "general purpose", "LLM", "foundation model", "enterprise AI", "employees", "staff", "workplace tools", "copilot at work"],
    lexbeamUrl: WISSEN.gpai,
    category: "gpai",
  },
  {
    id: "faq-10-hr-ai-high-risk",
    question: "Is my HR AI tool high-risk?",
    answer:
      "Very likely yes. Annex III(4) covers AI systems used in employment, workers management, and access to self-employment. This includes recruitment and CV screening, candidate evaluation and interview analysis, promotion and termination decisions, task allocation based on behaviour or traits, and monitoring/evaluation of work performance. The Art. 6(3) exception may apply if the tool performs only narrow procedural tasks (e.g. formatting CVs) without materially influencing decisions. Document your assessment either way.",
    articleReferences: ["Art. 6(2)", "Art. 6(3)", "Annex III(4)"],
    keywords: ["HR", "human resources", "recruitment", "hiring", "CV screening", "employee monitoring", "workforce"],
    lexbeamUrl: WISSEN.classification,
    category: "classification",
  },
  {
    id: "faq-11-fria",
    question: "How do I conduct a Fundamental Rights Impact Assessment (FRIA)?",
    answer:
      "Art. 27 requires a FRIA before putting a high-risk AI system into use if you are a public-law body, a private entity providing public services, or a deployer of systems for creditworthiness or credit scoring (Annex III(5)(b)) or for life and health insurance risk assessment and pricing (Annex III(5)(c)). The carve-out is Annex III point 2 (critical infrastructure), which is the only Annex III category exempt from the FRIA obligation. The FRIA must describe your processes using the AI system, the period and frequency of use, categories of affected persons, specific risks of harm, human oversight measures, and measures taken if risks materialise. Results must be notified to the market surveillance authority and submitted via the EU database.",
    articleReferences: ["Art. 27", "Art. 26(9)"],
    keywords: ["FRIA", "fundamental rights", "impact assessment", "public sector", "Art. 27"],
    lexbeamUrl: WISSEN.documentation,
    category: "fundamental_rights",
  },
  {
    id: "faq-12-chatbot-transparency",
    question: "What are transparency obligations for chatbots?",
    answer:
      "Under Art. 50(1), providers must ensure that persons interacting with an AI system are informed they are interacting with AI, unless this is obvious from the circumstances. Art. 50(2) requires providers of systems generating synthetic audio, image, video, or text to ensure machine-readable marking and detectability. Art. 50(4) requires deployers to disclose deep fakes and certain AI-generated or manipulated public-interest text, unless a specific exception applies. These are limited-risk obligations that apply regardless of whether the system is classified as high-risk.",
    articleReferences: ["Art. 50(1)", "Art. 50(2)", "Art. 50(4)"],
    keywords: ["chatbot", "transparency", "disclosure", "AI interaction", "synthetic content", "deep fake", "labelling"],
    lexbeamUrl: WISSEN.classification,
    category: "transparency",
  },
  {
    id: "faq-13-human-oversight",
    question: "What does 'human oversight' actually mean under the AI Act?",
    answer:
      "Art. 14 requires high-risk AI systems to be designed for effective human oversight. Concretely, the oversight person must be able to: fully understand the system's capacities and limitations, properly monitor operation, correctly interpret outputs (especially considering the system's characteristics and available tools), decide not to use or override/reverse the system's output, and intervene or stop the system via a 'stop' mechanism. Deployers must assign oversight to competent, trained, and authorised persons (Art. 26(2)).",
    articleReferences: ["Art. 14", "Art. 26(2)"],
    keywords: ["human oversight", "human-in-the-loop", "human control", "override", "intervention", "stop button"],
    lexbeamUrl: WISSEN.governance,
    category: "human_oversight",
  },
  {
    id: "faq-14-financial-services",
    question: "How does the EU AI Act apply to financial services?",
    answer:
      "Financial services are directly affected through Annex III(5), especially creditworthiness and credit scoring of natural persons and risk assessment and pricing for life and health insurance. AI-based creditworthiness and credit scoring systems are explicitly high-risk. Deployers using credit scoring systems under Annex III(5)(b) or life/health insurance risk-and-pricing systems under Annex III(5)(c) must comply with Art. 26 and perform a FRIA under Art. 27 before putting the system into use. GPAI models used in financial decision-making inherit obligations from both the AI Act and DORA's ICT risk management framework.",
    articleReferences: ["Art. 6(2)", "Art. 26", "Art. 27", "Annex III(5)"],
    keywords: ["financial services", "banking", "insurance", "credit scoring", "DORA", "fintech", "financial AI"],
    lexbeamUrl: WISSEN.index,
    category: "sector_specific",
  },
  {
    id: "faq-15-healthcare",
    question: "How does the EU AI Act apply to healthcare?",
    answer:
      "Healthcare AI can reach high-risk status through different routes. An AI system that is a regulated product or safety component must satisfy the Art. 6(1), Annex I, product-law, third-party-conformity, and current Art. 6(1a) to (1c) conditions; that route applies from 2 August 2028. An emergency healthcare patient-triage system matching Annex III(5)(d) is high-risk from 2 December 2027, subject to Art. 6(3). Diagnostic and treatment-recommendation tools require the Art. 6(1) and intended-purpose analysis and are not high-risk merely because they are used in healthcare.",
    articleReferences: ["Art. 6(1)", "Art. 6(2)", "Annex I", "Annex III(5)"],
    keywords: ["healthcare", "medical", "medical device", "MDR", "diagnostic", "clinical", "health AI", "patient"],
    lexbeamUrl: WISSEN.index,
    category: "sector_specific",
  },
  {
    id: "faq-16-penalties",
    question: "What are the penalties for non-compliance with the EU AI Act?",
    answer:
      "Penalties are tiered by the exact violation. Art. 5 prohibited-practice violations under Art. 99(3): up to EUR 35 million or 7% of global annual turnover. The violations enumerated in Art. 99(4), including its listed operator, notified-body, and Art. 50 duties: up to EUR 15 million or 3%. Incorrect, incomplete, or misleading information under Art. 99(5): up to EUR 7.5 million or 1%. For an undertaking the higher ceiling applies, except that Art. 99(6) applies the lower ceiling to SMEs, including start-ups. Art. 99(6a) applies the lower ceiling to small mid-caps only for paragraphs 4 and 5.",
    articleReferences: ["Art. 99(3)", "Art. 99(4)", "Art. 99(5)", "Art. 99(6)"],
    keywords: ["penalties", "fines", "fined", "sanctions", "enforcement", "non-compliance", "punishment", "EUR 35 million", "company fined", "maximum fine"],
    lexbeamUrl: WISSEN.penalties,
    category: "enforcement",
  },
  {
    id: "faq-17-deployer-becomes-provider",
    question: "When does a deployer become a provider under the AI Act?",
    answer:
      "Under Art. 25, a deployer becomes a provider when they: (a) put their name or trademark on a high-risk AI system already on the market, (b) make a substantial modification to a high-risk AI system already on the market, or (c) modify the intended purpose of an AI system (including GPAI) in a way that makes it high-risk. This carries significant implications because the full provider obligations then apply, including conformity assessment, technical documentation, and EU database registration.",
    articleReferences: ["Art. 25"],
    keywords: ["deployer to provider", "substantial modification", "role change", "rebranding", "intended purpose change"],
    lexbeamUrl: WISSEN.providerDeployer,
    category: "roles",
  },
  {
    id: "faq-18-digital-omnibus",
    question: "What is the Digital Omnibus and how does it affect the AI Act?",
    answer: omnibusFaqAnswer,
    articleReferences: ["Art. 5", "Art. 6", "Art. 50", "Art. 113"],
    keywords: ["Digital Omnibus", "simplification", "proposal", "reform", "compliance reduction", "Omnibus", "adopted", "Official Journal", "deferral", "postponement", "postponed", "postpone", "delayed", "delay", "pushed back", "high-risk dates", "postpone high-risk"],
    lexbeamUrl: WISSEN.index,
    category: "legislative_updates",
  },
  {
    id: "faq-19-registration",
    question: "Do I need to register my AI system in the EU database?",
    answer:
      "Registration applies only where Art. 49 says so. Under Art. 49(1), before market placement or putting into service, providers or authorised representatives register themselves and an Annex III high-risk system, except a system in Annex III point 2. Under Art. 49(2), providers relying on an Art. 6(3) non-high-risk determination still register themselves and the system. The public-authority and Union-institution deployers listed in Art. 49(3), and persons acting on their behalf, register themselves, select the system, and register its use. Art. 49 is not a blanket registration rule for every high-risk system.",
    articleReferences: ["Art. 49", "Art. 71"],
    keywords: ["registration", "EU database", "database", "register", "Art. 49", "public database", "annex iii registration", "register high-risk system"],
    lexbeamUrl: WISSEN.providerDeployer,
    category: "registration",
  },
  {
    id: "faq-20-art6-3-exception",
    question: "What is the Art. 6(3) exception and how do I use it?",
    answer:
      "Art. 6(3) allows providers to determine that an AI system listed in Annex III is NOT high-risk if it does not pose a significant risk to health, safety, or fundamental rights. Specifically, the system must meet at least one condition: it performs a narrow procedural task, improves the result of a previously completed human activity, detects decision-making patterns without replacing human assessment, or performs a preparatory task. Critically, the exception does NOT apply if the system performs profiling of natural persons (Art. 6(3), third subparagraph). The provider must document this assessment before market placement (Art. 6(4)) and register in the EU database (Art. 49(2)). National authorities can challenge this determination.",
    articleReferences: ["Art. 6(3)", "Art. 6(4)", "Art. 49(2)"],
    keywords: ["Art. 6(3)", "exception", "not high-risk", "narrow procedural", "exemption", "derogation", "profiling"],
    lexbeamUrl: WISSEN.classification,
    category: "classification",
  },
  {
    id: "faq-21-gpai-flops-threshold",
    question: "What is the FLOPs threshold for systemic risk GPAI models?",
    answer:
      "Art. 51(2) presumes that a general-purpose AI model has high-impact capabilities - and therefore qualifies as a GPAI model with systemic risk - when the cumulative amount of compute used for its training measured in floating point operations (FLOPs) is greater than 10^25. Providers that reach or will reach this threshold must notify the Commission without delay and in any event within two weeks (Art. 52(1)). The Commission may also designate models with equivalent capabilities or impact as GPAI with systemic risk under Art. 51(1)(b) based on criteria set out in Annex XIII.",
    articleReferences: ["Art. 51", "Art. 51(2)", "Art. 52", "Art. 55", "Annex XIII"],
    keywords: ["FLOPs", "floating point operations", "systemic risk", "GPAI", "general purpose AI", "10^25", "training compute", "threshold", "Art. 51"],
    lexbeamUrl: WISSEN.gpai,
    category: "gpai",
  },
  {
    id: "faq-22-fria-credit-scoring",
    question: "Do I need a FRIA for credit scoring?",
    answer:
      "Yes. If you are a deployer of an AI system used for creditworthiness evaluation or credit scoring of natural persons (Annex III(5)(b)), you must perform a Fundamental Rights Impact Assessment before putting the system into use (Art. 27). The obligation applies to bodies governed by public law, private entities providing public services, and explicitly to deployers of credit scoring and life/health insurance risk-and-pricing systems under Annex III(5)(b) and (c) respectively. The FRIA must describe the processes using the system, the period and frequency of use, the categories of affected natural persons, the specific risks of harm, the human oversight measures, and the measures to be taken if risks materialise. Results must be notified to the market surveillance authority and submitted via the template provided by the AI Office. An existing GDPR Art. 35 DPIA may be reused where relevant but does not replace the FRIA.",
    articleReferences: ["Art. 27", "Art. 26(9)", "Annex III(5)(b)", "Annex III(5)(c)"],
    keywords: ["FRIA", "fundamental rights", "credit scoring", "creditworthiness", "Art. 27", "credit", "loan", "essential services", "Annex III(5)"],
    lexbeamUrl: WISSEN.documentation,
    category: "fria",
  },
  {
    id: "faq-23-chatbot-disclosure",
    question: "Do AI chatbots need special disclosure or labelling?",
    answer:
      "Yes. Under Art. 50(1), providers must ensure that AI systems intended to interact directly with natural persons are designed and developed so that persons are informed they are interacting with an AI system, unless this is obvious from the circumstances and context of use. This means most customer service chatbots, virtual assistants, and conversational voice bots must tell users - clearly and at the start of the interaction - that they are talking to AI rather than a human. This is a limited-risk transparency obligation, not a high-risk classification. Chatbots that also generate synthetic content (e.g. AI-generated images or deep fakes) additionally trigger Art. 50(2) (machine-readable marking) and Art. 50(4) (deep fake disclosure).",
    articleReferences: ["Art. 50(1)", "Art. 50(2)", "Art. 50(4)"],
    keywords: ["chatbot", "chatbot disclosure", "virtual assistant", "conversational AI", "labelling", "transparency", "Art. 50", "customer service"],
    lexbeamUrl: WISSEN.classification,
    category: "transparency",
  },
  {
    id: "faq-24-minimal-risk-examples",
    question: "Is my spellchecker, spam filter, or recommender system subject to the EU AI Act?",
    answer:
      "For most minimal-risk AI systems - spell checkers, spam filters, product recommenders, inventory forecasting tools, dynamic pricing models, and similar - the EU AI Act imposes no specific obligations beyond the universal AI literacy requirement under Art. 4 (enforceable since 2 February 2025). Providers and deployers are encouraged to voluntarily adhere to codes of conduct under Art. 95 but are not legally required to. General product safety, consumer protection, and data protection laws still apply. The main exception is if the tool falls into Annex III (e.g. a 'recommender' that is actually used for employment screening is high-risk under Annex III(4) regardless of the label).",
    articleReferences: ["Art. 4", "Art. 6(1)", "Art. 95"],
    keywords: ["minimal risk", "spellchecker", "spell check", "spam filter", "recommender", "recommendation", "not high risk", "exempt", "AI literacy"],
    lexbeamUrl: WISSEN.classification,
    category: "classification",
  },
];
