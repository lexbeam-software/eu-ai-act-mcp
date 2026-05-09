/**
 * EU AI Act - Obligations by Role and Risk Category
 *
 * Source: Regulation (EU) 2024/1689
 */
// ---------------------------------------------------------------------------
// Provider Obligations - High-Risk AI Systems (Art. 9-17, 43, 47, 49)
// ---------------------------------------------------------------------------
export const providerHighRiskObligations = [
    {
        obligation: "Establish a risk management system",
        article: "Art. 9",
        deadline: "2026-08-02",
        details: "Implement and maintain a continuous, iterative risk management system throughout the AI system's lifecycle. Must identify, analyse, evaluate, and mitigate known and reasonably foreseeable risks. Testing must be performed against preliminarily defined metrics and probabilistic thresholds prior to placing on the market.",
        category: "risk_management",
    },
    {
        obligation: "Data governance and management",
        article: "Art. 10",
        deadline: "2026-08-02",
        details: "Training, validation, and testing datasets must be subject to appropriate data governance and management practices. Datasets must be relevant, sufficiently representative, and to the best extent possible free of errors and complete. Must consider possible biases and take appropriate measures to detect, prevent, and mitigate them.",
        category: "data_governance",
    },
    {
        obligation: "Technical documentation",
        article: "Art. 11",
        deadline: "2026-08-02",
        details: "Draw up technical documentation before the system is placed on the market or put into service. Documentation must demonstrate compliance with high-risk requirements and provide sufficient information for authorities to assess compliance. Must contain at minimum the elements set out in Annex IV.",
        category: "documentation",
    },
    {
        obligation: "Record-keeping (logging)",
        article: "Art. 12",
        deadline: "2026-08-02",
        details: "High-risk AI systems must allow for automatic recording of events (logs) throughout the system's lifetime. Logging must enable monitoring of operation and traceability of the system's functioning. Logs must be kept for an appropriate period, at minimum 6 months unless otherwise provided.",
        category: "documentation",
    },
    {
        obligation: "Transparency and provision of information to deployers",
        article: "Art. 13",
        deadline: "2026-08-02",
        details: "Design and develop high-risk AI systems to ensure sufficiently transparent operation for deployers. Provide instructions for use including the provider's identity, system characteristics, performance metrics, known limitations, human oversight measures, expected lifetime, and maintenance requirements.",
        category: "transparency",
    },
    {
        obligation: "Human oversight measures",
        article: "Art. 14",
        deadline: "2026-08-02",
        details: "Design and develop high-risk AI systems enabling effective human oversight during use. Oversight measures must enable the individual to fully understand the system's capacities and limitations, monitor operation, interpret outputs, decide not to use or override the system, and intervene or interrupt via a 'stop' button or similar procedure.",
        category: "human_oversight",
    },
    {
        obligation: "Accuracy, robustness, and cybersecurity",
        article: "Art. 15",
        deadline: "2026-08-02",
        details: "High-risk AI systems must achieve an appropriate level of accuracy, robustness, and cybersecurity throughout their lifecycle. Accuracy levels and metrics must be declared in instructions for use. Systems must be resilient against errors, faults, inconsistencies, and attempts by unauthorised third parties to alter use or performance.",
        category: "technical_requirements",
    },
    {
        obligation: "Quality management system",
        article: "Art. 17",
        deadline: "2026-08-02",
        details: "Put in place a quality management system ensuring compliance with the Regulation. Must include a strategy for regulatory compliance, design and development techniques, quality control procedures, examination, testing, and validation procedures, technical specifications including standards, data management systems, risk management system, post-market monitoring, and incident reporting.",
        category: "quality_management",
    },
    {
        obligation: "Conformity assessment",
        article: "Art. 43",
        deadline: "2026-08-02",
        details: "Undergo a conformity assessment procedure before placing the system on the market. For systems listed in Annex III (except biometrics and critical infrastructure), internal control under Annex VI is sufficient. For biometrics in Annex III(1) and certain critical infrastructure, involvement of a notified body is required. Systems covered by Union harmonisation legislation in Annex I follow that legislation's assessment procedure.",
        category: "conformity_assessment",
    },
    {
        obligation: "EU Declaration of Conformity",
        article: "Art. 47",
        deadline: "2026-08-02",
        details: "Draw up an EU declaration of conformity for each high-risk AI system. Must contain the information in Annex V, be translated into the languages required by Member States, and be kept up to date. By drawing up the declaration, the provider takes responsibility for compliance.",
        category: "conformity_assessment",
    },
    {
        obligation: "Registration in the EU database",
        article: "Art. 49",
        deadline: "2026-08-02",
        details: "Before placing a high-risk AI system on the market or putting it into service, the provider (or authorised representative) must register the system and themselves in the EU database referred to in Art. 71. Providers relying on Art. 6(3) exceptions must also register in that database.",
        category: "registration",
    },
    {
        obligation: "Post-market monitoring",
        article: "Art. 72",
        deadline: "2026-08-02",
        details: "Establish and document a post-market monitoring system proportionate to the nature of the AI system. Must actively and systematically collect, document, and analyse relevant data on performance throughout the system's lifetime. The system must be based on a post-market monitoring plan as part of the technical documentation under Annex IV.",
        category: "post_market",
    },
    {
        obligation: "Reporting serious incidents",
        article: "Art. 73",
        deadline: "2026-08-02",
        details: "Report any serious incident to the market surveillance authorities of the Member States where the incident occurred. Report immediately after establishing a causal link or reasonable likelihood, and no later than 15 days after becoming aware. Must include all necessary information for authorities to investigate.",
        category: "incident_reporting",
    },
];
// ---------------------------------------------------------------------------
// Deployer Obligations - High-Risk AI Systems (Art. 26-27)
// ---------------------------------------------------------------------------
export const deployerHighRiskObligations = [
    {
        obligation: "Use in accordance with instructions",
        article: "Art. 26(1)",
        deadline: "2026-08-02",
        details: "Take appropriate technical and organisational measures to ensure high-risk AI systems are used in accordance with the instructions for use accompanying the system.",
        category: "operational",
    },
    {
        obligation: "Assign human oversight to competent persons",
        article: "Art. 26(2)",
        deadline: "2026-08-02",
        details: "Assign human oversight to natural persons who have the necessary competence, training, and authority, as well as the necessary support. The persons assigned must be able to properly understand the relevant capacities and limitations of the AI system.",
        category: "human_oversight",
    },
    {
        obligation: "Ensure input data relevance",
        article: "Art. 26(4)",
        deadline: "2026-08-02",
        details: "To the extent the deployer exercises control over the input data, ensure that input data is relevant and sufficiently representative in view of the intended purpose of the high-risk AI system.",
        category: "data_governance",
    },
    {
        obligation: "Monitor operation and report",
        article: "Art. 26(5)",
        deadline: "2026-08-02",
        details: "Monitor the operation of the high-risk AI system on the basis of the instructions for use, and inform the provider or distributor of any serious incident or malfunction. Keep logs automatically generated by the system for a period appropriate to the intended purpose, at least 6 months.",
        category: "monitoring",
    },
    {
        obligation: "Data Protection Impact Assessment (DPIA)",
        article: "Art. 26(9)",
        deadline: "2026-08-02",
        details: "Use the information provided by the provider under Art. 13 to carry out a Data Protection Impact Assessment where required under Art. 35 of the GDPR or Art. 27 of the LED.",
        category: "data_protection",
    },
    {
        obligation: "Fundamental Rights Impact Assessment (FRIA)",
        article: "Art. 27",
        deadline: "2026-08-02",
        details: "Before putting a high-risk AI system into use (with the exception of systems under Annex III point 2 critical infrastructure), deployers that are bodies governed by public law, private entities providing public services, or deployers of systems under Annex III points 5(b) (creditworthiness or credit scoring of natural persons) and 5(c) (risk assessment and pricing for life and health insurance) must perform an assessment of the system's impact on fundamental rights. Must notify the market surveillance authority of the result and submit the FRIA via the EU database.",
        category: "fundamental_rights",
    },
    {
        obligation: "Inform natural persons of high-risk AI use",
        article: "Art. 26(7)",
        deadline: "2026-08-02",
        details: "Deployers using high-risk AI systems for making decisions or assisting in decisions relating to natural persons must inform those persons that they are subject to the use of a high-risk AI system. For systems in Annex III(4) (employment) this includes informing workers' representatives and affected workers.",
        category: "transparency",
    },
    {
        obligation: "Inform affected persons of AI-assisted decisions",
        article: "Art. 26(11)",
        deadline: "2026-08-02",
        details: "Deployers using high-risk AI systems to make or assist decisions about natural persons must, upon request, provide clear and meaningful explanations of the role of the AI system in the decision-making procedure and the main elements of the decision taken.",
        category: "transparency",
    },
];
// ---------------------------------------------------------------------------
// Provider Obligations - General-Purpose AI Models (Art. 51-56)
// ---------------------------------------------------------------------------
export const providerGPAIObligations = [
    {
        obligation: "Technical documentation for GPAI models",
        article: "Art. 53(1)(a)",
        deadline: "2025-08-02",
        details: "Draw up and keep up to date technical documentation of the model, including training and testing process and results, which must contain at minimum the information set out in Annex XI. Documentation must be made available to the AI Office and national competent authorities upon request.",
        category: "documentation",
    },
    {
        obligation: "Information and documentation for downstream providers",
        article: "Art. 53(1)(b)",
        deadline: "2025-08-02",
        details: "Draw up, keep up to date, and make available information and documentation to providers of AI systems who intend to integrate the GPAI model. Must enable those providers to understand the model's capabilities and limitations and comply with their own obligations. At minimum, the information in Annex XII.",
        category: "documentation",
    },
    {
        obligation: "Copyright compliance policy",
        article: "Art. 53(1)(c)",
        deadline: "2025-08-02",
        details: "Put in place a policy to comply with Union copyright law, in particular to identify and comply with reservations of rights expressed pursuant to Art. 4(3) of Directive (EU) 2019/790 (the DSM Directive), including through state-of-the-art technologies.",
        category: "copyright",
    },
    {
        obligation: "Training data summary",
        article: "Art. 53(1)(d)",
        deadline: "2025-08-02",
        details: "Draw up and make publicly available a sufficiently detailed summary of the content used for training the GPAI model, according to a template provided by the AI Office.",
        category: "transparency",
    },
    {
        obligation: "Systemic risk GPAI - Model evaluation",
        article: "Art. 55(1)(a)",
        deadline: "2025-08-02",
        details: "Providers of GPAI models with systemic risk must perform model evaluation in accordance with standardised protocols and tools, including conducting and documenting adversarial testing to identify and mitigate systemic risk.",
        category: "risk_management",
    },
    {
        obligation: "Systemic risk GPAI - Risk assessment and mitigation",
        article: "Art. 55(1)(b)",
        deadline: "2025-08-02",
        details: "Assess and mitigate possible systemic risks at Union level, including their sources, that may stem from the development, placing on the market, or use of GPAI models with systemic risk.",
        category: "risk_management",
    },
    {
        obligation: "Systemic risk GPAI - Incident tracking and reporting",
        article: "Art. 55(1)(c)",
        deadline: "2025-08-02",
        details: "Keep track of, document, and report to the AI Office and relevant national competent authorities, without undue delay, serious incidents and possible corrective measures to address them.",
        category: "incident_reporting",
    },
    {
        obligation: "Systemic risk GPAI - Adequate cybersecurity",
        article: "Art. 55(1)(d)",
        deadline: "2025-08-02",
        details: "Ensure an adequate level of cybersecurity protection for the GPAI model with systemic risk and the physical infrastructure of the model.",
        category: "technical_requirements",
    },
];
// ---------------------------------------------------------------------------
// Limited Risk - Transparency Obligations (Art. 50)
// ---------------------------------------------------------------------------
export const limitedRiskTransparencyObligations = [
    {
        obligation: "Disclose AI interaction to users",
        article: "Art. 50(1)",
        deadline: "2026-08-02",
        details: "Providers of AI systems intended to interact directly with natural persons must ensure those persons are informed they are interacting with an AI system, unless this is obvious from the circumstances. This applies to chatbots, virtual assistants, and all conversational AI interfaces.",
        category: "transparency",
    },
    {
        obligation: "Inform persons exposed to emotion recognition or biometric categorisation",
        article: "Art. 50(3)",
        deadline: "2026-08-02",
        details: "Providers of emotion recognition or biometric categorisation systems must inform exposed natural persons of the system's operation and process personal data in accordance with the GDPR, LED, and Regulation (EU) 2018/1725 as applicable.",
        category: "transparency",
    },
    {
        obligation: "Label deep fakes and synthetic content",
        article: "Art. 50(4)",
        deadline: "2026-08-02",
        details: "Providers of AI systems generating or manipulating image, audio, or video content (deep fakes) must disclose that content has been artificially generated or manipulated. Deployers must also label such content. AI-generated text on matters of public interest must be labelled as artificially generated, unless editorially reviewed by a human.",
        category: "transparency",
    },
    {
        obligation: "Machine-readable marking of AI-generated content",
        article: "Art. 50(2)",
        deadline: "2026-08-02",
        details: "Providers must mark AI-generated synthetic audio, image, video, or text content in a machine-readable format and ensure it is detectable as artificially generated or manipulated. Technical solutions must be effective, interoperable, robust, and reliable, considering the type of content and commonly used implementation methods and tools.",
        category: "transparency",
    },
];
// ---------------------------------------------------------------------------
// Universal Obligations - AI Literacy (Art. 4)
// ---------------------------------------------------------------------------
export const universalObligations = [
    {
        obligation: "Ensure AI literacy of staff and operators",
        article: "Art. 4",
        deadline: "2025-02-02",
        details: "Providers and deployers of AI systems must take measures to ensure, to their best extent, a sufficient level of AI literacy of their staff and other persons dealing with the operation and use of AI systems on their behalf. Must take into account the technical knowledge, experience, education, and training of the persons, as well as the context in which the AI systems are to be used and the persons or groups of persons on whom the AI systems are to be used.",
        category: "ai_literacy",
    },
];
//# sourceMappingURL=obligations.js.map