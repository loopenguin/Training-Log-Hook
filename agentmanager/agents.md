# Agent Profiles

## claude-code ⭐ [User Advocate]

- **ID**: `claude-code`
- **Domain**: Task orchestration, spec writing, delegation, result evaluation, user reporting
- **Constraints**:
  - Must NOT directly edit source files — delegate to Codex
  - Must NOT use `Agent tool (subagent_type: "general-purpose")` for source edits
  - Must NOT use WebSearch/WebFetch — delegate to gemini-cli
- **CLI**: `claude -p "[task]" --model claude-opus-4-6`

---

## codex

- **ID**: `codex`
- **Domain**: Code implementation, bug fixing, testing, refactoring
- **Strengths**: Rapid code generation, debugging, test writing
- **Constraints**: Limited documentation capability
- **CLI**: `codex "[task]" -y`

---

## gemini-cli

- **ID**: `gemini-cli`
- **Domain**: Web search, large-context file analysis, batch file operations, multi-modal tasks
- **Strengths**: Internet access, large context window (>100K tokens), multi-modal processing
- **Constraints**: Does not own architecture decisions — follows claude-code's direction
- **CLI**: `gemini -p "[task]"`

---

## Cross-Domain Rules

- **Standard workflow**: `claude-code → codex | gemini-cli`
- Cross-domain work must be logged in `taskboard.md` with a `[cross]` tag

## Delegation Boundary

```
claude-code handles directly          Must delegate
──────────────────────────────────────────────────────────
Config/doc file edits            →  Source code edits        → Codex
Small Read/Grep (exploration)    →  Web search / retrieval   → gemini-cli
Task decomposition & spec        →  File analysis > 500 lines → gemini-cli
Result review & QA               →  Multi-modal tasks        → gemini-cli
```

<!-- L2: Add project-specific agents or adjust boundaries below -->
