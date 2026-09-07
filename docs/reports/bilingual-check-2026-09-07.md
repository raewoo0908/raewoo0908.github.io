# ko/en 이중언어 점검 리포트 — 2026-09-07

## 요약

`src/content/` 아래 **ko.md/en.md 짝 12개**를 전수 점검했습니다(pages 1 + posts/claude 5 + posts/git 1 + posts/python 3 + projects/relu-soft 2). `src/content/pages/cv`는 아직 다듬는 중인 draft 문서라 이번 점검에서 제외했습니다(맨 아래 참고).

| 폴더 | 글 수 | 드리프트 | 표현 지적 | 사실점검 지적(claude/*) |
| --- | --- | --- | --- | --- |
| pages (home) | 1 | 0 | 0 | - |
| posts/claude (hook, intro-automation, loop, routine, worktree) | 5 | 2(경미) | 3 | **3건**(hook 2, routine 1) |
| posts/git (worktree) | 1 | 0 | 1 | 해당 없음 |
| posts/python (01, 02, 03) | 3 | 0 | 4 | - |
| projects/relu-soft (01, 02) | 2 | 0 | 0 | - |
| **합계** | **12** | **2** | **8** | **3건** |

- **가장 중요한 발견**: `posts/claude/hook`이 "이벤트가 31종"이라고 못박은 부분은 **공식 문서와 직접 모순**됩니다. https://code.claude.com/docs/en/hooks.md 에 열거된 이벤트를 직접 세어보면 **33종**입니다(글의 목록엔 `PreModelSwitch`/`PostModelSwitch` 두 개가 빠져 있습니다). 아래 해당 절에 전체 33종 목록을 첨부했습니다.
- `posts/claude/routine`의 "API 트리거와 GitHub 트리거는 웹 UI에서 붙여야 합니다"라는 서술도 절반만 맞습니다 — API 트리거는 맞지만, **GitHub 트리거는 Claude Code v2.1.225 이상 CLI에서도 붙일 수 있다**고 공식 문서에 명시돼 있습니다.
- 구조적 위반(헤딩 개수·순서, 표, 코드블록 실행 로직, 이미지 언어쌍 참조)은 **모든 글에서 이상 없음** — pre-commit 훅이 이미 강제하고 있어 예상된 결과입니다. 지난 8/10 리포트에서 지적됐던 `posts/claude/worktree`의 en.md 미번역 잔존 문제도 이번엔 발견되지 않았습니다(그새 수정된 것으로 보입니다).
- 나머지는 조사·띄어쓰기 오탈자, 사소한 어색한 영어 표현 수준입니다.

---

## src/content/pages/home (ko.md / en.md)

이상 없음. 헤딩·불릿 4개 순서·내용 완전히 일치, 표현도 자연스럽습니다.

---

## src/content/posts/claude/hook (ko.md / en.md)

### 드리프트

이상 없음 — 헤딩 24개, 표 8개, 코드블록, 이미지 6쌍(`.ko.svg`/`.en.svg`) 모두 대응합니다.

### 표현 점검

이상 없음.

### 사실 점검 — 오류 2건

1. **"이벤트 31종" — 공식 문서와 모순 (실제 33종)**
   - 인용 (`ko.md` 189행): `## 📖 이벤트 31종 지도` / (191행) `개요 글에서는 대표적인 네 개만 소개했지만, 실제로는 31종입니다.`
   - 확인: https://code.claude.com/docs/en/hooks.md 에 실제로 열거된 이벤트를 하나씩 세면 아래 **33개**입니다.
     ```
     1  SessionStart        12 MessageDisplay      23 DirectoryAdded
     2  Setup               13 SubagentStart        24 FileChanged
     3  UserPromptSubmit    14 SubagentStop         25 WorktreeCreate
     4  UserPromptExpansion 15 TaskCreated           26 WorktreeRemove
     5  PreToolUse          16 TaskCompleted         27 PreCompact
     6  PermissionRequest   17 Stop                  28 PostCompact
     7  PermissionDenied    18 StopFailure           29 PreModelSwitch
     8  PostToolUse         19 TeammateIdle          30 PostModelSwitch
     9  PostToolUseFailure  20 InstructionsLoaded     31 Elicitation
     10 PostToolBatch       21 ConfigChange           32 ElicitationResult
     11 Notification        22 CwdChanged             33 SessionEnd
     ```
   - 글의 여섯 그룹(도구 계열 6 + 프롬프트·표시 3 + 세션 수명 8 + 턴 종료·알림 3 + 서브에이전트·태스크 5 + 컨텍스트·워크트리·MCP 6 = 31)을 그대로 세어도 31개이고, ko/en 사이에 드리프트는 없습니다. 다만 공식 문서 기준 실제 개수와는 다릅니다 — 글의 목록에 빠진 두 이벤트는 `PreModelSwitch`, `PostModelSwitch`(모델 전환 시점 훅, 타임아웃 기본값도 30초로 별도 명시됨)입니다.
   - 제안: "31종"을 "33종"으로 고치고, "컨텍스트·워크트리·MCP 계열" 그룹(또는 새 그룹)에 `PreModelSwitch`/`PostModelSwitch`를 추가.

2. **"쓸 수 있는 환경변수는 이 정도입니다. 이게 사실상 전부입니다" — 완전하지 않음**
   - 인용 (`ko.md` 174행): `쓸 수 있는 환경변수는 이 정도입니다. **이게 사실상 전부입니다.**` (뒤이어 `CLAUDE_PROJECT_DIR`·`CLAUDE_PLUGIN_ROOT`/`CLAUDE_PLUGIN_DATA`·`CLAUDE_CODE_REMOTE`·`CLAUDE_CODE_BRIDGE_SESSION_ID`·`CLAUDE_EFFORT`·`CLAUDE_PLUGIN_OPTION_<KEY>` 6개만 나열)
   - 확인: 공식 hooks-guide 문서에는 `CLAUDE_ENV_FILE`이라는 환경변수가 별도로 존재합니다(`SessionStart`/`CwdChanged` 훅이 여기에 `direnv export bash > "$CLAUDE_ENV_FILE"`처럼 써서, Claude Code가 다음 Bash 명령 실행 전에 프리앰블로 읽어들이는 용도). "훅에서 언급되는 환경변수 이게 전부"라는 완전성 주장과는 어긋납니다.
   - 제안: 목록에 `CLAUDE_ENV_FILE`(용도: SessionStart/CwdChanged 훅이 환경변수를 다음 Bash 실행에 전달하는 통로) 추가, 또는 "도구 입력을 다루는 훅에서 흔히 쓰는 변수는 이 정도"처럼 범위를 좁히는 문구로 완화.

그 외 종료코드 0/2 동작, 이벤트별 차단 가능표, `settings.json` 3단계 위치, matcher 정확매치/정규식 규칙, hook type 5종(`command`/`http`/`mcp_tool`/`prompt`/`agent`), timeout 기본값(600s/30s/60s 등), `stop_hook_active` 무한루프 방지, `$CLAUDE_PROJECT_DIR` 상대경로 경고, `if` 필드, `/hooks`·`disableAllHooks` 등 다수의 세부 서술은 공식 문서와 대조해 **확인됨**입니다.

---

## src/content/posts/claude/intro-automation-hook-loop-routine (ko.md / en.md)

이상 없음. 드리프트·표현 문제 없음. hook 4대 이벤트(`PreToolUse`/`PostToolUse`/`Notification`/`Stop`) 예시, `.claude/settings.json`, `/loop` 세 모드·7일 만료·`Esc`·`--resume`, routine의 research preview 상태·트리거 3종 서술 모두 공식 문서(https://code.claude.com/docs/en/hooks.md, /scheduled-tasks.md, /routines.md)와 일치 확인됩니다.

---

## src/content/posts/claude/loop (ko.md / en.md)

### 드리프트 — 경미 (예시 데이터, 실제 저장소 기록 아님)

- **파일**: `ko.md`/`en.md` 91~96행, 이미지 `image/loop-terminal-deploy.{ko,en}.svg`
- 인용:
  - `ko.md`: `✓  feat(toc): 목차 추가` / `content: Hook 상세 글` / `ci: 액션 버전 상향`
  - `en.md`: `✓  feat(toc): add table of contents` / `content: add Hook deep-dive` / `ci: bump action versions`
- 바로 앞 문장이 "매 틱마다 Claude가 돌리는 명령과 그 **실제 출력**은 이렇습니다"라고 소개하는데, ko/en의 커밋 메시지 예시가 서로 다른 문자열입니다. (`git log --oneline --all`로 이 저장소 실제 기록을 확인해 봤지만 두 메시지 모두 실존하지 않아, 진짜 캡처가 아니라 삽화용 예시로 보입니다. 그래서 실제 이력과 어긋난다는 뜻은 아니고, "실제 출력"이라는 문구 아래에서 언어별로 다른 예시값이 나온다는 점만 사소하게 걸립니다.)
- 제안: 큰 문제는 아니라 필수 수정은 아니지만, "실제 출력"이라는 문구를 강조하는 만큼 en.md 쪽 커밋 메시지 3줄을 ko.md와 같은 한국어 원문으로 맞추거나(다른 예시 코드블록의 관례와 동일하게), 아니면 "예시 출력"처럼 문구를 완화하는 편이 자연스럽습니다.

### 표현 점검

이상 없음(en.md에 `no exceptions`, `streams... back live`처럼 아주 사소하게 군더더기로 느껴지는 표현이 있으나 의미 왜곡은 없어 필수 수정 대상은 아닙니다).

### 사실 점검

이상 없음 — `/loop [간격] [프롬프트]` 문법, `CronCreate`/`ScheduleWakeup` 구분, 간격 단위(s/m/h/d)와 최소 1분 올림, cron 변환 규칙, 동적 모드 1분~1시간, `Monitor` 도구, `.claude/loop.md`/`~/.claude/loop.md` 우선순위와 25,000바이트 제한, 정지 방법(`Esc`/`CronDelete`/7일 만료), 지터 규칙(최대 30분, 1시간 미만 간격은 절반까지, 동적 모드엔 없음), `CLAUDE_CODE_DISABLE_CRON=1` — 모두 공식 문서(https://code.claude.com/docs/en/scheduled-tasks.md)와 일치 확인됩니다.

---

## src/content/posts/claude/routine (ko.md / en.md)

### 드리프트 — 경미

- **파일**: `ko.md`/`en.md` 92행, routine 설정 JSON 예시
- 인용: `ko.md`: `"name": "블로그 ko/en 주간 점검"` / `en.md`: `"name": "Weekly ko/en check"`
- 이 블록은 "제가 실제로 만든 routine의 설정입니다"라고 소개된 실제 구성 예시인데, `name` 값이 언어별로 다른 문자열로 옮겨져 있습니다. 실제 설정값을 그대로 보여주는 취지라면 두 언어 모두 원래 값(`"블로그 ko/en 주간 점검"`)을 유지하는 편이 "실제로 만든 설정"이라는 서술과 더 맞습니다. 사소한 사안이라 필수 수정은 아닙니다.

### 내용 정합성 — ko.md 자체의 숫자 불일치 (드리프트 아님, en도 동일하게 옮김)

- **인용 1** (`ko.md` 229행, Discord 요약 인용 코드블록): `점검 글 12개 / 발견 7건 (실질 드리프트 4, 표현 1, 의도확인 1) + Claude Code 사실점검`
- **인용 2** (`ko.md` 368행): `ko/en 짝 **10쌍**을 전수 대조하고`
- 같은 사건을 설명하면서 "12개"와 "10쌍"으로 숫자가 다릅니다. en.md도 이 불일치를 그대로 "12 posts audited"(229행)/"all **ten** ko/en pairs"(369행)로 옮겨서 ko/en 간 드리프트는 아니지만, ko.md 자체에 사실 오류(혹은 인용 코드블록이 실제로 그렇게 왔다면 그 자체의 오류)가 있어 보입니다.
- 제안: 어느 쪽이 맞는 숫자인지 확인 후 통일(사실이 "12개"였다면 368행을, "10쌍"이었다면 229행 인용 코드블록을 수정).

### 표현 점검

1. **`ko.md` 오탈자 — "Github" (58행, 240행)**
   - 인용: `접근 가능한 **Github** 저장소, 네트워크 정책` / `제 **Github** repository에도 새로운 브랜치로`
   - "GitHub"가 맞는 표기입니다. en.md의 대응 위치(58행, 240행)에는 이미 정확히 "GitHub"로 되어 있어 ko 쪽에만 있는 오탈자입니다.
   - 제안: 두 곳 모두 "Github" → "GitHub".

2. **`en.md` 345행 — 다소 어색한 삽입구**
   - 인용: `Claude can call every tool from an included connector, **writes included**, without asking permission during a run.`
   - `ko.md`(344행) `"포함된 커넥터의 모든 도구를 쓰기 작업까지 승인 없이 호출할 수 있습니다"`의 강조(쓰기까지 포함)를 살리려 한 것으로 보이나 영어 문장 중간 삽입구가 어색합니다.
   - 제안: `Claude can call every tool from an included connector — including writes — without asking permission during a run.`

### 사실 점검 — 오류 1건

1. **"API 트리거와 GitHub 트리거는 웹 UI에서 붙여야 합니다" — GitHub 트리거는 절반만 맞음**
   - 인용 (`ko.md`/`en.md` 82행): `CLI \`/schedule\`로는 예약(cron) 트리거만 만들 수 있습니다. API 트리거와 GitHub 트리거는 웹 UI에서 붙여야 합니다. 토큰 발급·폐기도 CLI로는 안 됩니다.`
   - 확인: https://code.claude.com/docs/en/routines.md
     - API 트리거: `"API triggers are added to an existing routine from the web. The CLI cannot currently create or revoke tokens."` — 글의 서술과 **일치**.
     - GitHub 트리거: `"You can add a GitHub trigger from the web or from the CLI. The CLI path requires Claude Code v2.1.225 or later."` — 글의 서술과 **모순**. CLI에서도 기존 routine에 GitHub 트리거를 붙일 수 있습니다(예: `/schedule add a GitHub trigger to my nightly review for pull requests opened in acme/webapp`), 단 Claude Code v2.1.225 이상이 필요합니다.
   - 제안: "API 트리거는 웹 UI에서만 붙일 수 있지만, GitHub 트리거는 v2.1.225 이상 CLI에서도 기존 routine에 붙일 수 있습니다(새 routine 생성 자체는 여전히 웹/Desktop/CLI 어디서나 가능)"처럼 API와 GitHub를 구분해서 서술.

그 외 트리거 3종(Scheduled/API/GitHub), cron 최소 간격 1시간과 거부 규칙, stagger 오프셋, 네트워크 레벨 4단계(None/Trusted/Custom/Full), 기본 허용목록에 `code.claude.com` 포함, "Also include default list of common package managers" 체크 필요성, 로컬 MCP 서버 미동기화, 커넥터 기본 전체 포함, `claude/` 접두 브랜치 자동 통과, routine 소유권(개인 계정, 커밋/PR에 본인 GitHub 계정 사용), 일일 실행 상한과 one-off 예외, `/schedule` "Unknown command" 3가지 원인, CLI로는 삭제 불가(웹에서만) 등은 공식 문서와 대조해 **확인됨**입니다. (`code.claude.com`이 기본 허용목록에 있다는 서술은 목록 전문까지는 이번 조회로 직접 확인하지 못해 참고로만 남깁니다 — 오류 근거는 아닙니다.)

---

## src/content/posts/claude/worktree (ko.md / en.md)

이상 없음. 헤딩 18개·표 5개·이미지 3쌍 모두 대응하고, en.md에 번역되지 않은 한국어도 발견되지 않았습니다(8/10 리포트에서 지적됐던 미번역 잔존 6곳은 이번 점검에서 모두 해소된 상태입니다). `claude -w`/`-w <name>`, `.claude/worktrees/<name>/`, 브랜치명 `worktree-<name>`, `worktree.baseRef`(`fresh`/`head`, 기본값 `fresh`), `.worktreeinclude`, `EnterWorktree`/`ExitWorktree`, `isolation: worktree` frontmatter, `cleanupPeriodDays`, PR 워크트리(`#1234`), 격리 가드레일(파일 편집·작업 디렉터리·git 우회 차단), 서브에이전트 워크트리 자동 정리 등은 공식 문서(https://code.claude.com/docs/en/worktrees.md)와 대조해 **확인됨**입니다. (`.git/worktrees/<name>/` 안의 `CLAUDE_BASE` 파일은 공식 문서에 이름이 명시되지 않아 **확인 불가** — 내부 구현 세부사항으로 보이며 오류 근거는 아닙니다.)

---

## src/content/posts/git/worktree (ko.md / en.md)

Claude Code와 무관한 순수 git worktree 설명 글입니다.

### 드리프트

이상 없음 — 헤딩·표·코드블록·이미지 참조 모두 대응. `git branch`/`git worktree list` 실제 터미널 출력 블록도 ko/en 동일하게 유지되어 있습니다.

### 표현 점검

1. **`ko.md` 12행 — 띄어쓰기 오류**
   - 인용: `이 뿐만 아니라, .env 등 환경변수 파일도…`
   - "이뿐만"은 붙여 쓰는 것이 맞습니다.
   - 제안: `이뿐만 아니라, .env 등…`

---

## src/content/posts/python/01-everything-is-an-object (ko.md / en.md)

### 드리프트

이상 없음 — 헤딩 22개, 코드펜스 102개(51블록) 전부 라인 단위 대조 결과 로직·출력값 동일, 이미지 15쌍, `i18n-intentional(links)` 마커 2곳 모두 정상. 코드 안의 `"안녕"`, `"가나😂"` 같은 한글은 멀티바이트 문자 테스트용 데이터로 ko/en 양쪽에 동일하게 나오는 의도된 코드라 문제 아닙니다.

### 표현 점검

1. **`ko.md` 161행 — 띄어쓰기 오류**
   - 인용: `...구조적 비용인거죠.`
   - 의존명사 "거"(것) 앞은 띄어 씁니다.
   - 제안: `...구조적 비용인 거죠.`

---

## src/content/posts/python/02-variables-are-name-tags (ko.md / en.md)

이상 없음. 헤딩·표·코드블록(바이트코드 출력 포함)·이미지 참조 모두 정확히 대응하고, en.md에 미번역 한글도 없습니다.

---

## src/content/posts/python/03-the-inside-story-of-if (ko.md / en.md)

### 드리프트

이상 없음 — 헤딩 5단계, 표, 코드블록, 이미지 5쌍 모두 대응, 미번역 한글 없음.

### 표현 점검

1. **`ko.md` 444행 — 조사 오류**
   - 인용: `너무 큰 수(2**100)을 줬을 때`
   - "수"는 모음(ㅜ)으로 끝나므로 "을"이 아니라 "를"이 맞습니다.
   - 제안: `너무 큰 수(2**100)를 줬을 때`

2. **`ko.md` 618행 — 어색한 표현**
   - 인용: `단순히 하자면 \`_PyLong_IsZero(v)\` 이 함수는 0이 아니면 참을 리턴합니다.`
   - "단순히 하자면"은 목적어 없이 붕 뜨는 표현입니다.
   - 제안: `간단히 말하자면` 또는 `쉽게 설명하면`

3. **`en.md` 689행 — 어색한 콜로케이션**
   - 인용: `the \`if\` could turn horrifying, couldn't it?`
   - "turn horrifying"은 영어로 부자연스러운 조합입니다("turn"은 보통 `turn ugly`/`turn sour`처럼 짧은 형용사와 어울림).
   - 제안: `the if's performance could turn horrendous, couldn't it?`

---

## src/content/projects/relu-soft/west-side-barbell-club/01-about-conjugate (ko.md / en.md)

이상 없음. 헤딩 11개, 표 4개(수치 포함), 이미지 4쌍 모두 정확히 대응. 영문 원전 인용구 아래에 ko.md에만 한국어 의역이 붙는 곳이 있으나, 영어 원문을 한국어 독자에게 풀어주는 의도된 비대칭이라 누락이 아닙니다.

---

## src/content/projects/relu-soft/west-side-barbell-club/02-raise-a-prob-and-sol (ko.md / en.md)

이상 없음. 헤딩 5개, 이미지 1쌍, 표·리스트 항목 모두 1:1 대응. 직역투·비문·오탈자 없음.

---

## 확인 불가로 남긴 항목 정리 (오류 근거 아님)

- `posts/claude/worktree`의 `CLAUDE_BASE` 파일명 — 공식 문서에 명시되지 않음(내부 구현 세부사항으로 추정).
- `posts/claude/routine`의 "`code.claude.com`도 기본 허용목록에 있다" — 이번 조회에서 허용목록 전문까지는 확인하지 못함.

이 외 이번 리포트에 등장한 Claude Code 관련 설정 키·훅 이벤트·슬래시 커맨드·환경변수·기본값·제한값 서술 대부분은 https://code.claude.com/docs/en/ 하위 문서(hooks, hooks-guide, scheduled-tasks, routines, worktrees)로 대조해 확인 완료입니다.

---

## 제외 안내

`src/content/pages/cv`는 아직 다듬는 중인 draft 문서라 이번 점검 대상·집계에서 제외했습니다.

---

## Discord

요약을 Discord로 전송했습니다(`DISCORD_WEBHOOK_URL` 설정됨).
