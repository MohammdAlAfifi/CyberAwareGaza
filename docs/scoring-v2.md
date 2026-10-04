# CyberAwareGaza scoring version 2

The active scoring version is `cyberawaregaza-safe-decisions-v2`. It is an intentional research-scoring revision and is deliberately different from the earlier thesis model. The thesis and the preserved source definition in `src/scoring/rubric-v1.json` are not modified.

Version 2 converts each original option contribution exactly once: `-10 → 0`, `-8 → 2`, `2 → 4`, `4 → 6`, `6 → 6`, `8 → 8`, and `10 → 10`. Stable scenario and option IDs select rules. S4 is explicitly locked to `10, 8, 0, 4` in displayed option order.

Eight submitted responses produce a total from 0 to 80 and a score percentage of `total / 80 × 100`. Higher percentages indicate safer cybersecurity decisions; the value is not reversed. The unrounded percentage determines risk: High at 50% or below, Medium above 50% through 70%, and Low above 70% through 100%. Individual response bands are High for 0/2, Medium for 4/6, and Low for 8/10.

Incomplete attempts have neither a final percentage nor a risk classification. Website submissions and Google Form CSV imports both use `calculateAssessmentScore`.

## Existing completed results

After applying database migrations, preview the real recalculation without changing data:

```sh
pnpm db:scoring-v2:preview
```

The preview fails nonzero and lists any completed attempt that does not contain exactly eight supported stored option IDs. Resolve every unsupported record before applying:

```sh
pnpm db:scoring-v2:apply
```

The apply command locks and updates supported attempts transactionally, updates response scoring traces with totals/percentages/risks, and inserts one revision-audit row per attempt. Its unique `(attempt_id, to_rubric_version_id)` key makes repeated execution safe. It never converts an existing total; it always recalculates from stored stable option IDs. Application startup never runs this command.
