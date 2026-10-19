# ko/en 이중언어 점검 리포트 — 2026-10-19

## 요약

- **점검한 글**: 27편 (`src/content/` 아래 `ko.md`/`en.md` 짝. `src/content/pages/cv/`는 지시에 따라 제외)
  - `posts/ai/`: 15편
  - `posts/claude/`: 5편
  - `posts/git/`: 1편
  - `posts/python/`: 3편
  - `projects/relu-soft/west-side-barbell-club/`: 2편
  - `pages/home/`: 1편
- **발견 항목 수** (카테고리별)
  - `posts/ai/`: 1건 (경미, 참고자료 링크 표기 차이)
  - `posts/claude/`: 번역 drift/표현 0건, **Claude Code 사실 점검 오류 6건** (공식 문서 대조로 확인됨)
  - `posts/git/`, `posts/python/`, `projects/`, `pages/home/`: 0건 (전부 이상 없음)
- cv는 draft 상태라 이번 점검에서 제외했습니다 (아래 '제외' 참고).

모든 사실 점검 오류는 https://code.claude.com/docs/en/ 의 해당 페이지를 직접 WebFetch로 조회해 재확인했습니다 (확인된 것 / 확인 불가를 구분).

---

## posts/ai/

### accuracy-precision-recall-f1-auroc
이상 없음

### experiment-X-Ray-transfer-learning
이상 없음

### experiment-data-normalization-and-augmentation
이상 없음. (참고: 코드블록 내 `print()` 문자열·docstring 일부가 번역되어 있으나 — 예: `"확인한 후보 수:"` → `"Candidates checked:"` — 코드 자체의 동작·의미는 동일하므로 drift로 보지 않음)

### experiment-x-ray-transfer-learning-result
이상 없음. (참고: assert 메시지·print 문자열 일부 번역 — `"train/val에 같은 그룹이 섞였습니다"` → `"same group found in both train and val"` 등 — 저자 자신이 작성한 출력 문자열이라 git log 같은 "실제 명령어 출력"이 아니며 의미 손실 없이 번역됨)

### introduction-to-unet
이상 없음

### limitation-of-linear-decision-boundary-and-MLP
이상 없음

### logistic-regression
이상 없음

### object-detection-metrics-iou-ap-map
이상 없음

### optimizer-scheduler-amp
이상 없음

### practical-statistics-for-data-scientists/data-distribution-and-correlation
이상 없음

### practical-statistics-for-data-scientists/data-types-location-and-variability-estimation
**발견**: 참고자료 링크 표기 차이.
- `ko.md:163`: `[IQR 방식을 이용한 이상치 데이터(Outlier) 제거](https://hwi-doc.tistory.com/...)`
- `en.md:156`: `[Removing Outlier Data Using the IQR Method (Korean)](https://hwi-doc.tistory.com/...)`

en.md에만 "(Korean)" 표기가 추가되어 ko.md와 1:1로 대응하지 않습니다. 영어 독자에게 링크가 한국어 글임을 알려주는 유용한 추가라 의미상 틀린 건 아니지만, 엄밀히는 ko에 없는 내용이 en에 추가된 사례입니다.
**제안**: 그대로 두어도 무방하나, 엄격히 맞추려면 ko.md에도 "(한국어)" 같은 표기를 대칭으로 추가할 수 있습니다. (선택사항)

### practical-statistics-for-data-scientists/normal-and-t-distribution
이상 없음

### practical-statistics-for-data-scientists/sampling-distribution-and-bootstrap
이상 없음

### r-cnn
이상 없음

### ssd-classification-head-replacement
이상 없음

---

## posts/claude/

5편 모두 ko.md/en.md 구조(헤딩 개수·순서·계층, 코드블록, 이미지 참조, 터미널 출력)가 정확히 1:1로 대응하고, 미번역 한국어나 어색한 번역도 발견되지 않았습니다 — **번역 drift/표현: 이상 없음**.

다만 이 5편은 Claude Code의 훅 이벤트·설정 키·사용량 한도 등 구체적 기술 서술을 다루고 있어, https://code.claude.com/docs/en/ 공식 문서와 대조해 **사실 점검**을 진행했고, 아래 6건의 오류를 확인했습니다.

### hook

**사실 점검 — 오류 (확인됨)**

- `ko.md:250`: `> 💡 **stdout이 Claude에게 보이는 이벤트는 셋뿐입니다** — \`UserPromptSubmit\`, \`UserPromptExpansion\`, \`SessionStart\`.`
- `en.md:250`: `> 💡 **Only three events have their stdout shown to Claude** — \`UserPromptSubmit\`, \`UserPromptExpansion\` and \`SessionStart\`.`

[공식 문서(hooks, Exit code 0 섹션)](https://code.claude.com/docs/en/hooks)를 직접 확인한 결과: "The exceptions are `UserPromptSubmit`, `UserPromptExpansion`, `SessionStart`, and `PostModelSwitch`, where Claude Code adds plain-text stdout as context that Claude can see and act on." — **넷**이며 `PostModelSwitch`가 빠졌습니다.

**제안**: "셋뿐입니다"를 "넷뿐입니다"로, 목록에 `PostModelSwitch` 추가. (ko/en 둘 다)

**사실 점검 — 참고사항(확인 불가)**: 없음. "훅 이벤트 33종" 목록은 공식 문서의 lifecycle 표와 하나씩 대조해 전부 일치함을 확인했습니다(도구 계열 6 + 프롬프트·표시 3 + 세션 수명 8 + 턴 종료·알림 3 + 서브에이전트·태스크 5 + 컨텍스트·워크트리·모델·MCP 8 = 33). 타임아웃 기본값, `disableAllHooks`, 환경변수 목록(`CLAUDE_PROJECT_DIR` 등)도 공식 문서와 일치.

### intro-automation-hook-loop-routine

**사실 점검 — 오류 (확인됨)**

- `ko.md:101`: "다음 반복 전에 **`Esc`** 로 중단할 수 있고, 만료되지 않은 작업은 **`--resume`** 으로 복원됩니다"
- `en.md:101`: "You can stop it with **`Esc`**... and restore an unexpired task with **`--resume`**"

[공식 문서(scheduled-tasks)](https://code.claude.com/docs/en/scheduled-tasks)에 따르면 `Esc`는 **동적(self-paced) `/loop`에만** 적용되고("To stop a self-paced /loop while it is waiting for the next iteration, press Esc"), `--resume` 복원은 **고정 간격(CronCreate) 루프에만** 적용됩니다("A self-paced /loop isn't restored, so run /loop again to restart it"). 이 개요 글은 모드 구분 없이 둘 다를 "루프" 일반에 적용되는 것처럼 적어 오해를 줄 수 있습니다. (참고로 같은 시리즈의 `/posts/claude/loop` 글은 이 구분을 정확히 적어두었습니다.)

**제안**: "동적 모드는 Esc로 중단, 고정 간격 모드는 --resume으로 복원(동적 모드는 재실행 필요)"처럼 모드별로 구분해서 서술.

**사실 점검 — 참고사항(확인 불가)**: 없음. "routine은 research preview 단계"라는 서술은 공식 문서 "Routines are in research preview. Behavior, limits, and the API surface may change."와 정확히 일치. 트리거 3종(예약/API/GitHub)과 "한 routine이 셋을 함께 쓸 수 있다"는 서술도 확인됨.

### loop

**사실 점검 — 오류**: 없음. 7일 만료, 최소 간격 1분, 동적 모드 1분~1시간, `Esc`는 동적 모드에만/`CronDelete`는 고정 간격에만, `--resume`은 고정 간격만 복원, 지터 최대 30분(1시간 미만 간격은 그 절반), 세션당 최대 50개 태스크, `CLAUDE_CODE_DISABLE_CRON` 모두 공식 문서와 정확히 일치 확인됨.

**사실 점검 — 참고사항(확인 불가)**: "오프셋은 잡 ID에서 결정되므로 같은 잡은 항상 같은 만큼 늦습니다"(지터의 구체적 산출 메커니즘)와 `Nm→*/N * * * *` 류 cron 변환 공식의 정확한 표 형태는 공식 문서에서 직접 확인되지 않았습니다. 틀렸다는 뜻이 아니라 문서에 이 수준의 구현 세부사항이 없다는 뜻입니다.

### routine

**사실 점검 — 오류 (확인됨)**

1. `ko.md:82` / `en.md:82`: "**API 트리거와 GitHub 트리거는 웹 UI에서 붙여야 합니다.**" / "**API and GitHub triggers have to be attached from the web UI.**"

   [공식 문서(routines)](https://code.claude.com/docs/en/routines)는 GitHub 트리거는 CLI로도 추가 가능하다고 명시합니다: "You can add a GitHub trigger from the web or from the CLI... The CLI path requires Claude Code v2.1.225 or later." API 트리거만 웹 전용이고, GitHub 트리거는 웹/CLI 둘 다 가능합니다.

   **제안**: "API 트리거는 웹 UI에서만, GitHub 트리거는 웹 또는 CLI(Claude Code v2.1.225 이상)에서 붙일 수 있습니다"로 정정.

2. `ko.md:409-413` / `en.md:410-414`: "routine 실행도 ... **계정당 일일 실행 횟수 상한**이 따로 있습니다 ... **1회성 실행(one-off)은 일일 상한에서 제외됩니다.**" / "there's a **separate daily cap on runs per account** ... **One-off runs are exempt from the daily cap.**"

   공식 문서의 사용량 한도 표는 **시간당(hourly)** 단위이고, one-off 실행은 오히려 **포함**됩니다: "Scheduled runs, **including one-off runs** | 100 per hour | Your account". "일일"이 아니라 "시간당 100회"이며, one-off는 "제외"가 아니라 "포함"입니다.

   **제안**: "계정당 일일 실행 횟수 상한"을 "계정당 시간당 100회 실행 상한(예약 실행 기준, 1회성 실행 포함)"으로, "1회성 실행은 제외됩니다"를 "1회성 실행도 똑같이 포함됩니다"로 정정.

**사실 점검 — 참고사항(확인 불가)**: `/schedule`이 "Unknown command"로 뜨는 원인 중 "텔레메트리를 껐을 때" 서술은 routines 페이지의 troubleshooting 섹션에서 직접 확인되지 않았습니다(다른 페이지 내용일 가능성 — 틀렸다는 뜻은 아닙니다). 네트워크 접근 레벨 "None" 등급, `mcp_connections`/`clear_mcp_connections`/`job_config.ccr` 같은 API 레벨 JSON 필드, 8분17초 오프셋 등 저자가 직접 실험으로 확인했다고 밝힌 세부 수치들은 공식 문서로는 확인 불가(저자의 실측 기록이므로 오류로 볼 근거 없음).

### worktree

**사실 점검 — 오류 (확인됨)**

1. `ko.md:329` / `en.md:329`: "막히는 건 **세 가지**입니다 — 파일 편집, 명령의 작업 디렉터리, git 우회" / "**Three** things get blocked — File edits, A command's working directory, git redirects"

   [공식 문서(worktrees)](https://code.claude.com/docs/en/worktrees)는 "Claude Code applies **four** checks"라며 File edits · Command working directory · Git redirects **· Command shape**(명령어 텍스트만으로 그 안의 git이 워크트리 밖으로 안 나가는지 확인할 수 없을 때 차단 — 예: 명령어 이름이 런타임에 계산되거나, 문법을 못 파싱하거나, `${!name}` 같은 확장이 있을 때)를 꼽습니다. 네 번째 체크가 빠졌습니다.

   **제안**: "세 가지"를 "네 가지"로 정정하고, 네 번째 항목("Command shape" — 명령 텍스트에서 git의 워크트리 이탈 여부를 확인할 수 없을 때도 차단)을 목록에 추가.

2. `ko.md:549` / `en.md:549`: "**워크트리 안에서 `claude --resume` 하지 마세요.** 재개는 **메인 체크아웃에서** 실행해야 합니다." / "**Don't run `claude --resume` from inside a worktree.** Resume from **the main checkout**."

   공식 문서는 반대로 설명합니다: "Claude Code re-enters a worktree it created with git under `.claude/worktrees/` **even when you launch from inside it**." 즉 이 글 전체가 다루는 `-w`(= `.claude/worktrees/` 아래)로 만든 워크트리는 **그 안에서 `--resume`해도 정상 동작**합니다. 안에서 재개가 안 되는 경우는 `git worktree add`로 **직접 만든** 워크트리의 하위 디렉터리에서 실행할 때뿐입니다.

   **제안**: 이 함정 항목은 `-w`로 만든 워크트리 기준으로는 정반대이므로 삭제하거나, "직접 `git worktree add`로 만든 워크트리에서는 안에서 재개가 거부된다"로 범위를 좁혀 정정 필요.

**사실 점검 — 참고사항(확인 불가)**: 없음 — 이 글의 다른 구체적 서술(기본 경로 `.claude/worktrees/<name>/`, 브랜치명 `worktree-<name>`, `baseRef` "fresh"/"head" 의미와 기본값, 24시간·5초 fetch 캡, `.worktreeinclude` 문법, 같은 이름 재호출 시 리셋 조건, 정리 규칙, `-p` 미정리, `cleanupPeriodDays`가 `-w` 워크트리를 건드리지 않는다는 것, `#1234`/PR URL 처리, workspace trust, 심볼릭 링크 거부)는 모두 공식 문서와 대조해 정확히 일치함을 확인했습니다.

---

## posts/git/

### worktree
이상 없음. (참고: 본문의 git 커맨드 출력 예시 — 브랜치명·커밋 메시지에 쓰인 한국어 — 는 저자의 실습 기록이라 지적 대상이 아님)

---

## posts/python/

### 01-everything-is-an-object
이상 없음

### 02-variables-are-name-tags
이상 없음

### 03-the-inside-story-of-if
이상 없음

---

## projects/relu-soft/west-side-barbell-club/

### 01-about-conjugate
이상 없음

### 02-raise-a-prob-and-sol
이상 없음

---

## pages/home/

이상 없음

---

## 제외

`src/content/pages/cv/`는 지시에 따라 이번 점검에서 제외했습니다 (draft 상태, 아직 다듬는 중).

---

## Discord 알림

`DISCORD_WEBHOOK_URL`이 설정되어 있어 요약을 Discord로 전송했습니다.
