import "dotenv/config";
import { loadConfig } from "./config.js";
import { runPipeline } from "./pipeline.js";

async function main() {
  const config = loadConfig();
  const result = await runPipeline(config);
  console.log(`[DONE] siteLines=${result.siteLines}, sheetRecords=${result.sheetRecords}`);
}

main().catch((error) => {
  const step = error && typeof error === "object" && "step" in error ? error.step : "UNKNOWN";
  const message = error instanceof Error ? error.message : String(error);

  console.error(`[FAIL] step=${step}`);
  console.error(message);
  process.exitCode = 1;
});
