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
    return false;
  }
}

export async function crawlSiteData(config) {
  const browser = await chromium.launch({ headless: config.runtime.headless });
  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
  });
  const page = await context.newPage();

  try {
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

    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    // (필살기 2) 로그인을 무사히 마쳤으나, 엉뚱한 대시보드로 떨어졌다면 진짜 목표 사이트로 한 번 더 강제 재진입
    // url에 쿼리 파라미터가 붙을 수 있으므로 startsWith/includes 사용
    if (!page.url().includes("attendance-manage")) {
       await page.goto(config.targetSite.url, { waitUntil: "networkidle", timeout: 30000 });
    }

    await clickIfExists(page, config.targetSite.selectors.refreshSelector);
    await page.waitForTimeout(1000);

    const bodyText = await page.locator("body").innerText();
    const normalizedLines = bodyText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    return {
      capturedAt: new Date().toISOString(),
      lineCount: normalizedLines.length,
      previewLines: normalizedLines.slice(0, 20)
    };
  } catch (error) {
    if (error instanceof PipelineStepError) {
      throw error;
    }
    throw new PipelineStepError("SITE_CRAWL", "사이트 크롤링 중 예외가 발생했습니다.", error);
  } finally {
    await context.close();
    await browser.close();
  }
}
