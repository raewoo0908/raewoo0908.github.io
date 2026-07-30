# 아키텍처

**Astro 7** 기반 정적 사이트. 한/영 이중언어 블로그이며, 빌드 결과는 순수 정적 파일(HTML/CSS/JS)로 GitHub Pages에 배포된다.

## 디렉토리 구조

```
src/
├── content/              # 콘텐츠(마크다운) — 폴더 = 카테고리
│   ├── posts/<cat>/<slug>/{ko.md,en.md}
│   ├── projects/<cat>/<slug>/{ko.md,en.md}
│   ├── experiences/<cat>/<slug>/{ko.md,en.md}
│   └── pages/{home,cv}/{ko.md,en.md}
├── content.config.ts     # 컬렉션 스키마(zod) + glob 로더
├── lib/                  # 순수 로직(프레임워크 비의존)
│   ├── content.ts        # ko/en 폴더 → 언어중립 문서 그룹핑
│   ├── categories.ts     # 폴더 → 카테고리 트리
│   ├── i18n.ts           # 로케일 상수 + UI 라벨(한/영)
│   └── url.ts            # base 경로 헬퍼
├── components/           # UI 컴포넌트
│   ├── Nav.astro / NavTree.astro     # 상단 네비 + 카테고리 드롭다운(재귀)
│   ├── LangToggle.astro              # 한/영 토글 버튼
│   ├── Bilingual.astro               # 한/영 본문 동시 렌더
│   ├── DocList.astro / BiText.astro  # 목록 카드 / 한영 텍스트
│   ├── Comments.astro                # giscus 댓글·리액션(글 상세 전용)
│   └── Prose.astro                   # 본문 래퍼 + 코드 복사 스크립트
├── layouts/
│   └── BaseLayout.astro  # <head>(FOUC 스크립트·폰트·메타) + 헤더/푸터
├── pages/                # 라우트
│   ├── index.astro                   # / (홈)
│   ├── cv.astro                      # /cv
│   └── [collection]/
│       ├── index.astro               # /posts, /projects, /experiences (랜딩)
│       └── [...path].astro           # 글 상세 + 카테고리 리스팅(언어중립 URL)
└── styles/
    ├── tokens.css        # 폰트·크기·색상 CSS 변수(단일 소스)
    └── global.css        # 전역 스타일 + 언어 표시/숨김 규칙
```

## 언어 모델 (핵심)

언어는 **URL이 아니라 클라이언트 상태**다. 로케일별 URL 트리(`/en/…`)는 존재하지 않는다.

1. 각 글은 소스에서 `ko.md`/`en.md`로 분리되지만, 빌드 결과는 **언어중립 URL 1개**의 페이지다.
2. 그 페이지 HTML에는 `[data-lang-block="ko"]`와 `[data-lang-block="en"]` 두 블록이 **모두** 정적으로 렌더된다.
3. CSS가 활성 언어 블록만 표시한다:
   ```css
   [data-lang-block] { display: none; }
   html[data-lang='ko'] [data-lang-block='ko'],
   html[data-lang='en'] [data-lang-block='en'] { display: revert; }
   html:not([data-lang]) [data-lang-block='ko'] { display: revert; } /* JS 없으면 한국어 */
   ```
4. `BaseLayout`의 `<head>` **인라인 스크립트**가 렌더 전에 `localStorage.lang`을 읽어 `<html data-lang>`을 설정 → 깜빡임(FOUC) 없음.
5. `LangToggle`이 `<html data-lang>`을 뒤집고 `localStorage`에 저장 → 페이지를 이동해도 언어가 유지된다.

본문뿐 아니라 네비 라벨·제목 등 사이트 크롬도 동일한 `data-lang-block` 방식으로 한/영을 동시에 포함한다. **유일한 예외가 giscus 댓글 위젯**이다(iframe이라 CSS가 닿지 않는다) — 아래 '댓글 · 리액션' 절 참고.

## 콘텐츠 → 라우트 데이터 흐름

```
src/content/posts/algorithms/hello/ko.md   (id: algorithms/hello/ko)
src/content/posts/algorithms/hello/en.md   (id: algorithms/hello/en)
        │  getCollection() + glob 로더
        ▼
lib/content.ts  getBilingualDocs()
  · id 뒤 세그먼트(ko|en)로 언어 판별
  · 나머지 경로로 그룹핑 → path 'algorithms/hello'
  · slug='hello', categorySegments=['algorithms']
        ▼
BilingualDoc { path, slug, categorySegments, entries:{ko,en}, title, date, ... }
        │
        ├─ lib/categories.ts → 카테고리 트리(네비/랜딩)
        └─ pages/[collection]/[...path].astro
              · getStaticPaths: 글 경로 + 카테고리 경로 생성
              · Bilingual( ko=entries.ko, en=entries.en ) → render() 각각
              ▼
        /posts/algorithms/hello (언어중립 URL, 한/영 블록 동시 포함)
```

## 렌더링 파이프라인

- **마크다운/MDX**: `@astrojs/mdx`. 이미지·이모지·표·콜아웃 자유.
- **코드 하이라이팅**: Shiki(`github-light`). `astro.config.mjs`의 transformer가 `<pre>`에 `data-language`를 심고, `Prose.astro`의 클라이언트 스크립트가 언어 라벨 + 복사 버튼 UI를 붙인다.
- **폰트**: Pretendard(한글)·Inter(라틴)·JetBrains Mono(코드)를 `@fontsource`로 자체 호스팅(외부 CDN 미사용).

## 댓글 · 리액션 (giscus)

`Comments.astro` 하나가 전부다. 저장소는 별도 레포 `raewoo0908/blog-comments`의 GitHub Discussions이고 **우리 쪽 서버·DB·시크릿은 없다**(선택 근거는 ADR-007).

- **붙는 위치**: `pages/[collection]/[...path].astro`의 `kind === 'doc'` 분기. 이 분기가 `posts`·`projects`·`experiences` 세 컬렉션이 공유하는 단 하나의 경로라 한 줄로 셋 다 커버된다. 카테고리 리스팅은 `else` 분기이고 `cv.astro`·`index.astro`는 이 컴포넌트를 쓰지 않으므로 **자동 제외**된다.
- **좋아요 = 리액션 바**: `reactions-enabled=1`이 위젯 상단에 👍❤️🎉 바를 띄운다. 이것이 좋아요 역할을 한다.

### 언어 처리 — 이 블로그의 유일한 예외

giscus는 iframe이므로 `data-lang-block` CSS로 다룰 수 없고, **ko/en 두 인스턴스를 띄우면 댓글 스레드가 갈라진다**(금지). 그래서 위젯은 **언어중립 인스턴스 하나**만 둔다. 언어중립 URL 1개 정책과 `mapping=pathname`이 맞물려 한/영 댓글이 자연히 한 스레드에 모인다.

1. **초기 언어**: 언어는 `localStorage` 기반 클라이언트 상태라 빌드 타임에 알 수 없다 → 정적 `<script data-lang="…">` 로는 첫 렌더 언어를 맞출 수 없다. 그래서 인라인 스크립트가 `documentElement.dataset.lang`을 읽어 `data-*` 속성을 채운 뒤 giscus `client.js`를 **동적으로 삽입**한다(client.js는 자기 script 태그 자리에 iframe을 꽂는다).
2. **전환**: `MutationObserver`가 `html[data-lang]`만 감시해 `postMessage({giscus:{setConfig:{lang}}})`를 보낸다. `LangToggle`은 `data-lang`만 뒤집으므로 **수정할 필요가 없다**(관심사 분리).
3. **lazy 대응**: iframe이 `loading=lazy`라 토글 시점에 아직 없을 수 있다. 원하는 값(`desired`)과 반영된 값(`applied`)을 따로 들고, giscus가 준비되어 보내오는 `message` 이벤트에서 재시도한다. `applied`를 두지 않으면 giscus가 리사이즈마다 보내는 메시지에 반응해 `setConfig`가 **무한 왕복**한다.

> ⚠️ `mapping=pathname`이라 `localhost:4321/posts/x/`와 프로덕션이 **같은 스레드**를 쓴다. 개발 중 남긴 댓글·리액션은 실제로 공개된다. 정리는 `blog-comments` 레포 Discussions에서 스레드를 삭제하면 된다(레포 소유자라 방문자 댓글도 삭제·숨김·차단이 가능하다).

## 스타일 시스템

`tokens.css`가 폰트·글자 크기·색상·레이아웃 폭을 CSS 변수로 정의하는 **단일 소스**다. `--font-size-base`, `--scale-ratio` 하나만 바꿔도 본문·제목이 배율에 맞춰 함께 조정된다.

## 빌드 · 배포

- `output: static` — 서버 없이 완전 정적. `site: https://raewoo0908.github.io`, `base: /`.
- `main` push → GitHub Actions(`withastro/action`)가 빌드 → `actions/deploy-pages`로 게시.
