# CyberAwareGaza authoritative source map

Reviewed: 2026-09-28

This document is the Phase 0 content gate. Files marked **missing** must be supplied and reconciled before dependent content or scoring is seeded.

## Available inputs

| Input                           | Workspace source                                                                                | Status                                                                                                             | Authority and permitted use                                                                                                                                                                                                                                                                                           |
| ------------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Product requirements            | `reference/CyberAwareGaza_PRD_v2.0.txt`                                                         | Available; SHA-256 `61b131645224bd6b16eb8f7baad1f814592fad6060dc7706ec38c3b151348cfe`                              | Byte-for-byte workspace copy of the user attachment `Pasted text.txt` (CyberAwareGaza PRD v2.0, 2026-09-28). Authoritative for product behavior, fixed stack, risk thresholds, and prohibitions. Thesis text is not edited.                                                                                           |
| Full logo artwork               | `reference/brand/CyberAwareGaza_Logo.jpg`                                                       | Available; 1448x1086 JPEG; SHA-256 `34c6de562137b239d289c1a410942e589b6be07d9105823a41ef74d0b34625aa`              | Supplied original full horizontal artwork. Use unaltered. No separate symbol/favicon source was supplied. The image contains a warm background rather than transparency.                                                                                                                                              |
| Stitch export                   | `reference/stitch/stitch_cyberawaregaza_platform_ux_design/`                                    | Partial extracted export                                                                                           | Visual reference only. Contains nine static HTML screens, a design-token markdown file, and ten PNG files. No original ZIP is present. Five PNG files are valid visual references and five are identical 28-byte `Image failed to fetch` placeholders.                                                                |
| Design tokens                   | `reference/stitch/stitch_cyberawaregaza_platform_ux_design/academic_cyber_resilience/DESIGN.md` | Available                                                                                                          | Visual reference. PRD colors and component behavior override discrepancies.                                                                                                                                                                                                                                           |
| Stitch design specification PDF | `reference/CyberAwareGaza_Stitch_Design_Specification.pdf`                                      | Available; 12 pages visually inspected; SHA-256 `a9751b90ee8fa71c8871f2253be2339e1b5fde6b97cb5ee1f3c81cae83e40431` | Contains English and Arabic consent/scenario copy and the older name-or-anonymous flow. It calls the scenario copy exact, but PRD v2.0 explicitly requires reconciliation with the canonical questionnaire and legacy rubric before seeding. Arabic is readable in the rendered PDF but distorted by text extraction. |

The machine-readable inventory in `reference/source-manifest.json` records the byte size, SHA-256 digest, provenance, and permitted use of every supplied Phase 0 source artifact. Placeholder README files are documentation, not authoritative sources.

## Required but missing authoritative inputs

| Required source                    | Exact unresolved dependency                                                                                            | Dependent work blocked                                                                       |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Canonical bilingual questionnaire  | Exact English and Arabic text for S1-S8, all option labels, stable option mapping, order, and approved content version | Scenario seed, assessment screens, option validation, review text, localization completeness |
| Approved bilingual consent wording | Exact voluntary consent question, Yes/No labels if governed, consent version                                           | Consent decision screen and production consent records                                       |
| Legacy Python/Tkinter project      | Per-option values, special rules, possible minimum/maximum, feedback mapping, representative output and fixtures       | Final score computation, normalized result visualization, imported-row scoring, parity tests |
| Historical Google Forms CSV        | Headers, encoding, timestamps, consent values, source keys, eight answers, and actual 93/91/2 verification             | CSV mapping/import, historical metrics, import fixtures                                      |
| Original Stitch ZIP                | Original archive and any assets omitted from extracted folders                                                         | Reproducible export provenance and asset completeness check                                  |
| Representative missing screenshots | Desktop/mobile, English/Arabic RTL, modal, selected, error, empty, and completed states                                | Full visual comparison coverage                                                              |
| Original logo symbol/favicon       | Separate source asset, if one exists                                                                                   | Branded compact mark/favicon; no reconstruction will be made                                 |

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

| Domain                      | Canonical source                                        | Status                                                                               |
| --------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Product behavior and roles  | PRD v2.0                                                | Approved                                                                             |
| Visual tokens/layout        | PRD v2.0, then Stitch `DESIGN.md` and valid screenshots | Approved with precedence noted                                                       |
| Brand                       | Supplied full JPG                                       | Approved for full-logo placements only                                               |
| Scenario and option strings | Canonical questionnaire after PDF/rubric reconciliation | **Blocked — PDF candidate exists, canonical questionnaire/rubric comparison absent** |
| Consent text                | Approved questionnaire/research source                  | **Blocked — PDF candidate exists, approved consent version absent**                  |
| Option weights and feedback | Legacy Python project                                   | **Blocked — absent**                                                                 |
| Risk thresholds             | PRD: Low `>= 25`, Medium `10-24`, High `< 10`           | Approved; score range still unknown                                                  |
| Historical records          | Original Google Forms CSV                               | **Blocked — absent**                                                                 |

## Approval needed when sources arrive

Create a single versioned canonical content artifact only after comparing the questionnaire, design PDF, CSV option spellings, and legacy rubric. Record every mismatch and obtain explicit approval for the chosen wording/mapping. Do not infer unchosen options from response data or extract Arabic blindly from a PDF.

## Phase 0 gate decision

Phase 0 inspection and architecture documentation are complete. The content/scoring gate remains intentionally closed: no scenario, option, consent, feedback, score-weight, or historical-response data may be seeded until the missing authoritative inputs above are supplied and reconciled. Source-independent repository work may continue in later phases, but dependent implementation must stop at this gate.
