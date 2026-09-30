# CyberAwareGaza authoritative source map

Reviewed: 2026-09-28

This document is the Phase 0 content gate. Files marked **missing** must be supplied and reconciled before dependent content or scoring is seeded.

## Available inputs

| Input                           | Workspace source                                                                                | Status                                                                                                             | Authority and permitted use                                                                                                                                                                                                                                                                                                                                          |
| ------------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Product requirements            | `reference/CyberAwareGaza_PRD_v2.0.txt`                                                         | Available; SHA-256 `61b131645224bd6b16eb8f7baad1f814592fad6060dc7706ec38c3b151348cfe`                              | Byte-for-byte workspace copy of the user attachment `Pasted text.txt` (CyberAwareGaza PRD v2.0, 2026-09-28). Authoritative for product behavior, fixed stack, risk thresholds, and prohibitions. Thesis text is not edited.                                                                                                                                          |
| Full logo artwork               | `reference/brand/CyberAwareGaza_Logo.jpg`                                                       | Available; 1448x1086 JPEG; SHA-256 `34c6de562137b239d289c1a410942e589b6be07d9105823a41ef74d0b34625aa`              | Supplied original full horizontal artwork. Use unaltered. No separate symbol/favicon source was supplied. The image contains a warm background rather than transparency.                                                                                                                                                                                             |
| Stitch export                   | `reference/stitch/stitch_cyberawaregaza_platform_ux_design/`                                    | Partial extracted export                                                                                           | Visual reference only. Contains nine static HTML screens, a design-token markdown file, and ten PNG files. No original ZIP is present. Five PNG files are valid visual references and five are identical 28-byte `Image failed to fetch` placeholders.                                                                                                               |
| Design tokens                   | `reference/stitch/stitch_cyberawaregaza_platform_ux_design/academic_cyber_resilience/DESIGN.md` | Available                                                                                                          | Visual reference. PRD colors and component behavior override discrepancies.                                                                                                                                                                                                                                                                                          |
| Stitch design specification PDF | `reference/CyberAwareGaza_Stitch_Design_Specification.pdf`                                      | Available; 12 pages visually inspected; SHA-256 `a9751b90ee8fa71c8871f2253be2339e1b5fde6b97cb5ee1f3c81cae83e40431` | Section 7, “Exact Assessment Content,” is authoritative for the exact S1-S8 English/Arabic question and option wording and order by explicit user clarification on 2026-09-28. Arabic must be transcribed from the rendered PDF because extraction reverses/distorts glyph order. The older entry/account flow elsewhere in the PDF remains subordinate to PRD v2.0. |

The machine-readable inventory in `reference/source-manifest.json` records the byte size, SHA-256 digest, provenance, and permitted use of every supplied Phase 0 source artifact. Placeholder README files are documentation, not authoritative sources.

## Required but missing authoritative inputs

| Required source                    | Exact unresolved dependency                                                                                      | Dependent work blocked                                                                       |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Legacy Python/Tkinter project      | Per-option values, special rules, possible minimum/maximum, feedback mapping, representative output and fixtures | Final score computation, normalized result visualization, imported-row scoring, parity tests |
| Historical Google Forms CSV        | Headers, encoding, timestamps, consent values, source keys, eight answers, and actual 93/91/2 verification       | CSV mapping/import, historical metrics, import fixtures                                      |
| Original Stitch ZIP                | Original archive and any assets omitted from extracted folders                                                   | Reproducible export provenance and asset completeness check                                  |
| Representative missing screenshots | Desktop/mobile, English/Arabic RTL, modal, selected, error, empty, and completed states                          | Full visual comparison coverage                                                              |
| Original logo symbol/favicon       | Separate source asset, if one exists                                                                             | Branded compact mark/favicon; no reconstruction will be made                                 |

## Stitch screen and export inventory

| Export folder                        | HTML      | PNG                         | Language/direction | Phase 0 finding                                                                              |
| ------------------------------------ | --------- | --------------------------- | ------------------ | -------------------------------------------------------------------------------------------- |
| `cyberawaregaza_public_landing_page` | Available | Valid                       | English/LTR        | Visual reference; includes remote image URLs and static claims that require PRD review.      |
| `cyberawaregaza_login_1`             | Available | Valid                       | English/LTR        | Older login variant.                                                                         |
| `cyberawaregaza_login_2`             | Available | Valid                       | English/LTR        | Older login variant.                                                                         |
| `cyberawaregaza_sign_up_1`           | Available | Valid                       | English/LTR        | Older signup variant.                                                                        |
| `cyberawaregaza_sign_up_2`           | Available | Invalid 28-byte placeholder | English/LTR        | HTML is inspectable; screenshot comparison is unavailable.                                   |
| `assessment_scenario_1_of_8`         | Available | Invalid 28-byte placeholder | English/LTR        | Scenario text and options are noncanonical visual copy.                                      |
| `1_8`                                | Available | Invalid 28-byte placeholder | Arabic/RTL         | Arabic scenario-one visual structure only; extracted wording is noncanonical.                |
| `cyberawaregaza_assessment_result`   | Available | Invalid 28-byte placeholder | English/LTR        | Contains invented scores, feedback, and recommendations; structure only.                     |
| `cyberawaregaza_admin_dashboard`     | Available | Invalid 28-byte placeholder | English/LTR        | Contains mock identities, cohorts, counts, charts, and statuses; structure only.             |
| `cyberawaregaza_logo.jpg`            | None      | Valid                       | N/A                | Exported logo preview, not a replacement for the supplied original under `reference/brand/`. |

Every HTML screen is a static standalone document using the Tailwind CDN, Google Fonts/Material Symbols, hard-coded content, `href="#"` navigation, and externally hosted image URLs. The export has no package manifest, reusable React components, application state, data contract, tests, or local copies of its remote assets. Reuse its visual patterns and tokens only; do not ship the HTML or depend on its remote URLs.

Missing from the export: three-way entry screen, warning acknowledgement, consent, instructions, participant home/history, scenarios 2-8, processing/failure/retry states, result-history states, admin login, participants, assessments, scenario detail, import/export, settings, mobile admin drawer, and most Arabic equivalents.

## Conflict record

The Stitch copy is not canonical. It includes invented or conflicting claims and data such as demo participant counts, percentage/correct-answer scoring, `IRB #2024-CAG`, ISO alignment, offline readiness, end-to-end encryption, zero retention, fake cohort identities, and scenario/feedback wording. These must not ship. The PRD supersedes the Stitch account flow and requires registered versus anonymous reporting, server persistence, explicit consent, raw legacy scoring, and source-aware metrics.

## Canonical mapping status

| Domain                      | Canonical source                                                         | Status                                                                                         |
| --------------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| Product behavior and roles  | PRD v2.0                                                                 | Approved                                                                                       |
| Visual tokens/layout        | PRD v2.0, then Stitch `DESIGN.md` and valid screenshots                  | Approved with precedence noted                                                                 |
| Brand                       | Supplied full JPG                                                        | Approved for full-logo placements only                                                         |
| Scenario and option strings | Design specification PDF, Section 7, plus explicit user clarification    | Approved as the exact wording/order source; transcription and versioned seed belong to Phase 4 |
| Consent text                | Design specification PDF, Section 6.3, plus explicit Phase 4 instruction | Approved; versioned as `pdf-section-6.3-v1`                                                    |
| Option weights and feedback | Legacy Python project                                                    | **Blocked — absent**                                                                           |
| Risk thresholds             | PRD: Low `>= 25`, Medium `10-24`, High `< 10`                            | Approved; score range still unknown                                                            |
| Historical records          | Original Google Forms CSV                                                | **Blocked — absent**                                                                           |

## Approval needed when sources arrive

In Phase 4, create a versioned canonical content artifact by transcribing Section 7 directly from rendered PDF pages, preserving S1-S8 order and every English/Arabic option exactly. Record stable option IDs separately from wording. The historical CSV may later require explicit aliases for observed spellings, but it cannot override the PDF wording. The missing legacy rubric must map scores to these stable options without changing their text. Do not extract Arabic blindly from the PDF text layer.

## Phase 0 gate decision

Phase 0 inspection and architecture documentation are complete. Scenario, option, and consent wording are source-approved and transcribed in Phase 4. Scoring contributions, feedback, and historical-response work remain gated by the missing authoritative inputs above; no rubric values are invented.
