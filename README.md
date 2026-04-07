# 훈련일지 자동화

Playwright + Google Sheets + Discord Webhook 기반 자동 실행 파이프라인입니다.

## 개요

| 항목 | 내용 |
|------|------|
| 프로젝트명 | `training-journal-automation` |
| 실행 방식 | Node.js 스크립트 + GitHub Actions |
| 주요 기능 | 사이트 크롤링, 시트 연동, 데이터 가공, 디스코드 전송, 단계별 오류 보고 |
| 스케줄 | 매일 KST 17:30 (`cron: 30 8 * * *`) |

## 구조

```
.
├── .github/workflows/training-journal-automation.yml
├── src/
│   ├── index.js
│   ├── pipeline.js
│   ├── config.js
│   ├── crawl-site.js
│   ├── fetch-sheet.js
│   ├── transform-data.js
│   ├── discord.js
│   └── errors.js
├── .env.example
├── package.json
└── docs/
```

## 로컬 실행

1. Node.js 20+ 설치
2. 의존성 설치
   ```bash
   npm install
   ```
3. `.env.example`를 참고해 `.env` 생성
4. 실행
   ```bash
   npm run start
   ```

## 필수 환경변수

- `TARGET_SITE_URL`
- `TARGET_SITE_ID`
- `TARGET_SITE_PW`
- `GOOGLE_SHEET_ID`
- `GOOGLE_SERVICE_ACCOUNT` (JSON 문자열 또는 Base64(JSON))
- `DISCORD_WEBHOOK_URL`

선택값:
- `GOOGLE_SHEET_RANGE` (기본값: `Sheet1!A:Z`)
- `TARGET_SITE_*_SELECTOR` (사이트별 로그인/갱신 선택자 커스터마이징)
- `TIMEZONE` (기본값: `Asia/Seoul`)
- `DRY_RUN` (`true`면 디스코드 전송 생략)

## GitHub Actions 설정

워크플로 파일: `.github/workflows/training-journal-automation.yml`

`Repository secrets`에 아래 키를 등록해야 합니다:
- `TARGET_SITE_URL`
- `TARGET_SITE_ID`
- `TARGET_SITE_PW`
- `GOOGLE_SHEET_ID`
- `GOOGLE_SERVICE_ACCOUNT`
- `DISCORD_WEBHOOK_URL`

필요하면 선택자 시크릿도 추가할 수 있습니다:
- `TARGET_SITE_ID_SELECTOR`
- `TARGET_SITE_PW_SELECTOR`
- `TARGET_SITE_SUBMIT_SELECTOR`
- `TARGET_SITE_REFRESH_SELECTOR`
