/**
 * EU AI Act - Article text corpus.
 *
 * Source: Regulation (EU) 2024/1689 of the European Parliament and of the
 * Council of 13 June 2024 (the "EU AI Act"), as amended by Regulation (EU)
 * 2026/1744. EUR-Lex content is reused under the conditions of Commission
 * Decision 2011/833/EU: preserve attribution, do not distort the meaning.
 *
 * Every entry includes a stable EUR-Lex URL to the consolidated version
 * (CELEX: 02024R1689-20260727) so callers can always jump to the source. Article text here is a condensed
 * operational summary of the most-cited articles - not a verbatim reproduction
 * of the full regulation - suitable for first-pass agent grounding. For
 * definitive wording agents should follow the eurlex_url.
 */

export interface ArticleEntry {
  number: string;
  title: string;
  summary: string;
  eurlex_url: string;
  related_annexes: string[];
}

// Deep links point at the CONSOLIDATED text as amended by Reg. (EU) 2026/1744,
// not the original act: following a citation must show the same law the summary
// states (the original act still reads "2 August 2027" at Art. 113). The
// consolidated version is a documentation tool without legal effect; authentic
// OJ acts are the legal authority.
const CELEX = "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:02024R1689-20260727";

function anchor(article: string): string {
  // The consolidated HTML uses art_N (incl. letter suffixes like art_4a) as anchor IDs.
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
      "Providers and deployers of AI systems must take measures to SUPPORT THE DEVELOPMENT of AI literacy of their staff and other persons dealing with the operation and use of AI systems on their behalf, taking into account their technical knowledge, experience, education and training, the context the AI systems are to be used in, and the persons or groups on whom the AI systems are to be used. Art. 4 was REPLACED by Regulation (EU) 2026/1744 with effect from 27 July 2026: the duty is one of supporting development and it expressly does NOT require providers or deployers to guarantee any specific level of AI literacy of any individual. New Art. 4(2) obliges the Commission and the Member States to support and facilitate that effort, in particular for SMEs, with practical compliance examples to be published on the single information platform. Applicable since 2 February 2025 in its original form.",
    eurlex_url: anchor("4"),
    related_annexes: [],
  },
  {
    number: "4a",
    title: "Processing of special categories of personal data for bias detection and correction",
    summary:
      "Inserted by the Digital Omnibus (Reg. (EU) 2026/1744, in force 27 July 2026), replacing the deleted Art. 10(5). Art. 4a(1): to the extent strictly necessary to ensure bias detection and correction in high-risk AI systems in accordance with Art. 10(2)(f) and (g), providers may exceptionally process special categories of personal data, subject to appropriate safeguards for the fundamental rights and freedoms of natural persons. The safeguards sit on top of Regulations (EU) 2016/679 and (EU) 2018/1725 and Directive (EU) 2016/680 and include conditions on necessity (bias detection cannot be effectively fulfilled with synthetic or anonymised data), technical limits on re-use, security and documentation, non-transmission to other parties, and deletion once the bias is corrected or the data reaches the end of its retention period. Art. 4a(2) extends the route to providers and deployers of OTHER AI systems and models and to deployers of high-risk systems, but only where processing is strictly necessary against biases likely to affect health and safety, negatively impact fundamental rights or lead to prohibited discrimination, with all paragraph-1 safeguards applied. The article does not create any obligation to conduct bias detection and correction.",
    eurlex_url: anchor("4a"),
    related_annexes: [],
  },
  {
    number: "5",
    title: "Prohibited AI practices",
    summary:
      "Prohibits the placing on the market, putting into service, and use of AI systems that: (a) deploy subliminal, manipulative, or deceptive techniques materially distorting behaviour and causing significant harm; (b) exploit vulnerabilities due to age, disability, or social/economic situation; (c) perform social scoring of natural persons or groups leading to detrimental treatment in unrelated contexts or unjustified/disproportionate treatment; (d) assess risk of criminal offences based solely on profiling or personality traits; (e) create or expand facial recognition databases via untargeted scraping of internet or CCTV images; (f) infer emotions in workplaces or educational institutions (except medical or safety exceptions); (g) use biometric categorisation to infer race, political opinions, trade union membership, religion, sex life, or sexual orientation; (h) use real-time remote biometric identification in publicly accessible spaces for law enforcement (with narrow exceptions under Art. 5(2)-(4)). Points (a)-(h) applicable since 2 February 2025. The Digital Omnibus (Reg. (EU) 2026/1744) added two prohibitions applying from 2 December 2026: (ba) generating or manipulating realistic intimate or sexually explicit material of an identifiable person without their freely given, specific, informed, unambiguous and explicit consent; and (bb) generating or manipulating child sexual abuse material within the meaning of Art. 2(c) and (e) of Directive 2011/93/EU, except where a 'without right' defence applies under national law. Art. 5(1a) qualifies BOTH new points: placing on the market or putting into service is prohibited only where the generation is the intended purpose, or a reasonably foreseeable and reproducible outcome absent adequate safeguards; use is prohibited only where the deployer uses the system for that purpose. Art. 5(1b) qualifies point (ba) ONLY: manipulation that does not increase the exposure of depicted intimate parts or alter the nature of depicted sexually explicit activities does not constitute manipulation.",
    eurlex_url: anchor("5"),
    related_annexes: [],
  },
  {
    number: "6",
    title: "Classification rules for high-risk AI systems",
    summary:
      "Art. 6(1): AI systems are high-risk if they are intended to be used as a safety component of a product, or are themselves such a product, covered by EU harmonisation legislation listed in Annex I, and are required to undergo a third-party conformity assessment. The Digital Omnibus narrowed this: Art. 6(1a) excludes systems solely used for non-safety aspects of user assistance, performance optimisation, service efficiency, automation, convenience or quality control from qualifying as safety components; Art. 6(1b) pulls systems back in where failure or malfunctioning would endanger health and safety; and Art. 6(1c) provides that a third-party conformity assessment required solely for risks other than health and safety (e.g. radio spectrum or electromagnetic interference) does not fulfil the Art. 6(1)(b) condition. Art. 6(2): AI systems referred to in Annex III are also high-risk. Art. 6(3): An Annex III AI system is NOT high-risk if it does not pose a significant risk of harm to health, safety, or fundamental rights, including by not materially influencing the outcome of decision-making. This exception applies when the system: (a) performs a narrow procedural task; (b) improves the result of a previously completed human activity; (c) detects decision-making patterns without replacing or influencing human assessment without proper review; or (d) performs a preparatory task. The exception does NOT apply if the system performs profiling of natural persons. Art. 6(4): Providers relying on Art. 6(3) must document the assessment and register in the EU database under Art. 49(2).",
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
      "High-risk AI systems that make use of techniques involving the training of AI models with data must be developed on the basis of training, validation, and testing datasets that meet quality criteria. Datasets must be subject to appropriate data governance and management practices, be relevant, sufficiently representative, and to the best extent possible, free of errors and complete in view of the intended purpose. Possible biases must be considered and mitigated (Art. 10(2)(f)-(g)). The former Art. 10(5), which conditioned the processing of special categories of personal data for bias detection and correction, was deleted by the Digital Omnibus (Reg. (EU) 2026/1744); those conditions now live in Art. 4a, which Art. 10 cross-references.",
    eurlex_url: anchor("10"),
    related_annexes: [],
  },
  {
    number: "11",
    title: "Technical documentation",
    summary:
      "Before a high-risk AI system is placed on the market or put into service, technical documentation must be drawn up and kept up to date. Documentation must demonstrate that the system complies with the requirements set out in Chapter III Section 2 and provide national competent authorities and notified bodies with all information necessary to assess compliance. At minimum, documentation must contain the elements set out in Annex IV. Under Article 11(1), SMEs, including start-ups, and SMCs may provide the Annex IV elements in a simplified manner only by using the Commission form referred to in that paragraph.",
    eurlex_url: anchor("11"),
    related_annexes: ["Annex IV"],
  },
  {
    number: "12",
    title: "Record-keeping",
    summary:
      "High-risk AI systems must technically allow for the automatic recording of events (logs) over the lifetime of the system. Logging capabilities must enable the recording of events relevant for identifying situations that may result in the AI system presenting a risk within the meaning of Art. 79(1), for facilitating post-market monitoring under Art. 72, and for monitoring the operation of high-risk AI systems referred to in Art. 26(5). Retention of automatically generated logs is dealt with separately for providers in Art. 19 and for deployers in Art. 26(6).",
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
      "Deployers of high-risk AI systems must: take appropriate technical and organisational measures to ensure use in accordance with the instructions for use; assign human oversight to natural persons with the necessary competence, training, authority, and support; ensure input data is relevant and sufficiently representative; monitor operation and, where Art. 26(5) requires, notify the provider or distributor and the relevant market surveillance authority and suspend use; report serious incidents through the provider/importer/distributor and market surveillance authority chain; keep automatically generated logs under their control for at least six months unless applicable law provides otherwise; where the deployer is an employer, inform workers' representatives and affected workers before workplace use; inform natural persons subject to qualifying Annex III high-risk AI use under Art. 26(11); complete a data protection impact assessment where required; and cooperate with competent authorities.",
    eurlex_url: anchor("26"),
    related_annexes: [],
  },
  {
    number: "27",
    title: "Fundamental rights impact assessment (FRIA) for high-risk AI systems",
    summary:
      "Before putting a high-risk AI system referred to in Art. 6(2) into use, with the exception of systems used in areas of critical infrastructure (Annex III point 2), deployers that are bodies governed by public law, private entities providing public services, or deployers of systems used for creditworthiness or credit scoring of natural persons (Annex III(5)(b)) or risk assessment and pricing for life and health insurance (Annex III(5)(c)) must perform an assessment of the impact on fundamental rights. The FRIA must describe: the deployer's processes using the system; the period and frequency of use; the categories of natural persons and groups likely to be affected; the specific risks of harm; the implementation of human oversight measures; and the measures to be taken if those risks materialise. Results must be notified to the market surveillance authority and submitted through the template provided by the AI Office.",
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
      "Before placing on the market or putting into service a high-risk AI system listed in Annex III (except point 2), the provider or authorised representative must register themselves and their system in the EU database referred to in Art. 71. Providers that conclude, under Art. 6(3), that a system listed in Annex III is not high-risk must nonetheless register themselves and the system in the EU database under Art. 49(2). Deployers that are public authorities, Union institutions, bodies, offices, or agencies - or persons acting on their behalf - must register themselves, select the system, and register its use.",
    eurlex_url: anchor("49"),
    related_annexes: ["Annex III", "Annex VIII"],
  },
  {
    number: "50",
    title: "Transparency obligations for providers and deployers of certain AI systems",
    summary:
      "Art. 50(1): Providers must ensure that AI systems intended to interact directly with natural persons are designed so that persons concerned are informed they are interacting with an AI system, unless this is obvious to a reasonably well-informed, observant and circumspect person, taking into account the circumstances and the context of use. Art. 50(2): Providers of AI systems generating synthetic audio, image, video, or text content must ensure outputs are marked in a machine-readable format and detectable as artificially generated or manipulated. Art. 50(3): Deployers of emotion recognition or biometric categorisation systems must inform natural persons exposed to the system. Art. 50(4): Deployers of AI systems generating deep fakes must disclose that the content has been artificially generated or manipulated. Deployers of AI systems generating or manipulating text published to inform the public on matters of public interest must disclose that the text is artificially generated or manipulated, unless the content has undergone a process of human review or editorial control and a natural or legal person holds editorial responsibility for its publication. Each paragraph carves out certain uses that the law authorises or permits for detecting, preventing, investigating or prosecuting criminal offences. Art. 50(2) also does not apply to the extent a system performs an assistive function for standard editing or does not substantially alter the input data or its semantics, and for evidently artistic, creative, satirical, fictional or analogous works Art. 50(4) limits the deep-fake duty to disclosing the existence of the generated or manipulated content in an appropriate manner that does not hamper the display or enjoyment of the work.",
    eurlex_url: anchor("50"),
    related_annexes: [],
  },
  {
    number: "51",
    title: "Classification of general-purpose AI models as models with systemic risk",
    summary:
      "A general-purpose AI model is classified as a GPAI model with systemic risk if it has high-impact capabilities evaluated on the basis of appropriate technical tools and methodologies, or if the Commission decides (ex officio or following a qualified alert from the scientific panel) that the model has capabilities or an impact equivalent to the former. A GPAI model is presumed to have high-impact capabilities when the cumulative amount of computation used for its training measured in floating point operations (FLOPs) is greater than 10^25. Under the procedure in Art. 52, providers must notify the Commission without delay and within two weeks when their model meets or will meet the Art. 51(1)(a) condition.",
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
      "Providers of high-risk AI systems placed on the Union market must report any serious incident to the market surveillance authorities of the Member States where that incident occurred. Reporting must be made immediately after the provider has established a causal link between the AI system and the serious incident or the reasonable likelihood of such a link, and, in any event, no later than 15 days after becoming aware. For a widespread infringement or a serious incident involving serious and irreversible disruption of the management or operation of critical infrastructure under Art. 3(49)(b), reporting must occur immediately and no later than 2 days after awareness. For death of a person the period is 10 days. Following a report, the provider must investigate, take corrective action, and cooperate with the competent authorities and, where relevant, the notified body under Article 73(6). Deployers have the separate Article 26(12) duty to cooperate with relevant competent authorities in actions concerning the high-risk system.",
    eurlex_url: anchor("73"),
    related_annexes: [],
  },
  {
    number: "99",
    title: "Penalties",
    summary:
      "Art. 99(3): Non-compliance with the prohibition of the AI practices referred to in Art. 5 is subject to administrative fines of up to EUR 35,000,000 or, if the offender is an undertaking, up to 7% of total worldwide annual turnover for the preceding financial year, whichever is higher. Art. 99(4): Non-compliance with the listed operator, notified-body, and Art. 50 transparency obligations is subject to fines of up to EUR 15,000,000 or 3% of total worldwide annual turnover, whichever is higher. Art. 99(5): The supply of incorrect, incomplete, or misleading information to notified bodies and national competent authorities is subject to fines of up to EUR 7,500,000 or 1% of turnover, whichever is higher. The Art. 99(4) list includes the new point (da), obligations of providers and operators under Art. 25(2) and (4), added by the Digital Omnibus. Art. 99(6): For SMEs, including start-ups, each fine referred to in paragraphs 3, 4 and 5 is up to the percentages or amount referred to, whichever is lower. Art. 99(6a): For SMCs (small mid-caps), the same lower-of rule applies to the paragraph 4 and 5 fines only, not to paragraph 3. Fines for providers of general-purpose AI models are governed separately by Art. 101.",
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
      "The Regulation entered into force on 1 August 2024 (20 days after publication in the Official Journal on 12 July 2024). The general date of application is 2 August 2026. By way of derogation: (a) Chapters I (general provisions) and II (prohibited practices) apply from 2 February 2025, except the new Art. 5(1)(ba) and (bb) and Art. 5(1a) and (1b), which apply from 2 December 2026; (b) Chapter III Section 4 (notifying authorities and notified bodies), Chapter V (general-purpose AI models), Chapter VII (governance), Chapter XII (penalties) except Art. 101, and Art. 78 apply from 2 August 2025; (c) Chapter III Sections 1, 2 and 3 (the high-risk requirements and obligations), except Art. 6(5), apply from 2 December 2027 for systems classified as high-risk under Art. 6(2) and Annex III, and from 2 August 2028 for systems classified as high-risk under Art. 6(1) and Annex I; (d) Articles 102 to 110 apply from 27 July 2026. Points (a), (c) and (d) reflect the amendments made by the Digital Omnibus on AI (Regulation (EU) 2026/1744, in force 27 July 2026), which deferred the high-risk dates from 2 August 2026 and 2 August 2027 respectively. Point (b) and the general 2 August 2026 date were not amended, so Art. 50 transparency and the Commission's GPAI enforcement powers and fines are unaffected; the legacy GPAI compliance date of 2 August 2027 sits in Art. 111(3).",
    eurlex_url: anchor("113"),
    related_annexes: [],
  },
];

export function findArticle(query: string): ArticleEntry | null {
  const normalized = query.trim().toLowerCase().replace(/^(?:article|artikel|art)\.?\s*(?=\d)/, "");
  return articles.find((a) => a.number.toLowerCase() === normalized) ?? null;
}

export const EURLEX_BASE_URL = CELEX;
