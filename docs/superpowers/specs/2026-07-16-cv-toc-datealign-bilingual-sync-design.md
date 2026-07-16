# CV 우측 목차 · 날짜 정렬 · ko/en 동기화 훅 — 설계

- 작성일: 2026-07-16
- 상태: 승인 대기 (사용자 검토용)

## 개요

세 가지 독립적인 개선을 한다.

1. **CV 우측 목차(TOC)** — CV 페이지 오른쪽에 현재 언어의 heading 목차를 sticky로 표시하고, 스크롤 위치를 하이라이트한다.
2. **날짜 우측 정렬** — 경력·활동/학력 리스트에서 제목은 왼쪽, 날짜는 오른쪽에 정렬한다(참고: chehun16.github.io).
3. **ko/en 양방향 동기화 훅** — `ko.md`와 `en.md` 중 한쪽만 수정되면 훅이 이를 막는다(git 커밋 + Claude 세션 양쪽).

기존 아키텍처 제약:
- 한/영 본문을 **동시에 DOM에 렌더**하고 `html[data-lang]` + CSS로 활성 언어만 보여준다(`[data-lang-block]`).
- 언어 전환은 `LangToggle`이 `html[data-lang]`을 바꾸는 방식.
- CV 본문은 순수 마크다운(`src/content/pages/cv/{ko,en}.md`), remark/rehype 커스텀 플러그인은 아직 없음(shiki만).
- `.claude/settings.json` 없음 → 신규 생성.

---

## 기능 ① 우측 목차 (CV 전용)

### 컴포넌트
- 신규 `src/components/DocToc.astro` — 재사용 가능한 껍데기 `<nav aria-label>` + 클라이언트 스크립트. 지금은 CV에만 연결한다.

### 레이아웃 (`src/pages/cv.astro`)
- 기존 단일 `.container`(46rem)를 **2단 그리드**로 변경: `[본문] [목차 aside]`.
  - 전체 래퍼 폭 `--wide-width`(64rem), 본문 컬럼은 읽기 좋은 폭(~46rem) 유지, 목차 컬럼 ~14rem.
  - 목차 `<aside>`는 `position: sticky; top: header 아래`.
- 반응형: 화면 폭 < ~1024px이면 목차 숨김(`display:none`), 본문은 중앙 정렬 유지.

### 동작 (클라이언트 스크립트)
- 현재 `html[data-lang]`에 해당하는 **활성 `[data-lang-block]` 안의 h2/h3만** 수집한다(두 언어 블록이 모두 DOM에 있으므로 활성 블록만 대상으로 함).
- 각 heading의 `id`로 앵커 링크 생성. h3는 한 단계 들여쓰기.
- **언어 토글 대응**: `MutationObserver`로 `document.documentElement`의 `data-lang` 변화를 감지 → 목차 재생성 + 라벨("목차" ↔ "On this page") 전환.
- **스크롤 하이라이트**: `IntersectionObserver`로 현재 화면의 heading에 `aria-current`/활성 클래스 부여.
- 클릭 시 해당 heading으로 이동(기존 `scroll-margin-top: header+1rem` 활용).
- heading이 2개 미만이면 목차 전체 숨김.

### 확인 사항
- Astro가 마크다운 heading에 `id`를 자동 부여하는지 빌드 산출물로 확인. 없으면 `rehype-slug`를 추가한다.

### 파일
- 신규: `src/components/DocToc.astro`
- 수정: `src/pages/cv.astro`, `src/styles/global.css`(그리드/목차/반응형 CSS)

---

## 기능 ② 날짜 우측 정렬 (rehype 플러그인)

### 작성 규약
- 리스트/heading 줄 끝에 ` %% <날짜>` 구분자를 쓴다.
  - 예: `- **백엔드 팀장** — 캡스톤 프로젝트: 블록체인 연동 피트니스 플랫폼 %% 2025.07 ~ 2026.06`
- `%%`는 마크다운/smartypants에 의미 없는 토큰이라 안전하다. 날짜는 굵게/링크 없이 순수 텍스트 마지막에 둔다(플러그인이 마지막 텍스트 노드를 처리).

### 플러그인 `src/lib/rehype-doc-date.mjs`
- hast를 순회하며 ` %% `를 포함한 텍스트 노드를 찾는다.
- 마지막 `%%` 기준으로 앞부분은 일반 텍스트로 남기고, 뒷부분을 `<span class="doc-date">…</span>`로 감싼다.
- 해당 노드의 부모(li/h*)에 클래스 `has-doc-date`를 부여(선택적 스타일 훅).
- `astro.config.mjs`의 `markdown.rehypePlugins`에 등록(기존 Astro 기본 플러그인과 합성됨).

### CSS (`src/styles/global.css`)
- `.prose .doc-date { float: right; margin-left: 1rem; color: var(--color-text-muted); font-size: var(--text-sm); white-space: nowrap; font-variant-numeric: tabular-nums; }`
- **float 방식**을 쓰는 이유: 학력의 **중첩 목록**(대학 아래 세부 bullet)이 있는 li에서도 레이아웃이 깨지지 않는다(플렉스는 중첩 ul을 플렉스 아이템으로 만들어 깨짐).

### 적용 범위
- 경력·활동 리스트, 학력 리스트. `cv/ko.md`·`cv/en.md`의 해당 날짜 줄을 `%%` 규약으로 수정.
- (프로젝트 h3 날짜는 이번 범위에서 제외 — 필요 시 동일 규약으로 확장 가능)

### 파일
- 신규: `src/lib/rehype-doc-date.mjs`
- 수정: `astro.config.mjs`, `src/styles/global.css`, `src/content/pages/cv/{ko,en}.md`

---

## 기능 ③ ko/en 양방향 동기화 훅

### 규칙(양방향)
"짝(pair)"의 정의: **같은 폴더 안의 반대 언어 파일**. 즉 어떤 `<dir>/ko.md`의 짝은 오직 `<dir>/en.md`이고 그 반대도 마찬가지다. **폴더가 다르면 짝이 아니다.**

검사는 **변경 집합(= 이번에 실제로 수정/스테이징된 파일)에 들어온 파일만** 대상으로 한다. 한 짝에서 **한쪽만** 변경 집합에 있으면 위반:
- `<dir>/ko.md`는 변경, 짝 `<dir>/en.md`는 미변경 → 위반
- `<dir>/en.md`는 변경, 짝 `<dir>/ko.md`는 미변경 → 위반

**핵심: 양쪽 다 변경되지 않은 짝은 애초에 검사 대상이 아니다**(다른 폴더의 미변경 파일 때문에 오탐이 나지 않는다). 예:
- `pages/cv/ko.md`와 `pages/cv/en.md`를 함께 수정하고 `posts/algorithms/hello/*`는 건드리지 않음 → 변경 집합엔 cv 짝만 있고 둘 다 있으므로 **통과**. `hello`는 변경 집합에 없어 순회조차 되지 않음 → 알림 없음.
- `pages/cv/ko.md`만 수정 → 같은 폴더의 `pages/cv/en.md`가 변경 집합에 없으므로 **위반**.

### 공용 검사 스크립트 `scripts/check-bilingual.sh`
- 표준입력으로 변경된 파일 경로 목록(줄 단위)을 받는다.
- `^src/content/.*/(ko|en)\.md$`만 필터링해 변경 집합 구성.
- 각 변경된 파일 `F`에 대해, **`F`와 같은 디렉터리의 반대 언어 파일**(`dirname(F)/en.md` 또는 `dirname(F)/ko.md`)이 같은 변경 집합에 있는지 확인. 없으면 위반으로 stderr에 출력.
- 변경 집합에 들어오지 않은 폴더의 짝은 순회 대상이 아니므로 검사되지 않는다(다른 폴더의 미변경 파일로 인한 오탐 없음).
- 위반이 하나라도 있으면 exit 1, 없으면 exit 0.

### git pre-commit 훅
- `.githooks/pre-commit`에서 스테이징 목록을 파이프:
  `git diff --cached --name-only --diff-filter=ACMR | scripts/check-bilingual.sh`
- 위반 시 커밋 거부(사람이 수동 편집·커밋해도 적용).
- 설치: `git config core.hooksPath .githooks`(1회). 스크립트는 실행권한 부여(`chmod +x`).

### Claude Code 세션 훅 (`.claude/settings.json`)
- **Stop 훅** — 작업 트리 변경 집합을 검사해 위반이 있으면 턴 종료를 차단하고 짝 파일 동기화를 지시(핵심 강제).
  - 변경 집합: `{ git diff --name-only HEAD; git ls-files --others --exclude-standard; } | sort -u | scripts/check-bilingual.sh`
- **PostToolUse 훅** — `Edit|Write`가 `src/content/**/(ko|en).md`에 적용되면 짝 파일도 갱신하라고 리마인드.
- 정확한 훅 스키마와 차단용 exit code/JSON 출력 형식은 구현 시 `update-config` 스킬로 최신 규격을 확인해 반영한다.

### 문서화
- `CLAUDE.md`에 훅 설치 방법(1회 `git config core.hooksPath .githooks`)과 `%%` 날짜 규약을 한두 줄 추가.

### 파일
- 신규: `scripts/check-bilingual.sh`, `.githooks/pre-commit`, `.claude/settings.json`
- 수정: `CLAUDE.md`

---

## 구현 순서

1. **날짜 정렬**: rehype 플러그인 + config 등록 + CSS + cv 마크다운 수정 → 빌드·미리보기로 정렬 확인.
2. **우측 목차**: DocToc 컴포넌트 + cv.astro 그리드 + CSS → 빌드·미리보기로 토글/스크롤 하이라이트 확인.
3. **동기화 훅**: 공용 스크립트 → git pre-commit(+ hooksPath 설정) → Claude 세션 훅 → 양방향 위반 케이스로 검증.
4. CLAUDE.md 문서화.

## 검증 계획

- `npx astro check`(타입) + `npm run build`(정상 빌드).
- `npm run preview` + 브라우저로: 날짜 우측 정렬(중첩 학력 포함), 목차 표시·언어 토글 재생성·스크롤 하이라이트·반응형 숨김.
- 훅: (a) ko만 stage → 커밋 거부, (b) en만 stage → 커밋 거부, (c) 양쪽 stage → 통과.

## 범위 밖 (YAGNI)

- 글 상세(posts)·프로젝트 페이지의 목차/날짜 정렬(이번엔 CV·활동/학력만).
- 방문자용 목차 접기/폰트 조절 UI.
- ko/en 내용의 의미적 일치 검사(짝 파일이 함께 변경됐는지만 검사; 번역 정확성은 검사하지 않음).
