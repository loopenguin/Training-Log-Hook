import { google } from "googleapis";
import { PipelineStepError } from "./errors.js";

function rowsToRecords(rows) {
  if (!rows || rows.length === 0) {
    return [];
  }

  // "이름" 이라는 문자열이 포함된 셀이 있는 행을 진짜 헤더로 간주 (통상 2~4행 사이에 위치함)
  let headerRowIndex = 0;
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    if (rows[i] && rows[i].some(cell => cell && typeof cell === 'string' && cell.replace(/\s/g, '').includes("이름"))) {
      headerRowIndex = i;
      break;
    }
  }

  const headers = rows[headerRowIndex];
  return rows.slice(headerRowIndex + 1).map((row, rowIndex) => {
    const record = {};
    headers.forEach((header, colIndex) => {
      record[header || `column_${colIndex + 1}`] = row[colIndex] ?? "";
    });
    record.__row = headerRowIndex + rowIndex + 2;
    return record;
  });
}

export async function fetchSheetData(config) {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: config.google.serviceAccount,
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"]
    });

    const sheets = google.sheets({ version: "v4", auth });

    // 시트 이름(Sheet1 vs 시트1) 불일치로 인한 오류 방지: 첫 번째 탭 이름을 자동으로 가져옴
    let targetRange = config.google.range;
    try {
      if (!targetRange || targetRange === "Sheet1!A:Z" || !targetRange.includes("!")) {
        const meta = await sheets.spreadsheets.get({ spreadsheetId: config.google.sheetId });
        const firstSheetTitle = meta.data.sheets[0].properties.title;
        targetRange = `${firstSheetTitle}!A:Z`;
      }
    } catch (e) {
      console.log("[WARN] 시트 메타데이터 조회 중 오류 발생. 설정된 기본 범위로 시도합니다.");
    }

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: config.google.sheetId,
      range: targetRange
    });

    const rows = response.data.values || [];
    const records = rowsToRecords(rows);

    return {
      fetchedAt: new Date().toISOString(),
      range: config.google.range,
      rowCount: rows.length,
      recordCount: records.length,
      previewRecords: records.slice(0, 5),
      records
    };
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new PipelineStepError("SHEET_FETCH", `Google Sheet 데이터 조회에 실패했습니다. 상세원인: ${detail}`, error);
  }
}
