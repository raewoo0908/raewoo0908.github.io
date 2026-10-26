# ko/en 이중언어 점검 리포트 — 2026-10-26

## 요약

`src/content/` 아래 **ko.md/en.md 짝 28개**를 전수 점검했습니다. (`src/content/pages/cv`는 아직 다듬는 중인 draft 문서라 이번 점검에서 제외 — 맨 아래 참고.)

| 폴더 | 글 수 | 드리프트/미번역 | 표현 지적 | 사실점검(claude/*) |
| --- | --- | --- | --- | --- |
| pages (home) | 1 | 0 | 0 | - |
| posts/ai (16개 글 — 아래 상세 참고) | 16 | 0 | 0 | 해당 없음 |
| posts/claude (hook, intro-automation-hook-loop-routine, loop, routine, worktree) | 5 | 0 | 0 | **3건 오류 확인** (hook, routine, worktree) |
| posts/git (worktree) | 1 | 0 | 0 | 해당 없음 |
| posts/python (01, 02, 03) | 3 | 0 | 0 | - |
| projects/relu-soft (01, 02) | 2 | 0 | 0 | - |
| **합계** | **28** | **0건** | **0건** | **3건** |

- 번역 드리프트·표현 점검에서는 **지적 사항이 없습니다.** 28개 글 모두 헤딩 개수·순서·계층, 표·이미지 참조·코드블록(주석 포함) 번역, 문장 표현이 ko/en 간 정확히 대응되었습니다.
- 사실 점검에서 `posts/claude` 아래 3개 글에 공식 문서와 어긋나는 서술을 발견했습니다. 모두 "개수를 세는" 유형의 주장이라 공식 문서([code.claude.com/docs/en](https://code.claude.com/docs/en/)) 해당 절을 끝까지 읽고 직접 세어 확인했으며, 교차 검증을 위해 서브에이전트 점검과 별개로 제가 직접 한 번 더 WebFetch로 재확인했습니다.
- `docs/blog-style-guide.md`가 요구하는 "한쪽에만 있는 섹션/문단/표/코드블록/이미지" 류의 구조적 drift는 이번 점검 범위 전체에서 발견되지 않았습니다. `pre-commit` 훅(`check-bilingual.mjs`, `check-post-images.mjs`)이 구조 위반을 이미 걸러내고 있어 예상된 결과입니다.

---

## src/content/posts/claude/hook (ko.md / en.md)

### 사실(확인됨, 오류) — stdout이 Claude에게 보이는 이벤트 개수

- `ko.md:250`: `> 💡 **stdout이 Claude에게 보이는 이벤트는 셋뿐입니다** — ` `UserPromptSubmit`, `UserPromptExpansion`, `SessionStart`.`
- `en.md:250`: `> 💡 **Only three events have their stdout shown to Claude** — ` `UserPromptSubmit`, `UserPromptExpansion` and `SessionStart`.`

공식 문서([hooks](https://code.claude.com/docs/en/hooks), "Exit code 0" 절)를 직접 조회해 재확인한 결과:

> "The exceptions are `UserPromptSubmit`, `UserPromptExpansion`, `SessionStart`, and `PostModelSwitch`, where Claude Code adds plain-text stdout as context that Claude can see and act on."

즉 **넷**입니다 (`PostModelSwitch` 누락). 바로 이 글 자체가 `PostModelSwitch`를 "모델 전환 전후" 훅으로 앞 문단(249행)에서 이미 소개하고 있어, 이 콜아웃만 빠뜨린 것으로 보입니다.

**제안**: ko.md와 en.md 두 줄 모두 "셋"→"넷", 목록에 `PostModelSwitch` 추가.
```
ko: stdout이 Claude에게 보이는 이벤트는 넷뿐입니다 — `UserPromptSubmit`, `UserPromptExpansion`, `SessionStart`, `PostModelSwitch`.
en: Only four events have their stdout shown to Claude — `UserPromptSubmit`, `UserPromptExpansion`, `SessionStart` and `PostModelSwitch`.
```

(그 외 이 글이 다루는 이벤트 종류 수 집계, 종료코드 2 차단 표, 타임아웃 값들(`command`/`http`/`mcp_tool` 600초·`prompt` 30초·`agent` 60초, `UserPromptSubmit` 30초·`MessageDisplay` 10초), `asyncRewake`, `disableAllHooks`, `if` 필드, `terminalSequence` 등은 공식 문서와 대조해 정확함을 확인했습니다. 환경변수 목록이 "사실상 전부"라는 서술은 문서에 완결된 단일 목록이 있는지 끝까지 확인하지 못해 **확인 불가**로만 남깁니다 — 오류 근거 아님.)

### 드리프트 / 표현

이상 없음.

---

## src/content/posts/claude/routine (ko.md / en.md)

### 사실(확인됨, 오류) — 실행 횟수 상한의 주기와 one-off 포함 여부

- `ko.md:411`: `routine 실행도 일반 세션과 똑같이 구독 사용량을 씁니다. 거기에 더해 **계정당 일일 실행 횟수 상한**이 따로 있습니다.`
- `ko.md:413`: `> 💡 **1회성 실행(one-off)은 일일 상한에서 제외됩니다.** 구독 사용량은 쓰지만 routine 실행 횟수로는 안 세니, 가벼운 예약에 부담 없이 쓰셔도 됩니다.`
- `en.md:412`: `Routine runs draw down subscription usage like any session. On top of that there's a **separate daily cap on runs per account**.`
- `en.md:414`: `> 💡 **One-off runs are exempt from the daily cap.** They consume regular subscription usage but don't count against the routine run allowance, so use them freely for light scheduling.`

공식 문서([routines](https://code.claude.com/docs/en/routines), "Usage and limits" 절)를 직접 조회해 재확인한 결과, 표는 다음과 같습니다:

> | Action | Limit | Counted for | Over the limit |
> | Scheduled runs, including one-off runs | 100 per hour | Your account | The run waits until the limit resets |

즉 상한은 **일일(daily)이 아니라 시간당(hourly, 100회)**이고, **one-off 실행은 제외가 아니라 오히려 그 한도에 명시적으로 포함**됩니다 ("including one-off runs"). 글의 두 문장 모두 사실과 반대입니다.

**제안**: "일일 상한" → "시간당(1시간당 100회) 상한"으로, "one-off는 제외" → "one-off도 이 한도에 포함"으로 정정.
```
ko: 거기에 더해 **계정당 시간당 100회 실행 상한**이 따로 있습니다. (one-off 실행도 포함됩니다.)
    → 콜아웃도 "1회성 실행(one-off)도 이 시간당 상한에 포함됩니다."로 수정
en: On top of that there's a **separate hourly cap of 100 runs per account**. (One-off runs count toward it too.)
    → callout: "One-off runs count toward the same hourly cap."
```

### 사실(확인 불가)

- `ko.md:420` / `en.md:421`: `/schedule`이 "Unknown command"로 뜨는 원인 중 "텔레메트리를 껐을 때 — `DISABLE_TELEMETRY`, `DO_NOT_TRACK`, `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC`, `DISABLE_GROWTHBOOK`" 부분. 공식 문서의 "`/schedule` returns Unknown command" 트러블슈팅 절을 끝까지 읽었으나, 이 네 변수를 원인으로 명시한 문구를 찾지 못했습니다(문서는 로그인 방식·클라우드 세션 여부·조직 정책·커스텀 역할 권한만 원인으로 열거). **문서에 없다고 오류로 단정할 근거는 없으므로 "확인 불가"로만 남깁니다** — 저자가 직접 재현해 확인한 내용일 수 있습니다.
- `/loop` 7일 자동 만료, `Esc`/`--resume`, 동적 모드 1분~1시간 범위, cron·API·GitHub 트리거 3종, "research preview" 상태, 보호 브랜치 규칙 3종, `claude/` 접두 브랜치, UTC 기준, 1시간 최소 cron 간격 등 나머지 서술은 공식 문서와 대조해 **정확함을 확인**했습니다.

### 드리프트 / 표현

이상 없음.

---

## src/content/posts/claude/worktree (ko.md / en.md)

### 사실(확인됨, 오류) — 격리 체크 개수

- `ko.md:330`: `막히는 건 세 가지입니다.` (이어서 파일 편집 · 명령의 작업 디렉터리 · git 우회 세 항목만 나열)
- `en.md:330`: `Three things get blocked.` (동일하게 세 항목만 나열)

공식 문서([worktrees](https://code.claude.com/docs/en/worktrees), "How Claude Code enforces isolation" 절)를 직접 조회해 재확인한 결과, 문서는 "Claude Code applies **four** checks"라며 다음 네 가지를 명시합니다:

1. File edits
2. Command working directory
3. Git redirects
4. **Command shape** — 명령어 이름이 런타임에 계산되거나, 문법을 파싱할 수 없거나, `${!name}`/`${ command; }` 같은 확장이 있어서 "명령 텍스트만 보고는 그 안의 git이 워크트리 안에 머무는지 확인할 수 없는" 경우를 막는 네 번째 체크.

글은 이 네 번째 체크("Command shape")를 아예 언급하지 않은 채 "세 가지"라고 단정하고 있습니다.

**제안**: "세 가지" → "네 가지"로 수정하고, 네 번째 항목("명령 형태 확인 불가" — 명령어가 런타임에 계산되거나 파싱이 안 되거나 셸 확장이 있어서 그 안의 git이 워크트리 밖으로 못 나가는지 확인할 수 없을 때 차단, 끌 수 없음)을 목록에 추가.
```
ko: 막히는 건 네 가지입니다.
    - **파일 편집** — ...
    - **명령의 작업 디렉터리** — ...
    - **git 우회** — ...
    - **명령 형태** — 명령어 이름이 실행 시점에 계산되거나 문법을 파싱할 수 없거나 `${!name}`/`${ command; }` 같은 확장이 있어서, 그 안의 git이 워크트리 밖으로 안 나간다는 걸 명령 텍스트만으로 확인할 수 없을 때 막습니다. 끌 수 없습니다.
en: Four things get blocked.
    - **File edits** — ...
    - **A command's working directory** — ...
    - **git redirects** — ...
    - **Command shape** — blocked when Claude Code can't verify from the command text that any git it runs stays inside the worktree — for example when the command name is computed at runtime, the syntax can't be parsed, or an expansion like `${!name}`/`${ command; }` is involved. You can't turn this check off.
```

(그 외 `.claude/worktrees/<name>/` 기본 경로, `worktree-<name>` 브랜치 규칙, `baseRef` `fresh`/`head` 의미, 24시간·5초 fetch 캡, `.worktreeinclude` 문법, 세션 종료 시 정리 규칙, `-p` 헤드리스의 정리 누락, PR 워크트리(`#1234`), `isolation: worktree` frontmatter, `EnterWorktree`/`ExitWorktree` 도구는 공식 문서와 대조해 정확함을 확인했습니다. `CLAUDE_BASE` 파일 관련 서술은 문서 본문에서 그 이름을 직접 찾지 못해 **확인 불가**로만 남깁니다 — 오류 근거 아님.)

### 드리프트 / 표현

이상 없음.

---

## src/content/posts/claude/intro-automation-hook-loop-routine (ko.md / en.md)

이상 없음. `/loop` 문법, 동적/정주기 모드, routine의 cron·API·GitHub 트리거 3종, "research preview" 상태, "Anthropic 클라우드" 실행 서술을 공식 문서([scheduled-tasks](https://code.claude.com/docs/en/scheduled-tasks), [routines](https://code.claude.com/docs/en/routines))와 대조해 정확함을 확인했습니다. Hook 이벤트를 "대표적인 네 가지"(`PreToolUse`·`PostToolUse`·`Notification`·`Stop`)로만 소개하고 전체 개수를 주장하지 않아 문제 없습니다.

## src/content/posts/claude/loop (ko.md / en.md)

이상 없음. 간격→cron 변환 규칙, 최소 간격 1분, 지터, `CronCreate`/`ScheduleWakeup`/`CronList`/`CronDelete`, 세션당 최대 50개, `loop.md` 경로 우선순위, 25,000바이트 제한, 7일 자동 만료, `CLAUDE_CODE_DISABLE_CRON=1` 모두 공식 문서와 대조해 정확함을 확인했습니다.

## src/content/posts/git/worktree (ko.md / en.md)

이상 없음. git 자체의 범용 개념 설명으로 Claude Code 관련 서술이 없어 사실 점검 대상이 아니었고, 번역도 전부 대응됩니다.

## src/content/pages/home (ko.md / en.md)

이상 없음.

## src/content/posts/ai/* (16개 글)

아래 16개 글 모두 헤딩·수식·표·이미지 참조(`.ko.`/`.en.` 짝 포함)·코드블록이 ko/en 간 정확히 1:1 대응하고, 표현상 어색한 부분도 없었습니다. 전부 **이상 없음**.

- accuracy-precision-recall-f1-auroc
- experiment-X-Ray-transfer-learning
- experiment-data-normalization-and-augmentation
- experiment-x-ray-transfer-learning-result
- introduction-to-unet
- limitation-of-linear-decision-boundary-and-MLP
- logistic-regression
- object-detection-metrics-iou-ap-map
- optimizer-scheduler-amp
- practical-statistics-for-data-scientists/chi-square-distribution-and-test
- practical-statistics-for-data-scientists/data-distribution-and-correlation
- practical-statistics-for-data-scientists/data-types-location-and-variability-estimation
- practical-statistics-for-data-scientists/normal-and-t-distribution
- practical-statistics-for-data-scientists/sampling-distribution-and-bootstrap
- r-cnn
- ssd-classification-head-replacement (`torchvision 0.28.0` 등 수치 표기도 ko/en 일치)

(참고: `practical-statistics-for-data-scientists/data-types-location-and-variability-estimation`와 `r-cnn`의 참고자료 섹션에서 en.md가 한국어 출처 링크에 `(Korean)` 표기를 덧붙인 것은 의미를 바꾸지 않는 부가 설명이라 drift로 보지 않았습니다.)

## src/content/posts/python/* (3개 글)

- 01-everything-is-an-object: 이상 없음.
- 02-variables-are-name-tags: 이상 없음.
- 03-the-inside-story-of-if: 이상 없음.

## src/content/projects/relu-soft/west-side-barbell-club/* (2개 글)

- 01-about-conjugate: 이상 없음.
- 02-raise-a-prob-and-sol (draft: true, 정상 점검 대상): 이상 없음.

---

## 제외 사항

`src/content/pages/cv`는 지시에 따라 이번 점검에서 **제외했습니다** (draft 상태로 아직 다듬는 중이라 지적해도 반영되지 않음 — 파일을 읽지 않았고, 글 수 집계·리포트 항목에도 포함하지 않았습니다).

## Discord 알림

`DISCORD_WEBHOOK_URL`이 설정되어 있어 이 리포트의 요약을 Discord로 전송했습니다.
