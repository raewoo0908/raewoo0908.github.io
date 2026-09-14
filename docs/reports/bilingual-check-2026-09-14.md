# ko/en 이중언어 점검 리포트 — 2026-09-14

## 요약

`src/content/` 아래 **ko.md/en.md 짝 14개**를 전수 점검했습니다(`pages/cv`는 draft 정리 중이라 지시에 따라 제외). 구성: pages 1(home) + posts/ai 2 + posts/claude 5 + posts/git 1 + posts/python 3 + projects/relu-soft 2.

| 폴더 | 글 수 | 드리프트/구조 | 표현 지적 | 사실점검(claude/*) |
| --- | --- | --- | --- | --- |
| pages/home | 1 | 0 | 0 | - |
| posts/ai (limitation, logistic-regression) | 2 | 0(구조), 코드블록 미번역 1건(의도 불확실) | 5(경미) | 해당 없음 |
| posts/claude (hook, intro-automation, loop, routine, worktree) | 5 | 0 | 0 | **확인된 오류 5건** |
| posts/git (worktree) | 1 | 0 | 0 | 해당 없음 |
| posts/python (01, 02, 03) | 3 | 0 | 8(경미, 대부분 스타일) | - |
| projects/relu-soft (01, 02) | 2 | 0 | 2(경미) | - |
| **합계** | **14** | **0건의 구조 위반, 1건 확인 필요** | **15건(대부분 경미)** | **확인된 오류 5건** |

**가장 중요한 발견은 `posts/claude/*` 5편의 사실관계입니다** — 번역 드리프트나 구조 위반은 이번 점검에서 전혀 없었지만(pre-commit 훅이 이미 강제하고 있어 예상된 결과), 공식 문서(https://code.claude.com/docs/en/) 대조 결과 **ko.md·en.md 양쪽에 동일하게 반영된 사실 오류**가 다수 확인됐습니다. drift가 아니라 원문(ko, SSOT) 자체의 오류이므로 고칠 때 ko/en 둘 다 함께 고쳐야 합니다.

- `claude/hook`: "훅 이벤트 31종"(실제 33종, `PreModelSwitch`/`PostModelSwitch` 누락), "stdout이 보이는 이벤트는 셋"(실제 넷, `PostModelSwitch` 누락)
- `claude/worktree`: "격리 가드레일은 세 가지"(실제 네 가지, command-shape 검사 누락), `--resume` 트랩 서술이 사실관계상 과도하게 일반화됨
- `claude/routine`: "GitHub 트리거는 웹 UI에서만 추가 가능"(실제로는 CLI v2.1.225+에서도 가능)
- `claude/intro-automation-hook-loop-routine`, `claude/loop`: "`--resume`으로 대기 중인 루프가 복원된다"는 서술에 예외 누락 — 공식 문서는 간격을 생략한 **동적(self-paced) `/loop`는 `--resume`으로 복원되지 않는다**고 명시

각 항목의 "확인됨"/"확인 불가" 구분과 출처는 아래 폴더별 섹션에 정리했습니다. "확인 불가"로 표시한 항목은 오류의 근거가 아니라 단순히 문서에서 찾지 못했다는 뜻입니다.

---

## src/content/pages/home (ko.md / en.md)

이상 없음 — 4개 불릿, 제목, 설명 모두 1:1 대응. 표현도 자연스럽습니다.

---

## src/content/posts/ai/limitation-of-linear-decision-boundary-and-MLP (ko.md / en.md)

### 구조 / 번역 드리프트
헤딩·이미지·표는 완전히 일치합니다. 단, 코드블록 안의 print 문자열·주석·캡처된 실행 결과가 `en.md`에도 한국어 그대로 남아 있는 지점이 다수 있습니다(예: `en.md` 155~172행, 254~320행, 494~587행 — `print("확인한 후보 수:", ...)`, `# hiddne layer: 공간을 구부림` 등).

- **확신 없음**: 이 코드블록들은 저자가 실제로 실행한 결과를 캡처해 보여주는 성격이 강해, `git log` 출력처럼 "의도적 보존"일 가능성이 있습니다. 의도적이라면 `<!-- i18n-intentional --place-->` 마커를 달아 검사에서 제외하는 편이 좋고, 단순 누락이라면 최소한 주석과 print 라벨만이라도 영어로 옮기는 것을 제안합니다.

### 표현 / 오탈자
- `ko.md:455` — `"...압도적 우승을 자치한 이후입니다."` → "자치한"은 "차지한"의 오탈자로 보입니다.
- `ko.md:340` — `"0점은 맞은 학생이나 59점을 만은 학생이나..."` → "0점은 맞은"은 "0점을 맞은", "59점을 만은"은 "59점을 맞은"의 오탈자로 보입니다.
- `ko.md:554` (코드 주석) — `"# ...선형변홤을 수행하는..."` → "선형변홤"은 "선형변환"의 오탈자. `en.md`에도 동일 오탈자가 그대로 남아 있습니다.
- `ko.md:555` — `"# 출력은 차원은 1이 되어야함."` → 조사 중복. "출력 차원은 1이 되어야 함."을 제안.
- `en.md:225` (확신 낮음) — `"...above $l_2$, (OR) above $l_1$ and below $l_2$, is where..."` 두 번째 절에서 "The region that is"가 생략되어 다소 읽기 어렵습니다.

### 사실 점검
Claude Code 관련 서술 없음(해당 없음).

---

## src/content/posts/ai/logistic-regression (ko.md / en.md)

### 구조 / 번역 드리프트
이상 없음. 648 vs 647줄 차이는 `ko.md:401`의 공백-only 빈 줄 하나 때문이며 내용 손실은 아닙니다(정리 권장 수준).

### 표현
- `en.md:403` — `"the larger the error, the honestly larger the gradient."` → "honestly larger"는 부자연스러운 직역. `"the gradient grows proportionally larger"` 등을 제안.
- `en.md:165` (확신 낮음) — `"The student put a full 80% confidence on the wrong answer."` → `"was 80% confident in the wrong answer"`가 더 자연스러움.
- `ko.md:550` (코드 주석) — `"# 결정경계 방정식에서 bias를 계산할 지 여부."` → "계산할 지"는 "계산할지"로 붙여 써야 합니다(어미 "-ㄹ지").

### 사실 점검
Claude Code 관련 서술 없음(해당 없음).

---

## src/content/posts/claude/hook (ko.md / en.md)

### 구조 / 번역 드리프트
이상 없음. 헤딩 33개, 이미지 6쌍, JSON/bash 코드블록 전부 1:1 대응하며 en.md에 미번역 한국어 잔존도 없습니다. 참고로 en.md 참고자료 목록 마지막 항목에 `(lecture slides, Korean)`이라는 부연이 ko.md엔 없는데, 영어 독자를 위한 친절한 안내로 의미 왜곡은 아니라 문제로 보지 않았습니다.

### 사실 점검 — 확인된 오류 2건
공식 문서 원문(`https://code.claude.com/docs/en/hooks`)의 "Hook events" 섹션 하위 항목을 처음부터 끝까지 나열해서 셌습니다:

> SessionStart, Setup, InstructionsLoaded, UserPromptSubmit, UserPromptExpansion, MessageDisplay, PreToolUse, PermissionRequest, PostToolUse, PostToolUseFailure, PostToolBatch, PermissionDenied, Notification, SubagentStart, SubagentStop, TaskCreated, TaskCompleted, Stop, StopFailure, TeammateIdle, ConfigChange, CwdChanged, DirectoryAdded, FileChanged, WorktreeCreate, WorktreeRemove, PreCompact, PostCompact, PreModelSwitch, PostModelSwitch, SessionEnd, Elicitation, ElicitationResult — **총 33개**

1. **"이벤트 31종"** — `ko.md:187`(헤딩 "📖 이벤트 31종 지도"), `en.md:187`("A map of all 31 events"), 이미지 `hook-events-map.ko.svg` 제목에도 동일하게 등장. 위 목록과 대조하면 정확히 **`PreModelSwitch`, `PostModelSwitch` 두 이벤트가 빠져** 31+2=33이 됩니다. **확인됨**(출처: https://code.claude.com/docs/en/hooks , Hook events 섹션).
2. **"stdout이 Claude에게 보이는 이벤트는 셋뿐"** — `ko.md:249`("UserPromptSubmit, UserPromptExpansion, SessionStart"), `en.md` 동일 위치. 문서 원문: *"The exceptions are `UserPromptSubmit`, `UserPromptExpansion`, `SessionStart`, and `PostModelSwitch`..."* — 예외는 3개가 아니라 **4개**이며 역시 `PostModelSwitch`가 빠져 있습니다. **확인됨**(출처: https://code.claude.com/docs/en/hooks , Exit code output 섹션).

두 오류 모두 ko/en 동일하게 존재해 drift가 아니라 원문 자체의 오류입니다. 수정 시 이미지(`hook-events-map.ko.svg`/`.en.svg`)도 함께 고려하세요. 모델 전환(`PreModelSwitch`/`PostModelSwitch`)은 비교적 최근 추가된 개념일 수 있어, 글 작성 시점(2026-07-26)엔 실제로 없었을 가능성도 있습니다 — 다만 "지금 문서 기준"으로는 명백한 오류입니다.

### 사실 점검 — 확인된 항목(문제 없음, 체크리스트)
종료코드 의미(0/2/기타)와 이벤트별 차단 가능 여부, `matcher` 문법, `if` 필드, `type` 5종(command/http/mcp_tool/prompt/agent), `prompt` 타입의 기본 모델, `agent` 타입이 실험적이라는 서술, 환경변수 목록(`CLAUDE_PROJECT_DIR`, `CLAUDE_PLUGIN_ROOT`/`CLAUDE_PLUGIN_DATA`, `CLAUDE_CODE_REMOTE`, `CLAUDE_CODE_BRIDGE_SESSION_ID`, `CLAUDE_EFFORT`, `CLAUDE_PLUGIN_OPTION_<KEY>`), settings.json 위치 3곳, timeout 기본값(command/http/mcp_tool=600초, prompt=30초, agent=60초, UserPromptSubmit=30초, MessageDisplay=10초), `disableAllHooks`, `async`/`asyncRewake`, `stop_hook_active`, `additionalContext`, `terminalSequence`, `chmod +x` 필요성, `/hooks` 명령, `PermissionRequest`/`PermissionDenied` 이벤트 — 모두 공식 문서와 대조하여 **확인됨**.

---

## src/content/posts/claude/intro-automation-hook-loop-routine (ko.md / en.md)

### 구조 / 번역 드리프트
이상 없음. 헤딩 7개, 표 3개, JSON 코드블록, 이미지 4쌍 모두 정확히 대응.

### 사실 점검
- "위 네 가지가 대표적이고, 실제로는 이벤트가 더 있습니다" — **확인됨**(문서 기준 총 33개 이벤트가 존재해 헤지 표현이 정확함).
- `PreToolUse`가 종료코드 2로 차단 가능하다는 서술 — **확인됨**.
- routine이 Anthropic 클라우드에서 돌고 research preview 단계라는 서술 — **확인됨**(문서: "Routines are in research preview").
- 한 routine이 여러 트리거 종류를 함께 쓸 수 있다는 서술 — **확인됨**(문서: "A single routine can combine triggers.").
- **확인된 예외 누락**: `ko.md:101` 부근 "다음 반복 전에 Esc로 중단할 수 있고, 만료되지 않은 작업은 `--resume`으로 복원됩니다" — 공식 문서(scheduled-tasks)는 *"A self-paced `/loop` isn't restored [on resume], so run `/loop` again to restart it"*라고 명시합니다. 즉 간격을 생략한 **동적 모드** 루프는 `--resume`으로 복원되지 않는 예외가 있는데 글이 이를 언급하지 않습니다. ko/en 양쪽에 동일 서술이 있어 원문 자체의 보강이 필요합니다. **확인됨**(출처: https://code.claude.com/docs/en/scheduled-tasks).
  - 제안: "(단, 간격을 생략한 동적 루프는 `--resume`으로 복원되지 않아 다시 `/loop`을 쳐야 합니다)" 같은 단서 추가.

---

## src/content/posts/claude/loop (ko.md / en.md)

### 구조 / 번역 드리프트
이상 없음. 헤딩 8개+소제목 6개, 표 6개, 이미지 6쌍, 내부 링크, `i18n-intentional(links)` 마커 사용까지 모두 정상.

### 사실 점검
`/loop [간격] [프롬프트]` 문법, 3모드 표, 최소 간격 1분·초 올림, `7m`·`90m` 반올림, jitter(최대 30분/절반, 동적 모드는 jitter 없음), 7일 만료, `loop.md` 위치·우선순위·25,000바이트 truncation, 정지 3갈래(Esc/`stop: true`/`CronDelete`), `CronList`/`CronDelete`/세션당 50개 상한, `CLAUDE_CODE_DISABLE_CRON=1` — **전부 확인됨**(출처: https://code.claude.com/docs/en/scheduled-tasks , 문서 문장 구조까지 거의 동일).

- **확인된 예외 누락**(intro-automation과 동일 이슈, 이 글에서 더 중요): `ko.md:176` 부근 "`claude --resume` 또는 `--continue`로 재개하면 만료 전 태스크가 복원됩니다" — 앞과 동일하게 동적 모드 루프는 예외입니다. "🤖 실전 2 — 동적 모드" 절에서도 이 제약이 언급되지 않아 보강이 필요합니다. **확인됨**(출처: 동일).
- cron 매핑 표(`Nm(N≤59)→*/N * * * *` 등)와 파싱 우선순위 규칙(맨 앞 토큰 우선 → 끝 `every`절 → 동적) — 공식 cron 레퍼런스는 일반 문법만 다루고 이 정확한 상한·우선순위 로직은 명시하지 않습니다. **확인 불가**(오류 근거 아님 — 글이 "문서·실행 파일을 뒤지며 확인했다"고 스스로 출처를 밝히고 있어 근거 없는 서술은 아닙니다).
- **참고(사실 오류는 아니지만 짚어둘 점)**: `ko.md:92-96` 부근의 배포 로그 예시(`feat(toc): 목차 추가`, `content: Hook 상세 글`, `ci: 액션 버전 상향` 등)는 이 저장소의 실제 `git log --oneline --all`에 존재하지 않는 커밋 메시지입니다. 본문이 "지금 이 글이 담긴 저장소에서 **진짜로 돌아가는** 시나리오로 가겠습니다"라고 소개하는데, 예시가 가상임을 밝히지 않고 있습니다. ko/en 동일하게 각색되어 있어 drift는 아니지만, "예를 들면 이런 식으로 뜹니다" 정도로 완화하거나 실제 `gh run list` 출력으로 교체하는 것을 제안합니다.

---

## src/content/posts/claude/routine (ko.md / en.md)

### 구조 / 번역 드리프트
이상 없음. 헤딩 33개, 표 12개, 코드블록 12개, 이미지 참조 모두 정확히 대응. 474 vs 475줄 차이는 `ko.md:240` 코드펜스 앞 빈 줄 하나가 빠진 스타일 차이일 뿐입니다(내용 손실 아님, 정리 권장).

### 사실 점검 — 확인된 오류 1건
- `ko.md:82` 부근 — `"API 트리거와 GitHub 트리거는 웹 UI에서 붙여야 합니다. 토큰 발급·폐기도 CLI로는 안 됩니다."` — API 트리거·토큰 발급/폐기가 웹 전용이라는 부분은 맞지만, **GitHub 트리거는 CLI에서도 추가할 수 있습니다**. 문서 원문: *"You can add a GitHub trigger from the web or from the CLI... The CLI path requires Claude Code v2.1.225 or later."* ko/en 양쪽에 동일한 서술이 있어 원문 보강이 필요합니다. **확인됨**(출처: https://code.claude.com/docs/en/routines).
  - 제안: "API 트리거는 웹 UI 전용, GitHub 트리거는 웹 또는 CLI(v2.1.225+)에서 추가 가능"으로 수정.

### 사실 점검 — 확인된 항목(문제 없음, 다수)
research preview 고지, cron 최소 간격 1시간, 실행 시각 stagger, 3가지 생성 경로, `/schedule list`·`update`·`run`(별칭 `/routines`), CLI로 추가한 MCP 서버가 커넥터 목록에 안 뜨는 것, routine 생성 시 커넥터 기본 전체 포함(승인 없이 쓰기 가능), 네트워크 레벨 4종과 기본 허용 도메인 목록(`github.com`·`*.googleapis.com`·`registry.npmjs.org`·`code.claude.com` 포함, `discord.com` 미포함), 허용목록 밖 요청 `403`+`x-deny-reason: host_not_allowed`, `claude/` 접두 브랜치 처리 규칙, routine의 개인 소유·비공유, 일일 실행 상한과 `429`, 1회성 실행이 상한에서 제외되는 것, 삭제는 웹 전용, 클라우드 세션에 권한 모드 선택지 없음 — **모두 확인됨**.

### 확인 불가(오류 근거 아님)
`/schedule`이 "Unknown command"로 뜨는 원인 중 텔레메트리 관련 서술(문서의 Troubleshooting 목록엔 다른 4가지 원인만 명시), routine 생성·수정용 원본 JSON 스키마(공개 API는 fire 엔드포인트뿐), GitHub App 권한 화면 설명, 웹훅 URL이 목록 조회 API로 읽힌다는 서술.

---

## src/content/posts/claude/worktree (ko.md / en.md)

### 구조 / 번역 드리프트
이상 없음. 헤딩 18개, 표 7개, 이미지 3쌍, 번호 목록(레시피 1~7, 함정 1~5, 치트시트) 모두 1:1 대응. 코드블록에 남은 한국어(`git log` 커밋 메시지 등)는 실제 실습 기록이라 정상입니다.

### 사실 점검 — 확인된 불일치 3건
대조 출처: https://code.claude.com/docs/en/worktrees , https://code.claude.com/docs/en/sub-agents

1. **격리 가드레일 "세 가지" → 실제 네 가지** — ko.md: `"막히는 건 세 가지입니다. - 파일 편집 - 명령의 작업 디렉터리 - git 우회"`, en.md 동일. 문서는 정확히 4가지를 명시합니다: ① File edits(`Edit`/`Write`/**`NotebookEdit`**, 글에는 `NotebookEdit` 누락) ② Command working directory ③ Git redirects ④ **Command shape**("Claude Code blocks a Bash or Monitor command when it can't verify from the command text that any git the command runs stays inside the worktree..."). 4번째 체크 전체가 두 언어 모두에서 빠져 있습니다. **확인됨**.
   - 제안: "세 가지"→"네 가지"로 수정하고 command-shape 체크와 `NotebookEdit` 언급 추가.
2. **`--resume` 트랩 서술이 과도하게 일반화됨** — ko.md 함정 5: `"워크트리 안에서 claude --resume 하지 마세요... 워크트리는 놔둔 채 메인에서 재개하면 알아서 다시 들어갑니다."` en.md 동일 취지. 문서는 정확히 반대로 읽힙니다: *"Claude Code re-enters a worktree it created with git under `.claude/worktrees/` even when you launch from inside it."* 즉 `-w`/`EnterWorktree`로 만든 워크트리는 그 안에서 resume해도 정상 재진입합니다. 재개 제약은 `git worktree add`로 **직접 만든**, `.claude/worktrees/` 밖 워크트리의 **하위 디렉터리**에서 launch할 때만 해당됩니다. **확인됨**(출처: worktrees 문서, "Resume a worktree session / Launch directory" 절).
   - 제안: 이 조언을 "레시피 4(수동으로 만든 워크트리)"에 한정하거나, `-w`로 만든 워크트리는 그 안에서 resume해도 정상 작동한다는 점을 명시.
3. **(경미) "-w로 직접 만든 워크트리는 청소가 절대 손대지 않는다"** — 문서는 예외를 명시합니다: *"The worktree belongs to a `--worktree` session you haven't backgrounded, whatever its age."* 즉 `-w` 세션을 백그라운드로 보내면 sweep 대상이 될 수 있습니다. 글이 세션 백그라운드화 자체를 다루지 않아 심각하진 않지만 "절대"라는 단정은 과합니다. **확인됨(경미)**.

### 확인 불가(오류 근거 아님)
`CLAUDE_BASE` 파일의 존재·역할, `.git/worktrees/<name>/locked` 파일의 정확한 텍스트 형식, 서브에이전트 워크트리 이름이 `agent-<hash>` 형태라는 서술, PR 리뷰 워크트리에서 `.worktreeinclude` 적용 여부 — 문서 본문에서 명시적 언급을 찾지 못했지만 실습 기반 서술로 보이며 오류라고 볼 근거는 없습니다.

### 확인된 항목(문제 없음, 다수)
`claude -w <name>` 기본 위치·브랜치명 규칙, 이름 생략 시 랜덤 생성, 워크스페이스 신뢰 요구(`-p`는 예외), `worktree.baseRef`의 `"fresh"`/`"head"` 동작과 폴백/fetch 주기, `.worktreeinclude` 문법과 범위, 재호출 시 리셋 조건 4가지, 세션 종료 시 정리 표, `-p`로 만든 워크트리가 자동 정리되지 않는 것, 심볼릭 링크 생성 거부, PR 리뷰 워크트리 생성 방식, `EnterWorktree`/`ExitWorktree` 도구와 권한 규칙, 서브에이전트 `isolation: worktree`와 `worktree.baseRef` 상속 — **모두 확인됨**.

---

## src/content/posts/git/worktree (ko.md / en.md)

이상 없음. 헤딩 5개, 코드블록(체인 다이어그램, `.git` 트리, `git branch`/`git worktree list` 출력), 이미지 4개 모두 정확히 대응합니다. 203 vs 204줄 차이는 en.md 끝의 빈 줄 하나일 뿐입니다. Claude Code 관련 설정·커맨드 서술은 없어 사실 점검은 해당 없음(본문에 등장하는 브랜치명·경로는 저자의 git worktree 실습 예시일 뿐입니다).

---

## src/content/posts/python/01-everything-is-an-object (ko.md / en.md)

### 구조 / 번역 드리프트
이상 없음. 헤딩 19개, 이미지 15쌍, 코드블록 102개 모두 완전히 일치(정수/리스트/딕셔너리/set 크기 등 실측값도 동일). 931 vs 935줄 차이는 순수 포맷팅(빈 줄·trailing space) 차이로, 의미 있는 콘텐츠 추가/삭제는 없습니다.

### 표현 (경미, 확신 낮음)
- `ko.md:161` — `"...구조적 비용인거죠."` → "비용인 거죠"로 띄어쓰기를 권장.
- `ko.md:209` — `"...4byte(32bit) 크기에 한정되어있어"` → "한정되어 있어"로 띄어쓰기를 권장.

### 사실 점검
Claude Code 관련 서술 없음(해당 없음). CPython 관련 기술 설명(30비트 digit, `-5~256` 캐시, PEP 393 compact string, dict 인덱스/엔트리 분리, tuple freelist 등)은 검토 범위에서 오류를 발견하지 못했습니다(최신 소스와 1:1 대조까지는 하지 않았습니다).

---

## src/content/posts/python/02-variables-are-name-tags (ko.md / en.md)

이상 없음. 헤딩 6개, 표 2개, 코드블록(변수명·출력값·`dis` 결과·`co_varnames`/`co_names` 등)과 참고자료 목록까지 모두 정확히 대응하고 표현도 자연스럽습니다.

---

## src/content/posts/python/03-the-inside-story-of-if (ko.md / en.md)

### 구조 / 번역 드리프트
이상 없음. 헤딩 24개, 표 6개, 이미지 5개, 코드펜스 70개 모두 대응.

### 표현 (경미)
- `en.md:195` — `"### The decision is over in six steps"` → `"### Six steps decide the verdict"` 등을 제안(원문 뉘앙스와 더 가까움).
- `en.md:426` — `"It's a fun spot..."` → 기술 문서 톤에 맞게 `"It's an interesting wrinkle"` 등을 제안.
- `en.md:689` — `"the if could turn horrifying, couldn't it?"` → `"the if could turn into a nightmare, couldn't it?"`를 제안.
- `ko.md:195` — 헤딩 "판정은 6단계로 결정됩니다" 바로 아래 리스트는 1~7번 총 7개 항목이라 제목과 어긋나 보일 수 있습니다(en.md도 동일). "6가지 검사 + 기본값" 식으로 구분을 명확히 하는 것을 제안.
- `ko.md:412` — `"...정의하면서 결론이 다르게 만들면 안 됩니다."` → 다소 번역투. `"__bool__과 __len__을 둘 다 정의할 때, 두 결과가 서로 어긋나게 만들면 안 됩니다."`를 제안.
- `ko.md:333~335` — 불릿 3개 중 마지막만 마침표가 붙어 문체가 살짝 불일치(사소함).

### 사실 점검
Claude Code 관련 서술 없음(해당 없음). Python/CPython 기술 설명은 검토 범위에서 오류를 발견하지 못했습니다.

---

## src/content/projects/relu-soft/west-side-barbell-club/01-about-conjugate (ko.md / en.md)

### 구조 / 번역 드리프트
이상 없음. 헤딩 11개, 이미지 5개, 표 38행 모두 일치. 196 vs 194줄 차이는 ko.md에만 있는 영어 인용구 아래 한국어 번역 줄 2곳(line 26-27, 117-118) 때문으로, 구조적으로 당연한 차이입니다.

### 표현
- `ko.md:126` — `"## ⛓️ 밴드와 체인 — ...보충해줍니다."` → 이 글의 다른 헤딩(line 37, 166)은 "-ㄴ다"체인데 이 헤딩만 "-해줍니다"체라 문체가 어긋납니다. "보충한다"로 통일 제안.
- `en.md:106` — `"The signature idea of Louie Simmons, the head of Westside Barbell. He observed..."` → 주어+동사가 빠진 문장 조각입니다. `"This is the signature idea of Louie Simmons, the head of Westside Barbell."`을 제안.

### 사실 점검
Claude Code 관련 서술 없음(해당 없음).

---

## src/content/projects/relu-soft/west-side-barbell-club/02-raise-a-prob-and-sol (ko.md / en.md)

이상 없음. 헤딩 5개, 이미지 1쌍, 표 1개(3행) 모두 대응하며 en.md에 번역 누락된 한국어도 없습니다. (`draft: true` 상태로 ko/en 일관되게 표시되어 있어 배포에는 포함되지 않습니다.)

---

## 제외 사항

`src/content/pages/cv/`는 지시에 따라 점검 대상에서 제외했습니다(draft 상태로 아직 다듬는 중).
