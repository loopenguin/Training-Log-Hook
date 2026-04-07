import { crawlSiteData } from "./crawl-site.js";
import { sendDiscordMessage } from "./discord.js";
import { normalizeError } from "./errors.js";
import { fetchSheetData } from "./fetch-sheet.js";
import { parseSiteDate, buildDiscordMessage } from "./transform-data.js";

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
    
    // 사이트 크롤링 본문에서 이번 훈련일자 추출 및 시트탭/컬럼명 계산
    const { sheetTabName, columnDateName, rawDateFull } = parseSiteDate(siteData.lines);
    
    // 목표 시트의 Range를 오늘 날짜의 탭(예: "26년 4월!A:Z")으로 강제 오버라이딩
    config.google.range = `${sheetTabName}!A:Z`;

    sheetData = await fetchSheetData(config);
    
    const result = buildDiscordMessage(siteData, sheetData, rawDateFull, columnDateName);
    const message = result.discordText;

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
