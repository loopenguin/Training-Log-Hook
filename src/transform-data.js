import { PipelineStepError } from "./errors.js";

export function parseSiteDate(lines) {
  // 1. '훈련일자' 텍스트 패러다임 검색
  const idx = lines.indexOf("훈련일자");
  if (idx === -1 || idx + 1 >= lines.length) {
    throw new PipelineStepError("DATA_TRANSFORM", "사이트 본문에서 '훈련일자' 항목을 찾지 못했습니다. 본문 렌더링 또는 SSO 로그인 지연 문제일 수 있습니다.");
  }
  
  const rawDate = lines[idx + 1].trim(); // 예: "2026-04-07"
  
  if (!/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
    throw new PipelineStepError("DATA_TRANSFORM", `사이트 추출 날짜 형식이 잘못되었습니다: ${rawDate}`);
  }

  // "2026-04-07" -> "26년 4월" 및 "2026. 4. 7" 로 변환
  const [yyyy, mm, dd] = rawDate.split("-");
  const year4 = yyyy;
  const year2 = yyyy.substring(2);
  const month = parseInt(mm, 10);
  const day = parseInt(dd, 10);

  return {
    rawDateFull: rawDate,                             // 2026-04-07
    sheetTabName: `${year2}년 ${month}월`,             // 26년 4월
    columnDateName: `${year4}. ${month}. ${day}`       // 2026. 4. 7
  };
}

export function buildDiscordMessage(siteData, sheetData, rawDateFull, columnDateName) {
  // 1. 사이트 데이터 파싱
  const lines = siteData.lines;
  const resultIdx = lines.indexOf("결과");
  const endIdx = lines.indexOf("훈련정보");
  
  if (resultIdx === -1 || endIdx === -1) {
    throw new PipelineStepError("DATA_TRANSFORM", "사이트 본문에서 학생 출결 영역(결과 ~ 훈련정보)을 특정할 수 없습니다.");
  }

  const studentBlock = lines.slice(resultIdx + 1, endIdx);
  
  // 7줄씩 반복됨: 이름, 생년월일, 입실, 퇴실, 중간, 인증, 결과
  const siteStudents = [];
  for (let i = 0; i < studentBlock.length; i += 7) {
    if (i + 6 < studentBlock.length) {
      siteStudents.push({
        name: studentBlock[i],
        inTime: studentBlock[i + 2],
        outTime: studentBlock[i + 3],
        result: studentBlock[i + 6]
      });
    }
  }

  // 2. 구글 시트 데이터 파싱
  // 첫 번째 row의 헤더에서 "2026. 4. 7"과 일치하는 컬럼 인덱스 찾기
  // 하지만 rowsToRecords에서 Object로 매핑되어 있으므로 첫 레코드의 Key를 뒤져야 함.
  if (!sheetData.records || sheetData.records.length === 0) {
    throw new PipelineStepError("DATA_TRANSFORM", "구글 시트에서 유효한 레코드를 찾지 못했습니다.");
  }

  const sheetMapping = {};
  
  // sheetData.records 에는 { "이름": "강신혁", "2026. 4. 7": "병가", ... } 형태의 객체 배열이 들어있어야 함
  // fetch-sheet.js에서 컬럼 제목을 제대로 잡아주지 못했을 수 있음 (병합셀 문제)
  // 따라서 가장 확실한 방법은 Object.values를 뒤져서 이름을 찾고, 그에 대응하는 오늘 날짜 Key의 값을 빼내는 것.
  // 이 부분은 fetch-sheet의 리턴 포맷에 의존적.
  const targetKey = Object.keys(sheetData.records[0] || {}).find(k => k.includes(columnDateName));
  const nameKey = Object.keys(sheetData.records[0] || {}).find(k => k.includes("이름")) || "이름";

  for (const record of sheetData.records) {
    const sName = record[nameKey];
    let sStatus = "";
    if (targetKey) {
      sStatus = record[targetKey];
    } else {
       // 대상 날짜 컬럼을 못찾은 경우, record 안의 모든 키 중 날짜를 강제매칭
       const fallBackKey = Object.keys(record).find(k => k.replace(/\s/g, '') === columnDateName.replace(/\s/g, ''));
       if(fallBackKey) sStatus = record[fallBackKey];
    }
    
    if (sName) {
      sheetMapping[sName.trim()] = sStatus ? sStatus.trim() : "";
    }
  }

  // 3. 데이터 분류
  const lists = {
    late: [],       // 지각
    absent: [],     // 결석
    excused: [],    // 공가-출석인정
    out: [],        // 외출
    early: []       // 조퇴
  };

  const EXCUSED_KEYWORDS = ["병가", "예비군", "공가", "출석인정", "휴가"];

  for (const stu of siteStudents) {
    const sheetReason = sheetMapping[stu.name] || "";

    if (stu.result === "지각") {
      lists.late.push(`- ${stu.name} (${stu.inTime})`);
    } 
    else if (stu.result === "조퇴") {
      lists.early.push(`- ${stu.name} (${stu.outTime})`);
    } 
    else if (stu.result === "외출") {
      lists.out.push(`- ${stu.name} (${sheetReason || "*입력 필요*"})`);
    }
    else if (stu.result === "결석") {
      // 결석인데 시트에 인정사유가 있으면 공가-출석인정으로 이동
      const hasExcused = EXCUSED_KEYWORDS.some(kw => sheetReason.includes(kw));
      if (hasExcused) {
        lists.excused.push(`- ${stu.name} (${sheetReason})`);
      } else {
        lists.absent.push(`- ${stu.name} (${sheetReason || "*입력 필요*"})`);
      }
    }
  }

  // 4. 메시지 빌드
  const [yyyy, mm, dd] = rawDateFull.split("-");
  const dateObj = new Date(rawDateFull);
  const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
  const dayStr = dayNames[dateObj.getDay()];

  const header = `[SUCCESS] ${yyyy.substring(2)}년 ${parseInt(mm)}월 ${parseInt(dd)}일 ${dayStr}요일 훈련일지 자동화 실행 완료\n실행 시각(Asia/Seoul): ${new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}`;

  const bodyParts = [];
  
  bodyParts.push(`1. 지각 (${lists.late.length}명)`);
  if (lists.late.length > 0) bodyParts.push(lists.late.join("\n"));
  else bodyParts.push("- ");
  
  bodyParts.push(`\n2. 결석 (${lists.absent.length}명)`);
  if (lists.absent.length > 0) bodyParts.push(lists.absent.join("\n"));
  else bodyParts.push("- ");
  
  bodyParts.push(`\n3. 공가-출석인정 (${lists.excused.length}명)`);
  if (lists.excused.length > 0) bodyParts.push(lists.excused.join("\n"));
  else bodyParts.push("- ");
  
  bodyParts.push(`\n4. 외출 (${lists.out.length}명)`);
  if (lists.out.length > 0) bodyParts.push(lists.out.join("\n"));
  else bodyParts.push("- ");
  
  bodyParts.push(`\n5. 조퇴 (${lists.early.length}명)`);
  if (lists.early.length > 0) bodyParts.push(lists.early.join("\n"));
  else bodyParts.push("- ");

  return {
    discordText: `${header}\n\n${bodyParts.join("\n")}`
  };
}
