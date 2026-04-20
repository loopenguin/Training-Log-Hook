# Changelog

| Date | Agent | Task | Files | Summary |
|------|-------|------|-------|---------|
| 2026-04-07 | codex | 프로젝트 초기화 및 파이프라인 개발 | `package.json`, `.github/workflows/training-journal-automation.yml`, `src/*`, `README.md` | Node 기반 자동화 파이프라인 및 GitHub Actions 스케줄 워크플로 구축 |
| 2026-04-07 | antigravity | 데이터 맵핑/조립 로직 고도화 및 크롤링 디버깅 | `src/crawl-site.js`, `src/fetch-sheet.js`, `src/transform-data.js`, `src/pipeline.js` | 로그인 SSO 버그 패치, 시트 헤더/날짜 동적 맵핑 로직, 출석 상태 조인 및 디스코드 포맷 파서 적용 완료 |
| 2026-04-08 | antigravity | 주말/공휴일 자동 갱신 제외(Skip) 로직 구축 | `.github/workflows/training-journal-automation.yml`, `src/holidays.js`, `src/pipeline.js` | GitHub Actions Cron 요일 제한(월~금) 및 외부 API 의존 없는 자체 공휴일 단일 캘린더 모듈(`holidays.js`) 구현 |
| 2026-04-08 | antigravity | F4 대상 사이트 직접 제출 로직 구현 및 검증 파이프라인 결합 | `src/submit-data.js`, `src/pipeline.js`, `src/config.js`, `src/transform-data.js` | Playwright 기반 훈련 플랫폼 폼 기입 및 제출 스크립트 도출, 실운영 환경 보호를 위한 `DRY_RUN` 옵션 적용 |
| 2026-04-10 | codex | code-review 이슈 수정 | `pipeline.js`, `transform-data.js`, `crawl-site.js`, `submit-data.js`, `discord.js`, `fetch-sheet.js` | 🔴 치명 2건 + 🟠 주의 6건 + 🟡 개선 3건 수정 완료 |
| 2026-04-10 | antigravity | Fix scheduled workflow timing issue | `.github/workflows/trigger.yml`, `.github/workflows/training-journal-automation.yml` | GHA 내부 dispatch 방식으로 스케줄 안정화. trigger.yml KST 14:10/17:30 (월~금) 운영 크론 설정. training-journal-automation.yml은 workflow_dispatch 전용으로 분리 |
| 2026-04-14 | antigravity | 수료 카테고리 추가 및 v1.1 버전 갱신 | `src/transform-data.js`, `src/submit-data.js`, `README.md`, `package.json` | GRADUATED_NAMES 상수로 수료자 분류, 훈련일지 '6. 수료' 항목 추가, v1.1.0 릴리즈 |
| 2026-04-20 | antigravity | 외부 크론 발화 안정화 (cron-job.org) | `cron-job.org 설정 (외부)` | cron-job.org에 잡 2개 생성 — Training Journal 14:10 KST (UTC 05:10), 17:30 KST (UTC 08:30), 월~금. GitHub API workflow_dispatch 호출로 GHA 스케줄 지연 문제 우회 |

