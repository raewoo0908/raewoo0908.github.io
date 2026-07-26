# ko/en 짝 점검 리포트 — 2026-07-26

## 요약

- 점검한 글(ko/en 짝): **12개**
- 발견 항목: 총 **7건** (실질적 드리프트 4건, 표현 개선 1건, 의도 확인 필요 1건, 문서 대조 이슈 다수는 Claude Code 관련 글 2편에 집중)
- 이상 없음: 8개 폴더 (`experiences/activities/study-group`, `pages/home`, `posts/cs/data-structures/stack`, `posts/web/astro-blog`, `projects/ml/image-classifier`, `projects/web/personal-blog`, `posts/claude/intro-automation-hook-loop-routine`, `posts/claude/loop` — 단 아래 두 Claude 글은 사실 점검에서 별도 항목 있음)
- 카테고리별 발견 수:
  - `experiences/`: 1건 (표현)
  - `pages/`: 4건 (cv — 링크 불일치 1, 서술 드리프트 1, 정보 누락 1, 경미한 첨언 1)
  - `posts/algorithms/`: 1건 (의도 확인 필요)
  - `posts/claude/`: 사실 점검 결과 — 대부분 확인됨(문서 일치), 확인 불가 2건 · 문서와 다름(부분) 2건

각 항목은 아래 글 폴더별 섹션에서 파일 경로, 인용, 제안 순으로 정리했습니다.

---

## `src/content/experiences/activities/study-group/`

이상 없음.

## `src/content/experiences/work/internship/`

- **파일**: `src/content/experiences/work/internship/en.md` (10번째 줄)
  - **인용**: `Used to check whether an additional \`work\` category shows up in the Experiences menu.`
  - **문제**: 주어 없이 시작하는 문장 조각(sentence fragment). ko.md의 "...확인용 예시입니다"를 직역하며 문법적으로 다소 어색함.
  - **제안**: `This is an example used to check whether an additional \`work\` category shows up in the Experiences menu.` 처럼 주어를 추가.

그 외 헤딩·목록·인라인 코드·날짜 정보는 ko/en 완전히 일치.

## `src/content/pages/cv/`

- **파일**: `ko.md` (87행) vs `en.md` (87행) — **포트폴리오 링크 불일치**
  - ko: `https://app.notion.com/p/e8a97c8cd42c8358b75481955bc309a6?source=copy_link`
  - en: `https://app.notion.com/p/Raewoo-Kang-s-Portfolio-32a97c8cd42c8096b616d5ff86f3be03?source=copy_link`
  - 서로 다른 Notion 페이지 ID를 가리킵니다. 번역 드리프트가 아니라 실제 링크가 다른 것으로 보이므로, 의도치 않았다면 최신/올바른 링크로 통일 필요.

- **파일**: `ko.md` (52행) vs `en.md` (52행) — **기술적 서술 드리프트**
  - ko: "트랜잭션 범위를 조정해 아웃박스 패턴으로 리팩터링"
  - en: "refactored it into a non-transactional facade with a guaranteed outbox"
  - 단순 번역 차이를 넘어 리팩터링 방식 자체가 다르게 서술됨(트랜잭션 범위 조정 vs 논트랜잭셔널 파사드). 실제 구현과 일치하는 쪽으로 양쪽 표현 통일 제안.

- **파일**: `ko.md` (42행) vs `en.md` (42행) — **정보 누락**
  - ko: "대구 2작전사령부 군 운전병 만기 전역"
  - en: "Honorably discharged as a military driver, Daegu, South Korea"
  - en에서 부대명("2작전사령부" / "2nd Operations Command")이 누락됨. 정보량을 맞추려면 추가 고려.

- **파일**: `en.md` (8행) vs `ko.md` (8행) — **경미한 첨언**
  - ko: "**백엔드 / 클라우드 인프라 / AI 엔지니어**"
  - en: "**Aspiring Backend / Cloud Infrastructure / AI Engineer**"
  - en에만 "Aspiring"이 붙어 있음. frontmatter description에는 양쪽 다 "지망하는" 뉘앙스가 있어 치명적이진 않으나, 본문 타이틀 줄의 일관성을 위해 제거하거나 ko에도 대응 표현 추가를 검토.

## `src/content/pages/home/`

이상 없음.

## `src/content/posts/algorithms/hello/`

- **파일**: `ko.md` (21행) / `en.md` (21행) — **코드 리터럴 차이(의도 확인 필요)**
  - ko: `` return `안녕하세요, ${name}님!`; ``
  - en: `` return `Hello, ${name}!`; ``
  - 코드블록 내 문자열 리터럴(주석이 아닌 실제 코드 값)이 언어별로 다름. `console.log(greet('raewoo0908'))` 실행 결과가 ko/en에서 다른 텍스트를 출력.
  - **제안**: 인사말을 보여주기 위한 의도적 로컬라이즈 데모라면 문제없으나, "코드 자체는 동일해야 한다"는 원칙을 엄격 적용한다면 두 언어 모두 같은 문자열(예: 항상 영어)을 쓰거나, 의도된 예시임을 본문에 한 줄 명시하는 것을 검토.

그 외 헤딩·문단·이미지 구조는 완전히 일치.

## `src/content/posts/cs/data-structures/stack/`

이상 없음.

## `src/content/posts/web/astro-blog/`

이상 없음.

## `src/content/projects/ml/image-classifier/`

이상 없음.

## `src/content/projects/web/personal-blog/`

이상 없음.

## `src/content/posts/claude/intro-automation-hook-loop-routine/`

번역 드리프트: 이상 없음 (헤딩·표·이미지 참조·코드블록 완전히 일치).

**사실 점검** (Claude Code 서술 대상 — Hook/·/loop·/routine 개요):
- Hook 대표 이벤트 4종(`PreToolUse`, `PostToolUse`, `Notification`, `Stop`)의 설명 — **공식 문서(`hooks`)와 일치, 확인됨**.
- `/routine`이 "현재 research preview 단계"라는 서술 — **공식 문서(`routines`)에서 확인됨**: "Routines are in research preview. Behavior, limits, and the API surface may change."
- `/routine` 트리거 3종(예약/Cron·API·GitHub 이벤트)이 Anthropic 클라우드에서 실행된다는 서술 — **공식 문서에서 확인됨**: "Routines execute on Anthropic-managed cloud infrastructure" / 트리거는 Scheduled·API·GitHub 세 가지로 정확히 일치.
- `.claude/settings.json`에 `hooks` 블록을 추가하는 예시 JSON — **문법·구조 확인됨**(matcher/hooks/type/command 구조가 공식 문서와 일치).

## `src/content/posts/claude/hook/`

번역 드리프트: 이상 없음 (헤딩·표·코드블록·이미지 참조 완전히 일치. 코드블록 내 문자열도 예시 출력 부분을 제외하면 동일).

**사실 점검** (https://code.claude.com/docs/en/hooks 대조):

**확인됨 (공식 문서와 일치)**
- 종료코드 0(성공, stdout을 JSON으로 파싱)/2(차단, stdout 무시하고 stderr 전달)/그 외(비차단, 경고 후 진행) — 문서와 정확히 일치.
- 이벤트별 종료코드 2 효과: `PreToolUse`(차단 가능) · `PostToolUse`(차단 불가, stderr만 전달) · `UserPromptSubmit`(프롬프트 거부) · `Stop`·`SubagentStop`(턴/서브에이전트 종료 거부) · `SessionEnd`·`Notification`(차단 불가, 부수효과만) — 공식 문서의 표와 정확히 일치.
- `matcher` 규칙: "글자·숫자·`_`·`-`·공백·`,`·`|`만 쓰면 정확 매치, 그 외 문자가 섞이면 정규식(앵커 없음)" — 문서 원문과 정확히 일치.
- `type` 다섯 가지(`command`·`http`·`mcp_tool`·`prompt`·`agent`) — 문서와 일치. 단 `agent` 타입을 "실험적"이라고 서술한 부분은 문서에서 확인 불가(문서는 "spawn a subagent for verification"이라고만 설명).
- `CLAUDE_FILE_PATHS`는 실존하지 않는 환경변수라는 주장 — 확인됨(문서 목록에 없음).
- `command` 타입 훅의 기본 timeout 600초 — 확인됨. (참고: 문서에는 `prompt` 타입 기본 30초, `agent` 타입 기본 60초, `UserPromptSubmit`은 30초로 낮아지는 등 추가 세부 규칙이 있으나 이 글의 범위 밖이라 오류는 아님)
- `disableAllHooks: true` 설정 — 확인됨.
- stdout이 Claude에게 직접 보이는 이벤트가 `UserPromptSubmit`·`UserPromptExpansion`·`SessionStart` 셋뿐이라는 주장 — 확인됨(문서 원문과 정확히 일치).
- **이벤트 30종 전체 목록과 이름** — 이 글에서 가장 사실 오류 가능성이 높아 보였던 부분인데, **공식 문서와 대조한 결과 30개 이벤트 이름이 정확히 일치**합니다 (PreToolUse, PermissionRequest, PermissionDenied, PostToolUse, PostToolUseFailure, PostToolBatch, UserPromptSubmit, UserPromptExpansion, MessageDisplay, SessionStart, Setup, InstructionsLoaded, ConfigChange, CwdChanged, FileChanged, SessionEnd, Stop, StopFailure, Notification, SubagentStart, SubagentStop, TaskCreated, TaskCompleted, TeammateIdle, PreCompact, PostCompact, WorktreeCreate, WorktreeRemove, Elicitation, ElicitationResult).
- `/hooks` 슬래시 커맨드로 등록된 훅을 확인할 수 있다는 주장 — 확인됨("Type `/hooks` in Claude Code to open a read-only browser for your configured hooks.").
- `async`/`asyncRewake` 옵션 설명 — 확인됨. `asyncRewake`가 종료코드 2에서 Claude를 깨운다는 서술도 문서 원문과 일치.
- `settings.json` 3단계 위치(사용자/프로젝트/로컬)와 공유 범위 표 — 확인됨.

**확인 불가 (문서에서 찾지 못함 — 오류라는 뜻은 아니며, 이 글의 근거로 명시된 두 공식 페이지에서는 확인되지 않았다는 의미)**
- `stop_hook_active` 필드가 `Stop`/`SubagentStop` 훅 입력 JSON에 들어온다는 주장 — hooks 문서 페이지를 두 차례 별도로 대조했으나 해당 필드에 대한 명시적 언급을 찾지 못했습니다. 실제 동작 여부(재진입 방지용으로 흔히 알려진 필드)는 이 점검만으로는 판단할 수 없어 "문서에서 확인 불가"로 표기합니다. 다른 문서 페이지(예: 훅 입력 스키마 상세 페이지)에 있을 가능성은 배제할 수 없습니다.

**참고할 만한 사소한 차이**
- 환경변수 목록에서 "이게 사실상 전부입니다"라고 단정한 부분 — 공식 문서에는 이 글에 나열된 4개(`CLAUDE_PROJECT_DIR`·`CLAUDE_PLUGIN_ROOT`·`CLAUDE_PLUGIN_DATA`·`CLAUDE_CODE_REMOTE`·`CLAUDE_EFFORT`, 총 5개) 외에 `CLAUDE_CODE_BRIDGE_SESSION_ID`(v2.1.199+, Remote Control 세션 ID)와 플러그인용 `CLAUDE_PLUGIN_OPTION_<KEY>` 패턴이 추가로 문서화되어 있습니다. "사실상 전부"라는 표현이 완전히 틀린 것은 아니지만, 정확히는 목록이 더 있다는 점을 밝혀두는 편이 낫습니다.

## `src/content/posts/claude/loop/`

번역 드리프트: 이상 없음 (헤딩·표·코드블록·이미지 참조 완전히 일치. 콘솔 출력 예시의 커밋 메시지 텍스트도 자연스럽게 각 언어로 옮겨져 있어 문제 없음).

**사실 점검** (https://code.claude.com/docs/en/scheduled-tasks 대조):

**확인됨 (공식 문서와 일치)**
- `/loop [간격] [프롬프트]` 문법, 간격 단위 s/m/h/d, 최소 단위 1분(`30s`→`1m` 올림) — 문서 원문과 정확히 일치.
- 간격 생략 시 동적 모드로 Claude가 1분~1시간 사이에서 다음 대기 시간을 스스로 결정, 내부적으로 `ScheduleWakeup` 도구 사용 — 확인됨.
- `Monitor` 도구로 백그라운드 스크립트 출력을 실시간으로 받아 폴링 없이 반응한다는 설명 — 확인됨.
- `loop.md` 위치(`.claude/loop.md` 우선, `~/.claude/loop.md` 차선), 25,000바이트 초과 시 잘림, 커맨드에 프롬프트를 직접 주면 무시됨 — 모두 문서 원문과 정확히 일치.
- 루프 정지 방법(대기 중 `Esc`, 동적 모드 `stop: true` 자동 종료, 고정 간격은 `CronDelete`로 8자리 잡 ID 취소), 7일 자동 만료 — 확인됨.
- 지터: 반복 태스크가 최대 30분(시간당 미만 간격은 절반까지) 늦게 발화할 수 있고 오프셋이 잡 ID로 결정되어 같은 잡은 항상 같은 만큼 늦다는 것, 동적 모드에는 지터가 없다는 것 — 확인됨.
- `CLAUDE_CODE_DISABLE_CRON=1`로 cron 도구와 `/loop`을 비활성화 — 확인됨.
- 세션당 최대 50개 스케줄 태스크 제한 — 확인됨("A session can hold up to 50 scheduled tasks at once.").
- `CronCreate`·`CronList`·`CronDelete`·`ScheduleWakeup` 도구 이름 — 확인됨.

**문서와 다름(부분) — 확인이 필요한 지점**
- 고정 간격 → cron 변환 공식으로 제시된 `Nm(N≤59)→*/N * * * *`, `Nh(N≤23)→0 */N * * *`, `Nd→0 0 */N * * *` 표 — 공식 문서는 "Claude converts it to a cron expression"이라고만 서술하고, cron 참고 표에 `*/5 * * * *`(5분마다)·`0 * * * *`(매시 정각) 같은 예시만 제공할 뿐, `N≤59`/`N≤23` 같은 정확한 상한값과 공식 자체는 명시하지 않습니다. 제시된 값이 문서 예시와 모순되지는 않지만, 정확한 출처를 문서에서 직접 확인하지는 못했습니다("확인 불가"에 가까움).
- 지터 회피 조언 — 이 글은 "`0 9 * * *` 대신 `3 9 * * *`처럼 어정쩡한 분을 고르면 지터를 피할 수 있다"고 반복 태스크의 지연(최대 30분 늦음)을 피하는 방법처럼 서술합니다. 그런데 공식 문서 원문을 그대로 보면, 이 조언은 "one-shot jitter"(원샷 리마인더가 예정 시각보다 최대 90초 **일찍** 발화하는 것)를 피하는 방법으로 문장이 마무리됩니다: *"If exact timing matters, pick a minute that is not :00 or :30, ... and the one-shot jitter will not apply."* 반복 태스크의 최대 30분 지연 지터는 잡 ID로 결정되는 고정 오프셋이라, 분을 바꾼다고 그 지연 자체가 없어지는 것은 아닐 가능성이 있습니다. 즉 이 글은 원샷 리마인더에 적용되는 문서상의 조언을 반복 루프(`/loop`)의 지연 회피 조언인 것처럼 일반화했을 소지가 있습니다. 오류로 단정하기보다는 **"문서와 다르게 일반화됨" 정도로 표기**하며, 저자 확인을 권장합니다.

**확인 불가**
- 없음(이 글의 나머지 서술은 모두 공식 문서에서 직접 확인됨).

---

## Discord 전송

`DISCORD_WEBHOOK_URL` 환경변수가 설정되어 있어 위 요약을 Discord로 전송했습니다 (HTTP 204).

