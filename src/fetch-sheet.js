import { google } from "googleapis";
import { PipelineStepError } from "./errors.js";

function rowsToRecords(rows) {
  if (!rows || rows.length === 0) {
    return [];
  }

  const headers = rows[0];
  return rows.slice(1).map((row, rowIndex) => {
    const record = {};
    headers.forEach((header, colIndex) => {
      record[header || `column_${colIndex + 1}`] = row[colIndex] ?? "";
    });
    record.__row = rowIndex + 2;
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

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: config.google.sheetId,
      range: config.google.range
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
    throw new PipelineStepError("SHEET_FETCH", "Google Sheet 데이터 조회에 실패했습니다.", error);
  }
}
