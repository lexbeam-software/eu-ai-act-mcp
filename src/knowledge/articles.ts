/**
 * EU AI Act — Article text corpus.
 *
 * Source: Regulation (EU) 2024/1689 of the European Parliament and of the
 * Council of 13 June 2024 (the "EU AI Act"). Published in the Official Journal
 * of the EU on 12 July 2024. The text of EU legislation is in the public
 * domain under Commission Decision 2011/833/EU and is freely reproducible.
 *
 * Every entry includes a stable EUR-Lex URL (CELEX: 32024R1689) so callers
 * can always jump to the canonical source. Article text here is a condensed
 * operational summary of the most-cited articles — not a verbatim reproduction
 * of the full regulation — suitable for first-pass agent grounding. For
 * definitive wording agents should follow the eurlex_url.
 */

export interface ArticleEntry {
  number: string;
  title: string;
  summary: string;
  eurlex_url: string;
  related_annexes: string[];
}

const CELEX = "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1689";

function anchor(article: string): string {
  // Best-effort EUR-Lex anchor. The consolidated HTML uses art_N as anchor IDs.
  return `${CELEX}#art_${article.replace(/\./g, "_")}`;
}

export const articles: ArticleEntry[] = [
  {
    number: "3",
    title: "Definitions",
    summary:
      "Defines key terms used throughout the regulation, including 'AI system', 'provider', 'deployer', 'general-purpose AI model', 'importer', 'distributor', 'serious incident', 'biometric data', 'remote biometric identification', 'emotion recognition system', and 'deep fake'. An 'AI system' is a machine-based system designed to operate with varying levels of autonomy, that may exhibit adaptiveness after deployment, and that, for explicit or implicit objectives, infers from the input it receives how to generate outputs such as predictions, content, recommendations, or decisions that can influence physical or virtual environments.",
    eurlex_url: anchor("3"),
    related_annexes: [],
  },
  {
    number: "4",
    title: "AI literacy",
    summary:
      "Providers and deployers of AI systems must take measures to ensure, to their best extent, a sufficient level of AI literacy of their staff and other persons dealing with the operation and use of AI systems on their behalf. Measures must take into account technical knowledge, experience, education and training of the persons, the context of use, and the persons or groups on whom the AI systems are to be used. Enforceable since 2 February 2025.",
    eurlex_url: anchor("4"),
    related_annexes: [],
  },
  {
    number: "5",
    title: "Prohibited AI practices",
    summary:
      "Prohibits the placing on the market, putting into service, and use of AI systems that: (a) deploy subliminal, manipulative, or deceptive techniques materially distorting behaviour and causing significant harm; (b) exploit vulnerabilities due to age, disability, or social/economic situation; (c) perform social scoring by public authorities leading to detrimental treatment in unrelated contexts; (d) assess risk of criminal offences based solely on profiling or personality traits; (e) create or expand facial recognition databases via untargeted scraping of internet or CCTV images; (f) infer emotions in workplaces or educational institutions (except medical or safety exceptions); (g) use biometric categorisation to infer race, political opinions, trade union membership, religion, sex life, or sexual orientation; (h) use real-time remote biometric identification in publicly accessible spaces for law enforcement (with narrow exceptions under Art. 5(2)-(4)). Applicable since 2 February 2025.",
    eurlex_url: anchor("5"),
    related_annexes: [],
  },
  {
    number: "6",
    title: "Classification rules for high-risk AI systems",
    summary:
      "Art. 6(1): AI systems are high-risk if they are intended to be used as a safety component of a product, or are themselves such a product, covered by EU harmonisation legislation listed in Annex I, and are required to undergo a third-party conformity assessment. Art. 6(2): AI systems referred to in Annex III are also high-risk. Art. 6(3): An Annex III AI system is NOT high-risk if it does not pose a significant risk of harm to health, safety, or fundamental rights, including by not materially influencing the outcome of decision-making. This exception applies when the system: (a) performs a narrow procedural task; (b) improves the result of a previously completed human activity; (c) detects decision-making patterns without replacing or influencing human assessment without proper review; or (d) performs a preparatory task. The exception does NOT apply if the system performs profiling of natural persons. Art. 6(4): Providers relying on Art. 6(3) must document the assessment and register in the EU database under Art. 49(2).",
    eurlex_url: anchor("6"),
    related_annexes: ["Annex I", "Annex III"],
  },
  {
    number: "9",
    title: "Risk management system",
    summary:
      "Providers of high-risk AI systems must establish, implement, document, and maintain a risk management system as a continuous iterative process planned and run throughout the entire lifecycle of the AI system. The system must identify and analyse known and reasonably foreseeable risks, estimate and evaluate risks that may emerge when used as intended and under foreseeable misuse, and adopt appropriate targeted risk management measures. Testing must be performed against preliminarily defined metrics and probabilistic thresholds before placing on the market.",
    eurlex_url: anchor("9"),
    related_annexes: [],
  },
  {
    number: "10",
    title: "Data and data governance",
    summary:
      "High-risk AI systems that make use of techniques involving the training of AI models with data must be developed on the basis of training, validation, and testing datasets that meet quality criteria. Datasets must be subject to appropriate data governance and management practices, be relevant, sufficiently representative, and to the best extent possible, free of errors and complete in view of the intended purpose. Possible biases must be considered and mitigated. Special categories of personal data may be processed only where strictly necessary for bias detection and correction, subject to safeguards.",
    eurlex_url: anchor("10"),
    related_annexes: [],
  },
  {
    number: "11",
    title: "Technical documentation",
    summary:
      "Before a high-risk AI system is placed on the market or put into service, technical documentation must be drawn up and kept up to date. Documentation must demonstrate that the system complies with the requirements set out in Chapter III Section 2 and provide national competent authorities and notified bodies with all information necessary to assess compliance. At minimum, documentation must contain the elements set out in Annex IV. SMEs may provide the elements of Annex IV in a simplified manner — the Commission will establish a simplified template.",
    eurlex_url: anchor("11"),
    related_annexes: ["Annex IV"],
  },
  {
    number: "12",
    title: "Record-keeping",
    summary:
      "High-risk AI systems must technically allow for the automatic recording of events (logs) over the lifetime of the system. Logging capabilities must enable the recording of events relevant for identifying situations that may result in the AI system presenting a risk within the meaning of Art. 79(1), or for facilitating post-market monitoring under Art. 72. Logs must be kept for an appropriate period (at minimum six months, unless otherwise provided by applicable EU or national law).",
    eurlex_url: anchor("12"),
    related_annexes: [],
  },
  {
    number: "13",
    title: "Transparency and provision of information to deployers",
    summary:
      "High-risk AI systems must be designed and developed to ensure that their operation is sufficiently transparent to enable deployers to interpret the system's output and use it appropriately. Systems must be accompanied by instructions for use in an appropriate digital format including the identity and contact details of the provider, characteristics and limitations of the system, performance metrics, known or foreseeable circumstances that may lead to risks, human oversight measures, expected lifetime, and maintenance and care measures.",
    eurlex_url: anchor("13"),
    related_annexes: [],
  },
  {
    number: "14",
    title: "Human oversight",
    summary:
      "High-risk AI systems must be designed and developed in such a way, including with appropriate human-machine interface tools, that they can be effectively overseen by natural persons during the period in which they are in use. Human oversight must aim to prevent or minimise risks to health, safety, or fundamental rights. Oversight measures must enable the individual to understand the system's capacities and limitations, monitor operation, remain aware of possible automation bias, interpret outputs, decide not to use or override the system, and intervene or interrupt the system through a stop button or similar procedure.",
    eurlex_url: anchor("14"),
    related_annexes: [],
  },
  {
    number: "15",
    title: "Accuracy, robustness and cybersecurity",
    summary:
      "High-risk AI systems must be designed and developed in such a way that they achieve an appropriate level of accuracy, robustness, and cybersecurity, and that they perform consistently in those respects throughout their lifecycle. Accuracy levels and metrics must be declared in the instructions for use. Systems must be resilient as regards errors, faults, and inconsistencies, and must be resilient against attempts by unauthorised third parties to alter use, outputs, or performance by exploiting vulnerabilities.",
    eurlex_url: anchor("15"),
    related_annexes: [],
  },
  {
    number: "16",
    title: "Obligations of providers of high-risk AI systems",
    summary:
      "Providers of high-risk AI systems must: ensure the system complies with the requirements of Chapter III Section 2; indicate their name, registered trade name, and address; have a quality management system in place; keep the documentation; keep logs automatically generated by the system; ensure conformity assessment is undertaken; draw up an EU declaration of conformity; affix the CE marking; comply with registration obligations under Art. 49; take necessary corrective actions; and demonstrate conformity upon reasoned request.",
    eurlex_url: anchor("16"),
    related_annexes: [],
  },
  {
    number: "17",
    title: "Quality management system",
    summary:
      "Providers of high-risk AI systems must put in place a quality management system documented in written policies, procedures, and instructions. It must include at minimum: a strategy for regulatory compliance; techniques, procedures, and systematic actions for design, design control, and verification; examination, test, and validation procedures; technical specifications; systems and procedures for data management; the risk management system (Art. 9); post-market monitoring (Art. 72); procedures for serious incident reporting (Art. 73); handling communication with authorities; record-keeping; resource management; and an accountability framework.",
    eurlex_url: anchor("17"),
    related_annexes: [],
  },
  {
    number: "26",
    title: "Obligations of deployers of high-risk AI systems",
    summary:
      "Deployers of high-risk AI systems must: take appropriate technical and organisational measures to ensure use in accordance with the instructions for use; assign human oversight to natural persons with the necessary competence, training, authority, and support; ensure input data is relevant and sufficiently representative; monitor the operation and inform the provider if they identify a risk under Art. 79(1); keep logs automatically generated for at least six months; where the deployer is an employer, inform workers' representatives and affected workers; complete a data protection impact assessment where required; and cooperate with competent authorities.",
    eurlex_url: anchor("26"),
    related_annexes: [],
  },
  {
    number: "27",
    title: "Fundamental rights impact assessment (FRIA) for high-risk AI systems",
    summary:
      "Before putting a high-risk AI system referred to in Art. 6(2) into use — except for systems used in areas of critical infrastructure (Annex III point 2) — deployers that are bodies governed by public law, private entities providing public services, or deployers of systems used for creditworthiness (Annex III(5)(a)) or insurance risk/pricing (Annex III(5)(b)) must perform an assessment of the impact on fundamental rights. The FRIA must describe: the deployer's processes using the system; the period and frequency of use; the categories of natural persons and groups likely to be affected; the specific risks of harm; the implementation of human oversight measures; and the measures to be taken if those risks materialise. Results must be notified to the market surveillance authority and submitted through the template provided by the AI Office.",
    eurlex_url: anchor("27"),
    related_annexes: ["Annex III"],
  },
  {
    number: "43",
    title: "Conformity assessment",
    summary:
      "Providers of high-risk AI systems must undergo a conformity assessment procedure before placing the system on the market or putting it into service. For systems referred to in Annex III point 1 (biometrics), providers must follow the conformity assessment procedure based on internal control set out in Annex VI, or the procedure based on assessment of the quality management system and assessment of technical documentation with the involvement of a notified body set out in Annex VII. For systems referred to in Annex III points 2-8, providers must follow the procedure based on internal control (Annex VI). For systems covered by the Union harmonisation legislation listed in Annex I Section A, providers must follow the relevant sectoral conformity assessment procedure.",
    eurlex_url: anchor("43"),
    related_annexes: ["Annex VI", "Annex VII"],
  },
  {
    number: "47",
    title: "EU declaration of conformity",
    summary:
      "Providers must draw up a written machine-readable, physical, or electronically signed EU declaration of conformity for each high-risk AI system, and keep it at the disposal of national competent authorities for 10 years after the system has been placed on the market or put into service. The declaration must state that the high-risk AI system in question meets the requirements of Chapter III Section 2, and must contain the information set out in Annex V. It must be translated into languages required by the Member States in which the system is placed on the market or made available.",
    eurlex_url: anchor("47"),
    related_annexes: ["Annex V"],
  },
  {
    number: "49",
    title: "Registration in the EU database",
    summary:
      "Before placing on the market or putting into service a high-risk AI system listed in Annex III (except point 2), the provider or authorised representative must register themselves and their system in the EU database referred to in Art. 71. Providers that conclude, under Art. 6(3), that a system listed in Annex III is not high-risk must nonetheless register themselves and the system in the EU database under Art. 49(2). Deployers that are public authorities, Union institutions, bodies, offices, or agencies — or persons acting on their behalf — must register themselves, select the system, and register its use.",
    eurlex_url: anchor("49"),
    related_annexes: ["Annex III", "Annex VIII"],
  },
  {
    number: "50",
    title: "Transparency obligations for providers and deployers of certain AI systems",
    summary:
      "Art. 50(1): Providers must ensure that AI systems intended to interact directly with natural persons are designed so that persons concerned are informed they are interacting with an AI system, unless obvious from the circumstances. Art. 50(2): Providers of AI systems generating synthetic audio, image, video, or text content must ensure outputs are marked in a machine-readable format and detectable as artificially generated or manipulated. Art. 50(3): Deployers of emotion recognition or biometric categorisation systems must inform natural persons exposed to the system. Art. 50(4): Deployers of AI systems generating deep fakes must disclose that the content has been artificially generated or manipulated. Deployers of AI systems generating or manipulating text published to inform the public on matters of public interest must disclose the content is artificially generated — unless the content has undergone a process of human review or editorial control. Exceptions apply for law enforcement use.",
    eurlex_url: anchor("50"),
    related_annexes: [],
  },
  {
    number: "51",
    title: "Classification of general-purpose AI models as models with systemic risk",
    summary:
      "A general-purpose AI model is classified as a GPAI model with systemic risk if it has high-impact capabilities evaluated on the basis of appropriate technical tools and methodologies, or if the Commission decides (ex officio or following a qualified alert from the scientific panel) that the model has capabilities or an impact equivalent to the former. A GPAI model is presumed to have high-impact capabilities when the cumulative amount of computation used for its training measured in floating point operations (FLOPs) is greater than 10^25. Providers must notify the Commission when their model meets or will meet this condition within two weeks.",
    eurlex_url: anchor("51"),
    related_annexes: ["Annex XIII"],
  },
  {
    number: "53",
    title: "Obligations for providers of general-purpose AI models",
    summary:
      "Providers of GPAI models must: draw up and keep up-to-date technical documentation of the model, including its training and testing process, for provision to the AI Office and national competent authorities upon request (Annex XI); draw up, keep up-to-date, and make available information and documentation to providers of AI systems that intend to integrate the GPAI model into their AI systems (Annex XII); put in place a policy to comply with EU copyright law, including identifying and respecting reservations of rights expressed under Art. 4(3) of Directive (EU) 2019/790; and draw up and make publicly available a sufficiently detailed summary of the content used for training, according to a template provided by the AI Office.",
    eurlex_url: anchor("53"),
    related_annexes: ["Annex XI", "Annex XII"],
  },
  {
    number: "55",
    title: "Obligations for providers of general-purpose AI models with systemic risk",
    summary:
      "In addition to Art. 53, providers of GPAI models with systemic risk must: perform model evaluation in accordance with standardised protocols and tools reflecting the state of the art, including conducting and documenting adversarial testing of the model; assess and mitigate possible systemic risks at Union level, including their sources; keep track of, document, and report without undue delay to the AI Office and, as appropriate, to national competent authorities, relevant information about serious incidents and possible corrective measures; ensure an adequate level of cybersecurity protection for the GPAI model with systemic risk and for its physical infrastructure.",
    eurlex_url: anchor("55"),
    related_annexes: [],
  },
  {
    number: "72",
    title: "Post-market monitoring by providers and post-market monitoring plan for high-risk AI systems",
    summary:
      "Providers must establish and document a post-market monitoring system in a manner proportionate to the nature of the AI technologies and risks of the high-risk AI system. The system must actively and systematically collect, document, and analyse relevant data that may be provided by deployers or collected through other sources on the performance of high-risk AI systems throughout their lifetime, and allow the provider to evaluate continuous compliance with requirements. Where relevant, the system must include analysis of interaction with other AI systems. The monitoring must be based on a post-market monitoring plan that is part of the technical documentation (Annex IV).",
    eurlex_url: anchor("72"),
    related_annexes: ["Annex IV"],
  },
  {
    number: "73",
    title: "Reporting of serious incidents",
    summary:
      "Providers of high-risk AI systems placed on the Union market must report any serious incident to the market surveillance authorities of the Member States where that incident occurred. Reporting must be made immediately after the provider has established a causal link between the AI system and the serious incident or the reasonable likelihood of such a link, and, in any event, no later than 15 days after becoming aware. For incidents involving widespread infringement or affecting critical infrastructure, the reporting period is 2 days. For death of a person the period is 10 days. The provider and, where applicable, the deployer must cooperate with competent authorities and the Commission in any investigation.",
    eurlex_url: anchor("73"),
    related_annexes: [],
  },
  {
    number: "99",
    title: "Penalties",
    summary:
      "Art. 99(3): Non-compliance with the prohibition of the AI practices referred to in Art. 5 is subject to administrative fines of up to EUR 35,000,000 or, if the offender is an undertaking, up to 7% of total worldwide annual turnover for the preceding financial year, whichever is higher. Art. 99(4): Non-compliance with other provisions applicable to providers, deployers, notified bodies, or authorised representatives (high-risk obligations, GPAI obligations, transparency obligations, etc.) is subject to fines of up to EUR 15,000,000 or 3% of total worldwide annual turnover, whichever is higher. Art. 99(5): The supply of incorrect, incomplete, or misleading information to notified bodies and national competent authorities is subject to fines of up to EUR 7,500,000 or 1% of turnover, whichever is higher. Art. 99(6): For SMEs, including start-ups, each fine referred to in Art. 99 is up to the percentages or amount referred to, whichever is lower.",
    eurlex_url: anchor("99"),
    related_annexes: [],
  },
  {
    number: "100",
    title: "Administrative fines on Union institutions, bodies, offices, and agencies",
    summary:
      "The European Data Protection Supervisor (EDPS) may impose administrative fines on Union institutions, bodies, offices, and agencies falling within the scope of this Regulation. Non-compliance with the prohibition of the AI practices referred to in Art. 5 is subject to administrative fines of up to EUR 1,500,000. Non-compliance with other obligations under this Regulation is subject to administrative fines of up to EUR 750,000.",
    eurlex_url: anchor("100"),
    related_annexes: [],
  },
  {
    number: "113",
    title: "Entry into force and application",
    summary:
      "The Regulation entered into force on 1 August 2024 (20 days after publication in the Official Journal on 12 July 2024). It applies from 2 August 2026. By way of derogation: (a) Chapters I (general provisions) and II (prohibited practices) apply from 2 February 2025; (b) Chapter III Section 4 (notifying authorities and notified bodies), Chapter V (general-purpose AI models), Chapter VII (governance), Chapter XII (penalties) except Art. 101, and Art. 78 apply from 2 August 2025; (c) Art. 6(1) (high-risk Annex I regulated-product safety components) and the corresponding obligations apply from 2 August 2027.",
    eurlex_url: anchor("113"),
    related_annexes: [],
  },
];

export function findArticle(query: string): ArticleEntry | null {
  const normalized = query.trim().toLowerCase().replace(/^art(icle)?\.?\s*/, "");
  return articles.find((a) => a.number.toLowerCase() === normalized) ?? null;
}

export const EURLEX_BASE_URL = CELEX;
