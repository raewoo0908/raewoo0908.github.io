# ko/en 이중언어 점검 리포트 — 2026-11-02

`src/content/` 아래 ko.md/en.md(ko.mdx/en.mdx 포함) 짝 **29쌍**을 전수 점검했습니다(`src/content/pages/cv/`는 지시에 따라 제외 — 사유는 맨 아래 참고).

세 그룹으로 나눠 점검했습니다: ① `posts/ai/*` 16쌍, ② `posts/claude/*` 5쌍(Claude Code 공식 문서 대조 포함), ③ 그 외(`pages/home`, `posts/git/worktree`, `posts/python/*`, `projects/*`, `experiences/*`) 8쌍.

## 요약

| 그룹 | 점검 글 수 | 구조적 drift | 표현 품질 지적 | Claude Code 사실 오류(문서와 상충) | 참고(수정 불요) |
| --- | --- | --- | --- | --- | --- |
| posts/ai | 16 | 0 | 1 | - | - |
| posts/claude | 5 | 0 | 0 | **8건** | 4건 |
| 기타(home/git/python/projects/experiences) | 8 | 0 | 2(사소) | 0 | - |
| **합계** | **29** | **0** | **3** | **8** | **4** |

가장 중요한 부분은 **posts/claude/* 의 8건**입니다 — 번역 drift는 전혀 없지만(ko/en 모두 원문 자체가 같은 사실 오류를 공유), 공식 문서([code.claude.com/docs/en](https://code.claude.com/docs/en/))와 대조해 실제로 상충하는 서술을 찾았습니다. 아래 각 건마다 **직접 재검증한 문서 원문**을 인용했습니다(서브에이전트 보고를 그대로 베끼지 않고, 카운팅 주장은 전부 제가 다시 문서를 받아 목록을 세었습니다).

---

## posts/ai/* (16쌍)

### src/content/posts/ai/accuracy-precision-recall-f1-auroc/
이상 없음

### src/content/posts/ai/experiment-X-Ray-transfer-learning/
이상 없음

### src/content/posts/ai/experiment-data-normalization-and-augmentation/
이상 없음

### src/content/posts/ai/experiment-x-ray-transfer-learning-result/
이상 없음

### src/content/posts/ai/introduction-to-unet/
**en.md — 표현 품질(비문)**

> `So UNet arrived introduced as "a network and training strategy that makes strong use of data augmentation".`

"arrived"와 "was introduced"가 한 문장에 겹쳐 쓰여 있습니다(ko.md 원문: "그래서 UNet은 … 소개와 함께 등장합니다").

**제안**: `So UNet was introduced as "a network and training strategy that makes strong use of data augmentation."`

### src/content/posts/ai/limitation-of-linear-decision-boundary-and-MLP/
이상 없음

### src/content/posts/ai/logistic-regression/
이상 없음

### src/content/posts/ai/object-detection-metrics-iou-ap-map/
이상 없음

### src/content/posts/ai/optimizer-scheduler-amp/
이상 없음

### src/content/posts/ai/r-cnn/
이상 없음

### src/content/posts/ai/ssd-classification-head-replacement/
이상 없음

### src/content/posts/ai/practical-statistics-for-data-scientists/chi-square-distribution-and-test/
이상 없음

### src/content/posts/ai/practical-statistics-for-data-scientists/data-distribution-and-correlation/
이상 없음

### src/content/posts/ai/practical-statistics-for-data-scientists/data-types-location-and-variability-estimation/
이상 없음 (ko.md 165줄 vs en.md 157줄로 줄 수는 다르지만, 헤딩 10개가 양쪽 모두 같은 순서·깊이로 대응 — 표 셀 줄바꿈 등 포맷 차이일 뿐 내용 누락 없음)

### src/content/posts/ai/practical-statistics-for-data-scientists/normal-and-t-distribution/
이상 없음

### src/content/posts/ai/practical-statistics-for-data-scientists/sampling-distribution-and-bootstrap/
이상 없음

---

## posts/claude/* (5쌍) — Claude Code 공식 문서 대조

이 5개 글은 Claude Code의 훅·`/loop`·routine·worktree를 직접 설명하는 글입니다. ko/en 번역 자체(구조·표현)는 **5개 모두 이상 없음** — drift·오역 없음. 아래는 **사실 점검** 결과만 다룹니다.

### src/content/posts/claude/hook/

**🔴 상충 — "stdout이 Claude에게 보이는 이벤트는 셋뿐"**

> ko.md 250행: `> 💡 **stdout이 Claude에게 보이는 이벤트는 셋뿐입니다** — UserPromptSubmit, UserPromptExpansion, SessionStart.`

공식 문서([hooks](https://code.claude.com/docs/en/hooks)) 원문(제가 직접 WebFetch로 재확인):

> "For most events, Claude Code writes stdout to the debug log and doesn't show it in the transcript. The exceptions are `UserPromptSubmit`, `UserPromptExpansion`, `SessionStart`, **and `PostModelSwitch`**, where Claude Code adds plain-text stdout as context that Claude can see and act on."

**실제로는 4개**이고 `PostModelSwitch`가 빠졌습니다. ko.md·en.md 둘 다 똑같이 "셋"이라고 적어 원문 자체의 사실 오류이며(drift는 아님), 양쪽 다 고쳐야 합니다.

**제안**: "셋뿐" → "넷뿐(UserPromptSubmit·UserPromptExpansion·SessionStart·PostModelSwitch)"으로 ko.md/en.md 동시 수정.

**참고(수정 불요, 문서에서 확인 불가)**: matcher 규칙에서 `FileChanged`·`StopFailure`가 `,`/`|` 외 글자·숫자·`_`만 허용하는 예외가 있다는 세부는 글에 없음 — 없어도 틀린 건 아니라 수정 불요.

### src/content/posts/claude/intro-automation-hook-loop-routine/

**🔴 상충 — `/loop`의 Esc·`--resume` 설명이 모드 구분 없이 뭉뚱그려짐**

> ko.md 101행: `다음 반복 전에 **Esc** 로 중단할 수 있고, 만료되지 않은 작업은 **--resume** 으로 복원됩니다.`

공식 문서([scheduled-tasks](https://code.claude.com/docs/en/scheduled-tasks)) 원문(제가 직접 재확인):

> "**Self-paced loop**: while the loop is waiting for its next iteration, press `Esc` to stop it... **Fixed-interval loop**: to stop a loop such as `/loop 5m`, ask Claude to cancel it... `Esc` and `Ctrl+C` don't stop it."
> "...Claude Code restores the tasks scheduled with `CronCreate`, except recurring tasks that have expired and one-shot tasks whose scheduled time has passed. **A self-paced `/loop` isn't restored**, so run `/loop` again to restart it."

즉 **Esc는 동적(self-paced) 모드에서만** 멈추고(고정 간격은 Claude에게 취소를 요청해야 함), **`--resume` 복원도 고정 간격(CronCreate) 모드에만** 적용되며 동적 `/loop`는 복원되지 않습니다. 글은 이 둘을 구분 없이 "Esc로 중단·`--resume`으로 복원"이라고 뭉뚱그려 썼습니다(참고로 같은 블로그의 `posts/claude/loop/` 글은 이 구분을 정확히 설명하고 있어 대조적입니다).

**제안**: ko.md/en.md 동시에 "Esc는 동적(self-paced) 모드에서만 멈추고, 고정 간격 루프는 Claude에게 취소를 요청해야 한다. `--resume` 복원도 고정 간격 모드에만 적용된다"로 구체화.

### src/content/posts/claude/loop/

이상 없음. 가장 꼼꼼하게 문서를 반영한 글입니다 — 최소 간격(동적 1분~1시간), `CronCreate`/`CronList`/`CronDelete`, 8자리 ID, 세션당 최대 50개, `.claude/loop.md` 우선순위, 25,000바이트 초과시 잘림, 지터 규칙, `CLAUDE_CODE_DISABLE_CRON=1`, Esc/`--resume`의 모드별 구분까지 전부 공식 문서와 일치함을 확인했습니다.

### src/content/posts/claude/routine/

**🔴 상충 — "클라우드 세션에는 승인 창이 전혀 없습니다"**

> ko.md 58행: `클라우드 세션에는 **승인 창이 없습니다.** 권한 모드 선택지도 없고, 실행 중에 "이 명령 실행할까요?"라고 묻지도 않습니다. 자율적으로 끝까지 갑니다.`

공식 문서([routines](https://code.claude.com/docs/en/routines)) 원문(제가 직접 재확인):

> "When a run starts a new session on Anthropic's cloud, that session begins in auto mode... **A run still stops and waits for an answer** in cases such as these: **Actions that prompt even in auto mode**... **Repeated blocks**: once blocks reach auto mode's repeated-block thresholds, **a permission prompt appears in the run's session and waits until someone answers it**."

기본적으로 승인 없이 자율 실행되는 건 맞지만, ask 규칙에 걸리거나 같은 차단이 반복되면 **실제로 멈춰서 승인을 기다립니다.** "승인 창이 없다/묻지 않는다/끝까지 간다"는 단정은 문서와 상충합니다.

**제안**: "기본적으로 승인 없이 자율 실행되지만, ask 규칙에 걸리거나 같은 차단이 반복되면 세션이 멈춰 승인을 기다립니다"로 완화. (ko.md 58행·456~459행 요약부 둘 다 같은 표현을 쓰고 있어 함께 수정 필요)

**🔴 상충 — "계정당 일일 실행 횟수 상한, 1회성 실행은 상한에서 제외"**

> ko.md 411·413행: `계정당 **일일 실행 횟수 상한**이 따로 있습니다. … 💡 **1회성 실행(one-off)은 일일 상한에서 제외됩니다.**`

공식 문서([routines](https://code.claude.com/docs/en/routines), Usage and limits 표, 제가 직접 재확인):

> `| Scheduled runs, including one-off runs | 100 per hour | Your account | The run waits until the limit resets |`

상한은 **일일이 아니라 시간당(hourly) 100회**이고, 1회성 실행은 **제외되는 게 아니라 이 100/시간 한도에 포함**됩니다. 글의 주장이 두 가지 모두 정반대입니다. (429 상태 코드 자체는 문서에 명시돼 있지 않음 — "문서에서 확인 불가"일 뿐 오류의 근거는 아니라 따로 지적하지 않습니다.)

**제안**: "일일 상한, one-off 제외" → "시간당 100회 상한(예약 실행 기준, one-off 포함)"으로 정정.

**🟡 상충 의심 — "다른 브랜치로 push 시 Claude Code가 보호 브랜치·타인 PR·타인 커밋을 검사해 거부"**

> ko.md 397~401행: `claude/로 시작하는 브랜치로 가는 push는 언제나 받아들여집니다. 프롬프트에서 다른 브랜치로 push하라고 시키면 그때는 Claude Code가 push를 먼저 검사해서, 아래 중 하나라도 걸리면 거부합니다. — GitHub에서 보호된 브랜치일 때 / 그 브랜치로 다른 사람이 연 PR이 있을 때 / 그 브랜치에 나 아닌 사람이 작성한 커밋이 실려 있을 때`

공식 문서([cloud-environments](https://code.claude.com/docs/en/cloud-environments), GitHub proxy 절, 제가 직접 재확인)에서 찾을 수 있는 유일한 관련 서술은 반대 방향입니다:

> "**Push restrictions**: the proxy rejects branch deletions and pushes of anything other than a branch... **It doesn't limit which branches a push can update. To do that, use branch protection rules or rulesets on GitHub.**"

즉 문서상 GitHub 프록시는 "어느 브랜치로 push할 수 있는지"는 제한하지 않고, 그건 GitHub의 브랜치 보호 규칙의 몫이라고 명시합니다. 글이 설명하는 "보호 브랜치/타인 PR/타인 커밋 3종을 Claude Code가 직접 검사해 거부"는 이 문서로는 뒷받침되지 않고, 오히려 반대로 읽힙니다. 다만 저자가 실제 테스트로 관찰한 동작(모델/에이전트 레벨의 안전 규칙일 가능성)일 수도 있어, "확정 오류"보다는 **"상충 의심"**으로 표기합니다 — 저자가 실제 재현 로그를 남겨두었다면 그 근거를 리포트/글에 밝혀 두는 쪽을 권합니다.

**참고(수정 불요, drift 아님)**: `image/routine-fire-payload.ko.svg`/`.en.svg` 쌍이 ko.md·en.md 어디에도 참조되지 않는 미사용 이미지입니다. 양쪽 다 똑같이 안 쓰므로 번역 drift는 아니지만, 정리하셔도 좋을 듯합니다.

**참고(수정 불요, 문서에서 확인 불가)**: `clear_mcp_connections` API 필드명, 429 상태코드 자체는 문서에서 직접 확인되지 않았습니다 — 없다고 틀린 건 아닙니다.

### src/content/posts/claude/worktree/

**🔴 상충(카운트 오류) — "메인 체크아웃을 못 건드리게 막는 건 세 가지"**

> ko.md 330~334행: `막히는 건 **세 가지**입니다. — 파일 편집 / 명령의 작업 디렉터리 / git 우회`

공식 문서([worktrees](https://code.claude.com/docs/en/worktrees), "How Claude Code enforces isolation" 절)에서 제가 직접 목록을 받아 세었습니다 — **네 가지**입니다:

> "Claude Code applies **four** checks: **File edits** ... **Command working directory** ... **Git redirects** ... **Command shape**: Claude Code blocks a Bash or Monitor command when it can't verify from the command text that any git the command runs stays inside the worktree. That happens, for example, when the command name is computed at runtime, when the syntax can't be parsed, or when an expansion such as `${!name}` or `${ command; }` could run a command the text doesn't spell out."

글은 앞의 세 가지만 적고 **네 번째 "Command shape"(명령 형태 — 명령 텍스트만으로 git이 워크트리 안에 머무는지 정적으로 확인할 수 없으면 차단)를 빠뜨렸습니다.** ko.md/en.md 둘 다 같은 누락을 공유합니다.

**제안**: "세 가지" → "네 가지"로 바꾸고, "명령 텍스트만으로 git이 워크트리 안에 머문다는 걸 확인할 수 없는 명령(동적으로 결정되는 명령 이름, 파싱 불가능한 문법, `${!name}` 같은 확장 등)도 차단" 항목 추가.

**🔴 상충 — "정리 스윕은 `-w`로 만든 워크트리는 절대 손대지 않는다"**

> ko.md 404행: `-w 로 직접 만든 워크트리 — 청소는 여기엔 **절대** 손대지 않습니다`

공식 문서(worktrees, "Clean up subagent and background-session worktrees" 절, 제가 직접 재확인) 원문:

> "**When you background a `--worktree` session, its worktree becomes a background-session worktree that the sweep can remove.** The sweep leaves a worktree in place in these cases: ... The worktree belongs to a `--worktree` session **you haven't backgrounded**, whatever its age."

즉 `-w` 세션을 **백그라운드로 보내면** 그 워크트리는 스윕이 치울 수 있는 대상으로 바뀝니다. "절대"라는 단정은 이 예외를 놓치고 있습니다.

**제안**: "단, `-w` 세션을 백그라운드로 보내면 그 워크트리도 정리 대상이 됩니다"라는 단서를 추가.

**🔴 상충 — "워크트리 안에서 `claude --resume` 하지 마세요. 재개는 메인 체크아웃에서"**

> ko.md 549행: `워크트리 안에서 claude --resume 하지 마세요. 재개는 **메인 체크아웃에서** 실행해야 합니다.`

공식 문서(worktrees, "Resume a worktree session" 절, 제가 직접 재확인) 원문:

> "Claude Code re-enters a worktree **it created with git under `.claude/worktrees/` even when you launch from inside it.** When you launch from inside any other worktree, Claude Code re-enters it only if it can vouch for it... a launch from a subdirectory of a worktree **you created with `git worktree add`** declines, so launch those from the main checkout."

문서는 두 경우를 구분합니다 — (a) `-w`로 만든 표준 워크트리(`.claude/worktrees/` 아래)는 **그 안에서 resume해도 정상 동작**, (b) `git worktree add`로 직접 만든 워크트리 안에서는 거부되어 메인에서 해야 함. 글의 경고는 이 구분 없이 "워크트리 안에서는 (전부) 하지 말라"고 일반화해, 가장 흔히 쓰는 `-w` 표준 워크트리에 대해서는 문서와 반대되는 조언을 하고 있습니다.

**제안**: "`git worktree add`로 직접 만든 워크트리 안에서는 resume이 거부되니 메인에서 하라. `-w`로 만든 표준 워크트리(`.claude/worktrees/` 아래)는 그 안에서 resume해도 된다"로 구분해서 재작성.

**참고(수정 불요, 문서로 확인됨)**: 기본 경로 `.claude/worktrees/<이름>/`, 브랜치명 `worktree-<이름>`, `baseRef` fresh/head, `.worktreeinclude` 문법, PR 번호로 `claude -w "#1234"` → `pull/1234/head` → `.claude/worktrees/pr-1234`, `isolation: worktree` frontmatter, `.claude`가 심볼릭 링크면 생성 거부 등은 모두 문서와 정확히 일치함을 확인했습니다.

**참고(수정 불요, 문서에서 확인 불가)**: 서브에이전트 워크트리의 명명 규칙(`agent-<hash>` 등 구체적 패턴)은 문서에서 확인하지 못했습니다 — 없다고 오류는 아닙니다.

---

## 기타(pages/home, posts/git, posts/python, projects, experiences) — 8쌍

### src/content/pages/home/
이상 없음

### src/content/posts/git/worktree/
이상 없음(사소한 띄어쓰기 오타 1건, 수정 불요 수준)
- ko.md 12행: "이 뿐만 아니라" → 붙여쓰면 "이뿐만 아니라"가 맞습니다. 비문은 아니고 단순 띄어쓰기.
- 이 글은 순수 git worktree를 다루며 Claude Code의 worktree 기능과는 무관합니다(사실 점검 대상 아님).

### src/content/posts/python/01-everything-is-an-object/
이상 없음(참고 1건, 수정 불요 수준)
- en.md 384행: `[tistory: 잉여 개발자](https://yubi5050.tistory.com/311)` — 링크 텍스트가 한국어 블로그명 그대로 남아 있습니다. 영어 독자에게는 의미가 안 통하니 `[Korean blog: interning explainer]`처럼 영어 설명을 보충하는 걸 권장하나, 출처 블로그명이라 긴급도는 낮습니다.
- `가`·`가나`·`안녕` 같은 한글 예시 문자열은 PEP 393 바이트수 데모용 실제 예시 데이터라 번역 누락이 아닙니다.

### src/content/posts/python/02-variables-are-name-tags/
이상 없음

### src/content/posts/python/03-the-inside-story-of-if/
이상 없음(23개 헤딩·70개 코드블록·5개 이미지 전부 1:1 대응 확인)

### src/content/projects/relu-soft/west-side-barbell-club/01-about-conjugate/
이상 없음(영문 인용구 아래 한국어 의역이 en.md에는 없는데, 영문 인용이라 en 쪽엔 애초에 번역 대상이 없는 의도된 구성 — drift 아님)

### src/content/projects/relu-soft/west-side-barbell-club/02-raise-a-prob-and-sol/
이상 없음

### src/content/experiences/code-it/code-it/ (허브 문서, .mdx)
이상 없음. `{/* ... */}` 형식의 MDX 주석을 올바르게 사용 중이며, `<DocLinks>` 사용 자체는 지시대로 평가 대상에서 제외하고 주변 서술문만 확인했습니다.

---

## 제외 사항

`src/content/pages/cv/`는 지시에 따라 점검·열람하지 않았고, 위 집계에도 포함하지 않았습니다(초안 다듬는 중이라 지적이 반영되지 않음).

## Discord 전송

`DISCORD_WEBHOOK_URL` 설정 확인됨 — 요약을 Discord로 전송했습니다.
