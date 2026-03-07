# Development Rules

## Token Efficiency
- Never read files that are not needed for the task at hand
- Do not summarize or repeat back file contents — just make edits
- Use targeted edits (str_replace) instead of rewriting whole files
- Do not re-read a file you already read in this session unless content may have changed
- Batch related changes into single tool calls when possible

## Code Style
- Keep JS/CSS in separate files (smaller focused files = cheaper reads)
- No docstrings on simple functions
