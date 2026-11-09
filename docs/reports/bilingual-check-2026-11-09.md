# ko/en 이중언어 점검 리포트 — 2026-11-09

## 요약

`src/content/` 아래 **ko.md/en.md 짝 28개**를 전수 점검했습니다. (`src/content/pages/cv`는 아직 다듬는 중인 draft 문서라 이번 점검에서 제외했습니다 — 맨 아래 참고.)

| 폴더 | 글 수 | 드리프트/미번역 | 표현 지적 | 사실점검(claude/*) |
| --- | --- | --- | --- | --- |
| pages/home | 1 | 0 | 0 | - |
| posts/ai (16편) | 16 | 0 | 1(경미) | - |
| posts/claude (hook, intro-automation, loop, routine, worktree) | 5 | 0 | 0 | **7건 확인됨**(공식 문서와 직접 모순) |
| posts/git/worktree | 1 | 0 | 0 | 해당 없음 |
| posts/python (01, 02, 03) | 3 | 0 | 0 | - |
| projects/relu-soft/west-side-barbell-club (01, 02) | 2 | 0 | 0 | - |
| **합계** | **28** | **0** | **1건(경미)** | **7건** |

- **구조적 위반**(헤딩 개수·순서, 표, 코드블록, 이미지 언어쌍 참조)과 **번역 드리프트**(한쪽에만 있는 문단·미번역 한국어)는 전 글에서 **이상 없음** — pre-commit 훅이 이미 강제하고 있어 예상된 결과입니다.
- **가장 중요한 발견**: `posts/claude/*` 5편에서 Claude Code 관련 사실 서술 7건이 공식 문서(`https://code.claude.com/docs/en/`)와 직접 모순됩니다. 전부 "문서에서 확인 불가"가 아니라 문서 본문을 직접 인용해 대조한 **명백한 오류**입니다 (아래 상세). 이 중 두 건(`hook`의 stdout 이벤트 개수, `routine`의 상한 주기·one-off 예외 여부)은 이번 리포트 작성 중 공식 문서를 재조회해 추가로 재확인했습니다.
- `posts/ai/introduction-to-unet`에 경미한 영문 비문 1건.
- 그 외 25편은 드리프트·표현·사실관계 모두 이상 없음.

---

## posts/claude — 사실 점검 상세 (공식 문서와 모순)

### src/content/posts/claude/hook

- `ko.md`(250행) / `en.md`(250행): "stdout이 Claude에게 보이는 이벤트는 셋뿐입니다 — `UserPromptSubmit`, `UserPromptExpansion`, `SessionStart`." / "Only three events have their stdout shown to Claude — `UserPromptSubmit`, `UserPromptExpansion` and `SessionStart`."
  - **문서와 다름.** 공식 Hooks reference(Exit code 0 절)는 다음 **네 개**를 명시합니다: *"`UserPromptSubmit`, `UserPromptExpansion`, `SessionStart`, and `PostModelSwitch`: Claude Code adds plain-text stdout as context that Claude can see and act on."* `PostModelSwitch`가 빠졌습니다. (리포트 작성 중 `https://code.claude.com/docs/en/hooks`를 직접 재조회해 재확인함.)
  - 제안: "셋"을 "넷"으로 바꾸고 `PostModelSwitch`를 목록에 추가.
  - 그 외 이벤트 종류 수, 훅 타입 5종, 기본 timeout(command/http/mcp_tool 600초·prompt 30초·agent 60초, UserPromptSubmit·MessageDisplay 예외), matcher 정규식 규칙, 종료코드 2 표 등 이 글의 나머지 구체적 사실 서술은 공식 문서와 대조해 일치함을 확인했습니다.

### src/content/posts/claude/intro-automation-hook-loop-routine

- `ko.md`(101행): "다음 반복 전에 **`Esc`**로 중단할 수 있고, 만료되지 않은 작업은 **`--resume`**으로 복원됩니다." / `en.md`(101행): "You can stop it with **`Esc`** before the next iteration, and restore an unexpired task with **`--resume`**."
  - **문서와 다름.** 공식 문서(scheduled-tasks, Limitations 절)는 "A self-paced `/loop` isn't restored, so run `/loop` again to restart it."라고 명시합니다. 즉 동적(self-paced) 모드로 건 `/loop`는 `--resume`으로 복원되지 **않고**, 복원되는 것은 `CronCreate`로 만든 고정 간격 루프뿐입니다. 이 문장은 모드 구분 없이 일반화되어 있습니다.
  - 제안: "(고정 간격 루프에 한해) `--resume`으로 복원됩니다. 동적 모드 루프는 `--resume`으로 복원되지 않으니 다시 `/loop`를 실행해야 합니다"처럼 예외를 명시.

### src/content/posts/claude/loop

- `ko.md`(175행) / `en.md`(175행): 위와 동일한 "`--resume`/`--continue`로 재개하면 만료 전 태스크가 복원된다"는 서술이 동적 모드 예외 없이 반복됩니다. 같은 수정 제안 적용.
- `ko.md`(194행): "오프셋은 잡 ID에서 결정되므로 **같은 잡은 항상 같은 만큼** 늦습니다." / `en.md`(194행): "The offset is derived from the job ID, so **the same job is always late by the same amount.**"
  - **문서와 다름.** 공식 문서(scheduled-tasks, Jitter 절)는 간격이 불균등한 스케줄의 경우 같은 잡이라도 발화 시각마다 지연 폭이 달라질 수 있다고 명시합니다: *"Unevenly spaced runs: a task with uneven gaps, such as one scheduled for `:00` and `:15` each hour, can run a different number of minutes late at each."* ("evenly spaced runs"만 매번 동일한 지연 폭을 가짐.)
  - 제안: "균등한 간격(예: 매시간)의 잡은 항상 같은 만큼 늦지만, 간격이 불균등하면 같은 잡이라도 발화 시각마다 지연 폭이 달라질 수 있다"로 수정.
  - 그 외 cron 변환 규칙, 최소 1분 반올림, 동적 모드 1분~1시간, 내장 유지보수 프롬프트 3단계, `loop.md` 경로·25,000바이트 제한, 정지 4가지 방법, `CLAUDE_CODE_DISABLE_CRON`, 세션당 50개 상한은 공식 문서와 대조해 일치함을 확인했습니다.

### src/content/posts/claude/routine

- `ko.md`(411·413행) / `en.md`(412·414행): "계정당 **일일 실행 횟수 상한**이 따로 있습니다... **1회성 실행(one-off)은 일일 상한에서 제외됩니다.**" / "there's a separate **daily cap on runs per account**... **One-off runs are exempt from the daily cap.**"
  - **문서와 다름** (두 가지 모두). 공식 문서(routines, Usage and limits 절, 리포트 작성 중 `https://code.claude.com/docs/en/routines`를 직접 재조회해 재확인):
    1. 상한은 "일일"이 아니라 **시간당(hourly)**입니다 — "each way of starting a run has an **hourly** limit", 표: "Scheduled runs, including one-off runs | **100 per hour**".
    2. one-off 실행은 상한에서 제외되지 **않고 똑같이 셉니다** — 같은 표에 "Scheduled runs, **including one-off runs** | 100 per hour", 바로 아래 "Schedule a one-off run" 절에도 "**One-off runs count against the same hourly limit** as other scheduled runs."
  - 제안: "일일" → "시간당(hourly, 계정당 100회)"로, "제외됩니다" → "똑같이 포함되어 셉니다"로 정정.
  - 그 외 cron 최소 간격 1시간, cron은 UTC 기준, 커넥터 기본 전체 포함, `/schedule` 관련 CLI 동작, 삭제는 웹에서만 가능 등은 공식 문서와 일치하거나, 명시돼 있지 않아 확인은 못 했지만 모순은 없었습니다. (예: "텔레메트리를 껐을 때 `/schedule`이 숨겨진다"는 서술은 문서의 Troubleshooting 목록에 없어 확인 불가 — 다만 부재가 오류의 근거는 아니므로 지적하지 않습니다.)

### src/content/posts/claude/worktree

- `ko.md`(330행) / `en.md`(330행): "막히는 건 **세 가지**입니다." / "**Three things** get blocked."
  - **문서와 다름.** 공식 문서(worktrees, "How Claude Code enforces isolation" 절)는 "Claude Code applies **four** checks:"라며 ① File edits, ② Command working directory, ③ Git redirects, ④ **Command shape**를 나열합니다. 이 글은 ①~③만 나열하고 네 번째("명령 형태" 검증 — 런타임에 명령어가 결정되거나 파싱 불가능하거나 `${!name}`/`${ command; }` 같은 확장식이 섞인 명령 차단)가 빠졌습니다.
  - 부수적으로 같은 문단의 "파일 편집 — `Edit`·`Write`" 서술도 문서 원문은 "`Edit`, `Write`, or **`NotebookEdit`**"으로 `NotebookEdit`까지 포함하는데 누락되어 있습니다.
  - 제안: "네 가지"로 고치고 네 번째 체크(명령 형태 검증)와 `NotebookEdit`을 추가.
- `ko.md`(404행) / `en.md`(404행): "**`-w`로 직접 만든 워크트리** — 청소는 여기엔 **절대** 손대지 않습니다." / "**Worktrees you created with `-w`** — the sweep **never** touches these."
  - **문서와 다름(조건부).** 공식 문서(worktrees, "Clean up subagent and background-session worktrees" 절)는 이 예외를 "The worktree belongs to a `--worktree` session **you haven't backgrounded**, whatever its age."로 한정하고, 바로 앞 문단에서 "When you background a `--worktree` session, its worktree **becomes a background-session worktree that the sweep can remove**."라고 명시합니다. 즉 `-w`로 만든 워크트리라도 세션을 백그라운드로 보내면 더 이상 절대적으로 보호되지 않습니다.
  - 제안: "절대"라는 단정을 빼고, 세션을 백그라운드로 보내면 정리 대상이 될 수 있다는 예외를 추가.
  - 그 외 `baseRef` fresh/head 정의, fresh 모드의 24시간 fetch 규칙, `.worktreeinclude` 문법, 같은 이름 재사용 시 리셋 조건 4가지, 서브에이전트 워크트리 자동 삭제 조건, PR 체크아웃 경로 규칙은 공식 문서와 대조해 일치함을 확인했습니다.

---

## posts/ai

### src/content/posts/ai/introduction-to-unet

- `en.md`(356행): "So UNet arrived introduced as "a network and training strategy that makes strong use of data augmentation"." — 동사가 두 개 겹친 비문입니다("arrived introduced"). `ko.md`(356행) 원문은 "그래서 UNet은 '...'이라는 소개와 함께 등장합니다"로, "So UNet arrived with the introduction: 'a network and training strategy...'" 또는 "UNet was introduced as..." 정도로 고치는 게 자연스럽습니다.

### 그 외 15편
accuracy-precision-recall-f1-auroc, experiment-X-Ray-transfer-learning, experiment-data-normalization-and-augmentation, experiment-x-ray-transfer-learning-result, limitation-of-linear-decision-boundary-and-MLP, logistic-regression, object-detection-metrics-iou-ap-map, optimizer-scheduler-amp, practical-statistics-for-data-scientists/{chi-square-distribution-and-test, data-distribution-and-correlation, data-types-location-and-variability-estimation, normal-and-t-distribution, sampling-distribution-and-bootstrap}, r-cnn, ssd-classification-head-replacement — **이상 없음**.

---

## pages/home
이상 없음

## posts/git/worktree
이상 없음

## posts/python
01-everything-is-an-object, 02-variables-are-name-tags, 03-the-inside-story-of-if — **이상 없음**.

## projects/relu-soft/west-side-barbell-club
01-about-conjugate, 02-raise-a-prob-and-sol — **이상 없음**.

---

**제외**: `src/content/pages/cv/` — 아직 다듬는 중인 draft 문서라 이번 점검에서 제외했습니다(파일을 읽지 않았고, 위 집계에도 포함하지 않았습니다).
