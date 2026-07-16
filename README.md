# raewoo0908 블로그

공부 기록 + 포트폴리오용 한/영 이중언어 블로그. [Astro](https://astro.build)로 만들고 GitHub Pages로 배포합니다.

- 🌐 **한/영 토글** — 버튼 하나로 언어 전환(URL은 그대로, 선택 언어 기억)
- 📁 **폴더 기반 카테고리** — 폴더만 추가하면 상단 메뉴에 자동 노출
- ✍️ **자유로운 마크다운** — 이미지·이모지·인라인/블록 코드(문법 하이라이팅 + 복사 버튼)
- 🎨 **작성자 폰트/크기 설정** — `src/styles/tokens.css` 한 곳에서 전역 제어

## 개발

```bash
npm install      # 최초 1회
npm run dev      # 로컬 미리보기 (http://localhost:4321)
npm run build    # 정적 빌드 → dist/
npm run preview  # 빌드 결과 미리보기
```

## 글 쓰는 법

새 글은 **폴더 + `ko.md`/`en.md` 짝**으로 만듭니다. 폴더 경로가 곧 카테고리와 URL이 됩니다.

```
src/content/posts/<카테고리>[/<하위카테고리>]/<글이름>/
├─ ko.md   # 한국어
└─ en.md   # 영어
```

예) `src/content/posts/algorithms/hello/ko.md` → URL `/posts/algorithms/hello`
(URL에는 `ko`/`en`이 들어가지 않습니다. 언어는 오직 🌐 토글로 전환.)

frontmatter 예시:

```yaml
---
title: 글 제목
date: 2026-07-16
description: 한 줄 요약(선택)
tags: [태그1, 태그2]
draft: false        # true면 배포 빌드에서 제외
---
```

- **Projects / Experiences**도 같은 방식(`src/content/projects/...`, `src/content/experiences/...`).
- **Home / CV**는 `src/content/pages/home/`, `src/content/pages/cv/`의 `ko.md`/`en.md`를 수정.
- 이미지는 `public/images/`에 넣고 `/images/파일명`으로 참조하거나, 글 폴더에 함께 두고 상대 경로로 참조.

### 한국어만 쓰고 영문판은 자동 생성

한국어 `ko.md`만 작성하면, 영문 `en.md`는 Claude가 번역해 함께 만들어 커밋하는 워크플로를 사용합니다.
`en.md`가 아직 없으면 그 언어로 전환했을 때 "번역 준비 중" 안내가 표시됩니다.

## 폰트·글자 크기 바꾸기

`src/styles/tokens.css` 상단의 CSS 변수만 수정하면 사이트 전체에 반영됩니다.

```css
--font-body: 'Pretendard Variable', ...;  /* 본문 폰트 */
--font-size-base: 18px;                    /* 기준 글자 크기 */
--scale-ratio: 1.2;                        /* 제목 크기 배율 */
```

## 배포 (GitHub Pages)

1. GitHub에 **`raewoo0908.github.io`** 이름으로 저장소를 만든다(유저 사이트).
2. 이 디렉토리를 해당 저장소로 push.
3. 저장소 **Settings → Pages → Build and deployment → Source** 를 **GitHub Actions**로 설정.
4. `main` 브랜치에 push하면 `.github/workflows/deploy.yml`이 자동 빌드·배포 → `https://raewoo0908.github.io`.

## 구조

| 경로 | 역할 |
| --- | --- |
| `astro.config.mjs` | 사이트/base/마크다운(Shiki) 설정 |
| `src/content.config.ts` | 콘텐츠 컬렉션 스키마 |
| `src/lib/content.ts` | ko/en 폴더 그룹핑 → 언어중립 문서 |
| `src/lib/categories.ts` | 폴더 → 카테고리 트리 |
| `src/styles/tokens.css` | 폰트·크기·색상 단일 소스 |
| `src/components/LangToggle.astro` | 한/영 토글 |
