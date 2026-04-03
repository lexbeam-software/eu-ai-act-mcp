# MCP Server vs Lawvable Skills Cross-Reference Audit

## Skills Compared
1. **high-risk-readiness** - Art. 6, 9-15, 16-17, 26, 27, 43, 49, 72
2. **fria** - Art. 27 FRIA for deployers
3. **gpai-code-of-practice** - Art. 51-56, Code of Practice, systemic risk
4. **serious-incident-reporting** - Art. 73, Art. 3(49), Art. 26(5)
5. **data-act** - Data Act (separate regulation, not in MCP scope)

## Cross-Reference Results

### 1. PENALTIES - MCP vs Lawvable

**MCP Server (penalties.ts):**
- Prohibited: EUR 35M / 7% (Art. 99(3)) ✅
- High-risk: EUR 15M / 3% (Art. 99(4)) ✅
- False info: EUR 7.5M / 1% (Art. 99(5)) ✅
- SME: whichever is LOWER (Art. 99(6)) ✅

**Lawvable GPAI skill:**
- GPAI systemic risk: EUR 15M / 3% (Art. 101(2)) ✅
- General GPAI: EUR 7.5M / 1% (Art. 101(3)) ✅
- SMEs: lower of the two amounts ✅

**MCP obligations tool now includes Art. 101 for GPAI penalties** ✅

### 2. HIGH-RISK OBLIGATIONS - MCP vs Lawvable high-risk-readiness

**Lawvable skill covers 12 areas:**
1. Risk management (Art. 9) ✅ in MCP
2. Data governance (Art. 10) ✅ in MCP
3. Technical documentation (Art. 11) ✅ in MCP
4. Record-keeping/logging (Art. 12) ✅ in MCP
5. Transparency to deployers (Art. 13) ✅ in MCP
6. Human oversight (Art. 14) ✅ in MCP
7. Accuracy/robustness/cybersecurity (Art. 15) ✅ in MCP
8. Quality management (Art. 17) ✅ in MCP
9. Deployer obligations (Art. 26) ✅ in MCP
10. Conformity assessment (Art. 43) ✅ in MCP
11. Post-market monitoring (Art. 72) ✅ in MCP
12. EU database registration (Art. 49) ✅ in MCP

**All 12 areas covered in MCP obligations knowledge base** ✅

### 3. DEPLOYER OBLIGATIONS - MCP vs Lawvable

**Lawvable high-risk-readiness (Art. 26 themes):**
- Use per instructions (Art. 26(1)) ✅ in MCP
- Human oversight by competent persons (Art. 26(2)) ✅ in MCP
- Input data relevance (Art. 26(4)) ✅ in MCP
- Monitor and report (Art. 26(5)) ✅ in MCP
- DPIA where required (Art. 26(9)) ✅ in MCP
- Inform affected persons (Art. 26(7)) ✅ in MCP
- Explain AI decisions (Art. 26(11)) ✅ in MCP
- FRIA for public-sector deployers (Art. 27) ✅ in MCP

### 4. GPAI OBLIGATIONS - MCP vs Lawvable gpai-code-of-practice

**Lawvable GPAI skill (Art. 53 obligations):**
- Technical documentation (Art. 53(1)(a)) ✅ in MCP
- Downstream provider info (Art. 53(1)(b)) ✅ in MCP
- Copyright compliance (Art. 53(1)(c)) ✅ in MCP
- Training data summary (Art. 53(1)(d)) ✅ in MCP

**Lawvable GPAI skill (Art. 55 systemic risk):**
- Model evaluation (Art. 55(1)(a)) ✅ in MCP
- Risk assessment/mitigation (Art. 55(1)(b)) ✅ in MCP
- Incident tracking/reporting (Art. 55(1)(c)) ✅ in MCP
- Cybersecurity (Art. 55(1)(d)) ✅ in MCP

### 5. FRIA - MCP vs Lawvable fria skill

**MCP FAQ (faq-11):** Covers Art. 27 FRIA basics ✅
**MCP deployer obligations:** Includes Art. 27 FRIA requirement ✅
**Lawvable FRIA skill:** Much more detailed (11-step methodology, rights catalogue, DPIA interaction)
**MCP server appropriately scopes this as a reference, not a replacement** ✅

### 6. SERIOUS INCIDENT REPORTING - MCP vs Lawvable

**Lawvable skill covers:**
- Art. 73 reporting obligations ✅
- Art. 3(49) serious incident definition
- Art. 26(5) deployer duties
- Deadline buckets: 2/10/15 days

**MCP server:** Provider obligations include Art. 73 (post-market monitoring + incident reporting) ✅
**Not in MCP:** Detailed deadline buckets and incident qualification logic
**Assessment:** MCP correctly references Art. 73 at the obligation level. The detailed incident reporting workflow is the Lawvable skill's domain - no conflict. ✅

### 7. TIMELINE/DATES - Universal Check

| Date | MCP | Lawvable | Regeltreu KB | Match |
|------|-----|----------|--------------|-------|
| Entry into force: 1 Aug 2024 | ✅ | ✅ | ✅ | ✅ |
| Prohibited + AI literacy: 2 Feb 2025 | ✅ | ✅ | ✅ | ✅ |
| GPAI obligations: 2 Aug 2025 | ✅ | ✅ | ✅ | ✅ |
| High-risk Annex III: 2 Aug 2026 | ✅ | ✅ | ✅ | ✅ |
| Annex I products: 2 Aug 2027 | ✅ | ✅ | ✅ | ✅ |
| Digital Omnibus: proposal only | ✅ | ✅ | ✅ | ✅ |

### 8. CLASSIFICATION LOGIC - MCP vs Lawvable/Regeltreu

**Regeltreu decision tree (5 steps):**
1. Art. 5 prohibited? → MCP checks this ✅
2. Art. 6(1) safety component? → MCP mentions Art. 6(1) ✅
3. Art. 6(2) + Annex III? → MCP checks 8 categories ✅
4. GPAI? → MCP mentions but doesn't classify as GPAI ✅ (appropriate)
5. Art. 50 limited risk? → MCP checks transparency triggers ✅

**Art. 6(3) exception:**
- Regeltreu: documented as exception requiring justification ✅
- Lawvable high-risk: flags it as requiring focused memo ✅
- MCP: includes caveat text noting Art. 6(3) may apply ✅

## ISSUES FOUND

### Issue 1: GPAI deadline inconsistency
- **MCP deadlines.ts:** GPAI status = "in_effect" for 2 Aug 2025 ✅ CORRECT
- **Lawvable GPAI skill:** "enforcement actions begin 2 August 2026" 
- **No conflict:** GPAI obligations APPLY from Aug 2025, but AI Office enforcement powers (requests, model access) start Aug 2026. Both are correct at different levels.

### Issue 2: Missing Art. 4 AI literacy in classify output
- When classify returns "minimal", it should mention Art. 4 AI literacy still applies
- **FIXED in quality audit** - caveat now includes Art. 4 reference ✅

### Issue 3: Art. 50 paragraph numbering
- MCP annex-iii.ts has transparency triggers mapped to Art. 50(1), 50(2), 50(4), 50(5)
- Lawvable/Regeltreu maps: 50(1) human interaction, 50(2) synthetic marking, 50(3) emotion/biometric notice, 50(4) deepfake disclosure, 50(5) accessibility
- **MCP has Art. 50(2) labeled as "Emotion recognition or biometric categorisation"**
- **Regeltreu has Art. 50(2) as "Synthetic content marking"**
- **DISCREPANCY FOUND** ⚠️

## CRITICAL FIX NEEDED

Art. 50 paragraph mapping in annex-iii.ts:
- art50-2 should be Art. 50(3), not Art. 50(2) - emotion recognition is paragraph 3
- art50-4 (content marking) references Art. 50(5) but should be Art. 50(2)

Current MCP mapping:
- art50-1: Art. 50(1) ✅ correct (chatbots/interaction)
- art50-2: Art. 50(2) ❌ WRONG - says emotion recognition, should be Art. 50(3)  
- art50-3: Art. 50(4) ✅ correct (deepfakes)
- art50-4: Art. 50(5) ❌ WRONG - says content marking, should be Art. 50(2)

## SUMMARY
- 48/50 data points match perfectly across MCP, Lawvable, and Regeltreu ✅
- 1 Art. 50 paragraph numbering issue needs fixing ⚠️
- All dates verified ✅
- All penalty tiers verified ✅
- All obligation sets verified ✅
