# ko/en 이중언어 점검 리포트 — 2026-08-03

## 요약

`src/content/` 아래 **ko.md/en.md(또는 ko.mdx/en.mdx) 짝 11개**를 전수 점검했습니다.

| 카테고리 | 글 수 | 드리프트 | 표현 지적 | 사실점검 지적(claude/*만) |
| --- | --- | --- | --- | --- |
| pages (cv, home) | 2 | 4 | 7 | - |
| posts/claude (hook, intro-automation-hook-loop-routine, loop, routine) | 4 | 2 | 13 | 불일치 4건 / 확인 불가 11건 (확인됨 다수 생략) |
| posts/python (01, 02) | 2 | 0(로직 기준) | 10 | - |
| projects/relu-soft/west-side-barbell-club (01, 02) | 2 | 3 | 6 | - |
| experiences/code-it | 1 | 3 | 4 | - |
| **합계** | **11** | **12** | **40** | 불일치 4건 / 확인 불가 11건 |

- 구조적 위반(헤딩 개수·순서, 표, 코드블록 실행 로직, 이미지 언어쌍 참조)은 모든 글에서 **이상 없음** — pre-commit 훅(`check-bilingual`, `check-post-images`)이 이미 강제하고 있어 예상된 결과입니다.
- 아래 지적은 대부분 "구조는 맞지만 뉘앙스·정보량이 미묘하게 달라진" 수준의 경미한 드리프트이거나 표현 다듬기 제안입니다. **심각한 의미 왜곡이나 사실관계 오류는 없었습니다.**
- 가장 눈에 띄는 사실 오류: `posts/claude/hook`의 "훅 이벤트 30종"은 공식 문서 기준 **31종**이며, `posts/claude/routine`의 브랜치 push 권한 설명은 공식 문서의 최신 서술과 다릅니다(아래 상세 참고).

---

## src/content/pages/cv (ko.md / en.md)

### 드리프트

1. **병역 사항에서 소속 부대명 누락**
   - `en.md`: `**Military Service** — Honorably discharged as a military driver, Daegu, South Korea`
   - `ko.md`: `**병역** — 대구 2작전사령부 군 운전병 만기 전역`
   - "2작전사령부"가 영문에서 빠짐. 제안: `Honorably discharged as a military driver, 2nd Operations Command, Daegu, South Korea`

2. **성능 최적화 서술에 원문에 없는 구현 디테일 추가**
   - `en.md`: `refactored it into a non-transactional facade with a guaranteed outbox.`
   - `ko.md`: `트랜잭션 범위를 조정해 아웃박스 패턴으로 리팩터링.`
   - "facade"·"non-transactional"이 ko에는 없는 구체적 구현 방식. 실제 구현과 다르면 이력서상 사실 오류가 될 수 있음. 제안: `refactored it by narrowing the transaction scope and applying the outbox pattern.`

3. **"cross-functional team"이라는 검증되지 않은 수식어 추가**
   - `en.md`: `Led a 6-member cross-functional team, ...`
   - `ko.md`: `6인 팀을 이끌며 ...` (cross-functional에 해당하는 표현 없음)
   - 제안: `Led a team of 6, ...`

4. **상단 태그라인에 "Aspiring" 추가**
   - `en.md`: `**Aspiring Backend / Cloud Infrastructure / AI Engineer**`
   - `ko.md`: `**백엔드 / 클라우드 인프라 / AI 엔지니어**` (해당 위치엔 "지망하는" 없음)
   - 톤이 ko는 단정적, en은 지망생 뉘앙스로 갈림. 제안: en에서도 "Aspiring" 제거하거나 ko에 "지망하는" 추가해 통일.

### 표현 품질

5. **ko.md 비문** — `PR 리뷰 시간과 머지 충돌을 크게 감소.` → "감소하다"는 자동사이므로 목적격 조사와 어울리지 않음. 제안: `...크게 감소시킴.` 또는 `...크게 감소.`(주어 구조로)
6. **en.md 과장 수식어** — `Designed and deployed a robust pipeline ... for seamless CD.` → ko 원문엔 "robust"/"seamless"에 해당하는 수식이 없음. 제안: 수식어 제거.
7. **en.md 용어 뉘앙스** — `mission-driven engineering organization` ← ko `목표 지향적인 엔지니어링 조직`. "목표 지향적"은 "goal-oriented"에 가까움. 제안: `goal-oriented`로 수정.
8. **en.md 과잉 구체화** — `introduced a pre-coding approval system` ← ko `사전 승인 체계`(코딩 이전이라는 구체적 시점 명시 없음). 제안: `pre-approval system`.

---

## src/content/pages/home (ko.md / en.md)

구조(헤딩·리스트 순서/개수)는 완전히 일치. 아래는 경미한 뉘앙스 차이입니다.

1. `en.md`: `🛠️ **Projects** — things I've built` ← ko `프로젝트 정리`("정리/기록" 뉘앙스인데 en은 "내가 만든 것들"로 강해짐). 제안: `projects I've organized` 또는 `write-ups on my projects`.
2. `en.md`: `Use the slide toggle button in the top right...` ← ko `영/한 토글 버튼`. ko에 없는 "slide"가 추가됨. 실제 UI가 슬라이드형이 아니면 `the toggle button`으로 단순화 권장.
3. `en.md`: `💼 **Experiences** — activities and work` ← ko `경험과 활동`. "experience"라는 단어 자체가 en 설명에서 빠짐. 제안: `experiences and activities`로 어순·어휘 통일.

이상 세 건 모두 경미한 어휘 선택 차이이며, 사실 오류나 섹션 누락은 없습니다.

---

## src/content/posts/claude/hook (ko.md / en.md)

### 드리프트

1. **예시 stderr 메시지 생략** — `ko.md` L339는 `additionalContext`에 실제 메시지 예시(`"방금 ko.md 를 수정했습니다: …"`)를 보여주는데 `en.md`는 `"..."`로 생략해 정보량이 줄음. 제안: 실제 예시 메시지를 영어로 채워 넣기.

그 외 헤딩·표·이미지 참조·코드블록(25개, JSON/셸 설정 자체는 완전 동일)은 이상 없음.

### 표현 품질

2. `en.md` L250 — `"...the configuration live in the very repository..."` → 주어-동사 불일치(비문). 제안: `"...the configuration that lives in..."`
3. `en.md` L147 — `"letters, digits, _, -, spaces, , and | only means exact matching"` → 어색한 구조. 제안: `"stick to letters, digits, _, -, spaces, , and | and it's an exact match"`
4. `en.md` L135 — `"Clean split."` 단독 문장 파편. 제안: 앞 문장에 붙이거나 `"That keeps things clean."`로 풀어쓰기.
5. ko.md는 비문·오탈자 없음(이상 없음).

### 사실 점검 (Claude Code 관련)

| 주장 | 판정 | 비고 |
| --- | --- | --- |
| 훅 이벤트 "30종" | **문서와 불일치** | 공식 문서(`code.claude.com/docs/en/hooks`) 기준 실제로는 `DirectoryAdded` 등을 포함해 **31개** 이벤트가 나열되어 있음. "세션 수명 계열" 표에서 `DirectoryAdded`가 빠져 있어 숫자가 하나 적게 계산된 것으로 보임. |
| exit code 2의 이벤트별 차단 동작 표 | 문서 확인됨 | 공식 문서 표와 정확히 일치 |
| command 훅 기본 timeout 600초(10분) | 문서 확인됨 | 문서: `Defaults: 600 for command, http, and mcp_tool` |
| matcher 문법(글자·숫자·`_`·`-`·공백·`,`·`\|`만이면 정확매치, 아니면 정규식) | 문서 확인됨 | 문서와 정확히 일치 |
| hook `type` 5종(command/http/mcp_tool/prompt/agent) | 문서 확인됨 | 일치 |
| 환경변수 목록(`CLAUDE_PROJECT_DIR` 등 4개)을 "사실상 전부"라고 서술 | **문서와 경미한 불일치** | 공식 문서에는 `CLAUDE_CODE_BRIDGE_SESSION_ID`, `CLAUDE_PLUGIN_OPTION_<KEY>`도 추가로 문서화되어 있어 "전부"는 과장 |
| `CLAUDE_FILE_PATHS`는 공식 변수가 아니다 | 문서 확인됨 | 공식 환경변수 목록에 없음 확인 |
| `async: true` / `asyncRewake: true` | 문서 확인됨 | 설명 일치 |
| `disableAllHooks: true` | 문서 확인됨(설명 일부 누락) | 문서에는 이 옵션이 커스텀 statusline도 함께 끈다고 되어 있는데 글에는 언급 없음(오류는 아니고 누락) |
| 설정 파일 위치 3곳(`~/.claude/settings.json` 등) | 문서 확인됨 | 일치 |
| `$schema` URL | 문서 확인됨 | 일치 |
| `/hooks` 명령 | 문서 확인됨 | 일치 |
| `if` 필드로 특정 명령 타겟팅 | 문서 확인됨 | 일치 |
| `payload.stop_hook_active` 필드로 Stop 훅 재진입 방지 | **문서에서 확인 불가** | 공식 hooks 문서의 공통 입력 필드 목록에서 해당 필드명을 찾지 못함(존재할 가능성은 있으나 현재 조회된 문서로는 검증 불가) |

---

## src/content/posts/claude/intro-automation-hook-loop-routine (ko.md / en.md)

### 드리프트

이상 없음 — 헤딩(7개 섹션)·표 4개·JSON 코드블록(실제 코드 동일)·이미지 4쌍 모두 1:1 대응.

### 표현 품질

- `en.md` L16 — `"each one owns a different time scale"` → 제안: `"covers"` 또는 `"operates on a different time scale"`
- `en.md` L73 — `"When you hook a heavy command"` → 다소 비격식. 제안: `"When you attach a heavy command to a hook"`
- `en.md` L25(표) — `"PR babysitting"`이라는 속어가 정의되기 전에 먼저 등장(정의는 L103에서야 등장). ko는 표에서 담백하게 "PR 관리"라고 쓰고 본문에서 처음 "베이비시팅"을 도입함. 제안: 표에서는 `"PR management"`로 두거나 처음 등장 시 괄호로 짧게 설명.
- `en.md` L32 — `"a hook steps in at the millisecond level"` → 제안: `"a hook steps in within milliseconds"`
- ko.md는 비문·오탈자 없음(이상 없음).

### 사실 점검

대부분 공식 문서(`/hooks`, `/hooks-guide`, `/scheduled-tasks`)와 **확인됨**. 아래만 참고:

- Prettier 예시의 matcher 순서가 문서는 `Edit|Write`, 글은 `Write|Edit` — 정규식 OR이라 동작 차이는 없음(문제 아님).
- "무거운 명령은 백그라운드(`& disown`)로 돌리는 게 좋다"는 팁 — **문서에서 확인 불가**(합리적 실무 팁이지만 문서 근거는 없음).
- 예시 `/loop 30s ...` — **문서와 부분 불일치**: 공식 문서상 30초는 실제로 1분으로 반올림되어 동작함(ko/en 공통 이슈라 드리프트는 아님).
- GitHub 트리거 예시에서 "보안·성능·**테스트**" 자동 리뷰라고 서술 — 공식 문서의 예시는 "security, performance, and **style**"이라 "테스트"는 **문서에서 확인 불가**(명백한 오류는 아니나 문서 예시와 다름).

---

## src/content/posts/claude/loop (ko.md / en.md)

### 드리프트

1. **"꺼지다" ↔ "goes to sleep" 오역** — `ko.md:39` `"내 컴퓨터가 꺼지거나 대화를 새로 시작하면 멈춥니다."` vs `en.md:39` `"If your machine goes to sleep or you start a new conversation, it stops."` — "꺼지다"(전원 종료)와 "goes to sleep"(슬립)은 기술적으로 다른 상태. 같은 글의 L229는 정확히 번역되어(`꺼져 있어도` → `is off`) 일관성도 어긋남. 제안: L39를 `"If your machine turns off or you start a new conversation, it stops."`로 수정.

### 표현 품질

- `en.md:67` — `"Why, in the gotchas below."` → 문장 파편. 제안: `"We'll get into why in the gotchas below."`
- `ko.md:193` — `"시간당 미만이면"` → 어색한 조어. 제안: `"1시간보다 짧은 간격이면"`

### 사실 점검

`/loop` 관련 서술(간격 파싱, cron 매핑, 동적 모드, `ScheduleWakeup`/`Monitor` 도구, `loop.md` 탐색 순서·25,000바이트 제한, 정지 방법 4가지, 세션 수명, `CronList`/`CronDelete`, 세션당 최대 50개, 지터, `CLAUDE_CODE_DISABLE_CRON`, 8자리 job ID 등) 대부분 **문서 확인됨**, 공식 문서와 표현까지 매우 정합적입니다. 아래만 확인 불가:

- 간격 파싱 시 `check every PR`처럼 시간 표현이 아닌 경우의 예외 처리 — **문서에서 확인 불가**
- cron 매핑 표의 분/시 상한값(N≤59, N≤23) 명시 여부 — **문서에서 확인 불가**(표준 cron 범위와는 부합)

---

## src/content/posts/claude/routine (ko.md / en.md)

### 드리프트

이상 없음 — 헤딩·이미지 10쌍·코드블록(cron_expression, allowed_tools 등 실행 값)까지 완전히 일치.

### 표현 품질(ko.md)

- L239, L357 — `"레포트"` (다른 10곳 이상은 "리포트"로 표기) → "리포트"로 통일 권장.
- L206 — `"레포"` (다른 곳은 전부 "저장소") → "저장소"로 통일 권장.
- L212~215 — `"'연필'모양 클릭"` 등 따옴표/코드스팬 뒤 공백·조사 누락 → `"'연필' 모양을 클릭"` 등으로 다듬기 권장.
- L204~205 — 번호 뒤 공백 2칸(다른 목록은 1칸) — 오탈자 수준.

en.md는 표현상 이상 없음.

### 사실 점검

대부분 **문서 확인됨** — CLI `/schedule`의 트리거 범위, cron 최소 간격 1시간, UTC 기준, 실행 stagger, 커넥터 기본 포함·쓰기 권한, 로컬 MCP 서버 미노출, 네트워크 접근 레벨(None/Trusted/Custom/Full)과 기본 허용 도메인, `discord.com` 차단 시 `403`/`x-deny-reason`, routine 개인 소유·비공유, 일일 실행 상한과 `429`, `/schedule` "Unknown command" 3대 원인, 삭제는 웹 UI 전용 등 세부 수치까지 공식 문서와 정확히 일치했습니다.

- **문서와 불일치**: `ko.md:394~396`/`en.md:397~399` — "기본적으로 `claude/` 브랜치에만 push 가능하며, **Allow unrestricted branch pushes**를 켜야 다른 브랜치에 쓸 수 있다"는 서술. 공식 문서(`routines` 문서의 "Repositories and branch permissions")의 실제 서술은: *"`claude/` 접두사 브랜치는 항상 허용되고, 다른 브랜치로 보내려 하면 (1) GitHub에서 보호된 브랜치인지 (2) 다른 사람이 그 브랜치에서 연 PR이 있는지 (3) 본인이 아닌 사람이 커밋한 브랜치인지를 검사해 조건부로 거부한다"*는 방식입니다. "Allow unrestricted branch pushes"라는 이름의 토글은 현재 조회한 공식 문서 페이지에 등장하지 않습니다. **이 부분은 재확인/수정이 필요합니다.**
- **문서에서 확인 불가**: routine 생성 API의 세부 JSON 스키마(`job_config.ccr.environment_id` 등), 실측 stagger 오프셋(`00:08:17`) 수치, Discord 플러그인 내부 구조(`~/.claude/channels/discord/.env`), `/web-setup`과 push 권한의 직접적 연결, 웹훅 URL이 목록 조회 API로 읽힌다는 서술 — 공식 문서 범위 밖이거나 저자의 개별 경험으로 보이며 검증 불가.
- 참고: `ko.md:412`의 "Bedrock·Vertex" 표기는 최신 공식 문서가 "Google Cloud's Agent Platform"이라는 명칭을 쓰고 있어(리브랜딩 추정) 다소 구식일 수 있음(오류는 아님).

---

## src/content/posts/python/01-everything-is-an-object (ko.md / en.md)

구조·코드(주석 제외 완전 diff)는 완전히 일치. 발견된 이슈는 전부 표현/오탈자 수준입니다.

1. `en.md:106` — `"There is a type of type 😂"` → 재귀적 의미("타입도 타입 객체를 가진다")가 잘 전달되지 않음. 제안: `"Even types have a type 😂"`
2. `ko.md:122, 251` — `"python"` 소문자 표기(문서 전체는 "Python") → 대문자로 통일.
3. `ko.md:668` — `"것 처럼"` → 붙여쓰기 오류. 제안: `"것처럼"`
4. `ko.md:434` — `"전역테이블"`/`"인터닝 되어"`/`"등록되어있어서"`가 L398의 표기(`"전역 테이블"`, `"인터닝되지"`)와 띄어쓰기가 뒤섞여 불일치. 제안: `"인터닝되어 전역 테이블에 등록되어 있어서"`로 통일.
5. (참고, 저심각도) `print()`/f-string 안의 출력 문자열 리터럴이 ko/en에서 서로 다른 텍스트로 현지화되어 있음(로직 자체는 동일) — 별도 수정 불필요.

---

## src/content/posts/python/02-variables-are-name-tags (ko.md / en.md)

구조·코드(실행 로직)는 완전히 일치, 의미상 드리프트도 없음. 이슈는 전부 ko.md 표현 품질입니다.

1. `ko.md:114` — `"되풀어"` → 표준어가 아닌 조어. 제안: `"다시 풀어서"`
2. `ko.md:116` — `"dis 라이브러리"` → 바로 위(L112~114)에서는 "모듈"로 정확히 부르다가 여기서만 "라이브러리"로 바뀌어 용어 불일치, 어순도 "dis가 컴파일한다"로 오독될 수 있음. 제안: `"이미 컴파일된 바이트코드를 dis 모듈로 디스어셈블한 결과"`
3. `ko.md:139` — `"딕셔너리 또는 커스텀할 수 있습니다"` → 비문(명사-동사구 병렬 불일치). 제안: `"딕셔너리이거나 커스텀 매핑일 수 있습니다"`
4. `ko.md:239` — `"python 확장모듈"` 소문자 표기(문서 전체는 "Python") → 대문자로 통일.
5. `ko.md:239` — `"것 뿐이지"` → 붙여쓰기 오류. 제안: `"것뿐이지"`

en.md는 표현상 이상 없음. 참고로 ko/en 공통으로 `IMPORT_MODULE`이라는 opcode명이 등장하는데 실제 CPython bytecode 명칭은 `IMPORT_NAME`입니다(양쪽 언어에 동일하게 있어 드리프트는 아니지만 사실관계상 확인 필요).

---

## src/content/projects/relu-soft/west-side-barbell-club/01-about-canjugate (ko.md / en.md)

헤딩 12개·표·이미지는 구조적으로 일치. 아래는 내용/표현 이슈입니다.

### 드리프트

1. `en.md:54` — `"...the best of all methods"`가 ko(`근내·근간 협응 향상`)에 없는 평가를 임의로 추가. 제안: 해당 문구 삭제.
2. `en.md:130` — `"Fail to say which one you mean and every calculation downstream is wrong."`가 ko(L132)에 없는 경고 문장 추가. 제안: 삭제.
3. `en.md:126` — ko(L128)의 "모멘트 암(moment arm)이 달라지고" 부분이 생략되고 `"force ... changes with joint angle"`로 단순화됨. 제안: moment arm 언급 보강.

### 표현 품질

4. `en.md:94` — `"Westside sets one more than 90% of the time."` → 비문/지시 대상 불분명. 제안: `"Westside reportedly hits a new record more than 90% of the time."`
5. `ko.md:17, 107` — `"WestSide Barbell"`(대문자 S)이 문서 내 다른 곳(`"Westside Barbell"`)과 표기 불일치. 통일 필요.
6. `ko.md:158` — `"매 주"`/`"3주동안"` 띄어쓰기가 문서 다른 곳(`"매주"`)과 불일치. 제안: `"매주 금요일 3주 동안..."`
7. `ko.md:126` 소제목 — 쉼표 위치로 인한 비문. 제안: `"바벨 중량만으로는 부족한 전 구간의 장력을 보충해줍니다."`

---

## src/content/projects/relu-soft/west-side-barbell-club/02-raise-a-prob-and-sol (ko.md / en.md)

섹션 구성·표·이미지(`requirement-gap.ko.svg`/`.en.svg`) 모두 1:1 일치, 의미 드리프트 없음. en.md 표현도 자연스러움.

1. `ko.md:39` — `"것(ex. [OpenCap](...)) 은"` → 괄호 뒤 불필요한 공백. 제안: `"것(ex. [OpenCap](...))은"`
2. `ko.md:39` (스타일 제안, 경미) — `"ex."` → 한국어 본문이므로 `"예:"`가 더 자연스러움.

---

## src/content/experiences/code-it/code-it (ko.mdx / en.mdx)

헤딩·표·`DocLinks` 사용·이미지(`roadmap.ko.svg`/`.en.svg` 언어별 참조 정상) 모두 구조적으로 이상 없음.

### 드리프트

1. **전공명 불일치(사실 오류)** — `ko.mdx`: `"컴퓨터 공학 전공자"` vs `en.mdx`: `"computer science major"`. "컴퓨터 공학"은 computer *engineering*이므로 서로 다른 전공명. 제안: `"computer engineering major"`
2. **뉘앙스 반전** — `ko.mdx`: `"모든 사람이 부상없이 즐겁게 운동하는 세상"` vs `en.mdx`: `"everyone can train hard without getting hurt"` — 핵심인 "즐겁게(joyfully)"가 빠지고 원문에 없던 "hard"가 추가되어 취지가 달라짐. 제안: `"everyone can exercise joyfully, without getting hurt"`
3. **로드맵 표 "사전" 행 축소** — `ko.mdx`: `"개강 전 사전 학습"` vs `en.mdx`: `"before the start date"` — "사전 학습(준비 학습)" 의미가 단순 시점 표현으로 축소됨. 제안: `"self-study before the start date"`

### 표현 품질

4. `ko.mdx` — `"기술으로"` → 조사 오용. 제안: `"기술로"`
5. `ko.mdx` — `"부상없이"` → 띄어쓰기 오류. 제안: `"부상 없이"`
6. **공통 오탈자** — `"Canjugate System"` (정확한 명칭은 "Conjugate System"). 같은 저장소의 `projects/relu-soft/west-side-barbell-club/01-about-canjugate`에서는 정확히 "Conjugate System"으로 표기하고 있어 이 문서에서만 오기됨 확인. **ko.mdx·en.mdx 둘 다 수정 필요.**
7. `en.mdx` — `"measurement rows"` → 해당 섹션은 표가 아니라 불릿 리스트이므로 부정확. 제안: `"measurement items/fields"`
8. `en.mdx` — `"far easier for people to reach"` → 어색한 연어. 제안: `"far more accessible to more people"`

---

## Discord 알림

`DISCORD_WEBHOOK_URL`이 설정되어 있어 위 요약을 Discord로 전송했습니다.
