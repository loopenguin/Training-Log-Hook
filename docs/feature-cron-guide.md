# 핵심 기능 및 외부 크론 설정 가이드

본 문서는 `training-journal-automation` 시스템의 **핵심 기능**과 cron-job.org를 활용한 **외부 크론 설정 방법**에 대한 구체적인 단계별 가이드를 제공합니다.

---

## 1. 핵심 기능 (웹 앱 대신 자동화 스크립트)

훈련일지 자동화 시스템은 다음 6가지 핵심 기능을 바탕으로 작동합니다.

| # | 기능명 | 설명 | 입력 | 출력 | 우선순위 |
|---|--------|------|------|------|---------|
| F1 | 사이트 크롤링 | 특정 사이트 자동 로그인 후 갱신 버튼 클릭 및 페이지 데이터 추출 | - | 추출된 원시 데이터 | P0 (필수) |
| F2 | 구글 시트 연동 | 타겟 Google Spreadsheet의 문서 내용 읽어오기 | 구글 API 인증 키 | 시트 파싱 데이터 | P0 (필수) |
| F3 | 데이터 가공 로직 | 수집된 양측(사이트+시트)의 데이터를 요구 수식/형식에 맞춰 변환 | F1, F2 데이터 | 전송용 포맷 문자열 | P0 (필수) |
| F4 | 대상 사이트 직접 기입 (최종) | 가공 완료된 출결 및 일지 데이터를 훈련 운영 사이트에 직접 자동 입력 및 승인 처리 | 타겟 사이트 제출 폼 selector | 사이트 데이터 기입 완료 | P0 (최종 목표) |
| F4-1 | 결과 전송 알림 (MVP/차선책) | 사이트 기입 성공 여부 및 가공 단계에서의 오류 등을 디스코드 채널로 요약 발송 | 디스코드 웹훅 주소 | 메신저 메시지 발송 | P1 (중요) |
| F5 | 상세 오류 추적 및 보고 | "페이지 크롤링 / 구글 시트 연동 / 데이터 가공" 중 어디서 에러가 났는지 구체적 지점을 검출하여 보고 | 구간별 예외 상황 (try-catch) | 발생 위치(구간)가 포함된 상세 에러 알림 | P1 (중요) |

### 1.1 핵심 기능 수행을 위한 필수 자료 확보 절차

위 핵심 기능들(F1~F5)이 정상 동작하려면 각 단계에 맞는 외부 연동 자료(접속 정보, API 키 등)를 사전에 확보해야 합니다. 

#### 1) 사이트 크롤링 및 자동 기입용 계정 (F1, F4)
훈련일지 사이트(LMS)에 로그인하여 데이터를 읽고 쓰기 위한 계정 정보입니다.
1. **타겟 사이트 URL**: 로그인 페이지 또는 데이터 페이지 주소. (예: `https://lecture.develrocket.com/...`)
2. **아이디/비밀번호**: 자동화 봇이 사용할 계정. (보안을 위해 최소 권한이 부여된 크롤링 전용 더미 계정 발급 권장)

#### 2) 구글 시트 연동용 API 및 주소 (F2, F3)
기록된 출결 시트를 읽어오기 위해 구글 API 서비스 계정과 문서 ID가 필요합니다.
1. **구글 서비스 계정 키 (JSON)**:
   - [Google Cloud Console](https://console.cloud.google.com/) 접속 후 새 프로젝트를 생성합니다.
   - `Google Sheets API`를 검색하여 활성화(Enable)합니다.
   - **[IAM 및 관리자] > [서비스 계정]** 메뉴에서 새 서비스 계정을 생성합니다. (예: `bot-sheet@...`)
   - 해당 서비스 계정의 **키(Key)** 탭에서 **새 키 만들기(JSON)**를 클릭하여 파일을 다운로드합니다.
2. **구글 시트 ID**:
   - 연동할 대상 구글 스프레드시트를 브라우저로 엽니다.
   - 주소창 URL(예: `https://docs.google.com/spreadsheets/d/1BxiM.../edit`)에서 `/d/`와 `/edit` 사이의 긴 문자열(`1BxiM...`)을 복사합니다.
3. **권한 부여 (중요)**:
   - 해당 스프레드시트의 우측 상단 **[공유]** 버튼을 눌러, 위에서 만든 서비스 계정 이메일 주소에 **뷰어(Viewer)** 또는 **편집자(Editor)** 권한을 반드시 부여해야 봇이 읽을 수 있습니다.

#### 3) 디스코드 결과 알림용 웹훅 주소 (F4-1, F5)
처리 결과와 에러 발생 위치를 메신저로 즉각 보고받기 위해 디스코드 웹훅 주소를 생성합니다.
1. 알림을 수신할 디스코드 채널명 우측의 **[편집(톱니바퀴)]** 아이콘을 클릭합니다.
2. **[연동(Integrations)] > [웹훅(Webhooks)] > [새 웹훅 만들기]**를 클릭합니다.
3. 봇의 이름(예: `훈련일지 알리미`)과 프로필을 지정한 후 **[웹훅 URL 복사]** 버튼을 클릭하여 `https://discord.com/api/webhooks/...` 형태의 주소를 확보합니다.

> 💡 **참고**: 여기서 확보한 모든 자료(아이디, 비밀번호, API 키, 웹훅 URL 등)는 절대 코드에 직접 기입하지 마시고, `docs/ENV_SETUP.md` 문서를 참고하여 GitHub 저장소의 **Settings > Secrets and variables > Actions** 메뉴에 등록하여 안전하게 사용하십시오.

---

## 2. 외부 크론(cron-job.org) 설정 가이드

GitHub Actions에 내장된 cron 트리거는 서버 트래픽 상황에 따라 수십 분 지연될 수 있습니다. 정해진 시각(KST 14:10 / 17:30)에 정확히 훈련일지를 기입하고 보고하기 위해, 외부 스케줄러인 **cron-job.org**를 사용하여 GitHub API를 직접 호출(`workflow_dispatch`)합니다.

### 2.1 사전 준비물

1. **GitHub 계정의 PAT (Personal Access Token)**
   - 발급 경로: GitHub 계정 Settings > Developer settings > Personal access tokens (Tokens (classic))
   - 권한(Scope): `repo` 권한 체크 필수.
2. **cron-job.org 계정**
   - [cron-job.org](https://cron-job.org) 접속 후 무료 회원가입 완료.

### 2.2 GitHub API 호출 정보 구성

크론에서 보낼 HTTP 요청 정보는 다음과 같습니다.

* **Method**: `POST`
* **URL**: `https://api.github.com/repos/loopenguin/Training-Log-Hook/actions/workflows/training-journal-automation.yml/dispatches` (만약 다른 계정에서 사용한다면 계정명 수정)
* **Headers**:
  * `Accept: application/vnd.github+json`
  * `Authorization: Bearer <사전 발급한 GitHub PAT>`
  * `Content-Type: application/json`
* **Body (JSON)**: `{"ref": "main"}` (만약 워크플로가 다른 브랜치에 있다면 브랜치명 수정)

### 2.3 단계별 크론 작업 생성 가이드

사이트 **cron-job.org** 대시보드에 로그인한 후 다음 절차를 따릅니다.

#### 1단계: COMMON 탭 - 기본 및 스케줄 설정
1. 우측 상단의 **[CREATE CRONJOB]** 버튼을 클릭하여 생성 화면으로 진입합니다.
2. 상단 탭이 **[COMMON]**으로 선택되어 있는지 확인합니다.
3. **Title**: `Training Journal - 17:30 KST` 등 식별하기 쉬운 이름 지정.
4. **URL**: 위에서 준비한 GitHub API URL 입력. (예: `https://api.github.com/repos/...`)
5. **Enable job**: 토글 활성화 (ON).
6. **Save responses in job history**: 토글 비활성화 (OFF).
7. **Execution schedule**: `Custom` 라디오 버튼을 선택합니다.
   - `Days of week` 목록에서 평일(`Monday` ~ `Friday`)을 마우스로 클릭하여 모두 다중 선택합니다. (선택 시 회색으로 강조됨)
   - `Hours`와 `Minutes`에서 실행을 원하는 시각(예: 17, 30)을 각각 찾아 클릭합니다.
   - 설정이 완료되면 영역 아래쪽 `Crontab expression` 란이 `30 17 * * 1-5` 형태로 자동으로 조합되어 나타나는지 확인합니다.

#### 2단계: COMMON 탭 - 알림(Notify me when...) 설정
화면 맨 아래 `Notify me when...` 영역에서 다음 항목을 설정합니다.
1. **execution of the cronjob fails**: 토글 활성화 (ON). 하단에 `Notify after 1 failure`로 설정하여 첫 실패 시 즉시 알림을 받도록 합니다.
2. **execution of the cronjob succeeds after it failed before**: 토글 비활성화 (OFF).
3. **the cronjob will be disabled because of too many failures**: 토글 활성화 (ON).

#### 3단계: ADVANCED 탭 - HTTP 헤더 설정
1. 화면 맨 상단의 **[ADVANCED]** 탭을 클릭하여 이동합니다.
2. **Requires HTTP authentication**: 토글 비활성화 (OFF).
3. **Headers** 하단의 **[+ ADD]** 버튼을 여러 번 눌러 다음 3개의 키-값 쌍을 정확히 등록합니다.
   - Key: `Accept`, Value: `application/vnd.github+json`
   - Key: `Authorization`, Value: `Bearer <여러분의_PAT_토큰값>` (`Bearer` 단어 뒤에 띄어쓰기 1칸 유의)
   - Key: `Content-Type`, Value: `application/json`

#### 4단계: ADVANCED 탭 - 고급 상세 옵션 설정
화면 아래쪽 `Advanced` 영역을 찾아 다음 항목을 기입/선택합니다.
1. **Time zone**: `Asia/Seoul` 선택.
2. **Request method**: `POST` 선택.
3. **Request body**: 하단 텍스트 영역에 `{"ref":"main"}` 기입.
4. **Timeout**: `30` seconds 기본값 유지.
5. **Treat redirects with HTTP 3xx status code as success**: 토글 비활성화 (OFF).

#### 5단계: 최종 저장 및 테스트
1. 화면 우측 하단의 **[SAVE]** 버튼을 눌러 작업을 저장합니다.
2. 필요한 경우 `14:10` 등 다른 시간대의 크론 작업을 동일한 방식으로 추가 생성합니다.

---

> **테스트 방법**: 스케줄러가 정상적으로 동작하는지 확인하려면, 생성된 작업 목록 우측의 **[Test run]** 아이콘을 클릭한 뒤, GitHub Repository의 **Actions** 탭에서 워크플로가 정상적으로 트리거(In Progress)되는지 확인하세요.
