# CLAUDE.md

raewoo0908의 공부기록 + 포트폴리오 블로그. **Astro 7** 정적 사이트, GitHub Pages 배포(유저 사이트 `raewoo0908.github.io`).

## 절대 규칙 (반드시 지킬 것)

- **언어 전환은 오직 토글로만.** URL/경로에 `ko`·`en`이 **절대** 노출되면 안 된다. 한 글 = 언어중립 URL 1개(예: `/posts/algorithms/hello`)에 한국어·영어 본문을 **둘 다 정적 렌더**하고, `<html data-lang>` + CSS로 활성 언어만 표시한다. **로케일별 URL 트리(`/en/…`)를 절대 도입하지 말 것.**
- **번역 워크플로**: 사용자는 한국어 `ko.md`만 작성한다. Claude가 같은 폴더에 `en.md`(영문 번역)를 생성해 함께 커밋한다.
- **폰트·글자 크기**는 `src/styles/tokens.css`의 CSS 변수 한 곳에서만 바꾼다. 방문자용 조절 UI는 만들지 않는다(작성자 설정 전용). *본문 폰트는 **A2Z 자체 호스팅** — 웹폰트 파일(`@font-face`)만 `src/styles/fonts-a2z.css`에 있어서, 폰트를 **교체**할 때만 두 파일을 함께 본다.*

## 콘텐츠 작성 규칙

- **글 스타일은 [`docs/blog-style-guide.md`](docs/blog-style-guide.md) 를 따른다** — inpa dev 벤치마크(개념마다 그림 · 이모지 헤딩 · `> 💡` 콜아웃 · 말미 📚 참고자료 · 글 유형별 템플릿). 새 글을 쓰거나 고칠 때 별도 지시 없이 참고할 것.
- 글 = **폴더 + `ko.md`/`en.md` 짝**(컴포넌트를 쓰는 허브 문서만 `ko.mdx`/`en.mdx`). 폴더 경로가 곧 카테고리이자 URL이 된다.
  ```
  src/content/posts/<카테고리>[/<하위카테고리>...]/<글이름>/{ko.md, en.md}
  ```
- **폴더 = 카테고리**(중첩 가능). 폴더만 추가하면 상단 네비 드롭다운에 자동 노출된다. 별도 설정 파일 수정 불필요.
- 폴더명은 **소문자·하이픈**(kebab-case) 권장. 폴더명이 언어중립 slug가 된다.
- 컬렉션: `posts`, `projects`, `experiences`. 단일 페이지는 `src/content/pages/{home,cv}/`.
- frontmatter: `title`(필수, 각 언어값), `date`, `description`, `tags`, `draft`(true면 배포 빌드 제외).
  - **목록은 `date` 내림차순(최신이 위)** — 글·프로젝트·경험 모두 `getBilingualDocs`의 단일 정렬을 따른다. **같은 날 여러 글**을 쓰면 날짜만으로는 순서가 갈리지 않으니 `date`에 **시각까지** 넣어 순서를 정한다(예: `date: 2026-07-26T19:03:00+09:00`). ko/en 짝의 `date`는 동일하게 유지한다.
- **이미지는 글 폴더의 `image/` 하위에 co-locate**(어떤 글이 어떤 이미지를 쓰는지 명확하게). 파일에 **글자가 들어가는 이미지(다이어그램 등)는 언어별로 두 장**을 만든다: `image/<이름>.ko.<ext>` / `image/<이름>.en.<ext>` **짝**. `ko.md`는 `.ko.`를, `en.md`는 `.en.`를 **상대경로**(`./image/…`)로 참조한다. → *en 문서에서 한국어 이미지가 렌더되는 사고를 훅이 막는다.*
  ```
  src/content/posts/<...>/<글이름>/{ko.md, en.md, image/<이름>.ko.svg, image/<이름>.en.svg}
  ```
  - 글자가 없는 **언어중립 이미지**(사진 등)는 접미사 없이 한 장만 두고 양쪽 문서가 같이 참조해도 된다.
- **이미지 폭은 제목 슬롯으로 지정한다** — 기본은 원본 픽셀 크기(본문 폭이 상한)이고, 좁히려면 경로 뒤에 `"w=320"`(px) 또는 `"w=60%"`를 붙인다. `![책 커버](./image/book-cover.png "w=320")`. 폭을 지정한 이미지는 가운데 정렬되고, **px 지정은 그 폭으로 실제 리사이즈까지 된다**(큰 사진은 파일을 미리 줄이지 말고 원본을 넣을 것). 값 형식이 틀리면 빌드가 실패한다. *본문에 `<img width>` 를 직접 쓰면 안 된다 — HTML은 이미지 파이프라인을 타지 않아 상대경로가 깨진다.*
- **커스텀 이미지 이모지**: 유니코드 이모지 대신 이미지를 이모지처럼 쓰려면 `src/assets/emoji/<이름>.{png,jpg,jpeg,webp,svg}` 에 **원본 그대로** 두고 본문·헤딩·`title`·`description` 어디서든 `:이름:` 으로 부른다. 크기 최적화는 빌드가 한다(리사이즈+webp+해시 URL). 크기는 항상 그 자리 글자 높이(1em)를 따라가고, 목차·글 목록에도 나온다. 오타는 빌드 실패로 막힌다. **frontmatter(`title`·`description`)에 쓸 때는 값 전체를 따옴표로 감쌀 것** — YAML이 선행 `:` 를 매핑으로 오해해 파싱 에러가 난다. 상세는 [`docs/blog-style-guide.md`](docs/blog-style-guide.md). *`.gif`는 애니메이션이 깨져 금지.*
  - 여러 글이 공유하는 **전역 이미지**만 예외적으로 `public/images/`에 두고 `/images/파일명` 절대경로로 참조.
- **날짜 오른쪽 정렬**: 리스트/제목 줄 끝에 ` %% <날짜>`를 쓰면 `rehype-doc-date` 플러그인이 날짜를 오른쪽 정렬 `<span class="doc-date">`로 변환한다. 예: `- **백엔드 팀장** — 블록체인 피트니스 플랫폼 %% 2025.07 ~ 2026.06`. 날짜는 굵게/링크 없이 줄 맨 끝 순수 텍스트로 둔다.
- **본문 링크는 새 탭에서 열린다** — 외부 사이트(`https://…`)든 다른 글(`/posts/…`)이든 `rehype-link-target`이 `target="_blank"`를 붙이고 ↗ 표시를 단다. 읽던 글을 잃지 않게 하려는 것. **마크다운으로 쓴 링크는 형태를 가리지 않고 다 걸린다** — `[텍스트](주소)`·참조식 `[텍스트][ref]`·꺾쇠 `<https://…>`·본문에 그냥 적은 맨 URL 모두. 상대경로(`./`·`../`)도 포함이다. 글에서 따로 할 일은 없다.
  - 현재 탭으로 남는 것: 같은 페이지 안 이동(`#앵커`)과 `mailto:`·`tel:`.
  - **특정 링크만 현재 탭으로 열고 싶으면 마크다운 대신 HTML로 `<a href="…">`라 쓴다.** 본문에 직접 쓴 HTML은 플러그인이 지나가지 않아 손대지 않는다.
- **다른 글 목록을 자동으로 끌어오는 허브 문서**는 짝을 `ko.mdx`/`en.mdx`로 두고 [`DocLinks`](src/components/DocLinks.astro)를 쓴다. 링크를 손으로 관리하지 않는다 — 빌드할 때 컬렉션을 읽어 목록을 만들므로, 글 폴더를 추가하면 알아서 붙는다(dev에서는 draft도 보이고, 배포 빌드에서는 draft가 빠진다).
  ```mdx
  {/* 아래 경로는 글 폴더 → src/components 상대경로. 카테고리 깊이가 다르면 `../` 개수를 맞춘다. */}
  import DocLinks from '../../../../components/DocLinks.astro';

  <DocLinks collection="posts" under="ai" order="asc" />                                  {/* posts/ai/** 를 날짜 오름차순 목록으로 */}
  <DocLinks collection="projects" under="ai" tag="codeit-step1" variant="inline" />        {/* 태그로 고른 문서를 한 줄에 */}
  ```
  - `variant="list"`(기본)는 `%% 날짜` 줄과 **똑같은 오른쪽 정렬 목록**을 만들어, 손으로 쓴 목록 바로 뒤에 붙이면 한 목록처럼 이어진다. `variant="inline"`은 문장 안에 링크를 나열한다.
  - ko/en 어느 파일에서 써도 한/영 제목이 함께 심기므로 로케일을 넘길 필요가 없다. 결과가 없을 때 문구는 `emptyKo`/`emptyEn`으로 준다.
  - **MDX에서는 `<!-- -->` 주석이 파싱 에러다.** `{/* ... */}`를 쓴다.

## ko/en 짝 · 이미지 규칙 강제 (훅)

`ko.md`/`en.md`는 **항상 함께** 수정하고, 언어별 이미지도 **항상 짝으로** 둔다. 어기면 훅이 막는다.

- **git pre-commit**(`.githooks/pre-commit`): 커밋 전 세 검사를 돌려 위반 시 커밋 거부. **1회 설치 필요**: `git config core.hooksPath .githooks`
- **Claude 세션 훅**(`.claude/settings.json`): 편집 직후 짝 갱신 알림(PostToolUse) + 규칙이 어긋난 채 턴을 끝내려 하면 차단(Stop). *설정 파일 신규 생성 시엔 `/hooks`를 한 번 열거나 재시작해야 활성화된다.*
- **판정 로직**:
  - `scripts/check-bilingual.mjs` — ko/en 짝 동기화(같은 폴더 짝만, 변경된 파일만 검사 → 오탐 없음).
  - `scripts/check-post-images.mjs` — 이미지 규칙 3종: ① `image/` 하위 `.ko.`/`.en.` 언어쌍 존재, ② `ko.md`↔`.ko.` / `en.md`↔`.en.` 올바른 언어 참조, ③ 상대경로 이미지 실존. (`.ko.`/`.en.` 접미사가 없는 언어중립 이미지는 검사 제외.)
  - `scripts/check-drift.mjs` — **내용이 실제로 맞는지** 검사(아래).

### ko/en drift 검사 — `ko.md`가 SSOT

위 두 검사는 "둘 다 손댔느냐"만 본다. 짝을 같이 커밋해도 **en이 ko를 따라가지 못하는 drift**는 남는다(문장이 통째로 빠지거나, en에만 문장이 붙거나, 강도·범위가 달라지거나). `check-drift.mjs`가 그걸 잡는다. **`ko.md`가 유일한 진실 공급원이고 고치는 쪽은 언제나 `en.md`다.**

2단계 게이트로 돈과 시간을 아낀다.

1. **게이트** — 스테이징에 ko/en 짝이 없으면 즉시 통과(글 아닌 커밋은 영향 0). 통과 이력이 있는 `(ko,en)` 해시 쌍도 건너뛴다.
2. **구조 검사**(결정적·0.05초·무료) — frontmatter `date`·`tags`·`draft`, 블록 종류 시퀀스, 코드블록 줄 수, 표 크기, **링크 주소 집합**, 이미지(언어 접미사 제외). 여기서 걸리면 LLM을 아예 안 부른다.
3. **의미 검사**(`claude -p`, Opus 5, **호출당 약 $0.6**) — 본문 전체를 대조해 `missing`(ko에만) · `extra`(en에만) · `diverged`(의미·강도 차이)를 찾는다. 구조 검사가 남긴 길이비 이상치를 힌트로 넘긴다.

막히면 판정이 `.git/ko-en-drift.json`에 **덮어쓰기**로 저장되고(이력을 쌓지 않는다) 통과하면 지워진다 — **그 파일의 존재 자체가 "지금 막혀 있다"는 신호다.** 캐시 `.git/ko-en-drift-cache.json`은 글 폴더를 키로 누적하므로 커밋 수와 무관하게 폴더 수만큼만 커진다. 둘 다 `.git/` 아래라 커밋되지 않는다.

```bash
/fix-drift                          # (Claude) 리포트를 읽어 en 을 고친다. 재판정하지 않는다
npm run drift                       # 작업 트리의 짝을 직접 검사
node scripts/check-drift.mjs --dir <글폴더>   # 한 폴더만
npm test                            # 구조 검사 회귀 테스트(LLM 안 부름)
```

- **`/fix-drift`로 통과시키면 이어지는 커밋은 캐시에 걸려 공짜다** — 같은 바이트를 다시 판정하지 않는다.
- 막혔을 때 넘기려면 `SKIP_DRIFT=1 git commit …`(의미 검사만 건너뛰고 구조 검사는 유지) 또는 `git commit --no-verify`(전부 건너뜀).
- `claude` CLI가 없거나 네트워크가 끊기면 **경고만 하고 통과**한다(fail-open). 오프라인에서 커밋을 못 하게 만들지 않는다. 구조 검사는 반대로 fail-closed.
- 차단 기준은 `check-drift.mjs`의 `BLOCK_KINDS` 한 줄이다. 현재는 `missing`·`extra`·`diverged` **전부 차단**이라 사소한 뉘앙스 차이로도 막힌다. 느슨하게 하려면 `diverged`를 빼면 된다.

## 명령어

```bash
git config core.hooksPath .githooks  # 1회: ko/en 동기화 pre-commit 훅 활성화
npm run dev         # 개발 서버 → 항상 http://localhost:4321 (scripts/dev.sh)
npm run dev:stop    # 개발 서버 내리기
npm run dev:status  # 떠 있는지 확인
npm run dev:logs    # 데몬 로그 보기(에러가 안 보일 때)
npm run build       # 정적 빌드 → dist/
npx astro check     # 타입 체크 (커밋 전 권장)
npm test            # scripts/ 검사 로직 회귀 테스트 (LLM 호출 없음)
npm run drift       # 작업 트리의 ko/en drift 검사 (LLM 호출 · 유료)
```

**개발 서버는 반드시 `npm run dev`(= `scripts/dev.sh`)로 띄운다.** 그냥 `astro dev`를 쓰면 안 되는 이유가 셋 있다.

- Astro 7의 dev 서버는 터미널이 아닌 곳에서 실행되면 **백그라운드 데몬으로 남는다.** 껐다고 생각한 서버가 계속 살아 있다가 다음 실행 때 포트를 뺏는다.
- 포트가 막혀 있으면 astro는 **조용히 4322, 4323…으로 옮겨간다.** 그러면 사람과 Claude가 서로 다른 주소를 보며 "화면이 안 바뀐다"고 헤맨다.
- dev 서버가 떠 있는 채로 `npm run build`를 돌리면 두 프로세스가 콘텐츠 스토어를 동시에 다시 써서, **본문이 통째로 빈 페이지가 조용히 만들어질 수 있다**(에러도 안 난다).

`scripts/dev.sh`는 실행할 때마다 ① 데몬을 정식으로 내리고 ② 남은 이 프로젝트의 astro 프로세스를 정리한 뒤(다른 프로젝트는 안 건드린다) ③ 포트가 비었는지 확인하고(남의 프로그램이 잡고 있으면 조용히 옮기지 않고 누가 잡고 있는지 알려주며 멈춘다) ④ `--force`로 콘텐츠 캐시를 비우고 띄운다. **언제 몇 번을 실행해도 `localhost:4321`에 서버 하나만 남는다.**

> **렌더링 확인(Claude in Chrome 포함)은 `npm run dev` 로 띄운 `localhost:4321`에서 한다.** `npm run build` + `npm run preview` 조합은 dev 서버와 충돌하고 포트도 옮겨다니니 쓰지 않는다. 빌드 검증이 꼭 필요하면 `npm run dev:stop` 으로 내린 뒤에 돌리고, 끝나면 `npm run dev` 로 다시 띄운다.

## 배포

`main` 브랜치에 push → `.github/workflows/deploy.yml`(GitHub Actions)가 자동 빌드·배포 → `https://raewoo0908.github.io`.

## 댓글 · 리액션

글 상세(`posts`·`projects`·`experiences`)에 **giscus** 위젯이 붙는다. 저장소는 별도 레포 `raewoo0908/blog-comments`의 GitHub Discussions이고 **자체 서버·DB·시크릿은 없다.** 설정은 `src/components/Comments.astro` 한 곳에 모여 있다.

> ⚠️ `mapping=pathname`이라 **dev 서버(`localhost:4321`)와 프로덕션이 같은 댓글 스레드를 쓴다.** 개발 중 남긴 댓글·리액션은 실제로 공개되니, 테스트했으면 `blog-comments` 레포 Discussions에서 스레드를 지운다.

선택 근거는 `docs/ADR.md`(ADR-007), 언어 연동 구조는 `docs/ARCHITECTURE.md`의 '댓글 · 리액션' 절 참고.

## 핵심 파일

| 경로 | 역할 |
| --- | --- |
| `src/lib/content.ts` | ko/en 폴더를 언어중립 문서로 그룹핑(핵심 로직) |
| `src/lib/categories.ts` | 폴더 → 카테고리 트리(네비 자동 구성) |
| `src/components/LangToggle.astro` + `Bilingual.astro` + `BaseLayout.astro`(FOUC 인라인 스크립트) | 한/영 전환의 핵심 |
| `src/styles/tokens.css` | 폰트·크기·색상 단일 소스 |
| `src/pages/[collection]/[...path].astro` | 글 상세 + 카테고리 리스팅(언어중립 URL) |
| `src/content.config.ts` | 콘텐츠 컬렉션 스키마 |
| `src/lib/rehype-doc-date.mjs` | ` %% 날짜` → 오른쪽 정렬 span 변환(rehype) |
| `src/lib/rehype-link-target.mjs` | 본문 링크(외부·다른 글)를 새 탭으로. 목차 앵커·`mailto:`는 제외 |
| `src/components/DocLinks.astro` | 컬렉션에서 조건에 맞는 글 링크를 빌드 시점에 자동 생성(허브 문서용, `.mdx`에서 사용) |
| `src/lib/emoji-syntax.mjs` | `:이름:` 토큰 규칙 단일 소스(remark 플러그인·Astro 컴포넌트 공용) |
| `src/lib/remark-image-emoji.mjs` | 본문의 `:이름:` → 이미지. **remark 단계여야** Astro 이미지 최적화를 탄다 |
| `src/lib/remark-image-size.mjs` | 이미지 제목 슬롯 `"w=320"`·`"w=60%"` → 폭 지정. px는 실제 리사이즈까지 |
| `src/lib/emoji.ts` | 제목·목차처럼 파이프라인 밖 문자열용 `:이름:` → HTML |
| `src/lib/toc.ts` + `src/components/TocList.astro` | 헤딩 → 계층형 목차 트리 + 재귀 렌더(인라인·우측 공용) |
| `src/components/PostToc.astro` | 글 제목 아래 인라인 목차(번호 매김, 모바일에서 유일한 길잡이) |
| `src/components/DocToc.astro` | 우측 sticky 목차(언어별 렌더 + 스크롤 하이라이트). 글 상세·CV 공용 |
| `.doc-layout` (`src/styles/global.css`) | 본문 + 우측 목차 2단 레이아웃. `--doc-layout-width`로 페이지별 폭 조절 |
| `src/components/Comments.astro` | giscus 댓글·리액션. iframe이라 `data-lang-block`을 못 쓰는 **유일한 예외** |
| `scripts/check-bilingual.mjs` + `scripts/check-post-images.mjs` + `.githooks/pre-commit` + `.claude/settings.json` | ko/en 짝 동기화 + 이미지 규칙 강제 훅 |
| `scripts/check-drift.mjs` + `.claude/commands/fix-drift.md` | ko(SSOT) ↔ en 내용 drift 검사(구조 + LLM)와 그 수정 명령 |

자세한 구조·결정은 `docs/ARCHITECTURE.md`, `docs/ADR.md` 참고. **글 스타일**은 `docs/blog-style-guide.md` 참고.
