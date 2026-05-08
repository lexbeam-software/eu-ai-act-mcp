import { friaTriggerInputSchema, friaTriggerOutputSchema, } from "../schemas/fria.js";
export function registerFriaTriggerTool(server) {
    server.registerTool("euaiact_assess_fria_trigger", {
        title: "Assess Art. 27 FRIA Trigger",
        description: "Assess whether an EU AI Act Art. 27 Fundamental Rights Impact Assessment (FRIA) is required or likely for a high-risk AI system. Checks high-risk status, Annex III context, deployer type, affected persons, DPIA interaction, and current-law/provisional timing.",
        annotations: {
            readOnlyHint: true,
            idempotentHint: true,
            openWorldHint: false,
        },
        inputSchema: friaTriggerInputSchema,
        outputSchema: friaTriggerOutputSchema,
    }, async (input) => {
        const missing = [];
        const factors = [];
        if (input.is_high_risk === undefined)
            missing.push("Confirm whether the system is high-risk under Art. 6 / Annex III.");
        if (!input.annex_iii_number)
            missing.push("Identify the Annex III category number, if applicable.");
        if (input.deployer_type === "unknown")
            missing.push("Confirm deployer type: public body, private public-service provider, creditworthiness/essential-service deployer, or other private entity.");
        if (input.affects_natural_persons === undefined)
            missing.push("Confirm whether the use affects natural persons or decisions about them.");
        if (input.is_high_risk)
            factors.push("System is treated as high-risk.");
        if (input.annex_iii_number)
            factors.push(`Annex III category ${input.annex_iii_number} provided.`);
        if (input.deployer_type === "public_body")
            factors.push("Deployer is a public body / body governed by public law.");
        if (input.deployer_type === "private_public_service")
            factors.push("Private deployer provides public services.");
        if (input.deployer_type === "private_creditworthiness")
            factors.push("Private deployer uses high-risk AI for creditworthiness / credit scoring context.");
        if (input.deployer_type === "private_essential_service")
            factors.push("Private deployer uses high-risk AI for essential private/public service access context.");
        if (input.affects_natural_persons)
            factors.push("Deployment affects natural persons.");
        const inScopeDeployer = ["public_body", "private_public_service", "private_creditworthiness", "private_essential_service"].includes(input.deployer_type);
        const highRisk = input.is_high_risk === true;
        const noHighRisk = input.is_high_risk === false;
        let friaRequired;
        let confidence;
        let reasoning;
        if (noHighRisk) {
            friaRequired = "no";
            confidence = "medium";
            reasoning = "Art. 27 FRIA is tied to high-risk AI systems. If the system is not high-risk, Art. 27 is not triggered on the provided facts.";
        }
        else if (highRisk && inScopeDeployer && input.affects_natural_persons !== false) {
            friaRequired = "yes";
            confidence = "high";
            reasoning = "Art. 27 FRIA is required before putting the high-risk AI system into use because the deployer type falls within the Art. 27 trigger set.";
        }
        else if (highRisk && input.deployer_type === "other_private") {
            friaRequired = "likely";
            confidence = "medium";
            reasoning = "The system is high-risk, but the provided deployer type is not one of the clearest Art. 27 trigger categories. Verify whether sector/use-specific triggers apply before concluding no FRIA is required.";
        }
        else {
            friaRequired = "insufficient_information";
            confidence = "low";
            reasoning = "Insufficient information to determine Art. 27 FRIA applicability. Confirm high-risk status, Annex III category, deployer type, and affected-person context.";
        }
        const output = {
            fria_required: friaRequired,
            confidence,
            reasoning,
            trigger_factors: factors,
            missing_information: missing,
            required_actions: [
                "Document high-risk classification and deployer role.",
                "Define the intended use, affected groups, frequency, and deployment context.",
                "Assess risks to fundamental rights and mitigation measures before go-live.",
                "Prepare authority notification where Art. 27 requires it.",
            ],
            notification_note: "Where Art. 27 applies, the deployer must notify the market surveillance authority of the FRIA result. Where data protection risks are involved, coordinate with the DPIA and competent data protection authority analysis.",
            dpia_interaction: input.already_has_dpia
                ? "A DPIA can provide evidence for parts of the FRIA, but it does not automatically replace the Art. 27 assessment."
                : "Check whether a GDPR/LED DPIA is also required. FRIA and DPIA overlap but answer different legal questions.",
            deadline: {
                current_law_date: "2026-08-02",
                provisional_date_if_adopted: "2027-12-02",
                binding_status: "current_law",
                status_note: "Art. 27 follows Annex III high-risk timing: current law 2 August 2026. The 7 May 2026 provisional agreement would shift Annex III timing to 2 December 2027 if formally adopted.",
            },
            relevant_articles: ["Art. 6", "Art. 26", "Art. 27", "Annex III"],
        };
        return {
            content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
            structuredContent: output,
        };
    });
}
//# sourceMappingURL=fria.js.map