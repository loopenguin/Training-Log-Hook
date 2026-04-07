import { crawlSiteData } from "./crawl-site.js";
import { sendDiscordMessage } from "./discord.js";
import { normalizeError } from "./errors.js";
import { fetchSheetData } from "./fetch-sheet.js";
import { transformToDiscordMessage } from "./transform-data.js";

function formatFailureMessage(config, error) {
  const now = new Intl.DateTimeFormat("ko-KR", {
    timeZone: config.runtime.timezone,
    dateStyle: "short",
    timeStyle: "medium",
    hour12: false
  }).format(new Date());

  return [
    "[FAILURE] 훈련일지 자동화 실행 실패",
    `- 실패 시각(${config.runtime.timezone}): ${now}`,
    `- 실패 단계: ${error.step}`,
    `- 오류 메시지: ${error.message}`
  ].join("\n");
}

export async function runPipeline(config) {
  let siteData;
  let sheetData;

  try {
    siteData = await crawlSiteData(config);
    sheetData = await fetchSheetData(config);
    const message = transformToDiscordMessage(config, siteData, sheetData);

    if (!config.runtime.dryRun) {
      await sendDiscordMessage(config.discord.webhookUrl, message);
    } else {
      console.log("[DRY_RUN] Discord 전송 생략");
      console.log(message);
    }

    return {
      ok: true,
      siteLines: siteData.lineCount,
      sheetRecords: sheetData.recordCount
    };
  } catch (error) {
    const normalized = normalizeError(error);

    if (!config.runtime.dryRun) {
      try {
        await sendDiscordMessage(config.discord.webhookUrl, formatFailureMessage(config, normalized));
      } catch (notificationError) {
        const notificationMessage =
          notificationError instanceof Error ? notificationError.message : String(notificationError);
        console.error("[WARN] 실패 알림 전송도 실패:", notificationMessage);
      }
    }

    throw normalized;
  }
}
