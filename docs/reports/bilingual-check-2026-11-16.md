# ko/en 이중언어 점검 리포트 — 2026-11-16

## 요약

`src/content/` 아래 **ko.md/en.md 짝 29개**를 전수 점검했습니다. (`src/content/pages/cv`는 아직 다듬는 중인 draft 문서라 이번 점검에서 제외.)

| 카테고리 | 글 수 | 번역 드리프트 | 표현 지적 | 사실점검(claude/*) |
| --- | --- | --- | --- | --- |
| pages (home) | 1 | 0 | 0 | 해당 없음 |
| posts/ai (13편) | 13 | 0 | 1건(경미, introduction-to-unet) | 해당 없음 |
| posts/claude (hook, intro-automation, loop, routine, worktree) | 5 | 0 | 0 | **8건** (확정 오류 6 + 범위 과잉일반화성 오류 2) |
| posts/git (worktree) | 1 | 0 | 0 | 해당 없음(Claude Code 고유 설정 서술 없음) |
| posts/python (01, 02, 03) | 3 | 0 | 0 | 해당 없음 |
| projects/relu-soft (01, 02) | 2 | 0 | 0 | 해당 없음 |
| **합계** | **25**(+cv 제외) | **0** | **1건** | **8건** |

- **번역 드리프트·미번역·오탈자**: 29개 글 전수에서 **발견 없음**. 섹션/표/코드블록/수식/이미지 참조가 ko/en 1:1로 대응했고, 코드블록 주석 미번역도 없었습니다. (참고: 지난 점검(`bilingual-check-2026-09-21.md`)에서 지적된 `limitation-of-linear-decision-boundary-and-MLP`의 en 코드블록 미번역은 이후 커밋(`27d8b35`)으로 이미 수정되어 반영돼 있음을 재확인했습니다.)
- **가장 비중 있는 발견**: `posts/claude/*` 4편(hook·intro-automation·loop·routine·worktree)에 실린 Claude Code 설정·동작 서술 중 **8건**을 공식 문서(`https://code.claude.com/docs/en/`)와 대조해 불일치를 확인했습니다. 특히 `routine` 글의 네트워크 레벨명(`Trusted`→`Limited`)과 레이트리밋(일일 상한→시간당 100회, 1회성 포함) 오류가 가장 비중이 큽니다.
- `hook` 글의 "훅 이벤트 33종"이라는 수치는 공식 문서를 직접 끝까지 세어 **정확함을 재확인**했습니다(지난 점검에서 지적된 뒤 커밋 `27d8b35`로 수정된 내용이 유지되고 있음).
- 표현(직역투·비문·오탈자) 지적은 `introduction-to-unet` en.md 1건뿐입니다.

---

## src/content/pages/home

이상 없음.

## src/content/posts/ai/accuracy-precision-recall-f1-auroc

이상 없음.

## src/content/posts/ai/experiment-X-Ray-transfer-learning

이상 없음.

## src/content/posts/ai/experiment-data-normalization-and-augmentation

이상 없음.

## src/content/posts/ai/experiment-x-ray-transfer-learning-result

이상 없음.

## src/content/posts/ai/introduction-to-unet

### 표현 — en.md 문장 어색함

- `src/content/posts/ai/introduction-to-unet/en.md:356`: "So UNet **arrived introduced** as "a network and training strategy that makes strong use of data augmentation"." — "arrived"와 "introduced"가 겹쳐 어색한 영어 문장입니다(해당 `ko.md` 원문: "그래서 UNet은 "데이터 증강을 강하게 활용하는 네트워크와 학습 전략"이라는 소개와 함께 등장합니다."). **제안**: "So UNet was introduced as..." 또는 "UNet made its appearance, introduced as..."로 다듬기. 번역 드리프트는 아니고 단순 표현 문제입니다.

## src/content/posts/ai/limitation-of-linear-decision-boundary-and-MLP

이상 없음. (지난 점검에서 지적됐던 en.md 코드블록 미번역은 이미 수정 완료된 상태를 재확인.)

## src/content/posts/ai/logistic-regression

이상 없음.

## src/content/posts/ai/object-detection-metrics-iou-ap-map

이상 없음.

## src/content/posts/ai/optimizer-scheduler-amp

이상 없음.

## src/content/posts/ai/r-cnn

이상 없음.

## src/content/posts/ai/ssd-classification-head-replacement

이상 없음.

## src/content/posts/ai/practical-statistics-for-data-scientists/chi-square-distribution-and-test

이상 없음.

## src/content/posts/ai/practical-statistics-for-data-scientists/data-distribution-and-correlation

이상 없음.

## src/content/posts/ai/practical-statistics-for-data-scientists/data-types-location-and-variability-estimation

이상 없음.

## src/content/posts/ai/practical-statistics-for-data-scientists/normal-and-t-distribution

이상 없음.

## src/content/posts/ai/practical-statistics-for-data-scientists/sampling-distribution-and-bootstrap

이상 없음.

## src/content/posts/ai/practical-statistics-for-data-scientists/statistical-experiments-and-significance-testing

이상 없음.

## src/content/posts/claude/hook

번역 드리프트·표현: 이상 없음.

**사실점검**

- ✅ **확인됨(정확함)**: "훅 이벤트 33종"(`ko.md:187-191`, en.md 동일) — 공식 [훅 레퍼런스](https://code.claude.com/docs/en/hooks)에 나열된 이벤트를 전부 세면 `SessionStart, Setup, UserPromptSubmit, UserPromptExpansion, PreToolUse, PermissionRequest, PermissionDenied, PostToolUse, PostToolUseFailure, PostToolBatch, Notification, MessageDisplay, SubagentStart, SubagentStop, TaskCreated, TaskCompleted, Stop, StopFailure, TeammateIdle, InstructionsLoaded, ConfigChange, CwdChanged, DirectoryAdded, FileChanged, WorktreeCreate, WorktreeRemove, PreCompact, PostCompact, PreModelSwitch, PostModelSwitch, Elicitation, ElicitationResult, SessionEnd` = **정확히 33개**. 수치가 맞습니다.
- ⚠️ **확인됨(오류)**: `ko.md:250` "stdout이 Claude에게 보이는 이벤트는 **셋뿐입니다** — `UserPromptSubmit`, `UserPromptExpansion`, `SessionStart`." / `en.md:249` "**Only three events** have their stdout shown to Claude — `UserPromptSubmit`, `UserPromptExpansion` and `SessionStart`." — 공식 문서는 종료코드 0일 때 평문 stdout이 컨텍스트로 들어가는 이벤트를 **넷**으로 명시합니다: 위 세 개 + **`PostModelSwitch`**. **제안**: "셋뿐" → "넷"으로 교정하고 `PostModelSwitch` 추가.

## src/content/posts/claude/intro-automation-hook-loop-routine

번역 드리프트·표현: 이상 없음.

**사실점검**

- ⚠️ **확인됨(오류)**: `ko.md:101` "다음 반복 전에 `Esc`로 중단할 수 있고, **만료되지 않은 작업은 `--resume`으로 복원됩니다.**" / `en.md:101` "You can stop it with `Esc` before the next iteration, and **restore an unexpired task with `--resume`.**" — 바로 위에서 고정 인터벌·동적 두 모드를 함께 소개한 뒤 이어지는 문장이라 두 모드 모두 복원되는 것처럼 읽힙니다. 공식 문서([Run prompts on a schedule](https://code.claude.com/docs/en/scheduled-tasks) Limitations 절)는 "A self-paced `/loop` isn't restored, so run `/loop` again to restart it."라고 명시합니다 — **동적(self-paced) 루프는 `--resume`으로 복원되지 않습니다.** **제안**: 고정 인터벌(`CronCreate`) 루프만 복원 대상임을 명시.

## src/content/posts/claude/loop

번역 드리프트·표현: 이상 없음.

**사실점검**

- ⚠️ **확인됨(오류)**: `ko.md:227`(한 문장 요약) "루프는 **세션 안에서만** 살고 **7일**이면 만료됩니다. 멈추려면 `Esc`·`CronDelete`, **복원은 `--resume`**." / `en.md:227` 동일(영문). `ko.md:175`/`en.md:175`도 모드 구분 없이 "만료 전 태스크가 복원된다"고 서술합니다. 위 `intro-automation-hook-loop-routine`과 같은 사유로, 공식 문서는 **동적 루프는 `--resume`으로 복원되지 않는다**고 명시합니다. **제안**: 요약·복원 설명에 "고정 인터벌 루프만 해당" 단서 추가.
- ℹ️ **부분적으로만 확인됨(단정은 과함, 오류로 분류하지 않음)**: `ko.md:194` "오프셋은 **잡 ID에서 결정되므로** **같은 잡은 항상 같은 만큼** 늦습니다." / `en.md:194` "The offset is **derived from the job ID**, so **the same job is always late by the same amount.**" — 공식 문서([지터 절](https://code.claude.com/docs/en/scheduled-tasks#jitter))는 "같은 만큼 늦다"는 결론을 **간격이 균등한 작업**에 대해서만 보장하고, **불균등 간격** 작업은 매번 지연 정도가 달라질 수 있다고 명시합니다. `/loop`가 만드는 고정 인터벌 작업은 항상 균등 간격이라 이 글의 결론 자체는 실질적으로 맞지만, "오프셋이 잡 ID로 결정된다"는 원인 설명은 공식 문서에서 **직접 확인되지 않습니다**(문서는 간격의 균등/불균등으로만 설명). 오류로 단정하지 않되, "균등 간격 작업에 한정된 설명"임을 밝히면 더 정확해집니다.

## src/content/posts/claude/routine

번역 드리프트·표현: 이상 없음.

**사실점검**

- ⚠️ **확인됨(오류)**: `ko.md:302,307` "클라우드 환경은 기본이 **Trusted**인데... | **Trusted** (기본) | 기본 허용목록만 — 패키지 레지스트리 · GitHub · 클라우드 SDK |" / `en.md:303,308` 동일(영문 "Trusted"). 공식 문서([Automate work with scheduled tasks](https://code.claude.com/docs/en/routines), [Cloud environments](https://code.claude.com/docs/en/cloud-environments))는 이 네트워크 접근 레벨명을 **"Limited"**로 명시합니다("A **Default** environment is provided with **Limited** network access..."). "Trusted"라는 레벨명은 공식 문서에서 확인되지 않습니다. **제안**: "Trusted" → "Limited"로 교정.
- ⚠️ **확인됨(오류)**: `ko.md:82` "CLI `/schedule`로는 예약(cron) 트리거만 만들 수 있습니다. **API 트리거와 GitHub 트리거는 웹 UI에서 붙여야 합니다.**" / `en.md:82` "`/schedule` only creates schedule triggers. **API and GitHub triggers have to be attached from the web UI**..." — 공식 문서는 GitHub 트리거를 **CLI에서도** 붙일 수 있다고 명시합니다: "From the CLI, install the app from the GitHub App page first, then ask Claude to attach a GitHub trigger to an existing scheduled task... The CLI path requires Claude Code v2.1.225 or later." **제안**: GitHub 트리거 부분을 "웹 UI에서만"이 아니라 "CLI에서도 가능(앱 설치 선행 + v2.1.225 이상 필요)"으로 교정. (API 트리거가 웹 UI 전용이라는 서술과 토큰 발급·폐기가 CLI로 안 된다는 서술은 반증을 찾지 못해 확인 불가로 남겨둡니다.)
- ⚠️ **확인됨(오류, 단위·예외 둘 다)**: `ko.md:411,413` "계정당 **일일** 실행 횟수 상한이 따로 있습니다... **1회성 실행(one-off)은 일일 상한에서 제외됩니다.**" / `en.md:412,414` "a **separate daily cap** on runs per account... **One-off runs are exempt from the daily cap.**" — 공식 문서([routines.md](https://code.claude.com/docs/en/routines))의 레이트리밋 표는 "Scheduled runs, including one-off runs | **100 per hour** | Your account | The run waits until the limit resets"라고 명시합니다. 단위는 **일일이 아니라 시간당(100회/시간)**이고, 1회성 실행은 **제외가 아니라 포함**됩니다. **제안**: "일일 상한" → "시간당 100회 상한", "1회성 실행 제외" → "1회성 실행도 포함"으로 교정.
- ✅ **확인됨(정확함)**: `ko.md:425-427` "삭제는 웹에서만 됩니다 — CLI로는 목록·수정·즉시 실행까지만 됩니다." — 공식 문서는 CLI 명령으로 `/schedule list`·`/schedule update`·`/schedule run`만 제시하고, 삭제는 웹 UI 메뉴의 **Delete**로만 설명합니다. 정확합니다.
- **확인 불가(오류 아님 — 이번 조사에서 공식 문서상 근거를 찾지 못함, 부재가 오류의 증거는 아님)**: `clear_mcp_connections` 필드(`ko.md:349`), `claude/` 외 브랜치로 push할 때의 거부 조건 3가지 목록 — 보호 브랜치·타인이 연 PR·타인이 작성한 커밋(`ko.md:397-401`).

## src/content/posts/claude/worktree

번역 드리프트·표현: 이상 없음.

**사실점검**

- ⚠️ **확인됨(오류, 개수)**: `ko.md:330-334` "막히는 건 **세 가지**입니다 — 파일 편집 / 명령의 작업 디렉터리 / git 우회." / `en.md:330-334` "**Three things** get blocked — file edits / a command's working directory / git bypass." — 공식 문서([Run parallel sessions with worktrees](https://code.claude.com/docs/en/worktrees#how-claude-code-enforces-isolation))는 "Claude Code applies **four** checks"라고 명시하며 다음을 나열합니다: ① File edits ② Command working directory ③ Git redirects ④ **Command shape**(명령 텍스트만으로 그 명령이 실행할 git이 워크트리 안에 머무는지 검증 못 할 때 차단 — 명령 이름이 런타임에 계산되거나 구문을 못 파싱하거나 `${!name}`/`${ command; }` 확장이 있을 때). 글은 ①~③만 다루고 **④ Command shape 검사가 빠져 있습니다**. **제안**: "세 가지" → "네 가지"로 교정, 네 번째 항목(Command shape) 추가.
- ⚠️ **확인됨(과잉 일반화)**: `ko.md:549` "**워크트리 안에서 `claude --resume` 하지 마세요.** 재개는 **메인 체크아웃에서** 실행해야 합니다." / `en.md:549` "**Don't run `claude --resume` from inside a worktree.** Resume from **the main checkout**." — 공식 문서([Resume a worktree session](https://code.claude.com/docs/en/worktrees#resume-a-worktree-session))는 이 제약이 모든 워크트리에 적용되지 않는다고 명시합니다: "Claude Code re-enters a worktree it created with git under `.claude/worktrees/` **even when you launch from inside it**." 즉 `--worktree`/`EnterWorktree`로 만들어진(`.claude/worktrees/` 밑) 워크트리는 **안에서 resume해도 정상 복귀**합니다. 제약이 적용되는 건 `git worktree add`로 **직접 만든** 워크트리뿐입니다. **제안**: "워크트리 안에서는 무조건 금지"가 아니라 "직접 만든(= `-w`가 아닌) 워크트리에서만 메인에서 재개"로 범위를 좁히는 수정.

## src/content/posts/git/worktree

이상 없음. Claude Code 고유 설정(훅·슬래시 커맨드·settings.json 등)에 대한 서술이 없고, git 자체 개념(워크트리·브랜치·원격 추적)만 다루며 내용이 정확합니다.

## src/content/posts/python/01-everything-is-an-object

이상 없음.

## src/content/posts/python/02-variables-are-name-tags

이상 없음.

## src/content/posts/python/03-the-inside-story-of-if

이상 없음.

## src/content/projects/relu-soft/west-side-barbell-club/01-about-conjugate

이상 없음.

## src/content/projects/relu-soft/west-side-barbell-club/02-raise-a-prob-and-sol

이상 없음.

---

## 제외 사항

- `src/content/pages/cv`는 요청에 따라 점검 대상에서 **제외**했습니다(draft 상태로 계속 다듬는 중인 문서).
</content>
