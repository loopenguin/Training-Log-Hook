---
name: btw
description: Handle side questions or "by the way" context without interrupting the main task workflow.
---

# `/btw` Skill Guide

Always prioritize these instructions when the user sends a side note, idea, or question using the `/btw` command or in an off-hand manner during a main task.

## Core Rules

1. **Isolation**: Never interrupt, modify, or lose the context and state of the main task (e.g., ongoing file modifications or task boundaries).
2. **Concise Response**: Keep responses to side notes as short and clear as possible. Immediately return to the main task's context after answering.
3. **Logging**: If the user leaves an idea or a note to be referenced later, append it to the bottom of the `agentmanager/btw_notes.md` file to preserve it.

## Execution Steps

- **For simple notes**: Append the content to `agentmanager/btw_notes.md`, and briefly report that it has been safely recorded.
- **For simple questions**: Answer concisely with only the necessary information, then immediately return to the main task.
- **For complex requests**: `/btw` is not meant to break the main workflow. Record the request in `agentmanager/btw_notes.md` and reply that you will process it after finishing the current task.
