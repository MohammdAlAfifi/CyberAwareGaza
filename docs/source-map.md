# CyberAwareGaza authoritative source map

Reviewed: 2026-09-28

This document is the Phase 0 content gate. Files marked **missing** must be supplied and reconciled before dependent content or scoring is seeded.

## Available inputs

| Input | Workspace source | Status | Authority and permitted use |
| --- | --- | --- | --- |
| Product requirements | User attachment `Pasted text.txt` (CyberAwareGaza PRD v2.0, 2026-09-28) | Available outside the repository | Authoritative for product behavior, fixed stack, risk thresholds, and prohibitions. Copied only as requirements context in this document; thesis text is not edited. |
| Full logo artwork | `reference/brand/CyberAwareGaza_Logo.jpg` | Available | Supplied original full horizontal artwork. Use unaltered. No separate symbol/favicon source was supplied. The image contains a warm background rather than transparency. |
| Stitch export | `reference/stitch/stitch_cyberawaregaza_platform_ux_design/` | Partial extracted export | Visual reference only. Contains nine HTML screens, a design-token markdown file, and screenshots. No original ZIP is present. Five screenshot files are invalid 28-byte `Image failed to fetch` placeholders. |
| Design tokens | `reference/stitch/stitch_cyberawaregaza_platform_ux_design/academic_cyber_resilience/DESIGN.md` | Available | Visual reference. PRD colors and component behavior override discrepancies. |
| Stitch design specification PDF | `reference/CyberAwareGaza_Stitch_Design_Specification.pdf` | Available; 12 pages visually inspected | Contains English and Arabic consent/scenario copy and the older name-or-anonymous flow. It calls the scenario copy exact, but PRD v2.0 explicitly requires reconciliation with the canonical questionnaire and legacy rubric before seeding. Arabic is readable in the rendered PDF but distorted by text extraction. |

## Required but missing authoritative inputs

| Required source | Exact unresolved dependency | Dependent work blocked |
| --- | --- | --- |
| Canonical bilingual questionnaire | Exact English and Arabic text for S1-S8, all option labels, stable option mapping, order, and approved content version | Scenario seed, assessment screens, option validation, review text, localization completeness |
| Approved bilingual consent wording | Exact voluntary consent question, Yes/No labels if governed, consent version | Consent decision screen and production consent records |
| Legacy Python/Tkinter project | Per-option values, special rules, possible minimum/maximum, feedback mapping, representative output and fixtures | Final score computation, normalized result visualization, imported-row scoring, parity tests |
| Historical Google Forms CSV | Headers, encoding, timestamps, consent values, source keys, eight answers, and actual 93/91/2 verification | CSV mapping/import, historical metrics, import fixtures |
| Original Stitch ZIP | Original archive and any assets omitted from extracted folders | Reproducible export provenance and asset completeness check |
| Representative missing screenshots | Desktop/mobile, English/Arabic RTL, modal, selected, error, empty, and completed states | Full visual comparison coverage |
| Original logo symbol/favicon | Separate source asset, if one exists | Branded compact mark/favicon; no reconstruction will be made |

## Stitch inventory and conflicts

Available screens: public landing, two login variants, two signup variants, English and Arabic scenario-one mockups, assessment result, and admin dashboard.

Missing from the export: three-way entry screen, warning acknowledgement, consent, instructions, participant home/history, scenarios 2-8, processing/failure/retry states, result-history states, admin login, participants, assessments, scenario detail, import/export, settings, mobile admin drawer, and most Arabic equivalents.

The Stitch copy is not canonical. It includes invented or conflicting claims and data such as demo participant counts, percentage/correct-answer scoring, `IRB #2024-CAG`, ISO alignment, offline readiness, end-to-end encryption, zero retention, fake cohort identities, and scenario/feedback wording. These must not ship. The PRD supersedes the Stitch account flow and requires registered versus anonymous reporting, server persistence, explicit consent, raw legacy scoring, and source-aware metrics.

## Canonical mapping status

| Domain | Canonical source | Status |
| --- | --- | --- |
| Product behavior and roles | PRD v2.0 | Approved |
| Visual tokens/layout | PRD v2.0, then Stitch `DESIGN.md` and valid screenshots | Approved with precedence noted |
| Brand | Supplied full JPG | Approved for full-logo placements only |
| Scenario and option strings | Canonical questionnaire after PDF/rubric reconciliation | **Blocked — PDF candidate exists, canonical questionnaire/rubric comparison absent** |
| Consent text | Approved questionnaire/research source | **Blocked — PDF candidate exists, approved consent version absent** |
| Option weights and feedback | Legacy Python project | **Blocked — absent** |
| Risk thresholds | PRD: Low `>= 25`, Medium `10-24`, High `< 10` | Approved; score range still unknown |
| Historical records | Original Google Forms CSV | **Blocked — absent** |

## Approval needed when sources arrive

Create a single versioned canonical content artifact only after comparing the questionnaire, design PDF, CSV option spellings, and legacy rubric. Record every mismatch and obtain explicit approval for the chosen wording/mapping. Do not infer unchosen options from response data or extract Arabic blindly from a PDF.
