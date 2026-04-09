import { crawlSiteData } from "./crawl-site.js";
import { sendDiscordMessage } from "./discord.js";
import { normalizeError } from "./errors.js";
import { fetchSheetData } from "./fetch-sheet.js";
import { parseSiteDate, buildDiscordMessage } from "./transform-data.js";
import { isHoliday } from "./holidays.js";
import { submitSiteData } from "./submit-data.js";

function getTodayKstDateString(timezone = "Asia/Seoul") {
  const date = new Date(new Date().toLocaleString("en-US", { timeZone: timezone }));
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

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
  const todayKst = getTodayKstDateString(config.runtime.timezone);

  if (isHoliday(todayKst)) {
    const skipMsg = `[SKIP] 훈련일지 자동화 스킵 완료\n${todayKst} 은(는) 캘린더 공휴일로 지정되어 파이프라인 구동을 종료합니다.`;
    console.log(skipMsg);
    
    if (!config.runtime.dryRun) {
      // (선택) 원한다면 공휴일 스킵 알림을 디스코드로 보낼 수도 있으나, 매번 오면 번거로우므로 생략하거나 보낼 수 있습니다.
      // await sendDiscordMessage(config.discord.webhookUrl, skipMsg);
    }
    
    return {
      ok: true,
      skip: true,
      siteLines: 0,
      sheetRecords: 0
    };
  }

  let siteData;
  let sheetData;
  let browserState = null;

  try {
    siteData = await crawlSiteData(config);
    browserState = siteData.browserState;
    
    // 사이트 크롤링 본문에서 이번 훈련일자 추출 및 시트탭/컬럼명 계산
    const { sheetTabName, columnDateName, rawDateFull } = parseSiteDate(siteData.lines);
    
    // 목표 시트의 Range를 오늘 날짜의 탭(예: "26년 4월!A:Z")으로 강제 오버라이딩
    config.google.range = `${sheetTabName}!A:Z`;

    sheetData = await fetchSheetData(config);
    
    const result = buildDiscordMessage(siteData, sheetData, rawDateFull, columnDateName);

    // F4: 타겟 사이트 실제 폼 제출
    const submitResult = await submitSiteData(config, browserState.page, result.lists);

    // 메시지 조립: 헤더 → 확인 필요 대상 → 기입 로그 → 상세 출결 목록
    const reviewSection = result.needsReview.length > 0
      ? `\n\n[확인 필요 대상]\n${result.needsReview.join("\n")}`
      : "";
    const submitSection = `\n\n[타겟 사이트 기입 로그]\n${submitResult.message}`;
    const message = `${result.header}${reviewSection}${submitSection}\n\n\`\`\`\n${result.bodyText}\n\`\`\``;

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
  } finally {
    if (browserState) {
      await browserState.context.close().catch(() => {});
      await browserState.browser.close().catch(() => {});
    }
  }
}
