# CLAUDE.md

raewoo0908의 공부기록 + 포트폴리오 블로그. **Astro 7** 정적 사이트, GitHub Pages 배포(유저 사이트 `raewoo0908.github.io`).

## 절대 규칙 (반드시 지킬 것)

- **언어 전환은 오직 토글로만.** URL/경로에 `ko`·`en`이 **절대** 노출되면 안 된다. 한 글 = 언어중립 URL 1개(예: `/posts/algorithms/hello`)에 한국어·영어 본문을 **둘 다 정적 렌더**하고, `<html data-lang>` + CSS로 활성 언어만 표시한다. **로케일별 URL 트리(`/en/…`)를 절대 도입하지 말 것.**
- **번역 워크플로**: 사용자는 한국어 `ko.md`만 작성한다. Claude가 같은 폴더에 `en.md`(영문 번역)를 생성해 함께 커밋한다.
- **폰트·글자 크기**는 `src/styles/tokens.css`의 CSS 변수 한 곳에서만 바꾼다. 방문자용 조절 UI는 만들지 않는다(작성자 설정 전용).

## 콘텐츠 작성 규칙

- 글 = **폴더 + `ko.md`/`en.md` 짝**. 폴더 경로가 곧 카테고리이자 URL이 된다.
  ```
  src/content/posts/<카테고리>[/<하위카테고리>...]/<글이름>/{ko.md, en.md}
  ```
- **폴더 = 카테고리**(중첩 가능). 폴더만 추가하면 상단 네비 드롭다운에 자동 노출된다. 별도 설정 파일 수정 불필요.
- 폴더명은 **소문자·하이픈**(kebab-case) 권장. 폴더명이 언어중립 slug가 된다.
- 컬렉션: `posts`, `projects`, `experiences`. 단일 페이지는 `src/content/pages/{home,cv}/`.
- frontmatter: `title`(필수, 각 언어값), `date`, `description`, `tags`, `draft`(true면 배포 빌드 제외).
- 이미지: `public/images/`에 두고 `/images/파일명` 절대경로로 참조(권장), 또는 글 폴더에 함께 두고 상대경로.

## 명령어

```bash
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

자세한 구조·결정은 `docs/ARCHITECTURE.md`, `docs/ADR.md` 참고.
