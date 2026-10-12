# ko/en 이중언어 점검 리포트 — 2026-10-12

## 요약

- **점검한 글**: 26개 ko/en 짝 (`src/content/pages/cv/`는 지시에 따라 제외)
- **번역 드리프트**: 0건
- **표현 점검**(직역투·비문·오탈자): 0건
- **사실 점검**(Claude Code 관련, `posts/claude/*` 5개 글 대상): **오류 3건**, 확인됨-정확 다수, 확인 불가(참고용) 다수

전반적으로 ko/en 짝의 **구조적 동기화와 번역 품질은 매우 양호**합니다. 유일하게 손볼 곳은 `posts/claude/routine`, `posts/claude/loop` 두 글의 Claude Code 공식 문서 대비 사실 오류 3건입니다.

---

## 1. 번역 드리프트 + 2. 표현 점검

6개 하위 그룹으로 나눠 각 ko.md/en.md 전문을 대조했습니다. **26개 글 전부 이상 없음**입니다 (헤딩 개수·순서·계층, 표 행, 코드블록, 이미지 참조가 모두 1:1로 대응되고, en.md에 번역되지 않고 남은 한국어도 없었습니다 — 실제 명령어 출력(`git log` 등)에 남은 한국어 커밋 메시지는 실습 기록이라 정상입니다).

### posts/ai (13개)
- r-cnn — 이상 없음
- experiment-X-Ray-transfer-learning — 이상 없음
- optimizer-scheduler-amp — 이상 없음
- accuracy-precision-recall-f1-auroc — 이상 없음
- practical-statistics-for-data-scientists/sampling-distribution-and-bootstrap — 이상 없음
- practical-statistics-for-data-scientists/data-distribution-and-correlation — 이상 없음
- practical-statistics-for-data-scientists/data-types-location-and-variability-estimation — 이상 없음
- experiment-x-ray-transfer-learning-result — 이상 없음
- logistic-regression — 이상 없음
- ssd-classification-head-replacement — 이상 없음
- object-detection-metrics-iou-ap-map — 이상 없음
- limitation-of-linear-decision-boundary-and-MLP — 이상 없음
- experiment-data-normalization-and-augmentation — 이상 없음

### posts/python (3개)
- 01-everything-is-an-object — 이상 없음
- 02-variables-are-name-tags — 이상 없음
- 03-the-inside-story-of-if — 이상 없음

### posts/git, posts/claude (6개)
- git/worktree — 이상 없음
- claude/hook — 이상 없음
- claude/intro-automation-hook-loop-routine — 이상 없음
- claude/loop — 이상 없음
- claude/routine — 이상 없음
- claude/worktree — 이상 없음

### projects, experiences, pages (4개)
- projects/relu-soft/west-side-barbell-club/01-about-conjugate — 이상 없음
- projects/relu-soft/west-side-barbell-club/02-raise-a-prob-and-sol — 이상 없음
- experiences/code-it/code-it — 이상 없음 (DocLinks 허브 문서 구조는 정상 동작이라 제외하고 본문 텍스트만 비교)
- pages/home — 이상 없음

---

## 3. 사실 점검 — Claude Code 관련 서술

대상: `posts/claude/hook`, `posts/claude/intro-automation-hook-loop-routine`, `posts/claude/loop`, `posts/claude/routine`, `posts/claude/worktree`. ko.md/en.md가 동일한 서술을 하고 있어 번역 drift로 인한 사실 불일치는 없었습니다. 아래 "확인됨-오류" 3건은 제가 직접 `code.claude.com/docs/en/routines`, `/scheduled-tasks` 원문을 재조회해 재검증했습니다.

### src/content/posts/claude/hook
**이상 없음** (사실 오류 없음). 특히 "hook 이벤트 33종" 전체 목록(SessionStart, Setup, UserPromptSubmit, UserPromptExpansion, PreToolUse, PermissionRequest, PermissionDenied, PostToolUse, PostToolUseFailure, PostToolBatch, Notification, MessageDisplay, SubagentStart, SubagentStop, TaskCreated, TaskCompleted, Stop, StopFailure, TeammateIdle, InstructionsLoaded, ConfigChange, CwdChanged, DirectoryAdded, FileChanged, WorktreeCreate, WorktreeRemove, PreCompact, PostCompact, PreModelSwitch, PostModelSwitch, Elicitation, ElicitationResult, SessionEnd)을 공식 문서에서 끝까지 세어 정확히 33개임을 확인했습니다. exit 2 차단 여부 표, hook type 5종(`command`/`http`/`mcp_tool`/`prompt`/`agent`), 기본 타임아웃(600초/30초/60초, `UserPromptSubmit` 30초, `MessageDisplay` 10초), matcher 규칙, 환경변수(`CLAUDE_PROJECT_DIR` 등), `stop_hook_active`, `async`/`asyncRewake`, `disableAllHooks`, settings.json 3단계 위치까지 모두 문서와 일치했습니다.
- **[확인 불가]** `/hooks`로 등록 여부 확인, `claude --debug`로 stdout/stderr 확인 — 참고용으로만 남깁니다.

### src/content/posts/claude/intro-automation-hook-loop-routine
**이상 없음.** 대표 hook 이벤트 4종, `/loop` 7일 만료, 동적 모드 1분~1시간 간격, routine 트리거 3종(cron/API/GitHub) 모두 문서와 일치했습니다.

### src/content/posts/claude/loop
- **[확인됨-오류]** — `en.md`, `ko.md` 공통 서술: "`claude --resume`/`--continue`로 재개하면 **만료 전** 태스크는 복원된다"

  > 공식 문서(`/docs/en/scheduled-tasks` Limitations): "Claude Code restores the tasks scheduled with `CronCreate`, except recurring tasks that have expired... **A self-paced `/loop` isn't restored, so run `/loop` again to restart it.**"

  **제안**: "단, 동적 모드(간격 없이 `/loop`만 친 self-paced 루프)는 재개해도 복원되지 않으므로 다시 `/loop`를 실행해야 한다"는 예외를 문장에 추가해주세요. (고정 간격으로 `CronCreate`된 태스크는 만료 전이면 정상 복원되는 것이 맞습니다.)

- 그 외 `/loop [간격] [프롬프트]` 문법, 간격 파싱 규칙, `loop.md` 위치·25,000바이트 절단, 중단 방법, 7일 만료, `CronList`/`CronDelete`, 세션당 최대 50개, 지터 없음, `CLAUDE_CODE_DISABLE_CRON=1` 등은 모두 문서와 일치해 **이상 없음**.
- **[확인 불가]** cron 변환 규칙의 N 상한(`Nm`≤59, `Nh`≤23 등), 지터가 "잡 ID 기반"이라는 설명 — 참고용으로만 남깁니다(틀렸다는 뜻 아님).

### src/content/posts/claude/routine
- **[확인됨-오류]** — 공통 서술: "CLI `/schedule`로는 예약(cron) 트리거만 만들 수 있고, API 트리거와 **GitHub 트리거는 웹 UI에서만** 붙일 수 있다"

  > 공식 문서(`/docs/en/routines` "Add a GitHub trigger"): "**From the CLI**, install the app from the GitHub App page first, then ask Claude to attach a GitHub trigger to an existing routine... The CLI path requires Claude Code v2.1.225 or later."

  **제안**: "API 트리거만 웹 UI 전용이고, GitHub 트리거는 CLI에서도 가능하다(GitHub App을 먼저 설치해야 하고 v2.1.225 이상 필요)"로 수정해주세요.

- **[확인됨-오류]** — 공통 서술: "계정당 **일일** 실행 횟수 상한이 있고, **1회성(one-off) 실행은 그 상한에서 제외**된다"

  > 공식 문서(`/docs/en/routines` Usage and limits 표): "Scheduled runs, **including one-off runs**: 100 per hour, counted for your account."

  실제로는 ① 상한 단위가 일일이 아니라 **시간당(hourly)**이고, ② **1회성 실행도 그 한도에 포함**되어 있어 원문 서술과 정반대입니다.

  **제안**: "구독 사용량과 별개로 **시간당** 실행 횟수 상한이 있다(예약 실행은 1회성 포함 시간당 100회, Run now/API 호출은 루틴당 시간당 30회, 계정 전체로는 Run now 시간당 100회·API 시간당 100회). 1회성 실행도 이 한도에 포함된다"로 수정해주세요.

- `routine`이 research preview라는 점, 최소 간격 1시간, `mcp_connections` 기본 전체 포함(쓰기 포함 승인 없이 호출), 로컬 `claude mcp add` 서버가 커넥터 목록에 안 뜨는 것, `/web-setup`은 클론 권한만 주는 것, GitHub 계정으로 커밋이 남는 것, `/schedule list`·`update`·`run`/`/routines` 별칭 등은 모두 문서와 일치해 **이상 없음**.
- **[확인 불가]** cron 식이 "언제나 UTC 기준"이라는 서술, `claude/` 접두 브랜치 자동 통과·다른 브랜치 거부 검사 3가지 조건, Network access 레벨의 구체 기본 허용 도메인 목록, 텔레메트리 비활성화 변수가 `/schedule`을 숨긴다는 서술, `job_config.ccr` 스키마와 `clear_mcp_connections` 필드명 — 공식 문서 페이지 범위에서 확인하지 못했습니다(틀렸다는 뜻이 아니라, 저자가 API를 직접 호출해보며 얻은 세부사항일 수 있습니다).

### src/content/posts/claude/worktree
**이상 없음.** `claude -w <name>` 동작, `worktree.baseRef`의 `"fresh"`/`"head"` 두 값, 24시간마다 최대 5초 fetch, 이름 재사용 시 동작, `.worktreeinclude` 문법, 세션 종료 시 정리 규칙, 파일 편집·작업디렉터리·git 리다이렉트 차단, 서브에이전트 `isolation: worktree`, 정리 주기, PR 리뷰용 `claude -w "#1234"`, `EnterWorktree`/`ExitWorktree`, 심볼릭 링크 거부, 워크트리 안에서 `--resume` 금지까지 모두 공식 문서와 일치했습니다.
- **[확인 불가]** `.git/worktrees/<name>/CLAUDE_BASE` 파일명, 서브에이전트 워크트리 이름이 `agent-<해시>` 형태라는 구체적 명명 규칙 — 참고용으로만 남깁니다.

---

## 제외 사항

`src/content/pages/cv/`는 지시에 따라 점검에서 제외했습니다.

## Discord 전송

환경변수 `DISCORD_WEBHOOK_URL`이 설정되어 있어 요약을 Discord로 전송했습니다.
