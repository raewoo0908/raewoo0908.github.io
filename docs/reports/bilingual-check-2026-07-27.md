# 한/영 이중언어 점검 리포트 — 2026-07-27

## 요약

`src/content/` 아래 ko.md/en.md 짝 **12건 전체**를 점검했습니다 (experiences 2, pages 2, posts 6, projects 2). 심각한 구조적 드리프트(섹션·이미지·코드 누락)는 발견되지 않았고, 발견된 항목은 대부분 경미한 표현 다듬기 수준입니다. 다만 `pages/cv`에서 **포트폴리오 링크가 ko/en 서로 다른 문서를 가리키는 문제**가 있어 우선 확인이 필요합니다.

카테고리별 발견 항목 수 (문제없음 제외):

| 글 폴더 | 드리프트 | 표현 | 사실 점검 |
| --- | --- | --- | --- |
| `experiences/work/internship` | - | 1 | - |
| `experiences/activities/study-group` | 이상 없음 | | |
| `pages/home` | 이상 없음 | | |
| `pages/cv` | 4 | 2 | (해당 없음) |
| `posts/web/astro-blog` | 이상 없음 | | |
| `posts/algorithms/hello` | 이상 없음 | | |
| `posts/cs/data-structures/stack` | - | 1(경미) | - |
| `posts/claude/hook` | 참고 1 | 1 | 부분불일치 1, 확인불가 1 |
| `posts/claude/loop` | 1(경미) | 3 | 불일치 1, 확인불가 4 |
| `posts/claude/intro-automation-hook-loop-routine` | 이상 없음 | 4(경미) | 부분불일치 1 |
| `projects/ml/image-classifier` | 이상 없음 | | |
| `projects/web/personal-blog` | 이상 없음 | | |

점검한 사실 점검 항목(설정 키·훅 이벤트·슬래시 커맨드·환경변수·기본값·제한값)은 모두 `https://code.claude.com/docs/en/` 산하 공식 문서(hooks, hooks-guide, scheduled-tasks, routines 등)와 대조했습니다. **공식 문서로 확인된 것**과 **문서에서 확인 불가한 것**을 구분해 표기했습니다.

---

## `src/content/experiences/work/internship`

- **파일**: `src/content/experiences/work/internship/en.md`
- **인용**: "Used to check whether an additional `work` category shows up in the Experiences menu."
- **제안**: 주어 없이 "Used to check..."로 시작해 과거 습관(used to + 동사원형)으로 오독될 수 있습니다. "This example is used to check whether an additional `work` category shows up in the Experiences menu."로 수정 권장.

## `src/content/experiences/activities/study-group`

이상 없음.

## `src/content/pages/home`

이상 없음. (ko의 "영/한 토글"이 en에서 "slide toggle button"으로 표현되어 얼핏 드리프트로 보이지만, `LangToggle.astro`가 실제로 슬라이딩 방식 토글이라 정확한 용어 선택이며 바로 다음 문장에서 의미가 보완됨.)

## `src/content/pages/cv`

- **파일**: `ko.md`/`en.md` (line 87)
- **인용**: ko `https://app.notion.com/p/e8a97c8cd42c8358b75481955bc309a6?...` vs en `https://app.notion.com/p/Raewoo-Kang-s-Portfolio-32a97c8cd42c8096b616d5ff86f3be03?...`
- **제안**: 두 버전의 포트폴리오 링크가 서로 다른 Notion 페이지 ID를 가리킵니다. 실수로 갱신이 한쪽만 반영된 것으로 보이니, 둘 중 최신 링크로 통일하는 것을 우선 확인해 주세요.

- **파일**: `en.md` (line 52)
- **인용**: "refactored it into a **non-transactional facade** with a guaranteed outbox"
- **제안**: ko.md는 "트랜잭션 범위를 조정해 아웃박스 패턴으로 리팩터링"이라고만 되어 있어, en에만 "non-transactional facade"라는 구체적 기술 개념이 추가되어 있습니다(번역이 아니라 내용 추가). 실제로 facade 패턴을 썼다면 ko.md에도 반영하고, 아니라면 en.md에서 표현을 ko와 맞추세요.

- **파일**: `ko.md` (line 54)
- **인용**: "PR 리뷰 시간과 머지 충돌을 크게 감소."
- **제안**: 목적격 조사 "~을"과 자동사성 명사 "감소"의 호응이 어긋납니다(비문). "PR 리뷰 시간과 머지 충돌을 크게 감소시킴." 또는 "PR 리뷰 시간과 머지 충돌이 크게 감소."로 수정 권장.

- **파일**: `ko.md`/`en.md` (line 72)
- **인용**: ko "**대상 (1등)** — 학업 우수상" vs en "**First Place** — Academic Excellence Award"
- **제안**: 다른 수상 항목은 "우수상 (3등)" → "Excellence Award (3rd Place)"처럼 "상 이름 (등수)" 패턴을 유지하는데, 이 항목만 "대상"이라는 상 이름이 en에서 빠지고 등수만 남았습니다. "Grand Prize (1st Place)" 등으로 일관성을 맞추는 것을 권장.

- **파일**: `ko.md`/`en.md` (line 42)
- **인용**: ko "대구 2작전사령부 군 운전병 만기 전역" vs en "Honorably discharged as a military driver, Daegu, South Korea"
- **제안**: ko의 소속 부대명("2작전사령부")이 en에서 빠졌습니다. 의도적 단순화가 아니라면 "2nd Operations Command, Daegu, South Korea"처럼 세부 정보를 살리는 것을 검토하세요.

- **파일**: `ko.md`/`en.md` (line 8)
- **인용**: ko "**백엔드 / 클라우드 인프라 / AI 엔지니어**" vs en "**Aspiring Backend / Cloud Infrastructure / AI Engineer**"
- **제안**: en 헤드라인에만 "Aspiring"이 추가되어 있습니다(ko 본문에는 없고 frontmatter description에만 "지망하는"이 있음). 두 언어 헤드라인 어조를 맞추려면 ko에도 "(지망)" 등을 추가하거나 en에서 제거하는 것을 고려하세요.

날짜(`%% <날짜>`) 표기, 헤딩 구조, GPA·성능 수치 등 숫자·고유명사는 모두 정확히 일치했습니다.

## `src/content/posts/web/astro-blog`

이상 없음.

## `src/content/posts/algorithms/hello`

이상 없음.

## `src/content/posts/cs/data-structures/stack`

- **파일**: `ko.md`
- **인용**: "상단 Posts 메뉴에서 `cs → data-structures` 로 펼쳐지는지 확인해 보세요."
- **제안**: 사소한 스타일 지적. 조사 "로" 앞 띄어쓰기가 다소 어색합니다. 기능상 문제는 아니며 우선순위 낮음.

## `src/content/posts/claude/hook`

### 드리프트
참고(버그 아님): `check-bilingual.mjs` 코드블록 예시의 `additionalContext` 메시지 문자열이 ko.md/en.md 각각 한국어/영어로 번역되어 있습니다. 실제 저장소의 `scripts/check-bilingual.mjs`(42~44행)는 항상 한국어 메시지만 출력하므로, en.md는 예시를 단순화한 것("trimmed to the essentials"라고 명시함)이라 오류는 아니지만, "이 글이 담긴 저장소에서 실제로 운영 중인 설정"이라는 문맥과는 살짝 어긋납니다. 필요하면 en.md 코드블록에도 실제 스크립트처럼 한국어 메시지를 그대로 두는 것을 고려하세요.

### 표현
- **파일**: `en.md` (line 250)
- **인용**: "Now for a hook that genuinely runs: the configuration live in **the very repository holding the post you're reading**."
- **제안**: 비문(주어-동사 불일치). "the configuration **is live** in..." 또는 "the configuration **lives** in..."로 수정 필요.

### 사실 점검
`code.claude.com/docs/en/hooks`, `hooks-guide` 대조 결과:
- **공식 문서로 확인됨**: 종료코드 의미(0=성공/2=차단/기타=경고), 이벤트별 exit-2 효과 표, stdout이 Claude에게 보이는 이벤트가 `UserPromptSubmit`/`UserPromptExpansion`/`SessionStart` 3개뿐이라는 것, 30개 이벤트명 전체, matcher 규칙(정확 매치 vs 정규식), type 5종(`command`/`http`/`mcp_tool`/`prompt`/`agent`, `agent`가 experimental이라는 것 포함), `command`/`http`/`mcp_tool` 기본 timeout 600초, `asyncRewake` 동작, `stop_hook_active` 무한루프 방지, `CLAUDE_FILE_PATHS`가 실존하지 않는 변수라는 주장, settings.json 3개 위치, PostToolUse prettier 예시 명령어, `disableAllHooks` 키 — 모두 문서와 정확히 일치.
- **공식 문서와 부분 불일치**:
  - **인용**: "쓸 수 있는 환경변수는 이 정도입니다. **이게 사실상 전부입니다.**" (나열: `CLAUDE_PROJECT_DIR`, `CLAUDE_PLUGIN_ROOT`/`CLAUDE_PLUGIN_DATA`, `CLAUDE_CODE_REMOTE`, `CLAUDE_EFFORT`)
  - **판정**: 문서는 이 외에 `CLAUDE_CODE_BRIDGE_SESSION_ID`(Remote Control 세션 ID)와 `CLAUDE_PLUGIN_OPTION_<KEY>`(플러그인 사용자 설정값)도 훅 환경변수로 명시합니다. "사실상 전부"라는 단정은 다소 과합니다. 둘 다 니치 용도라 일반적 맥락에서 영향은 작지만, "핵심적으로 쓰는 변수는 이 정도입니다" 정도로 완화하거나 각주로 두 변수를 덧붙이는 것을 권장.
- **문서에서 확인 불가**: `PostToolUse`의 exit-2 서술(포스트: 도구 호출 자체는 못 막고 stderr만 전달) — 문서의 총괄표 기준으로는 정확하나, 문서 산문 섹션에는 "PostToolUse can block the turn via decision: block... Exit code 2 also blocks"라는 뉘앙스가 다른 서술도 있어 문서 내에서도 표현이 다소 엇갈립니다. 포스트가 틀렸다고 단정할 근거는 없으나 참고로 남깁니다.

## `src/content/posts/claude/loop`

### 드리프트
- **파일**: `en.md` (74행 부근, ko.md 71행과 대응)
- **인용**: en에만 "polling the deploy"라는 부연구가 추가되어 있음.
- **제안**: 내용을 왜곡하진 않으나 ko.md에는 없는 문구입니다. 완전한 1:1 대응을 원하면 삭제하거나 ko.md에도 동일하게 추가. 심각도 낮음.

이미지 6쌍(`loop-hero`, `loop-hook-vs-loop`, `loop-three-inputs`, `loop-deploy-flow`, `loop-terminal-deploy`, `loop-lifecycle`)은 `.ko.svg`/`.en.svg` 모두 정상 존재.

### 표현
- **파일**: `ko.md:216`
- **인용**: "이 환경변수를 걸면 cron 도구와 `/loop`이 아예 비활성화됩니다."
- **제안**: 조사 오류. "루프"는 모음 종결이므로 "`/loop`가"가 맞습니다(문서 다른 곳 18·33·39행과 불일치).

- **파일**: `ko.md:220`
- **인용**: "> **`/loop`은 내가 다른 일 하는 동안...**"
- **제안**: 같은 이유로 "`/loop`는"이 맞습니다(18행과 대조).

- **파일**: `ko.md:193`
- **인용**: "반복 태스크는 예정 시각보다 **최대 30분 늦게** 발화할 수 있습니다(시간당 미만이면 간격의 절반까지)."
- **제안**: "시간당 미만이면"이 의미 불명확(비문에 가까움). en.md 193행("for sub-hourly ones")의 의도는 "간격이 1시간보다 짧은 경우"입니다. "간격이 1시간 미만이면"으로 수정 권장.

### 사실 점검
`scheduled-tasks`, `tools-reference`, `goal`, `channels`, `routines` 문서 대조 결과:
- **공식 문서로 확인됨**: 간격·프롬프트 선택 조합별 동작, `/loop 20m /review-pr 1234` 예시, 간격 최소 단위 1분(초는 분으로 올림), `7m`/`90m` 반올림 예시(문서와 동일 숫자), 동적 모드 1분~1시간 자동 조절 및 매 반복 이유 출력, Monitor 도구 특성, 동적 모드 `ScheduleWakeup(stop:true)` 종료, 내장 유지보수 프롬프트 3단계, `loop.md` 탐색 경로·우선순위·25,000바이트 제한, 정지 방법 4가지(Esc/자동종료/`CronDelete`/7일 만료), 세션 수명과 `--resume`/`--continue`, 세션당 최대 50개 스케줄 태스크, 놓친 실행 몰아서 실행 안 함, 세션 종료 시 루프 정지, `CLAUDE_CODE_DISABLE_CRON=1`, 동적 모드에 지터 없음 — 모두 문서와 정확히 일치.
- **공식 문서와 불일치**:
  - **인용**: (ko.md/en.md 196행) "정확한 타이밍이 중요하면 `:00`이나 `:30`을 피하세요... 어정쩡한 분을 고르면 지터를 피할 수 있습니다."
  - **판정**: 문서 원문은 "잡 ID에서 파생된 고정 오프셋이라 같은 태스크는 항상 같은 오프셋을 받는다. 정확한 타이밍이 중요하면 :00/:30을 피하라 — **그러면 일회성(one-shot) 지터가 적용되지 않는다**"고 명시합니다. 즉 이 팁은 **일회성 태스크의 조기 발화 지터**에만 적용되는데, 포스트는 바로 앞 문단의 "**반복** 태스크는 최대 30분 늦게 발화" 논의 뒤에 이어 붙여 반복 태스크 지연도 분을 잘 고르면 피할 수 있는 것처럼 읽힙니다. 반복 태스크의 지연은 잡 ID로 고정되어 분 선택으로 회피 불가능합니다. 두 경우를 명확히 구분해 서술하는 것을 권장.
- **문서에서 확인 불가**:
  - "첫 틱을 기다리지 않고 그 자리에서 한 번 즉시 실행합니다" — `scheduled-tasks` 문서는 cron 표현식 변환·스케줄링·확인만 언급하고 즉시 1회 실행 여부는 명시하지 않음.
  - 간격→cron 매핑 표의 `N ≤ 59`, `N ≤ 23` 제약 — 표준 cron 필드 범위로 타당해 보이나 문서에 직접 명시되지 않음.
  - "고정 간격 루프는 `stop: true`로는 안 멈춥니다" — 문서는 동적 모드에서의 `stop:true` 종료만 설명하고, 고정 간격(cron) 루프에 대한 명시적 경고 문구는 없음(논리적으로는 타당).
  - 간격 파싱 우선순위("맨 앞 토큰 우선 → 끝의 `every` 절 → 둘 다 아니면 동적", `"check every PR"` 반례) — 문서는 두 파싱 방식의 존재만 언급하고 우선순위·반례 처리는 명시하지 않음.

## `src/content/posts/claude/intro-automation-hook-loop-routine`

### 드리프트
이상 없음. 헤딩 7개, 표 3개, JSON 코드블록, 이미지 참조 4쌍 모두 1:1 대응.

### 표현
- **파일**: `en.md:16` — "each one owns a different **time scale**" → "operates on a different time scale"가 더 자연스러움.
- **파일**: `en.md:16` — "what kind of situation it fits" → "what situation it's best suited for"가 더 자연스러움.
- **파일**: `en.md:49` — "block dangerous commands (e.g. stop `git push --force`)" → 표 헤더는 "block"인데 예시만 "stop"으로 동사가 바뀌어 일관성 부족. "blocking `git push --force`"로 통일 권장.
- **파일**: `en.md:73` — "When you **hook** a heavy command" → "When you attach a heavy command to a hook"이 더 자연스러움.

### 사실 점검
`hooks`, `hooks-guide`, `scheduled-tasks`, `routines`, `commands` 문서 대조 결과:
- **공식 문서로 확인됨**: Hook 4대 이벤트(PreToolUse/PostToolUse/Notification/Stop) 및 그 외 이벤트도 더 있다는 서술, exit code 2 차단 동작, PostToolUse prettier hook 예시(matcher 순서만 다르나 alternation이라 동작 동일 — 버그 아님), Notification 이벤트의 데스크톱 알림 용도, `/loop [간격] [프롬프트]` 문법과 3가지 모드, 간격 생략 시 동적 모드(1분~1시간), 7일 자동 만료, `Esc` 중단과 `--resume` 복원, `/routine`이 Anthropic 클라우드에서 실행되고 research preview 단계라는 것, 트리거 3종(예약/API/GitHub)과 복합 트리거 예시 — 모두 문서와 정확히 일치.
- **공식 문서와 부분 불일치**:
  - **인용**: "`pull_request.opened` 시 보안·성능·**테스트** 자동 리뷰"
  - **판정**: 공식 문서의 해당 예시("Bespoke code review")는 "security, performance, and **style** issues"라고 되어 있어 "테스트"가 아니라 "스타일"입니다. 저자의 창작 예시일 수 있어 심각한 오류는 아니지만, 공식 예시를 인용한 것이라면 "스타일"로 수정 권장.
- **문서에서 확인 불가**: "무거운 명령을 Hook에 걸 때는 백그라운드(`& disown`)로 돌려서 세션이 멈추지 않게" — `asyncRewake` 같은 비동기 옵션 필드는 문서에 존재하나 `& disown` 셸 기법 자체를 문서가 권장한다는 문구는 확인하지 못함(틀린 조언은 아니나 공식 문서 인용은 아님).

## `src/content/projects/ml/image-classifier`

이상 없음.

## `src/content/projects/web/personal-blog`

이상 없음.

---

## Discord 알림

`DISCORD_WEBHOOK_URL` 설정됨 — 요약을 Discord로 전송 완료(HTTP 204).
