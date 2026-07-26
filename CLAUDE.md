# CLAUDE.md

raewoo0908의 공부기록 + 포트폴리오 블로그. **Astro 7** 정적 사이트, GitHub Pages 배포(유저 사이트 `raewoo0908.github.io`).

## 절대 규칙 (반드시 지킬 것)

- **언어 전환은 오직 토글로만.** URL/경로에 `ko`·`en`이 **절대** 노출되면 안 된다. 한 글 = 언어중립 URL 1개(예: `/posts/algorithms/hello`)에 한국어·영어 본문을 **둘 다 정적 렌더**하고, `<html data-lang>` + CSS로 활성 언어만 표시한다. **로케일별 URL 트리(`/en/…`)를 절대 도입하지 말 것.**
- **번역 워크플로**: 사용자는 한국어 `ko.md`만 작성한다. Claude가 같은 폴더에 `en.md`(영문 번역)를 생성해 함께 커밋한다.
- **폰트·글자 크기**는 `src/styles/tokens.css`의 CSS 변수 한 곳에서만 바꾼다. 방문자용 조절 UI는 만들지 않는다(작성자 설정 전용).

## 콘텐츠 작성 규칙

- **글 스타일은 [`docs/blog-style-guide.md`](docs/blog-style-guide.md) 를 따른다** — inpa dev 벤치마크(개념마다 그림 · 이모지 헤딩 · `> 💡` 콜아웃 · 말미 📚 참고자료 · 글 유형별 템플릿). 새 글을 쓰거나 고칠 때 별도 지시 없이 참고할 것.
- 글 = **폴더 + `ko.md`/`en.md` 짝**. 폴더 경로가 곧 카테고리이자 URL이 된다.
  ```
  src/content/posts/<카테고리>[/<하위카테고리>...]/<글이름>/{ko.md, en.md}
  ```
- **폴더 = 카테고리**(중첩 가능). 폴더만 추가하면 상단 네비 드롭다운에 자동 노출된다. 별도 설정 파일 수정 불필요.
- 폴더명은 **소문자·하이픈**(kebab-case) 권장. 폴더명이 언어중립 slug가 된다.
- 컬렉션: `posts`, `projects`, `experiences`. 단일 페이지는 `src/content/pages/{home,cv}/`.
- frontmatter: `title`(필수, 각 언어값), `date`, `description`, `tags`, `draft`(true면 배포 빌드 제외).
- **이미지는 글 폴더의 `image/` 하위에 co-locate**(어떤 글이 어떤 이미지를 쓰는지 명확하게). 파일에 **글자가 들어가는 이미지(다이어그램 등)는 언어별로 두 장**을 만든다: `image/<이름>.ko.<ext>` / `image/<이름>.en.<ext>` **짝**. `ko.md`는 `.ko.`를, `en.md`는 `.en.`를 **상대경로**(`./image/…`)로 참조한다. → *en 문서에서 한국어 이미지가 렌더되는 사고를 훅이 막는다.*
  ```
  src/content/posts/<...>/<글이름>/{ko.md, en.md, image/<이름>.ko.svg, image/<이름>.en.svg}
  ```
  - 글자가 없는 **언어중립 이미지**(사진 등)는 접미사 없이 한 장만 두고 양쪽 문서가 같이 참조해도 된다.
  - 여러 글이 공유하는 **전역 이미지**만 예외적으로 `public/images/`에 두고 `/images/파일명` 절대경로로 참조.
- **날짜 오른쪽 정렬**: 리스트/제목 줄 끝에 ` %% <날짜>`를 쓰면 `rehype-doc-date` 플러그인이 날짜를 오른쪽 정렬 `<span class="doc-date">`로 변환한다. 예: `- **백엔드 팀장** — 블록체인 피트니스 플랫폼 %% 2025.07 ~ 2026.06`. 날짜는 굵게/링크 없이 줄 맨 끝 순수 텍스트로 둔다.

## ko/en 짝 · 이미지 규칙 강제 (훅)

`ko.md`/`en.md`는 **항상 함께** 수정하고, 언어별 이미지도 **항상 짝으로** 둔다. 어기면 훅이 막는다.

- **git pre-commit**(`.githooks/pre-commit`): 커밋 전 두 검사를 돌려 위반 시 커밋 거부. **1회 설치 필요**: `git config core.hooksPath .githooks`
- **Claude 세션 훅**(`.claude/settings.json`): 편집 직후 짝 갱신 알림(PostToolUse) + 규칙이 어긋난 채 턴을 끝내려 하면 차단(Stop). *설정 파일 신규 생성 시엔 `/hooks`를 한 번 열거나 재시작해야 활성화된다.*
- **판정 로직**:
  - `scripts/check-bilingual.mjs` — ko/en 짝 동기화(같은 폴더 짝만, 변경된 파일만 검사 → 오탐 없음).
  - `scripts/check-post-images.mjs` — 이미지 규칙 3종: ① `image/` 하위 `.ko.`/`.en.` 언어쌍 존재, ② `ko.md`↔`.ko.` / `en.md`↔`.en.` 올바른 언어 참조, ③ 상대경로 이미지 실존. (`.ko.`/`.en.` 접미사가 없는 언어중립 이미지는 검사 제외.)

## 명령어

```bash
git config core.hooksPath .githooks  # 1회: ko/en 동기화 pre-commit 훅 활성화
npm run dev      # 로컬 미리보기 http://localhost:4321
npm run build    # 정적 빌드 → dist/
npm run preview  # 빌드 결과 미리보기
npx astro check  # 타입 체크 (커밋 전 권장)
```

## 배포

`main` 브랜치에 push → `.github/workflows/deploy.yml`(GitHub Actions)가 자동 빌드·배포 → `https://raewoo0908.github.io`.

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
| `src/components/DocToc.astro` + `src/pages/cv.astro` | CV 우측 목차(언어별 렌더 + 스크롤 하이라이트) |
| `scripts/check-bilingual.mjs` + `scripts/check-post-images.mjs` + `.githooks/pre-commit` + `.claude/settings.json` | ko/en 짝 동기화 + 이미지 규칙 강제 훅 |

자세한 구조·결정은 `docs/ARCHITECTURE.md`, `docs/ADR.md` 참고. **글 스타일**은 `docs/blog-style-guide.md` 참고.
