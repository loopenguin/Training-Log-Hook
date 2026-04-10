import { chromium } from "playwright";
import { PipelineStepError } from "./errors.js";

async function fillIfVisible(page, selector, value, label) {
  try {
    const element = page.locator(selector).first();
    await element.waitFor({ state: "visible", timeout: 15000 });
    await element.fill(value);
  } catch (error) {
    let currentUrl = "unknown";
    let title = "unknown";
    try {
      currentUrl = page.url();
      title = await page.title();
    } catch(e) {}
    throw new PipelineStepError("SITE_CRAWL", `${label} 입력 요소 대기 시간(15초)을 초과했습니다. selector=${selector} \n[디버깅 정보] 현재 주소: ${currentUrl} \n현재 타이틀: ${title}`);
  }
}

async function clickIfExists(page, selector) {
  try {
    const button = page.locator(selector).first();
    await button.waitFor({ state: "visible", timeout: 10000 });
    await button.click();
    return true;
  } catch (error) {
    if (error.name === "TimeoutError" || error.message?.includes("Timeout")) {
      return false;
    }
    throw error;
  }
}

export async function crawlSiteData(config) {
  let browser = null;
  let context = null;
  let page = null;

  // 버튼 클릭 시 나타나는 alert나 confirm(예: "데이터를 불러오시겠습니까?")을 자동으로 수락합니다.
  try {
    browser = await chromium.launch({ headless: config.runtime.headless });
    context = await browser.newContext({
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
    });
    page = await context.newPage();

    page.on("dialog", async (dialog) => {
      console.log(`[DIALOG] ${dialog.type()} message: ${dialog.message()}`);
      await dialog.accept();
    });

    await page.goto(config.targetSite.url, { waitUntil: "networkidle", timeout: 60000 });

    // (필살기 1) 타겟 주소 접속 후 튕기거나 로그인 창이 당장 안 보이면 '로그인'이라고 적힌 모든 버튼을 뒤져서 눈에 보이는 것을 강제 클릭
    try {
      await page.waitForTimeout(3000); // UI Hydration 안정화 3초 대기
      const loginBtns = await page.locator('a:has-text("로그인"), button:has-text("로그인")').all();
      for (const btn of loginBtns) {
        if (await btn.isVisible()) {
          await btn.click();
          await page.waitForLoadState("networkidle");
          await page.waitForTimeout(2000);
          break;
        }
      }
    } catch(e) {}

    await fillIfVisible(page, config.targetSite.selectors.idSelector, config.targetSite.credentials.id, "아이디");
    await fillIfVisible(
      page,
      config.targetSite.selectors.pwSelector,
      config.targetSite.credentials.password,
      "비밀번호"
    );

    const didClickSubmit = await clickIfExists(page, config.targetSite.selectors.submitSelector);
    if (!didClickSubmit) {
      throw new PipelineStepError(
        "SITE_CRAWL",
        `로그인 제출 요소를 찾지 못했습니다. selector=${config.targetSite.selectors.submitSelector}`
      );
    }

    // SSO(통합로그인) 쿠키 생성 및 리다이렉트 대기 (매우 중요)
    await page.waitForTimeout(5000);
    await page.waitForLoadState("networkidle");

    // 2. 훈련일지(diary) 페이지로 이동 (중요: 크롤링과 등록 모두 이 페이지에서 진행)
    const baseTargetUrl = config.targetSite.url;
    let diaryUrl = baseTargetUrl;
    if (baseTargetUrl.includes("attendance-manage")) {
       diaryUrl = baseTargetUrl.replace("attendance-manage", `diary/${config.runtime.todayKst}`);
    } else if (!page.url().includes("diary")) {
       diaryUrl = baseTargetUrl; // fallbacks
    }

    if (!page.url().includes("diary")) {
       await page.goto(diaryUrl, { waitUntil: "networkidle", timeout: 30000 });
       await page.waitForTimeout(2000);
    }

    const didClickRefresh = await clickIfExists(page, config.targetSite.selectors.refreshSelector);
    if (didClickRefresh) {
      await page.waitForLoadState("networkidle", { timeout: 30000 });
      // 명단이 전부 로딩될 때까지 (최대 10초) 일정 주기로 '훈련정보' 키워드를 확인하며 대기합니다.
      for (let i = 0; i < 10; i++) {
        await page.waitForTimeout(1000);
        const currentBody = await page.locator("body").innerText();
        if (currentBody.includes("훈련정보") && currentBody.includes("결과")) {
           break;
        }
      }
    } else {
      await page.waitForTimeout(3000);
    }

    const bodyText = await page.locator("body").innerText();
    const normalizedLines = bodyText
      .split(/[\n\t]+/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    return {
      capturedAt: new Date().toISOString(),
      lineCount: normalizedLines.length,
      previewLines: normalizedLines.slice(0, 20),
      lines: normalizedLines,
      browserState: { browser, context, page }
    };
  } catch (error) {
    // 에러 발생 시에만 브라우저를 닫고 던짐
    if (context) {
      await context.close().catch(() => {});
    }
    if (browser) {
      await browser.close().catch(() => {});
    }
    
    if (error instanceof PipelineStepError) {
      throw error;
    }
    throw new PipelineStepError("SITE_CRAWL", "사이트 크롤링 중 예외가 발생했습니다.", error);
  }
  // 주의: 성공 시 브라우저를 닫지 않고 반환합니다 (pipeline.js에서 통합 관리)
}
