# Phase 5 scoring source note

This implementation uses Chapter 3, Section 3.4 and Tables 3.4–3.5 as the
source for S1–S3 and S5–S8 score deltas and for all three risk thresholds. The
website binds those rules to the stable option IDs from the approved Section 7
bilingual assessment content, not to translated labels or UI positions.

## Intentional S4 override for the later thesis revision

Chapter 3 currently describes S4 as a typed-password heuristic. It states that
the four questionnaire examples map under that heuristic with the first two at
`+2` and the latter two at `+10`, and it reports a questionnaire-specific raw
range of `-64` to `80`.

Phase 5 intentionally supersedes that S4 description for the existing
four-choice question, in its displayed order:

| Stable ID | Choice            | Approved Phase 5 delta |
| --------- | ----------------- | ---------------------: |
| `S4O1`    | `Ahmed@Gaza2026!` |                    +10 |
| `S4O2`    | `Mohammed2026!`   |                    +10 |
| `S4O3`    | `123456789012`    |                    -10 |
| `S4O4`    | `ahmed1234567`    |                     +2 |

With this revision, the possible eight-scenario raw cumulative range is `-76`
to `80`. The score remains a raw cumulative score and is not a percentage or a
0–100 grade. Chapter 3 should later replace the typed-password/heuristic S4
description, the example mappings, and the questionnaire-specific range, but
the thesis was not edited during Phase 5.
