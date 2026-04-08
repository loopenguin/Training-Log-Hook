# Changelog

| Date | Agent | Task | Files | Summary |
|------|-------|------|-------|---------|
| 2026-04-07 | codex | 프로젝트 초기화 및 파이프라인 개발 | `package.json`, `.github/workflows/training-journal-automation.yml`, `src/*`, `README.md` | Node 기반 자동화 파이프라인 및 GitHub Actions 스케줄 워크플로 구축 |
| 2026-04-07 | antigravity | 데이터 맵핑/조립 로직 고도화 및 크롤링 디버깅 | `src/crawl-site.js`, `src/fetch-sheet.js`, `src/transform-data.js`, `src/pipeline.js` | 로그인 SSO 버그 패치, 시트 헤더/날짜 동적 맵핑 로직, 출석 상태 조인 및 디스코드 포맷 파서 적용 완료 |
| 2026-04-08 | antigravity | 주말/공휴일 자동 갱신 제외(Skip) 로직 구축 | `.github/workflows/training-journal-automation.yml`, `src/holidays.js`, `src/pipeline.js` | GitHub Actions Cron 요일 제한(월~금) 및 외부 API 의존 없는 자체 공휴일 단일 캘린더 모듈(`holidays.js`) 구현 |
