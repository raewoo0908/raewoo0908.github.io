# ko/en 이중언어 + Claude Code 사실 점검 리포트 (2026-10-05)

## 요약

`src/content/` 아래 ko.md/en.md 짝 **19편**을 점검했습니다 (`src/content/pages/cv/`는 draft 상태라 제외 — 맨 아래 참고).

| 카테고리 | 점검 글 수 | 번역 드리프트 | 표현(오탈자 등) | Claude Code 사실 확인 |
| --- | --- | --- | --- | --- |
| posts/ai | 7 | 0 | 0 | - |
| posts/claude | 5 | 1 | 2 | 확인된 불일치 3건, 완전성 이슈 1건, 참고 1건 |
| posts/git, posts/python, projects/relu-soft, pages/home | 7 | 0 | 0 | - |

전체 19편 중 17편은 **이상 없음**입니다. 발견 사항은 모두 `posts/claude/*` 5편에 몰려 있고, 그중에서도 번역 자체보다 **Claude Code 기술 서술의 정확성** 쪽에 유의미한 발견이 있었습니다.

사실 점검은 https://code.claude.com/docs/en/ 의 `hooks`, `scheduled-tasks`, `routines`, `worktrees` 페이지 원문을 직접 받아(스크립트 추출, 요약 모델을 거치지 않음) 대조했습니다. 이벤트 개수처럼 세는 항목은 문서의 목차 구조에서 실제로 전부 나열해 센 뒤 비교했습니다.

---

## posts/ai/* (7편) — 이상 없음

- `experiment-X-Ray-transfer-learning/`: 이상 없음
- `experiment-data-normalization-and-augmentation/`: 이상 없음
- `limitation-of-linear-decision-boundary-and-MLP/`: 이상 없음
- `logistic-regression/`: 이상 없음
- `practical-statistics-for-data-scientists/data-distribution-and-correlation/`: 이상 없음
- `practical-statistics-for-data-scientists/data-types-location-and-variability-estimation/`: 이상 없음
- `r-cnn/`: 이상 없음 (ko/en 간 드리프트는 없음)
  - 참고(번역 드리프트 아님, 참고용): `ko.md`/`en.md` 양쪽 코드 주석이 똑같이 "이미지 3장"이라고 쓰고 있는데, 실제 코드가 처리하는 이미지는 4장(`DOG_CAT`/`HUMANS`/`AIRPLANE`/`MANY_ANIMALS`)입니다. ko/en 둘 다 동일하게 틀려 있어 번역 문제는 아니지만, 원문 자체의 숫자 오기로 보여 기록만 남깁니다.

---

## posts/git/worktree, posts/python/*, projects/relu-soft/*, pages/home — 이상 없음

- `pages/home/`: 이상 없음
- `posts/git/worktree/`: 이상 없음
- `posts/python/01-everything-is-an-object/`: 이상 없음
- `posts/python/02-variables-are-name-tags/`: 이상 없음
- `posts/python/03-the-inside-story-of-if/`: 이상 없음
- `projects/relu-soft/west-side-barbell-club/01-about-conjugate/`: 이상 없음
- `projects/relu-soft/west-side-barbell-club/02-raise-a-prob-and-sol/`: 이상 없음

---

## posts/claude/hook/

### 표현/드리프트
이상 없음 — ko/en이 표·코드블록·stderr 메시지까지 정밀하게 대응합니다.

### Claude Code 사실 확인

**❌ 확인된 불일치 — "stdout이 Claude에게 보이는 이벤트는 셋뿐" (실제는 넷)**

- 파일: `ko.md:250`, `en.md:250`
- 인용(ko): `> 💡 **stdout이 Claude에게 보이는 이벤트는 셋뿐입니다** — UserPromptSubmit, UserPromptExpansion, SessionStart.`
- 인용(en): `> 💡 **Only three events have their stdout shown to Claude** — UserPromptSubmit, UserPromptExpansion and SessionStart.`
- 공식 문서(`https://code.claude.com/docs/en/hooks`, "Exit code 0" 절) 원문: *"For most events, Claude Code writes stdout to the debug log and doesn't show it in the transcript. **The exceptions are UserPromptSubmit, UserPromptExpansion, SessionStart, and PostModelSwitch**, where Claude Code adds plain-text stdout as context that Claude can see and act on."*
- 제안: "셋" → "넷(PostModelSwitch 포함)"으로 수정. ko/en 둘 다 동일하게 고쳐야 합니다.

**✅ 공식 문서로 확인됨 (오류 없음)**
- "이벤트 33종" — 문서 목차에서 실제로 전부 나열해 세어본 결과 정확히 33개(도구 6 + 프롬프트/표시 3 + 세션수명 8 + 턴종료/알림 3 + 서브에이전트/태스크 5 + 컨텍스트/워크트리/모델/MCP 8 = 33)로 일치합니다.
- 이벤트별 종료코드 2 차단표(`PreToolUse`✅/`PostToolUse`❌/`UserPromptSubmit`✅/`Stop`·`SubagentStop`✅/`SessionEnd`·`Notification`❌) — 문서의 "Exit code 2 behavior per event" 표와 정확히 일치.
- `matcher` 정확매치/정규식 판별 규칙 — 문서의 "Matcher patterns" 절과 문구까지 거의 일치.
- 환경변수 `CLAUDE_CODE_REMOTE`(원격이면 `"true"`), `CLAUDE_CODE_BRIDGE_SESSION_ID`, `CLAUDE_EFFORT` — 문서에 그대로 명시.
- `CLAUDE_FILE_PATHS`가 존재하지 않는 변수라는 주장 — 문서의 환경변수 어디에도 없음, 확인됨.
- 타임아웃 기본값(`command`/`http`/`mcp_tool`=600초, `agent`=60초, `UserPromptSubmit`=30초, `MessageDisplay`=10초) — 문서와 일치.
- `disableAllHooks` 설정 — 문서에 존재(기본값 `false`).

### 표현(오탈자) — 해당 없음

---

## posts/claude/intro-automation-hook-loop-routine/

### 표현/오탈자

- 파일: `ko.md` frontmatter `description`
- 인용: `"ClaudeCode의 세가지 자동화 방식 Hook, /loop, routine에 대해서 알아보자."`
- 문제: "세가지"는 띄어쓰기 오류. "세 가지"로 수정 제안. (en.md는 이 오탈자와 무관하게 정상 번역되어 있어 드리프트는 아님)

### Claude Code 사실 확인

**⚠️ 완전성 이슈 — `/loop`의 "Esc로 중단" · "`--resume`으로 복원"을 모든 모드에 적용되는 것처럼 서술**

- 파일: `ko.md:99-101`
- 인용: `"다음 반복 전에 **Esc**로 중단할 수 있고, 만료되지 않은 작업은 **--resume**으로 복원됩니다."`
- 공식 문서(`scheduled-tasks`) 대조 결과:
  - `Esc`는 **동적(self-paced) 루프가 다음 반복을 기다리는 동안에만** 작동합니다. 고정 간격 루프(그리고 "직접 부탁해서 만든" 태스크)는 `Esc`로 멈추지 않습니다 — *"Tasks you scheduled by asking Claude directly are not affected by Esc and stay in place until you delete them."* / *"Loops on a fixed interval keep running until you cancel them... or seven days elapse."*
  - `--resume`/`--continue`는 `CronCreate`로 만들어진(고정 간격) 태스크만 복원하고, **동적 `/loop`는 복원되지 않습니다** — *"A self-paced `/loop` isn't restored, so run `/loop` again to restart it."*
- 제안: 이 한 문장이 세 모드(고정/동적/기본 프롬프트) 전체에 걸리는 것처럼 읽혀서, 실제로는 `Esc`와 `--resume`이 서로 반대 모드에만 적용된다는 점이 드러나지 않습니다. 별도 글인 `posts/claude/loop/`에서는 이 구분이 대체로 정확하게 되어 있으니(아래 참고), 이 개요 글도 같은 구분을 반영하거나 "자세한 건 다음 글에서" 식으로 범위를 좁히는 쪽을 제안합니다.

**✅ 공식 문서로 확인됨**
- Hook/`/loop`/routine 3분류 비교(트리거·실행 위치·머신 꺼짐 허용 여부) — 공식 문서들과 부합.
- routine 트리거 3종(예약/API/GitHub)과 "하나의 routine에 여러 트리거를 함께 붙일 수 있다" — `routines` 문서와 일치.
- "대표적인 이벤트는 네 가지"라며 `PreToolUse`/`PostToolUse`/`Notification`/`Stop` 네 개만 들고 "실제로는 더 있다"고 명시 — hook 상세 글(33종)과 상충하지 않고 의도적으로 축약했다고 밝히고 있어 문제 없음.

---

## posts/claude/loop/

### 번역 드리프트

**❌ 실제 명령어 출력이어야 하는 콘솔 블록의 커밋 메시지가 ko/en에서 다른 텍스트**

- 파일: `ko.md:93`, `en.md:93`
- 인용(ko): `` ✓  feat(toc): 목차 추가        Deploy to GitHub Pages  main  30196201653  39s ``
- 인용(en): `` ✓  feat(toc): add table of contents  Deploy to GitHub Pages  main  30196201653  39s ``
- 문제: 같은 run ID(`30196201653`)·같은 소요시간(`39s`)의 **동일한 실제 `gh run list` 출력**인데 커밋 메시지 텍스트만 ko/en에서 다르게 적혀 있습니다. 실제 커밋 메시지는 하나일 수밖에 없으므로 한쪽은 가공된 것입니다. CLAUDE.md의 "실제 출력에 찍힌 한국어는 지적하지 말라"는 규칙은 **출력을 왜곡하지 않고 그대로 유지하는 경우**를 위한 것인데, 이 블록은 en.md 쪽이 실제 출력 텍스트까지 번역해버려 그 원칙과 충돌합니다. 참고로 같은 블로그의 `posts/git/worktree/`, `posts/claude/worktree/`는 실제 터미널 출력의 한국어 커밋 메시지를 en.md에서도 번역하지 않고 그대로 유지하고 있어, 이 글만 예외적으로 다릅니다.
- 제안: en.md의 콘솔 블록 커밋 메시지를 ko.md와 동일한 원문(실제 로그 그대로)으로 맞추는 것을 검토해 주세요.

### 표현

- 파일: `en.md` (함정 모음 #2 "Jitter")
- 인용: `"So that every session doesn't hit the API at the same wall-clock moment, the scheduler adds an **offset** to fire times."`
- 문제: 한국어 원문의 어순("~하지 않도록, ~합니다")을 그대로 옮긴 직역투에 가깝습니다.
- 제안: `"To keep every session from hitting the API at the same moment, the scheduler adds an offset to fire times."` 처럼 목적을 부사구로 앞세우는 편이 더 자연스럽습니다.

### Claude Code 사실 확인

**⚠️ 완전성 이슈 — `--resume` 복원 서술에 동적 루프 예외가 빠짐**

- 파일: `ko.md:175`
- 인용: `"claude --resume 또는 --continue로 재개하면 만료 전 태스크(반복은 생성 후 7일 이내)가 복원됩니다."`
- 공식 문서: *"A self-paced `/loop` isn't restored, so run `/loop` again to restart it."* — 동적(간격 생략) 루프는 `--resume`으로 복원되지 **않는다**고 명시돼 있는데, 이 문장은 예외를 언급하지 않아 동적 루프까지 복원되는 것처럼 읽힙니다. 같은 글의 "멈추는 법" 섹션에서는 `Esc`/`stop:true`/`CronDelete`를 모드별로 정확히 구분해 서술하고 있어서, 이 "수명" 섹션만 구분이 빠진 것으로 보입니다.
- 제안: "(동적 루프는 `--resume`으로 복원되지 않으므로 다시 `/loop`를 쳐야 합니다)" 같은 단서를 추가.

**✅ 공식 문서로 확인됨 (상당수)**
- `/loop [간격] [프롬프트]` 문법, 3가지 입력 조합(간격+프롬프트→`CronCreate`, 프롬프트만→`ScheduleWakeup`, 둘 다 생략→내장 프롬프트/`loop.md`) — 문서의 표와 정확히 일치.
- 슬래시 커맨드를 루프 프롬프트로 전달하는 예시 `/loop 20m /review-pr 1234` — 문서의 예시와 **문자 그대로 동일**.
- 최소 간격 1분, `30s`→`1m` 올림, `7m`/`90m` 같은 간격이 반올림되고 Claude가 알려준다는 서술 — 문서와 일치.
- 동적 모드 간격 범위 "1분~1시간", 매 반복 끝 간격·이유 출력 — 일치.
- `loop.md` 탐색 순서(`.claude/loop.md` 우선 → `~/.claude/loop.md`)와 25,000바이트 제한 — 일치.
- 지터: 반복 태스크 최대 30분 지연(1시간보다 짧은 간격이면 절반까지), 동적 모드엔 지터 없음 — 문서와 일치.
- `CronDelete`의 8자리 잡 ID, 세션당 최대 50개 태스크, `CLAUDE_CODE_DISABLE_CRON=1` — 모두 문서에 명시된 그대로.
- "고정 간격 루프는 `stop: true`로 안 멈춘다" / "`Esc`는 동적 루프에만, 고정 간격은 `CronDelete`" — 문서와 일치(이 글 안에서는 올바르게 구분됨 — 위 `--resume` 항목만 예외).

---

## posts/claude/routine/

### 표현/오탈자

- 파일: `ko.md` (동작 원리 섹션 / 이미지 alt)
- 인용: `"접근 가능한 Github 저장소..."`, `"![github에 Claude 앱 설치]..."`
- 문제: 고유명사 "GitHub" 표기가 "Github"·"github"로 흔들립니다(en.md는 두 곳 모두 "GitHub"로 정확 표기). "GitHub"로 통일 제안.

### Claude Code 사실 확인

**❌ 확인된 불일치 — "CLI `/schedule`로는 예약 트리거만, GitHub 트리거는 웹 UI에서만"**

- 파일: `ko.md:82`, `en.md` 동일 문장
- 인용: `"⚠️ CLI /schedule로는 예약(cron) 트리거만 만들 수 있습니다. API 트리거와 GitHub 트리거는 웹 UI에서 붙여야 합니다."`
- 공식 문서(`routines`, "Add a GitHub trigger" 절) 원문: *"From the CLI, install the app from the GitHub App page first, then ask Claude to attach a GitHub trigger to an existing routine... You can add a GitHub trigger from the web or from the CLI. The CLI path requires Claude Code v2.1.225 or later."*
- 문제: **GitHub 트리거는 CLI에서도 추가할 수 있습니다** (Claude에게 직접 요청하는 방식으로, `v2.1.225` 이상 필요). 이 글의 표(`무엇을 채우는가` 위쪽 표)도 "CLI: 예약 트리거만"이라고 못박고 있어 같은 오류가 반복됩니다. **API 트리거**가 웹 UI 전용이라는 부분은 문서와 일치하므로 맞습니다(*"API triggers are added to an existing routine from the web. The CLI cannot currently create or revoke tokens."*).
- 제안: "API 트리거는 웹 UI에서만, GitHub 트리거는 웹 UI 또는 CLI(Claude에게 직접 요청, v2.1.225+)에서 붙일 수 있습니다"로 수정.

**❌ 확인된 불일치 — routine 실행 횟수 상한을 "일일"이라고 서술 (문서는 "시간당")**

- 파일: `ko.md:409-413`
- 인용: `"routine 실행도 일반 세션과 똑같이 구독 사용량을 씁니다. 거기에 더해 계정당 일일 실행 횟수 상한이 따로 있습니다. 한도에 걸리면 429가 나고... 1회성 실행(one-off)은 일일 상한에서 제외됩니다."`
- 공식 문서(`routines`, "Usage and limits" 절) 원문: *"Separately from subscription usage, each way of starting a run has an hourly limit: **Scheduled runs, including one-off runs | 100 per hour** | Your account | ... **Run now**, API fires, and setting a one-off routine to run again | 30 per hour | Each routine ..."*
- 문제 두 가지:
  1. 문서에 나오는 한도는 모두 **시간당(hourly)** 이고, "일일(daily)" 한도는 문서에 없습니다.
  2. "1회성 실행은 상한에서 제외된다"는 것도 반대입니다 — 문서는 오히려 *"Scheduled runs, **including one-off runs**"* 라고 써서, 1회성 실행이 예약 실행과 **같은 시간당 100회 한도에 포함**된다고 명시합니다.
- 제안: "계정당 시간당 실행 횟수 상한(예약 실행은 1회성 포함 시간당 100회, Run now·API fire는 계정당 시간당 100회/루틴당 시간당 30회)"으로 정정. "일일" 표현과 "1회성 제외" 서술 모두 삭제·수정 필요.

**참고(사실 오류로 보기는 애매함) — 블로그 내부 수치 불일치**

- 파일: `ko.md:233` (실제 돌려본 결과의 Discord 요약 인용문 안)
- 인용: `"hook/loop 글: 30개 훅 이벤트 목록 등 대부분 공식 문서와 일치 확인."`
- 비교 대상: `posts/claude/hook/ko.md`의 본문 주장은 "이벤트 33종"이고, 위 "hook/" 절에서 확인했듯 공식 문서 기준 정확한 숫자는 **33**입니다.
- 참고로 남기는 이유: 이 "30개"는 과거에 routine을 실제로 돌려봤을 때 Discord로 받은 메시지를 그대로 인용한 것으로 보이는 예시 텍스트라, 저자의 현재 주장이 아니라 **과거 routine 실행 결과(다른 AI 세션의 산출물)의 인용**입니다. 다만 같은 블로그 안에서 "30개"와 "33종"이라는 서로 다른 숫자가 함께 등장하므로, 혼란의 소지가 있어 기록만 남깁니다. (이 리포트의 공식 확인 결과는 33종입니다.)

**✅ 공식 문서로 확인됨**
- routine은 Anthropic 클라우드에서 실행되고 **research preview** 단계라는 서술 — 문서 상단 Note와 일치.
- 트리거 3종(예약/API/GitHub)과 "한 routine이 여러 트리거를 함께 쓸 수 있다" — 일치.
- 클라우드 세션에 승인 창이 없다는 서술 — 일치(문서는 "일부 artifact 동작은 예외"라는 단서를 추가로 달고 있으나, 글의 서술과 상충하지는 않음).
- cron 최소 간격 1시간, 정시에 뜨지 않고 분산된다(stagger)는 서술 — 일치.
- "routine 생성 시 연결된 모든 커넥터가 기본 포함되고, 포함된 커넥터의 모든 도구를 승인 없이 쓸 수 있다" — 문서와 정확히 일치.
- 네트워크 허용목록 바깥 요청이 `403`+`x-deny-reason: host_not_allowed`로 막힌다는 서술 — 문서와 **문자 그대로 일치**.
- `claude/` 접두 브랜치는 항상 push 허용 — 문서와 일치. (단, 그 외 브랜치에 대한 3가지 세부 거부 조건은 이번에 접근한 `routines` 문서에는 없어 **문서에서 직접 확인은 못 했습니다** — 틀렸다는 뜻이 아니라 이 글이 참조한 다른 공식 문서 페이지에 있을 가능성이 있습니다.)

**문서에서 확인 불가 (틀렸다는 뜻 아님)**
- API 필드명 `clear_mcp_connections`, `job_config.ccr.environment_id` 등 routine 생성 API의 세부 JSON 스키마 — 이번에 받은 문서 페이지에는 필드명이 나오지 않아 확인하지 못했습니다.
- `/schedule`이 "Unknown command"로 뜨는 원인 중 "텔레메트리 비활성화 환경변수(`DISABLE_TELEMETRY`, `DO_NOT_TRACK`, `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC`, `DISABLE_GROWTHBOOK`)" 부분 — `routines` 문서의 트러블슈팅 절에는 이 환경변수들이 나오지 않습니다(다른 로그인 관련 원인들은 문서와 일치). 별도의 환경변수 레퍼런스 문서에 있을 가능성이 있어, 틀렸다고는 할 수 없고 확인 불가로만 남깁니다.
- Discord 플러그인의 내부 구조(`~/.claude/channels/discord/.env` 경로, `bun` 커맨드 등)와 Claude GitHub App 설치 시 "Contents: Read and write" 권한 요구 — 플러그인 소스/실습 기반 서술로 보이고 이번에 대조한 공식 문서 페이지 범위 밖이라 확인하지 못했습니다.

---

## posts/claude/worktree/

### 표현/드리프트
이상 없음 — 매우 긴 글이지만 표·실제 터미널 출력·커밋 해시까지 ko/en이 정확히 대응합니다. 특히 실제 출력에 포함된 한국어 커밋 메시지(`feat: bye 추가` 등)를 en.md에서도 번역하지 않고 그대로 유지해, "실제 출력은 왜곡하지 않는다"는 원칙을 가장 일관되게 지키고 있습니다.

### Claude Code 사실 확인

**✅ 공식 문서로 확인됨 — 모두 일치**

공식 문서(`https://code.claude.com/docs/en/worktrees`) 원문을 직접 대조한 결과, 이 글에서 검증 가능한 주장들은 전부 일치했습니다.

- `-w`/`--worktree` 플래그, 기본 경로 `.claude/worktrees/<이름>/`, 브랜치명 `worktree-<이름>` — 일치.
- `worktree.baseRef`가 `"fresh"`(기본, 원격 기본 브랜치)/`"head"`(현재 로컬 HEAD) 두 값만 가능하고 브랜치 이름은 못 넣는다는 서술 — 문서와 **문자 그대로 일치**: *"You can't set `worktree.baseRef` to a branch name."*
- `"fresh"`일 때 원격이 24시간 이내에 fetch되지 않았으면 다시 fetch하되 **최대 5초**로 제한된다는 서술 — 문서와 **문자 그대로 일치**: *"when the repository hasn't been fetched in the last 24 hours, it fetches the default branch, capped at five seconds"*.
- `.worktreeinclude`가 `.gitignore` 문법을 따르고 "패턴에 맞으면서 동시에 gitignore된 파일만" 복사된다는 서술 — 문서와 일치: *"Only files that match a pattern and are also gitignored are copied, so tracked files are never duplicated."*
- 워크스페이스 trust 요구, 헤드리스(`-p`)가 이 검사를 건너뛴다는 서술 — 문서와 일치.
- PR 리뷰 시 `"#1234"`로 넘기면 `.claude/worktrees/pr-<번호>`에 생성된다는 서술 — 문서와 일치.
- 서브에이전트 isolation을 자연어 또는 frontmatter `isolation: worktree`로 설정한다는 서술과 예시 코드 — 문서의 예시와 거의 동일.
- `EnterWorktree`/`ExitWorktree` 도구명 — 문서에 그대로 존재.
- `.claude`/`.claude/worktrees`/워크트리 디렉터리 자체가 심볼릭 링크면 생성이 거부된다는 서술 — 문서와 일치.
- `cleanupPeriodDays` 설정과, 주기 청소가 `-w`로 만든 워크트리는 건드리지 않는다는 서술 — 문서와 일치.

**문서에서 확인 불가 (틀렸다는 뜻 아님)**
- `.git/worktrees/<이름>/` 안의 `CLAUDE_BASE` 파일(시작 커밋 해시 기록) — 문서 본문에는 이 파일명이 명시적으로 나오지 않았습니다. 다만 이 글은 실제로 그 파일을 `cat`해서 보여주는 실습 기반 서술이라, 문서에 안 적혀 있다고 해서 틀렸다는 뜻은 아닙니다.
- "Claude Code 2.1.x(작성 시점 2.1.222) 기준" — 특정 버전 번호는 문서에서 별도로 확인할 수 없는 저자의 환경 정보입니다.

---

## 결론

번역 품질 자체는 19편 전체에서 매우 높았습니다(진짜 드리프트는 `loop/`의 콘솔 블록 1건뿐). 반면 **Claude Code 기술 서술**에서는 `posts/claude/routine/`과 `posts/claude/hook/`에서 공식 문서와 어긋나는 지점이 각 1~2건씩 나왔고, `/loop`의 생명주기(Esc·`--resume`) 서술에 모드별 구분이 빠진 완전성 이슈가 두 글에 걸쳐 있었습니다. 반대로 `posts/claude/worktree/`는 검증 가능한 모든 기술 주장이 공식 문서와 정확히 일치했습니다 — 저자가 실제 커맨드를 돌려보고 쓴 글의 정확도가 가장 높았습니다.

## 제외 사항

`src/content/pages/cv/`는 지시에 따라 점검하지 않았습니다(draft 상태).
