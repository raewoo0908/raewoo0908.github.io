# ko/en 이중언어 점검 리포트 — 2026-09-28

## 요약

`src/content/` 아래 **ko.md/en.md(+ko.mdx/en.mdx) 짝 17개**를 전수 점검했습니다. (`src/content/pages/cv`는 draft 문서라 이번 점검에서 제외 — 맨 아래 참고.)

| 폴더 | 글 수 | 드리프트/미번역 | 표현 지적 | 사실점검(claude/*) | 기타(원문 자체 이슈) |
| --- | --- | --- | --- | --- | --- |
| pages (home) | 1 | 0 | 0 | - | - |
| experiences/code-it | 1 | 0 | 0 | - | - |
| posts/ai (4개) | 4 | 0(저신뢰 참고 1건) | 저신뢰 참고 2건 | 해당 없음 | **2건**(조사 오류 의심 1, ko 오탈자 1) |
| posts/claude (hook/intro-automation/loop/routine/worktree) | 5 | 0 | 0 | **8건 확인됨**(아래 상세) | - |
| posts/git (worktree) | 1 | 0 | 0 | 해당 없음(저자 본인 사례) | - |
| posts/python (3개) | 3 | 0(저신뢰 참고 다수, 아래 참고) | 0 | - | 0 |
| projects/relu-soft (2개) | 2 | 0(의도된 설계 1건) | 저신뢰 참고 1건 | 해당 없음 | - |
| **합계** | **17** | **0건(저신뢰 참고 제외)** | **저신뢰 3건** | **8건** | **2건** |

- **구조적 위반**(헤딩 개수·순서, 표, 코드 로직, 이미지 언어쌍)은 17개 글 전부에서 **이상 없음**입니다. pre-commit 훅이 이미 강제하고 있어 예상된 결과입니다.
- **가장 눈에 띄는 발견은 `posts/claude/hook`, `posts/claude/routine`, `posts/claude/worktree` 세 편의 Claude Code 사실 서술**입니다. 공식 문서(`https://code.claude.com/docs/en/`)와 대조해 **8건의 확인된 차이**를 찾았습니다 — 상세는 해당 섹션 참고.
- 그 외는 ko 원문 자체의 조사 오류 의심 1건, `r-cnn` ko.md의 코드 주석 오탈자("3장"→실제 4장) 1건, 그리고 낮은 확신도의 표현·스타일 참고 사항들입니다.
- 이번 점검에서는 **번역 누락/구조 드리프트는 발견되지 않았습니다** — 지난 점검(`bilingual-check-2026-09-21.md`)에서 지적됐던 `posts/ai/limitation-of-linear-decision-boundary-and-MLP`의 미번역 코드블록도 이미 수정되어 있음을 확인했습니다.

---

## src/content/posts/claude/hook (ko.md / en.md)

### 번역 드리프트 / 표현

이상 없음. 헤딩·표·이미지·코드블록 모두 완전히 대응하며 표현도 자연스럽습니다.

### Claude Code 사실 점검

**✅ "이벤트 33종" — 확인됨.** ko.md 187·191행 "실제로는 33종입니다"는 공식 문서(`https://code.claude.com/docs/en/hooks`)의 이벤트 목록을 직접 세어본 결과(`SessionStart, Setup, UserPromptSubmit, UserPromptExpansion, PreToolUse, PermissionRequest, PermissionDenied, PostToolUse, PostToolUseFailure, PostToolBatch, Notification, MessageDisplay, SubagentStart, SubagentStop, TaskCreated, TaskCompleted, Stop, StopFailure, TeammateIdle, InstructionsLoaded, ConfigChange, CwdChanged, DirectoryAdded, FileChanged, WorktreeCreate, WorktreeRemove, PreCompact, PostCompact, PreModelSwitch, PostModelSwitch, Elicitation, ElicitationResult, SessionEnd` = 정확히 33개) 정확히 일치합니다. (지난 리포트에서 "31종"으로 지적됐던 부분이 이미 33종으로 수정되어 있습니다.)

**⚠️ 종료코드 2의 stdout 처리 — 공식 문서와 다름 (확인됨)**

- `ko.md:59,62`: `"**stdout은 통째로 무시**하고, stderr를 Claude에게 전달합니다"` / `"종료코드 2일 때 stdout은 읽지도 않습니다"`
- `en.md:59,62`: `"**stdout is ignored entirely**; stderr is handed to Claude"` / `"On exit code 2, stdout isn't even read"`
- 공식 문서(`hooks.md`) 원문: *"On events that can block, exit 2 blocks whether or not you print JSON: even a JSON `permissionDecision` of `"allow"` can't override it. **Claude Code still reads any valid JSON output on stdout.**"*
- 즉 공식 문서는 "종료코드 2일 때 JSON이 차단 결정을 뒤집지는 못하지만, stdout의 JSON 자체는 여전히 읽는다"고 설명합니다. "stdout을 통째로 무시/읽지도 않는다"는 서술은 이 지점에서 공식 문서와 어긋납니다.
- **제안**: "종료코드 2일 때는 JSON을 찍어도 차단 결정을 뒤집을 수 없습니다(단, stdout의 JSON 자체는 여전히 파싱됩니다). 확실하게 메시지를 전달하려면 stderr를 쓰세요" 정도로 완화하는 문구를 권장합니다. ko.md를 먼저 고치고 en.md를 맞춰야 합니다.

**⚠️ "stdout이 Claude에게 보이는 이벤트는 셋뿐" — 개수 오류 (확인됨)**

- `ko.md:250`: `"stdout이 Claude에게 보이는 이벤트는 셋뿐입니다 — UserPromptSubmit, UserPromptExpansion, SessionStart."`
- `en.md:250`: `"Only three events have their stdout shown to Claude — UserPromptSubmit, UserPromptExpansion and SessionStart."`
- 공식 문서(`hooks.md`) 원문: *"The exceptions are `UserPromptSubmit`, `UserPromptExpansion`, `SessionStart`, and `PostModelSwitch`, where Claude Code adds plain-text stdout as context that Claude can see and act on."*
- **넷**입니다(`PostModelSwitch` 누락). **제안**: "셋뿐" → "넷뿐"으로 고치고 `PostModelSwitch`를 목록에 추가해야 합니다.

**참고(확인 불가, 오류 아님)**: `ko.md:176-185`의 환경변수 목록(`CLAUDE_PLUGIN_ROOT`, `CLAUDE_PLUGIN_DATA`, `CLAUDE_CODE_REMOTE`, `CLAUDE_CODE_BRIDGE_SESSION_ID`, `CLAUDE_EFFORT`, `CLAUDE_PLUGIN_OPTION_<KEY>`)을 공식 `env-vars.md` 페이지에서 재검색했으나 찾지 못했습니다. `CLAUDE_PROJECT_DIR`은 `worktrees.md`에서 실사용 예시로 확인했고, `CLAUDE_CODE_DISABLE_CRON`은 `scheduled-tasks.md`에서 확인했습니다. 나머지는 **문서에서 확인 불가일 뿐 오류로 볼 근거는 없습니다**(플러그인 전용 변수라 별도 페이지에 있을 가능성이 큽니다). 다만 "이게 사실상 전부입니다"라는 단정적 문구는 재검토를 권합니다.

그 외 종료코드별 차단 가능 여부 표(`PreToolUse`✅/`PostToolUse`❌/`UserPromptSubmit`✅/`Stop`·`SubagentStop`✅/`SessionEnd`·`Notification`❌), matcher 규칙(영숫자·`_`·`-`·공백·`,`·`|`만 있으면 정확매치, 그 외는 정규식), hook 타입 5종과 타임아웃 기본값(command/http/mcp_tool 600초, prompt 30초, agent 60초, UserPromptSubmit/PreModelSwitch/PostModelSwitch 30초, MessageDisplay 10초), `async`/`asyncRewake` 옵션, `/hooks`, `{"disableAllHooks": true}`는 모두 공식 문서와 **정확히 일치** 확인했습니다.

---

## src/content/posts/claude/routine (ko.md / en.md)

### 번역 드리프트 / 표현

이상 없음.

### Claude Code 사실 점검

**⚠️ "GitHub 트리거는 웹 UI에서만" — 공식 문서와 다름 (확인됨)**

- `ko.md:82`: `"CLI `/schedule`로는 예약(cron) 트리거만 만들 수 있습니다. API 트리거와 GitHub 트리거는 웹 UI에서 붙여야 합니다."`
- `en.md:82`: `"`/schedule` only creates schedule triggers. API and GitHub triggers have to be attached from the web UI..."`
- 공식 문서(`routines.md`) 원문: *"You can add a GitHub trigger from the web or from the CLI... The CLI path requires Claude Code v2.1.225 or later."* (API 트리거는 실제로 웹 전용이 맞습니다: *"API triggers are added to an existing routine from the web. The CLI cannot currently create or revoke tokens."*)
- 즉 **API 트리거는 웹 UI 전용이라는 부분은 맞지만, GitHub 트리거는 v2.1.225부터 CLI(`/schedule`)에서도 붙일 수 있습니다.** "API 트리거와 GitHub 트리거는 웹 UI에서 붙여야 합니다"를 "API 트리거는 웹 UI 전용이지만, GitHub 트리거는 v2.1.225 이상 CLI에서도 붙일 수 있습니다"로 수정 권장.

**참고(오류로 단정 안 함)**: `ko.md:233`/`en.md:233`의 Discord 리포트 인용문("30개 훅 이벤트 목록")은 hook.md의 현재 서술("33종")과 숫자가 다릅니다. 다만 이 부분은 **2026-07-26 시점에 실제로 받은 과거 리포트를 그대로 재현한 인용구**로 보이므로(해당 시점엔 이벤트 종류가 30개였을 가능성이 있음), 지금 시점 기준으로 "틀렸다"고 단정하지 않습니다. 다만 두 글을 나란히 읽는 독자가 혼동할 수 있으니, "당시 기준 30개"라는 각주를 붙이는 것도 고려해볼 만합니다.

**참고(확인 불가, 오류 아님)**: `ko.md:420`/`en.md:421`의 "`/schedule`이 안 보이는 이유 중 하나가 텔레메트리 비활성화 환경변수" 서술은 공식 `routines.md`의 트러블슈팅 섹션(원인 목록)에는 명시적으로 나열되어 있지 않았습니다. 다만 다른 공식 문서(`scheduled-tasks.md`)가 "feature-flag fetching이 꺼지면" 관련 동작이 달라진다고 언급하고 있어, 텔레메트리 변수가 feature-flag fetching을 막아 간접적으로 영향을 줄 가능성 자체는 있습니다. 확인 불가로만 남깁니다.

그 외 routine 생성 경로 3종(웹/데스크톱/CLI, 동일 계정 공유), `/schedule list`/`update`/`run`과 별칭 `/routines`, cron 최소 간격 1시간과 그 미만 거부, 트리거 다중 첨부 가능, 네트워크 접근 레벨(Trusted 기본/Custom/Full)과 `discord.com` 등 허용목록 밖 도메인 차단 시 `403`+`x-deny-reason: host_not_allowed`, `mcp_connections` 생략 시 커넥터 전부 기본 포함(쓰기 권한 포함, 승인 없음), `claude/` 브랜치 push 항상 통과 및 그 외 브랜치 거부 조건 3가지(보호된 브랜치/타인의 열린 PR/타인 커밋 포함), 개인 계정 소유(팀 공유 안 됨), 일일 실행 상한과 1회성 실행 제외는 모두 공식 문서(`routines.md`)와 **일치 확인**했습니다.

---

## src/content/posts/claude/worktree (ko.md / en.md)

### 번역 드리프트 / 표현

이상 없음. 코드블록에 등장하는 한국어 커밋 메시지(`feat: bye 추가` 등)는 실제 데모 저장소의 실행 기록이라 정상입니다.

### Claude Code 사실 점검

**⚠️ "청소는 `-w` 워크트리엔 절대 손대지 않습니다" — 조건 누락 (확인됨)**

- `ko.md:404`: `"`-w` 로 직접 만든 워크트리 — 청소는 여기엔 절대 손대지 않습니다"`, `ko.md:545`: `"주기 청소도 `-w` 로 만든 건 건드리지 않으니"`
- `en.md:404`: `"Worktrees you created with `-w` — the sweep never touches these"`
- 공식 문서(`worktrees.md`) 원문: *"The sweep leaves a worktree in place in these cases: ... **The worktree belongs to a `--worktree` session you haven't backgrounded**, whatever its age."* 그리고 별도로: *"When you background a `--worktree` session, its worktree becomes a background-session worktree that the sweep can remove."*
- 즉 **백그라운드로 보내지 않은 `-w` 세션에 한해서만** 청소 대상에서 제외되고, 세션을 백그라운드로 보내면 그 워크트리는 "백그라운드 세션 워크트리"로 취급되어 주기 청소 대상이 됩니다. "절대 손대지 않습니다"는 이 조건을 빠뜨린 과장입니다.
- **제안**: "백그라운드로 보내지 않은 `-w` 워크트리는 청소가 건드리지 않지만, 세션을 백그라운드로 보내면 다른 워크트리와 똑같이 청소 대상이 됩니다"로 보강 권장.

**⚠️ "워크트리 안에서 `claude --resume` 하지 마세요" — 일반적인 경우와 반대 (확인됨)**

- `ko.md:549`: `"워크트리 안에서 `claude --resume` 하지 마세요. 재개는 메인 체크아웃에서 실행해야 합니다. 워크트리 안에서 띄우면 Claude 가 그 디렉터리를 보증할 수 없다며 격리 없이 이어가거나 아예 멈춥니다."`
- `en.md:549`: `"Don't run `claude --resume` from inside a worktree. Resume from the main checkout..."`
- 공식 문서(`worktrees.md`) 원문: *"**Claude Code re-enters a worktree it created with git under `.claude/worktrees/` even when you launch from inside it.** When you launch from inside any other worktree, Claude Code re-enters it only if it can vouch for it from there: ... a launch from a subdirectory of a worktree **you created with `git worktree add`** declines, so launch those from the main checkout."*
- 즉 **Claude가 `-w`로 직접 만든 워크트리 안에서 `--resume`을 실행하는 것은 정상적으로 지원되는 흔한 사용법**이고, 문제가 되는 것은 `git worktree add`로 **직접(수동으로) 만든** 워크트리 안에서 재개하는 특수한 경우입니다. ko.md/en.md의 서술은 이 구분 없이 "워크트리 안에서는 항상 하지 말라"는 식으로 일반화되어 있어 공식 문서와 반대됩니다.
- **제안**: "`-w`로 만든 워크트리 안에서 재개하는 건 문제없습니다. 다만 `git worktree add`로 직접 만든 워크트리 안에서 재개하려 하면 Claude가 그 디렉터리를 보증하지 못해 격리 없이 진행하거나 멈춥니다"로 수정 권장.

**참고(경미, 분류 차이)**: `ko.md:330-334`의 "막히는 건 세 가지입니다"(파일 편집/명령의 작업 디렉터리/git 우회)는 공식 문서가 현재 **네 가지**로 나누는 것("File edits" / "Command working directory" / "Git redirects" / **"Command shape"** — 명령의 형태 자체를 검증할 수 없는 경우를 별도 항목으로 분리)과 분류 방식이 다릅니다. ko.md는 "검증 불가능한 명령 차단"을 ②(작업 디렉터리) 항목 안에 포함시켜 셋으로 묶었는데, 내용은 대부분 커버되지만 지금 문서 기준으로는 넷으로 나누는 것이 더 정확합니다. 급하게 고칠 사안은 아니나 참고하시길 권합니다.

그 외 `worktree.baseRef`의 두 값(`"fresh"`/`"head"`)과 브랜치명 직접 지정 불가, `"fresh"`에서 원격 없을 때 로컬 `HEAD` 폴백과 24시간마다(최대 5초) fetch, `.worktreeinclude`(`.gitignore` 문법, 패턴 매치+gitignore 대상만 복사), `.claude/worktrees/<name>/` 경로와 `worktree-<name>` 브랜치명, 워크스페이스 신뢰 안 된 디렉터리에서 `-w`(대화형) 실패·`-p`(헤드리스)는 검사 생략, `EnterWorktree`/`ExitWorktree` 도구, PR 리뷰 시 `claude -w "#1234"` → `pull/1234/head` → `.claude/worktrees/pr-1234`, `.claude` 심볼릭 링크 시 워크트리 생성 거부는 모두 공식 문서(`worktrees.md`)와 **일치 확인**했습니다. `.git/worktrees/<name>/` 안의 `CLAUDE_BASE`/`locked` 파일 존재 자체는 문서가 그 수준의 내부 구현까지는 다루지 않아 확인 불가로 남깁니다(오류로 보지 않음).

---

## src/content/posts/claude/loop (ko.md / en.md)

### 번역 드리프트 / 표현

이상 없음. `i18n-intentional(links)` 마커가 ko/en 양쪽 67행에 모두 정상적으로 붙어 있습니다.

### Claude Code 사실 점검 — 대부분 확인됨, 경미한 보완 제안 1건

공식 문서(`scheduled-tasks.md`)와 대조한 결과 `/loop [간격] [프롬프트]` 문법, 3가지 입력 조합(간격+프롬프트→고정/프롬프트만→동적/생략→내장 프롬프트), 간격 단위(s/m/h/d)와 최소 1분 단위, 동적모드 범위(1분~1시간)와 매 반복 이유 출력, `Monitor` 도구, `stop: true`로 자가 종료, `loop.md` 탐색 경로(`.claude/loop.md` > `~/.claude/loop.md`)와 25,000바이트 초과 시 잘림, 멈추는 법(`Esc`/자가종료/`CronDelete`/7일 만료), `CronList`/`CronDelete`, 세션당 최대 50개, 지터(최대 30분 또는 1시간 미만 간격은 절반, 잡ID 기반 결정론적 오프셋, 동적모드는 지터 없음), 밀린 실행은 몰아서 실행되지 않음, `CLAUDE_CODE_DISABLE_CRON` — 모두 공식 문서와 **정확히 일치**합니다.

- **참고(경미)**: 공식 문서는 *"A self-paced `/loop` isn't restored [on `--resume`/`--continue`], so run `/loop` again to restart it."*라고 명시합니다. 즉 **동적(self-paced) 모드는 `--resume`으로 복원되지 않고, `CronCreate` 기반 고정 인터벌 태스크만 복원됩니다.** 해당 포스트의 "`--resume`/`--continue`로 만료 전 태스크 복원" 서술이 이 구분(고정 vs 동적)을 명확히 짚고 있는지 원문을 다시 확인해보시길 권합니다.

---

## src/content/posts/claude/intro-automation-hook-loop-routine (ko.md / en.md)

이상 없음. 3가지 자동화 비교표, Hook 대표 이벤트 4가지("대표적인 네 가지"라고 명시하고 실제로는 더 있다고 정확히 부연), `/loop` 3모드, routine 트리거 3종 — 모두 공식 문서와 일치하며 과장된 단정도 없습니다.

---

## src/content/posts/git/worktree (ko.md / en.md)

이상 없음. `.claude/worktrees/post-worktree-guide` 경로와 `claude/post-git-vs-claude-worktree` 브랜치가 등장하는 터미널 출력(167-176행)은 "Claude Code가 이렇게 동작한다"는 주장이 아니라 **저자 본인의 실제 워크트리·브랜치 네이밍**을 보여주는 실습 기록이라 별도 팩트체크 대상이 아닙니다.

---

## src/content/posts/ai/limitation-of-linear-decision-boundary-and-MLP (ko.md / en.md)

이상 없음. 지난 리포트(2026-09-21)에서 지적됐던 en.md의 미번역 코드블록(주석·print 문자열)은 이미 영어로 수정되어 있음을 확인했습니다.

- **저신뢰 참고**: `ko.md:161-162`(및 481-482) 코드 안의 문자열 리터럴 `"후보 A"`/`"후보 B"`가 `en.md`에서 `"Candidate A"`/`"Candidate B"`로 번역되어 있습니다. 실행 로직·출력 예시는 언어별로 내부 일관성이 있어 실질적 결함은 아니지만, "코드 로직은 100% 동일해야 한다" 기준을 엄격히 적용하면 참고할 만합니다. 수정 여부는 저자 판단에 맡깁니다.

## src/content/posts/ai/logistic-regression (ko.md / en.md)

이상 없음. `en.md:108` "compresses the output into a value between 0 and 1"이 다소 어색하다는 저신뢰 참고 1건 외에는 특이사항 없습니다.

## src/content/posts/ai/practical-statistics-for-data-scientists/data-types-location-and-variability-estimation (ko.md / en.md)

### 표현 점검 — ko.md 조사 오류 의심 (중간 확신도)

- `ko.md:27`: `"...각 **레코드(사건(event))을** 나타내는 **행(row)와**, 특징(피처, 변수)를 나타내는 열(column)으로..."`
- "레코드"(모음 받침 없음)는 "~를"이, "행"(받침 ㅇ)은 "~과"가 자연스럽습니다 → `"...레코드(사건(event))**를** 나타내는 **행(row)과**, ..."`
- 괄호 안 부연설명 때문에 조사 결합이 헷갈릴 수 있어 중간 확신도로 남깁니다. 소리 내어 읽어보고 확인을 권합니다.

en.md에는 `"(Korean)"` 표기가 참고자료 링크 제목에 덧붙어 있으나(156행), 한국어 자료임을 알리는 의도적 현지화로 보여 문제 삼지 않았습니다.

## src/content/posts/ai/r-cnn (ko.md / en.md)

### 기타 — ko 원문 자체의 오탈자 (ko/en 공통, 번역 드리프트 아님)

- `ko.md:409` / `en.md:409`: 코드 주석 `"# 3. 모델 예측 수행 (이미지 3장 한번에)"` / `"# 3. Run model prediction (3 images at once)"`
- 바로 위 `image_paths = [DOG_CAT, HUMANS, AIRPLANE, MANY_ANIMALS]`(405행)는 이미지 **4장**을 정의하고 있고, 글 말미(470행)의 이미지 캡션도 "네 장의 이미지"/"four images"로 올바르게 4장이라 되어 있습니다. 이 주석 한 곳만 "3장"으로 잘못 적힌 ko 원문 자체의 오탈자이며, en은 이를 충실히 그대로("3 images") 옮겼을 뿐입니다.
- **제안**: `ko.md:409`를 "이미지 4장 한번에"로 고치고 `en.md:409`도 "4 images at once"로 맞추면 됩니다.

## src/content/posts/python/01-everything-is-an-object, 02-variables-are-name-tags, 03-the-inside-story-of-if (ko.md / en.md)

이상 없음. 헤딩·표·코드·이미지 언어쌍 모두 완전히 대응합니다.

- **저신뢰 참고(다수)**: 여러 코드블록에서 `print()` 출력 문자열 리터럴이 (주석이 아니라) 실제로 언어별로 번역되어 있습니다 — 예: `01/ko.md:824-825`(`"...개"` → `en.md:828-829` `"× ..."`), `01/ko.md:558`(`"용량=..."` → `en.md:562` `"capacity=..."`), `03/ko.md:43,563`(`"여긴 들어옵니다"` → `en.md` `"we do get in here"`) 등. 로직·수치는 완전히 동일하고 일관된 번역 스타일이라 실질적 결함은 아니나, 코드 콘텐츠 자체가 언어별로 달라지는 경계선 사례라 참고로 남깁니다.

## src/content/experiences/code-it/code-it (ko.mdx / en.mdx), src/content/pages/home (ko.md / en.md)

이상 없음. `<DocLinks>` props, empty 문구, 표·리스트 모두 ko/en 일치합니다.

## src/content/projects/relu-soft/west-side-barbell-club/01-about-conjugate, 02-raise-a-prob-and-sol (ko.md / en.md)

이상 없음. ko.md에만 있는 "영어 원문 인용 + 한국어 의역 한 줄"(라인 수 196 vs 194 차이의 원인)은 의도된 설계로 확인됩니다(en 독자는 이미 영어 원문을 읽으므로 재번역 줄이 불필요).

- **저신뢰 참고**: `01/en.md:106` `"The signature idea of Louie Simmons, the head of Westside Barbell."`가 동사 없는 문장 조각인 반면 `ko.md:107`은 완결된 문장입니다. 스타일 문제 수준으로, 오역은 아닙니다.

---

## 제외 안내

`src/content/pages/cv`는 아직 다듬는 중인 draft 문서라 이번 점검에서 제외했습니다(파일 미열람, 집계 미포함).

## Discord 알림

요약을 Discord로 전송했습니다.
