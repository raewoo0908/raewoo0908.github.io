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
├── assets/emoji/         # 커스텀 이미지 이모지 원본 — 본문에서 `:이름:`으로 부른다
├── lib/                  # 순수 로직(프레임워크 비의존)
│   ├── content.ts        # ko/en 폴더 → 언어중립 문서 그룹핑 + PROD draft 제외 + 날짜 정렬
│   ├── categories.ts     # 폴더 → 카테고리 트리
│   ├── i18n.ts           # 로케일 상수 + UI 라벨(한/영)
│   ├── url.ts            # base 경로 헬퍼
│   ├── toc.ts            # 헤딩 목록 → 계층형 목차 트리
│   ├── emoji-syntax.mjs        # `:이름:` 토큰 규칙 단일 소스(remark 플러그인·Astro 공용)
│   ├── remark-image-emoji.mjs  # 본문 `:이름:` → 이미지. remark 단계여야 이미지 최적화를 탄다
│   ├── remark-image-size.mjs   # 이미지 제목 슬롯 `"w=320"` → 폭 지정(px면 실제 리사이즈)
│   ├── emoji.ts                # 파이프라인 밖 문자열(제목·목차)용 `:이름:` → HTML
│   └── rehype-doc-date.mjs     # 줄 끝 ` %% 날짜` → 오른쪽 정렬 span
├── components/           # UI 컴포넌트
│   ├── Nav.astro / NavTree.astro     # 상단 네비 + 카테고리 드롭다운(재귀)
│   ├── LangToggle.astro              # 한/영 토글 버튼
│   ├── Bilingual.astro               # 한/영 본문 동시 렌더
│   ├── DocList.astro / BiText.astro  # 목록 카드 / 한영 텍스트
│   ├── PostToc.astro                 # 글 제목 아래 인라인 목차(모바일의 유일한 길잡이)
│   ├── DocToc.astro / TocList.astro  # 우측 sticky 목차 / 목차 재귀 렌더(양쪽 공용)
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
    ├── fonts-a2z.css     # A2Z 웹폰트 @font-face(자체 호스팅)
    └── global.css        # 전역 스타일 + 언어 표시/숨김 + `.doc-layout` 2단 레이아웃

scripts/                  # dev.sh(개발 서버) · check-bilingual.mjs · check-post-images.mjs
.githooks/pre-commit      # 커밋 전 ko/en 짝 + 이미지 규칙 검사(위 두 스크립트 실행)
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
  · PROD 빌드에서만 draft 문서 제외(dev에서는 초안도 보인다)
  · date 내림차순 정렬 — 글·프로젝트·경험 목록이 모두 이 단일 정렬을 따른다
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
- **커스텀 이미지 이모지**: 본문의 `:이름:`을 `remark-image-emoji`가 `assets/emoji/`의 이미지로 바꾼다. **remark 단계여야** Astro의 이미지 최적화(리사이즈·webp·해시 URL)를 그대로 얻는다. 제목·목차처럼 마크다운 파이프라인을 타지 않는 문자열은 `lib/emoji.ts`가 따로 처리하며, 토큰 규칙 자체는 `lib/emoji-syntax.mjs` 한 곳에서만 정의해 둘이 갈라지지 않게 한다.
- **이미지 폭 지정**: 이미지의 제목 슬롯(`![alt](경로 "w=320")`)을 `remark-image-size`가 폭 지정으로 소비한다. 이모지 플러그인과 같은 이유로 remark 단계다 — 심은 `width`가 `rehypeImages` → `getImage`까지 전달되어 **px 지정은 실제 리사이즈(원본 2MB → 320px webp)까지 일으킨다**. 퍼센트는 최종 픽셀을 빌드 시점에 알 수 없어 인라인 `style`로만 처리한다. 인라인 `<img width>`가 대안이 못 되는 이유는 본문에 직접 쓴 HTML이 이미지 파이프라인을 타지 않아 상대경로가 깨지기 때문이다.
- **날짜 오른쪽 정렬**: 줄 끝 ` %% 날짜`를 `rehype-doc-date`가 `<span class="doc-date">`로 바꾼다(rehype 단계).
- **목차**: `render()`가 준 헤딩 목록을 `lib/toc.ts`가 계층 트리로 만들고, `PostToc`(본문 위 인라인)과 `DocToc`(우측 sticky)이 `TocList`로 렌더한다. 언어별로 각각 만들어 `data-lang-block`에 담는다.
- **폰트**: **A2Z**(에이투지체)를 자체 호스팅해 한글·라틴을 모두 커버하고, 코드블록만 JetBrains Mono를 쓴다(A2Z는 고정폭이 아니라 코드 정렬이 깨진다). `@font-face`는 `styles/fonts-a2z.css`, 패밀리 지정은 `tokens.css`. 외부 CDN은 쓰지 않는다.

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

`tokens.css`가 폰트·글자 크기·색상·레이아웃 폭을 CSS 변수로 정의하는 **단일 소스**다. `--font-size-base`, `--scale-ratio` 하나만 바꿔도 본문·제목이 배율에 맞춰 함께 조정된다. 웹폰트 파일 자체(`@font-face`)만 `fonts-a2z.css`에 따로 있어서, 폰트를 **교체**할 때는 두 파일을 함께 본다(크기·색만 바꿀 때는 `tokens.css` 하나면 된다).

본문 + 우측 목차 2단 구성은 `global.css`의 `.doc-layout`이 담당하고 `--doc-layout-width`로 페이지별 폭을 조절한다(글 상세·CV 공용). 좁은 화면에서는 우측 목차가 숨고 `PostToc`만 남는다.

## 빌드 · 배포

- `output: static` — 서버 없이 완전 정적. `site: https://raewoo0908.github.io`, `base: /`.
- `main` push → GitHub Actions(`withastro/action`)가 빌드 → `actions/deploy-pages`로 게시.
