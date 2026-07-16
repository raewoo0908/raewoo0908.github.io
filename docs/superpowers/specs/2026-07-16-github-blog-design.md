# GitHub Pages 블로그 설계 (Astro)

작성일: 2026-07-16
대상 사이트: `https://raewoo0908.github.io` (GitHub 유저 사이트, base `/`)

## 목적

`raewoo0908`의 **공부 기록 + 포트폴리오** 블로그. academicpages 같은 깔끔한 흰 바탕·고가독성 디자인에, 자유로운 마크다운(이미지·이모지·인라인/블록 코드), 한국어 작성 시 영문판을 함께 제공, 버튼 하나로 한/영 전환, 원할 때 폴더만 추가하면 늘어나는 중첩 카테고리를 제공한다.

## 확정 결정

| 항목 | 결정 |
| --- | --- |
| 프레임워크 | **Astro** (Node 22, 확장성·i18n 우수, GitHub Actions 배포) |
| 번역 | 한국어 작성 → Claude가 짝 영문판 소스 파일 생성, 함께 커밋 (정적, 런타임 API 없음) |
| 한/영 전환 | **오직 토글**. URL에 `ko`/`en` 미노출. 한 글=언어중립 URL 1개에 한/영 본문 동시 렌더, 토글이 보이는 언어만 전환 |
| 폰트·글자크기 | 작성자 설정 전용. `src/styles/tokens.css` CSS 변수 한 곳에서 전역 제어 (방문자 조절 UI 없음) |
| 배포 | 유저 사이트 `raewoo0908.github.io`, GitHub Actions |

## 언어 전환 모델 (핵심)

- 소스는 한/영 두 파일로 분리(정적) 작성하되, 빌드 결과는 **언어중립 URL 한 개**의 페이지.
- 페이지 HTML에 한국어 블록(`[data-lang="ko"]`)과 영어 블록(`[data-lang="en"]`)이 모두 포함됨.
- `<head>` 인라인 스크립트가 렌더 전에 localStorage 언어값을 읽어 `<html data-lang="…">` 설정 → CSS로 비활성 언어 숨김 → 깜빡임(FOUC) 없음. JS 없으면 기본 한국어.
- 헤더 KO/EN 토글이 `<html data-lang>`을 뒤집고 localStorage에 저장. 페이지 이동 후에도 언어 유지.
- 본문뿐 아니라 네비 라벨·제목 등 사이트 크롬도 동일 방식으로 한/영 동시 포함 후 토글로 전환.

## 콘텐츠 · 카테고리 모델

- 컬렉션: `posts`, `projects`, `experiences` (+ 단일 페이지 `home`, `cv`).
- 카테고리 = 폴더. 하위/하위-하위 카테고리 = 중첩 폴더. 폴더만 추가하면 네비에 자동 노출.
- 한 글 = 폴더 + `ko.md`/`en.md` 짝. 폴더명이 언어중립 slug. 이미지도 글 폴더에 함께 보관.
- `src/content/config.ts`의 zod 스키마로 frontmatter(title, date, category, draft, cover 등) 검증.
- `src/lib/content.ts`가 폴더 단위로 ko/en을 한 글로 그룹핑하고 언어중립 slug 산출.
- `src/lib/categories.ts`가 컬렉션 폴더 구조에서 카테고리 목록을 추출해 네비 구성.

## 네비게이션

- 상단 고정: Home / CV / Projects / Experiences / Posts.
- Posts/Projects/Experiences는 폴더 기반 하위 카테고리 드롭다운 자동 노출.

## 디자인 · 스타일

- 깔끔한 흰 바탕, 높은 대비, 넉넉한 여백, 본문 폭 65–75자, 명확한 타이포 위계.
- `src/styles/tokens.css`: `--font-body/-heading/-mono`, `--font-size-base`, 타입 스케일, 색상 변수 단일 소스.
- 기본 폰트: Pretendard(한글) + Inter(라틴) + mono. `tokens.css` 한 곳에서 교체 가능.

## 마크다운 · 코드 · 이미지 · 이모지

- MDX: 이미지 자유 첨부(글 폴더/`public`), 네이티브 이모지, 표·콜아웃.
- 코드: 인라인 코드 + 펜스 코드블록 Shiki 하이라이팅 + 언어 라벨 + 복사 버튼.

## 배포

- `/Users/raewookang/GithubBlog`에서 git 관리 → 저장소 `raewoo0908.github.io` → `.github/workflows/deploy.yml`(withastro/action + actions/deploy-pages)로 GitHub Pages 자동 배포. Pages 소스 = GitHub Actions.

## 검증 (end-to-end)

1. `npm run dev` → 홈·글 렌더링, 주소창에 `ko`/`en` 없음.
2. 샘플 글이 네비 카테고리에 자동 노출, 이미지·이모지·코드(하이라이팅·복사) 정상.
3. KO/EN 토글 → URL 변화 없이 언어만 전환, 이동 후에도 유지, 첫 진입 깜빡임 없음.
4. 새 폴더+글 추가 → 네비에 하위 카테고리 자동 등장.
5. `npm run build` 성공, 각 글이 언어중립 경로 1개로 생성되고 내부에 한/영 블록 모두 존재.
6. push 후 GitHub Actions 빌드 성공 → 사이트 게시.
