import { chromium } from "playwright";
import { PipelineStepError } from "./errors.js";

async function fillIfVisible(page, selector, value, label) {
  const element = page.locator(selector).first();
  if ((await element.count()) === 0) {
    throw new PipelineStepError("SITE_CRAWL", `${label} 입력 요소를 찾지 못했습니다. selector=${selector}`);
  }
  await element.fill(value);
}

async function clickIfExists(page, selector) {
  const button = page.locator(selector).first();
  if ((await button.count()) === 0) {
    return false;
  }
  await button.click();
  return true;
}

export async function crawlSiteData(config) {
  const browser = await chromium.launch({ headless: config.runtime.headless });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(config.targetSite.url, { waitUntil: "domcontentloaded", timeout: 60000 });

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

    await page.waitForTimeout(2000);
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
