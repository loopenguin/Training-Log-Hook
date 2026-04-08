/**
 * agent-guard.js --- PreToolUse Hook (L1 Universal)
 * claude-code = user advocate. No direct execution.
 *
 * [1] Edit/Write + source file -> exit 2 (block) → codex
 * [2] Agent(general-purpose) + source edit intent -> exit 2 (block) → codex
 * [3] WebSearch/WebFetch -> exit 2 (block) → gemini-cli
 *
 * L2 CUSTOMIZATION:
 *   - SRC_EXT: 웹훅 앱 소스 확장자 (.js .html .css .json)
 *   - INFRA_PATHS: 인프라 경로 + /docs/ 추가
 */

// --- L2 Configuration ---
const SRC_EXT = /[.](js|html|css|json)$/i;
const INFRA_PATHS = ["/.claude/", "/agentmanager/", "/docs/", "/tmp/", "/node_modules/"];
// --- End L2 ---

const chunks = [];
process.stdin.on("data", d => chunks.push(d));
process.stdin.on("end", () => {
  let data = {};
  try { data = JSON.parse(Buffer.concat(chunks).toString()); } catch (_) {}

  const toolName = data.tool_name || "";
  const toolInput = data.tool_input || {};

  // [1] Edit/Write on source files → codex
  if (toolName === "Edit" || toolName === "Write") {
    const norm = (toolInput.file_path || "").split("\\").join("/");
    const isSrc = SRC_EXT.test(norm);
    const isOk =
      norm.includes("/docs/") ||
      /[.](md|yaml|yml|toml|env|csv|txt)$/i.test(norm) ||
      INFRA_PATHS.some(d => norm.includes(d));
    if (isSrc && !isOk) {
      console.log("[agent-guard] BLOCKED: direct source edit -> " + norm);
      console.log("Delegate to Codex: codex \"[spec]\" -y");
      process.exit(2);
    }
  }

  // [2] Agent(general-purpose) with source edit intent → codex
  if (toolName === "Agent") {
    const sub = toolInput.subagent_type || "";
    const prompt = (toolInput.prompt || "").toLowerCase();
    if (sub === "general-purpose" || sub === "") {
      const srcEditRe = /[.](js|html|css|json)|edit|write|수정|편집|구현|삽입|추가|삭제|생성|패치/;
      if (srcEditRe.test(prompt)) {
        console.log("[agent-guard] BLOCKED: Agent(general-purpose) source edit intent.");
        console.log("P1 breach. Delegate to Codex: codex \"[spec]\" -y");
        process.exit(2);
      }
    }
  }

  // [3] WebSearch/WebFetch → gemini-cli
  if (toolName === "WebSearch" || toolName === "WebFetch") {
    console.log("[agent-guard] BLOCKED: " + toolName + " call intercepted.");
    console.log("Delegate to gemini-cli: gemini -p \"[task]\"");
    process.exit(2);
  }

  process.exit(0);
});
