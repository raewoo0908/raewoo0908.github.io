# ko/en 이중언어 점검 리포트 — 2026-08-31

## 요약

`src/content/` 아래 **ko/en 짝 13개**를 전수 점검했습니다(pages/home 1 + posts/claude 5 + posts/git 1 + posts/python 3 + projects/relu-soft 2 + experiences/code-it 1). `src/content/pages/cv/`는 지시에 따라 점검 대상에서 제외했습니다.

| 카테고리 | 점검한 글 | 드리프트 | 표현 지적 | 사실 점검(Claude Code) 지적 |
| --- | --- | --- | --- | --- |
| pages/home | 1 | 0 | 0 | - |
| posts/claude (hook·intro-automation·loop·routine·worktree) | 5 | 0 | 0 | **16건**(오류로 보이는 것 다수, 일부는 문서에서 확인 불가/참고) |
| posts/git (worktree) | 1 | 0 | 1 | 해당 없음(Claude 언급은 실습 브랜치명·URL뿐, 기능 주장 없음) |
| posts/python (01·02·03) | 3 | 0(로직 기준, 서식 차이만 있음) | 3 | 해당 없음(Claude Code 언급 없음) |
| projects/relu-soft (01·02) | 2 | 0 | 0 | 해당 없음 |
| experiences/code-it | 1 | 0 | 0 | 해당 없음 |
| **합계** | **13** | **0** | **4** | **16건** |

- **번역 드리프트(구조 불일치·미번역 한글·의미 누락)는 13개 글 전부 0건**입니다. `ko.md`/`en.md` 짝의 헤딩·표·코드블록·이미지 언어쌍이 전 글에서 1:1로 대응하고 있어, pre-commit 훅과 drift 게이트가 잘 작동하고 있는 것으로 보입니다.
- **가장 눈에 띄는 발견은 `posts/claude/hook`의 "훅 이벤트 31종"입니다.** 공식 문서(`code.claude.com/docs/en/hooks`)를 직접 끝까지 세어 재확인한 결과 **현재는 33종**이며, 빠진 두 이벤트(`PreModelSwitch`/`PostModelSwitch`)가 본문·SVG 다이어그램·"stdout이 보이는 이벤트는 셋"이라는 서술에 연쇄적으로 영향을 주고 있습니다. 이 카운트는 제가 WebFetch로 별도 재검증했습니다.
- `posts/claude/routine`에는 **본문 내부에서 서로 모순되는 문장**(GitHub 접근이 체크박스에 막힌다는 서술과, 몇 줄 뒤 "GitHub는 별도 프록시라 안 막힌다"는 서술)이 있어 우선 확인을 권장합니다.
- 그 외 Claude Code 관련 지적들은 대부분 "글 작성 시점 이후 문서가 갱신되었을 가능성"이 있는 항목이라, **"오류"가 아니라 "현재 문서 기준과 다름"** 정도로 표기했습니다. "문서에서 확인 불가"로 표시한 항목은 오류의 근거가 아니라 단순 미확인이므로 그대로 두어도 됩니다.
- `Github`(대문자 H 누락) 오탈자가 `posts/claude/routine/ko.md`와 `posts/git/worktree/ko.md`에 각각 2곳씩, 총 4곳 있습니다. en.md 쪽은 모두 정확히 "GitHub"로 되어 있어 en이 더 정확합니다.

---

## src/content/pages/home/

이상 없음 — 구조·내용·번역 모두 ko/en 1:1 일치. 이미지·표·코드블록 없음.

---

## src/content/posts/claude/hook/

번역 드리프트·표현 문제: 이상 없음(헤딩 31개, 표 91행, 코드블록 50개, 이미지 6쌍 전부 ko/en 1:1 대응, en.md에 미번역 한글 없음).

Claude Code 사실 점검에서 아래 4건을 발견했습니다. **모두 ko.md/en.md에 동일하게 존재하는 원본 콘텐츠 문제**이며 번역 드리프트는 아닙니다.

- **파일**: `ko.md:187,191` / `en.md:187,191` (및 `image/hook-events-map.ko.svg` / `.en.svg` 전체)
  **인용**: "## 📖 이벤트 31종 지도" / "실제로는 31종입니다" (en: "A map of all 31 events" / "there are actually 31")
  **문제**: `https://code.claude.com/docs/en/hooks` 문서 표를 제가 직접 WebFetch로 끝까지 나열해 세어본 결과 **현재 33개**입니다: SessionStart, Setup, UserPromptSubmit, UserPromptExpansion, PreToolUse, PermissionRequest, PermissionDenied, PostToolUse, PostToolUseFailure, PostToolBatch, Notification, MessageDisplay, SubagentStart, SubagentStop, TaskCreated, TaskCompleted, Stop, StopFailure, TeammateIdle, InstructionsLoaded, ConfigChange, CwdChanged, DirectoryAdded, FileChanged, WorktreeCreate, WorktreeRemove, PreCompact, PostCompact, **PreModelSwitch**, **PostModelSwitch**, Elicitation, ElicitationResult, SessionEnd. 글이 나열한 31개는 이 33개 중 `PreModelSwitch`·`PostModelSwitch` 두 개가 빠진 것과 정확히 일치합니다. `hook-events-map` SVG(ko/en)의 그룹별 개수 라벨도 같은 이유로 31로 되어 있습니다.
  **제안**: "31종"→"33종"으로 수정하고 모델 전환 관련 그룹(또는 도구 계열)에 `PreModelSwitch`/`PostModelSwitch`(모델 전환 전/후, `PreModelSwitch`는 종료코드 2로 전환 차단 가능)를 추가. SVG 두 장(ko/en)도 함께 갱신.

- **파일**: `ko.md:249` / `en.md:249`
  **인용**: "stdout이 Claude에게 보이는 이벤트는 셋뿐입니다 — `UserPromptSubmit`, `UserPromptExpansion`, `SessionStart`" / "Only three events have their stdout shown to Claude..."
  **문제**: 공식 문서는 현재 이 목록에 `PostModelSwitch`도 포함해 **넷**이라고 명시합니다. 위 항목과 같은 원인(모델 전환 이벤트 누락)에서 파생됩니다.
  **제안**: "셋"→"넷"으로 고치고 `PostModelSwitch` 추가.

- **파일**: `image/hook-events-map.ko.svg` / `.en.svg` (PermissionRequest 카드)
  **인용**: `PermissionRequest`에 종료코드 2 차단 가능(●) 표시
  **문제**: 공식 문서는 `PermissionRequest`에 대해 "Exit code 2 isn't honored for this event... Deny through the `decision` object instead"라고 **반대로** 명시합니다. 종료코드 2로는 못 막고 JSON `decision` 필드로만 거부 가능합니다.
  **제안**: `PermissionRequest`의 ● 표시를 제거하거나 "JSON decision 필드로만 차단"으로 교체(ko/en 두 이미지 모두).

- **파일**: `image/hook-events-map.ko.svg` / `.en.svg` (서브에이전트·태스크 카드)
  **인용**: `TaskCreated`, `TaskCompleted`, `TeammateIdle`에 차단 표시(●) 없음
  **문제**: 공식 문서는 세 이벤트 모두 종료코드 2로 각각 "task 생성 롤백/완료 처리 저지/idle 전환 저지"가 가능하다고 명시하는데, 이미지에는 표시가 빠져 있습니다(같은 카드의 `SubagentStop`에는 정상 표시됨).
  **제안**: 세 항목에 ● 표시 추가(ko/en 두 이미지 모두).

**참고(문서에서 확인 불가, 오류 아님)**: `PreCompact`/`PostCompact`/`WorktreeRemove`의 종료코드 2 차단 가능 여부는 문서의 차단 표에서 명시적으로 확인하지 못했습니다.

---

## src/content/posts/claude/intro-automation-hook-loop-routine/

번역 드리프트·표현 문제: 이상 없음.

- **파일**: `ko.md:107` / `en.md:107`
  **인용**: "(현재 research preview 단계입니다)" / "(It's currently in research preview.)"
  **문제**: **문서에서 확인 불가.** scheduled-tasks/routines 공식 문서에서 "research preview" 표기를 직접 찾지 못했습니다. 오류라는 뜻은 아니며 단순 미확인입니다.
  **제안**: 조치 불필요(참고용).

그 외 "대표적인 이벤트는 네 가지"(`PreToolUse`/`PostToolUse`/`Notification`/`Stop`) 서술은 공식 문서와 설명까지 정확히 일치함을 확인했습니다.

---

## src/content/posts/claude/loop/

번역 드리프트·표현 문제: 이상 없음.

- **파일**: `ko.md:53-57` / `en.md:53-57` (입력 3모드 표, "둘 다 생략" 행)
  **인용**: "둘 다 생략 | `/loop` | 내장 유지보수 프롬프트 / `loop.md` | (동적)" / "Neither | `/loop` | Built-in maintenance prompt / `loop.md` | (dynamic)"
  **문제**: 공식 문서의 대응 표는 이 행이 "**Interval only, or nothing**"으로 되어 있어, `/loop 15m`처럼 간격만 주고 프롬프트를 생략하는 경우도 포함합니다(이 경우 동적이 아니라 그 간격의 고정 스케줄로 동작). 본문 표는 "둘 다 생략"이라고만 적어 "간격만 주는 경우"가 어느 행에 해당하는지 명시하지 않습니다. ko/en 양쪽에 동일하게 있어 번역 드리프트는 아닙니다.
  **제안**: 표 3행을 "간격만 있거나 둘 다 생략" / "Interval only, or nothing"으로 넓히고, "실전 3" 절에 `/loop 15m` 같은 사용법 설명을 ko/en 동시에 추가.

- **파일**: `ko.md:100-106` / `en.md:100-106` (간격→cron 매핑 표: `Nm (N ≤ 59)`, `Nh (N ≤ 23)`)
  **문제**: **문서에서 확인 불가.** 공식 문서는 반올림 규칙만 설명할 뿐 `N ≤ 59`·`N ≤ 23`이라는 구체적 상한을 표로 명시하지 않습니다(표준 cron 문법상 타당해 보이나 문서로 직접 확인은 안 됨).
  **제안**: 조치 불필요(참고용).

그 외 `/loop` 기본 문법, 최소 간격 1분 반올림, 지터(최대 30분/간격의 절반), 7일 만료, `--resume`/`--continue` 복원, 세션당 최대 50개, `loop.md` 경로 2곳과 25,000바이트 truncate, `CLAUDE_CODE_DISABLE_CRON=1`, 동적 모드 1분~1시간 및 Monitor 도구 설명은 모두 공식 문서와 문구까지 정확히 일치함을 확인했습니다.

---

## src/content/posts/claude/routine/

번역 드리프트·표현 문제: 이상 없음(474/475줄 차이는 en.md에만 있는 코드펜스 앞 빈 줄 1개뿐, 내용과 무관).

- **파일**: `ko.md:58,240`
  **인용**: "접근 가능한 **Github** 저장소..." / "제 **Github** repository에도..."
  **문제**: 오탈자. "GitHub"가 맞는데 두 곳 모두 "Github"로 되어 있습니다. en.md의 대응 위치는 둘 다 정확히 "GitHub"입니다.
  **제안**: ko.md의 두 "Github"를 "GitHub"로 수정.

- **파일**: `ko.md:216-217, 319` / `en.md:216-217, 320`
  **인용**: ko "*"Also include default list of common package managers"* 를 체크합니다 — **안 하면 GitHub도 막힙니다**"(두 곳 반복) / en "**skip this and GitHub breaks too**"(두 곳 반복)
  **문제**: 공식 문서(`cloud-environments`)는 "GitHub traffic ... don't go through this allowlist"라고 명시합니다. 즉 **GitHub 트래픽은 체크박스 여부와 무관하게 별도 프록시로 항상 통과**하며, 체크박스를 안 켜도 GitHub는 막히지 않습니다. 그런데 이 글은 정반대로 "체크 안 하면 GitHub도 막힌다"고 두 번 서술합니다. 더 눈에 띄는 점은, 같은 글의 바로 아래(ko 322행/en 323행)에서는 "저장소 클론은 별도 프록시라 살아남지만, npm install은 죽습니다"라고 문서와 일치하는 **정반대 설명**을 하고 있어 **글 내부에서도 서로 모순**됩니다.
  **제안**: "안 하면 GitHub도 막힙니다"를 "안 하면 npm install 등 패키지 매니저 접근이 막힙니다(GitHub는 별도 프록시라 영향 없음)"처럼 뒤쪽 설명과 일치하도록 ko·en 동시 수정.

- **파일**: `ko.md:68,82` / `en.md:68,82`
  **인용**: "CLI | 세션에서 `/schedule` | **예약 트리거만**" / "⚠️ CLI `/schedule`로는 예약(cron) 트리거만 만들 수 있습니다. API 트리거와 GitHub 트리거는 웹 UI에서 붙여야 합니다."
  **문제**: 공식 문서(routines 페이지, "Add a GitHub trigger" 절)는 "You can add a GitHub trigger from the web or from the CLI... requires Claude Code v2.1.225 or later"라고 명시합니다. GitHub 트리거도 CLI로 붙일 수 있어, "CLI는 예약 트리거만"이라는 서술은 GitHub 트리거에 한해 부정확합니다(API 트리거가 웹 전용이라는 부분은 문서와 일치). 글 작성 시점(2026년 7월경)엔 CLI에 이 기능이 없었을 가능성이 있어 당시엔 맞았을 수 있으나, 현재 공식 문서 기준으로는 낡은 서술입니다.
  **제안**: "CLI에서는 예약 트리거와(v2.1.225+) GitHub 트리거를 만들 수 있고, API 트리거만 웹 UI에서 붙여야 한다"로 갱신 검토.

- **파일**: `ko.md:115` / `en.md:115`
  **인용**: "cron 식은 언제나 UTC 기준입니다." / "Cron expressions are always UTC."
  **문제**: **문서에서 확인 불가.** 문서는 프리셋(hourly/daily 등) 사용 시 로컬 시간대를 자동 변환한다고만 설명하며, 커스텀 cron 표현식이 항상 UTC로 해석된다는 문장은 이번에 확인한 페이지들에서 찾지 못했습니다. 저자가 `next_run_at` 응답으로 직접 실험 검증했다고 명시하고 있어(라인 128-135) 실측 근거는 있습니다.
  **제안**: "공식 문서에는 명시돼 있지 않지만 직접 실험으로 확인함"이라는 단서를 덧붙이면 더 정확함(선택 사항).

- **파일**: `ko.md:90-110` / `en.md:90-110`
  **인용**: JSON 예시의 `job_config.ccr`, `environment_id`, `session_context`, `allowed_tools`, `mcp_connections`, `clear_mcp_connections` 등 필드명
  **문제**: **문서에서 확인 불가.** 대조한 공식 문서 페이지들에는 routine 생성 API의 JSON 스키마가 노출되어 있지 않습니다(문서는 웹 폼/CLI 사용법 위주). 저자가 API를 직접 호출해 받은 응답이라고 서술하고 있어 오류로 볼 근거는 없습니다.
  **제안**: 조치 불필요(참고용).

그 외 cron 최소 간격 1시간, stagger 지연, 커넥터 기본값(전부 포함, 승인 없이 쓰기 가능), `claude/` 접두 브랜치 규칙, 초록불의 의미, `/web-setup` 권한 범위, 일일 실행 상한과 one-off 예외, 삭제 후 세션 보존, `/schedule` "Unknown command" 원인, 네트워크 접근 4단계와 기본 허용목록, 403 에러 헤더, 세 방법(웹/Desktop/CLI) 동기화, routine 소유 구조는 모두 공식 문서와 정확히 일치함을 확인했습니다.

---

## src/content/posts/claude/worktree/

번역 드리프트·표현 문제: 이상 없음(566줄, 헤딩 29개·코드펜스 76개·표 4개·이미지 3쌍 전부 일치, en.md에 남은 한글은 전부 `git log` 등 실제 명령어 출력의 커밋 메시지라 정상).

- **파일**: `ko.md:330` / `en.md:330`
  **인용**: "막히는 건 세 가지입니다." (파일 편집 / 명령의 작업 디렉터리 / git 우회) / "Three things get blocked."
  **문제**: 공식 문서("How Claude Code enforces isolation" 절)는 현재 "Claude Code applies **four** checks"라며 File edits, Command working directory, Git redirects에 더해 **Command shape**(브레이스 확장·따옴표 없는 heredoc처럼 추적 불가능한 셸 구문 차단)까지 4가지를 나열합니다. 이 네 번째 체크가 글이 기준으로 삼은 버전(2.1.222) 시점에 이미 있었는지는 문서에 버전 표기가 없어 **확인 불가**하지만, 현재 문서 기준으로는 "세 가지"가 아니라 "네 가지"입니다.
  **제안**: "네 가지"로 고치고 네 번째 항목(임의 셸 구문/명령 형태 차단)을 추가하거나, 최소한 이후 버전에서 검사가 늘었을 수 있다는 각주를 덧붙이는 것을 권장.

- **파일**: `ko.md:549` / `en.md:549`
  **인용**: "워크트리 안에서 `claude --resume` 하지 마세요. 재개는 메인 체크아웃에서 실행해야 합니다..." / "Don't run `claude --resume` from inside a worktree..."
  **문제**: 공식 문서("Resume a worktree session" 절)는 "Claude Code re-enters a worktree it created with git under `.claude/worktrees/` **even when you launch from inside it**"라고 명시합니다. 즉 이 글이 주로 다루는 `-w`/서브에이전트가 만든 **표준 워크트리**(`.claude/worktrees/` 아래)는 그 안에서 `--resume`해도 정상 재진입됩니다. "안에서 재개하면 실패한다"는 규칙은 `git worktree add`로 수동 생성한 그 외 워크트리에만 적용되는 것으로 보이는데, 글은 이 구분 없이 일반화하고 있습니다. 다만 이 문단에는 문서 내 다른 항목들과 달리 버전 각주가 없어 언제부터 이랬는지는 **확인할 수 없습니다.**
  **제안**: 사실관계를 재확인해 (a) 이 실패가 수동 생성 워크트리에서만 일어난다면 서술 범위를 좁히거나, (b) 표준 워크트리에서도 재현된다면 문서와 다른 동작임을 명시.

**참고(경미, 완전성 문제이지 오류 아님)**: 청소(sweep)가 건너뛰는 경우를 글은 2가지(변경/미추적/미푸시 파일 있는 워크트리, `-w`로 만든 워크트리)만 들었지만 공식 문서는 4가지를 듭니다. 글이 언급한 2가지 자체는 정확합니다.

---

## src/content/posts/git/worktree/

번역 드리프트: 이상 없음(헤딩·코드블록 4종·콜아웃 2개·이미지 4장 전부 ko/en 1:1 대응, en.md에 미번역 한글 없음. `git branch`/`git worktree list` bash 출력은 실제 실행 결과라 정상). Claude 언급 5곳은 전부 저자의 실습 브랜치명·경로·참고링크일 뿐 기능 주장이 없어 사실 점검 대상이 아닙니다.

- **파일**: `ko.md:20,34`
  **인용**: "커밋(commit)은 Github에서 명사이자 동사로" / "Github에서는 기본적으로 main 브랜치를 제공합니다"
  **문제**: 오탈자. "GitHub"가 맞는데 "Github"로 되어 있습니다. en.md는 두 곳 모두 정확히 "GitHub"입니다.
  **제안**: ko.md의 두 "Github"를 "GitHub"로 수정.

- **파일**: `en.md:34`
  **인용**: "when you leave the first commit in a project initialized with git init, that commit automatically gets a label called main."
  **문제**: "leave the first commit"이 다소 부자연스러운 영어 표현(ko.md의 "첫 번째 커밋을 남기면"을 직역).
  **제안**: "when you make the first commit in a project initialized with git init" 정도로 다듬으면 더 자연스러움.

---

## src/content/posts/python/01-everything-is-an-object/

번역 드리프트: 이상 없음(헤딩 19개·이미지 15쌍·코드블록 57개·표 15행·`i18n-intentional` 마커 2개 전부 대응, 코드 로직도 diff로 확인). Claude Code 관련 서술 없음.

- **파일**: `ko.md:161`
  **인용**: "Python이 C보다 메모리를 많이 쓴다는 말은 막연한 인상이 아니라 이 헤더에서 오는 구조적 비용인거죠."
  **문제**: "비용인거죠"는 의존명사 "거"(것) 앞 띄어쓰기가 빠졌습니다.
  **제안**: "구조적 비용인 거죠."로 수정.

- **파일**: `ko.md:277-278, 368-369, 382-383, 432-433`
  **문제**: en.md는 코드펜스 닫힘 직후 다음 문단 사이에 빈 줄이 있는데 ko.md의 이 4곳은 빈 줄이 빠져 있어 파일 내 스타일이 일관되지 않습니다(ko/en 931/935줄 차이의 원인이지만 렌더링에는 영향 없음).
  **제안**: 위 4곳에 en.md처럼 빈 줄을 추가해 스타일을 통일(선택 사항, 내용에는 영향 없음).

- **파일**: `en.md:882` (`## 🎯 One sentence`)
  **인용**: ko.md:878 "## 🎯 한 문장 요약" ↔ en.md:882 "## 🎯 One sentence"
  **문제**: "요약(summary)"이 번역에서 빠져 "One sentence"만 남아 뜻이 잘 전달되지 않습니다.
  **제안**: "One-Sentence Summary" 또는 "TL;DR"로 수정.

- **파일**: `en.md:837`
  **인용**: "About 96 bytes down to 56 per instance — 42% saved..."
  **문제**: "42% saved"는 무엇이 저장됐다는 건지 불명확해 다소 어색합니다.
  **제안**: "a 42% saving" 또는 "42% smaller"로 수정.

---

## src/content/posts/python/02-variables-are-name-tags/

이상 없음(헤딩 6개·코드펜스 22개·이미지 7개·표 2개 전부 ko/en 대응, 미번역 한글 없음, 표현도 자연스러움).

---

## src/content/posts/python/03-the-inside-story-of-if/

이상 없음(헤딩 24개·코드펜스 70개·이미지 5개·표 1개 전부 ko/en 대응, 코드/출력 속 한국어 예시 문자열도 en에서 일관되게 번역됨).

**참고(drift 아님)**: ko.md "### 판정은 6단계로 결정됩니다" 아래 번호 목록이 실제로는 7개 항목입니다. en.md도 "The decision is over in six steps"로 동일하게(원문 그대로 일관되게) 번역돼 있어 ko/en 간 차이는 없습니다. 굳이 고칠 필요는 없으나, 원한다면 소제목을 "판정 흐름"처럼 느슨한 표현으로 바꾸면 오해를 줄일 수 있습니다.

---

## src/content/projects/relu-soft/west-side-barbell-club/01-about-conjugate/

이상 없음(헤딩 11개, 표 7개, 이미지 4쌍(.ko./.en.) 및 언어중립 이미지 1개 전부 ko/en 대응, 인용문 구조 일치, 영문 표현 자연스러움).

---

## src/content/projects/relu-soft/west-side-barbell-club/02-raise-a-prob-and-sol/

이상 없음(헤딩 5개, 표 3행, 리스트 개수·내용, 이미지 1쌍(.ko./.en.) 전부 ko/en 대응, 내부 링크 정상, 두 파일 모두 `draft: true`로 상태 일치).

---

## src/content/experiences/code-it/code-it/

이상 없음(허브 문서, `DocLinks` 사용). `import DocLinks from '../../../../components/DocLinks.astro';`의 상대경로(4단계)가 실제 파일 위치(`src/content/experiences/code-it/code-it/` → `src/components/`)와 정확히 일치함을 확인했습니다. 헤딩 6개, 로드맵 표 9행, 스택 표 7행, STEP 1~3 구성, `<DocLinks>` props(`collection`·`under`·`tag`·`variant`·`emptyKo`·`emptyEn`), 이미지 1쌍(.ko./.en.), frontmatter 전부 ko/en 대응. Claude Code 관련 서술 없음.

---

## 제외

`src/content/pages/cv/`는 지시에 따라 점검하지 않았습니다(draft 상태로 아직 다듬는 중).
