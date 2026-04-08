/**
 * post-task-check.js --- PostToolUse Hook (L1 Universal)
 * Advocate Loop reminder after codex/gemini-cli Bash calls.
 * Non-blocking (exit 0).
 */

const chunks = [];
process.stdin.on("data", d => chunks.push(d));
process.stdin.on("end", () => {
  let data = {};
  try { data = JSON.parse(Buffer.concat(chunks).toString()); } catch (_) {}

  const toolName = data.tool_name || "";
  const toolInput = data.tool_input || {};

  if (toolName !== "Bash") {
    process.exit(0);
  }

  const cmd = (toolInput.command || "").toLowerCase();

  // codex completed → enter EVALUATE phase
  if (/\bcodex\b/.test(cmd)) {
    console.log("[advocate-loop] codex completed. Enter EVALUATE phase:");
    console.log("  1. Check walkthrough.md or codex output summary");
    console.log("  2. Judge against Acceptance Criteria");
    console.log("     - PASS    → proceed to REPORT phase");
    console.log("     - PARTIAL → re-delegate with specific feedback (loop max 3)");
    console.log("     - FAIL    → rewrite spec and re-delegate (loop max 3)");
    console.log("  3. Update taskboard.md + changelog.md");
  }

  // gemini-cli completed → enter EVALUATE phase
  if (/\bgemini\b/.test(cmd)) {
    console.log("[advocate-loop] gemini-cli completed. Enter EVALUATE phase:");
    console.log("  1. Review gemini output against Acceptance Criteria");
    console.log("     - PASS    → proceed to REPORT phase");
    console.log("     - PARTIAL → re-delegate with specific feedback (loop max 3)");
    console.log("     - FAIL    → rewrite task and re-delegate (loop max 3)");
    console.log("  2. Update taskboard.md if needed");
  }

  process.exit(0);
});
