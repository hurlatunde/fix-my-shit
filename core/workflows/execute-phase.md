# Execute phase workflow

1. Run plans in waves (parallel where possible, sequential when dependent).
2. Fresh context per plan.
3. Commit per task when in a Git repo.
4. Verify against phase goals.

**Creates:** phases/{N}/{N}-{M}-SUMMARY.md, phases/{N}/{N}-VERIFICATION.md
