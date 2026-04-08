/**
 * EU AI Act — Annex IV: Technical Documentation requirements.
 *
 * Source: Regulation (EU) 2024/1689, Annex IV. Public-domain EU text under
 * Commission Decision 2011/833/EU.
 *
 * Nine items define the minimum technical documentation a provider of a
 * high-risk AI system must prepare before placing the system on the market
 * (Art. 11). SMEs may provide the same information in a simplified form.
 */

export interface AnnexIVItem {
  number: number;
  title: string;
  description: string;
  sub_items: string[];
  related_articles: string[];
}

export const annexIVItems: AnnexIVItem[] = [
  {
    number: 1,
    title: "General description of the AI system",
    description:
      "A general description of the AI system including its intended purpose, the person or entity placing it on the market, its version, how it interacts with or can be used to interact with hardware or software, and how it generates its outputs.",
    sub_items: [
      "Intended purpose, name of the provider, and version of the system",
      "How the system interacts with hardware or software (including other AI systems)",
      "Versions of relevant software or firmware and update requirements",
      "Description of all the forms in which the AI system is placed on the market or put into service",
      "Description of the hardware on which the AI system is intended to run",
      "Where the AI system is a component of products, photographs or illustrations showing external features, markings, and internal layout of those products",
      "Basic description of the user-interface provided to the deployer",
      "Instructions for use for the deployer and a basic description of the user-interface provided to the deployer where applicable",
    ],
    related_articles: ["Art. 11", "Art. 13"],
  },
  {
    number: 2,
    title: "Detailed description of the elements of the AI system and of the process for its development",
    description:
      "A detailed description of the elements of the AI system and of the process for its development, including: methods and steps performed, key design choices, main classification choices, training methodologies and techniques used, and where relevant, data requirements.",
    sub_items: [
      "Methods and steps performed for system development (pre-trained models, third-party tools, and how they were integrated)",
      "Design specifications: general logic of the system and algorithms, key design choices including rationale and assumptions",
      "Description of system architecture and how software components interoperate",
      "Data requirements: datasheets describing training, validation, and testing data (provenance, scope, main characteristics, data preparation, labelling)",
      "Assessment of human oversight measures required in accordance with Art. 14",
      "Pre-determined changes to the system and its performance, with technical solutions ensuring continuous compliance",
      "Validation and testing procedures used including information about validation and testing data and their main characteristics",
      "Metrics used to measure accuracy, robustness, and compliance with other relevant requirements",
      "Cybersecurity measures put in place",
    ],
    related_articles: ["Art. 10", "Art. 11", "Art. 14", "Art. 15"],
  },
  {
    number: 3,
    title: "Monitoring, functioning, and control of the AI system",
    description:
      "Detailed information about the monitoring, functioning, and control of the AI system, in particular with regard to its capabilities and limitations in performance, expected levels of accuracy, foreseeable unintended outcomes, and specific risks.",
    sub_items: [
      "Expected accuracy for specific persons or groups of persons on which the system is intended to be used",
      "Overall expected level of accuracy in relation to its intended purpose",
      "Foreseeable unintended outcomes and sources of risk to health and safety, fundamental rights, and discrimination",
      "Human oversight measures adopted in accordance with Art. 14 and technical measures to facilitate interpretation of outputs by deployers",
      "Specifications on input data as appropriate",
    ],
    related_articles: ["Art. 13", "Art. 14", "Art. 15"],
  },
  {
    number: 4,
    title: "Description of the appropriateness of the performance metrics",
    description:
      "A description of the appropriateness of the performance metrics for the specific AI system.",
    sub_items: [
      "Metrics used to evaluate system performance",
      "Justification of why metrics are appropriate for the intended purpose",
      "Thresholds and acceptable performance ranges",
    ],
    related_articles: ["Art. 15"],
  },
  {
    number: 5,
    title: "Risk management system",
    description:
      "A detailed description of the risk management system in accordance with Art. 9.",
    sub_items: [
      "Identification and analysis of known and reasonably foreseeable risks",
      "Estimation and evaluation of risks under intended use and foreseeable misuse",
      "Evaluation of risks emerging from post-market monitoring data",
      "Adoption of appropriate targeted risk management measures",
      "Testing procedures against preliminarily defined metrics",
    ],
    related_articles: ["Art. 9"],
  },
  {
    number: 6,
    title: "Relevant changes made by the provider through the lifecycle",
    description:
      "A description of relevant changes made by the provider to the system through its lifecycle.",
    sub_items: [
      "Log of substantive changes to the system after placing on the market",
      "Impact assessment of changes on conformity",
      "Version history and rationale for updates",
    ],
    related_articles: ["Art. 16", "Art. 43"],
  },
  {
    number: 7,
    title: "Harmonised standards and common specifications applied",
    description:
      "A list of the harmonised standards applied in full or in part, the references of which have been published in the Official Journal of the EU; where no such harmonised standards have been applied, a detailed description of the solutions adopted to meet the requirements set out in Chapter III Section 2, including a list of other relevant standards and technical specifications applied.",
    sub_items: [
      "List of harmonised standards applied in full or in part",
      "Where harmonised standards not used, detailed description of solutions adopted",
      "List of other relevant standards and technical specifications used",
    ],
    related_articles: ["Art. 40", "Art. 41"],
  },
  {
    number: 8,
    title: "Copy of the EU declaration of conformity",
    description:
      "A copy of the EU declaration of conformity referred to in Art. 47.",
    sub_items: [
      "Signed EU declaration of conformity",
      "References to applicable harmonised standards",
      "Information set out in Annex V",
    ],
    related_articles: ["Art. 47"],
  },
  {
    number: 9,
    title: "Post-market monitoring plan",
    description:
      "A detailed description of the system in place to evaluate the AI system performance in the post-market phase in accordance with Art. 72, including the post-market monitoring plan referred to in Art. 72(3).",
    sub_items: [
      "Methods and protocols to collect, document, and analyse performance data throughout the system lifetime",
      "Processes for analysing serious incident reports as referred to in Art. 73",
      "Procedures for corrective actions based on post-market findings",
      "Plan for proactive monitoring versus reactive post-incident analysis",
    ],
    related_articles: ["Art. 72", "Art. 73"],
  },
];
