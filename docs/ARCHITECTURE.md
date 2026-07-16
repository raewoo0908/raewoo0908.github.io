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

본문뿐 아니라 네비 라벨·제목 등 사이트 크롬도 동일한 `data-lang-block` 방식으로 한/영을 동시에 포함한다.

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

## 스타일 시스템

`tokens.css`가 폰트·글자 크기·색상·레이아웃 폭을 CSS 변수로 정의하는 **단일 소스**다. `--font-size-base`, `--scale-ratio` 하나만 바꿔도 본문·제목이 배율에 맞춰 함께 조정된다.

## 빌드 · 배포

- `output: static` — 서버 없이 완전 정적. `site: https://raewoo0908.github.io`, `base: /`.
- `main` push → GitHub Actions(`withastro/action`)가 빌드 → `actions/deploy-pages`로 게시.
