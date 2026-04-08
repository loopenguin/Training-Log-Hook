import { chromium } from "playwright";
import { PipelineStepError } from "./errors.js";

async function fillIfVisible(page, selector, value, label) {
  try {
    const element = page.locator(selector).first();
    await element.waitFor({ state: "visible", timeout: 10000 });
    await element.fill(value);
  } catch (error) {
    throw new PipelineStepError("SITE_SUBMIT", `${label} 폼 요소를 찾거나 입력할 수 없습니다. selector=${selector}`);
  }
}

export async function submitSiteData(config, page, lists) {
  let submissionResult = { success: false, message: "" };

  try {
    // 1. 입력 데이터 조립 ((기존 2번 과정이었던 링크 이동 로직은 crawl-site.js에서 선행 완료됨))
    // lists 객체에는 late, absent, excused, out, early 배열이 존재합니다.
    let textToSubmit = `금일 훈련 특이사항 보고:\n\n`;
    if (lists.late.length > 0) textToSubmit += `[지각]\n${lists.late.join("\\n")}\n\n`;
    if (lists.absent.length > 0) textToSubmit += `[결석]\n${lists.absent.join("\\n")}\n\n`;
    if (lists.excused.length > 0) textToSubmit += `[공가/출석인정]\n${lists.excused.join("\\n")}\n\n`;
    if (lists.out.length > 0) textToSubmit += `[외출]\n${lists.out.join("\\n")}\n\n`;
    if (lists.early.length > 0) textToSubmit += `[조퇴]\n${lists.early.join("\\n")}\n\n`;
    
    if (Object.values(lists).every(arr => arr.length === 0)) {
        textToSubmit += `특이사항 (지각/결석 등) 인원 없음. 전원 정상 출결 완료.`;
    }

    // 4. 입력 필드 탐색 및 값 입력
    const textSelector = config.targetSite.selectors.textareaSelector;
    await fillIfVisible(page, textSelector, textToSubmit, "훈련일지 입력란");

    // 5. 저장 버튼 클릭 (Dry-Run 체크)
    const saveSelector = config.targetSite.selectors.saveBtnSelector;
    
    if (config.runtime.dryRun) {
      console.log(`[DRY_RUN] 자동화 제출(저장) 방지 활성화 됨. 저장 버튼(${saveSelector}) 클릭을 생략합니다.`);
      submissionResult.message = "Dry-Run 모드로 인해 사이트 저장을 스킵했습니다.";
      submissionResult.success = true;
      await page.waitForTimeout(1500); // UI 확인용 대기
    } else {
      console.log(`[SUBMIT] 실 운영 페이지 저장 로직 실행 중...`);
      const saveBtn = page.locator(saveSelector).first();
      await saveBtn.waitFor({ state: "visible", timeout: 10000 });
      await saveBtn.click();
      
      // 결과 알림 모달 등이 있는지 확인
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(2000);
      
      submissionResult.success = true;
      submissionResult.message = "사이트 직접 제출 성공";
    }

    // 예외는 pipeline.js 로 던짐
    if (error instanceof PipelineStepError) throw error;
    throw new PipelineStepError("SITE_SUBMIT", "사이트 데이터 기입 및 제출 중 오류 발생", error);
  }

  return submissionResult;
}
