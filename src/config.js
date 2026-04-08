import { PipelineStepError } from "./errors.js";

const REQUIRED_ENV_KEYS = [
  "TARGET_SITE_URL",
  "TARGET_SITE_ID",
  "TARGET_SITE_PW",
  "GOOGLE_SHEET_ID",
  "GOOGLE_SERVICE_ACCOUNT",
  "DISCORD_WEBHOOK_URL"
];

const DEFAULT_SELECTORS = {
  idSelector:
    "input[name='id'], input[name='userId'], input[name='username'], input[type='email'], #id, #username",
  pwSelector: "input[type='password'], #password, input[name='password']",
  submitSelector:
    "button[type='submit'], input[type='submit'], button:has-text('로그인'), button:has-text('Login')",
  refreshSelector:
    "button:has-text('갱신'), button:has-text('새로고침'), button:has-text('출석정보 불러오기'), button:has-text('Refresh'), [data-action='refresh']"
};

function assertRequiredEnv() {
  const missing = REQUIRED_ENV_KEYS.filter((key) => !process.env[key] || process.env[key].trim() === "");
  if (missing.length > 0) {
    throw new PipelineStepError(
      "CONFIG",
      `필수 환경 변수가 누락되었습니다: ${missing.join(", ")}`
    );
  }
}

function parseBoolean(value, fallback = false) {
  if (typeof value !== "string") {
    return fallback;
  }
  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "y", "on"].includes(normalized)) {
    return true;
  }
  if (["0", "false", "no", "n", "off"].includes(normalized)) {
    return false;
  }
  return fallback;
}

function getTodayKstDateString(timezone = "Asia/Seoul") {
  const date = new Date(new Date().toLocaleString("en-US", { timeZone: timezone }));
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function parseGoogleServiceAccount(rawValue) {
  const value = rawValue.trim();

  if (value.startsWith("{")) {
    return JSON.parse(value);
  }

  const decoded = Buffer.from(value, "base64").toString("utf8");
  return JSON.parse(decoded);
}

export function loadConfig() {
  assertRequiredEnv();

  let serviceAccount;
  try {
    serviceAccount = parseGoogleServiceAccount(process.env.GOOGLE_SERVICE_ACCOUNT);
  } catch (error) {
    throw new PipelineStepError(
      "CONFIG",
      "GOOGLE_SERVICE_ACCOUNT 파싱에 실패했습니다. JSON 문자열 또는 Base64(JSON) 형식을 확인하세요.",
      error
    );
  }

  const tz = process.env.TIMEZONE || "Asia/Seoul";

  return {
    targetSite: {
      url: process.env.TARGET_SITE_URL.trim().replace(/\{\{TODAY\}\}/g, getTodayKstDateString(tz)),
      credentials: {
        id: process.env.TARGET_SITE_ID,
        password: process.env.TARGET_SITE_PW
      },
      selectors: {
        idSelector: process.env.TARGET_SITE_ID_SELECTOR || DEFAULT_SELECTORS.idSelector,
        pwSelector: process.env.TARGET_SITE_PW_SELECTOR || DEFAULT_SELECTORS.pwSelector,
        submitSelector: process.env.TARGET_SITE_SUBMIT_SELECTOR || DEFAULT_SELECTORS.submitSelector,
        refreshSelector: process.env.TARGET_SITE_REFRESH_SELECTOR || DEFAULT_SELECTORS.refreshSelector
      }
    },
    google: {
      sheetId: process.env.GOOGLE_SHEET_ID.trim(),
      range: process.env.GOOGLE_SHEET_RANGE || "Sheet1!A:Z",
      serviceAccount
    },
    discord: {
      webhookUrl: process.env.DISCORD_WEBHOOK_URL.trim()
    },
    runtime: {
      timezone: tz,
      dryRun: parseBoolean(process.env.DRY_RUN, false),
      headless: parseBoolean(process.env.PLAYWRIGHT_HEADLESS, true)
    }
  };
}
