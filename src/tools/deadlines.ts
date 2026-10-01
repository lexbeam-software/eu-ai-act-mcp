import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { deadlinesInputSchema, deadlinesOutputSchema, type DeadlinesInput, type DeadlinesOutput } from "../schemas/deadlines.js";
import {
  getMilestonesWithDaysRemaining,
  digitalOmnibus,
  digitalOmnibusPack,
  isOmnibusEnacted,
  omnibusStatusLine,
} from "../knowledge/deadlines.js";

export function registerDeadlinesTool(server: McpServer): void {
  server.registerTool("euaiact_check_deadlines", {
    title: "Check EU AI Act Implementation Deadlines",
    description: "Returns key implementation milestones and deadlines for the EU AI Act with days remaining, a `next_milestone` shortcut, and a summary of the Digital Omnibus. The milestone timeline always reflects the operative law. Set `include_pending_omnibus: true` to also receive the structured Digital Omnibus pack (each item source-status labelled; its `status` and `enacted` fields carry the current legislative state). Use `only_upcoming: true` to drop past milestones.",
    annotations: {
      title: "Check EU AI Act Implementation Deadlines",
      readOnlyHint: true,
      idempotentHint: true,
      openWorldHint: false,
    },
    inputSchema: deadlinesInputSchema,
    outputSchema: deadlinesOutputSchema,
  }, async (input: DeadlinesInput): Promise<{ content: any[], structuredContent: DeadlinesOutput }> => {
    let currentMilestones = getMilestonesWithDaysRemaining();

    if (input.area) {
      const areaLower = input.area.toLowerCase();
      currentMilestones = currentMilestones.filter(m =>
        m.description.toLowerCase().includes(areaLower) ||
        m.name.toLowerCase().includes(areaLower)
      );
    }

    if (input.only_upcoming) {
      currentMilestones = currentMilestones.filter(m => !m.isPast);
    }

    const nextUpcoming = currentMilestones.find(m => !m.isPast) ?? null;

    const pendingOmnibus = input.include_pending_omnibus
      ? {
          name: digitalOmnibusPack.name,
          enacted: digitalOmnibusPack.enacted,
          status: digitalOmnibusPack.status,
          enactment: {
            status: digitalOmnibusPack.enactment.status,
            ep_endorsement: digitalOmnibusPack.enactment.epEndorsement,
            council_adoption: digitalOmnibusPack.enactment.councilAdoption,
            celex: digitalOmnibusPack.enactment.celex,
            oj_publication_date: digitalOmnibusPack.enactment.ojPublicationDate,
            entry_into_force: digitalOmnibusPack.enactment.entryIntoForce,
          },
          proposal: {
            com: digitalOmnibusPack.proposal.com,
            celex: digitalOmnibusPack.proposal.celex,
            date: digitalOmnibusPack.proposal.date,
            procedure: digitalOmnibusPack.proposal.procedure,
            source_id: digitalOmnibusPack.proposal.sourceId,
          },
          political_agreement: {
            date: digitalOmnibusPack.politicalAgreement.date,
            source_id: digitalOmnibusPack.politicalAgreement.sourceId,
          },
          high_risk_timeline: {
            superseded_proposal_mechanism: digitalOmnibusPack.highRiskTimeline.supersededProposalMechanism,
            superseded_proposal_mechanism_source_status: digitalOmnibusPack.highRiskTimeline.supersededProposalMechanismSourceStatus,
            application_dates: digitalOmnibusPack.highRiskTimeline.applicationDates,
            application_dates_source_status: digitalOmnibusPack.highRiskTimeline.applicationDatesSourceStatus,
            current_law: digitalOmnibusPack.highRiskTimeline.currentLaw,
            note: digitalOmnibusPack.highRiskTimeline.note,
          },
          deltas: digitalOmnibusPack.deltas.map(d => ({
            article: d.article,
            change: d.change,
            source_status: d.sourceStatus,
            source_id: d.sourceId,
            ...(d.effectiveDate ? { effective_date: d.effectiveDate } : {}),
            ...(d.note ? { note: d.note } : {}),
          })),
          coverage_note: digitalOmnibusPack.coverageNote,
          warning: digitalOmnibusPack.warning,
        }
      : null;

    const output: DeadlinesOutput = {
      milestones: currentMilestones.map(m => ({
        date: m.date,
        name: m.name,
        description: m.description,
        status: m.status,
        articles: m.articles,
        key_obligations: m.keyObligations,
        days_remaining: m.daysRemaining,
        is_past: m.isPast,
      })),
      next_milestone: nextUpcoming
        ? {
            date: nextUpcoming.date,
            name: nextUpcoming.name,
            days_remaining: nextUpcoming.daysRemaining,
          }
        : null,
      // Source-state guard: by default the summary is a minimal, clearly-flagged
      // pointer with NO non-enacted shift dates or pending prohibitions. The
      // dated changes are surfaced only when the caller opts in, so operative
      // law is never presented alongside non-enacted specifics. All status
      // strings derive from the omnibusEnactment record (single-source flip).
      digital_omnibus: input.include_pending_omnibus
        ? {
            name: digitalOmnibus.name,
            status: digitalOmnibus.status,
            proposal_date: digitalOmnibus.proposalDate,
            description: digitalOmnibus.description,
            key_changes: digitalOmnibus.keyChanges,
            impact_on_ai_act: digitalOmnibus.impactOnAIAct,
          }
        : {
            name: digitalOmnibus.name,
            status: digitalOmnibus.status,
            proposal_date: digitalOmnibus.proposalDate,
            description:
              `${omnibusStatusLine()} Pass include_pending_omnibus: true, or read euaiact://omnibus, for the specific changes and dates.`,
            key_changes: [
              isOmnibusEnacted()
                ? "The amended dates are operative law and are reflected in the milestone timeline. Opt in via include_pending_omnibus for the full delta list."
                : "Withheld by default so non-enacted changes are not shown alongside current law. Opt in via include_pending_omnibus or the euaiact://omnibus resource.",
            ],
            impact_on_ai_act: isOmnibusEnacted()
              ? "Enacted; the milestone timeline reflects the amended dates."
              : "Adopted by the co-legislators but not yet published in the Official Journal; not yet in force. Plan against current OJ law.",
          },
      pending_omnibus: pendingOmnibus,
    };

    return {
      content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
      structuredContent: output,
    };
  });
}
