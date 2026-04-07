import { PipelineStepError } from "./errors.js";

const DISCORD_LIMIT = 1900;

function formatKst(date, timezone) {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: timezone,
    dateStyle: "short",
    timeStyle: "medium",
    hour12: false
  }).format(date);
}

function truncateForDiscord(text) {
  if (text.length <= DISCORD_LIMIT) {
    return text;
  }
  return `${text.slice(0, DISCORD_LIMIT - 3)}...`;
}

function formatPreviewRecords(records) {
  if (records.length === 0) {
    return "- 없음";
  }

  return records
    .map((record, index) => {
      const compact = Object.entries(record)
        .filter(([key]) => key !== "__row")
        .slice(0, 4)
        .map(([key, value]) => `${key}: ${value}`)
        .join(", ");
      return `${index + 1}) ${compact}`;
    })
    .join("\n");
}

export function transformToDiscordMessage(config, siteData, sheetData) {
  try {
    const executedAt = formatKst(new Date(), config.runtime.timezone);
    const sitePreview = siteData.previewLines.length ? siteData.previewLines.join("\n") : "없음";
    const sheetPreview = formatPreviewRecords(sheetData.previewRecords);

    const raw = [
      "[SUCCESS] 훈련일지 자동화 실행 완료",
      `- 실행 시각(${config.runtime.timezone}): ${executedAt}`,
      `- 사이트 추출 라인 수: ${siteData.lineCount}`,
      `- 시트 레코드 수: ${sheetData.recordCount}`,
      "",
      "[사이트 미리보기]",
      sitePreview,
      "",
      "[시트 미리보기]",
      sheetPreview
    ].join("\n");

    return truncateForDiscord(raw);
  } catch (error) {
    throw new PipelineStepError("TRANSFORM", "데이터 가공(전송 메시지 생성)에 실패했습니다.", error);
  }
}
