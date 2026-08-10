# ko/en 이중언어 점검 리포트 — 2026-08-10

## 요약

`src/content/` 아래 **ko.md/en.md 짝 13개**를 전수 점검했습니다(pages 2 + posts/claude 5 + posts/git 1 + posts/python 3 + projects/relu-soft 2).

| 폴더 | 글 수 | 드리프트 | 표현 지적 | 사실점검 지적(claude/*) | 기술 정확성(참고) |
| --- | --- | --- | --- | --- | --- |
| pages (cv, home) | 2 | 3 | 1 | - | - |
| posts/claude (hook, intro-automation, loop, routine, worktree) | 5 | **6**(worktree, 실제 미번역) | 0 | 4건 확인 필요(hook) | - |
| posts/git (worktree) | 1 | 0 | 7 | 해당 없음(예시 인용만) | - |
| posts/python (01, 02, 03) | 3 | 0(로직 기준) | 9 | - | 4건(참고용, ko/en 동일) |
| projects/relu-soft (01, 02) | 2 | 0 | 3(경미) | - | - |
| **합계** | **13** | **9** | **20** | **4건 확인 필요** | **4건** |

- **가장 심각한 발견**: `posts/claude/worktree`의 `en.md`에 예시 코드 주석·인용 프롬프트가 **번역되지 않고 한국어 그대로 남아** 있습니다(6개 지점). 영어 독자가 그대로 보게 되는 실질적 결함이라 우선 수정을 권장합니다.
- 구조적 위반(헤딩 개수·순서, 표, 코드블록 실행 로직, 이미지 언어쌍 참조)은 모든 글에서 **이상 없음** — pre-commit 훅이 이미 강제하고 있어 예상된 결과입니다.
- `posts/claude/hook`에서 timeout 기본값·`CLAUDE_EFFORT` 값 목록·hook 이벤트 개수 등 세부 사실 서술이 공식 문서보다 불완전하거나 버전에 따라 달라 보이는 지점이 있습니다. 심각한 오류는 아니나 보강을 권장합니다.
- 그 외 대부분은 "구조는 맞지만 뉘앙스가 미묘하게 다른" 경미한 표현 다듬기 수준입니다.

---

## src/content/pages/cv (ko.md / en.md)

### 드리프트 — en에만 추가된 구체적 진술·과장 표현

1. **성능 최적화 서술에 원문에 없는 구현 디테일 추가**
   - `en.md`: `refactored it into a non-transactional facade with a guaranteed outbox.`
   - `ko.md`: `트랜잭션 범위를 조정해 아웃박스 패턴으로 리팩터링.`
   - 제안: 사실이면 ko에도 동일한 구체성을 반영, 아니면 en을 `refactored it into a facade with a reworked transaction scope backed by an outbox pattern.`로 완화.

2. **CI/CD 서술에 주관적 강도 수식어 추가**
   - `en.md`: `Designed and deployed a robust pipeline using GitHub Actions for CI, ... for seamless CD.`
   - `ko.md`: `...파이프라인을 설계·구축.` (robust/seamless에 해당하는 표현 없음)
   - 제안: en에서 `robust`/`seamless` 제거하거나 ko에 상응 표현 추가.

3. **팀 리딩 서술에 "cross-functional"·"centralized" 추가**
   - `en.md`: `Led a 6-member cross-functional team, establishing a centralized Notion workspace...`
   - `ko.md`: `6인 팀을 이끌며 Notion 워크스페이스로 협업 체계를 정비하고...`
   - 제안: 사실이면 ko에도 반영, 아니면 en에서 제거.

그 외 헤딩·표(경력/학력/수상)·날짜·수치(69%→0%, 453ms→139ms 등)·코스워크 11개·`i18n-intentional` 마커가 붙은 포트폴리오 링크는 모두 일치 — 이상 없음.

### 표현 점검

이상 없음(비문·오탈자 없음). 위 드리프트 항목이 곧 표현 강도 차이이기도 합니다.

---

## src/content/pages/home (ko.md / en.md)

### 드리프트

이상 없음 — 문장 단위 1:1 대응, 4개 불릿 순서·내용 일치.

### 표현 점검

1. `en.md`: `🛠️ **Projects** — write-ups on my projects` — 헤딩과 본문에 "projects"가 중복되어 다소 어색함(필수 수정 아님). 제안: `write-ups on projects I've built`.

---

## src/content/posts/claude/hook (ko.md / en.md)

### 드리프트

이상 없음 — 헤딩·섹션·코드블록·이미지 참조 완전히 일치.

### 표현 점검

이상 없음.

### 사실 점검 — 확인 필요 4건

1. **`timeout` 기본값 설명 불완전**
   - 글: `command` 타입 기본값이 600초라고만 설명.
   - 공식 문서(hooks reference): `command`/`http`/`mcp_tool`은 600초지만 `prompt`는 30초, `agent`는 60초, `UserPromptSubmit`은 30초로 단축 등 타입별로 다름.
   - 제안: "command 타입 기본값은 600초, 타입별로 다름" 정도로 보강.

2. **`$CLAUDE_EFFORT` 가능한 값 미명시**
   - 글: "현재 추론 강도"라고만 설명.
   - 공식 문서: `"low"`, `"medium"`, `"high"`, `"xhigh"`, `"max"` 5가지 값 명시.
   - 제안: 구체적 값 나열 추가.

3. **hook 이벤트 개수 "31종" — 확인 불가/버전에 따라 다름**
   - 글: "실제로는 31종입니다."
   - 이번 점검 에이전트가 공식 문서에서 센 결과는 30개였습니다. (참고: 지난 8/3 리포트에서는 반대로 "30종이라 적혀 있는데 실제 31종"이라고 지적된 바 있어, 문서가 그 사이 개정되었거나 집계 기준이 갈릴 수 있습니다.) **문서에서 확실히 확정하지 못했습니다** — 정확한 최신 개수를 공식 문서에서 재확인 후 반영을 권장합니다.

4. **`stop_hook_active` 필드 — 문서에서 확인 불가**
   - 글: stdin JSON의 `stop_hook_active` 플래그로 Stop 훅 재진입을 막아야 한다고 설명(저장소 자체 스크립트에서도 실사용 중).
   - 공식 문서의 Hook Input 필드 목록에서 이 필드가 명시적으로 확인되지 않았습니다. **문서에서 확인 불가** — 실무적으로는 동작하는 것으로 보이나 공식 레퍼런스 문구로 보증되지 않는다는 점만 표기해두는 편이 안전합니다.

나머지(이벤트 이름, 종료코드 0/2/기타, hook type 5종 `command`/`http`/`mcp_tool`/`prompt`/`agent`, matcher 정규식 규칙, 환경변수 목록)는 공식 문서로 확인됨.

---

## src/content/posts/claude/intro-automation-hook-loop-routine (ko.md / en.md)

이상 없음. 드리프트·표현·사실점검 모두 문제 없음 — hook 4대 이벤트, `.claude/settings.json`, `/loop` 7일 만료·세 모드·`.claude/loop.md`·`--resume`, routine(research preview 단계, 3가지 트리거, Anthropic 클라우드 실행) 서술 전부 공식 문서(https://code.claude.com/docs/en/hooks, /scheduled-tasks, /routines)와 일치 확인.

---

## src/content/posts/claude/loop (ko.md / en.md)

이상 없음. 드리프트·표현 문제 없음. 사실점검(간격 단위 s/m/h/d, 최소 1분 올림, 동적 모드 1분~1시간, 7일 만료, `ScheduleWakeup`/`Monitor` 도구, 세션당 최대 50개, 지터 최대 30분, `loop.md` 25,000바이트 제한, 세션 스코프, `CLAUDE_CODE_DISABLE_CRON` 등) 전부 공식 문서(https://code.claude.com/docs/en/scheduled-tasks)와 일치 확인.

---

## src/content/posts/claude/routine (ko.md / en.md)

### 드리프트

경미 — ko.md 436~437줄 부근 테이블 직전에 en.md와 달리 빈 줄이 없어 두 파일 마크다운 구조가 살짝 다릅니다(렌더링에는 영향 없음). 통일하려면 ko.md에도 빈 줄 추가 권장.

### 표현 점검

이상 없음.

### 사실 점검

이상 없음 — trigger 3종(cron/API/GitHub), cron UTC 변환, 최소 간격 1시간, 실행 stagger, 연결된 커넥터 기본 포함, 로컬 MCP 서버 클라우드 미지원, Trusted 허용목록(github.com, code.claude.com 포함), `claude/` 접두 브랜치 자동 통과, one-off 실행 일일 한도 제외, green status의 의미(인프라 성공≠작업 성공), `/schedule update` 커스텀 cron 설정 — 모두 공식 문서(https://code.claude.com/docs/en/routines, /claude-code-on-the-web)로 확인됨.

---

## src/content/posts/claude/worktree (ko.md / en.md)

### 드리프트 — en.md에 번역되지 않은 한국어 잔존 (직접 확인 완료)

`en.md`의 코드블록 주석·예시 인용문이 한국어 그대로 남아 있습니다. 실제 명령어 출력(예: `git log`/`git branch` 결과의 커밋 메시지)은 저자가 실습한 진짜 데모 저장소 기록이라 ko/en 양쪽에 동일하게 남아 있는 게 맞지만(참고: `posts/git/worktree`에서도 같은 방식), 아래는 **저자가 직접 쓴 설명용 주석·예시 텍스트**라 번역이 필요합니다.

1. **`en.md` 16~20줄** — 도입부 코드블록 주석이 한글:
   ```bash
   git worktree add ../demo-login -b feature-login   # 책상 놓기 (여기까진 1초)
   cd ../demo-login                                  # 옮겨 앉기
   npm install                                       # 빈 책상이라 처음부터
   cp ../demo/.env .                                 # 원본에서 손으로 복사
   claude                                            # 그리고 다시 실행
   ```
   제안: `# Set up desk (~1s)` / `# Sit down` / `# Fresh checkout, start over` / `# Copy from the original` / `# And run it again` 식으로 번역.

2. **`en.md` 349줄** — 예시 프롬프트 인용문이 한글: `에이전트들은 워크트리를 써서 작업해줘`
   제안: `have the agents use worktrees` 또는 `use worktrees for your agents`.

3. **`en.md` 390, 394줄** — 코드블록 주석이 한글:
   ```bash
   # 파일을 하나 만들고 끝낸 에이전트 → 남는다
   ...
   # pwd 만 찍고 끝낸 에이전트 → 흔적도 없다
   ```
   제안: `# Agent that finished after creating one file → stays` / `# Agent that only ran pwd → no trace left`.

4. **`en.md` 419, 422줄** — 코드블록 주석이 한글: `# 터미널 A`, `# 터미널 B`
   제안: `# Terminal A`, `# Terminal B`.

5. **`en.md` 479줄** — 예시 프롬프트 인용문이 한글: `이건 워크트리에서 하자`
   제안: `let's work in a worktree` 또는 `do this in a worktree`.

6. **`en.md` 502~506줄** — 코드블록 주석 전부 한글, 자리표시자도 `<이름>`(한글):
   ```bash
   git worktree list                                    # 뭐가 남았나
   git worktree unlock  .claude/worktrees/<이름>         # lock 이 남아 있으면
   git worktree remove  .claude/worktrees/<이름>         # 깨끗할 때
   git worktree remove --force .claude/worktrees/<이름>  # 변경·미추적 파일이 있을 때
   git branch -D worktree-<이름>                         # 브랜치는 따로 지워야 한다
   ```
   제안: 주석을 `# See what's left` / `# If a lock remains` / `# When it's clean` / `# With uncommitted or untracked changes` / `# Delete the branch separately`로, `<이름>`은 `<name>`으로.

### 표현 점검

이상 없음(한글 잔존 제외) — "desk" 메타포 일관 사용, 비문 없음.

### 사실 점검

이상 없음 — `claude -w <name>`, `.claude/worktrees/<name>/`, 브랜치명 `worktree-<name>`, `worktree.baseRef`(`fresh`/`head`), 24시간·5초 제한 원격 fetch, `.worktreeinclude`, `EnterWorktree`/`ExitWorktree`, `isolation: worktree` frontmatter, `cleanupPeriodDays`, `-p` 모드 미정리, 워크트리 보호장치 3종, 서브에이전트 워크트리 자동 정리, 주기 청소가 `-w` 워크트리는 건드리지 않음, `--resume` 재진입 — 모두 공식 문서(https://code.claude.com/docs/en/worktrees)로 확인됨.

---

## src/content/posts/git/worktree (ko.md / en.md)

Claude Code와 무관한 순수 git worktree 설명 글입니다.

### 드리프트

이상 없음 — 헤딩 5개·콜아웃 2개·코드블록/다이어그램 6개·이미지 참조 4개 모두 대응. 줄 수 차이(203 vs 204)는 내용이 아니라 파일 끝 개행 유무일 뿐.

### 표현 점검

**en.md**
1. 12줄 — `environment file like .env` → 복수 뉘앙스인 ko 원문에 비해 단수. 제안: `environment files like .env`.
2. 112줄 — `pulls a filesystem trick` → "속임수를 쓰다"라는 관용구라 어색. 제안: `uses a filesystem trick`.
3. 155줄 — `handled differently, and permissioned differently` → `permissioned`를 동사로 쓴 게 부자연스러움. 제안: `handled differently, and their permissions are set differently`.
4. 186줄 — `commits ... — they're an independent database` → 복수 주어와 단수 명사 연결이 어색. 제안: `they form an independent database`.

**ko.md**
5. 176줄 — `있는 지도`가 "있는지도"의 오분리 표기(붙여쓰기 필요, "지도(map)"로 오독 소지). 또 같은 줄의 "워크 트리"가 글 전체에서 쓰는 "워크트리"(붙여쓰기)와 불일치.
6. 10, 178줄 — `해야하는`/`해야하지` → 표준 맞춤법상 `해야 하는`/`해야 하지`로 띄어쓰기 권장(반복 패턴).

### 사실 점검

Claude Code 관련 설정 키·커맨드 서술은 없고, 166~175줄의 터미널 예시(ko/en 동일)에 저자의 실제 브랜치명(`claude/*`)과 워크트리 경로(`.claude/worktrees/*`)가 예시로 노출되어 있습니다. 별도 검증 대상이 아니라 그대로 인용만 보고합니다(요청 사항이었던 설정 키·환경변수·기본값 등 서술은 이 글에 없음).

---

## src/content/posts/python/01-everything-is-an-object (ko.md / en.md)

### 드리프트

이상 없음 — 헤딩 22개·코드펜스 102개·이미지 14쌍·표 3개·참고자료 링크 모두 일치, 코드 실행 결과값도 동일. 줄 수 차이(931 vs 935)는 순수 공백줄 스타일 차이(en.md가 코드펜스 뒤 빈 줄을 더 자주 넣음)로 내용과 무관.

### 표현 점검

1. `ko.md` 122, 137줄 — `갖고있어야 하는`/`갖고있는` → 표준 띄어쓰기는 `갖고 있어야 하는`/`갖고 있는`(경미한 오탈자 수준).
2. `en.md` 9줄(헤딩) — `Getting started — Python has no primitive types at all` ← ko `들어가며`(Introduction에 대응). "Getting started"는 설치·설정 튜토리얼 뉘앙스가 강해 이 글의 개념 설명 도입부와 약간 어긋남. 제안: `Introduction —`.

### 기술적 정확성 (ko/en 동일 서술, 번역 문제 아님 — 참고용)

3. 2.1절 "digit이 32bit 중 앞 2bit를 곱셈을 위해 비워둔다"는 설명은 다소 단순화됨 — 실제로 두 digit의 곱은 64비트 `twodigits`에 저장되어 곱셈 자체는 32비트 오버플로 우려가 없고, 30비트로 설계한 이유는 덧셈/뺄셈 캐리 전파 여유에 더 가깝습니다.

---

## src/content/posts/python/02-variables-are-name-tags (ko.md / en.md)

### 드리프트

이상 없음 — 헤딩 8개·코드펜스 22개·이미지 7개·표 21행 모두 정확히 대응, 332줄로 동일.

### 표현 점검

1. `ko.md` 237줄 — `"...이름들이 있고 함수가 있는지는..."` → 병렬 구조 어색. 제안: `"...어떤 이름·함수가 있는지는..."`.
2. `ko.md` 215줄 — 이탤릭 삽입구 뒤에 조사 "을"이 바로 붙어 다소 어색(경미).

### 기술적 정확성 (ko/en 동일 서술, 참고용)

3. 237줄 콜아웃 — "순수 파이썬 모듈은 import문이 실행되는 시점에 컴파일된다"는 설명에서 "컴파일 시점"이 핵심 논지가 아니라 실제로는 "모듈 최상단 코드가 실행되는 시점"이 핵심입니다(이미 `.pyc` 캐시가 있으면 재컴파일 없이 로드만 됨). 글의 핵심 논지에는 영향 없는 수준.

---

## src/content/posts/python/03-the-inside-story-of-if (ko.md / en.md)

### 드리프트

이상 없음 — 헤딩·코드블록·이미지 참조(5쌍) 모두 대응, 코드/바이트코드 출력 동일.

### 표현 점검

**ko.md**
1. 37줄 — `한가지` → `한 가지`(띄어쓰기).
2. 53줄 — `구현되어있는 지` → `구현되어 있는지`(띄어쓰기 위치 오류).
3. 505줄 — `정리하면 ... 정리됩니다` 한 문장 내 중복. 제안: `요약하면, 들어가며 절의 예시들은 이렇게 나뉩니다.`
4. 580줄 — "상수 캐시로 취급" → 5절에서 다룬 건 "상수 폴딩"이지 캐싱이 아니므로 "상수로 취급해서"가 더 정확(en.md는 이미 이렇게 옮겨져 있음).

**en.md**
5. 237줄 — `hands back return 1` → 코드 구문과 서술이 어색하게 섞인 직역투. 제안: `returns 1 by default`.
6. 237줄 다음 문장 — `handed back return 0` → 같은 패턴. 제안: `returned 0 instead`.

### 기술적 정확성 (ko/en 동일 서술, 참고용)

7. 446줄 — "8바이트(2\*\*64)를 넘으면 안 됨" → `Py_ssize_t`는 부호 있는 정수라 실제 상한은 `2**63-1`. `2**64`는 부호 없는 최대값이라 혼동 소지.
8. 355줄 — "`range`는 시작과 끝이 같은가만 본다" → 실제로는 계산된 `length`가 0인지를 보며, "시작=끝"은 step=1일 때만 성립하는 단순화.

---

## src/content/projects/relu-soft/west-side-barbell-club/01-about-conjugate (ko.md / en.md)

### 드리프트

이상 없음 — 헤딩 12개·표 7개(행·수치 모두 일치)·이미지 5쌍 전수 대조. 196 vs 194줄 차이는 인용구를 다루는 방식(en은 이미 영어라 번역 줄이 불필요) 때문으로 내용 손실 아님.

### 표현 점검(경미)

1. `en.md` 76줄 — `at 12–24`에서 단위 "hours" 생략(문맥상 이해 가능, 명확성을 위해 `at 12–24 hours` 권장).
2. `en.md` 15줄 — `rough to carry by hand`가 다소 구어적(`tough to manage by hand` 제안, 필수 아님).
3. `en.md` 130줄 — ko "이중 구조"의 뉘앙스가 "two numbers"로 살짝 옅어졌으나 바로 뒤 설명으로 의미 손실 없음.

---

## src/content/projects/relu-soft/west-side-barbell-club/02-raise-a-prob-and-sol (ko.md / en.md)

이상 없음. 헤딩 5개(순서·계층 일치), 인용구 3개·표 3행·리스트 항목 수 모두 일치, 이미지(`requirement-gap.ko.svg`/`.en.svg`) 정상. 직역투·비문·오탈자 없음.

---

## 확인 불가로 남긴 항목 정리

- `posts/claude/hook`의 hook 이벤트 정확한 개수(글: 31종, 이번 점검: 문서상 30개 카운트) — **공식 문서에서 확정하지 못함**, 재확인 권장.
- `posts/claude/hook`의 `stop_hook_active` stdin 필드 — **공식 Hook Input 필드 목록에서 확인 불가**(실무 동작은 확인됨).

이 외 모든 Claude Code 관련 서술(설정 키, hook 이벤트, 슬래시 커맨드, 환경변수, 기본값·제한값)은 https://code.claude.com/docs/en/ 하위 문서(hooks, hooks-guide, settings, scheduled-tasks, routines, worktrees, claude-code-on-the-web)로 확인 완료입니다.

---

## Discord

`DISCORD_WEBHOOK_URL` 미설정 — 전송 생략.
