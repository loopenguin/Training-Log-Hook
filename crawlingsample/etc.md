# (구버전) 스프레드 시트에서 사용한 함수

```
=LET(
  Names, Q5:Q58,
  Status, R5:R58,
  InTime, F5:F58,
  OutTime, G5:G58,
  NL, CHAR(10),
  
  LateCount, COUNTIF(Status, "*지각*"),
  LateList, IFERROR(TEXTJOIN(NL, TRUE, FILTER(ARRAYFORMULA("- " & Names & " (" & TEXT(InTime, "hh:mm") & ")"), ARRAYFORMULA(ISNUMBER(SEARCH("지각", Status))))), "- "),
  
  AbsentCount, COUNTIF(Status, "*결석*"),
  AbsentList, IFERROR(TEXTJOIN(NL, TRUE, FILTER(ARRAYFORMULA("- " & Names & " (*입력 필요*)"), ARRAYFORMULA(ISNUMBER(SEARCH("결석", Status))))), "- "),
  
  ExcusedCond, ARRAYFORMULA(ISNUMBER(SEARCH("공가", Status)) + ISNUMBER(SEARCH("출석인정", Status)) + ISNUMBER(SEARCH("예비군", Status)) + ISNUMBER(SEARCH("병가", Status)) + ISNUMBER(SEARCH("휴가", Status))),
  ExcusedCount, SUMPRODUCT(--(ExcusedCond > 0)),
  ExcusedReason, ARRAYFORMULA(TRIM(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(Status, "공가", ""), "출석인정", ""), "(", ""), ")", ""))),
  ExcusedSortKey, ARRAYFORMULA(IFS(ISNUMBER(SEARCH("병가", Status)), 1, ISNUMBER(SEARCH("예비군", Status)), 2, (ISNUMBER(SEARCH("공가", Status)) + ISNUMBER(SEARCH("출석인정", Status))) > 0, 3, ISNUMBER(SEARCH("휴가", Status)), 4, TRUE, 5)),
  ExcusedList, IFERROR(TEXTJOIN(NL, TRUE, SORT(FILTER(ARRAYFORMULA("- " & Names & " (" & ExcusedReason & ")"), ExcusedCond > 0), FILTER(ExcusedSortKey, ExcusedCond > 0), 1)), "- "),
  
  OutCount, COUNTIF(Status, "*외출*"),
  OutList, IFERROR(TEXTJOIN(NL, TRUE, FILTER(ARRAYFORMULA("- " & Names & " (*입력 필요*)"), ARRAYFORMULA(ISNUMBER(SEARCH("외출", Status))))), "- "),
  
  EarlyCount, COUNTIF(Status, "*조퇴*"),
  EarlyList, IFERROR(TEXTJOIN(NL, TRUE, FILTER(ARRAYFORMULA("- " & Names & " (" & TEXT(OutTime, "hh:mm") & ")"), ARRAYFORMULA(ISNUMBER(SEARCH("조퇴", Status))))), "- "),
  
  "1. 지각 (" & LateCount & "명)" & NL & LateList & NL & NL &
  "2. 결석 (" & AbsentCount & "명)" & NL & AbsentList & NL & NL &
  "3. 공가-출석인정 (" & ExcusedCount & "명)" & NL & ExcusedList & NL & NL &
  "4. 외출 (" & OutCount & "명)" & NL & OutList & NL & NL &
  "5. 조퇴 (" & EarlyCount & "명)" & NL & EarlyList
)
```

---

# 규약 문서 내용

```
[훈련일지 양식]

교과목 : (비NCS)XR VR/AR 게임 개발 합반 프로젝트
수업내용 : XR VR/AR 게임 개발 21/35
- XR VR/AR 게임 개발 - 21
교재 : 자체 LMS


1. 지각 (4명)
- 김창현 (09:33)
- 임용찬 (09:43)
- 정준원 (09:37)
- 황영재 (09:38)

2. 결석 (0명)
- 

3. 공가-출석인정 (0명)
- 김민성 (예비군)
- 도승연 (병가)
- 박준우 (예비군)
- 장석현 (휴가)

4. 외출 (0명)
- 

5. 조퇴 (0명)





---

### 공통 사항
- 3기 `LMS - 관리자 - 훈련일지 - 해당 일자의 **행동** 아이콘` (연필 모양) 클릭
- 반드시 우상단 **출석정보 불러오기** 클릭 후 진행
- 페이지 하단 **등록정보**란 기입
- 당일 퇴실시간 후 작성이 원칙이나 당일 퇴실 관련 특이사항이 발생할 수 있으므로 익일 오전 작성하여도 무관.
  - 예) 03월 17일 훈련일지는 03월 18일 아침에 작성

### 교육내용
- LMS와 교육 시간표 참고하여 작성 (LMS 상 커리큘럼과 일치해야 함)
- https://docs.google.com/spreadsheets/d/14Y7rHiJYJ4x5-IIDy6kXoM0lfwoseCzXhOMaBsdQW1U/edit?gid=977515813#gid=977515813
- 교과목: **단원** 기입
- 수업내용: **교육 타이틀** 기입
- 교재: 자체 LMS

- 예시
markdown
교과목 : (비NCS)XR VR/AR 게임 개발 합반 프로젝트
수업내용 : XR VR/AR 게임 개발 21/35
- XR VR/AR 게임 개발 - 21
교재 : 자체 LMS


### 비고
- 양식에 맞추어 해당일의 출결상 특이사항 기재
- 훈련일지의 출결정보를 기준으로 삼되, 외출/공가 등의 특이사항 파악은 3기 출결시트 참고
- https://docs.google.com/spreadsheets/d/1pzpJqpb1l5TLZOHephndiEDsOjMHMKFfPxmdS3pLHsI/edit?gid=805514756#gid=805514756
- LMS 상 출결정보 특이사항이 있으나, 구드 출결 시트엔 없는 경우 운영매니저 소통 필요. (통상적으로 시트 누락이나, 가끔 LMS 이슈 케이스 있음.)

1. 지각
- 이름과 입실 시간 기입

예시)
- 김경일 (09:48)


2. 결석
- 이름, 사전 보고 여부, 사유 기재
- 사전 보고 여부는 09:30 이전 공유된 사항을 기준으로 작성

예시)
- 김경일 (보고 - 컨디션 난조)
- 김경일 (보고 - 개인 사유)
- 김경일 (미보고 - 무단 결석)
- 김경일 (퇴실 QR 누락)


3. 공가-출석인정
- 이름, 사유 기재 (휴가, 예비군, 병가, 기타)
- 기타는 친족상 등 특이 인정 사항에 기입

예시)
- 김경일 (휴가)
- 김경일 (병가)


4. 외출
- 이름, 외출 시작 ~ 종료 시간 기입
- 외출 시간 파악 불가 시 이름만 기입 (외출신청서 별도 작성하지 않은 경우 이름만 기입)

예시)
- 김경일 (11:10 ~ 12:20)
- 김경일


5. 조퇴
- 이름과 퇴실 시간 기입

예시)
- 김경일 (14:34)

```