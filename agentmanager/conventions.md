# Shared Conventions

All agents must follow these rules.

---

## Commit Messages

- Format: `[agent-id] brief description`
- Example: `[codex] fix login validation bug`
- Language: English for commit messages

## File Naming

- Use lowercase with hyphens: `my-component.js`
- Documentation files: lowercase with hyphens: `feature-guide.md`
- No spaces in filenames

## Code Style

- Indentation: 2 spaces
- Encoding: UTF-8
- Line endings: LF
- Add a newline at end of file

<!-- L2: Add project-specific code style rules here -->

## Documentation Style

- Language: Korean for user-facing content, English for rules/workflows/code references
- Tone: concise declarative style, no filler words
- Format: prefer tables over long paragraphs

---

## Delegation Protocol (MANDATORY)

| Task Type | Responsible Agent | On Violation |
|-----------|------------------|--------------|
| Source code edits | **Codex** | Stop & rollback immediately |
| Web search / internet retrieval | **gemini-cli** | Stop immediately |
| Full analysis of files > 500 lines | **gemini-cli** | Stop immediately |
| Batch operations across many files | **gemini-cli** | Stop immediately |
| Multi-modal tasks (image analysis) | **gemini-cli** | Stop immediately |
| Config/doc file edits | **claude-code directly** | — |
| Small targeted code exploration | **claude-code directly** | — |

### Agent Tool Prohibition (CRITICAL)

claude-code **MUST NOT** use the `Agent tool (subagent_type: "general-purpose")` to perform source code edits.

---

**Codex delegation template**
```
codex "
[Task] <one-line summary>
[Files] <list of files to modify>
[Spec]
  - <implementation detail 1>
  - <implementation detail 2>
[Constraints]
  - <constraints to follow>
[Acceptance Criteria]
  - <pass/fail criterion 1>
  - <pass/fail criterion 2>
" -y
```

**gemini-cli delegation template**
```
gemini -p "
[Task] <one-line summary>
[Input] <file path or search keyword>
[Expected Output] <format and content of expected return>
[Acceptance Criteria]
  - <pass/fail criterion 1>
  - <pass/fail criterion 2>
"
```

---

## Advocate Loop (claude-code core workflow)

See `CLAUDE.md` for full details.

```
① Understand → ② Delegate → ③ Evaluate → ④ Report
                     ↑                │
                     └── on failure ──┘
```

- Evaluate against Acceptance Criteria
- Include previous feedback on re-delegation
- Loop max 3 → escalate to user on exceed

---

## Agent Handoff & Reporting Rules

- **Do NOT force claude-code to read large source files after modifications.**
- Execution agents MUST write a concise summary including:
  1. `[Changed Files]`
  2. `[Architectural Changes]`
  3. `[API/Signature Changes]`
  4. `[Known Issues/Next Steps]`

<!-- L2: Add project-specific reporting rules here -->
