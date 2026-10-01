import { z } from "zod";

export const deadlinesInputSchema = z.object({
  area: z.string().optional().describe("Optional filter by compliance area (e.g. 'GPAI', 'high-risk', 'prohibited')"),
  only_upcoming: z
    .boolean()
    .optional()
    .describe("If true, return only milestones that have not yet come into effect."),
  include_pending_omnibus: z
    .boolean()
    .optional()
    .describe("If true, also return the structured Digital Omnibus pack with per-item source-status labels. OFF by default: the milestone timeline always reflects the operative law only. Check the pack's `status` and `enacted` fields for its current legislative state; non-enacted content must not be treated as current law."),
}).strict();

const sourceStatusEnum = z.enum([
  "enacted_oj",
  "official_consolidated_snapshot_non_authentic",
  "commission_proposal",
  "political_agreement",
  "adopted_pending_publication",
  "commission_guideline_draft",
  "commission_guideline_final",
  "commission_study",
  "code_under_assessment",
  "code_adequate_voluntary_tool",
]);

const omnibusEnactmentSchema = z.object({
  status: sourceStatusEnum,
  ep_endorsement: z.string(),
  council_adoption: z.string(),
  celex: z.string().nullable(),
  oj_publication_date: z.string().nullable(),
  entry_into_force: z.string().nullable(),
});

const omnibusDeltaSchema = z.object({
  article: z.string(),
  change: z.string(),
  source_status: sourceStatusEnum,
  source_id: z.string(),
  effective_date: z.string().optional(),
  note: z.string().optional(),
});

const pendingOmnibusSchema = z.object({
  name: z.string(),
  enacted: z.boolean(),
  status: sourceStatusEnum,
  enactment: omnibusEnactmentSchema,
  proposal: z.object({
    com: z.string(),
    celex: z.string(),
    date: z.string(),
    procedure: z.string(),
    source_id: z.string(),
  }),
  political_agreement: z.object({
    date: z.string(),
    source_id: z.string(),
  }),
  high_risk_timeline: z.object({
    // Named for what they are since 1.4.3: the conditional trigger below is the
    // DELETED proposal text, and the dates are unconditional, not backstops.
    superseded_proposal_mechanism: z.string(),
    superseded_proposal_mechanism_source_status: sourceStatusEnum,
    application_dates: z.object({
      annex_iii_art_6_2: z.string(),
      annex_i_art_6_1: z.string(),
    }),
    application_dates_source_status: sourceStatusEnum,
    current_law: z.object({
      annex_iii_art_6_2: z.string(),
      annex_i_art_6_1: z.string(),
    }),
    note: z.string(),
  }),
  deltas: z.array(omnibusDeltaSchema),
  coverage_note: z.string(),
  warning: z.string(),
});

export const deadlinesOutputSchema = z.object({
  milestones: z.array(z.object({
    date: z.string(),
    name: z.string(),
    description: z.string(),
    status: z.enum(["in_effect", "upcoming", "proposal_only"]),
    articles: z.array(z.string()),
    key_obligations: z.array(z.string()),
    days_remaining: z.number(),
    is_past: z.boolean(),
  })),
  next_milestone: z
    .object({
      date: z.string(),
      name: z.string(),
      days_remaining: z.number(),
    })
    .nullable(),
  digital_omnibus: z.object({
    name: z.string(),
    status: z.string(),
    proposal_date: z.string(),
    description: z.string(),
    key_changes: z.array(z.string()),
    impact_on_ai_act: z.string(),
  }),
  pending_omnibus: pendingOmnibusSchema.nullable(),
});

export type DeadlinesInput = z.infer<typeof deadlinesInputSchema>;
export type DeadlinesOutput = z.infer<typeof deadlinesOutputSchema>;
